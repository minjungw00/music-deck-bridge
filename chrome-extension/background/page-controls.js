'use strict';
(function (root) {
  // Runs in MAIN: a restored title/button can precede the actual player and queue.
  // Read only playback state; never return the site's response or account data.
  async function playerPlayback(type, expiresAt) {
    const read = () => {
      const bar = document.querySelector('ytmusic-player-bar');
      const candidates = [bar?.playerApi, document.querySelector('#movie_player')];
      const api = candidates.find(item => typeof item?.getPlayerState === 'function');
      const all = [...document.querySelectorAll('video, audio')];
      const media = all.find(item => item.readyState > 0 && !item.paused) ||
        all.find(item => item.readyState > 0 && Number.isFinite(item.duration)) || all[0];
      let state, videoId = '', ready = false, muted, time;
      try {
        state = api?.getPlayerState();
        videoId = api?.getVideoData?.()?.video_id || '';
        muted = api?.isMuted?.();
        time = api?.getCurrentTime?.();
        ready = api ? (typeof api.isReady !== 'function' || api.isReady()) &&
          Number.isFinite(state) && Boolean(videoId || media?.readyState > 0) : media?.readyState > 0;
        const status = api?.getPlayerResponse?.()?.playabilityStatus?.status;
        if (status && status !== 'OK') ready = false;
      } catch { ready = false; }
      const queue = bar?.queue;
      let index;
      try {
        if (typeof queue?.getItems === 'function' && !queue.getItems()?.length) ready = false;
        index = queue?.getCurrentItemIndex?.();
      } catch { ready = false; }
      const playing = Number.isFinite(state) ? state === 1 || state === 3 :
        Boolean(media && !media.paused && !media.ended);
      return { bar, api, media, ready, playing, state, index,
        muted: typeof muted === 'boolean' ? muted : Boolean(media?.muted),
        key: videoId || media?.currentSrc || media?.src || '',
        time: Number.isFinite(time) ? time : media?.currentTime || 0 };
    };
    const before = read();
    if (type === 'state') return { playing: before.playing, muted: before.muted };
    if (!['play', 'toggle', 'next', 'prev'].includes(type)) return { ok: false };
    if (!before.ready) return { ok: false, retry: true };
    if (Number.isFinite(expiresAt) && Date.now() >= expiresAt) return { ok: false, reason: 'command-timeout' };
    if (type === 'play' && before.playing) return { ok: true };
    const desiredPlaying = type === 'play' || !before.playing;
    const selector = ({ play: '.play-pause-button', toggle: '.play-pause-button',
      next: '.next-button', prev: '.previous-button' })[type];
    const button = document.querySelector('ytmusic-player-bar ' + selector);
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true' ||
        button.closest?.('[disabled], [aria-disabled="true"]')) return { ok: false, retry: true };
    let blocked = false, playerError = false;
    const onBlocked = () => { blocked = true; };
    const onError = () => { playerError = true; };
    before.api?.addEventListener?.('onAutoplayBlocked', onBlocked);
    before.api?.addEventListener?.('onError', onError);
    try {
      // Use the site's own control path only after its media/queue is initialized.
      button.click();
      const deadline = Math.min(Number(expiresAt) || Infinity, Date.now() + 10000);
      do {
        const after = read();
        if (blocked) return { ok: false, reason: 'autoplay-blocked' };
        if (playerError || after.media?.error) return { ok: false, reason: 'player-error' };
        if (type === 'play' || type === 'toggle') {
          const started = Number.isFinite(after.state) ? after.state === 1 :
            after.playing && after.media?.readyState >= 2;
          if (desiredPlaying ? started : !after.playing) return { ok: true };
        } else if ((before.key && after.key && before.key !== after.key) ||
            (Number.isInteger(before.index) && Number.isInteger(after.index) && before.index !== after.index) ||
            (type === 'prev' && before.time > 5 && after.time < 2)) return { ok: true };
        await new Promise(resolve => setTimeout(resolve, 80));
      } while (Date.now() < deadline);
      // A dispatched click with no observed result is ambiguous. Never retry it:
      // a delayed Next/Previous could otherwise skip more than one track.
      return { ok: false, reason: 'playback-unconfirmed' };
    } catch (error) {
      return { ok: false, reason: error?.name === 'NotAllowedError' ? 'autoplay-blocked' : 'player-error' };
    } finally {
      before.api?.removeEventListener?.('onAutoplayBlocked', onBlocked);
      before.api?.removeEventListener?.('onError', onError);
    }
  }

  // Runs in the page's MAIN world: Polymer slider properties belong to the site,
  // and are not visible through the content script's isolated DOM wrappers.
  function controlPlayerVolume(type, amount) {
    const bar = document.querySelector('ytmusic-player-bar');
    if (!bar) return false;
    if (type === 'mute') {
      const button = bar.querySelector('.volume, #expand-volume');
      if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return false;
      button.click();
      return true;
    }
    if (type !== 'volume_delta' || !Number.isFinite(amount)) return false;
    const sliders = [...bar.querySelectorAll('#volume-slider, #expand-volume-slider')];
    const slider = sliders.find(item => item.getClientRects().length) || sliders[0];
    if (!slider || slider.disabled) return false;
    const current = Number(slider.value);
    if (!Number.isFinite(current)) return false;
    const next = Math.max(0, Math.min(100, current + Math.max(-100, Math.min(100, amount))));
    // A slider's 5-point step would round away the dial's 1–4 point steps.
    for (const item of sliders) item.step = 1;
    slider.value = next;
    // Use the same handler as a mouse/keyboard change. The site owns its volume
    // curve, saved volume, mute state and both desktop/compact slider displays.
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  root.MusicDeckPageControls = Object.freeze({ playerPlayback, controlPlayerVolume });
})(globalThis);
