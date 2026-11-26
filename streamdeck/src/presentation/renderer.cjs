'use strict';
const { createOutputCache } = require('./output-cache.cjs');
const { ellipsis, marquee, MARQUEE_STEP_MS } = require('./track-text.cjs');
const { translate } = require('./messages.cjs');
const { albumTiles, keyDisplay } = require('./album-groups.cjs');
const { KEY_ACTION_NAMES } = require('../domain/actions.cjs');
const keyActions = new Set(KEY_ACTION_NAMES);
const EMPTY_KEY_IMAGE = 'data:image/svg+xml;base64,' +
  btoa('<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144"><rect width="144" height="144" fill="black"/></svg>');
const imageOnly = settings => keyDisplay(settings) !== 'default' && settings?.keyArtworkOnly === true;

function needsMarquee(displayed, actionName) {
  return [...displayed.values()].some(item =>
    (actionName(item.action) === 'nowplaying' && !imageOnly(item.settings) && item.settings?.titleMode === 'scroll') ||
    (actionName(item.action) === 'trackdial' && (item.settings?.dialDisplay === 'artwork' ?
      item.settings?.artworkShowTitle === true && item.settings?.artworkTitleMode === 'scroll' :
      item.settings?.infoTitleMode === 'scroll')));
}

// Output and artwork are ports: this module can run in Node, tests or a preview.
function createRenderer({ displayed, covers, selectedEntry, actionName, online = () => true,
  lastTrack = () => null, repeatAvailable = () => true,
  tr = key => translate('en', key), now = Date.now, fitDialArtwork, keyTextBackground, volumeKeyImage,
  setTimeout = globalThis.setTimeout, clearTimeout = globalThis.clearTimeout,
  output: { setImage, setTitle, setFeedback, sendStream } }) {
  let hasDrawing = false;
  let volumeTimer = null;
  const cache = createOutputCache({ isCurrent: (context, item) => displayed.get(context) === item });
  const writeImage = (context, item, value) => cache.write(context, item, 'lastImage', value, next => setImage(context, next));
  const writeTitle = (context, item, value) => cache.write(context, item, 'lastTitle', value, next => setTitle(context, next));
  const coverFor = track => track?.image || covers.image(track?.cover) || null;

  function keyArtwork(item, cover, lines, tile, badge) {
    const signature = JSON.stringify([lines, tile, badge]);
    if (item.keyCover !== cover || item.keyArtworkSignature !== signature) {
      item.keyCover = cover;
      item.keyArtworkSignature = signature;
      item.keyArtwork = keyTextBackground(cover, lines, tile, badge);
    }
    return item.keyArtwork;
  }

  function keyIcon(kind, state) {
    if (kind === 'toggle' || kind === 'nowplaying') return `imgs/actions/toggle/${state?.playing ? 'pause' : 'key'}@2x.png`;
    if (kind === 'mute') return `imgs/actions/${state?.muted ? 'mute' : 'volume'}/key@2x.png`;
    if (kind === 'repeat') {
      const mode = repeatAvailable() ? state?.repeatMode?.toLowerCase() : null;
      return `imgs/actions/repeat/${mode || 'unavailable'}@2x.png`;
    }
    const selected = (kind === 'like' || kind === 'dislike') && state?.rating === kind.toUpperCase();
    return `imgs/actions/${kind}/${selected ? 'selected' : 'key'}@2x.png`;
  }

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
    const layout = artwork ? 'layouts/current-track-artwork.json' : '$A1';
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
    const value = artwork ? '' : state ? (infoScroll ?
      marquee(state.title, item.artworkMarqueeStart, now(), 14) : ellipsis(state.title, 14)) : tr('unavailable');
    const signature = JSON.stringify([layout, title, artist, below, value, fit, showName, scroll, background]);
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
        songTitleAbove: line(title, below && title), songArtist: line(artist, below && artist) } : { title, value, icon };
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
    const only = imageOnly(settings);
    const showTitle = !only && settings.showTitle !== false, showArtist = !only && settings.showArtist !== false;
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
    const badge = cover && !only && keyDisplay(settings) !== 'default' ? keyIcon('nowplaying', playback) : '';
    const image = keyArtwork(item, cover, lines, tile, badge) || (only ? EMPTY_KEY_IMAGE : null);
    writeImage(context, item, image);
  }
  function renderActionKey(context, item, kind, chosen, track, tile) {
    const icon = keyIcon(kind, chosen?.[1]);
    const artwork = keyDisplay(item.settings) !== 'default';
    const only = imageOnly(item.settings);
    const frame = only ? null : item.volumeFeedback?.frame(chosen, item.settings, now());
    const value = frame?.volume != null ? volumeKeyImage?.(frame.volume, item.settings?.volumeShowPercent === true) : null;
    const nativeImage = kind === 'prev' || kind === 'next' || kind === 'open';
    const hideTitle = kind === 'toggle' || kind === 'like' || kind === 'dislike' || kind === 'open' || kind === 'repeat';
    if (artwork) {
      const cover = coverFor(track);
      const composed = keyArtwork(item, cover, 0, tile, only ? '' : icon);
      writeImage(context, item, value || composed || (only ? EMPTY_KEY_IMAGE : icon));
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
      const track = state?.title || state?.cover ? state : lastTrack() || state;
      const tiles = albumTiles(displayed);
      for (const [context, item] of displayed) {
        const kind = actionName(item.action);
        if (kind === 'nowplaying') {
          renderCurrentTrackKey(context, item, track, tiles.get(context), state);
        } else if (keyActions.has(kind)) {
          nextVolumeExpiry = Math.min(nextVolumeExpiry, renderActionKey(context, item, kind, chosen, track, tiles.get(context)));
        } else if (kind === 'volume') {
          const vol = state ? `${state.muted ? tr('muted') + ' ' : ''}${state.volume}%` : tr('absent');
          const icon = `imgs/actions/${state?.muted ? 'mute' : 'volume'}/key@2x.png`;
          setFeedback(context, { title: 'YouTube Music', icon, value: vol,
            indicator: { value: state?.volume ?? 0, range: { min: 0, max: 100 } } });
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
