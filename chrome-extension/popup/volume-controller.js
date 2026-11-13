'use strict';
(function (root) {
  const identity = player => player ? JSON.stringify([player.id, player.key]) : '';
  // Own absolute slider edits separately from polling and connection settings.
  // Queue only the latest target, bound to the route/track visible when edited.
  function create({ slider, label, execute, onChange, now = Date.now }) {
    let player = null, editing = false, revision = 0, deadline = Infinity;
    let queued = null, sending = false, closed = false;
    function observe(next) {
      if (identity(player) !== identity(next)) { revision++; editing = false; queued = null; }
      player = next;
      if (editing && !queued && !sending && Number(slider.value) === player?.volume) editing = false;
    }
    function render(disabled) {
      slider.disabled = disabled;
      if (disabled || now() > deadline) { editing = false; queued = null; }
      if (!editing) {
        slider.value = String(player?.volume ?? 0);
        label.textContent = Number.isFinite(player?.volume) ? `${player.volume}%` : '—';
      }
    }
    async function flush() {
      sending = true;
      try {
        while (queued && !closed) {
          const intent = queued; queued = null;
          if (identity(intent.player) !== identity(player)) continue;
          const result = await execute('volume_set', intent.player, { amount: intent.amount });
          if (intent.revision === revision && !queued) {
            if (!result?.ok) editing = false;
            deadline = now() + 3000;
          }
        }
      } finally { sending = false; onChange(); }
    }
    slider.addEventListener('input', () => {
      if (slider.disabled || closed) return;
      editing = true; revision++; deadline = Infinity;
      label.textContent = `${slider.value}%`;
    });
    slider.addEventListener('change', () => {
      const amount = Number(slider.value);
      if (slider.disabled || !player || closed || !Number.isInteger(amount) || amount < 0 || amount > 100) return;
      editing = true;
      queued = { player, amount, revision };
      if (!sending) void flush();
    });
    return { observe, render, close() { closed = true; queued = null; },
      get editing() { return editing; }, get sending() { return sending; } };
  }
  root.MusicDeckPopupVolume = Object.freeze({ create });
})(globalThis);
