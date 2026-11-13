import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../chrome-extension/popup.js', import.meta.url), 'utf8');
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const compatibility = { pluginVersion: '1.1.2-dev', extensionVersion: '1.1.2-dev', negotiatedProtocolVersion: 1 };

function harness({ local = { ok: true, active: false, mode: 'local' } } = {}) {
  let localState = local;
  const nodes = new Map(), requests = [];
  const timers = new Map(), windowHandlers = {};
  let nextTimer = 0;
  function element(id) {
    if (!nodes.has(id)) nodes.set(id, { value: '', textContent: '', style: {}, handlers: {}, attrs: {}, hidden: false, disabled: false,
      setAttribute(key, value) { this.attrs[key] = value; }, removeAttribute(key) { delete this.attrs[key]; },
      addEventListener(type, run) { this.handlers[type] = run; },
      click() { return this.handlers.click(); }, input() { this.handlers.input({ target: this }); }, change() { return this.handlers.change({ target: this }); } });
    return nodes.get(id);
  }
  const chrome = {
    i18n: { getUILanguage: () => 'en', getMessage: key => key },
    runtime: { sendMessage(message) {
      if (message.type === 'player-status') return Promise.resolve(localState);
      return new Promise((resolve, reject) => requests.push({ ...message, resolve, reject }));
    } },
  };
  const document = { hidden: false, documentElement: {}, getElementById: element };
  vm.runInNewContext(source, { chrome, document,
    setInterval(run, delay) { assert.equal(delay, 1000); timers.set(++nextTimer, run); return nextTimer; },
    clearInterval(id) { timers.delete(id); },
    window: { addEventListener(type, run) { windowHandlers[type] = run; } },
  });
  function take(type) {
    const index = requests.findIndex(request => request.type === type);
    assert.notEqual(index, -1, `missing ${type} request`);
    return requests.splice(index, 1)[0];
  }
  return { element, take, document, requests, timers, setLocal(value) { localState = value; }, close() { windowHandlers.pagehide(); },
    async tick() { for (const run of timers.values()) run(); await flush(); }, async ready() {
    take('get-port').resolve({ ok: true, port: 17864 });
    take('check').resolve({ ok: true, active: false, compatibility });
    await flush();
  } };
}

test('a delayed pairing response cannot replace a newer unpair result or clear its input', async () => {
  const h = harness(); await h.ready();
  h.element('pin').value = '654321';
  const pair = h.element('connect').click(), pairReply = h.take('pair');
  const unpair = h.element('forget').click();
  h.take('unpair').resolve({ ok: true }); await unpair;
  assert.equal(h.element('feedback').textContent, 'removed');
  pairReply.resolve({ ok: true, compatibility }); await pair;
  assert.equal(h.element('feedback').textContent, 'removed');
  assert.equal(h.element('versions').textContent, '');
  assert.equal(h.element('pin').value, '654321');
});

for (const rejected of [false, true]) {
  test(`a stale startup status ${rejected ? 'rejection' : 'response'} cannot replace a successful pairing`, async () => {
    const h = harness(), oldStatus = h.take('check');
    h.take('get-port').resolve({ ok: true, port: 17864 });
    h.element('pin').value = '654321';
    const pair = h.element('connect').click();
    h.take('pair').resolve({ ok: true, compatibility }); await pair;
    const versions = h.element('versions').textContent;
    if (rejected) oldStatus.reject(Error('old failure'));
    else oldStatus.resolve({ ok: false, error: 'old failure', compatibility: { pluginVersion: '9.9.9' } });
    await flush();
    assert.equal(h.element('feedback').textContent, 'connected');
    assert.equal(h.element('versions').textContent, versions);
  });
}

test('a stale port-save response cannot replace the latest port and status', async () => {
  const h = harness(); await h.ready();
  h.element('port').value = '23111';
  const first = h.element('savePort').click(), oldReply = h.take('set-port');
  h.element('port').value = '23112';
  const second = h.element('savePort').click();
  h.take('set-port').resolve({ ok: true, port: 23112 }); await second;
  const status = h.element('feedback').textContent;
  oldReply.resolve({ ok: true, port: 23111 }); await first;
  assert.equal(h.element('port').value, '23112');
  assert.equal(h.element('feedback').textContent, status);
});

test('startup port loading preserves edits made before the response arrives', async () => {
  const h = harness();
  h.element('port').value = '23111'; h.element('port').input();
  await h.ready();
  assert.equal(h.element('port').value, '23111');
});

