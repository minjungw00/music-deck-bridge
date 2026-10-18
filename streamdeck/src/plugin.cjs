'use strict';
// Composition root. Stream Deck runs the bundled entry point on Node.js 24.
const { createFileStore } = require('./adapters/file-store.cjs');
const { createHttpBridge } = require('./adapters/http-bridge.cjs');
const { createDeckAdapter } = require('./adapters/streamdeck.cjs');
const { createCoverStore } = require('./adapters/cover-store.cjs');
const { createCommandService } = require('./application/command-service.cjs');
const { createSessionCoordinator } = require('./application/session-coordinator.cjs');
const { createPlayerRegistry } = require('./application/player-registry.cjs');
const { createPortService } = require('./application/port-service.cjs');
const { createDeckController } = require('./application/deck-controller.cjs');
const { createRenderer, needsMarquee, translate, MARQUEE_STEP_MS } = require('./presentation/renderer.cjs');
const { actionName } = require('./domain/actions.cjs');
const { launchChrome } = require('./launch-chrome.cjs');
const { fitDialArtwork } = require('./dial-artwork.cjs');
const { keyTextBackground } = require('./key-background.cjs');
const version = require('../../package.json').version;
const isTest = process.env.MUSIC_DECK_BRIDGE_DEV_TEST === '1';

const displayed = new Map();
let updateTimer = null;
function drawSoon() {
  if (updateTimer) return;
  updateTimer = setTimeout(() => { updateTimer = null; renderer.paint(); }, 120);
}
function log(message) {
  console.log('[Music Deck Bridge]', message);
  deck.writeLog(message);
}

const storage = createFileStore({ testPort: isTest ? process.env.MUSIC_DECK_BRIDGE_TEST_PORT : undefined });
const players = createPlayerRegistry({ onChange: drawSoon });
const commands = createCommandService({ selectedEntry: players.selected, log,
  getSession: () => session.access, launch: isTest ? async () => {} : launchChrome });
const covers = createCoverStore({ selectedSource: () => players.selected()?.[1].cover, onChange: drawSoon });
const session = createSessionCoordinator({ storage, commands, players, covers, version, onChange: drawSoon,
  testPin: isTest ? process.env.MUSIC_DECK_BRIDGE_TEST_PIN : undefined });
const deck = createDeckAdapter({ onEvent: event => controller.handle(event),
  onConnected: drawSoon, log, isTest });
const transport = createHttpBridge({ session, players, commands, covers, version, isTest,
  getPorts: () => ports, onDeckEvent: event => controller.handle(event) });
const ports = createPortService({ initialPort: storage.readPort(), savePort: storage.savePort,
  bindPort: transport.bind, notifyPortChange: commands.notifyPortChange, log });
const controller = createDeckController({ displayed, commands, session, ports, players,
  output: deck, onChange: drawSoon, version });
const renderer = createRenderer({ displayed, covers, selectedEntry: players.selected, actionName,
  online: () => deck.online, tr: key => translate(deck.locale, key), fitDialArtwork, keyTextBackground,
  output: {
    sendStream: deck.send,
    setTitle: (context, title) => deck.send({ event: 'setTitle', context, payload: { title } }),
    setImage: (context, image) => deck.send({ event: 'setImage', context, payload: image ? { image } : {} }),
    setFeedback: (context, payload) => deck.send({ event: 'setFeedback', context, payload }),
  } });

try {
  if (isTest) session.generatePin();
  void ports.start();
  const marqueeTimer = setInterval(() => {
    if (needsMarquee(displayed, actionName)) drawSoon();
  }, MARQUEE_STEP_MS);
  marqueeTimer.unref();
  // Refresh displays as inactive player leases expire.
  setInterval(() => { if (displayed.size) drawSoon(); }, 2000).unref();
  deck.connect();
} catch (error) { log(`Startup failure: ${error.stack}`); process.exitCode = 1; }
