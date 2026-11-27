'use strict';
// Shared by the isolated content scripts, Chrome worker and Stream Deck bridge.
(function (root) {
  const normalizeTrackId = value => typeof value === 'string' && /^[\w-]{11}$/.test(value) ? value : '';
  const normalizeText = value => typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, 180) : '';
  function normalizeTrackIdentity(state) {
    return { title: normalizeText(state?.title), artist: normalizeText(state?.artist), trackId: normalizeTrackId(state?.trackId) };
  }
  // Snapshots are normalized at their boundary. Don't trim an already-clipped
  // title again: its last character can be a space used in existing wire keys.
  function trackKey({ title, artist, trackId }) {
    return trackId || JSON.stringify([title, artist]);
  }
  const api = Object.freeze({ normalizeTrackId, normalizeTrackIdentity, trackKey });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MusicDeckTrackIdentity = api;
})(globalThis);
