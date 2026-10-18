'use strict';
// Composition root in Chrome's isolated world. Every injection includes the manifest's module list.
(() => {
  if (window.__MUSIC_DECK_BRIDGE_RUNNING__) return;
  window.__MUSIC_DECK_BRIDGE_RUNNING__ = true;
  const metadata = MusicDeckContentMetadata.create({ document, window, location, navigator });
  MusicDeckContentRuntime.start({ chrome, document, events: globalThis, current: metadata.current,
    createCommands: options => MusicDeckContentCommands.create({ ...options, chrome, document, metadata }) });
})();
