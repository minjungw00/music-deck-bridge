import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommandService } from '../streamdeck/src/application/command-service.cjs';

function harness() {
  let clock = 1000, id = 0;
  const timers = new Map(), launches = [];
  const session = { paired: true, generation: 1, blocked: false, pairingRequired: false };
  const commands = createCommandService({ getSession: () => session, selectedEntry: () => null,
    now: () => clock, newId: () => String(++id), log() {},
    launch: async options => { launches.push(options); },
    setTimeout: (run, delay) => { const key = ++id; timers.set(key, { run, at: clock + delay }); return key; },
    clearTimeout: key => timers.delete(key) });
  function channel(concurrent = false) {
    const replies = [];
    let close;
    commands.listenBrowser({ reply: (data, status = 200) => replies.push({ data, status }), onClose: fn => { close = fn; } }, { concurrent });
    return { replies, close };
  }
  return { commands, session, launches, timers, channel, async advance(ms) {
    clock += ms;
    for (const [key, timer] of [...timers]) {
      if (timers.has(key) && timer.at <= clock) { timers.delete(key); await timer.run(); }
    }
  } };
}

test('browser commands remain ordered, delivered once and settle only on their own acknowledgment', async () => {
  const h = harness();
  const first = h.commands.request('next'), second = h.commands.request('prev');
  const a = h.channel(), firstId = a.replies[0].data.commands[0].id;
  const b = h.channel();
  assert.equal(b.replies.length, 0, 'a delivered command waits for its ACK');
  h.commands.acknowledge(firstId, true);
  assert.equal(await first, true);
  const secondId = b.replies[0].data.commands[0].id;
  assert.equal(b.replies[0].data.commands[0].type, 'prev');
  h.commands.acknowledge(firstId, false, 'player-error');
  assert.equal(h.commands.lastError, '', 'a duplicate ACK cannot change completed results');
  h.commands.acknowledge(secondId, true);
  assert.equal(await second, true);
  assert.equal(h.timers.size, 0);
});

test('opted-in delivery lets Pause pass an unconfirmed Previous and ignores late older errors', async () => {
  const h = harness();
  const previous = h.commands.request('prev'), pause = h.commands.request('toggle');
  const a = h.channel(true), b = h.channel(true);
  assert.equal(b.replies.length, 1);
  h.commands.acknowledge(b.replies[0].data.commands[0].id, true);
  assert.equal(await pause, true);
  h.commands.acknowledge(a.replies[0].data.commands[0].id, false, 'playback-unconfirmed');
  assert.equal(await previous, false);
  assert.equal(h.commands.lastError, '', 'late failure cannot overwrite the current input result');
});

test('superseded verification is cancellation and not a failed user input', async () => {
  const h = harness(), request = h.commands.request('prev');
  const channel = h.channel(true);
  h.commands.acknowledge(channel.replies[0].data.commands[0].id, false, 'command-superseded');
  assert.equal(await request, null);
  assert.equal(h.commands.lastError, '');
});

test('concurrent delivery remains bounded and resumes after one final acknowledgment', async () => {
  const h = harness();
  const requests = Array.from({ length: 9 }, () => h.commands.request('next'));
  const channels = Array.from({ length: 9 }, () => h.channel(true));
  assert.equal(channels[8].replies.length, 0);
  h.commands.acknowledge(channels[0].replies[0].data.commands[0].id, true);
  assert.equal(channels[8].replies.length, 1);
  h.commands.reset();
  await Promise.all(requests);
  assert.equal(h.timers.size, 0);
});

test('a delivered command never triggers native fallback or replay after timeout', async () => {
  const h = harness(), input = h.commands.request('next');
  const a = h.channel();
  assert.equal(a.replies[0].data.commands.length, 1);
  await h.advance(45000);
  assert.equal(await input, false);
  assert.equal(h.commands.lastError, 'command-timeout');
  assert.deepEqual(h.launches, []);
  const b = h.channel();
  assert.equal(b.replies.length, 0);
  b.close();
  assert.equal(h.timers.size, 0);
});

test('session replacement rejects polls, clears pending inputs and prevents stale acknowledgments', async () => {
  const h = harness(), first = h.commands.request('next'), second = h.commands.request('prev');
  const a = h.channel(), deliveredId = a.replies[0].data.commands[0].id;
  const waiting = h.channel();
  h.commands.reset();
  assert.equal(await first, false);
  assert.equal(await second, false);
  assert.equal(waiting.replies[0].status, 401);
  h.commands.acknowledge(deliveredId, true);
  assert.equal(h.commands.lastError, '');
  await h.advance(45000);
  assert.deepEqual(h.launches, []);
  assert.equal(h.timers.size, 0);
});
