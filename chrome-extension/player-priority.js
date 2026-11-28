'use strict';
(function (root) {
  function acceptForeground(previous, observation) {
    const time = observation?.observedAt;
    const id = observation?.tabId;
    if (!Number.isFinite(time) || time < 0 || (previous && time < previous.observedAt)) return previous;
    if (id !== null && !(Number.isSafeInteger(id) && id >= 0 && id < 1e12)) return previous;
    return { tabId: id, observedAt: time };
  }

  function choosePlayer(candidates, foregroundId, previousId) {
    let selected = null;
    let highest = -1;
    for (const candidate of candidates) {
      const [id, state] = candidate;
      // Earlier criteria outweigh every lower criterion combined.
      const priority = 8 * Number(state.standalone === true) + 4 * Number(state.playing === true) +
        2 * Number(id === foregroundId) + Number(id === previousId);
      if (priority > highest) {
        selected = candidate;
        highest = priority;
      }
    }
    return selected;
  }

  const api = Object.freeze({ acceptForeground, choosePlayer });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MusicDeckPlayerPriority = api;
})(globalThis);
