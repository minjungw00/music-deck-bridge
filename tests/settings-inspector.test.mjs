import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'streamdeck', 'io.github.minjungw00.musicdeckbridge.sdPlugin');
const code = readFileSync(join(dir,'property-inspector','settings.js'),'utf8');
const html = readFileSync(join(dir,'property-inspector','settings.html'),'utf8');
function makeInspector(action='io.github.minjungw00.musicdeckbridge.nowplaying', language='ko') {
  const ids=['titleModeRow','optTruncate','optScroll','titleHint','volumeRow','volumeHint',
    'pinRow','generatePin','pairHint','pairState','commandStatus','volumeStep','stepLabel','pinOutput',
    'trackSection','dialSection','dialDisplayRow','dialDisplay','optDialInfo','optDialArtwork','dialDisplayHint',
    'artworkTextOptions','artworkArtistRow','artworkShowArtist','artworkBackgroundRow','artworkTitleBackground','artworkTitleModeRow','artworkTitleMode','optArtworkTruncate','optArtworkScroll',
    'artworkOptions','artworkFitRow','artworkFit','optArtworkHeight','optArtworkWidth','artworkFitHint','artworkTitleRow','artworkShowTitle',
    'volumeSection','portRow','serverPort','applyPort','portStatus'];
  const elems=Object.fromEntries(ids.map(id=>[id,{
    id, textContent:'',value:id==='volumeStep'?'4':'',listeners:{},attrs:{},dataset:{},
    setAttribute(k,v){this.attrs[k]=v},addEventListener(k,v){this.listeners[k]=v},
    classList:{removed:[],hidden:true,remove(k){this.removed.push(k)},toggle(k,value){this.hidden=value;return value;}},
  }]));
  const calls=[];const subscribers={};const client={
    sendToPropertyInspector:{subscribe:fn=>subscribers.connection=fn},
    didReceiveSettings:{subscribe:fn=>subscribers.settings=fn},
    getConnectionInfo:async()=>({info:{application:{language}},actionInfo:{action, payload:{settings:{volumeStep:3, customFlag:true}}}}),
    setSettings:async settings=>{calls.push({event:'setSettings',settings})},
    send:async(event,payload)=>{calls.push({event,payload})},
  };
  const sandbox={SDPIComponents:{streamDeckClient:client},
    document:{getElementById:id=>elems[id],documentElement:{lang:''}},
    window:{addEventListener:()=>{}},Date,Number,Math,Promise,JSON,
    setTimeout:()=>1,clearTimeout:()=>{},setInterval:()=>1,clearInterval:()=>{}};
  vm.runInNewContext(code,sandbox);
  return {elems,calls,subscribers,sandbox,ready:async()=>{
    for(let i=0;i<10;i++)await Promise.resolve();
  }};
}

