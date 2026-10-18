'use strict';
const { createOutputCache } = require('./output-cache.cjs');
const { ellipsis, marquee, MARQUEE_STEP_MS } = require('./track-text.cjs');
const STRINGS = {
  ko: { unavailable: '연결 안 됨', offline: '오프라인', pause: '일시정지', play: '재생', muted: '음소거', absent: 'YTM 없음', currentTrack: '현재 곡', open: 'YTM 실행', like: '좋아요', dislike: '싫어요' },
  en: { unavailable: 'Disconnected', offline: 'Offline', pause: 'Pause', play: 'Play', muted: 'Muted', absent: 'No YTM', currentTrack: 'Current Track', open: 'Open YTM', like: 'Like', dislike: 'Dislike' },
};
function translate(locale, key) { return STRINGS[locale]?.[key] || STRINGS.en[key]; }
function needsMarquee(displayed, actionName) {
  return [...displayed.values()].some(item =>
    (actionName(item.action) === 'nowplaying' && item.settings?.titleMode === 'scroll') ||
    (actionName(item.action) === 'trackdial' && item.settings?.dialDisplay === 'artwork' &&
      item.settings?.artworkShowTitle === true && item.settings?.artworkTitleMode === 'scroll'));
}

// Output and artwork are ports: this module can run in Node, tests or a preview.
function createRenderer({ displayed, covers, selectedEntry, actionName, online = () => true,
  tr = key => translate('en', key), now = Date.now, fitDialArtwork, keyTextBackground,
  output: { setImage, setTitle, setFeedback, sendStream } }) {
  let hasDrawing = false;
  const cache = createOutputCache({ isCurrent: (context, item) => displayed.get(context) === item });
  const writeImage = (context, item, value) => cache.write(context, item, 'lastImage', value, next => setImage(context, next));
  const writeTitle = (context, item, value) => cache.write(context, item, 'lastTitle', value, next => setTitle(context, next));

  function renderCurrentTrackDial(context, item, state) {
    if (!online()) return;
    const icon = `imgs/actions/toggle/${state?.playing ? 'pause' : 'key'}@2x.png`;
    writeImage(context, item, icon);
    const artwork = item.settings?.dialDisplay === 'artwork';
    const fit = item.settings?.artworkFit === 'width' ? 'width' : 'height';
    const showName = artwork && item.settings?.artworkShowTitle === true;
    const scroll = item.settings?.artworkTitleMode === 'scroll';
    const background = item.settings?.artworkTitleBackground === true ? 'black' : 'transparent';
    const layout = artwork ? 'layouts/current-track-artwork.json' : '$A1';
    const cover = artwork ? covers.image(state?.cover) : '';
    const fitted = cover ? fitDialArtwork(cover, fit) : '';
    const image = fitted || icon;
    const text = showName && state?.title ? state.title +
      (item.settings?.artworkShowArtist === true && state.artist && item.settings?.artworkArtistPosition !== 'below' ? ` — ${state.artist}` : '') : '';
    const below = showName && item.settings?.artworkShowArtist === true && item.settings?.artworkArtistPosition === 'below' && Boolean(state?.artist);
    const trackSignature = JSON.stringify([state?.title, state?.artist, item.settings?.artworkShowArtist, item.settings?.artworkArtistPosition, showName, scroll]);
    if (item.artworkTrackSignature !== trackSignature) {
      item.artworkTrackSignature = trackSignature; item.artworkMarqueeStart = now();
    }
    const title = artwork ? scroll ? marquee(text, item.artworkMarqueeStart, now(), 14, true) : text : tr('currentTrack');
    const artist = below ? scroll ? marquee(state.artist, item.artworkMarqueeStart + 600, now(), 14, true) : state.artist : '';
    const value = artwork ? '' : state ? ellipsis(state.title, 14) : tr('unavailable');
    const signature = JSON.stringify([layout, title, artist, below, value, fit, showName, scroll, background]);
    if (item.dialSignature === signature && item.dialImage === image) return;
    item.dialSignature = signature; item.dialImage = image;
    // Serialize layout and image updates so mode changes cannot send artwork to
    // the previous layout, or leave a newly selected layout with stale content.
    item.feedbackQueue = (item.feedbackQueue || Promise.resolve()).then(async () => {
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
    }).catch(() => { item.dialSignature = null; });
  }
  function renderCurrentTrackKey(context, item, state) {
    const settings = item.settings || {};
    const showTitle = settings.showTitle !== false, showArtist = settings.showArtist !== false;
    const below = settings.artistPosition !== 'inline';
    const sig = JSON.stringify([state?.title, state?.artist, showTitle, showArtist, below, settings.titleMode]);
    if (item.trackSignature !== sig) { item.trackSignature = sig; item.marqueeStart = now(); }
    const rawTitle = showTitle ? state ? state.title || 'YouTube Music' : 'YouTube Music' : '';
    const rawArtist = showArtist ? state ? state.artist || '' : tr('unavailable') : '';
    const format = (value, width, delay = 0) => settings.titleMode === 'scroll' ?
      marquee(value, item.marqueeStart + delay, now()) : ellipsis(value, width);
    const text = below ? [format(rawTitle, 12), format(rawArtist, 11, 600)].filter(Boolean).join('\n') :
      format([rawTitle, rawArtist].filter(Boolean).join(' — '), 12);
    writeTitle(context, item, text);
    const cover = covers.image(state?.cover) || null;
    const lines = settings.titleBackground === true && text ? below && rawTitle && rawArtist ? 2 : 1 : 0;
    const image = keyTextBackground(cover, lines);
    writeImage(context, item, image);
  }
  function paint() {
    if (hasDrawing) return;
    hasDrawing = true;
    try {
      const chosen = selectedEntry();
      const state = chosen?.[1];
      for (const [context, item] of displayed) {
        const kind = actionName(item.action);
        if (kind === 'nowplaying') {
          renderCurrentTrackKey(context, item, state);
        } else if (kind === 'toggle') {
          // Reflect the selected player's confirmed state, including changes made
          // in Chrome. A key press alone must not optimistically flip the icon.
          const image = `imgs/actions/toggle/${state?.playing ? 'pause' : 'key'}@2x.png`;
          writeImage(context, item, image);
          writeTitle(context, item, '');
        } else if (kind === 'open') {
          writeTitle(context, item, '');
        } else if (kind === 'like' || kind === 'dislike') {
          const selected = state?.rating === kind.toUpperCase();
          const image = `imgs/actions/${kind}/${selected ? 'selected' : 'key'}@2x.png`;
          writeImage(context, item, image);
          writeTitle(context, item, '');
        } else if (kind === 'volume') {
          const vol = state ? `${state.muted ? tr('muted') + ' ' : ''}${state.volume}%` : tr('absent');
          const icon = `imgs/actions/${state?.muted ? 'mute' : 'volume'}/key@2x.png`;
          setFeedback(context, { title: 'YouTube Music', icon, value: vol,
            indicator: { value: state?.volume ?? 0, range: { min: 0, max: 100 } } });
        } else if (kind === 'trackdial') {
          renderCurrentTrackDial(context, item, state);
        }
      }
      if (state?.cover && !covers.image(state.cover))
        void covers.load(state.cover, state.coverFallback);
    } finally { hasDrawing = false; }
  }
  return { paint, renderCurrentTrackDial, renderCurrentTrackKey, settled: cache.settled };
}
module.exports = { createRenderer, needsMarquee, translate, MARQUEE_STEP_MS };
