import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const candidates = process.platform === 'win32'
  ? [['py', ['-3']], ['python', []]]
  : [['python3', []], ['python', []]];
for (const [command, prefix] of candidates) {
  const probe = spawnSync(command, [...prefix, '-c', 'import sys; sys.exit(sys.version_info < (3, 10))']);
  if (probe.status !== 0) continue;
  const result = spawnSync(command, [...prefix, fileURLToPath(new URL('./package.py', import.meta.url)), ...process.argv.slice(2)], { stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  process.exit(result.status ?? 1);
}
console.error('Python 3.10+ is required. Install python3, python, or the Windows py launcher.');
process.exit(1);
