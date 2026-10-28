import test from 'node:test';
import assert from 'node:assert/strict';
import { playerHarness } from './helpers/player.mjs';

function harness({ ready = true, blocked = false, error = false, noEffect = false,
  restart = false, playBlocked = false, playNoEffect = false, initialState = 2,
  cueOnNavigation = false, ignoreUntilPlaying = false, seekEvent = true, ignoredTypes = [], playPromise,
  unloadedUntilPlay = false, rejectUncued = false, clearOnError = false, clickError,
  ignoredPlayRequests = 0, blockedPlayRequest = 0 } = {}) {
  const player = playerHarness();
  let state = initialState, track = 'aaaaaaaaaaa', clicks = 0, time = 0, plays = 0, ignored = 0;
  let initialized = !unloadedUntilPlay;
  if (unloadedUntilPlay) { player.audio.readyState = 0; player.audio.currentSrc = ''; player.audio.paused = true; }
  const listeners = new Map();
  const mediaListeners = new Map();
  const add = (map, name, fn) => { if (!map.has(name)) map.set(name, new Set()); map.get(name).add(fn); };
  const remove = (map, name, fn) => { map.get(name)?.delete(fn); if (!map.get(name)?.size) map.delete(name); };
  const emit = (map, name, event) => { for (const fn of map.get(name) || []) fn(event); };
  player.audio.addEventListener = (name, fn) => add(mediaListeners, name, fn);
  player.audio.removeEventListener = (name, fn) => remove(mediaListeners, name, fn);
  let api = {
    isReady: () => ready,
    getPlayerState: () => state,
    getVideoData: () => ({ video_id: initialized ? track : '' }),
    getCurrentTime: () => time,
    playVideo() {
      plays++;
      if (playBlocked || plays === blockedPlayRequest) { emit(listeners, 'onAutoplayBlocked'); return; }
      if (plays <= ignoredPlayRequests) return;
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
      if (clickError) throw clickError;
      if (rejectUncued && !initialized && state !== 5) {
        emit(listeners, 'onError', { data: 2 }); return;
      }
      if (blocked) { emit(listeners, 'onAutoplayBlocked'); return; }
      if (error) {
        if (clearOnError) {
          state = -1; initialized = false; player.audio.readyState = 0; player.audio.currentSrc = '';
        }
        emit(listeners, 'onError', { data: typeof error === 'number' ? error : undefined }); return;
      }
      if (noEffect) return;
      if (ignoredTypes.includes(type)) return;
      if (type !== 'toggle' && ignoreUntilPlaying && state !== 1) { ignored++; return; }
      if (type === 'toggle') {
        state = state === 1 || state === 3 ? 2 : 1;
        initialized = true; player.audio.readyState = 4; player.audio.currentSrc = track;
      }
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
    setTrack: value => { track = value; },
    replaceApi: () => { api = { ...api }; },
    time: value => { time = value; },
    send: (command, expiresAt, dispatchOnly = false) => player.send({ type: 'player-playback', command, expiresAt, dispatchOnly }),
    result: pending => player.send({ type: 'player-playback-result', pending }) };
}

test('site error diagnostics retain the numeric event code and the control phase', async () => {
  const h = harness({ error: 153 });
  const result = await h.send('play');
  assert.equal(result.reason, 'player-error');
  assert.equal(result.diagnostic.source, 'site-event');
  assert.equal(result.diagnostic.code, 153);
  assert.equal(result.diagnostic.errorPhase, 'play-button');
  assert.equal(result.diagnostic.inputAction, 'play-button');
  assert.equal(result.diagnostic.inputApi, 'movie-player');
  assert.equal(h.clicks(), 1);
});

test('diagnostics distinguish the input state from track/media cleared by a site error', async () => {
  const h = harness({ error: 2, clearOnError: true });
  const result = await h.send('play');
  assert.equal(result.reason, 'player-error');
  assert.equal(result.diagnostic.code, 2);
  assert.equal(result.diagnostic.state, -1);
  assert.equal(result.diagnostic.hasTrack, false);
  assert.equal(result.diagnostic.mediaReady, 0);
  assert.equal(result.diagnostic.inputState, 2);
  assert.equal(result.diagnostic.inputHasTrack, true);
  assert.equal(result.diagnostic.inputMediaReady, 4);
  assert.equal(result.diagnostic.inputApiReady, true);
});

test('media error diagnostics remain distinct and do not send an input', async () => {
  const h = harness();
  h.player.audio.error = { code: 4, message: 'DO_NOT_RETAIN_MEDIA_MESSAGE' };
  const result = await h.send('play');
  assert.equal(result.reason, 'player-error');
  assert.equal(result.diagnostic.source, 'media');
  assert.equal(result.diagnostic.code, 4);
  assert.equal(h.clicks(), 0);
  assert.equal(JSON.stringify(result).includes('DO_NOT_RETAIN'), false);
});

test('script error diagnostics include a bounded exception name without its message or stack', async () => {
  const h = harness({ clickError: new TypeError('DO_NOT_RETAIN_EXCEPTION_MESSAGE') });
  const result = await h.send('play');
  assert.equal(result.reason, 'player-error');
  assert.equal(result.diagnostic.source, 'exception');
  assert.equal(result.diagnostic.exception, 'TypeError');
  assert.equal(result.diagnostic.errorPhase, 'play-button');
  assert.equal(JSON.stringify(result).includes('DO_NOT_RETAIN'), false);
});

for (const type of ['play', 'toggle', 'prev', 'next']) {
  test(`${type} waits for a selection when the API is ready but the player is empty`, async () => {
    const h = harness({ unloadedUntilPlay: true, initialState: -1, rejectUncued: true,
      ignoreUntilPlaying: true });
    const pending = await h.send(type, Date.now() + 1000, true);
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(h.clicks(), 0, 'an initialized API alone must not authorize a Play request');
    assert.equal(h.plays(), 0);
    h.setState(5);
    assert.equal((await h.result(pending.pending)).ok, true);
    assert.equal(h.clicks(), type === 'play' || type === 'toggle' ? 1 : 2);
    assert.equal(h.ignored(), 0);
    assert.equal(h.state(), 1);
  });

  test(`${type} bootstraps media that cannot load until the first Play input`, async () => {
    const h = harness({ unloadedUntilPlay: true, initialState: 5, ignoreUntilPlaying: true });
    const pending = await h.send(type, Date.now() + 250, true);
    const result = await h.result(pending.pending);
    assert.equal(result.ok, true, `${type} must not wait for media that only Play can load`);
    assert.equal(h.state(), 1);
    assert.equal(h.clicks(), type === 'play' || type === 'toggle' ? 1 : 2);
    assert.equal(h.ignored(), 0);
  });
}

test('an empty unstarted player expires without causing a site error or claiming success', async () => {
  const h = harness({ unloadedUntilPlay: true, initialState: -1, rejectUncued: true });
  assert.equal((await h.send('play')).retry, true, 'legacy callers can retry before dispatch');
  const pending = await h.send('play', Date.now() + 100, true);
  const result = await h.result(pending.pending);
  assert.equal(result.reason, 'player-not-ready');
  assert.equal(result.diagnostic.phase, 'prepare');
  assert.equal(result.diagnostic.apiReady, true);
  assert.equal(result.diagnostic.hasTrack, false);
  assert.equal(result.diagnostic.state, -1);
  assert.equal(result.diagnostic.inputState, null, 'no input was dispatched');
  assert.equal(h.clicks(), 0);
  assert.equal(h.plays(), 0);
});

test('an unstarted player with a loaded track still accepts Play', async () => {
  const h = harness({ initialState: -1 });
  assert.equal((await h.send('play')).ok, true);
  assert.equal(h.clicks(), 1);
});

for (const type of ['play', 'toggle']) {
  test(`${type} starts a restored track without media through the Play API`, async () => {
    const h = harness({ initialState: -1, noEffect: true });
    h.player.audio.readyState = 0;
    h.player.audio.currentSrc = '';
    h.player.audio.paused = true;
    assert.equal((await h.send(type, Date.now() + 180)).ok, true);
    assert.equal(h.state(), 1);
    assert.equal(h.plays(), 1);
    assert.equal(h.clicks(), 0, 'use explicit Play instead of an ineffective synthetic toggle');
  });
}

test('a restored track ID without media does not establish playback after an ineffective Play API request', async () => {
  const h = harness({ initialState: -1, noEffect: true, playNoEffect: true });
  h.player.setUserActivation({ isActive: false, hasBeenActive: false });
  h.player.audio.readyState = 0;
  h.player.audio.currentSrc = '';
  h.player.audio.paused = true;
  const pending = await h.send('toggle', Date.now() + 180, true);
  const result = await h.result(pending.pending);
  assert.equal(result.reason, 'playback-unconfirmed');
  assert.equal(result.diagnostic.source, 'observation');
  assert.equal(result.diagnostic.code, null);
  assert.equal(result.diagnostic.inputState, -1);
  assert.equal(result.diagnostic.inputHasTrack, true);
  assert.equal(result.diagnostic.inputMediaReady, 0);
  assert.equal(result.diagnostic.inputAction, 'play-api');
  assert.equal(result.diagnostic.inputApi, 'movie-player');
  assert.equal(result.diagnostic.inputUserActive, false);
  assert.equal(result.diagnostic.inputUserEverActive, false);
  assert.equal(result.diagnostic.state, -1);
  assert.equal(result.diagnostic.hasTrack, true);
  assert.equal(result.diagnostic.mediaReady, 0);
  assert.equal(h.clicks(), 0, 'do not fall back to an ambiguous toggle');
  assert.equal(h.plays(), 1, 'send explicit Play only once');
});

test('a restored-track API autoplay block is reported without falling back to a click', async () => {
  const h = harness({ initialState: -1, playBlocked: true });
  h.player.audio.readyState = 0;
  const result = await h.send('play', Date.now() + 180);
  assert.equal(result.reason, 'autoplay-blocked');
  assert.equal(h.plays(), 1);
  assert.equal(h.clicks(), 0);
});

for (const type of ['play', 'toggle', 'prev', 'next']) {
  test(`${type} recovers an ignored initial Play request without replaying a control`, async () => {
    const h = harness({ initialState: -1, ignoredPlayRequests: 1, cueOnNavigation: true,
      ignoreUntilPlaying: true });
    h.player.audio.readyState = 0;
    h.player.audio.currentSrc = '';
    h.player.audio.paused = true;
    const result = await h.send(type, Date.now() + 1800);
    assert.equal(result.ok, true);
    assert.equal(h.state(), 1);
    assert.equal(h.plays(), type === 'prev' || type === 'next' ? 3 : 2);
    assert.equal(h.clicks(), type === 'prev' || type === 'next' ? 1 : 0);
    assert.equal(h.ignored(), 0);
  });
}

test('startup recovery is bounded even if every Play request is ineffective', async () => {
  const h = harness({ initialState: -1, playNoEffect: true });
  h.player.audio.readyState = 0;
  // Preparation outlives the fifth request's nominal ten-second point, so
  // expiry alone cannot make this assertion pass without the attempt cap.
  const result = await h.send('prev', Date.now() + 14000);
  assert.equal(result.reason, 'player-not-ready');
  assert.equal(h.plays(), 4);
  assert.equal(result.diagnostic.startupAttempts, 4);
  assert.equal(h.clicks(), 0);
});

test('an autoplay block on a startup retry stops recovery without a toggle fallback', async () => {
  const h = harness({ initialState: -1, ignoredPlayRequests: 1, blockedPlayRequest: 2 });
  h.player.audio.readyState = 0;
  const result = await h.send('play', Date.now() + 1800);
  assert.equal(result.reason, 'autoplay-blocked');
  assert.equal(h.plays(), 2);
  assert.equal(h.clicks(), 0);
});

test('a later Pause stops startup recovery and cannot be undone by an old Play request', async () => {
  const h = harness({ initialState: -1, playNoEffect: true });
  h.player.audio.readyState = 0;
  const pending = await h.send('play', Date.now() + 1800, true);
  await until(() => h.plays() === 1);
  h.setState(1);
  assert.equal((await h.send('toggle')).ok, true);
  assert.equal((await h.result(pending.pending)).reason, 'command-superseded');
  await new Promise(resolve => setTimeout(resolve, 1100));
  assert.equal(h.plays(), 1);
  assert.equal(h.state(), 2);
});

for (const change of ['track', 'buffering', 'pause', 'media', 'queue-index', 'api']) {
  test(`observed ${change} permanently cancels startup recovery`, async () => {
    const h = harness({ initialState: -1, playNoEffect: true });
    let index = 0;
    if (change === 'queue-index') h.player.setQueue({ getItems: () => [0, 1], getCurrentItemIndex: () => index });
    h.player.audio.readyState = 0;
    const pending = await h.send('play', Date.now() + 1400, true);
    await until(() => h.plays() === 1);
    if (change === 'track') h.setTrack('bbbbbbbbbbb');
    else if (change === 'media') h.player.audio.readyState = 4;
    else if (change === 'queue-index') index = 1;
    else if (change === 'api') h.replaceApi();
    else h.setState(change === 'buffering' ? 3 : 2);
    await new Promise(resolve => setTimeout(resolve, 160));
    h.setTrack('aaaaaaaaaaa'); h.setState(-1);
    h.player.audio.readyState = 0; index = 0;
    assert.equal((await h.result(pending.pending)).reason, 'playback-unconfirmed');
    assert.equal(h.plays(), 1, 'do not rearm recovery after intervening playback/selection changes');
    assert.equal(h.clicks(), 0);
  });
}

test('a playing track without ready media still accepts Pause through its control', async () => {
  const h = harness({ initialState: 1 });
  h.player.audio.readyState = 0;
  assert.equal((await h.send('toggle')).ok, true);
  assert.equal(h.state(), 2);
  assert.equal(h.clicks(), 1);
  assert.equal(h.plays(), 0);
});

test('a cued state cannot bypass a known empty queue', async () => {
  const h = harness({ unloadedUntilPlay: true, initialState: 5 });
  h.player.setQueue({ getItems: () => [] });
  const pending = await h.send('play', Date.now() + 100, true);
  assert.equal((await h.result(pending.pending)).reason, 'player-not-ready');
  assert.equal(h.clicks(), 0);
});

test('an initialization timeout is distinguished from an unconfirmed dispatched input', async () => {
  const h = harness({ ready: false });
  const pending = await h.send('play', Date.now() + 60, true);
  const result = await h.result(pending.pending);
  assert.equal(result.reason, 'player-not-ready');
  assert.equal(h.clicks(), 0);
});

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
