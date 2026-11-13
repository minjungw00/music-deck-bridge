import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../chrome-extension/popup.js', import.meta.url), 'utf8');
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const compatibility = { pluginVersion: '1.1.2-dev', extensionVersion: '1.1.2-dev', negotiatedProtocolVersion: 1 };

function harness() {
  const nodes = new Map(), requests = [];
  const timers = new Map(), windowHandlers = {};
  let nextTimer = 0;
  function element(id) {
    if (!nodes.has(id)) nodes.set(id, { value: '', textContent: '', style: {}, handlers: {},
      addEventListener(type, run) { this.handlers[type] = run; },
      click() { return this.handlers.click(); }, input() { this.handlers.input({ target: this }); } });
    return nodes.get(id);
  }
  const chrome = {
    i18n: { getUILanguage: () => 'en', getMessage: key => key },
    runtime: { sendMessage(message) {
      return new Promise((resolve, reject) => requests.push({ ...message, resolve, reject }));
    } },
  };
  const document = { hidden: false, documentElement: {}, getElementById: element };
  vm.runInNewContext(source, { chrome, document,
    setInterval(run, delay) { assert.equal(delay, 1000); timers.set(++nextTimer, run); return nextTimer; },
    clearInterval(id) { timers.delete(id); },
    window: { addEventListener(type, run) { windowHandlers[type] = run; } },
  });
  function take(type) {
    const index = requests.findIndex(request => request.type === type);
    assert.notEqual(index, -1, `missing ${type} request`);
    return requests.splice(index, 1)[0];
  }
  return { element, take, document, requests, timers, close() { windowHandlers.pagehide(); },
    async tick() { for (const run of timers.values()) run(); await flush(); }, async ready() {
    take('get-port').resolve({ ok: true, port: 17864 });
    take('check').resolve({ ok: true, active: false, compatibility });
    await flush();
  } };
}

test('a delayed pairing response cannot replace a newer unpair result or clear its input', async () => {
  const h = harness(); await h.ready();
  h.element('pin').value = '654321';
  const pair = h.element('connect').click(), pairReply = h.take('pair');
  const unpair = h.element('forget').click();
  h.take('unpair').resolve({ ok: true }); await unpair;
  assert.equal(h.element('feedback').textContent, 'removed');
  pairReply.resolve({ ok: true, compatibility }); await pair;
  assert.equal(h.element('feedback').textContent, 'removed');
  assert.equal(h.element('versions').textContent, '');
  assert.equal(h.element('pin').value, '654321');
});

for (const rejected of [false, true]) {
  test(`a stale startup status ${rejected ? 'rejection' : 'response'} cannot replace a successful pairing`, async () => {
    const h = harness(), oldStatus = h.take('check');
    h.take('get-port').resolve({ ok: true, port: 17864 });
    h.element('pin').value = '654321';
    const pair = h.element('connect').click();
    h.take('pair').resolve({ ok: true, compatibility }); await pair;
    const versions = h.element('versions').textContent;
    if (rejected) oldStatus.reject(Error('old failure'));
    else oldStatus.resolve({ ok: false, error: 'old failure', compatibility: { pluginVersion: '9.9.9' } });
    await flush();
    assert.equal(h.element('feedback').textContent, 'connected');
    assert.equal(h.element('versions').textContent, versions);
  });
}

test('a stale port-save response cannot replace the latest port and status', async () => {
  const h = harness(); await h.ready();
  h.element('port').value = '23111';
  const first = h.element('savePort').click(), oldReply = h.take('set-port');
  h.element('port').value = '23112';
  const second = h.element('savePort').click();
  h.take('set-port').resolve({ ok: true, port: 23112 }); await second;
  const status = h.element('feedback').textContent;
  oldReply.resolve({ ok: true, port: 23111 }); await first;
  assert.equal(h.element('port').value, '23112');
  assert.equal(h.element('feedback').textContent, status);
});

test('startup port loading preserves edits made before the response arrives', async () => {
  const h = harness();
  h.element('port').value = '23111'; h.element('port').input();
  await h.ready();
  assert.equal(h.element('port').value, '23111');
});