test('a port-save response preserves a newer unsaved edit', async () => {
  const h = harness(); await h.ready();
  h.element('port').value = '23111';
  const save = h.element('savePort').click();
  h.element('port').value = '23112'; h.element('port').input();
  h.take('set-port').resolve({ ok: true, port: 23111 }); await save;
  assert.equal(h.element('port').value, '23112');
  assert.equal(h.element('feedback').textContent, 'portSaved 23111');
});

test('validation of the latest user action supersedes an older pending status response', async () => {
  const h = harness(); await h.ready();
  const check = h.element('refresh').click(), oldReply = h.take('check');
  h.element('pin').value = '12'; await h.element('connect').click();
  oldReply.resolve({ ok: true, active: false, compatibility }); await check;
  assert.equal(h.element('feedback').textContent, 'invalid');
});

test('an open popup refreshes tracks, artwork failures, player closure and connection loss without overlapping polls', async () => {
  const h = harness(); await h.ready();
  await h.tick();
  const first = h.take('check');
  await h.tick();
  assert.equal(h.requests.length, 0, 'a slow poll must finish before another starts');
  first.resolve({ ok: true, active: true, track: 'First song', coverStatus: 'ready' }); await flush();
  assert.equal(h.element('trackTitle').textContent, 'First song');
  await h.tick();
  h.take('check').resolve({ ok: true, active: true, track: 'Next song', coverStatus: 'failed' }); await flush();
  assert.equal(h.element('trackTitle').textContent, 'Next song');
  assert.match(h.element('status').textContent, /artwork: coverFailed/);
  assert.doesNotMatch(h.element('trackTitle').textContent, /First song/);
  await h.tick();
  h.take('check').resolve({ ok: true, active: false }); await flush();
  assert.equal(h.element('status').textContent, 'paired');
  await h.tick();
  h.take('check').reject(Error('bridge offline')); await flush();
  assert.equal(h.element('status').textContent, 'bridge offline');
  await h.tick();
  h.take('check').resolve({ ok: true, active: true, track: 'Recovered song' }); await flush();
  assert.equal(h.element('trackTitle').textContent, 'Recovered song');
});

for (const [button, type, response] of [
  ['connect', 'pair', { ok: true, compatibility }],
  ['forget', 'unpair', { ok: true }],
  ['savePort', 'set-port', { ok: true, port: 23111 }],
]) {
  test(`automatic status waits for ${type} and preserves its feedback`, async () => {
    const h = harness(); await h.ready();
    h.element('pin').value = '654321'; h.element('port').value = '23111';
    const operation = h.element(button).click(), reply = h.take(type);
    await h.tick();
    assert.equal(h.requests.length, 0);
    reply.resolve(response); await operation;
    const feedback = h.element('feedback').textContent;
    assert.ok(feedback);
    await h.tick();
    h.take('check').resolve({ ok: true, active: true, track: 'Current song', compatibility }); await flush();
    assert.equal(h.element('trackTitle').textContent, 'Current song');
    assert.equal(h.element('feedback').textContent, feedback);
  });
}

test('a stale automatic read cannot replace a newer action or its versions, and later polling preserves validation feedback', async () => {
  const h = harness(); await h.ready();
  await h.tick();
  const oldReply = h.take('check');
  h.element('pin').value = '12'; await h.element('connect').click();
  const versions = h.element('versions').textContent;
  oldReply.resolve({ ok: true, active: true, track: 'Old song', compatibility: { pluginVersion: '9.9.9' } }); await flush();
  assert.equal(h.element('feedback').textContent, 'invalid');
  assert.doesNotMatch(h.element('trackTitle').textContent, /Old song/);
  assert.equal(h.element('versions').textContent, versions);
  await h.tick();
  h.take('check').resolve({ ok: true, active: true, track: 'New song', compatibility }); await flush();
  assert.equal(h.element('trackTitle').textContent, 'New song');
  assert.equal(h.element('feedback').textContent, 'invalid');
});

test('hidden popups skip polling and closing clears the timer and discards outstanding status', async () => {
  const h = harness(); await h.ready();
  h.document.hidden = true;
  await h.tick();
  assert.equal(h.requests.length, 0);
  h.document.hidden = false;
  await h.tick();
  const reply = h.take('check'), status = h.element('status').textContent;
  h.close();
  assert.equal(h.timers.size, 0);
  reply.resolve({ ok: true, active: true, track: 'Closed song' }); await flush();
  assert.equal(h.element('status').textContent, status);
  await h.tick();
  assert.equal(h.requests.length, 0);
});

