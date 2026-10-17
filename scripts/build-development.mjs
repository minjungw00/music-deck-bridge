import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { localBuildInfo, prepareLocal } from './artifacts.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const source = { commit: git(['rev-parse', 'HEAD']), ref: git(['rev-parse', '--symbolic-full-name', 'HEAD']),
  dirty: Boolean(git(['status', '--porcelain', '--untracked-files=normal'])),
  platform: process.platform, architecture: process.arch, builtAt: new Date().toISOString() };
const info = localBuildInfo(version, source);
const output = join(root, 'dist', 'development', info.buildId);
for (const component of ['chrome', 'streamdeck']) {
  const result = spawnSync(process.execPath, [join(root, 'scripts/package.mjs'), component, '--output', output],
    { cwd: root, stdio: 'inherit' });
  assert.equal(result.status, 0, `Development ${component} packaging failed`);
}
await prepareLocal(output, version, source);
console.log(`Development build: ${info.buildId}\nPackages: ${output}`);
