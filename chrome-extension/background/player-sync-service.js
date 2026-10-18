'use strict';
(function (root) {
  function createPlayerSyncService({ chrome, client, browserChannel, pageControls }) {
    const { post, pairedToken } = client;
    const { playerPlayback } = pageControls;
    const removedTabs = new Set(), synchronizations = new Map();
    async function synchronize(type, state, sender) {
      const token = await pairedToken();
      if (!token) return { paired: false, commands: [] };
      if (client.blocked()) return { paired: true, commands: [], idle: true };
      // The modern browser channel carries every input. Keeping a separate
      // long poll per tab can exhaust Chrome's per-origin HTTP/1 connection
      // pool and starve status checks/results, including after a tab closes.
      // A 404 from older plugins enables the legacy tab channel instead.
      if (type === 'listen' && browserChannel.available !== false) {
        return { paired: true, commands: [], idle: true };
      }
      if (type === 'sync' && sender.frameId === 0) {
        try {
          const observed = await chrome.scripting.executeScript({ target: { tabId: sender.tab.id, frameIds: [0] },
            world: 'MAIN', func: playerPlayback, args: ['state'] });
          if (observed[0]?.result) state = { ...state, ...observed[0].result };
        } catch { /* Keep the DOM snapshot if the page is navigating. */ }
      }
      if (removedTabs.has(sender.tab.id)) return { paired: true, commands: [] };
      const request = type === 'sync' ? post('/sync', { token, clientId: sender.tab.id, state }) :
        post('/listen', { token, clientId: sender.tab.id }, 15500);
      if (type === 'sync') synchronizations.set(sender.tab.id, request);
      let result;
      try { result = await request; }
      finally { if (synchronizations.get(sender.tab.id) === request) synchronizations.delete(sender.tab.id); }
      void browserChannel.start();
      return { paired: true, commands: result.commands || [], idle: result.idle === true };
    }
    function onRemoved(tabId) {
      removedTabs.add(tabId);
      if (removedTabs.size > 1024) removedTabs.delete(removedTabs.values().next().value);
      const pending = synchronizations.get(tabId);
      void (async () => {
        await pending?.catch(() => {});
        const token = await pairedToken();
        if (token) await post('/player-closed', { token, clientId: tabId });
      })().catch(() => {});
    }
    return { synchronize, onRemoved };
  }
  root.MusicDeckPlayerSyncService = Object.freeze({ create: createPlayerSyncService });
})(globalThis);
