'use strict';
// Shared by the classic MV3 worker and the bundled Node plugin. Application
// versions are diagnostic only; compatibility depends on this wire range.
(function (root) {
  const descriptor = Object.freeze({ protocolVersion: 1, minProtocolVersion: 1 });
  const valid = value => Number.isSafeInteger(value) && value >= 1 && value <= 65535;
  const versionLabel = value => typeof value === 'string' && value.length <= 80 && /^\d+\.\d+\.\d+(?:\.\d+)?(?:-[A-Za-z0-9.-]+)?(?:\+[A-Za-z0-9.-]+)?$/.test(value) ? value : null;
  function negotiate(peer, component, local = descriptor) {
    const other = component === 'plugin' ? 'extension' : 'plugin';
    const legacy = peer?.protocolVersion === undefined && peer?.minProtocolVersion === undefined;
    const max = legacy ? 1 : peer?.protocolVersion;
    const min = legacy ? 1 : peer?.minProtocolVersion === undefined ? max : peer.minProtocolVersion;
    if (!valid(min) || !valid(max) || min > max) {
      return { compatible: false, legacy: false, negotiatedProtocolVersion: null,
        updateRequired: null, errorCode: 'invalid-protocol' };
    }
    if (min > local.protocolVersion || max < local.minProtocolVersion) {
      return { compatible: false, legacy, negotiatedProtocolVersion: null,
        updateRequired: min > local.protocolVersion ? component : other, errorCode: 'protocol-incompatible' };
    }
    return { compatible: true, legacy, negotiatedProtocolVersion: Math.min(max, local.protocolVersion),
      updateRequired: null, errorCode: null };
  }
  const api = Object.freeze({ descriptor, negotiate, versionLabel });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MusicDeckProtocol = api;
})(globalThis);
