import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../chrome-extension/protocol.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../chrome-extension/background.js', import.meta.url), 'utf8');
function harness({ access = Promise.resolve(), response = 200, offline = false } = {}) {
  let listener;
  const saved = { bridgeToken: 'dummy-pairing-token', bridgePort: 17864 };
  const events = [];
  const chrome = {
    storage: { local: {
      setAccessLevel(options) { events.push(['restrict', options.accessLevel]); return access; },
      async get(key) { events.push(['get', key]); return { [key]: saved[key] }; },
      async set(values) { Object.assign(saved, values); },
      async remove(key) { events.push(['remove', key]); delete saved[key]; },
    } },
    runtime: {
      onMessage: { addListener(fn) { listener = fn; } },
      onInstalled: { addListener() {} }, onStartup: { addListener() {} },
    },
    alarms: { onAlarm: { addListener() {} } },
  };
  const fetch = async (url, options) => {
    events.push(['post', url, JSON.parse(options.body)]);
    if (offline) throw Error('Offline');
    return { ok: response === 200, status: response, async json() { return response === 200 ? { ok: true } : { error: 'Failed' }; } };
  };
  vm.runInNewContext(source, { chrome, fetch, AbortSignal });
  return { saved, events, send: (message, sender = {}) => new Promise(resolve => listener(message, sender, resolve)) };
}

test('storage is restricted on each worker start before any token read or request', async () => {
  let allow;
  const access = new Promise(resolve => { allow = resolve; });
  const h = harness({ access });
  const request = h.send({ type: 'check' });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(h.events, [['restrict', 'TRUSTED_CONTEXTS']]);
  allow();
  assert.equal((await request).ok, true);
  assert.equal(h.events[1][1], 'bridgeToken');
});

test('storage restriction failure prevents authenticated requests', async () => {
  const h = harness({ access: Promise.reject(Error('Access restriction failed')) });
  assert.equal((await h.send({ type: 'check' })).ok, false);
  assert.deepEqual(h.events, [['restrict', 'TRUSTED_CONTEXTS']]);
});

for (const response of [200, 401]) {
  test(`unpair deletes the local token after server revocation or an already invalid token (${response})`, async () => {
    const h = harness({ response });
    assert.equal((await h.send({ type: 'unpair' })).ok, true);
    const post = h.events.find(e => e[0] === 'post');
    assert.equal(post[1], 'http://127.0.0.1:17864/unpair');
    assert.equal(post[2].token, 'dummy-pairing-token');
    assert.equal(h.events.at(-1)[0], 'remove');
    assert.equal(h.saved.bridgeToken, undefined);
  });
}
for (const config of [{ offline: true }, { response: 500 }]) {
  test(`unpair retains credentials for retry when revocation fails (${JSON.stringify(config)})`, async () => {
    const h = harness(config);
    assert.equal((await h.send({ type: 'unpair' })).ok, false);
    assert.equal(h.saved.bridgeToken, 'dummy-pairing-token');
    assert.ok(!h.events.some(e => e[0] === 'remove'));
  });
}

test('content scripts cannot invoke unpair or read the token through messages', async () => {
  const h = harness();
  assert.equal((await h.send({ type: 'unpair' }, { tab: { id: 1 }, url: 'https://music.youtube.com/' })).ok, false);
  assert.deepEqual(h.events, [['restrict', 'TRUSTED_CONTEXTS']]);
});
