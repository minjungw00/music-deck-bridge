import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const plugin = join(here, '..', 'streamdeck', 'io.github.minjungw00.musicdeckbridge.sdPlugin', 'bin', 'plugin.js');
const ORIGIN = 'chrome-extension://' + 'a'.repeat(32);
const BAD_ORIGIN = 'https://music.youtube.com';
const OTHER_EXTENSION = 'chrome-extension://' + 'b'.repeat(32);
const HOST = 'http://127.0.0.1:17864';
async function post(endpoint, body, origin=ORIGIN) {
  const response = await fetch(`${HOST}${endpoint}`, {
    method:'POST',
    headers:{'Origin':origin,'Content-Type':'application/json'},
    body:JSON.stringify(body),
    signal:AbortSignal.timeout(1500),
  });
  return { code: response.status, json: await response.json() };
}
async function ready(process) {
  let stdout = '';
  process.stdout.on('data', chunk => { stdout += chunk.toString(); });
  process.stderr.on('data', chunk => { stdout += chunk.toString(); });
  for (let i=0;i<100;i++) {
    if (stdout.includes('Loopback bridge')) return;
    if (process.exitCode !== null) throw new Error('Bridge exited: '+stdout);
    await new Promise(resolve => setTimeout(resolve, 40));
  }
  throw new Error('Bridge not ready: '+stdout);
}
test('local bridge pairing, auth, standalone prioritization and queue', async () => {
  const temp = mkdtempSync(join(tmpdir(), 'music-deck-bridge-test-'));
  const proc = spawn(process.execPath,[plugin],{
    env:{ ...process.env, APPDATA:temp, MUSIC_DECK_BRIDGE_DEV_TEST:'1',MUSIC_DECK_BRIDGE_TEST_PIN:'456789' },
    stdio:['ignore','pipe','pipe'],
  });
  try {
    await ready(proc);
    assert.equal((await post('/pair',{pin:'456789'},BAD_ORIGIN)).code,403,'web page must be denied');
    assert.equal((await post('/pair',{pin:'000000'})).code,403,'incorrect PIN denied');
    assert.equal((await post('/sync',{token:'invalid',clientId:1,state:{}})).code,401);
    const paired = await post('/pair',{pin:'456789'});
    // Test server has no physical Stream Deck available; a test-mode PIN is preselected.
    assert.equal(paired.code,200);
    assert.match(paired.json.token,/^[a-f0-9]{64}$/);
    const token=paired.json.token;
    assert.equal((await post('/status',{token},OTHER_EXTENSION)).code,401,'different extension denied');
    const browser = {title:'Normal tab',artist:'Test',playing:true,volume:45,standalone:false};
    const pwa = {title:'Standalone PWA',artist:'Singer',playing:false,volume:62,standalone:true};
    assert.equal((await post('/sync',{token,clientId:10,state:browser})).code,200);
    assert.equal((await post('/sync',{token,clientId:11,state:pwa})).code,200);
    const status = await post('/status',{token});
    assert.equal(status.json.active,true);
    assert.equal(status.json.track,'Standalone PWA');
    const enqueued = await post('/__test/command',{token,type:'volume_delta',amount:8});
    assert.equal(enqueued.json.accepted,true);
    const wrong = await post('/sync',{token,clientId:10,state:browser});
    assert.deepEqual(wrong.json.commands,[]);
    const correct = await post('/sync',{token,clientId:11,state:pwa});
    assert.deepEqual(correct.json.commands,[{type:'volume_delta',amount:8}]);
    const twice = await post('/sync',{token,clientId:11,state:pwa});
    assert.deepEqual(twice.json.commands,[]);
  } finally {
    proc.kill();
    rmSync(temp,{recursive:true,force:true});
  }
});

test('immediate long-poll delivery and configurable volume dial steps', async () => {
  const temp = mkdtempSync(join(tmpdir(), 'music-deck-bridge-poll-'));
  const proc = spawn(process.execPath,[plugin],{
    env:{ ...process.env, APPDATA:temp, MUSIC_DECK_BRIDGE_DEV_TEST:'1',MUSIC_DECK_BRIDGE_TEST_PIN:'456789' },
    stdio:['ignore','pipe','pipe'],
  });
  try {
    await ready(proc);
    const paired=await post('/pair',{pin:'456789'});
    assert.equal(paired.code,200);
    const token=paired.json.token;
    const state={title:'Example',artist:'Tester',volume:50,playing:true,standalone:true};
    await post('/sync',{token,clientId:12,state});

    await post('/__test/event',{token,event:{event:'willAppear',
      context:'dial1',action:'io.github.minjungw00.musicdeckbridge.volume',payload:{settings:{volumeStep:9}}}});
    let pull=post('/listen',{token,clientId:12});
    await new Promise(resolve=>setTimeout(resolve,55));
    const start=Date.now();
    await post('/__test/event',{token,event:{event:'dialRotate',
      context:'dial1',action:'io.github.minjungw00.musicdeckbridge.volume',payload:{ticks:2}}});
    const received=await pull;
    assert.equal(received.code,200);
    assert.deepEqual(received.json.commands,[{type:'volume_delta',amount:10}]);
    assert.ok(Date.now()-start<650,'should deliver without waiting for the 550ms sync clock');

    await post('/__test/event',{token,event:{event:'didReceiveSettings',
      context:'dial1',action:'io.github.minjungw00.musicdeckbridge.volume',payload:{settings:{volumeStep:3}}}});
    await post('/__test/event',{token,event:{event:'dialRotate',
      context:'dial1',action:'io.github.minjungw00.musicdeckbridge.volume',payload:{ticks:-2}}});
    assert.deepEqual((await post('/sync',{token,clientId:12,state})).json.commands,
      [{type:'volume_delta',amount:-6}]);
  } finally {
    proc.kill();
    rmSync(temp,{recursive:true,force:true});
  }
});
