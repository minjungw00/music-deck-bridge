'use strict';
const $ = id => document.getElementById(id);
const asset = path => chrome.runtime.getURL?.(path) || path;
const language = chrome.i18n.getMessage('uiLanguageCode') || 'en';
const text = Object.fromEntries(
  ["heading","subtitle","companionHint","installPlugin","guide","pin","connect","refresh","forget","portLabel","savePort","portHint","portInvalid","portSaved","portLocal","invalid","checking","fail","connected","unknown","player","app","tab","current","waiting","artwork","stale","paired","removed","nowPlayingLabel","playerWaiting","settingsSummary","connectionStatusLabel","previous","next","play","pause","likeLabel","dislikeLabel","controlFailed","controlChanged","controlUpdate","volumeLabel","mute","unmute"]
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
let volumeSupported = false;
let settingsInitialized = false;
let settingsTouched = false;
let artworkKey = '';
let artworkRevision = 0;
let latestControl = 0;
let localStatus = null;
let bridgePlayback = null;
let localRequests = 0;
let volumeEditing = false;
let volumeRevision = 0;
let volumeDeadline = Infinity;
let queuedVolume = null;
let volumeSending = false;
const pendingControls = new Map();
const controlButtons = { previous: 'prev', playPause: 'toggle', next: 'next', like: 'like', dislike: 'dislike', mute: 'mute' };
const playerIdentity = player => player ? JSON.stringify([player.id, player.key]) : '';
function updateIcon(id, path) {
  const source = asset(path);
  if ($(id).getAttribute('src') !== source) $(id).src = source;
}
function updateControls() {
  const enabled = controlsAvailable && currentPlayer && !pendingActions;
  const busy = [...pendingControls.values()];
  for (const [id, command] of Object.entries(controlButtons)) {
    const unavailable = !enabled || (['like', 'dislike'].includes(command) && currentPlayer?.rating == null);
    $(id).disabled = unavailable || busy.includes(command) ||
      (!['toggle', 'mute', 'volume_set'].includes(command) && busy.length > 0);
    $(id).setAttribute('data-unavailable', String(Boolean(unavailable)));
    $(id).setAttribute('aria-busy', String(busy.includes(command)));
  }
  $('volumeSlider').disabled = !enabled || !volumeSupported || !Number.isFinite(currentPlayer?.volume);
  if ($('volumeSlider').disabled || Date.now() > volumeDeadline) {
    volumeEditing = false; queuedVolume = null;
  }
  const playing = currentPlayer?.playing === true;
  for (const [id, label] of [['previous', text.previous], ['next', text.next], ['playPause', playing ? text.pause : text.play],
    ['mute', currentPlayer?.muted ? text.unmute : text.mute], ['like', text.likeLabel], ['dislike', text.dislikeLabel]]) {
    $(id).setAttribute('aria-label', label);
    $(id).setAttribute('title', label);
  }
  $('playIcon').hidden = playing;
  $('pauseIcon').hidden = !playing;
  $('like').setAttribute('aria-pressed', String(currentPlayer?.rating === 'LIKE'));
  $('dislike').setAttribute('aria-pressed', String(currentPlayer?.rating === 'DISLIKE'));
  updateIcon('likeIcon', `icons/controls/like${currentPlayer?.rating === 'LIKE' ? '-selected' : ''}.png`);
  updateIcon('dislikeIcon', `icons/controls/dislike${currentPlayer?.rating === 'DISLIKE' ? '-selected' : ''}.png`);
  $('mute').setAttribute('aria-pressed', String(currentPlayer?.muted === true));
  updateIcon('muteIcon', `icons/controls/${currentPlayer?.muted ? 'mute' : 'volume'}.png`);
  $('volumeLabel').textContent = text.volumeLabel;
  if (!volumeEditing) {
    $('volumeSlider').value = String(currentPlayer?.volume ?? 0);
    $('volumeValue').textContent = Number.isFinite(currentPlayer?.volume) ? `${currentPlayer.volume}%` : '—';
  }
}
function clearArtwork() {
  $('artwork').hidden = true;
  $('artwork').removeAttribute('src');
  $('coverFallback').hidden = false;
}
async function loadArtwork(player, key, revision) {
  try {
    if (player.mode === 'local') {
      const url = MusicDeckArtworkPolicy.parse(player.coverKey);
      if (!url) return;
      $('artwork').src = url.href;
      $('artwork').hidden = false;
      $('coverFallback').hidden = true;
      return;
    }
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
  const previousIdentity = playerIdentity(currentPlayer);
  currentPlayer = result?.ok && result.active && result.player ? { ...result.player, mode: result.mode || 'bridge' } : null;
  if (previousIdentity !== playerIdentity(currentPlayer)) {
    volumeRevision++; volumeEditing = false; queuedVolume = null;
  }
  if (volumeEditing && !queuedVolume && !volumeSending && Number($('volumeSlider').value) === currentPlayer?.volume) volumeEditing = false;
  controlsAvailable = result?.popupControls === true && !result.playerStale &&
    result.compatibility?.compatible !== false;
  volumeSupported = result?.popupVolume === true;
  // Older compatible plugins still supply a title, but do not advertise controls.
  const title = currentPlayer?.title || (result?.ok && result.active ? result.track : '') || text.playerWaiting;
  if ($('trackTitle').textContent !== title) $('trackTitle').textContent = title;
  $('trackArtist').textContent = currentPlayer?.artist || '';
  const key = currentPlayer && result.coverStatus === 'ready' && currentPlayer.coverKey ?
    JSON.stringify([currentPlayer.mode, currentPlayer.id, currentPlayer.key, currentPlayer.coverKey]) : '';
  if (key !== artworkKey) {
    artworkKey = key;
    const revision = ++artworkRevision;
    clearArtwork();
    if (key) void loadArtwork(currentPlayer, key, revision);
  }
  updateControls();
}
function applyPlayback() { showPlayer(bridgePlayback || localStatus); }
async function refreshLocalPlayer() {
  if (closed || localRequests || document.hidden) return;
  localRequests++;
  try {
    const result = await chrome.runtime.sendMessage({ type: 'player-status' });
    if (!closed) { localStatus = result; if (!bridgePlayback) applyPlayback(); }
  } catch {
    if (!closed) { localStatus = null; if (!bridgePlayback) applyPlayback(); }
  } finally { localRequests--; }
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
    bridgePlayback = r?.ok && r.active && r.popupControls === true && r.popupVolume === true && !r.playerStale ? r : null;
    // Legacy connected plugins retain their display if no local snapshot exists.
    if (!bridgePlayback && !localStatus?.active && r?.ok && r.active) showPlayer(r); else applyPlayback();
    if (!settingsInitialized) {
      if (!settingsTouched) $('connectionSettings').open = !r?.ok && !localStatus?.active;
      settingsInitialized = true;
    }
    if (!r?.ok) return display('status', r?.error || text.unknown);
    if (!r.active) return display('status', text.paired, true);
    const cover = coverMessages.get(r.coverStatus) || coverMessages.get('waiting');
    const data = `${text.player} · ${r.standalone ? text.app : text.tab}` +
      (r.coverStatus === 'ready' ? '' : `\n${text.artwork}: ${cover}`) +
      (r.popupControls === true || localStatus?.active ? '' : `\n${text.controlUpdate}`);
    display('status', r.playerStale ? `${data}\n${text.stale}` : data, !r.playerStale);
  } catch (e) {
    if (!closed && request === latestRequest) { bridgePlayback = null; applyPlayback(); display('status', e.message); }
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
    bridgePlayback = null;
    applyPlayback();
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
async function executeControl(command, player, extra = {}) {
    const request = ++latestControl;
    pendingControls.set(request, command);
    display('controlFeedback', '');
    updateControls();
    try {
      const result = await chrome.runtime.sendMessage({ type: player.mode === 'local' ? 'local-control' : 'control', command,
        playerId: player.id, trackKey: player.key, ...extra });
      if (closed || request !== latestControl) return result;
      if (!result?.ok) display('controlFeedback', result?.reason === 'player-changed' ? text.controlChanged : text.controlFailed);
      return result;
    } catch {
      if (!closed && request === latestControl) display('controlFeedback', text.controlFailed);
    } finally {
      pendingControls.delete(request);
      updateControls();
      if (!closed) { void refreshStatus(true); void refreshLocalPlayer(); }
    }
}
for (const [id, command] of Object.entries(controlButtons)) {
  $(id).addEventListener('click', async () => {
    if ($(id).disabled || !currentPlayer || closed) return;
    await executeControl(command, currentPlayer);
  });
}
$('volumeSlider').addEventListener('input', () => {
  if ($('volumeSlider').disabled || closed) return;
  volumeEditing = true; volumeRevision++; volumeDeadline = Infinity;
  $('volumeValue').textContent = `${$('volumeSlider').value}%`;
});
$('volumeSlider').addEventListener('change', () => {
  const amount = Number($('volumeSlider').value);
  if ($('volumeSlider').disabled || !currentPlayer || closed || !Number.isInteger(amount) || amount < 0 || amount > 100) return;
  volumeEditing = true;
  queuedVolume = { player: currentPlayer, amount, revision: volumeRevision };
  if (!volumeSending) void flushVolume();
});
async function flushVolume() {
  volumeSending = true;
  try {
    while (queuedVolume && !closed) {
      const intent = queuedVolume; queuedVolume = null;
      if (playerIdentity(intent.player) !== playerIdentity(currentPlayer)) continue;
      const result = await executeControl('volume_set', intent.player, { amount: intent.amount });
      if (intent.revision === volumeRevision && !queuedVolume) {
        if (!result?.ok) volumeEditing = false;
        volumeDeadline = Date.now() + 3000;
      }
    }
  } finally { volumeSending = false; updateControls(); }
}
clearArtwork();
showPlayer(null);
$('refresh').click();
void refreshLocalPlayer();
const statusTimer = setInterval(() => { void refreshStatus(true); void refreshLocalPlayer(); }, 1000);
window.addEventListener('pagehide', () => {
  closed = true;
  queuedVolume = null;
  clearInterval(statusTimer);
}, { once: true });
