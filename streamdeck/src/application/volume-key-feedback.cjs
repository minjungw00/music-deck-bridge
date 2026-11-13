'use strict';
const { PLAYER_STALE_MS } = require('../domain/player-state.cjs');
const { volumeFeedbackDuration } = require('../domain/volume-feedback.cjs');

// Per-key transient state. Input handling owns command delivery; the renderer
// consumes confirmed frames and schedules the returned next expiry.
function createVolumeKeyFeedback() {
  let request = null, pending = null, display = null;
  const enabled = settings => settings?.volumeShowValue !== false && volumeFeedbackDuration(settings) > 0;
  function configure(settings) {
    if (!enabled(settings)) { pending = null; display = null; }
  }
  function begin(selected, settings) {
    request = { playerId: selected ? String(selected[0]) : null, before: selected?.[1],
      confirmed: false, expiresAt: Infinity };
    if (enabled(settings)) pending = request;
    return request;
  }
  function complete(token, ok, now) {
    if (request !== token) return false;
    request = null;
    if (ok === true) {
      if (pending === token) { pending.confirmed = true; pending.expiresAt = now + 5000; }
    } else { pending = null; display = null; }
    return true;
  }
  function frame(selected, settings, now) {
    configure(settings);
    const state = selected?.[1], playerId = selected ? String(selected[0]) : null;
    const valid = state && Number.isInteger(state.volume) && state.volume >= 0 && state.volume <= 100 &&
      now - state.lastMediaSyncAt < PLAYER_STALE_MS;
    if (pending && (now >= pending.expiresAt || (pending.playerId !== null && pending.playerId !== playerId))) pending = null;
    // An ACK and a new snapshot can arrive in either order; neither alone
    // establishes the resulting volume, including an unchanged 0/100 boundary.
    if (pending?.confirmed && valid && state !== pending.before) {
      display = { playerId, startedAt: now };
      pending = null;
    }
    const until = display ? display.startedAt + volumeFeedbackDuration(settings) : Infinity;
    if (display && (!valid || display.playerId !== playerId || now >= until)) display = null;
    return { volume: display ? state.volume : null,
      expiresAt: Math.min(pending?.expiresAt ?? Infinity, display ? until : Infinity) };
  }
  return { begin, complete, configure, frame, awaitingSnapshot: () => pending?.confirmed === true };
}
module.exports = { createVolumeKeyFeedback };
