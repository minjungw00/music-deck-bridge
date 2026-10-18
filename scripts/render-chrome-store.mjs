import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'store-assets/chrome/listing');
const asset = async path => 'data:image/png;base64,' + (await readFile(join(root, path))).toString('base64');
const [brand, deck, previous, play, next, volume] = await Promise.all([
  'streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/imgs/plugin/icon@2x.png',
  'store-assets/elgato/screenshots/stream-deck-plus.png',
  ...['prev', 'toggle', 'next', 'volume'].map(action =>
    `streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/imgs/actions/${action}/key@2x.png`),
].map(asset));
let fonts = '';
if (process.env.CHROME_STORE_FONT_DIR) {
  for (const [filename, weight, range] of [
    ['segoeui.ttf', '400', ''], ['seguisb.ttf', '600 700', ''],
    ['malgun.ttf', '400', 'U+1100-11FF,U+3130-318F,U+AC00-D7AF'],
    ['malgunbd.ttf', '600 700', 'U+1100-11FF,U+3130-318F,U+AC00-D7AF'],
  ]) {
    const bytes = await readFile(join(process.env.CHROME_STORE_FONT_DIR, filename));
    fonts += `@font-face{font-family:StoreUI;src:url(data:font/ttf;base64,${bytes.toString('base64')});font-weight:${weight};${range ? `unicode-range:${range};` : ''}}`;
  }
}
const browser = await chromium.launch({ headless: true,
  ...(process.env.CHROME_STORE_BROWSER ? { executablePath: process.env.CHROME_STORE_BROWSER } : {}) });
await mkdir(output, { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  await page.route('**/*', route => route.abort());
  const style = `${fonts}
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}
    body{background:#10131b;color:white;font-family:StoreUI,'Segoe UI','Malgun Gothic',sans-serif}
    .backdrop{position:absolute;inset:0;background:radial-gradient(ellipse at 12% 10%,#48103270,transparent 60%),radial-gradient(ellipse at 98% 90%,#40103f66,transparent 55%)}
    .brand{position:absolute;left:56px;top:48px;display:flex;align-items:center;gap:16px}
    .brand img{width:56px;height:56px}.brand span{font-size:32px;font-weight:600;letter-spacing:-.5px}
    h1{position:absolute;left:56px;top:126px;margin:0;font-size:43px;line-height:1.2;font-weight:600;letter-spacing:-.6px}
    .subtitle{position:absolute;left:56px;top:244px;margin:0;font-size:18px;line-height:26px;color:#bfc5d5}
    .deck{position:absolute;left:48px;top:278px;width:658px;height:513px;border-radius:24px}
    .popup{position:absolute;left:770px;top:61px;width:435px;height:678px}
    .caption{position:absolute;left:770px;top:756px;margin:0;width:435px;font-size:15px;line-height:20px;color:#bfc5d5}
  `;
  const locales = {
    en: { title: 'Control YouTube Music<br>from your Stream Deck.',
      subtitle: 'Requires the Music Deck Bridge Stream Deck plugin.',
      caption: 'Extension popup · Sample playback data' },
    ko: { title: 'YouTube Music을<br>Stream Deck으로 제어하세요.',
      subtitle: 'Music Deck Bridge 플러그인이 함께 필요합니다.',
      caption: '확장 프로그램 팝업 · 샘플 재생 정보' },
  };
  for (const [locale, text] of Object.entries(locales)) {
    const popup = await asset(`store-assets/chrome/screenshots/popup-${locale}.png`);
    await page.setContent(`<!doctype html><html lang="${locale}"><meta charset="utf-8"><style>${style}</style>
      <body><div class="backdrop"></div><div class="brand"><img src="${brand}" alt=""><span>Music Deck Bridge</span></div>
      <h1>${text.title}</h1><p class="subtitle">${text.subtitle}</p>
      <img class="deck" src="${deck}" alt="Stream Deck +"><img class="popup" src="${popup}" alt="Extension popup">
      <p class="caption">${text.caption}</p></body></html>`);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())); });
    assert.ok(await page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0)));
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('h1,.brand,.subtitle,.caption')].every(element => {
      const box = element.getBoundingClientRect(); return box.x >= 0 && box.right <= innerWidth && box.bottom <= innerHeight;
    })), `${locale}: text must fit the screenshot`);
    await page.screenshot({ path: join(output, `screenshot-${locale}-1280x800.png`) });
  }
  await page.setViewportSize({ width: 440, height: 280 });
  await page.setContent(`<!doctype html><style>
    ${style}body{background:#10131b}.glow{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 35%,#d000a455,transparent 72%)}
    .mark{position:absolute;width:164px;height:164px;left:138px;top:27px}
    .actions{position:absolute;left:119px;top:211px;display:flex;gap:14px}.actions img{width:40px;height:40px}
    svg{position:absolute;inset:0;width:440px;height:280px}
    </style><body><div class="glow"></div>
    <svg viewBox="0 0 440 280" fill="none" aria-hidden="true"><path d="M-32 250C60 60 92 40 170-22M310-20C340 80 450 90 462 240" stroke="#f72575" stroke-opacity=".12" stroke-width="22"/><path d="M-30 200C60 15 100 10 120-24M355-20C380 60 455 100 478 180" stroke="#ff38d1" stroke-opacity=".12" stroke-width="10"/></svg>
    <img class="mark" src="${brand}" alt=""><div class="actions">${[previous, play, next, volume].map(src => `<img src="${src}" alt="">`).join('')}</div></body>`);
  await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
  await page.screenshot({ path: join(output, 'promo-small-440x280.png') });
  const icon = await page.evaluate(async brand => {
    const image = new Image(); image.src = brand; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d');
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 16, 16, 96, 96);
    return canvas.toDataURL('image/png').split(',')[1];
  }, brand);
  await writeFile(join(output, 'icon-128.png'), Buffer.from(icon, 'base64'));
  console.log(`Chrome Web Store assets: ${output}`);
} finally { await browser.close(); }
