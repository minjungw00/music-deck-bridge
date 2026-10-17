# Architecture

```mermaid
flowchart LR
  SD[Stream Deck device and software] <-->|Local WebSocket events| P[Node.js plugin]
  P <-->|HTTP on 127.0.0.1| B[Chrome extension service worker]
  B <-->|Extension messages| C[YouTube Music content script]
  C <-->|DOM and Media Session| Y[YouTube Music tab or Chrome app]
  P -->|HTTPS artwork download| CDN[Google and YouTube image servers]
```

The Stream Deck manifest launches `streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/bin/plugin.js` with the local WebSocket registration arguments. It bundles the official `@elgato/streamdeck` 3.0.2 SDK, which owns registration, event routing and display/inspector output. The ten `SingletonAction` registrations forward events to the existing local bridge. The runtime does not load the manifest itself; the SDK handles protected manifests. Source is in `streamdeck/src/plugin.cjs`; esbuild produces the standalone deployed bundle. The property inspector bundles sdpi-components v4.0.1 locally for offline settings UI. Stream Deck passes its language to the plugin/settings; Chrome resolves the extension's en/ko catalogs independently.

## Pairing and requests

1. A Stream Deck action's settings generates a six-digit PIN valid for ten minutes.
2. The extension popup asks its service worker to POST `/pair` with that PIN. The plugin requires an origin matching `chrome-extension://[a-p]{32}` and limits failed PIN attempts to five per minute.
3. A successful pairing creates a random 32-byte token. The plugin persists the token and extension origin; the extension stores the token locally. A new pairing replaces the old pair, rejects existing command polls with HTTP 401, and clears player state and queued commands. The new auth file is written through an atomic replacement.
4. All subsequent routes require both the saved origin and token. Normal website origins are rejected. This boundary does not protect against malicious software already running as the same OS user.

| Route | Purpose |
| --- | --- |
| `/pair` | Exchange a PIN for a token |
| `/unpair` | Revoke the authenticated pair, delete auth.json and reject pending polls |
| `/status` | Show connection/player/artwork status |
| `/sync` | Submit a tab's current state and receive queued commands |
| `/listen` | Wait up to 12 seconds for player commands |
| `/browser-listen` | Wait for a launch/playback request even when no player tab exists |
| `/browser-result` | Acknowledge a delivered browser request |
| `/configure-port` | Change the shared port while preserving authentication |

The content script reads player DOM/Media Session metadata and current-song rating state and exchanges messages with the service worker, which adds the token to loopback requests. The service worker restricts local storage to `TRUSTED_CONTEXTS` on every start and waits for that restriction before reading tokens or making authenticated requests. The content script does not receive the bearer token. Unpair removes the Chrome token only after server revocation or an HTTP 401 indicating it is already invalid; a network/server failure retains credentials for retry. The extension operates only on `music.youtube.com`; no Google login credentials or remote debugging port are needed.

Volume and mute commands use the site's own controls. The service worker executes a fixed function in the sending tab's top-level `MAIN` world to access the site's slider properties, set its value and dispatch its `change` event, or click its mute button. This lets YouTube Music apply its own volume curve and saved state. Both desktop and compact sliders use a one-point step when controlled by the dial. Commands run in order, and the dial reads the site's displayed percentage through `aria-valuenow`, so manual site adjustments are also reflected. Missing controls leave playback volume unchanged. The existing `scripting` permission is used; no pairing token is passed into the page.

Chrome documents the separation between [isolated content scripts and the page's JavaScript environment](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#work_in_isolated_worlds).

Test-only `/__test/*` routes and deterministic PIN/port overrides are enabled only with `MUSIC_DECK_BRIDGE_DEV_TEST=1`. Do not set that environment variable for ordinary Stream Deck use.

## Player selection and state

The plugin prioritizes an installed Chrome app over a browser tab. State is periodically refreshed and remains eligible for 90 seconds to accommodate idle throttling; slower media updates can be marked stale. Commands target the selected client, expire after five seconds and are delivered once through long polling or a sync response. Startup/update/alarm handlers reinject the guarded content script into open player tabs.

The Play / Pause key displays a Pause image while the selected player is playing, otherwise a Play image. It uses the reported player state rather than optimistically toggling on key presses. Without an eligible player it displays Play with an Open YTM title. Image updates are cached per visible key and reset when the key reappears; all instances follow the same selected player. The action retains its existing single manifest state and toggle command behavior.

The extension service worker maintains an authenticated browser-wide long poll independently of player tabs. Open requests focus the selected tab/window or create a music tab; playback requests toggle an existing selected player in its top frame or open the site if none exists. The existing host permission allows querying matching tabs without a broader `tabs` permission; see the [Chrome Tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs#permissions). Requests coalesce while one is in flight. An undelivered request falls back after two seconds to launching Chrome from standard Windows paths with a fixed URL and no shell. Delivered requests are not replayed by the native fallback. Old extensions retain their existing player-queue playback path; new launch/rating features require the matching extension. A new page is opened without requesting automatic playback.

Like/dislike commands target only `ytmusic-player-bar` rating controls. The content script reports `LIKE`, `DISLIKE`, `INDIFFERENT` or unknown; the plugin renders outlined/filled thumbs from confirmed state. Ratings carry a video ID or normalized title/artist key and are ignored if the current track no longer matches. The site handles rating persistence and cancelling a repeated rating; the extension does not use a private account API.

Port `17864` is the default; both components accept integers 1024–65535. On a live change the plugin binds the new port first, persists it, notifies clients and retains the old listener for two minutes. Sleeping/offline clients may need the port changed manually. No LAN listener is opened.

Artwork downloads validate the HTTPS host, each redirect, content type and a 2 MB limit. `/status` returns a `coverStatus` code: `missing`, `blocked`, `ready`, `downloading`, `waiting` or `failed`. The Chrome popup translates these codes using its own en/ko catalog; unknown codes use the localized waiting message. See [privacy](../PRIVACY.md) for the allowlist and data lifecycle.

## Plugin identity

The plugin UUID is `io.github.minjungw00.musicdeckbridge`; action UUIDs append an action name, such as `.nowplaying` or `.volume`. The package folder is `io.github.minjungw00.musicdeckbridge.sdPlugin`. Authentication and port configuration are stored under `%APPDATA%\MusicDeckBridge`.

See [release checks](development.md#release-checklist) for distribution requirements.
