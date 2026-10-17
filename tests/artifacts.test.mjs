import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildInfo, packageNames, prepareDevelopment, prepareRelease, verifyRelease } from '../scripts/artifacts.mjs';

const version = '0.5.1';
const env = {
  GITHUB_SHA: 'a'.repeat(40), GITHUB_REF: 'refs/heads/main',
  GITHUB_REPOSITORY: 'owner/repo', GITHUB_RUN_ID: '123',
  GITHUB_SERVER_URL: 'https://github.com', GITHUB_RUN_ATTEMPT: '2',
  GITHUB_EVENT_NAME: 'push', RUNNER_OS: 'Windows', RUNNER_ARCH: 'X64',
};

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'music-deck-artifacts-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const name of packageNames(version)) await writeFile(join(directory, name), `payload: ${name}`);
  return directory;
}

test('development artifact records exact source and hashes the delivered files', async t => {
  const directory = await fixture(t);
  const summary = join(tmpdir(), `music-deck-summary-${directory.split(/[\\/]/).at(-1)}.md`);
  t.after(() => rm(summary, { force: true }));
  await prepareDevelopment(directory, version, { ...env, GITHUB_STEP_SUMMARY: summary });
  const info = JSON.parse(await readFile(join(directory, 'BUILD-INFO.json'), 'utf8'));
  assert.deepEqual(info, {
    version, commit: env.GITHUB_SHA, ref: env.GITHUB_REF, event: 'push',
    platform: 'Windows', architecture: 'X64',
    runUrl: 'https://github.com/owner/repo/actions/runs/123', runAttempt: '2',
  });
  const lines = (await readFile(join(directory, 'SHA256SUMS.txt'), 'utf8')).trim().split('\n');
  assert.equal(lines.length, 3);
  for (const line of lines) {
    const [digest, name] = line.split('  ');
    assert.equal(digest, createHash('sha256').update(await readFile(join(directory, name))).digest('hex'));
  }
  assert.match(await readFile(summary, 'utf8'), /both OS jobs passed/);
  // Regeneration is deterministic, including on a retried workflow run.
  const original = await readFile(join(directory, 'SHA256SUMS.txt'), 'utf8');
  await prepareDevelopment(directory, version, env);
  assert.equal(await readFile(join(directory, 'SHA256SUMS.txt'), 'utf8'), original);
});

test('PR build metadata keeps the merge ref distinct from main', () => {
  const info = buildInfo(version, { ...env, GITHUB_REF: 'refs/pull/42/merge', GITHUB_EVENT_NAME: 'pull_request' });
  assert.equal(info.ref, 'refs/pull/42/merge');
  assert.equal(info.event, 'pull_request');
  assert.throws(() => buildInfo(version, { ...env, GITHUB_SHA: 'short' }), /full GitHub commit/);
});

test('artifact generation fails for a missing or empty package and unexpected files', async t => {
  const directory = await fixture(t);
  const plugin = join(directory, packageNames(version)[0]);
  await rm(plugin);
  await assert.rejects(prepareDevelopment(directory, version, env), /ENOENT/);
  await writeFile(plugin, '');
  await assert.rejects(prepareDevelopment(directory, version, env), /empty artifact/);
  await writeFile(plugin, 'plugin');
  await writeFile(join(directory, 'music-deck-bridge-chrome-0.4.0.zip'), 'stale package');
  await assert.rejects(prepareDevelopment(directory, version, env), /Unexpected artifact/);
});

test('release checksums survive transfer and reject a corrupted asset', async t => {
  const directory = await fixture(t);
  await prepareRelease(directory, version);
  const downloaded = await mkdtemp(join(tmpdir(), 'music-deck-download-'));
  t.after(() => rm(downloaded, { recursive: true, force: true }));
  for (const name of [...packageNames(version), 'SHA256SUMS.txt']) {
    await copyFile(join(directory, name), join(downloaded, name));
  }
  await verifyRelease(downloaded, version);
  const sums = await readFile(join(directory, 'SHA256SUMS.txt'), 'utf8');
  assert.equal(sums.trim().split('\n').length, 2);
  await writeFile(join(downloaded, packageNames(version)[0]), 'corrupted download');
  await assert.rejects(verifyRelease(downloaded, version), /checksums or asset names/);
});

test('release verification rejects missing assets and malformed checksum inventories', async t => {
  const directory = await fixture(t);
  await prepareRelease(directory, version);
  const sumsFile = join(directory, 'SHA256SUMS.txt');
  const sums = await readFile(sumsFile, 'utf8');
  for (const invalid of ['', sums.split('\n')[0] + '\n', sums + sums, sums.replace('  music-', '  ../music-')]) {
    await writeFile(sumsFile, invalid);
    await assert.rejects(verifyRelease(directory, version), /checksums or asset names/);
  }
  await writeFile(sumsFile, sums);
  await rm(join(directory, packageNames(version)[1]));
  await assert.rejects(verifyRelease(directory, version), /ENOENT/);
});

test('release preparation refuses stale versions, development metadata and empty packages', async t => {
  const directory = await fixture(t);
  await assert.rejects(prepareRelease(directory, '0.5.2'), /Unexpected artifact/);
  await prepareDevelopment(directory, version, env);
  await assert.rejects(prepareRelease(directory, version), /Unexpected artifact: BUILD-INFO/);
  await rm(join(directory, 'BUILD-INFO.json'));
  await writeFile(join(directory, packageNames(version)[1]), '');
  await assert.rejects(prepareRelease(directory, version), /empty artifact/);
});
