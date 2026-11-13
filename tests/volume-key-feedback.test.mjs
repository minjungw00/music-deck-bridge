import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeckController } from '../streamdeck/src/application/deck-controller.cjs';
import { createRenderer } from '../streamdeck/src/presentation/renderer.cjs';
import { volumeKeyImage } from '../streamdeck/src/volume-key-image.cjs';

const icon = kind => `imgs/actions/${kind}/key@2x.png`;
const svg = uri => Buffer.from(uri.split(',')[1], 'base64').toString();
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
function harness() {
  let time = 1000, nextTimer = 0, selected = ['1', { volume: 50, lastMediaSyncAt: time }];
  const displayed = new Map(), images = new Map(), requests = [], alerts = [], timers = new Map();
  const renderer = createRenderer({ displayed, selectedEntry: () => selected,
    actionName: action => action.split('.').at(-1), covers: {}, volumeKeyImage, now: () => time,
    setTimeout(run, delay) { const id = ++nextTimer; timers.set(id, { run, due: time + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    output: { setImage(context, image) { images.set(context, image); } } });
  const controller = createDeckController({ displayed, players: { selected: () => selected }, now: () => time,
    onChange: renderer.paint, output: { send(event) { alerts.push(event); } },
    commands: { request(type, amount) { return new Promise(resolve => requests.push({ type, amount, resolve })); } } });
  const event = (event, context = 'volumeup', name = context, payload = {}) => controller.handle({ event, context,
    action: 'io.github.minjungw00.musicdeckbridge.' + name, payload });
  for (const name of ['volumeup', 'volumedown']) event('willAppear', name);
  return { images, requests, alerts, timers, renderer,
    settings(settings, context = 'volumeup') { event('didReceiveSettings', context, context, { settings }); },
    duration(value, context = 'volumeup') { event('sendToPlugin', context, context, { type: 'volume-duration-preview', value }); },
    press(context = 'volumeup') { event('keyDown', context); return requests.at(-1); },
    sync(volume, id = '1') { selected = id === null ? null : [id, { volume, lastMediaSyncAt: time }]; renderer.paint(); },
    async ack(request, ok = true) { request.resolve(ok); await flush(); },
    advance(ms) {
      time += ms;
      for (const [id, timer] of [...timers]) if (timer.due <= time) { timers.delete(id); timer.run(); }
    },
    disappear() { event('willDisappear'); },
    reappear() { event('willAppear'); },
  };
}

test('numbers require both a successful command and a fresh snapshot, regardless of arrival order', async () => {
  for (const syncFirst of [false, true]) {
    const h = harness(), request = h.press();
    assert.equal(h.images.get('volumeup'), icon('volumeup'));
    if (syncFirst) h.sync(54); else await h.ack(request);
    assert.equal(h.images.get('volumeup'), icon('volumeup'));
    if (syncFirst) await h.ack(request); else h.sync(54);
    assert.match(svg(h.images.get('volumeup')), />54<\/text>/);
    assert.equal(h.images.get('volumedown'), icon('volumedown'), 'only the pressed instance changes');
    h.advance(1999);
    assert.match(h.images.get('volumeup'), /^data:image\/svg/);
    h.advance(1);
    assert.equal(h.images.get('volumeup'), icon('volumeup'), 'timer restores the icon without another sync');
    assert.equal(h.timers.size, 0);
  }
});

test('fresh unchanged 0/100 snapshots show actual boundaries without adding the requested delta', async () => {
  for (const [name, volume] of [['volumeup', 100], ['volumedown', 0]]) {
    const h = harness(); h.sync(volume);
    await h.ack(h.press(name)); h.sync(volume);
    assert.match(svg(h.images.get(name)), new RegExp(`>${volume}</text>`));
  }
});

test('duration supports 0–3 seconds per key and defaults to two for absent or invalid settings', async () => {
  for (const [seconds, milliseconds] of [[0, 0], ['0', 0], [.1, 100], [1.5, 1500], ['1.5', 1500], [3, 3000],
    [undefined, 2000], [null, 2000], [false, 2000], ['', 2000], [-1, 2000], [4, 2000], [NaN, 2000], ['wrong', 2000]]) {
    const h = harness(); h.settings({ volumeFeedbackSeconds: seconds });
    await h.ack(h.press()); h.sync(54);
    if (milliseconds === 0) {
      assert.equal(h.images.get('volumeup'), icon('volumeup'));
      assert.equal(h.timers.size, 0);
    } else {
      h.advance(milliseconds - 1);
      assert.match(h.images.get('volumeup'), /^data:image\/svg/);
      h.advance(1);
      assert.equal(h.images.get('volumeup'), icon('volumeup'));
    }
  }
  const h = harness();
  h.settings({ volumeFeedbackSeconds: .5 }, 'volumeup');
  h.settings({ volumeFeedbackSeconds: 3 }, 'volumedown');
  await h.ack(h.press()); await h.ack(h.press('volumedown')); h.sync(50);
  h.advance(500);
  assert.equal(h.images.get('volumeup'), icon('volumeup'));
  assert.match(h.images.get('volumedown'), /^data:image\/svg/);
  h.advance(2500);
  assert.equal(h.images.get('volumedown'), icon('volumedown'));
});

test('live duration changes retain elapsed time and repeated confirmed inputs start a new interval', async () => {
  const h = harness();
  await h.ack(h.press()); h.sync(54); h.advance(1000);
  h.settings({ volumeFeedbackSeconds: 3 }); h.advance(1500);
  assert.match(h.images.get('volumeup'), /^data:image\/svg/);
  await h.ack(h.press()); h.sync(58); h.advance(1000);
  h.settings({ volumeFeedbackSeconds: 1.5 }); h.advance(499);
  assert.match(h.images.get('volumeup'), /^data:image\/svg/);
  h.advance(1);
  assert.equal(h.images.get('volumeup'), icon('volumeup'));
});

test('duration preview survives stale settings and zero cancels pending feedback without canceling the command', async () => {
  const h = harness();
  h.duration(.5); h.settings({ volumeFeedbackSeconds: 2 });
  await h.ack(h.press()); h.sync(54); h.advance(500);
  assert.equal(h.images.get('volumeup'), icon('volumeup'));
  const pending = h.press();
  h.duration(0); h.settings({ volumeFeedbackSeconds: null });
  h.sync(58); await h.ack(pending);
  assert.equal(h.images.get('volumeup'), icon('volumeup'));
  assert.equal(h.timers.size, 0);
  h.duration(4); h.duration(-1);
  await h.ack(h.press()); h.sync(62);
  assert.equal(h.images.get('volumeup'), icon('volumeup'), 'invalid preview values cannot replace zero');
  h.settings({ volumeFeedbackSeconds: 0 }); h.settings({ volumeFeedbackSeconds: 3 });
  await h.ack(h.press()); h.sync(66); h.advance(2999);
  assert.match(h.images.get('volumeup'), /^data:image\/svg/);
  h.advance(1);
  assert.equal(h.images.get('volumeup'), icon('volumeup'));
});

test('repeated inputs extend feedback and live snapshots update its number without extending the timer', async () => {
  const h = harness();
  await h.ack(h.press()); h.sync(54);
  h.advance(1500);
  const older = h.press(), newer = h.press();
  await h.ack(older, false);
  assert.equal(h.alerts.length, 0, 'an older response cannot replace the newer input');
  h.sync(62); await h.ack(newer);
  h.advance(1000);
  assert.match(svg(h.images.get('volumeup')), />62<\/text>/);
  h.sync(59);
  assert.match(svg(h.images.get('volumeup')), />59<\/text>/);
  h.advance(1000);
  assert.equal(h.images.get('volumeup'), icon('volumeup'));
});

test('failed inputs, missing fresh state and player switches never invent a resulting volume', async () => {
  const h = harness();
  const failed = h.press(); h.sync(54); await h.ack(failed, false);
  assert.equal(h.images.get('volumeup'), icon('volumeup'));
  assert.equal(h.alerts.at(-1).event, 'showAlert');
  await h.ack(h.press()); h.advance(5000); h.sync(58);
  assert.equal(h.images.get('volumeup'), icon('volumeup'), 'late unrelated state cannot revive expired feedback');
  await h.ack(h.press()); h.sync(70, '2');
  assert.equal(h.images.get('volumeup'), icon('volumeup'));
  await h.ack(h.press()); h.sync(74, '2');
  assert.match(svg(h.images.get('volumeup')), />74<\/text>/);
  h.sync(0, null);
  assert.equal(h.images.get('volumeup'), icon('volumeup'), 'player disappearance clears the number');
});

test('a late acknowledgement cannot affect a reappeared action instance', async () => {
  const h = harness(), request = h.press();
  h.disappear(); h.reappear(); h.sync(54); await h.ack(request);
  assert.equal(h.images.get('volumeup'), icon('volumeup'));
  assert.equal(h.timers.size, 0);
});

test('number and percent preferences are independent per key and take effect during feedback', async () => {
  const h = harness();
  await h.ack(h.press()); h.sync(54);
  assert.match(svg(h.images.get('volumeup')), />54<\/text>/);
  h.settings({ volumeShowPercent: true });
  assert.match(svg(h.images.get('volumeup')), />54%<\/text>/);
  await h.ack(h.press('volumedown')); h.sync(50);
  assert.match(svg(h.images.get('volumedown')), />50<\/text>/);
  assert.match(svg(h.images.get('volumeup')), />50%<\/text>/);
  h.settings({ volumeShowValue: false });
  assert.equal(h.images.get('volumeup'), icon('volumeup'));
  assert.match(h.images.get('volumedown'), /^data:image\/svg/);
  h.settings({ volumeShowValue: true });
  assert.equal(h.images.get('volumeup'), icon('volumeup'), 'enabling feedback waits for a new input');
});

test('disabling numbers keeps controls and failures working and cancels an in-flight display request', async () => {
  const h = harness();
  h.settings({ volumeShowValue: false });
  const request = h.press();
  assert.equal(request.amount, 4);
  await h.ack(request); h.sync(54);
  assert.equal(h.images.get('volumeup'), icon('volumeup'));
  assert.equal(h.timers.size, 0);
  await h.ack(h.press(), false);
  assert.equal(h.alerts.at(-1).event, 'showAlert');
  h.settings({ volumeShowValue: true });
  const pending = h.press();
  h.settings({ volumeShowValue: false }); h.settings({ volumeShowValue: true });
  h.sync(58); await h.ack(pending);
  assert.equal(h.images.get('volumeup'), icon('volumeup'), 'a late response cannot re-enable canceled feedback');
});

test('numeric key images accept only actual integer percentages and embed the shared badge', () => {
  for (const value of [-1, 101, 2.5, NaN, Infinity, '50', '<script>']) assert.equal(volumeKeyImage(value), null);
  for (const value of [0, 37, 100]) {
    const image = volumeKeyImage(value), source = svg(image);
    assert.match(source, /width="144" height="144"/);
    assert.match(source, /xlink:href="data:image\/png;base64,/);
    assert.ok(source.includes(`>${value}</text>`));
    assert.equal(volumeKeyImage(value), image, 'stable images can use the output cache');
    const percent = volumeKeyImage(value, true);
    assert.ok(svg(percent).includes(`>${value}%</text>`));
    assert.notEqual(image, percent);
  }
});
