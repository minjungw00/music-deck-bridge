'use strict';
const PLUGIN_ID = 'io.github.minjungw00.musicdeckbridge';
const ACTION_NAMES = ['nowplaying', 'toggle', 'prev', 'next', 'mute', 'volume', 'trackdial', 'open', 'like', 'dislike'];
function actionName(id) { return id.slice(PLUGIN_ID.length + 1); }
module.exports = { PLUGIN_ID, ACTION_NAMES, actionName };
