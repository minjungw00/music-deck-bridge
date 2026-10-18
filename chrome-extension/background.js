'use strict';
// Classic MV3 composition root. The modules expose factories without starting work on import.
if (typeof importScripts === 'function') importScripts('protocol.js',
  'background/bridge-client.js', 'background/browser-channel.js',
  'background/page-controls.js', 'background/management-service.js',
  'background/player-sync-service.js', 'background/message-router.js');

const bridgeClient = MusicDeckBridgeClient.create({ chrome, protocol: MusicDeckProtocol,
  fetch: (...args) => fetch(...args) });
const contentScripts = chrome.runtime.getManifest().content_scripts[0].js;
const browserChannel = MusicDeckBrowserChannel.create({ chrome, client: bridgeClient, contentScripts });
const management = MusicDeckManagementService.create({ client: bridgeClient, browserChannel,
  translate: key => chrome.i18n?.getMessage?.(key) || '' });
const players = MusicDeckPlayerSyncService.create({ chrome, client: bridgeClient,
  browserChannel, pageControls: MusicDeckPageControls });
const router = MusicDeckMessageRouter.create({ chrome, client: bridgeClient,
  pageControls: MusicDeckPageControls, management, players });
chrome.runtime.onMessage.addListener(router.onMessage);
chrome.tabs?.onRemoved?.addListener(router.onRemoved);

// Named operations are also used by the real MV3 integration fixture.
const { post, pairedToken, configuredPort, setLocalPort } = bridgeClient;
const startBrowserListener = browserChannel.start;
const performBrowserCommand = browserChannel.perform;

// Reinject into existing YouTube Music tabs after an extension update or Chrome startup.
// A manifest content_script only runs on NEW document loads; already-open PWA windows
// otherwise keep an invalidated extension context until manually refreshed.
async function ensureMusicScripts() {
  try {
    const tabs = await chrome.tabs.query({ url: 'https://music.youtube.com/*' });
    for (const tab of tabs) {
      if (!Number.isInteger(tab.id) || tab.discarded) continue;
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: contentScripts, world: 'ISOLATED' });
      } catch { /* Permissions, navigation or a sleeping PWA can prevent reinjection. */ }
    }
  } catch { /* Chrome restarting or the extension host unavailable. */ }
}
function maintainConnection() {
  void chrome.alarms.create('pwa-check', { periodInMinutes: 1 });
  void ensureMusicScripts();
  void browserChannel.start();
}
chrome.runtime.onInstalled.addListener(maintainConnection);
chrome.runtime.onStartup.addListener(maintainConnection);
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'pwa-check') {
    void ensureMusicScripts();
    void browserChannel.start();
  }
});
// Listen even when no YouTube Music content script exists.
void browserChannel.start();
