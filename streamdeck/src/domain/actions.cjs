'use strict';
const PLUGIN_ID = 'io.github.minjungw00.musicdeckbridge';
const KEY_ACTION_NAMES = ['nowplaying', 'toggle', 'prev', 'next', 'mute', 'volumeup', 'volumedown', 'open', 'like', 'dislike', 'repeat', 'shuffle'];
const ACTION_NAMES = [...KEY_ACTION_NAMES, 'volume', 'trackdial'];
const VOLUME_ACTION_NAMES = ['volume', 'volumeup', 'volumedown'];
function actionName(id) { return id.slice(PLUGIN_ID.length + 1); }
module.exports = { PLUGIN_ID, ACTION_NAMES, KEY_ACTION_NAMES, VOLUME_ACTION_NAMES, actionName };
