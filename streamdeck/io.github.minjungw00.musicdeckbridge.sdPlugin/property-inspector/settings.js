'use strict';
/* Property inspector using the official sdpi-components controls and Stream Deck client. */
const client = SDPIComponents.streamDeckClient;
const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca?utm_source=streamdeck_plugin&utm_medium=referral&utm_campaign=companion_setup';
const $ = id => document.getElementById(id);
const strings = MusicDeckInspectorStrings;
const { keyDisplay, currentTrackKeySettings } = MusicDeckKeyDisplay;
let language = 'en';
let currentStatus = null;
let statusPoll = null;
let responseTimer = null;
let connectedToHost = false;
let lastPin = '';
let lastPinExpiresAt = 0;
let portIsDirty = false;
let volumeKey = false;
let currentTrackKey = false;
let queueKey = '';
let receivingLinkedSettings = false;
let linkedGapDirty = false;
const connectionSection = $('connectionSection');
const connectionEnd = connectionSection.nextElementSibling;
const { validVolume, validDuration, createVolumeEditor } = MusicDeckVolumeEditor;
const editor = createVolumeEditor({
  onValue(value) { $('volumeStep').value = String(value); updateVolumeLabel(); },
  onPreview(value) {
    if (connectedToHost) void client.send('sendToPlugin', { type: 'volume-preview', value }).catch(() => {});
  },
  onDurationValue(value) { $('volumeFeedbackSeconds').value = String(value); updateDurationLabel(); },
  onDurationPreview(value) {
    if (connectedToHost) void client.send('sendToPlugin', { type: 'volume-duration-preview', value }).catch(() => {});
  },
  onSave(settings) {
    if (connectedToHost) void client.setSettings(settings).catch(() => {});
  },
});

