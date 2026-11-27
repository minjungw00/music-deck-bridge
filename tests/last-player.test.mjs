import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import artwork from '../chrome-extension/artwork-policy.js';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../chrome-extension/background/last-player.js', import.meta.url), 'utf8');
const track = (id, title, fields = {}) => ({ trackId: id.repeat(11), title, artist: 'Artist', trackConfirmed: true, ...fields });

test('Chrome stores one selected track before playback and restores it in a fresh extension worker', async () => {
  const context = vm.createContext({ MusicDeckArtworkPolicy: artwork });
  vm.runInContext(source, context);
  let saved = {}, time = 0, writes = 0;
  const storage = { get: async () => saved, async set(data) { saved = data; writes++; }, async remove() { saved = {}; } };
  const open = () => context.MusicDeckLastPlayer.create({ storage, ready: Promise.resolve(), now: () => ++time });
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
