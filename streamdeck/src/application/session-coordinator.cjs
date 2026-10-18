'use strict';
const { createSessionService } = require('./session-service.cjs');

// Coordinate session transitions without allowing services to mutate each other's fields.
function createSessionCoordinator({ commands, players, covers, ...options }) {
  const resetPlayerState = () => { players.reset(); covers.resetSelection(); };
  return createSessionService({ ...options,
    activity: { polling: () => commands.polling, browserPolling: () => commands.browserPolling },
    transitions: {
      reset() { commands.reset(); resetPlayerState(); },
      blocked(compatibility) { commands.block(compatibility); resetPlayerState(); },
      compatible: commands.clearProtocolError,
      missingCredentials: commands.missingCredentials,
    } });
}
module.exports = { createSessionCoordinator };
