import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import artwork from '../chrome-extension/artwork-policy.js';
import commandPolicy from '../chrome-extension/command-policy.js';
import trackIdentity from '../chrome-extension/track-identity.js';
import playerPriority from '../chrome-extension/player-priority.js';
import { readFileSync } from 'node:fs';

function harness(saved = null) {
  const tabs = [{ id: 1, active: true }, { id: 2 }];
  const states = new Map([
    [1, { title: 'Browser song', artist: 'Artist', trackId: 'aaaaaaaaaaa', playing: true, volume: 60, rating: 'LIKE' }],
    [2, { title: 'Installed app song', artist: 'Artist', trackId: 'bbbbbbbbbbb', standalone: true, playing: false, volume: 45, rating: 'INDIFFERENT' }],
  ]);
  const inputs = [], reads = [];
  let beforeDispatch = () => {}, service;
  const chrome = { tabs: { query: async () => tabs }, scripting: { async executeScript(options) {
    reads.push(options);
    const state = states.get(options.target.tabId);
    if (options.world === 'MAIN') return [{ result: { playing: state.playing, muted: state.muted === true,
      observedTrackId: state.observedTrackId ?? state.trackId } }];
    return [{ result: state }];
  } } };
  const tabCommands = { async perform(command, allowed) {
    assert.equal(service.controlling(command.preferredTabId), command.type !== 'open');
    inputs.push(command); beforeDispatch();
    return command.type === 'open' ? true : allowed(true);
  } };
  const context = vm.createContext({ chrome, URL, Date, MusicDeckArtworkPolicy: artwork,
    MusicDeckCommandPolicy: commandPolicy, MusicDeckTrackIdentity: trackIdentity, MusicDeckPlayerPriority: playerPriority });
  for (const file of ['last-player.js', 'local-player.js']) {
    vm.runInContext(readFileSync(new URL(`../chrome-extension/background/${file}`, import.meta.url), 'utf8'), context);
  }
  const lastPlayer = { get: async () => context.MusicDeckLastPlayer.normalize(saved) };
  let elapsed = 0;
  service = context.MusicDeckLocalPlayer.create({ chrome, pageControls: { playerPlayback() {} }, tabCommands,
    lastPlayer, now: () => elapsed, wait: async ms => { elapsed += ms; } });
  return { service, tabs, states, inputs, reads, beforeDispatch(fn) { beforeDispatch = fn; } };
}

test('standalone selection prefers the installed app and reads actual player/mute/volume state without HTTP or credentials', async () => {
  const h = harness();
  const state = await h.service.check();
  assert.equal(state.mode, 'local'); assert.equal(state.popupVolume, true);
  assert.equal(state.player.id, '2'); assert.equal(state.player.volume, 45);
  assert.equal(state.player.playing, false);
  h.tabs.pop();
  assert.equal((await h.service.check()).player.id, '1');
  h.tabs.pop();
  assert.equal((await h.service.check()).active, false);
});

test('standalone controls revalidate the selected track and expose a tab-scoped lease only during execution', async () => {
  const h = harness();
  const input = { command: 'volume_set', amount: 0, playerId: '2', trackKey: 'bbbbbbbbbbb' };
  assert.equal((await h.service.control(input)).ok, true);
  assert.equal(h.inputs[0].amount, 0);
  assert.equal(h.service.controlling(2), false);
  h.beforeDispatch(() => { h.states.get(2).trackId = 'ccccccccccc'; });
  assert.equal((await h.service.control(input)).ok, false);
  assert.equal(h.service.controlling(2), false);
  assert.equal((await h.service.control(input)).reason, 'player-changed');
});

test('standalone selection ignores a tab whose title and playback observation refer to different tracks', async () => {
  const h = harness();
  h.states.get(2).observedTrackId = 'ccccccccccc';
  assert.equal((await h.service.check()).player.id, '1');
  const result = await h.service.control({ command: 'toggle', playerId: '2', trackKey: 'bbbbbbbbbbb' });
  assert.equal(result.reason, 'player-changed');
  assert.equal(h.inputs.length, 0);
});

test('standalone controls and artwork reject invalid commands, volume and non-CDN images', async () => {
  const h = harness();
  for (const amount of [-1, 101, 0.5, '50', undefined]) {
    assert.equal((await h.service.control({ command: 'volume_set', amount })).reason, 'invalid-command');
  }
  assert.equal((await h.service.control({ command: 'open' })).reason, 'invalid-command');
  assert.equal((await h.service.control({ command: 'volume_delta', amount: 5 })).reason, 'invalid-command');
  for (const cover of ['http://localhost/image', 'https://untrusted.test/image', 'https://user:pass@i.ytimg.com/image']) {
    h.states.get(2).cover = cover;
    assert.equal((await h.service.check()).player.coverKey, '');
  }
  h.states.get(2).cover = 'https://lh3.googleusercontent.com/image';
  assert.equal((await h.service.check()).player.coverKey, 'https://lh3.googleusercontent.com/image');
  assert.equal(h.inputs.length, 0);
});

test('popup Open prefers the selected PWA and never acquires a playback lease', async () => {
  const h = harness();
  assert.equal((await h.service.open()).ok, true);
  assert.equal(h.inputs[0].type, 'open');
  assert.equal(h.inputs[0].preferredTabId, 2);
  assert.equal(h.service.controlling(2), false);
});

test('saved popup commands reopen the saved video and dispatch to its live track only', async () => {
  const h = harness({ title: 'Saved song', artist: 'Artist', trackId: 'bbbbbbbbbbb' });
  h.tabs.length = 0;
  assert.equal((await h.service.check()).savedPlayer.title, 'Saved song');
  h.beforeDispatch(() => { if (!h.tabs.length) h.tabs.push({ id: 2, active: true }); });
  const request = { command: 'toggle', trackKey: 'bbbbbbbbbbb' };
  assert.equal((await h.service.savedControl(request)).ok, true);
  assert.equal(h.inputs[0].videoId, 'bbbbbbbbbbb');
  assert.equal(h.inputs[1].playerKey, 'bbbbbbbbbbb');
  assert.equal(h.inputs[1].nativeLaunched, true, 'offline Play must not pause a player that starts automatically');
  h.states.get(2).trackId = 'ccccccccccc';
  assert.equal((await h.service.savedControl({ ...request, command: 'like' })).reason, 'player-changed');
  assert.equal(h.inputs.length, 2, 'a stale rating cannot reach the new track');
});
