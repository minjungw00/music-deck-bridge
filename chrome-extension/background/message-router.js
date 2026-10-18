'use strict';
(function (root) {
  function createMessageRouter({ chrome, client, browserChannel, pageControls }) {
    const { post, pairedToken, configuredPort, setLocalPort, validPort, failure } = client;
    const { playerPlayback, controlPlayerVolume } = pageControls;
    const removedTabs = new Set(), synchronizations = new Map();
    function onMessage(msg, sender, respond) {
      if (client.blocked() && ['player-playback', 'player-volume'].includes(msg?.type)) {
        respond({ ok: false, reason: 'protocol-incompatible' }); return false;
      }
      if (msg?.type === 'player-playback' && Number.isInteger(sender.tab?.id) && sender.frameId === 0 &&
          sender.url?.startsWith('https://music.youtube.com/')) {
        if (!['play', 'toggle', 'next', 'prev'].includes(msg.command)) { respond({ ok: false }); return false; }
        chrome.scripting.executeScript({ target: { tabId: sender.tab.id, frameIds: [0] }, world: 'MAIN',
          func: playerPlayback, args: [msg.command, msg.expiresAt] })
          .then(results => respond(results[0]?.result || { ok: false }))
          .catch(() => respond({ ok: false, reason: 'playback-unconfirmed' }));
        return true;
      }
      if (msg?.type === 'player-volume' && Number.isInteger(sender.tab?.id) && sender.frameId === 0 &&
          sender.url?.startsWith('https://music.youtube.com/')) {
        if (!['volume_delta', 'mute'].includes(msg.command) ||
            (msg.command === 'volume_delta' && !Number.isFinite(msg.amount))) {
          respond({ ok: false, error: 'Invalid volume command' });
          return false;
        }
        chrome.scripting.executeScript({
          target: { tabId: sender.tab.id, frameIds: [0] },
          world: 'MAIN',
          func: controlPlayerVolume,
          args: [msg.command, msg.command === 'volume_delta' ? msg.amount : 0],
        }).then(results => respond({ ok: results[0]?.result === true }))
          .catch(() => respond({ ok: false }));
        return true;
      }
      if (msg?.type === 'pair' && !sender.tab) {
        (async () => {
          if (!/^\d{6}$/.test(msg.pin)) throw new Error((chrome.i18n?.getMessage?.('invalid') || 'Enter a six-digit PIN.'));
          const result = await post('/pair', { pin: msg.pin });
          await chrome.storage.local.set({ bridgeToken: result.token });
          void browserChannel.start();
          return { ok: true, compatibility: client.compatibility };
        })().then(respond).catch(e => respond(failure(e)));
        return true;
      }
      if (msg?.type === 'check' && !sender.tab) {
        (async () => {
          const token = await pairedToken();
          if (!token) {
            await post('/status', { token: '' }).catch(() => {});
            return { ok: false, error: (chrome.i18n?.getMessage?.('notPaired') || 'Not paired yet.') };
          }
          let result;
          try { result = await post('/status', { token }); }
          catch (error) {
            if (error.httpStatus === 401) throw new Error(chrome.i18n?.getMessage?.('notPaired') ||
              'Pair again with a new PIN from the Stream Deck action settings.');
            throw error;
          }
          void browserChannel.start();
          return { ok: true, ...result, compatibility: client.compatibility };
        })().then(respond).catch(e => respond(failure(e)));
        return true;
      }
      if (msg?.type === 'get-port' && !sender.tab) {
        configuredPort().then(port => respond({ ok: true, port }));
        return true;
      }
      if (msg?.type === 'set-port' && !sender.tab) {
        (async () => {
          const port = Number(msg.port);
          if (!validPort(port)) throw new Error(chrome.i18n?.getMessage?.('portInvalid') || 'Port must be an integer from 1024 to 65535.');
          const token = await pairedToken();
          if (!token) {
            await setLocalPort(port);
            return { ok: true, port, localOnly: true };
          }
          try {
            // When the original server is reachable, change its listener AND this client together.
            const result = await post('/configure-port', { token, port }, 6000);
            await setLocalPort(result.port);
            return { ok: true, port: result.port, localOnly: false };
          } catch (error) {
            // A server rejected an occupied/invalid port: do not modify client settings.
            if (error.httpStatus) throw error;
            // Bridge may already have moved in the Stream Deck inspector while Chrome slept.
            // Try the new address, retaining it even if the bridge isn't reachable yet.
            await setLocalPort(port);
            try {
              await post('/status', { token }, 1500);
              return { ok: true, port, localOnly: false };
            } catch {
              return { ok: true, port, localOnly: true };
            }
          }
        })().then(respond).catch(e => respond(failure(e)));
        return true;
      }
      if (msg?.type === 'unpair' && !sender.tab) {
        (async () => {
          const token = await pairedToken();
          if (token) {
            try { await post('/unpair', { token }); }
            catch (error) {
              // An invalid token is already revoked; network/server failures must be retried.
              if (error.httpStatus !== 401) throw new Error(chrome.i18n?.getMessage?.('unpairFailed') ||
                'Could not unpair. Start Stream Deck, check the port and try again.');
            }
          }
          await chrome.storage.local.remove('bridgeToken');
          client.clearCompatibility();
          return { ok: true };
        })().then(respond).catch(e => respond(failure(e)));
        return true;
      }
      if ((msg?.type === 'sync' || msg?.type === 'listen') && sender.tab &&
          sender.url?.startsWith('https://music.youtube.com/')) {
        (async () => {
          const token = await pairedToken();
          if (!token) return { paired: false, commands: [] };
          if (client.blocked()) return { paired: true, commands: [], idle: true };
          // The modern browser channel carries every input. Keeping a separate
          // long poll per tab can exhaust Chrome's per-origin HTTP/1 connection
          // pool and starve status checks/results, including after a tab closes.
          // A 404 from older plugins enables the legacy tab channel instead.
          if (msg.type === 'listen' && browserChannel.available !== false) {
            return { paired: true, commands: [], idle: true };
          }
          let state = msg.state;
          if (msg.type === 'sync' && sender.frameId === 0) {
            try {
              const observed = await chrome.scripting.executeScript({ target: { tabId: sender.tab.id, frameIds: [0] },
                world: 'MAIN', func: playerPlayback, args: ['state'] });
              if (observed[0]?.result) state = { ...state, ...observed[0].result };
            } catch { /* Keep the DOM snapshot if the page is navigating. */ }
          }
          if (removedTabs.has(sender.tab.id)) return { paired: true, commands: [] };
          const request = msg.type === 'sync' ? post('/sync', { token, clientId: sender.tab.id, state }) :
            post('/listen', { token, clientId: sender.tab.id }, 15500);
          if (msg.type === 'sync') synchronizations.set(sender.tab.id, request);
          let result;
          try { result = await request; }
          finally { if (synchronizations.get(sender.tab.id) === request) synchronizations.delete(sender.tab.id); }
          void browserChannel.start();
          return { paired: true, commands: result.commands || [], idle: result.idle === true };
        })().then(respond).catch(() => respond({ paired: false, commands: [] }));
        return true;
      }
      respond({ ok: false, error: 'Forbidden message' });
      return false;
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
    return { onMessage, onRemoved };
  }
  root.MusicDeckMessageRouter = Object.freeze({ create: createMessageRouter });
})(globalThis);
