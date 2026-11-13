import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { translate } from '../streamdeck/src/presentation/renderer.cjs';
const { supported, resolve, html } = createRequire(import.meta.url)('../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/property-inspector/language.js');
const plugin = new URL('../streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/', import.meta.url);
const json = path => JSON.parse(readFileSync(path, 'utf8'));

test('host locale aliases resolve to all official languages and unsupported languages fall back to English', () => {
  assert.deepEqual(supported, ['en', 'ko', 'zh_CN', 'zh_TW', 'ja', 'es', 'fr', 'de']);
  for (const [input, expected] of [['en-US','en'], ['ko-KR','ko'], ['zh-CN','zh_CN'], ['zh_Hans_SG','zh_CN'],
    ['zh_TW','zh_TW'], ['zh-Hant-HK','zh_TW'], ['ja-JP','ja'], ['es-MX','es'], ['fr-CA','fr'], ['de-DE','de'],
    ['pt-BR','en'], ['it','en'], [undefined,'en']]) {
    assert.equal(resolve(input), expected);
    assert.equal(html(input), expected.replace('_','-'));
  }
});

test('inspector, extension and native action catalogs are complete for every supported UI locale', () => {
  const context = {};
  vm.runInNewContext(readFileSync(new URL('property-inspector/locales.js', plugin), 'utf8'), context);
  const strings = context.MusicDeckInspectorStrings;
  const english = json(new URL('../chrome-extension/_locales/en/messages.json', import.meta.url));
  const manifest = json(new URL('manifest.json', plugin));
  for (const locale of supported) {
    assert.deepEqual(Object.keys(strings[locale]).sort(), Object.keys(strings.en).sort(), locale);
    for (const value of Object.values(strings[locale])) assert.ok(value.trim());
    const chrome = json(new URL(`../chrome-extension/_locales/${locale}/messages.json`, import.meta.url));
    assert.deepEqual(Object.keys(chrome).sort(), Object.keys(english).sort(), locale);
    assert.equal(chrome.uiLanguageCode.message, html(locale));
    for (const value of Object.values(chrome)) assert.ok(value.message.trim());
    const actions = json(new URL(`${locale}.json`, plugin));
    for (const action of manifest.Actions) {
      assert.ok(actions[action.UUID]?.Name && actions[action.UUID]?.Tooltip, `${locale}/${action.UUID}`);
      for (const key of Object.keys(action.Encoder?.TriggerDescription || {}))
        assert.ok(actions[action.UUID].Encoder.TriggerDescription[key]);
    }
  }
});

test('device status captions use the same locale mapping as settings', () => {
  for (const [locale, expected] of [['en','Current Track'], ['ko','현재 곡'], ['zh_CN','当前歌曲'],
    ['zh_TW','目前歌曲'], ['ja','現在の曲'], ['es','Canción actual'], ['fr','Titre actuel'], ['de','Aktueller Titel']]) {
    assert.equal(translate(locale, 'currentTrack'), expected);
    for (const key of ['unavailable','offline','pause','play','muted','absent','open','like','dislike']) assert.ok(translate(locale, key));
  }
  assert.equal(translate('pt-BR', 'currentTrack'), 'Current Track');
});
