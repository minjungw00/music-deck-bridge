import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { inflateSync } from 'node:zlib';

const root = new URL('../', import.meta.url);
const plugin = 'streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/';
const assets = [
  [plugin + 'imgs/plugin/icon.png', 256],
  [plugin + 'imgs/plugin/icon@2x.png', 512],
  [plugin + 'imgs/plugin/category.png', 28],
  [plugin + 'imgs/plugin/category@2x.png', 56],
  ...[16, 48, 128].map(size => [`chrome-extension/icons/${size}.png`, size]),
];
const actionFamilies = ['nowplaying', 'toggle', 'prev', 'next', 'mute', 'volume', 'trackdial'];

// Decode our noninterlaced RGBA8 PNGs using only Node's standard library.
// Testing committed pixels keeps Pillow optional for ordinary builds and CI.
async function png(path) {
  const bytes = await readFile(new URL(path, root));
  assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const chunks = [];
  let width, height;
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.deepEqual([...data.subarray(8)], [8, 6, 0, 0, 0], `${path}: expected RGBA8, no interlacing`);
    }
    if (type === 'IDAT') chunks.push(data);
    offset += length + 12;
  }
  const stride = width * 4;
  const raw = inflateSync(Buffer.concat(chunks));
  assert.equal(raw.length, (stride + 1) * height);
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    assert.ok(filter <= 4, `${path}: invalid PNG filter`);
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x;
      const a = x >= 4 ? pixels[i - 4] : 0;
      const b = y ? pixels[i - stride] : 0;
      const c = y && x >= 4 ? pixels[i - stride - 4] : 0;
      const p = a + b - c;
      const paeth = Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c)
        ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c;
      const predictor = [0, a, b, Math.floor((a + b) / 2), paeth][filter];
      pixels[i] = (raw[y * (stride + 1) + 1 + x] + predictor) & 255;
    }
  }
  const pixel = (x, y) => [...pixels.subarray((y * width + x) * 4, (y * width + x) * 4 + 4)];
  return { width, height, pixel, at: (x, y) => pixel(Math.floor(x * width), Math.floor(y * height)) };
}

test('brand and store PNGs have the required dimensions, alpha and safe corner margins', async () => {
  for (const [path, size] of [...assets, ['store-assets/elgato/app-icon.png', 288]]) {
    const image = await png(path);
    assert.equal(image.width, size, path);
    assert.equal(image.height, size, path);
    for (const [x, y] of [[0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1]]) {
      assert.ok(image.pixel(x, y)[3] <= 4, `${path}: corner is clipped/opaque`);
    }
    assert.ok(image.at(0.5, 0.68)[3] >= 250, `${path}: missing disc`);
  }
});

test('colored brand assets preserve the magenta disc, white play triangle and dark background', async () => {
  for (const [path] of assets.filter(([path]) => !path.includes('category'))) {
    const image = await png(path);
    const [r, g, b] = image.at(0.5, 0.68);
    assert.ok(r > 200 && g < 65 && b > 100 && b < 190, `${path}: magenta`);
    const play = image.at(0.5, 0.495);
    assert.ok(Math.min(...play.slice(0, 3)) > 180 && play[3] === 255, `${path}: white play`);
    const dark = image.at(0.5, 0.1);
    assert.ok(Math.max(...dark.slice(0, 3)) < 45 && dark[3] >= 250, `${path}: dark background`);
    for (const x of [0.22, 0.78]) {
      assert.ok(Math.min(...image.at(x, 0.495).slice(0, 3)) > 180, `${path}: missing sound wave`);
    }
  }
  // Large exports retain the reference's top light and deeper lower magenta.
  const source = await png(assets[1][0]);
  const top = source.at(0.5, 0.22), bottom = source.at(0.5, 0.75);
  assert.ok(top[0] > bottom[0] && top[1] > bottom[1] && top[2] > bottom[2]);
  assert.deepEqual(source.at(0.5, 0.495), [255, 255, 255, 255]);
  // Toolbar exports use a flat disc for clarity; sample away from the symbols.
  const small = await png(assets[4][0]);
  assert.ok(small.at(0.5, 0.68).slice(0, 3).every((v, i) => Math.abs(v - [247, 37, 117][i]) <= 12));
});

