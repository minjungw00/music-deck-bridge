import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const plugin=readFileSync(join(dirname(fileURLToPath(import.meta.url)),'..',
  'streamdeck', 'src','plugin.cjs'),'utf8');
const coverFns=plugin.slice(plugin.indexOf('const COVERS = '),plugin.indexOf('function paint()'));

function harness(fetch){
  const sandbox={URL,AbortSignal,Buffer,fetch,Response,Map,Set,Date,Array,Error};
  vm.runInNewContext(coverFns+'\nthis.__api={validCover,fetchCover};',sandbox);
  return sandbox.__api;
}

test('album-cover downloader accepts webp from numbered Googleusercontent hosts',async()=>{
  const api=harness(async()=>new Response(Uint8Array.from([1,2,3]),{status:200,
    headers:{'content-type':'image/webp','content-length':'3'}}));
  assert.equal(api.validCover('https://lh5.googleusercontent.com/path'),true);
  assert.equal(api.validCover('http://localhost:8080/path'),false);
  assert.equal(await api.fetchCover('https://lh5.googleusercontent.com/path'), 'data:image/webp;base64,AQID');
});

test('album cover redirects must remain within the approved hosts',async()=>{
  let calls=0;
  const api=harness(async()=>{
    calls++;
    return new Response(null,{status:302,headers:{location:'https://untrusted.test/secret'}});
  });
  await assert.rejects(api.fetchCover('https://i.ytimg.com/vi/test.jpg'),/호스트/);
  assert.equal(calls,1,'should never fetch unapproved redirect destination');
});

test('album art status uses codes for missing, blocked, pending, retrying, failed and cached images', () => {
  const src = 'https://i.ytimg.com/vi/test.jpg';
  const sandbox = { URL, Map, Set, Date, cachedCoverUrl: '', coverDownloads: new Map(), coverFailures: new Map() };
  vm.runInNewContext(coverFns + '\nthis.getStatus = getCoverStatus;', sandbox);
  assert.equal(sandbox.getStatus(), 'missing');
  assert.equal(sandbox.getStatus('http://localhost/cover'), 'blocked');
  assert.equal(sandbox.getStatus(src), 'waiting');
  sandbox.coverDownloads.set(src, Promise.resolve());
  assert.equal(sandbox.getStatus(src), 'downloading');
  sandbox.coverDownloads.delete(src);
  sandbox.coverFailures.set(src, { time: Date.now(), reason: '이미지 HTTP 503' });
  assert.equal(sandbox.getStatus(src), 'failed');
  sandbox.coverDownloads.set(src, Promise.resolve());
  assert.equal(sandbox.getStatus(src), 'downloading', 'an active retry takes precedence over the previous failure');
  sandbox.cachedCoverUrl = src;
  assert.equal(sandbox.getStatus(src), 'ready');
});


test('overlapping cover requests deduplicate each URL and retain independent pending status', async () => {
  const pending = [];
  const a = 'https://i.ytimg.com/vi/a.jpg', b = 'https://i.ytimg.com/vi/b.jpg';
  const sandbox = { URL, AbortSignal, Buffer, Date, coverDownloads: new Map(),
    coverCache: new Map(), coverFailures: new Map(), cachedCoverUrl: '', cachedCoverData: '',
    selectedEntry: () => ['player', { cover: b }], drawSoon() {},
    fetch: url => new Promise(resolve => pending.push({ url, resolve })) };
  vm.runInNewContext(coverFns + '\nthis.api = { loadCover, getCoverStatus };', sandbox);
  const first = sandbox.api.loadCover(a), second = sandbox.api.loadCover(b);
  assert.equal(sandbox.api.loadCover(a), first);
  assert.deepEqual(pending.map(item => item.url), [a, b]);
  const response = () => new Response(Uint8Array.of(1), { headers: { 'content-type': 'image/png' } });
  pending[0].resolve(response());
  await first;
  assert.equal(sandbox.api.getCoverStatus(b), 'downloading');
  assert.equal(sandbox.api.loadCover(b), second);
  assert.equal(pending.length, 2);
  pending[1].resolve(response());
  await second;
  assert.equal(sandbox.api.getCoverStatus(b), 'ready');
  assert.equal(sandbox.coverDownloads.size, 0);
});
