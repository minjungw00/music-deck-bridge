'use strict';
(function (root) {
  const { isStandaloneCommand, isRatingCommand } = root.MusicDeckCommandPolicy;
  const { mergePlaybackObservation } = root.MusicDeckTrackIdentity;
  function createLocalPlayer({ chrome, pageControls, contentScripts, lastPlayer,
    now = Date.now, wait = ms => new Promise(resolve => setTimeout(resolve, ms)) }) {
    const leases = new Map();
    const native = MusicDeckBrowserChannel.create({ chrome, client: { blocked: () => false }, contentScripts });
    let sequence = 0;
    let opening = null, resuming = null;
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
      const state = mergePlaybackObservation(data, observed[0]?.result);
      if (!state) return null;
      const record = root.MusicDeckLastPlayer.normalize(state);
      return record && { ...record, id: String(tab.id), playing: state.playing === true,
        standalone: state.standalone === true, activeTab: tab.active === true };
    }
    async function check() {
      if (!chrome.tabs?.query || !chrome.scripting?.executeScript) return { ok: true, active: false, mode: 'local' };
      const tabs = await chrome.tabs.query({ url: 'https://music.youtube.com/*' });
      const results = await Promise.allSettled(tabs.map(tab => snapshot(tab)));
      const players = results.filter(result => result.status === 'fulfilled' && result.value).map(result => result.value);
      players.sort((a, b) => Number(b.standalone) - Number(a.standalone) || Number(b.playing) - Number(a.playing) ||
        Number(b.activeTab) - Number(a.activeTab));
      const player = players[0] || null;
      return { ok: true, active: !!player, mode: 'local', popupControls: true, popupVolume: true, popupQueueControls: true,
        player, savedPlayer: player ? null : await lastPlayer?.get(),
        standalone: player?.standalone === true, coverStatus: player?.coverKey ? 'ready' : 'missing' };
    }
    function open() {
      // Coalesce simultaneous clicks across popups; Open never dispatches playback.
      if (!opening) opening = (async () => {
        const selected = await check();
        const ok = await native.perform({ type: 'open',
          preferredTabId: selected.player ? Number(selected.player.id) : undefined });
        return { ok };
      })().finally(() => { opening = null; });
      return opening;
    }
    function unavailable(command, player) {
      if (isRatingCommand(command) && player.rating === null) return 'player-not-ready';
      if (command === 'repeat' && player.repeatMode === null) return 'repeat-unavailable';
      if (command === 'shuffle' && player.shuffleEnabled === null) return 'shuffle-unavailable';
      return '';
    }
    async function control({ command, amount, playerId, trackKey }, playFromSaved = false) {
      if (!isStandaloneCommand(command, amount)) return { ok: false, reason: 'invalid-command' };
      const matches = result => result.player?.id === String(playerId) && result.player?.key === trackKey;
      const selected = await check();
      if (!matches(selected)) return { ok: false, reason: 'player-changed' };
      const reason = unavailable(command, selected.player);
      if (reason) return { ok: false, reason };
      const tabId = Number(playerId);
      leases.set(tabId, (leases.get(tabId) || 0) + 1);
      const diagnostic = {};
      try {
        // No listener, token, HTTP request or extra server is used for local controls.
        // Reuse the exact same bounded dispatch/confirmation engine as bridge inputs.
        const ok = await native.perform({ id: `popup-local-${Date.now()}-${++sequence}`, type: command,
          amount, preferredTabId: tabId, playerKey: trackKey, nativeLaunched: playFromSaved && command === 'toggle',
          ...(isRatingCommand(command) ? { trackKey } : {}), expiresAt: Date.now() + 30000 },
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
    async function savedControl({ command, amount, trackKey }) {
      if (!isStandaloneCommand(command, amount)) return { ok: false, reason: 'invalid-command' };
      const saved = await lastPlayer?.get();
      if (!saved || saved.key !== trackKey) return { ok: false, reason: 'player-changed' };
      let { player } = await check();
      if (player && player.key !== trackKey) return { ok: false, reason: 'player-changed' };
      if (!player) {
        resuming ??= native.perform({ type: 'open', videoId: saved.trackId }).finally(() => { resuming = null; });
        if (!await resuming) return { ok: false, reason: 'player-unavailable' };
      }
      const deadline = now() + 10000;
      let reason = 'player-changed';
      while (now() < deadline) {
        if ((await lastPlayer.get())?.key !== trackKey) return { ok: false, reason: 'player-changed' };
        if (player?.key === trackKey) {
          reason = unavailable(command, player);
          if (!reason) return control({ command, amount, playerId: player.id, trackKey }, true);
        }
        await wait(150);
        ({ player } = await check());
      }
      return { ok: false, reason };
    }
    return { check, open, control, savedControl, controlling: tabId => leases.has(tabId) };
  }
  root.MusicDeckLocalPlayer = Object.freeze({ create: createLocalPlayer });
})(globalThis);