test('16px color and 28px monochrome play triangles retain a wider base than tip', async () => {
  for (const [path, monochrome] of [[assets[4][0], false], [assets[2][0], true]]) {
    const image = await png(path);
    const columnHeight = x => {
      let count = 0;
      for (let y = Math.ceil(image.height * 0.3); y < image.height * 0.65; y++) {
        const pixel = image.pixel(Math.floor(image.width * x), y);
        if (monochrome ? pixel[3] < 64 : Math.min(...pixel.slice(0, 3)) > 180) count++;
      }
      return count;
    };
    assert.ok(columnHeight(0.44) >= (monochrome ? 6 : 3), `${path}: missing triangle base`);
    assert.ok(columnHeight(0.56) >= 1, `${path}: missing triangle tip`);
    assert.ok(columnHeight(0.44) > columnHeight(0.56), `${path}: triangle shape lost`);
    if (monochrome) {
      for (const x of [0.22, 0.78]) assert.ok(image.at(x, 0.495)[3] < 64, `${path}: missing wave cutout`);
      for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
          const [r, g, b, a] = image.pixel(x, y);
          if (a) assert.deepEqual([r, g, b], [255, 255, 255], `${path}: must be monochrome`);
        }
      }
    }
  }
});

test('both manifests reference the complete brand asset family', async () => {
  const json = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
  const sd = await json(plugin + 'manifest.json');
  const chrome = await json('chrome-extension/manifest.json');
  const referenced = [sd.Icon, sd.CategoryIcon].flatMap(path =>
    ['', '@2x'].map(suffix => plugin + path + suffix + '.png'));
  for (const icons of [chrome.icons, chrome.action.default_icon]) {
    assert.deepEqual(Object.keys(icons), ['16', '48', '128']);
    referenced.push(...Object.values(icons).map(path => 'chrome-extension/' + path));
  }
  assert.deepEqual([...new Set(referenced)].sort(), assets.map(([path]) => path).sort());
});

test('action icons share the brand palette with distinct glyphs and monochrome list badges', async () => {
  for (const [name, size, colored] of [['key', 72, true], ['key@2x', 144, true], ['icon', 20, false], ['icon@2x', 40, false]]) {
    const files = new Set();
    for (const family of actionFamilies) {
      const path = `${plugin}imgs/actions/${family}/${name}.png`;
      const data = await readFile(new URL(path, root));
      files.add(data.toString('base64'));
      const image = await png(path);
      assert.equal(image.width, size, path);
      assert.equal(image.height, size, path);
      assert.ok(image.pixel(0, 0)[3] <= 4, `${path}: clipped corner`);
      let white = 0, magenta = 0, cutout = 0;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const [r, g, b, a] = image.pixel(x, y);
          if (Math.min(r, g, b) > 180 && a > 180) white++;
          if (r > 200 && g < 65 && b > 100 && a > 240) magenta++;
          if (!colored && a > 0) assert.deepEqual([r, g, b], [255, 255, 255], `${path}: tinted list badge`);
          if (x > size * 0.3 && x < size * 0.7 && y > size * 0.3 && y < size * 0.7 && a < 64) cutout++;
        }
      }
      assert.ok(white > size * size * 0.015, `${path}: unreadable glyph/badge`);
      if (colored) {
        assert.ok(magenta > size * size * 0.15, `${path}: missing magenta disc`);
        const dark = image.at(0.5, 0.1);
        assert.ok(Math.max(...dark.slice(0, 3)) < 45 && dark[3] > 240, `${path}: missing dark surface`);
      } else {
        assert.ok(cutout > 0, `${path}: missing action cutout`);
      }
    }
    assert.equal(files.size, actionFamilies.length, `${name}: actions must have distinct glyphs`);
  }
});
