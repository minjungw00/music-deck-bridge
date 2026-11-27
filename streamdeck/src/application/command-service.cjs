'use strict';
const crypto = require('node:crypto');
const { isBrowserCommand, isLegacyCommand, isRatingCommand, isQueueControl: queueControl } =
  require('../../../chrome-extension/command-policy.js');
const { PLAYER_STALE_MS, trackKey } = require('../domain/player-state.cjs');
const { limit } = require('../domain/values.cjs');
const COMMAND_ERRORS = new Set(['pairing-required', 'extension-unavailable', 'command-timeout',
  'authorization-lost', 'injection-unavailable', 'receiver-unavailable', 'delivery-uncertain',
  'player-rejected', 'player-not-ready', 'browser-api-failed', 'bridge-unavailable', 'command-failed',
  'autoplay-blocked', 'player-error', 'playback-unconfirmed', 'command-superseded', 'protocol-incompatible',
  'invalid-protocol', 'player-changed', 'repeat-update-required', 'repeat-unavailable',
  'shuffle-update-required', 'shuffle-unavailable']);

// A channel port supplies reply(data, status) and onClose(callback); no HTTP objects enter this service.
function createCommandService({ getSession, selectedEntry, launch, log,
  now = Date.now, newId = () => crypto.randomBytes(12).toString('hex'),
  setTimeout = globalThis.setTimeout, clearTimeout = globalThis.clearTimeout }) {
  const queue = [];
  const listenWaiters = new Map(); // active one-shot long polls per Chrome tab
  let browserWaiter = null;
  const browserRequests = new Map();
  let nativeLaunchStarted = false;
  let nativeTabPending = false;
  let nativeLaunchTimer = null;
  let browserCapable = false;
  let browserRepeat = false;
  let browserShuffle = false;
  let lastCommandError = '';
  let latestRequest = 0;
  const hasLaunchableRequest = () => [...browserRequests.values()].some(request => request.queueStartup || !queueControl(request.type));
  const supports = type => type === 'repeat' ? browserRepeat : browserShuffle;
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
  function scheduleNativeLaunch() {
    if (getSession().blocked || getSession().pairingRequired || !hasLaunchableRequest() || nativeLaunchStarted || nativeLaunchTimer ||
        [...browserRequests.values()].some(request => request.state === 'delivered')) return;
    nativeLaunchTimer = setTimeout(async () => {
      nativeLaunchTimer = null;
      if (getSession().blocked || getSession().pairingRequired || !hasLaunchableRequest() ||
          [...browserRequests.values()].some(request => request.state === 'delivered')) return;
      nativeLaunchStarted = true;
      nativeTabPending = true;
      const session = getSession();
      const requests = [...browserRequests.values()];
      try {
        await launch({ openMusic: !session.paired });
        // Without credentials only opening is possible; never bypass PIN pairing.
        if (!session.paired && getSession().generation === session.generation) for (const request of requests) request.finish(request.type === 'open');
      } catch (error) {
        log(`Chrome launch failed: ${error.message}`);
        for (const request of requests) request.finish(false);
      }
    }, getSession().paired ? 2000 : 0);
  }
  function flushBrowserRequest() {
    if (getSession().blocked) return;
    const pending = [...browserRequests.values()];
    const request = browserWaiter?.concurrent ? pending.find(item => item.state === 'queued') : pending[0];
    if (!browserWaiter || !request || request.state === 'delivered') return;
    // The browser poll has reconciled closed tabs, including those that could
    // not report their closure before Chrome exited. Keep the track binding
    // if the original tab is still present after a brief polling gap.
    const selected = request.queueStartup ? selectedEntry() : null;
    const selectedTabId = selected ? Number(selected[0]) : null;
    const queueStartup = request.queueStartup && (!request.playerKey ||
      !(browserWaiter.clientIds?.includes(request.preferredTabId) ?? (selectedTabId === request.preferredTabId)));
    if (queueControl(request.type) && (!supports(request.type) || (queueStartup && !browserWaiter.queueStartup))) {
      return request.finish(false, `${request.type}-update-required`);
    }
    if (browserWaiter.concurrent && pending.filter(item => item.state === 'delivered').length >= 8) return;
    const preferredTabId = queueStartup ? selectedTabId : request.preferredTabId;
    const playerKey = queueStartup ? undefined : request.playerKey;
    request.state = 'delivered';
    clearTimeout(nativeLaunchTimer); nativeLaunchTimer = null;
    browserWaiter.reply({ commands: [{ id: request.id, type: request.type, amount: request.amount,
      expiresAt: request.expiresAt, nativeLaunched: nativeTabPending,
      preferredTabId, ...(request.trackKey ? { trackKey: request.trackKey } : {}),
      ...(playerKey ? { playerKey } : {}), ...(queueStartup ? { queueStartup: true } : {}) }] });
    nativeTabPending = false;
  }
  function listenForBrowser(channel, { concurrent = false, repeat = false, shuffle = false, queueStartup = false, clientIds } = {}) {
    // One paired extension profile owns the browser-wide channel, even with no tabs.
    browserCapable = true;
    browserRepeat = repeat;
    browserShuffle = shuffle;
    browserWaiter?.reply({ commands: [] });
    const waiter = {
      concurrent, clientIds, queueStartup,
      timer: null,
      reply(message, status = 200) {
        clearTimeout(waiter.timer);
        if (browserWaiter !== waiter) return;
        browserWaiter = null;
        channel.reply(message, status);
      },
    };
    browserWaiter = waiter;
    waiter.timer = setTimeout(() => waiter.reply({ commands: [] }), 12000);
    channel.onClose(() => {
      if (browserWaiter === waiter) { clearTimeout(waiter.timer); browserWaiter = null; }
    });
    flushBrowserRequest();
  }
  function queueError(type, state) {
    if (browserCapable && !supports(type)) return `${type}-update-required`;
    const available = type === 'repeat' ? Boolean(state?.repeatMode) : typeof state?.shuffleEnabled === 'boolean';
    return supports(type) && available && now() - state.lastMediaSyncAt < PLAYER_STALE_MS ? '' : `${type}-unavailable`;
  }
  async function requestPlayerCommand(type, amount = 0, { playerKey } = {}) {
    if (!isBrowserCommand(type)) return false;
    const session = getSession();
    if (session.pairingRequired) { lastCommandError = 'pairing-required'; return false; }
    if (session.blocked) { lastCommandError = session.errorCode; return false; }
    const entry = selectedEntry();
    const state = entry?.[1];
    const isQueue = queueControl(type);
    const queueStartup = isQueue && !playerKey && (!state?.title || !browserWaiter);
    if (isQueue) {
      const error = queueStartup ? (session.paired ? '' : 'pairing-required') : queueError(type, state);
      if (error) { lastCommandError = error; return false; }
      if (state?.title) playerKey = trackKey(state);
    }
    // Keep existing controls available when paired with a legacy extension.
    if (type !== 'open' && !isQueue && !browserCapable && entry && !playerKey) return addCommand(type, amount);
    if (type === 'open') {
      const existing = [...browserRequests.values()].find(request => request.type === 'open');
      if (existing) return existing.promise;
    }
    if (browserRequests.size >= 60) return false;
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    const timeout = isQueue && !queueStartup ? 4000 : 45000;
    const request = {
      id: newId(), type, amount, promise, state: 'queued', order: ++latestRequest,
      expiresAt: now() + timeout, preferredTabId: entry ? Number(entry[0]) : null,
      playerKey, queueStartup,
      trackKey: isRatingCommand(type) && state?.title ? trackKey(state) : null,
      finish(ok, reason = 'command-failed') {
        if (!['queued', 'delivered'].includes(request.state)) return;
        request.state = reason === 'command-superseded' ? 'cancelled' : ok ? 'succeeded' :
          ['command-timeout', 'extension-unavailable'].includes(reason) ? 'expired' : 'failed';
        const failure = COMMAND_ERRORS.has(reason) ? reason : 'command-failed';
        if (request.order === latestRequest && reason !== 'command-superseded') lastCommandError = ok ? '' : failure;
        if (!ok && reason !== 'command-superseded') log(`Browser command ${type} failed: ${failure}`);
        clearTimeout(request.timer);
        browserRequests.delete(request.id);
        resolve(reason === 'command-superseded' ? null : ok);
        if (!browserRequests.size) {
          nativeLaunchStarted = false;
          nativeTabPending = false;
          clearTimeout(nativeLaunchTimer); nativeLaunchTimer = null;
        }
        flushBrowserRequest();
        scheduleNativeLaunch();
      },
    };
    request.timer = setTimeout(() => request.finish(false,
      request.state === 'delivered' ? 'command-timeout' : 'extension-unavailable'), timeout);
    browserRequests.set(request.id, request);
    flushBrowserRequest();
    scheduleNativeLaunch();
    return promise;
  }

  function cancel(message = { error: 'Pairing revoked' }, status = 401, reason = 'command-failed') {
    browserWaiter?.reply(message, status);
    clearTimeout(nativeLaunchTimer); nativeLaunchTimer = null;
    const pending = [...browserRequests.values()];
    browserRequests.clear();
    for (const request of pending) request.finish(false, reason);
    nativeLaunchStarted = false;
    nativeTabPending = false;
    browserCapable = false;
    browserRepeat = false;
    browserShuffle = false;
    for (const waiters of [...listenWaiters.values()]) {
      for (const waiter of [...waiters]) waiter.reply(message, status);
    }
    queue.length = 0;
  }
  return {
    request: requestPlayerCommand, addLegacy: addCommand, dispatch,
    listen: listenForCommands, listenBrowser: listenForBrowser,
    get lastError() { return lastCommandError; },
    get repeatError() { return queueError('repeat', selectedEntry()?.[1]); },
    get shuffleError() { return queueError('shuffle', selectedEntry()?.[1]); },
    clearProtocolError() {
      if (['protocol-incompatible', 'invalid-protocol'].includes(lastCommandError)) lastCommandError = '';
    },
    get browserPolling() { return Boolean(browserWaiter); },
    get polling() { return Boolean(browserWaiter) || [...listenWaiters.values()].some(waiters => waiters.size); },
    reset() { cancel(); lastCommandError = ''; },
    block(compatibility) {
      cancel({ error: 'Incompatible bridge protocol', errorCode: compatibility.errorCode, compatibility }, 409, compatibility.errorCode);
      lastCommandError = compatibility.errorCode;
    },
    missingCredentials() {
      if (![...browserRequests.values()].some(request => request.state === 'delivered')) {
        for (const request of [...browserRequests.values()]) request.finish(false, 'pairing-required');
      }
    },
    acknowledge(id, ok, reason) {
      const request = browserRequests.get(id);
      if (request?.state === 'delivered') request.finish(ok === true, reason);
    },
    removePlayer(clientId) {
      for (const waiter of [...(listenWaiters.get(clientId) || [])]) waiter.reply({ commands: [], idle: true });
    },
    notifyPortChange() {
      for (const waiters of [...listenWaiters.values()]) {
        for (const waiter of [...waiters]) waiter.reply({ commands: [] });
      }
    },
  };
}
module.exports = { createCommandService };
