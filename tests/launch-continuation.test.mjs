import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const plugin = fileURLToPath(new URL('../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/bin/plugin.js', import.meta.url));
const prefix = 'io.github.minjungw00.musicdeckbridge.';
const origin = 'chrome-extension://' + 'a'.repeat(32);

test('cold-start requests retain all button and dial inputs through startup and cancel on re-pairing', async t => {
  const temp = mkdtempSync(join(tmpdir(), 'music-deck-launch-'));
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const proc = spawn(process.execPath, [plugin], {
    env: { ...process.env, APPDATA: temp, MUSIC_DECK_BRIDGE_DEV_TEST: '1',
      MUSIC_DECK_BRIDGE_TEST_PORT: String(port), MUSIC_DECK_BRIDGE_TEST_PIN: '654321' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const closed = once(proc, 'close');
  t.after(async () => {
    if (proc.exitCode === null && proc.signalCode === null) proc.kill();
    await closed; rmSync(temp, { recursive: true, force: true });
  });
  let output = '';
  for (const stream of [proc.stdout, proc.stderr]) stream.on('data', chunk => { output += chunk; });
  for (let i = 0; !output.includes('Loopback bridge on'); i++) {
    assert.ok(i < 200 && proc.exitCode === null, output);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  async function post(route, body) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`, {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(3000),
    });
    return { status: response.status, body: await response.json() };
  }
  let token = (await post('/pair', { pin: '654321' })).body.token;
  async function event(name, event = 'keyDown', payload = {}) {
    const result = await post('/__test/event', { token, event: {
      event, action: prefix + name, context: name, payload,
    } });
    assert.equal(result.status, 200);
  }
  const types = ['prev', 'next', 'mute', 'like', 'dislike', 'toggle', 'open'];
  for (const name of types) await event(name);
  await event('open'); // Launch-only duplicates coalesce; functional inputs remain ordered.
  // Test mode skips native process creation but preserves its real timers and queue.
  await new Promise(resolve => setTimeout(resolve, 2200));
  const seen = new Set();
  for (const [index, type] of types.entries()) {
    const result = await post('/browser-listen', { token });
    assert.equal(result.status, 200);
    const commands = result.body.commands;
    assert.equal(commands.length, 1);
    const command = commands[0];
    assert.equal(command.type, type);
    assert.equal(command.nativeLaunched, index === 0);
    assert.equal(command.preferredTabId, null);
    assert.ok(command.expiresAt > Date.now());
    assert.ok(!seen.has(command.id)); seen.add(command.id);
    await post('/browser-result', { token, id: command.id, ok: true });
    await post('/browser-result', { token, id: command.id, ok: true }); // No replay on duplicate ACK.
  }
  await event('volume', 'willAppear', { settings: { volumeStep: 3 } });
  await event('volume', 'dialRotate', { ticks: 2 });
  await event('trackdial', 'dialRotate', { ticks: -3 });
  await event('volume', 'dialDown');
  await event('trackdial', 'touchTap');
  for (const [type, amount] of [['volume_delta', 6], ['prev', 0], ['prev', 0], ['prev', 0], ['mute', 0], ['toggle', 0]]) {
    const { body: { commands } } = await post('/browser-listen', { token });
    assert.equal(commands[0].type, type);
    assert.equal(commands[0].amount, amount);
    await post('/browser-result', { token, id: commands[0].id, ok: true });
  }
  await event('next');
  await event('nowplaying', 'sendToPlugin', { type: 'generate-pin' });
  token = (await post('/pair', { pin: '654321' })).body.token;
  const pending = post('/browser-listen', { token });
  await new Promise(resolve => setTimeout(resolve, 50));
  await post('/unpair', { token });
  assert.equal((await pending).status, 401, 'no queued old-session input may reach the replacement pairing');
});
