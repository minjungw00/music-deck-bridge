import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { playerHarness } from './helpers/player.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'chrome-extension');
const source = readFileSync(join(root, 'content.js'), 'utf8');

async function scenario(useMediaSession=false, { commands, manualVolume, compact = false,
  rating = 'INDIFFERENT', ratingsAvailable = true, ratingsDisabled = false } = {}) {
  let playClicks = 0, nextClicks = 0, syncCount = 0, lastState;
  const player = playerHarness({ compact, delay: 2 });
  const { audio } = player;
  const playBtn = {click(){playClicks++;},disabled:false,getAttribute(){return null;}};
  const nextBtn = {click(){nextClicks++;},disabled:false,getAttribute(){return null;}};
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
      if(data.type==='player-volume') return player.send(data);
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
  vm.runInNewContext(source,sandbox);
  await new Promise(resolve => setTimeout(resolve,170));
  if (manualVolume !== undefined) {
    player.setSiteVolume(manualVolume);
    eventHandlers.change({target:player.contentSliders[0]});
    await new Promise(resolve => setTimeout(resolve,170));
  }
  eventHandlers.pagehide?.();
  return {syncCount,lastState,playClicks,nextClicks,audio,interval,player,ratingClicks,eventHandlers};
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
