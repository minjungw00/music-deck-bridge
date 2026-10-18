import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fitDialArtwork } from '../streamdeck/src/dial-artwork.cjs';

const source = readFileSync(new URL('../streamdeck/src/plugin.cjs', import.meta.url), 'utf8');
const render = source.slice(source.indexOf('function renderCurrentTrackDial('), source.indexOf('function showAlert('));
const raster = 'data:image/png;base64,' + readFileSync(new URL('../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/imgs/plugin/icon.png', import.meta.url)).toString('base64');
const marqueeSource = source.slice(source.indexOf('const segmenter ='), source.indexOf('const COVERS ='));
const play = 'imgs/actions/toggle/key@2x.png';
const pause = 'imgs/actions/toggle/pause@2x.png';
function harness() {
  const calls = [], displayed = new Map();
  const context = vm.createContext({ sdOnline: true, displayed, cachedCoverUrl: '', cachedCoverData: '', Buffer, fitDialArtwork, Date: { now: () => 1000 }, MARQUEE_STEP_MS: 380, MARQUEE_WIDTH: 11, Intl,
    tr: key => key, ellipsis: text => text,
    setImage: (id, image) => calls.push({ id, event: 'image', image }),
    sendStream: async message => { calls.push({ id: message.context, event: 'layout', layout: message.payload.layout }); },
    setFeedback: async (id, feedback) => { calls.push({ id, event: 'feedback', feedback }); },
  });
  vm.runInContext(marqueeSource + render + '\nthis.render = renderCurrentTrackDial;', context);
  return { context, calls, add(id, dialDisplay) {
    const item = { settings: { dialDisplay } }; displayed.set(id, item); return item;
  }, async paint(id, item, state) { context.render(id, item, state); await item.feedbackQueue; } };
}

test('artwork mode updates cached covers, avoids duplicate transmissions and clears the old song image', async () => {
  const h = harness(), item = h.add('dial', 'artwork');
  const state = { cover: 'first-cover', playing: true };
  h.context.cachedCoverUrl = 'first-cover'; h.context.cachedCoverData = raster;
  await h.paint('dial', item, state);
  assert.equal(h.calls[1].event, 'layout');
  const fitted = h.calls[2].feedback.artwork;
  assert.equal(fitted.enabled, true);
  const svg = Buffer.from(fitted.value.split(',')[1], 'base64').toString();
  assert.ok(svg.includes(h.context.cachedCoverData));
  assert.match(svg, /x="50" y="0" width="100" height="100"/);
  const count = h.calls.length;
  await h.paint('dial', item, state);
  assert.equal(h.calls.length, count, 'unchanged artwork is not retransmitted');
  state.cover = 'second-cover';
  await h.paint('dial', item, state);
  assert.equal(h.calls.at(-1).feedback.artwork.enabled, false);
  assert.equal(h.calls.at(-1).feedback.fallback.value, pause, 'pending art never keeps the previous cover');
  h.context.cachedCoverUrl = 'second-cover'; h.context.cachedCoverData = raster;
  await h.paint('dial', item, state);
  assert.ok(Buffer.from(h.calls.at(-1).feedback.artwork.value.split(',')[1], 'base64').toString().includes(h.context.cachedCoverData));
  await h.paint('dial', item, null);
  assert.equal(h.calls.at(-1).feedback.artwork.enabled, false);
  assert.equal(h.calls.at(-1).feedback.fallback.value, play, 'offline mode clears the old artwork');
});

test('display mode is per dial, with confirmed play/pause icons in the information layout', async () => {
  const h = harness(), info = h.add('info', undefined), art = h.add('art', 'artwork');
  await h.paint('info', info, { title: 'Song', playing: true });
  await h.paint('art', art, { title: 'Song', playing: true });
  assert.equal(h.calls.find(call => call.id === 'info' && call.event === 'layout').layout, '$A1');
  assert.equal(h.calls.find(call => call.id === 'art' && call.event === 'layout').layout, 'layouts/current-track-artwork.json');
  assert.equal(h.calls.find(call => call.id === 'info' && call.event === 'feedback').feedback.icon, pause);
  await h.paint('info', info, { title: 'Song', playing: false });
  assert.equal(h.calls.at(-1).feedback.icon, play);
  assert.equal(h.calls.at(-1).feedback.value, 'Song');
});

