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
 <audio></audio>
 <button class="play-pause-button" onclick="playing=!playing;record('toggle')">Play</button>
 <button class="previous-button" onclick="record('prev')">Previous</button>
 <button class="next-button" onclick="record('next')">Next</button>
 <button class="volume" onclick="record('mute')">Mute</button>
 <div id="volume-slider" style="width:100px;height:20px" aria-valuenow="50"></div>
 <ytmusic-like-button-renderer like-status="INDIFFERENT">
  <div id="button-shape-like"><button onclick="record('like')">Like</button></div>
  <div id="button-shape-dislike"><button onclick="record('dislike')">Dislike</button></div>
 </ytmusic-like-button-renderer>
</ytmusic-player-bar>
<script>
let playing=false;
function record(key){ document.body.dataset[key]=String(Number(document.body.dataset[key]||0)+1); }
Object.defineProperties(document.querySelector('audio'), {
 paused:{get:()=>!playing}, ended:{get:()=>false}, readyState:{get:()=>4}, duration:{get:()=>180}
});
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
    const original = fetch;
    globalThis.fetch = async (url, options) => {
      if (url.endsWith('/listen')) legacyPollsStarted++;
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
  for (const type of ['toggle', 'prev', 'next', 'mute', 'like', 'dislike', 'volume_delta', 'open']) {
    for (const page of browser.pages()) if (page.url().startsWith(musicURL)) await page.close();
    const before = await worker.evaluate(() => acknowledgments.length);
    await postEvent(type);
    const ack = await until(async () => (await worker.evaluate(() => acknowledgments))[before], `${type} ACK`);
    assert.equal(ack.ok, true, `${type}: ${JSON.stringify(ack)}; ${output}`);
    const page = await until(() => browser.pages().find(page => page.url().startsWith(musicURL)), 'music tab');
    await page.waitForLoadState();
    if (type !== 'open') assert.equal(await page.evaluate(type => document.body.dataset[type], type), '1', type);
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
  t.diagnostic(`Chromium ${browser.browser().version()}; 8 cold-tab inputs and replaced-receiver recovery passed. Fixture DOM; actual YouTube Music and Windows launch remain manual checks.`);
});
