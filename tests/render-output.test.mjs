import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderer } from '../streamdeck/src/presentation/renderer.cjs';

function harness(output) {
  const item = { action: 'toggle' }, displayed = new Map([['key', item]]);
  const state = { playing: true };
  const renderer = createRenderer({ displayed, selectedEntry: () => ['player', state],
    actionName: action => action, covers: {}, output });
  return { item, displayed, state, renderer };
}

test('failed and skipped image/title outputs retry on unchanged repaint and cache successful sends', async () => {
  for (const skipped of [false, true]) {
    let imageCalls = 0, titleCalls = 0;
    const send = count => count === 1 ? skipped ? false : Promise.reject(Error('SDK failure')) : Promise.resolve();
    const h = harness({ setImage: () => send(++imageCalls), setTitle: () => send(++titleCalls) });
    h.renderer.paint();
    await h.renderer.settled();
    h.renderer.paint();
    await h.renderer.settled();
    h.renderer.paint();
    assert.equal(imageCalls, 2);
    assert.equal(titleCalls, 2);
  }
});

test('pending display writes coalesce newer state and cannot confirm an older image over the latest one', async () => {
  const pending = [], images = [];
  const h = harness({ setImage: (_context, image) => { images.push(image); return new Promise(resolve => pending.push(resolve)); }, setTitle() {} });
  h.renderer.paint();
  h.state.playing = false;
  h.renderer.paint();
  h.renderer.paint();
  assert.equal(images.length, 1, 'no overlapping writes for the same field');
  pending.shift()();
  await Promise.resolve(); await Promise.resolve();
  assert.equal(images.length, 2);
  assert.match(images[1], /key@2x/);
  pending.shift()();
  await h.renderer.settled();
  h.renderer.paint();
  assert.equal(images.length, 2, 'latest image is now confirmed');
});

test('a disappearing action never receives a pending follow-up image', async () => {
  let finish, calls = 0;
  const h = harness({ setImage: () => { calls++; return new Promise(resolve => { finish = resolve; }); }, setTitle() {} });
  h.renderer.paint();
  h.state.playing = false;
  h.renderer.paint();
  h.displayed.delete('key');
  finish();
  await h.renderer.settled();
  assert.equal(calls, 1);
});