const playerState = (changes = {}) => ({ ok: true, active: true, popupControls: true, popupVolume: true, coverStatus: 'missing',
  compatibility, player: { id: '12', key: 'aaaaaaaaaaa', title: 'Player song', artist: 'Artist', playing: true,
    rating: 'INDIFFERENT', coverKey: '', volume: 50, muted: false, ...changes } });
async function showState(h, state = playerState()) {
  await h.tick(); h.take('check').resolve(state); await flush();
}

test('player controls follow observed playback, rating, capability and connection state', async () => {
  const h = harness(); await h.ready();
  assert.equal(h.element('playPause').disabled, true);
  await showState(h);
  assert.equal(h.element('playPause').disabled, false);
  assert.equal(h.element('playPause').attrs['aria-label'], 'pause');
  assert.equal(h.element('pauseIcon').hidden, false);
  assert.equal(h.element('trackArtist').textContent, 'Artist');
  await showState(h, playerState({ playing: false, rating: 'LIKE' }));
  assert.equal(h.element('playPause').attrs['aria-label'], 'play');
  assert.equal(h.element('like').attrs['aria-pressed'], 'true');
  assert.equal(h.element('dislike').attrs['aria-pressed'], 'false');
  await showState(h, playerState({ rating: null }));
  assert.equal(h.element('like').disabled, true);
  assert.equal(h.element('playPause').disabled, false);
  await showState(h, { ...playerState(), playerStale: true });
  assert.equal(h.element('playPause').disabled, true);
  await showState(h, { ok: true, active: true, track: 'Legacy song' });
  assert.equal(h.element('trackTitle').textContent, 'Legacy song');
  assert.equal(h.element('playPause').disabled, true);
  assert.match(h.element('status').textContent, /controlUpdate/);
  await showState(h, { ok: false, error: 'offline' });
  assert.equal(h.element('trackTitle').textContent, 'playerWaiting');
  assert.equal(h.element('like').attrs['aria-pressed'], 'false');
});

for (const [id, command] of [['previous', 'prev'], ['playPause', 'toggle'], ['next', 'next'], ['like', 'like'], ['dislike', 'dislike'], ['mute', 'mute']]) {
  test(`popup ${command} binds the request to the displayed track and waits for observed state`, async () => {
    const h = harness(); await h.ready(); await showState(h);
    const operation = h.element(id).click(), request = h.take('control');
    assert.equal(request.command, command);
    assert.equal(request.playerId, '12');
    assert.equal(request.trackKey, 'aaaaaaaaaaa');
    assert.equal(h.element(id).disabled, true);
    await h.element(id).click();
    assert.equal(h.requests.length, 0, 'disabled controls must not duplicate the action');
    assert.equal(h.element('playPause').attrs['aria-label'], 'pause', 'no optimistic playback state');
    assert.equal(h.element('like').attrs['aria-pressed'], 'false', 'no optimistic rating');
    request.resolve({ ok: true }); await operation;
    h.take('check').resolve(playerState({ playing: false, rating: 'LIKE', muted: true, volume: 55 })); await flush();
    assert.equal(h.element('playPause').attrs['aria-label'], 'play');
    assert.equal(h.element('like').attrs['aria-pressed'], 'true');
    assert.equal(h.element('likeIcon').src, 'icons/controls/like-selected.png');
    assert.equal(h.element('volumeValue').textContent, '55%');
    assert.equal(h.element('mute').attrs['aria-pressed'], 'true');
    assert.equal(h.element('muteIcon').src, 'icons/controls/mute.png');
  });
}

test('Pause stays available during navigation and an older command result cannot replace its feedback', async () => {
  const h = harness(); await h.ready(); await showState(h);
  const next = h.element('next').click(), nextReply = h.take('control');
  assert.equal(h.element('playPause').disabled, false);
  const pause = h.element('playPause').click(), pauseReply = h.take('control');
  pauseReply.resolve({ ok: false, reason: 'player-changed' }); await pause;
  assert.equal(h.element('controlFeedback').textContent, 'controlChanged');
  nextReply.resolve({ ok: false, reason: 'command-superseded' }); await next;
  assert.equal(h.element('controlFeedback').textContent, 'controlChanged');
  h.take('check').resolve(playerState({ playing: false })); await flush();
});

