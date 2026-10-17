import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const base = join(dirname(fileURLToPath(import.meta.url)), '..');
const plugin = join(base, 'streamdeck', 'io.github.minjungw00.musicdeckbridge.sdPlugin','bin','plugin.js');
const origin = 'chrome-extension://' + 'a'.repeat(32);
async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function post(port, route, data) {
  const response = await fetch(`http://127.0.0.1:${port}${route}`, {
    method:'POST',
    headers: { Origin: origin, 'Content-Type':'application/json' },
    body: JSON.stringify(data), signal: AbortSignal.timeout(2600),
  });
  return {status:response.status, body:await response.json()};
}
async function start(port, appdata, useOverride=true) {
  const env = {...process.env, APPDATA:appdata, MUSIC_DECK_BRIDGE_DEV_TEST:'1', MUSIC_DECK_BRIDGE_TEST_PIN:'654321'};
  if (useOverride) env.MUSIC_DECK_BRIDGE_TEST_PORT = String(port);
  else delete env.MUSIC_DECK_BRIDGE_TEST_PORT;
  const proc = spawn(process.execPath,[plugin],{env,stdio:['ignore','pipe','pipe']});
  let log='';
  for (const stream of [proc.stdout,proc.stderr]) stream.on('data', b => {log+=b.toString();});
  for(let i=0;i<100;i++) {
    if(log.includes(`Loopback bridge on 127.0.0.1:${port}`)) return proc;
    if(proc.exitCode!==null) throw new Error(`Plugin exit: ${log}`);
    await new Promise(r=>setTimeout(r,25));
  }
  proc.kill();
  throw new Error(`Server failed to start: ${log}`);
}

test('global port changes live, keeps old listener temporarily, rejects occupied ports and persists after restart',async()=>{
  const data=mkdtempSync(join(tmpdir(),'music-deck-bridge-port-'));
  const oldPort=await freePort(), newPort=await freePort();
  let pluginProc, blocker;
  try {
    pluginProc=await start(oldPort,data);
    const pair=await post(oldPort,'/pair',{pin:'654321'});
    assert.equal(pair.status,200);
    const token=pair.body.token;
    assert.equal(pair.body.serverPort,oldPort);
    await post(oldPort,'/sync',{token,clientId:101,state:{volume:50,title:'A',standalone:true}});
    const waiting=post(oldPort,'/listen',{token,clientId:101});
    await new Promise(r=>setTimeout(r,60));
    const move=await post(oldPort,'/configure-port',{token,port:newPort});
    assert.equal(move.status,200);
    assert.equal(move.body.port,newPort);
    assert.equal(move.body.serverPort,newPort);
    assert.equal((await waiting).body.serverPort,newPort,'long poll must wake and announce changed port');
    assert.equal((await post(newPort,'/status',{token})).body.serverPort,newPort);
    assert.equal((await post(oldPort,'/status',{token})).body.serverPort,newPort,'old port allows connected clients to learn the new port');
    const file=JSON.parse(readFileSync(join(data,'MusicDeckBridge','config.json'),'utf8'));
    assert.equal(file.port,newPort);
    const reverted=await post(newPort,'/configure-port',{token,port:oldPort});
    assert.equal(reverted.status,200,'revert during grace must reuse old listener');
    assert.equal(reverted.body.serverPort,oldPort);
    const forward=await post(oldPort,'/configure-port',{token,port:newPort});
    assert.equal(forward.status,200,'reusing former listener on subsequent change must also work');

    blocker=createServer();
    await new Promise(r=>blocker.listen(0,'127.0.0.1',r));
    const taken=blocker.address().port;
    const rejected=await post(newPort,'/configure-port',{token,port:taken});
    assert.equal(rejected.status,409);
    assert.match(rejected.body.error, /EADDRINUSE/);
    assert.equal((await post(newPort,'/status',{token})).body.serverPort,newPort);
    assert.equal(JSON.parse(readFileSync(join(data,'MusicDeckBridge','config.json'),'utf8')).port,newPort);

    pluginProc.kill();
    await new Promise(r=>pluginProc.once('exit',r));
    pluginProc=await start(newPort,data,false);
    assert.equal((await post(newPort,'/status',{token})).status,200);
    assert.equal((await post(newPort,'/status',{token})).body.serverPort,newPort);
  } finally {
    if (pluginProc?.exitCode===null) pluginProc.kill();
    if (blocker?.listening) await new Promise(r=>blocker.close(r));
    rmSync(data,{recursive:true,force:true});
  }
});

