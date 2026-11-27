'use strict';
(function (root) {
  const STORAGE_KEY = 'lastTrack';
  const LIVE_MS = 90000;
  const clean = value => typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, 180) : '';
  function normalize(state) {
    const title = clean(state?.title);
    if (!title) return null;
    const artist = clean(state.artist);
    const trackId = typeof state.trackId === 'string' && /^[\w-]{11}$/.test(state.trackId) ? state.trackId : '';
    const source = state.coverKey || state.cover;
    const coverKey = typeof source === 'string' && source.length <= 4096 ? root.MusicDeckArtworkPolicy.parse(source)?.href || '' : '';
    return { key: trackId || JSON.stringify([title, artist]), title, artist, trackId, coverKey,
      volume: Number.isFinite(state.volume) ? Math.max(0, Math.min(100, Math.round(state.volume))) : null,
      muted: state.muted === true, rating: ['LIKE', 'DISLIKE', 'INDIFFERENT'].includes(state.rating) ? state.rating : null,
      repeatMode: ['NONE', 'ALL', 'ONE'].includes(state.repeatMode) ? state.repeatMode : null,
      shuffleEnabled: typeof state.shuffleEnabled === 'boolean' ? state.shuffleEnabled : null };
  }
  function create({ storage, ready, now = Date.now }) {
    const players = new Map();
    let latest, written, reading, writing;
    async function get() {
      if (latest !== undefined) return latest;
      reading ??= ready.then(() => storage.get(STORAGE_KEY)).then(data => {
        if (latest === undefined) latest = written = normalize(data[STORAGE_KEY]);
        return latest;
      }).catch(() => latest || null);
      return reading;
    }
    function persist() {
      if (latest === written) return writing;
      let failed = false;
      writing ??= ready.then(async () => {
        while (latest !== written) {
          const record = latest;
          if (record) await storage.set({ [STORAGE_KEY]: record });
          else await storage.remove(STORAGE_KEY);
          written = record;
        }
      }).catch(() => { failed = true; }).finally(() => {
        writing = null;
        if (!failed && latest !== written) return persist();
      });
      return writing;
    }
    function observe(tab, state, provisional = false) {
      if (!Number.isInteger(tab.id)) return;
      const record = normalize(state);
      const previous = players.get(tab.id)?.record;
      if (provisional && previous?.key === record?.key) return;
      if (!record || !(state.trackConfirmed || (state.playbackConfirmed ?? state.playing) || previous?.key === record.key)) {
        players.delete(tab.id);
        return;
      }
      if (previous?.key === record.key) {
        for (const field of ['rating', 'repeatMode', 'shuffleEnabled', 'volume', 'coverKey']) {
          if (record[field] == null || record[field] === '') record[field] = previous[field];
        }
      }
      const seen = now();
      players.set(tab.id, { record, seen, standalone: state.standalone === true, playing: state.playing === true });
      for (const [id, player] of players) if (seen - player.seen >= LIVE_MS) players.delete(id);
      const selected = [...players.values()].sort((a, b) => Number(b.standalone) - Number(a.standalone) ||
        Number(b.playing) - Number(a.playing) || b.seen - a.seen)[0].record;
      if (JSON.stringify(selected) !== JSON.stringify(latest)) latest = selected;
      return persist();
    }
    return { get, observe, remove: id => players.delete(id), clear() { players.clear(); latest = null; return persist(); } };
  }
  root.MusicDeckLastPlayer = Object.freeze({ create, normalize });
})(globalThis);
