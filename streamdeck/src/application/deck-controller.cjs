'use strict';
const protocol = require('../../../chrome-extension/protocol.js');
const { PLUGIN_ID, VOLUME_ACTION_NAMES, actionName } = require('../domain/actions.cjs');
const { limit } = require('../domain/values.cjs');
const { PLAYER_STALE_MS } = require('../domain/player-state.cjs');

function createDeckController({ displayed, commands, session, ports, players, output, onChange,
  version, now = Date.now }) {
  function controlPlayer(context, type, amount = 0) {
    void commands.request(type, amount).then(ok => { if (ok === false) output.send({ event: 'showAlert', context }); });
  }
  function volumeStep(context) {
    const item = displayed.get(context);
    const raw = Number(item?.volumePreview?.value ?? item?.settings?.volumeStep);
    return Number.isInteger(raw) ? limit(raw, 1, 5) : 4;
  }
  function changeVolume(context, amount) {
    const item = displayed.get(context);
    const selected = players?.selected();
    const feedback = { playerId: selected ? String(selected[0]) : null, before: selected?.[1],
      confirmed: false, expiresAt: Infinity };
    if (item) {
      item.volumeRequest = feedback;
      if (item.settings?.volumeShowValue !== false) item.volumeFeedback = feedback;
    }
    void commands.request('volume_delta', amount).then(ok => {
      if (!item || displayed.get(context) !== item || item.volumeRequest !== feedback) return;
      delete item.volumeRequest;
      if (ok === true) {
        if (item.volumeFeedback === feedback) { feedback.confirmed = true; feedback.expiresAt = now() + 5000; }
      }
      else {
        delete item.volumeFeedback;
        delete item.volumeDisplay;
        if (ok === false) output.send({ event: 'showAlert', context });
      }
      onChange();
    });
  }
  function handleDeckEvent(e) {
    if (!e || !e.event) return;
    if (e.event === 'willAppear') {
      displayed.set(e.context, { action: e.action, lastImage: '', lastTitle: null, settings: e.payload?.settings || {} });
      onChange(); return;
    }
    if (e.event === 'willDisappear') { displayed.delete(e.context); return; }
    if (e.event === 'didReceiveSettings') {
      const item = displayed.get(e.context);
      if (item) {
        const incoming = e.payload?.settings || {};
        if (item.volumePreview && VOLUME_ACTION_NAMES.includes(actionName(item.action))) {
          const saved = Number(incoming.volumeStep);
          if (saved === item.volumePreview.value) item.volumePreview = null;
          else if (now() - item.volumePreview.at < 3500) incoming.volumeStep = item.volumePreview.value;
          else item.volumePreview = null;
        }
        item.settings = incoming;
        if (incoming.volumeShowValue === false) {
          delete item.volumeFeedback;
          delete item.volumeDisplay;
        }
        onChange();
      }
      return;
    }
    const kind = actionName(e.action || '');
    if (e.event === 'sendToPlugin') {
      // Stream Deck's property inspector is the only source of this event.
      if (!e.action?.startsWith(PLUGIN_ID + '.')) return;
      const request = e.payload?.type;
      if (request === 'generate-pin') session.generatePin();
      if (request === 'volume-preview') {
        // Saved settings can arrive after the next key press or dial rotation.
        // Update the active action immediately, even while the inspector is being dragged.
        const item = displayed.get(e.context);
        const value = Number(e.payload?.value);
        if (item && VOLUME_ACTION_NAMES.includes(actionName(item.action)) && Number.isInteger(value) && value >= 1 && value <= 5) {
          item.volumePreview = { value, at: now() };
          item.settings.volumeStep = value;
        }
        return;
      }
      if (request === 'set-port') {
        void ports.change(e.payload?.port).then(result => {
          output.send({ event: 'sendToPropertyInspector', context: e.context,
            payload: { type: 'port-result', ...result, serverPort: ports.port } });
        });
        return;
      }
      if (request === 'generate-pin' || request === 'get-connection') {
        const chosen = players.selected();
        output.send({ event: 'sendToPropertyInspector', context: e.context,
          payload: { type: 'connection', paired: session.paired,
            extensionOnline: session.extensionOnline(),
            playerActive: !!chosen,
            playerStale: Boolean(chosen) && now() - chosen[1].lastMediaSyncAt > PLAYER_STALE_MS,
            pin: session.pin, expiresAt: session.expiresAt,
            serverPort: ports.port, bridgeOnline: ports.online, portError: ports.error, lastCommandError: commands.lastError,
            pluginVersion: version, ...protocol.descriptor, compatibility: session.compatibility } });
      }
      return;
    }
    if (e.event === 'keyDown') {
      if (kind === 'volumeup' || kind === 'volumedown') {
        changeVolume(e.context, (kind === 'volumeup' ? 1 : -1) * volumeStep(e.context));
        return;
      }
      const type = ({ nowplaying: 'toggle', toggle: 'toggle', open: 'open', prev: 'prev',
        next: 'next', mute: 'mute', like: 'like', dislike: 'dislike' })[kind];
      if (type) controlPlayer(e.context, type);
    } else if (e.event === 'dialRotate') {
      const ticks = Number(e.payload?.ticks) || 0;
      if (kind === 'volume' && ticks !== 0) {
        controlPlayer(e.context, 'volume_delta', limit(ticks * volumeStep(e.context), -100, 100));
      }
      if (kind === 'trackdial' && Number.isSafeInteger(ticks) && ticks !== 0) {
        const count = Math.min(Math.abs(ticks), 5);
        for (let i = 0; i < count; i++) controlPlayer(e.context, ticks > 0 ? 'next' : 'prev');
      }
    } else if (e.event === 'dialDown') {
      const type = kind === 'volume' ? 'mute' : kind === 'trackdial' ? 'toggle' : null;
      if (type) controlPlayer(e.context, type);
    } else if (e.event === 'touchTap' && (kind === 'volume' || kind === 'trackdial')) {
      controlPlayer(e.context, kind === 'volume' ? 'mute' : 'toggle');
    }
  }
  return { handle: handleDeckEvent };
}
module.exports = { createDeckController };
