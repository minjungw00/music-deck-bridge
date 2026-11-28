'use strict';
(function (root) {
  const { MUSIC_URL } = root.MusicDeckTabCommands;
  function createBrowserChannel({ chrome, client, tabCommands }) {
    const { post, pairedToken } = client;
    let browserListening = false;
    let browserRetryTimer = null;
    let browserChannelAvailable = null;

    async function startBrowserListener() {
      if (browserListening || !chrome.tabs?.query) return;
      if (browserRetryTimer) clearTimeout(browserRetryTimer);
      browserRetryTimer = null;
      browserListening = true;
      let listeningToken;
      let retry = false;
      let retryDelay = 1000;
      const active = new Set();
      let executionFailure;
      try {
        while (true) {
          if (executionFailure) throw executionFailure;
          const token = await pairedToken();
          listeningToken = token;
          if (!token) {
            // Notify only about missing credentials; this never authenticates or
            // deletes the plugin's stored pair. It also suppresses blind launching.
            await post('/status', { token: '' }).catch(() => {});
            return;
          }
          let result;
          try {
            const tabs = await chrome.tabs.query({ url: MUSIC_URL + '*' });
            result = await post('/browser-listen', { token, clientIds: tabs.map(tab => tab.id),
              concurrent: true, repeat: true, shuffle: true, queueStartup: true }, 15500);
          }
          catch (error) {
            if (error.httpStatus === 404) browserChannelAvailable = false;
            throw error;
          }
          browserChannelAvailable = true;
          if (!Array.isArray(result.commands)) return;
          // Re-pairing/unpairing must invalidate already received browser commands.
          if (await pairedToken() !== token) continue;
          for (const command of result.commands) {
            let release;
            const accepted = new Promise(resolve => { release = resolve; });
            const execution = (async () => {
              let ok = false;
              const diagnostic = {};
              try {
                ok = await tabCommands.perform(command, async confirm => {
                  if (await pairedToken() !== token) return false;
                  // Recheck server-side authorization before each dispatch.
                  if (confirm) {
                    try {
                      const status = await post('/status', { token });
                      if (command.playerKey && (status.player?.id !== String(command.preferredTabId) ||
                          status.player?.key !== command.playerKey)) {
                        diagnostic.reason = 'player-changed';
                        return false;
                      }
                    }
                    catch (error) {
                      diagnostic.reason = error.httpStatus === 401 ? 'authorization-lost' : 'bridge-unavailable';
                      return false;
                    }
                  }
                  return await pairedToken() === token;
                }, diagnostic, release);
              } catch { diagnostic.reason = 'browser-api-failed'; }
              try {
                if (await pairedToken() === token) await post('/browser-result',
                  { token, id: command.id, ok, ...(!ok ? { reason: diagnostic.reason } : {}) });
              } finally { release(); }
            })();
            active.add(execution);
            void execution.then(() => active.delete(execution), error => {
              executionFailure = error; active.delete(execution);
            });
            // Until receipt, retain startup/tab selection and message ordering.
            // Older content scripts give only a final result and stay serial.
            await accepted;
          }
        }
      } catch (error) {
        // Host restart/temporary network failure must not leave a running browser
        // disconnected until the next one-minute maintenance alarm.
        retry = Boolean(error.compatibility) || !error.httpStatus || error.httpStatus >= 500;
        if (error.compatibility) retryDelay = 5000;
      }
      finally {
        await Promise.allSettled(active);
        browserListening = false;
        const token = await pairedToken().catch(() => '');
        if (token && token !== listeningToken) void startBrowserListener();
        else if (token && retry) browserRetryTimer = setTimeout(() => { void startBrowserListener(); }, retryDelay);
      }
    }

    return { start: startBrowserListener,
      get lastFailure() { return tabCommands.lastFailure; },
      get playbackTrace() { return tabCommands.playbackTrace; },
      get available() { return browserChannelAvailable; } };
  }
  root.MusicDeckBrowserChannel = Object.freeze({ create: createBrowserChannel });
})(globalThis);
