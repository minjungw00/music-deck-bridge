'use strict';
const { limit } = require('./values.cjs');
const { normalizeTrackIdentity, trackKey } = require('../../../chrome-extension/track-identity.js');
const { choosePlayer } = require('../../../chrome-extension/player-priority.js');
const LIVE_MS = 90000;
const PLAYER_STALE_MS = 35000;
function normalizePlayerControls(state) {
  return {
    rating: ['LIKE', 'DISLIKE', 'INDIFFERENT'].includes(state.rating) ? state.rating : null,
    repeatMode: ['NONE', 'ALL', 'ONE'].includes(state.repeatMode) ? state.repeatMode : null,
    shuffleEnabled: typeof state.shuffleEnabled === 'boolean' ? state.shuffleEnabled : null,
  };
}
function normalizePlaybackTime({ positionSeconds, durationSeconds }) {
  if (!Number.isFinite(positionSeconds) || positionSeconds < 0 || !Number.isFinite(durationSeconds) ||
      durationSeconds < 1 || !Number.isSafeInteger(Math.floor(durationSeconds))) return null;
  return { positionSeconds: Math.floor(Math.min(positionSeconds, durationSeconds)), durationSeconds: Math.floor(durationSeconds) };
}
function normalizeState(data, timestamp = Date.now()) {
  const s = data && typeof data === 'object' ? data : {};
  const volumeReported = Number.isFinite(s.volume);
  const identity = normalizeTrackIdentity({ title: String(s.title ?? ''), artist: String(s.artist ?? ''), trackId: s.trackId });
  return {
    ...identity,
    cover: typeof s.cover === 'string' ? s.cover.slice(0, 4096) : '',
    coverFallback: typeof s.coverFallback === 'string' ? s.coverFallback.slice(0, 4096) : '',
    playing: s.playing === true,
    playbackConfirmed: typeof s.playbackConfirmed === 'boolean' ? s.playbackConfirmed : s.playing === true,
    trackConfirmed: s.trackConfirmed === true,
    muted: s.muted === true,
    volume: volumeReported ? limit(Math.round(s.volume), 0, 100) : 0,
    volumeReported,
    standalone: s.standalone === true,
    ...normalizePlayerControls(s),
    ...normalizePlaybackTime(s),
    lastSeen: timestamp, lastMediaSyncAt: timestamp,
  };
}
function selectPlayer(candidates, now = Date.now(), foregroundId, previousId) {
  const eligible = [...candidates].filter(([, state]) => now - state.lastSeen < LIVE_MS);
  return choosePlayer(eligible, foregroundId, previousId);
}
module.exports = { normalizeState, normalizePlayerControls, normalizePlaybackTime, selectPlayer, trackKey, LIVE_MS, PLAYER_STALE_MS };
