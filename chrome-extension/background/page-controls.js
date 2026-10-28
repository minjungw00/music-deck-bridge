'use strict';
(function (root) {
  // Runs in the page's MAIN world: Polymer slider properties belong to the site,
  // and are not visible through the content script's isolated DOM wrappers.
  function controlPlayerVolume(type, amount) {
    const bar = document.querySelector('ytmusic-player-bar');
    if (!bar) return false;
    if (type === 'mute') {
      const button = bar.querySelector('.volume, #expand-volume');
      if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return false;
      button.click();
      return true;
    }
    if (type !== 'volume_delta' || !Number.isFinite(amount)) return false;
    const sliders = [...bar.querySelectorAll('#volume-slider, #expand-volume-slider')];
    const slider = sliders.find(item => item.getClientRects().length) || sliders[0];
    if (!slider || slider.disabled) return false;
    const current = Number(slider.value);
    if (!Number.isFinite(current)) return false;
    const next = Math.max(0, Math.min(100, current + Math.max(-100, Math.min(100, amount))));
    // A slider's 5-point step would round away the dial's 1–4 point steps.
    for (const item of sliders) item.step = 1;
    slider.value = next;
    // Use the same handler as a mouse/keyboard change. The site owns its volume
    // curve, saved volume, mute state and both desktop/compact slider displays.
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  root.MusicDeckPageControls = Object.freeze({ playerPlayback: root.MusicDeckPlayerPlayback.run, controlPlayerVolume });
})(globalThis);