test('uses bundled official SDPI components in dark style and locale-aware labels', async()=>{
  assert.match(html,/<script src="sdpi-components\.js"><\/script>/);
  assert.match(html,/<input[^>]+id="volumeStep"[^>]+type="range"/);
  assert.match(html,/<sdpi-select[^>]+setting="titleMode"/);
  assert.match(html, /color: #e6e6e6/);
  const pi=makeInspector();await pi.ready();
  assert.equal(pi.sandbox.document.documentElement.lang,'ko');
  assert.equal(pi.elems.volumeRow.attrs.label,'회전당 볼륨');
  assert.equal(pi.elems.portRow.attrs.label,'로컬 서버 포트');
  assert.equal(pi.elems.optScroll.textContent,'왼쪽으로 스크롤');
  assert.equal(pi.elems.trackSection.classList.removed[0],'hidden');
  assert.equal(pi.calls[0].payload.type,'get-connection');
  const en=makeInspector('io.github.minjungw00.musicdeckbridge.volume','fr');await en.ready();
  assert.equal(en.sandbox.document.documentElement.lang,'en');
  assert.equal(en.elems.volumeRow.attrs.label,'Volume per tick');
  assert.equal(en.elems.portRow.attrs.label,'Local server port');
  assert.equal(en.elems.volumeSection.classList.removed[0],'hidden');
});

test('each action can generate a PIN, with real connection-state messages', async()=>{
  for (const name of ['nowplaying','toggle','prev','next','mute','volume','trackdial','open','like','dislike']) {
    const pi=makeInspector('io.github.minjungw00.musicdeckbridge.'+name); await pi.ready();
    pi.elems.generatePin.listeners.click();await pi.ready();
    assert.equal(pi.calls.at(-1).payload.type,'generate-pin');
    pi.subscribers.connection({payload:{type:'connection',paired:true,extensionOnline:true,playerActive:true,playerStale:false}});
    assert.equal(pi.elems.pairState.textContent,'연결됨 · YouTube Music 제어 가능');
    pi.subscribers.connection({payload:{type:'connection',paired:true,extensionOnline:true,playerActive:false}});
    assert.match(pi.elems.pairState.textContent,/YouTube Music/);
    pi.subscribers.connection({payload:{type:'connection',paired:true,extensionOnline:false,playerActive:false}});
    assert.match(pi.elems.pairState.textContent,/연결 미확인/);
    assert.match(pi.elems.pairState.textContent,/재설치.*새 PIN/);
    assert.doesNotMatch(pi.elems.pairState.textContent,/PIN 등록됨/);
    pi.subscribers.connection({payload:{type:'connection',pin:'123456',expiresAt:Date.now()+600000,paired:false,extensionOnline:false}});
    assert.equal(pi.elems.pinOutput.textContent,'123456');
  }
});

test('current-track dial exposes its localized persisted display selector only on that action', async () => {
  for (const [language, label] of [['ko', '앨범 이미지'], ['en', 'Album artwork']]) {
    const pi = makeInspector('io.github.minjungw00.musicdeckbridge.trackdial', language); await pi.ready();
    assert.deepEqual(pi.elems.dialSection.classList.removed, ['hidden']);
    assert.equal(pi.elems.optDialArtwork.textContent, label);
    assert.match(pi.elems.dialDisplayHint.textContent, /재생\/일시정지|play\/pause/);
    const other = makeInspector('io.github.minjungw00.musicdeckbridge.volume', language); await other.ready();
    assert.deepEqual(other.elems.dialSection.classList.removed, []);
  }
  assert.match(html, /<sdpi-select[^>]+setting="dialDisplay"[^>]+default="info"/);
});

test('artwork-only settings have safe defaults and follow display changes', async () => {
  const pi = makeInspector('io.github.minjungw00.musicdeckbridge.trackdial'); await pi.ready();
  assert.equal(pi.elems.artworkOptions.classList.hidden, true);
  assert.equal(pi.elems.optArtworkWidth.textContent, '좌우에 맞추기');
  assert.equal(pi.elems.optArtworkHeight.textContent, '상하에 맞추기');
  pi.elems.dialDisplay.value = 'artwork'; pi.elems.dialDisplay.listeners.valuechange();
  assert.equal(pi.elems.artworkOptions.classList.hidden, false);
  assert.equal(pi.elems.artworkTextOptions.classList.hidden, true);
  pi.elems.artworkShowTitle.value = true; pi.elems.artworkShowTitle.listeners.valuechange();
  assert.equal(pi.elems.artworkTextOptions.classList.hidden, false);
  assert.equal(pi.elems.artworkShowArtist.attrs.label, '곡 이름 뒤에 가수명 표시');
  assert.equal(pi.elems.artworkTitleBackground.attrs.label, '배경 표시');
  assert.equal(pi.elems.optArtworkScroll.textContent, '왼쪽으로 스크롤');
  pi.subscribers.settings({ payload: { settings: { dialDisplay: 'info' } } });
  assert.equal(pi.elems.artworkOptions.classList.hidden, true);
  assert.equal(pi.elems.artworkTextOptions.classList.hidden, true);
  for (const name of ['artworkShowArtist', 'artworkTitleBackground']) {
    assert.match(html, new RegExp('<sdpi-checkbox[^>]+setting="' + name + '"[^>]+default="false"'));
  }
  assert.match(html, /<sdpi-select[^>]+setting="artworkTitleMode"[^>]+default="truncate"/);
  assert.match(html, /<sdpi-select[^>]+setting="artworkFit"[^>]+default="height"/);
  assert.match(html, /<sdpi-checkbox[^>]+setting="artworkShowTitle"[^>]+default="false"/);
});

test('new PIN instructions take priority over a recently connected old extension', async()=>{
  const pi=makeInspector(); await pi.ready();
  pi.subscribers.connection({payload:{type:'connection',pin:'123456',expiresAt:Date.now()+600000,
    paired:true,extensionOnline:true,playerActive:true}});
  assert.equal(pi.elems.pinOutput.textContent,'123456');
  assert.equal(pi.elems.pairState.textContent,'PIN 발급됨 · Chrome 확장 프로그램에 입력하세요.');
});

test('a failed browser command explains recovery and clears after a successful command', async () => {
  const pi = makeInspector(); await pi.ready();
  const status = { type: 'connection', paired: true, extensionOnline: true, playerActive: true };
  pi.subscribers.connection({ payload: { ...status, lastCommandError: 'receiver-unavailable' } });
  assert.match(pi.elems.commandStatus.textContent, /페이지와 재생할 곡/);
  pi.subscribers.connection({ payload: { ...status, lastCommandError: 'pairing-required' } });
  assert.match(pi.elems.commandStatus.textContent, /새 PIN/);
  pi.subscribers.connection({ payload: { ...status, lastCommandError: '' } });
  assert.equal(pi.elems.commandStatus.textContent, '');
});

test('native range saves actual first input and supports manual settings persistence', async()=>{
  const pi=makeInspector('io.github.minjungw00.musicdeckbridge.volume','en'); await pi.ready();
  assert.equal(pi.elems.stepLabel.textContent,'3%');
  // Read the new event value while the saved settings still contain the previous value.
  // but event.target.value already has the NEW value. A native input must win.
  pi.elems.volumeStep.value='3';pi.elems.volumeStep.listeners.input({target:{value:'2'}});
  assert.equal(pi.elems.stepLabel.textContent,'2%');
  assert.equal(pi.calls.at(-1).payload.type,'volume-preview');
  assert.equal(pi.calls.at(-1).payload.value,2);
  pi.elems.volumeStep.listeners.change({target:{value:'2'}});
  assert.equal(pi.calls.at(-1).event,'setSettings');
  assert.equal(pi.calls.at(-1).settings.volumeStep,2);
  assert.equal(pi.calls.at(-1).settings.customFlag,true);
  // Older saved value must not revert the newly chosen 2% during an in-flight save.
  pi.subscribers.settings({payload:{settings:{volumeStep:3}}});
  assert.equal(pi.elems.volumeStep.value,'2');
  pi.subscribers.settings({payload:{settings:{volumeStep:2}}});
  assert.equal(pi.elems.volumeStep.value,'2');
  assert.match(html,/<input[^>]+type="range"[^>]+min="1" max="5" step="1"/);
});

test('all buttons and dials share the global port and can request a live port change', async()=>{
  for (const action of ['nowplaying','toggle','prev','next','mute','volume','trackdial','open','like','dislike']) {
    const pi=makeInspector('io.github.minjungw00.musicdeckbridge.'+action,'ko'); await pi.ready();
    pi.subscribers.connection({payload:{type:'connection',paired:true,extensionOnline:true,playerActive:true,serverPort:17864,bridgeOnline:true}});
    assert.equal(pi.elems.serverPort.value,'17864');
    pi.elems.serverPort.value='21568';
    pi.elems.serverPort.listeners.input();
    pi.elems.applyPort.listeners.click();
    assert.equal(pi.calls.at(-1).payload.type,'set-port');
    assert.equal(pi.calls.at(-1).payload.port,21568);
    pi.subscribers.connection({payload:{type:'port-result',ok:true,serverPort:21568}});
    assert.equal(pi.elems.serverPort.value,'21568');
    assert.match(pi.elems.portStatus.textContent,/21568/);
    pi.elems.serverPort.value='65536';
    pi.elems.applyPort.listeners.click();
    assert.match(pi.elems.portStatus.textContent,/1024/);
  }
});
