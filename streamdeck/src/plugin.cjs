'use strict';
/**
 * Music Deck Bridge.
 * Official Stream Deck SDK + a loopback-only HTTP bridge.
 * SDK and runtime dependencies are bundled by scripts/build-plugin.mjs.
 * Node.js 24 is provided by Stream Deck 7.1+.
 */
const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { launchChrome } = require('./launch-chrome.cjs');

const PLUGIN_ID = 'io.github.minjungw00.musicdeckbridge';
const LOCALHOST = '127.0.0.1';
const IS_TEST = process.env.MUSIC_DECK_BRIDGE_DEV_TEST === '1';
const DEFAULT_PORT = 17864;
const MIN_PORT = 1024;
const MAX_PORT = 65535;
const PORT_GRACE_MS = 120000;
const appData = process.env.APPDATA || path.join(os.homedir(), '.config');
const dataDir = path.join(appData, 'MusicDeckBridge');
const configFile = path.join(dataDir, 'config.json');
function portNumber(value) {
  const port = Number(value);
  return Number.isInteger(port) && port >= MIN_PORT && port <= MAX_PORT ? port : null;
}
function readPort() {
  if (IS_TEST && portNumber(process.env.MUSIC_DECK_BRIDGE_TEST_PORT)) return portNumber(process.env.MUSIC_DECK_BRIDGE_TEST_PORT);
  try { return portNumber(JSON.parse(fs.readFileSync(configFile, 'utf8')).port) || DEFAULT_PORT; }
  catch { return DEFAULT_PORT; }
}
function savePort(port) {
  fs.mkdirSync(path.dirname(configFile), { recursive: true });
  const temp = configFile + '.tmp-' + process.pid;
  try {
    fs.writeFileSync(temp, JSON.stringify({ port }, null, 2), { mode: 0o600 });
    fs.renameSync(temp, configFile);
  } finally { try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch {} }
}
let currentPort = readPort();
let bridgeServer = null;
let bridgeOnline = false;
let portError = '';
let changingPort = Promise.resolve();
const retiringListeners = new Map();
const LIVE_MS = 90000; // Prevent false offline status when Chrome throttles idle PWA timers.
const PLAYER_STALE_MS = 35000;
const EXTENSION_ONLINE_MS = 45000;
const PIN_LIFETIME_MS = 10 * 60 * 1000;
const authFile = path.join(dataDir, 'auth.json');
const candidates = new Map();
const displayed = new Map();
const queue = [];
const coverCache = new Map();
const coverFailures = new Map();
const listenWaiters = new Map(); // active one-shot long polls per Chrome tab
let browserWaiter = null;
const browserRequests = new Map();
let nativeLaunchStarted = false;
let nativeTabPending = false;
let nativeLaunchTimer = null;
let browserCapable = false;
let cachedCoverUrl = '';
let cachedCoverData = '';
let coverInFlight = '';
let selectedSignature = '';
let currentPin = '';
let pinExpiresAt = 0;
let failures = [];
let auth = null;
let lastExtensionContactAt = 0;
let locale = 'en';
let streamDeck;
let sdOnline = false;
let updateTimer = null;
let hasDrawing = false;
const MARQUEE_STEP_MS = 380;
const MARQUEE_WIDTH = 11;
const STRINGS = {
  ko: { unavailable: '연결 안 됨', offline: '오프라인', pause: '일시정지', play: '재생', muted: '음소거', absent: 'YTM 없음', next: '곡 이동', open: 'YTM 실행', like: '좋아요', dislike: '싫어요' },
  en: { unavailable: 'Disconnected', offline: 'Offline', pause: 'Pause', play: 'Play', muted: 'Muted', absent: 'No YTM', next: 'Track', open: 'Open YTM', like: 'Like', dislike: 'Dislike' },
};
const tr = key => STRINGS[locale]?.[key] || STRINGS.en[key];
const marqueeTimer = setInterval(() => {
  // Scroll only when at least one visible current-track key requests it.
  if ([...displayed.values()].some(item => actionName(item.action) === 'nowplaying' &&
    item.settings?.titleMode === 'scroll')) drawSoon();
}, MARQUEE_STEP_MS);
marqueeTimer.unref();

