'use strict';
const { normalizeState, selectPlayer, LIVE_MS } = require('../domain/player-state.cjs');
const { acceptForeground } = require('../../../chrome-extension/player-priority.js');

function createPlayerRegistry({ onChange, onObserved = () => {}, now = Date.now }) {
  const candidates = new Map();
  let selectedSignature = '', foreground, selectedId;
  function selected(timestamp = now()) {
    const foregroundId = foreground?.tabId == null ? undefined : String(foreground.tabId);
    const chosen = selectPlayer(candidates, timestamp, foregroundId, selectedId);
    selectedId = chosen?.[0];
    return chosen;
  }
  return {
    selected,
    sync(clientId, data, focus) {
      const timestamp = now();
      foreground = acceptForeground(foreground, focus);
      candidates.set(clientId, normalizeState(data, timestamp));
      for (const [id, state] of candidates) if (timestamp - state.lastSeen > LIVE_MS * 2) candidates.delete(id);
      const chosen = selected(timestamp);
      const state = chosen?.[1];
      const signature = JSON.stringify(state ? [chosen[0], state.title, state.artist, state.trackId,
        state.cover, state.coverFallback, state.playing, state.volume, state.muted, state.rating, state.repeatMode,
        state.shuffleEnabled, state.positionSeconds, state.durationSeconds] : []);
      if (signature !== selectedSignature) { selectedSignature = signature; onChange(); }
      onObserved(chosen);
      return chosen && chosen[0] === clientId;
    },
    touch(clientId) {
      const present = candidates.get(clientId);
      if (!present) return false;
      present.lastSeen = now();
      return true;
    },
    remove(clientId) { candidates.delete(clientId); onChange(); },
    reconcile(clientIds) {
      const present = new Set(clientIds.map(String));
      for (const id of candidates.keys()) if (!present.has(id)) candidates.delete(id);
      onChange();
    },
    reset() { candidates.clear(); selectedSignature = ''; foreground = selectedId = undefined; onChange(); },
  };
}
module.exports = { createPlayerRegistry };
