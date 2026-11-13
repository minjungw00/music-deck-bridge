'use strict';
const $ = id => document.getElementById(id);
const asset = path => chrome.runtime.getURL?.(path) || path;
const language = (chrome.i18n?.getUILanguage?.() || navigator.language || 'en').toLowerCase().startsWith('ko') ? 'ko' : 'en';
const text = Object.fromEntries(
  ["heading","subtitle","companionHint","installPlugin","guide","pin","connect","refresh","forget","portLabel","savePort","portHint","portInvalid","portSaved","portLocal","invalid","checking","fail","connected","unknown","player","app","tab","current","waiting","artwork","stale","paired","removed","nowPlayingLabel","playerWaiting","settingsSummary","connectionStatusLabel","previous","next","play","pause","likeLabel","dislikeLabel","controlFailed","controlChanged","controlUpdate","volumeLabel","mute","unmute","volumeDown","volumeUp"]
    .map(key => [key, chrome.i18n.getMessage(key)])
);
const coverMessages = new Map([
  ['missing', 'coverMissing'], ['blocked', 'coverBlocked'], ['ready', 'coverReady'],
  ['downloading', 'coverDownloading'], ['waiting', 'coverWaiting'], ['failed', 'coverFailed'],
].map(([code, key]) => [code, chrome.i18n.getMessage(key)]));
document.documentElement.lang = language;
document.title = chrome.i18n.getMessage('extensionName');
for (const [id, key] of [['heading','heading'],['subtitle','subtitle'],['companionHint','companionHint'],['installPlugin','installPlugin'],['guide','guide'],['pinLabel','pin'],['connect','connect'],['refresh','refresh'],['forget','forget'],['portLabel','portLabel'],['savePort','savePort'],['portHint','portHint'],['nowPlayingLabel','nowPlayingLabel'],['settingsSummary','settingsSummary'],['connectionStatusLabel','connectionStatusLabel'],['likeLabel','likeLabel'],['dislikeLabel','dislikeLabel']]) {
  $(id).textContent = text[key];
}
let latestRequest = 0;
let portRevision = 0;
let pendingActions = 0;
let statusRequests = 0;
let closed = false;
let currentPlayer = null;
let controlsAvailable = false;
let settingsInitialized = false;
let settingsTouched = false;
let artworkKey = '';
let artworkRevision = 0;
let latestControl = 0;
const pendingControls = new Map();
const controlButtons = { previous: 'prev', playPause: 'toggle', next: 'next', like: 'like', dislike: 'dislike', mute: 'mute', volumeDown: 'volume_delta', volumeUp: 'volume_delta' };
function updateControls() {
  const enabled = controlsAvailable && currentPlayer && !pendingActions;
  const busy = [...pendingControls.values()];
  for (const [id, command] of Object.entries(controlButtons)) {
    $(id).disabled = !enabled || busy.includes(command) ||
      (!['toggle', 'mute', 'volume_delta'].includes(command) && busy.length > 0) ||
      (['like', 'dislike'].includes(command) && currentPlayer?.rating == null);
  }
  if (currentPlayer?.volume <= 0) $('volumeDown').disabled = true;
  if (currentPlayer?.volume >= 100) $('volumeUp').disabled = true;
  const playing = currentPlayer?.playing === true;
  for (const [id, label] of [['previous', text.previous], ['next', text.next], ['playPause', playing ? text.pause : text.play],
    ['mute', currentPlayer?.muted ? text.unmute : text.mute], ['volumeDown', text.volumeDown], ['volumeUp', text.volumeUp]]) {
    $(id).setAttribute('aria-label', label);
    $(id).setAttribute('title', label);
  }
  $('playIcon').hidden = playing;
  $('pauseIcon').hidden = !playing;
  $('like').setAttribute('aria-pressed', String(currentPlayer?.rating === 'LIKE'));
  $('dislike').setAttribute('aria-pressed', String(currentPlayer?.rating === 'DISLIKE'));
  $('likeIcon').src = asset(`icons/controls/like${currentPlayer?.rating === 'LIKE' ? '-selected' : ''}.png`);
  $('dislikeIcon').src = asset(`icons/controls/dislike${currentPlayer?.rating === 'DISLIKE' ? '-selected' : ''}.png`);
  $('mute').setAttribute('aria-pressed', String(currentPlayer?.muted === true));
  $('muteIcon').src = asset(`icons/controls/${currentPlayer?.muted ? 'mute' : 'volume'}.png`);
  $('volumeLabel').textContent = text.volumeLabel;
  $('volumeValue').textContent = Number.isFinite(currentPlayer?.volume) ? `${currentPlayer.volume}%` : '—';
}
function clearArtwork() {
  $('artwork').hidden = true;
  $('artwork').removeAttribute('src');
  $('coverFallback').hidden = false;
}
async function loadArtwork(player, key, revision) {
  try {
    const result = await chrome.runtime.sendMessage({ type: 'artwork', playerId: player.id,
      trackKey: player.key, coverKey: player.coverKey });
    if (closed || key !== artworkKey || revision !== artworkRevision) return;
    const image = result?.image;
    // Only the plugin's bounded raster cache is accepted; never load arbitrary
    // page URLs or SVG into the popup, or grant extra CDN host permissions.
    if (result.ok && typeof image === 'string' && image.length <= 2800000 &&
        /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)) {
      $('artwork').src = image;
      $('artwork').hidden = false;
      $('coverFallback').hidden = true;
    }
  } catch { /* Keep the placeholder; playback does not depend on artwork. */ }
}
function showPlayer(result) {
  currentPlayer = result?.ok && result.active ? result.player || null : null;
  controlsAvailable = result?.popupControls === true && !result.playerStale &&
    result.compatibility?.compatible !== false;
  // Older compatible plugins still supply a title, but do not advertise controls.
  const title = currentPlayer?.title || (result?.ok && result.active ? result.track : '') || text.playerWaiting;
  if ($('trackTitle').textContent !== title) $('trackTitle').textContent = title;
  $('trackArtist').textContent = currentPlayer?.artist || '';
  const key = currentPlayer && result.coverStatus === 'ready' && currentPlayer.coverKey ?
    JSON.stringify([currentPlayer.id, currentPlayer.key, currentPlayer.coverKey]) : '';
  if (key !== artworkKey) {
    artworkKey = key;
    const revision = ++artworkRevision;
    clearArtwork();
    if (key) void loadArtwork(currentPlayer, key, revision);
  }
  updateControls();
}
$('artwork').addEventListener('error', clearArtwork);
$('settingsSummary').addEventListener('click', () => { settingsTouched = true; });
function display(id, message, ok = false) {
  if ($(id).textContent !== message) $(id).textContent = message;
  $(id).style.color = ok ? '#8ceba2' : '#fbabb6';
}
function info(message, ok = false) { display('feedback', message, ok); }
function onAction(id, handler) {
  $(id).addEventListener('click', async () => {
    const request = ++latestRequest;
    latestControl++;
    pendingActions++;
    updateControls();
    try { await handler(request); }
    finally { pendingActions--; updateControls(); }
  });
}
function showVersions(value) {
  $('versions').textContent = value ? `${chrome.i18n.getMessage('pluginLabel')} ${value.pluginVersion || '—'} · ${chrome.i18n.getMessage('extensionLabel')} ${value.extensionVersion || '—'}\n${chrome.i18n.getMessage('protocolLabel')}: ${value.negotiatedProtocolVersion || '—'}${value.legacy ? ` (${chrome.i18n.getMessage('legacyProtocol')})` : ''}` : '';
}
onAction('connect', async request => {
  const pin = $('pin').value.trim();
  if (!/^\d{6}$/.test(pin)) return info(text.invalid);
  info(text.checking);
  try {
    const response = await chrome.runtime.sendMessage({ type:'pair', pin });
    if (request !== latestRequest) return;
    showVersions(response?.compatibility);
    if (!response?.ok) return info(response?.error || text.fail);
    $('pin').value = '';
    info(text.connected, true);
  } catch (e) { if (request === latestRequest) info(e.message); }
});
async function refreshStatus(automatic = false) {
  if (closed || (automatic && (pendingActions || statusRequests || document.hidden))) return;
  // Background reads cannot supersede a user action, including a pending write.
  const request = automatic ? latestRequest : ++latestRequest;
  if (!automatic) info('');
  statusRequests++;
  try {
    const r = await chrome.runtime.sendMessage({ type:'check' });
    if (closed || request !== latestRequest) return;
    showVersions(r?.compatibility);
    showPlayer(r);
    if (!settingsInitialized) {
      if (!settingsTouched) $('connectionSettings').open = !r?.ok;
      settingsInitialized = true;
    }
    if (!r?.ok) return display('status', r?.error || text.unknown);
    if (!r.active) return display('status', text.paired, true);
    const cover = coverMessages.get(r.coverStatus) || coverMessages.get('waiting');
    const data = `${text.player} · ${r.standalone ? text.app : text.tab}` +
      (r.coverStatus === 'ready' ? '' : `\n${text.artwork}: ${cover}`) +
      (r.popupControls === true ? '' : `\n${text.controlUpdate}`);
    display('status', r.playerStale ? `${data}\n${text.stale}` : data, !r.playerStale);
  } catch (e) {
    if (!closed && request === latestRequest) { showPlayer(null); display('status', e.message); }
  }
  finally { statusRequests--; }
}
$('refresh').addEventListener('click', () => refreshStatus());
onAction('forget', async request => {
  try {
    const result = await chrome.runtime.sendMessage({ type:'unpair' });
    if (request !== latestRequest) return;
    if (!result?.ok) return info(result?.error || text.fail);
    showVersions(null);
    showPlayer(null);
    display('status', '');
    info(text.removed, true);
  } catch (error) { if (request === latestRequest) info(error.message); }
});
$('port').addEventListener('input', () => { portRevision++; });
onAction('savePort', async request => {
  const revision = ++portRevision;
  const port = Number($('port').value);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) return info(text.portInvalid);
  try {
    const result = await chrome.runtime.sendMessage({ type: 'set-port', port });
    if (request !== latestRequest) return;
    if (!result?.ok) return info(result?.error || text.fail);
    if (revision === portRevision) $('port').value = String(result.port);
    info(result.localOnly ? text.portLocal : `${text.portSaved} ${result.port}`, !result.localOnly);
  } catch (error) { if (request === latestRequest) info(error.message); }
});
(async () => {
  const revision = portRevision;
  try {
    const saved = await chrome.runtime.sendMessage({ type: 'get-port' });
    if (saved?.ok && revision === portRevision) $('port').value = String(saved.port);
  } catch {}
})();
for (const [id, command] of Object.entries(controlButtons)) {
  $(id).addEventListener('click', async () => {
    if ($(id).disabled || !currentPlayer || closed) return;
    const player = currentPlayer;
    const request = ++latestControl;
    pendingControls.set(request, command);
    display('controlFeedback', '');
    updateControls();
    try {
      const result = await chrome.runtime.sendMessage({ type: 'control', command,
        playerId: player.id, trackKey: player.key,
        ...(command === 'volume_delta' ? { amount: id === 'volumeDown' ? -5 : 5 } : {}) });
      if (closed || request !== latestControl) return;
      if (!result?.ok) display('controlFeedback', result?.reason === 'player-changed' ? text.controlChanged : text.controlFailed);
    } catch {
      if (!closed && request === latestControl) display('controlFeedback', text.controlFailed);
    } finally {
      pendingControls.delete(request);
      updateControls();
      if (!closed) void refreshStatus(true);
    }
  });
}
clearArtwork();
showPlayer(null);
$('refresh').click();
const statusTimer = setInterval(() => { void refreshStatus(true); }, 1000);
window.addEventListener('pagehide', () => {
  closed = true;
  clearInterval(statusTimer);
}, { once: true });
