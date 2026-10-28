import test from 'node:test';
import assert from 'node:assert/strict';
import { playerHarness } from './helpers/player.mjs';

function harness({ ready = true, blocked = false, error = false, noEffect = false,
  restart = false, playBlocked = false, playNoEffect = false, initialState = 2,
  cueOnNavigation = false, ignoreUntilPlaying = false } = {}) {
  const player = playerHarness();
  let state = initialState, track = 'aaaaaaaaaaa', clicks = 0, time = 0, plays = 0, ignored = 0;
  const listeners = new Map();
  const mediaListeners = new Map();
  player.audio.addEventListener = (name, fn) => mediaListeners.set(name, fn);
  player.audio.removeEventListener = name => mediaListeners.delete(name);
  const api = {
    isReady: () => ready,
    getPlayerState: () => state,
    getVideoData: () => ({ video_id: track }),
    getCurrentTime: () => time,
    playVideo() {
      plays++;
      if (playBlocked) { listeners.get('onAutoplayBlocked')?.(); return; }
      if (!playNoEffect) state = 1;
    },
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name),
  };
  const button = type => ({
    getAttribute: () => null,
    click() {
      clicks++;
      if (blocked) { listeners.get('onAutoplayBlocked')?.(); return; }
      if (error) { listeners.get('onError')?.(); return; }
      if (noEffect) return;
      if (type !== 'toggle' && ignoreUntilPlaying && state !== 1) { ignored++; return; }
      if (type === 'toggle') state = state === 1 ? 2 : 1;
      else if (type === 'prev' && (restart || time > 5)) {
        time = 0;
        mediaListeners.get('seeked')?.();
      }
      else track = type === 'next' ? 'bbbbbbbbbbb' : 'ccccccccccc';
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
    send: (command, expiresAt) => player.send({ type: 'player-playback', command, expiresAt }) };
}

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
