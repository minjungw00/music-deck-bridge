'use strict';
(function (root) {
  function createPlayerSyncService({ chrome, client, browserChannel, pageControls, lastPlayer }) {
    const { post, pairedToken } = client;
    const { playerPlayback } = pageControls;
    const removedTabs = new Set(), synchronizations = new Map();
    const latestInputs = new Map();
    const idle = { paired: false, commands: [] };
    function synchronize(type, state, sender) {
      const tab = sender.tab;
      if (removedTabs.has(tab.id)) return Promise.resolve(idle);
      if (type !== 'sync') return forward(type, state, sender);
      const input = {};
      latestInputs.set(tab.id, input);
      const captured = sender.frameId === 0 && state?.trackConfirmed === true;
      // Commit the visible title even if MAIN enrichment loses a closing tab.
      if (captured) void lastPlayer?.observe(tab, state, true);
      const request = forward(type, state, sender, captured, input);
      const pending = synchronizations.get(tab.id) || new Set();
      synchronizations.set(tab.id, pending);
      pending.add(request);
      return request.finally(() => {
        pending.delete(request);
        if (!pending.size) synchronizations.delete(tab.id);
      });
    }
    async function forward(type, state, sender, captured = false, input) {
      const token = await pairedToken();
      const bridge = !!token && !client.blocked();
      // The modern browser channel carries every input. Keeping a separate
      // long poll per tab can exhaust Chrome's per-origin HTTP/1 connection
      // pool and starve status checks/results, including after a tab closes.
      // A 404 from older plugins enables the legacy tab channel instead.
      if (type === 'listen' && !bridge) return token ? { ...idle, paired: true, idle: true } : idle;
      if (type === 'listen' && browserChannel.available !== false) {
        return { paired: true, commands: [], idle: true };
      }
      if (type === 'sync' && sender.frameId === 0 && (bridge || state?.title)) {
        try {
          const observed = await chrome.scripting.executeScript({ target: { tabId: sender.tab.id, frameIds: [0] },
            world: 'MAIN', func: playerPlayback, args: ['state'] });
          if (observed[0]?.result) state = { ...state, ...observed[0].result };
        } catch { /* Keep the DOM snapshot if the page is navigating. */ }
        if (latestInputs.get(sender.tab.id) === input && (captured || !removedTabs.has(sender.tab.id))) {
          void lastPlayer?.observe(sender.tab, state);
        }
      }
      if (!bridge || client.blocked()) return token ? { ...idle, paired: true, idle: true } : idle;
      if (captured && latestInputs.get(sender.tab.id) !== input) return { paired: true, commands: [] };
      if (removedTabs.has(sender.tab.id) && !captured) return { paired: true, commands: [] };
      const result = type === 'sync' ? await post('/sync', { token, clientId: sender.tab.id, state }) :
        await post('/listen', { token, clientId: sender.tab.id }, 15500);
      void browserChannel.start();
      return { paired: true, commands: result.commands || [], idle: result.idle === true };
    }
    function onRemoved(tabId) {
      removedTabs.add(tabId);
      if (removedTabs.size > 1024) removedTabs.delete(removedTabs.values().next().value);
      // Navigation can overlap snapshots from different documents in one tab.
      // Finish all submitted snapshots before removing the player's state.
      const pending = [...(synchronizations.get(tabId) || [])];
      void (async () => {
        await Promise.allSettled(pending);
        latestInputs.delete(tabId);
        lastPlayer?.remove(tabId);
        const token = await pairedToken();
        if (token) await post('/player-closed', { token, clientId: tabId });
      })().catch(() => {});
    }
    return { synchronize, onRemoved };
  }
  root.MusicDeckPlayerSyncService = Object.freeze({ create: createPlayerSyncService });
})(globalThis);
