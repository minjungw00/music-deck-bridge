'use strict';
const crypto = require('node:crypto');
function validOrigin(origin) { return typeof origin === 'string' && /^chrome-extension:\/\/[a-p]{32}$/.test(origin); }
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
module.exports = { validOrigin, safeEqual };