const t = key => strings[language][key];
function setLabel(id, value) {
  const element = $(id);
  element.setAttribute('label', value);
  // The bundled SDPI localized-label comparator misses changed labels. Force a
  // render without changing value/defaults or causing a settings save.
  element.requestUpdate?.();
}
function localize() {
  document.documentElement.lang = MusicDeckLanguage.html(language);
  document.title = `Music Deck Bridge – ${t('settingsTitle')}`;
  setLabel('keyDisplayRow', t('keyDisplay'));
  $('optKeyIcon').textContent = t('keyDisplayIcon');
  $('optKeyArtwork').textContent = t('dialArtwork');
  $('optKeyLinked').textContent = t('keyDisplayLinked');
  setLabel('keyArtworkIconRow', t('dialArtwork'));
  setLabel('keyArtworkShowIcon', t('keyArtworkShowIcon'));
  setLabel('keyArtworkIconPositionRow', t('keyArtworkIconPosition'));
  for (const position of ['TopLeft', 'TopCenter', 'TopRight', 'MiddleLeft', 'Center', 'MiddleRight', 'BottomLeft',
    'BottomCenter', 'BottomRight']) $('optIcon' + position).textContent = t('icon' + position);
  setLabel('albumGroupRow', t('albumGroup'));
  $('albumGroup').setAttribute('placeholder', t('albumGroupAuto'));
  $('albumGroupHint').textContent = t('albumGroupHint');
  setLabel('linkedArtworkFitRow', t('artworkFit'));
  $('linkedArtworkFit').setAttribute('aria-label', t('artworkFit'));
  $('optLinkedFitHeight').textContent = t('artworkHeight');
  $('optLinkedFitWidth').textContent = t('artworkWidth');
  setLabel('linkedGapHorizontalRow', t('linkedGapHorizontal'));
  setLabel('linkedGapVerticalRow', t('linkedGapVertical'));
  $('linkedGapHint').textContent = t('linkedGapHint');
  $('applyLinkedGap').textContent = t('applyPort');
  setLabel('titleModeRow', t('titleRow'));
  $('optTruncate').textContent = t('truncate');
  $('optScroll').textContent = t('scroll');
  $('titleHint').textContent = t('titleHint');
  setLabel('keyTitleRow', t('artworkTitle'));
  setLabel('showTitle', t('artworkShowTitle'));
  setLabel('keyArtistRow', t('artworkArtist'));
  setLabel('showArtist', t('artworkShowArtist'));
  setLabel('keyBackgroundRow', t('artworkBackground'));
  setLabel('titleBackground', t('artworkShowBackground'));
  for (const [row, below, inline] of [['keyArtistPositionRow', 'optKeyArtistBelow', 'optKeyArtistInline'],
    ['artworkArtistPositionRow', 'optArtworkArtistBelow', 'optArtworkArtistInline']]) {
    setLabel(row, t('artistPosition'));
    $(below).textContent = t('artistBelow'); $(inline).textContent = t('artistInline');
  }
  setLabel('dialDisplayRow', t('dialDisplayRow'));
  $('optDialTitle').textContent = t('dialTitle');
  $('optDialInfo').textContent = t('dialInfo');
  $('optDialArtwork').textContent = t('dialArtwork');
  $('dialDisplayHint').textContent = t('dialDisplayHint');
  setLabel('infoTitleModeRow', t('titleRow'));
  $('optInfoTruncate').textContent = t('truncate');
  $('optInfoScroll').textContent = t('scroll');
  setLabel('artworkFitRow', t('artworkFit'));
  $('optArtworkWidth').textContent = t('artworkWidth');
  $('optArtworkHeight').textContent = t('artworkHeight');
  $('artworkFitHint').textContent = t('artworkFitHint');
  setLabel('artworkTitleRow', t('artworkTitle'));
  setLabel('artworkShowTitle', t('artworkShowTitle'));
  setLabel('artworkArtistRow', t('artworkArtist'));
  setLabel('artworkShowArtist', t('artworkShowArtist'));
  setLabel('artworkBackgroundRow', t('artworkBackground'));
  setLabel('artworkTitleBackground', t('artworkShowBackground'));
  setLabel('artworkTitleModeRow', t('artworkTitleMode'));
  $('optArtworkTruncate').textContent = t('truncate');
  $('optArtworkScroll').textContent = t('scroll');
  setLabel('volumeRow', t(volumeKey ? 'volumeKeyRow' : 'volumeRow'));
  $('volumeStep').setAttribute('aria-label', t(volumeKey ? 'volumeKeyRow' : 'volumeRow'));
  $('volumeHint').textContent = t(volumeKey ? 'volumeKeyHint' : 'volumeHint');
  for (const id of ['volumeValueRow', 'volumePercentRow']) setLabel(id, t(id));
  for (const id of ['volumeShowValue', 'volumeShowPercent']) setLabel(id, t(id));
  setLabel('feedbackDurationRow', t('feedbackDurationRow'));
  $('volumeFeedbackSeconds').setAttribute('aria-label', t('feedbackDurationRow'));
  $('feedbackDurationMin').textContent = `0${t('feedbackDurationUnit')}`;
  $('feedbackDurationMax').textContent = `3${t('feedbackDurationUnit')}`;
  $('feedbackDurationHint').textContent = t('feedbackDurationHint');
  $('installExtension').textContent = t('installExtension');
  $('companionHint').textContent = t('companionHint');
  setLabel('pinRow', t('pinRow'));
  $('generatePin').textContent = t('generate');
  $('pairHint').textContent = t('pairHint');
  setLabel('portRow', t('portRow'));
  $('applyPort').textContent = t('applyPort');
  if (!$('portStatus').dataset?.hasResult) $('portStatus').textContent = t('portHint');
  if (!currentStatus) $('pairState').textContent = t('checking');
  updateVolumeLabel();
  updateDurationLabel();
  // SDPI caches option labels separately from the original option nodes.
  for (const id of ['keyDisplay', 'keyArtworkIconPosition', 'linkedArtworkFit', 'artistPosition', 'titleMode', 'dialDisplay', 'infoTitleMode', 'artworkFit',
    'artworkArtistPosition', 'artworkTitleMode']) $(id).refresh?.();
}
function updateVolumeLabel() {
  const value = validVolume($('volumeStep').value) ?? 4;
  $('stepLabel').textContent = `${Number.isFinite(value) ? Math.max(1, Math.min(5, value)) : 4}%`;
}
function updateVolumeFeedbackOptions(showValue = $('volumeShowValue').value) {
  $('volumePercentRow').classList.toggle('hidden', showValue === false);
  $('volumeDurationOptions').classList.toggle('hidden', showValue === false);
}
function updateDurationLabel() {
  const label = `${validDuration($('volumeFeedbackSeconds').value) ?? 2}${t('feedbackDurationUnit')}`;
  $('feedbackDurationLabel').textContent = label;
  $('volumeFeedbackSeconds').setAttribute('aria-valuetext', label);
}
$('volumeShowValue').addEventListener('valuechange', () => {
  editor.receive({ volumeShowValue: $('volumeShowValue').value !== false });
  updateVolumeFeedbackOptions();
});
$('volumeShowPercent').addEventListener('valuechange', () => {
  editor.receive({ volumeShowPercent: $('volumeShowPercent').value === true });
});
function updateArtworkOptions(mode = $('dialDisplay').value, showTitle = $('artworkShowTitle').value, showArtist = $('artworkShowArtist').value) {
  $('infoTitleModeRow').classList.toggle('hidden', mode === 'artwork');
  $('artworkOptions').classList.toggle('hidden', mode !== 'artwork');
  $('artworkTextOptions').classList.toggle('hidden', mode !== 'artwork' || showTitle !== true);
  $('artworkArtistPositionRow').classList.toggle('hidden', mode !== 'artwork' || showTitle !== true || showArtist !== true);
}
function updateKeyArtworkOptions(settings = editor.settings) {
  const track = currentTrackKey ? currentTrackKeySettings(settings) : null;
  const mode = track?.mode ?? keyDisplay(settings);
  const artwork = mode !== 'icon';
  $('keyArtworkIconRow').classList.toggle('hidden', !artwork);
  $('keyArtworkIconPositionRow').classList.toggle('hidden', !artwork || settings.keyArtworkShowIcon !== true);
  $('albumGroupOptions').classList.toggle('hidden', mode !== 'linked');
  $('trackSection').classList.toggle('hidden', !currentTrackKey);
  if (track) {
    $('showTitle').defaultValue = track.showTitle;
    $('showArtist').defaultValue = track.showArtist;
    $('keyArtistPositionRow').classList.toggle('hidden', !track.showArtist);
  }
  $('volumeFeedbackOptions').classList.toggle('hidden', !volumeKey || artwork);
}
function updateKeyArtworkFromControls() {
  updateKeyArtworkOptions({ ...editor.settings, keyDisplay: $('keyDisplay').value,
    keyArtworkShowIcon: $('keyArtworkShowIcon').value, keyShowTitle: $('showTitle').value,
    keyShowArtist: $('showArtist').value });
}
$('keyDisplay').addEventListener('valuechange', updateKeyArtworkFromControls);
$('keyArtworkShowIcon').addEventListener('valuechange', updateKeyArtworkFromControls);
$('dialDisplay').addEventListener('valuechange', () => updateArtworkOptions());
$('artworkShowTitle').addEventListener('valuechange', () => updateArtworkOptions());
$('artworkShowArtist').addEventListener('valuechange', () => updateArtworkOptions());
$('showArtist').addEventListener('valuechange', () => {
  const artist = $('showArtist');
  $('keyArtistPositionRow').classList.toggle('hidden', !(artist.value ?? artist.defaultValue));
});
function prioritizeConnection(connected) {
  const body = document.body;
  const target = connected ? connectionEnd : body.firstElementChild;
  if (target !== connectionSection && connectionSection.nextElementSibling !== target) {
    if (typeof body.moveBefore === 'function') body.moveBefore(connectionSection, target);
    else body.insertBefore(connectionSection, target);
  }
  connectionSection.classList.toggle('connection-first', !connected);
}
function showConnection(payload) {
  currentStatus = payload;
  const connected = payload.paired && payload.extensionOnline && payload.bridgeOnline !== false && payload.compatibility?.compatible !== false;
  prioritizeConnection(connected);
  receivingLinkedSettings = true;
  $('linkedArtworkFit').value = payload.linkedArtworkFit === 'width' ? 'width' : 'height';
  if (!linkedGapDirty) {
    $('linkedGapHorizontal').value = String(payload.linkedArtworkGap?.horizontal ?? 0);
    $('linkedGapVertical').value = String(payload.linkedArtworkGap?.vertical ?? 0);
  }
  receivingLinkedSettings = false;
  const queueError = queueKey && payload[queueKey + 'Error'];
  const error = queueError ? null : payload.lastCommandError;
  const hint = error === 'autoplay-blocked' ? 'commandAutoplay' :
    ['pairing-required', 'authorization-lost'].includes(error) ? 'commandPairing' :
    ['extension-unavailable', 'browser-api-failed', 'bridge-unavailable'].includes(error) ? 'commandExtension' :
    ['delivery-uncertain', 'playback-unconfirmed'].includes(error) ? 'commandDelivery' : 'commandPlayer';
  const queueHint = queueKey + (queueError?.endsWith('-update-required') ? 'Update' : 'Unavailable');
  $('commandStatus').textContent = queueError ? t(queueHint) :
    error ? `${t('commandFailed')} ${t(hint)} (${error})` : '';
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
async function requestConnection(type='get-connection', fields = {}) {
  if (!connectedToHost) return;
  try { await client.send('sendToPlugin', { type, ...fields }); }
  catch { $('pairState').textContent = t('offline'); prioritizeConnection(false); }
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
  updateVolumeFeedbackOptions(editor.settings.volumeShowValue !== false);
  updateArtworkOptions(editor.settings.dialDisplay || 'info', editor.settings.artworkShowTitle === true, editor.settings.artworkShowArtist === true);
  updateKeyArtworkOptions(msg.payload?.settings || {});
});
$('installExtension').addEventListener('click', async () => {
  $('companionHint').textContent = t('companionHint');
  try { await client.send('openUrl', { url: CHROME_STORE_URL }); }
  catch { $('companionHint').textContent = t('storeOpenFailed'); }
});
$('generatePin').addEventListener('click', () => { lastPin = ''; void requestConnection('generate-pin'); });
$('linkedArtworkFit').addEventListener('valuechange', () => {
  if (!receivingLinkedSettings) void requestConnection('set-linked-fit', { fit: $('linkedArtworkFit').value });
});
for (const id of ['linkedGapHorizontal', 'linkedGapVertical']) {
  $(id).addEventListener('valuechange', () => {
    if (receivingLinkedSettings) return;
    linkedGapDirty = true;
    $('linkedGapError').classList.add('hidden');
  });
}
$('applyLinkedGap').addEventListener('click', () => {
  const horizontal = Number($('linkedGapHorizontal').value || 0);
  const vertical = Number($('linkedGapVertical').value || 0);
  if ([horizontal, vertical].some(gap => !Number.isInteger(gap) || gap < 0 || gap > 100)) {
    $('linkedGapError').textContent = t('linkedGapInvalid');
    $('linkedGapError').classList.remove('hidden');
    return;
  }
  linkedGapDirty = false;
  void requestConnection('set-linked-gap', { gap: { horizontal, vertical } });
});
// Read event.target.value from the native input while persistence is pending.
$('volumeStep').addEventListener('input', event => editor.input(event.target.value));
$('volumeStep').addEventListener('change', event => editor.change(event.target.value));
$('volumeFeedbackSeconds').addEventListener('input', event => editor.durationInput(event.target.value));
$('volumeFeedbackSeconds').addEventListener('change', event => editor.durationChange(event.target.value));
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
    updateVolumeFeedbackOptions(editor.settings.volumeShowValue !== false);
    updateArtworkOptions(editor.settings.dialDisplay || 'info', editor.settings.artworkShowTitle === true, editor.settings.artworkShowArtist === true);
    language = MusicDeckLanguage.resolve(info?.application?.language);
    const action = actionInfo?.action || '';
    volumeKey = action.endsWith('.volumeup') || action.endsWith('.volumedown');
    currentTrackKey = action.endsWith('.nowplaying');
    if (currentTrackKey) {
      $('optKeyIcon').value = 'icon';
      $('keyDisplay').setAttribute('default', 'artwork');
    }
    queueKey = action.endsWith('.repeat') ? 'repeat' : action.endsWith('.shuffle') ? 'shuffle' : '';
    localize();
    if (action && !action.endsWith('.volume') && !action.endsWith('.trackdial')) $('keyArtworkSection').classList.remove('hidden');
    if (action.endsWith('.trackdial')) $('dialSection').classList.remove('hidden');
    if (volumeKey || action.endsWith('.volume')) $('volumeSection').classList.remove('hidden');
    if (volumeKey) $('volumeFeedbackOptions').classList.remove('hidden');
    updateKeyArtworkOptions();
    // Recover from races where the plugin answers before the inspector is ready.
    responseTimer = setTimeout(() => {
      if (!currentStatus) { $('pairState').textContent = t('bridgeWait'); prioritizeConnection(false); }
    }, 3500);
    await requestConnection();
    setTimeout(() => { if (!currentStatus) void requestConnection(); }, 700);
    statusPoll = setInterval(() => { void requestConnection(); }, 1000);
    setTimeout(updateVolumeLabel, 250);
  } catch {
    $('pairState').textContent = t('offline');
    prioritizeConnection(false);
  }
})();
window.addEventListener('pagehide', () => { if (statusPoll) clearInterval(statusPoll); if (responseTimer) clearTimeout(responseTimer); });
