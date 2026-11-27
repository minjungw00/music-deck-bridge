'use strict';
(function (root) {
  function createBridgeClient({ chrome, protocol, fetch }) {
    const extensionManifest = chrome.runtime.getManifest?.() || {};
    const EXTENSION_VERSION = extensionManifest.version_name || extensionManifest.version || 'unknown';
    let bridgeCompatibility = null;
    let connectionRevision = 0;
    let portWrites = Promise.resolve();
    const protocolBlocked = () => bridgeCompatibility?.compatible === false;
    function protocolInfo(data) {
      return { ...protocol.negotiate(data, 'extension'),
        pluginVersion: protocol.versionLabel(data.pluginVersion), extensionVersion: EXTENSION_VERSION,
        peerProtocolVersion: Number.isSafeInteger(data.protocolVersion) ? data.protocolVersion : null };
    }
    function protocolMessage(info) {
      const key = info.updateRequired === 'plugin' ? 'updatePlugin' : info.updateRequired === 'extension' ? 'updateExtension' : 'protocolInvalid';
      return chrome.i18n?.getMessage?.(key) || ({ updatePlugin: 'Update the Stream Deck plugin to connect.',
        updateExtension: 'Update the Chrome extension to connect.', protocolInvalid: 'Invalid compatibility information. Update both components and check again.' })[key];
    }
    function failure(error) {
      return { ok: false, error: error.message, ...(error.compatibility ? { compatibility: error.compatibility } : {}) };
    }
    // Service worker; bearer token never leaves the extension background context.
    const storageReady = chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
    // Requests await this same promise and fail closed if the access restriction fails.
    void storageReady.catch(() => {});
    const DEFAULT_PORT = 17864;
    const validPort = p => Number.isInteger(Number(p)) && Number(p) >= 1024 && Number(p) <= 65535;
    async function readConnection() {
      await storageReady;
      while (true) {
        const writes = portWrites;
        await writes;
        if (writes !== portWrites) continue;
        const revision = connectionRevision;
        const data = await chrome.storage.local.get('bridgePort');
        if (revision === connectionRevision && writes === portWrites) {
          return { port: validPort(data.bridgePort) ? Number(data.bridgePort) : DEFAULT_PORT, revision };
        }
      }
    }
    async function configuredPort() { return (await readConnection()).port; }
    function writePort(port, fromRevision) {
      const operation = portWrites.then(async () => {
        await storageReady;
        if (fromRevision !== undefined) {
          // Recheck at the write boundary, after any preceding storage operation.
          if (fromRevision !== connectionRevision) return;
          connectionRevision++;
        }
        await chrome.storage.local.set({ bridgePort: port });
      });
      portWrites = operation.catch(() => {});
      return operation;
    }
    function setLocalPort(port) {
      connectionRevision++;
      return writePort(port);
    }

    async function post(endpoint, payload, timeout = 3000) {
      const { port, revision } = await readConnection();
      const response = await fetch(`http://127.0.0.1:${port}${endpoint}`, {
        method: 'POST', mode: 'cors', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, ...protocol.descriptor, extensionVersion: EXTENSION_VERSION }),
        signal: AbortSignal.timeout(timeout),
      });
      const data = await response.json();
      if (endpoint !== '/unpair' && (response.ok || ['protocol-incompatible', 'invalid-protocol'].includes(data.errorCode))) {
        const info = protocolInfo(data);
        // A peer can reject a range even if its envelope is inconsistent. Never
        // treat a protocol rejection as a transient network or pairing problem.
        if (data.errorCode && info.compatible && ['protocol-incompatible', 'invalid-protocol'].includes(data.errorCode)) {
          Object.assign(info, { compatible: false, errorCode: 'invalid-protocol', updateRequired: null, negotiatedProtocolVersion: null });
        }
        if (revision === connectionRevision) bridgeCompatibility = info;
        if (!info.compatible) {
          const error = new Error(protocolMessage(info));
          error.httpStatus = response.status; error.compatibility = info;
          throw error;
        }
      }
      if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}`);
        error.httpStatus = response.status;
        throw error;
      }
      // Follow live port changes announced by the paired bridge.
      if (validPort(data.serverPort) && Number(data.serverPort) !== port) {
        await writePort(Number(data.serverPort), revision);
      }
      return data;
    }
    async function pairedToken() {
      await storageReady;
      const data = await chrome.storage.local.get('bridgeToken');
      return data.bridgeToken || '';
    }

    return { post, pairedToken, configuredPort, setLocalPort, validPort, failure, storageReady,
      async saveToken(token) { connectionRevision++; await storageReady; await chrome.storage.local.set({ bridgeToken: token }); },
      async removeToken() { connectionRevision++; await storageReady; await chrome.storage.local.remove('bridgeToken'); },
      blocked: protocolBlocked, get compatibility() { return bridgeCompatibility; },
      clearCompatibility() { connectionRevision++; bridgeCompatibility = null; } };
  }
  root.MusicDeckBridgeClient = Object.freeze({ create: createBridgeClient });
})(globalThis);
