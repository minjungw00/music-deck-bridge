import test from 'node:test';
import assert from 'node:assert/strict';
import { createCoverStore, validCover, fetchCover } from '../streamdeck/src/adapters/cover-store.cjs';

const response = () => new Response(Uint8Array.of(1, 2, 3), {
  headers: { 'content-type': 'image/webp', 'content-length': '3' },
});

test('album-cover downloader accepts webp from numbered Googleusercontent hosts', async () => {
  assert.equal(validCover('https://lh5.googleusercontent.com/path'), true);
  assert.equal(validCover('http://localhost:8080/path'), false);
  assert.equal(await fetchCover('https://lh5.googleusercontent.com/path', async () => response()),
    'data:image/webp;base64,AQID');
});

test('album cover redirects must remain within the approved hosts', async () => {
  let calls = 0;
  await assert.rejects(fetchCover('https://i.ytimg.com/vi/test.jpg', async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: 'https://untrusted.test/secret' } });
  }), /호스트/);
  assert.equal(calls, 1, 'should never fetch an unapproved redirect destination');
});

test('cover failures back off, retry and become ready without retaining an old selection', async () => {
  const src = 'https://i.ytimg.com/vi/test.jpg';
  let clock = 1000, calls = 0, finish;
  const store = createCoverStore({ selectedSource: () => src, onChange() {}, now: () => clock,
    fetch: () => { calls++; return calls === 1 ? Promise.reject(Error('offline')) :
      new Promise(resolve => { finish = resolve; }); } });
  assert.equal(store.status(), 'missing');
  assert.equal(store.status('http://localhost/cover'), 'blocked');
  assert.equal(store.status(src), 'waiting');
  await store.load(src);
  assert.equal(store.status(src), 'failed');
  await store.load(src);
  assert.equal(calls, 1, 'failures back off for thirty seconds');
  clock += 30000;
  const pending = store.load(src);
  assert.equal(store.status(src), 'downloading', 'an active retry precedes its previous failure');
  finish(response());
  await pending;
  assert.equal(store.status(src), 'ready');
  assert.equal(store.image(src), 'data:image/webp;base64,AQID');
  store.resetSelection();
  assert.equal(store.image(src), '');
  await store.load(src);
  assert.equal(calls, 2, 'resetting selection preserves reusable cached artwork');
  assert.equal(store.status(src), 'ready');
});

test('overlapping cover requests deduplicate each URL and retain independent pending status', async () => {
  const pending = [];
  const a = 'https://i.ytimg.com/vi/a.jpg', b = 'https://i.ytimg.com/vi/b.jpg';
  const store = createCoverStore({ selectedSource: () => b, onChange() {},
    fetch: url => new Promise(resolve => pending.push({ url, resolve })) });
  const first = store.load(a), second = store.load(b);
  assert.equal(store.load(a), first);
  assert.deepEqual(pending.map(item => item.url), [a, b]);
  pending[0].resolve(response());
  await first;
  assert.equal(store.image(a), '', 'old requests do not replace the selected cover');
  assert.equal(store.status(b), 'downloading');
  assert.equal(store.load(b), second);
  assert.equal(pending.length, 2);
  pending[1].resolve(response());
  await second;
  assert.equal(store.status(b), 'ready');
});

test('an unavailable high-resolution cover falls back only to an approved image host', async () => {
  const source = 'https://i.ytimg.com/vi/high.jpg', fallback = 'https://i.ytimg.com/vi/low.jpg';
  const calls = [];
  const store = createCoverStore({ selectedSource: () => source, onChange() {}, fetch: async url => {
    calls.push(url);
    if (url === source) throw Error('missing');
    return response();
  } });
  await store.load(source, 'https://untrusted.test/image');
  assert.deepEqual(calls, [source]);
  const recovered = createCoverStore({ selectedSource: () => source, onChange() {}, fetch: async url => {
    if (url === source) throw Error('missing');
    assert.equal(url, fallback);
    return response();
  } });
  await recovered.load(source, fallback);
  assert.equal(recovered.status(source), 'ready');
});
