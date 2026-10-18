import test from 'node:test';
import assert from 'node:assert/strict';
import { createBridgeFixture } from './helpers/bridge.mjs';
const BAD_ORIGIN = 'https://music.youtube.com';
const OTHER_EXTENSION = 'chrome-extension://' + 'b'.repeat(32);
test('local bridge pairing, auth, standalone prioritization and queue', async t => {
  const bridge = await createBridgeFixture(t, { pin: '456789' });
  const post = async (route, body, origin) => {
    const result = await bridge.post(route, body, { origin });
    return { code: result.status, json: result.body };
  };
  try {
    assert.equal((await post('/pair',{pin:'456789'},BAD_ORIGIN)).code,403,'web page must be denied');
    assert.equal((await post('/pair',{pin:'000000'})).code,403,'incorrect PIN denied');
    assert.equal((await post('/sync',{token:'invalid',clientId:1,state:{}})).code,401);
    const paired = await post('/pair',{pin:'456789'});
    // Test server has no physical Stream Deck available; a test-mode PIN is preselected.
    assert.equal(paired.code,200);
    assert.match(paired.json.token,/^[a-f0-9]{64}$/);
    const token=paired.json.token;
    assert.equal((await post('/status',{token},OTHER_EXTENSION)).code,401,'different extension denied');
    const browser = {title:'Normal tab',artist:'Test',playing:true,volume:45,standalone:false};
    const pwa = {title:'Standalone PWA',artist:'Singer',playing:false,volume:62,standalone:true};
    assert.equal((await post('/sync',{token,clientId:10,state:browser})).code,200);
    assert.equal((await post('/sync',{token,clientId:11,state:pwa})).code,200);
    const status = await post('/status',{token});
    assert.equal(status.json.active,true);
    assert.equal(status.json.track,'Standalone PWA');
    assert.equal(status.json.coverStatus,'missing');
    await post('/sync',{token,clientId:11,state:{...pwa,cover:'https://untrusted.test/cover.jpg'}});
    assert.equal((await post('/status',{token})).json.coverStatus,'blocked');
    const enqueued = await post('/__test/command',{token,type:'volume_delta',amount:8});
    assert.equal(enqueued.json.accepted,true);
    const wrong = await post('/sync',{token,clientId:10,state:browser});
    assert.deepEqual(wrong.json.commands,[]);
    const correct = await post('/sync',{token,clientId:11,state:pwa});
    assert.deepEqual(correct.json.commands,[{type:'volume_delta',amount:8}]);
    const twice = await post('/sync',{token,clientId:11,state:pwa});
    assert.deepEqual(twice.json.commands,[]);
  } finally { await bridge.stop(); }
});

test('immediate long-poll delivery and configurable volume dial steps', async t => {
  const bridge = await createBridgeFixture(t, { pin: '456789' });
  const post = async (route, body, origin) => {
    const result = await bridge.post(route, body, { origin });
    return { code: result.status, json: result.body };
  };
  try {
    const paired=await post('/pair',{pin:'456789'});
    assert.equal(paired.code,200);
    const token=paired.json.token;
    const state={title:'Example',artist:'Tester',volume:50,playing:true,standalone:true};
    await post('/sync',{token,clientId:12,state});

    await post('/__test/event',{token,event:{event:'willAppear',
      context:'dial1',action:'io.github.minjungw00.musicdeckbridge.volume',payload:{settings:{volumeStep:9}}}});
    let pull=post('/listen',{token,clientId:12});
    await new Promise(resolve=>setTimeout(resolve,55));
    const start=Date.now();
    await post('/__test/event',{token,event:{event:'dialRotate',
      context:'dial1',action:'io.github.minjungw00.musicdeckbridge.volume',payload:{ticks:2}}});
    const received=await pull;
    assert.equal(received.code,200);
    assert.deepEqual(received.json.commands,[{type:'volume_delta',amount:10}]);
    assert.ok(Date.now()-start<650,'should deliver without waiting for the 550ms sync clock');

    await post('/__test/event',{token,event:{event:'didReceiveSettings',
      context:'dial1',action:'io.github.minjungw00.musicdeckbridge.volume',payload:{settings:{volumeStep:3}}}});
    await post('/__test/event',{token,event:{event:'dialRotate',
      context:'dial1',action:'io.github.minjungw00.musicdeckbridge.volume',payload:{ticks:-2}}});
    assert.deepEqual((await post('/sync',{token,clientId:12,state})).json.commands,
      [{type:'volume_delta',amount:-6}]);
  } finally { await bridge.stop(); }
});

test('track dial preserves tick counts and direction, caps bursts and ignores invalid ticks', async t => {
  const bridge = await createBridgeFixture(t, { pin: '456789' });
  const post = async (route, body, origin) => {
    const result = await bridge.post(route, body, { origin });
    return { code: result.status, json: result.body };
  };
  try {
    const { json: { token } } = await post('/pair', { pin: '456789' });
    const state = { title: 'Example', playing: true };
    async function rotate(ticks) {
      assert.equal((await post('/__test/event', { token, event: {
        event: 'dialRotate', context: 'track', action: 'io.github.minjungw00.musicdeckbridge.trackdial',
        payload: { ticks },
      } })).code, 200);
    }
    await rotate(3); // No player selected yet: these must not be queued for a later player.
    assert.deepEqual((await post('/sync', { token, clientId: 15, state })).json.commands, []);
    for (const [ticks, count, type] of [[1, 1, 'next'], [3, 3, 'next'], [-2, 2, 'prev'], [100, 5, 'next'], [-100, 5, 'prev']]) {
      await rotate(ticks);
      assert.deepEqual((await post('/sync', { token, clientId: 15, state })).json.commands,
        Array.from({ length: count }, () => ({ type, amount: 0 })), `ticks: ${ticks}`);
    }
    for (const ticks of [0, undefined, null, 0.5, -0.5, 1e100, -1e100, 'invalid']) {
      await rotate(ticks);
      assert.deepEqual((await post('/sync', { token, clientId: 15, state })).json.commands, [], `ticks: ${ticks}`);
    }
    await rotate(3);
    await rotate(-2);
    assert.deepEqual((await post('/sync', { token, clientId: 15, state })).json.commands,
      ['next', 'next', 'next', 'prev', 'prev'].map(type => ({ type, amount: 0 })));
  } finally { await bridge.stop(); }
});
