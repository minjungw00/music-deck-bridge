import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommandService } from '../streamdeck/src/application/command-service.cjs';

function harness({ selected = null } = {}) {
  let clock = 1000, id = 0;
  const timers = new Map(), launches = [];
  const session = { paired: true, generation: 1, blocked: false, pairingRequired: false };
  const commands = createCommandService({ getSession: () => session, selectedEntry: () => selected,
    now: () => clock, newId: () => String(++id), log() {},
    launch: async options => { launches.push(options); },
    setTimeout: (run, delay) => { const key = ++id; timers.set(key, { run, at: clock + delay }); return key; },
    clearTimeout: key => timers.delete(key) });
  function channel(concurrent = false, repeat = false, queueStartup = false, clientIds) {
    const replies = [];
    let close;
    commands.listenBrowser({ reply: (data, status = 200) => replies.push({ data, status }), onClose: fn => { close = fn; } },
      { concurrent, repeat, shuffle: repeat, queueStartup, clientIds });
    return { replies, close };
  }
  return { commands, session, launches, timers, channel, select(entry) { selected = entry; }, async advance(ms) {
    clock += ms;
    for (const [key, timer] of [...timers]) {
      if (timers.has(key) && timer.at <= clock) { timers.delete(key); await timer.run(); }
    }
  } };
}

test('repeat requires an eligible player and an advertised capability on the paired channel', async () => {
  const track = { title: 'Song', trackId: 'aaaaaaaaaaa', repeatMode: 'NONE', lastMediaSyncAt: 1000 };
  const h = harness({ selected: ['12', track] });
  const legacy = h.channel(true);
  assert.equal(await h.commands.request('repeat'), false);
  assert.equal(h.commands.repeatError, 'repeat-update-required');
  assert.deepEqual(legacy.replies, []);
  const play = h.commands.request('toggle');
  h.commands.acknowledge(legacy.replies[0].data.commands[0].id, true);
  assert.equal(await play, true);

  const current = h.channel(true, true);
  const repeat = h.commands.request('repeat');
  const [command] = current.replies[0].data.commands;
  assert.deepEqual([command.type, command.preferredTabId, command.playerKey], ['repeat', 12, track.trackId]);
  h.commands.acknowledge(command.id, true);
  assert.equal(await repeat, true);
  track.repeatMode = null;
  const nextPoll = h.channel(true, true);
  assert.equal(await h.commands.request('repeat'), false);
  assert.equal(h.commands.repeatError, 'repeat-unavailable');
  nextPoll.close();
});

test('a track-bound popup Repeat does not launch Chrome or fall through to an older extension', async () => {
  const h = harness({ selected: ['12', { title: 'Song', artist: 'Artist', repeatMode: 'ONE', lastMediaSyncAt: 1000 }] });
  h.channel(true, true).close();
  const waiting = h.commands.request('repeat', 0, { playerKey: '["Song","Artist"]' });
  await h.advance(2000);
  assert.deepEqual(h.launches, []);
  const older = h.channel(true);
  assert.equal(await waiting, false);
  assert.equal(h.commands.lastError, 'repeat-update-required');
  assert.deepEqual(older.replies, []);
  older.close();
});

test('Stream Deck Repeat and Shuffle await Chrome startup even when the last tab left a fresh snapshot', async () => {
  const track = { title: 'Last song', trackId: 'aaaaaaaaaaa', repeatMode: 'ONE', shuffleEnabled: false, lastMediaSyncAt: 1000 };
  const h = harness({ selected: ['12', track] });
  h.channel(true, true, true).close();
  const repeat = h.commands.request('repeat');
  const shuffle = h.commands.request('shuffle');
  await h.advance(2000);
  assert.deepEqual(h.launches, [{ openMusic: false }]);
  // Reconciliation removes the old tab when the restarted worker connects.
  h.select(null);
  await h.advance(3000);
  for (const [index, [type, request]] of [['repeat', repeat], ['shuffle', shuffle]].entries()) {
    const poll = h.channel(true, true, true, []);
    const [command] = poll.replies[0].data.commands;
    assert.equal(command.type, type);
    assert.equal(command.queueStartup, true);
    assert.equal(command.nativeLaunched, index === 0);
    assert.equal(command.preferredTabId, null);
    assert.equal(command.playerKey, undefined);
    h.commands.acknowledge(command.id, true);
    assert.equal(await request, true);
  }
  assert.deepEqual([track.repeatMode, track.shuffleEnabled], ['ONE', false]);
});

test('a deferred queue input does not reach an extension without startup support', async () => {
  const h = harness();
  const shuffle = h.commands.request('shuffle');
  const older = h.channel(true, true);
  assert.equal(await shuffle, false);
  assert.equal(h.commands.lastError, 'shuffle-update-required');
  assert.deepEqual(older.replies, []);
  older.close();
  await h.advance(2000);
  assert.deepEqual(h.launches, []);
});

test('a brief gap between polls keeps a live queue input bound to the same tab', async () => {
  const track = { title: 'Song', trackId: 'aaaaaaaaaaa', shuffleEnabled: false, lastMediaSyncAt: 1000 };
  const h = harness({ selected: ['12', track] });
  h.channel(true, true).close();
  const request = h.commands.request('shuffle');
  // The selected player can change between polls. Never silently switch a
  // live request to that player while the original tab still exists.
  h.select(['15', { ...track, trackId: 'bbbbbbbbbbb' }]);
  const poll = h.channel(true, true, false, [12, 15]);
  const [command] = poll.replies[0].data.commands;
  assert.equal(command.queueStartup, undefined);
  assert.equal(command.playerKey, track.trackId);
  assert.equal(command.preferredTabId, 12);
  h.commands.acknowledge(command.id, true);
  assert.equal(await request, true);
  await h.advance(2000);
  assert.deepEqual(h.launches, []);
});

test('strict popup input waits for the browser channel even before its first poll instead of using the legacy queue', async () => {
  const h = harness({ selected: ['12', { title: 'Song', artist: 'Artist', volume: 50 }] });
  let finished = false;
  const input = h.commands.request('volume_set', 0, { playerKey: 'selected-track' }).then(ok => { finished = true; return ok; });
  await Promise.resolve();
  assert.equal(finished, false);
  assert.deepEqual(h.commands.dispatch('12'), []);
  const poll = h.channel(true), command = poll.replies[0].data.commands[0];
  assert.equal(command.type, 'volume_set'); assert.equal(command.amount, 0);
  assert.equal(command.playerKey, 'selected-track');
  h.commands.acknowledge(command.id, true);
  assert.equal(await input, true);
  assert.equal(h.timers.size, 0);
});

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
