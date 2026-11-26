'use strict';
const { imageSize } = require('image-size');
const MAX_IMAGE_BYTES = 2000000;
const MAX_IMAGE_URI_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 32;

function rasterSize(image) {
  if (typeof image !== 'string' || image.length > MAX_IMAGE_URI_LENGTH) return null;
  const mime = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.exec(image)?.[1];
  if (!mime) return null;
  try {
    const bytes = Buffer.from(image.slice(image.indexOf(',') + 1), 'base64');
    if (bytes.length > MAX_IMAGE_BYTES) return null;
    const { type, width, height } = imageSize(bytes);
    if (type !== (mime === 'jpeg' ? 'jpg' : mime) ||
        !Number.isInteger(width) || !Number.isInteger(height) ||
        width <= 0 || height <= 0 || width > 100000 || height > 100000) return null;
    return { width, height };
  } catch { return null; }
}

module.exports = { rasterSize, MAX_IMAGE_URI_LENGTH };
