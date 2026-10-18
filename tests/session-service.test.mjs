import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionService } from '../streamdeck/src/application/session-service.cjs';

const origin = 'chrome-extension://' + 'a'.repeat(32);

test('failed credential persistence keeps the existing pair and pending session intact', () => {
  const original = { token: 'old-token', origin };
  let saved = original, failWrite = true, failDelete = false, resets = 0;
  const session = createSessionService({ version: '1.1.2-dev', testPin: '654321', now: () => 10000,
    onChange() {}, resetPlayerState() {},
    storage: { readAuth: () => saved,
      saveAuth(value) { if (failWrite) throw Error('disk write failed'); saved = value; },
      removeAuth() { if (failDelete) throw Error('disk delete failed'); saved = null; } },
    commands: { reset() { resets++; }, polling: false, lastError: '' } });
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
