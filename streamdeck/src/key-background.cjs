'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { rasterSize } = require('./domain/raster-artwork.cjs');
const KEY_SIZE = 144;
const MAX_VARIANT_LENGTH = 24 * 1024 * 1024;
const ASSET_DIR = path.join(__dirname, '..');
const SOURCE_ASSET_DIR = path.join(ASSET_DIR, 'io.github.minjungw00.musicdeckbridge.sdPlugin');
const assets = new Map();
let lastImage = '', dimensions = null, variantLength = 0;
const variants = new Map();
const svgImage = svg => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

function assetImage(filename) {
  if (!assets.has(filename)) {
    const local = path.join(ASSET_DIR, filename);
    const bytes = fs.readFileSync(fs.existsSync(local) ? local : path.join(SOURCE_ASSET_DIR, filename));
    assets.set(filename, `data:image/png;base64,${bytes.toString('base64')}`);
  }
  return assets.get(filename);
}
function keyTextBackground(image, lines, tile, badge = '', corner = 'top-left') {
  if (!image && !lines && !badge) return null;
  if (!image && lines) image = assetImage('imgs/actions/nowplaying/key@2x.png');
  if (image !== lastImage) {
    lastImage = image;
    dimensions = rasterSize(image);
    variants.clear();
    variantLength = 0;
  }
  if (image && !dimensions) return null;
  const { width, height } = dimensions || { width: 144, height: 144 };
  if (!lines && !tile && !badge && width === height) return image;
  const variant = JSON.stringify([lines, tile?.row, tile?.column, tile?.width, tile?.height, tile?.fit, badge, corner]);
  if (variants.has(variant)) return variants.get(variant);
  const canvasWidth = KEY_SIZE * (tile?.width ?? 1);
  const canvasHeight = KEY_SIZE * (tile?.height ?? 1);
  // Fit the shared image on one axis and clip any overflow on the other axis.
  const scale = tile ? (tile.fit === 'width' ? canvasWidth / width : canvasHeight / height) :
    Math.min(canvasWidth / width, canvasHeight / height);
  const w = width * scale, h = height * scale;
  const x = (canvasWidth - w) / 2 - KEY_SIZE * (tile?.column ?? 0);
  const y = (canvasHeight - h) / 2 - KEY_SIZE * (tile?.row ?? 0);
  // Native key titles use the existing bottom-aligned Stream Deck text layer.
  // Qt SVG ignores embedded-image aspect-ratio attributes. Fit the source with
  // explicit geometry, including when no optional title backdrop is requested.
  const band = lines > 1 ? 54 : 30;
  const margin = tile || width !== height || !image ? '<rect width="144" height="144" fill="black"/>' : '';
  const backdrop = lines ? `<rect x="0" y="${144 - band}" width="144" height="${band}" fill="black"/>` : '';
  const art = image ? `<image x="${x}" y="${y}" width="${w}" height="${h}" xlink:href="${image}"/>` : '';
  const badgeX = corner.endsWith('right') ? 98 : 4, badgeY = corner.startsWith('bottom') ? 98 : 4;
  const badgeImage = badge ? `<image x="${badgeX}" y="${badgeY}" width="42" height="42" xlink:href="${assetImage(badge)}"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="144" height="144" viewBox="0 0 144 144">${margin}${art}${backdrop}${badgeImage}</svg>`;
  const result = svgImage(svg);
  while (variantLength + result.length > MAX_VARIANT_LENGTH && variants.size) {
    const first = variants.keys().next().value;
    variantLength -= variants.get(first).length;
    variants.delete(first);
  }
  variants.set(variant, result);
  variantLength += result.length;
  return result;
}
module.exports = { keyTextBackground };
