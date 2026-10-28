# Runtime verification

Evidence reviewed October 29, 2026 (Asia/Seoul). [Release verification](releases.md) holds published source, CI and package hashes. This record separates local models, maintainer reports and independently observed operation.

## Current evidence

| Evidence | Completed scope | Limit |
| --- | --- | --- |
| Latest full local run, refactor source `cbd17925ad7d` | 217 Node tests, two Python packaging tests, syntax/JSON/manifests and Chromium 156.0.8078.4 MV3 integration | Disposable local player model; no independent Windows/site observation |
| Later Previous-boundary review, `7318a3a` | Three targeted first-item/same-track fixtures | Adds one fixture; no subsequent full-suite result is claimed |
| 1.1.3 maintainer reports | New-window playback appeared normal after startup recovery; operation confirmed after destination recovery | Confirmation precedes the playback refactor and is not an itemized environment inventory |
| Later first-Previous comparison | Site button behaves similarly; after more than five seconds it restarts the same song | Queue/history absence is an interpretation, not a measured queue fact |
| Released 1.1.2 | Maintainer-confirmed release/store operation, including both published stores on October 24 | Detailed identified DRM and clean-environment coverage remain separate |
| October 29 documentation review | Syntax/resources/versions, two Python packaging tests and 359 local links/images across 34 Markdown files pass; submitted originals and ten build identities preserved | Documentation-only changes; no new full runtime run or package publication |

## Automated and rendering checks

| Area | Coverage |
| --- | --- |
| Playback | Cold-tab inputs, delayed readiness, ignored startup/destination Play, one navigation click, bounded recovery, later Pause, supersession and receiver replacement |
| Connection | Pairing persistence/order, removed credentials, browser/per-tab polling, native-launch decisions, player selection and protocol blocking/recovery |
| Key/dial output | Settings, profile reappearance, rotation/press/touch, proportional artwork, artist placement, backdrops and scrolling; Qt 6.10.3 reference rendering |
| Popup | English/Korean sample responses at 290 CSS px; 80×36 buttons, 28px heading icon and no overflow |
| Distribution | Real worker import graph, serialized MAIN entry point, package allowlists/notices, fixed development versions and source/checksum metadata |

### Limits of local evidence

Chromium uses temporary profiles and local HTTPS fixtures. Qt uses a reference renderer; popup renders use sample data. These do not establish signed-in Music internals, physical-device output, Windows native startup or Maker Console DRM. Loopback-listener permission was needed for integration runs; temporary Chromium/ALSA directories and Windows fonts were used without installing system packages or redistributing fonts.

## 1.1.3 dependency review

Checked October 29 on Linux with Node.js 24.19.0 and npm 11.17.0. The target remains `1.1.3-dev` (Chrome numeric 1.1.3, plugin 1.1.3.0, protocol 1).

