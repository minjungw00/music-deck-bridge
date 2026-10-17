'use strict';
// Service worker; bearer token never leaves the extension background context.
const storageReady = chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
// Requests await this same promise and fail closed if the access restriction fails.
void storageReady.catch(() => {});
const DEFAULT_PORT = 17864;
const validPort = p => Number.isInteger(Number(p)) && Number(p) >= 1024 && Number(p) <= 65535;
async function configuredPort() {
  await storageReady;
  const data = await chrome.storage.local.get('bridgePort');
  return validPort(data.bridgePort) ? Number(data.bridgePort) : DEFAULT_PORT;
}
async function setLocalPort(port) { await chrome.storage.local.set({ bridgePort: port }); }

async function post(endpoint, payload, timeout = 3000) {
  const port = await configuredPort();
  const response = await fetch(`http://127.0.0.1:${port}${endpoint}`, {
    method: 'POST', mode: 'cors', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeout),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || `HTTP ${response.status}`);
    error.httpStatus = response.status;
    throw error;
  }
  // Follow live port changes announced by the paired bridge.
  if (validPort(data.serverPort) && Number(data.serverPort) !== port) {
    await setLocalPort(Number(data.serverPort));
  }
  return data;
}
async function pairedToken() {
  await storageReady;
  const data = await chrome.storage.local.get('bridgeToken');
  return data.bridgeToken || '';
}

