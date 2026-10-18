'use strict';
const MARQUEE_STEP_MS = 380;
const MARQUEE_WIDTH = 11;
function ellipsis(str, n = 11) {
  const chars = [...String(str || '')];
  return chars.length > n ? chars.slice(0, n - 1).join('') + '…' : chars.join('');
}
// Grapheme-aware scrolling prevents cutting Hangul combining characters and emoji.
const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });
function glyphs(value) {
  const text = String(value || '');
  return [...segmenter.segment(text)].map(s => s.segment);
}
function marquee(value, started, now = Date.now(), width = MARQUEE_WIDTH, fullLine = false) {
  const characters = glyphs(value);
  if (characters.length <= width) return characters.join('');
  const progress = Math.floor((now - started) / MARQUEE_STEP_MS);
  if (progress < 3) return fullLine ? characters.join('') : characters.slice(0, width).join('');
  const gap = [' ', ' ', ' '];
  const loop = [...characters, ...gap];
  const start = (progress - 3) % loop.length;
  // Dial fields clip to their full pixel width. Sending a fixed 14-character
  // window left half of the field empty for narrow Latin glyphs.
  return Array.from({ length: fullLine ? loop.length : width }, (_, i) => loop[(start + i) % loop.length]).join('');
}

module.exports = { ellipsis, marquee, MARQUEE_STEP_MS };
