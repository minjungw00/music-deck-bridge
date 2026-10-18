'use strict';
const fs = require('node:fs');
const path = require('node:path');
let fallback = '';
let lastImage = '';
const variants = new Map();
function keyTextBackground(image, lines) {
  if (!lines) return image || null;
  if (!image) {
    if (!fallback) {
      // The standalone bundle lives in bin/; source execution lives in src/.
      const filename = 'imgs/actions/nowplaying/key@2x.png';
      const built = path.join(__dirname, '..', filename);
      const source = path.join(__dirname, '..', 'io.github.minjungw00.musicdeckbridge.sdPlugin', filename);
      fallback = `data:image/png;base64,${fs.readFileSync(fs.existsSync(built) ? built : source).toString('base64')}`;
    }
    image = fallback;
  }
  if (!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) return null;
  if (image !== lastImage) { lastImage = image; variants.clear(); }
  if (variants.has(lines)) return variants.get(lines);
  // Native key titles use the existing bottom-aligned Stream Deck text layer.
  // Composite only its optional backdrop, so scrolling never resends the image.
  const height = lines > 1 ? 54 : 30;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="144" height="144" viewBox="0 0 144 144"><image width="144" height="144" xlink:href="${image}"/><rect x="0" y="${144 - height}" width="144" height="${height}" fill="black"/></svg>`;
  const result = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  variants.set(lines, result);
  return result;
}
module.exports = { keyTextBackground };
