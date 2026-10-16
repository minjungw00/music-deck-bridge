import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

await build({
  absWorkingDir: fileURLToPath(new URL('..', import.meta.url)),
  entryPoints: ['streamdeck/src/plugin.cjs'],
  outfile: 'streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/bin/plugin.js',
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'cjs',
  // ws uses these optional native accelerators only when installed. Use its JS implementations.
  define: { 'process.env.WS_NO_BUFFER_UTIL': '"1"', 'process.env.WS_NO_UTF_8_VALIDATE': '"1"' },
  external: ['bufferutil', 'utf-8-validate'],
  legalComments: 'inline',
});
