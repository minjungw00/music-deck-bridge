import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeckController } from '../streamdeck/src/application/deck-controller.cjs';

test('volume keys use independent bounded steps and the same default as the dial', () => {
  const requests = [], displayed = new Map();
  const controller = createDeckController({ displayed, onChange() {},
    commands: { request(type, amount) { requests.push({ type, amount }); return Promise.resolve(true); } } });
  const event = (event, name, context, payload = {}) => controller.handle({ event,
    action: 'io.github.minjungw00.musicdeckbridge.' + name, context, payload });
  for (const [value, step] of [[undefined, 4], ['invalid', 4], [2.5, 4], [0, 1], [10, 5], [2, 2]]) {
    for (const [name, sign] of [['volumeup', 1], ['volumedown', -1]]) {
      event('willAppear', name, name, { settings: { volumeStep: value } });
      event('keyDown', name, name);
      assert.deepEqual(requests.at(-1), { type: 'volume_delta', amount: sign * step });
    }
  }
  event('willAppear', 'volumeup', 'other-up', { settings: { volumeStep: 5 } });
  event('keyDown', 'volumeup', 'other-up');
  event('keyDown', 'volumeup', 'volumeup');
  event('keyDown', 'volumedown', 'volumedown');
  assert.deepEqual(requests.slice(-3).map(request => request.amount), [5, 2, -2]);
});
