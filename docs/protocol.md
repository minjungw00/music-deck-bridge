# Bridge protocol compatibility

**Compatibility depends on supported wire-version ranges.** `pluginVersion` and `extensionVersion` identify the installed applications; their release numbers can differ.

## Wire contract

The packaged `chrome-extension/protocol.js` is the single negotiation implementation. The classic MV3 worker loads it with a local `importScripts`; esbuild includes the same code in the standalone plugin.

Each extension HTTP request adds these fields. The application version below is illustrative; the extension reports its installed version.

```json
{
  "extensionVersion": "1.1.2",
  "protocolVersion": 1,
  "minProtocolVersion": 1
}
```

Plugin response envelopes include `pluginVersion` and the same two protocol fields, including errors.

| Field | Meaning |
| --- | --- |
| `pluginVersion` / `extensionVersion` | Component application identity |
| `protocolVersion` | Highest implemented wire version |
| `minProtocolVersion` | Lowest implemented wire version; defaults to the advertised maximum if omitted |

Protocol bounds are integers from 1 to 65535, with minimum no greater than maximum. Negotiation selects the highest common version. A component must implement every version it advertises; application-version changes alone do not change the wire contract.

### Current and legacy peers

The current implementation supports **protocol 1 only**. It preserves existing endpoints, token/origin authentication and command representations. Old components that omit both protocol fields use the known implicit **legacy protocol 1**. No application-version heuristic infers compatibility or feature availability. A legacy connection preserves the old command contract; it does not promise that older components implement newer optional actions.

The optional 1.2.0 popup feature is advertised by `/status` with `popupControls: true` and a `player` snapshot (`id`, `key`, title/artist, playing/rating/volume/mute state and `coverKey`). The absolute volume slider is advertised separately with `popupVolume: true`. Without a healthy bridge supporting these capabilities, the popup can use its independent Chrome-only path; bridge compatibility and credential rules are unchanged. This additive capability keeps protocol 1.

`/control` accepts only `toggle`, `prev`, `next`, `like`, `dislike`, `mute`, `volume_delta` or `volume_set`, with `playerId` and `trackKey` matching the selected snapshot. `volume_delta` requires a nonzero integer `amount` from -100 to 100; `volume_set` requires an integer from 0 to 100 and is used by the popup slider. It uses the existing command channel and responds after its result. Optional `playerKey` on browser commands enforces the selected player/track again immediately before dispatch and prevents fallback to another tab if the displayed player closes. `/artwork` requires the same identity plus a matching `coverKey` and returns only cached raster data. Both retain paired-origin/token/protocol checks; stale player/track requests fail without dispatch. A track key uses the video ID when available and otherwise the normalized title/artist pair, matching the existing rating guard.

Standalone popup messages (`player-status`, `local-control`) remain inside the extension and are denied to content-script senders. They do not use the wire protocol, loopback server or pairing token. A tab-scoped execution lease permits their internal playback calls even if the bridge protocol is blocked; this does not unblock bridge commands or metadata synchronization.

| Combination | Result |
| --- | --- |
| Explicit 1 ↔ explicit 1 | Compatible, negotiated 1 |
| Different application versions, common wire range | Compatible |
| Current plugin ↔ extension without protocol metadata | Compatible legacy 1 |
| Current extension ↔ plugin without protocol metadata | Compatible legacy 1; older-plugin routing retained |
| Peer minimum exceeds local maximum | Update the local component |
| Peer maximum is below local minimum | Update the peer component |
| Malformed explicit metadata | Invalid compatibility information; no legacy fallback |

### Optional concurrent command delivery

`/browser-listen` accepts optional `concurrent: true` to allow up to eight delivered requests awaiting separate final acknowledgments. The default remains serial, and older plugins can ignore the flag. Request IDs, final `/browser-result` semantics and authentication are unchanged; a local extension/page receipt is not a successful final result. See [dispatch and confirmation](architecture.md#command-dispatch-and-confirmation) for ordering, cancellation and mixed-component behavior.

## Authentication and failure behavior

For `/pair`, the PIN is verified before compatibility. Incompatible pairing returns HTTP 409 without consuming the PIN or saving a new token. Authenticated routes verify origin/token before negotiation; an unrelated request cannot overwrite the active pair's compatibility state. Explicit `/unpair` remains available even for incompatible components.

On incompatible or invalid metadata, the plugin returns a bounded `errorCode` and `compatibility` object, stops dispatch/launch, closes pending polls with HTTP 409 and discards pending inputs/player state. Auth files, custom port and Stream Deck profiles/settings remain intact. The extension independently validates response ranges, suppresses control delivery during incompatibility and retains its token/port. Compatible replacement restores communication without a new PIN. Discarded inputs are not replayed.

### Recovery

Transient network/server failures remain distinct. The browser listener retries protocol rechecks every five seconds while its worker is alive; existing startup/maintenance-alarm paths can restart it after suspension. A manual status check can recover immediately. Per-tab sync requests are suppressed during a known mismatch. Rechecks do not automatically update software.

The popup and action inspector show both application versions and negotiated protocol (or a legacy label). English/Korean incompatibility guidance names the component requiring update. Invalid metadata gets separate guidance. PIN re-registration is reserved for credential issues.

### Identity and storage

Plugin identity comes from its bundled source package version, so opaque/DRM manifests are not read for it. Extension identity comes from `chrome.runtime.getManifest().version_name` or `.version`. Compatibility metadata is held in memory and exchanged only over the existing loopback connection; authentication tokens are not exposed in either UI.

See the [verification record](verification/runtime.md#protocol-compatibility) for coverage and remaining release/device checks.
