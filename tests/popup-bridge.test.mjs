import test from 'node:test';
import assert from 'node:assert/strict';
import { createBridgeFixture } from './helpers/bridge.mjs';

const state = { title: 'Popup song', artist: 'Artist', trackId: 'aaaaaaaaaaa', playing: true, rating: 'INDIFFERENT', volume: 55, muted: false };

test('popup endpoints authenticate and bind controls/artwork to the selected player and track', async t => {
  const bridge = await createBridgeFixture(t);
  assert.equal((await bridge.post('/control', { command: 'toggle' }, { origin: 'https://music.youtube.com' })).status, 403);
  assert.equal((await bridge.post('/artwork', { token: 'invalid' })).status, 401);
  const { body: { token } } = await bridge.post('/pair', { pin: '654321' });
  await bridge.post('/sync', { token, clientId: 10, state });
  await bridge.post('/sync', { token, clientId: 11, state: { ...state, standalone: true } });
  const { body: status } = await bridge.post('/status', { token });
  assert.equal(status.popupControls, true);
  assert.deepEqual(status.player, { id: '11', key: 'aaaaaaaaaaa', title: 'Popup song', artist: 'Artist', playing: true, rating: 'INDIFFERENT', volume: 55, muted: false, coverKey: '' });
  const command = { token, command: 'like', playerId: '11', trackKey: 'aaaaaaaaaaa' };
  assert.equal((await bridge.post('/control', { ...command, command: 'arbitrary' })).status, 400);
  for (const amount of [undefined, 0, 101, -101, 0.5, '5']) {
    assert.equal((await bridge.post('/control', { ...command, command: 'volume_delta', amount })).status, 400);
  }
  assert.equal((await bridge.post('/control', { ...command, playerId: '10' })).body.reason, 'player-changed');
  assert.equal((await bridge.post('/artwork', { ...command, coverKey: 'https://untrusted.test/image' })).body.image, '');
  await bridge.post('/sync', { token, clientId: 11, state: { ...state, standalone: true, trackId: 'bbbbbbbbbbb' } });
  assert.equal((await bridge.post('/control', command)).body.reason, 'player-changed');
  assert.equal((await bridge.post('/artwork', command)).body.reason, 'player-changed');
  assert.equal((await bridge.post('/control', { ...command, trackKey: 'bbbbbbbbbbb' }, { origin: 'chrome-extension://' + 'b'.repeat(32) })).status, 401);
  await bridge.post('/sync', { token, clientId: 11, state: { ...state, standalone: true, rating: null } });
  assert.equal((await bridge.post('/control', command)).body.reason, 'player-not-ready');
});

test('popup commands use the existing browser channel and wait for the execution acknowledgement', async t => {
  const bridge = await createBridgeFixture(t);
  const { body: { token } } = await bridge.post('/pair', { pin: '654321' });
  await bridge.post('/sync', { token, clientId: 12, state });
  for (const command of ['toggle', 'prev', 'next', 'like', 'dislike', 'mute', 'volume_delta']) {
    const listening = bridge.post('/browser-listen', { token, clientIds: [12], concurrent: true });
    // Establish the modern channel before sending a control: without a browser
    // poll the service intentionally accepts legacy tab-queue delivery.
    await new Promise(resolve => setTimeout(resolve, 40));
    let finished = false;
    const control = bridge.post('/control', { token, command, playerId: '12', trackKey: 'aaaaaaaaaaa', ...(command === 'volume_delta' ? { amount: -5 } : {}) })
      .then(result => { finished = true; return result; });
    const { body: { commands } } = await listening;
    assert.equal(commands.length, 1);
    assert.equal(commands[0].type, command);
    assert.equal(commands[0].preferredTabId, 12);
    assert.equal(commands[0].playerKey, 'aaaaaaaaaaa');
    if (command === 'volume_delta') assert.equal(commands[0].amount, -5);
    if (['like', 'dislike'].includes(command)) assert.equal(commands[0].trackKey, 'aaaaaaaaaaa');
    assert.equal(finished, false, 'dispatch alone does not establish successful execution');
    await bridge.post('/browser-result', { token, id: commands[0].id, ok: command !== 'dislike' });
    const result = await control;
    assert.equal(result.body.ok, command !== 'dislike');
    if (command === 'dislike') assert.equal(result.body.reason, 'command-failed');
  }
});

test('artwork endpoint returns only the currently selected cached image and cover revision', async t => {
  const { createHttpBridge } = await import('../streamdeck/src/adapters/http-bridge.cjs');
  let selected = ['12', { ...state, cover: 'https://i.ytimg.com/vi/a/cover.jpg', lastMediaSyncAt: Date.now() }];
  const cached = 'data:image/png;base64,AQID';
  const server = await createHttpBridge({
    session: { authorized: () => true, contact() {}, checkProtocol: () => true },
    players: { selected: () => selected }, commands: {},
    covers: { image: source => source === selected[1].cover ? cached : '', status: () => 'ready' },
    getPorts: () => ({ port: server.address().port }), version: '1.2.0-dev',
  }).bind(0);
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  async function request(body) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/artwork`, { method: 'POST',
      headers: { Origin: 'chrome-extension://' + 'a'.repeat(32), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal(response.status, 200);
    return response.json();
  }
  const body = { playerId: '12', trackKey: 'aaaaaaaaaaa', coverKey: selected[1].cover };
  assert.equal((await request(body)).image, cached);
  assert.equal((await request({ ...body, coverKey: 'old-cover' })).image, '');
  selected = ['13', { ...selected[1] }];
  assert.equal((await request(body)).reason, 'player-changed');
});
