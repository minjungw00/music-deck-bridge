import test from 'node:test';
import assert from 'node:assert/strict';
import { playerHarness } from './helpers/player.mjs';

function harness({ ready = true, blocked = false, error = false, noEffect = false } = {}) {
  const player = playerHarness();
  let state = 2, track = 'aaaaaaaaaaa', clicks = 0, time = 0;
  const listeners = new Map();
  const api = {
    isReady: () => ready,
    getPlayerState: () => state,
    getVideoData: () => ({ video_id: track }),
    getCurrentTime: () => time,
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
      if (type === 'toggle') state = state === 1 ? 2 : 1;
      else if (type === 'prev' && time > 5) time = 0;
      else track = type === 'next' ? 'bbbbbbbbbbb' : 'ccccccccccc';
    },
  });
  const buttons = { '.play-pause-button': button('toggle'), '.next-button': button('next'), '.previous-button': button('prev') };
  player.setDocument({
    querySelector: selector => selector === '#movie_player' ? api : buttons[selector.replace('ytmusic-player-bar ', '')] || null,
    querySelectorAll: selector => selector === 'video, audio' ? [player.audio] : [],
  });
  return { player, listeners, clicks: () => clicks, ready: value => { ready = value; },
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
