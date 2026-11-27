'use strict';
const { normalizeState, selectPlayer, LIVE_MS } = require('../domain/player-state.cjs');

function createPlayerRegistry({ onChange, onObserved = () => {}, now = Date.now }) {
  const candidates = new Map();
  let selectedSignature = '';
  const selected = () => selectPlayer(candidates, now());
  return {
    selected,
    sync(clientId, data) {
      const timestamp = now();
      candidates.set(clientId, normalizeState(data, timestamp));
      for (const [id, state] of candidates) if (timestamp - state.lastSeen > LIVE_MS * 2) candidates.delete(id);
      const chosen = selectPlayer(candidates, timestamp);
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
    reset() { candidates.clear(); selectedSignature = ''; onChange(); },
  };
}
module.exports = { createPlayerRegistry };
