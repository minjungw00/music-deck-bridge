import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from './helpers/content.mjs';

const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

function harness({ observe = true } = {}) {
  const events = new EventTarget(), document = new EventTarget();
  const intervals = new Map(), timeouts = new Map(), snapshots = [], observers = [];
  let nextId = 0, bar = {}, listens = 0;
  document.querySelectorAll = () => [];
  document.querySelector = selector => selector === 'ytmusic-player-bar' ? bar : null;
  const sandbox = {
    document, window: { matchMedia: () => ({ matches: false }) },
    location: { href: 'https://music.youtube.com/' }, navigator: {}, URL,
    addEventListener: events.addEventListener.bind(events),
    chrome: { runtime: { id: 'fixture-extension', onMessage: { addListener() {} },
      sendMessage(message) {
        if (message.type === 'listen') { listens++; return new Promise(() => {}); }
        assert.equal(message.type, 'sync'); snapshots.push(message.state);
        return Promise.resolve({ paired: true, commands: [] });
      } } },
    setInterval(run) { const id = ++nextId; intervals.set(id, run); return id; },
    clearInterval: id => intervals.delete(id),
    setTimeout(run) { const id = ++nextId; timeouts.set(id, run); return id; },
    clearTimeout: id => timeouts.delete(id),
  };
  if (observe) sandbox.MutationObserver = class {
    constructor(callback) { this.callback = callback; this.target = null; this.observations = 0; observers.push(this); }
    observe(target) { this.target = target; this.observations++; }
    disconnect() { this.target = null; }
  };
  loadContent(sandbox);
  return { intervals, timeouts, snapshots, observers,
    get listens() { return listens; }, get bar() { return bar; },
    replaceBar() { bar = {}; },
    mutate() { for (const observer of observers) if (observer.target === bar) observer.callback([]); },
    event(type, persisted = false) {
      const event = new Event(type); Object.defineProperty(event, 'persisted', { value: persisted });
      events.dispatchEvent(event);
    },
    async runTimeouts() {
      for (const [id, run] of [...timeouts]) { timeouts.delete(id); run(); }
      await flush();
    } };
}

test('each cached-page restoration restarts DOM observation and cancels suspended work', async () => {
  const h = harness(); await flush();
  assert.equal(h.snapshots.length, 1);
  assert.equal(h.observers.length, 1);
  for (let cycle = 1; cycle <= 2; cycle++) {
    h.mutate();
    assert.equal(h.timeouts.size, 1);
    h.event('pagehide');
    assert.equal(h.observers[0].target, null);
    assert.equal(h.intervals.size, 0);
    assert.equal(h.timeouts.size, 0, 'suspended metadata updates must be cancelled');
    const before = h.snapshots.length;
    h.replaceBar();
    h.event('pageshow', false); await flush();
    assert.equal(h.snapshots.length, before, 'ordinary pageshow must not resume a cached runtime');
    h.event('pageshow', true); await flush();
    assert.equal(h.observers[0].target, h.bar, 'observe the current player bar after restoration');
    assert.equal(h.observers[0].observations, cycle + 1);
    assert.equal(h.intervals.size, 1);
    assert.equal(h.listens, cycle + 1);
    assert.equal(h.snapshots.length, before + 1);
    h.event('pageshow', true); await flush();
    assert.equal(h.intervals.size, 1, 'duplicate pageshow must not create another clock');
    assert.equal(h.listens, cycle + 1);
    h.mutate(); await h.runTimeouts();
    assert.equal(h.snapshots.length, before + 2, 'DOM changes must still trigger a sync');
  }
  h.event('pagehide');
});

test('periodic synchronization resumes even when MutationObserver is unavailable', async () => {
  const h = harness({ observe: false }); await flush();
  h.event('pagehide');
  h.event('pageshow', true); await flush();
  assert.equal(h.intervals.size, 1);
  const before = h.snapshots.length;
  for (const run of h.intervals.values()) run();
  await flush();
  assert.equal(h.snapshots.length, before + 1);
  h.event('pagehide');
  assert.equal(h.intervals.size, 0);
});
