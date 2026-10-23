# Runtime verification

Automated evidence: October 18, 2026 (Asia/Seoul). Maintainer confirmations extend through October 24. Final source/CI and package identities are in [release verification](releases.md).

| Evidence type | Scope |
| --- | --- |
| Automated fixtures | Local bridge, SDK/browser integration, rendering and controlled failure cases below |
| Maintainer confirmation | Released 1.1.2 and both published store components; earlier itemized device checks retain their original scope |
| Independent runtime observation | Local fixtures/rendering only; published store operation was not independently observed |

## Automated and rendering checks

| Area | Verified result |
| --- | --- |
| Player commands and recovery | Node/SDK/HTTP fixtures cover launch, readiness, ratings, revoked pairing and confirmed playback/mute feedback. Chromium 156.0.8078.4 exercises nine cold-tab inputs, delayed readiness, existing-tab reuse, state sync and receiver replacement without duplicated effects. |
| Browser connection | Fixtures cover removed-credential detection, browser/per-tab channel starvation, native-launch decisions and player selection. Definite pre-delivery receiver failures retry; ambiguous lost replies do not replay commands. |
| Key/dial displays | Fixtures cover settings, profile reappearance, press/touch/rotation, artwork geometry, artist placement, backgrounds and scrolling. Qt 6.10.3 checks support proportional geometry and full-width grapheme-safe scrolling. |
| Popup | Sample responses fit English/Korean HTML into 290px: buttons 80×36 CSS px, heading icon 28×28, gap 8px, no overflow. Temporary Windows fonts were used and are not distributed. |
| Development versions | Fixtures cover fixed targets, build metadata, synchronized promotion and rejection of development/mismatched release tags. See [versioning](../versioning.md). |

### Limits of local evidence

Chromium uses a disposable profile and local HTTPS player model. These runs do not establish signed-in YouTube Music behavior, Windows native startup, physical-device output, installation or Maker Console DRM. Qt reference rendering is distinct from the host's exact renderer. Popup message mocks do not measure real network-race frequency; opaque manifests do not verify DRM.

The first Node attempt during the preceding investigation was blocked by sandbox listener restrictions; the reported integration runs allowed loopback listeners. Chromium and a missing ALSA library were supplied from temporary directories without changing system packages. Maintainer confirmations below are separate evidence.

## Protocol compatibility

The [protocol contract](../protocol.md) passed shared-engine, real HTTP bridge, SDK inspector and worker fixtures:

- Equal/overlapping ranges, different application versions and both implicit legacy-v1 directions.
- Malformed/incompatible metadata, authentication before negotiation and HTTP 409 without losing credentials.
- Poll/queue cleanup, no stale replay, retained-token recovery, explicit unpair and English/Korean feedback.
- Chromium explicit-v1 identity exchange, injected future-protocol rejection and compatible recovery.

Legacy tests model the prior contract; archived binaries were not installed. No production protocol-2 component exists, so browser mismatch responses were injected. Released-version maintainer confirmation does not itemize a Windows identity/status and retained-pairing matrix. Future wire changes need coverage for their implemented versions.

## 1.1.2 development refactor

All revisions below were checked on October 18 on branch `refactor/1.1.2-architecture`, at `1.1.2-dev` (Chrome numeric `1.1.2`, plugin `1.1.2.0`, protocol 1). They are local development evidence, separate from published/submitted v1.1.1 packages.

| Source | Node tests passed | Other completed checks |
| --- | --- | --- |
| `e67bca3` | 123 | Two Python tests; syntax/JSON/manifest; Chromium MV3; preview smoke; Qt artwork/text/backdrops |
| `97ac12f` | 126 | Two Python tests; targeted 15-test parallel HTTP/SDK run; Chromium MV3; preview smoke; Qt rendering |
| `e8379fd` | 135 | Two Python tests; syntax/JSON/manifest; Chromium MV3 |
| `d2e4c19` | 143 | Two Python tests; syntax/JSON/manifest; Chromium MV3; preview smoke; Qt text/backdrops |
| `a0f5877` | 154 | Two Python tests; syntax/JSON/manifest; Chromium MV3; English/Korean popup ordering checks |

The Chromium runs used 156.0.8078.4 and the existing nine-input fixture, including delayed readiness, MAIN-state sync, existing-tab reuse, receiver replacement and protocol recovery. Qt runs used 6.10.3.

The initial `e67bca3` cases cover one-shot command ordering, timeouts/session cancellation, credential-persistence failure recovery and concurrent per-source artwork requests. Worker fixtures load the real `importScripts` graph; packaging tests check the worker module allowlist. The preview exercised artwork/information modes, fit/text controls and Korean popup selection without page errors. Qt checked 24 fitted artwork outputs, full-width text and one-/two-line key backdrops using the presentation API.

### Follow-up service and output changes

