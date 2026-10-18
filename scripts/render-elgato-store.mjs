import assert from 'node:assert/strict';
import { readFile, copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const toChrome = args.length === 2 && args[0] === '--for' && args[1] === 'chrome';
assert.ok(args.length === 0 || toChrome, 'Usage: render-elgato-store.mjs [--for chrome]');
const output = join(root, toChrome ? 'store-assets/chrome/cross-store' : 'store-assets/elgato/listing');
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
  const page = await browser.newPage({ viewport: toChrome ? { width: 1280, height: 800 } : { width: 1920, height: 960 }, deviceScaleFactor: 1 });
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
  const chromeStyle = `
    .brand{left:56px;top:40px;gap:14px}.brand img{width:48px;height:48px}.brand span{font-size:28px}
    h1{left:56px;top:120px;font-size:43px;letter-spacing:-.6px}.subtitle{left:56px;top:190px;font-size:20px;line-height:28px}
    .caption{font-size:16px;line-height:22px}.feature{padding-left:18px;border-left-width:3px}
    .feature h2{font-size:24px;margin-bottom:7px}.feature p{font-size:18px;line-height:1.5}
  `;
  const chromeLayouts = {
    'gallery-01-keys-1920x960.png': `
      .subtitle{top:238px}.features{left:64px!important;top:314px!important;gap:30px}
      .deck{left:594px!important;top:262px!important}.caption{left:64px!important;top:746px!important}`,
    'gallery-02-dials-1920x960.png': `
      .deck{left:28px!important;top:260px!important}.features{left:742px!important;top:305px!important;gap:60px!important}
      .feature h2{font-size:26px}.feature p{font-size:20px}`,
    'gallery-03-pairing-1920x960.png': `
      .subtitle{width:650px!important;top:244px;font-size:17px}.deck{left:48px!important;top:278px!important}
      .popup{left:795px!important;top:61px!important}
      .connection{left:719px!important;top:500px!important;width:60px!important;height:28px!important}
      .bridge-label{left:711px!important;top:550px!important;width:74px!important;font-size:12px}
      .deck-label,.popup-label{display:none}.popup-caption{left:795px!important;top:756px!important}`,
  };
  const snapshot = async (name, content, extra = '') => {
    const layout = toChrome ? chromeStyle + (chromeLayouts[name] || '') : '';
    await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><style>${style}${extra}${layout}</style><body>${content}</body></html>`);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())); });
    assert.ok(await page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0)));
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('h1,h2,p,.brand,.hero-name,.hero-tagline,.action-row')].every(element => {
      const box = element.getBoundingClientRect(); return box.x >= 0 && box.right <= innerWidth && box.bottom <= innerHeight;
    })), `${name}: content must fit the canvas`);
    const filename = toChrome && name.startsWith('gallery-') ? 'from-elgato-' + name.replace('1920x960', '1280x800') : name;
    await page.screenshot({ path: join(output, filename) });
  };
  const thumbnail = `
    <div class="backdrop"></div><img class="hero-mark" src="${brand}" alt="">
    <h1 class="hero-name">Music Deck<br>Bridge</h1>
    <p class="hero-tagline">Control YouTube Music<br>with your Stream Deck.</p>
    <div class="action-row">${actions.map(src => `<img src="${src}" alt="">`).join('')}</div>
    <p class="caption" style="left:848px;top:818px">Stream Deck plugin · Chrome companion</p>`;
  const thumbnailStyle = `
    .hero-mark{position:absolute;left:176px;top:208px;width:512px;height:512px}
    .hero-name{left:848px;top:218px;font-size:104px;line-height:1.05;letter-spacing:-2px}
    .hero-tagline{position:absolute;left:848px;top:484px;margin:0;font-size:38px;line-height:1.35;color:#bfc5d5}
    .action-row{position:absolute;left:848px;top:664px;display:flex;gap:24px}.action-row img{width:80px;height:80px}`;
  if (toChrome) {
    await page.setViewportSize({ width: 440, height: 280 });
    await snapshot('from-elgato-thumbnail-small-440x280.png', thumbnail, thumbnailStyle + `
      .hero-mark{left:28px;top:72px;width:128px;height:128px}
      .hero-name{left:196px;top:46px;font-size:32px;line-height:1.05;letter-spacing:-.5px}
      .hero-tagline{left:196px;top:132px;font-size:14px;line-height:1.4}
      .action-row{left:196px;top:208px;gap:8px}.action-row img{width:28px;height:28px}.caption{display:none}`);
    await page.setViewportSize({ width: 1400, height: 560 });
    await snapshot('from-elgato-thumbnail-marquee-1400x560.png', thumbnail, thumbnailStyle + `
      .hero-mark{left:104px;top:96px;width:368px;height:368px}
      .hero-name{left:620px;top:72px;font-size:64px;line-height:1.05;letter-spacing:-1px}
      .hero-tagline{left:620px;top:248px;font-size:26px;line-height:1.35}
      .action-row{left:620px;top:374px;gap:18px}.action-row img{width:56px;height:56px}
      .caption{left:620px!important;top:490px!important;font-size:18px}`);
    await page.setViewportSize({ width: 1280, height: 800 });
  } else {
    await snapshot('thumbnail-1920x960.png', thumbnail, thumbnailStyle);
  }
  await snapshot('gallery-01-keys-1920x960.png', `${header}
    <h1>${toChrome ? 'Music controls,<br>ready on your keys.' : 'Music controls, ready on your keys.'}</h1>
    <p class="subtitle">Control YouTube Music from Stream Deck.</p>
    <div class="features" style="left:120px;top:352px">
      ${feature('Playback', 'Play, pause and skip tracks.')}
      ${feature('Ratings', 'Like or dislike the current song.')}
      ${feature('Launch', 'Open YouTube Music from a key.')}
    </div><img class="deck" style="left:1100px;top:330px" src="${deck}" alt="Stream Deck + capture">
    <p class="caption" style="left:120px;top:858px">${toChrome ? 'Requires the companion Stream Deck plugin.' : 'Requires the companion Chrome extension.'}</p>`);
  await snapshot('gallery-02-dials-1920x960.png', `${header}
    <h1>Turn. Press. Touch.</h1><p class="subtitle">Volume and track controls on Stream Deck +.</p>
    <img class="deck" style="left:150px;top:330px" src="${deck}" alt="Stream Deck + capture">
    <div class="features" style="left:1030px;top:370px;gap:74px">
      ${feature('Volume Dial', 'Turn: adjust volume in 1–5% steps.<br>Press or touch: mute.')}
      ${feature('Current Track Dial', 'Turn: previous or next track.<br>Press or touch: play or pause.')}
    </div>`);
  await snapshot('gallery-03-pairing-1920x960.png', `${header}
    <h1>${toChrome ? 'Connect with a<br>six-digit PIN.' : 'Connect with a six-digit PIN.'}</h1>
    <p class="subtitle" style="width:1060px">${toChrome ? 'Pair with the Stream Deck plugin on the same Windows PC.' : 'Use the companion Chrome extension on the same Windows PC.'}</p>
    <p class="caption deck-label" style="left:150px;top:292px">Stream Deck plugin</p>
    <img class="deck" style="left:150px;top:340px" src="${deck}" alt="Stream Deck + capture">
    <svg class="connection" style="position:absolute;left:874px;top:550px;width:260px;height:52px" viewBox="0 0 260 52" fill="none" aria-hidden="true"><path d="M10 26H250M28 8L10 26L28 44M232 8L250 26L232 44" stroke="#f72575" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <p class="caption bridge-label" style="left:874px;top:626px;width:260px;text-align:center">Local bridge</p>
    <p class="caption popup-label" style="left:1290px;top:154px">Chrome extension</p>
    <img class="popup" style="left:1290px;top:202px" src="${popup}" alt="English extension popup">
    <p class="caption popup-caption" style="left:1290px;top:898px">Popup: sample playback data</p>`);
  if (!toChrome) await copyFile(join(root, 'store-assets/elgato/app-icon.png'), join(output, 'app-icon-288.png'));
  console.log(`Store assets: ${output}`);
} finally { await browser.close(); }
