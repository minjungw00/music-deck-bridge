import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from './helpers/content.mjs';
import { playerHarness } from './helpers/player.mjs';


async function scenario(useMediaSession=false, { commands, manualVolume, compact = false,
  rating = 'INDIFFERENT', ratingsAvailable = true, ratingsDisabled = false,
  browserInputs = [], initiallyPaused = false } = {}) {
  let playClicks = 0, nextClicks = 0, syncCount = 0, lastState;
  const player = playerHarness({ compact, delay: 2 });
  const { audio } = player;
  audio.paused = initiallyPaused;
  const playBtn = {click(){playClicks++;audio.paused=!audio.paused;},disabled:false,getAttribute(){return null;}};
  const nextBtn = {click(){nextClicks++;audio.currentSrc='fixture://next-'+nextClicks;},disabled:false,getAttribute(){return null;}};
  const img = { matches(){return true;}, currentSrc:'https://lh5.googleusercontent.com/cover=w120-h120-rj',src:'' };
  const thumb = { matches(){return false;},querySelectorAll(){return useMediaSession?[]:[img];},style:{} };
  const eventHandlers = {};
  const ratingClicks = [];
  const ratingButtons = Object.fromEntries(['like', 'dislike'].map(kind => [kind, {
    disabled: ratingsDisabled,
    getAttribute(name) { return name === 'aria-pressed' ? String(rating === kind.toUpperCase()) : null; },
    click() { ratingClicks.push(kind); rating = rating === kind.toUpperCase() ? 'INDIFFERENT' : kind.toUpperCase(); },
  }]));
  const renderer = {
    getAttribute(name) { return name === 'like-status' ? rating : null; },
    querySelector(selector) { return selector.includes('#button-shape-dislike') ? ratingButtons.dislike : ratingButtons.like; },
  };
  let gotCommands=false;
  let interval;
  const sandbox={
    window:{matchMedia(){return {matches:true};}},
    location:{href:'https://music.youtube.com/'},
    navigator:{mediaSession:{metadata:{title:'Media title', artist:'Media artist',
      artwork:[{src:'https://lh3.googleusercontent.com/metadata=w500',sizes:'500x500'}]}}},
    document:{
      addEventListener(event,handler){eventHandlers[event]=handler;},
      querySelectorAll(selector){
        if(selector==='video, audio') return [audio];
        if(selector==='ytmusic-player-bar .byline a') return [{textContent:'Artist'}];
        if(selector==='ytmusic-player-bar #volume-slider, ytmusic-player-bar #expand-volume-slider') return player.contentSliders;
        return [];
      },
      querySelector(selector){
        return {
          'ytmusic-player-bar .title.ytmusic-player-bar':{textContent:'Sample song'},
          'ytmusic-player-bar #thumbnail':thumb,
          'ytmusic-player-bar .play-pause-button':playBtn,
          'ytmusic-player-bar .next-button':nextBtn,
          'ytmusic-player-bar ytmusic-like-button-renderer':ratingsAvailable ? renderer : null,
        }[selector] || null;
      },
    },
    chrome:{runtime:{id:'this-extension',onMessage:{addListener(fn){eventHandlers.runtimeMessage=fn;}},async sendMessage(data){
      if(data.type==='player-volume' || data.type==='player-playback') return player.send(data);
      if(data.type==='listen') return {paired:false,commands:[]};
      if(data.type==='sync') {
        lastState=data.state; syncCount++;
        if(!gotCommands){
          gotCommands=true;
          return {paired:true,commands:commands || [{type:'volume_delta',amount:8},{type:'next'},{type:'toggle'}]};
        }
        return {paired:true,commands:[]};
      }
      return {paired:false,commands:[]};
    }}},
    setInterval(callback){interval=callback;return 1;},clearInterval(){},
    setTimeout,clearTimeout,addEventListener(event,handler){eventHandlers[event]=handler;},
    console,URL,Date,Promise,
  };
  player.setDocument(sandbox.document);
  loadContent(sandbox);
  await new Promise(resolve => setTimeout(resolve,170));
  if (manualVolume !== undefined) {
    player.setSiteVolume(manualVolume);
    eventHandlers.change({target:player.contentSliders[0]});
    await new Promise(resolve => setTimeout(resolve,170));
  }
  const browserResponses = [];
  for (const input of browserInputs) {
    input.before?.({ audio, playBtn, nextBtn, ratingButtons });
    browserResponses.push(await new Promise(resolve => {
      const keep = eventHandlers.runtimeMessage(input.message, input.sender || { id: 'this-extension' }, resolve);
      if (keep !== true) resolve({ ignored: true });
    }));
  }
  eventHandlers.pagehide?.();
  return {syncCount,lastState,playClicks,nextClicks,audio,interval,player,ratingClicks,eventHandlers,browserResponses};
}

