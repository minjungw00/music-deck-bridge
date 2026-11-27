import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { chromium } from 'playwright';
import { WebSocketServer } from 'ws';

const { supported, html } = createRequire(import.meta.url)('../../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/property-inspector/language.js');
const inspector = new URL('../../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/property-inspector/settings.html', import.meta.url);
const actionPrefix = 'io.github.minjungw00.musicdeckbridge.';
const trackTextSettings = { showTitle: 'keyShowTitle', showArtist: 'keyShowArtist' };
const legacyTrack = { keyDisplay: 'default', showArtist: false };
const saved = { showTitle: false, showArtist: true, titleBackground: false, artworkShowTitle: true,
  artworkShowArtist: true, artworkTitleBackground: false, volumeShowValue: true, volumeShowPercent: false,
  volumeStep: 3, volumeFeedbackSeconds: 1.5, dialDisplay: 'artwork', infoTitleMode: 'scroll',
  keyDisplay: 'linked', keyArtworkShowIcon: true, keyArtworkIconPosition: 'bottom-right', albumGroup: 'A' };

test('real SDPI components localize their first rendered labels without changing fresh or saved settings', { timeout: 30000 }, async t => {
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  let browser;
  t.after(async () => {
    await browser?.close();
    for (const socket of server.clients) socket.terminate();
    if (server.address()) await new Promise(resolve => server.close(resolve));
  });
  await once(server, 'listening');
  browser = await chromium.launch({ headless: true });
  const messages = [];
  let current;
  server.on('connection', socket => {
    const fixture = current;
    socket.on('message', raw => {
      const event = JSON.parse(raw.toString()); messages.push(event);
      if (event.event === 'getSettings') socket.send(JSON.stringify({ event: 'didReceiveSettings',
        action: fixture.action, context: fixture.context, device: fixture.device, payload: { settings: fixture.settings } }));
      if (event.event === 'sendToPlugin') socket.send(JSON.stringify({ event: 'sendToPropertyInspector',
        payload: { type: 'connection', paired: false, serverPort: 17864 } }));
    });
  });
  for (const language of supported) for (const settings of language === 'ko' ? [{}, saved, legacyTrack] : [{}, saved]) {
    for (const action of ['nowplaying', 'trackdial', 'volumeup', 'volumedown']) {
      if (settings === legacyTrack && action !== 'nowplaying') continue;
      const page = await browser.newPage({ viewport: { width: 380, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(inspector.href);
      // Finish the bundled components' initial English render before the host
      // supplies its locale. No checkbox value is changed to force an update.
      await page.evaluate(async () => {
        await customElements.whenDefined('sdpi-checkbox');
        await Promise.all([...document.querySelectorAll('sdpi-item, sdpi-checkbox')].map(element => element.updateComplete));
      });
      current = { action: actionPrefix + action, context: 'fixture-action', device: 'fixture-device', settings };
      const before = messages.length;
      await page.evaluate(({ port, language, action, settings }) => {
        window.connectElgatoStreamDeckSocket(String(port), 'fixture-inspector', 'registerPropertyInspector',
          JSON.stringify({ application: { language } }), JSON.stringify({ action,
            context: 'fixture-action', device: 'fixture-device', payload: { settings } }));
      }, { port: server.address().port, language, action: current.action, settings });
      await page.waitForFunction(language => document.documentElement.lang === language &&
        document.getElementById('pairState').textContent !== 'Checking connection…', html(language));
      assert.equal(await page.evaluate(() => document.body.firstElementChild.id), 'connectionSection');
      const labels = await page.evaluate(async () => {
        const elements = [...document.querySelectorAll('sdpi-item[label], sdpi-checkbox[label]')];
        await Promise.all(elements.map(element => element.updateComplete));
        return elements.map(element => {
          const checkbox = element.localName === 'sdpi-checkbox';
          return { id: element.id, kind: element.localName, expected: element.getAttribute('label'),
            actual: element.shadowRoot.querySelector(checkbox ? '.checkable-text' : '.label label')?.textContent.trim(),
            value: checkbox ? element.value : undefined,
            checked: checkbox ? element.shadowRoot.querySelector('input').checked : undefined };
        });
      });
      assert.equal(labels.filter(label => label.kind === 'sdpi-checkbox').length, 9);
      const selects = await page.evaluate(async () => {
        const elements = [...document.querySelectorAll('sdpi-select')];
        await Promise.all(elements.map(element => element.items.taskComplete));
        await Promise.all(elements.map(element => element.updateComplete));
        return elements.map(element => ({ id: element.id, value: element.value,
          expected: [...element.querySelectorAll('option')].map(option => [option.value, option.textContent]),
          actual: [...element.shadowRoot.querySelectorAll('option')].map(option => [option.value, option.textContent]),
          selected: element.shadowRoot.querySelector('select').value, fallback: element.getAttribute('default') }));
      });
      for (const select of selects) {
        assert.deepEqual(select.actual, select.expected, `${language}/${action}/${select.id}: rendered dropdown text`);
        if (select.id === 'keyDisplay') {
          const iconValue = action === 'nowplaying' ? 'icon' : 'default';
          assert.deepEqual(select.actual.map(([value]) => value), [iconValue, 'artwork', 'linked']);
          if (language === 'ko' || language === 'en') {
            assert.equal(select.actual[0][1], language === 'ko' ? '아이콘' : 'Icon');
          }
        }
        if (select.id === 'linkedArtworkFit') {
          assert.equal(select.selected, 'height');
          assert.equal(select.value, 'height');
          continue;
        }
        const legacyDisplay = settings === legacyTrack && select.id === 'keyDisplay';
        assert.equal(select.selected, (legacyDisplay ? undefined : settings[select.id]) || select.fallback);
        assert.equal(select.value, settings[select.id]);
      }
      assert.equal(await page.locator('#albumGroup').evaluate(element => element.value), settings.albumGroup);
      for (const label of labels) {
        if (language === 'ko') assert.match(label.expected, /[가-힣]/, label.id);
        assert.equal(label.actual, label.expected + (label.kind === 'sdpi-item' ? ':' : ''),
          `${language}/${action}/${Object.keys(settings).length ? 'saved' : 'fresh'}/${label.id}`);
        if (label.kind === 'sdpi-checkbox') {
          const setting = trackTextSettings[label.id] || label.id;
          const defaultChecked = label.id === 'volumeShowValue' ||
            (Boolean(trackTextSettings[label.id]) && action === 'nowplaying' && settings !== saved && settings[label.id] !== false);
          assert.equal(label.value, settings[setting], `${label.id}: localization preserves the setting value`);
          assert.equal(label.checked, settings[setting] ?? defaultChecked, `${label.id}: rendered checkbox state`);
        }
      }
      const clipped = await page.evaluate(() => [...document.querySelectorAll('sdpi-item, sdpi-checkbox')].flatMap(element => {
        const text = element.shadowRoot.querySelector(element.localName === 'sdpi-checkbox' ? '.checkable-text' : '.label label');
        if (!text) return [];
        const range = document.createRange(); range.selectNodeContents(text);
        return [...range.getClientRects()].some(rect => rect.width && (rect.left < -.5 || rect.right > innerWidth + .5)) ? [element.id] : [];
      }));
      assert.deepEqual(clipped, [], `${language}/${action}: text outside inspector viewport`);
      assert.deepEqual(messages.slice(before).filter(message => message.event === 'setSettings'), [], 'localization must not save defaults or change settings');
      assert.deepEqual(errors, []);
      if (action === 'trackdial') {
        const dial = selects.find(select => select.id === 'dialDisplay');
        assert.deepEqual(dial.actual.map(([value]) => value), ['title', 'info', 'artwork']);
      }
      if (language === 'ko' && action === 'trackdial' && settings !== saved) {
        const display = page.locator('#dialDisplay select');
        const textOptions = page.locator('#infoTitleModeRow');
        const artworkOptions = page.locator('#artworkOptions');
        for (const mode of ['title', 'artwork', 'info']) {
          const since = messages.length;
          await display.selectOption(mode);
          await textOptions.waitFor({ state: mode === 'artwork' ? 'hidden' : 'visible' });
          await artworkOptions.waitFor({ state: mode === 'artwork' ? 'visible' : 'hidden' });
          const savedMode = () => messages.slice(since).some(message =>
            message.event === 'setSettings' && message.payload?.dialDisplay === mode);
          for (let attempt = 0; attempt < 25 && !savedMode(); attempt++) {
            await new Promise(resolve => setTimeout(resolve, 20));
          }
          assert.ok(savedMode(), mode);
        }
      }
      if (language === 'ko' && action === 'nowplaying' && settings !== saved && settings !== legacyTrack) {
        const display = page.locator('#keyDisplay select');
        const iconRow = page.locator('#keyArtworkIconRow');
        await display.selectOption('icon');
        await iconRow.waitFor({ state: 'hidden' });
        const title = page.locator('#showTitle input');
        const artist = page.locator('#showArtist input');
        assert.equal(await title.isChecked(), false);
        assert.equal(await artist.isChecked(), false);
        await page.locator('#showTitle .checkable-symbol').click();
        await page.locator('#showArtist .checkable-symbol').click();
        for (const mode of ['artwork', 'linked']) {
          await display.selectOption(mode);
          await iconRow.waitFor({ state: 'visible' });
          assert.equal(await title.isChecked(), true, mode);
          assert.equal(await artist.isChecked(), true, mode);
          assert.equal(await page.locator('#keyArtworkShowIcon input').isChecked(), false, mode);
          assert.equal(await page.locator('#keyArtworkIconPositionRow').isVisible(), false, mode);
          await display.selectOption('icon');
          await iconRow.waitFor({ state: 'hidden' });
        }
        await page.waitForFunction(() => document.querySelector('#showTitle').value === true &&
          document.querySelector('#showArtist').value === true);
        assert.ok(messages.slice(before).some(message => message.event === 'setSettings' &&
          message.payload?.keyShowTitle === true && message.payload?.keyShowArtist === true));
      }
      if (language === 'ko' && action === 'nowplaying' && settings === saved) {
        await page.locator('#keyArtworkIconPositionRow').waitFor({ state: 'visible' });
        assert.equal(await page.locator('#keyArtworkShowIcon input').isChecked(), true);
        const since = messages.length;
        for (const peer of server.clients) peer.send(JSON.stringify({ event: 'sendToPropertyInspector',
          payload: { type: 'connection', paired: true, extensionOnline: true, playerActive: false,
            linkedArtworkFit: 'width', linkedArtworkGap: { horizontal: 20, vertical: 30 } } }));
        await page.waitForFunction(() => document.body.firstElementChild.id === 'keyArtworkSection');
        const fit = page.locator('#linkedArtworkFit select');
        await page.waitForFunction(() => document.querySelector('#linkedArtworkFit').shadowRoot.querySelector('select').value === 'width');
        assert.equal(await fit.inputValue(), 'width');
        const styles = await page.evaluate(() => ['linkedArtworkFit', 'artworkFit'].map(id => {
          const select = document.getElementById(id).shadowRoot.querySelector('select');
          const css = getComputedStyle(select);
          return [css.fontFamily, css.fontSize, css.backgroundColor, css.color, css.border, css.borderRadius];
        }));
        assert.deepEqual(styles[0], styles[1], 'linked fit uses the same SDPI styling as dial artwork fit');
        assert.equal(messages.slice(since).some(message => message.payload?.type === 'set-linked-fit'), false, 'group status must not send a change');
        assert.equal(await page.locator('#keyArtworkIconPosition').evaluate(element =>
          element.shadowRoot.querySelectorAll('option').length), 9);
        const gapFields = await page.evaluate(() => ['linkedGapHorizontal', 'linkedGapVertical'].map(id => {
          const field = document.getElementById(id).shadowRoot.querySelector('input').getBoundingClientRect();
          return { left: field.left, width: field.width, height: field.height };
        }));
        assert.ok(gapFields[0].width > 0);
        assert.deepEqual(gapFields[0], gapFields[1], 'gap inputs have the same size and left edge');
        await fit.selectOption('height');
        for (let attempt = 0; attempt < 25 && !messages.slice(since).some(message => message.payload?.type === 'set-linked-fit'); attempt++) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        assert.equal(messages.slice(since).find(message => message.payload?.type === 'set-linked-fit')?.payload.fit, 'height');
        await page.locator('#linkedGapHorizontal input').fill('25');
        await page.locator('#linkedGapVertical input').fill('50');
        await page.locator('#applyLinkedGap').click();
        for (let attempt = 0; attempt < 25 && !messages.slice(since).some(message => message.payload?.type === 'set-linked-gap'); attempt++) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        assert.deepEqual(messages.slice(since).find(message => message.payload?.type === 'set-linked-gap')?.payload.gap,
          { horizontal: 25, vertical: 50 });
      }
      await page.close();
    }
  }
  t.diagnostic('Bundled sdpi-components 4.0.1 and real Shadow DOM; 65 locale/action/settings combinations. Mock Stream Deck host; no physical host observation.');
});
