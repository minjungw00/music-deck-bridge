'use strict';
const fs = require('node:fs');
const path = require('node:path');
let background;
const images = new Map();
function volumeKeyImage(volume, showPercent = false) {
  if (!Number.isInteger(volume) || volume < 0 || volume > 100) return null;
  const percent = showPercent === true;
  const label = `${volume}${percent ? '%' : ''}`;
  if (images.has(label)) return images.get(label);
  if (!background) {
    const filename = 'imgs/actions/volume/level@2x.png';
    const built = path.join(__dirname, '..', filename);
    const source = path.join(__dirname, '..', 'io.github.minjungw00.musicdeckbridge.sdPlugin', filename);
    background = `data:image/png;base64,${fs.readFileSync(fs.existsSync(built) ? built : source).toString('base64')}`;
  }
  // Keep the exact generated badge pixels; only the white foreground changes.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="144" height="144" viewBox="0 0 144 144"><image width="144" height="144" xlink:href="${background}"/><text x="72" y="${percent ? 81 : 85}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${percent ? 28 : 40}" font-weight="700" fill="white">${label}</text></svg>`;
  const image = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  images.set(label, image);
  return image;
}
module.exports = { volumeKeyImage };
