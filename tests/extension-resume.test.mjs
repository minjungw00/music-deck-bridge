import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=join(dirname(fileURLToPath(import.meta.url)),'..','chrome-extension');
const bg=readFileSync(new URL('../chrome-extension/protocol.js', import.meta.url), 'utf8') + '\n' + readFileSync(join(root,'background.js'),'utf8');
const content=readFileSync(join(root,'content.js'),'utf8');
test('extension update reinjects into already-open PWA but never into discarded tabs',async()=>{
  const callbacks={};const injected=[];
  const chrome={
    storage:{local:{setAccessLevel:async()=>{},get:async()=>({}),set:async()=>{},remove:async()=>{}}},
    tabs:{query:async()=>[{id:55,url:'https://music.youtube.com/',discarded:false},{id:56,discarded:true}]},
    scripting:{executeScript:async arg=>{injected.push(arg)}},
    runtime:{onMessage:{addListener(fn){callbacks.onMessage=fn}},onInstalled:{addListener(fn){callbacks.onInstalled=fn}},
      onStartup:{addListener(fn){callbacks.onStartup=fn}}},
    alarms:{create:async()=>{},onAlarm:{addListener(fn){callbacks.onAlarm=fn}}},
  };
  vm.runInNewContext(bg,{chrome,fetch,AbortSignal,JSON,Error,URL,Promise});
  callbacks.onInstalled();
  for(let i=0;i<15;i++)await Promise.resolve();
  assert.equal(injected.length,1);
  assert.equal(injected[0].target.tabId,55);
  assert.equal(injected[0].files[0],'content.js');
  callbacks.onAlarm({name:'pwa-check'});
  for(let i=0;i<15;i++)await Promise.resolve();
  assert.equal(injected.length,2);
  assert.match(content,/__MUSIC_DECK_BRIDGE_RUNNING__/,'duplicate injection guard');
  assert.match(content,/visibilitychange/);
  const manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
  assert.ok(manifest.permissions.includes('scripting'));
  assert.ok(manifest.permissions.includes('alarms'));
  assert.deepEqual([...manifest.host_permissions].sort(),['http://127.0.0.1/*','https://music.youtube.com/*'].sort());
});
