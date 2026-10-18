'use strict';
const http = require('node:http');
const protocol = require('../../../chrome-extension/protocol.js');
const { validOrigin } = require('../domain/credentials.cjs');
const { PLAYER_STALE_MS } = require('../domain/player-state.cjs');
const LOCALHOST = '127.0.0.1';

function createHttpBridge({ session, players, commands, covers, getPorts, onDeckEvent, version, isTest = false }) {
  function sendHttp(res, status, data, origin) {
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    if (validOrigin(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Vary'] = 'Origin';
      headers['Access-Control-Allow-Headers'] = 'Content-Type';
      headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    }
    res.writeHead(status, headers);
    res.end(JSON.stringify(validOrigin(origin) && data && typeof data === 'object' ?
      { ...data, pluginVersion: version, ...protocol.descriptor,
        ...((status >= 200 && status < 300) || status === 409 ? { serverPort: getPorts().port } : {}) } : data));
  }
  function getBody(req) {
    return new Promise((resolve, reject) => {
      const parts = []; let total = 0;
      req.on('data', chunk => {
        total += chunk.length;
        if (total > 16000) { reject(new Error('Request too large')); req.destroy(); return; }
        parts.push(chunk);
      });
      req.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(parts).toString('utf8'))); }
        catch { reject(new Error('Invalid JSON')); }
      });
      req.on('error', reject);
    });
  }
  async function requestHandler(req, res) {
    const origin = req.headers.origin;
    // Reject regular web sites, even when localhost can be reached from the browser.
    if (!validOrigin(origin)) return sendHttp(res, 403, { error: 'Extension origin required' });
    if (req.method === 'OPTIONS') return sendHttp(res, 204, {}, origin);
    if (req.method !== 'POST') return sendHttp(res, 405, { error: 'POST only' }, origin);
    let body;
    try { body = await getBody(req); } catch { return sendHttp(res, 400, { error: 'Bad request' }, origin); }
    if (!body || typeof body !== 'object') return sendHttp(res, 400, { error: 'Bad JSON' }, origin);
    if (req.url === '/pair') {
      const result = session.pair(body, origin);
      return sendHttp(res, result.status, result.data, origin);
    }
    if (!session.authorized(body, origin)) {
      // A reinstalled extension can report absent credentials, but cannot revoke
      // the stored pair or displace a live authenticated browser channel.
      if (req.url === '/status' && body.token === '') session.missingCredentials(origin);
      return sendHttp(res, 401, { error: 'Not paired, or extension ID changed' }, origin);
    }
    session.contact();
    if (req.url === '/unpair') {
      session.unpair();
      return sendHttp(res, 200, { ok: true }, origin);
    }
    if (!session.checkProtocol(body)) return sendHttp(res, 409, { error: 'Incompatible bridge protocol',
      errorCode: session.compatibility.errorCode, compatibility: session.compatibility }, origin);
    if (req.url === '/configure-port') {
      const result = await getPorts().change(body.port);
      return sendHttp(res, result.ok ? 200 : 409, result, origin);
    }
    if (req.url === '/status') {
      const chosen = players.selected();
      return sendHttp(res, 200, { paired: true, compatibility: session.compatibility, active: !!chosen,
        track: chosen ? chosen[1].title : '', standalone: chosen ? chosen[1].standalone : false,
        extensionOnline: session.extensionOnline(),
        playerStale: !!chosen && Date.now() - chosen[1].lastMediaSyncAt > PLAYER_STALE_MS,
        coverDetected: Boolean(chosen?.[1].cover),
        coverStatus: covers.status(chosen?.[1].cover) }, origin);
    }
    if (req.url === '/browser-listen') {
      // Reconcile after Chrome/worker restart too: tab-close notifications can be
      // lost when the whole browser exits, leaving a closed PWA preferred
      // until its old metadata lease expires.
      if (body.clientIds !== undefined) {
        if (!Array.isArray(body.clientIds) || body.clientIds.length > 1024 ||
            !body.clientIds.every(id => Number.isSafeInteger(id) && id >= 0 && id < 1e12)) {
          return sendHttp(res, 400, { error: 'Invalid clients' }, origin);
        }
        players.reconcile(body.clientIds);
      }
      return commands.listenBrowser(httpChannel(res, origin));
    }
    if (req.url === '/player-closed') {
      const clientId = String(body.clientId ?? '');
      if (!/^\d{1,12}$/.test(clientId)) return sendHttp(res, 400, { error: 'Invalid client' }, origin);
      players.remove(clientId);
      commands.removePlayer(clientId);
      return sendHttp(res, 200, { ok: true }, origin);
    }
    if (req.url === '/browser-result') {
      commands.acknowledge(body.id, body.ok, body.reason);
      return sendHttp(res, 200, { ok: true }, origin);
    }
    if (req.url === '/listen') {
      const clientId = String(body.clientId ?? '').slice(0, 64);
      if (!/^\d{1,12}$/.test(clientId)) return sendHttp(res, 400, { error: 'Invalid client' }, origin);
      if (!players.touch(clientId)) return sendHttp(res, 200, { commands: [], idle: true }, origin);
      return commands.listen(clientId, httpChannel(res, origin));
    }
    if (req.url === '/sync') {
      const clientId = String(body.clientId ?? '').slice(0, 64);
      if (!/^\d{1,12}$/.test(clientId)) return sendHttp(res, 400, { error: 'Invalid client' }, origin);
      const selected = players.sync(clientId, body.state);
      return sendHttp(res, 200, { commands: commands.dispatch(clientId), selected }, origin);
    }
    if (isTest && req.url === '/__test/event') {
      onDeckEvent(body.event);
      return sendHttp(res, 200, { ok: true }, origin);
    }
    if (isTest && req.url === '/__test/command') {
      return sendHttp(res, 200, { accepted: commands.addLegacy(body.type, body.amount) }, origin);
    }
    return sendHttp(res, 404, { error: 'Unknown endpoint' }, origin);
  }
  function makeServer() {
    return http.createServer((req, res) => { void requestHandler(req, res).catch(() => {
      if (!res.headersSent) sendHttp(res, 500, { error: 'Internal error' }, req.headers.origin);
    }); });
  }
  function bindPort(port) {
    return new Promise((resolve, reject) => {
      const server = makeServer();
      server.once('error', e => { server.close(); reject(e); });
      server.listen(port, LOCALHOST, () => resolve(server));
    });
  }
  function httpChannel(res, origin) {
    return { reply: (message, status = 200) => {
      if (!res.destroyed && !res.writableEnded) sendHttp(res, status, message, origin);
    }, onClose: callback => res.once('close', callback) };
  }
  return { bind: bindPort };
}
module.exports = { createHttpBridge };
