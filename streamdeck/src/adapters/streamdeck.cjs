'use strict';
const { PLUGIN_ID, ACTION_NAMES } = require('../domain/actions.cjs');

function createDeckAdapter({ onEvent, onConnected, log, isTest = false }) {
  let streamDeck, sdOnline = false, locale = 'en';
  function sendStream(message) {
    if (!sdOnline) return false;
    let result;
    if (message.event === 'sendToPropertyInspector') {
      // A port change can finish after the user switches inspectors.
      if (streamDeck.ui.action?.id !== message.context) return false;
      result = streamDeck.ui.sendToPropertyInspector(message.payload);
    } else {
      const action = streamDeck.actions.getActionById(message.context);
      if (!action) return false;
      if (message.event === 'setTitle') result = action.setTitle(message.payload.title);
      else if (message.event === 'setImage') result = action.setImage(message.payload.image);
      else if (message.event === 'setFeedback' && action.isDial()) result = action.setFeedback(message.payload);
      else if (message.event === 'setFeedbackLayout' && action.isDial()) result = action.setFeedbackLayout(message.payload.layout);
      else if (message.event === 'showAlert') result = action.showAlert();
    }
    void result?.catch(error => log(`Stream Deck output error: ${error.message}`));
    return result;
  }
  function connectDeck() {
    if (!process.argv.includes('-port')) {
      if (!isTest) log('Not launched by Stream Deck: waiting for SDK launch arguments.');
      return;
    }
    const sdk = require('@elgato/streamdeck');
    streamDeck = sdk.default;
    locale = streamDeck.info.application.language === 'ko' ? 'ko' : 'en';
    class BridgeAction extends sdk.SingletonAction {
      constructor(name) { super(); this.manifestId = `${PLUGIN_ID}.${name}`; }
      forward(ev) {
        onEvent({ event: ev.type, context: ev.action.id,
          action: ev.action.manifestId, payload: ev.payload });
      }
      onWillAppear(ev) { this.forward(ev); }
      onWillDisappear(ev) { this.forward(ev); }
      onDidReceiveSettings(ev) { this.forward(ev); }
      onSendToPlugin(ev) { this.forward(ev); }
      onKeyDown(ev) { this.forward(ev); }
      onDialRotate(ev) { this.forward(ev); }
      onDialDown(ev) { this.forward(ev); }
      onTouchTap(ev) { this.forward(ev); }
    }
    for (const name of ACTION_NAMES) {
      streamDeck.actions.registerAction(new BridgeAction(name));
    }
    void streamDeck.connect().then(() => {
      sdOnline = true;
      onConnected();
    }).catch(error => { log(`Stream Deck connection error: ${error.message}`); process.exitCode = 1; });
  }

  return { send: sendStream, connect: connectDeck,
    get online() { return sdOnline; }, get locale() { return locale; },
    writeLog(message) { streamDeck?.logger.info(message); } };
}
module.exports = { createDeckAdapter };
