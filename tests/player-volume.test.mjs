import test from 'node:test';
import assert from 'node:assert/strict';
import { playerHarness } from './helpers/player.mjs';

for (const compact of [false, true]) {
  test(`site ${compact ? 'compact' : 'desktop'} volume controls accept exact 1–5 point steps and clamp at limits`, async () => {
    const player = playerHarness({ compact });
    for (const amount of [1, 2, 3, 4, 5, 100, -100, 4]) {
      assert.equal((await player.send({ type: 'player-volume', command: 'volume_delta', amount })).ok, true);
    }
    assert.deepEqual(player.state.changes, [51, 53, 56, 60, 65, 100, 0, 4]);
    assert.equal(player.state.savedVolume, 4);
    assert.equal(player.audio.volume, 0.04 ** 2);
    assert.equal(player.audio.muted, false);
    assert.ok(player.sliders.every(slider => slider.value === 4));
    assert.ok(player.scriptCalls.every(call => call.world === 'MAIN' && call.target.tabId === 55 && call.target.frameIds[0] === 0));
  });
}

test('mute uses the site button and restores its remembered volume', async () => {
  const player = playerHarness();
  await player.send({ type: 'player-volume', command: 'mute' });
  assert.equal(player.audio.muted, true);
  assert.equal(player.sliders[0].value, 0);
  await player.send({ type: 'player-volume', command: 'mute' });
  assert.equal(player.audio.muted, false);
  assert.equal(player.sliders[0].value, 50);
  assert.equal(player.state.muteClicks, 2);
  assert.ok(player.scriptCalls.every(call => call.args[1] === 0));
});

test('volume control rejects unrelated senders and invalid commands without executing page code', async () => {
  const player = playerHarness();
  const command = { type: 'player-volume', command: 'volume_delta', amount: 4 };
  for (const sender of [{}, { tab: { id: 55 }, frameId: 1, url: 'https://music.youtube.com/' },
    { tab: { id: 55 }, frameId: 0, url: 'https://untrusted.test/' }]) {
    assert.equal((await player.send(command, sender)).ok, false);
  }
  for (const invalid of [{ ...command, amount: NaN }, { ...command, amount: '4' }, { ...command, command: 'eval' }]) {
    assert.equal((await player.send(invalid)).ok, false);
  }
  assert.equal(player.scriptCalls.length, 0);
});

test('unavailable site controls leave audio unchanged', async () => {
  const player = playerHarness({ available: false });
  assert.equal((await player.send({ type: 'player-volume', command: 'volume_delta', amount: 4 })).ok, false);
  assert.equal(player.audio.volume, 0.25);
  assert.equal(player.state.savedVolume, 50);
});
