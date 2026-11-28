'use strict';
(function (root) {
  // Chrome serializes this function into MAIN. All helpers must stay inside it;
  // the worker module only publishes its entry point, never page data.
  async function playerPlayback(type, expiresAt, dispatchOnly = false, queueStartup = false, trace = false) {
    const key = Symbol.for('music-deck-bridge.playback');
    const control = globalThis[key] ||= { sequence: 0, latest: 0, interrupt: 0,
      dispatch: Promise.resolve(), results: new Map() };
    if (type === 'result') return await readCompletion(expiresAt);
    if (type === 'state') {
      const state = readPlayer();
      const playbackConfirmed = state.playable && started(state);
      return { observedTrackId: /^[\w-]{11}$/.test(state.videoId) ? state.videoId : '',
        playing: state.playing, playbackConfirmed, muted: state.muted,
        repeatMode: readQueueControl('repeat')?.mode ?? null, shuffleEnabled: readQueueControl('shuffle')?.mode ?? null,
        ...playbackTime(state) };
    }
    if (type === 'repeat' || type === 'shuffle') return await changeQueueControl();
    if (!['play', 'toggle', 'next', 'prev'].includes(type)) return { ok: false };

    const navigation = type === 'next' || type === 'prev';
    const request = registerRequest();
    const { preceding, epoch } = request;
    let sequence;
    const expires = Number(expiresAt) || Infinity;
    let deadline = Math.min(expires, Date.now() + (dispatchOnly ? 30000 : 10000));
    const diagnostic = createDiagnostics();
    const events = createPlayerEvents();
    const recovery = createStartupRecovery();

    const operation = complete();
    const completion = request.result = trace ? operation.then(result => ({ ...result, trace: diagnostic.trace() })) : operation;
    if (!dispatchOnly) return await completion;
    return retainCompletion();

    function read() { return diagnostic.observe(readPlayer()); }
    function failure(reason) { return diagnostic.failure(reason, recovery.attempts); }
    function samePlayer(target, state) {
      return target.api === state.api && (!target.key || target.key === state.key) &&
        (!Number.isInteger(target.index) || target.index === state.index);
    }
    function playbackScopeError(state) {
      const target = request.target ?? preceding?.target;
      if (!target) return null;
      if (epoch !== control.playbackEpoch) return 'command-superseded';
      return samePlayer(target, state) ? null : 'player-changed';
    }
    function started(state) {
      return Number.isFinite(state.state) ? state.state === 1 : state.playing && state.media?.readyState >= 2;
    }
    function usable(button) {
      return button && !button.disabled && button.getAttribute('aria-disabled') !== 'true' &&
        !button.closest?.('[disabled], [aria-disabled="true"]');
    }
    function readQueueControl(command) {
      const repeat = command === 'repeat';
      const owners = document.querySelectorAll('ytmusic-player-bar, ytmusic-player-controls');
      for (const owner of owners) {
        if (repeat ? owner.isRepeatButtonDisabled === true :
          owner.isShuffleDisabled === true || owner.isShuffleButtonDisabled === true) continue;
        const mode = repeat ? owner.repeatMode : owner.shuffleOn;
        if (repeat ? !['NONE', 'ALL', 'ONE'].includes(mode) : typeof mode !== 'boolean') continue;
        const buttons = [...owner.querySelectorAll(`yt-icon-button.${command}`)].filter(candidate =>
          usable(candidate) && !candidate.hidden);
        const button = buttons.find(candidate => candidate.getClientRects().length > 0) || buttons[0];
        if (button) return { owner, button, mode };
      }
      return null;
    }
    function queueItems(owner) {
      try {
        const items = owner.queue?.getItems?.();
        return Array.isArray(items) ? items.slice(0, 256) : null;
      } catch { return null; }
    }
    async function changeQueueControl() {
      const deadline = Math.min(Number(expiresAt) || Infinity, Date.now() + 1200);
      const before = readQueueControl(type);
      if (Date.now() >= deadline) return { ok: false, reason: `${type}-unavailable` };
      if (!before) return { ok: false, reason: `${type}-unavailable`, ...(queueStartup ? { retry: true } : {}) };
      // Some player variants shuffle locally without retaining an on/off mode.
      const order = type === 'shuffle' && !before.mode ? queueItems(before.owner) : null;
      before.button.click();
      while (Date.now() < deadline) {
        const after = readQueueControl(type);
        if (after?.owner === before.owner) {
          if (after.mode !== before.mode) return { ok: true };
          const next = order && queueItems(after.owner);
          if (next && next.length === order.length && next.some((item, index) => item !== order[index])) return { ok: true };
        }
        await wait();
      }
      return { ok: false, reason: 'playback-unconfirmed' };
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
    function canPauseDuringBuffering(state) {
      return type === 'toggle' && state.state === 3 &&
        /^[\w-]{11}$/.test(state.key) && typeof state.api?.pauseVideo === 'function';
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

    function requestPause(state) {
      diagnostic.phase = 'pause-api';
      diagnostic.capture(state);
      state.api.pauseVideo()?.catch?.(error => events.reject(error, 'pause-api'));
    }

    async function prepareAndDispatch() {
      let before = read();
      const initialScopeError = playbackScopeError(before);
      if (initialScopeError) return { result: failure(initialScopeError) };
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
      const scopeError = playbackScopeError(before);
      if (scopeError) return { result: failure(scopeError) };
      if (error(before)) return { result: failure(error(before)) };
      if (Date.now() >= deadline) return { result: failure('command-timeout') };
      if (!navigation) request.target = before;
      recovery.clear();
      if (type === 'play' && before.playing) {
        if (started(before)) return { result: { ok: true } };
        // A new tab may already have requested playback and still be buffering.
        events.subscribe(before);
        control.latest = sequence;
        deadline = Math.min(expires, Date.now() + 10000);
        diagnostic.phase = 'confirm';
        return { before };
      }
      const selector = ({ play: '.play-pause-button', toggle: '.play-pause-button',
        next: '.next-button', prev: '.previous-button' })[type];
      const button = document.querySelector('ytmusic-player-bar ' + selector);
      if (!usable(button)) return { result: { ok: false, retry: true } };
      if (!events.subscribed) events.subscribe(before);
      events.watchSeek(before.media);
      control.latest = sequence;
      const bufferingPause = canPauseDuringBuffering(before);
      // The player can confirm a transition before its toggle button has updated.
      // For held inputs choose the explicit action from the confirmed player state.
      const heldReady = preceding && before.ready;
      const startupPlay = !navigation && before.ready && before.state === -1 && !(before.media?.readyState > 0);
      if (bufferingPause || (heldReady && before.playing && typeof before.api?.pauseVideo === 'function')) requestPause(before);
      else if ((heldReady || startupPlay) && !before.playing && typeof before.api?.playVideo === 'function') {
        await requestPlay(before, true);
      } else {
        diagnostic.phase = navigation ? 'navigate-button' : 'play-button';
        diagnostic.capture(before);
        button.click();
      }
      deadline = Math.min(expires, Date.now() + 10000);
      diagnostic.phase = 'confirm';
      return { before, bufferingPause };
    }

    async function confirm(before, recoverBufferedPause) {
      const observe = navigation ? observeNavigation(before) : observePlayback(before, recoverBufferedPause);
      while (Date.now() < deadline) {
        const after = read();
        if (error(after)) return failure(error(after));
        const result = await observe(after);
        if (result) return result;
        await wait();
      }
      return failure('playback-unconfirmed');
    }

    function observePlayback(before, recoverBufferedPause) {
      const desiredPlaying = type === 'play' || !before.playing;
      return async after => {
        if (desiredPlaying ? started(after) : !after.playing) {
          if (!samePlayer(request.target, after)) return failure('player-changed');
          request.target = after;
          return { ok: true };
        }
        if (recoverBufferedPause) {
          if (control.sequence !== sequence || after.api !== before.api || after.key !== before.key || after.index !== before.index) {
            recoverBufferedPause = false;
          } else if (after.ready && started(after)) {
            // Retry an ignored buffering Pause once after the same track starts.
            recoverBufferedPause = false;
            requestPause(after);
          }
        }
        await recovery.step(after);
        diagnostic.phase = 'confirm';
      };
    }

    function observeNavigation(before) {
      let navigated = false, destinationRecoveryStarted = false;
      const played = new Set();
      return async after => {
        navigated ||= Boolean((before.key && after.key && before.key !== after.key) ||
          (Number.isInteger(before.index) && Number.isInteger(after.index) && before.index !== after.index) ||
          (before.key === after.key && type === 'prev' && after.time < 2 && (after.time < before.time || events.seeked)));
        if (navigated && started(after)) return { ok: true };
        // A same-item restart can omit a seek event. Recovery and navigation
        // confirmation use separate evidence.
        const target = JSON.stringify([after.key, after.index]);
        if (!after.playing && after.ready && !played.has(target) && played.size < 2) {
          const recoverDestination = navigated && !destinationRecoveryStarted && canRecoverStartup(after);
          if (await requestPlay(after, recoverDestination)) {
            played.add(target);
            if (recoverDestination) destinationRecoveryStarted = true;
          }
          diagnostic.phase = 'confirm';
        }
        await recovery.step(after);
        diagnostic.phase = 'confirm';
      };
    }

    // Receipts identify caller-visible results. Dispatch order only advances
    // when an input is admitted to the shared queue.
    function registerRequest() {
      const receipt = control.receipt = (control.receipt ?? control.sequence) + 1;
      const preceding = type === 'toggle' ? control.playback : null;
      if (type !== 'toggle') control.playbackEpoch = (control.playbackEpoch ?? 0) + 1;
      const next = { receipt, preceding, epoch: control.playbackEpoch, result: null, target: null, done: false };
      control.playback = navigation ? null : next;
      return next;
    }

    function retainCompletion() {
      control.results.set(request.receipt, request.result);
      while (control.results.size > 100) control.results.delete(control.results.keys().next().value);
      return { ok: true, pending: request.receipt };
    }

    async function readCompletion(receipt) {
      const result = control.results.get(receipt);
      if (!result) return { ok: false, reason: 'playback-unconfirmed', diagnostic: { phase: 'result', source: 'missing-result' } };
      try { return await result; }
      finally { control.results.delete(receipt); }
    }

    function releaseRequest() {
      request.done = true;
      if (control.playback !== request) return;
      let active = preceding;
      while (active?.done) active = active.preceding;
      control.playback = active;
    }

    async function waitForPreceding() {
      let timer;
      const timeout = new Promise(resolve => { timer = setTimeout(resolve, Math.max(0, deadline - Date.now())); });
      try { return await Promise.race([preceding.result, timeout]); }
      finally { clearTimeout(timer); }
    }

    function superseded() { return control.latest > sequence || (navigation && control.interrupt > sequence); }

    async function complete() {
      try {
        // Held toggles acknowledge receipt without entering the ordered input
        // queue or interrupting the preceding input's bounded recovery.
        if (preceding) {
          const previous = await waitForPreceding();
          if (!previous || Date.now() >= deadline) return failure('command-timeout');
          if (epoch !== control.playbackEpoch) return failure('command-superseded');
          if (!previous.ok) return failure(previous.reason === 'player-changed' ? 'player-changed' : 'command-superseded');
        }
        let dispatched = await enqueueDispatch();
        // A disabled button is a safe pre-dispatch retry. Keep the same receipt
        // and let other operations use the dispatch queue while it becomes ready.
        while (!navigation && dispatchOnly && dispatched.result?.retry === true) {
          await wait();
          if (Date.now() >= deadline) return failure('player-not-ready');
          dispatched = await enqueueDispatch();
        }
        return dispatched.result || await confirm(dispatched.before, dispatched.bufferingPause);
      } catch (error) {
        diagnostic.recordFault('exception', null, error?.name);
        return failure(error?.name === 'NotAllowedError' && diagnostic.phase !== 'pause-api' ? 'autoplay-blocked' : 'player-error');
      } finally {
        releaseRequest();
        events.cleanup();
      }
    }

    function enqueueDispatch() {
      if (sequence === undefined) {
        sequence = ++control.sequence;
        if (!navigation) control.interrupt = sequence;
      }
      const dispatch = control.dispatch.then(prepareAndDispatch);
      control.dispatch = dispatch.then(() => {}, () => {});
      return dispatch;
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
        reject(error, phase = 'play-api') {
          diagnostic.recordFault(phase === 'pause-api' ? 'pause-rejection' : 'play-rejection', null, error?.name, phase);
          if (phase === 'play-api' && error?.name === 'NotAllowedError') blocked = true;
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
            mediaPaused: state.media?.paused,
            hasTrack: Boolean(state.key), action: info.phase, api: state.apiSource,
            userActive: globalThis.navigator?.userActivation?.isActive ?? null,
            userEverActive: globalThis.navigator?.userActivation?.hasBeenActive ?? null };
        },
        recordFault(source, code, exception, phase = info.phase) {
          fault = { source, phase, code: Number.isInteger(code) && code >= 0 && code <= 999 ? code : null,
            exception: exception ? exceptionName(exception) : null };
        },
        trace() { return { held: Boolean(preceding), state: snapshot?.state ?? null,
          inputState: input?.state ?? null, inputAction: input?.action ?? null }; },
        failure(reason, startupAttempts) {
          return { ok: false, reason, diagnostic: {
            phase: info.phase, source: fault?.source || 'observation', errorPhase: fault?.phase || info.phase,
            code: fault?.code ?? null, exception: fault?.exception ?? null,
            state: [-1, 0, 1, 2, 3, 5].includes(snapshot?.state) ? snapshot.state : null,
            apiReady: snapshot?.apiReady === true,
            mediaReady: [0, 1, 2, 3, 4].includes(snapshot?.media?.readyState) ? snapshot.media.readyState : null,
            mediaPaused: snapshot?.media?.paused ?? null,
            hasTrack: Boolean(snapshot?.key), playable: snapshot?.playable !== false,
            inputState: [-1, 0, 1, 2, 3, 5].includes(input?.state) ? input.state : null,
            inputApiReady: input?.apiReady ?? null,
            inputMediaReady: [0, 1, 2, 3, 4].includes(input?.mediaReady) ? input.mediaReady : null,
            inputMediaPaused: input?.mediaPaused ?? null,
            inputHasTrack: input?.hasTrack ?? null,
            inputAction: input?.action ?? null, inputApi: input?.api ?? null,
            inputUserActive: input?.userActive ?? null, inputUserEverActive: input?.userEverActive ?? null,
            startupAttempts,
          } };
        },
      };
      return info;
    }

    function playbackTime({ ready, playable, api, media, position }) {
      if (!ready || !playable || !Number.isFinite(position) || position < 0) return null;
      let duration;
      try { duration = api?.getDuration?.(); } catch { /* Use the media element instead. */ }
      if (!Number.isFinite(duration) || duration <= 0) duration = media?.duration;
      return Number.isFinite(duration) && duration > 0 ? { positionSeconds: position, durationSeconds: duration } : null;
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
      const position = Number.isFinite(time) ? time : media?.currentTime;
      return { api, apiSource, media, ready, apiReady, queueReady, playable, playing, state, index, videoId,
        muted: typeof muted === 'boolean' ? muted : Boolean(media?.muted),
        key: videoId || media?.currentSrc || media?.src || '',
        time: position || 0, position };
    }
  }

  root.MusicDeckPlayerPlayback = Object.freeze({ run: playerPlayback });
})(globalThis);
