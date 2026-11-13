'use strict';
(function (root) {
  const supported = Object.freeze(['en', 'ko', 'zh_CN', 'zh_TW', 'ja', 'es', 'fr', 'de']);
  function resolve(value) {
    const tag = String(value || '').replaceAll('_', '-').toLowerCase();
    const base = tag.split('-')[0];
    if (base === 'zh') return /(?:^|-)(?:hant|tw|hk|mo)(?:-|$)/.test(tag) ? 'zh_TW' : 'zh_CN';
    return supported.includes(base) ? base : 'en';
  }
  const api = Object.freeze({ supported, resolve, html: value => resolve(value).replace('_', '-') });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MusicDeckLanguage = api;
})(globalThis);
