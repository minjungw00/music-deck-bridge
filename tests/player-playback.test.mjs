import test from 'node:test';
import assert from 'node:assert/strict';
import { playerHarness } from './helpers/player.mjs';

function harness({ ready = true, blocked = false, error = false, noEffect = false,
  restart = false, playBlocked = false, playNoEffect = false, initialState = 2,
  cueOnNavigation = false, ignoreUntilPlaying = false, seekEvent = true, ignoredTypes = [], playPromise } = {}) {
  const player = playerHarness();
  let state = initialState, track = 'aaaaaaaaaaa', clicks = 0, time = 0, plays = 0, ignored = 0;
  const listeners = new Map();
  const mediaListeners = new Map();
  const add = (map, name, fn) => { if (!map.has(name)) map.set(name, new Set()); map.get(name).add(fn); };
  const remove = (map, name, fn) => { map.get(name)?.delete(fn); if (!map.get(name)?.size) map.delete(name); };
  const emit = (map, name) => { for (const fn of map.get(name) || []) fn(); };
  player.audio.addEventListener = (name, fn) => add(mediaListeners, name, fn);
  player.audio.removeEventListener = (name, fn) => remove(mediaListeners, name, fn);
  const api = {
    isReady: () => ready,
    getPlayerState: () => state,
    getVideoData: () => ({ video_id: track }),
    getCurrentTime: () => time,
    playVideo() {
      plays++;
      if (playBlocked) { emit(listeners, 'onAutoplayBlocked'); return; }
      if (!playNoEffect) state = 1;
      return playPromise;
    },
    addEventListener: (name, fn) => add(listeners, name, fn),
    removeEventListener: (name, fn) => remove(listeners, name, fn),
  };
  const button = type => ({
    getAttribute: () => null,
    click() {
      clicks++;
      if (blocked) { emit(listeners, 'onAutoplayBlocked'); return; }
      if (error) { emit(listeners, 'onError'); return; }
      if (noEffect) return;
      if (ignoredTypes.includes(type)) return;
      if (type !== 'toggle' && ignoreUntilPlaying && state !== 1) { ignored++; return; }
      if (type === 'toggle') state = state === 1 || state === 3 ? 2 : 1;
      else if (type === 'prev' && (restart || time > 5)) {
        time = 0;
        if (seekEvent) emit(mediaListeners, 'seeked');
      }
      else track = String(clicks).padStart(11, type === 'next' ? 'b' : 'c');
      if (type !== 'toggle' && cueOnNavigation) state = 5;
    },
  });
  const buttons = { '.play-pause-button': button('toggle'), '.next-button': button('next'), '.previous-button': button('prev') };
  player.setDocument({
    querySelector: selector => selector === '#movie_player' ? api : buttons[selector.replace('ytmusic-player-bar ', '')] || null,
    querySelectorAll: selector => selector === 'video, audio' ? [player.audio] : [],
  });
  return { player, listeners, mediaListeners, clicks: () => clicks, plays: () => plays,
    state: () => state, ignored: () => ignored, ready: value => { ready = value; },
    setState: value => { state = value; },
    time: value => { time = value; },
    send: (command, expiresAt, dispatchOnly = false) => player.send({ type: 'player-playback', command, expiresAt, dispatchOnly }),
    result: pending => player.send({ type: 'player-playback-result', pending }) };
}

