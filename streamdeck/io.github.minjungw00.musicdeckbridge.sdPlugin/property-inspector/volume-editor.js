'use strict';
(function (root) {
  function validVolume(value) {
    const v = Number(value);
    return Number.isInteger(v) && v >= 1 && v <= 5 ? v : null;
  }
  function createVolumeEditor({ onValue, onPreview, onSave }) {
    let settings = {}, latest = 4, touched = false, committed = false;
    function input(raw) {
      const value = validVolume(raw);
      if (value === null) return;
      latest = value;
      touched = true;
      committed = false;
      onValue(value);
      onPreview(value);
    }
    return {
      input,
      get settings() { return { ...settings }; },
      receive(incoming) {
        if (!incoming || typeof incoming !== 'object') return;
        const received = validVolume(incoming.volumeStep);
        settings = { ...settings, ...incoming };
        if (touched) {
          // Delayed host notifications must not replace the visible edit.
          settings.volumeStep = latest;
          if (received === latest && committed) touched = false;
        } else if (received !== null) {
          latest = received;
          onValue(received);
        }
      },
      change(raw) {
        const value = validVolume(raw);
        if (value === null) return;
        if (!touched || latest !== value) input(value);
        committed = true;
        settings = { ...settings, volumeStep: value };
        onSave({ ...settings });
      },
    };
  }
  root.MusicDeckVolumeEditor = Object.freeze({ validVolume, createVolumeEditor });
})(globalThis);
