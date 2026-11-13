# Release readiness

Updated November 14, 2026 (Asia/Seoul) after the maintainer-authorized 1.2.0 GitHub publication, anonymous download verification and direct inspection of the current store listings. General installation starts with the [official stores](installation.en.md#method-1-official-stores). Public releases, development and store processing have separate evidence.

## Current versions and distribution

| Channel | Version / state | Evidence |
| --- | --- | --- |
| GitHub | **v1.2.0**, Chrome **1.2.0**, plugin **1.2.0.0**, protocol **1** | Published November 14 at 00:42:50 KST; latest non-draft/non-prerelease API result and all three anonymous download files verified · [Release record](verification/releases.md#v120) |
| Elgato Marketplace | Public listing **1.1.3**, dated **November 2, 2026** on the page | November 14 direct observation confirmed the version and current installation copy. Last maintainer-reported submission was **1.1.2** / plugin **1.1.2.0** · [Store record](verification/stores.md) |
| Chrome Web Store | **1.1.3**, updated **October 30, 2026** on the official English/Korean pages directly read November 14. | Official version/date/copy now independently observed; earlier third-party and user reports retain their original scope. Last maintainer-reported submission was **1.1.2** · [Store record and scope limits](verification/stores.md#chrome-web-store-publication-evidence) |
| Release source | **1.2.0**, Chrome **1.2.0** (development label removed), plugin **1.2.0.0**, protocol **1** | Tag `v1.2.0` resolves to `ff139a755b25`; exact-source Windows/Ubuntu CI and package/public-byte verification completed. No next development cycle selected; no 1.2.0 store submission/publication is recorded |

The maintainer has requested the popup-opening fix in the existing 1.2.0 release. Revision **r1** is being prepared with source tag `v1.2.0-r1`, a separately named Chrome archive and revision metadata/checksums. Application versions and original release files remain fixed; exact-source CI and public attachment verification are pending.

The [Elgato listing now recommends Add to Chrome and offers the GitHub Releases ZIP as an optional manual method](verification/stores.md#public-description-correction). The October 29 draft is historical reference copy.

[1.2.0 store copy and UTM links](../store-assets/drafts/v1.2.0/README.md) are prepared for review. They have not been submitted or published; [November 14 observations](verification/stores.md#november-14-public-listing-review-and-120-drafts) distinguish the current listings from the proposals.

## Development validation

The [runtime record](verification/runtime.md#current-evidence) is the source for detailed scope, failed-candidate history and the [local artifact inventory](verification/runtime.md#development-artifact-inventory).

| Area | Current evidence | Remaining limit |
| --- | --- | --- |
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

The authorized 1.2.0 GitHub release is complete through the direct publication path in the [release checklist](development.md#release-checklist). Exact tagged-source CI, both OS package payloads, draft downloads, release inventories and anonymous public bytes passed verification. Release notes disclose outstanding manual coverage and local startup-retry fixture/clock observations. Earlier releases remain in the [release record](verification/releases.md); the [runtime record](verification/runtime.md#current-evidence) preserves maintainer confirmation within its original scope.

- Record the 1.1.3 Maker Console submission and review history, version identifier, uploaded-file identity and SHA-256, selected media and exact submitted description when available.
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