test('volume slider preview overrides stale didReceiveSettings before first physical dial turn',async()=>{
  const data=mkdtempSync(join(tmpdir(),'music-deck-bridge-dial-'));
  const port=await freePort();let proc;
  try {
    proc=await start(port,data);
    const pair=await post(port,'/pair',{pin:'654321'});
    const token=pair.body.token;
    const state={volume:50,title:'Volume',standalone:true};
    await post(port,'/sync',{token,clientId:101,state});
    const action='io.github.minjungw00.musicdeckbridge.volume',context='volume-dial-1';
    const event=ev=>post(port,'/__test/event',{token,event:ev});
    await event({event:'willAppear',action,context,payload:{settings:{volumeStep:2}}});
    await event({event:'sendToPlugin',action,context,payload:{type:'volume-preview',value:5}});
    await event({event:'didReceiveSettings',action,context,payload:{settings:{volumeStep:2}}});
    await event({event:'dialRotate',action,context,payload:{ticks:1}});
    const result=await post(port,'/sync',{token,clientId:101,state});
    assert.deepEqual(result.body.commands,[{type:'volume_delta',amount:5}]);
  } finally {
    if(proc?.exitCode===null)proc.kill();
    rmSync(data,{recursive:true,force:true});
  }
});

test('Chrome extension uses stored custom port and follows live port changes announced by local server',async()=>{
  const source=readFileSync(join(base,'chrome-extension','background.js'),'utf8');
  const storage={bridgePort:23111,bridgeToken:'test-token'};
  const requested=[];let listener;
  const chrome={
    storage:{local:{setAccessLevel:async()=>{},get:async key=>({[key]:storage[key]}),set:async data=>Object.assign(storage,data),remove:async key=>delete storage[key]}},
    runtime:{onMessage:{addListener:cb=>{listener=cb}},onInstalled:{addListener:()=>{}},onStartup:{addListener:()=>{}}},
    alarms:{create:async()=>{},onAlarm:{addListener:()=>{}}},
    tabs:{query:async()=>[]},scripting:{executeScript:async()=>{}},
  };
  const fetchStub=async (url,opt)=>{
    requested.push(url);
    const parsed=new URL(url);
    if(parsed.pathname==='/status' && parsed.port==='23111') return {ok:true,status:200,json:async()=>({active:true,serverPort:23112})};
    if(parsed.pathname==='/status' && parsed.port==='23112') return {ok:true,status:200,json:async()=>({active:true,serverPort:23112})};
    if(parsed.pathname==='/configure-port' && parsed.port==='23112') return {ok:true,status:200,json:async()=>({ok:true,port:23113,serverPort:23113})};
    return {ok:false,status:404,json:async()=>({error:'Unexpected endpoint'})};
  };
  vm.runInNewContext(source,{chrome,fetch:fetchStub,AbortSignal,JSON,Number,Promise,Error,URL});
  const send=msg=>new Promise(resolve=>listener(msg,{},resolve));
  const check=await send({type:'check'});
  assert.equal(check.ok,true);
  assert.equal(storage.bridgePort,23112);
  assert.ok(requested.some(url=>url.startsWith('http://127.0.0.1:23111/status')));
  const result=await send({type:'set-port',port:23113});
  assert.equal(result.ok,true);
  assert.equal(result.localOnly,false);
  assert.equal(storage.bridgePort,23113);
  assert.ok(requested.some(url=>url.startsWith('http://127.0.0.1:23112/configure-port')));
});
