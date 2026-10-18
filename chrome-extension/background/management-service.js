'use strict';
(function (root) {
  function createManagementService({ client, browserChannel, translate = () => '' }) {
    const { post, pairedToken, configuredPort, setLocalPort, validPort } = client;
    return {
      async pair({ pin }) {
        if (!/^\d{6}$/.test(pin)) throw new Error((translate('invalid') || 'Enter a six-digit PIN.'));
        const result = await post('/pair', { pin });
        await client.saveToken(result.token);
        void browserChannel.start();
        return { ok: true, compatibility: client.compatibility };
      },
      async check() {
        const token = await pairedToken();
        if (!token) {
          await post('/status', { token: '' }).catch(() => {});
          return { ok: false, error: (translate('notPaired') || 'Not paired yet.') };
        }
        let result;
        try { result = await post('/status', { token }); }
        catch (error) {
          if (error.httpStatus === 401) throw new Error(translate('notPaired') ||
            'Pair again with a new PIN from the Stream Deck action settings.');
          throw error;
        }
        void browserChannel.start();
        return { ok: true, ...result, compatibility: client.compatibility };
      },
      async setPort({ port: requestedPort }) {
        const port = Number(requestedPort);
        if (!validPort(port)) throw new Error(translate('portInvalid') || 'Port must be an integer from 1024 to 65535.');
        const token = await pairedToken();
        if (!token) {
          await setLocalPort(port);
          return { ok: true, port, localOnly: true };
        }
        try {
          // When the original server is reachable, change its listener AND this client together.
          const result = await post('/configure-port', { token, port }, 6000);
          await setLocalPort(result.port);
          return { ok: true, port: result.port, localOnly: false };
        } catch (error) {
          // A server rejected an occupied/invalid port: do not modify client settings.
          if (error.httpStatus) throw error;
          // Bridge may already have moved in the Stream Deck inspector while Chrome slept.
          // Try the new address, retaining it even if the bridge isn't reachable yet.
          await setLocalPort(port);
          try {
            await post('/status', { token }, 1500);
            return { ok: true, port, localOnly: false };
          } catch {
            return { ok: true, port, localOnly: true };
          }
        }
      },
      async unpair() {
        const token = await pairedToken();
        if (token) {
          try { await post('/unpair', { token }); }
          catch (error) {
            // An invalid token is already revoked; network/server failures must be retried.
            if (error.httpStatus !== 401) throw new Error(translate('unpairFailed') ||
              'Could not unpair. Start Stream Deck, check the port and try again.');
          }
        }
        await client.removeToken();
        client.clearCompatibility();
        return { ok: true };
      },
      async getPort() { return { ok: true, port: await configuredPort() }; },
    };
  }
  root.MusicDeckManagementService = Object.freeze({ create: createManagementService });
})(globalThis);
