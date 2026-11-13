'use strict';
(function (root) {
  function validVolume(value) {
    const v = Number(value);
    return Number.isInteger(v) && v >= 1 && v <= 5 ? v : null;
  }
  function validDuration(value) {
    if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') return null;
    const v = Number(value);
    return Number.isFinite(v) && v >= 0 && v <= 3 ? Math.round(v * 10) / 10 : null;
  }
  function createVolumeEditor({ onValue, onPreview, onSave, onDurationValue = () => {}, onDurationPreview = () => {} }) {
    let settings = {};
    const fields = {
      volumeStep: { validate: validVolume, latest: 4, onValue, onPreview },
      volumeFeedbackSeconds: { validate: validDuration, latest: 2, onValue: onDurationValue, onPreview: onDurationPreview },
    };
    function input(name, raw) {
      const field = fields[name], value = field.validate(raw);
      if (value === null) return;
      field.latest = value;
      field.touched = true;
      field.committed = false;
      settings[name] = value;
      field.onValue(value);
      field.onPreview(value);
    }
    function change(name, raw) {
      const field = fields[name], value = field.validate(raw);
      if (value === null) return;
      if (!field.touched || field.latest !== value) input(name, value);
      field.committed = true;
      settings[name] = value;
      onSave({ ...settings });
    }
    return {
      input: raw => input('volumeStep', raw),
      change: raw => change('volumeStep', raw),
      durationInput: raw => input('volumeFeedbackSeconds', raw),
      durationChange: raw => change('volumeFeedbackSeconds', raw),
      get settings() { return { ...settings }; },
      receive(incoming) {
        if (!incoming || typeof incoming !== 'object') return;
        settings = { ...settings, ...incoming };
        for (const [name, field] of Object.entries(fields)) {
          const received = field.validate(incoming[name]);
          if (field.touched) {
            // Each range retains its own edit through delayed host notifications.
            settings[name] = field.latest;
            if (received === field.latest && field.committed) field.touched = false;
          } else if (received !== null) {
            field.latest = received;
            field.onValue(received);
          }
        }
      },
    };
  }
  root.MusicDeckVolumeEditor = Object.freeze({ validVolume, validDuration, createVolumeEditor });
})(globalThis);
