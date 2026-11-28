'use strict';
const { createOutputCache } = require('./output-cache.cjs');
const { currentTrackDialFrame } = require('./current-track-dial.cjs');
const { ellipsis, marquee, MARQUEE_STEP_MS } = require('./track-text.cjs');
const { translate } = require('./messages.cjs');
const { albumTiles, keyDisplay } = require('../domain/album-groups.cjs');
const { currentTrackKeySettings } = require('../../io.github.minjungw00.musicdeckbridge.sdPlugin/property-inspector/key-display.js');
const { KEY_ACTION_NAMES } = require('../domain/actions.cjs');
const { trackKey } = require('../domain/player-state.cjs');
const keyActions = new Set(KEY_ACTION_NAMES);
const EMPTY_KEY_IMAGE = 'data:image/svg+xml;base64,' +
  btoa('<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144"><rect width="144" height="144" fill="black"/></svg>');

function needsMarquee(displayed, actionName) {
  return [...displayed.values()].some(item =>
    (actionName(item.action) === 'nowplaying' && item.settings?.titleMode === 'scroll') ||
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

  function keyArtwork(item, cover, lines, tile, badge, useArtworkFallback = true) {
    const position = item.settings?.keyArtworkIconPosition;
    const corner = typeof position === 'string' ? position : 'top-left';
    const signature = JSON.stringify([lines, tile, badge, corner, useArtworkFallback]);
    if (item.keyCover !== cover || item.keyArtworkSignature !== signature) {
      item.keyCover = cover;
      item.keyArtworkSignature = signature;
      item.keyArtwork = keyTextBackground(cover, lines, tile, badge, corner, useArtworkFallback);
    }
    return item.keyArtwork;
  }

  function keyIcon(kind, state, live = true) {
    if (kind === 'toggle') return `imgs/actions/toggle/${state?.playing ? 'pause' : 'key'}@2x.png`;
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
  const transparentBadge = icon => icon.replace('@2x.png', '-overlay.png');
  const overlay = (settings, icon) => settings?.keyArtworkShowIcon === true ? transparentBadge(icon) : '';

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
          const sent = item.sentDialFrame;
          if (sent?.signature === next.signature && sent.image === next.image) continue;
          try { await next.send(); }
          catch {
            item.sentDialFrame = null;
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
    const keyImage = keyIcon('toggle', playback);
    writeImage(context, item, keyImage);
    const icon = transparentBadge(keyImage);
    const { layout, image, fit, signature, feedback, artworkFeedback, trackSignature, marqueeStart } =
      currentTrackDialFrame(item.settings, state, { icon, coverFor, fitDialArtwork, tr, now,
        previousTrack: item.artworkTrackSignature, marqueeStart: item.artworkMarqueeStart });
    item.artworkTrackSignature = trackSignature;
    item.artworkMarqueeStart = marqueeStart;
    if (item.dialSignature === signature && item.dialImage === image) return;
    item.dialSignature = signature; item.dialImage = image;
    // Serialize layout and image updates so mode changes cannot send artwork to
    // the previous layout, or leave a newly selected layout with stale content.
    queueDialFeedback(context, item, { signature, image, send: async () => {
      if (displayed.get(context) !== item) return;
      if (item.sentLayout !== layout) {
        if (await sendStream({ event: 'setFeedbackLayout', context, payload: { layout } }) === false) throw new Error('Layout output skipped');
        item.sentLayout = layout;
      }
      if (displayed.get(context) !== item) return;
      const sent = item.sentDialFrame;
      const drawArtwork = artworkFeedback && (!sent || sent.layout !== layout || sent.image !== image || sent.fit !== fit);
      const frame = drawArtwork ? { ...feedback, ...artworkFeedback } : feedback;
      if (await setFeedback(context, frame) === false) throw new Error('Feedback output skipped');
      item.sentDialFrame = { layout, image, fit, signature };
    } });
  }
  function renderCurrentTrackKey(context, item, state, tile) {
    const settings = item.settings || {};
    const { mode, showTitle, showArtist, legacy } = currentTrackKeySettings(settings);
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
    const lines = settings.titleBackground === true && text ? (below && rawTitle && rawArtist ? 2 : 1) : 0;
    if (mode === 'icon') {
      const image = lines ? keyArtwork(item, null, lines, null, '') : null;
      writeImage(context, item, image || keyIcon('nowplaying'));
    } else {
      const badge = settings.keyArtworkShowIcon === true ? 'imgs/actions/nowplaying/icon@2x.png' : '';
      const image = keyArtwork(item, coverFor(state), lines, tile, badge, legacy);
      writeImage(context, item, image || (legacy ? null : EMPTY_KEY_IMAGE));
    }
  }
  function renderActionKey(context, item, kind, chosen, track, tile) {
    const live = chosen?.[1];
    const icon = keyIcon(kind, live ?? track, Boolean(live));
    const artwork = keyDisplay(item.settings) !== 'icon';
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

  function renderVolumeDial(context, item, state) {
    const volume = state?.volume ?? 0;
    const value = state ? `${state.muted ? tr('muted') + ' ' : ''}${volume}%` : tr('absent');
    const icon = transparentBadge(keyIcon('mute', state));
    const feedback = { title: 'YouTube Music', icon, value, indicator: { value: volume, range: { min: 0, max: 100 } } };
    cache.write(context, item, 'lastVolumeFeedback', feedback, next => setFeedback(context, next), JSON.stringify([icon, value, volume]));
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
          renderCurrentTrackKey(context, item, track, tiles.get(context));
        } else if (keyActions.has(kind)) {
          nextVolumeExpiry = Math.min(nextVolumeExpiry, renderActionKey(context, item, kind, chosen, track, tiles.get(context)));
        } else if (kind === 'volume') {
          renderVolumeDial(context, item, state ?? (Number.isFinite(track?.volume) ? track : null));
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
