import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const background = readFileSync(new URL('../../chrome-extension/background.js', import.meta.url), 'utf8');
export const musicSender = { tab: { id: 55 }, frameId: 0, url: 'https://music.youtube.com/' };

// Model the two site sliders and a deliberately nonlinear audio volume curve.
// The isolated content script only sees shared DOM attributes, not page properties.
export function playerHarness({ compact = false, available = true, delay = 0 } = {}) {
  const audio = { readyState: 4, paused: false, ended: false, muted: false, volume: 0.25, duration: 120 };
  const state = { savedVolume: 50, changes: [], muteClicks: 0 };
  const sliders = ['volume-slider', 'expand-volume-slider'].map((id, index) => ({
    id, step: 5, disabled: false, _value: 50,
    get value() { return this._value; },
    set value(value) { this._value = Math.max(0, Math.min(100, Math.round(Number(value) / this.step) * this.step)); },
    getClientRects() { return (index === (compact ? 1 : 0)) ? [{}] : []; },
    dispatchEvent(event) {
      if (event.type !== 'change') throw new Error('The site expects a slider change');
      state.changes.push(this.value);
      setSiteVolume(this.value);
      return true;
    },
  }));
  function setSiteVolume(value) {
    state.savedVolume = value;
    audio.volume = (value / 100) ** 2;
    audio.muted = value === 0;
    for (const slider of sliders) slider._value = value;
  }
  const button = {
    getAttribute() { return null; },
    click() {
      state.muteClicks++;
      audio.muted = !audio.muted;
      for (const slider of sliders) slider._value = audio.muted ? 0 : state.savedVolume;
    },
  };
  const bar = {
    querySelector: selector => selector === '.volume, #expand-volume' ? button : null,
    querySelectorAll: selector => available && selector === '#volume-slider, #expand-volume-slider' ? sliders : [],
  };
  const page = { document: { querySelector: selector => available && selector === 'ytmusic-player-bar' ? bar : null }, Event };
  const scriptCalls = [];
  let listener;
  const chrome = {
    storage: { local: { setAccessLevel: async () => {} } },
    runtime: {
      onMessage: { addListener(fn) { listener = fn; } },
      onInstalled: { addListener() {} }, onStartup: { addListener() {} },
    },
    alarms: { onAlarm: { addListener() {} } },
    scripting: { async executeScript(options) {
      scriptCalls.push(options);
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      const result = vm.runInNewContext(`(${options.func.toString()})(...args)`, { ...page, args: options.args });
      return [{ result }];
    } },
  };
  vm.runInNewContext(background, { chrome });
  return {
    audio, sliders, state, scriptCalls, setSiteVolume,
    contentSliders: available ? sliders.map(slider => ({
      getAttribute: name => name === 'aria-valuenow' ? String(slider.value) : null,
      getClientRects: () => slider.getClientRects(),
      matches: () => true,
    })) : [],
    send: (message, sender = musicSender) => new Promise(resolve => listener(message, sender, resolve)),
  };
}
