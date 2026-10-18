import test from 'node:test';
import assert from 'node:assert/strict';
import { createPortService } from '../streamdeck/src/application/port-service.cjs';

function harness({ delayStartup = false } = {}) {
  const bound = new Set(), timers = new Map(), calls = [], saved = [];
  let resolveStartup, rejectStartup, failSave = false;
  const ports = createPortService({ initialPort: 17864, log() {}, notifyPortChange() {},
    savePort(port) {
      if (failSave) throw new Error('fixture persistence failure');
      saved.push(port);
    },
    bindPort(port) {
      calls.push(port);
      if (bound.has(port)) return Promise.reject(Object.assign(new Error('occupied'), { code: 'EADDRINUSE' }));
      const server = { close() { bound.delete(port); } };
      if (delayStartup && port === 17864 && calls.length === 1) {
        return new Promise((resolve, reject) => {
          resolveStartup = () => { bound.add(port); resolve(server); };
          rejectStartup = () => reject(Object.assign(new Error('occupied'), { code: 'EADDRINUSE' }));
        });
      }
      bound.add(port);
      return Promise.resolve(server);
    },
    setTimeout(run, delay) { const timer = { unref() {} }; timers.set(timer, { run, delay }); return timer; },
    clearTimeout(timer) { timers.delete(timer); },
  });
  return { ports, bound, calls, saved,
    resolveStartup: () => resolveStartup(), rejectStartup: () => rejectStartup(),
    failSave(value) { failSave = value; },
    expireGrace() {
      for (const [timer, { run, delay }] of [...timers]) {
        assert.equal(delay, 120000);
        timers.delete(timer); run();
      }
    } };
}
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

test('port changes wait for startup and retire the correct listeners before reverting', async () => {
  const h = harness({ delayStartup: true });
  const startup = h.ports.start();
  const first = h.ports.change(17865), second = h.ports.change(17866);
  await flush();
  assert.deepEqual(h.calls, [17864], 'no change may bind while startup is pending');
  h.resolveStartup(); await startup;
  assert.equal((await first).port, 17865);
  assert.equal((await second).port, 17866);
  assert.equal(h.ports.port, 17866);
  h.expireGrace();
  assert.deepEqual([...h.bound], [17866]);
  assert.equal((await h.ports.change(17865)).ok, true);
  assert.equal(h.ports.port, 17865);
});

test('a failed initial bind does not prevent a queued port change from recovering', async () => {
  const h = harness({ delayStartup: true });
  const startup = h.ports.start(), change = h.ports.change(17865);
  await flush(); h.rejectStartup(); await startup;
  assert.equal((await change).ok, true);
  assert.equal(h.ports.online, true);
  assert.equal(h.ports.error, '');
  assert.deepEqual([...h.bound], [17865]);
});

test('repeated starts reuse the active listener, including after a port change', async () => {
  const h = harness();
  await Promise.all([h.ports.start(), h.ports.start()]);
  await h.ports.change(17865);
  await h.ports.start();
  assert.deepEqual(h.calls, [17864, 17865]);
  assert.equal(h.ports.online, true);
  assert.equal(h.ports.error, '');
});

test('failed persistence preserves the active listener and restores a reused listener grace period', async () => {
  const h = harness();
  await h.ports.start();
  h.failSave(true);
  assert.equal((await h.ports.change(17865)).ok, false);
  assert.equal(h.ports.port, 17864);
  assert.deepEqual([...h.bound], [17864], 'a newly bound listener must close when saving fails');
  h.failSave(false);
  await h.ports.change(17865);
  h.failSave(true);
  assert.equal((await h.ports.change(17864)).ok, false);
  assert.equal(h.ports.port, 17865);
  h.expireGrace();
  assert.deepEqual([...h.bound], [17865], 'a failed revert must keep the current listener alive');
  h.failSave(false);
  assert.equal((await h.ports.change(17866)).ok, true);
  assert.deepEqual(h.saved, [17865, 17866]);
});
