'use strict';
(function (root) {
  function createBrowserChannel({ chrome, client }) {
    const { post, pairedToken } = client;
    const MUSIC_URL = 'https://music.youtube.com/';
    let browserListening = false;
    let browserRetryTimer = null;
    let browserChannelAvailable = null;
    const PLAYER_COMMANDS = ['toggle', 'prev', 'next', 'mute', 'volume_delta', 'like', 'dislike'];
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    async function performBrowserCommand(command, stillPaired = async () => true, diagnostic = {}) {
      const failed = reason => { diagnostic.reason = reason; return false; };
      if (!['open', ...PLAYER_COMMANDS].includes(command?.type)) return false;
      const deadline = Math.min(Number(command.expiresAt) || Date.now() + 30000, Date.now() + 30000);
      const allowed = async (confirm = false) => !client.blocked() && Date.now() < deadline && await stillPaired(confirm) && !client.blocked() && Date.now() < deadline;
      const denied = () => failed(client.blocked() ? 'protocol-incompatible' : diagnostic.reason === 'bridge-unavailable' ? 'bridge-unavailable' :
        Date.now() >= deadline ? 'command-timeout' : 'authorization-lost');
      if (!await allowed()) return denied();
      const query = () => chrome.tabs.query({ url: MUSIC_URL + '*' });
      const select = tabs => tabs.find(tab => tab.id === command.preferredTabId) || tabs.find(tab => tab.active) || tabs[0];
      let tab = select(await query());
      let opened = command.nativeLaunched === true;
      if (!tab) {
        if (!await allowed(true)) return denied();
        tab = await chrome.tabs.create({ url: MUSIC_URL, active: true });
        opened = true;
      }
      const resuming = tab.discarded || tab.frozen || tab.status === 'loading';
      if (command.type === 'open' || resuming) {
        if (!await allowed(true)) return denied();
        await chrome.tabs.update(tab.id, { active: true });
        if (Number.isInteger(tab.windowId)) await chrome.windows.update(tab.windowId, { focused: true });
        if (command.type === 'open') return true;
      }
      while (await allowed()) {
        // Injection can fail harmlessly while a tab is loading. Do not retry an
        // ambiguously delivered input. Missing receivers and explicit not-ready
        // replies are safe to retry because neither has performed the input.
        try {
          await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] },
            files: ['content.js'], world: 'ISOLATED' });
        } catch { diagnostic.reason = 'injection-unavailable'; await wait(200); continue; }
        if (!await allowed(true)) return denied();
        let result;
        try {
          const trackKey = !opened && !resuming ? command.trackKey : undefined;
          result = await chrome.tabs.sendMessage(tab.id, { type: 'bridge-command', id: command.id,
            expiresAt: deadline, command: {
              type: command.type === 'toggle' && opened ? 'play' : command.type,
              amount: command.amount, trackKey, allowCurrentTrack: !trackKey,
            } }, { frameId: 0 });
        } catch (error) {
          // A new tab can navigate between injection and messaging. Chrome's
          // missing-receiver error guarantees that this input was not delivered.
          // A closed/lost reply after delivery remains ambiguous and is not retried.
          if (String(error?.message).includes('Receiving end does not exist')) {
            diagnostic.reason = 'receiver-unavailable';
            await wait(200);
            continue;
          }
          return failed('delivery-uncertain');
        }
        if (result?.ok) return true;
        if (result?.retry !== true) return failed(result?.reason || 'player-rejected');
        diagnostic.reason = 'player-not-ready';
        await wait(200);
      }
      return failed(diagnostic.reason || 'command-timeout');
    }
    async function startBrowserListener() {
      if (browserListening || !chrome.tabs?.query) return;
      if (browserRetryTimer) clearTimeout(browserRetryTimer);
      browserRetryTimer = null;
      browserListening = true;
      let listeningToken;
      let retry = false;
      let retryDelay = 1000;
      try {
        while (true) {
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
            result = await post('/browser-listen', { token, clientIds: tabs.map(tab => tab.id) }, 15500);
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
            let ok = false;
            const diagnostic = {};
            try {
              ok = await performBrowserCommand(command, async confirm => {
                if (await pairedToken() !== token) return false;
                // A different extension/profile may have replaced this pairing while
                // the page was loading; local storage alone cannot detect that.
                if (confirm) {
                  try { await post('/status', { token }); }
                  catch (error) {
                    diagnostic.reason = error.httpStatus === 401 ? 'authorization-lost' : 'bridge-unavailable';
                    return false;
                  }
                }
                return await pairedToken() === token;
              }, diagnostic);
            } catch { diagnostic.reason = 'browser-api-failed'; }
            await post('/browser-result', { token, id: command.id, ok, ...(!ok ? { reason: diagnostic.reason } : {}) });
          }
        }
      } catch (error) {
        // Host restart/temporary network failure must not leave a running browser
        // disconnected until the next one-minute maintenance alarm.
        retry = Boolean(error.compatibility) || !error.httpStatus || error.httpStatus >= 500;
        if (error.compatibility) retryDelay = 5000;
      }
      finally {
        browserListening = false;
        const token = await pairedToken().catch(() => '');
        if (token && token !== listeningToken) void startBrowserListener();
        else if (token && retry) browserRetryTimer = setTimeout(() => { void startBrowserListener(); }, retryDelay);
      }
    }

    return { start: startBrowserListener, perform: performBrowserCommand,
      get available() { return browserChannelAvailable; } };
  }
  root.MusicDeckBrowserChannel = Object.freeze({ create: createBrowserChannel });
})(globalThis);
