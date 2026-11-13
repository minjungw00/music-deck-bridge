'use strict';
let previewPaired = true;
let previewPort = 17864;
let previewPlaying = true;
let previewRating = 'INDIFFERENT';
let previewVolume = 50;
let previewMuted = false;
Object.defineProperty(globalThis, 'chrome', { configurable: true, value: {
  i18n: {
    getUILanguage: () => previewFixture.locale,
    getMessage: key => previewFixture.catalog[key]?.message || '',
  },
  runtime: { getURL: path => previewFixture.controlIcons?.[path] || path,
    async sendMessage(message) {
    if (message.type === 'get-port') return { ok: true, port: previewPort };
    if (message.type === 'set-port') { previewPort = message.port; return { ok: true, port: previewPort }; }
    if (message.type === 'unpair') { previewPaired = false; return { ok: true }; }
    if (message.type === 'pair') previewPaired = true;
    if (message.type === 'artwork') return { ok: true, image: previewFixture.cover };
    if (message.type === 'control') {
      if (message.command === 'toggle') previewPlaying = !previewPlaying;
      if (message.command === 'mute') previewMuted = !previewMuted;
      if (message.command === 'volume_delta') previewVolume = Math.max(0, Math.min(100, previewVolume + message.amount));
      if (['like', 'dislike'].includes(message.command)) {
        const rating = message.command === 'like' ? 'LIKE' : 'DISLIKE';
        previewRating = previewRating === rating ? 'INDIFFERENT' : rating;
      }
      return { ok: previewPaired };
    }
    return { ok: previewPaired, error: previewFixture.catalog.unknown.message,
      active: true, standalone: false, track: previewFixture.title, coverStatus: 'ready',
      popupControls: true, player: { id: '1', key: 'preview-song', title: previewFixture.title,
        artist: previewFixture.artist, playing: previewPlaying, rating: previewRating,
        volume: previewVolume, muted: previewMuted, coverKey: 'preview-cover' },
      compatibility: { pluginVersion: previewFixture.version, extensionVersion: previewFixture.extensionVersion,
        negotiatedProtocolVersion: previewFixture.protocol } };
  } },
} });
