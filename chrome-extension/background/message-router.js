'use strict';
(function (root) {
  function createMessageRouter({ chrome, client, pageControls, management, players }) {
    const { playerPlayback, controlPlayerVolume } = pageControls;
    const managementMethods = Object.freeze({ __proto__: null, pair: 'pair', check: 'check',
      'get-port': 'getPort', 'set-port': 'setPort', unpair: 'unpair' });
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
      const managementMethod = managementMethods[msg?.type];
      if (managementMethod && !sender.tab) {
        Promise.resolve().then(() => management[managementMethod](msg)).then(respond).catch(error => respond(client.failure(error)));
        return true;
      }
      if (['sync', 'listen'].includes(msg?.type) && sender.tab &&
          sender.url?.startsWith('https://music.youtube.com/')) {
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