test('artwork replies cannot replace a newer track and untrusted images retain the placeholder', async () => {
  const h = harness(); await h.ready();
  await showState(h, { ...playerState({ coverKey: 'cover-a' }), coverStatus: 'ready' });
  const first = h.take('artwork');
  assert.equal(first.trackKey, 'aaaaaaaaaaa');
  await showState(h, { ...playerState({ key: 'bbbbbbbbbbb', coverKey: 'cover-b' }), coverStatus: 'ready' });
  const second = h.take('artwork');
  first.resolve({ ok: true, image: 'data:image/png;base64,AQID' }); await flush();
  assert.equal(h.element('artwork').hidden, true);
  second.resolve({ ok: true, image: 'data:image/svg+xml;base64,AQID' }); await flush();
  assert.equal(h.element('artwork').hidden, true);
  assert.equal(h.element('coverFallback').hidden, false);
  await showState(h, { ...playerState({ key: 'ccccccccccc', coverKey: 'cover-c' }), coverStatus: 'ready' });
  h.take('artwork').resolve({ ok: true, image: 'data:image/png;base64,AQID' }); await flush();
  assert.equal(h.element('artwork').hidden, false);
  assert.equal(h.element('coverFallback').hidden, true);
  await showState(h, { ok: false });
  assert.equal(h.element('artwork').hidden, true);
  assert.equal(h.element('playPause').disabled, true);
});

test('connection settings honor a user opening them before the startup check finishes', async () => {
  const h = harness();
  h.element('connectionSettings').open = true;
  await h.element('settingsSummary').click();
  await h.ready();
  assert.equal(h.element('connectionSettings').open, true);
});

test('volume slider coalesces rapid changes, preserves dragging through polls and confirms the last absolute value', async () => {
  const h = harness(); await h.ready(); await showState(h);
  assert.equal(h.element('volumeSlider').value, '50');
  h.element('volumeSlider').value = '0'; h.element('volumeSlider').input(); h.element('volumeSlider').change();
  const first = h.take('control');
  assert.equal(first.command, 'volume_set'); assert.equal(first.amount, 0);
  assert.equal(h.element('volumeSlider').disabled, false);
  h.element('volumeSlider').value = '60'; h.element('volumeSlider').input(); h.element('volumeSlider').change();
  h.element('volumeSlider').value = '85'; h.element('volumeSlider').input(); h.element('volumeSlider').change();
  await showState(h, playerState({ volume: 30 }));
  assert.equal(h.element('volumeSlider').value, '85', 'polls must not move the thumb during input');
  assert.equal(h.element('volumeValue').textContent, '85%');
  assert.equal(h.requests.length, 0, 'only one volume request is sent at a time');
  first.resolve({ ok: true }); await flush();
  const last = h.take('control');
  assert.equal(last.amount, 85, 'intermediate 60 is coalesced');
  last.resolve({ ok: true }); await flush();
  h.take('check').resolve(playerState({ volume: 85 })); await flush();
  assert.equal(h.element('volumeSlider').value, '85');
  await showState(h, playerState({ volume: 100 }));
  assert.equal(h.element('volumeSlider').value, '100');
});

test('unconfirmed slider input restores observed volume and identity changes discard queued input', async () => {
  const h = harness(); await h.ready(); await showState(h);
  h.element('volumeSlider').value = '70'; h.element('volumeSlider').input(); h.element('volumeSlider').change();
  const reply = h.take('control');
  h.element('volumeSlider').value = '90'; h.element('volumeSlider').input(); h.element('volumeSlider').change();
  await showState(h, playerState({ id: '13', key: 'new-track', volume: 25 }));
  reply.resolve({ ok: false }); await flush();
  assert.equal(h.element('volumeSlider').value, '25');
  assert.ok(!h.requests.some(request => request.type === 'control'), 'no queued input reaches the new player');
  h.take('check').resolve({ ok: false }); await flush();
  assert.equal(h.element('volumeSlider').disabled, true);
  assert.equal(h.element('volumeValue').textContent, '—');
});

test('standalone controls keep working without a bridge and switch routes only for the next input after recovery', async () => {
  const local = { ...playerState(), mode: 'local' };
  const h = harness({ local }); await h.ready();
  assert.equal(h.element('playPause').disabled, false);
  const action = h.element('playPause').click(), reply = h.take('local-control');
  assert.equal(reply.command, 'toggle');
  reply.resolve({ ok: true }); await action;
  h.take('check').resolve({ ...playerState(), player: { ...local.player, volume: 55 } }); await flush();
  const recovered = h.element('next').click(), bridgeReply = h.take('control');
  assert.equal(bridgeReply.command, 'next');
  bridgeReply.resolve({ ok: false }); await recovered;
  h.take('check').resolve({ ok: false, error: 'offline' }); await flush();
  assert.equal(h.element('playPause').disabled, false);
  assert.ok(!h.requests.some(request => request.type === 'local-control'), 'failed bridge input is never retried locally');
});
