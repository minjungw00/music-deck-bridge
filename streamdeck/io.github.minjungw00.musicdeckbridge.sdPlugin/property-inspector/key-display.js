'use strict';
(function (root) {
  function keyDisplay(settings) {
    const mode = settings?.keyDisplay;
    return mode === 'artwork' || mode === 'linked' ? mode : 'icon';
  }

  function currentTrackKeySettings(settings) {
    const mode = keyDisplay(settings);
    // The previous default combined artwork and text. Explicit artwork modes
    // hid text even when older text settings were still present in the profile.
    const legacy = mode === 'icon' && settings?.keyDisplay !== 'icon';
    return {
      mode: legacy ? 'artwork' : mode,
      showTitle: settings?.keyShowTitle ?? (legacy && settings?.showTitle !== false),
      showArtist: settings?.keyShowArtist ?? (legacy && settings?.showArtist !== false),
      legacy,
    };
  }

  const api = Object.freeze({ keyDisplay, currentTrackKeySettings });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MusicDeckKeyDisplay = api;
})(globalThis);