| Dependency | Adopted change | Evidence and constraint |
| --- | --- | --- |
| Elgato SDK / CLI | 3.0.2 → 3.0.3 / 1.10.2 → 1.10.3; schemas 0.5.3 | [Upstream change](https://github.com/elgatosf/streamdeck/commit/6a57d80bae1a77313481d52d1447c82037297e74) adds Node 26 support; this project retains Node 24 |
| utils → Zod | Scoped `@elgato/utils@0.6.1` override selects 4.6.7 | Outside utils' declared `^3.25.24`; SDK/CLI patches alone leave [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). utils already uses `zod/v4-mini`; [subpath policy](https://zod.dev/v4/versioning) and local schema tests support compatibility |
| CLI → ajv → fast-uri | Lockfile 3.1.8 → 3.1.9 within `^3.0.1` | Addresses [scheme decoding](https://github.com/advisories/GHSA-w74x-v6f9-j3xg), [path normalization](https://github.com/advisories/GHSA-xhq7-xmqj-769h), [host canonicalization](https://github.com/advisories/GHSA-wjr9-j795-jxcr) and [suffix scheme injection](https://github.com/advisories/GHSA-333x-w4r6-6crp); no extra override |

The [4.6.6 → 4.6.7 comparison](https://github.com/colinhacks/zod/compare/v4.6.6...v4.6.7) contains version metadata changes only. At review, registry metadata still identified utils 0.6.1; reassess the override when upstream declares a patched range.

Controlled comparison: the three-element bounded-array fixture fails with Zod 3.25.76 (element errors precede the size error) and passes with 4.6.7 (size error only). Valid/malformed nested Elgato options are handled on both versions. No exhaustion attack or proof of a reachable vulnerable input path was established. Locked installation, audit with zero reported advisories, 156 Node tests, two Python tests and Chromium passed at that revision; those audit/compatibility results are dated evidence, not a standing security guarantee or DRM validation.

## 1.1.3 artwork and transport fixes

### Artwork geometry

`091ebb5` preserves non-square Current Track key artwork through explicit centered aspect-ratio geometry and black margins, including text-backdrop variants. Existing dial geometry remains proportional. A controlled landscape comparison fails on the preceding helper and passes on the correction; Qt checks 27 generated combinations of square/landscape/portrait, PNG/JPEG/WebP and no/one-/two-line backdrop. These are fixtures, not screenshots or new physical-key confirmation.

<a id="follow-up-pending-previous-and-later-controls"></a>

### Dispatch, confirmation and later controls

`ce17e95` initially confirmed navigation and destination playback (164 Node tests plus packaging/Chromium). The maintainer still reported delayed Previous/Pause/Next and intermittent non-playing destinations. Inspection identified serial barriers in plugin delivery and worker polling while a final result could take ten seconds.

`7e0f61b` separates ordered dispatch from independent outcome verification, negotiates at most eight in-flight requests and cancels superseded checks. It also recovers same-item playback without inventing navigation evidence and observes state rather than awaiting a potentially unsettled site promise. Four playback and two command-service regressions fail on preceding `27dcf2c`; the corrected revision passes 176 Node tests, packaging and Chromium. Modeled Pause delays of 34/33 ms are local fixture measurements, not Windows/device latency. Later site failures below show these checks did not resolve every startup condition. [Architecture](../architecture.md#command-dispatch-and-confirmation) defines the current policy.

<a id="cold-start-readiness-follow-up"></a>

### Startup player error diagnosis

The following October 29 investigation records failed candidates as well as successful models. Private Music readiness conditions were not independently observed: anonymous Chromium returned unsupported-browser/Premium pages, not the signed-in player.

| Revision / observation | Local result and maintainer evidence |
| --- | --- |
| `f909efc`, usable-control bootstrap | 181 Node tests plus packaging/Chromium passed. Maintainer then reported site “An error occurred” and `player-error` on first Play/Current Track; manual site Play worked |
| `58f33e4`, bounded failure diagnostics | 185 tests plus packaging/Chromium passed. Instrumentation preserved behavior; a modeled TypeError verified diagnostic transport, not the actual site cause |
| Real site-event code 2 | State -1, API ready, media 0, no track at failure. [IFrame reference](https://developers.google.com/youtube/iframe_api_reference#Events) defines invalid parameters, but the actual Music argument and pre-click state were unknown |
| `b6859e1`, empty-player guard / input-time snapshot | 193 tests plus packaging/Chromium passed. Next real log showed track identity present before/after the ineffective click, still UNSTARTED with media 0: the guard did not address that case |
| `fd2d4d9`, explicit API startup | 198 tests plus packaging/Chromium passed; modeled Play/Toggle checks failed before the change. Manual Console `playVideo()` worked, but the maintainer still reported automatic failure |
| `40906db`, action/API/activation diagnostics | 198 tests and Chromium passed; automatic fixture calls had both activation flags false. Read-only site comparison found no bar API and a usable movie-player API, ruling out that object-selection difference in the checked state |
| Controlled activation comparison | Real local PCM playback rejected without CDP gesture and played with it. Music still played from Console with user-action evaluation disabled; a second Stream Deck input also played without site/Console interaction. Thus neither the local policy experiment nor initial Console success established the Music cause |
| `7145a38`, bounded startup recovery | Four new initial-input checks fail on isolated preceding `70f661e`; corrected source passes 211 tests, packaging and Chromium. Maintainer reports new-window playback now appears normal |

The code 2 snapshot was post-click; a site error could have cleared a prior selection. Input-time diagnostics were added to avoid that inference. The Console comparison controlled [Treat code evaluation as user action](https://developer.chrome.com/docs/devtools/settings/preferences#console); it still did not measure the earliest successful automatic retry time.

Current recovery retains Play intent only while the same ready API, valid track ID and queue position remain UNSTARTED without ready media. At most four explicit Play requests occur, with one-, two- and three-second retry gaps inside the original deadline. Progress, selection/API changes, disabled controls, errors or later playback intent cancel recovery. This is measured implementation behavior; it is not a diagnosis of the site's internal readiness rule.

### Navigation destination playback

After startup recovery, the maintainer reported intermittent Previous movement to another song without playback. Its real log showed UNSTARTED state, ready API, media 0, track present, `inputAction: play-api`, `inputApi: movie-player`, no error and `startupAttempts: 0`. Inspection found that outcome confirmation sent one Play but did not arm the bounded recovery used during preparation.

`4e525a0` applies that recovery to the first eligible destination after observed navigation/restart. Three destination checks fail before the change. Six focused checks cover Previous/Next, retry-time autoplay blocking, later Pause, no rearming after track changes and ambiguous same-item transitions. Full validation passed 217 Node tests, two Python tests and Chromium: navigation clicked once, ignored destination Play recovered, and later Pause remained paused beyond the retry interval. The maintainer subsequently confirmed operation and requested refactoring. Accept that reported scope without requesting repetition solely for omitted environment/package metadata; independent Windows observation was not established.

### Playback refactor

`c6b776a` moves playback into `background/player-playback.js`, with an unchanged-function source comparison, seven targeted checks and two packaging tests. `cbd1792` separates player observation, bounded diagnostics, event lifecycle, recovery state, ordered dispatch and independent playback/navigation confirmation. Helpers remain inside the serialized MAIN function; no extra injection stage or page-global helper is needed.

The refactor preserves sequence/results state, deadlines, polling, retry bounds, cancellation, evidence checks, filtering and cleanup. All 217 Node tests, two Python tests and Chromium passed. A prior focused run had one transient failure in a 500 ms cued-track case; it passed in isolation and the final full run, and its cause was not established. Its assertion gained diagnostic text without widening the deadline. Automated refactor checks are separate from accepted pre-refactor maintainer confirmation.

### Previous at the beginning of a restored selection

After the refactor, the maintainer reported a first Previous input with no visible effect. The real record shows healthy ongoing playback before/after: state 1, media 4, track/API ready, `inputAction: navigate-button`, no code/exception, `startupAttempts: 0`. No navigation/restart was observed; this differs from the earlier UNSTARTED playback failure.

The maintainer confirmed the browser button behaves similarly and, after more than five seconds, restarts the **same song** rather than changing its title. A restored-selection boundary/current-song restart is supported; actual queue/history contents, loop mode and input-time position were not captured. The [IFrame Previous contract](https://developers.google.com/youtube/iframe_api_reference#Playing_a_video_in_a_playlist) is context, not proof of Music's private behavior. A same-item restart at zero without a seek event can remain unconfirmed while music plays.

`7318a3a` adds a one-item/zero-position fixture followed by a six-second restart; all three targeted first-item/same-track tests pass. One click per input and no redundant Play are observed in the model. Runtime behavior is unchanged; no complete-suite or replacement-package result is claimed for this later review. The guide distinguishes an unconfirmed outcome from stopped playback or a proven dropped input.

### Development artifact inventory

All builds below are local, clean (`dirty: false`) and separate from public releases. Build IDs are `1.1.3-dev+g<source>.<suffix>` under `dist/development/`; suffix timestamps are UTC build identities, not KST observation dates. Each package/checksum and relevant archived source was verified when delivered. Official CLI validation/packaging passed. From `f909efc` onward, the plugin runtime remains byte-identical to `7e0f61b`; only extension updates are needed relative to that plugin.

| Source (12 chars) | Build suffix | Purpose |
| --- | --- | --- |
| `ce17e95c54f6` | `local20261028155820921` | Artwork/navigation candidate; both components |
| `7e0f61ba651f` | `local20261028163626482` | Concurrent delivery; both components |
| `f909efcc2d42` | `local20261028174813965` | Cued-player bootstrap |
| `58f33e4f8266` | `local20261028183058944` | Site/media/exception diagnostics |
| `b6859e112ea8` | `local20261028184802811` | Empty-player guard and input snapshot |
| `fd2d4d962b04` | `local20261028191228513` | API startup |
| `40906dbf7dde` | `local20261028195102296` | Action/API/activation diagnostics |
| `7145a38d90ba` | `local20261028201730142` | Bounded startup recovery |
| `4e525a05c5b0` | `local20261028203136514` | Destination recovery; later maintainer confirmation |
| `cbd17925ad7d` | `local20261028210702553` | Latest supplied refactor build; archived entry point/imports match source |

Earlier failed candidates and intermediate checks retain the outcomes summarized above; detailed chronological notes remain in Git history. Published tags/assets, already supplied build folders and submitted packages were not replaced.

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
