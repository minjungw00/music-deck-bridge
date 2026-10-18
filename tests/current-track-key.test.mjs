import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRenderer } from '../streamdeck/src/presentation/renderer.cjs';
import { keyTextBackground } from '../streamdeck/src/key-background.cjs';

const raster = 'data:image/png;base64,' + readFileSync(new URL('../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/imgs/plugin/icon.png', import.meta.url)).toString('base64');
function harness(settings = {}) {
  const calls = [], item = { settings };
  const context = { Date: { now: () => 1000 } };
  const renderer = createRenderer({ displayed: new Map(), now: () => context.Date.now(),
    keyTextBackground, tr: () => 'Disconnected', covers: { image: src => src === 'cover' ? raster : '' },
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
