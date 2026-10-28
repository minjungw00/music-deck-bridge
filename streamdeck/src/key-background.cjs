'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { imageSize } = require('image-size');
let fallback = '';
let lastImage = '';
const variants = new Map();
function keyTextBackground(image, lines) {
  if (!image && !lines) return null;
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
  let width, height;
  try {
    const bytes = Buffer.from(image.slice(image.indexOf(',') + 1), 'base64');
    if (bytes.length > 2000000) return null;
    const size = imageSize(bytes);
    if (!['png', 'jpg', 'webp'].includes(size.type) || !Number.isFinite(size.width) || !Number.isFinite(size.height) ||
        size.width <= 0 || size.height <= 0 || size.width > 100000 || size.height > 100000) return null;
    ({ width, height } = size);
  } catch { return null; }
  if (!lines && width === height) { variants.set(lines, image); return image; }
  const scale = Math.min(144 / width, 144 / height);
  const w = width * scale, h = height * scale;
  // Native key titles use the existing bottom-aligned Stream Deck text layer.
  // Qt SVG ignores embedded-image aspect-ratio attributes. Fit the source with
  // explicit geometry, including when no optional title backdrop is requested.
  const band = lines > 1 ? 54 : 30;
  const margin = width !== height ? '<rect width="144" height="144" fill="black"/>' : '';
  const backdrop = lines ? `<rect x="0" y="${144 - band}" width="144" height="${band}" fill="black"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="144" height="144" viewBox="0 0 144 144">${margin}<image x="${(144 - w) / 2}" y="${(144 - h) / 2}" width="${w}" height="${h}" xlink:href="${image}"/>${backdrop}</svg>`;
  const result = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  variants.set(lines, result);
  return result;
}
module.exports = { keyTextBackground };
