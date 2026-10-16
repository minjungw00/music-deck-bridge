import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const code=readFileSync(join(dirname(fileURLToPath(import.meta.url)),'..','streamdeck','src','plugin.cjs'),'utf8');
test('idle player stays selected for up to 90 seconds instead of dropping after 3.5s',()=>{
  const fn=code.slice(code.indexOf('function selectedEntry()'),code.indexOf('function addCommand('));
  const candidates=new Map([['123',{lastSeen:100000,playing:false,standalone:true,title:'Paused song'}]]);
  const date={now:()=>160000};
  const context={candidates,Date:date};
  vm.runInNewContext('const LIVE_MS = 90000;'+fn+';this.selectedEntry=selectedEntry;',context);
  assert.equal(context.selectedEntry()[1].title,'Paused song');
  date.now=()=>200001;
  assert.equal(context.selectedEntry(),null);
  assert.match(code,/present\.lastSeen = Date\.now\(\)/,'listen heartbeat renews live candidate');
});

test('English and Korean localized action-list names are bundled',()=>{
  const p=join(dirname(fileURLToPath(import.meta.url)),'..','streamdeck','io.github.minjungw00.musicdeckbridge.sdPlugin');
  const ko=JSON.parse(readFileSync(join(p,'ko.json'),'utf8'));
  const en=JSON.parse(readFileSync(join(p,'en.json'),'utf8'));
  const id='io.github.minjungw00.musicdeckbridge.nowplaying';
  assert.equal(ko[id].Name,'현재 곡');
  assert.equal(en[id].Name,'Now Playing');
});
