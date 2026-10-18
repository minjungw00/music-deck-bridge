import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function deferred() {
  let resolve;
  const promise = new Promise(yes => { resolve = yes; });
  return { promise, resolve };
}
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

function harness({ paired = true, pairReply, tokenWrite, portReply } = {}) {
  const context = vm.createContext({});
  vm.runInContext(readFileSync(new URL('../chrome-extension/background/management-service.js', import.meta.url), 'utf8'), context);
  const state = { token: paired ? 'old-fixture-token' : '', serverToken: paired ? 'old-fixture-token' : '',
    port: 17864, serverPort: 17864, savingToken: false, failUnpair: false };
  const requests = [];
  const client = {
    compatibility: { compatible: true },
    pairedToken: async () => state.token,
    configuredPort: async () => state.port,
    validPort: port => Number.isInteger(port) && port >= 1024 && port <= 65535,
    async setLocalPort(port) { state.port = port; },
    async saveToken(token) { state.savingToken = true; await tokenWrite; state.token = token; },
    async removeToken() { state.token = ''; },
    clearCompatibility() { client.compatibility = null; },
    async post(route, body) {
      requests.push({ route, port: state.port });
      if (state.port !== state.serverPort) throw Error('fixture unreachable port');
      if (route === '/pair') {
        state.serverToken = 'new-fixture-token';
        await pairReply;
        return { token: state.serverToken };
      }
      if (route === '/unpair' && state.failUnpair) {
        state.failUnpair = false;
        throw Object.assign(Error('fixture unavailable'), { httpStatus: 500 });
      }
      if (!body.token || body.token !== state.serverToken) throw Object.assign(Error('fixture unauthorized'), { httpStatus: 401 });
      if (route === '/unpair') { state.serverToken = ''; return { ok: true }; }
      if (route === '/configure-port') {
        state.serverPort = body.port;
        await portReply;
        return { port: body.port };
      }
      assert.equal(route, '/status');
      return { paired: true, serverPort: state.serverPort };
    },
  };
  const service = context.MusicDeckManagementService.create({ client, browserChannel: { start() {} } });
  return { service, state, requests, client };
}

for (const paired of [false, true]) {
  test(`unpair waits for both pairing response and credential persistence (previous pair: ${paired})`, async () => {
    const reply = deferred(), write = deferred();
    const h = harness({ paired, pairReply: reply.promise, tokenWrite: write.promise });
    const pair = h.service.pair({ pin: '654321' }); await flush();
    let finished = false;
    const unpair = h.service.unpair().then(result => { finished = true; return result; }); await flush();
    assert.equal(finished, false, 'unpair must not complete while pairing is in flight');
    assert.deepEqual(h.requests.map(request => request.route), ['/pair']);
    reply.resolve(); await flush();
    assert.equal(h.state.savingToken, true);
    assert.equal(finished, false, 'the queue must also await local credential writes');
    write.resolve();
    assert.equal((await pair).ok, true);
    assert.equal((await unpair).ok, true);
    assert.equal(h.state.token, '');
    assert.equal(h.state.serverToken, '');
    assert.equal(h.client.compatibility, null);
    assert.deepEqual(h.requests.map(request => request.route), ['/pair', '/unpair']);
  });
}

test('port changes and following reads observe the completed preceding management operation', async () => {
  const reply = deferred();
  const h = harness({ portReply: reply.promise });
  const first = h.service.setPort({ port: 23111 }); await flush();
  const second = h.service.setPort({ port: 23112 });
  const read = h.service.getPort(), check = h.service.check(); await flush();
  assert.deepEqual(h.requests, [{ route: '/configure-port', port: 17864 }]);
  reply.resolve();
  assert.equal((await first).localOnly, false);
  assert.equal((await second).localOnly, false);
  assert.equal((await read).port, 23112);
  assert.equal((await check).serverPort, 23112);
  assert.equal(h.state.port, 23112);
  assert.equal(h.state.serverPort, 23112);
  assert.deepEqual(h.requests, [
    { route: '/configure-port', port: 17864 },
    { route: '/configure-port', port: 23111 },
    { route: '/status', port: 23112 },
  ]);
});

test('failed revocation preserves credentials and allows queued port changes and a later unpair', async () => {
  const h = harness(); h.state.failUnpair = true;
  const failure = assert.rejects(h.service.unpair(), /Could not unpair/);
  const change = h.service.setPort({ port: 23111 });
  await failure;
  assert.equal(h.state.token, 'old-fixture-token');
  assert.equal((await change).localOnly, false);
  assert.equal((await h.service.unpair()).ok, true);
  assert.equal(h.state.serverToken, '');
  assert.equal(h.state.token, '');
});
