'use strict';
const $ = id => document.getElementById(id);
const language = (chrome.i18n?.getUILanguage?.() || navigator.language || 'en').toLowerCase().startsWith('ko') ? 'ko' : 'en';
const text = Object.fromEntries(
  ["heading","subtitle","companionHint","installPlugin","guide","pin","connect","refresh","forget","portLabel","savePort","portHint","portInvalid","portSaved","portLocal","invalid","checking","fail","connected","unknown","player","app","tab","current","waiting","artwork","stale","paired","removed"]
    .map(key => [key, chrome.i18n.getMessage(key)])
);
const coverMessages = new Map([
  ['missing', 'coverMissing'], ['blocked', 'coverBlocked'], ['ready', 'coverReady'],
  ['downloading', 'coverDownloading'], ['waiting', 'coverWaiting'], ['failed', 'coverFailed'],
].map(([code, key]) => [code, chrome.i18n.getMessage(key)]));
document.documentElement.lang = language;
document.title = chrome.i18n.getMessage('extensionName');
for (const [id, key] of [['heading','heading'],['subtitle','subtitle'],['companionHint','companionHint'],['installPlugin','installPlugin'],['guide','guide'],['pinLabel','pin'],['connect','connect'],['refresh','refresh'],['forget','forget'],['portLabel','portLabel'],['savePort','savePort'],['portHint','portHint']]) {
  $(id).textContent = text[key];
}
let latestRequest = 0;
let portRevision = 0;
let pendingActions = 0;
let statusRequests = 0;
let closed = false;
function display(id, message, ok = false) {
  if ($(id).textContent !== message) $(id).textContent = message;
  $(id).style.color = ok ? '#8ceba2' : '#fbabb6';
}
function info(message, ok = false) { display('feedback', message, ok); }
function onAction(id, handler) {
  $(id).addEventListener('click', async () => {
    const request = ++latestRequest;
    pendingActions++;
    try { await handler(request); }
    finally { pendingActions--; }
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
    if (!r?.ok) return display('status', r?.error || text.unknown);
    if (!r.active) return display('status', text.paired, true);
    const cover = coverMessages.get(r.coverStatus) || coverMessages.get('waiting');
    const data = `${text.player} · ${r.standalone ? text.app : text.tab}\n${text.current}: ${r.track || text.waiting}\n${text.artwork}: ${cover}`;
    display('status', r.playerStale ? `${data}\n${text.stale}` : data, !r.playerStale);
  } catch (e) { if (!closed && request === latestRequest) display('status', e.message); }
  finally { statusRequests--; }
}
$('refresh').addEventListener('click', () => refreshStatus());
onAction('forget', async request => {
  try {
    const result = await chrome.runtime.sendMessage({ type:'unpair' });
    if (request !== latestRequest) return;
    if (!result?.ok) return info(result?.error || text.fail);
    showVersions(null);
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
$('refresh').click();
const statusTimer = setInterval(() => { void refreshStatus(true); }, 1000);
window.addEventListener('pagehide', () => {
  closed = true;
  clearInterval(statusTimer);
}, { once: true });
