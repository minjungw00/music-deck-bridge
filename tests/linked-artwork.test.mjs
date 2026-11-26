import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { albumTiles } from '../streamdeck/src/presentation/album-groups.cjs';
import { keyTextBackground } from '../streamdeck/src/key-background.cjs';
import { createRenderer } from '../streamdeck/src/presentation/renderer.cjs';
import { createDeckController } from '../streamdeck/src/application/deck-controller.cjs';
import { actionName, PLUGIN_ID } from '../streamdeck/src/domain/actions.cjs';

const raster = 'data:image/png;base64,' + readFileSync(new URL(
  '../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/imgs/plugin/icon.png', import.meta.url)).toString('base64');
const decode = value => Buffer.from(value.split(',')[1], 'base64').toString();
const key = (row, column, { device = 'deck', name = '', mode = 'linked' } = {}) => ({
  position: { device, row, column }, settings: { keyDisplay: mode, albumGroup: name },
});

test('auto groups include diagonals and staggered shapes while named groups preserve wide gaps', () => {
  const keys = new Map([
    ['a', key(0, 0)], ['b', key(1, 1)], ['c', key(1, 2)],
    ['unrelated', key(0, 2, { mode: 'default' })], ['separate', key(0, 4)],
    ['same position on another deck', key(0, 0, { device: 'another deck' })],
    ['d', key(3, 0, { name: 'wide' })], ['e', key(3, 3, { name: 'wide' })],
  ]);
  assert.deepEqual([...albumTiles(keys)], [
    ['d', { row: 0, column: 0, height: 1, width: 4 }],
    ['e', { row: 0, column: 3, height: 1, width: 4 }],
    ['a', { row: 0, column: 0, height: 2, width: 3 }],
    ['b', { row: 1, column: 1, height: 2, width: 3 }],
    ['c', { row: 1, column: 2, height: 2, width: 3 }],
  ]);
  keys.set('new page at b', key(1, 1, { mode: 'default' }));
  assert.equal(albumTiles(keys).has('a'), false, 'a fresh context at the same position supersedes the old key');
});

test('each crop uses the full canvas geometry, including empty cells and rectangular canvases', () => {
  const diagonal = new Map([['top', key(0, 0)], ['bottom', key(1, 1)]]);
  const tiles = albumTiles(diagonal);
  assert.match(decode(keyTextBackground(raster, 0, tiles.get('top'))), /x="0" y="0" width="288" height="288"/);
  assert.match(decode(keyTextBackground(raster, 0, tiles.get('bottom'))), /x="-144" y="-144" width="288" height="288"/);
  const ring = new Map(Array.from({ length: 9 }, (_, index) => [
    String(index), key(Math.floor(index / 3), index % 3, { mode: index === 4 ? 'default' : 'linked' }),
  ]));
  const ringTiles = albumTiles(ring);
  assert.equal(ringTiles.size, 8);
  assert.equal(ringTiles.has('4'), false);
  assert.deepEqual(ringTiles.get('8'), { row: 2, column: 2, width: 3, height: 3 });
  assert.match(decode(keyTextBackground(raster, 0, { row: 0, column: 2, width: 3, height: 1 })),
    /x="-288" y="-144" width="432" height="432"/);
});

test('artwork-only leaves controls active, removes feedback and repaints remaining keys when one disappears', async () => {
  const displayed = new Map();
  const images = new Map(), titles = new Map(), commands = [];
  let changes = 0;
  const controller = createDeckController({ displayed, onChange: () => changes++,
    commands: { request: async (...args) => { commands.push(args); return true; } }, output: { send() {} } });
  for (const [context, kind, row, column] of [['track', 'nowplaying', 0, 0], ['volume', 'volumeup', 1, 1]]) {
    controller.handle({ event: 'willAppear', context, action: PLUGIN_ID + '.' + kind,
      position: { device: 'deck', row, column }, payload: { settings: { keyDisplay: 'linked', keyArtworkOnly: true } } });
  }
  const state = { title: 'Live track', artist: 'Artist', cover: 'current' };
  let selected = ['8', state], saved;
  const renderer = createRenderer({ displayed, actionName, selectedEntry: () => selected, lastTrack: () => saved,
    covers: { image: source => source === 'current' ? raster : '' }, keyTextBackground,
    volumeKeyImage: () => assert.fail('artwork-only must not render volume numbers'),
    output: { setImage: (id, value) => images.set(id, value), setTitle: (id, value) => titles.set(id, value) } });
  controller.handle({ event: 'keyDown', context: 'track', action: PLUGIN_ID + '.nowplaying' });
  controller.handle({ event: 'keyDown', context: 'volume', action: PLUGIN_ID + '.volumeup' });
  await Promise.resolve();
  assert.deepEqual(commands, [['toggle', 0], ['volume_delta', 4]]);
  renderer.paint();
  assert.deepEqual([...titles.values()], ['', '']);
  for (const value of images.values()) assert.equal([...decode(value).matchAll(/<image /g)].length, 1);
  assert.match(decode(images.get('volume')), /x="-144" y="-144"/);

  const before = changes;
  controller.handle({ event: 'willDisappear', context: 'volume' });
  assert.equal(changes, before + 1);
  renderer.paint();
  assert.equal(images.get('track'), raster, 'a single remaining key redraws the original cover');

  controller.handle({ event: 'deviceDidDisconnect', device: 'deck' });
  assert.equal(displayed.size, 0);
  saved = { title: 'Saved track', artist: 'Saved artist', image: raster };
  selected = null;
  controller.handle({ event: 'willAppear', context: 'track', action: PLUGIN_ID + '.nowplaying' });
  renderer.paint();
  assert.match(titles.get('track'), /Saved track/);
  assert.equal(images.get('track'), raster);
});