test('artwork fit is independent per dial and title updates do not resend cached artwork', async () => {
  const h = harness(), width = h.add('wide', 'artwork'), height = h.add('tall', 'artwork');
  Object.assign(width.settings, { artworkFit: 'width', artworkShowTitle: true });
  h.context.cachedCoverUrl = 'cover'; h.context.cachedCoverData = raster;
  const state = { title: '곡 이름 <&> 🎵', cover: 'cover', playing: true };
  await h.paint('wide', width, state);
  const wide = h.calls.at(-1).feedback;
  assert.match(Buffer.from(wide.artwork.value.split(',')[1], 'base64').toString(), /x="0" y="-50" width="200" height="200"/);
  assert.equal(wide.songName.enabled, true);
  assert.equal(wide.songName.value, state.title);
  await h.paint('tall', height, state);
  const tall = h.calls.at(-1).feedback;
  assert.match(Buffer.from(tall.artwork.value.split(',')[1], 'base64').toString(), /x="50" y="0" width="100" height="100"/);
  assert.equal(tall.songName.enabled, false, 'existing actions default to hidden song names');
  await h.paint('wide', width, { ...state, title: 'Next song' });
  assert.equal(h.calls.at(-1).feedback.songName.value, 'Next song');
  assert.equal(h.calls.at(-1).feedback.artwork, undefined, 'a title change only updates text');
  width.settings.artworkShowTitle = false;
  await h.paint('wide', width, state);
  assert.equal(h.calls.at(-1).feedback.songName.enabled, false);
  assert.equal(h.calls.at(-1).feedback.artwork, undefined);
  width.settings.artworkFit = 'height';
  await h.paint('wide', width, state);
  assert.match(Buffer.from(h.calls.at(-1).feedback.artwork.value.split(',')[1], 'base64').toString(), /x="50" y="0" width="100" height="100"/);
});

test('invalid artwork uses a square playback fallback and clears an unavailable title', async () => {
  const h = harness(), item = h.add('dial', 'artwork');
  Object.assign(item.settings, { artworkFit: 'width', artworkShowTitle: true });
  h.context.cachedCoverUrl = 'cover'; h.context.cachedCoverData = 'data:image/png;base64,Y29ycnVwdA==';
  await h.paint('dial', item, { title: 'Song', cover: 'cover', playing: true });
  assert.equal(h.calls.at(-1).feedback.artwork.enabled, false);
  assert.equal(h.calls.at(-1).feedback.fallback.value, pause);
  await h.paint('dial', item, { title: 'Song', cover: 'cover', playing: false });
  assert.equal(h.calls.at(-1).feedback.fallback.value, play);
  await h.paint('dial', item, null);
  assert.equal(h.calls.at(-1).feedback.songName.enabled, false);
  assert.equal(h.calls.at(-1).feedback.songName.value, '');
});

test('artist and background are optional and scrolling updates only text, with track and mode resets', async () => {
  const h = harness(), item = h.add('dial', 'artwork');
  item.settings.artworkShowTitle = true;
  h.context.cachedCoverUrl = 'cover'; h.context.cachedCoverData = raster;
  const state = { title: '가나다라마바사아자차카타파하🇰🇷🙂다음문자열', artist: '가수', cover: 'cover', playing: true };
  await h.paint('dial', item, state);
  assert.equal(h.calls.at(-1).feedback.songName.value, state.title);
  assert.equal(h.calls.at(-1).feedback.songName.background, 'transparent');
  Object.assign(item.settings, { artworkShowArtist: true, artworkTitleBackground: true });
  await h.paint('dial', item, state);
  assert.equal(h.calls.at(-1).feedback.songName.value, state.title + ' — 가수');
  assert.equal(h.calls.at(-1).feedback.songName.background, 'black');
  assert.equal(h.calls.at(-1).feedback.artwork, undefined);
  item.settings.artworkTitleMode = 'scroll';
  await h.paint('dial', item, state);
  assert.equal(h.calls.at(-1).feedback.songName.value, state.title + ' — 가수');
  assert.equal(h.calls.at(-1).feedback.songName.alignment, 'left');
  h.context.Date.now = () => 1000 + 4 * 380;
  await h.paint('dial', item, state);
  assert.equal(h.calls.at(-1).feedback.songName.value, [...new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(state.title + ' — 가수')].slice(1).map(x => x.segment).join('') + '   가');
  assert.equal(h.calls.at(-1).feedback.artwork, undefined, 'scroll frames never retransmit the image');
  await h.paint('dial', item, { ...state, title: '새 곡' });
  assert.equal(h.calls.at(-1).feedback.songName.value, '새 곡 — 가수');
  Object.assign(item.settings, { artworkShowArtist: false, artworkTitleBackground: false, artworkTitleMode: 'truncate' });
  await h.paint('dial', item, state);
  assert.equal(h.calls.at(-1).feedback.songName.value, state.title);
  assert.equal(h.calls.at(-1).feedback.songName.background, 'transparent');
  assert.equal(h.calls.at(-1).feedback.songName['text-overflow'], 'ellipsis');
  await h.paint('dial', item, null);
  assert.equal(h.calls.at(-1).feedback.songName.enabled, false);
});

