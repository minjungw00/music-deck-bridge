'use strict';
const { portNumber } = require('../domain/port.cjs');
const LOCALHOST = '127.0.0.1';
const PORT_GRACE_MS = 120000;

function createPortService({ initialPort, savePort, bindPort, notifyPortChange, log,
  setTimeout = globalThis.setTimeout, clearTimeout = globalThis.clearTimeout }) {
  let currentPort = initialPort;
  let bridgeServer = null;
  let bridgeOnline = false;
  let portError = '';
  let pendingOperation = Promise.resolve();
  const retiringListeners = new Map();
  function enqueue(task) {
    const operation = pendingOperation.then(task);
    pendingOperation = operation.then(() => undefined, () => undefined);
    return operation;
  }
  function retire(port, server) {
    const timer = setTimeout(() => { retiringListeners.delete(port); server.close(); }, PORT_GRACE_MS);
    timer.unref();
    retiringListeners.set(port, { server, timer });
    // Avoid leaving many ports open after repeated changes.
    while (retiringListeners.size > 3) {
      const [oldestPort, detail] = retiringListeners.entries().next().value;
      clearTimeout(detail.timer);
      retiringListeners.delete(oldestPort);
      detail.server.close();
    }
  }
  function changePort(value) {
    // Startup and changes from every inspector/popup share one listener lifecycle.
    return enqueue(async () => {
      const next = portNumber(value);
      if (next === null) return { ok: false, error: 'Port must be an integer between 1024 and 65535.' };
      if (next === currentPort && bridgeOnline) return { ok: true, port: next, unchanged: true };
      let server;
      const reuse = retiringListeners.get(next);
      if (reuse) {
        // Reverting a port change within the grace period must work without EADDRINUSE.
        server = reuse.server;
        clearTimeout(reuse.timer);
        retiringListeners.delete(next);
      } else {
        try { server = await bindPort(next); }
        catch (error) { return { ok: false, error: `Cannot listen on ${next}: ${error.code || error.message}` }; }
      }
      try { savePort(next); }
      catch (error) {
        if (reuse) retire(next, server);
        else server.close();
        return { ok: false, error: `Could not save port: ${error.message}` };
      }
      const old = bridgeServer;
      const oldPort = currentPort;
      bridgeServer = server;
      currentPort = next;
      bridgeOnline = true;
      portError = '';
      notifyPortChange();
      log(`Loopback bridge now on ${LOCALHOST}:${currentPort}`);
      // Grace period lets Chrome learn the new port from the authenticated old endpoint.
      if (old && old !== server) retire(oldPort, old);
      return { ok: true, port: next };
    });
  }

  return {
    change: changePort,
    get port() { return currentPort; },
    get online() { return bridgeOnline; },
    get error() { return portError; },
    start() {
      return enqueue(async () => {
        if (bridgeOnline) return;
        try {
          bridgeServer = await bindPort(currentPort);
          bridgeOnline = true;
          portError = '';
          log(`Loopback bridge on ${LOCALHOST}:${currentPort}`);
        } catch (error) {
          bridgeOnline = false;
          portError = `Port ${currentPort}: ${error.code || error.message}`;
          log(`Bridge unavailable: ${portError}`);
        }
      });
    },
  };
}
module.exports = { createPortService };
