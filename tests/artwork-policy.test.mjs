import test from 'node:test';
import assert from 'node:assert/strict';
import artwork from '../chrome-extension/artwork-policy.js';
const { parse } = artwork;

test('artwork admission accepts only HTTPS image hosts without credentials or a custom port', () => {
  for (const host of ['i.ytimg.com', 'img.youtube.com', 'yt3.ggpht.com', 'yt3.googleusercontent.com', 'lh3.googleusercontent.com']) {
    assert.equal(parse(`https://${host}/image=s120`)?.hostname, host);
    assert.equal(parse('/image', `https://${host}/other`)?.href, `https://${host}/image`);
    for (const source of [`http://${host}/image`, `https://user:secret@${host}/image`,
      `https://${host}:8443/image`, `https://${host}.example.org/image`]) assert.equal(parse(source), null, source);
  }
  for (const source of ['', null, 'https://music.youtube.com/image', 'https://localhost/image',
    'https://lh.googleusercontent.com/image', 'data:image/png;base64,AA==', 'not a URL']) assert.equal(parse(source), null);
});
