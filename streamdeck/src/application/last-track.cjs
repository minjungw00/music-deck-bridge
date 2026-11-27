'use strict';
const { createHash } = require('node:crypto');
const { normalizeTrackIdentity, trackKey } = require('../../../chrome-extension/track-identity.js');
const { rasterSize } = require('../domain/raster-artwork.cjs');
const { normalizePlayerControls, normalizePlaybackTime } = require('../domain/player-state.cjs');
const PROGRESS_SAVE_MS = 10000;
const TRACK_FIELDS = ['title', 'artist', 'trackId', 'image', 'volume', 'muted', 'rating', 'repeatMode', 'shuffleEnabled', 'durationSeconds'];

function volumeFields({ volume, muted, volumeReported }) {
  if (volumeReported === false || !Number.isInteger(volume) || volume < 0 || volume > 100) return null;
  return { volume, muted: muted === true };
}

function controlFields(state, previous) {
  const fields = {};
  for (const [key, value] of Object.entries(normalizePlayerControls(state))) {
    const confirmed = value ?? previous?.[key];
    if (confirmed != null) fields[key] = confirmed;
  }
  return fields;
}

function sameTrackFields(a, b) {
  return a && b && TRACK_FIELDS.every(field => a[field] === b[field]);
}

function createLastTrack({ storage, onChange, onError = () => {}, now = Date.now }) {
  const pairScope = () => {
    const auth = storage.readAuth();
    return auth ? createHash('sha256').update(auth.token).digest('hex') : '';
  };
  const saved = storage.readLastTrack();
  let scope = pairScope();
  const persisted = scope && scope === saved?.scope ? saved.track : null;
  const identity = normalizeTrackIdentity(persisted);
  let snapshot = identity.title ? {
    ...identity,
    image: rasterSize(persisted.image) ? persisted.image : '',
    ...volumeFields(persisted),
    ...controlFields(persisted),
    ...normalizePlaybackTime(persisted),
  } : null;
  let confirmedKey = snapshot ? trackKey(snapshot) : '';
  let coverSource = '';
  let savedSnapshot = snapshot;
  let lastSavedAt = now();
  function save(record) {
    try { storage.saveLastTrack(record); return true; }
    catch { onError(); return false; }
  }
  function flush() {
    if (snapshot !== savedSnapshot && save({ scope, track: snapshot })) {
      savedSnapshot = snapshot;
      lastSavedAt = now();
    }
  }
  function update(track, paused = false) {
    if (!sameTrackFields(snapshot, track) || snapshot.positionSeconds !== track.positionSeconds) {
      snapshot = track;
      onChange();
    }
    // Progress alone can change every second. Avoid rewriting the cached artwork at that rate.
    if (paused || !sameTrackFields(savedSnapshot, snapshot) || now() - lastSavedAt >= PROGRESS_SAVE_MS) flush();
  }
  return {
    observe(state, image = '') {
      if (!scope || !state?.title) return;
      const key = trackKey(state);
      const sameTrack = key === confirmedKey;
      if (!state.trackConfirmed && !(state.playbackConfirmed ?? state.playing) && !sameTrack) return;
      const previous = sameTrack ? snapshot : null;
      const cached = previous?.image || '';
      const volume = volumeFields(state) ?? (previous && volumeFields(previous));
      const time = normalizePlaybackTime(state) ?? (previous && normalizePlaybackTime(previous));
      coverSource = state.cover || (sameTrack ? coverSource : '');
      confirmedKey = key;
      update({ title: state.title, artist: state.artist, trackId: state.trackId,
        image: image && (image === cached || rasterSize(image)) ? image : cached,
        ...volume, ...controlFields(state, previous), ...time }, !state.playing);
    },
    observeArtwork(source, image) {
      if (snapshot && source && source === coverSource && image !== snapshot.image && rasterSize(image)) {
        update({ ...snapshot, image });
      }
    },
    get snapshot() { return snapshot; },
    get hasPending() { return snapshot !== savedSnapshot; },
    flush,
    resetPair() {
      scope = pairScope();
      snapshot = savedSnapshot = null;
      confirmedKey = coverSource = '';
      save(null);
      onChange();
    },
  };
}

module.exports = { createLastTrack };
