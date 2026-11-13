import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function harness() {
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
    if (options.world === 'MAIN') return [{ result: { playing: state.playing, muted: state.muted === true } }];
    return [{ result: state }];
  } } };
  const context = vm.createContext({ chrome, URL, Date, MusicDeckBrowserChannel: { create: () => ({ async perform(command, allowed) {
    assert.equal(service.controlling(command.preferredTabId), true);
    inputs.push(command); beforeDispatch();
    return allowed(true);
  } }) } });
  vm.runInContext(readFileSync(new URL('../chrome-extension/background/local-player.js', import.meta.url), 'utf8'), context);
  service = context.MusicDeckLocalPlayer.create({ chrome, pageControls: { playerPlayback() {} }, contentScripts: [] });
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

test('standalone controls and artwork reject invalid commands, volume and non-CDN images', async () => {
  const h = harness();
  for (const amount of [-1, 101, 0.5, '50', undefined]) {
    assert.equal((await h.service.control({ command: 'volume_set', amount })).reason, 'invalid-command');
  }
  assert.equal((await h.service.control({ command: 'open' })).reason, 'invalid-command');
  for (const cover of ['http://localhost/image', 'https://untrusted.test/image', 'https://user:pass@i.ytimg.com/image']) {
    h.states.get(2).cover = cover;
    assert.equal((await h.service.check()).player.coverKey, '');
  }
  h.states.get(2).cover = 'https://lh3.googleusercontent.com/image';
  assert.equal((await h.service.check()).player.coverKey, 'https://lh3.googleusercontent.com/image');
  assert.equal(h.inputs.length, 0);
});
