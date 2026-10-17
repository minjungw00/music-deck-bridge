import assert from 'node:assert/strict';
import test from 'node:test';
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkVersions, requireRelease, setVersion, versionInfo } from '../scripts/version.mjs';

test('development labels map to fixed platform numbers without build-driven increments', () => {
  assert.deepEqual(versionInfo('1.0.2-dev'), { version: '1.0.2-dev', numericVersion: '1.0.2',
    pluginVersion: '1.0.2.0', channel: 'development' });
  checkVersions('1.0.2-dev', { version: '1.0.2', version_name: '1.0.2-dev' }, { Version: '1.0.2.0' });
  assert.throws(() => checkVersions('1.0.2-dev', { version: '1.0.2' }, { Version: '1.0.2.0' }), /label development/);
  assert.throws(() => checkVersions('1.0.2', { version: '1.0.2', version_name: '1.0.2-dev' }, { Version: '1.0.2.0' }), /development label/);
  for (const bad of ['1.0', '01.0.2', '1.0.2.3', '1.0.2-beta', '1.0.2-dev.2', '65536.0.1', '0.0.0']) {
    assert.throws(() => versionInfo(bad), undefined, bad);
  }
});

test('release gates reject development versions and mismatched release tags', () => {
  assert.throws(() => requireRelease('1.0.2-dev', 'v1.0.2-dev'), /Development versions/);
  assert.throws(() => requireRelease('1.0.2', 'v1.0.3'), /must match/);
  assert.equal(requireRelease('1.0.2', 'v1.0.2').channel, 'release');
});

test('explicit development selection and promotion update every version source together', async t => {
  const root = await mkdtemp(join(tmpdir(), 'music-deck-versions-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const pluginPath = 'streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/manifest.json';
  const files = {
    'package.json': { version: '1.0.1', name: 'music-deck-bridge' },
    'package-lock.json': { version: '1.0.1', packages: { '': { version: '1.0.1' } } },
    'chrome-extension/manifest.json': { version: '1.0.1', permissions: ['storage'] },
    [pluginPath]: { Version: '1.0.1.0', UUID: 'io.github.minjungw00.musicdeckbridge' },
  };
  for (const [name, value] of Object.entries(files)) {
    await mkdir(dirname(join(root, name)), { recursive: true });
    await writeFile(join(root, name), JSON.stringify(value));
  }
  const json = async name => JSON.parse(await readFile(join(root, name), 'utf8'));
  await mkdir(join(root, 'scripts'));
  await copyFile(new URL('../scripts/version.mjs', import.meta.url), join(root, 'scripts/version.mjs'));
  const verifyTag = tag => spawnSync(process.execPath, [join(root, 'scripts/version.mjs'), 'verify-release-tag'],
    { encoding: 'utf8', env: { ...process.env, RELEASE_TAG: tag } });
  await setVersion(root, 'development', '1.0.2');
  assert.notEqual(verifyTag('v1.0.2-dev').status, 0);
  const devBytes = await Promise.all(Object.keys(files).map(name => readFile(join(root, name), 'utf8')));
  await setVersion(root, 'development', '1.0.2');
  assert.deepEqual(await Promise.all(Object.keys(files).map(name => readFile(join(root, name), 'utf8'))), devBytes);
  assert.equal((await json('package.json')).version, '1.0.2-dev');
  assert.equal((await json('package-lock.json')).packages[''].version, '1.0.2-dev');
  await assert.rejects(setVersion(root, 'release', '1.0.3'), /without changing/);
  assert.equal((await json('package.json')).version, '1.0.2-dev');
  await setVersion(root, 'release', '1.0.2');
  const chrome = await json('chrome-extension/manifest.json');
  const plugin = await json(pluginPath);
  checkVersions('1.0.2', chrome, plugin);
  assert.equal(verifyTag('v1.0.2').status, 0);
  assert.notEqual(verifyTag('v1.0.3').status, 0);
  assert.ok(!('version_name' in chrome));
  assert.equal(plugin.UUID, files[pluginPath].UUID);
  assert.deepEqual(chrome.permissions, ['storage']);
});
