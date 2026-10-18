# Runtime verification

Evidence date: October 18, 2026 (Asia/Seoul). Final source/CI and package identities are in [release verification](releases.md). This record separates automated coverage from maintainer confirmation.

## Automated and rendering checks

| Area | Verified result |
| --- | --- |
| Player commands and recovery | Node/SDK/HTTP fixtures cover launch, readiness, ratings, revoked pairing and confirmed playback/mute feedback. MV3 Chromium 156.0.8078.4 exercises nine cold-tab inputs, delayed readiness, existing-tab reuse, state synchronization and receiver replacement without duplicated effects. |
| Browser connection | Authenticated status polling detects removed credentials; browser and per-tab channels avoid connection starvation. Native launch wakes Chrome and the extension selects the player. Definite pre-delivery receiver failures retry; ambiguous lost replies do not replay commands. |
| Key/dial displays | Fixtures cover settings, profile reappearance, press/touch/rotation, artwork geometry, artist placement, background visibility and scrolling. Qt 6.10.3 rendering checks support explicit proportional geometry and full-width grapheme-safe scrolling; native device confirmation is below. |
| Popup | English/Korean HTML with sample responses fits the 290px popup: connection buttons 80×36 CSS px, heading icon 28×28, gap 8px, no overflow. Temporary Windows fonts were used for layout review and are not distributed. |
| Development versions | Fixtures cover fixed development targets, source/build metadata, synchronized promotion and rejection of development/mismatched release tags. See the [versioning policy](../versioning.md). |

The Chromium fixture uses a disposable profile and local HTTPS player model. It does not establish signed-in YouTube Music selectors/account behavior or Windows native startup. Qt reference rendering is distinct from the host's exact renderer. Opaque-manifest fixtures do not establish Maker Console DRM execution.

## Protocol compatibility

The [protocol contract](../protocol.md) passed shared-engine, real HTTP bridge, SDK inspector and worker fixtures:

- Equal/overlapping ranges, different application versions and both implicit legacy-v1 directions.
- Malformed/incompatible metadata, authentication before negotiation and HTTP 409 without losing credentials.
- Pending poll/queue cleanup, no stale input replay, retained-token recovery, explicit unpair and English/Korean feedback.
- Actual Chromium explicit-v1 identity exchange, injected future-protocol rejection and compatible recovery.

Legacy tests model the prior contract; archived binaries were not installed. No production protocol-2 component exists, so the browser mismatch response was injected. **Separate actual Windows confirmation of explicit component identities/status and retained pairing remains outstanding.** A future wire change needs coverage for its implemented versions.

## 1.1.2 development refactor

Evidence date: October 18, 2026 (Asia/Seoul). Runtime source: `e67bca3`, branch `refactor/1.1.2-architecture`, version `1.1.2-dev` (Chrome numeric `1.1.2`, plugin `1.1.2.0`, protocol 1). This is local development evidence, separate from the published/submitted v1.1.1 packages.

- Syntax/JSON/manifest checks passed. All 123 Node tests passed, including HTTP/SDK fixtures, one-shot command ordering/timeout/session cancellation, credential-persistence failure recovery and per-source concurrent artwork requests. Two Python packaging tests passed, including the worker module allowlist.
- Actual Chromium 156.0.8078.4 passed the local MV3 fixture: nine cold-tab inputs, delayed readiness, MAIN-state sync, existing-tab reuse, receiver replacement and protocol mismatch/recovery. Worker fixtures load the real `importScripts` graph.
- The generated sample preview passed a Chromium smoke check for artwork/information modes, fit/text controls and Korean popup selection without page errors. Qt 6.10.3 checks passed for 24 fitted artwork outputs, full-width text and one-/two-line key backdrops, using the presentation API directly.

The first Node attempt during the preceding investigation was blocked by sandbox loopback-listener restrictions; these integration tests ran with local listeners allowed. Chromium and the missing ALSA library were supplied from temporary directories without changing system packages. These results establish local fixtures/rendering, not signed-in YouTube Music behavior, Windows native launch, hardware displays, Marketplace DRM or installation of the refactored development build. The historical maintainer confirmation below retains its original scope.

## Maintainer confirmation

The maintainer confirmed the following development-build checks complete before requesting protocol negotiation:

| Scope | Result |
| --- | --- |
| Physical displays: proportional artwork, full-width scrolling, artist placement, text/background choices | Complete |
| Independent settings and restoration after profile changes / host restart | Complete |
| Actual Chrome commands after opening a player, extension reinstall/fresh PIN, state-linked icons and ratings | Complete |
| Update/recovery: retained pairing, custom port, profile/action settings and rollback | Complete |

The most recently supplied source was `896d4f13f646`; the report did not identify the exact installed artifact/hash or provide an itemized environment inventory. This is maintainer sign-off, not an independently observed rerun, and does not require repeating those checks solely to fill missing metadata.

The historical installation conflict was not reproduced at sign-off; a later recurrence and successful Explorer-folder closure test are recorded in [installation verification](installation.md). That recurrence supersedes the earlier non-reproduction status. Protocol negotiation, the subsequent v1.1.1 popup changes, DRM and store installation/migration are outside that sign-off.
