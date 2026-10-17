'use strict';
/* Property inspector using the official sdpi-components controls and Stream Deck client. */
const client = SDPIComponents.streamDeckClient;
const $ = id => document.getElementById(id);
const strings = {
  ko: {
    titleRow: '곡명 및 가수', truncate: '말줄임', scroll: '왼쪽으로 스크롤',
    titleHint: '긴 곡명과 가수명이 모두 왼쪽으로 스크롤됩니다.',
    dialDisplayRow: '화면 표시', dialInfo: '아이콘 + 곡 이름', dialArtwork: '앨범 이미지',
    dialDisplayHint: '누르기·화면 터치: 재생/일시정지, 회전: 이전/다음 곡. 앨범 이미지가 없으면 재생 상태 아이콘을 표시합니다.',
    volumeRow: '회전당 볼륨', volumeHint: '다이얼 1칸당 변경량:',
    pinRow: 'Chrome 연결', generate: 'PIN 발급', checking: '연결 상태 확인 중…',
    portRow: '로컬 서버 포트', applyPort: '적용', portHint: '모든 버튼·다이얼에 공통으로 적용됩니다. 연결된 Chrome은 자동으로 포트를 변경합니다.',
    portInvalid: '포트는 1024~65535 사이의 정수여야 합니다.', portSaved: '서버 포트 변경 완료:',
    portFailed: '포트를 변경하지 못했습니다:', portOffline: '로컬 서버가 포트를 열지 못했습니다:',
    pairHint: 'Chrome 확장 프로그램에 PIN을 입력하세요. 10분 동안 유효합니다.',
    offline: 'Stream Deck 플러그인에서 응답이 없습니다. Stream Deck 앱을 다시 실행하세요.',
    unpaired: '미연결 · PIN을 발급하여 Chrome 확장 프로그램에 입력하세요.',
    extensionMissing: '확장 프로그램 연결 미확인 · 기존 인증 정보가 보관되어 있습니다. 확장을 재설치했다면 새 PIN을 발급하여 연결하세요.',
    playerMissing: 'Chrome 확장 프로그램 연결됨 · YouTube Music 창을 확인하세요.',
    sleeping: '연결됨 · YouTube Music이 유휴 상태이거나 응답이 지연되고 있습니다.',
    connected: '연결됨 · YouTube Music 제어 가능',
    pinIssued: 'PIN 발급됨 · Chrome 확장 프로그램에 입력하세요.',
    bridgeWait: 'Stream Deck 플러그인과 연결을 기다리는 중입니다.',
    commandFailed: '마지막 명령을 완료하지 못했습니다.',
    commandPairing: '새 PIN으로 확장 프로그램을 다시 연결하세요.',
    commandExtension: '확장 프로그램이 연결된 Chrome 프로필과 포트를 확인하세요.',
    commandPlayer: 'YouTube Music 페이지와 재생할 곡이 준비되었는지 확인하세요.',
    commandDelivery: '실행 결과를 확인하지 못했습니다. YouTube Music의 현재 상태를 확인하세요.',
    commandAutoplay: 'Chrome이 자동 재생을 차단했습니다. YouTube Music 창에서 재생을 허용한 뒤 다시 시도하세요.',
  },
  en: {
    titleRow: 'Title and artist', truncate: 'Truncate', scroll: 'Scroll left',
    titleHint: 'Both long track titles and artist names scroll to the left.',
    dialDisplayRow: 'Touch strip display', dialInfo: 'Icon + song name', dialArtwork: 'Album artwork',
    dialDisplayHint: 'Push or touch to play/pause; turn for previous/next track. Without artwork, the playback icon is shown.',
    volumeRow: 'Volume per tick', volumeHint: 'Change per dial tick:',
    pinRow: 'Chrome connection', generate: 'Generate PIN', checking: 'Checking connection…',
    portRow: 'Local server port', applyPort: 'Apply', portHint: 'Shared by all buttons/dials. A connected Chrome extension follows the new port automatically.',
    portInvalid: 'Port must be an integer from 1024 to 65535.', portSaved: 'Server port changed to:',
    portFailed: 'Could not change the port:', portOffline: 'Local server could not listen:',
    pairHint: 'Enter the PIN in the Chrome extension popup. Valid for 10 minutes.',
    offline: 'No response from the Stream Deck plugin. Restart the Stream Deck app.',
    unpaired: 'Not paired · Generate a PIN and enter it in Chrome.',
    extensionMissing: 'Extension connection unconfirmed · Previous credentials are stored. If you reinstalled the extension, generate a new PIN and pair again.',
    playerMissing: 'Chrome extension connected · Open or refresh YouTube Music.',
    sleeping: 'Connected · YouTube Music may be idle or temporarily unresponsive.',
    connected: 'Connected · YouTube Music is ready',
    pinIssued: 'PIN generated · Enter it in the Chrome extension.',
    bridgeWait: 'Waiting for the Stream Deck plugin to respond.',
    commandFailed: 'The last command did not complete.',
    commandPairing: 'Pair the extension again with a new PIN.',
    commandExtension: 'Check the paired Chrome profile and bridge port.',
    commandPlayer: 'Check that YouTube Music and a playable track are ready.',
    commandDelivery: 'Could not confirm execution. Check the current player state.',
    commandAutoplay: 'Chrome blocked autoplay. Allow playback in YouTube Music, then try again.',
  },
};
let language = 'en';
let currentStatus = null;
let statusPoll = null;
let responseTimer = null;
let connectedToHost = false;
let lastPin = '';
let lastPinExpiresAt = 0;
let portIsDirty = false;
// Read the native range value immediately while its persisted settings are pending.
let actionSettings = {};
let latestVolumeStep = 4;
let volumeTouched = false;
let volumeWasCommitted = false;
function validVolume(value) {
  const v = Number(value);
  return Number.isInteger(v) && v >= 1 && v <= 5 ? v : null;
}
function syncSavedVolume(settings) {
  if (!settings || typeof settings !== 'object') return;
  const received = validVolume(settings.volumeStep);
  actionSettings = { ...actionSettings, ...settings };
  if (volumeTouched) {
    // Ignore an out-of-order saved-settings notification while editing.
    actionSettings.volumeStep = latestVolumeStep;
    if (received === latestVolumeStep && volumeWasCommitted) volumeTouched = false;
    return;
  }
  if (received !== null) {
    latestVolumeStep = received;
    $('volumeStep').value = String(received);
    updateVolumeLabel();
  }
}

