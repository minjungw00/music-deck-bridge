import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../chrome-extension/popup.js', import.meta.url), 'utf8');
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const compatibility = { pluginVersion: '1.1.2-dev', extensionVersion: '1.1.2-dev', negotiatedProtocolVersion: 1 };

function harness() {
  const nodes = new Map(), requests = [];
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
  vm.runInNewContext(source, { chrome, document: { documentElement: {}, getElementById: element } });
  function take(type) {
    const index = requests.findIndex(request => request.type === type);
    assert.notEqual(index, -1, `missing ${type} request`);
    return requests.splice(index, 1)[0];
  }
  return { element, take, async ready() {
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
  assert.equal(h.element('status').textContent, 'removed');
  pairReply.resolve({ ok: true, compatibility }); await pair;
  assert.equal(h.element('status').textContent, 'removed');
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
    assert.equal(h.element('status').textContent, 'connected');
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
  const status = h.element('status').textContent;
  oldReply.resolve({ ok: true, port: 23111 }); await first;
  assert.equal(h.element('port').value, '23112');
  assert.equal(h.element('status').textContent, status);
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
  assert.equal(h.element('status').textContent, 'portSaved 23111');
});

test('validation of the latest user action supersedes an older pending status response', async () => {
  const h = harness(); await h.ready();
  const check = h.element('refresh').click(), oldReply = h.take('check');
  h.element('pin').value = '12'; await h.element('connect').click();
  oldReply.resolve({ ok: true, active: false, compatibility }); await check;
  assert.equal(h.element('status').textContent, 'invalid');
});
