'use strict';
// Command names and popup input validation shared with the bundled plugin.
(function (root) {
  const ratingCommands = new Set(['like', 'dislike']);
  const queueControls = new Set(['repeat', 'shuffle']);
  const volumeAdjustments = new Set(['volume_delta', 'volume_set']);
  const basicCommands = ['toggle', 'prev', 'next', 'mute', ...ratingCommands];
  const legacyCommands = new Set([...basicCommands, 'volume_delta']);
  const standaloneCommands = new Set([...basicCommands, ...queueControls, 'volume_set']);
  const playerCommands = new Set([...standaloneCommands, 'volume_delta']);

  const isRatingCommand = type => ratingCommands.has(type);
  const isQueueControl = type => queueControls.has(type);
  const isVolumeAdjustment = type => volumeAdjustments.has(type);
  const isBrowserCommand = type => type === 'open' || playerCommands.has(type);
  const isLegacyCommand = type => legacyCommands.has(type);
  function isPopupCommand(type, amount) {
    if (type === 'volume_delta') return Number.isInteger(amount) && amount !== 0 && Math.abs(amount) <= 100;
    if (type === 'volume_set') return Number.isInteger(amount) && amount >= 0 && amount <= 100;
    return playerCommands.has(type);
  }
  const isStandaloneCommand = (type, amount) => standaloneCommands.has(type) && isPopupCommand(type, amount);

  const api = Object.freeze({ isRatingCommand, isQueueControl, isVolumeAdjustment, isBrowserCommand,
    isLegacyCommand, isPopupCommand, isStandaloneCommand });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MusicDeckCommandPolicy = api;
})(globalThis);
