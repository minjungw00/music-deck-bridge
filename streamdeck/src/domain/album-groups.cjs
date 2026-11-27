'use strict';
// Shared geometry and settings for linked keys, independent of rendering and SDK output.
const cell = (row, column) => `${row}:${column}`;

function keyDisplay(settings) {
  return settings?.keyDisplay === 'linked' || settings?.keyDisplay === 'artwork' ? settings.keyDisplay : 'default';
}

function albumGroups(displayed) {
  const devices = new Map();
  const groups = [];
  for (const [context, item] of displayed) {
    const position = item.position;
    if (!position) continue;
    const { device, row, column } = position;
    if (!devices.has(device)) devices.set(device, new Map());
    // A fresh action can appear before the old context disappears during navigation.
    devices.get(device).set(cell(row, column), { context, row, column, settings: item.settings });
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
    for (const group of named.values()) groups.push(group);
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
      groups.push(group);
    }
  }
  return groups;
}

function validAlbumGap(gap) {
  const valid = value => Number.isInteger(value) && value >= 0 && value <= 100;
  return valid(gap?.horizontal) && valid(gap?.vertical);
}

function albumSettings(group) {
  const ordered = [...group].sort((a, b) => a.row - b.row || a.column - b.column);
  const fit = ordered.find(key => ['width', 'height'].includes(key.settings?.linkedArtworkFit))?.settings.linkedArtworkFit;
  const gap = ordered.find(key => validAlbumGap(key.settings?.linkedArtworkGap))?.settings.linkedArtworkGap;
  return { fit: fit || 'height', gap: gap || { horizontal: 0, vertical: 0 } };
}

function albumTiles(displayed) {
  const tiles = new Map();
  for (const group of albumGroups(displayed)) {
    if (group.length < 2) continue;
    const rows = group.map(key => key.row);
    const columns = group.map(key => key.column);
    const top = Math.min(...rows), left = Math.min(...columns);
    const height = Math.max(...rows) - top + 1, width = Math.max(...columns) - left + 1;
    const { fit, gap } = albumSettings(group);
    for (const key of group) {
      tiles.set(key.context, { row: key.row - top, column: key.column - left, height, width, fit, gap });
    }
  }
  return tiles;
}

module.exports = { albumGroups, albumTiles, albumSettings, validAlbumGap, keyDisplay };