const MUSIC_URL = 'https://music.youtube.com/';
let browserListening = false;
let browserRetryTimer = null;
let browserChannelAvailable = null;
const removedTabs = new Set();
const synchronizations = new Map();
const PLAYER_COMMANDS = ['toggle', 'prev', 'next', 'mute', 'volume_delta', 'like', 'dislike'];
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function performBrowserCommand(command, stillPaired = async () => true, diagnostic = {}) {
  const failed = reason => { diagnostic.reason = reason; return false; };
  if (!['open', ...PLAYER_COMMANDS].includes(command?.type)) return false;
  const deadline = Math.min(Number(command.expiresAt) || Date.now() + 30000, Date.now() + 30000);
  const allowed = async (confirm = false) => Date.now() < deadline && await stillPaired(confirm) && Date.now() < deadline;
  const denied = () => failed(diagnostic.reason === 'bridge-unavailable' ? 'bridge-unavailable' :
    Date.now() >= deadline ? 'command-timeout' : 'authorization-lost');
  if (!await allowed()) return denied();
  const query = () => chrome.tabs.query({ url: MUSIC_URL + '*' });
  const select = tabs => tabs.find(tab => tab.id === command.preferredTabId) || tabs.find(tab => tab.active) || tabs[0];
  let tab = select(await query());
  let opened = command.nativeLaunched === true;
  if (!tab) {
    if (!await allowed(true)) return denied();
    tab = await chrome.tabs.create({ url: MUSIC_URL, active: true });
    opened = true;
  }
  const resuming = tab.discarded || tab.frozen || tab.status === 'loading';
  if (command.type === 'open' || resuming) {
    if (!await allowed(true)) return denied();
    await chrome.tabs.update(tab.id, { active: true });
    if (Number.isInteger(tab.windowId)) await chrome.windows.update(tab.windowId, { focused: true });
    if (command.type === 'open') return true;
  }
  while (await allowed()) {
    // Injection can fail harmlessly while a tab is loading. Do not retry an
    // ambiguously delivered input. Missing receivers and explicit not-ready
    // replies are safe to retry because neither has performed the input.
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] },
        files: ['content.js'], world: 'ISOLATED' });
    } catch { diagnostic.reason = 'injection-unavailable'; await wait(200); continue; }
    if (!await allowed(true)) return denied();
    let result;
    try {
      const trackKey = !opened && !resuming ? command.trackKey : undefined;
      result = await chrome.tabs.sendMessage(tab.id, { type: 'bridge-command', id: command.id,
        expiresAt: deadline, command: {
          type: command.type === 'toggle' && opened ? 'play' : command.type,
          amount: command.amount, trackKey, allowCurrentTrack: !trackKey,
        } }, { frameId: 0 });
    } catch (error) {
      // A new tab can navigate between injection and messaging. Chrome's
      // missing-receiver error guarantees that this input was not delivered.
      // A closed/lost reply after delivery remains ambiguous and is not retried.
      if (String(error?.message).includes('Receiving end does not exist')) {
        diagnostic.reason = 'receiver-unavailable';
        await wait(200);
        continue;
      }
      return failed('delivery-uncertain');
    }
    if (result?.ok) return true;
    if (result?.retry !== true) return failed(result?.reason || 'player-rejected');
    diagnostic.reason = 'player-not-ready';
    await wait(200);
  }
  return failed(diagnostic.reason || 'command-timeout');
}
async function startBrowserListener() {
  if (browserListening || !chrome.tabs?.query) return;
  if (browserRetryTimer) clearTimeout(browserRetryTimer);
  browserRetryTimer = null;
  browserListening = true;
  let listeningToken;
  let retry = false;
  try {
    while (true) {
      const token = await pairedToken();
      listeningToken = token;
      if (!token) {
        // Notify only about missing credentials; this never authenticates or
        // deletes the plugin's stored pair. It also suppresses blind launching.
        await post('/status', { token: '' }).catch(() => {});
        return;
      }
      let result;
      try {
        const tabs = await chrome.tabs.query({ url: MUSIC_URL + '*' });
        result = await post('/browser-listen', { token, clientIds: tabs.map(tab => tab.id) }, 15500);
      }
      catch (error) {
        if (error.httpStatus === 404) browserChannelAvailable = false;
        throw error;
      }
      browserChannelAvailable = true;
      if (!Array.isArray(result.commands)) return;
      // Re-pairing/unpairing must invalidate already received browser commands.
      if (await pairedToken() !== token) continue;
      for (const command of result.commands) {
        let ok = false;
        const diagnostic = {};
        try {
          ok = await performBrowserCommand(command, async confirm => {
            if (await pairedToken() !== token) return false;
            // A different extension/profile may have replaced this pairing while
            // the page was loading; local storage alone cannot detect that.
            if (confirm) {
              try { await post('/status', { token }); }
              catch (error) {
                diagnostic.reason = error.httpStatus === 401 ? 'authorization-lost' : 'bridge-unavailable';
                return false;
              }
            }
            return await pairedToken() === token;
          }, diagnostic);
        } catch { diagnostic.reason = 'browser-api-failed'; }
        await post('/browser-result', { token, id: command.id, ok, ...(!ok ? { reason: diagnostic.reason } : {}) });
      }
    }
  } catch (error) {
    // Host restart/temporary network failure must not leave a running browser
    // disconnected until the next one-minute maintenance alarm.
    retry = !error.httpStatus || error.httpStatus >= 500;
  }
  finally {
    browserListening = false;
    const token = await pairedToken().catch(() => '');
    if (token && token !== listeningToken) void startBrowserListener();
    else if (token && retry) browserRetryTimer = setTimeout(() => { void startBrowserListener(); }, 1000);
  }
}

