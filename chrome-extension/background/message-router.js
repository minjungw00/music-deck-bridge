'use strict';
(function (root) {
  function createMessageRouter({ chrome, client, pageControls, management, players, localPlayer }) {
    const { playerPlayback, controlPlayerVolume } = pageControls;
    const managementMethods = Object.freeze({ __proto__: null, pair: 'pair', check: 'check',
      'get-port': 'getPort', 'set-port': 'setPort', unpair: 'unpair', control: 'control', artwork: 'artwork' });
    function runPlayback(tabId, args, respond) {
      const phase = args[0] === 'result' ? 'result' : 'dispatch';
      const failed = source => ({ ok: false, reason: 'playback-unconfirmed', diagnostic: { phase, source } });
      chrome.scripting.executeScript({ target: { tabId, frameIds: [0] }, world: 'MAIN', func: playerPlayback, args })
        .then(results => respond(results[0]?.result || failed('missing-result')),
          () => respond(failed('script-execution')));
      return true;
    }
    function onMessage(msg, sender, respond) {
      const tabId = sender.tab?.id;
      const musicTab = sender.tab && sender.url?.startsWith('https://music.youtube.com/');
      const mainFrame = musicTab && Number.isInteger(tabId) && sender.frameId === 0;
      if (client.blocked() && !localPlayer?.controlling(tabId) && ['player-playback', 'player-playback-result', 'player-volume'].includes(msg?.type)) {
        respond({ ok: false, reason: 'protocol-incompatible' }); return false;
      }
      if (msg?.type === 'player-playback' && mainFrame) {
        if (!['play', 'toggle', 'next', 'prev', 'repeat', 'shuffle'].includes(msg.command)) { respond({ ok: false }); return false; }
        const args = [msg.command, msg.expiresAt, msg.dispatchOnly === true];
        if (msg.queueStartup === true) args.push(true);
        return runPlayback(tabId, args, respond);
      }
      if (msg?.type === 'player-playback-result' && mainFrame && Number.isSafeInteger(msg.pending) && msg.pending > 0) {
        return runPlayback(tabId, ['result', msg.pending], respond);
      }
      if (msg?.type === 'player-volume' && mainFrame) {
        if (!['volume_delta', 'volume_set', 'mute'].includes(msg.command) ||
            (msg.command !== 'mute' && !Number.isFinite(msg.amount)) ||
            (msg.command === 'volume_set' && (!Number.isInteger(msg.amount) || msg.amount < 0 || msg.amount > 100))) {
          respond({ ok: false, error: 'Invalid volume command' });
          return false;
        }
        chrome.scripting.executeScript({
          target: { tabId, frameIds: [0] },
          world: 'MAIN',
          func: controlPlayerVolume,
          args: [msg.command, msg.command === 'mute' ? 0 : msg.amount],
        }).then(results => respond({ ok: results[0]?.result === true }))
          .catch(() => respond({ ok: false }));
        return true;
      }
      const managementMethod = managementMethods[msg?.type];
      if (localPlayer && !sender.tab && ['player-status', 'local-control', 'saved-control', 'open-player'].includes(msg?.type)) {
        const operation = msg.type === 'player-status' ? () => localPlayer.check() :
          msg.type === 'open-player' ? () => localPlayer.open() :
            msg.type === 'saved-control' ? () => localPlayer.savedControl(msg) : () => localPlayer.control(msg);
        Promise.resolve().then(operation).then(respond).catch(() => respond({ ok: false, reason: 'player-unavailable' }));
        return true;
      }
      if (managementMethod && !sender.tab) {
        Promise.resolve().then(() => management[managementMethod](msg)).then(respond).catch(error => respond(client.failure(error)));
        return true;
      }
      if (['sync', 'listen'].includes(msg?.type) && musicTab) {
        players.synchronize(msg.type, msg.state, sender).then(respond).catch(() => respond({ paired: false, commands: [] }));
        return true;
      }
      respond({ ok: false, error: 'Forbidden message' });
      return false;
    }

    return { onMessage, onRemoved: players.onRemoved };
  }
  root.MusicDeckMessageRouter = Object.freeze({ create: createMessageRouter });
})(globalThis);
