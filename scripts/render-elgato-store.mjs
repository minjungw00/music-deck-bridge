import assert from 'node:assert/strict';
import { readFile, copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'store-assets/elgato/listing');
const asset = async path => 'data:image/png;base64,' + (await readFile(join(root, path))).toString('base64');
const [brand, deck, popup, ...actions] = await Promise.all([
  'streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/imgs/plugin/icon@2x.png',
  'store-assets/elgato/screenshots/stream-deck-plus.png',
  'store-assets/chrome/screenshots/popup-en.png',
  ...['prev', 'toggle', 'next', 'like', 'volume'].map(action =>
    `streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/imgs/actions/${action}/key@2x.png`),
].map(asset));
let fonts = '';
if (process.env.ELGATO_STORE_FONT_DIR) {
  for (const [filename, weight] of [['segoeui.ttf', '400'], ['seguisb.ttf', '600 700']]) {
    const bytes = await readFile(join(process.env.ELGATO_STORE_FONT_DIR, filename));
    fonts += `@font-face{font-family:StoreUI;src:url(data:font/ttf;base64,${bytes.toString('base64')});font-weight:${weight}}`;
  }
}
const browser = await chromium.launch({ headless: true,
  ...(process.env.ELGATO_STORE_BROWSER ? { executablePath: process.env.ELGATO_STORE_BROWSER } : {}) });
await mkdir(output, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 960 }, deviceScaleFactor: 1 });
  await page.route('**/*', route => route.abort());
  const style = `${fonts}
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}
    body{background:#10131b;color:#fff;font-family:StoreUI,'Segoe UI',sans-serif}
    .backdrop{position:absolute;inset:0;background:radial-gradient(ellipse at 6% 5%,#60103970,transparent 60%),radial-gradient(ellipse at 98% 90%,#48104077,transparent 55%)}
    .brand{position:absolute;left:96px;top:56px;display:flex;align-items:center;gap:18px}
    .brand img{width:56px;height:56px}.brand span{font-size:34px;font-weight:600}
    h1{position:absolute;left:96px;top:154px;margin:0;font-size:64px;line-height:1.15;font-weight:600;letter-spacing:-1px}
    .subtitle{position:absolute;left:96px;top:248px;margin:0;font-size:26px;line-height:36px;color:#bfc5d5}
    .deck{position:absolute;width:658px;height:513px;border-radius:24px}
    .popup{position:absolute;width:435px;height:678px}
    .features{position:absolute;display:grid;gap:46px}.feature{border-left:4px solid #f72575;padding-left:26px}
    .feature h2{margin:0 0 10px;font-size:36px;line-height:1.2;font-weight:600}
    .feature p{margin:0;font-size:26px;line-height:1.5;color:#bfc5d5}
    .caption{position:absolute;margin:0;font-size:22px;line-height:30px;color:#bfc5d5}
  `;
  const header = `<div class="backdrop"></div><div class="brand"><img src="${brand}" alt=""><span>Music Deck Bridge</span></div>`;
  const feature = (title, body) => `<section class="feature"><h2>${title}</h2><p>${body}</p></section>`;
  const snapshot = async (name, content, extra = '') => {
    await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><style>${style}${extra}</style><body>${content}</body></html>`);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())); });
    assert.ok(await page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0)));
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('h1,h2,p,.brand,.hero-name,.hero-tagline,.action-row')].every(element => {
      const box = element.getBoundingClientRect(); return box.x >= 0 && box.right <= innerWidth && box.bottom <= innerHeight;
    })), `${name}: content must fit the canvas`);
    await page.screenshot({ path: join(output, name) });
  };
  await snapshot('thumbnail-1920x960.png', `
    <div class="backdrop"></div><img class="hero-mark" src="${brand}" alt="">
    <h1 class="hero-name">Music Deck<br>Bridge</h1>
    <p class="hero-tagline">Control YouTube Music<br>with your Stream Deck.</p>
    <div class="action-row">${actions.map(src => `<img src="${src}" alt="">`).join('')}</div>
    <p class="caption" style="left:848px;top:818px">Stream Deck plugin · Chrome companion</p>`, `
    .hero-mark{position:absolute;left:176px;top:208px;width:512px;height:512px}
    .hero-name{left:848px;top:218px;font-size:104px;line-height:1.05;letter-spacing:-2px}
    .hero-tagline{position:absolute;left:848px;top:484px;margin:0;font-size:38px;line-height:1.35;color:#bfc5d5}
    .action-row{position:absolute;left:848px;top:664px;display:flex;gap:24px}.action-row img{width:80px;height:80px}`);
  await snapshot('gallery-01-keys-1920x960.png', `${header}
    <h1>Music controls, ready on your keys.</h1>
    <p class="subtitle">Control YouTube Music from Stream Deck.</p>
    <div class="features" style="left:120px;top:352px">
      ${feature('Playback', 'Play, pause and skip tracks.')}
      ${feature('Ratings', 'Like or dislike the current song.')}
      ${feature('Launch', 'Open YouTube Music from a key.')}
    </div><img class="deck" style="left:1100px;top:330px" src="${deck}" alt="Stream Deck + capture">
    <p class="caption" style="left:120px;top:858px">Requires the companion Chrome extension.</p>`);
  await snapshot('gallery-02-dials-1920x960.png', `${header}
    <h1>Turn. Press. Touch.</h1><p class="subtitle">Volume and track controls on Stream Deck +.</p>
    <img class="deck" style="left:150px;top:330px" src="${deck}" alt="Stream Deck + capture">
    <div class="features" style="left:1030px;top:370px;gap:74px">
      ${feature('Volume Dial', 'Turn: adjust volume in 1–5% steps.<br>Press or touch: mute.')}
      ${feature('Current Track Dial', 'Turn: previous or next track.<br>Press or touch: play or pause.')}
    </div>`);
  await snapshot('gallery-03-pairing-1920x960.png', `${header}
    <h1>Connect with a six-digit PIN.</h1>
    <p class="subtitle" style="width:1060px">Use the companion Chrome extension on the same Windows PC.</p>
    <p class="caption" style="left:150px;top:292px">Stream Deck plugin</p>
    <img class="deck" style="left:150px;top:340px" src="${deck}" alt="Stream Deck + capture">
    <svg style="position:absolute;left:874px;top:550px;width:260px;height:52px" viewBox="0 0 260 52" fill="none" aria-hidden="true"><path d="M10 26H250M28 8L10 26L28 44M232 8L250 26L232 44" stroke="#f72575" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <p class="caption" style="left:874px;top:626px;width:260px;text-align:center">Local bridge</p>
    <p class="caption" style="left:1290px;top:154px">Chrome extension</p>
    <img class="popup" style="left:1290px;top:202px" src="${popup}" alt="English extension popup">
    <p class="caption" style="left:1290px;top:898px">Popup: sample playback data</p>`);
  await copyFile(join(root, 'store-assets/elgato/app-icon.png'), join(output, 'app-icon-288.png'));
  console.log(`Elgato Marketplace assets: ${output}`);
} finally { await browser.close(); }