// Runs in MAIN: a restored title/button can precede the actual player and queue.
// Read only playback state; never return the site's response or account data.
async function playerPlayback(type, expiresAt) {
  const read = () => {
    const bar = document.querySelector('ytmusic-player-bar');
    const candidates = [bar?.playerApi, document.querySelector('#movie_player')];
    const api = candidates.find(item => typeof item?.getPlayerState === 'function');
    const all = [...document.querySelectorAll('video, audio')];
    const media = all.find(item => item.readyState > 0 && !item.paused) ||
      all.find(item => item.readyState > 0 && Number.isFinite(item.duration)) || all[0];
    let state, videoId = '', ready = false, muted, time;
    try {
      state = api?.getPlayerState();
      videoId = api?.getVideoData?.()?.video_id || '';
      muted = api?.isMuted?.();
      time = api?.getCurrentTime?.();
      ready = api ? (typeof api.isReady !== 'function' || api.isReady()) &&
        Number.isFinite(state) && Boolean(videoId || media?.readyState > 0) : media?.readyState > 0;
      const status = api?.getPlayerResponse?.()?.playabilityStatus?.status;
      if (status && status !== 'OK') ready = false;
    } catch { ready = false; }
    const queue = bar?.queue;
    let index;
    try {
      if (typeof queue?.getItems === 'function' && !queue.getItems()?.length) ready = false;
      index = queue?.getCurrentItemIndex?.();
    } catch { ready = false; }
    const playing = Number.isFinite(state) ? state === 1 || state === 3 :
      Boolean(media && !media.paused && !media.ended);
    return { bar, api, media, ready, playing, state, index,
      muted: typeof muted === 'boolean' ? muted : Boolean(media?.muted),
      key: videoId || media?.currentSrc || media?.src || '',
      time: Number.isFinite(time) ? time : media?.currentTime || 0 };
  };
  const before = read();
  if (type === 'state') return { playing: before.playing, muted: before.muted };
  if (!['play', 'toggle', 'next', 'prev'].includes(type)) return { ok: false };
  if (!before.ready) return { ok: false, retry: true };
  if (Number.isFinite(expiresAt) && Date.now() >= expiresAt) return { ok: false, reason: 'command-timeout' };
  if (type === 'play' && before.playing) return { ok: true };
  const desiredPlaying = type === 'play' || !before.playing;
  const selector = ({ play: '.play-pause-button', toggle: '.play-pause-button',
    next: '.next-button', prev: '.previous-button' })[type];
  const button = document.querySelector('ytmusic-player-bar ' + selector);
  if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true' ||
      button.closest?.('[disabled], [aria-disabled="true"]')) return { ok: false, retry: true };
  let blocked = false, playerError = false;
  const onBlocked = () => { blocked = true; };
  const onError = () => { playerError = true; };
  before.api?.addEventListener?.('onAutoplayBlocked', onBlocked);
  before.api?.addEventListener?.('onError', onError);
  try {
    // Use the site's own control path only after its media/queue is initialized.
    button.click();
    const deadline = Math.min(Number(expiresAt) || Infinity, Date.now() + 10000);
    do {
      const after = read();
      if (blocked) return { ok: false, reason: 'autoplay-blocked' };
      if (playerError || after.media?.error) return { ok: false, reason: 'player-error' };
      if (type === 'play' || type === 'toggle') {
        const started = Number.isFinite(after.state) ? after.state === 1 :
          after.playing && after.media?.readyState >= 2;
        if (desiredPlaying ? started : !after.playing) return { ok: true };
      } else if ((before.key && after.key && before.key !== after.key) ||
          (Number.isInteger(before.index) && Number.isInteger(after.index) && before.index !== after.index) ||
          (type === 'prev' && before.time > 5 && after.time < 2)) return { ok: true };
      await new Promise(resolve => setTimeout(resolve, 80));
    } while (Date.now() < deadline);
    // A dispatched click with no observed result is ambiguous. Never retry it:
    // a delayed Next/Previous could otherwise skip more than one track.
    return { ok: false, reason: 'playback-unconfirmed' };
  } catch (error) {
    return { ok: false, reason: error?.name === 'NotAllowedError' ? 'autoplay-blocked' : 'player-error' };
  } finally {
    before.api?.removeEventListener?.('onAutoplayBlocked', onBlocked);
    before.api?.removeEventListener?.('onError', onError);
  }
}

