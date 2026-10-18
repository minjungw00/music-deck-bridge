import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { createServer as httpsServer } from 'node:https';
import { createServer } from 'node:net';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const musicURL = 'https://music.youtube.com/';
const fixture = `<!doctype html><html><body>
<ytmusic-player-bar>
 <span class="title">Fixture song</span><span class="byline">Fixture artist</span>
 <audio></audio><div id="movie_player"></div>
 <button class="play-pause-button" onclick="control('toggle')">Play</button>
 <button class="previous-button" onclick="control('prev')">Previous</button>
 <button class="next-button" onclick="control('next')">Next</button>
 <button class="volume" onclick="muted=!muted;record('mute')">Mute</button>
 <div id="volume-slider" style="width:100px;height:20px" aria-valuenow="50"></div>
 <ytmusic-like-button-renderer like-status="INDIFFERENT">
  <div id="button-shape-like"><button onclick="record('like')">Like</button></div>
  <div id="button-shape-dislike"><button onclick="record('dislike')">Dislike</button></div>
 </ytmusic-like-button-renderer>
</ytmusic-player-bar>
<script>
let playing=false, muted=false, ready=false, index=2;
const tracks=['aaaaaaaaaaa','bbbbbbbbbbb','ccccccccccc','ddddddddddd','eeeeeeeeeee'];
function record(key){ document.body.dataset[key]=String(Number(document.body.dataset[key]||0)+1); }
function control(type){
 if(!ready){record('early');return;}
 if(type==='toggle')playing=!playing;
 if(type==='prev')index--;
 if(type==='next')index++;
 record(type);
}
Object.defineProperties(document.querySelector('audio'), {
 paused:{get:()=>true}, ended:{get:()=>false}, readyState:{get:()=>ready?4:0}, duration:{get:()=>180},
 currentSrc:{get:()=>tracks[index]}
});
const api=document.querySelector('#movie_player');
api.isReady=()=>ready;api.getPlayerState=()=>playing?1:2;api.getVideoData=()=>({video_id:tracks[index]});
api.isMuted=()=>muted;
setTimeout(()=>{ready=true;},500);
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
  let browser, process, closed, site;
  t.after(async () => {
    await browser?.close();
    if (process) { process.kill(); await closed; }
    if (site) { site.closeAllConnections(); await new Promise(resolve => site.close(resolve)); }
    await rm(temp, { recursive: true, force: true });
  });
  // Ephemeral certificate/key are generated only in the temporary test profile.
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1',
    '-keyout', join(temp, 'key'), '-out', join(temp, 'cert'), '-subj', '/CN=music.youtube.com'], { stdio: 'ignore' });
  site = httpsServer({ key: await readFile(join(temp, 'key')), cert: await readFile(join(temp, 'cert')) },
    (_req, res) => { setTimeout(() => { res.setHeader('Content-Type', 'text/html'); res.end(fixture); }, 250); });
  await new Promise(resolve => site.listen(0, '127.0.0.1', resolve));
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  process = spawn(globalThis.process.execPath, [join(root, 'streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/bin/plugin.js')], {
    env: { ...globalThis.process.env, APPDATA: temp, MUSIC_DECK_BRIDGE_DEV_TEST: '1',
      MUSIC_DECK_BRIDGE_TEST_PORT: String(port), MUSIC_DECK_BRIDGE_TEST_PIN: '654321' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  closed = once(process, 'close');
  let output = '';
  for (const stream of [process.stdout, process.stderr]) stream.on('data', chunk => { output += chunk; });
  await until(() => output.includes('Loopback bridge on'), 'bridge startup');
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
    assert.equal(ack.ok, true, `${type}: ${JSON.stringify(ack)}; ${output}`);
    const page = await until(() => browser.pages().find(page => page.url().startsWith(musicURL)), 'music tab');
    await page.waitForLoadState();
    const effect = type === 'nowplaying' ? 'toggle' : type;
    if (type !== 'open') assert.equal(await page.evaluate(type => document.body.dataset[type], effect), '1', type);
    assert.equal(await page.evaluate(() => document.body.dataset.early), undefined, 'restored controls must wait for the player');
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
  t.diagnostic(`Chromium ${browser.browser().version()}; 9 cold-tab actions, delayed readiness, MAIN state sync and replaced-receiver recovery passed. Fixture DOM; actual YouTube Music and Windows launch remain manual checks.`);
});
