import test from 'node:test';
import assert from 'node:assert/strict';
import { createBridgeFixture } from './helpers/bridge.mjs';
const prefix = 'io.github.minjungw00.musicdeckbridge.';

test('cold-start requests retain all button and dial inputs through startup and cancel on re-pairing', async t => {
  const bridge = await createBridgeFixture(t, { prefix: 'music-deck-launch-' });
  const post = bridge.post;
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
