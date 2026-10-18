# Release readiness

Last updated: October 18, 2026 (Asia/Seoul). Latest stable GitHub release: **v1.1.1**, published at **16:16 KST**. Source/Chrome version is **1.1.1**, Stream Deck version **1.1.1.0**, wire protocol **1**. Earlier public tags/assets and the submitted v1.0.1 Marketplace package remain fixed; the unpublished v1.0.2 candidate is superseded by the v1.1.x releases.

The exact release source, final Windows/Ubuntu CI run and package checksums are recorded on the [v1.1.1 GitHub Release](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.1.1). See the [v1.1.1 scope and verification record](verification/v1.1.1.md) and the preceding [v1.1.0 record](verification/v1.1.0.md). GitHub publication and store approval are separate.

The maintainer-selected **1.1.1-dev** cycle has been promoted and published as **v1.1.1**. No next development target is selected automatically; ordinary changes must follow an explicitly selected cycle under the [versioning policy](versioning.md).

## Current evidence

| Category | Result / evidence |
| --- | --- |
| Device displays, controls and retained settings | Complete by [maintainer confirmation](verification/maintainer-validation-2026-10-18.md), including text/artwork options and profile/restart restoration |
| Actual Chrome/YouTube Music operation and pairing recovery | Complete by the same maintainer report; implementation evidence: [readiness](verification/player-readiness-and-feedback.md), [cold-tab recovery](verification/browser-connection-recovery.md) |
| Ordinary-package update, settings retention and rollback | Retention/rollback complete by maintainer report. Later 1.0.2 development → public 1.1.0 root-rename failure reproduced; [Explorer-handle closure followed by successful same-host/package rename](verification/update-procmon-v1.1.0-2026-10-18.md), all 62 release files match. Earlier failures are not retroactively diagnosed |
| Protocol compatibility | Implemented and locally verified: [117 Node tests, HTTP/SDK/worker matrix and actual Chromium fixture](verification/protocol-compatibility.md); newly introduced protocol behavior has no separate Windows device sign-off |
| Release source and packages | Complete: `33b4757364e2e2c153cecc635027024662fffdbd`, [main CI 39106843325](https://github.com/minjungw00/music-deck-bridge/actions/runs/39106843325) passed both OS jobs; downloaded CI/draft/public checksums and byte equality verified. [Publication evidence](verification/v1.1.1.md) |
| GitHub security | [Verified enabled](security-readiness.md): private reports, secret scanning, push protection and Dependabot; read-only default Actions token |
| Maker Console DRM | [Not tested](verification/marketplace-drm.md); ordinary package and opaque-manifest fixture results do not establish DRM execution |
| Store status | Last maintainer report: Elgato v1.0.1 Pending review; Chrome preparation pending. [Review preparation](verification/review-preparation.md); no public store install URLs activated |
| Official product images | [Three images selected](verification/official-images-2026-10-18.md): actual Stream Deck capture with equal 48px margins, plus English/Korean sample-data popup renderings. Linked from README; final store-sized exports and final-package matching remain |

## Release scope

v1.1.1 adds consistent English/Korean popup button sizing, the main icon beside its heading, the offline rendering-preview tool and selected official product media. It also records the later installation investigation without claiming an installer code fix. The popup correction has Chromium layout evidence; the stable source passed Windows/Ubuntu CI. See [v1.1.1 verification](verification/v1.1.1.md).

v1.1.0 includes automatic player launch/continuation, Open/Like/Dislike keys, reliable browser connection/player readiness and confirmed playback/mute feedback. The Current Track Dial adds per-instance information/artwork modes, proportional width/height fitting, full-width scrolling and optional title/artist placement/background. The Now Playing key offers matching text options. Protocol negotiation separates component identities from compatible wire versions and preserves credentials during recovery.

Brand/action artwork, the supplied README thumbnail and locale-aware inspector/popup UI are included. Plugin/action UUIDs, PIN authentication, port and storage paths remain stable. Development builds retain their selected target and use build metadata rather than automatic release-number increments. Earlier incorrectly numbered unpublished 1.1.0/1.1.1 development files remain historical evidence, not earlier public releases of this v1.1.0.

## Remaining work

1. **Marketplace DRM:** obtain and test the Console-processed installer separately from GitHub packages; retain its own source/hash/environment evidence.
2. **Stores:** use the [selected official source images](verification/official-images-2026-10-18.md) for final store-sized exports; complete final-package capture/appearance matching, supported models/software, privacy declarations and unpacked-to-store migration. Track the two approvals independently.
3. **Protocol deployment:** verify the new explicit identity/status and retained pairing on the actual Windows component pair. Controlled incompatible/future-version fixtures already pass.
4. **Final environment coverage:** retain CI/artifact provenance and complete clean-environment install/uninstall/reset or idle/port-conflict coverage outside the confirmed scope. A future wire version must add migration tests for its implemented ranges.

The ACCESS DENIED installation condition [recurred after publication](verification/update-procmon-v1.1.0-2026-10-18.md). A live snapshot identified Explorer handles inside the installed directory; the close-folder retry then succeeded through the original root rename with the same host and public installer. This provides a concrete trigger/recovery comparison for that recurrence, without diagnosing every older failure or establishing a runtime fix. The [normal-workflow assessment](verification/update-behavior-assessment.md) distinguishes supported newer-version updating from recovery/file replacement and does not establish failure frequency.

## Detailed verification records

- [v1.1.1 popup corrections, product media and release verification](verification/v1.1.1.md)
- [v1.1.0 publication, exact-source CI and public package hashes](verification/v1.1.0.md)
- [Selected official images, source provenance and lossless Stream Deck margin correction](verification/official-images-2026-10-18.md)
- [October 18 maintainer validation of device, Chrome and update/recovery](verification/maintainer-validation-2026-10-18.md)
- [Protocol range negotiation, legacy compatibility and recovery](verification/protocol-compatibility.md)
- [Current Track Dial controls and display](verification/current-track-dial.md)
- [Current Track Dial artwork fit and optional song name](verification/dial-artwork-options.md)
- [Qt artwork rendering correction and configurable text](verification/dial-artwork-rendering.md)
- [Full-width dial scrolling, artist placement and key text options](verification/track-text-layout.md)
- [Player readiness, playback state and mute dial feedback](verification/player-readiness-and-feedback.md)
- [Browser connection and cold-tab recovery regression](verification/browser-connection-recovery.md)
- [Development version/build identity separation and migration](verification/development-versioning.md)

- [Historical development build: launch continuation, pairing guidance and title removal](verification/launch-continuation-v1.1.1.md)
- [Historical development build: launch and rating checks](verification/player-launch-ratings.md)
- [v1.0.2 candidate and update-comparison preparation](verification/v1.0.2.md)
- [v1.0.1 publication, package hashes and maintainer reports](verification/v1.0.1.md)
- [v1.0.0 publication and maintainer verification](verification/v1.0.0.md)
- [Pre-v1.0.0 automation and distribution history](verification/v0.5.1.md)
- [Update-installation investigation and redacted host evidence](verification/update-installation.md)
- [October 18 v1.0.1 → v1.0.2 failed-update PML analysis](verification/update-procmon-2026-10-18.md)
- [October 18 successful official-stop installation retry](verification/update-procmon-retry-2026-10-18.md)
- [October 18 successful running-plugin update and remaining mode control](verification/update-procmon-direct-2026-10-18.md)
- [October 18 successful normal-mode running-plugin update](verification/update-procmon-normal-2026-10-18.md)
- [October 18 public v1.1.0 rename denial, live Explorer handles and successful close-folder retry](verification/update-procmon-v1.1.0-2026-10-18.md)
- [Expected update behavior, failure classification and limits of generalization](verification/update-behavior-assessment.md)
- [Marketplace DRM test record (not performed)](verification/marketplace-drm.md)
