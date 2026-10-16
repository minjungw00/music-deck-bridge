import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../chrome-extension/popup.js', import.meta.url), 'utf8');
const english = JSON.parse(readFileSync(new URL('../chrome-extension/_locales/en/messages.json', import.meta.url)));

for (const locale of ['en', 'ko', 'fr']) {
  test(`popup localizes controls, PIN validation and pairing state for ${locale}`, async () => {
    const catalog = locale === 'ko'
      ? JSON.parse(readFileSync(new URL('../chrome-extension/_locales/ko/messages.json', import.meta.url)))
      : english;
    const nodes = new Map();
    function element(id) {
      if (!nodes.has(id)) nodes.set(id, {
        value: '', textContent: '', style: {}, handlers: {},
        addEventListener(event, handler) { this.handlers[event] = handler; },
        click() { return this.handlers.click(); },
      });
      return nodes.get(id);
    }
    const calls = [];
    let unpairFailed = false;
    const chrome = {
      i18n: { getUILanguage: () => locale, getMessage: key => (catalog[key] || english[key])?.message || '' },
      runtime: { async sendMessage(message) {
        calls.push(message);
        if (message.type === 'get-port') return { ok: true, port: 17864 };
        if (message.type === 'unpair') return unpairFailed ? { ok: false, error: catalog.unpairFailed.message } : { ok: true };
        if (message.type === 'pair') return { ok: true };
        return { ok: true, active: false };
      } },
    };
    const document = { documentElement: {}, getElementById: element };
    vm.runInNewContext(source, { chrome, document });
    // Drain startup status/port promises before exercising user input.
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(document.title, 'Music Deck Bridge');
    assert.equal(element('heading').textContent, 'Music Deck Bridge');
    assert.equal(element('subtitle').textContent, catalog.subtitle.message);
    assert.equal(document.documentElement.lang, locale === 'ko' ? 'ko' : 'en');
    assert.equal(element('connect').textContent, catalog.connect.message);
    assert.equal(element('status').textContent, catalog.paired.message);
    element('pin').value = '12';
    await element('connect').click();
    assert.equal(element('status').textContent, catalog.invalid.message);
    assert.ok(!calls.some(call => call.type === 'pair'));
    element('pin').value = '123456';
    await element('connect').click();
    assert.equal(element('pin').value, '');
    assert.equal(element('status').textContent, catalog.connected.message);
    unpairFailed = true;
    await element('forget').click();
    assert.equal(element('status').textContent, catalog.unpairFailed.message);
    unpairFailed = false;
    await element('forget').click();
    assert.equal(element('status').textContent, catalog.removed.message);
    element('port').value = '1';
    await element('savePort').click();
    assert.equal(element('status').textContent, catalog.portInvalid.message);
  });
}
