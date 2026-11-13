'use strict';
(function (root) {
  function createLocalPlayer({ chrome, pageControls, contentScripts }) {
    const leases = new Map();
    const native = MusicDeckBrowserChannel.create({ chrome, client: { blocked: () => false }, contentScripts });
    let sequence = 0;
    const clean = value => String(value || '').replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, 180);
    const cover = source => root.MusicDeckArtworkPolicy.parse(source)?.href || '';
    async function snapshot(tab) {
      if (!Number.isInteger(tab.id) || tab.discarded || tab.frozen) return null;
      const target = { tabId: tab.id, frameIds: [0] };
      const read = () => chrome.scripting.executeScript({ target, world: 'ISOLATED', func: () =>
        globalThis.MusicDeckContentMetadata?.create({ document, window, location, navigator }).current() || null });
      let data = (await read())[0]?.result;
      if (!data) {
        await chrome.scripting.executeScript({ target, world: 'ISOLATED', files: ['artwork-policy.js', 'content/metadata.js'] });
        data = (await read())[0]?.result;
      }
      if (!data?.title) return null;
      const observed = await chrome.scripting.executeScript({ target, world: 'MAIN',
        func: pageControls.playerPlayback, args: ['state'] });
      const state = { ...data, ...observed[0]?.result };
      const title = clean(state.title), artist = clean(state.artist);
      const trackId = /^[\w-]{11}$/.test(state.trackId || '') ? state.trackId : '';
      return { id: String(tab.id), key: trackId || JSON.stringify([title, artist]), title, artist,
        playing: state.playing === true, muted: state.muted === true,
        volume: Number.isFinite(state.volume) ? Math.max(0, Math.min(100, Math.round(state.volume))) : null,
        rating: ['LIKE', 'DISLIKE', 'INDIFFERENT'].includes(state.rating) ? state.rating : null,
        coverKey: cover(state.cover), standalone: state.standalone === true, activeTab: tab.active === true };
    }
    async function check() {
      if (!chrome.tabs?.query || !chrome.scripting?.executeScript) return { ok: true, active: false, mode: 'local' };
      const tabs = await chrome.tabs.query({ url: 'https://music.youtube.com/*' });
      const results = await Promise.allSettled(tabs.map(tab => snapshot(tab)));
      const players = results.filter(result => result.status === 'fulfilled' && result.value).map(result => result.value);
      players.sort((a, b) => Number(b.standalone) - Number(a.standalone) || Number(b.playing) - Number(a.playing) ||
        Number(b.activeTab) - Number(a.activeTab));
      const player = players[0] || null;
      return { ok: true, active: !!player, mode: 'local', popupControls: true, popupVolume: true,
        player, standalone: player?.standalone === true, coverStatus: player?.coverKey ? 'ready' : 'missing' };
    }
    async function control({ command, amount, playerId, trackKey }) {
      if (!['toggle', 'prev', 'next', 'like', 'dislike', 'mute', 'volume_set'].includes(command) ||
          (command === 'volume_set' && (!Number.isInteger(amount) || amount < 0 || amount > 100))) {
        return { ok: false, reason: 'invalid-command' };
      }
      const matches = result => result.player?.id === String(playerId) && result.player?.key === trackKey;
      const selected = await check();
      if (!matches(selected)) return { ok: false, reason: 'player-changed' };
      if (['like', 'dislike'].includes(command) && selected.player.rating === null) return { ok: false, reason: 'player-not-ready' };
      const tabId = Number(playerId);
      leases.set(tabId, (leases.get(tabId) || 0) + 1);
      const diagnostic = {};
      try {
        // No listener, token, HTTP request or extra server is used for local controls.
        // Reuse the exact same bounded dispatch/confirmation engine as bridge inputs.
        const ok = await native.perform({ id: `popup-local-${Date.now()}-${++sequence}`, type: command,
          amount, preferredTabId: tabId, playerKey: trackKey,
          ...(['like', 'dislike'].includes(command) ? { trackKey } : {}), expiresAt: Date.now() + 30000 },
        async () => {
          if (matches(await check())) return true;
          diagnostic.reason = 'player-changed'; return false;
        }, diagnostic);
        return { ok, ...(!ok ? { reason: diagnostic.reason || 'command-failed' } : {}) };
      } finally {
        const remaining = leases.get(tabId) - 1;
        if (remaining) leases.set(tabId, remaining); else leases.delete(tabId);
      }
    }
    return { check, control, controlling: tabId => leases.has(tabId) };
  }
  root.MusicDeckLocalPlayer = Object.freeze({ create: createLocalPlayer });
})(globalThis);
