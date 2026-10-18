'use strict';
const DEFAULT_PORT = 17864, MIN_PORT = 1024, MAX_PORT = 65535;
function portNumber(value) {
  const port = Number(value);
  return Number.isInteger(port) && port >= MIN_PORT && port <= MAX_PORT ? port : null;
}
module.exports = { portNumber, DEFAULT_PORT };
