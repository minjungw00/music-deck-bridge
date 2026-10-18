'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { validOrigin } = require('../domain/credentials.cjs');
const { portNumber, DEFAULT_PORT } = require('../domain/port.cjs');

function createFileStore({ appData = process.env.APPDATA || path.join(os.homedir(), '.config'), testPort } = {}) {
  const dataDir = path.join(appData, 'MusicDeckBridge');
  const configFile = path.join(dataDir, 'config.json');
  const authFile = path.join(dataDir, 'auth.json');
  function readPort() {
    if (portNumber(testPort)) return portNumber(testPort);
    try { return portNumber(JSON.parse(fs.readFileSync(configFile, 'utf8')).port) || DEFAULT_PORT; }
    catch { return DEFAULT_PORT; }
  }
  function savePort(port) {
    fs.mkdirSync(path.dirname(configFile), { recursive: true });
    const temp = configFile + '.tmp-' + process.pid;
    try {
      fs.writeFileSync(temp, JSON.stringify({ port }, null, 2), { mode: 0o600 });
      fs.renameSync(temp, configFile);
    } finally { try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch {} }
  }
  function readAuth() {
    try {
      const data = JSON.parse(fs.readFileSync(authFile, 'utf8'));
      if (typeof data.token === 'string' && /^[a-f0-9]{64}$/.test(data.token) &&
        typeof data.origin === 'string' && validOrigin(data.origin)) return data;
    } catch { /* Not paired yet */ }
    return null;
  }
  function saveAuth(newAuth) {
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    const temp = authFile + '.tmp-' + process.pid;
    try {
      fs.writeFileSync(temp, JSON.stringify(newAuth, null, 2), { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(temp, authFile);
    } finally { try { fs.rmSync(temp, { force: true }); } catch {} }
  }
  return { readPort, savePort, readAuth, saveAuth,
    removeAuth() { fs.rmSync(authFile, { force: true }); } };
}
module.exports = { createFileStore };
