'use strict';
const { createOutputCache } = require('./output-cache.cjs');
const { ellipsis, marquee, MARQUEE_STEP_MS } = require('./track-text.cjs');
const { translate } = require('./messages.cjs');
const { albumTiles, keyDisplay } = require('./album-groups.cjs');
const { KEY_ACTION_NAMES } = require('../domain/actions.cjs');
const { trackKey } = require('../domain/player-state.cjs');
const keyActions = new Set(KEY_ACTION_NAMES);
const EMPTY_KEY_IMAGE = 'data:image/svg+xml;base64,' +
  btoa('<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144"><rect width="144" height="144" fill="black"/></svg>');

function formatPlaybackTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const remainder = String(seconds % 60).padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${remainder}` : `${minutes}:${remainder}`;
}

function needsMarquee(displayed, actionName) {
  return [...displayed.values()].some(item =>
    (actionName(item.action) === 'nowplaying' && keyDisplay(item.settings) === 'default' && item.settings?.titleMode === 'scroll') ||
    (actionName(item.action) === 'trackdial' && (item.settings?.dialDisplay === 'artwork' ?
      item.settings?.artworkShowTitle === true && item.settings?.artworkTitleMode === 'scroll' :
      item.settings?.infoTitleMode === 'scroll')));
}

// Output and artwork are ports: this module can run in Node, tests or a preview.
function createRenderer({ displayed, covers, selectedEntry, actionName, online = () => true,
  lastTrack = () => null, repeatAvailable = () => true, shuffleAvailable = () => true,
  tr = key => translate('en', key), now = Date.now, fitDialArtwork, keyTextBackground, volumeKeyImage,
  setTimeout = globalThis.setTimeout, clearTimeout = globalThis.clearTimeout,
  output: { setImage, setTitle, setFeedback, sendStream } }) {
  let hasDrawing = false;
  let volumeTimer = null;
  const cache = createOutputCache({ isCurrent: (context, item) => displayed.get(context) === item });
  const writeImage = (context, item, value) => cache.write(context, item, 'lastImage', value, next => setImage(context, next));
  const writeTitle = (context, item, value) => cache.write(context, item, 'lastTitle', value, next => setTitle(context, next));
  const coverFor = track => track?.image || covers.image(track?.cover) || null;

  function displayTrack(state) {
    const saved = lastTrack();
    if (!state?.title && !state?.cover) return saved || state;
    if (saved?.image && state.title && trackKey(state) === trackKey(saved)) {
      return { ...state, image: coverFor(state) || saved.image };
    }
    return state;
  }

  function keyArtwork(item, cover, lines, tile, badge) {
    const position = item.settings?.keyArtworkIconPosition;
    const corner = typeof position === 'string' ? position : 'top-left';
    const signature = JSON.stringify([lines, tile, badge, corner]);
    if (item.keyCover !== cover || item.keyArtworkSignature !== signature) {
      item.keyCover = cover;
      item.keyArtworkSignature = signature;
      item.keyArtwork = keyTextBackground(cover, lines, tile, badge, corner);
    }
    return item.keyArtwork;
  }

  function keyIcon(kind, state, live = true) {
    if (kind === 'toggle' || kind === 'nowplaying') return `imgs/actions/toggle/${state?.playing ? 'pause' : 'key'}@2x.png`;
    if (kind === 'mute') return `imgs/actions/${state?.muted ? 'mute' : 'volume'}/key@2x.png`;
    if (kind === 'repeat') {
      const mode = !live || repeatAvailable() ? state?.repeatMode?.toLowerCase() : null;
      return `imgs/actions/repeat/${mode || 'unavailable'}@2x.png`;
    }
    if (kind === 'shuffle') {
      const mode = (!live || shuffleAvailable()) && typeof state?.shuffleEnabled === 'boolean' ?
        (state.shuffleEnabled ? 'on' : 'off') : 'unavailable';
      return `imgs/actions/shuffle/${mode}@2x.png`;
    }
    const selected = (kind === 'like' || kind === 'dislike') && state?.rating === kind.toUpperCase();
    return `imgs/actions/${kind}/${selected ? 'selected' : 'key'}@2x.png`;
  }
  const overlay = (settings, icon) => settings?.keyArtworkShowIcon === true ? icon.replace('@2x.png', '-overlay.png') : '';

  function queueDialFeedback(context, item, frame) {
    // Keep one in-flight frame and one replaceable pending frame per dial.
    item.pendingFeedback = frame;
    if (item.feedbackPending) return;
    item.feedbackPending = true;
    item.feedbackQueue = Promise.resolve().then(async () => {
      try {
        while (item.pendingFeedback && displayed.get(context) === item) {
          const next = item.pendingFeedback;
          item.pendingFeedback = null;
          if (item.sentDialSignature === next.signature && item.sentDialImage === next.image) continue;
          try { await next.send(); }
          catch {
            item.sentDialSignature = null;
            if (!item.pendingFeedback) item.dialSignature = null;
          }
        }
      } finally {
        item.pendingFeedback = null;
        item.feedbackPending = false;
      }
    });
  }

  function renderCurrentTrackDial(context, item, state, playback = state) {
    if (!online()) return;
    const icon = keyIcon('toggle', playback);
    writeImage(context, item, icon);
    const artwork = item.settings?.dialDisplay === 'artwork';
    const fit = item.settings?.artworkFit === 'width' ? 'width' : 'height';
    const showName = artwork && item.settings?.artworkShowTitle === true;
    const scroll = item.settings?.artworkTitleMode === 'scroll';
    const background = item.settings?.artworkTitleBackground === true ? 'black' : 'transparent';
    const time = !artwork && state?.durationSeconds ?
      `${formatPlaybackTime(state.positionSeconds)} / ${formatPlaybackTime(state.durationSeconds)}` : '';
    const layout = artwork ? 'layouts/current-track-artwork.json' : time ? 'layouts/current-track-info.json' : '$A1';
    const cover = artwork ? coverFor(state) : '';
    const fitted = cover ? fitDialArtwork(cover, fit) : '';
    const image = fitted || icon;
    const text = showName && state?.title ? state.title +
      (item.settings?.artworkShowArtist === true && state.artist && item.settings?.artworkArtistPosition !== 'below' ? ` — ${state.artist}` : '') : '';
    const below = showName && item.settings?.artworkShowArtist === true && item.settings?.artworkArtistPosition === 'below' && Boolean(state?.artist);
    const infoScroll = !artwork && item.settings?.infoTitleMode === 'scroll';
    const trackSignature = JSON.stringify([state?.trackId, state?.title, state?.artist, artwork, infoScroll,
      item.settings?.artworkShowArtist, item.settings?.artworkArtistPosition, showName, scroll]);
    if (item.artworkTrackSignature !== trackSignature) {
      item.artworkTrackSignature = trackSignature; item.artworkMarqueeStart = now();
    }
    const title = artwork ? scroll ? marquee(text, item.artworkMarqueeStart, now(), 14, true) : text : tr('currentTrack');
    const artist = below ? scroll ? marquee(state.artist, item.artworkMarqueeStart + 600, now(), 14, true) : state.artist : '';
    let value = '';
    if (!artwork) {
      if (!state) value = tr('unavailable');
      else if (infoScroll) value = marquee(state.title, item.artworkMarqueeStart, now(), time ? 7 : 14, Boolean(time));
      else value = time ? state.title : ellipsis(state.title, 14);
    }
    const signature = JSON.stringify([layout, title, artist, below, value, time, fit, showName, scroll, infoScroll, background]);
    if (item.dialSignature === signature && item.dialImage === image) return;
    item.dialSignature = signature; item.dialImage = image;
    // Serialize layout and image updates so mode changes cannot send artwork to
    // the previous layout, or leave a newly selected layout with stale content.
    queueDialFeedback(context, item, { signature, image, send: async () => {
      if (displayed.get(context) !== item) return;
      const changedLayout = item.sentLayout !== layout;
      if (changedLayout) {
        if (await sendStream({ event: 'setFeedbackLayout', context, payload: { layout } }) === false) throw new Error('Layout output skipped');
        item.sentLayout = layout;
      }
      if (displayed.get(context) !== item) return;
      const line = (value, enabled) => ({ value, enabled: Boolean(enabled), background,
        alignment: scroll ? 'left' : 'center', 'text-overflow': scroll ? 'clip' : 'ellipsis' });
      const feedback = artwork ? { songName: line(title, showName && title && !below),
        songTitleAbove: line(title, below && title), songArtist: line(artist, below && artist) } :
        { title, value: time ? { value, 'text-overflow': infoScroll ? 'clip' : 'ellipsis' } : value, icon, ...(time && { time }) };
      if (artwork && (changedLayout || item.sentDialImage !== image || item.sentArtworkFit !== fit)) {
        feedback.artwork = { value: fitted, enabled: Boolean(fitted) };
        feedback.fallback = { value: icon, enabled: !fitted };
      }
      if (await setFeedback(context, feedback) === false) throw new Error('Feedback output skipped');
      item.sentDialImage = image; item.sentArtworkFit = fit;
      item.sentDialSignature = signature;
    } });
  }
  function renderCurrentTrackKey(context, item, state, tile, playback = state) {
    const settings = item.settings || {};
    const artwork = keyDisplay(settings) !== 'default';
    const showTitle = !artwork && settings.showTitle !== false, showArtist = !artwork && settings.showArtist !== false;
    const below = settings.artistPosition !== 'inline';
    const sig = JSON.stringify([state?.trackId, state?.title, state?.artist, showTitle, showArtist, below, settings.titleMode]);
    if (item.trackSignature !== sig) { item.trackSignature = sig; item.marqueeStart = now(); }
    const rawTitle = showTitle ? state ? state.title || 'YouTube Music' : 'YouTube Music' : '';
    const rawArtist = showArtist ? state ? state.artist || '' : tr('unavailable') : '';
    const format = (value, width, delay = 0) => settings.titleMode === 'scroll' ?
      marquee(value, item.marqueeStart + delay, now()) : ellipsis(value, width);
    const text = below ? [format(rawTitle, 12), format(rawArtist, 11, 600)].filter(Boolean).join('\n') :
      format([rawTitle, rawArtist].filter(Boolean).join(' — '), 12);
    writeTitle(context, item, text);
    const cover = coverFor(state);
    const lines = settings.titleBackground === true && text ? below && rawTitle && rawArtist ? 2 : 1 : 0;
    const badge = artwork ? overlay(settings, keyIcon('nowplaying', playback)) : '';
    const image = keyArtwork(item, cover, lines, tile, badge) || (artwork ? EMPTY_KEY_IMAGE : null);
    writeImage(context, item, image);
  }
  function renderActionKey(context, item, kind, chosen, track, tile) {
    const live = chosen?.[1];
    const icon = keyIcon(kind, live ?? track, Boolean(live));
    const artwork = keyDisplay(item.settings) !== 'default';
    const frame = artwork ? null : item.volumeFeedback?.frame(chosen, item.settings, now());
    const value = frame?.volume != null ? volumeKeyImage?.(frame.volume, item.settings?.volumeShowPercent === true) : null;
    const nativeImage = kind === 'prev' || kind === 'next' || kind === 'open';
    const hideTitle = ['toggle', 'like', 'dislike', 'open', 'repeat', 'shuffle'].includes(kind);
    if (artwork) {
      const cover = coverFor(track);
      const composed = keyArtwork(item, cover, 0, tile, overlay(item.settings, icon));
      writeImage(context, item, composed || EMPTY_KEY_IMAGE);
    } else {
      if (!nativeImage || item.albumMode) writeImage(context, item, value || (nativeImage ? null : icon));
      if (item.albumMode) {
        item.keyCover = null;
        item.keyArtworkSignature = null;
        item.keyArtwork = null;
      }
    }
    if (hideTitle || artwork) writeTitle(context, item, '');
    else if (item.albumMode) writeTitle(context, item, undefined);
    item.albumMode = artwork;
    return frame?.expiresAt ?? Infinity;
  }

  function paint() {
    if (hasDrawing) return;
    hasDrawing = true;
    let nextVolumeExpiry = Infinity;
    try {
      const chosen = selectedEntry();
      const state = chosen?.[1];
      const track = displayTrack(state);
      const tiles = albumTiles(displayed);
      for (const [context, item] of displayed) {
        const kind = actionName(item.action);
        if (kind === 'nowplaying') {
          renderCurrentTrackKey(context, item, track, tiles.get(context), state);
        } else if (keyActions.has(kind)) {
          nextVolumeExpiry = Math.min(nextVolumeExpiry, renderActionKey(context, item, kind, chosen, track, tiles.get(context)));
        } else if (kind === 'volume') {
          const volumeState = state ?? (Number.isFinite(track?.volume) ? track : null);
          const vol = volumeState ? `${volumeState.muted ? tr('muted') + ' ' : ''}${volumeState.volume}%` : tr('absent');
          const icon = keyIcon('mute', volumeState);
          setFeedback(context, { title: 'YouTube Music', icon, value: vol,
            indicator: { value: volumeState?.volume ?? 0, range: { min: 0, max: 100 } } });
        } else if (kind === 'trackdial') {
          renderCurrentTrackDial(context, item, track, state);
        }
      }
      if (state?.cover && !covers.image(state.cover))
        void covers.load(state.cover, state.coverFallback);
    } finally {
      hasDrawing = false;
      if (volumeTimer !== null) clearTimeout(volumeTimer);
      volumeTimer = Number.isFinite(nextVolumeExpiry) ? setTimeout(() => {
        volumeTimer = null; paint();
      }, Math.max(1, nextVolumeExpiry - now())) : null;
      volumeTimer?.unref?.();
    }
  }
  return { paint, renderCurrentTrackDial, renderCurrentTrackKey, settled: cache.settled };
}
module.exports = { createRenderer, needsMarquee, translate, MARQUEE_STEP_MS };
