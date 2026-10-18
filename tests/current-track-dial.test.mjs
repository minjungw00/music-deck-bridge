import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRenderer, needsMarquee } from '../streamdeck/src/presentation/renderer.cjs';
import { fitDialArtwork } from '../streamdeck/src/dial-artwork.cjs';

const raster = 'data:image/png;base64,' + readFileSync(new URL('../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/imgs/plugin/icon.png', import.meta.url)).toString('base64');
const play = 'imgs/actions/toggle/key@2x.png';
const pause = 'imgs/actions/toggle/pause@2x.png';
function harness(output = {}) {
  const calls = [], displayed = new Map();
  const context = { cachedCoverUrl: '', cachedCoverData: '', Date: { now: () => 1000 } };
  const renderer = createRenderer({ displayed, now: () => context.Date.now(), tr: key => key, fitDialArtwork,
    covers: { image: src => src === context.cachedCoverUrl ? context.cachedCoverData : '' },
    output: {
      setImage: (id, image) => calls.push({ id, event: 'image', image }),
      sendStream: async message => { calls.push({ id: message.context, event: 'layout', layout: message.payload.layout }); },
      setFeedback: async (id, feedback) => { calls.push({ id, event: 'feedback', feedback }); },
      ...output,
    } });
  context.render = renderer.renderCurrentTrackDial;
  return { context, calls, displayed, add(id, dialDisplay) {
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
  const item = { action: 'trackdial', settings: { dialDisplay: 'artwork', artworkShowTitle: true, artworkTitleMode: 'scroll' } };
  const displayed = new Map([['dial', item]]);
  let draws = 0;
  const tick = () => { if (needsMarquee(displayed, name => name)) draws++; };
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
    ['layout', 'feedback'], 'unsent intermediate modes are coalesced into the final mode');
  assert.equal(h.calls.at(-1).feedback.fallback.value, play);
  const next = h.add('dial', 'info');
  await h.paint('dial', next, state);
  assert.equal(h.calls.at(-2).layout, '$A1');
  assert.equal(h.calls.at(-1).feedback.value, 'Song');
});

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

test('a delayed layout retains only the in-flight frame and the latest pending dial frame', async () => {
  const layout = deferred(), values = [];
  const h = harness({ sendStream: () => layout.promise,
    setFeedback(_id, feedback) { values.push(feedback.value); } });
  const item = h.add('dial', 'info');
  h.context.render('dial', item, { title: 'First' }); await flush();
  for (let i = 1; i <= 20; i++) h.context.render('dial', item, { title: `State ${i}` });
  assert.deepEqual(values, [], 'content must wait for its layout');
  layout.resolve(); await item.feedbackQueue;
  assert.deepEqual(values, ['First', 'State 20']);
});

test('pending mode and artwork changes coalesce without sending content before its layout', async () => {
  const feedback = deferred(), trace = [];
  const h = harness({
    sendStream(message) { trace.push(['layout', message.payload.layout]); },
    setFeedback(_id, value) {
      trace.push(['feedback', value]);
      if (trace.length === 2) return feedback.promise;
    } });
  const item = h.add('dial', 'info');
  h.context.render('dial', item, { title: 'First' }); await flush();
  item.settings.dialDisplay = 'artwork'; h.context.render('dial', item, { title: 'Middle' });
  item.settings.dialDisplay = 'info'; h.context.render('dial', item, { title: 'Skipped' });
  Object.assign(item.settings, { dialDisplay: 'artwork', artworkShowTitle: true });
  h.context.cachedCoverUrl = 'latest-cover'; h.context.cachedCoverData = raster;
  h.context.render('dial', item, { title: 'Latest', cover: 'latest-cover', playing: true });
  feedback.resolve(); await item.feedbackQueue;
  assert.deepEqual(trace.map(([type]) => type), ['layout', 'feedback', 'layout', 'feedback']);
  assert.equal(trace[2][1], 'layouts/current-track-artwork.json');
  assert.equal(trace[3][1].songName.value, 'Latest');
  assert.equal(trace[3][1].artwork.enabled, true);
  await h.paint('dial', item, { title: 'Latest', cover: 'latest-cover', playing: true });
  assert.equal(trace.length, 4, 'the successfully submitted latest state is cached');
});

test('failed or skipped dial outputs retry and a failed older frame does not invalidate a newer success', async () => {
  for (const event of ['layout', 'feedback']) for (const skipped of [false, true]) {
    let layouts = 0, feedbacks = 0;
    const fail = () => skipped ? false : Promise.reject(Error('SDK failure'));
    const h = harness({ sendStream() { if (++layouts === 1 && event === 'layout') return fail(); },
      setFeedback() { if (++feedbacks === 1 && event === 'feedback') return fail(); } });
    const item = h.add('dial', 'info');
    await h.paint('dial', item, { title: 'Retry' });
    await h.paint('dial', item, { title: 'Retry' });
    const count = feedbacks;
    await h.paint('dial', item, { title: 'Retry' });
    assert.equal(feedbacks, count, 'successful retry is cached');
    assert.equal(layouts, event === 'layout' ? 2 : 1);
    assert.equal(feedbacks, event === 'feedback' ? 2 : 1);
  }
  for (const skipped of [false, true]) {
    const first = deferred(), values = [];
    const h = harness({ setFeedback(_id, value) {
      values.push(value.value); if (values.length === 1) return first.promise;
    } });
    const item = h.add('dial', 'info');
    h.context.render('dial', item, { title: 'Old' }); await flush();
    h.context.render('dial', item, { title: 'New' });
    if (skipped) first.resolve(false); else first.reject(Error('SDK failure'));
    await item.feedbackQueue;
    await h.paint('dial', item, { title: 'New' });
    assert.deepEqual(values, ['Old', 'New']);
  }
});

test('returning to the in-flight frame discards redundant intermediate dial states', async () => {
  const first = deferred(), values = [];
  const h = harness({ setFeedback(_id, value) {
    values.push(value.value); if (values.length === 1) return first.promise;
  } });
  const item = h.add('dial', 'info');
  h.context.render('dial', item, { title: 'First' }); await flush();
  h.context.render('dial', item, { title: 'Middle' });
  h.context.render('dial', item, { title: 'First' });
  first.resolve(); await item.feedbackQueue;
  assert.deepEqual(values, ['First']);
});

for (const stage of ['layout', 'feedback']) {
  test(`a disappearing dial discards queued content while its ${stage} is pending`, async () => {
    const first = deferred(), values = [];
    const h = harness({ sendStream() { if (stage === 'layout') return first.promise; },
      setFeedback(_id, value) { values.push(value.value); return first.promise; } });
    const item = h.add('dial', 'info');
    h.context.render('dial', item, { title: 'First' }); await flush();
    h.context.render('dial', item, { title: 'Queued' });
    h.displayed.delete('dial');
    first.resolve(); await item.feedbackQueue;
    assert.deepEqual(values, stage === 'layout' ? [] : ['First']);
  });
}