const t = key => strings[language][key];
function localize() {
  document.documentElement.lang = language;
  $('titleModeRow').setAttribute('label', t('titleRow'));
  $('optTruncate').textContent = t('truncate');
  $('optScroll').textContent = t('scroll');
  $('titleHint').textContent = t('titleHint');
  $('dialDisplayRow').setAttribute('label', t('dialDisplayRow'));
  $('optDialInfo').textContent = t('dialInfo');
  $('optDialArtwork').textContent = t('dialArtwork');
  $('dialDisplayHint').textContent = t('dialDisplayHint');
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
function showConnection(payload) {
  currentStatus = payload;
  const error = payload.lastCommandError;
  const hint = error === 'autoplay-blocked' ? 'commandAutoplay' :
    ['pairing-required', 'authorization-lost'].includes(error) ? 'commandPairing' :
    ['extension-unavailable', 'browser-api-failed', 'bridge-unavailable'].includes(error) ? 'commandExtension' :
    ['delivery-uncertain', 'playback-unconfirmed'].includes(error) ? 'commandDelivery' : 'commandPlayer';
  $('commandStatus').textContent = error ? `${t('commandFailed')} ${t(hint)} (${error})` : '';
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
  if (payload.pin) {
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
  syncSavedVolume(msg.payload?.settings);
});
$('generatePin').addEventListener('click', () => { lastPin = ''; void requestConnection('generate-pin'); });
function sendVolumePreview(value) {
  if (!connectedToHost) return;
  // Preview is independent of persisted settings: the very first dial tick must
  // use the currently visible slider value, even if Stream Deck is still saving.
  void client.send('sendToPlugin', { type: 'volume-preview', value }).catch(() => {});
}
function onVolumeInput(event) {
  // IMPORTANT: event.target is the native input, not a shadow-DOM wrapper.
  const value = validVolume(event.target.value);
  if (value === null) return;
  latestVolumeStep = value;
  volumeTouched = true;
  volumeWasCommitted = false;
  $('volumeStep').value = String(value);
  updateVolumeLabel();
  sendVolumePreview(value);
}
function onVolumeChange(event) {
  const value = validVolume(event.target.value);
  if (value === null) return;
  if (!volumeTouched || latestVolumeStep !== value) onVolumeInput(event);
  volumeWasCommitted = true;
  actionSettings = { ...actionSettings, volumeStep: value };
  if (connectedToHost) {
    // Like the Elgato Discord plugin, explicitly persist the value received
    // from the native range's change event. Preserve any other action settings.
    void client.setSettings({ ...actionSettings }).catch(() => {});
  }
}
$('volumeStep').addEventListener('input', onVolumeInput);
$('volumeStep').addEventListener('change', onVolumeChange);
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
    syncSavedVolume(actionInfo?.payload?.settings || {});
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
