import { freePort, manageChild } from '../helpers/bridge.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer as httpsServer } from 'node:https';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const musicURL = 'https://music.youtube.com/';
const fixture = (restored = false, ignoredStartupRequests = 0, delayedQueue = false, holdStartup = false) => `<!doctype html><html><body>
<ytmusic-player-bar>
 <span class="title">Fixture song</span><span class="byline">Fixture artist</span>
 <audio></audio><div id="movie_player"></div>
 <button class="play-pause-button" disabled onclick="control('toggle')">Play</button>
 <button class="previous-button" disabled onclick="control('prev')">Previous</button>
 <button class="next-button" disabled onclick="control('next')">Next</button>
 <button class="volume" onclick="muted=!muted;record('mute')">Mute</button>
 <yt-icon-button class="repeat" onclick="repeat()" style="display:inline-block">Repeat</yt-icon-button>
 <yt-icon-button class="shuffle" onclick="shuffle()" style="display:inline-block">Shuffle</yt-icon-button>
 <div id="volume-slider" style="width:100px;height:20px" aria-valuenow="50"></div>
 <ytmusic-like-button-renderer like-status="INDIFFERENT">
  <div id="button-shape-like"><button onclick="rate('LIKE')">Like</button></div>
  <div id="button-shape-dislike"><button onclick="rate('DISLIKE')">Dislike</button></div>
 </ytmusic-like-button-renderer>
</ytmusic-player-bar>
<script>
let playing=false, muted=false, ready=false, cued=false, initialized=false, index=2, time=0, stallPrevious=false, seekSignal=true;
let buffering=false;
let destinationUnstarted=false, unstartedDestination=false, ignoredDestinationPlays=0, destinationPlays=0;
const restored=${restored};
const ignoredStartupRequests=${ignoredStartupRequests};
const delayedQueue=${delayedQueue};
const playerListeners=new Map();
const playerBar=document.querySelector('ytmusic-player-bar');
const repeatModes=['NONE','ALL','ONE'];
playerBar.repeatMode='NONE';
playerBar.isRepeatButtonDisabled=delayedQueue;
playerBar.shuffleOn=false;
playerBar.isShuffleDisabled=delayedQueue;
if(delayedQueue){
 const title=playerBar.querySelector('.title');
 title.textContent='';
 setTimeout(()=>{title.textContent='Fixture song';},500);
 setTimeout(()=>{playerBar.isRepeatButtonDisabled=false;playerBar.isShuffleDisabled=false;},1000);
}
let legacyShuffle=false, shuffleOrder=['a','b','c'];
playerBar.queue={getItems:()=>shuffleOrder};
function shuffle(){
 if(playerBar.isShuffleDisabled)return;
 if(legacyShuffle)shuffleOrder.reverse();
 else playerBar.shuffleOn=!playerBar.shuffleOn;
 document.querySelector('.shuffle').setAttribute('shuffle-on',playerBar.shuffleOn);
 record('shuffle');
}
function repeat(){
 if(playerBar.isRepeatButtonDisabled)return;
 playerBar.repeatMode=repeatModes[(repeatModes.indexOf(playerBar.repeatMode)+1)%repeatModes.length];
 document.querySelector('.repeat').setAttribute('aria-label',playerBar.repeatMode);
 document.body.dataset.repeatModes=(document.body.dataset.repeatModes||'')+' '+playerBar.repeatMode;
}
const tracks=['aaaaaaaaaaa','bbbbbbbbbbb','ccccccccccc','ddddddddddd','eeeeeeeeeee'];
const params=new URL(location.href).searchParams;
const requestedTrack=tracks.indexOf(params.get('v'));
const observedTrack=params.get('fixtureObservedTrack');
if(requestedTrack>=0)index=requestedTrack;
function record(key){ document.body.dataset[key]=String(Number(document.body.dataset[key]||0)+1); }
function rate(value){
 const renderer=document.querySelector('ytmusic-like-button-renderer');
 renderer.setAttribute('like-status',renderer.getAttribute('like-status')===value?'INDIFFERENT':value);
 record(value==='LIKE'?'like':'dislike');
}
function control(type){
 if(!ready){record('early');return;}
 if(type==='toggle'&&restored&&!initialized){record('ignoredRestoredClick');return;}
 if(type==='toggle'&&${holdStartup}&&!playing){record('ignoredResumeClick');return;}
 if(!initialized&&!cued){record('uncuedInput');for(const fn of playerListeners.get('onError')||[])fn({data:2});return;}
 if(type==='toggle'){playing=!playing;initialized=true;}
 if(type==='prev'||type==='next'){
  if(type==='prev'){record('previousAttempt');if(stallPrevious)return;}
  if(!initialized){record('ignoredNavigation');return;}
  if(type==='prev' && index===0){time=0;if(seekSignal)document.querySelector('audio').dispatchEvent(new Event('seeked'));}
  else index+=type==='prev'?-1:1;
  playing=false;
  unstartedDestination=destinationUnstarted;destinationPlays=0;
 }
 record(type);
}
Object.defineProperties(document.querySelector('audio'), {
 paused:{get:()=>true}, ended:{get:()=>false}, readyState:{get:()=>ready&&initialized&&!unstartedDestination?4:0}, duration:{get:()=>180},
 currentSrc:{get:()=>initialized?tracks[index]:''}, currentTime:{get:()=>time}
});
const api=document.querySelector('#movie_player');
api.isReady=()=>ready;api.getPlayerState=()=>unstartedDestination?-1:!initialized?(cued&&!restored?5:-1):buffering?3:playing?1:2;
api.getVideoData=()=>({video_id:observedTrack||(initialized||restored?tracks[index]:'')});
api.getCurrentTime=()=>time;
api.getDuration=()=>180;
api.playVideo=()=>{
 if(!ready){record('early');return;}
 document.body.dataset.apiUserActive=String(navigator.userActivation.isActive);
 document.body.dataset.apiUserEverActive=String(navigator.userActivation.hasBeenActive);
 record('playRequest');
 if(${holdStartup}&&!initialized)return;
 if(restored&&!initialized&&Number(document.body.dataset.playRequest)<=ignoredStartupRequests){record('ignoredStartupRequest');return;}
 if(unstartedDestination&&++destinationPlays<=ignoredDestinationPlays){record('ignoredDestinationRequest');return;}
 unstartedDestination=false;
 playing=true;initialized=true;
};
api.pauseVideo=()=>{
 record('pauseRequest');
 if(buffering){record('ignoredBufferingPause');return;}
 playing=false;
};
api.isMuted=()=>muted;
api.addEventListener=(name,fn)=>{if(!playerListeners.has(name))playerListeners.set(name,new Set());playerListeners.get(name).add(fn);};
api.removeEventListener=(name,fn)=>playerListeners.get(name)?.delete(fn);
// Controls/API become ready before a selection. Play is invalid until cueing;
// loaded media/track identity then still require the first valid Play input.
setTimeout(()=>{ready=true;for(const button of document.querySelectorAll('button[disabled]'))button.disabled=false;},500);
setTimeout(()=>{cued=true;},900);
const slider=document.querySelector('#volume-slider');slider.value=50;
slider.addEventListener('change',()=>{slider.setAttribute('aria-valuenow',slider.value);record('volume_delta');});
</script></body></html>`;
async function until(check, label) {
  const deadline = performance.now() + 10000;
  while (performance.now() < deadline) {
    const result = await check();
    if (result) return result;
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  throw Error(`Timed out: ${label}`);
}

test('real MV3 worker retains cold-tab inputs and safely recovers a replaced receiver', { timeout: 90000 }, async t => {
  const temp = await mkdtemp(join(tmpdir(), 'music-deck-browser-'));
  let browser, process, child, site;
  let restoredStartup = false;
  let ignoredStartupRequests = 0;
  let delayedQueue = false;
  let holdStartup = false;
  t.after(async () => {
    await browser?.close();
    if (child) await child.stop();
    if (site) { site.closeAllConnections(); await new Promise(resolve => site.close(resolve)); }
    await rm(temp, { recursive: true, force: true });
  });
  // Ephemeral certificate/key are generated only in the temporary test profile.
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-keyout', join(temp, 'key'), '-out', join(temp, 'cert'), '-subj', '/CN=music.youtube.com'], { stdio: 'ignore' });
  site = httpsServer({ key: await readFile(join(temp, 'key')), cert: await readFile(join(temp, 'cert')) },
    (_req, res) => { setTimeout(() => { res.setHeader('Content-Type', 'text/html');
      res.end(fixture(restoredStartup, ignoredStartupRequests, delayedQueue, holdStartup)); }, 250); });
  await new Promise(resolve => site.listen(0, '127.0.0.1', resolve));
  const port = await freePort();
  async function startBridge() {
    process = spawn(globalThis.process.execPath, [join(root, 'streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/bin/plugin.js')], {
    env: { ...globalThis.process.env, APPDATA: temp, MUSIC_DECK_BRIDGE_DEV_TEST: '1',
      MUSIC_DECK_BRIDGE_TEST_PORT: String(port), MUSIC_DECK_BRIDGE_TEST_PIN: '654321' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child = manageChild(process);
  await child.ready('Loopback bridge on');
  }
  await startBridge();
  const extension = join(root, 'chrome-extension');
  const launchBrowser = () => chromium.launchPersistentContext(join(temp, 'profile'), {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`,
      `--host-resolver-rules=MAP music.youtube.com 127.0.0.1:${site.address().port}`, '--ignore-certificate-errors'],
  });
  browser = await launchBrowser();
  const worker = browser.serviceWorkers()[0] || await browser.waitForEvent('serviceworker');
  const origin = new URL(worker.url()).origin === 'null' ? worker.url().split('/').slice(0, 3).join('/') : new URL(worker.url()).origin;
  const token = await worker.evaluate(async port => {
    await setLocalPort(port);
    const result = await post('/pair', { pin: '654321' });
    await chrome.storage.local.set({ bridgeToken: result.token });
    globalThis.acknowledgments = [];
    globalThis.legacyPollsStarted = 0;
    globalThis.playerSnapshots = [];
    const original = fetch;
    globalThis.fetch = async (url, options) => {
      if (url.endsWith('/listen')) legacyPollsStarted++;
      if (url.endsWith('/sync')) {
        const { clientId, state } = JSON.parse(options.body);
        playerSnapshots.push({ clientId, playing: state.playing, muted: state.muted,
          repeatMode: state.repeatMode, shuffleEnabled: state.shuffleEnabled, positionSeconds: state.positionSeconds });
      }
      if (url.endsWith('/browser-result')) {
        const { ok, reason } = JSON.parse(options.body);
        acknowledgments.push({ ok, reason, legacyPollsStarted });
      }
      return original(url, options);
    };
    void startBrowserListener();
    return result.token;
  }, port);
  const postEvent = async type => {
    const response = await fetch(`http://127.0.0.1:${port}/__test/event`, {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, event: { event: type === 'volume_delta' ? 'dialRotate' : 'keyDown',
        action: 'io.github.minjungw00.musicdeckbridge.' + (type === 'volume_delta' ? 'volume' : type),
        context: type, payload: type === 'volume_delta' ? { ticks: 1 } : {} } }),
    });
    assert.equal(response.status, 200);
  };
  const watch = `${musicURL}watch?v=aaaaaaaaaaa`;
  const restored = await browser.newPage();
  await restored.goto(watch);
  await until(() => worker.evaluate(async () => (await chrome.storage.local.get('lastTrack')).lastTrack?.trackId === 'aaaaaaaaaaa'),
    'Chrome saves a restored selection before playback');
  await until(async () => {
    const data = await readFile(join(temp, 'MusicDeckBridge', 'last-track.json'), 'utf8').catch(error => {
      if (error.code === 'ENOENT') return '{}';
      throw error;
    });
    return JSON.parse(data).track?.trackId === 'aaaaaaaaaaa';
  }, 'bridge saves a restored selection before playback');
  assert.equal(await restored.evaluate(() => playing), false);
  await restored.close();
  assert.equal((await worker.evaluate(() => localPlayer.check())).savedPlayer?.key, 'aaaaaaaaaaa');
  assert.deepEqual(await worker.evaluate(() => localPlayer.savedControl({ command: 'toggle', trackKey: 'aaaaaaaaaaa' })), { ok: true });
  const reopened = await until(() => browser.pages().find(page => page.url() === watch), 'reopened saved track');
  assert.equal(await reopened.evaluate(() => playing), true);
  await reopened.close();
  const mismatched = await browser.newPage();
  await mismatched.goto(`${musicURL}watch?v=bbbbbbbbbbb&fixtureObservedTrack=aaaaaaaaaaa`);
  await until(() => worker.evaluate(async () => (await chrome.storage.local.get('lastTrack')).lastTrack?.trackId === 'bbbbbbbbbbb'),
    'Chrome captures the new visible selection before the previous player state changes');
  const readSavedTrack = async () => JSON.parse(await readFile(join(temp, 'MusicDeckBridge', 'last-track.json'), 'utf8')).track;
  assert.equal((await readSavedTrack()).trackId, 'aaaaaaaaaaa', 'the live bridge skips the mismatched observation');
  await mismatched.close();
  const closedTrack = await until(async () => {
    const track = await readSavedTrack();
    return track.trackId === 'bbbbbbbbbbb' && track;
  }, 'the bridge saves the captured track when the mismatched tab closes');
  assert.equal(closedTrack.title, 'Fixture song');
  assert.equal(closedTrack.positionSeconds, undefined);
  assert.equal(closedTrack.repeatMode, undefined);
  // Every input starts with zero music tabs. Real tab navigation, script injection,
  // runtime messaging, token validation and result ACKs are used without API mocks.
  for (const type of ['toggle', 'nowplaying', 'prev', 'next', 'mute', 'like', 'dislike', 'volume_delta', 'open']) {
    for (const page of browser.pages()) if (page.url().startsWith(musicURL)) await page.close();
    const before = await worker.evaluate(() => acknowledgments.length);
    await postEvent(type);
    const ack = await until(async () => (await worker.evaluate(() => acknowledgments))[before], `${type} ACK`);
    assert.equal(ack.ok, true, `${type}: ${JSON.stringify(ack)}; ${child.output}`);
    const page = await until(() => browser.pages().find(page => page.url().startsWith(musicURL)), 'music tab');
    await page.waitForLoadState();
    const effect = type === 'nowplaying' ? 'toggle' : type;
    if (type !== 'open') assert.equal(await page.evaluate(type => document.body.dataset[type], effect), '1', type);
    assert.equal(await page.evaluate(() => document.body.dataset.early), undefined, 'restored controls must wait for the player');
    assert.equal(await page.evaluate(() => document.body.dataset.uncuedInput), undefined, 'API readiness alone must not authorize playback');
    if (effect === 'toggle') {
      await until(() => worker.evaluate(() => playerSnapshots.some(state => state.playing)), 'MAIN playback state reflected in sync');
      assert.equal(await page.evaluate(() => document.querySelector('audio').paused), true, 'stale media node must not override the site player');
    }
    if (type === 'mute') {
      await until(() => worker.evaluate(() => playerSnapshots.some(state => state.muted)), 'MAIN mute state reflected in sync');
    }
    assert.equal(browser.pages().filter(page => page.url().startsWith(musicURL)).length, 1);
  }
  const repeatPage = browser.pages().find(page => page.url().startsWith(musicURL));
  const repeatedBefore = await worker.evaluate(() => acknowledgments.length);
  await until(() => worker.evaluate(() => playerSnapshots.at(-1)?.repeatMode === 'NONE'), 'repeat mode sync');
  await postEvent('repeat');
  await postEvent('repeat');
  await until(() => worker.evaluate(before => acknowledgments.length >= before + 2, repeatedBefore), 'two Repeat ACKs');
  assert.equal(await repeatPage.evaluate(() => document.body.dataset.repeatModes), ' ALL ONE');
  assert.ok(await worker.evaluate(before => acknowledgments.slice(before, before + 2).every(result => result.ok), repeatedBefore));
  await until(() => worker.evaluate(() => playerSnapshots.at(-1)?.repeatMode === 'ONE'), 'observed repeat sync');
  await repeatPage.locator('.repeat').click();
  await until(() => worker.evaluate(() => playerSnapshots.at(-1)?.repeatMode === 'NONE'), 'web repeat state sync');
  await repeatPage.evaluate(() => { playerBar.isRepeatButtonDisabled = true; });
  await until(() => worker.evaluate(() => playerSnapshots.at(-1)?.repeatMode === null), 'disabled repeat state sync');
  await repeatPage.evaluate(() => { playerBar.isRepeatButtonDisabled = false; });
  await until(() => worker.evaluate(() => playerSnapshots.at(-1)?.shuffleEnabled === false), 'shuffle mode sync');
  let beforeShuffle = await worker.evaluate(() => acknowledgments.length);
  await postEvent('shuffle');
  assert.equal((await until(() => worker.evaluate(before => acknowledgments[before], beforeShuffle), 'Shuffle ACK')).ok, true);
  await until(() => worker.evaluate(() => playerSnapshots.at(-1)?.shuffleEnabled === true), 'observed shuffle sync');
  await repeatPage.evaluate(() => { playerBar.shuffleOn = false; legacyShuffle = true; });
  await until(() => worker.evaluate(() => playerSnapshots.at(-1)?.shuffleEnabled === false), 'legacy shuffle mode sync');
  beforeShuffle = await worker.evaluate(() => acknowledgments.length);
  await postEvent('shuffle');
  assert.equal((await until(() => worker.evaluate(before => acknowledgments[before], beforeShuffle), 'Legacy Shuffle ACK')).ok, true);
  assert.equal(await repeatPage.evaluate(() => shuffleOrder.join('')), 'cba');

  // A second launch reuses the existing music tab; a normal input keeps working.
  for (const type of ['open', 'next']) {
    const before = await worker.evaluate(() => acknowledgments.length);
    await postEvent(type);
    assert.equal((await until(async () => (await worker.evaluate(() => acknowledgments))[before], `${type} reuse ACK`)).ok, true);
    assert.equal(browser.pages().filter(page => page.url().startsWith(musicURL)).length, 1);
  }
  // Launch with each button, then operate both transport keys on that same tab.
  // The page model ignores navigation before first playback and cues (pauses)
  // each destination, exposing failures hidden by the old track-ID-only ACK.
  for (const launch of ['toggle', 'nowplaying', 'prev', 'next', 'mute', 'like', 'dislike', 'volume_delta', 'open']) {
    for (const page of browser.pages()) if (page.url().startsWith(musicURL)) await page.close();
    let before = await worker.evaluate(() => acknowledgments.length);
    await postEvent(launch);
    assert.equal((await until(async () => (await worker.evaluate(() => acknowledgments))[before], `${launch} launch ACK`)).ok, true);
    const page = await until(() => browser.pages().find(page => page.url().startsWith(musicURL)), 'music tab');
    await page.waitForLoadState();
    // First queue item at time zero: Previous restarts it without a new ID.
    await page.evaluate(() => { index=0;time=0; });
    for (const type of ['prev', 'next']) {
      const clicks = await page.evaluate(type => Number(document.body.dataset[type] || 0), type);
      before = await worker.evaluate(() => acknowledgments.length);
      await postEvent(type);
      const ack = await until(async () => (await worker.evaluate(() => acknowledgments))[before], `${launch} then ${type} ACK`);
      assert.equal(ack.ok, true, JSON.stringify(ack));
      assert.equal(await page.evaluate(type => Number(document.body.dataset[type]), type), clicks+1, 'navigate once');
      assert.equal(await page.evaluate(() => document.querySelector('#movie_player').getPlayerState()), 1, 'destination is playing before ACK');
      assert.equal(await page.evaluate(() => document.body.dataset.ignoredNavigation), undefined);
    }
    assert.equal(browser.pages().filter(page => page.url().startsWith(musicURL)).length, 1);
  }
  // The reported startup shape: restored ID, UNSTARTED and no media. The
  // first API request and synthetic Play control have no effect. A later Play
  // request starts it without a second physical input or replayed navigation.
  restoredStartup = true;
  ignoredStartupRequests = 1;
  for (const type of ['toggle', 'nowplaying', 'prev', 'next']) {
    for (const page of browser.pages()) if (page.url().startsWith(musicURL)) await page.close();
    const before = await worker.evaluate(() => acknowledgments.length);
    await postEvent(type);
    const result = await until(async () => (await worker.evaluate(() => acknowledgments))[before], `${type} restored startup ACK`);
    assert.equal(result.ok, true, JSON.stringify(result));
    const page = browser.pages().find(page => page.url().startsWith(musicURL));
    assert.equal(await page.evaluate(() => playing), true);
    const plays = type === 'prev' || type === 'next' ? '3' : '2';
    assert.equal(await page.evaluate(() => document.body.dataset.playRequest), plays);
    assert.equal(await page.evaluate(() => document.body.dataset.ignoredStartupRequest), '1');
    assert.equal(await page.evaluate(() => document.body.dataset.apiUserActive), 'false');
    assert.equal(await page.evaluate(() => document.body.dataset.apiUserEverActive), 'false');
    assert.equal(await page.evaluate(() => document.body.dataset.ignoredRestoredClick), undefined);
    assert.equal(await page.evaluate(() => document.body.dataset.toggle), undefined);
    if (type === 'prev' || type === 'next') assert.equal(await page.evaluate(type => document.body.dataset[type], type), '1');
    const paused = await worker.evaluate(() => acknowledgments.length);
    await postEvent('toggle');
    assert.equal((await until(async () => (await worker.evaluate(() => acknowledgments))[paused], 'Pause after restored startup')).ok, true);
    assert.equal(await page.evaluate(() => playing), false);
    assert.equal(await page.evaluate(() => document.body.dataset.toggle), '1', 'Pause still uses the site control');
    assert.equal(await page.evaluate(() => document.body.dataset.playRequest), plays, 'Pause did not issue Play');
  }
  restoredStartup = false;
  ignoredStartupRequests = 0;
  const bufferingPage = browser.pages().find(page => page.url().startsWith(musicURL));
  await bufferingPage.evaluate(() => { playing=true;buffering=true; });
  const bufferingClicks = await bufferingPage.evaluate(() => document.body.dataset.toggle);
  const beforePause = await worker.evaluate(() => acknowledgments.length);
  await postEvent('toggle');
  await until(() => bufferingPage.evaluate(() => document.body.dataset.ignoredBufferingPause), 'buffering Pause request');
  await bufferingPage.evaluate(() => { buffering=false; });
  const pauseAck = await until(async () => (await worker.evaluate(() => acknowledgments))[beforePause], 'buffering Pause recovery ACK');
  assert.equal(pauseAck.ok, true, JSON.stringify(pauseAck));
  assert.deepEqual(await bufferingPage.evaluate(() => [playing, document.body.dataset.ignoredBufferingPause,
    document.body.dataset.pauseRequest, document.body.dataset.toggle]), [false, '1', '2', bufferingClicks]);
  // Navigation changes the ID but leaves the destination UNSTARTED. Its first
  // Play is ignored; recovery must not click Previous/Next a second time.
  const destinationPage = browser.pages().find(page => page.url().startsWith(musicURL));
  await destinationPage.evaluate(() => {
    index=2;playing=true;destinationUnstarted=true;ignoredDestinationPlays=1;
  });
  for (const type of ['prev', 'next']) {
    await destinationPage.evaluate(() => { playing=true; });
    const clicks = await destinationPage.evaluate(type => Number(document.body.dataset[type] || 0), type);
    const plays = await destinationPage.evaluate(() => Number(document.body.dataset.playRequest || 0));
    const ignored = await destinationPage.evaluate(() => Number(document.body.dataset.ignoredDestinationRequest || 0));
    const before = await worker.evaluate(() => acknowledgments.length);
    await postEvent(type);
    const result = await until(async () => (await worker.evaluate(() => acknowledgments))[before], `${type} destination recovery ACK`);
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(await destinationPage.evaluate(() => playing), true);
    assert.equal(await destinationPage.evaluate(type => Number(document.body.dataset[type]), type), clicks+1);
    assert.equal(await destinationPage.evaluate(() => Number(document.body.dataset.playRequest)), plays+2);
    assert.equal(await destinationPage.evaluate(() => Number(document.body.dataset.ignoredDestinationRequest)), ignored+1);
    const paused = await worker.evaluate(() => acknowledgments.length);
    await postEvent('toggle');
    assert.equal((await until(async () => (await worker.evaluate(() => acknowledgments))[paused], 'Pause after destination recovery')).ok, true);
    await new Promise(resolve => setTimeout(resolve, 1100));
    assert.equal(await destinationPage.evaluate(() => playing), false);
    assert.equal(await destinationPage.evaluate(() => Number(document.body.dataset.playRequest)), plays+2);
  }
  await destinationPage.evaluate(() => { destinationUnstarted=false; });
  // Previous can leave the same item/position and omit seek events. Its result
  // must not hold subsequent controls or let an old monitor undo a later Pause.
  const controlled = browser.pages().find(page => page.url().startsWith(musicURL));
  const pauseDelays = [];
  for (const stall of [true, false]) {
    await controlled.evaluate(stall => {
      index=0;time=0;playing=true;initialized=true;stallPrevious=stall;seekSignal=false;
    }, stall);
    const before = await worker.evaluate(() => acknowledgments.length);
    const attempts = await controlled.evaluate(() => Number(document.body.dataset.previousAttempt || 0));
    await postEvent('prev');
    await until(() => controlled.evaluate(attempts => Number(document.body.dataset.previousAttempt) === attempts+1, attempts), 'Previous dispatched');
    if (!stall) {
      await until(() => controlled.evaluate(() => playing), 'same-item playback recovered without seek event');
    }
    const start = performance.now();
    await postEvent('toggle');
    await until(() => controlled.evaluate(() => !playing), 'Pause overtakes old outcome verification');
    const delay = Math.round(performance.now() - start);
    pauseDelays.push(delay);
    assert.ok(delay < 1000, 'Pause must not wait for a ten-second result timeout');
    await until(async () => (await worker.evaluate(() => acknowledgments.length)) >= before+2, 'both final results');
    const replies = await worker.evaluate(before => acknowledgments.slice(before), before);
    assert.ok(replies.some(reply => reply.ok));
    assert.ok(replies.some(reply => !reply.ok && reply.reason === 'command-superseded'));
    await new Promise(resolve => setTimeout(resolve, 180));
    assert.equal(await controlled.evaluate(() => playing), false, 'old verification did not resume after Pause');
    const next = await worker.evaluate(() => acknowledgments.length);
    await postEvent('next');
    assert.equal((await until(async () => (await worker.evaluate(() => acknowledgments))[next], 'Next after interrupted Previous')).ok, true);
  }
  t.diagnostic(`Modeled stalled/no-seek Previous: Pause observed after ${pauseDelays.join('/')} ms; older monitors did not resume playback.`);
  assert.equal(await worker.evaluate(() => legacyPollsStarted), 0, 'modern controls must not consume connections with per-tab long polls');
  // Force a genuine missing receiver by removing it from the actual isolated
  // world once. This is a pre-delivery failure, unlike a lost execution reply.
  const navigation = await worker.evaluate(async () => {
    const original = chrome.tabs.sendMessage.bind(chrome.tabs);
    let calls = 0;
    chrome.tabs.sendMessage = async (...args) => {
      if (++calls === 1) {
        await chrome.tabs.update(args[0], { url: 'about:blank' });
        await new Promise(resolve => setTimeout(resolve, 100));
        setTimeout(() => { void chrome.tabs.update(args[0], { url: 'https://music.youtube.com/' }); }, 100);
      }
      return original(...args);
    };
    try { return { ok: await performBrowserCommand({ id: 'replaced-document', type: 'next' }), calls }; }
    finally { chrome.tabs.sendMessage = original; }
  });
  assert.equal(navigation.ok, true);
  assert.ok(navigation.calls >= 2);
  const music = browser.pages().find(page => page.url().startsWith(musicURL));
  assert.equal(await music.evaluate(() => document.body.dataset.next), '1', 'no duplicate effect after navigation');
  // Keep the real extension popup open while content metadata changes. No
  // manual status click or popup reopen should be needed to see the new track.
  // Chromium exposes the toolbar popup as a CDP target without a Playwright
  // page event. A regular extension tab has a different runtime message sender.
  const popupSession = await browser.browser().newBrowserCDPSession();
  await worker.evaluate(() => chrome.action.openPopup());
  const popup = await until(async () => (await popupSession.send('Target.getTargets')).targetInfos
    .find(target => target.url === `${origin}/popup.html`), 'toolbar popup target');
  const { sessionId } = await popupSession.send('Target.attachToTarget', { targetId: popup.targetId, flatten: false });
  let popupCommand = 0, popupStatus = '';
  async function popupEvaluate(expression = 'document.getElementById("trackTitle")?.textContent || ""') {
    const id = ++popupCommand;
    let listener;
    const response = new Promise(resolve => {
      listener = event => {
        const message = JSON.parse(event.message);
        if (event.sessionId === sessionId && message.id === id) resolve(message);
      };
      popupSession.on('Target.receivedMessageFromTarget', listener);
    });
    try {
      await popupSession.send('Target.sendMessageToTarget', { sessionId, message: JSON.stringify({ id,
        method: 'Runtime.evaluate', params: { expression, returnByValue: true } }) });
      const message = await response;
      assert.equal(message.error, undefined);
      assert.equal(message.result.exceptionDetails, undefined);
      return popupStatus = message.result.result.value;
    } finally { popupSession.off('Target.receivedMessageFromTarget', listener); }
  }
  async function popupQueueControls(mode, repeat, shuffle) {
    await until(() => popupEvaluate(`playback.player?.mode === "${mode}" && !document.getElementById("repeat").disabled`), 'popup repeat ready');
    await popupEvaluate('document.getElementById("repeat").click()');
    await until(() => music.evaluate(desired => playerBar.repeatMode === desired, repeat), 'popup repeat executed');
    await until(() => popupEvaluate(`document.getElementById("repeatIcon").src.includes("repeat-${repeat.toLowerCase()}.png")`), 'popup repeat state');
    await until(() => popupEvaluate('!document.getElementById("shuffle").disabled'), 'popup shuffle ready');
    await popupEvaluate('document.getElementById("shuffle").click()');
    await until(() => music.evaluate(desired => playerBar.shuffleOn === desired, shuffle), 'popup shuffle executed');
    await until(() => popupEvaluate(`document.getElementById("shuffle").getAttribute("aria-pressed") === "${shuffle}"`), 'popup shuffle state');
  }
  try {
    await until(async () => (await popupEvaluate()).includes('Fixture song'), 'initial popup track');
    await music.evaluate(() => { document.querySelector('ytmusic-player-bar .title').textContent = 'Updated fixture song'; });
    await until(async () => (await popupEvaluate()).includes('Updated fixture song'), 'live popup track');
    for (const desired of [false, true]) {
      await until(() => popupEvaluate('!document.getElementById("playPause").disabled'), 'popup playback ready');
      await popupEvaluate('document.getElementById("playPause").click()');
      await until(() => music.evaluate(desired => playing === desired, desired), 'popup playback state');
      await until(() => popupEvaluate(`!document.getElementById("playPause").disabled && document.getElementById("${desired ? 'pauseIcon' : 'playIcon'}").getClientRects().length > 0`), 'observed popup playback icon');
    }
    for (const [button, delta] of [['previous', -1], ['next', 1]]) {
      const before = await music.evaluate(() => index);
      await until(() => popupEvaluate(`!document.getElementById("${button}").disabled`), 'popup navigation ready');
      await popupEvaluate(`document.getElementById("${button}").click()`);
      await until(() => music.evaluate(expected => index === expected && playing, before + delta), 'popup navigation and playback');
    }
    for (const [button, rating] of [['like', 'LIKE'], ['dislike', 'DISLIKE']]) {
      await until(() => popupEvaluate(`!document.getElementById("${button}").disabled`), 'popup rating ready');
      await popupEvaluate(`document.getElementById("${button}").click()`);
      await until(() => music.evaluate(rating => document.querySelector('ytmusic-like-button-renderer').getAttribute('like-status') === rating, rating), 'popup site rating');
      await until(() => popupEvaluate(`document.getElementById("${button}").getAttribute("aria-pressed") === "true"`), 'observed popup rating');
    }
    for (const amount of [0, 83]) {
      await until(() => popupEvaluate('!document.getElementById("volumeSlider").disabled'), 'popup volume ready');
      await popupEvaluate(`(() => { const slider=document.getElementById("volumeSlider"); slider.value=${amount}; slider.dispatchEvent(new Event("input",{bubbles:true})); slider.dispatchEvent(new Event("change",{bubbles:true})); })()`);
      await until(() => music.evaluate(expected => Number(document.querySelector('#volume-slider').value) === expected, amount), 'popup site volume');
      await until(() => popupEvaluate(`!volume.sending && !volume.editing && document.getElementById("volumeValue").textContent === "${amount}%"`), 'observed popup volume');
    }
    for (const desired of [true, false]) {
      await until(() => popupEvaluate('!document.getElementById("mute").disabled'), 'popup mute ready');
      await popupEvaluate('document.getElementById("mute").click()');
      await until(() => music.evaluate(desired => muted === desired, desired), 'popup site mute');
      await until(() => popupEvaluate(`document.getElementById("mute").getAttribute("aria-pressed") === "${desired}"`), 'observed popup mute');
    }
    await popupQueueControls('bridge', 'ALL', true);
    assert.equal(await popupEvaluate('[...document.querySelectorAll(".media-button img")].every(img => img.complete && img.naturalWidth === 144)'), true, 'popup control icons loaded');
    const beforeLocal = await worker.evaluate(() => acknowledgments.length);
    await child.stop();
    await worker.evaluate(() => chrome.storage.local.remove('bridgeToken'));
    await until(() => popupEvaluate('playback.player?.mode === "local" && !document.getElementById("playPause").disabled'), 'standalone fallback after stopping plugin');
    for (const desired of [false, true]) {
      await popupEvaluate('document.getElementById("playPause").click()');
      await until(() => music.evaluate(desired => playing === desired, desired), 'standalone playback');
      await until(() => popupEvaluate('!document.getElementById("playPause").disabled'), 'standalone playback completion');
    }
    await popupEvaluate('(() => { const slider=document.getElementById("volumeSlider"); slider.value=37; slider.dispatchEvent(new Event("input",{bubbles:true})); slider.dispatchEvent(new Event("change",{bubbles:true})); })()');
    await until(() => music.evaluate(() => Number(document.querySelector('#volume-slider').value) === 37), 'standalone volume');
    await until(() => popupEvaluate('!volume.sending'), 'standalone volume completion');
    await popupEvaluate('document.getElementById("mute").click()');
    await until(() => music.evaluate(() => muted), 'standalone mute');
    await popupEvaluate('document.getElementById("like").click()');
    await until(() => music.evaluate(() => document.querySelector('ytmusic-like-button-renderer').getAttribute('like-status') === 'LIKE'), 'standalone rating');
    await popupQueueControls('local', 'ONE', false);
    assert.equal(await worker.evaluate(() => acknowledgments.length), beforeLocal, 'standalone inputs do not enter the stopped bridge channel');
    assert.equal(await worker.evaluate(() => pairedToken()), '', 'standalone controls need no pairing token');
    await worker.evaluate(token => chrome.storage.local.set({ bridgeToken: token }), token);
    await startBridge();
    await until(() => popupEvaluate('playback.player?.mode === "bridge"'), 'bridge route recovery');
    const recoveredPlayer = await worker.evaluate(async token => (await post('/status', { token })).player, token);
    assert.equal(recoveredPlayer.volume, 37);
    assert.equal(recoveredPlayer.muted, true);
    assert.equal(recoveredPlayer.playing, true);
    assert.equal(recoveredPlayer.rating, 'LIKE');
  } catch (error) { t.diagnostic(`Last toolbar popup status: ${popupStatus}`); throw error; }
  finally {
    await popupSession.send('Target.closeTarget', { targetId: popup.targetId });
    await popupSession.detach();
  }
  const nextBeforeMismatch = await music.evaluate(() => document.body.dataset.next);
  const compatibility = await worker.evaluate(async token => {
    const current = await post('/status', { token });
    const original = fetch;
    try {
      globalThis.fetch = async (...args) => {
        const response = await original(...args);
        if (!args[0].endsWith('/status')) return response;
        return new Response(JSON.stringify({ ...await response.json(), pluginVersion: '2.0.0',
          protocolVersion: 2, minProtocolVersion: 2 }), { status: 200 });
      };
      let blocked;
      try { await post('/status', { token }); } catch (error) { blocked = error.compatibility; }
      const executed = await performBrowserCommand({ id: 'incompatible', type: 'next' });
      const selected = await localPlayer.check();
      const localDuringMismatch = await localPlayer.control({ command: 'mute', playerId: selected.player.id, trackKey: selected.player.key });
      globalThis.fetch = original;
      await post('/status', { token });
      return { current: current.compatibility, blocked, executed, localDuringMismatch: localDuringMismatch.ok, token: await pairedToken(), recovered: bridgeClient.compatibility };
    } finally { globalThis.fetch = original; }
  }, token);
  assert.equal(compatibility.current.compatible, true);
  assert.equal(compatibility.blocked.updateRequired, 'extension');
  assert.equal(compatibility.executed, false);
  assert.equal(compatibility.localDuringMismatch, true, 'bridge protocol blocking does not disable independently authorized local controls');
  assert.equal(compatibility.token, token);
  assert.equal(compatibility.recovered.compatible, true);
  assert.equal(await music.evaluate(() => document.body.dataset.next), nextBeforeMismatch, 'incompatible input had no page effect');
  // Inject a script failure in the local page model to verify diagnostics travel
  // through the actual MAIN/content/worker result path without raw error text.
  await music.evaluate(() => {
    const button = document.querySelector('ytmusic-player-bar .play-pause-button');
    globalThis.originalPlayClick = button.click;
    button.click = () => { throw new TypeError('DO_NOT_RETAIN_PAGE_ERROR_TEXT'); };
  });
  const prior = await worker.evaluate(() => acknowledgments.length);
  try {
    await postEvent('toggle');
    const result = await until(async () => (await worker.evaluate(() => acknowledgments))[prior], 'diagnostic failure ACK');
    assert.equal(result.reason, 'player-error');
    const diagnostic = await worker.evaluate(() => browserChannel.lastFailure);
    assert.equal(diagnostic.source, 'exception');
    assert.equal(diagnostic.exception, 'TypeError');
    assert.equal(diagnostic.errorPhase, 'play-button');
    assert.equal(diagnostic.inputState, 1);
    assert.equal(diagnostic.inputHasTrack, true);
    assert.equal(diagnostic.inputMediaReady, 4);
    assert.equal(diagnostic.inputAction, 'play-button');
    assert.equal(diagnostic.inputApi, 'movie-player');
    assert.equal(typeof diagnostic.inputUserActive, 'boolean');
    assert.equal(typeof diagnostic.inputUserEverActive, 'boolean');
    assert.equal(JSON.stringify(diagnostic).includes('DO_NOT_RETAIN'), false);
  } finally {
    await music.evaluate(() => { document.querySelector('ytmusic-player-bar .play-pause-button').click = globalThis.originalPlayClick; delete globalThis.originalPlayClick; });
  }
  const beforeSeek = await worker.evaluate(() => playerSnapshots.length);
  await music.evaluate(() => { time = 62; document.querySelector('audio').dispatchEvent(new Event('seeked')); });
  await until(() => worker.evaluate(start => playerSnapshots.slice(start).some(state => state.positionSeconds === 62), beforeSeek),
    'playback position sync');
  const version = browser.browser().version();
  await browser.close();
  browser = null;
  const savedTrack = await until(async () => {
    const { track } = JSON.parse(await readFile(join(temp, 'MusicDeckBridge', 'last-track.json'), 'utf8'));
    return track.positionSeconds === 62 && track;
  }, 'latest track snapshot after Chromium exits');
  assert.equal(savedTrack.durationSeconds, 180);
  assert.equal(savedTrack.repeatMode, 'ONE');
  assert.equal(savedTrack.shuffleEnabled, false);
  assert.equal(savedTrack.rating, 'LIKE');

  // Key presses happen before Chromium starts. The bridge's test launcher is
  // a no-op, so restart the paired profile after its native launch delay.
  delayedQueue = true;
  await postEvent('repeat');
  await postEvent('shuffle');
  await new Promise(resolve => setTimeout(resolve, 2200));
  browser = await launchBrowser();
  const queuePage = await until(() => browser.pages().find(page => page.url().startsWith(musicURL)), 'queue input opens a music tab');
  await until(async () => {
    const { track } = JSON.parse(await readFile(join(temp, 'MusicDeckBridge', 'last-track.json'), 'utf8'));
    return track.repeatMode === 'ALL' && track.shuffleEnabled === true;
  }, 'both deferred queue controls are observed');
  assert.deepEqual(await queuePage.evaluate(() => ({ repeat: document.body.dataset.repeatModes,
    shuffle: document.body.dataset.shuffle, playing, playRequests: document.body.dataset.playRequest })),
  { repeat: ' ALL', shuffle: '1', playing: false, playRequests: undefined });
  t.diagnostic(`Chromium ${version}; Repeat and Shuffle pressed before browser startup each changed the restored player once. Fixture DOM; actual YouTube Music and Windows launch remain manual checks.`);

  for (const [pressBeforeConnect, count] of [[true, 3], [false, 4]]) {
    await browser.close();
    browser = null;
    restoredStartup = true;
    delayedQueue = false;
    holdStartup = true;
    await postEvent('toggle');
    await new Promise(resolve => setTimeout(resolve, 2200));
    if (pressBeforeConnect) for (let index = 1; index < count; index++) await postEvent('toggle');
    browser = await launchBrowser();
    const startupWorker = browser.serviceWorkers()[0] || await browser.waitForEvent('serviceworker');
    const page = await until(() => browser.pages().find(page => page.url().startsWith(musicURL)), 'playback opens Music');
    await until(() => page.evaluate(() => document.body.dataset.playRequest === '1' && !playing), 'first Play is sent but has not started');
    if (!pressBeforeConnect) for (let index = 1; index < count; index++) await postEvent('toggle');
    await postEvent('volume_delta');
    await postEvent('repeat');
    await until(() => page.evaluate(() => document.body.dataset.volume_delta === '1' && playerBar.repeatMode === 'ALL'),
      'volume and repeat still execute while playback toggles are waiting');
    await until(() => startupWorker.evaluate(count =>
      browserChannel.playbackTrace.filter(event => event.stage === 'player-received').length === count, count),
    'every toggle reaches the player before playback starts');
    assert.equal(await page.evaluate(() => document.body.dataset.toggle), undefined);
    await page.evaluate(() => { playing = true; initialized = true; });
    const results = await until(() => startupWorker.evaluate(count => {
      const rows = browserChannel.playbackTrace.filter(event => event.stage === 'player-result');
      return rows.length === count || rows.some(row => row.result !== 'ok') ? rows : null;
    }, count), 'every playback result is traced');
    const states = [-1, ...Array.from({ length: count }, (_, index) => index % 2 === 0 ? 1 : 2)];
    assert.deepEqual(results.map(({ type, held, result, inputState, state }) => [type, held, result, inputState, state]),
      states.slice(1).map((state, index) => [index === 0 ? 'play' : 'toggle', index > 0, 'ok', states[index], state]));
    assert.deepEqual(results.map(({ inputAction }) => inputAction),
      results.map((_, index) => index % 2 === 0 ? 'play-api' : 'pause-api'));
    assert.equal(await page.evaluate(() => playing), count % 2 === 1);
    assert.equal(await page.evaluate(() => document.body.dataset.ignoredResumeClick), undefined);
    for (const { id } of results) {
      assert.match(child.output, new RegExp(`Playback trace {"id":"${id}","stage":"bridge-queued"`));
      assert.match(child.output, new RegExp(`Playback trace {"id":"${id}","stage":"bridge-delivered"`));
    }
  }
  t.diagnostic('Three presses before Chrome connected and four during modeled startup each alternated playback after confirmation. Volume and Repeat applied during both waits.');
});
