import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

function harness({ observe = async () => [] } = {}) {
  const context = vm.createContext({});
  vm.runInContext(readFileSync(new URL('../chrome-extension/background/player-sync-service.js', import.meta.url), 'utf8'), context);
  const requests = [], applied = [];
  let present = false;
  const players = context.MusicDeckPlayerSyncService.create({
    chrome: { scripting: { executeScript: observe } },
    client: { pairedToken: async () => 'fixture-token', blocked: () => false,
      post(route, body) {
        if (route === '/sync') {
          const pending = deferred();
          requests.push(pending);
          return pending.promise.then(() => {
            present = true; applied.push(body.state.title); return { commands: [] };
          });
        }
        assert.equal(route, '/player-closed');
        present = false; applied.push('closed');
        return Promise.resolve({ ok: true });
      } },
    browserChannel: { start() {} }, pageControls: { playerPlayback() {} },
  });
  return { players, requests, applied, get present() { return present; },
    sync: title => players.synchronize('sync', { title }, { tab: { id: 7 }, frameId: 0 }) };
}

test('tab closure waits for every overlapping sync, even when the latest request finishes first', async () => {
  const h = harness();
  const older = h.sync('older'), newer = h.sync('newer');
  await flush();
  h.players.onRemoved(7);
  h.requests[1].resolve(); await newer; await flush();
  assert.deepEqual(h.applied, ['newer'], 'closure must still wait for the older request');
  h.requests[0].resolve(); await older; await flush();
  assert.deepEqual(h.applied, ['newer', 'older', 'closed']);
  assert.equal(h.present, false);
  await h.sync('after-close');
  assert.equal(h.requests.length, 2, 'a closed tab cannot submit another snapshot');
});

test('a failed sync does not release closure while another sync is pending', async () => {
  const h = harness();
  const older = h.sync('older'), newer = h.sync('newer');
  const rejected = assert.rejects(newer, /fixture failure/);
  await flush();
  h.players.onRemoved(7);
  h.requests[1].reject(new Error('fixture failure')); await rejected; await flush();
  assert.deepEqual(h.applied, []);
  h.requests[0].resolve(); await older; await flush();
  assert.deepEqual(h.applied, ['older', 'closed']);
  assert.equal(h.present, false);
});

test('a snapshot still being observed when its tab closes is never posted', async () => {
  const observation = deferred();
  const h = harness({ observe: () => observation.promise });
  const sync = h.sync('navigating');
  await flush();
  h.players.onRemoved(7); await flush();
  observation.resolve([]); await sync;
  assert.deepEqual(h.applied, ['closed']);
  assert.equal(h.requests.length, 0);
});
