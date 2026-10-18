'use strict';
let previewPaired = true;
let previewPort = 17864;
Object.defineProperty(globalThis, 'chrome', { configurable: true, value: {
  i18n: {
    getUILanguage: () => previewFixture.locale,
    getMessage: key => previewFixture.catalog[key]?.message || '',
  },
  runtime: { async sendMessage(message) {
    if (message.type === 'get-port') return { ok: true, port: previewPort };
    if (message.type === 'set-port') { previewPort = message.port; return { ok: true, port: previewPort }; }
    if (message.type === 'unpair') { previewPaired = false; return { ok: true }; }
    if (message.type === 'pair') previewPaired = true;
    return { ok: previewPaired, error: previewFixture.catalog.unknown.message,
      active: true, standalone: false, track: previewFixture.title, coverStatus: 'ready',
      compatibility: { pluginVersion: previewFixture.version, extensionVersion: previewFixture.extensionVersion,
        negotiatedProtocolVersion: previewFixture.protocol } };
  } },
} });
