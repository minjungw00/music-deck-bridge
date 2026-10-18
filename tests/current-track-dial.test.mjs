import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../streamdeck/src/plugin.cjs', import.meta.url), 'utf8');
const render = source.slice(source.indexOf('function renderCurrentTrackDial('), source.indexOf('function showAlert('));
const play = 'imgs/actions/toggle/key@2x.png';
const pause = 'imgs/actions/toggle/pause@2x.png';
function harness() {
  const calls = [], displayed = new Map();
  const context = vm.createContext({ sdOnline: true, displayed, cachedCoverUrl: '', cachedCoverData: '', Buffer,
    tr: key => key, ellipsis: text => text,
    setImage: (id, image) => calls.push({ id, event: 'image', image }),
    sendStream: async message => { calls.push({ id: message.context, event: 'layout', layout: message.payload.layout }); },
    setFeedback: async (id, feedback) => { calls.push({ id, event: 'feedback', feedback }); },
  });
  vm.runInContext(render + '\nthis.render = renderCurrentTrackDial;', context);
  return { context, calls, add(id, dialDisplay) {
    const item = { settings: { dialDisplay } }; displayed.set(id, item); return item;
  }, async paint(id, item, state) { context.render(id, item, state); await item.feedbackQueue; } };
}

test('artwork mode updates cached covers, avoids duplicate transmissions and clears the old song image', async () => {
  const h = harness(), item = h.add('dial', 'artwork');
  const state = { cover: 'first-cover', playing: true };
  h.context.cachedCoverUrl = 'first-cover'; h.context.cachedCoverData = 'data:image/png;base64,Zmlyc3Q=';
  await h.paint('dial', item, state);
  assert.equal(h.calls[1].event, 'layout');
  const fitted = h.calls[2].feedback.artwork;
  assert.equal(fitted.enabled, true);
  const svg = Buffer.from(fitted.value.split(',')[1], 'base64').toString();
  assert.ok(svg.includes(h.context.cachedCoverData));
  assert.match(svg, /xMidYMid meet/);
  const count = h.calls.length;
  await h.paint('dial', item, state);
  assert.equal(h.calls.length, count, 'unchanged artwork is not retransmitted');
  state.cover = 'second-cover';
  await h.paint('dial', item, state);
  assert.equal(h.calls.at(-1).feedback.artwork.enabled, false);
  assert.equal(h.calls.at(-1).feedback.fallback.value, pause, 'pending art never keeps the previous cover');
  h.context.cachedCoverUrl = 'second-cover'; h.context.cachedCoverData = 'data:image/png;base64,c2Vjb25k';
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
  h.context.cachedCoverUrl = 'cover'; h.context.cachedCoverData = 'data:image/png;base64,Y292ZXI=';
  const state = { title: '곡 이름 <&> 🎵', cover: 'cover', playing: true };
  await h.paint('wide', width, state);
  const wide = h.calls.at(-1).feedback;
  assert.match(Buffer.from(wide.artwork.value.split(',')[1], 'base64').toString(), /xMidYMid slice/);
  assert.equal(wide.songName.enabled, true);
  assert.equal(wide.songName.value, state.title);
  await h.paint('tall', height, state);
  const tall = h.calls.at(-1).feedback;
  assert.match(Buffer.from(tall.artwork.value.split(',')[1], 'base64').toString(), /xMidYMid meet/);
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
  assert.match(Buffer.from(h.calls.at(-1).feedback.artwork.value.split(',')[1], 'base64').toString(), /xMidYMid meet/);
});

test('invalid artwork uses a square playback fallback and clears an unavailable title', async () => {
  const h = harness(), item = h.add('dial', 'artwork');
  Object.assign(item.settings, { artworkFit: 'width', artworkShowTitle: true });
  h.context.cachedCoverUrl = 'cover'; h.context.cachedCoverData = 'https://untrusted.example/image.svg';
  await h.paint('dial', item, { title: 'Song', cover: 'cover', playing: true });
  assert.equal(h.calls.at(-1).feedback.artwork.enabled, false);
  assert.equal(h.calls.at(-1).feedback.fallback.value, pause);
  await h.paint('dial', item, { title: 'Song', cover: 'cover', playing: false });
  assert.equal(h.calls.at(-1).feedback.fallback.value, play);
  await h.paint('dial', item, null);
  assert.equal(h.calls.at(-1).feedback.songName.enabled, false);
  assert.equal(h.calls.at(-1).feedback.songName.value, '');
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
