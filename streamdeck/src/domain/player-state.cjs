'use strict';
const { clip, limit } = require('./values.cjs');
const LIVE_MS = 90000;
const PLAYER_STALE_MS = 35000;
function normalizeState(data, timestamp = Date.now()) {
  const s = data && typeof data === 'object' ? data : {};
  return {
    title: clip(s.title, 180), artist: clip(s.artist, 180),
    cover: typeof s.cover === 'string' ? s.cover.slice(0, 4096) : '',
    coverFallback: typeof s.coverFallback === 'string' ? s.coverFallback.slice(0, 4096) : '',
    playing: s.playing === true,
    muted: s.muted === true,
    volume: Number.isFinite(s.volume) ? limit(Math.round(s.volume), 0, 100) : 0,
    standalone: s.standalone === true,
    rating: ['LIKE', 'DISLIKE', 'INDIFFERENT'].includes(s.rating) ? s.rating : null,
    trackId: typeof s.trackId === 'string' && /^[\w-]{11}$/.test(s.trackId) ? s.trackId : '',
    lastSeen: timestamp, lastMediaSyncAt: timestamp,
  };
}
function selectPlayer(candidates, now = Date.now()) {
  const live = [...candidates.entries()].filter(([, s]) => now - s.lastSeen < LIVE_MS);
  if (!live.length) return null;
  // Installed PWA is always preferred; a playing player wins over paused ones.
  live.sort((a, b) => Number(b[1].standalone) - Number(a[1].standalone) ||
    Number(b[1].playing) - Number(a[1].playing) || b[1].lastSeen - a[1].lastSeen);
  return live[0];
}
module.exports = { normalizeState, selectPlayer, LIVE_MS, PLAYER_STALE_MS };
