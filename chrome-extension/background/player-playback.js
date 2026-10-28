'use strict';
(function (root) {
  // Chrome serializes this function into MAIN. All helpers must stay inside it;
  // the worker module only publishes its entry point, never page data.
  async function playerPlayback(type, expiresAt, dispatchOnly = false) {
    const key = Symbol.for('music-deck-bridge.playback');
    const control = globalThis[key] ||= { sequence: 0, latest: 0, interrupt: 0,
      dispatch: Promise.resolve(), results: new Map() };
    if (type === 'result') {
      const result = control.results.get(expiresAt);
      if (!result) return { ok: false, reason: 'playback-unconfirmed' };
      try { return await result; }
      finally { control.results.delete(expiresAt); }
    }
    if (type === 'state') {
      const state = readPlayer();
      return { playing: state.playing, muted: state.muted };
    }
    if (!['play', 'toggle', 'next', 'prev'].includes(type)) return { ok: false };

    const sequence = ++control.sequence;
    if (type === 'toggle' || type === 'play') control.interrupt = sequence;
    const navigation = type === 'next' || type === 'prev';
    const expires = Number(expiresAt) || Infinity;
    let deadline = Math.min(expires, Date.now() + (dispatchOnly ? 30000 : 10000));
    const diagnostic = createDiagnostics();
    const events = createPlayerEvents();
    const recovery = createStartupRecovery();

    // Preparation/clicks stay ordered. Outcome polling does not own the queue.
    const dispatch = control.dispatch.then(prepareAndDispatch);
    control.dispatch = dispatch.then(() => {}, () => {});
    const completion = complete();
    if (!dispatchOnly) return await completion;
    control.results.set(sequence, completion);
    while (control.results.size > 100) control.results.delete(control.results.keys().next().value);
    return { ok: true, pending: sequence };

    function read() { return diagnostic.observe(readPlayer()); }
    function failure(reason) { return diagnostic.failure(reason, recovery.attempts); }
    function superseded() { return control.latest > sequence || (navigation && control.interrupt > sequence); }
    function started(state) {
      return Number.isFinite(state.state) ? state.state === 1 : state.playing && state.media?.readyState >= 2;
    }
    function usable(button) {
      return button && !button.disabled && button.getAttribute('aria-disabled') !== 'true' &&
        !button.closest?.('[disabled], [aria-disabled="true"]');
    }
    function playButton() { return document.querySelector('ytmusic-player-bar .play-pause-button'); }
    function canStart(state) {
      // CUED can precede loaded media/metadata; an initialized API alone cannot.
      return state.playable && state.queueReady && state.apiReady && state.state === 5 && usable(playButton());
    }
    function canRecoverStartup(state) {
      return state.ready && state.state === -1 && !(state.media?.readyState > 0) &&
        /^[\w-]{11}$/.test(state.key) && typeof state.api?.playVideo === 'function';
    }
    function wait() { return new Promise(resolve => setTimeout(resolve, 80)); }
    function error(state) { return superseded() ? 'command-superseded' : events.failure(state); }

    async function requestPlay(state, initializing = false) {
      if (!state.ready && canStart(state)) {
        diagnostic.phase = 'play-button'; diagnostic.capture(state); playButton().click(); return true;
      }
      if (typeof state.api?.playVideo === 'function') {
        if (initializing && canRecoverStartup(state)) recovery.arm(state);
        diagnostic.phase = 'play-api';
        diagnostic.capture(state);
        // Observe playback itself; a site's promise need not settle at startup.
        state.api.playVideo()?.catch?.(error => events.reject(error));
        return true;
      }
      const button = playButton();
      if (!usable(button)) return false;
      diagnostic.phase = 'play-button';
      diagnostic.capture(state);
      button.click(); return true;
    }

    async function prepareAndDispatch() {
      let before = read();
      if (error(before)) return { result: failure(error(before)) };
      if (Date.now() >= deadline) return { result: failure('command-timeout') };
      if (!before.ready && !dispatchOnly && !canStart(before)) return { result: { ok: false, retry: true } };
      // Only initialization occupies the queue. Later Play/Pause interrupts
      // undispatched navigation at the next bounded observation tick.
      let primed = false;
      while (!before.ready || (navigation && !started(before))) {
        if (error(before)) return { result: failure(error(before)) };
        if (Date.now() >= deadline) return { result: failure('player-not-ready') };
        if (!navigation && canStart(before)) break;
        if ((before.ready || canStart(before)) && navigation && !before.playing && !primed) {
          events.subscribe(before);
          if (!await requestPlay(before, true) && !dispatchOnly) return { result: { ok: false, retry: true } };
          diagnostic.phase = 'prepare';
          primed = true;
        }
        before = read();
        if (error(before)) return { result: failure(error(before)) };
        if (before.ready && (!navigation || started(before))) break;
        await recovery.step(before);
        diagnostic.phase = 'prepare';
        await wait(); before = read();
      }
      if (error(before)) return { result: failure(error(before)) };
      if (Date.now() >= deadline) return { result: failure('command-timeout') };
      recovery.clear();
      if (type === 'play' && before.playing) return { result: { ok: true } };
      const selector = ({ play: '.play-pause-button', toggle: '.play-pause-button',
        next: '.next-button', prev: '.previous-button' })[type];
      const button = document.querySelector('ytmusic-player-bar ' + selector);
      if (!usable(button)) return { result: { ok: false, retry: true } };
      if (!events.subscribed) events.subscribe(before);
      events.watchSeek(before.media);
      control.latest = sequence;
      // Retain a restored track's Play intent if its first API call is ignored.
      if (!navigation && before.ready && before.state === -1 && !(before.media?.readyState > 0) &&
          typeof before.api?.playVideo === 'function') {
        await requestPlay(before, true);
      } else {
        diagnostic.phase = navigation ? 'navigate-button' : 'play-button';
        diagnostic.capture(before);
        button.click();
      }
      deadline = Math.min(expires, Date.now() + 10000);
      diagnostic.phase = 'confirm';
      return { before };
    }

    async function confirm(before) {
      const desiredPlaying = type === 'play' || !before.playing;
      const outcome = { navigated: false, destinationRecoveryStarted: false, played: new Set() };
      while (Date.now() < deadline) {
        const after = read();
        if (error(after)) return failure(error(after));
        if (!navigation) {
          if (desiredPlaying ? started(after) : !after.playing) return { ok: true };
          await recovery.step(after);
          diagnostic.phase = 'confirm';
        } else if (await confirmNavigation(before, after, outcome)) return { ok: true };
        await wait();
      }
      return failure('playback-unconfirmed');
    }

    async function confirmNavigation(before, after, outcome) {
      outcome.navigated ||= Boolean((before.key && after.key && before.key !== after.key) ||
        (Number.isInteger(before.index) && Number.isInteger(after.index) && before.index !== after.index) ||
        (before.key === after.key && type === 'prev' && after.time < 2 && (after.time < before.time || events.seeked)));
      if (outcome.navigated && started(after)) return true;
      // A same-item restart can omit a seek event: recover playback separately
      // from navigation evidence, without inventing a successful transition.
      const target = JSON.stringify([after.key, after.index]);
      if (!after.playing && after.ready && !outcome.played.has(target) && outcome.played.size < 2) {
        const recoverDestination = outcome.navigated && !outcome.destinationRecoveryStarted && canRecoverStartup(after);
        if (await requestPlay(after, recoverDestination)) {
          outcome.played.add(target);
          if (recoverDestination) outcome.destinationRecoveryStarted = true;
        }
        diagnostic.phase = 'confirm';
      }
      await recovery.step(after);
      diagnostic.phase = 'confirm';
      return false;
    }

    async function complete() {
      try {
        const dispatched = await dispatch;
        return dispatched.result || await confirm(dispatched.before);
      } catch (error) {
        diagnostic.recordFault('exception', null, error?.name);
        return failure(error?.name === 'NotAllowedError' ? 'autoplay-blocked' : 'player-error');
      } finally { events.cleanup(); }
    }

    function createStartupRecovery() {
      let target = null, attempts = 0;
      return {
        get attempts() { return attempts; },
        arm(state) {
          target = { api: state.api, key: state.key, index: state.index, nextAt: Date.now() + 1000 };
          attempts = 1;
        },
        clear() { target = null; },
        async step(state) {
          if (!target) return;
          // Progress/selection changes permanently cancel this input's recovery.
          if (!canRecoverStartup(state) || state.api !== target.api || state.key !== target.key ||
              state.index !== target.index || !usable(playButton()) || error(state) ||
              control.interrupt > sequence || (!navigation && control.sequence > sequence) ||
              Date.now() >= deadline || attempts >= 4) {
            target = null; return;
          }
          if (Date.now() < target.nextAt) return;
          attempts++;
          target.nextAt = Date.now() + attempts * 1000;
          // Explicit Play is idempotent; never repeat Toggle or navigation.
          await requestPlay(state);
        },
      };
    }

    function createPlayerEvents() {
      let blocked = false, failed = false, seeked = false, source, media;
      const onBlocked = () => { blocked = true; };
      const onError = event => {
        failed = true;
        diagnostic.recordFault('site-event', typeof event === 'number' ? event : event?.data);
      };
      const onSeeked = () => { seeked = true; };
      return {
        get subscribed() { return Boolean(source); },
        get seeked() { return seeked; },
        subscribe(state) {
          source = state;
          diagnostic.phase = 'subscribe';
          source.api?.addEventListener?.('onAutoplayBlocked', onBlocked);
          source.api?.addEventListener?.('onError', onError);
        },
        watchSeek(value) {
          media = value;
          media?.addEventListener?.('seeked', onSeeked);
        },
        reject(error) {
          diagnostic.recordFault('play-rejection', null, error?.name, 'play-api');
          if (error?.name === 'NotAllowedError') blocked = true;
          else failed = true;
        },
        failure(state) {
          if (blocked) return 'autoplay-blocked';
          if (failed) return 'player-error';
          if (state.media?.error) {
            diagnostic.recordFault('media', state.media.error.code);
            return 'player-error';
          }
          return null;
        },
        cleanup() {
          source?.api?.removeEventListener?.('onAutoplayBlocked', onBlocked);
          source?.api?.removeEventListener?.('onError', onError);
          media?.removeEventListener?.('seeked', onSeeked);
        },
      };
    }

    function createDiagnostics() {
      let snapshot, fault = null, input = null;
      const exceptionName = value => ['Error', 'TypeError', 'ReferenceError', 'NotAllowedError',
        'InvalidStateError', 'SecurityError', 'AbortError', 'NotSupportedError'].includes(value) ? value : 'Other';
      const info = {
        phase: 'prepare',
        observe(state) { snapshot = state; return state; },
        capture(state) {
          // Capture primitives before a site error can clear media/selection.
          input = { state: state.state, apiReady: state.apiReady, mediaReady: state.media?.readyState,
            hasTrack: Boolean(state.key), action: info.phase, api: state.apiSource,
            userActive: globalThis.navigator?.userActivation?.isActive ?? null,
            userEverActive: globalThis.navigator?.userActivation?.hasBeenActive ?? null };
        },
        recordFault(source, code, exception, phase = info.phase) {
          fault = { source, phase, code: Number.isInteger(code) && code >= 0 && code <= 999 ? code : null,
            exception: exception ? exceptionName(exception) : null };
        },
        failure(reason, startupAttempts) {
          return { ok: false, reason, diagnostic: {
            phase: info.phase, source: fault?.source || 'observation', errorPhase: fault?.phase || info.phase,
            code: fault?.code ?? null, exception: fault?.exception ?? null,
            state: [-1, 0, 1, 2, 3, 5].includes(snapshot?.state) ? snapshot.state : null,
            apiReady: snapshot?.apiReady === true,
            mediaReady: [0, 1, 2, 3, 4].includes(snapshot?.media?.readyState) ? snapshot.media.readyState : null,
            hasTrack: Boolean(snapshot?.key), playable: snapshot?.playable !== false,
            inputState: [-1, 0, 1, 2, 3, 5].includes(input?.state) ? input.state : null,
            inputApiReady: input?.apiReady ?? null,
            inputMediaReady: [0, 1, 2, 3, 4].includes(input?.mediaReady) ? input.mediaReady : null,
            inputHasTrack: input?.hasTrack ?? null,
            inputAction: input?.action ?? null, inputApi: input?.api ?? null,
            inputUserActive: input?.userActive ?? null, inputUserEverActive: input?.userEverActive ?? null,
            startupAttempts,
          } };
        },
      };
      return info;
    }

    function readPlayer() {
      const bar = document.querySelector('ytmusic-player-bar');
      const barApi = bar?.playerApi;
      const api = [barApi, document.querySelector('#movie_player')]
        .find(item => typeof item?.getPlayerState === 'function');
      const apiSource = !api ? 'none' : api === barApi ? 'player-bar' : 'movie-player';
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
      let index, queueReady = true;
      try {
        if (typeof bar?.queue?.getItems === 'function') queueReady = Boolean(bar.queue.getItems()?.length);
        index = bar?.queue?.getCurrentItemIndex?.();
      } catch { queueReady = false; }
      ready &&= queueReady;
      const playing = Number.isFinite(state) ? state === 1 || state === 3 :
        Boolean(media && !media.paused && !media.ended);
      return { api, apiSource, media, ready, apiReady, queueReady, playable, playing, state, index,
        muted: typeof muted === 'boolean' ? muted : Boolean(media?.muted),
        key: videoId || media?.currentSrc || media?.src || '',
        time: Number.isFinite(time) ? time : media?.currentTime || 0 };
    }
  }

  root.MusicDeckPlayerPlayback = Object.freeze({ run: playerPlayback });
})(globalThis);
