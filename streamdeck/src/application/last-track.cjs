'use strict';
const { createHash } = require('node:crypto');
const { rasterSize } = require('../domain/raster-artwork.cjs');
const { clip } = require('../domain/values.cjs');

function createLastTrack({ storage, onChange, onError = () => {} }) {
  const pairScope = () => {
    const auth = storage.readAuth();
    return auth ? createHash('sha256').update(auth.token).digest('hex') : '';
  };
  const saved = storage.readLastTrack();
  let scope = pairScope();
  const persisted = scope && scope === saved?.scope ? saved.track : null;
  let snapshot = persisted && typeof persisted.title === 'string' && clip(persisted.title, 180) ? {
    title: clip(persisted.title, 180), artist: typeof persisted.artist === 'string' ? clip(persisted.artist, 180) : '',
    trackId: typeof persisted.trackId === 'string' && /^[\w-]{11}$/.test(persisted.trackId) ? persisted.trackId : '',
    image: rasterSize(persisted.image) ? persisted.image : '',
  } : null;
  const identity = track => track.trackId || JSON.stringify([track.title, track.artist]);
  let confirmedKey = snapshot ? identity(snapshot) : '';
  let coverSource = '';
  let savedSnapshot = snapshot;
  function save(record) {
    try { storage.saveLastTrack(record); return true; }
    catch { onError(); return false; }
  }
  function update(track) {
    if (!snapshot || snapshot.title !== track.title || snapshot.artist !== track.artist ||
        snapshot.trackId !== track.trackId || snapshot.image !== track.image) {
      snapshot = track;
      onChange();
    }
    if (snapshot !== savedSnapshot && save({ scope, track: snapshot })) savedSnapshot = snapshot;
  }
  return {
    observe(state, image = '') {
      if (!scope || !state?.title) return;
      const key = identity(state);
      const sameTrack = key === confirmedKey;
      if (!(state.playbackConfirmed ?? state.playing) && !sameTrack) return;
      const cached = sameTrack ? snapshot?.image || '' : '';
      coverSource = state.cover || (sameTrack ? coverSource : '');
      confirmedKey = key;
      update({ title: state.title, artist: state.artist, trackId: state.trackId,
        image: image && (image === cached || rasterSize(image)) ? image : cached });
    },
    observeArtwork(source, image) {
      if (snapshot && source && source === coverSource && image !== snapshot.image && rasterSize(image)) {
        update({ ...snapshot, image });
      }
    },
    get snapshot() { return snapshot; },
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
