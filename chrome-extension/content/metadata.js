'use strict';
(function (root) {
  function createMetadataReader({ document, window, location, navigator }) {
    const KNOWN_IMAGE_HOST = /^(?:i\.ytimg\.com|img\.youtube\.com|yt3\.ggpht\.com|yt3\.googleusercontent\.com|lh\d+\.googleusercontent\.com)$/;
    function eligibleArt(url) {
      try { const u = new URL(url, location.href); return u.protocol === 'https:' && KNOWN_IMAGE_HOST.test(u.hostname); }
      catch { return false; }
    }
    function media() {
      const all = [...document.querySelectorAll('video, audio')];
      return all.find(el => el.readyState > 0 && !el.paused) ||
        all.find(el => el.readyState > 0 && Number.isFinite(el.duration)) || all[0] || null;
    }
    function text(selector) {
      return document.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() || '';
    }
    function improveCoverResolution(source) {
      if (!eligibleArt(source)) return '';
      const url = new URL(source, location.href);
      // YT Music commonly uses ...=w60-h60-l90-rj or ...=s120-c on
      // lh*.googleusercontent.com. Ask the same artwork CDN for a 512px source.
      if (/^(?:lh\d+|yt3)\.googleusercontent\.com$/.test(url.hostname) || url.hostname === 'yt3.ggpht.com') {
        url.pathname = url.pathname.replace(/=w(\d+)-h(\d+)(?=-|$)/, (whole, w, h) =>
          Math.min(Number(w), Number(h)) < 512 ? '=w512-h512' : whole);
        url.pathname = url.pathname.replace(/=s(\d+)(?=-|$)/, (whole, n) =>
          Number(n) < 512 ? '=s512' : whole);
      }
      return url.href;
    }
    function artCandidatesFromNode(node) {
      const out = [];
      for (const src of [node.currentSrc, node.getAttribute?.('src'), node.getAttribute?.('data-src'),
        node.getAttribute?.('data-thumb'), node.src]) {
        if (src && eligibleArt(src)) out.push(new URL(src, location.href).href);
      }
      // srcset frequently provides significantly better source candidates.
      const srcset = node.getAttribute?.('srcset') || node.srcset || '';
      for (const part of srcset.split(',')) {
        const url = part.trim().split(/\s+/)[0];
        if (url && eligibleArt(url)) out.push(new URL(url, location.href).href);
      }
      return out;
    }
    function getArtFromElement(element) {
      if (!element) return '';
      const nodes = element.matches?.('img') ? [element] : [...element.querySelectorAll('img, source')];
      const images = nodes.flatMap(artCandidatesFromNode);
      if (images.length) return images.sort((a,b) => estimatedPixels(b) - estimatedPixels(a))[0];
      // Thumbnail may be represented by CSS background-image.
      const candidates = [element, ...element.querySelectorAll('[style*="background-image"]')].slice(0, 10);
      for (const node of candidates) {
        const css = node.style?.backgroundImage || '';
        const url = css.match(/url\(["']?([^"')]+)["']?\)/)?.[1];
        if (url && eligibleArt(url)) return new URL(url, location.href).href;
      }
      return '';
    }
    function estimatedPixels(url) {
      const wh = url.match(/=w(\d+)-h(\d+)/);
      if (wh) return Math.min(+wh[1], +wh[2]);
      const s = url.match(/=s(\d+)/);
      return s ? +s[1] : 0;
    }
    function mediaMetadata() {
      try { return typeof navigator === 'undefined' ? null : navigator.mediaSession?.metadata || null; }
      catch { return null; }
    }
    function getCoverWithFallback() {
      const selectors = [
        'ytmusic-player-bar #thumbnail',
        'ytmusic-player-bar .thumbnail-image-wrapper',
        'ytmusic-player-bar .thumbnail',
        'ytmusic-player-bar .image',
        'ytmusic-player-bar img',
      ];
      let raw = '';
      for (const selector of selectors) {
        raw = getArtFromElement(document.querySelector(selector));
        if (raw) break;
      }
      const meta = mediaMetadata();
      const title = text('ytmusic-player-bar .title.ytmusic-player-bar') ||
        text('ytmusic-player-bar .title');
      // Avoid using stale Media Session artwork immediately after track changes.
      const metaMatches = !raw || !title || !meta?.title || title.trim() === String(meta.title).trim();
      if (metaMatches) {
        const arts = [...(meta?.artwork || [])].filter(a => eligibleArt(a.src));
        arts.sort((a, b) => {
          const size = a => Number(String(a.sizes || '').split('x')[0]) || estimatedPixels(a.src);
          return size(b) - size(a);
        });
        if (arts[0] && (!raw || estimatedPixels(arts[0].src) > estimatedPixels(raw))) raw = arts[0].src;
      }
      return { cover: improveCoverResolution(raw), coverFallback: raw };
    }
    function siteVolume() {
      const sliders = [...document.querySelectorAll('ytmusic-player-bar #volume-slider, ytmusic-player-bar #expand-volume-slider')];
      const slider = sliders.find(item => item.getClientRects().length) || sliders[0];
      const value = slider?.getAttribute('aria-valuenow');
      return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
        ? Math.max(0, Math.min(100, Number(value))) : null;
    }
    function ratingButton(kind) {
      const renderer = document.querySelector('ytmusic-player-bar ytmusic-like-button-renderer');
      if (!renderer || renderer.disabled || renderer.getAttribute('aria-disabled') === 'true') return null;
      return renderer.querySelector(`#button-shape-${kind} button, #${kind}-button button, .${kind} button`) ||
        renderer.querySelector(`#${kind}-button, .${kind}`);
    }
    function ratingState() {
      const renderer = document.querySelector('ytmusic-player-bar ytmusic-like-button-renderer');
      const value = renderer?.getAttribute('like-status');
      if (['LIKE', 'DISLIKE', 'INDIFFERENT'].includes(value)) return value;
      const liked = ratingButton('like')?.getAttribute('aria-pressed');
      const disliked = ratingButton('dislike')?.getAttribute('aria-pressed');
      if (liked === 'true') return 'LIKE';
      if (disliked === 'true') return 'DISLIKE';
      return liked === 'false' && disliked === 'false' ? 'INDIFFERENT' : null;
    }
    function current() {
      const el = media();
      const meta = mediaMetadata();
      const title = text('ytmusic-player-bar .title.ytmusic-player-bar') ||
        text('ytmusic-player-bar .title') || meta?.title || '';
      const artist = [...document.querySelectorAll('ytmusic-player-bar .byline a')]
        .map(a => a.textContent?.trim()).filter(Boolean).join(', ') ||
        text('ytmusic-player-bar .byline').split(' • ')[0] || meta?.artist || '';
      return {
        title, artist, ...getCoverWithFallback(), rating: ratingState(),
        trackId: new URL(location.href).searchParams.get('v') || '',
        playing: el ? !el.paused && !el.ended : false,
        muted: el ? !!el.muted : false,
        volume: siteVolume() ?? (el ? Math.round(el.volume * 100) : 0),
        standalone: window.matchMedia('(display-mode: standalone)').matches ||
          window.matchMedia('(display-mode: window-controls-overlay)').matches,
      };
    }
    return { current, media, siteVolume, ratingButton };
  }
  root.MusicDeckContentMetadata = Object.freeze({ create: createMetadataReader });
})(globalThis);
