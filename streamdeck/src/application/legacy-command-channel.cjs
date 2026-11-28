'use strict';
const { isLegacyCommand, isRatingCommand } = require('../../../chrome-extension/command-policy.js');
const { trackKey } = require('../domain/player-state.cjs');
const { limit } = require('../domain/values.cjs');

function createLegacyCommandChannel({ getSession, selectedEntry, now, setTimeout, clearTimeout }) {
  const queue = [];
  const listenWaiters = new Map();
  function addCommand(type, ticks = 0) {
    if (getSession().blocked) return false;
    const entry = selectedEntry();
    if (!entry) return false;
    const [clientId, state] = entry;
    if (!isLegacyCommand(type)) return false;
    const amount = type === 'volume_delta' ? limit(Number(ticks) || 0, -100, 100) : 0;
    if (type === 'volume_delta' && amount === 0) return true;
    const rating = isRatingCommand(type);
    if (rating && (!state.title || state.rating === null)) return false;
    queue.push({ clientId, type, amount, created: now(),
      ...(rating ? { trackKey: trackKey(state) } : {}) });
    while (queue.length > 60) queue.shift();
    flushWaiters(clientId);
    return true;
  }
  function dispatch(clientId) {
    const out = [];
    for (let i = queue.length - 1; i >= 0; i--) {
      const cmd = queue[i];
      if (now() - cmd.created > 5000) { queue.splice(i, 1); continue; }
      if (cmd.clientId === clientId) {
        out.push({ type: cmd.type, amount: cmd.amount, ...(cmd.trackKey ? { trackKey: cmd.trackKey } : {}) });
        queue.splice(i, 1);
      }
    }
    return out.reverse();
  }
  // Deliver controls to an already-waiting Chrome tab instead of waiting for its next 550ms state poll.
  function flushWaiters(clientId) {
    const waiting = listenWaiters.get(clientId);
    if (!waiting?.size) return;
    for (const waiter of [...waiting]) {
      const commands = dispatch(clientId);
      if (!commands.length) break;
      waiter.reply({ commands });
    }
  }
  function listenForCommands(clientId, channel) {
    const immediately = dispatch(clientId);
    if (immediately.length) return channel.reply({ commands: immediately });
    const set = listenWaiters.get(clientId) || new Set();
    listenWaiters.set(clientId, set);
    let complete = false;
    const waiter = {
      timer: null,
      reply(message, status = 200) {
        if (complete) return;
        complete = true;
        clearTimeout(waiter.timer);
        set.delete(waiter);
        if (!set.size) listenWaiters.delete(clientId);
        channel.reply(message, status);
      },
    };
    set.add(waiter);
    // Below MV3 service-worker request duration limits; repeated when idle.
    waiter.timer = setTimeout(() => waiter.reply({ commands: [] }), 12000);
    channel.onClose(() => {
      if (!complete) {
        complete = true;
        clearTimeout(waiter.timer);
        set.delete(waiter);
        if (!set.size) listenWaiters.delete(clientId);
      }
    });
  }
  function replyToAll(message, status) {
    for (const waiters of [...listenWaiters.values()]) {
      for (const waiter of [...waiters]) waiter.reply(message, status);
    }
  }
  return {
    add: addCommand, dispatch, listen: listenForCommands,
    get polling() { return listenWaiters.size > 0; },
    cancel(message, status) {
      replyToAll(message, status);
      queue.length = 0;
    },
    removePlayer(clientId) {
      for (const waiter of [...(listenWaiters.get(clientId) || [])]) waiter.reply({ commands: [], idle: true });
    },
    notifyPortChange() { replyToAll({ commands: [] }); },
  };
}

module.exports = { createLegacyCommandChannel };
