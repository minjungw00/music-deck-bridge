'use strict';
(function (root) {
  // Runs in MAIN: a restored title/button can precede the actual player and queue.
  // Read only playback state; never return the site's response or account data.
  async function playerPlayback(type, expiresAt, dispatchOnly = false) {
    // Each injection shares this document's dispatch queue. Verification runs
    // separately, so a slow result cannot hold later controls behind it.
    const key = Symbol.for('music-deck-bridge.playback');
    const control = globalThis[key] ||= { sequence: 0, latest: 0, interrupt: 0,
      dispatch: Promise.resolve(), results: new Map() };
    if (type === 'result') {
      const result = control.results.get(expiresAt);
      if (!result) return { ok: false, reason: 'playback-unconfirmed' };
      try { return await result; }
      finally { control.results.delete(expiresAt); }
    }
    const read = () => {
      const bar = document.querySelector('ytmusic-player-bar');
      const api = [bar?.playerApi, document.querySelector('#movie_player')]
        .find(item => typeof item?.getPlayerState === 'function');
      const all = [...document.querySelectorAll('video, audio')];
      const media = all.find(item => item.readyState > 0 && !item.paused) ||
        all.find(item => item.readyState > 0 && Number.isFinite(item.duration)) || all[0];
      let state, videoId = '', ready = false, apiReady = false, playable = true, muted, time;
      try {
        state = api?.getPlayerState();
        videoId = api?.getVideoData?.()?.video_id || '';
        muted = api?.isMuted?.();
        time = api?.getCurrentTime?.();
        apiReady = Boolean(api && (typeof api.isReady !== 'function' || api.isReady()) && Number.isFinite(state));
        ready = api ? apiReady && Boolean(videoId || media?.readyState > 0) : media?.readyState > 0;
        const status = api?.getPlayerResponse?.()?.playabilityStatus?.status;
        if (status && status !== 'OK') { playable = false; ready = false; }
      } catch { ready = false; }
      let index;
      try {
        if (typeof bar?.queue?.getItems === 'function' && !bar.queue.getItems()?.length) ready = false;
        index = bar?.queue?.getCurrentItemIndex?.();
      } catch { ready = false; }
      const playing = Number.isFinite(state) ? state === 1 || state === 3 :
        Boolean(media && !media.paused && !media.ended);
      return { api, media, ready, apiReady, playable, playing, state, index,
        muted: typeof muted === 'boolean' ? muted : Boolean(media?.muted),
        key: videoId || media?.currentSrc || media?.src || '',
        time: Number.isFinite(time) ? time : media?.currentTime || 0 };
    };
    if (type === 'state') { const state = read(); return { playing: state.playing, muted: state.muted }; }
    if (!['play', 'toggle', 'next', 'prev'].includes(type)) return { ok: false };
    const sequence = ++control.sequence;
    // A new play/pause input can interrupt initialization that has not yet
    // dispatched navigation. Already dispatched navigation is never replayed.
    if (type === 'toggle' || type === 'play') control.interrupt = sequence;
    const navigation = type === 'next' || type === 'prev';
    const expires = Number(expiresAt) || Infinity;
    let deadline = Math.min(expires, Date.now() + (dispatchOnly ? 30000 : 10000));
    const failure = reason => ({ ok: false, reason });
    const superseded = () => control.latest > sequence || (navigation && control.interrupt > sequence);
    const started = state => Number.isFinite(state.state) ? state.state === 1 :
      state.playing && state.media?.readyState >= 2;
    const usable = button => button && !button.disabled && button.getAttribute('aria-disabled') !== 'true' &&
      !button.closest?.('[disabled], [aria-disabled="true"]');
    const playButton = () => document.querySelector('ytmusic-player-bar .play-pause-button');
    // A cued/restored player can expose a usable Play control before any media
    // or track ID is loaded. Starting it must not depend on that loaded media.
    const canStart = state => state.playable && usable(playButton()) &&
      (state.apiReady || state.state === -1 || state.state === 5 || (!state.api && state.media?.readyState === 0));
    const wait = () => new Promise(resolve => setTimeout(resolve, 80));
    let blocked = false, playerError = false, seeked = false, source, seekMedia;
    const onBlocked = () => { blocked = true; };
    const onError = () => { playerError = true; };
    const onSeeked = () => { seeked = true; };
    const requestPlay = async state => {
      if (!state.ready && canStart(state)) { playButton().click(); return true; }
      if (typeof state.api?.playVideo === 'function') {
        // Observe playback itself; a site's returned promise need not settle
        // when media starts, and must not hold the dispatch queue indefinitely.
        state.api.playVideo()?.catch?.(error => {
          if (error?.name === 'NotAllowedError') blocked = true;
          else playerError = true;
        });
        return true;
      }
      const button = playButton();
      if (!usable(button)) return false;
      button.click(); return true;
    };
    const error = state => superseded() ? 'command-superseded' : blocked ? 'autoplay-blocked' :
      playerError || state.media?.error ? 'player-error' : null;
    const dispatch = control.dispatch.then(async () => {
      let before = read();
      if (error(before)) return { result: failure(error(before)) };
      if (Date.now() >= deadline) return { result: failure('command-timeout') };
      if (!before.ready && !dispatchOnly && !canStart(before)) return { result: { ok: false, retry: true } };
      // Only initialization occupies the dispatch queue, never outcome polling.
      // A later play/pause input cancels this wait on its next bounded tick.
      let primed = false;
      while (!before.ready || (navigation && !started(before))) {
        if (error(before)) return { result: failure(error(before)) };
        if (Date.now() >= deadline) return { result: failure('player-not-ready') };
        if (!navigation && canStart(before)) break;
        if ((before.ready || canStart(before)) && navigation && !before.playing && !primed) {
          source = before;
          source.api?.addEventListener?.('onAutoplayBlocked', onBlocked);
          source.api?.addEventListener?.('onError', onError);
          if (!await requestPlay(before) && !dispatchOnly) return { result: { ok: false, retry: true } };
          primed = true;
        }
        before = read();
        if (error(before)) return { result: failure(error(before)) };
        if (before.ready && (!navigation || started(before))) break;
        await wait(); before = read();
      }
      if (error(before)) return { result: failure(error(before)) };
      if (Date.now() >= deadline) return { result: failure('command-timeout') };
      if (type === 'play' && before.playing) return { result: { ok: true } };
      const selector = ({ play: '.play-pause-button', toggle: '.play-pause-button',
        next: '.next-button', prev: '.previous-button' })[type];
      const button = document.querySelector('ytmusic-player-bar ' + selector);
      if (!usable(button)) return { result: { ok: false, retry: true } };
      if (!source) {
        source = before;
        source.api?.addEventListener?.('onAutoplayBlocked', onBlocked);
        source.api?.addEventListener?.('onError', onError);
      }
      seekMedia = before.media;
      seekMedia?.addEventListener?.('seeked', onSeeked);
      control.latest = sequence;
      button.click();
      deadline = Math.min(expires, Date.now() + 10000);
      return { before };
    });
    // Release after dispatch, including when verification is still pending.
    control.dispatch = dispatch.then(() => {}, () => {});
    const completion = (async () => {
      try {
        const dispatched = await dispatch;
        if (dispatched.result) return dispatched.result;
        const { before } = dispatched;
        const desiredPlaying = type === 'play' || !before.playing;
        let navigated = false;
        const played = new Set();
        while (Date.now() < deadline) {
          const after = read();
          if (error(after)) return failure(error(after));
          if (!navigation) {
            if (desiredPlaying ? started(after) : !after.playing) return { ok: true };
          } else {
            navigated ||= Boolean((before.key && after.key && before.key !== after.key) ||
              (Number.isInteger(before.index) && Number.isInteger(after.index) && before.index !== after.index) ||
              (before.key === after.key && type === 'prev' && after.time < 2 && (after.time < before.time || seeked)));
            if (navigated && started(after)) return { ok: true };
            // Restarting the same item at time zero can omit a seek event.
            // Keep playback recovery independent of navigation confirmation.
            const target = JSON.stringify([after.key, after.index]);
            if (!after.playing && after.ready && !played.has(target) && played.size < 2) {
              if (await requestPlay(after)) played.add(target);
            }
          }
          await wait();
        }
        return failure('playback-unconfirmed');
      } catch (error) {
        return failure(error?.name === 'NotAllowedError' ? 'autoplay-blocked' : 'player-error');
      } finally {
        source?.api?.removeEventListener?.('onAutoplayBlocked', onBlocked);
        source?.api?.removeEventListener?.('onError', onError);
        seekMedia?.removeEventListener?.('seeked', onSeeked);
      }
    })();
    if (!dispatchOnly) return await completion;
    control.results.set(sequence, completion);
    while (control.results.size > 100) control.results.delete(control.results.keys().next().value);
    return { ok: true, pending: sequence };
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
