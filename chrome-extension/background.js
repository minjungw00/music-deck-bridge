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
async function performBrowserCommand(command) {
  if (!['open', 'toggle'].includes(command?.type)) return false;
  const tabs = await chrome.tabs.query({ url: MUSIC_URL + '*' });
  const tab = tabs.find(tab => tab.id === command.preferredTabId) ||
    tabs.find(tab => tab.active) || tabs[0];
  if (!tab) {
    await chrome.tabs.create({ url: MUSIC_URL, active: true });
    return true; // Opening is not an autoplay request; the site owns playback.
  }
  if (command.type === 'open' || tab.discarded || tab.frozen || tab.status === 'loading') {
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
    return true;
  }
  // Reinject after extension updates, then address only the selected top frame.
  await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] },
    files: ['content.js'], world: 'ISOLATED' });
  const result = await chrome.tabs.sendMessage(tab.id, { type: 'bridge-toggle' }, { frameId: 0 });
  return result?.ok === true;
}
async function startBrowserListener() {
  if (browserListening || !chrome.tabs?.query) return;
  browserListening = true;
  let listeningToken;
  try {
    while (true) {
      const token = await pairedToken();
      listeningToken = token;
      if (!token) return;
      const result = await post('/browser-listen', { token }, 15500);
      if (!Array.isArray(result.commands)) return;
      // Re-pairing/unpairing must invalidate already received browser commands.
      if (await pairedToken() !== token) continue;
      for (const command of result.commands) {
        let ok = false;
        try { ok = await performBrowserCommand(command); } catch { /* Report failure to the key. */ }
        await post('/browser-result', { token, id: command.id, ok });
      }
    }
  } catch { /* A startup, popup check or alarm restarts after host/network failure. */ }
  finally {
    browserListening = false;
    const token = await pairedToken().catch(() => '');
    if (token && token !== listeningToken) void startBrowserListener();
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
      if (!token) return { ok: false, error: (chrome.i18n?.getMessage?.('notPaired') || 'Not paired yet.') };
      const result = await post('/status', { token });
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
      const result = msg.type === 'sync' ?
        await post('/sync', { token, clientId: sender.tab.id, state: msg.state }) :
        await post('/listen', { token, clientId: sender.tab.id }, 15500);
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
// Listen even when no YouTube Music content script exists.
void startBrowserListener();
