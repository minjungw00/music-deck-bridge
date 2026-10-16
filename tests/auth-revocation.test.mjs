import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const plugin = fileURLToPath(new URL('../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/bin/plugin.js', import.meta.url));
const origin = 'chrome-extension://' + 'a'.repeat(32);
const action = 'io.github.minjungw00.musicdeckbridge.nowplaying';

test('re-pairing and unpairing revoke old polls, commands and persisted authentication', async () => {
  const temp = mkdtempSync(join(tmpdir(), 'music-deck-revoke-'));
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  let proc;
  async function start() {
    proc = spawn(process.execPath, [plugin], {
      env: { ...process.env, APPDATA: temp, MUSIC_DECK_BRIDGE_DEV_TEST: '1',
        MUSIC_DECK_BRIDGE_TEST_PORT: String(port), MUSIC_DECK_BRIDGE_TEST_PIN: '654321' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    for (const stream of [proc.stdout, proc.stderr]) stream.on('data', b => { output += b; });
    for (let i = 0; i < 100; i++) {
      if (output.includes('Loopback bridge on')) return;
      if (proc.exitCode !== null) throw Error(output);
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    throw Error('Bridge startup timeout: ' + output);
  }
  async function post(route, body, requestOrigin = origin) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`, {
      method: 'POST', headers: { Origin: requestOrigin, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(2500),
    });
    return { status: response.status, body: await response.json() };
  }
  async function stop() { const exited = once(proc, 'exit'); proc.kill(); await exited; }
  try {
    await start();
    const first = (await post('/pair', { pin: '654321' })).body.token;
    const state = { title: 'Old session', playing: true };
    await post('/sync', { token: first, clientId: 1, state });
    await post('/sync', { token: first, clientId: 2, state: { ...state, standalone: true } });
    const pending = post('/listen', { token: first, clientId: 1 });
    await new Promise(resolve => setTimeout(resolve, 60));
    // Queue a command for a different client, so it survives until re-pairing.
    await post('/__test/command', { token: first, type: 'next' });
    assert.equal((await post('/unpair', { token: first }, 'chrome-extension://' + 'b'.repeat(32))).status, 401);
    assert.equal((await post('/unpair', { token: 'wrong' })).status, 401);
    await post('/__test/event', { token: first, event: {
      event: 'sendToPlugin', action, context: 'key', payload: { type: 'generate-pin' },
    } });
    const second = (await post('/pair', { pin: '654321' })).body.token;
    assert.notEqual(second, first);
    assert.equal((await pending).status, 401);
    assert.equal((await post('/status', { token: first })).status, 401);
    assert.equal((await post('/status', { token: second })).body.active, false);
    assert.deepEqual((await post('/sync', { token: second, clientId: 2, state })).body.commands, []);
    const pendingUnpair = post('/listen', { token: second, clientId: 2 });
    await new Promise(resolve => setTimeout(resolve, 60));
    assert.equal((await post('/unpair', { token: second })).status, 200);
    assert.equal((await pendingUnpair).status, 401);
    assert.equal(existsSync(join(temp, 'MusicDeckBridge', 'auth.json')), false);
    assert.equal((await post('/sync', { token: second, clientId: 2, state })).status, 401);
    await stop();
    await start();
    assert.equal((await post('/status', { token: second })).status, 401, 'revoked token must remain invalid after restart');
  } finally {
    if (proc?.exitCode === null) await stop();
    rmSync(temp, { recursive: true, force: true });
  }
});
