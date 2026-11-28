'use strict';
const { marquee } = require('./track-text.cjs');

function formatPlaybackTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const remainder = String(seconds % 60).padStart(2, '0');
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${remainder}` : `${minutes}:${remainder}`;
}

function currentTrackDialFrame(settings, state, { icon, coverFor, fitDialArtwork, tr, now, previousTrack, marqueeStart }) {
  const display = settings?.dialDisplay;
  const artwork = display === 'artwork';
  const titleOnly = display === 'title';
  const fit = settings?.artworkFit === 'width' ? 'width' : 'height';
  const showName = artwork && settings?.artworkShowTitle === true;
  const scroll = settings?.artworkTitleMode === 'scroll';
  const background = settings?.artworkTitleBackground === true ? 'black' : 'transparent';
  const time = !artwork && state?.durationSeconds ?
    `${formatPlaybackTime(state.positionSeconds)} / ${formatPlaybackTime(state.durationSeconds)}` : '';
  const layout = artwork ? 'layouts/current-track-artwork.json' :
    titleOnly ? 'layouts/current-track-title.json' : 'layouts/current-track-info.json';
  const cover = artwork ? coverFor(state) : '';
  const fitted = cover ? fitDialArtwork(cover, fit) : '';
  const image = titleOnly ? null : fitted || icon;
  const showArtist = settings?.artworkShowArtist === true;
  const artistPosition = settings?.artworkArtistPosition;
  const text = showName && state?.title ? state.title +
    (showArtist && state.artist && artistPosition !== 'below' ? ` — ${state.artist}` : '') : '';
  const below = showName && showArtist && artistPosition === 'below' && Boolean(state?.artist);
  const infoScroll = !artwork && settings?.infoTitleMode === 'scroll';
  const trackSignature = JSON.stringify([state?.trackId, state?.title, state?.artist, artwork, titleOnly, infoScroll,
    settings?.artworkShowArtist, artistPosition, showName, scroll]);
  if (previousTrack !== trackSignature) marqueeStart = now();
  const title = artwork ? scroll ? marquee(text, marqueeStart, now(), 14, true) : text : 'YouTube Music';
  const artist = below ? scroll ? marquee(state.artist, marqueeStart + 600, now(), 14, true) : state.artist : '';
  let value = '';
  if (!artwork) {
    if (!state) value = tr('unavailable');
    else if (infoScroll) value = marquee(state.title, marqueeStart, now(), titleOnly ? 9 : 6, true);
    else value = state.title;
  }
  const signature = JSON.stringify([layout, title, artist, below, value, time, fit, showName, scroll, infoScroll, background]);
  const line = (value, enabled) => ({ value, enabled: Boolean(enabled), background,
    alignment: scroll ? 'left' : 'center', 'text-overflow': scroll ? 'clip' : 'ellipsis' });
  const feedback = artwork ? { songName: line(title, showName && title && !below),
    songTitleAbove: line(title, below && title), songArtist: line(artist, below && artist) } :
    { title, value: { value, alignment: titleOnly || infoScroll ? 'left' : 'right',
      'text-overflow': infoScroll ? 'clip' : 'ellipsis' }, time, ...(!titleOnly && { icon }) };
  const artworkFeedback = artwork ? { artwork: { value: fitted, enabled: Boolean(fitted) },
    fallback: { value: icon, enabled: !fitted } } : null;
  return { layout, image, fit, signature, feedback, artworkFeedback, trackSignature, marqueeStart };
}

module.exports = { currentTrackDialFrame };
