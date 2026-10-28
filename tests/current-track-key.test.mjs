import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';
import { createRenderer } from '../streamdeck/src/presentation/renderer.cjs';
import { keyTextBackground } from '../streamdeck/src/key-background.cjs';

const raster = 'data:image/png;base64,' + readFileSync(new URL('../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/imgs/plugin/icon.png', import.meta.url)).toString('base64');
function harness(settings = {}, cover = raster) {
  const calls = [], item = { settings };
  const context = { Date: { now: () => 1000 } };
  const renderer = createRenderer({ displayed: new Map(), now: () => context.Date.now(),
    keyTextBackground, tr: () => 'Disconnected', covers: { image: src => src === 'cover' ? cover : '' },
    output: { setTitle: (_, title) => calls.push({ title }), setImage: (_, image) => calls.push({ image }) } });
  context.render = renderer.renderCurrentTrackKey;
  return { calls, item, context, paint: state => context.render('key', item, state) };
}
const state = { title: 'Song', artist: 'Artist', cover: 'cover' };
test('current-track key retains title and artist below by default, with independent visibility and position', () => {
  const h = harness(); h.paint(state);
  assert.equal(h.calls.find(x => 'title' in x).title, 'Song\nArtist');
  assert.equal(h.calls.at(-1).image, raster);
  h.item.settings.artistPosition = 'inline'; h.paint(state);
  assert.equal(h.calls.at(-1).title, 'Song — Arti…');
  h.item.settings.showTitle = false; h.paint(state);
  assert.equal(h.calls.at(-1).title, 'Artist');
  h.item.settings.showArtist = false; h.paint(state);
  assert.equal(h.calls.at(-1).title, '');
  h.item.settings.showTitle = true; h.paint(state);
  assert.equal(h.calls.at(-1).title, 'Song');
});

// Real generated PNGs keep this regression independent of screenshot assets.
function png(width, height) {
  const chunk = (type, bytes) => {
    const data = Buffer.concat([Buffer.from(type), bytes]);
    const size = Buffer.alloc(4), crc = Buffer.alloc(4);
    size.writeUInt32BE(bytes.length); crc.writeUInt32BE(crc32(data));
    return Buffer.concat([size, data, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const bytes = Buffer.alloc((width * 3 + 1) * height, 255);
  for (let row = 0; row < height; row++) bytes[row * (width * 3 + 1)] = 0;
  return 'data:image/png;base64,' + Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'),
    chunk('IHDR', header), chunk('IDAT', deflateSync(bytes)), chunk('IEND', Buffer.alloc(0))]).toString('base64');
}

for (const [width, height, geometry] of [[300, 150, 'x="0" y="36" width="144" height="72"'],
  [150, 300, 'x="36" y="0" width="72" height="144"']]) {
  test(`current-track key centers ${width}x${height} artwork without changing its proportions`, () => {
    const cover = png(width, height);
    for (const titleBackground of [false, true]) {
      const h = harness({ titleBackground }, cover);
      h.paint(state);
      const image = h.calls.at(-1).image;
      const svg = Buffer.from(image.split(',')[1], 'base64').toString();
      assert.ok(svg.includes(`<image ${geometry}`));
      assert.ok(svg.includes(`xlink:href="${cover}"`), 'original raster bytes are preserved');
      const writes = h.calls.length;
      h.paint(state);
      assert.equal(h.calls.length, writes, 'unchanged artwork does not resend');
    }
  });
}
test('key background follows visible line count, uses a fallback without artwork and restores raw images', () => {
  const h = harness({ titleBackground: true }); h.paint(state);
  const decode = value => Buffer.from(value.split(',')[1], 'base64').toString();
  assert.match(decode(h.calls.at(-1).image), /y="90" width="144" height="54" fill="black"/);
  h.item.settings.artistPosition = 'inline'; h.paint(state);
  assert.match(decode(h.calls.at(-1).image), /y="114" width="144" height="30" fill="black"/);
  h.item.settings.showTitle = false; h.item.settings.showArtist = false; h.paint(state);
  assert.equal(h.calls.at(-1).image, raster, 'no background remains after hiding all text');
  h.item.settings.showTitle = true; h.paint(null);
  assert.match(decode(h.calls.at(-1).image), /data:image\/png;base64/);
  h.item.settings.titleBackground = false; h.paint(state);
  assert.equal(h.calls.at(-1).image, raster);
});
test('key scrolling preserves Unicode and does not resend the cached background', () => {
  const h = harness({ titleMode: 'scroll', titleBackground: true });
  const long = { ...state, title: '가나다라마바사아자차카타파하', artist: 'Artist with a long name' };
  h.paint(long);
  const count = h.calls.filter(x => 'image' in x).length;
  h.context.Date.now = () => 1000 + 4 * 380; h.paint(long);
  assert.equal(h.calls.at(-1).title.split('\n')[0], '나다라마바사아자차카타');
  assert.equal(h.calls.filter(x => 'image' in x).length, count);
  h.paint({ ...state, title: 'New' });
  assert.equal(h.calls.at(-1).title, 'New\nArtist');
});
