import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { appendFile, lstat, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireRelease, versionInfo } from './version.mjs';

export function packageNames(version) {
  versionInfo(version);
  return [
    'io.github.minjungw00.musicdeckbridge.streamDeckPlugin',
    `music-deck-bridge-chrome-${version}.zip`,
  ];
}

// Only the two packages and known metadata may leave the staging directory.
async function inspect(directory, names) {
  const allowed = new Set([...names, 'SHA256SUMS.txt']);
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'staging' && entry.isDirectory()) continue;
    assert.ok(entry.isFile() && allowed.has(entry.name), `Unexpected artifact: ${entry.name}`);
  }
}

async function checksum(directory, name) {
  const file = join(directory, name);
  const stat = await lstat(file);
  assert.ok(stat.isFile() && stat.size > 0, `Missing or empty artifact: ${name}`);
  return `${createHash('sha256').update(await readFile(file)).digest('hex')}  ${name}\n`;
}

export function buildInfo(version, env) {
  assert.match(env.GITHUB_SHA ?? '', /^[a-f0-9]{40}$/i, 'Expected a full GitHub commit SHA');
  for (const key of ['GITHUB_REF', 'GITHUB_REPOSITORY', 'GITHUB_RUN_ID', 'RUNNER_OS']) {
    assert.ok(env[key], `Missing ${key}`);
  }
  return {
    version,
    channel: 'development',
    packageVersion: versionInfo(version).numericVersion,
    buildId: `${version}+g${env.GITHUB_SHA.slice(0, 12)}.run${env.GITHUB_RUN_ID}.attempt${env.GITHUB_RUN_ATTEMPT || '1'}`,
    commit: env.GITHUB_SHA,
    ref: env.GITHUB_REF,
    event: env.GITHUB_EVENT_NAME,
    platform: env.RUNNER_OS,
    architecture: env.RUNNER_ARCH,
    runUrl: `${env.GITHUB_SERVER_URL || 'https://github.com'}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`,
    runAttempt: env.GITHUB_RUN_ATTEMPT,
  };
}

async function prepareBuild(directory, version, info) {
  const names = packageNames(version);
  await inspect(directory, [...names, 'BUILD-INFO.json']);
  // Check both packages before writing metadata or checksums.
  const sums = await Promise.all(names.map(name => checksum(directory, name)));
  await writeFile(join(directory, 'BUILD-INFO.json'), JSON.stringify(info, null, 2) + '\n');
  sums.push(await checksum(directory, 'BUILD-INFO.json'));
  await writeFile(join(directory, 'SHA256SUMS.txt'), sums.join(''));
}

export function localBuildInfo(version, source) {
  assert.equal(versionInfo(version).channel, 'development', 'Local development packages require an X.Y.Z-dev source');
  assert.match(source.commit ?? '', /^[a-f0-9]{40}$/i, 'Expected a full local commit SHA');
  assert.equal(typeof source.dirty, 'boolean', 'Record whether local changes are present');
  assert.ok(source.ref && source.platform && source.architecture, 'Missing local source/platform information');
  const builtAt = new Date(source.builtAt).toISOString();
  return { version, channel: 'development', packageVersion: versionInfo(version).numericVersion,
    buildId: `${version}+g${source.commit.slice(0, 12)}.local${builtAt.replace(/\D/g, '')}${source.dirty ? '.dirty' : ''}`,
    commit: source.commit, ref: source.ref, dirty: source.dirty,
    platform: source.platform, architecture: source.architecture, builtAt, runUrl: null };
}

export async function prepareLocal(directory, version, source) {
  const info = localBuildInfo(version, source);
  await prepareBuild(directory, version, info);
  return info;
}

export async function prepareDevelopment(directory, version, env) {
  const info = buildInfo(version, env);
  await prepareBuild(directory, version, info);
  if (env.GITHUB_STEP_SUMMARY) {
    await appendFile(env.GITHUB_STEP_SUMMARY, [
      `### Development packages (${info.platform})`,
      '',
      `Commit: \`${info.commit}\`; ref: \`${info.ref}\`; version: \`${info.version}\`.`,
      '',
      `Source run: ${info.runUrl} (attempt ${info.runAttempt}).`,
      '',
      'Windows users: choose the Windows artifact from a successful main CI run with both OS jobs passed.',
      'Development packages may be unstable and expire. Extract the artifact ZIP and then the inner Chrome ZIP.',
      'BUILD-INFO.json records the source; SHA256SUMS.txt covers both packages and that metadata.',
      '',
    ].join('\n'));
  }
}

export async function prepareRelease(directory, version) {
  requireRelease(version);
  const names = packageNames(version);
  await inspect(directory, names);
  const sums = await Promise.all(names.map(name => checksum(directory, name)));
  await writeFile(join(directory, 'SHA256SUMS.txt'), sums.join(''));
  await verifyRelease(directory, version);
}

export async function verifyRelease(directory, version) {
  requireRelease(version);
  const names = packageNames(version);
  await inspect(directory, names);
  const expected = (await Promise.all(names.map(name => checksum(directory, name)))).join('');
  const actual = await readFile(join(directory, 'SHA256SUMS.txt'), 'utf8');
  // Exact comparison also rejects missing, duplicate, stale or unsafe filenames.
  assert.equal(actual, expected, 'Release SHA-256 checksums or asset names do not match');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const operations = { __proto__: null, development: prepareDevelopment, release: prepareRelease, verify: verifyRelease };
  const operation = operations[process.argv[2]];
  assert.equal(typeof operation, 'function', 'Usage: node scripts/artifacts.mjs development|release|verify');
  await operation(join(root, 'dist'), version, process.env);
  console.log(`Artifact ${process.argv[2]} checks passed.`);
}
