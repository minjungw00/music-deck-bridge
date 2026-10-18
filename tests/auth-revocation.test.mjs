import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createBridgeFixture, extensionOrigin as origin } from './helpers/bridge.mjs';
const action = 'io.github.minjungw00.musicdeckbridge.nowplaying';

test('re-pairing and unpairing revoke old polls, commands and persisted authentication', async t => {
  const bridge = await createBridgeFixture(t, { prefix: 'music-deck-revoke-' });
  const temp = bridge.directory;
  const post = (route, body, requestOrigin = origin) => bridge.post(route, body, { origin: requestOrigin });
  try {
    const first = (await post('/pair', { pin: '654321' })).body.token;
    const state = { title: 'Old session', playing: true };
    await post('/sync', { token: first, clientId: 1, state });
    await post('/sync', { token: first, clientId: 2, state: { ...state, standalone: true } });
    const pending = post('/listen', { token: first, clientId: 1 });
    const pendingBrowser = post('/browser-listen', { token: first });
    await new Promise(resolve => setTimeout(resolve, 60));
    // Queue a command for a different client, so it survives until re-pairing.
    await post('/__test/command', { token: first, type: 'next' });
    assert.equal((await post('/unpair', { token: first }, 'chrome-extension://' + 'b'.repeat(32))).status, 401);
    assert.equal((await post('/unpair', { token: 'wrong' })).status, 401);
    assert.equal((await post('/browser-listen', { token: 'wrong' })).status, 401);
    assert.equal((await post('/browser-result', { token: 'wrong', id: 'request', ok: true })).status, 401);
    await post('/__test/event', { token: first, event: {
      event: 'sendToPlugin', action, context: 'key', payload: { type: 'generate-pin' },
    } });
    const second = (await post('/pair', { pin: '654321' })).body.token;
    assert.notEqual(second, first);
    assert.equal((await pending).status, 401);
    assert.equal((await pendingBrowser).status, 401);
    assert.equal((await post('/status', { token: first })).status, 401);
    assert.equal((await post('/status', { token: second })).body.active, false);
    assert.deepEqual((await post('/sync', { token: second, clientId: 2, state })).body.commands, []);
    const pendingUnpair = post('/listen', { token: second, clientId: 2 });
    const pendingBrowserUnpair = post('/browser-listen', { token: second });
    await new Promise(resolve => setTimeout(resolve, 60));
    assert.equal((await post('/unpair', { token: second })).status, 200);
    assert.equal((await pendingUnpair).status, 401);
    assert.equal((await pendingBrowserUnpair).status, 401);
    assert.equal(existsSync(join(temp, 'MusicDeckBridge', 'auth.json')), false);
    assert.equal((await post('/sync', { token: second, clientId: 2, state })).status, 401);
    await bridge.stop();
    await bridge.start();
    assert.equal((await post('/status', { token: second })).status, 401, 'revoked token must remain invalid after restart');
  } finally { await bridge.stop(); }
});
