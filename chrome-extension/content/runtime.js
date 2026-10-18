'use strict';
(function (root) {
  function startContentRuntime({ chrome, document, events, current, createCommands }) {
    let active = true;
    const command = createCommands({ isActive: () => active, scheduleSync });
    const browserCommands = new Map();
    chrome.runtime.onMessage.addListener((message, sender, respond) => {
      if (!['bridge-command', 'bridge-toggle'].includes(message?.type) ||
          sender.id !== chrome.runtime.id || sender.tab || !active) return;
      if (Number.isFinite(message.expiresAt) && Date.now() >= message.expiresAt) {
        respond({ ok: false }); return false;
      }
      const input = message.type === 'bridge-toggle' ? { type: 'toggle' } : message.command;
      const id = typeof message.id === 'string' ? message.id : null;
      let operation = id && browserCommands.get(id);
      if (!operation) {
        operation = command({ ...input, expiresAt: message.expiresAt }).catch(() => ({ ok: false }));
        if (id) {
          browserCommands.set(id, operation);
          operation.then(result => { if (result.retry) browserCommands.delete(id); });
          while (browserCommands.size > 100) browserCommands.delete(browserCommands.keys().next().value);
        }
      }
      operation.then(respond);
      return true;
    });
    let listenerGeneration = 0;
    let inFlight = false;
    let syncTimer = null;
    let lastSynced = 0;
    async function synchronize() {
      if (!active || inFlight) return;
      inFlight = true;
      lastSynced = Date.now();
      try {
        const result = await chrome.runtime.sendMessage({ type: 'sync', state: current() });
        if (result?.paired && Array.isArray(result.commands)) {
          for (const c of result.commands) void command(c).catch(() => {});
        }
      } catch { /* Service worker or PWA restarting. */ }
      finally { inFlight = false; }
    }
    function scheduleSync(delay=80) {
      if (!active || syncTimer) return;
      const elapsed = Date.now() - lastSynced;
      syncTimer = setTimeout(() => {
        syncTimer = null;
        if (!inFlight) void synchronize();
      }, Math.max(delay, 90 - elapsed));
    }
    // Independent one-shot long-poll. A command wakes this immediately instead
    // of waiting for the next periodic metadata update.
    async function listen() {
      const generation = ++listenerGeneration;
      while (active && generation === listenerGeneration) {
        try {
          const response = await chrome.runtime.sendMessage({ type: 'listen' });
          if (!active || generation !== listenerGeneration) return;
          if (response?.paired && Array.isArray(response.commands)) {
            for (const c of response.commands) void command(c).catch(() => {});
            if (response.commands.length) continue;
            if (response.idle) await new Promise(resolve => setTimeout(resolve, 300));
          } else if (!response?.paired) {
            await new Promise(resolve => setTimeout(resolve, 750));
          }
        } catch {
          if (active) await new Promise(resolve => setTimeout(resolve, 750));
        }
      }
    }
    let clock = null;
    const observer = typeof MutationObserver === 'undefined' ? null :
      new MutationObserver(() => scheduleSync(120));
    function startSynchronization() {
      // Re-query the player bar when a cached document resumes.
      const bar = document.querySelector('ytmusic-player-bar');
      if (bar) observer?.observe(bar, { childList: true, subtree: true, attributes: true,
        attributeFilter: ['src', 'title', 'aria-label', 'style', 'aria-valuenow', 'aria-pressed', 'like-status'] });
      clock = setInterval(synchronize, 800); // status fallback; browsers throttle idle tabs
      void synchronize();
      void listen();
    }
    document.addEventListener('volumechange', () => scheduleSync(60), true);
    document.addEventListener('change', event => {
      if (event.target?.matches?.('#volume-slider, #expand-volume-slider')) scheduleSync(60);
    }, true);
    document.addEventListener('play', () => scheduleSync(60), true);
    document.addEventListener('pause', () => scheduleSync(60), true);
    document.addEventListener('ended', () => scheduleSync(60), true);
    events.addEventListener('pagehide', () => {
      active = false;
      listenerGeneration++;
      observer?.disconnect();
      clearInterval(clock);
      clearTimeout(syncTimer);
      syncTimer = null;
    });
    // Back/forward cache and background-tab activation may resume a suspended page.
    events.addEventListener('pageshow', event => {
      if (event.persisted && !active) {
        active = true;
        startSynchronization();
      }
    });
    events.addEventListener('focus', () => scheduleSync(20));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) scheduleSync(20);
    });
    startSynchronization();
  }
  root.MusicDeckContentRuntime = Object.freeze({ start: startContentRuntime });
})(globalThis);
