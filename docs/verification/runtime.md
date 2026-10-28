# Runtime verification

Automated evidence through October 29, 2026 (Asia/Seoul), including the 1.1.3 development review below. Maintainer confirmations extend through October 24 for 1.1.2. Published source/CI and package identities are in [release verification](releases.md).

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

## 1.1.3 dependency review

Checked October 29, 2026 (Asia/Seoul), at `1.1.3-dev` on Linux with Node.js 24.19.0 and npm 11.17.0. Chrome numeric version is `1.1.3`, Stream Deck version is `1.1.3.0`; protocol remains 1. This is development evidence, separate from released 1.1.2 operation.

Both Dependabot patch updates were adopted: SDK 3.0.2 → 3.0.3 and CLI 1.10.2 → 1.10.3. Their shared schemas package becomes 0.5.3. The [upstream change](https://github.com/elgatosf/streamdeck/commit/6a57d80bae1a77313481d52d1447c82037297e74) adds Node.js 26 manifest support and retains Node.js 24; this project keeps its existing engine and manifest runtime.

Registry metadata still identifies utils 0.6.1, requiring `zod: ^3.25.24`, as current. Installing only the two Elgato updates leaves the [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). A root override limited to `@elgato/utils@0.6.1` selects Zod 4.6.7, outside that declared range. utils already imports `zod/v4-mini`; the [Zod subpath policy](https://zod.dev/v4/versioning) preserves it across package majors. The [4.6.6 → 4.6.7 comparison](https://github.com/colinhacks/zod/compare/v4.6.6...v4.6.7) contains version metadata changes only. Reassess/remove this override when utils officially supports a patched range.

The same baseline audit also reports four URI parsing advisories for CLI → ajv 8.20.0 → fast-uri 3.1.8: [scheme decoding](https://github.com/advisories/GHSA-w74x-v6f9-j3xg), [path normalization](https://github.com/advisories/GHSA-xhq7-xmqj-769h), [host canonicalization](https://github.com/advisories/GHSA-wjr9-j795-jxcr) and [suffix scheme injection](https://github.com/advisories/GHSA-333x-w4r6-6crp). The lockfile now selects 3.1.9 within ajv's existing `^3.0.1` range; no additional override was needed.

Controlled comparison: the bounded-array regression in `tests/dependency-validation.test.mjs` fails with Zod 3.25.76, producing three element errors before the size error, and passes with 4.6.7, producing only the size error. The input contains three elements; no memory-exhaustion attack was run. Nested Elgato option schemas accept valid options and reject malformed values on both versions.

Final locked installation (`npm ci --ignore-scripts`) succeeds; `npm audit --json` reports zero vulnerabilities. Syntax/JSON/manifest checks, 156 Node tests (including the actual SDK bundle against local WebSocket fixtures with plain/opaque manifests), two Python packaging tests and the Chromium 156.0.8078.4 MV3 fixture pass. Chromium uses the existing temporary browser/ALSA directories and covers nine cold-tab inputs, delayed readiness, state sync and receiver replacement.

`npm run build:dev` successfully creates the Chrome ZIP and officially validated Stream Deck package with CLI 1.10.3, plus build information and checksums. This local build records parent `df92eb103e06` and `dirty: true`; it is not an exact-commit or release artifact. These checks establish local automated compatibility, not signed-in YouTube Music, Windows host operation or actual Maker Console DRM. Windows CI, physical-device operation and a new official release remain unverified for this candidate.

## 1.1.3 artwork and transport fixes

Checked October 29, 2026 (Asia/Seoul), retaining `1.1.3-dev`, Node.js 24 and protocol 1. Source changes: `091ebb5` (key artwork) and `ce17e95` (track navigation).

The maintainer reported distorted non-square Current Track key artwork, an unresponsive/delayed first Previous input after opening the browser, and Next changing tracks without playback. The additional observation was that the first click had no effect and later clicks responded. No live player trace or exact installed artifact was supplied; the controlled models below do not establish the cause of that environment's first-click failure.

- **Artwork:** the key helper now computes centered proportional geometry in a 144×144 viewport, with black margins for non-square images. Optional one-/two-line title backdrops use the same fit; square artwork without a backdrop still uses its original raster. The raster bytes are preserved. Two renderer regressions cover landscape/portrait fitting and cached output. Qt 6.10.3 checks 27 generated-image combinations (square/landscape/portrait, PNG/JPEG/WebP, no/one-/two-line backdrop). The preceding helper fails the landscape comparison; the new helper passes. Existing Qt text/backdrop checks also pass. Generated images are fixtures, not screenshots.
- **Transport:** Previous/Next first wait for playback initialization, dispatch navigation once, then confirm a changed track/index or a same-track restart and actual playback. If the destination is only cued, one explicit Play request starts it. Restart confirmation accepts a decreased position below two seconds or a seek-completion event at the beginning, instead of requiring a starting position beyond five seconds. Autoplay/error reporting, deadlines and refusal to replay ambiguous navigation remain in place.

Six new playback regressions fail against the preceding `page-controls.js` and pass after the change: initial playback preparation, buffering, cued destinations, early/zero-position restarts, unconfirmed playback and autoplay blocking. These models intentionally reproduce ignored navigation before initialization and paused destinations; they are not observations of YouTube Music's current internals.

Completed local checks: syntax/JSON/manifests, 164 Node tests, two Python tests and the Chromium 156.0.8078.4 MV3 fixture. Chromium covers all nine cold-tab inputs plus 18 subsequent Previous/Next inputs (both after each launch button), checking one navigation per input and playing state before acknowledgment. The final media-listener adjustment also passed the 12 targeted playback tests and Chromium rerun.

`npm run build:dev` packages Chrome and the officially validated Stream Deck plugin from clean code commit `ce17e95c54f6a171b1753c7e87bf50d0e733739a`. Build ID: `1.1.3-dev+gce17e95c54f6.local20261028155820921`, under `dist/development/`, with `dirty: false`. Both archives match their checksum inventory; the packaged extension controls and bundled plugin match the built sources. This is a local development build, not a published release.

Windows CI, physical key rendering, signed-in YouTube Music playback and native Windows cold startup remain unverified for these changes. Earlier maintainer confirmations retain their original scope.

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
