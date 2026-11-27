import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import artwork from '../chrome-extension/artwork-policy.js';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../chrome-extension/background/last-player.js', import.meta.url), 'utf8');
const track = (id, title, fields = {}) => ({ trackId: id.repeat(11), title, artist: 'Artist', trackConfirmed: true, ...fields });

function openCache(storage, now = Date.now) {
  const context = vm.createContext({ MusicDeckArtworkPolicy: artwork });
  vm.runInContext(source, context);
  return context.MusicDeckLastPlayer.create({ storage, ready: Promise.resolve(), now });
}

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
