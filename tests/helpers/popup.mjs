import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const extension = new URL('../../chrome-extension/', import.meta.url);
const html = readFileSync(new URL('popup.html', extension), 'utf8');
export function loadPopup(sandbox) {
  const context = vm.createContext({ URL, ...sandbox });
  for (const [, file] of html.matchAll(/<script src="([^"]+)"><\/script>/g)) {
    vm.runInContext(readFileSync(new URL(file, extension), 'utf8'), context, { filename: file });
  }
  return context;
}