test('Current track: artwork from YTM player-bar image, volume commands',async()=>{
  const r=await scenario(false);
  assert.equal(r.syncCount>=1,true);
  assert.equal(r.lastState.title,'Sample song');
  assert.equal(r.lastState.artist,'Artist');
  assert.equal(r.lastState.cover,'https://lh5.googleusercontent.com/cover=w512-h512-rj');
  assert.equal(r.lastState.coverFallback,'https://lh5.googleusercontent.com/cover=w120-h120-rj');
  assert.equal(r.lastState.volume,58); // second state sync reflects applied command
  assert.equal(r.lastState.standalone,true);
  assert.equal(r.audio.volume,0.58 ** 2);
  assert.ok(r.player.sliders.every(slider=>slider.value===58));
  assert.equal(r.player.state.savedVolume,58);
  assert.equal(r.playClicks,1);
  assert.equal(r.nextClicks,1);
  assert.equal(typeof r.interval,'function');
});
test('Falls back to Media Session artwork when thumbnail DOM contains no image',async()=>{
  const r=await scenario(true);
  assert.equal(r.lastState.cover,'https://lh3.googleusercontent.com/metadata=w500');
});

test('rapid dial commands stay ordered and report the site percentage rather than raw audio gain',async()=>{
  const r=await scenario(false,{compact:true,commands:[1,2,3,4,5].map(amount=>({type:'volume_delta',amount}))});
  assert.deepEqual(r.player.state.changes,[51,53,56,60,65]);
  assert.equal(r.lastState.volume,65);
  assert.equal(r.audio.volume,0.65 ** 2);
});

test('a manual site volume change is reported back to Stream Deck',async()=>{
  const r=await scenario(false,{commands:[],manualVolume:73});
  assert.equal(r.lastState.volume,73);
  assert.equal(r.audio.volume,0.73 ** 2);
});

test('rating commands toggle the current song, cancel on repeat and switch between like and dislike', async () => {
  const result = await scenario(false, { commands: ['like', 'like', 'dislike', 'like', 'dislike', 'dislike']
    .map(type => ({ type, trackKey: JSON.stringify(['Sample song', 'Artist']) })) });
  assert.deepEqual(result.ratingClicks, ['like', 'like', 'dislike', 'like', 'dislike', 'dislike']);
  assert.equal(result.lastState.rating, 'INDIFFERENT');
  for (const rating of ['LIKE', 'DISLIKE']) {
    const result = await scenario(false, { rating, commands: [] });
    assert.equal(result.lastState.rating, rating, 'site changes must be reflected in synchronized state');
  }
});

test('missing or disabled rating controls are left alone', async () => {
  for (const options of [{ ratingsAvailable: false }, { ratingsDisabled: true }]) {
    const result = await scenario(false, { ...options, commands: ['like', 'dislike'].map(type =>
      ({ type, trackKey: JSON.stringify(['Sample song', 'Artist']) })) });
    assert.deepEqual(result.ratingClicks, []);
    assert.equal(result.lastState.rating, options.ratingsAvailable === false ? null : 'INDIFFERENT');
  }
});

test('a rating queued for another track is discarded instead of rating the next song', async () => {
  const result = await scenario(false, { commands: [
    { type: 'like', trackKey: JSON.stringify(['Previous song', 'Artist']) },
    { type: 'dislike' },
  ] });
  assert.deepEqual(result.ratingClicks, []);
  assert.equal(result.lastState.rating, 'INDIFFERENT');
});

test('browser inputs retry only before execution and deduplicate successful request IDs', async () => {
  const input = { type: 'bridge-command', id: 'next-once', command: { type: 'next' } };
  const result = await scenario(false, { commands: [], browserInputs: [
    { message: input, before: ({nextBtn}) => { nextBtn.disabled = true; } },
    { message: input, before: ({nextBtn}) => { nextBtn.disabled = false; } },
    { message: input },
  ] });
  assert.equal(result.nextClicks, 1);
  assert.equal(result.browserResponses[0].retry, true);
  assert.ok(result.browserResponses.slice(1).every(response => response.ok));
});

test('launch continuation starts paused playback and leaves restored playing media playing', async () => {
  for (const paused of [true, false]) {
    const result = await scenario(false, { commands: [], initiallyPaused: paused, browserInputs: [
      { message: { type: 'bridge-command', id: 'start', command: { type: 'play' } } },
    ] });
    assert.equal(result.browserResponses[0].ok, true);
    assert.equal(result.audio.paused, false);
    assert.equal(result.playClicks, paused ? 1 : 0);
  }
});

test('a rating requested while opening acts on the restored song once', async () => {
  const input = { type: 'bridge-command', id: 'like-once',
    command: { type: 'like', allowCurrentTrack: true } };
  const result = await scenario(false, { commands: [], browserInputs: [{ message: input }, { message: input }] });
  assert.deepEqual(result.ratingClicks, ['like']);
  assert.ok(result.browserResponses.every(response => response.ok));
});

test('untrusted and expired browser messages do not operate the player', async () => {
  const result = await scenario(false, { commands: [], browserInputs: [
    { sender: { id: 'another-extension' }, message: { type: 'bridge-command', command: { type: 'next' } } },
    { sender: { id: 'this-extension', tab: { id: 1 } }, message: { type: 'bridge-command', command: { type: 'next' } } },
    { message: { type: 'bridge-command', expiresAt: Date.now()-1, command: { type: 'next' } } },
  ] });
  assert.equal(result.nextClicks, 0);
});
