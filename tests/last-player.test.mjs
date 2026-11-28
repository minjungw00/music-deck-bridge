import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import artwork from '../chrome-extension/artwork-policy.js';
import trackIdentity from '../chrome-extension/track-identity.js';
import playerPriority from '../chrome-extension/player-priority.js';
import playerState from '../streamdeck/src/domain/player-state.cjs';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../chrome-extension/background/last-player.js', import.meta.url), 'utf8');
const track = (id, title, fields = {}) => ({ trackId: id.repeat(11), title, artist: 'Artist', trackConfirmed: true, ...fields });

function openCache(storage, now = Date.now) {
  const context = vm.createContext({ MusicDeckArtworkPolicy: artwork, MusicDeckTrackIdentity: trackIdentity,
    MusicDeckPlayerPriority: playerPriority });
  vm.runInContext(source, context);
  return context.MusicDeckLastPlayer.create({ storage, ready: Promise.resolve(), now });
}

test('Chrome and Stream Deck keep the same title and artist key when no video ID is available', async () => {
  const prefix = 'a'.repeat(179);
  const state = { title: `${prefix} next`, artist: '  Artist\u0000Name  ', trackId: 'invalid', trackConfirmed: true };
  const expected = JSON.stringify([`${prefix} `, 'Artist Name']);
  const lastTrack = openCache({ async set() {} });
  await lastTrack.observe({ id: 1 }, state);
  assert.equal((await lastTrack.get()).key, expected);
  assert.equal(playerState.trackKey(playerState.normalizeState(state)), expected);
});

test('Chrome stores one selected track before playback and restores it in a fresh extension worker', async () => {
  let saved = {}, time = 0, writes = 0;
  const storage = { get: async () => saved, async set(data) { saved = data; writes++; }, async remove() { saved = {}; } };
  const open = () => openCache(storage, () => ++time);
  const cache = open();
  await cache.observe({ id: 1 }, track('a', 'Previous song', { playing: true, rating: 'LIKE' }));
  await cache.observe({ id: 2 }, track('b', 'Imported playlist song', { standalone: true, volume: 0, shuffleEnabled: false }));
  await cache.observe({ id: 1 }, track('a', 'Previous song', { playing: true }));
  cache.remove(2);
  cache.remove(1);
  assert.equal(writes, 2);
  assert.deepEqual(Object.keys(saved), ['lastTrack']);
  const restored = open();
  assert.equal((await restored.get()).title, 'Imported playlist song');
  assert.equal((await restored.get()).rating, null, 'a previous song’s rating does not carry over');
  assert.equal((await restored.get()).volume, 0);
  assert.equal((await restored.get()).shuffleEnabled, false);
  await restored.clear();
  assert.equal(await open().get(), null);
});

test('a transient read failure is retried by the same worker', async () => {
  let reads = 0;
  const cache = openCache({ async get() {
    if (++reads === 1) throw Error('Read failed');
    return { lastTrack: track('a', 'Stored song') };
  } });
  assert.equal(await cache.get(), null);
  assert.equal((await cache.get())?.title, 'Stored song');
  assert.equal(reads, 2);
});

test('a repeated provisional observation can save the new selected player after a prior tab closes', async () => {
  let saved = {}, writes = 0, time = 0;
  const storage = { get: async () => saved, async set(data) { saved = data; writes++; } };
  const cache = openCache(storage, () => ++time);
  const previous = track('a', 'Playing song', { playing: true });
  const restored = track('b', 'Restored song');
  await cache.observe({ id: 1 }, previous);
  await cache.observe({ id: 2 }, restored, true);
  await cache.observe({ id: 2 }, { ...restored, repeatMode: 'ONE', volume: 25 });
  assert.equal((await cache.get()).title, previous.title);

  cache.remove(1);
  await cache.observe({ id: 2 }, { ...restored, volume: 0 }, true);
  await cache.observe({ id: 2 }, restored, true);
  const { title, repeatMode, volume } = await openCache(storage).get();
  assert.deepEqual({ title, repeatMode, volume }, { title: restored.title, repeatMode: 'ONE', volume: 25 });
  assert.equal(writes, 2);
});

test('Chrome retains the foreground track through alternating background observations', async () => {
  const writes = [];
  const cache = openCache({ async set({ lastTrack }) { writes.push(lastTrack.title); } });
  const a = track('a', 'First song');
  const b = track('b', 'Second song');
  await cache.observe({ id: 1 }, a, false, { tabId: 1, observedAt: 1 });
  await cache.observe({ id: 2 }, b, false, { tabId: 1, observedAt: 2 });
  await cache.observe({ id: 2 }, b, false, { tabId: 2, observedAt: 4 });
  await cache.observe({ id: 1 }, a, false, { tabId: 1, observedAt: 3 });
  await cache.observe({ id: 1 }, a, true);
  await cache.observe({ id: 2 }, b, false, { tabId: null, observedAt: 5 });
  await cache.observe({ id: 1 }, a, false);
  assert.equal((await cache.get()).title, b.title);
  assert.deepEqual(writes, [a.title, b.title]);
});

test('clearing waits for removal and can be retried after a storage failure', async () => {
  let record = { lastTrack: track('a', 'Stored song') }, attempts = 0;
  const storage = { get: async () => record, async remove() {
    if (++attempts === 1) throw Error('Remove failed');
    record = {};
  } };
  const cache = openCache(storage);
  await assert.rejects(cache.clear(), /Remove failed/);
  assert.equal(await cache.get(), null);
  assert.equal((await openCache(storage).get()).title, 'Stored song');
  await cache.clear();
  assert.equal(await openCache(storage).get(), null);
});

test('clearing separates an in-flight write from a later standalone observation', async () => {
  const events = [];
  let started, release;
  const writing = new Promise(resolve => { started = resolve; });
  const blocked = new Promise(resolve => { release = resolve; });
  const cache = openCache({ async set({ lastTrack }) {
    events.push(lastTrack.title);
    if (events.length === 1) { started(); await blocked; }
  }, async remove() { events.push('removed'); } });
  const first = cache.observe({ id: 1 }, track('a', 'Earlier song'));
  await writing;
  const clear = cache.clear();
  const next = cache.observe({ id: 2 }, track('b', 'Standalone song'));
  release();
  await Promise.all([first, clear, next]);
  assert.deepEqual(events, ['Earlier song', 'removed', 'Standalone song']);
});
