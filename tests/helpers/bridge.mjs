import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const pluginEntry = fileURLToPath(new URL('../../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/bin/plugin.js', import.meta.url));
export const extensionOrigin = 'chrome-extension://' + 'a'.repeat(32);
export async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

export function manageChild(proc) {
  let output = '', spawnError, stopping;
  const closed = new Promise(resolve => proc.once('close', resolve));
  proc.on('error', error => { spawnError = error; });
  for (const stream of [proc.stdout, proc.stderr]) stream?.on('data', chunk => { output += chunk; });
  return { proc, closed, get output() { return output; },
    async ready(marker, timeout = 5000) {
      const deadline = Date.now() + timeout;
      while (!output.includes(marker)) {
        if (spawnError || proc.exitCode !== null || proc.signalCode !== null || Date.now() >= deadline) {
          throw Error(`Child not ready (${marker}): ${spawnError?.message || ''}\n${output}`);
        }
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    },
    stop() {
      if (stopping) return stopping;
      stopping = (async () => {
        const timer = setTimeout(() => { if (proc.exitCode === null && proc.signalCode === null) proc.kill('SIGKILL'); }, 2000);
        try {
          if (proc.exitCode === null && proc.signalCode === null) proc.kill();
          await closed; // Includes stdio closure; directory cleanup follows this promise.
        } finally { clearTimeout(timer); }
      })();
      return stopping;
    } };
}

export async function createBridgeFixture(t, { pin = '654321', prefix = 'music-deck-test-' } = {}) {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  let child;
  const fixture = { directory, port: null,
    async start({ port = fixture.port, useSavedPort = false } = {}) {
      if (child) throw Error('Stop the current bridge before starting another');
      fixture.port = port;
      const env = { ...process.env, APPDATA: directory, MUSIC_DECK_BRIDGE_DEV_TEST: '1', MUSIC_DECK_BRIDGE_TEST_PIN: pin };
      if (useSavedPort) delete env.MUSIC_DECK_BRIDGE_TEST_PORT;
      else env.MUSIC_DECK_BRIDGE_TEST_PORT = String(port);
      child = manageChild(spawn(process.execPath, [pluginEntry], { env, stdio: ['ignore', 'pipe', 'pipe'] }));
      await child.ready(`Loopback bridge on 127.0.0.1:${port}`);
    },
    async stop() { if (child) { await child.stop(); child = null; } },
    async post(route, data, { port = fixture.port, origin = extensionOrigin, timeout = 3000 } = {}) {
      const response = await fetch(`http://127.0.0.1:${port}${route}`, { method: 'POST',
        headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(timeout) });
      return { status: response.status, body: await response.json() };
    } };
  t.after(async () => { try { await fixture.stop(); } finally { rmSync(directory, { recursive: true, force: true }); } });
  fixture.port = await freePort();
  await fixture.start();
  return fixture;
}