test('the marquee timer includes visible artwork dials only when their text scrolls', () => {
  const timerSource = source.slice(source.indexOf('const marqueeTimer ='), source.indexOf('marqueeTimer.unref();'));
  let tick, draws = 0;
  const item = { action: 'trackdial', settings: { dialDisplay: 'artwork', artworkShowTitle: true, artworkTitleMode: 'scroll' } };
  const displayed = new Map([['dial', item]]);
  vm.runInNewContext(timerSource, { displayed, actionName: name => name, MARQUEE_STEP_MS: 380,
    setInterval: callback => { tick = callback; }, drawSoon: () => draws++ });
  tick(); assert.equal(draws, 1);
  item.settings.artworkShowTitle = false; tick(); assert.equal(draws, 1);
  item.settings.artworkShowTitle = true; item.settings.dialDisplay = 'info'; tick(); assert.equal(draws, 1);
  item.settings.dialDisplay = 'artwork'; item.settings.artworkTitleMode = 'truncate'; tick(); assert.equal(draws, 1);
  displayed.clear(); tick(); assert.equal(draws, 1);
});

test('dial scrolling fills the native full-width field rather than a fourteen-glyph window', async () => {
  const h = harness(), item = h.add('dial', 'artwork');
  Object.assign(item.settings, { artworkShowTitle: true, artworkTitleMode: 'scroll' });
  const state = { title: 'abcdefghijklmnopqrstuvwxyz0123456789', playing: true };
  await h.paint('dial', item, state);
  assert.equal(h.calls.at(-1).feedback.songName.value, state.title);
  h.context.Date.now = () => 1000 + 4 * 380;
  await h.paint('dial', item, state);
  assert.equal(h.calls.at(-1).feedback.songName.value, state.title.slice(1) + '   a');
  assert.equal(h.calls.at(-1).feedback.songName['text-overflow'], 'clip');
});

test('artist position switches between separate full-width lines and the combined line without stale text', async () => {
  const h = harness(), item = h.add('dial', 'artwork');
  Object.assign(item.settings, { artworkShowTitle: true, artworkShowArtist: true, artworkArtistPosition: 'below' });
  const state = { title: 'Song', artist: 'Artist', playing: true };
  await h.paint('dial', item, state);
  let feedback = h.calls.at(-1).feedback;
  assert.equal(feedback.songName.enabled, false);
  assert.equal(feedback.songTitleAbove.value, 'Song'); assert.equal(feedback.songTitleAbove.enabled, true);
  assert.equal(feedback.songArtist.value, 'Artist'); assert.equal(feedback.songArtist.enabled, true);
  item.settings.artworkArtistPosition = 'inline';
  await h.paint('dial', item, state);
  feedback = h.calls.at(-1).feedback;
  assert.equal(feedback.songName.value, 'Song — Artist'); assert.equal(feedback.songName.enabled, true);
  assert.equal(feedback.songTitleAbove.enabled, false); assert.equal(feedback.songArtist.enabled, false);
  item.settings.artworkArtistPosition = 'below';
  await h.paint('dial', item, { ...state, artist: '' });
  assert.equal(h.calls.at(-1).feedback.songName.value, 'Song');
  assert.equal(h.calls.at(-1).feedback.songArtist.enabled, false);
  await h.paint('dial', item, null);
  assert.equal(h.calls.at(-1).feedback.songName.enabled, false);
  assert.equal(h.calls.at(-1).feedback.songTitleAbove.enabled, false);
  assert.equal(h.calls.at(-1).feedback.songArtist.enabled, false);
});

test('rapid mode switches preserve layout-before-content order and a reappearing action repaints', async () => {
  const h = harness(), item = h.add('dial', 'artwork');
  const state = { title: 'Song', playing: false };
  h.context.render('dial', item, state);
  item.settings.dialDisplay = 'info'; h.context.render('dial', item, state);
  item.settings.dialDisplay = 'artwork'; h.context.render('dial', item, state);
  await item.feedbackQueue;
  assert.deepEqual(h.calls.filter(call => call.event !== 'image').map(call => call.event),
    ['layout', 'feedback', 'layout', 'feedback', 'layout', 'feedback']);
  assert.equal(h.calls.at(-1).feedback.fallback.value, play);
  const next = h.add('dial', 'info');
  await h.paint('dial', next, state);
  assert.equal(h.calls.at(-2).layout, '$A1');
  assert.equal(h.calls.at(-1).feedback.value, 'Song');
});
