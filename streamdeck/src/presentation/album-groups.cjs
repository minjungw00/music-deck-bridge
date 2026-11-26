'use strict';
const cell = (row, column) => `${row}:${column}`;

function keyDisplay(settings) {
  return settings?.keyDisplay === 'linked' || settings?.keyDisplay === 'artwork' ? settings.keyDisplay : 'default';
}

function albumTiles(displayed) {
  const devices = new Map();
  const tiles = new Map();
  for (const [context, item] of displayed) {
    const position = item.position;
    if (!position) continue;
    const { device, row, column } = position;
    if (!devices.has(device)) devices.set(device, new Map());
    // A fresh action can appear before the old context disappears during navigation.
    devices.get(device).set(cell(row, column), { context, row, column, settings: item.settings });
  }

  function place(group) {
    if (group.length < 2) return;
    const rows = group.map(key => key.row);
    const columns = group.map(key => key.column);
    const top = Math.min(...rows), left = Math.min(...columns);
    const height = Math.max(...rows) - top + 1, width = Math.max(...columns) - left + 1;
    for (const key of group) {
      tiles.set(key.context, { row: key.row - top, column: key.column - left, height, width });
    }
  }

  for (const keys of devices.values()) {
    const named = new Map(), automatic = new Map();
    for (const [coordinate, key] of keys) {
      if (keyDisplay(key.settings) !== 'linked') continue;
      const name = typeof key.settings.albumGroup === 'string' ? key.settings.albumGroup.trim().slice(0, 32) : '';
      if (!name) automatic.set(coordinate, key);
      else {
        if (!named.has(name)) named.set(name, []);
        named.get(name).push(key);
      }
    }
    for (const group of named.values()) place(group);
    for (const [coordinate, first] of automatic) {
      automatic.delete(coordinate);
      const group = [first];
      for (const key of group) {
        for (let row = key.row - 1; row <= key.row + 1; row++) {
          for (let column = key.column - 1; column <= key.column + 1; column++) {
            const neighbor = cell(row, column);
            if (!automatic.has(neighbor)) continue;
            group.push(automatic.get(neighbor));
            automatic.delete(neighbor);
          }
        }
      }
      place(group);
    }
  }
  return tiles;
}

module.exports = { albumTiles, keyDisplay };
