import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const { imageSize } = require('image-size');
const { fitDialArtwork } = require('../streamdeck/src/dial-artwork.cjs');
const { keyTextBackground } = require('../streamdeck/src/key-background.cjs');
const [option, filename] = process.argv.slice(2);
assert.ok(option === '--cover' && filename && process.argv.length === 4,
  'Usage: node scripts/render-preview.mjs --cover /path/to/album-cover.jpg');
const bytes = await readFile(resolve(filename));
assert.ok(bytes.length > 0 && bytes.length <= 2000000, 'Use a cover no larger than 2 MB');
const { type } = imageSize(bytes);
assert.ok(['jpg', 'png', 'webp'].includes(type), 'Use a JPEG, PNG or WebP cover');
const cover = `data:image/${type === 'jpg' ? 'jpeg' : type};base64,${bytes.toString('base64')}`;
const plugin = join(root, 'streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin');
const json = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
const pkg = await json('package.json');
const manifest = await json('chrome-extension/manifest.json');
const protocol = require('../chrome-extension/protocol.js');
const template = await readFile(join(root, 'chrome-extension/popup.html'), 'utf8');
const popupJS = await readFile(join(root, 'chrome-extension/popup.js'), 'utf8');
const fixtureJS = await readFile(join(root, 'store-assets/preview/popup-fixture.js'), 'utf8');
const scriptJSON = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const inline = value => value.replaceAll(/<\/script/gi, '<\\/script');
const icon = 'data:image/png;base64,' + (await readFile(join(root, 'chrome-extension/icons/128.png'))).toString('base64');
const data = {
  title: 'Prelude No. 1 in C major, BWV 846', artist: 'Kimiko Ishizaka',
  album: 'Bach: Well-Tempered Clavier, Book 1', version: pkg.version,
  protocol: protocol.descriptor.protocolVersion, cover, icon,
  fits: Object.fromEntries(['height', 'width'].map(mode => [mode, fitDialArtwork(cover, mode)])),
  backdrops: [cover, keyTextBackground(cover, 1), keyTextBackground(cover, 2)],
  layout: await json('streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/layouts/current-track-artwork.json'),
  icons: {}, popups: {},
};
for (const action of ['prev', 'toggle', 'next', 'like', 'open', 'nowplaying', 'mute', 'dislike', 'volume']) {
  for (const state of ['key', ...(action === 'toggle' ? ['pause'] : []), ...(['like', 'dislike'].includes(action) ? ['selected'] : [])]) {
    const name = `imgs/actions/${action}/${state}@2x.png`;
    data.icons[name] = 'data:image/png;base64,' + (await readFile(join(plugin, name))).toString('base64');
  }
}
for (const locale of ['en', 'ko']) {
  const catalog = await json(`chrome-extension/_locales/${locale}/messages.json`);
  const settings = { locale, catalog, title: data.title, version: pkg.version,
    extensionVersion: manifest.version_name || manifest.version, protocol: data.protocol };
  data.popups[locale] = template.replace('src="icons/128.png"', `src="${icon}"`)
    .replace('<script src="popup.js"></script>', `<script>const previewFixture=${scriptJSON(settings)};\n${inline(fixtureJS)}\n${inline(popupJS)}</script>`);
}
// Reuse only rendering definitions: never evaluate the plugin's bridge/SDK startup.
const source = await readFile(join(root, 'streamdeck/src/plugin.cjs'), 'utf8');
function extract(start, end) {
  const from = source.indexOf(start), to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `Missing renderer boundary: ${start}`);
  return source.slice(from, to);
}
const renderers = [extract('const MARQUEE_STEP_MS =', 'const marqueeTimer ='),
  extract('function renderCurrentTrackDial(', 'function showAlert('),
  extract('function ellipsis(', 'const COVERS ='), extract('function paint()', 'function drawSoon()')].join('\n');
const output = join(root, 'dist/previews/prelude-bwv846');
await mkdir(output, { recursive: true });
let page = await readFile(join(root, 'store-assets/preview/index.html'), 'utf8');
const css = await readFile(join(root, 'store-assets/preview/preview.css'), 'utf8');
const previewJS = await readFile(join(root, 'store-assets/preview/preview.js'), 'utf8');
page = page.replace('<link rel="stylesheet" href="preview.css" />', `<style>${css}</style>`);
for (const [name, script] of Object.entries({ 'data.js': `globalThis.previewData=${scriptJSON(data)};`,
  'renderers.js': renderers, 'preview.js': previewJS }))
  page = page.replace(`<script src="${name}"></script>`, `<script>${inline(script)}</script>`);
await writeFile(join(output, 'index.html'), page);
for (const [locale, html] of Object.entries(data.popups)) await writeFile(join(output, `popup-${locale}.html`), html);
console.log(`Rendering page: ${join(output, 'index.html')}`);
