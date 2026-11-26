'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { validOrigin } = require('../domain/credentials.cjs');
const { portNumber, DEFAULT_PORT } = require('../domain/port.cjs');
const { MAX_IMAGE_URI_LENGTH } = require('../domain/raster-artwork.cjs');

function createFileStore({ appData = process.env.APPDATA || path.join(os.homedir(), '.config'), testPort } = {}) {
  const dataDir = path.join(appData, 'MusicDeckBridge');
  const configFile = path.join(dataDir, 'config.json');
  const authFile = path.join(dataDir, 'auth.json');
  const lastTrackFile = path.join(dataDir, 'last-track.json');
  function saveJson(file, value) {
    fs.mkdirSync(dataDir, { recursive: true });
    const temp = file + '.tmp-' + process.pid;
    try {
      fs.writeFileSync(temp, JSON.stringify(value, null, 2), { encoding: 'utf8', mode: 0o600 });
      fs.renameSync(temp, file);
    } finally { try { fs.rmSync(temp, { force: true }); } catch {} }
  }
  function readPort() {
    if (portNumber(testPort)) return portNumber(testPort);
    try { return portNumber(JSON.parse(fs.readFileSync(configFile, 'utf8')).port) || DEFAULT_PORT; }
    catch { return DEFAULT_PORT; }
  }
  function readAuth() {
    try {
      const data = JSON.parse(fs.readFileSync(authFile, 'utf8'));
      if (typeof data.token === 'string' && /^[a-f0-9]{64}$/.test(data.token) &&
        typeof data.origin === 'string' && validOrigin(data.origin)) return data;
    } catch { /* Not paired yet */ }
    return null;
  }
  function readLastTrack() {
    try {
      if (fs.statSync(lastTrackFile).size > MAX_IMAGE_URI_LENGTH + 4096) return null;
      return JSON.parse(fs.readFileSync(lastTrackFile, 'utf8'));
    } catch { return null; }
  }
  return { readPort, savePort: port => saveJson(configFile, { port }), readAuth,
    saveAuth: auth => saveJson(authFile, auth), readLastTrack,
    saveLastTrack: record => record ? saveJson(lastTrackFile, record) : fs.rmSync(lastTrackFile, { force: true }),
    removeAuth() { fs.rmSync(authFile, { force: true }); } };
}
module.exports = { createFileStore };
