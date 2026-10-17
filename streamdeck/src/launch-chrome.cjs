'use strict';
const { existsSync } = require('node:fs');
const { join } = require('node:path');
const { spawn } = require('node:child_process');

const MUSIC_URL = 'https://music.youtube.com/';

// Use Chrome explicitly: the default URL handler may be another browser.
// A paired extension owns tab selection/creation after Chrome starts. Passing a
// URL here would race that selection and duplicate an already-open player.
async function launchChrome({ openMusic = true, env = process.env, platform = process.platform,
  exists = existsSync, spawnProcess = spawn } = {}) {
  if (platform !== 'win32') throw new Error('Chrome launch is supported on Windows.');
  const roots = [env.LOCALAPPDATA, env.PROGRAMW6432, env.PROGRAMFILES, env['PROGRAMFILES(X86)']];
  const executable = [...new Set(roots.filter(Boolean))]
    .map(root => join(root, 'Google', 'Chrome', 'Application', 'chrome.exe')).find(exists);
  if (!executable) throw new Error('Google Chrome was not found in its standard installation locations.');
  await new Promise((resolve, reject) => {
    const child = spawnProcess(executable, openMusic ? [MUSIC_URL] : [], { detached: true, stdio: 'ignore', shell: false });
    child.once('error', reject);
    child.once('spawn', () => { child.unref(); resolve(); });
  });
}

module.exports = { launchChrome };
