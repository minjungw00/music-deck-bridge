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
  const requests = [], applied = [], saved = [];
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
    lastPlayer: { observe(_tab, state, provisional) { saved.push([state.title, provisional === true]); },
      remove(id) { saved.push(['removed', id]); } },
  });
  return { players, requests, applied, saved, get present() { return present; },
    sync: (title, fields) => players.synchronize('sync', { title, ...fields }, { tab: { id: 7 }, frameId: 0 }) };
}

test('a failed publication does not prevent a queued confirmed snapshot from being applied before closure', async () => {
  const h = harness();
  const older = h.sync('older', { trackConfirmed: true });
  await flush();
  const newer = h.sync('newer', { trackConfirmed: true });
  const rejected = assert.rejects(older, /fixture failure/);
  await flush();
  h.players.onRemoved(7);
  h.requests[0].reject(new Error('fixture failure')); await rejected; await flush();
  assert.deepEqual(h.applied, []);
  h.requests[1].resolve(); await newer; await flush();
  assert.deepEqual(h.applied, ['newer', 'closed']);
  assert.equal(h.present, false);
});

test('a snapshot still being observed when its tab closes is never posted', async () => {
  const observation = deferred();
  const h = harness({ observe: () => observation.promise });
  const sync = h.sync('navigating');
  await flush();
  h.players.onRemoved(7); await flush();
  assert.deepEqual(h.applied, []);
  observation.resolve([]); await sync;
  await flush();
  assert.deepEqual(h.applied, ['closed']);
  assert.equal(h.requests.length, 0);
});

test('a restored, paused player title captured before closing is still forwarded and saved', async () => {
  const observation = deferred();
  const h = harness({ observe: () => observation.promise });
  const sync = h.sync('Restored selection', { trackConfirmed: true, playing: false });
  await flush();
  h.players.onRemoved(7);
  assert.deepEqual(h.saved, [['Restored selection', true], ['removed', 7]], 'local selection is removed immediately');
  observation.reject(new Error('tab closed'));
  await flush();
  h.requests[0].resolve(); await sync; await flush();
  assert.deepEqual(h.applied, ['Restored selection', 'closed']);
  assert.deepEqual(h.saved, [['Restored selection', true], ['removed', 7]], 'closed tabs cannot repopulate the local registry');
});

test('an older confirmed title still being enriched cannot replace a newer selection', async () => {
  const first = deferred();
  let calls = 0;
  const h = harness({ observe: async () => ++calls === 1 ? first.promise : [] });
  const old = h.sync('Prior selection', { trackConfirmed: true });
  await flush();
  const recent = h.sync('Restored selection', { trackConfirmed: true });
  await flush();
  h.requests[0].resolve(); await recent;
  first.resolve([]); await old;
  assert.deepEqual(h.applied, ['Restored selection']);
});

test('the final confirmed selection is applied after an earlier publication in the same tab', async () => {
  const h = harness();
  const old = h.sync('Earlier song', { trackConfirmed: true });
  await flush();
  const recent = h.sync('Final song', { trackConfirmed: true });
  await flush();
  h.players.onRemoved(7);
  assert.equal(h.requests.length, 1, 'a later publication must wait for the request already in flight');
  h.requests[0].resolve(); await old; await flush();
  assert.equal(h.requests.length, 2);
  h.requests[1].resolve(); await recent; await flush();
  assert.deepEqual(h.applied, ['Earlier song', 'Final song', 'closed']);
  assert.equal(h.present, false);
  await h.sync('after-close');
  assert.equal(h.requests.length, 2, 'a closed tab cannot submit another snapshot');
});
