'use strict';
function clip(value, max = 140) { return String(value ?? '').replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, max); }
function limit(x, min, max) { return Math.max(min, Math.min(max, x)); }
module.exports = { clip, limit };
