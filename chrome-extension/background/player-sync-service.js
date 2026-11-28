'use strict';
(function (root) {
  const { mergePlaybackObservation } = root.MusicDeckTrackIdentity;
  function createPlayerSyncService({ chrome, client, browserChannel, pageControls, lastPlayer }) {
    const { post, pairedToken } = client;
    const { playerPlayback } = pageControls;
    const removedTabs = new Set(), tabs = new Map();
    const idle = { paired: false, commands: [] };
    const pairedIdle = { paired: true, commands: [], idle: true };
    function synchronize(type, state, sender) {
      const source = sender.tab;
      if (removedTabs.has(source.id)) return Promise.resolve(idle);
      if (type === 'listen') return listen(source.id);
      let tab = tabs.get(source.id);
      if (!tab) {
        tab = { pending: new Set(), latest: null, publication: null, closed: false };
        tabs.set(source.id, tab);
      }
      const input = { captured: sender.frameId === 0 && state?.trackConfirmed === true };
      tab.latest = input;
      // Commit the visible title even if MAIN enrichment loses a closing tab.
      if (input.captured) void lastPlayer?.observe(source, state, true);
      const request = syncTrack(tab, input, state, sender);
      tab.pending.add(request);
      return request.finally(() => { tab.pending.delete(request); });
    }
    async function listen(tabId) {
      const token = await pairedToken();
      if (!token || removedTabs.has(tabId)) return idle;
      // The modern browser channel carries every input. Keeping a separate
      // long poll per tab can exhaust Chrome's per-origin HTTP connection pool.
      // A 404 from older plugins enables the legacy tab channel instead.
      if (client.blocked() || browserChannel.available !== false) return pairedIdle;
      return forward('/listen', { token, clientId: tabId }, 15500);
    }
    async function syncTrack(tab, input, state, { tab: source, frameId }) {
      const token = await pairedToken();
      const bridge = !!token && !client.blocked();
      if (frameId === 0 && (bridge || state?.title)) {
        try {
          const observed = await chrome.scripting.executeScript({ target: { tabId: source.id, frameIds: [0] },
            world: 'MAIN', func: playerPlayback, args: ['state'] });
          if (observed[0]?.result) {
            state = mergePlaybackObservation(state, observed[0].result);
            if (!state) return token ? pairedIdle : idle;
          }
        } catch { /* Keep the DOM snapshot if the page is navigating. */ }
        if (tab.latest === input && !tab.closed) void lastPlayer?.observe(source, state);
      }
      if (!bridge) return token ? pairedIdle : idle;
      const send = () => {
        if (client.blocked() || tab.latest !== input || (tab.closed && !input.captured)) return pairedIdle;
        return forward('/sync', { token, clientId: source.id, state });
      };
      // Documents in the same tab can overlap during navigation or pagehide.
      // Finish an in-flight publication before sending its replacement.
      const publication = tab.publication ? tab.publication.then(send, send) : Promise.resolve(send());
      tab.publication = publication;
      try { return await publication; }
      finally { if (tab.publication === publication) tab.publication = null; }
    }
    async function forward(route, body, timeout) {
      const result = await post(route, body, timeout);
      void browserChannel.start();
      return { paired: true, commands: result.commands || [], idle: result.idle === true };
    }
    function onRemoved(tabId) {
      removedTabs.add(tabId);
      if (removedTabs.size > 1024) removedTabs.delete(removedTabs.values().next().value);
      const tab = tabs.get(tabId);
      if (tab) tab.closed = true;
      lastPlayer?.remove(tabId);
      void (async () => {
        if (tab) await Promise.allSettled(tab.pending);
        tabs.delete(tabId);
        const token = await pairedToken();
        if (token) await post('/player-closed', { token, clientId: tabId });
      })().catch(() => {});
    }
    return { synchronize, onRemoved };
  }
  root.MusicDeckPlayerSyncService = Object.freeze({ create: createPlayerSyncService });
})(globalThis);
