'use strict';
/* Property inspector using the official sdpi-components controls and Stream Deck client. */
const client = SDPIComponents.streamDeckClient;
const $ = id => document.getElementById(id);
const strings = MusicDeckInspectorStrings;
let language = 'en';
let currentStatus = null;
let statusPoll = null;
let responseTimer = null;
let connectedToHost = false;
let lastPin = '';
let lastPinExpiresAt = 0;
let portIsDirty = false;
const { validVolume, createVolumeEditor } = MusicDeckVolumeEditor;
const editor = createVolumeEditor({
  onValue(value) { $('volumeStep').value = String(value); updateVolumeLabel(); },
  onPreview(value) {
    if (connectedToHost) void client.send('sendToPlugin', { type: 'volume-preview', value }).catch(() => {});
  },
  onSave(settings) {
    if (connectedToHost) void client.setSettings(settings).catch(() => {});
  },
});

const t = key => strings[language][key];
function localize() {
  document.documentElement.lang = language;
  $('titleModeRow').setAttribute('label', t('titleRow'));
  $('optTruncate').textContent = t('truncate');
  $('optScroll').textContent = t('scroll');
  $('titleHint').textContent = t('titleHint');
  $('keyTitleRow').setAttribute('label', t('artworkTitle'));
  $('showTitle').setAttribute('label', t('artworkShowTitle'));
  $('keyArtistRow').setAttribute('label', t('artworkArtist'));
  $('showArtist').setAttribute('label', t('artworkShowArtist'));
  $('keyBackgroundRow').setAttribute('label', t('artworkBackground'));
  $('titleBackground').setAttribute('label', t('artworkShowBackground'));
  for (const [row, below, inline] of [['keyArtistPositionRow', 'optKeyArtistBelow', 'optKeyArtistInline'],
    ['artworkArtistPositionRow', 'optArtworkArtistBelow', 'optArtworkArtistInline']]) {
    $(row).setAttribute('label', t('artistPosition'));
    $(below).textContent = t('artistBelow'); $(inline).textContent = t('artistInline');
  }
  $('dialDisplayRow').setAttribute('label', t('dialDisplayRow'));
  $('optDialInfo').textContent = t('dialInfo');
  $('optDialArtwork').textContent = t('dialArtwork');
  $('dialDisplayHint').textContent = t('dialDisplayHint');
  $('artworkFitRow').setAttribute('label', t('artworkFit'));
  $('optArtworkWidth').textContent = t('artworkWidth');
  $('optArtworkHeight').textContent = t('artworkHeight');
  $('artworkFitHint').textContent = t('artworkFitHint');
  $('artworkTitleRow').setAttribute('label', t('artworkTitle'));
  $('artworkShowTitle').setAttribute('label', t('artworkShowTitle'));
  $('artworkArtistRow').setAttribute('label', t('artworkArtist'));
  $('artworkShowArtist').setAttribute('label', t('artworkShowArtist'));
  $('artworkBackgroundRow').setAttribute('label', t('artworkBackground'));
  $('artworkTitleBackground').setAttribute('label', t('artworkShowBackground'));
  $('artworkTitleModeRow').setAttribute('label', t('artworkTitleMode'));
  $('optArtworkTruncate').textContent = t('truncate');
  $('optArtworkScroll').textContent = t('scroll');
  $('volumeRow').setAttribute('label', t('volumeRow'));
  $('volumeStep').setAttribute('aria-label', t('volumeRow'));
  $('volumeHint').textContent = t('volumeHint');
  $('pinRow').setAttribute('label', t('pinRow'));
  $('generatePin').textContent = t('generate');
  $('pairHint').textContent = t('pairHint');
  $('portRow').setAttribute('label', t('portRow'));
  $('applyPort').textContent = t('applyPort');
  if (!$('portStatus').dataset?.hasResult) $('portStatus').textContent = t('portHint');
  if (!currentStatus) $('pairState').textContent = t('checking');
  updateVolumeLabel();
}
function updateVolumeLabel() {
  const value = validVolume($('volumeStep').value) ?? 4;
  $('stepLabel').textContent = `${Number.isFinite(value) ? Math.max(1, Math.min(5, value)) : 4}%`;
}
function updateArtworkOptions(mode = $('dialDisplay').value, showTitle = $('artworkShowTitle').value, showArtist = $('artworkShowArtist').value) {
  $('artworkOptions').classList.toggle('hidden', mode !== 'artwork');
  $('artworkTextOptions').classList.toggle('hidden', mode !== 'artwork' || showTitle !== true);
  $('artworkArtistPositionRow').classList.toggle('hidden', mode !== 'artwork' || showTitle !== true || showArtist !== true);
}
$('dialDisplay').addEventListener('valuechange', () => updateArtworkOptions());
$('artworkShowTitle').addEventListener('valuechange', () => updateArtworkOptions());
$('artworkShowArtist').addEventListener('valuechange', () => updateArtworkOptions());
$('showArtist').addEventListener('valuechange', () => $('keyArtistPositionRow').classList.toggle('hidden', $('showArtist').value === false));
function showConnection(payload) {
  currentStatus = payload;
  const error = payload.lastCommandError;
  const hint = error === 'autoplay-blocked' ? 'commandAutoplay' :
    ['pairing-required', 'authorization-lost'].includes(error) ? 'commandPairing' :
    ['extension-unavailable', 'browser-api-failed', 'bridge-unavailable'].includes(error) ? 'commandExtension' :
    ['delivery-uncertain', 'playback-unconfirmed'].includes(error) ? 'commandDelivery' : 'commandPlayer';
  $('commandStatus').textContent = error ? `${t('commandFailed')} ${t(hint)} (${error})` : '';
  const compatibility = payload.compatibility;
  $('versionInfo').textContent = `${t('pluginLabel')} ${payload.pluginVersion || '—'} · ${t('extensionLabel')} ${compatibility?.extensionVersion || '—'} · ${t('protocolLabel')} ${compatibility?.negotiatedProtocolVersion || '—'}${compatibility?.legacy ? ` (${t('legacyProtocol')})` : ''}`;
  if (payload.pin && /^\d{6}$/.test(payload.pin)) {
    lastPin = payload.pin;
    lastPinExpiresAt = Number(payload.expiresAt) || 0;
  } else if (payload.extensionOnline || Date.now() > lastPinExpiresAt) {
    lastPin = ''; lastPinExpiresAt = 0;
  }
  $('pinOutput').textContent = lastPin;
  if (!portIsDirty && Number.isInteger(payload.serverPort)) {
    $('serverPort').value = String(payload.serverPort);
  }
  if (payload.bridgeOnline === false && payload.portError) {
    $('portStatus').textContent = `${t('portOffline')} ${payload.portError}`;
  }
  if (compatibility?.compatible === false) {
    const key = compatibility.updateRequired === 'plugin' ? 'updatePlugin' : compatibility.updateRequired === 'extension' ? 'updateExtension' : 'protocolInvalid';
    $('pairState').textContent = t(key);
    $('commandStatus').textContent = '';
  } else if (payload.pin) {
    $('pairState').textContent = t('pinIssued');
  } else if (!payload.paired) {
    $('pairState').textContent = t('unpaired');
  } else if (!payload.extensionOnline) {
    $('pairState').textContent = t('extensionMissing');
  } else if (!payload.playerActive) {
    $('pairState').textContent = t('playerMissing');
  } else if (payload.playerStale) {
    $('pairState').textContent = t('sleeping');
  } else {
    $('pairState').textContent = t('connected');
  }
  if (responseTimer) { clearTimeout(responseTimer); responseTimer = null; }
}
async function requestConnection(type='get-connection') {
  if (!connectedToHost) return;
  try { await client.send('sendToPlugin', { type }); }
  catch { $('pairState').textContent = t('offline'); }
}
client.sendToPropertyInspector.subscribe(msg => {
  if (msg.payload?.type === 'connection') showConnection(msg.payload);
  if (msg.payload?.type === 'port-result') {
    const result = msg.payload;
    if (result.ok) {
      portIsDirty = false;
      $('serverPort').value = String(result.serverPort);
      $('portStatus').textContent = `${t('portSaved')} ${result.serverPort}`;
    } else {
      $('portStatus').textContent = `${t('portFailed')} ${result.error || ''}`;
    }
    $('portStatus').dataset.hasResult = 'true';
  }
});
client.didReceiveSettings.subscribe(msg => {
  // Native range is manually synchronized; sdpi-select persists titleMode/dialDisplay.
  editor.receive(msg.payload?.settings);
  updateArtworkOptions(editor.settings.dialDisplay || 'info', editor.settings.artworkShowTitle === true, editor.settings.artworkShowArtist === true);
  $('keyArtistPositionRow').classList.toggle('hidden', editor.settings.showArtist === false);
});
$('generatePin').addEventListener('click', () => { lastPin = ''; void requestConnection('generate-pin'); });
// Read event.target.value from the native input while persistence is pending.
$('volumeStep').addEventListener('input', event => editor.input(event.target.value));
$('volumeStep').addEventListener('change', event => editor.change(event.target.value));
$('serverPort').addEventListener('input', () => { portIsDirty = true; });
$('applyPort').addEventListener('click', () => {
  const port = Number($('serverPort').value);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    $('portStatus').textContent = t('portInvalid');
    return;
  }
  $('portStatus').textContent = t('checking');
  void client.send('sendToPlugin', { type: 'set-port', port }).catch(() => {
    $('portStatus').textContent = t('offline');
  });
});
void (async () => {
  try {
    const { info, actionInfo } = await client.getConnectionInfo();
    connectedToHost = true;
    editor.receive(actionInfo?.payload?.settings || {});
    updateArtworkOptions(editor.settings.dialDisplay || 'info', editor.settings.artworkShowTitle === true, editor.settings.artworkShowArtist === true);
    $('keyArtistPositionRow').classList.toggle('hidden', editor.settings.showArtist === false);
    language = info?.application?.language === 'ko' ? 'ko' : 'en';
    localize();
    const action = actionInfo?.action || '';
    if (action.endsWith('.nowplaying')) $('trackSection').classList.remove('hidden');
    if (action.endsWith('.trackdial')) $('dialSection').classList.remove('hidden');
    if (action.endsWith('.volume')) $('volumeSection').classList.remove('hidden');
    // Recover from races where the plugin answers before the inspector is ready.
    responseTimer = setTimeout(() => { if (!currentStatus) $('pairState').textContent = t('bridgeWait'); }, 3500);
    await requestConnection();
    setTimeout(() => { if (!currentStatus) void requestConnection(); }, 700);
    statusPoll = setInterval(() => { void requestConnection(); }, 1000);
    setTimeout(updateVolumeLabel, 250);
  } catch {
    $('pairState').textContent = t('offline');
  }
})();
window.addEventListener('pagehide', () => { if (statusPoll) clearInterval(statusPoll); if (responseTimer) clearTimeout(responseTimer); });
