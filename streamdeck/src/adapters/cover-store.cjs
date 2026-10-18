'use strict';
const COVERS = new Set(['i.ytimg.com', 'img.youtube.com', 'yt3.ggpht.com', 'yt3.googleusercontent.com']);
function validCover(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port &&
      (COVERS.has(u.hostname) || /^lh[0-9]+\.googleusercontent\.com$/.test(u.hostname));
  } catch { return false; }
}
async function fetchCover(source, fetch = globalThis.fetch) {
  // Reject redirects off Google/YouTube image hosts; do not follow to arbitrary targets.
  let url = source;
  for (let redirect = 0; redirect <= 3; redirect++) {
    if (!validCover(url)) throw new Error('이미지 호스트가 허용 목록에 없음');
    const response = await fetch(url, {
      redirect: 'manual',
      headers: { 'Referer': 'https://music.youtube.com/' },
      signal: AbortSignal.timeout(5000),
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const next = response.headers.get('location');
      if (!next) throw new Error('리디렉션 주소 없음');
      url = new URL(next, url).href;
      continue;
    }
    if (!response.ok) throw new Error(`이미지 HTTP ${response.status}`);
    const type = response.headers.get('content-type')?.split(';')[0]?.trim()?.toLowerCase();
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error(`지원하지 않는 이미지 형식: ${type || 'unknown'}`);
    const size = Number(response.headers.get('content-length'));
    if (size > 2000000) throw new Error('이미지 크기 제한 초과 (2MB)');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('이미지 본문 없음');
    const chunks = []; let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 2000000) { await reader.cancel(); throw new Error('이미지 크기 제한 초과 (2MB)'); }
      chunks.push(Buffer.from(value));
    }
    if (!total) throw new Error('비어 있는 이미지');
    return `data:${type};base64,${Buffer.concat(chunks).toString('base64')}`;
  }
  throw new Error('이미지 리디렉션이 너무 많음');
}

function createCoverStore({ selectedSource, onChange, fetch = globalThis.fetch, now = Date.now }) {
  const coverCache = new Map(), coverFailures = new Map(), coverDownloads = new Map();
  let cachedCoverUrl = '', cachedCoverData = '';
  function loadCover(src, fallback = '') {
    if (!validCover(src)) return;
    if (coverDownloads.has(src)) return coverDownloads.get(src);
    if (coverCache.has(src)) {
      cachedCoverUrl = src;
      cachedCoverData = coverCache.get(src);
      onChange();
      return;
    }
    const failure = coverFailures.get(src);
    if (failure && now() - failure.time < 30000) return;
    const operation = (async () => {
      try {
        let uri;
        try { uri = await fetchCover(src, fetch); }
        catch (error) {
          // If the service rejects a requested high-resolution variant, retain the
          // low-resolution cover instead of making the key permanently blank.
          if (!fallback || fallback === src || !validCover(fallback)) throw error;
          uri = await fetchCover(fallback, fetch);
        }
        coverCache.set(src, uri);
        coverFailures.delete(src);
        if (coverCache.size > 12) coverCache.delete(coverCache.keys().next().value);
        if (selectedSource() === src) {
          cachedCoverUrl = src;
          cachedCoverData = uri;
          onChange();
        }
      } catch (e) {
        coverFailures.set(src, { time: now(), reason: String(e.message || '다운로드 실패').slice(0, 120) });
        if (coverFailures.size > 25) coverFailures.delete(coverFailures.keys().next().value);
      } finally { coverDownloads.delete(src); }
    })();
    coverDownloads.set(src, operation);
    return operation;
  }
  function getCoverStatus(src) {
    if (!src) return 'missing';
    if (!validCover(src)) return 'blocked';
    if (cachedCoverUrl === src) return 'ready';
    if (coverDownloads.has(src)) return 'downloading';
    if (coverFailures.has(src)) return 'failed';
    return 'waiting';
  }
  return {
    load: loadCover, status: getCoverStatus,
    image: source => source && source === cachedCoverUrl ? cachedCoverData : '',
    resetSelection() { cachedCoverUrl = ''; cachedCoverData = ''; },
  };
}
module.exports = { createCoverStore, validCover, fetchCover };
