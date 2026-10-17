import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function versionInfo(version) {
  assert.equal(typeof version, 'string', 'Version must be a string');
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-dev)?$/.exec(version);
  assert.ok(match, 'Expected X.Y.Z or X.Y.Z-dev');
  const parts = match.slice(1, 4).map(Number);
  assert.ok(parts.every(part => part <= 65535) && parts.some(Boolean), 'Version parts must fit platform limits');
  const numericVersion = parts.join('.');
  return { version, numericVersion, pluginVersion: numericVersion + '.0',
    channel: match[4] ? 'development' : 'release' };
}

export function requireRelease(version, tag) {
  const info = versionInfo(version);
  assert.equal(info.channel, 'release', 'Development versions cannot create release assets or tags');
  if (tag !== undefined) assert.equal(tag, 'v' + version, 'Release tag must match the stable source version');
  return info;
}

export function checkVersions(version, chrome, plugin) {
  const info = versionInfo(version);
  assert.equal(chrome.version, info.numericVersion, 'Chrome numeric version does not match source');
  assert.equal(plugin.Version, info.pluginVersion, 'Stream Deck version does not match source');
  if (info.channel === 'development') assert.equal(chrome.version_name, version, 'Chrome must label development builds');
  else assert.ok(chrome.version_name === undefined || chrome.version_name === version, 'Release has a development label');
  return info;
}

export async function setVersion(root, mode, target) {
  const paths = ['package.json', 'package-lock.json', 'chrome-extension/manifest.json',
    'streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/manifest.json'];
  const files = await Promise.all(paths.map(async name => JSON.parse(await readFile(join(root, name), 'utf8'))));
  const [pkg, lock, chrome, plugin] = files;
  const base = requireRelease(target).numericVersion;
  assert.ok(['development', 'release'].includes(mode), 'Unknown version mode');
  if (mode === 'release') {
    const current = versionInfo(pkg.version);
    assert.equal(current.channel, 'development', 'Promote a development cycle explicitly');
    assert.equal(current.numericVersion, base, 'Promote the current cycle without changing its target version');
  }
  const version = mode === 'development' ? base + '-dev' : base;
  const info = versionInfo(version);
  pkg.version = lock.version = lock.packages[''].version = version;
  chrome.version = info.numericVersion;
  if (mode === 'development') chrome.version_name = version;
  else delete chrome.version_name;
  plugin.Version = info.pluginVersion;
  for (let i = 0; i < paths.length; i++) await writeFile(join(root, paths[i]), JSON.stringify(files[i], null, 2) + '\n');
  return info;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const [operation, target] = process.argv.slice(2);
  if (operation === 'verify-release-tag') {
    assert.equal(typeof process.env.RELEASE_TAG, 'string', 'RELEASE_TAG is required');
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    const chrome = JSON.parse(await readFile(join(root, 'chrome-extension/manifest.json'), 'utf8'));
    const plugin = JSON.parse(await readFile(join(root, 'streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/manifest.json'), 'utf8'));
    requireRelease(pkg.version, process.env.RELEASE_TAG);
    checkVersions(pkg.version, chrome, plugin);
    console.log('Stable release version and tag verified.');
  } else {
    assert.ok(['development', 'release'].includes(operation), 'Usage: version.mjs development|release X.Y.Z, or verify-release-tag');
    const info = await setVersion(root, operation, target);
    console.log(`Source version: ${info.version}; Chrome: ${info.numericVersion}; Stream Deck: ${info.pluginVersion}`);
  }
}
