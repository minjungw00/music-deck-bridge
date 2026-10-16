'use strict';
const $ = id => document.getElementById(id);
const language = (chrome.i18n?.getUILanguage?.() || navigator.language || 'en').toLowerCase().startsWith('ko') ? 'ko' : 'en';
const text = Object.fromEntries(
  ["heading","subtitle","guide","pin","connect","refresh","forget","portLabel","savePort","portHint","portInvalid","portSaved","portLocal","invalid","checking","fail","connected","unknown","player","app","tab","current","waiting","artwork","stale","paired","removed"]
    .map(key => [key, chrome.i18n.getMessage(key)])
);
const coverMessages = new Map([
  ['missing', 'coverMissing'], ['blocked', 'coverBlocked'], ['ready', 'coverReady'],
  ['downloading', 'coverDownloading'], ['waiting', 'coverWaiting'], ['failed', 'coverFailed'],
].map(([code, key]) => [code, chrome.i18n.getMessage(key)]));
document.documentElement.lang = language;
document.title = chrome.i18n.getMessage('extensionName');
for (const [id, key] of [['heading','heading'],['subtitle','subtitle'],['guide','guide'],['pinLabel','pin'],['connect','connect'],['refresh','refresh'],['forget','forget'],['portLabel','portLabel'],['savePort','savePort'],['portHint','portHint']]) {
  $(id).textContent = text[key];
}
function info(message, ok = false) {
  $('status').textContent = message;
  $('status').style.color = ok ? '#8ceba2' : '#fbabb6';
}
$('connect').addEventListener('click', async () => {
  const pin = $('pin').value.trim();
  if (!/^\d{6}$/.test(pin)) return info(text.invalid);
  info(text.checking);
  try {
    const response = await chrome.runtime.sendMessage({ type:'pair', pin });
    if (!response?.ok) return info(response?.error || text.fail);
    $('pin').value = '';
    info(text.connected, true);
  } catch (e) { info(e.message); }
});
$('refresh').addEventListener('click', async () => {
  try {
    const r = await chrome.runtime.sendMessage({ type:'check' });
    if (!r?.ok) return info(r?.error || text.unknown);
    if (!r.active) return info(text.paired, true);
    const cover = coverMessages.get(r.coverStatus) || coverMessages.get('waiting');
    const data = `${text.player} · ${r.standalone ? text.app : text.tab}\n${text.current}: ${r.track || text.waiting}\n${text.artwork}: ${cover}`;
    info(r.playerStale ? `${data}\n${text.stale}` : data, !r.playerStale);
  } catch (e) { info(e.message); }
});
$('forget').addEventListener('click', async () => {
  try {
    const result = await chrome.runtime.sendMessage({ type:'unpair' });
    if (!result?.ok) return info(result?.error || text.fail);
    info(text.removed, true);
  } catch (error) { info(error.message); }
});
$('savePort').addEventListener('click', async () => {
  const port = Number($('port').value);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) return info(text.portInvalid);
  try {
    const result = await chrome.runtime.sendMessage({ type: 'set-port', port });
    if (!result?.ok) return info(result?.error || text.fail);
    $('port').value = String(result.port);
    info(result.localOnly ? text.portLocal : `${text.portSaved} ${result.port}`, !result.localOnly);
  } catch (error) { info(error.message); }
});
(async () => {
  try {
    const saved = await chrome.runtime.sendMessage({ type: 'get-port' });
    if (saved?.ok) $('port').value = String(saved.port);
  } catch {}
})();
$('refresh').click();
