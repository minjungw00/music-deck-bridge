import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import protocol from '../chrome-extension/protocol.js';

const shared = readFileSync(new URL('../chrome-extension/protocol.js', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../chrome-extension/background.js', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const explicit = { protocolVersion: 1, minProtocolVersion: 1, extensionVersion: '9.9.9' };

test('protocol ranges ignore application versions, negotiate common ranges and retain implicit legacy v1', () => {
  for (const component of ['plugin', 'extension']) {
    for (const peer of [explicit, { ...explicit, pluginVersion: '0.1.0', extensionVersion: '99.2.3' },
      { protocolVersion: 2, minProtocolVersion: 1 }]) {
      assert.equal(protocol.negotiate(peer, component).compatible, true);
      assert.equal(protocol.negotiate(peer, component).negotiatedProtocolVersion, 1);
    }
    const legacy = protocol.negotiate({}, component);
    assert.equal(legacy.compatible, true); assert.equal(legacy.legacy, true);
    assert.equal(protocol.negotiate({ protocolVersion: 1 }, component).compatible, true);
    assert.equal(protocol.negotiate({ protocolVersion: 2 }, component).updateRequired, component);
    const future = { protocolVersion: 2, minProtocolVersion: 2 };
    assert.equal(protocol.negotiate({}, component, future).updateRequired, component === 'plugin' ? 'extension' : 'plugin');
  }
  const browser = vm.createContext({}); vm.runInContext(shared, browser);
  assert.deepEqual(JSON.parse(JSON.stringify(browser.MusicDeckProtocol.descriptor)), protocol.descriptor);
});

test('malformed explicit protocol metadata never falls back to legacy compatibility', () => {
  for (const peer of [{ protocolVersion: null }, { protocolVersion: '1' }, { protocolVersion: true },
    { protocolVersion: 0 }, { protocolVersion: 65536 }, { protocolVersion: 1.5 },
    { protocolVersion: 1, minProtocolVersion: 2 }, { protocolVersion: 1, minProtocolVersion: null }, { minProtocolVersion: 1 }]) {
    const result = protocol.negotiate(peer, 'plugin');
    assert.equal(result.compatible, false, JSON.stringify(peer));
    assert.equal(result.errorCode, 'invalid-protocol');
  }
});

test('real bridge rejects incompatible input without changing credentials, preserves PIN and recovers without re-pairing', async t => {
  const temp = mkdtempSync(join(tmpdir(), 'music-deck-protocol-'));
  const socket = createServer(); await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
  const proc = spawn(process.execPath, [fileURLToPath(new URL('../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/bin/plugin.js', import.meta.url))],
    { env: { ...process.env, APPDATA: temp, MUSIC_DECK_BRIDGE_DEV_TEST: '1', MUSIC_DECK_BRIDGE_TEST_PIN: '123456', MUSIC_DECK_BRIDGE_TEST_PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'] });
  const closed = once(proc, 'close');
  t.after(async () => { proc.kill(); await closed; rmSync(temp, { recursive: true, force: true }); });
  let output = ''; proc.stdout.on('data', chunk => { output += chunk; });
  for (let i = 0; !output.includes('Loopback bridge on') && i < 100; i++) await new Promise(resolve => setTimeout(resolve, 20));
  assert.match(output, /Loopback bridge on/);
  const post = async (endpoint, body) => {
    const response = await fetch(`http://127.0.0.1:${port}${endpoint}`, { method: 'POST',
      headers: { Origin: 'chrome-extension://' + 'a'.repeat(32), 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    return { status: response.status, data: await response.json() };
  };
  const future = { protocolVersion: 2, minProtocolVersion: 2, extensionVersion: '2.0.0' };
  assert.equal((await post('/pair', { pin: '000000', ...future })).status, 403, 'PIN is validated before negotiation');
  let response = await post('/pair', { pin: '123456', ...future });
  assert.equal(response.status, 409); assert.equal(response.data.compatibility.updateRequired, 'plugin');
  const authPath = join(temp, 'MusicDeckBridge', 'auth.json');
  assert.equal(existsSync(authPath), false);
  response = await post('/pair', { pin: '123456', ...explicit });
  assert.equal(response.status, 200, 'incompatibility did not consume the PIN');
  const token = response.data.token, auth = readFileSync(authPath);
  const configPath = join(temp, 'MusicDeckBridge', 'config.json');
  writeFileSync(configPath, JSON.stringify({ port })); const config = readFileSync(configPath);
  let status = await post('/status', { token, ...explicit });
  assert.equal(status.data.pluginVersion, pkg.version);
  assert.equal(status.data.compatibility.extensionVersion, '9.9.9');
  assert.equal(status.data.compatibility.compatible, true);
  const state = { title: 'Protocol song', playing: true };
  await post('/sync', { token, ...explicit, clientId: 1, state });
  await post('/__test/command', { token, ...explicit, type: 'next' });
  const pending = post('/browser-listen', { token, ...explicit, clientIds: [1] });
  await new Promise(resolve => setTimeout(resolve, 40));
  response = await post('/sync', { token, ...future, clientId: 1, state });
  assert.equal(response.status, 409);
  assert.equal((await pending).status, 409, 'pending compatible poll closes before new inputs can be delivered');
  assert.deepEqual(readFileSync(authPath), auth); assert.deepEqual(readFileSync(configPath), config);
  assert.equal((await post('/sync', { token: 'wrong', ...future, clientId: 1, state })).status, 401);
  status = await post('/status', { token, ...explicit });
  assert.equal(status.status, 200); assert.equal(status.data.active, false);
  const resumed = await post('/sync', { token, ...explicit, clientId: 1, state });
  assert.deepEqual(resumed.data.commands, [], 'recovery must not replay pre-mismatch commands');
  status = await post('/status', { token });
  assert.equal(status.data.compatibility.legacy, true, 'old extensions retain the existing wire contract');
  assert.equal(status.data.active, true);
  await post('/status', { token, ...future });
  assert.equal((await post('/unpair', { token, ...future })).status, 200, 'explicit unpair remains available for recovery');
  assert.equal(existsSync(authPath), false);
});

function extensionHarness() {
  let listener, reply = { paired: true }, responseStatus = 200;
  const storage = { bridgeToken: 'existing-token', bridgePort: 23111 }, calls = [];
  const chrome = {
    storage: { local: { setAccessLevel: async () => {}, get: async key => ({ [key]: storage[key] }),
      set: async values => Object.assign(storage, values), remove: async key => { delete storage[key]; } } },
    runtime: { getManifest: () => ({ version: '1.0.2', version_name: '1.0.2-dev' }),
      onMessage: { addListener(fn) { listener = fn; } }, onInstalled: { addListener() {} }, onStartup: { addListener() {} } },
    i18n: { getMessage: key => key }, alarms: { onAlarm: { addListener() {} } },
  };
  const ctx = vm.createContext({ chrome, AbortSignal, fetch: async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return { ok: responseStatus === 200, status: responseStatus, json: async () => reply };
  } });
  vm.runInContext(shared + '\n' + worker, ctx);
  return { storage, calls, ctx, setReply: (body, status = 200) => { reply = body; responseStatus = status; },
    send: (message, sender = {}) => new Promise(resolve => listener(message, sender, resolve)) };
}

test('new extension accepts legacy bridges and different app versions, but blocks future protocols and recovers with the same token', async () => {
  const h = extensionHarness();
  let result = await h.send({ type: 'check' });
  assert.equal(result.ok, true); assert.equal(result.compatibility.legacy, true);
  assert.equal(h.calls[0].body.protocolVersion, 1);
  assert.equal(h.calls[0].body.extensionVersion, '1.0.2-dev');
  h.setReply({ protocolVersion: 1, minProtocolVersion: 1, pluginVersion: '8.1.0' });
  result = await h.send({ type: 'check' });
  assert.equal(result.ok, true); assert.equal(result.compatibility.pluginVersion, '8.1.0');
  h.setReply({ protocolVersion: 2, minProtocolVersion: 2, pluginVersion: '2.0.0' });
  result = await h.send({ type: 'check' });
  assert.equal(result.ok, false); assert.equal(result.error, 'updateExtension');
  assert.equal(result.compatibility.updateRequired, 'extension');
  assert.equal(h.storage.bridgeToken, 'existing-token'); assert.equal(h.storage.bridgePort, 23111);
  const count = h.calls.length;
  const suppressed = await h.send({ type: 'sync', state: {} }, { tab: { id: 1 }, frameId: 0, url: 'https://music.youtube.com/' });
  assert.deepEqual([...suppressed.commands], []); assert.equal(h.calls.length, count);
  assert.equal((await h.send({ type: 'player-playback', command: 'next' })).reason, 'protocol-incompatible');
  h.setReply({ protocolVersion: 1, minProtocolVersion: 1, pluginVersion: '2.0.1' });
  result = await h.send({ type: 'check' });
  assert.equal(result.ok, true); assert.equal(result.compatibility.compatible, true);
  assert.equal(h.storage.bridgeToken, 'existing-token');
  h.setReply({ protocolVersion: null });
  assert.equal((await h.send({ type: 'check' })).error, 'protocolInvalid');
  h.setReply({ protocolVersion: 2, minProtocolVersion: 2 });
  assert.equal((await h.send({ type: 'unpair' })).ok, true);
  assert.equal(h.storage.bridgeToken, undefined);
});

test('incompatible browser channels recheck after five seconds and recover without a new PIN', async () => {
  const h = extensionHarness(), timers = [];
  h.ctx.chrome.tabs = { query: async () => [] };
  h.ctx.setTimeout = (callback, delay) => { timers.push({ callback, delay }); return timers.length; };
  h.ctx.clearTimeout = () => {};
  h.setReply({ protocolVersion: 2, minProtocolVersion: 2 });
  await vm.runInContext('startBrowserListener()', h.ctx);
  assert.equal(timers.length, 1); assert.equal(timers[0].delay, 5000);
  assert.equal(h.storage.bridgeToken, 'existing-token');
  h.setReply({ protocolVersion: 1, minProtocolVersion: 1 });
  timers[0].callback();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(vm.runInContext('bridgeCompatibility.compatible', h.ctx), true);
  assert.equal(timers.length, 1, 'compatible replacement does not schedule an error retry');
  assert.equal(h.storage.bridgeToken, 'existing-token');
});
