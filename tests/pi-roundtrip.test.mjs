import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const plugin = join(dirname(fileURLToPath(import.meta.url)), '..',
  'streamdeck', 'io.github.minjungw00.musicdeckbridge.sdPlugin', 'bin', 'plugin.js');

function encodeServerFrame(value) {
  const body=Buffer.from(JSON.stringify(value));
  const len=body.length;
  return Buffer.concat([len<126 ? Buffer.from([0x81,len]) : Buffer.from([0x81,126,len>>8,len&255]),body]);
}
function decodeMaskedFrames(buffer) {
  const result=[];
  let offset=0;
  while(offset+2<=buffer.length){
    const marker=buffer[offset], b=buffer[offset+1];
    let count=b&127,header=2;
    if(count===126){if(offset+4>buffer.length)break;count=buffer.readUInt16BE(offset+2);header=4;}
    if(count===127)throw Error('Frame too large in test');
    const masked=Boolean(b&0x80),size=header+(masked?4:0)+count;
    if(offset+size>buffer.length)break;
    const bytes=Buffer.from(buffer.subarray(offset+header+(masked?4:0),offset+size));
    if(masked){const key=buffer.subarray(offset+header,offset+header+4);
      for(let i=0;i<bytes.length;i++)bytes[i]^=key[i%4];}
    if((marker&15)===1)result.push(JSON.parse(bytes.toString()));
    offset+=size;
  }
  return {messages:result,remaining:buffer.subarray(offset)};
}