async function until(check) {
  const deadline = Date.now() + 1000;
  while (!check()) {
    assert.ok(Date.now() < deadline, 'fixture did not dispatch');
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}

test('an unconfirmed Previous cannot delay Pause or resume playback after it', async () => {
  const h = harness({ initialState: 1, ignoredTypes: ['prev'] });
  const previous = await h.send('prev', Date.now() + 1500, true);
  assert.ok(previous.pending);
  await until(() => h.clicks() === 1);
  const start = Date.now();
  assert.equal((await h.send('toggle')).ok, true);
  assert.ok(Date.now() - start < 300, 'Pause did not wait for the navigation timeout');
  assert.equal((await h.result(previous.pending)).reason, 'command-superseded');
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal(h.state(), 2);
  assert.equal(h.plays(), 0, 'old verification cannot restart the newly paused player');
});

test('Pause interrupts a buffered navigation before its click is dispatched', async () => {
  const h = harness({ initialState: 3 });
  const previous = await h.send('prev', Date.now() + 1500, true);
  const start = Date.now();
  assert.equal((await h.send('toggle')).ok, true);
  assert.ok(Date.now() - start < 300);
  assert.equal((await h.result(previous.pending)).reason, 'command-superseded');
  assert.equal(h.clicks(), 1, 'only Pause was dispatched');
  assert.equal(h.state(), 2);
  assert.equal(h.plays(), 0);
});

test('an unsettled Play API promise cannot hold navigation after playback has started', { timeout: 1000 }, async () => {
  const h = harness({ playPromise: new Promise(() => {}) });
  assert.equal((await h.send('prev', Date.now() + 600)).ok, true);
  assert.equal(h.clicks(), 1);
  assert.equal(h.state(), 1);
});

test('a restart without a seek event still recovers playback without inventing a navigation result', async () => {
  const h = harness({ initialState: 1, restart: true, cueOnNavigation: true, seekEvent: false });
  const pending = await h.send('prev', Date.now() + 180, true);
  await until(() => h.plays() === 1);
  assert.equal(h.state(), 1);
  assert.equal((await h.result(pending.pending)).reason, 'playback-unconfirmed');
  assert.equal(h.clicks(), 1);
});

test('restart evidence is retained while playback remains cued beyond two seconds', async () => {
  const h = harness({ initialState: 1, restart: true, cueOnNavigation: true, playNoEffect: true });
  h.time(2);
  const pending = await h.send('prev', Date.now() + 600, true);
  await until(() => h.plays() === 1);
  h.time(4); h.setState(1);
  assert.equal((await h.result(pending.pending)).ok, true);
});

test('rapid navigation dispatches every input once while old outcome monitors are superseded', async () => {
  const h = harness({ initialState: 1 });
  const pending = await Promise.all(Array.from({ length: 3 }, () => h.send('next', Date.now() + 600, true)));
  const results = await Promise.all(pending.map(item => h.result(item.pending)));
  assert.equal(h.clicks(), 3);
  assert.equal(results.at(-1).ok, true);
  assert.ok(results.slice(0, -1).every(result => result.ok || result.reason === 'command-superseded'));
});

test('restored metadata does not authorize a click before the player is ready', async () => {
  const h = harness({ ready: false });
  for (const type of ['play', 'toggle', 'next', 'prev']) {
    const result = await h.send(type);
    assert.equal(result.ok, false);
    assert.equal(result.retry, true);
  }
  assert.equal(h.clicks(), 0);
  h.ready(true);
  assert.equal((await h.send('play')).ok, true);
  assert.equal(h.clicks(), 1);
});

test('playback uses the site API state when a separate media node reports playing', async () => {
  const h = harness();
  assert.equal(h.player.audio.paused, false, 'stale media node disagrees with the paused site player');
  assert.equal((await h.send('play')).ok, true);
  assert.equal(h.clicks(), 1, 'paused site player must receive Play despite the stale media node');
  assert.equal((await h.send('play')).ok, true);
  assert.equal(h.clicks(), 1, 'Play is idempotent after actual playback starts');
  assert.equal((await h.send('toggle')).ok, true);
  assert.equal(h.clicks(), 2);
});

test('track controls require an observed track change, and expiry forbids input', async () => {
  const h = harness();
  assert.equal((await h.send('next')).ok, true);
  assert.equal((await h.send('prev')).ok, true);
  assert.equal(h.clicks(), 2);
  h.time(12);
  assert.equal((await h.send('prev')).ok, true, 'the site may restart the current track instead of changing it');
  assert.equal(h.clicks(), 3);
  assert.equal((await h.send('next', Date.now() - 1)).ok, false);
  assert.equal(h.clicks(), 3);
  const delayed = harness({ noEffect: true });
  const result = await delayed.send('next', Date.now() + 20);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'playback-unconfirmed');
  assert.equal(result.retry, undefined, 'an already dispatched input cannot safely be replayed');
  assert.equal(delayed.clicks(), 1);
});

