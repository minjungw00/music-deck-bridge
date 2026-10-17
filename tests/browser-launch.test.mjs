import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../chrome-extension/background.js', import.meta.url), 'utf8');

function harness({ tabs = [], response = true, injectionFailures = 0 } = {}) {
  const calls = [];
  const storage = { bridgeToken: '' };
  let now = Date.now();
  const chrome = {
    storage: { local: { setAccessLevel: async () => {},
      get: async key => ({ [key]: storage[key] }), set: async values => Object.assign(storage, values) } },
    runtime: { onMessage: { addListener() {} }, onInstalled: { addListener() {} }, onStartup: { addListener() {} } },
    alarms: { onAlarm: { addListener() {} } },
    tabs: {
      async query(filter) { calls.push(['query', filter]); return tabs; },
      async create(options) {
        calls.push(['create', options]);
        const tab = { id: 100, windowId: 30, status: 'loading' };
        tabs.push(tab); return tab;
      },
      async update(id, options) { calls.push(['update', id, options]); },
      async sendMessage(id, msg, options) {
        calls.push(['message', id, msg, options]);
        return typeof response === 'function' ? response(msg) : { ok: response };
      },
    },
    windows: { async update(id, options) { calls.push(['focus', id, options]); } },
    scripting: { async executeScript(options) {
      calls.push(['script', options]);
      if (injectionFailures-- > 0) throw Error('Document not ready');
    } },
  };
  const context = vm.createContext({ chrome, AbortSignal, Date: { now: () => now },
    setTimeout(fn, ms) { now += ms; queueMicrotask(fn); } });
  vm.runInContext(source + '\nthis.api = { performBrowserCommand, startBrowserListener };', context);
  return { api: context.api, calls, storage, context };
}

test('every control opens a missing player and then performs its original input', async () => {
  for (const type of ['open', 'toggle', 'prev', 'next', 'mute', 'volume_delta', 'like', 'dislike']) {
    const h = harness({ injectionFailures: 1 });
    assert.equal(await h.api.performBrowserCommand({ id: type, type, amount: 8 }), true);
    const creates = h.calls.filter(c => c[0] === 'create');
    assert.equal(creates.length, 1);
    assert.equal(creates[0][1].url, 'https://music.youtube.com/');
    const messages = h.calls.filter(c => c[0] === 'message');
    assert.equal(messages.length, type === 'open' ? 0 : 1);
    if (messages.length) {
      assert.equal(messages[0][2].command.type, type === 'toggle' ? 'play' : type);
      assert.equal(messages[0][2].command.amount, 8);
      assert.equal(messages[0][2].id, type);
    }
  }
});

test('open reuses and focuses the selected PWA instead of creating duplicate tabs', async () => {
  const h = harness({ tabs: [{ id: 1, windowId: 10, active: true }, { id: 2, windowId: 20 }] });
  assert.equal(await h.api.performBrowserCommand({ type: 'open', preferredTabId: 2 }), true);
  assert.equal(h.calls.find(c => c[0] === 'update')[1], 2);
  assert.equal(h.calls.find(c => c[0] === 'focus')[1], 20);
  assert.ok(!h.calls.some(c => ['message', 'create'].includes(c[0])));
});

test('existing players receive the selected control only in their top frame without focus changes', async () => {
  const h = harness({ tabs: [{ id: 1, windowId: 10 }, { id: 2, windowId: 20 }] });
  assert.equal(await h.api.performBrowserCommand({ type: 'toggle', preferredTabId: 2 }), true);
  const msg = h.calls.find(c => c[0] === 'message');
  assert.equal(msg[1], 2);
  assert.equal(msg[2].type, 'bridge-command');
  assert.equal(msg[2].command.type, 'toggle');
  assert.equal(msg[3].frameId, 0);
  assert.ok(!h.calls.some(c => ['focus', 'update', 'create'].includes(c[0])));
  assert.equal(await h.api.performBrowserCommand({ type: 'arbitrary', url: 'https://example.com' }), false);
});

