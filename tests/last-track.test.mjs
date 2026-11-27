import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createFileStore } from '../streamdeck/src/adapters/file-store.cjs';
import { createLastTrack } from '../streamdeck/src/application/last-track.cjs';
import { normalizeState } from '../streamdeck/src/domain/player-state.cjs';

const image = 'data:image/png;base64,' + readFileSync(new URL(
  '../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/imgs/plugin/icon.png', import.meta.url)).toString('base64');
const song = (title, letter) => ({ title, artist: 'Artist', trackId: letter.repeat(11), cover: letter, playing: true });
function fixture(t) {
  const appData = mkdtempSync(join(tmpdir(), 'music-deck-last-track-'));
  t.after(() => rmSync(appData, { recursive: true, force: true }));
  const storage = createFileStore({ appData });
  const pair = token => storage.saveAuth({ origin: 'chrome-extension://' + 'a'.repeat(32), token: token.repeat(64) });
  pair('a');
  return { storage, pair, open: () => createLastTrack({ storage: createFileStore({ appData }), onChange() {} }),
    savedFile: join(appData, 'MusicDeckBridge', 'last-track.json') };
}

test('locally restores exactly one confirmed track with its matching raster after a new plugin instance', t => {
  const { open, storage } = fixture(t);
  const live = open();
  assert.equal(storage.readLastTrack(), null);
  live.observe({ ...song('Never played', 'b'), playing: false }, image);
  assert.equal(live.snapshot, null);
  live.observe({ ...song('Buffering', 'b'), playbackConfirmed: false }, image);
  assert.equal(live.snapshot, null);
  live.observe(song('First', 'a'), image);
  live.observe(song('Second', 'b'));
  assert.equal(live.snapshot.image, '', 'new track does not inherit previous artwork');
  live.observeArtwork('a', image);
  assert.equal(live.snapshot.image, '', 'late art cannot override a newer track');
  live.observeArtwork('b', image);
  const restored = open();
  assert.deepEqual(restored.snapshot, { title: 'Second', artist: 'Artist', trackId: 'bbbbbbbbbbb', image });
  assert.deepEqual(Object.keys(storage.readLastTrack()).sort(), ['scope', 'track']);
  assert.deepEqual(restored.snapshot, storage.readLastTrack().track, 'the newest track is the only saved record');
});

test('unpairing clears the stored song, and a mismatched pairing or malformed file cannot restore it', t => {
  const { storage, pair, open, savedFile } = fixture(t);
  const live = open();
  live.observe(song('Private track', 'a'), image);
  pair('b');
  assert.equal(open().snapshot, null, 'a new pairing cannot restore an older pairing’s song');
  live.resetPair();
  live.observe(song('New pairing', 'b'), image);
  storage.removeAuth();
  live.resetPair();
  assert.equal(storage.readLastTrack(), null);
  assert.equal(open().snapshot, null);
  writeFileSync(savedFile, '{');
  assert.equal(open().snapshot, null);
});

test('updates the saved volume and mute state while the confirmed track is paused', t => {
  const { open, storage } = fixture(t);
  const live = open();
  const track = song('Last played', 'a');
  live.observe(normalizeState({ ...track, volume: 63, muted: false }), image);
  live.observe(normalizeState({ ...track, playing: false, volume: 63, muted: true }));
  assert.equal(open().snapshot.muted, true);
  live.observe(normalizeState({ ...track, playing: false, volume: 0, muted: true }));
  live.observe(normalizeState({ ...track, playing: false }));
  live.observe(normalizeState({ ...song('Never played', 'b'), playing: false, volume: 90, muted: false }));
  assert.deepEqual(open().snapshot, { title: track.title, artist: track.artist, trackId: track.trackId,
    image, volume: 0, muted: true });
  assert.deepEqual(storage.readLastTrack().track, open().snapshot);

  live.observe(normalizeState(song('New track without volume', 'b')));
  assert.equal(open().snapshot.volume, undefined, 'an unknown volume must not become 0% or inherit another track’s settings');
});
