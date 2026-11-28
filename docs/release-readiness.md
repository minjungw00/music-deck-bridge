# Release readiness

Updated November 28, 2026 (Asia/Seoul) with development verification, the confirmed Elgato gallery and the maintainer's physical Stream Deck and PC reboot checks. General installation starts with the [official stores](installation.en.md#method-1-official-stores).

## Current versions and distribution

| Channel | Version / state | Evidence |
| --- | --- | --- |
| GitHub | **v1.2.0**, Chrome **1.2.0**, plugin **1.2.0.0**, protocol **1** | Initially published November 14 at 00:42:50 KST; canonical files/tag corrected at 01:39 KST by explicit maintainer instruction. Three public files and the corrected source archive verified · [Release record](verification/releases.md#v120) |
| Elgato Marketplace | **1.2** in Details, **1.2.0** in What's new, dated **November 23, 2026** | Directly verified November 27 · [Store record](verification/stores.md#november-27-publication-verification) |
| Chrome Web Store | **1.2.0**, updated **November 14, 2026** | English and Korean listings directly verified November 27 · [Store record](verification/stores.md#november-27-publication-verification) |
| Release source | **1.2.0**, Chrome **1.2.0**, plugin **1.2.0.0**, protocol **1** | Corrected tag `v1.2.0` resolves to `86e66c2d36b9`. Original source `ff139a755b25` is retained at `archive/v1.2.0-initial`. Exact-source Windows/Ubuntu CI and public package/source comparisons completed. |

Use the corrected [Chrome 1.2.0 ZIP](https://github.com/minjungw00/music-deck-bridge/releases/download/v1.2.0/music-deck-bridge-chrome-1.2.0.zip) with the original plugin installer. [Current hashes and replacement history](verification/releases.md#current-corrected-publication) distinguish the corrected files from the archived initial package and removed temporary r1 attachments.

The public listings describe standalone Chrome popup controls and link to the companion store. The [1.2.0 listing drafts](../store-assets/drafts/v1.2.0/README.md) remain reference material. The exact Console submissions, store package identity, installation and runtime operation for 1.2.0 remain unverified.

The selected development version is **1.3.0-dev**, with Chrome **1.3.0** and Stream Deck **1.3.0.0**. Its [changes](../CHANGELOG.md#unreleased--130) cover Repeat and Shuffle, the Current Track Dial, key artwork and last-track restoration.

## Development validation

The [runtime record](verification/runtime.md#current-evidence) is the source for detailed scope, failed-candidate history and the [local artifact inventory](verification/runtime.md#development-artifact-inventory).

| Area | Current evidence | Remaining limit |
| --- | --- | --- |
| Sequential Play/Pause, `48f0382` | The MV3 fixture confirmed ordered Play/Pause during two startup timings, concurrent Volume and Repeat, and matching request IDs in both components. Both development packages passed checksum and source comparisons. [Runtime check](verification/runtime.md#sequential-playpause-confirmation) | The Windows sample redirected to Premium in an unsigned-in profile. Verify the new packages with signed-in YouTube Music. |
| Physical Stream Deck | The maintainer reported completing the requested 1.3.0-dev hardware check. [Maintainer report](verification/runtime.md#130-dev-physical-stream-deck) | The live-service buffering and cross-device selection checks have separate criteria. |
| November 28 final 1.3.0-dev build, `94593e7` | 337 Node tests in serial and parallel, Chromium and packaging checks, and final package checksums passed. Windows verified queue controls, retained state and the loaded live playback paths. The maintainer separately confirmed state restoration after reboot. [Final runtime validation](verification/runtime.md#november-28-final-130-dev-validation) · [Maintainer report](verification/runtime.md#130-dev-pc-reboot) | The regular tab's early Play/Pause was unconfirmed. Physical input/output and exact tagged-source CI remain separate. |
| November 28 final dial styling, product source `1a38762` | 337 Node tests passed in a serial run, along with static checks, two Python packaging tests, three Chromium fixtures and package checksums. Windows Stream Deck app captures confirmed the matching dial headings and icons. [Media and native app evidence](verification/media.md#november-28-revised-130-elgato-gallery) | Two suites cancelled during a local parallel run. Exact-source Windows/Ubuntu CI, physical-device output and PC reboot still need verification. |
| November 28 Windows native and mixed-version checks, `394b941` | Live Chrome tab and installed app cycled Repeat and Shuffle through the paired bridge. The plugin saved the closed app's last track, artwork and playback settings. Both mixed upgrades from 1.2.0 retained pairing, port and popup playback. [Windows record](verification/runtime.md#november-28-native-youtube-music-controls) | Account sign-in, imported paused selection on the live site, physical output/input, PC reboot and Marketplace-processed installer require separate verification. |
| November 28 isolated 1.3.0 package rehearsal, `394b941` product code | A temporary source copy passed stable version/tag-format verification, static checks, 336 Node tests, official Elgato validation and both package checksums. The locked npm audit reported zero vulnerabilities. | Official promotion, exact tagged-source Windows/Ubuntu CI, Maker Console processing and store submission remain pending. |
| November 27 Windows mixed-version upgrade, `a512a7f` | Both `1.2.0` / `1.3.0-dev` combinations retained pairing and the saved port. Toolbar Play/Pause worked in both, and the new popup used Chrome-local Repeat and Shuffle with the old plugin. [Mixed-version record](verification/runtime.md#november-27-windows-mixed-version-upgrade) | Packaged software used a local player model. Physical Stream Deck profile migration and Maker Console processing require separate verification. |
| November 27 Windows installed-app priority, `a512a7f` | The paired bridge preferred the paused YouTube Music app over a playing tab and returned to the tab when the app closed. Local checks passed 316 Node tests, two Python packaging tests, static checks and three Chromium fixtures. [App record](verification/runtime.md#november-27-windows-installed-app-priority) | Sign-in state, physical output and input, restoration after PC reboot and Maker Console processing remain open. |
| November 27 Windows and YouTube Music, `e633272` | The installed build passed live Repeat, Shuffle and artwork checks. The Stream Deck + preview restored saved artwork after restart with Chrome fully closed, and the existing pair reconnected after Chrome reopened. The local run passed 315 Node tests, two Python packaging tests, static checks and three Chromium fixtures. [Runtime record](verification/runtime.md#november-27-windows-and-youtube-music) | This run reported the installed app as a browser tab. The follow-up above covers app selection. |
| November 27 1.3.0-dev layout revision | 309 Node tests, two Python packaging tests, static checks, three Chromium fixtures and Qt measured-gap crop checks passed. [Runtime record](verification/runtime.md#november-27-130-dev-measured-gaps-and-popup-layout) | Windows hardware, reboot and signed-in YouTube Music/PWA remain manual release checks. |
| November 14 corrected 1.2.0 | [CI 43464167437](https://github.com/minjungw00/music-deck-bridge/actions/runs/43464167437): both OSes passed 297 Node tests, two Python tests, checks/audit/official packaging; Ubuntu passed three browser fixtures. All three public files and the 274-file source archive matched the corrected source | Explicit pre-store replacement; historical package hashes remain separate. No new real-site/hardware/store operation |
| November 14 temporary 1.2.0 r1 (superseded) | [CI 43462436276](https://github.com/minjungw00/music-deck-bridge/actions/runs/43462436276): both OSes passed 297 Node tests, two Python tests, checks/audit/official packaging; Ubuntu passed three browser fixtures. All six public assets verified | Fixture operation; no new store/real-site/hardware/processed-package validation |
| November 14 stable 1.2.0 | [Exact-source CI 43454249656](https://github.com/minjungw00/music-deck-bridge/actions/runs/43454249656): both OSes passed 288 Node tests, two Python tests, static/audit/official packaging; Ubuntu passed three browser fixtures | Local full Node run passed 286/288; separate clock monitor/targeted comparisons and scope limits are retained in [runtime evidence](verification/runtime.md#november-14-stable-release-checks) |
| November 14 review / refactor | Final local 288 Node tests, two Python packaging tests, static checks and three Chromium fixtures passed; [review scope and initial failed-run comparison](verification/runtime.md#november-14-code-review-and-refactor) | One initial unchanged startup-retry fixture failed; cause unresolved after isolated baseline/current passes and a passing full rerun. Real Music, hardware and Windows operation remain separate |
| November 13 standalone / slider revision | 256 Node tests, two Python packaging tests, static checks and Chromium MV3 passed, including stopped-plugin/token-free controls and restored state synchronization; [runtime record](verification/runtime.md#november-13-standalone-player-and-volume-slider) | Local player model and labeled visual fixtures; actual Music, hardware and Windows behavior remain separate |
| November 13 1.2.0-dev popup controls | 249 Node tests, two Python packaging tests, static checks and Chromium MV3 integration passed. The actual toolbar popup controlled playback/navigation/ratings/volume/mute through the authenticated bridge; [runtime record](verification/runtime.md#november-13-popup-controls) | Local player model; cached-image and visual fixtures. Actual signed-in Music, hardware and Windows operation remain separate |
| November 13 1.1.4-dev popup update | 226 Node tests, two Python packaging tests, static checks and Chromium MV3 integration passed. The actual toolbar popup followed changing local-fixture track metadata without reopening; [runtime record](verification/runtime.md#november-13-popup-refresh) | Local fixture; actual YouTube Music, physical Stream Deck and Windows operation remain separate |
| November 7 post-release `main` CI | At `ae5ed0b8bcff`, [CI 42381040754](https://github.com/minjungw00/music-deck-bridge/actions/runs/42381040754) passed on Windows and Ubuntu with 220 Node tests (0 failures) and two Python packaging tests on each OS, code checks, zero vulnerabilities reported by `npm audit` and Chrome/Stream Deck packaging. Ubuntu also passed Chromium MV3 integration | Development CI only. Physical Stream Deck operation on Windows and execution of store-processed DRM packages remain unverified |
| October 29 pre-release checks | At `131b5ef3ebe2`: fresh locked install, 218 Node tests, two Python tests, syntax/resources/versions, audit with zero reported vulnerabilities and Chromium MV3 integration; exact-source [Windows/Ubuntu CI](https://github.com/minjungw00/music-deck-bridge/actions/runs/40785323853) passed | Automated fixtures; no independent Windows/site operation |
| Startup and destination playback | Maintainer reported new-window recovery normal, then confirmed destination recovery before refactoring | Preserve that confirmation; it is not a complete post-refactor/hardware inventory |
| First Previous at a restored selection | Later real log shows healthy playing state; the site button similarly restarts the same song after time has advanced; boundary regression is included in the passing 218-test full run | Actual queue/history absence remains an interpretation; a restart at zero without observable evidence can remain unconfirmed |
| Security dependencies | Dated locked installation/audit and schema comparisons support the scoped Zod override | Review the override when utils declares a patched range; audit results are time-specific |
| Development packages | Clean `131b5ef3ebe2` [review build](verification/runtime.md#development-artifact-inventory): official validator/packager passed; checksums, all payload files, versions and legal notices match source | Linux development packages; that review checked CI metadata only. Final stable-source archives and public bytes were subsequently verified below |

## Published release and historical verification

| Area | Completed evidence | Scope limits |
| --- | --- | --- |
| Latest GitHub release, 1.2.0 | Exact-source Windows/Ubuntu CI, source-matched identical payloads, release inventory, draft downloads and anonymous public bytes verified; [release record](verification/releases.md#v120) | GitHub packages only; real-site, device/native-startup and processed DRM coverage remain separate. Local fixture failures and clock comparisons are disclosed. |
| Earlier GitHub release, 1.1.3 | Exact-source Windows/Ubuntu [CI 40786383387](https://github.com/minjungw00/music-deck-bridge/actions/runs/40786383387): 218 Node tests, two Python tests, Chromium integration, audit with zero reported vulnerabilities, official packaging, source comparison and anonymous public download hashes/bytes | GitHub packages only. Store package identity and new hardware/DRM operation remain unverified. |
| Earlier release, 1.1.2 | Exact-source Windows/Ubuntu [CI 39136965856](https://github.com/minjungw00/music-deck-bridge/actions/runs/39136965856): 154 Node tests, two Python tests, Chromium integration and verified public package bytes | Historical scope retained in [release verification](verification/releases.md#v112) |
| Earlier operation, 1.1.2 | Maintainer confirmed released 1.1.2, the Chrome-store extension with the released plugin, then both published store components on October 24 | Exact processed-package identity and detailed DRM results not supplied separately |
| Device and recovery | Earlier itemized maintainer checks cover displays, controls, pairing recovery, retained settings and rollback | Each historical sign-off retains its original scope |
| Installation investigation | Explorer descendant-folder handles were observed; closing the folder allowed the same installer to succeed | No installer code fix or universal cause is claimed |
| Media and copy | Actual device capture retained; sample popup renderings show 1.1.1; sized exports and verbatim v1.1.1 submitted descriptions preserved | Later submitted copy and exact uploaded package/media identities were not supplied |

## Remaining work

### 1.3.0

The maintainer selected all five Elgato gallery PNGs at `9b866cd`. The submission index includes the selected gallery, two prepared Chrome screenshots and store copy. [Store submission index](../store-assets/drafts/v1.3.0/README.md)

The maintainer confirmed that a song handed off from another device appeared as the last track. The two attempts to handle a second Play / Pause press during startup were reverted after the symptom persisted on live YouTube Music. [Live-service check](verification/runtime.md#live-youtube-music-checks-for-130-dev)

- Once authorized, promote `1.3.0-dev` to `1.3.0`, finish the changelog, verify Windows and Ubuntu CI against the tagged source, and verify the release package checksums. [Release checklist](development.md#release-checklist)
- Complete both store submissions, including Chrome's privacy form. Verify the Maker Console processed installer on Windows, then record submission, approval, and publication separately. [Marketplace DRM record](verification/marketplace-drm.md) · [Store record](verification/stores.md)

### 1.2.0 records and follow-up

The authorized 1.2.0 GitHub release is complete through the direct publication path in the [release checklist](development.md#release-checklist). Exact tagged-source CI, both OS package payloads, draft downloads, release inventories and anonymous public bytes passed verification. Release notes disclose outstanding manual coverage and local startup-retry fixture/clock observations. Earlier releases remain in the [release record](verification/releases.md); the [runtime record](verification/runtime.md#current-evidence) preserves maintainer confirmation within its original scope.

- Record the 1.2.0 Console submission and review details, uploaded-file checksums, selected media and exact submitted copy when available.
- Record separately obtained Console-processed package identity and detailed DRM results. Completed store-operation validation does not need repeating solely for missing metadata.
- For future wire changes, test the implemented version ranges and explicit component identity/status behavior.
- Extend evidence to independent/clean Windows environments and idle/port-conflict scenarios outside the existing maintainer-confirmed scope.

## Verification records

### Releases, submissions and media

| Record | Purpose |
| --- | --- |
| [Releases](verification/releases.md) | Published source, exact-source CI, public hashes and history |
| [Stores](verification/stores.md) | Publication, submitted descriptions and provenance |
| [Media](verification/media.md) | Image sources, lossless crops and exports |
| [Marketplace DRM](verification/marketplace-drm.md) | Processed-package identity and detailed execution coverage |

### Runtime and installation

| Record | Purpose |
| --- | --- |
| [Runtime](verification/runtime.md) | Automated coverage, maintainer sign-offs and protocol limits |
| [Installation](verification/installation.md) | Failed/successful comparisons and Explorer-handle diagnosis |

See [security verification](security-readiness.md) for repository settings and inspection limits, and the [changelog](../CHANGELOG.md) for versioned changes.
