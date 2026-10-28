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
const fixture = (restored = false, ignoredStartupRequests = 0) => `<!doctype html><html><body>
<ytmusic-player-bar>
 <span class="title">Fixture song</span><span class="byline">Fixture artist</span>
 <audio></audio><div id="movie_player"></div>
 <button class="play-pause-button" disabled onclick="control('toggle')">Play</button>
 <button class="previous-button" disabled onclick="control('prev')">Previous</button>
 <button class="next-button" disabled onclick="control('next')">Next</button>
 <button class="volume" onclick="muted=!muted;record('mute')">Mute</button>
 <div id="volume-slider" style="width:100px;height:20px" aria-valuenow="50"></div>
 <ytmusic-like-button-renderer like-status="INDIFFERENT">
  <div id="button-shape-like"><button onclick="record('like')">Like</button></div>
  <div id="button-shape-dislike"><button onclick="record('dislike')">Dislike</button></div>
 </ytmusic-like-button-renderer>
</ytmusic-player-bar>
<script>
let playing=false, muted=false, ready=false, cued=false, initialized=false, index=2, time=0, stallPrevious=false, seekSignal=true;
let destinationUnstarted=false, unstartedDestination=false, ignoredDestinationPlays=0, destinationPlays=0;
const restored=${restored};
const ignoredStartupRequests=${ignoredStartupRequests};
const playerListeners=new Map();
const tracks=['aaaaaaaaaaa','bbbbbbbbbbb','ccccccccccc','ddddddddddd','eeeeeeeeeee'];
function record(key){ document.body.dataset[key]=String(Number(document.body.dataset[key]||0)+1); }
function control(type){
 if(!ready){record('early');return;}
 if(type==='toggle'&&restored&&!initialized){record('ignoredRestoredClick');return;}
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
 currentSrc:{get:()=>initialized?tracks[index]:''}
});
const api=document.querySelector('#movie_player');
api.isReady=()=>ready;api.getPlayerState=()=>unstartedDestination?-1:!initialized?(cued&&!restored?5:-1):playing?1:2;
api.getVideoData=()=>({video_id:initialized||restored?tracks[index]:''});
api.getCurrentTime=()=>time;
api.playVideo=()=>{
 if(!ready){record('early');return;}
 document.body.dataset.apiUserActive=String(navigator.userActivation.isActive);
 document.body.dataset.apiUserEverActive=String(navigator.userActivation.hasBeenActive);
 record('playRequest');
 if(restored&&!initialized&&Number(document.body.dataset.playRequest)<=ignoredStartupRequests){record('ignoredStartupRequest');return;}
 if(unstartedDestination&&++destinationPlays<=ignoredDestinationPlays){record('ignoredDestinationRequest');return;}
 unstartedDestination=false;
 playing=true;initialized=true;
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
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
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
    (_req, res) => { setTimeout(() => { res.setHeader('Content-Type', 'text/html'); res.end(fixture(restoredStartup, ignoredStartupRequests)); }, 250); });
  await new Promise(resolve => site.listen(0, '127.0.0.1', resolve));
  const port = await freePort();
  process = spawn(globalThis.process.execPath, [join(root, 'streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/bin/plugin.js')], {
    env: { ...globalThis.process.env, APPDATA: temp, MUSIC_DECK_BRIDGE_DEV_TEST: '1',
      MUSIC_DECK_BRIDGE_TEST_PORT: String(port), MUSIC_DECK_BRIDGE_TEST_PIN: '654321' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child = manageChild(process);
  await child.ready('Loopback bridge on');
  const extension = join(root, 'chrome-extension');
  browser = await chromium.launchPersistentContext(join(temp, 'profile'), {
    channel: 'chromium', headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`,
      `--host-resolver-rules=MAP music.youtube.com 127.0.0.1:${site.address().port}`, '--ignore-certificate-errors'],
  });
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
        playerSnapshots.push({ clientId, playing: state.playing, muted: state.muted });
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
    const start = Date.now();
    await postEvent('toggle');
    await until(() => controlled.evaluate(() => !playing), 'Pause overtakes old outcome verification');
    const delay = Date.now()-start;
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
      globalThis.fetch = original;
      await post('/status', { token });
      return { current: current.compatibility, blocked, executed, token: await pairedToken(), recovered: bridgeClient.compatibility };
    } finally { globalThis.fetch = original; }
  }, token);
  assert.equal(compatibility.current.compatible, true);
  assert.equal(compatibility.blocked.updateRequired, 'extension');
  assert.equal(compatibility.executed, false);
  assert.equal(compatibility.token, token);
  assert.equal(compatibility.recovered.compatible, true);
  assert.equal(await music.evaluate(() => document.body.dataset.next), '1', 'incompatible input had no page effect');
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
  t.diagnostic(`Chromium ${browser.browser().version()}; ignored-initial-Play startup recovery, ignored destination Play recovery after Previous/Next followed by Pause, unstarted API-ready selection delay, Play-gated media/track initialization, cold-tab and post-launch controls, stalled/no-seek Previous followed by responsive Pause/Next, stale-monitor cancellation and receiver recovery passed. Fixture DOM; actual YouTube Music and Windows launch remain manual checks.`);
});
