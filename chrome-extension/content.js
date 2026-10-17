'use strict';
// Runs in the installed Chrome PWA or normal YouTube Music tab.
// Reads DOM and Media Session metadata only; never accesses the user's Google credentials.
(() => {
  if (window.__MUSIC_DECK_BRIDGE_RUNNING__) return;
  window.__MUSIC_DECK_BRIDGE_RUNNING__ = true;

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
  function press(selector) {
    const el = document.querySelector('ytmusic-player-bar ' + selector);
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
    el.click(); return true;
  }
  async function command(message) {
    if (!message || typeof message.type !== 'string' || !active) return { ok: false };
    const el = media();
    let result = { ok: false };
    switch (message.type) {
      case 'play':
        if (el && !el.paused && !el.ended) { result = { ok: true }; break; }
        // An offline Play key means start playback, never pause a restored player.
        if (press('.play-pause-button')) result = { ok: true };
        else if (el && typeof el.play === 'function') {
          try { await el.play(); result = { ok: true }; } catch { result = { ok: false }; }
        } else result = { ok: false, retry: true };
        break;
      case 'toggle':
        if (press('.play-pause-button')) result = { ok: true };
        else if (el && typeof el.play === 'function' && typeof el.pause === 'function') {
          try { if (el.paused) await el.play(); else el.pause(); result = { ok: true }; }
          catch { result = { ok: false }; }
        } else result = { ok: false, retry: true };
        break;
      case 'next': result = { ok: press('.next-button') }; result.retry = !result.ok; break;
      case 'prev': result = { ok: press('.previous-button') }; result.retry = !result.ok; break;
      case 'like':
      case 'dislike': {
        const state = current();
        const clean = value => String(value ?? '').replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, 180);
        const key = /^[\w-]{11}$/.test(state.trackId) ? state.trackId : JSON.stringify([clean(state.title), clean(state.artist)]);
        if (!state.title) { result = { ok: false, retry: true }; break; }
        if (message.trackKey ? message.trackKey !== key : !message.allowCurrentTrack) break;
        const button = ratingButton(message.type);
        if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true' ||
            button.closest?.('[disabled], [aria-disabled="true"]')) {
          result = { ok: false, retry: true }; break;
        }
        button.click(); result = { ok: true }; break;
      }
      case 'mute':
      case 'volume_delta': {
        if (message.type === 'volume_delta' && !Number.isFinite(message.amount)) break;
        if (!el) { result = { ok: false, retry: true }; break; }
        if (message.type === 'volume_delta' && siteVolume() === null) { result = { ok: false, retry: true }; break; }
        if (message.type === 'mute') {
          const button = document.querySelector('ytmusic-player-bar .volume, ytmusic-player-bar #expand-volume');
          if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') {
            result = { ok: false, retry: true }; break;
          }
        }
        const operation = volumeCommands.then(async () => {
          if (!active) return { ok: false };
          const response = await chrome.runtime.sendMessage({
            type: 'player-volume', command: message.type, amount: message.amount,
          });
          return { ok: response?.ok === true };
        }).catch(() => ({ ok: false }));
        volumeCommands = operation;
        result = await operation;
        break;
      }
    }
    scheduleSync(60);
    return result;
  }
  let active = true;
  const browserCommands = new Map();
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (!['bridge-command', 'bridge-toggle'].includes(message?.type) ||
        sender.id !== chrome.runtime.id || sender.tab || !active) return;
    if (Number.isFinite(message.expiresAt) && Date.now() >= message.expiresAt) {
      respond({ ok: false }); return false;
    }
    const input = message.type === 'bridge-toggle' ? { type: 'toggle' } : message.command;
    const id = typeof message.id === 'string' ? message.id : null;
    let operation = id && browserCommands.get(id);
    if (!operation) {
      operation = command(input).catch(() => ({ ok: false }));
      if (id) {
        browserCommands.set(id, operation);
        operation.then(result => { if (result.retry) browserCommands.delete(id); });
        while (browserCommands.size > 100) browserCommands.delete(browserCommands.keys().next().value);
      }
    }
    operation.then(respond);
    return true;
  });
  let volumeCommands = Promise.resolve();
  let listenerGeneration = 0;
  let inFlight = false;
  let syncTimer = null;
  let lastSynced = 0;
  async function synchronize() {
    if (!active || inFlight) return;
    inFlight = true;
    lastSynced = Date.now();
    try {
      const result = await chrome.runtime.sendMessage({ type: 'sync', state: current() });
      if (result?.paired && Array.isArray(result.commands)) {
        for (const c of result.commands) void command(c).catch(() => {});
      }
    } catch { /* Service worker or PWA restarting. */ }
    finally { inFlight = false; }
  }
  function scheduleSync(delay=80) {
    if (!active || syncTimer) return;
    const elapsed = Date.now() - lastSynced;
    syncTimer = setTimeout(() => {
      syncTimer = null;
      if (!inFlight) void synchronize();
    }, Math.max(delay, 90 - elapsed));
  }
  // Independent one-shot long-poll. A command wakes this immediately instead
  // of waiting for the next periodic metadata update.
  async function listen() {
    const generation = ++listenerGeneration;
    while (active && generation === listenerGeneration) {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'listen' });
        if (!active || generation !== listenerGeneration) return;
        if (response?.paired && Array.isArray(response.commands)) {
          for (const c of response.commands) void command(c).catch(() => {});
          if (response.commands.length) continue;
          if (response.idle) await new Promise(resolve => setTimeout(resolve, 300));
        } else if (!response?.paired) {
          await new Promise(resolve => setTimeout(resolve, 750));
        }
      } catch {
        if (active) await new Promise(resolve => setTimeout(resolve, 750));
      }
    }
  }
  let clock = setInterval(synchronize, 800); // status fallback; browsers throttle idle tabs
  document.addEventListener('volumechange', () => scheduleSync(60), true);
  document.addEventListener('change', event => {
    if (event.target?.matches?.('#volume-slider, #expand-volume-slider')) scheduleSync(60);
  }, true);
  document.addEventListener('play', () => scheduleSync(60), true);
  document.addEventListener('pause', () => scheduleSync(60), true);
  document.addEventListener('ended', () => scheduleSync(60), true);
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => scheduleSync(120));
    const bar = document.querySelector('ytmusic-player-bar');
    if (bar) observer.observe(bar, { childList: true, subtree: true, attributes: true,
      attributeFilter: ['src', 'title', 'aria-label', 'style', 'aria-valuenow', 'aria-pressed', 'like-status'] });
    addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }
  addEventListener('pagehide', () => {
    active = false;
    listenerGeneration++;
    clearInterval(clock);
    clearTimeout(syncTimer);
    syncTimer = null;
  });
  // Back/forward cache and background-tab activation may resume a suspended page.
  addEventListener('pageshow', event => {
    if (event.persisted && !active) {
      active = true;
      clock = setInterval(synchronize, 800);
      void synchronize();
      void listen();
    }
  });
  addEventListener('focus', () => scheduleSync(20));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleSync(20);
  });
  void synchronize();
  void listen();
})();
