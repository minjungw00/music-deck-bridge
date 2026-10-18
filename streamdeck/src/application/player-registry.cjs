'use strict';
const { normalizeState, selectPlayer, LIVE_MS } = require('../domain/player-state.cjs');

function createPlayerRegistry({ onChange, now = Date.now }) {
  const candidates = new Map();
  let selectedSignature = '';
  const selected = () => selectPlayer(candidates, now());
  return {
    selected,
    sync(clientId, data) {
      const state = normalizeState(data, now());
      candidates.set(clientId, state);
      for (const [id, s] of candidates) if (now() - s.lastSeen > LIVE_MS * 2) candidates.delete(id);
      const chosen = selected();
      const signature = JSON.stringify(chosen ? [chosen[0], chosen[1].title, chosen[1].artist,
        chosen[1].cover, chosen[1].coverFallback, chosen[1].playing, chosen[1].volume, chosen[1].muted, chosen[1].rating] : []);
      if (signature !== selectedSignature) { selectedSignature = signature; onChange(); }
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
