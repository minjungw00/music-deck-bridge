'use strict';
const { rasterSize } = require('./domain/raster-artwork.cjs');

// All visible dials share the selected cover. Keep at most its two fitted
// variants, so text scrolling never reparses or retransmits the raster image.
let lastCover = '';
const fitted = new Map();
function fitDialArtwork(cover, fit) {
  if (cover !== lastCover) { lastCover = cover; fitted.clear(); }
  const mode = fit === 'width' ? 'width' : 'height';
  if (fitted.has(mode)) return fitted.get(mode);
  let result = '';
  const dimensions = rasterSize(cover);
  if (dimensions) {
    const { width, height } = dimensions;
    const scale = mode === 'width' ? 200 / width : 100 / height;
    const w = width * scale, h = height * scale;
    // Qt SVG ignores preserveAspectRatio on embedded images. Supply geometry
    // with the original aspect ratio instead; the 200×100 viewport clips it.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="100" viewBox="0 0 200 100"><image x="${(200 - w) / 2}" y="${(100 - h) / 2}" width="${w}" height="${h}" xlink:href="${cover}"/></svg>`;
    result = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
  fitted.set(mode, result);
  return result;
}
module.exports = { fitDialArtwork };
