import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const extension = fileURLToPath(new URL('../../chrome-extension/', import.meta.url));
const languages = ['en', 'ko', 'zh-CN', 'zh-TW', 'ja', 'es', 'fr', 'de'];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

test('native extension catalogs and toolbar popup render all eight UI languages without clipped buttons', { timeout: 30000 }, async t => {
  for (const language of languages) {
    const profile = await mkdtemp(join(tmpdir(), 'music-deck-locale-'));
    let browser;
    try {
      browser = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: true, locale: language,
        args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`, `--lang=${language}`] });
      const worker = browser.serviceWorkers()[0] || await browser.waitForEvent('serviceworker');
      const catalog = await worker.evaluate(() => Object.fromEntries(['uiLanguageCode','connect','refresh','forget','portLabel',
        'settingsSummary','previous','next','play','mute','openPlayer'].map(key => [key, chrome.i18n.getMessage(key)])));
      assert.equal(catalog.uiLanguageCode, language);
      const rootSession = await browser.browser().newBrowserCDPSession();
      await worker.evaluate(() => chrome.action.openPopup());
      let popup;
      for (let attempt = 0; attempt < 100 && !popup; attempt++) {
        popup = (await rootSession.send('Target.getTargets')).targetInfos.find(target => target.url.endsWith('/popup.html'));
        if (!popup) await delay(20);
      }
      assert.ok(popup, `${language}: popup did not open`);
      const { sessionId } = await rootSession.send('Target.attachToTarget', { targetId: popup.targetId, flatten: false });
      let next = 0;
      async function evaluate(expression) {
        const id = ++next;
        let listener;
        const response = new Promise(resolve => {
          listener = event => {
            const message = JSON.parse(event.message);
            if (event.sessionId === sessionId && message.id === id) resolve(message);
          };
          rootSession.on('Target.receivedMessageFromTarget', listener);
        });
        try {
          await rootSession.send('Target.sendMessageToTarget', { sessionId,
            message: JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }) });
          const result = await response;
          assert.equal(result.error, undefined); assert.equal(result.result.exceptionDetails, undefined);
          return result.result.result.value;
        } finally { rootSession.off('Target.receivedMessageFromTarget', listener); }
      }
      let ready;
      for (let attempt = 0; attempt < 100 && !ready; attempt++) {
        ready = await evaluate(`document.documentElement.lang === ${JSON.stringify(language)} && !!document.getElementById('connect')`);
        if (!ready) await delay(20);
      }
      assert.ok(ready, language);
      const ui = await evaluate(`(() => ({lang:document.documentElement.lang,
        labels:Object.fromEntries(['connect','refresh','forget','portLabel','settingsSummary','openPlayer'].map(id=>[id,document.getElementById(id).textContent])),
        controls:Object.fromEntries(['previous','next','playPause','mute'].map(id=>[id,document.getElementById(id).getAttribute('aria-label')])),
        clipped:[...document.querySelectorAll('button:not(.media-button)')].filter(button=>button.scrollWidth>button.clientWidth).map(button=>button.id),
        overflow:document.documentElement.scrollWidth>innerWidth}))()`);
      assert.equal(ui.lang, language);
      for (const [key, value] of Object.entries(ui.labels)) assert.equal(value, catalog[key], `${language}/${key}`);
      for (const [key, value] of Object.entries(ui.controls)) assert.equal(value, catalog[key === 'playPause' ? 'play' : key]);
      assert.deepEqual(ui.clipped, [], `${language}: clipped button labels`);
      assert.equal(ui.overflow, false, `${language}: horizontal overflow`);
      if (language === 'en') {
        await browser.route('https://music.youtube.com/**', route => route.fulfill({
          contentType: 'text/html', body: '<!doctype html><title>Music opening fixture</title><p>Music opening fixture</p>' }));
        assert.equal(await worker.evaluate(async () => (await chrome.tabs.query({ url: 'https://music.youtube.com/*' })).length), 0);
        await evaluate('document.getElementById("openPlayer").click()');
        let musicTabs = [];
        for (let attempt = 0; attempt < 100 && !musicTabs.length; attempt++) {
          musicTabs = await worker.evaluate(() => chrome.tabs.query({ url: 'https://music.youtube.com/*' }));
          if (!musicTabs.length) await delay(20);
        }
        assert.equal(musicTabs.length, 1, 'empty toolbar popup opens the fixed Music URL');
        assert.equal(musicTabs[0].active, true);
        assert.equal((await worker.evaluate(() => localPlayer.open())).ok, true);
        assert.equal(await worker.evaluate(async () => (await chrome.tabs.query({ url: 'https://music.youtube.com/*' })).length), 1,
          'opening again reuses the existing tab');
      }
    } finally {
      await browser?.close();
      await rm(profile, { recursive: true, force: true });
    }
  }
  t.diagnostic('Native chrome.i18n catalogs and actual toolbar targets; empty popup opens/reuses a Music tab without pairing. Fresh local Chromium profiles and routed page fixture, no signed-in Music or Windows host.');
});
