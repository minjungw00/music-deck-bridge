import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../chrome-extension/background.js', import.meta.url), 'utf8');

function harness({ tabs = [], response = true } = {}) {
  const calls = [];
  const storage = { bridgeToken: '' };
  const chrome = {
    storage: { local: { setAccessLevel: async () => {},
      get: async key => ({ [key]: storage[key] }), set: async values => Object.assign(storage, values) } },
    runtime: { onMessage: { addListener() {} }, onInstalled: { addListener() {} }, onStartup: { addListener() {} } },
    alarms: { onAlarm: { addListener() {} } },
    tabs: {
      async query(filter) { calls.push(['query', filter]); return tabs; },
      async create(options) { calls.push(['create', options]); return { id: 100 }; },
      async update(id, options) { calls.push(['update', id, options]); },
      async sendMessage(id, msg, options) { calls.push(['message', id, msg, options]); return { ok: response }; },
    },
    windows: { async update(id, options) { calls.push(['focus', id, options]); } },
    scripting: { async executeScript(options) { calls.push(['script', options]); } },
  };
  const context = vm.createContext({ chrome, AbortSignal });
  vm.runInContext(source + '\nthis.api = { performBrowserCommand, startBrowserListener };', context);
  return { api: context.api, calls, storage, context };
}

test('open and playback requests create a music tab when there is no player', async () => {
  for (const type of ['open', 'toggle']) {
    const h = harness();
    assert.equal(await h.api.performBrowserCommand({ type }), true);
    const creates = h.calls.filter(c => c[0] === 'create');
    assert.equal(creates.length, 1);
    assert.equal(creates[0][1].url, 'https://music.youtube.com/');
    assert.equal(creates[0][1].active, true);
    assert.ok(!h.calls.some(c => c[0] === 'message'), 'opening must not toggle/autoplay a newly loaded player');
  }
});

test('open reuses and focuses the selected PWA instead of creating duplicate tabs', async () => {
  const h = harness({ tabs: [{ id: 1, windowId: 10, active: true }, { id: 2, windowId: 20 }] });
  assert.equal(await h.api.performBrowserCommand({ type: 'open', preferredTabId: 2 }), true);
  assert.equal(h.calls.find(c => c[0] === 'update')[1], 2);
  assert.equal(h.calls.find(c => c[0] === 'focus')[1], 20);
  assert.ok(!h.calls.some(c => ['message', 'create'].includes(c[0])));
});

test('playback targets only the selected top frame and does not focus an existing player', async () => {
  const h = harness({ tabs: [{ id: 1, windowId: 10 }, { id: 2, windowId: 20 }] });
  assert.equal(await h.api.performBrowserCommand({ type: 'toggle', preferredTabId: 2 }), true);
  const msg = h.calls.find(c => c[0] === 'message');
  assert.equal(msg[1], 2);
  assert.equal(msg[2].type, 'bridge-toggle');
  assert.equal(msg[3].frameId, 0);
  assert.ok(!h.calls.some(c => ['focus', 'update', 'create'].includes(c[0])));
  assert.equal(await h.api.performBrowserCommand({ type: 'arbitrary', url: 'https://example.com' }), false);
});

test('discarded, frozen or loading players are restored without opening another tab', async () => {
  for (const state of [{ discarded: true }, { frozen: true }, { status: 'loading' }]) {
    const h = harness({ tabs: [{ id: 1, windowId: 10, ...state }] });
    assert.equal(await h.api.performBrowserCommand({ type: 'toggle' }), true);
    assert.ok(h.calls.some(c => c[0] === 'update'));
    assert.ok(!h.calls.some(c => ['message', 'create'].includes(c[0])));
  }
});

test('paired worker listens without music tabs and acknowledges each command once', async () => {
  const h = harness();
  await new Promise(resolve => setImmediate(resolve));
  const requests = [];
  h.storage.bridgeToken = 'paired-token';
  h.context.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    requests.push([url, body]);
    if (url.endsWith('/browser-result')) {
      h.storage.bridgeToken = '';
      return { ok: true, json: async () => ({ ok: true }) };
    }
    return { ok: true, json: async () => ({ commands: [{ id: 'request', type: 'open' }] }) };
  };
  await h.api.startBrowserListener();
  assert.equal(requests.length, 2);
  assert.ok(requests[0][0].endsWith('/browser-listen'));
  assert.equal(requests[0][1].token, 'paired-token');
  assert.equal(requests[1][1].id, 'request');
  assert.equal(requests[1][1].ok, true);
  assert.equal(h.calls.filter(c => c[0] === 'create').length, 1);
});

test('revoking pairing after a response prevents the received browser command from executing', async () => {
  const h = harness();
  await new Promise(resolve => setImmediate(resolve));
  h.storage.bridgeToken = 'old-token';
  h.context.fetch = async () => {
    h.storage.bridgeToken = '';
    return { ok: true, json: async () => ({ commands: [{ id: 'request', type: 'open' }] }) };
  };
  await h.api.startBrowserListener();
  assert.equal(h.calls.length, 0);
});
