import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const extension = new URL('../../chrome-extension/', import.meta.url);
export function loadContent(sandbox) {
  const context = vm.createContext(sandbox);
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', extension), 'utf8'));
  for (const file of manifest.content_scripts[0].js) {
    vm.runInContext(readFileSync(new URL(file, extension), 'utf8'), context, { filename: file });
  }
  return context;
}
