'use strict';
const crypto = require('node:crypto');
const protocol = require('../../../chrome-extension/protocol.js');
const { safeEqual } = require('../domain/credentials.cjs');
const EXTENSION_ONLINE_MS = 3000;
const PIN_LIFETIME_MS = 10 * 60 * 1000;

function createSessionService({ storage, commands, resetPlayerState, onChange, version,
  testPin, now = Date.now }) {
  let auth = storage.readAuth(), currentPin = '', pinExpiresAt = 0, failures = [];
  let lastExtensionContactAt = 0, pairingRequired = false, compatibility = null;
  function generatePin() {
    currentPin = testPin ? testPin : String(crypto.randomInt(100000, 1000000));
    pinExpiresAt = now() + PIN_LIFETIME_MS;
    return currentPin;
  }
  function resetSession() {
    commands.reset();
    resetPlayerState();
    lastExtensionContactAt = 0;
    pairingRequired = false;
    commands.lastError = '';
    compatibility = null;
    onChange();
  }
  function authorized(body, origin) {
    return auth && origin === auth.origin && safeEqual(body.token, auth.token);
  }
  function extensionOnline() {
    return Boolean(auth) && !pairingRequired && !protocolBlocked() && (commands.polling ||
      now() - lastExtensionContactAt < EXTENSION_ONLINE_MS);
  }
  function protocolBlocked() { return compatibility?.compatible === false; }
  function checkProtocol(body) {
    compatibility = { ...protocol.negotiate(body, 'plugin'), pluginVersion: version,
      extensionVersion: protocol.versionLabel(body.extensionVersion),
      peerProtocolVersion: Number.isSafeInteger(body.protocolVersion) ? body.protocolVersion : null,
      peerMinProtocolVersion: Number.isSafeInteger(body.minProtocolVersion) ? body.minProtocolVersion : null };
    if (protocolBlocked()) {
      commands.block(compatibility);
      resetPlayerState();
      onChange();
      return false;
    }
    if (['protocol-incompatible', 'invalid-protocol'].includes(commands.lastError)) commands.lastError = '';
    return true;
  }
  return {
    generatePin, authorized, checkProtocol, extensionOnline,
    get compatibility() { return compatibility; },
    get paired() { return Boolean(auth); },
    get snapshot() { return { auth, pairingRequired, compatibility, blocked: protocolBlocked() }; },
    get pin() { return currentPin && now() < pinExpiresAt ? currentPin : ''; },
    get expiresAt() { return currentPin && now() < pinExpiresAt ? pinExpiresAt : 0; },
    contact() { pairingRequired = false; lastExtensionContactAt = now(); },
    missingCredentials(origin) {
      if (auth?.origin !== origin || commands.browserPolling) return;
      pairingRequired = true;
      lastExtensionContactAt = 0;
      commands.missingCredentials();
    },
    pair(body, origin) {
      failures = failures.filter(t => now() - t < 60000);
      if (failures.length >= 5) return { status: 429, data: { error: 'Too many attempts; retry in a minute' } };
      if (now() > pinExpiresAt || !safeEqual(body.pin, currentPin) || !currentPin) {
        failures.push(now());
        return { status: 403, data: { error: 'Incorrect or expired PIN' } };
      }
      if (!checkProtocol(body)) return { status: 409, data: {
        error: 'Incompatible bridge protocol', errorCode: compatibility.errorCode, compatibility } };
      const pairedCompatibility = compatibility;
      const token = crypto.randomBytes(32).toString('hex');
      const credentials = { token, origin };
      storage.saveAuth(credentials);
      resetSession();
      auth = credentials;
      compatibility = pairedCompatibility;
      lastExtensionContactAt = now();
      currentPin = ''; pinExpiresAt = 0; failures = [];
      onChange();
      return { status: 200, data: { token, compatibility } };
    },
    unpair() {
      // Persist revocation first; failed deletion leaves the active pair intact.
      storage.removeAuth();
      auth = null;
      currentPin = ''; pinExpiresAt = 0;
      resetSession();
    },
  };
}
module.exports = { createSessionService };
