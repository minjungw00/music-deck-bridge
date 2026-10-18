import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import { selectPlayer } from '../streamdeck/src/domain/player-state.cjs';
import { createPlayerRegistry } from '../streamdeck/src/application/player-registry.cjs';
test('idle player stays selected for up to 90 seconds instead of dropping after 3.5s',()=>{
  const candidates=new Map([['123',{lastSeen:100000,playing:false,standalone:true,title:'Paused song'}]]);
  assert.equal(selectPlayer(candidates,160000)[1].title,'Paused song');
  assert.equal(selectPlayer(candidates,200001),null);
  let clock = 100000;
  const players = createPlayerRegistry({ now: () => clock, onChange() {} });
  players.sync('123', { title: 'Paused song' });
  clock = 180000;
  assert.equal(players.touch('123'), true);
  clock = 200001;
  assert.equal(players.selected()[1].title, 'Paused song', 'a listen heartbeat renews the lease');
  players.remove('123');
  assert.equal(players.touch('123'), false);

});

test('English and Korean localized action-list names are bundled',()=>{
  const p=join(dirname(fileURLToPath(import.meta.url)),'..','streamdeck','io.github.minjungw00.musicdeckbridge.sdPlugin');
  const ko=JSON.parse(readFileSync(join(p,'ko.json'),'utf8'));
  const en=JSON.parse(readFileSync(join(p,'en.json'),'utf8'));
  const id='io.github.minjungw00.musicdeckbridge.nowplaying';
  assert.equal(ko[id].Name,'현재 곡');
  assert.equal(en[id].Name,'Now Playing');
});