test('a port-save response preserves a newer unsaved edit', async () => {
  const h = harness(); await h.ready();
  h.element('port').value = '23111';
  const save = h.element('savePort').click();
  h.element('port').value = '23112'; h.element('port').input();
  h.take('set-port').resolve({ ok: true, port: 23111 }); await save;
  assert.equal(h.element('port').value, '23112');
  assert.equal(h.element('feedback').textContent, 'portSaved 23111');
});

test('validation of the latest user action supersedes an older pending status response', async () => {
  const h = harness(); await h.ready();
  const check = h.element('refresh').click(), oldReply = h.take('check');
  h.element('pin').value = '12'; await h.element('connect').click();
  oldReply.resolve({ ok: true, active: false, compatibility }); await check;
  assert.equal(h.element('feedback').textContent, 'invalid');
});

test('an open popup refreshes tracks, artwork failures, player closure and connection loss without overlapping polls', async () => {
  const h = harness(); await h.ready();
  await h.tick();
  const first = h.take('check');
  await h.tick();
  assert.equal(h.requests.length, 0, 'a slow poll must finish before another starts');
  first.resolve({ ok: true, active: true, track: 'First song', coverStatus: 'ready' }); await flush();
  assert.match(h.element('status').textContent, /First song/);
  await h.tick();
  h.take('check').resolve({ ok: true, active: true, track: 'Next song', coverStatus: 'failed' }); await flush();
  assert.match(h.element('status').textContent, /Next song.*\nartwork: coverFailed/);
  assert.doesNotMatch(h.element('status').textContent, /First song/);
  await h.tick();
  h.take('check').resolve({ ok: true, active: false }); await flush();
  assert.equal(h.element('status').textContent, 'paired');
  await h.tick();
  h.take('check').reject(Error('bridge offline')); await flush();
  assert.equal(h.element('status').textContent, 'bridge offline');
  await h.tick();
  h.take('check').resolve({ ok: true, active: true, track: 'Recovered song' }); await flush();
  assert.match(h.element('status').textContent, /Recovered song/);
});

for (const [button, type, response] of [
  ['connect', 'pair', { ok: true, compatibility }],
  ['forget', 'unpair', { ok: true }],
  ['savePort', 'set-port', { ok: true, port: 23111 }],
]) {
  test(`automatic status waits for ${type} and preserves its feedback`, async () => {
    const h = harness(); await h.ready();
    h.element('pin').value = '654321'; h.element('port').value = '23111';
    const operation = h.element(button).click(), reply = h.take(type);
    await h.tick();
    assert.equal(h.requests.length, 0);
    reply.resolve(response); await operation;
    const feedback = h.element('feedback').textContent;
    assert.ok(feedback);
    await h.tick();
    h.take('check').resolve({ ok: true, active: true, track: 'Current song', compatibility }); await flush();
    assert.match(h.element('status').textContent, /Current song/);
    assert.equal(h.element('feedback').textContent, feedback);
  });
}

test('a stale automatic read cannot replace a newer action or its versions, and later polling preserves validation feedback', async () => {
  const h = harness(); await h.ready();
  await h.tick();
  const oldReply = h.take('check');
  h.element('pin').value = '12'; await h.element('connect').click();
  const versions = h.element('versions').textContent;
  oldReply.resolve({ ok: true, active: true, track: 'Old song', compatibility: { pluginVersion: '9.9.9' } }); await flush();
  assert.equal(h.element('feedback').textContent, 'invalid');
  assert.doesNotMatch(h.element('status').textContent, /Old song/);
  assert.equal(h.element('versions').textContent, versions);
  await h.tick();
  h.take('check').resolve({ ok: true, active: true, track: 'New song', compatibility }); await flush();
  assert.match(h.element('status').textContent, /New song/);
  assert.equal(h.element('feedback').textContent, 'invalid');
});

test('hidden popups skip polling and closing clears the timer and discards outstanding status', async () => {
  const h = harness(); await h.ready();
  h.document.hidden = true;
  await h.tick();
  assert.equal(h.requests.length, 0);
  h.document.hidden = false;
  await h.tick();
  const reply = h.take('check'), status = h.element('status').textContent;
  h.close();
  assert.equal(h.timers.size, 0);
  reply.resolve({ ok: true, active: true, track: 'Closed song' }); await flush();
  assert.equal(h.element('status').textContent, status);
  await h.tick();
  assert.equal(h.requests.length, 0);
});
