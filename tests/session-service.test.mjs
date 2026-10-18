import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionCoordinator } from '../streamdeck/src/application/session-coordinator.cjs';
import { createCommandService } from '../streamdeck/src/application/command-service.cjs';

const origin = 'chrome-extension://' + 'a'.repeat(32);

test('failed credential persistence keeps the existing pair and pending session intact', () => {
  const original = { token: 'old-token', origin };
  let saved = original, failWrite = true, failDelete = false, resets = 0;
  const session = createSessionCoordinator({ version: '1.1.2-dev', testPin: '654321', now: () => 10000,
    onChange() {}, players: { reset() {} }, covers: { resetSelection() {} },
    storage: { readAuth: () => saved,
      saveAuth(value) { if (failWrite) throw Error('disk write failed'); saved = value; },
      removeAuth() { if (failDelete) throw Error('disk delete failed'); saved = null; } },
    commands: { reset() { resets++; }, clearProtocolError() {}, polling: false, lastError: '' } });
  session.generatePin();
  assert.throws(() => session.pair({ pin: '654321' }, origin), /disk write failed/);
  assert.equal(session.authorized({ token: original.token }, origin), true);
  assert.equal(resets, 0, 'failed pairing must not revoke commands or player state');
  failWrite = false;
  const paired = session.pair({ pin: '654321' }, origin);
  assert.equal(paired.status, 200);
  assert.equal(session.authorized({ token: original.token }, origin), false);
  assert.equal(session.authorized({ token: paired.data.token }, origin), true);
  assert.equal(resets, 1);
  failDelete = true;
  assert.throws(() => session.unpair(), /disk delete failed/);
  assert.equal(session.authorized({ token: paired.data.token }, origin), true);
  assert.equal(resets, 1, 'failed revocation retains the current session for retry');
  failDelete = false;
  session.unpair();
  assert.equal(session.paired, false);
  assert.equal(saved, null);
  assert.equal(resets, 2);
});

for (const blocked of [false, true]) {
  test(`failed pairing preserves ${blocked ? 'blocked' : 'compatible'} protocol state until credentials are saved`, async () => {
    let session, failWrite = true, resets = 0, timerId = 0;
    const timers = new Map();
    const commands = createCommandService({ getSession: () => session.access, selectedEntry: () => null,
      launch: async () => {}, log() {}, now: () => 10000,
      setTimeout(run) { const id = ++timerId; timers.set(id, run); return id; },
      clearTimeout: id => timers.delete(id) });
    session = createSessionCoordinator({ version: '1.1.2-dev', testPin: '654321', now: () => 10000,
      onChange() {}, commands, players: { reset() { resets++; } }, covers: { resetSelection() {} },
      storage: { readAuth: () => ({ token: 'old-token', origin }),
        saveAuth() { if (failWrite) throw Error('disk write failed'); } } });
    session.checkProtocol({ protocolVersion: blocked ? 2 : 1, minProtocolVersion: blocked ? 2 : 1,
      extensionVersion: '9.9.9' });
    session.generatePin();
    const pending = blocked ? null : commands.request('next');
    const before = { compatibility: session.compatibility, access: session.access,
      error: commands.lastError, pin: session.pin, expiresAt: session.expiresAt, resets, timers: timers.size };
    assert.throws(() => session.pair({ pin: '654321', protocolVersion: 1, minProtocolVersion: 1,
      extensionVersion: '1.1.2-dev' }, origin), /disk write failed/);
    assert.deepEqual({ compatibility: session.compatibility, access: session.access,
      error: commands.lastError, pin: session.pin, expiresAt: session.expiresAt, resets, timers: timers.size }, before);
    assert.equal(session.authorized({ token: 'old-token' }, origin), true);
    if (pending) {
      let delivered;
      commands.listenBrowser({ reply(data) { delivered = data.commands[0]; }, onClose() {} });
      assert.equal(delivered.type, 'next', 'the original pending input remains deliverable');
      commands.acknowledge(delivered.id, true);
      assert.equal(await pending, true);
    }
    failWrite = false;
    const paired = session.pair({ pin: '654321', protocolVersion: 1, minProtocolVersion: 1,
      extensionVersion: '1.1.2-dev' }, origin);
    assert.equal(paired.status, 200);
    assert.equal(session.access.generation, before.access.generation + 1);
    assert.equal(session.access.blocked, false);
    assert.equal(session.compatibility.extensionVersion, '1.1.2-dev');
    assert.equal(commands.lastError, '');
    assert.equal(session.authorized({ token: 'old-token' }, origin), false);
    assert.equal(resets, before.resets + 1);
    assert.equal(timers.size, 0);
  });
}
