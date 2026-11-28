'use strict';
(function (root) {
  function selectStatus(bridgeStatus, localStatus) {
    const paired = bridgeStatus?.ok && bridgeStatus.active ? bridgeStatus : null;
    const liveBridge = paired && !paired.playerStale ? paired : null;
    const controlledBridge = liveBridge?.popupControls === true && liveBridge.popupVolume === true ? liveBridge : null;
    const localPlayer = localStatus?.ok && localStatus.active ? localStatus : null;
    const saved = localStatus?.ok && localStatus.savedPlayer ? localStatus : null;
    return controlledBridge || localPlayer || liveBridge || saved || paired || localStatus;
  }

  function describePlayer(result) {
    const saved = result?.ok && !result.active && result.savedPlayer;
    const player = result?.ok && result.active && result.player ? { ...result.player, mode: result.mode || 'bridge' } :
      saved ? { ...saved, id: 'saved', mode: 'saved', playing: false } : null;
    return {
      player,
      saved: Boolean(saved),
      controlsAvailable: result?.popupControls === true && !result.playerStale && result.compatibility?.compatible !== false,
      volumeSupported: result?.popupVolume === true,
      queueSupported: result?.popupQueueControls === true,
      // Older compatible plugins can report a title without a controllable player.
      title: player?.title || (result?.ok && result.active ? result.track : ''),
      artworkKey: player?.coverKey && (saved || result.coverStatus === 'ready') ?
        JSON.stringify([player.mode, player.id, player.key, player.coverKey]) : '',
    };
  }

  function commandPlayer(command, { player, queueSupported }, local) {
    const queueControl = command === 'repeat' || command === 'shuffle';
    if (!queueControl || player?.mode !== 'bridge' || queueSupported) return player;
    return local && local.id === player.id && local.key === player.key ? { ...local, mode: 'local' } : null;
  }

  root.MusicDeckPopupPlayer = Object.freeze({ selectStatus, describePlayer, commandPlayer });
})(globalThis);
