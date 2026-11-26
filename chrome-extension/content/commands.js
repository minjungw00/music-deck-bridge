'use strict';
(function (root) {
  function createCommandExecutor({ chrome, document, metadata, isActive, scheduleSync }) {
    const { current, media, siteVolume, ratingButton } = metadata;
    const clean = value => String(value ?? '').replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, 180);
    const trackKey = state => /^[\w-]{11}$/.test(state.trackId) ? state.trackId :
      JSON.stringify([clean(state.title), clean(state.artist)]);
    let volumeCommands = Promise.resolve();
    async function command(message) {
      if (!message || typeof message.type !== 'string' || !isActive()) return { ok: false };
      const scopedTrack = message.playerKey ? current() : null;
      if (scopedTrack && trackKey(scopedTrack) !== message.playerKey) {
        scheduleSync(60);
        return { ok: false, reason: 'player-changed' };
      }
      const el = media();
      let result = { ok: false };
      switch (message.type) {
        case 'play':
        case 'toggle':
        case 'next':
        case 'prev':
        case 'repeat':
        case 'shuffle':
          result = await chrome.runtime.sendMessage({ type: 'player-playback', command: message.type,
            expiresAt: message.expiresAt, dispatchOnly: message.dispatchOnly === true });
          result = result || { ok: false, reason: 'playback-unconfirmed' };
          break;
        case 'playback-result':
          result = await chrome.runtime.sendMessage({ type: 'player-playback-result', pending: message.pending });
          result = result || { ok: false, reason: 'playback-unconfirmed' };
          break;
        case 'like':
        case 'dislike': {
          const state = scopedTrack || current();
          if (!state.title) { result = { ok: false, retry: true }; break; }
          if (message.trackKey ? message.trackKey !== trackKey(state) : !message.allowCurrentTrack) break;
          const button = ratingButton(message.type);
          if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true' ||
              button.closest?.('[disabled], [aria-disabled="true"]')) {
            result = { ok: false, retry: true }; break;
          }
          button.click(); result = { ok: true }; break;
        }
        case 'mute':
        case 'volume_set':
        case 'volume_delta': {
          if (message.type !== 'mute' && !Number.isFinite(message.amount)) break;
          if (!el) { result = { ok: false, retry: true }; break; }
          if (message.type !== 'mute' && siteVolume() === null) { result = { ok: false, retry: true }; break; }
          if (message.type === 'mute') {
            const button = document.querySelector('ytmusic-player-bar .volume, ytmusic-player-bar #expand-volume');
            if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') {
              result = { ok: false, retry: true }; break;
            }
          }
          const operation = volumeCommands.then(async () => {
            if (!isActive()) return { ok: false };
            const response = await chrome.runtime.sendMessage({
              type: 'player-volume', command: message.type, amount: message.amount,
            });
            return { ok: response?.ok === true };
          }).catch(() => ({ ok: false }));
          volumeCommands = operation;
          result = await operation;
          break;
        }
      }
      scheduleSync(60);
      return result;
    }
    return command;
  }
  root.MusicDeckContentCommands = Object.freeze({ create: createCommandExecutor });
})(globalThis);
