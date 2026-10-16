import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const plugin=readFileSync(join(dirname(fileURLToPath(import.meta.url)),'..',
  'streamdeck', 'io.github.minjungw00.musicdeckbridge.sdPlugin','bin','plugin.js'),'utf8');
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
