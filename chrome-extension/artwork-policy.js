'use strict';
// One URL admission policy for content metadata, popup artwork and the Node cache.
(function (root) {
  const hosts = new Set(['i.ytimg.com', 'img.youtube.com', 'yt3.ggpht.com', 'yt3.googleusercontent.com']);
  function parse(source, base) {
    try {
      const url = new URL(source, base);
      return url.protocol === 'https:' && !url.username && !url.password && !url.port &&
        (hosts.has(url.hostname) || /^lh[0-9]+\.googleusercontent\.com$/.test(url.hostname)) ? url : null;
    } catch { return null; }
  }
  const api = Object.freeze({ parse });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MusicDeckArtworkPolicy = api;
})(globalThis);
