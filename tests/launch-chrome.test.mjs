import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { join } from 'node:path';
import { createRequire } from 'node:module';
const { launchChrome } = createRequire(import.meta.url)('../streamdeck/src/launch-chrome.cjs');

for (const root of ['LOCALAPPDATA', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMW6432']) {
  test(`launches Chrome from ${root} with only the fixed music URL and no shell`, async () => {
    const executable = join('/Chrome installation with spaces', 'Google', 'Chrome', 'Application', 'chrome.exe');
    let launched, unref = false;
    await launchChrome({ platform: 'win32', env: { [root]: '/Chrome installation with spaces' },
      exists: path => path === executable,
      spawnProcess: (...args) => {
        launched = args;
        const child = new EventEmitter();
        child.unref = () => { unref = true; };
        queueMicrotask(() => child.emit('spawn'));
        return child;
      } });
    assert.deepEqual(launched, [executable, ['https://music.youtube.com/'],
      { detached: true, stdio: 'ignore', shell: false }]);
    assert.equal(unref, true);
  });
}

test('missing Chrome and process launch errors are reported without a default-browser fallback', async () => {
  await assert.rejects(launchChrome({ platform: 'win32', env: {}, exists: () => false }), /not found/);
  await assert.rejects(launchChrome({ platform: 'linux' }), /Windows/);
  await assert.rejects(launchChrome({ platform: 'win32', env: { PROGRAMFILES: '/programs' }, exists: () => true,
    spawnProcess: () => {
      const child = new EventEmitter();
      queueMicrotask(() => child.emit('error', Error('Permission denied')));
      return child;
    } }), /Permission denied/);
});

test('paired startup wakes Chrome without racing the extension to create a music tab', async () => {
  let args;
  await launchChrome({ openMusic: false, platform: 'win32', env: { PROGRAMFILES: '/programs' },
    exists: () => true, spawnProcess: (_executable, argv) => {
      args = argv;
      const child = new EventEmitter(); child.unref = () => {};
      queueMicrotask(() => child.emit('spawn')); return child;
    } });
  assert.deepEqual(args, []);
});