function log(message) { console.log('[Music Deck Bridge]', message); }
function clip(value, max = 140) { return String(value ?? '').replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, max); }
function limit(x, min, max) { return Math.max(min, Math.min(max, x)); }
function actionName(id) { return id.slice(PLUGIN_ID.length + 1); }
function generatePin() {
  currentPin = IS_TEST && process.env.MUSIC_DECK_BRIDGE_TEST_PIN ? process.env.MUSIC_DECK_BRIDGE_TEST_PIN : String(crypto.randomInt(100000, 1000000));
  pinExpiresAt = Date.now() + PIN_LIFETIME_MS;
  return currentPin;
}
function readAuth() {
  try {
    const data = JSON.parse(fs.readFileSync(authFile, 'utf8'));
    if (typeof data.token === 'string' && /^[a-f0-9]{64}$/.test(data.token) &&
      typeof data.origin === 'string' && validOrigin(data.origin)) return data;
  } catch { /* Not paired yet */ }
  return null;
}
function saveAuth(newAuth) {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  const temp = authFile + '.tmp-' + process.pid;
  try {
    fs.writeFileSync(temp, JSON.stringify(newAuth, null, 2), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temp, authFile);
  } finally { try { fs.rmSync(temp, { force: true }); } catch {} }
  resetSession();
  auth = newAuth;
}
function resetSession() {
  browserWaiter?.reply({ error: 'Pairing revoked' }, 401);
  clearTimeout(nativeLaunchTimer); nativeLaunchTimer = null;
  const pendingBrowser = [...browserRequests.values()];
  browserRequests.clear();
  for (const request of pendingBrowser) request.finish(false);
  nativeLaunchStarted = false;
  nativeTabPending = false;
  browserCapable = false;
  for (const waiters of [...listenWaiters.values()]) {
    for (const waiter of [...waiters]) waiter.reply({ error: 'Pairing revoked' }, 401);
  }
  queue.length = 0;
  candidates.clear();
  selectedSignature = '';
  lastExtensionContactAt = 0;
  cachedCoverUrl = ''; cachedCoverData = '';
  drawSoon();
}
function validOrigin(origin) { return typeof origin === 'string' && /^chrome-extension:\/\/[a-p]{32}$/.test(origin); }
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
function authorized(body, origin) {
  return auth && origin === auth.origin && safeEqual(body.token, auth.token);
}
function sendHttp(res, status, data, origin) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (validOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(status >= 200 && status < 300 && validOrigin(origin) && data && typeof data === 'object' ?
    { ...data, serverPort: currentPort } : data));
}
function getBody(req) {
  return new Promise((resolve, reject) => {
    const parts = []; let total = 0;
    req.on('data', chunk => {
      total += chunk.length;
      if (total > 16000) { reject(new Error('Request too large')); req.destroy(); return; }
      parts.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(parts).toString('utf8'))); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}
function normalizeState(data) {
  const s = data && typeof data === 'object' ? data : {};
  return {
    title: clip(s.title, 180), artist: clip(s.artist, 180),
    cover: typeof s.cover === 'string' ? s.cover.slice(0, 4096) : '',
    coverFallback: typeof s.coverFallback === 'string' ? s.coverFallback.slice(0, 4096) : '',
    playing: s.playing === true,
    muted: s.muted === true,
    volume: Number.isFinite(s.volume) ? limit(Math.round(s.volume), 0, 100) : 0,
    standalone: s.standalone === true,
    rating: ['LIKE', 'DISLIKE', 'INDIFFERENT'].includes(s.rating) ? s.rating : null,
    trackId: typeof s.trackId === 'string' && /^[\w-]{11}$/.test(s.trackId) ? s.trackId : '',
    lastSeen: Date.now(), lastMediaSyncAt: Date.now(),
  };
}
function selectedEntry() {
  const live = [...candidates.entries()].filter(([, s]) => Date.now() - s.lastSeen < LIVE_MS);
  if (!live.length) return null;
  // Installed PWA is always preferred; a playing player wins over paused ones.
  live.sort((a, b) => Number(b[1].standalone) - Number(a[1].standalone) ||
    Number(b[1].playing) - Number(a[1].playing) || b[1].lastSeen - a[1].lastSeen);
  return live[0];
}
function addCommand(type, ticks = 0) {
  const entry = selectedEntry();
  if (!entry) return false;
  const [clientId, state] = entry;
  if (!['toggle', 'next', 'prev', 'mute', 'volume_delta', 'like', 'dislike'].includes(type)) return false;
  const amount = type === 'volume_delta' ? limit(Number(ticks) || 0, -100, 100) : 0;
  if (type === 'volume_delta' && amount === 0) return true;
  const rating = type === 'like' || type === 'dislike';
  if (rating && (!state.title || state.rating === null)) return false;
  queue.push({ clientId, type, amount, created: Date.now(),
    ...(rating ? { trackKey: state.trackId || JSON.stringify([state.title, state.artist]) } : {}) });
  while (queue.length > 60) queue.shift();
  flushWaiters(clientId);
  return true;
}
function dispatch(clientId) {
  const out = [];
  for (let i = queue.length - 1; i >= 0; i--) {
    const cmd = queue[i];
    if (Date.now() - cmd.created > 5000) { queue.splice(i, 1); continue; }
    if (cmd.clientId === clientId) {
      out.push({ type: cmd.type, amount: cmd.amount, ...(cmd.trackKey ? { trackKey: cmd.trackKey } : {}) });
      queue.splice(i, 1);
    }
  }
  return out.reverse();
}
// Deliver controls to an already-waiting Chrome tab instead of waiting for its next 550ms state poll.
function flushWaiters(clientId) {
  const waiting = listenWaiters.get(clientId);
  if (!waiting?.size) return;
  for (const waiter of [...waiting]) {
    const commands = dispatch(clientId);
    if (!commands.length) break;
    waiter.reply({ commands });
  }
}
function listenForCommands(clientId, res, origin) {
  const immediately = dispatch(clientId);
  if (immediately.length) return sendHttp(res, 200, { commands: immediately }, origin);
  const set = listenWaiters.get(clientId) || new Set();
  listenWaiters.set(clientId, set);
  let complete = false;
  const waiter = {
    timer: null,
    reply(message, status = 200) {
      if (complete) return;
      complete = true;
      clearTimeout(waiter.timer);
      set.delete(waiter);
      if (!set.size) listenWaiters.delete(clientId);
      if (!res.destroyed && !res.writableEnded) sendHttp(res, status, message, origin);
    },
  };
  set.add(waiter);
  // Below MV3 service-worker request duration limits; repeated when idle.
  waiter.timer = setTimeout(() => waiter.reply({ commands: [] }), 12000);
  res.once('close', () => {
    if (!complete) {
      complete = true;
      clearTimeout(waiter.timer);
      set.delete(waiter);
      if (!set.size) listenWaiters.delete(clientId);
    }
  });
}
function scheduleNativeLaunch() {
  if (!browserRequests.size || nativeLaunchStarted || nativeLaunchTimer ||
      [...browserRequests.values()].some(request => request.delivered)) return;
  nativeLaunchTimer = setTimeout(async () => {
    nativeLaunchTimer = null;
    if (!browserRequests.size || [...browserRequests.values()].some(request => request.delivered)) return;
    nativeLaunchStarted = true;
    nativeTabPending = true;
    const session = auth;
    const requests = [...browserRequests.values()];
    try {
      if (!IS_TEST) await launchChrome();
      // Without credentials only opening is possible; never bypass PIN pairing.
      if (!session && auth === session) for (const request of requests) request.finish(request.type === 'open');
    } catch (error) {
      log(`Chrome launch failed: ${error.message}`);
      for (const request of requests) request.finish(false);
    }
  }, auth ? 2000 : 0);
}
function flushBrowserRequest() {
  const request = browserRequests.values().next().value;
  if (!browserWaiter || !request || request.delivered) return;
  request.delivered = true;
  clearTimeout(nativeLaunchTimer); nativeLaunchTimer = null;
  browserWaiter.reply({ commands: [{ id: request.id, type: request.type, amount: request.amount,
    expiresAt: request.expiresAt, nativeLaunched: nativeTabPending,
    preferredTabId: request.preferredTabId, ...(request.trackKey ? { trackKey: request.trackKey } : {}) }] });
  nativeTabPending = false;
}
function listenForBrowser(res, origin) {
  // One paired extension profile owns the browser-wide channel, even with no tabs.
  browserCapable = true;
  browserWaiter?.reply({ commands: [] });
  const waiter = {
    timer: null,
    reply(message, status = 200) {
      clearTimeout(waiter.timer);
      if (browserWaiter !== waiter) return;
      browserWaiter = null;
      if (!res.destroyed && !res.writableEnded) sendHttp(res, status, message, origin);
    },
  };
  browserWaiter = waiter;
  waiter.timer = setTimeout(() => waiter.reply({ commands: [] }), 12000);
  res.once('close', () => {
    if (browserWaiter === waiter) { clearTimeout(waiter.timer); browserWaiter = null; }
  });
  flushBrowserRequest();
}
async function requestPlayerCommand(type, amount = 0) {
  if (!['open', 'toggle', 'prev', 'next', 'mute', 'volume_delta', 'like', 'dislike'].includes(type)) return false;
  // Keep existing controls available when paired with a legacy extension.
  if (type !== 'open' && !browserCapable && selectedEntry()) return addCommand(type, amount);
  if (type === 'open') {
    const existing = [...browserRequests.values()].find(request => request.type === 'open');
    if (existing) return existing.promise;
  }
  if (browserRequests.size >= 60) return false;
  const entry = selectedEntry();
  const state = entry?.[1];
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  const request = {
    id: crypto.randomBytes(12).toString('hex'), type, amount, promise, delivered: false,
    expiresAt: Date.now() + 45000, preferredTabId: entry ? Number(entry[0]) : null,
    trackKey: (type === 'like' || type === 'dislike') && state?.title ?
      state.trackId || JSON.stringify([state.title, state.artist]) : null,
    finish(ok) {
      clearTimeout(request.timer);
      browserRequests.delete(request.id);
      resolve(ok);
      if (!browserRequests.size) {
        nativeLaunchStarted = false;
        nativeTabPending = false;
        clearTimeout(nativeLaunchTimer); nativeLaunchTimer = null;
      }
      flushBrowserRequest();
      scheduleNativeLaunch();
    },
  };
  request.timer = setTimeout(() => request.finish(false), 45000);
  browserRequests.set(request.id, request);
  flushBrowserRequest();
  scheduleNativeLaunch();
  return promise;
}
function controlPlayer(context, type, amount = 0) {
  void requestPlayerCommand(type, amount).then(ok => { if (!ok) showAlert(context); });
}
async function requestHandler(req, res) {
  const origin = req.headers.origin;
  // Reject regular web sites, even when localhost can be reached from the browser.
  if (!validOrigin(origin)) return sendHttp(res, 403, { error: 'Extension origin required' });
  if (req.method === 'OPTIONS') return sendHttp(res, 204, {}, origin);
  if (req.method !== 'POST') return sendHttp(res, 405, { error: 'POST only' }, origin);
  let body;
  try { body = await getBody(req); } catch { return sendHttp(res, 400, { error: 'Bad request' }, origin); }
  if (!body || typeof body !== 'object') return sendHttp(res, 400, { error: 'Bad JSON' }, origin);
  if (req.url === '/pair') {
    failures = failures.filter(t => Date.now() - t < 60000);
    if (failures.length >= 5) return sendHttp(res, 429, { error: 'Too many attempts; retry in a minute' }, origin);
    if (Date.now() > pinExpiresAt || !safeEqual(body.pin, currentPin) || !currentPin) {
      failures.push(Date.now());
      return sendHttp(res, 403, { error: 'Incorrect or expired PIN' }, origin);
    }
    const token = crypto.randomBytes(32).toString('hex');
    saveAuth({ token, origin });
    lastExtensionContactAt = Date.now();
    currentPin = ''; pinExpiresAt = 0; failures = [];
    drawSoon();
    return sendHttp(res, 200, { token }, origin);
  }
  if (!authorized(body, origin)) return sendHttp(res, 401, { error: 'Not paired, or extension ID changed' }, origin);
  lastExtensionContactAt = Date.now();
  if (req.url === '/unpair') {
    // Persist revocation before acknowledging it; retain auth if deletion fails.
    fs.rmSync(authFile, { force: true });
    auth = null;
    currentPin = ''; pinExpiresAt = 0;
    resetSession();
    return sendHttp(res, 200, { ok: true }, origin);
  }
  if (req.url === '/configure-port') {
    const result = await changePort(body.port);
    return sendHttp(res, result.ok ? 200 : 409, result, origin);
  }
  if (req.url === '/status') {
    const chosen = selectedEntry();
    return sendHttp(res, 200, { paired: true, active: !!chosen,
      track: chosen ? chosen[1].title : '', standalone: chosen ? chosen[1].standalone : false,
      extensionOnline: Date.now() - lastExtensionContactAt < EXTENSION_ONLINE_MS,
      playerStale: !!chosen && Date.now() - chosen[1].lastMediaSyncAt > PLAYER_STALE_MS,
      coverDetected: Boolean(chosen?.[1].cover),
      coverStatus: getCoverStatus(chosen?.[1].cover) }, origin);
  }
  if (req.url === '/browser-listen') return listenForBrowser(res, origin);
  if (req.url === '/browser-result') {
    const request = browserRequests.get(body.id);
    if (request?.delivered) request.finish(body.ok === true);
    return sendHttp(res, 200, { ok: true }, origin);
  }
  if (req.url === '/listen') {
    const clientId = String(body.clientId ?? '').slice(0, 64);
    if (!/^\d{1,12}$/.test(clientId)) return sendHttp(res, 400, { error: 'Invalid client' }, origin);
    const present = candidates.get(clientId);
    if (!present) return sendHttp(res, 200, { commands: [], idle: true }, origin);
    // A blocked/throttled timer does not imply the content script is disconnected.
    present.lastSeen = Date.now();
    return listenForCommands(clientId, res, origin);
  }
  if (req.url === '/sync') {
    const clientId = String(body.clientId ?? '').slice(0, 64);
    if (!/^\d{1,12}$/.test(clientId)) return sendHttp(res, 400, { error: 'Invalid client' }, origin);
    const state = normalizeState(body.state);
    candidates.set(clientId, state);
    for (const [id, s] of candidates) if (Date.now() - s.lastSeen > LIVE_MS * 2) candidates.delete(id);
    const chosen = selectedEntry();
    const signature = JSON.stringify(chosen ? [chosen[0], chosen[1].title, chosen[1].artist,
      chosen[1].cover, chosen[1].coverFallback, chosen[1].playing, chosen[1].volume, chosen[1].muted, chosen[1].rating] : []);
    if (signature !== selectedSignature) { selectedSignature = signature; drawSoon(); }
    return sendHttp(res, 200, { commands: dispatch(clientId), selected: chosen && chosen[0] === clientId }, origin);
  }
  if (IS_TEST && req.url === '/__test/event') {
    handleDeckEvent(body.event);
    return sendHttp(res, 200, { ok: true }, origin);
  }
  if (IS_TEST && req.url === '/__test/command') {
    return sendHttp(res, 200, { accepted: addCommand(body.type, body.amount) }, origin);
  }
  return sendHttp(res, 404, { error: 'Unknown endpoint' }, origin);
}
function sendStream(message) {
  if (!sdOnline) return;
  let result;
  if (message.event === 'sendToPropertyInspector') {
    // A port change can finish after the user switches inspectors.
    if (streamDeck.ui.action?.id !== message.context) return;
    result = streamDeck.ui.sendToPropertyInspector(message.payload);
  } else {
    const action = streamDeck.actions.getActionById(message.context);
    if (!action) return;
    if (message.event === 'setTitle') result = action.setTitle(message.payload.title);
    else if (message.event === 'setImage') result = action.setImage(message.payload.image);
    else if (message.event === 'setFeedback' && action.isDial()) result = action.setFeedback(message.payload);
    else if (message.event === 'showAlert') result = action.showAlert();
  }
  void result?.catch(error => log(`Stream Deck output error: ${error.message}`));
}
function setTitle(context, title) { sendStream({ event: 'setTitle', context, payload: { title } }); }
function setImage(context, image) { sendStream({ event: 'setImage', context, payload: image ? { image } : {} }); }
function setFeedback(context, feedback) { sendStream({ event: 'setFeedback', context, payload: feedback }); }
function showAlert(context) { sendStream({ event: 'showAlert', context }); }
function ellipsis(str, n = 11) {
  const chars = [...String(str || '')];
  return chars.length > n ? chars.slice(0, n - 1).join('') + '…' : chars.join('');
}
// Grapheme-aware scrolling prevents cutting Hangul combining characters and emoji.
const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });
function glyphs(value) {
  const text = String(value || '');
  return [...segmenter.segment(text)].map(s => s.segment);
}
function marquee(value, started, now = Date.now()) {
  const characters = glyphs(value);
  if (characters.length <= MARQUEE_WIDTH) return characters.join('');
  const progress = Math.floor((now - started) / MARQUEE_STEP_MS);
  if (progress < 3) return characters.slice(0, MARQUEE_WIDTH).join('');
  const gap = [' ', ' ', ' '];
  const loop = [...characters, ...gap];
  const start = (progress - 3) % loop.length;
  return Array.from({ length: MARQUEE_WIDTH }, (_, i) => loop[(start + i) % loop.length]).join('');
}
const COVERS = new Set(['i.ytimg.com', 'img.youtube.com', 'yt3.ggpht.com', 'yt3.googleusercontent.com']);
function validCover(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port &&
      (COVERS.has(u.hostname) || /^lh[0-9]+\.googleusercontent\.com$/.test(u.hostname));
  } catch { return false; }
}
async function fetchCover(source) {
  // Reject redirects off Google/YouTube image hosts; do not follow to arbitrary targets.
  let url = source;
  for (let redirect = 0; redirect <= 3; redirect++) {
    if (!validCover(url)) throw new Error('이미지 호스트가 허용 목록에 없음');
    const response = await fetch(url, {
      redirect: 'manual',
      headers: { 'Referer': 'https://music.youtube.com/' },
      signal: AbortSignal.timeout(5000),
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const next = response.headers.get('location');
      if (!next) throw new Error('리디렉션 주소 없음');
      url = new URL(next, url).href;
      continue;
    }
    if (!response.ok) throw new Error(`이미지 HTTP ${response.status}`);
    const type = response.headers.get('content-type')?.split(';')[0]?.trim()?.toLowerCase();
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error(`지원하지 않는 이미지 형식: ${type || 'unknown'}`);
    const size = Number(response.headers.get('content-length'));
    if (size > 2000000) throw new Error('이미지 크기 제한 초과 (2MB)');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('이미지 본문 없음');
    const chunks = []; let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 2000000) { await reader.cancel(); throw new Error('이미지 크기 제한 초과 (2MB)'); }
      chunks.push(Buffer.from(value));
    }
    if (!total) throw new Error('비어 있는 이미지');
    return `data:${type};base64,${Buffer.concat(chunks).toString('base64')}`;
  }
  throw new Error('이미지 리디렉션이 너무 많음');
}
async function loadCover(src, fallback = '') {
  if (!validCover(src) || src === coverInFlight) return;
  if (coverCache.has(src)) {
    cachedCoverUrl = src;
    cachedCoverData = coverCache.get(src);
    drawSoon();
    return;
  }
  const failure = coverFailures.get(src);
  if (failure && Date.now() - failure.time < 30000) return;
  coverInFlight = src;
  try {
    let uri;
    try { uri = await fetchCover(src); }
    catch (error) {
      // If the service rejects a requested high-resolution variant, retain the
      // low-resolution cover instead of making the key permanently blank.
      if (!fallback || fallback === src || !validCover(fallback)) throw error;
      uri = await fetchCover(fallback);
    }
    coverCache.set(src, uri);
    coverFailures.delete(src);
    if (coverCache.size > 12) coverCache.delete(coverCache.keys().next().value);
    if (selectedEntry()?.[1].cover === src) {
      cachedCoverUrl = src;
      cachedCoverData = uri;
      drawSoon();
    }
  } catch (e) {
    coverFailures.set(src, { time: Date.now(), reason: String(e.message || '다운로드 실패').slice(0, 120) });
    if (coverFailures.size > 25) coverFailures.delete(coverFailures.keys().next().value);
  } finally { coverInFlight = ''; }
}
function getCoverStatus(src) {
  if (!src) return 'missing';
  if (!validCover(src)) return 'blocked';
  if (cachedCoverUrl === src) return 'ready';
  if (coverInFlight === src) return 'downloading';
  if (coverFailures.has(src)) return 'failed';
  return 'waiting';
}
function paint() {
  if (hasDrawing) return;
  hasDrawing = true;
  try {
    const chosen = selectedEntry();
    const state = chosen?.[1];
    for (const [context, item] of displayed) {
      const kind = actionName(item.action);
      if (kind === 'nowplaying') {
        const sig = state ? `${state.title}\u0000${state.artist}` : 'offline';
        if (item.trackSignature !== sig || item.lastMode !== item.settings?.titleMode) {
          item.trackSignature = sig;
          item.lastMode = item.settings?.titleMode;
          item.marqueeStart = Date.now();
        }
        const title = !state ? `YouTube Music\n${tr('unavailable')}` :
          `${item.settings?.titleMode === 'scroll' ?
            marquee(state.title || 'YouTube Music', item.marqueeStart) : ellipsis(state.title || 'YTM', 12)}\n${item.settings?.titleMode === 'scroll' ?
              marquee(state.artist || '', item.marqueeStart + 600) : ellipsis(state.artist, 11)}`;
        if (item.lastTitle !== title) { setTitle(context, title); item.lastTitle = title; }
        const image = state?.cover && cachedCoverUrl === state.cover ? cachedCoverData : null;
        // Do not continually transmit the same cover (may be several hundred KB).
        if (item.lastImage !== image) { setImage(context, image); item.lastImage = image; }
      } else if (kind === 'toggle') {
        // Reflect the selected player's confirmed state, including changes made
        // in Chrome. A key press alone must not optimistically flip the icon.
        const image = `imgs/actions/toggle/${state?.playing ? 'pause' : 'key'}@2x.png`;
        if (item.lastImage !== image) { setImage(context, image); item.lastImage = image; }
        if (item.lastTitle !== '') { setTitle(context, ''); item.lastTitle = ''; }
      } else if (kind === 'open') {
        if (item.lastTitle !== '') { setTitle(context, ''); item.lastTitle = ''; }
      } else if (kind === 'like' || kind === 'dislike') {
        const selected = state?.rating === kind.toUpperCase();
        const image = `imgs/actions/${kind}/${selected ? 'selected' : 'key'}@2x.png`;
        if (item.lastImage !== image) { setImage(context, image); item.lastImage = image; }
        if (item.lastTitle !== '') { setTitle(context, ''); item.lastTitle = ''; }
      } else if (kind === 'volume') {
        const vol = state ? `${state.muted ? tr('muted') + ' ' : ''}${state.volume}%` : tr('absent');
        setFeedback(context, { title: 'YouTube Music', value: vol, indicator: { value: state?.volume ?? 0, range: { min: 0, max: 100 } } });
      } else if (kind === 'trackdial') {
        setFeedback(context, { title: tr('next'), value: state ? ellipsis(state.title, 14) : tr('unavailable') });
      }
    }
    if (state?.cover && validCover(state.cover) && cachedCoverUrl !== state.cover)
      void loadCover(state.cover, state.coverFallback);
  } finally { hasDrawing = false; }
}
function drawSoon() {
  if (updateTimer) return;
  updateTimer = setTimeout(() => { updateTimer = null; paint(); }, 120);
}
function handleDeckEvent(e) {
  if (!e || !e.event) return;
  if (e.event === 'willAppear') {
    displayed.set(e.context, { action: e.action, lastImage: '', lastTitle: null, settings: e.payload?.settings || {} });
    drawSoon(); return;
  }
  if (e.event === 'willDisappear') { displayed.delete(e.context); return; }
  if (e.event === 'didReceiveSettings') {
    const item = displayed.get(e.context);
    if (item) {
      const incoming = e.payload?.settings || {};
      if (item.volumePreview && actionName(item.action) === 'volume') {
        const saved = Number(incoming.volumeStep);
        if (saved === item.volumePreview.value) item.volumePreview = null;
        else if (Date.now() - item.volumePreview.at < 3500) incoming.volumeStep = item.volumePreview.value;
        else item.volumePreview = null;
      }
      item.settings = incoming;
      drawSoon();
    }
    return;
  }
  const kind = actionName(e.action || '');
  if (e.event === 'sendToPlugin') {
    // Stream Deck's property inspector is the only source of this event.
    if (!e.action?.startsWith(PLUGIN_ID + '.')) return;
    const request = e.payload?.type;
    if (request === 'generate-pin') generatePin();
    if (request === 'volume-preview') {
      // A slider's saved didReceiveSettings event can arrive AFTER the next dialRotate.
      // Update the active action immediately, even while the inspector is being dragged.
      const item = displayed.get(e.context);
      const value = Number(e.payload?.value);
      if (item && actionName(item.action) === 'volume' && Number.isInteger(value) && value >= 1 && value <= 5) {
        item.volumePreview = { value, at: Date.now() };
        item.settings.volumeStep = value;
      }
      return;
    }
    if (request === 'set-port') {
      void changePort(e.payload?.port).then(result => {
        sendStream({ event: 'sendToPropertyInspector', context: e.context,
          payload: { type: 'port-result', ...result, serverPort: currentPort } });
      });
      return;
    }
    if (request === 'generate-pin' || request === 'get-connection') {
      const available = !!currentPin && Date.now() < pinExpiresAt;
      const chosen = selectedEntry();
      sendStream({ event: 'sendToPropertyInspector', context: e.context,
        payload: { type: 'connection', paired: Boolean(auth),
          extensionOnline: Boolean(auth) && Date.now() - lastExtensionContactAt < EXTENSION_ONLINE_MS,
          playerActive: !!chosen,
          playerStale: Boolean(chosen) && Date.now() - chosen[1].lastMediaSyncAt > PLAYER_STALE_MS,
          pin: available ? currentPin : '', expiresAt: available ? pinExpiresAt : 0,
          serverPort: currentPort, bridgeOnline, portError } });
    }
    return;
  }
  if (e.event === 'keyDown') {
    const type = ({ nowplaying: 'toggle', toggle: 'toggle', open: 'open', prev: 'prev',
      next: 'next', mute: 'mute', like: 'like', dislike: 'dislike' })[kind];
    if (type) controlPlayer(e.context, type);
  } else if (e.event === 'dialRotate') {
    const ticks = Number(e.payload?.ticks) || 0;
    if (kind === 'volume' && ticks !== 0) {
      const dial = displayed.get(e.context);
      const rawStep = Number(dial?.volumePreview?.value ?? dial?.settings?.volumeStep);
      const step = Number.isInteger(rawStep) ? limit(rawStep, 1, 5) : 4;
      controlPlayer(e.context, 'volume_delta', limit(ticks * step, -100, 100));
    }
    if (kind === 'trackdial' && Number.isSafeInteger(ticks) && ticks !== 0) {
      const count = Math.min(Math.abs(ticks), 5);
      for (let i = 0; i < count; i++) controlPlayer(e.context, ticks > 0 ? 'next' : 'prev');
    }
  } else if (e.event === 'dialDown') {
    const type = kind === 'volume' ? 'mute' : kind === 'trackdial' ? 'toggle' : null;
    if (type) controlPlayer(e.context, type);
  } else if (e.event === 'touchTap' && (kind === 'volume' || kind === 'trackdial')) {
    controlPlayer(e.context, 'toggle');
  }
}
function connectDeck() {
  if (!process.argv.includes('-port')) {
    if (!IS_TEST) log('Not launched by Stream Deck: waiting for SDK launch arguments.');
    return;
  }
  const sdk = require('@elgato/streamdeck');
  streamDeck = sdk.default;
  locale = streamDeck.info.application.language === 'ko' ? 'ko' : 'en';
  class BridgeAction extends sdk.SingletonAction {
    constructor(name) { super(); this.manifestId = `${PLUGIN_ID}.${name}`; }
    forward(ev) {
      handleDeckEvent({ event: ev.type, context: ev.action.id,
        action: ev.action.manifestId, payload: ev.payload });
    }
    onWillAppear(ev) { this.forward(ev); }
    onWillDisappear(ev) { this.forward(ev); }
    onDidReceiveSettings(ev) { this.forward(ev); }
    onSendToPlugin(ev) { this.forward(ev); }
    onKeyDown(ev) { this.forward(ev); }
    onDialRotate(ev) { this.forward(ev); }
    onDialDown(ev) { this.forward(ev); }
    onTouchTap(ev) { this.forward(ev); }
  }
  for (const name of ['nowplaying', 'toggle', 'prev', 'next', 'mute', 'volume', 'trackdial', 'open', 'like', 'dislike']) {
    streamDeck.actions.registerAction(new BridgeAction(name));
  }
  void streamDeck.connect().then(() => {
    sdOnline = true;
    drawSoon();
  }).catch(error => { log(`Stream Deck connection error: ${error.message}`); process.exitCode = 1; });
}