test('discarded, frozen and loading players receive the requested input after resuming', async () => {
  for (const state of [{ discarded: true }, { frozen: true }, { status: 'loading' }]) {
    let attempts = 0;
    const h = harness({ tabs: [{ id: 1, windowId: 10, ...state }],
      response: () => ++attempts === 1 ? { ok: false, retry: true } : { ok: true } });
    assert.equal(await h.api.performBrowserCommand({ type: 'next', id: 'resume' }), true);
    assert.ok(h.calls.some(c => c[0] === 'update'));
    assert.equal(attempts, 2);
    assert.ok(!h.calls.some(c => c[0] === 'create'));
  }
});

test('commands wait for readiness with a deadline and never retry an ambiguous delivery', async () => {
  const waiting = harness({ response: () => ({ ok: false, retry: true }) });
  assert.equal(await waiting.api.performBrowserCommand({ type: 'like' }), false);
  assert.ok(waiting.calls.filter(c => c[0] === 'message').length > 1);
  const failed = harness({ response: () => { throw Error('Reply lost'); } });
  assert.equal(await failed.api.performBrowserCommand({ type: 'next' }), false);
  assert.equal(failed.calls.filter(c => c[0] === 'message').length, 1);
});

test('newly opened players use their restored current track while existing players keep stale-track protection', async () => {
  for (const existing of [false, true]) {
    const h = harness({ tabs: existing ? [{ id: 1, windowId: 10 }] : [] });
    assert.equal(await h.api.performBrowserCommand({ type: 'like', trackKey: 'previous-track' }), true);
    const input = h.calls.find(c => c[0] === 'message')[2].command;
    assert.equal(input.trackKey, existing ? 'previous-track' : undefined);
    assert.equal(input.allowCurrentTrack, !existing);
  }
});

test('pairing is rechecked after loading and before performing the pending input', async () => {
  let checks = 0;
  const h = harness();
  assert.equal(await h.api.performBrowserCommand({ type: 'next' }, async () => ++checks < 3), false);
  assert.ok(!h.calls.some(c => c[0] === 'message'));
});

test('native startup reuses its music tab and still performs the requested input', async () => {
  const h = harness({ tabs: [{ id: 7, windowId: 8 }] });
  assert.equal(await h.api.performBrowserCommand({ type: 'toggle', nativeLaunched: true }), true);
  assert.ok(!h.calls.some(c => c[0] === 'create'));
  assert.equal(h.calls.find(c => c[0] === 'message')[2].command.type, 'play');
});

test('paired worker listens without music tabs and acknowledges each command once', async () => {
  const h = harness();
  await new Promise(resolve => setImmediate(resolve));
  const requests = [];
  h.storage.bridgeToken = 'paired-token';
  h.context.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    requests.push([url, body]);
    if (url.endsWith('/status')) return { ok: true, json: async () => ({ paired: true }) };
    if (url.endsWith('/browser-result')) {
      h.storage.bridgeToken = '';
      return { ok: true, json: async () => ({ ok: true }) };
    }
    return { ok: true, json: async () => ({ commands: [{ id: 'request', type: 'next' }] }) };
  };
  await h.api.startBrowserListener();
  assert.ok(requests[0][0].endsWith('/browser-listen'));
  const acknowledgment = requests.find(([url]) => url.endsWith('/browser-result'));
  assert.equal(acknowledgment[1].id, 'request');
  assert.equal(acknowledgment[1].ok, true);
  assert.ok(requests.some(([url]) => url.endsWith('/status')));
  assert.equal(h.calls.filter(c => c[0] === 'message').length, 1);
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

test('server-side revocation during startup prevents input even when local credentials remain', async () => {
  const h = harness({ tabs: [{ id: 1, windowId: 10 }] });
  await new Promise(resolve => setImmediate(resolve));
  h.storage.bridgeToken = 'revoked-token';
  h.context.fetch = async url => {
    if (url.endsWith('/status') || url.endsWith('/browser-result')) {
      return { ok: false, status: 401, json: async () => ({ error: 'Revoked' }) };
    }
    return { ok: true, json: async () => ({ commands: [{ id: 'old-request', type: 'next' }] }) };
  };
  await h.api.startBrowserListener();
  assert.ok(!h.calls.some(call => call[0] === 'message'));
  assert.equal(h.storage.bridgeToken, 'revoked-token');
});
