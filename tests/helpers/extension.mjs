import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const extension = new URL('../../chrome-extension/', import.meta.url);

// Follow the real classic-worker import graph instead of concatenating source snippets.
export function loadExtension(sandbox) {
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', extension), 'utf8'));
  const suppliedManifest = sandbox.chrome.runtime.getManifest;
  sandbox.chrome.runtime.getManifest = () => ({ ...manifest, ...suppliedManifest?.() });
  const context = vm.isContext(sandbox) ? sandbox : vm.createContext(sandbox);
  context.importScripts = (...files) => {
    for (const file of files) {
      vm.runInContext(readFileSync(new URL(file, extension), 'utf8'), context, { filename: file });
    }
  };
  vm.runInContext(readFileSync(new URL('background.js', extension), 'utf8'), context, { filename: 'background.js' });
  return context;
}