function makeServer() {
  return http.createServer((req, res) => { void requestHandler(req, res).catch(() => {
    if (!res.headersSent) sendHttp(res, 500, { error: 'Internal error' }, req.headers.origin);
  }); });
}
function bindPort(port) {
  return new Promise((resolve, reject) => {
    const server = makeServer();
    server.once('error', e => { server.close(); reject(e); });
    server.listen(port, LOCALHOST, () => resolve(server));
  });
}
function notifyPortChange() {
  // Wake sleeping extension long-polls so they discover the new port from serverPort.
  for (const [clientId, waiters] of [...listenWaiters]) {
    for (const waiter of [...waiters]) waiter.reply({ commands: [] });
  }
}
function changePort(value) {
  // Serialize changes from multiple inspectors and/or the Chrome popup.
  const operation = changingPort.then(async () => {
    const next = portNumber(value);
    if (next === null) return { ok: false, error: 'Port must be an integer between 1024 and 65535.' };
    if (next === currentPort && bridgeOnline) return { ok: true, port: next, unchanged: true };
    let server;
    const reuse = retiringListeners.get(next);
    if (reuse) {
      // Reverting a port change within the grace period must work without EADDRINUSE.
      server = reuse.server;
      clearTimeout(reuse.timer);
      retiringListeners.delete(next);
    } else {
      try { server = await bindPort(next); }
      catch (error) { return { ok: false, error: `Cannot listen on ${next}: ${error.code || error.message}` }; }
    }
    try { savePort(next); }
    catch (error) {
      if (!reuse) server.close();
      else {
        const timer = setTimeout(() => { retiringListeners.delete(next); server.close(); }, PORT_GRACE_MS);
        timer.unref();
        retiringListeners.set(next, {server, timer});
      }
      return { ok: false, error: `Could not save port: ${error.message}` };
    }
    const old = bridgeServer;
    const oldPort = currentPort;
    bridgeServer = server;
    currentPort = next;
    bridgeOnline = true;
    portError = '';
    notifyPortChange();
    log(`Loopback bridge now on ${LOCALHOST}:${currentPort}`);
    // Grace period lets Chrome learn the new port from the authenticated old endpoint.
    if (old && old !== server) {
      const timer = setTimeout(() => { retiringListeners.delete(oldPort); old.close(); }, PORT_GRACE_MS);
      timer.unref();
      retiringListeners.set(oldPort, {server:old, timer});
      // Avoid leaving many ports open if someone repeatedly changes the setting.
      while (retiringListeners.size > 3) {
        const oldest = retiringListeners.entries().next().value;
        if (!oldest) break;
        const [oldestPort, detail] = oldest;
        clearTimeout(detail.timer);
        retiringListeners.delete(oldestPort);
        detail.server.close();
      }
    }
    return { ok: true, port: next };
  });
  changingPort = operation.then(() => undefined, () => undefined);
  return operation;
}

// Startup
try {
  auth = readAuth();
  if (IS_TEST) generatePin();
  void bindPort(currentPort).then(server => {
    bridgeServer = server;
    bridgeOnline = true;
    log(`Loopback bridge on ${LOCALHOST}:${currentPort}`);
  }).catch(error => {
    bridgeOnline = false;
    portError = `Port ${currentPort}: ${error.code || error.message}`;
    log(`Bridge unavailable: ${portError}`);
  });
  // Refresh displayed player state as inactive clients expire.
  setInterval(() => { if (displayed.size) drawSoon(); }, 2000).unref();
  connectDeck();
} catch (error) { log(`Startup failure: ${error.stack}`); process.exitCode = 1; }
