import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { checkVersions } from './version.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const plugin = join(root, 'streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin');
const extension = join(root, 'chrome-extension');
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const exists = async file => { await readFile(file); };
const pkg = await json(join(root, 'package.json'));
const lock = await json(join(root, 'package-lock.json'));
assert.equal(lock.version, pkg.version);
assert.equal(lock.packages[''].version, pkg.version);
const sd = await json(join(plugin, 'manifest.json'));
const chrome = await json(join(extension, 'manifest.json'));
assert.equal(sd.UUID + '.sdPlugin', relative(join(root, 'streamdeck'), plugin));
checkVersions(pkg.version, chrome, sd);
assert.equal(sd.Nodejs.Version, '24');
assert.equal(chrome.manifest_version, 3);
assert.equal(chrome.default_locale, 'en');
assert.deepEqual([...chrome.permissions].sort(), ['alarms', 'scripting', 'storage']);
assert.deepEqual([...chrome.host_permissions].sort(), ['http://127.0.0.1/*', 'https://music.youtube.com/*']);
assert.deepEqual(sd.OS, [{ Platform: 'windows', MinimumVersion: '10' }]);
await exists(join(plugin, sd.CodePath));
await exists(join(plugin, sd.PropertyInspectorPath));
const uuids = new Set();
for (const action of sd.Actions) {
  assert.ok(action.UUID.startsWith(sd.UUID + '.'));
  assert.ok(!uuids.has(action.UUID), `Duplicate action UUID: ${action.UUID}`);
  uuids.add(action.UUID);
  for (const icon of [action.Icon, ...action.States.map(state => state.Image)]) {
    await exists(join(plugin, icon + '.png'));
    await exists(join(plugin, icon + '@2x.png'));
  }
}
for (const icon of [sd.Icon, sd.CategoryIcon]) {
  await exists(join(plugin, icon + '.png'));
  await exists(join(plugin, icon + '@2x.png'));
}
for (const locale of ['en', 'ko']) {
  const labels = await json(join(plugin, locale + '.json'));
  for (const id of uuids) assert.ok(labels[id]?.Name, `${locale}: missing ${id}`);
}
const en = await json(join(extension, '_locales/en/messages.json'));
const ko = await json(join(extension, '_locales/ko/messages.json'));
assert.deepEqual(Object.keys(en).sort(), Object.keys(ko).sort());
for (const messages of [en, ko]) {
  for (const [key, value] of Object.entries(messages)) assert.ok(value.message?.trim(), `Empty translation: ${key}`);
}
for (const [, key] of JSON.stringify(chrome).matchAll(/__MSG_(\w+)__/g)) assert.ok(en[key], `Missing message: ${key}`);
for (const file of [chrome.background.service_worker, chrome.action.default_popup,
  'protocol.js',
  ...chrome.content_scripts.flatMap(script => script.js), ...Object.values(chrome.icons)]) {
  await exists(join(extension, file));
}

// Classic-worker modules are runtime resources even though the manifest names only the entry point.
const workerSource = await readFile(join(extension, chrome.background.service_worker), 'utf8');
for (const [, argumentsText] of workerSource.matchAll(/importScripts\(([\s\S]*?)\)/g)) {
  for (const [, file] of argumentsText.matchAll(/['"]([^'"]+)['"]/g)) await exists(join(extension, file));
}

// This is a basic accidental-secret check, not a replacement for GitHub secret scanning.
const skip = new Set(['.git', 'node_modules', 'dist', '.venv', '__pycache__', 'coverage']);
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const file = join(dir, entry.name);
    assert.ok(!entry.isSymbolicLink(), `Unexpected symbolic link: ${relative(root, file)}`);
    if (entry.isDirectory()) { await walk(file); continue; }
    const name = relative(root, file).replaceAll('\\', '/');
    assert.ok(!/(:Zone\.Identifier$|\.(pem|p12|pfx|key|crx|streamDeckPlugin)$|(^|\/)auth\.json$|(^|\/)\.env(?:\.|$))/.test(name), `Private or generated file: ${name}`);
    if (/\.(js|mjs|cjs)$/.test(name)) {
      const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
    }
    if (/\.(js|mjs|cjs|json|html|md|yml|py|txt)$/.test(name)) {
      const source = await readFile(file, 'utf8');
      if (name.endsWith('.json')) JSON.parse(source);
      assert.ok(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(source), `Private key: ${name}`);
      assert.ok(!/(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})/.test(source), `GitHub credential: ${name}`);
      assert.ok(!/"(?:bridgeToken|token)"\s*:\s*"[a-f0-9]{64}"/.test(source), `Persisted bridge token: ${name}`);
    }
  }
}
await walk(root);
console.log('Syntax, JSON, manifest resources, versions, locales and basic secret checks passed.');