// Runs in the page's MAIN world: Polymer slider properties belong to the site,
// and are not visible through the content script's isolated DOM wrappers.
function controlPlayerVolume(type, amount) {
  const bar = document.querySelector('ytmusic-player-bar');
  if (!bar) return false;
  if (type === 'mute') {
    const button = bar.querySelector('.volume, #expand-volume');
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return false;
    button.click();
    return true;
  }
  if (type !== 'volume_delta' || !Number.isFinite(amount)) return false;
  const sliders = [...bar.querySelectorAll('#volume-slider, #expand-volume-slider')];
  const slider = sliders.find(item => item.getClientRects().length) || sliders[0];
  if (!slider || slider.disabled) return false;
  const current = Number(slider.value);
  if (!Number.isFinite(current)) return false;
  const next = Math.max(0, Math.min(100, current + Math.max(-100, Math.min(100, amount))));
  // A slider's 5-point step would round away the dial's 1–4 point steps.
  for (const item of sliders) item.step = 1;
  slider.value = next;
  // Use the same handler as a mouse/keyboard change. The site owns its volume
  // curve, saved volume, mute state and both desktop/compact slider displays.
  slider.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg?.type === 'player-playback' && Number.isInteger(sender.tab?.id) && sender.frameId === 0 &&
      sender.url?.startsWith('https://music.youtube.com/')) {
    if (!['play', 'toggle', 'next', 'prev'].includes(msg.command)) { respond({ ok: false }); return false; }
    chrome.scripting.executeScript({ target: { tabId: sender.tab.id, frameIds: [0] }, world: 'MAIN',
      func: playerPlayback, args: [msg.command, msg.expiresAt] })
      .then(results => respond(results[0]?.result || { ok: false }))
      .catch(() => respond({ ok: false, reason: 'playback-unconfirmed' }));
    return true;
  }
  if (msg?.type === 'player-volume' && Number.isInteger(sender.tab?.id) && sender.frameId === 0 &&
      sender.url?.startsWith('https://music.youtube.com/')) {
    if (!['volume_delta', 'mute'].includes(msg.command) ||
        (msg.command === 'volume_delta' && !Number.isFinite(msg.amount))) {
      respond({ ok: false, error: 'Invalid volume command' });
      return false;
    }
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id, frameIds: [0] },
      world: 'MAIN',
      func: controlPlayerVolume,
      args: [msg.command, msg.command === 'volume_delta' ? msg.amount : 0],
    }).then(results => respond({ ok: results[0]?.result === true }))
      .catch(() => respond({ ok: false }));
    return true;
  }
  if (msg?.type === 'pair' && !sender.tab) {
    (async () => {
      if (!/^\d{6}$/.test(msg.pin)) throw new Error((chrome.i18n?.getMessage?.('invalid') || 'Enter a six-digit PIN.'));
      const result = await post('/pair', { pin: msg.pin });
      await chrome.storage.local.set({ bridgeToken: result.token });
      void startBrowserListener();
      return { ok: true };
    })().then(respond).catch(e => respond({ ok: false, error: e.message }));
    return true;
  }
  if (msg?.type === 'check' && !sender.tab) {
    (async () => {
      const token = await pairedToken();
      if (!token) {
        await post('/status', { token: '' }).catch(() => {});
        return { ok: false, error: (chrome.i18n?.getMessage?.('notPaired') || 'Not paired yet.') };
      }
      let result;
      try { result = await post('/status', { token }); }
      catch (error) {
        if (error.httpStatus === 401) throw new Error(chrome.i18n?.getMessage?.('notPaired') ||
          'Pair again with a new PIN from the Stream Deck action settings.');
        throw error;
      }
      void startBrowserListener();
      return { ok: true, ...result };
    })().then(respond).catch(e => respond({ ok: false, error: e.message }));
    return true;
  }
  if (msg?.type === 'get-port' && !sender.tab) {
    configuredPort().then(port => respond({ ok: true, port }));
    return true;
  }
  if (msg?.type === 'set-port' && !sender.tab) {
    (async () => {
      const port = Number(msg.port);
      if (!validPort(port)) throw new Error(chrome.i18n?.getMessage?.('portInvalid') || 'Port must be an integer from 1024 to 65535.');
      const token = await pairedToken();
      if (!token) {
        await setLocalPort(port);
        return { ok: true, port, localOnly: true };
      }
      try {
        // When the original server is reachable, change its listener AND this client together.
        const result = await post('/configure-port', { token, port }, 6000);
        await setLocalPort(result.port);
        return { ok: true, port: result.port, localOnly: false };
      } catch (error) {
        // A server rejected an occupied/invalid port: do not modify client settings.
        if (error.httpStatus) throw error;
        // Bridge may already have moved in the Stream Deck inspector while Chrome slept.
        // Try the new address, retaining it even if the bridge isn't reachable yet.
        await setLocalPort(port);
        try {
          await post('/status', { token }, 1500);
          return { ok: true, port, localOnly: false };
        } catch {
          return { ok: true, port, localOnly: true };
        }
      }
    })().then(respond).catch(e => respond({ ok: false, error: e.message }));
    return true;
  }
  if (msg?.type === 'unpair' && !sender.tab) {
    (async () => {
      const token = await pairedToken();
      if (token) {
        try { await post('/unpair', { token }); }
        catch (error) {
          // An invalid token is already revoked; network/server failures must be retried.
          if (error.httpStatus !== 401) throw new Error(chrome.i18n?.getMessage?.('unpairFailed') ||
            'Could not unpair. Start Stream Deck, check the port and try again.');
        }
      }
      await chrome.storage.local.remove('bridgeToken');
      return { ok: true };
    })().then(respond).catch(e => respond({ ok: false, error: e.message }));
    return true;
  }
  if ((msg?.type === 'sync' || msg?.type === 'listen') && sender.tab &&
      sender.url?.startsWith('https://music.youtube.com/')) {
    (async () => {
      const token = await pairedToken();
      if (!token) return { paired: false, commands: [] };
      // The modern browser channel carries every input. Keeping a separate
      // long poll per tab can exhaust Chrome's per-origin HTTP/1 connection
      // pool and starve status checks/results, including after a tab closes.
      // A 404 from older plugins enables the legacy tab channel instead.
      if (msg.type === 'listen' && browserChannelAvailable !== false) {
        return { paired: true, commands: [], idle: true };
      }
      let state = msg.state;
      if (msg.type === 'sync' && sender.frameId === 0) {
        try {
          const observed = await chrome.scripting.executeScript({ target: { tabId: sender.tab.id, frameIds: [0] },
            world: 'MAIN', func: playerPlayback, args: ['state'] });
          if (observed[0]?.result) state = { ...state, ...observed[0].result };
        } catch { /* Keep the DOM snapshot if the page is navigating. */ }
      }
      if (removedTabs.has(sender.tab.id)) return { paired: true, commands: [] };
      const request = msg.type === 'sync' ? post('/sync', { token, clientId: sender.tab.id, state }) :
        post('/listen', { token, clientId: sender.tab.id }, 15500);
      if (msg.type === 'sync') synchronizations.set(sender.tab.id, request);
      let result;
      try { result = await request; }
      finally { if (synchronizations.get(sender.tab.id) === request) synchronizations.delete(sender.tab.id); }
      void startBrowserListener();
      return { paired: true, commands: result.commands || [], idle: result.idle === true };
    })().then(respond).catch(() => respond({ paired: false, commands: [] }));
    return true;
  }
  respond({ ok: false, error: 'Forbidden message' });
  return false;
});