for (const protectedManifest of [false, true]) {
  test(`standalone SDK bundle routes inspector, key, dial and display events (opaque manifest: ${protectedManifest})`, async () => {
    const tmp = mkdtempSync(join(tmpdir(), 'music-deck-sdk-'));
    const installed = join(tmp, 'io.github.minjungw00.musicdeckbridge.sdPlugin');
    mkdirSync(installed);
    cpSync(join(dirname(plugin), '..'), installed, { recursive: true });
    // Exercise the SDK's opaque-manifest path; actual Maker Console DRM still needs a device test.
    if (protectedManifest) writeFileSync(join(installed, 'manifest.json'), 'opaque manifest fixture');
    const server = createServer();
    const sockets = new Set();
    const messages = [];
    let peer;
    server.on('upgrade', (req, socket) => {
      peer = socket;
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
      const accept = createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
      socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
      let buffer = Buffer.alloc(0);
      socket.on('data', chunk => {
        buffer = Buffer.concat([buffer, chunk]);
        const decoded = decodeMaskedFrames(buffer);
        buffer = decoded.remaining;
        messages.push(...decoded.messages);
      });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const id = 'io.github.minjungw00.musicdeckbridge';
    const info = { application: { language: 'ko', version: '7.1.0', platform: 'windows', platformVersion: '10' },
      devices: [{ id: 'device', name: 'Stream Deck +', type: 7, size: { columns: 4, rows: 2 } }],
      plugin: { uuid: id, version: '0.5.1.0' } };
    const proc = spawn(process.execPath, [join(installed, 'bin/plugin.js'), '-port', String(server.address().port),
      '-pluginUUID', id, '-registerEvent', 'registerPlugin', '-info', JSON.stringify(info)], {
      cwd: installed, env: { ...process.env, APPDATA: tmp, MUSIC_DECK_BRIDGE_DEV_TEST: '1', MUSIC_DECK_BRIDGE_TEST_PIN: '654321' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    for (const stream of [proc.stdout, proc.stderr]) stream.on('data', b => { output += b; });
    async function waitFor(predicate) {
      for (let i = 0; i < 100; i++) {
        const result = await predicate();
        if (result) return result;
        if (proc.exitCode !== null) throw Error('Plugin exited: ' + output);
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      throw Error('SDK event timeout: ' + output);
    }
    function send(event, name, payload = {}) {
      peer.write(encodeServerFrame({ event, context: name, device: 'device', action: `${id}.${name}`, payload }));
    }
    const origin = 'chrome-extension://' + 'a'.repeat(32);
    async function post(route, body) {
      const response = await fetch('http://127.0.0.1:17864' + route, { method: 'POST',
        headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000) });
      assert.equal(response.status, 200);
      return response.json();
    }
    try {
      await waitFor(() => messages.find(m => m.event === 'registerPlugin'));
      assert.equal(messages[0].uuid, id);
      for (const name of ['nowplaying', 'toggle', 'prev', 'next', 'mute', 'volume', 'trackdial']) {
        send('willAppear', name, { controller: ['volume', 'trackdial'].includes(name) ? 'Encoder' : 'Keypad',
          settings: { volumeStep: 3 }, coordinates: { column: 0, row: 0 }, state: 0 });
      }
      send('propertyInspectorDidAppear', 'nowplaying');
      send('sendToPlugin', 'nowplaying', { type: 'generate-pin' });
      const reply = await waitFor(() => messages.find(m => m.event === 'sendToPropertyInspector'));
      assert.equal(reply.context, 'nowplaying');
      assert.equal(reply.payload.pin, '654321');
      assert.ok(reply.payload.expiresAt > Date.now());
      const { token } = await post('/pair', { pin: reply.payload.pin });
      const state = { title: 'SDK song', artist: 'Artist', playing: true, volume: 50 };
      await post('/sync', { token, clientId: 1, state });
      await waitFor(() => messages.some(m => m.event === 'setTitle' && m.context === 'toggle' && m.payload.title === '일시정지'));
      await waitFor(() => messages.some(m => m.event === 'setFeedback' && m.context === 'volume' && m.payload.value === '50%'));
      await waitFor(() => messages.some(m => m.event === 'setImage' && m.context === 'nowplaying'));
      async function command(event, name, payload, expected) {
        send(event, name, payload);
        const result = await waitFor(async () => {
          const r = await post('/sync', { token, clientId: 1, state });
          return r.commands.length ? r.commands : null;
        });
        assert.deepEqual(result, [expected]);
      }
      for (const [name, type] of [['nowplaying', 'toggle'], ['toggle', 'toggle'], ['prev', 'prev'], ['next', 'next'], ['mute', 'mute']]) {
        await command('keyDown', name, {}, { type, amount: 0 });
      }
      send('didReceiveSettings', 'volume', { settings: { volumeStep: 2 } });
      await command('dialRotate', 'volume', { ticks: 2 }, { type: 'volume_delta', amount: 4 });
      await command('dialDown', 'volume', {}, { type: 'mute', amount: 0 });
      await command('touchTap', 'volume', {}, { type: 'toggle', amount: 0 });
      await command('dialRotate', 'trackdial', { ticks: -1 }, { type: 'prev', amount: 0 });
      await command('dialRotate', 'trackdial', { ticks: 1 }, { type: 'next', amount: 0 });
      await command('dialDown', 'trackdial', {}, { type: 'toggle', amount: 0 });
      await command('touchTap', 'trackdial', {}, { type: 'toggle', amount: 0 });
      send('willDisappear', 'nowplaying', { controller: 'Keypad', settings: {}, coordinates: { column: 0, row: 0 }, state: 0 });
      const count = messages.length;
      state.title = 'Changed after disappearance';
      await post('/sync', { token, clientId: 1, state });
      await new Promise(resolve => setTimeout(resolve, 180));
      assert.ok(!messages.slice(count).some(m => m.context === 'nowplaying' && m.event === 'setTitle'));
    } finally {
      const exited = new Promise(resolve => proc.once('exit', resolve));
      if (proc.exitCode === null) { proc.kill(); await exited; }
      for (const socket of sockets) socket.destroy();
      await new Promise(resolve => server.close(resolve));
      rmSync(tmp, { recursive: true, force: true });
    }
  });
}
