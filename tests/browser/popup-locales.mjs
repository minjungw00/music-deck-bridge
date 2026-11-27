import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const extension = fileURLToPath(new URL('../../chrome-extension/', import.meta.url));
const { UUID: pluginId } = JSON.parse(await readFile(new URL(
  '../../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/manifest.json', import.meta.url), 'utf8'));
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
        'settingsSummary','previous','next','play','mute','openPlayer','installPlugin','openStreamDeck','repeatLabel','shuffleLabel'].map(key => [key, chrome.i18n.getMessage(key)])));
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
        labels:{ ...Object.fromEntries(['connect','refresh','forget','portLabel','settingsSummary','openPlayer'].map(id=>[id,document.getElementById(id).textContent])),
          installPlugin:document.getElementById('installPluginLabel').textContent,
          openStreamDeck:document.getElementById('openStreamDeckLabel').textContent },
        controls:Object.fromEntries(['previous','next','playPause','mute','repeat','shuffle'].map(id=>[id,document.getElementById(id).getAttribute('aria-label')])),
        rows:['.player-controls','.queue-controls','.volume-controls'].map(selector=>{
          const controls=[...document.querySelector(selector).children].filter(control=>!control.classList.contains('sr-only'));
          const bounds=controls.map(control=>control.getBoundingClientRect());
          return {ids:controls.map(control=>control.id),left:bounds[0].left,right:bounds.at(-1).right,
            gaps:bounds.slice(1).map((rect,index)=>rect.left-bounds[index].right),
            sizes:bounds.map(rect=>[rect.width,rect.height]),
            radii:controls.map(control=>parseFloat(getComputedStyle(control).borderTopLeftRadius)),
            backgrounds:controls.map(control=>getComputedStyle(control).backgroundImage)};
        }),
        clipped:[...document.querySelectorAll('button:not(.media-button)')].filter(button=>button.scrollWidth>button.clientWidth).map(button=>button.id),
        overflow:document.documentElement.scrollWidth>innerWidth}))()`);
      assert.equal(ui.lang, language);
      for (const [key, value] of Object.entries(ui.labels)) assert.equal(value, catalog[key], `${language}/${key}`);
      const controlLabels = { playPause: 'play', repeat: 'repeatLabel', shuffle: 'shuffleLabel' };
      for (const [key, value] of Object.entries(ui.controls)) assert.equal(value, catalog[controlLabels[key] || key]);
      assert.deepEqual(ui.rows.map(row => row.ids), [
        ['previous', 'playPause', 'next'], ['like', 'dislike', 'repeat', 'shuffle'], ['mute', 'volumeSlider', 'volumeValue'],
      ]);
      for (const row of ui.rows) {
        assert.ok(Math.abs(row.left - ui.rows[0].left) < 0.5, `${language}: left edges line up`);
        assert.ok(Math.abs(row.right - ui.rows[0].right) < 0.5, `${language}: right edges line up`);
      }
      const [ratingsGap, middleGap, queueGap] = ui.rows[1].gaps;
      assert.ok(Math.abs(ratingsGap - queueGap) < 0.5, `${language}: equal spacing within pairs`);
      assert.ok(middleGap > Math.max(ratingsGap, queueGap), `${language}: wider spacing between pairs`);
      const transport = ui.rows[0];
      for (const [index, [width, height]] of transport.sizes.entries()) {
        assert.ok(width > height && Math.abs(width - transport.sizes[0][0]) < 0.5, `${language}: equal rectangular buttons`);
        assert.ok(transport.radii[index] > 0 && transport.radii[index] < height / 2, `${language}: rounded corners`);
        assert.match(transport.backgrounds[index], /linear-gradient\(.*rgb\(255, 56, 209\).*rgb\(255, 0, 125\).*rgb\(208, 0, 164\)/,
          `${language}: transport background uses the circular icons' gradient colors`);
      }
      assert.ok(transport.gaps.every(gap => Math.abs(gap - ratingsGap) < 0.5), `${language}: compact transport spacing`);
      assert.deepEqual(ui.clipped, [], `${language}: clipped button labels`);
      assert.equal(ui.overflow, false, `${language}: horizontal overflow`);
      const actions = await evaluate(`(() => {
        const open = document.getElementById('openPlayer');
        const details = document.getElementById('connectionSettings');
        const settings = details.querySelector('summary');
        const initial = details.open;
        const appearance = element => {
          const style = getComputedStyle(element);
          return { background: style.backgroundColor, radius: style.borderRadius };
        };
        if (initial) settings.click();
        const closed = { ...appearance(settings), arrow: getComputedStyle(settings, '::after').transform,
          open: details.open };
        settings.click();
        const expanded = { ...appearance(settings), arrow: getComputedStyle(settings, '::after').transform,
          open: details.open };
        const companion = [...details.querySelectorAll('.companion-actions a')].map(link => ({
          ...appearance(link), href: link.href, width: link.getBoundingClientRect().width,
          icon: !!link.querySelector('svg[aria-hidden="true"]') }));
        if (!initial) settings.click();
        const openBounds = open.getBoundingClientRect(), settingsBounds = settings.getBoundingClientRect();
        return { open: appearance(open), closed, expanded, companion, width: openBounds.width, settingsWidth: settingsBounds.width,
          unclipped: settings.scrollWidth <= settings.clientWidth,
          belowVolume: openBounds.height > 0 && open.previousElementSibling.matches('.volume-controls') &&
            openBounds.top >= open.previousElementSibling.getBoundingClientRect().bottom };
      })()`);
      assert.equal(actions.belowVolume, true, `${language}: Open Music follows the volume row`);
      assert.equal(actions.width, actions.settingsWidth, `${language}: both actions share a width`);
      assert.equal(actions.unclipped, true, `${language}: settings label fits`);
      assert.equal(actions.closed.radius, actions.open.radius);
      assert.equal(actions.closed.background, actions.open.background);
      assert.notEqual(actions.expanded.background, actions.closed.background);
      assert.notEqual(actions.expanded.arrow, actions.closed.arrow);
      assert.equal(actions.closed.open, false);
      assert.equal(actions.expanded.open, true);
      const [install, launch] = actions.companion;
      assert.equal(new URL(install.href).origin, 'https://marketplace.elgato.com');
      assert.equal(launch.href, `streamdeck://plugins/message/${pluginId}/open`);
      for (const button of [install, launch]) {
        assert.equal(button.width, actions.width);
        assert.equal(button.background, actions.open.background);
        assert.equal(button.radius, actions.open.radius);
        assert.equal(button.icon, true);
      }
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