// Reinject into existing YouTube Music tabs after an extension update or Chrome startup.
// A manifest content_script only runs on NEW document loads; already-open PWA windows
// otherwise keep an invalidated extension context until manually refreshed.
async function ensureMusicScripts() {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://music.youtube.com/*' });
    for (const tab of tabs) {
      if (!Number.isInteger(tab.id) || tab.discarded) continue;
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'], world: 'ISOLATED' });
      } catch { /* Permissions, navigation or a sleeping PWA can prevent reinjection. */ }
    }
  } catch { /* Chrome restarting or the extension host unavailable. */ }
}
chrome.runtime.onInstalled.addListener(() => {
  void chrome.alarms.create('pwa-check', { periodInMinutes: 1 });
  void ensureMusicScripts();
  void startBrowserListener();
});
chrome.runtime.onStartup.addListener(() => {
  void chrome.alarms.create('pwa-check', { periodInMinutes: 1 });
  void ensureMusicScripts();
  void startBrowserListener();
});
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'pwa-check') {
    void ensureMusicScripts();
    void startBrowserListener();
  }
});
chrome.tabs?.onRemoved?.addListener(tabId => {
  removedTabs.add(tabId);
  if (removedTabs.size > 1024) removedTabs.delete(removedTabs.values().next().value);
  const pending = synchronizations.get(tabId);
  void (async () => {
    await pending?.catch(() => {});
    const token = await pairedToken();
    if (token) await post('/player-closed', { token, clientId: tabId });
  })().catch(() => {});
});
// Listen even when no YouTube Music content script exists.
void startBrowserListener();
