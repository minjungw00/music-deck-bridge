import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket, WebSocketServer } from 'ws';
import { once } from 'node:events';
import { mkdtempSync, rmSync, cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const plugin = join(dirname(fileURLToPath(import.meta.url)), '..',
  'streamdeck', 'io.github.minjungw00.musicdeckbridge.sdPlugin', 'bin', 'plugin.js');

async function closePeer(peer) {
  if (!peer || peer.readyState === WebSocket.CLOSED) return;
  // Bound cleanup even if the child stops responding to the close handshake.
  const closed = new Promise(resolve => peer.once('close', resolve));
  const timer = setTimeout(() => peer.terminate(), 1000);
  try { peer.close(1000, 'Test complete'); await closed; }
  finally { clearTimeout(timer); }
}

for (const protectedManifest of [false, true]) {
  test(`standalone SDK bundle routes inspector, key, dial and display events (opaque manifest: ${protectedManifest})`, async t => {
    const tmp = mkdtempSync(join(tmpdir(), 'music-deck-sdk-'));
    const installed = join(tmp, 'io.github.minjungw00.musicdeckbridge.sdPlugin');
    mkdirSync(installed);
    cpSync(join(dirname(plugin), '..'), installed, { recursive: true });
    // Exercise the SDK's opaque-manifest path; actual Maker Console DRM still needs a device test.
    if (protectedManifest) writeFileSync(join(installed, 'manifest.json'), 'opaque manifest fixture');
    const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    const messages = [];
    const lifecycle = [];
    const errors = [];
    let peer, peerClose, proc, processClosed;
    let output = '';
    function recordError(error) { errors.push(error); lifecycle.push(`error: ${error.stack || error}`); }
    server.on('error', recordError);
    server.on('connection', socket => {
      peer = socket;
      lifecycle.push('WebSocket connected');
      socket.on('error', recordError);
      socket.on('close', (code, reason) => {
        peerClose = { code, reason: reason.toString() };
        lifecycle.push(`WebSocket closed: ${code} ${reason}`);
      });
      socket.on('message', data => {
        try { messages.push(JSON.parse(data.toString())); }
        catch (error) { recordError(error); }
      });
    });
    const diagnostics = () => `${lifecycle.join('\n')}\nPlugin stdout/stderr:\n${output}`;
    t.after(async () => {
      try {
        await closePeer(peer);
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
      } finally {
        if (proc) {
          // Wait for stdio to close as well, before deleting the installed copy on Windows.
          const timer = setTimeout(() => proc.kill('SIGKILL'), 2000);
          try {
            if (proc.exitCode === null && proc.signalCode === null) proc.kill();
            await processClosed;
          } finally { clearTimeout(timer); }
        }
        rmSync(tmp, { recursive: true, force: true });
        if (!t.passed) t.diagnostic(diagnostics());
      }
    });
    await once(server, 'listening');
    const id = 'io.github.minjungw00.musicdeckbridge';
    const info = { application: { language: 'ko', version: '7.1.0', platform: 'windows', platformVersion: '10' },
      devices: [{ id: 'device', name: 'Stream Deck +', type: 7, size: { columns: 4, rows: 2 } }],
      plugin: { uuid: id, version: '0.5.1.0' } };
    proc = spawn(process.execPath, [join(installed, 'bin/plugin.js'), '-port', String(server.address().port),
      '-pluginUUID', id, '-registerEvent', 'registerPlugin', '-info', JSON.stringify(info)], {
      cwd: installed, env: { ...process.env, APPDATA: tmp, MUSIC_DECK_BRIDGE_DEV_TEST: '1', MUSIC_DECK_BRIDGE_TEST_PIN: '654321' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    proc.on('error', recordError);
    proc.on('exit', (code, signal) => lifecycle.push(`Plugin exited: code=${code} signal=${signal}`));
    processClosed = new Promise(resolve => proc.once('close', resolve));
    for (const stream of [proc.stdout, proc.stderr]) stream.on('data', b => { output += b; });
    async function waitFor(predicate) {
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) {
        if (errors.length) throw new AggregateError(errors, diagnostics());
        if (peerClose) throw Error('Unexpected WebSocket close: ' + diagnostics());
        if (proc.exitCode !== null || proc.signalCode !== null) throw Error(diagnostics());
        const result = await predicate();
        if (result) return result;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      throw Error('SDK event timeout: ' + diagnostics());
    }
    function send(event, name, payload = {}, context = name) {
      assert.equal(peer?.readyState, WebSocket.OPEN, diagnostics());
      peer.send(JSON.stringify({ event, context, device: 'device', action: `${id}.${name}`, payload }),
        error => { if (error) recordError(error); });
    }
    const origin = 'chrome-extension://' + 'a'.repeat(32);
    async function post(route, body) {
      const response = await fetch('http://127.0.0.1:17864' + route, { method: 'POST',
        headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000) });
      assert.equal(response.status, 200);
      return response.json();
    }
    await waitFor(() => messages.find(m => m.event === 'registerPlugin'));
    assert.equal(messages[0].uuid, id);
    for (const name of ['nowplaying', 'toggle', 'prev', 'next', 'mute', 'volume', 'trackdial']) {
      send('willAppear', name, { controller: ['volume', 'trackdial'].includes(name) ? 'Encoder' : 'Keypad',
        settings: { volumeStep: 3 }, coordinates: { column: 0, row: 0 }, state: 0 });
    }
    const toggleImage = (context = 'toggle') => messages.findLast(m => m.event === 'setImage' && m.context === context)?.payload.image;
    const playImage = 'imgs/actions/toggle/key@2x.png';
    const pauseImage = 'imgs/actions/toggle/pause@2x.png';
    // Before any player state is available, show Play with the offline title.
    await waitFor(() => toggleImage() === playImage);
    send('propertyInspectorDidAppear', 'nowplaying');
    send('sendToPlugin', 'nowplaying', { type: 'generate-pin' });
    const reply = await waitFor(() => messages.find(m => m.event === 'sendToPropertyInspector'));
    assert.equal(reply.context, 'nowplaying');
    assert.equal(reply.payload.pin, '654321');
    assert.ok(reply.payload.expiresAt > Date.now());
    const { token } = await post('/pair', { pin: reply.payload.pin });
    const state = { title: 'SDK song', artist: 'Artist', playing: true, volume: 50 };
    await post('/sync', { token, clientId: 1, state });
    await waitFor(() => toggleImage() === pauseImage);
    await waitFor(() => messages.some(m => m.event === 'setTitle' && m.context === 'toggle' && m.payload.title === '일시정지'));
    await waitFor(() => messages.some(m => m.event === 'setFeedback' && m.context === 'volume' && m.payload.value === '50%'));
    await waitFor(() => messages.some(m => m.event === 'setImage' && m.context === 'nowplaying'));
    async function command(event, name, payload, expected) {
      send(event, name, payload);
      const result = await waitFor(async () => {
        const r = await post('/sync', { token, clientId: 1, state });
        return r.commands.length ? r.commands : null;
      });
      assert.deepEqual(result, Array.isArray(expected) ? expected : [expected]);
    }
    for (const [name, type] of [['nowplaying', 'toggle'], ['toggle', 'toggle'], ['prev', 'prev'], ['next', 'next'], ['mute', 'mute']]) {
      await command('keyDown', name, {}, { type, amount: 0 });
    }
    assert.equal(toggleImage(), pauseImage, 'key presses must wait for confirmed browser playback state');
    // Reappearing keys and another instance of the same action follow the player.
    send('willDisappear', 'toggle');
    const reappearStart = messages.length;
    send('willAppear', 'toggle', { controller: 'Keypad', settings: {}, state: 0 });
    send('willAppear', 'toggle', { controller: 'Keypad', settings: {}, state: 0 }, 'toggle-2');
    await waitFor(() => messages.slice(reappearStart).some(m => m.event === 'setImage' && m.context === 'toggle' && m.payload.image === pauseImage));
    await waitFor(() => toggleImage('toggle-2') === pauseImage);
    state.playing = false;
    await post('/sync', { token, clientId: 1, state });
    await waitFor(() => toggleImage() === playImage && toggleImage('toggle-2') === playImage);
    await waitFor(() => messages.findLast(m => m.event === 'setTitle' && m.context === 'toggle')?.payload.title === '재생');
    state.playing = true;
    await post('/sync', { token, clientId: 1, state });
    await waitFor(() => toggleImage() === pauseImage && toggleImage('toggle-2') === pauseImage);
    send('didReceiveSettings', 'volume', { settings: { volumeStep: 2 } });
    await command('dialRotate', 'volume', { ticks: 2 }, { type: 'volume_delta', amount: 4 });
    await command('dialDown', 'volume', {}, { type: 'mute', amount: 0 });
    await command('touchTap', 'volume', {}, { type: 'toggle', amount: 0 });
    await command('dialRotate', 'trackdial', { ticks: -1 }, { type: 'prev', amount: 0 });
    await command('dialRotate', 'trackdial', { ticks: 1 }, { type: 'next', amount: 0 });
    await command('dialRotate', 'trackdial', { ticks: 3 }, Array.from({ length: 3 }, () => ({ type: 'next', amount: 0 })));
    await command('dialRotate', 'trackdial', { ticks: -3 }, Array.from({ length: 3 }, () => ({ type: 'prev', amount: 0 })));
    await command('dialRotate', 'trackdial', { ticks: 100 }, Array.from({ length: 5 }, () => ({ type: 'next', amount: 0 })));
    await command('dialDown', 'trackdial', {}, { type: 'toggle', amount: 0 });
    await command('touchTap', 'trackdial', {}, { type: 'toggle', amount: 0 });
    send('willDisappear', 'nowplaying', { controller: 'Keypad', settings: {}, coordinates: { column: 0, row: 0 }, state: 0 });
    const count = messages.length;
    state.title = 'Changed after disappearance';
    await post('/sync', { token, clientId: 1, state });
    await new Promise(resolve => setTimeout(resolve, 180));
    assert.ok(!messages.slice(count).some(m => m.context === 'nowplaying' && m.event === 'setTitle'));
    await post('/unpair', { token });
    await waitFor(() => toggleImage() === playImage && toggleImage('toggle-2') === playImage);
    await closePeer(peer);
    assert.equal(peerClose?.code, 1000, diagnostics());
    assert.deepEqual(errors, [], diagnostics());
  });
}