test('track navigation starts a cued track and confirms playback before acknowledging', async () => {
  for (const type of ['next', 'prev']) {
    const h = harness({ cueOnNavigation: true });
    assert.equal((await h.send(type, Date.now() + 500)).ok, true);
    assert.equal(h.state(), 1);
    assert.equal(h.plays(), 2, 'initialize playback, then start the cued destination');
    assert.equal(h.clicks(), 1, 'navigation is dispatched once');
    assert.equal(h.mediaListeners.size, 0);
  }
});

test('previous confirms a same-track restart within the first five seconds, including zero', async () => {
  for (const time of [0, 2, 5]) {
    const h = harness({ restart: true });
    h.time(time);
    assert.equal((await h.send('prev', Date.now() + 500)).ok, true);
    assert.equal(h.state(), 1);
    assert.equal(h.clicks(), 1);
  }
});

test('a changed track without playback is not acknowledged or navigated a second time', async () => {
  const h = harness({ playNoEffect: true, initialState: 1, cueOnNavigation: true });
  const result = await h.send('next', Date.now() + 180);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'playback-unconfirmed');
  assert.equal(result.retry, undefined);
  assert.equal(h.plays(), 1);
  assert.equal(h.clicks(), 1);
});

test('autoplay blocking after navigation is reported without replaying navigation', async () => {
  const h = harness({ playBlocked: true, initialState: 1, cueOnNavigation: true });
  const result = await h.send('next', Date.now() + 500);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'autoplay-blocked');
  assert.equal(result.retry, undefined);
  assert.equal(h.clicks(), 1);
  assert.equal(h.plays(), 1);
  assert.equal(h.listeners.size, 0);
  assert.equal(h.mediaListeners.size, 0);
});

test('the first previous input waits for initial playback before navigating once', async () => {
  const h = harness({ ignoreUntilPlaying: true });
  assert.equal((await h.send('prev', Date.now() + 500)).ok, true);
  assert.equal(h.ignored(), 0);
  assert.equal(h.clicks(), 1);
  assert.equal(h.plays(), 1);
});

test('buffering playback settles before navigation without an extra Play request', async () => {
  const h = harness({ initialState: 3, ignoreUntilPlaying: true });
  const timer = setTimeout(() => h.setState(1), 20);
  try {
    assert.equal((await h.send('next', Date.now() + 500)).ok, true);
    assert.equal(h.plays(), 0);
    assert.equal(h.clicks(), 1);
  } finally { clearTimeout(timer); }
});

for (const [config, reason] of [[{ blocked: true }, 'autoplay-blocked'], [{ error: true }, 'player-error']]) {
  test(`player reports ${reason} instead of acknowledging a successful click`, async () => {
    const h = harness(config);
    const result = await h.send('play');
    assert.equal(result.ok, false);
    assert.equal(result.reason, reason);
    assert.equal(result.retry, undefined);
    assert.equal(h.clicks(), 1);
    assert.equal(h.listeners.size, 0);
  });
}

test('untrusted senders cannot execute playback code', async () => {
  const h = harness();
  for (const sender of [{}, { tab: { id: 1 }, frameId: 1, url: 'https://music.youtube.com/' },
    { tab: { id: 1 }, frameId: 0, url: 'https://example.com/' }]) {
    assert.equal((await h.player.send({ type: 'player-playback', command: 'play' }, sender)).ok, false);
  }
  assert.equal(h.player.scriptCalls.length, 0);
});
