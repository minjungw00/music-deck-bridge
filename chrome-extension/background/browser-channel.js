'use strict';
(function (root) {
  const { isBrowserCommand, isQueueControl } = root.MusicDeckCommandPolicy;
  const { normalizeTrackId } = root.MusicDeckTrackIdentity;
  function createBrowserChannel({ chrome, client, contentScripts }) {
    const { post, pairedToken } = client;
    const MUSIC_URL = 'https://music.youtube.com/';
    let browserListening = false;
    let browserRetryTimer = null;
    let browserChannelAvailable = null;
    let lastFailure = null;
    const playbackTrace = [];
    const development = chrome.runtime.getManifest?.().version_name?.endsWith('-dev');
    const actions = ['play-button', 'play-api', 'pause-api', 'navigate-button'];
    const phases = ['prepare', 'subscribe', ...actions, 'confirm', 'dispatch', 'result'];
    const faultSources = ['observation', 'site-event', 'media', 'play-rejection', 'pause-rejection', 'exception',
      'missing-result', 'script-execution', 'result-transport'];
    const exceptions = ['Error', 'TypeError', 'ReferenceError', 'NotAllowedError', 'InvalidStateError',
      'SecurityError', 'AbortError', 'NotSupportedError', 'Other'];
    const traceReasons = new Set(['command-superseded', 'command-timeout', 'player-changed', 'player-not-ready',
      'playback-unconfirmed', 'autoplay-blocked', 'player-error']);
    function recordTrace(id, stage, fields = {}) {
      if (!id) return;
      const entry = Object.freeze({ id, stage, ...fields });
      playbackTrace.push(entry);
      if (playbackTrace.length > 48) playbackTrace.shift();
      console.info?.('Music Deck Bridge playback trace:', JSON.stringify(entry));
    }
    function recordFailure(type, result) {
      if (!['player-error', 'player-not-ready', 'playback-unconfirmed', 'autoplay-blocked', 'delivery-uncertain'].includes(result?.reason)) return;
      const data = result.diagnostic || {};
      // Retain only bounded enums/numbers/booleans, never page text, IDs,
      // exception messages, URLs, playback metadata or credentials.
      lastFailure = Object.freeze({ command: type, reason: result.reason,
        phase: phases.includes(data.phase) ? data.phase : null,
        source: faultSources.includes(data.source) ? data.source : null,
        errorPhase: phases.includes(data.errorPhase) ? data.errorPhase : null,
        code: Number.isInteger(data.code) && data.code >= 0 && data.code <= 999 ? data.code : null,
        exception: exceptions.includes(data.exception) ? data.exception : null,
        state: [-1, 0, 1, 2, 3, 5].includes(data.state) ? data.state : null,
        apiReady: typeof data.apiReady === 'boolean' ? data.apiReady : null,
        mediaReady: [0, 1, 2, 3, 4].includes(data.mediaReady) ? data.mediaReady : null,
        mediaPaused: typeof data.mediaPaused === 'boolean' ? data.mediaPaused : null,
        hasTrack: typeof data.hasTrack === 'boolean' ? data.hasTrack : null,
        playable: typeof data.playable === 'boolean' ? data.playable : null,
        inputState: [-1, 0, 1, 2, 3, 5].includes(data.inputState) ? data.inputState : null,
        inputApiReady: typeof data.inputApiReady === 'boolean' ? data.inputApiReady : null,
        inputMediaReady: [0, 1, 2, 3, 4].includes(data.inputMediaReady) ? data.inputMediaReady : null,
        inputMediaPaused: typeof data.inputMediaPaused === 'boolean' ? data.inputMediaPaused : null,
        inputHasTrack: typeof data.inputHasTrack === 'boolean' ? data.inputHasTrack : null,
        inputAction: actions.includes(data.inputAction) ? data.inputAction : null,
        inputApi: ['none', 'player-bar', 'movie-player'].includes(data.inputApi) ? data.inputApi : null,
        inputUserActive: typeof data.inputUserActive === 'boolean' ? data.inputUserActive : null,
        inputUserEverActive: typeof data.inputUserEverActive === 'boolean' ? data.inputUserEverActive : null,
        startupAttempts: Number.isInteger(data.startupAttempts) && data.startupAttempts >= 0 && data.startupAttempts <= 4
          ? data.startupAttempts : null });
      console.warn('Music Deck Bridge playback diagnostic:', JSON.stringify(lastFailure));
    }
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    async function performBrowserCommand(command, stillPaired = async () => true, diagnostic = {}, onAccepted = () => {}) {
      const failed = reason => { diagnostic.reason = reason; return false; };
      if (!isBrowserCommand(command?.type)) return false;
      const traceId = development && command.type === 'toggle' && /^[a-f0-9]{24}$/.test(command.id) ? command.id : null;
      recordTrace(traceId, 'extension-received');
      const queueStartup = isQueueControl(command.type) && command.queueStartup === true;
      const deadline = Math.min(Number(command.expiresAt) || Date.now() + 30000, Date.now() + 30000);
      const allowed = async (confirm = false) => !client.blocked() && Date.now() < deadline && await stillPaired(confirm) && !client.blocked() && Date.now() < deadline;
      const denied = () => failed(client.blocked() ? 'protocol-incompatible' : ['bridge-unavailable', 'player-changed'].includes(diagnostic.reason) ? diagnostic.reason :
        Date.now() >= deadline ? 'command-timeout' : 'authorization-lost');
      if (!await allowed()) return denied();
      const query = () => chrome.tabs.query({ url: MUSIC_URL + '*' });
      const select = tabs => tabs.find(tab => tab.id === command.preferredTabId) || tabs.find(tab => tab.active) || tabs[0];
      let tab = select(await query());
      if (command.playerKey && (!tab || tab.id !== command.preferredTabId)) return failed('player-changed');
      let opened = command.nativeLaunched === true;
      if (!tab) {
        if (!await allowed(true)) return denied();
        const videoId = command.type === 'open' ? normalizeTrackId(command.videoId) : '';
        const url = videoId ? `${MUSIC_URL}watch?v=${videoId}` : MUSIC_URL;
        tab = await chrome.tabs.create({ url, active: true });
        opened = true;
      }
      const resuming = tab.discarded || tab.frozen || tab.status === 'loading';
      if (command.type === 'open' || resuming) {
        if (!await allowed(true)) return denied();
        await chrome.tabs.update(tab.id, { active: true });
        if (Number.isInteger(tab.windowId)) await chrome.windows.update(tab.windowId, { focused: true });
        if (command.type === 'open') return true;
      }
      const type = command.type === 'toggle' && opened ? 'play' : command.type;
      while (await allowed()) {
        // Injection can fail harmlessly while a tab is loading. Do not retry an
        // ambiguously delivered input. Missing receivers and explicit not-ready
        // replies are safe to retry because neither has performed the input.
        try {
          await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [0] },
            files: contentScripts, world: 'ISOLATED' });
        } catch { diagnostic.reason = 'injection-unavailable'; await wait(200); continue; }
        if (!await allowed(true)) return denied();
        let result;
        let accepted = false;
        try {
          const trackKey = !opened && !resuming ? command.trackKey : undefined;
          result = await chrome.tabs.sendMessage(tab.id, { type: 'bridge-command', id: command.id,
            expiresAt: deadline, dispatchOnly: true, command: {
              type,
              amount: command.amount, trackKey, allowCurrentTrack: !trackKey,
              ...(command.playerKey ? { playerKey: command.playerKey } : {}),
              ...(queueStartup ? { queueStartup: true } : {}),
              ...(traceId ? { trace: true } : {}),
            } }, { frameId: 0 });
          if (result?.pending) {
            // Receipt starts an ordered MAIN-world dispatch operation. Keep its
            // final ACK separate so the listener can receive later controls.
            accepted = true;
            recordTrace(traceId, 'player-received', { type });
            onAccepted();
            result = await chrome.tabs.sendMessage(tab.id, { type: 'bridge-command-result',
              id: command.id, expiresAt: deadline }, { frameId: 0 });
          }
        } catch (error) {
          // A new tab can navigate between injection and messaging. Chrome's
          // missing-receiver error guarantees that this input was not delivered.
          // A closed/lost reply after delivery remains ambiguous and is not retried.
          if (!accepted && String(error?.message).includes('Receiving end does not exist')) {
            diagnostic.reason = 'receiver-unavailable';
            await wait(200);
            continue;
          }
          if (accepted) recordFailure(command.type, { reason: 'delivery-uncertain',
            diagnostic: { phase: 'result', source: 'result-transport' } });
          return failed('delivery-uncertain');
        }
        if (traceId) {
          const observation = result?.trace;
          const states = [-1, 0, 1, 2, 3, 5];
          recordTrace(traceId, 'player-result', { type, held: typeof observation?.held === 'boolean' ? observation.held : null,
            result: result?.ok ? 'ok' : result?.retry ? 'retry' : traceReasons.has(result?.reason) ? result.reason : 'failed',
            inputState: states.includes(observation?.inputState) ? observation.inputState : null,
            state: states.includes(observation?.state) ? observation.state : null,
            inputAction: actions.includes(observation?.inputAction) ? observation.inputAction : null });
        }
        if (result?.ok) return true;
        recordFailure(command.type, result);
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
                ok = await performBrowserCommand(command, async confirm => {
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

    return { start: startBrowserListener, perform: performBrowserCommand,
      get lastFailure() { return lastFailure; },
      get playbackTrace() { return playbackTrace.slice(); },
      get available() { return browserChannelAvailable; } };
  }
  root.MusicDeckBrowserChannel = Object.freeze({ create: createBrowserChannel });
})(globalThis);