At `97ac12f`, tests ran with four processes and temporary bridge ports, bounded shutdown and stdio closure. A missed WebSocket-listening event during fixture migration was corrected by allocating the temporary port before creating the server; this was a test initialization issue.

Failure injection covers failed/skipped SDK image/title writes, serialized/coalesced updates and action disappearance. Opaque/plain manifests, management/player-sync services, the complete content reinjection graph and inspector dependencies passed fixtures. Settings checks retain immediate volume preview, delayed-setting protection and other saved fields. Output assertions establish SDK submission/retry behavior, not physical rendering or failure frequency.

### Concurrent operations and page restoration

At `e8379fd`, nine new cases cover overlapping sync completion/failure, tab closure during observation, delayed/failed startup with queued port changes, repeated startup, persistence failure with listener grace expiry, repeated cached-page restoration and periodic sync without a DOM observer.

Controlled before/after fixtures reproduce early close notification, startup/change interference and missing observation after restoration in the preceding implementation. Updated cases wait for all snapshots, serialize listeners and restart observation. Grace expiry uses an injected clock; cached-page events use a VM loading the complete content manifest. The Chromium run did not independently establish real-browser back/forward-cache behavior.

### Pairing persistence and bounded dial output

At `d2e4c19`, two credential-write failure cases cover compatible and blocked sessions. Authentication, generation, diagnostics, blocking, pending commands and PIN stay unchanged until successful replacement storage. These cases fail against the preceding session implementation and pass with protocol evaluation separated from state changes.

A held layout followed by 20 updates submits the in-flight frame and latest pending frame: **2 frames versus 21 previously**. Six new dial cases and the updated rapid-mode case cover layout-before-content, latest artwork/text, rejected/skipped outputs, retry caching, return to the in-flight state and disappearance during submission. The preceding implementation fails coalescing and newer-success caching assertions. This is a controlled SDK-output comparison, not hardware latency measurement.

The preview also exercised rapid display-mode changes, artwork/title controls and Korean selection.

### Extension management and popup ordering

At `a0f5877`, four new management cases cover unpair during first/replacement pairing, delayed credential writes, overlapping port changes with following reads and continuation after failed revocation. Seven new popup cases cover superseded replies, startup reads, newer unsaved edits and validation superseding an older request. Before/after fixtures reproduce the preceding pairing/port and popup response failures; updated cases pass.

Separate Chromium checks load the real English/Korean popup with delayed mock extension replies. A late pairing reply preserves the newer unpair result; startup/save replies preserve newer port edits. The [local-evidence limits](#limits-of-local-evidence) apply to every revision above.

## Maintainer confirmation

These are maintainer reports, separate from automated fixtures and independent observation. Missing artifact/environment metadata does not require repeating completed validation solely to fill it in.

### Official store components

On October 24, the maintainer reported completed publication on both [Elgato Marketplace](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd) and [Chrome Web Store](https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca), supplied both URLs and confirmed normal operation. This extends the October 20 distribution scope to include Marketplace.

Exact installed versions/hashes, itemized installation/migration or control coverage and Console processing details were not supplied. Store runtime operation was not independently observed. Processed-package evidence is tracked in the [DRM record](marketplace-drm.md).

### Chrome Web Store extension

On October 20, the maintainer confirmed Chrome Web Store publication and operation of its extension with the released Stream Deck plugin. No itemized control/environment inventory or exact installed extension version/hash was supplied. Unpacked-to-store migration/new PIN pairing and Marketplace-installed/Console-processed plugin execution were not separately reported at that time; Marketplace was still Pending review. The October 24 report above updates that scope.

### 1.1.2 refactor

On October 18, the maintainer confirmed normal operation after the refactor and requested release 1.1.2. The latest supplied development source was `5f0d3f4`; no itemized environment or installed-artifact identity was supplied. This did not establish Console-processed DRM execution or clean-environment installation.

After [v1.1.2 publication](releases.md#v112), the maintainer confirmed operation of that release and reported both store submissions updated to 1.1.2, Pending review. The report did not identify a processed package or store-installed build. It adds released-version operation to the development sign-off.

### Earlier behavior confirmation

Before requesting protocol negotiation, the maintainer confirmed these development-build checks:

| Scope | Result |
| --- | --- |
| Physical displays: proportional artwork, full-width scrolling, artist placement, text/background choices | Complete |
| Independent settings and restoration after profile changes / host restart | Complete |
| Actual Chrome commands after opening a player, extension reinstall/fresh PIN, state-linked icons and ratings | Complete |
| Update/recovery: retained pairing, custom port, profile/action settings and rollback | Complete |

The latest supplied source was `896d4f13f646`; exact installed artifact/hash and an itemized environment inventory were not supplied. Protocol negotiation, later v1.1.1 popup changes, DRM and store installation/migration were outside this sign-off.

The installation conflict was not reproduced at sign-off. A later recurrence and successful Explorer-folder closure test in [installation verification](installation.md) supersede that non-reproduction status without changing the earlier validation's scope.
