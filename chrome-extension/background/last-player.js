'use strict';
(function (root) {
  const STORAGE_KEY = 'lastTrack';
  const LIVE_MS = 90000;
  const { normalizeTrackIdentity, trackKey } = root.MusicDeckTrackIdentity;
  const { acceptForeground, choosePlayer } = root.MusicDeckPlayerPriority;
  function normalize(state) {
    const identity = normalizeTrackIdentity(state);
    if (!identity.title) return null;
    const source = state.coverKey || state.cover;
    const coverKey = typeof source === 'string' && source.length <= 4096 ? root.MusicDeckArtworkPolicy.parse(source)?.href || '' : '';
    return { key: trackKey(identity), ...identity, coverKey,
      volume: Number.isFinite(state.volume) ? Math.max(0, Math.min(100, Math.round(state.volume))) : null,
      muted: state.muted === true, rating: ['LIKE', 'DISLIKE', 'INDIFFERENT'].includes(state.rating) ? state.rating : null,
      repeatMode: ['NONE', 'ALL', 'ONE'].includes(state.repeatMode) ? state.repeatMode : null,
      shuffleEnabled: typeof state.shuffleEnabled === 'boolean' ? state.shuffleEnabled : null };
  }

  function createObservations(now) {
    const players = new Map();
    let foreground, selectedId;
    function observe(id, state, provisional, focus) {
      if (!Number.isInteger(id)) return;
      foreground = acceptForeground(foreground, focus);
      const record = normalize(state);
      const entry = players.get(id);
      const previous = entry?.record;
      if (!record || !(state.trackConfirmed || (state.playbackConfirmed ?? state.playing) || previous?.key === record.key)) {
        players.delete(id);
        return;
      }
      const seen = now();
      if (provisional && entry && previous.key === record.key) {
        entry.seen = seen;
      } else {
        if (previous?.key === record.key) {
          for (const field of ['rating', 'repeatMode', 'shuffleEnabled', 'volume', 'coverKey']) {
            if (record[field] == null || record[field] === '') record[field] = previous[field];
          }
        }
        players.set(id, { record, seen, standalone: state.standalone === true, playing: state.playing === true });
      }
      for (const [tabId, player] of players) if (seen - player.seen >= LIVE_MS) players.delete(tabId);
      const selected = choosePlayer(players, foreground?.tabId, selectedId);
      selectedId = selected?.[0];
      return selected?.[1].record;
    }
    return { observe, remove: id => players.delete(id), clear() {
      players.clear(); foreground = selectedId = undefined;
    } };
  }

  function create({ storage, ready, now = Date.now }) {
    const observations = createObservations(now);
    let latest, written, reading, writing, clearing;
    async function get() {
      if (latest !== undefined) return latest;
      reading ??= ready.then(() => storage.get(STORAGE_KEY)).then(data => {
        if (latest === undefined) latest = written = normalize(data[STORAGE_KEY]);
        return latest;
      }).catch(() => latest || null).finally(() => { reading = null; });
      return reading;
    }
    function persist() {
      if (clearing) return clearing.then(persist);
      if (writing || latest === written) return writing;
      writing = ready.then(async () => {
        while (!clearing && latest !== written) {
          const record = latest;
          if (record) await storage.set({ [STORAGE_KEY]: record });
          else await storage.remove(STORAGE_KEY);
          written = record;
        }
      }).then(() => {
        writing = null;
        if (!clearing && latest !== written) return persist();
      }, error => {
        writing = null;
        throw error;
      });
      return writing;
    }
    function observe(tab, state, provisional = false, foreground) {
      const selected = observations.observe(tab.id, state, provisional, foreground);
      if (!selected) return;
      if (JSON.stringify(selected) !== JSON.stringify(latest)) latest = selected;
      return persist()?.catch(() => { /* A subsequent observation can retry the write. */ });
    }
    function clear() {
      observations.clear();
      latest = null;
      // Block new writes until deletion finishes and report a failure to Unpair.
      clearing ??= Promise.resolve(writing).catch(() => {}).then(async () => {
        await ready;
        await storage.remove(STORAGE_KEY);
        written = null;
      }).finally(() => { clearing = null; });
      return clearing;
    }
    return { get, observe, remove: observations.remove, clear };
  }
  root.MusicDeckLastPlayer = Object.freeze({ create, normalize });
})(globalThis);
