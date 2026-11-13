import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { chromium } from 'playwright';
import { WebSocketServer } from 'ws';

const { supported, html } = createRequire(import.meta.url)('../../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/property-inspector/language.js');
const inspector = new URL('../../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/property-inspector/settings.html', import.meta.url);
const actionPrefix = 'io.github.minjungw00.musicdeckbridge.';
const saved = { showTitle: false, showArtist: true, titleBackground: false, artworkShowTitle: true,
  artworkShowArtist: true, artworkTitleBackground: false, volumeShowValue: true, volumeShowPercent: false,
  volumeStep: 3, volumeFeedbackSeconds: 1.5, dialDisplay: 'artwork' };

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
  for (const language of supported) for (const settings of [{}, saved]) {
    for (const action of ['nowplaying', 'trackdial', 'volumeup', 'volumedown']) {
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
      const labels = await page.evaluate(async () => {
        const elements = [...document.querySelectorAll('sdpi-item[label], sdpi-checkbox[label]')];
        await Promise.all(elements.map(element => element.updateComplete));
        return elements.map(element => ({ id: element.id, kind: element.localName,
          expected: element.getAttribute('label'), actual: element.shadowRoot.querySelector(
            element.localName === 'sdpi-checkbox' ? '.checkable-text' : '.label label')?.textContent.trim(),
          value: element.localName === 'sdpi-checkbox' ? element.value : undefined }));
      });
      assert.equal(labels.filter(label => label.kind === 'sdpi-checkbox').length, 8);
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
        assert.equal(select.selected, settings[select.id] || select.fallback);
        assert.equal(select.value, settings[select.id]);
      }
      for (const label of labels) {
        if (language === 'ko') assert.match(label.expected, /[가-힣]/, label.id);
        assert.equal(label.actual, label.expected + (label.kind === 'sdpi-item' ? ':' : ''),
          `${language}/${action}/${Object.keys(settings).length ? 'saved' : 'fresh'}/${label.id}`);
        if (label.kind === 'sdpi-checkbox') assert.equal(label.value, settings[label.id], `${label.id}: localization preserves the setting value`);
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
      await page.close();
    }
  }
  t.diagnostic('Bundled sdpi-components 4.0.1 and real Shadow DOM; 64 locale/action/settings combinations. Mock Stream Deck host; no physical host observation.');
});
