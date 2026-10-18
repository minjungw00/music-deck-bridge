# Release readiness

Last updated: October 18, 2026 (Asia/Seoul). Use this document for current distribution status and remaining work. Dated tests, package hashes and investigation details are retained in the linked verification records.

## Distribution status

| Channel | Version and current state | Evidence |
| --- | --- | --- |
| GitHub | **v1.1.1**, published October 18 at 16:16 KST | [Release](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.1.1) · [Publication verification](verification/v1.1.1.md) |
| Elgato Marketplace | **v1.1.1**, newly submitted and **Pending review** | [October 18 maintainer report and submission provenance](verification/review-preparation.md) |
| Chrome Web Store | Preparation; no submission or public install URL reported | [Submission guide](../store-assets/chrome/README.md) |

Source/Chrome version is **1.1.1**, Stream Deck version **1.1.1.0**, wire protocol **1**. Public store install links remain inactive until approval, publication and installation verification. Earlier public GitHub tags/assets are unchanged. The **1.1.1-dev** cycle is complete; no next development target has been selected under the [versioning policy](versioning.md).

## Current evidence

| Category | Result / evidence |
| --- | --- |
| Stable source and packages | v1.1.1 passed exact-source Windows/Ubuntu CI, 117 Node tests, two Python tests and official packaging. Ubuntu also passed actual Chromium integration. Public checksums and bytes verified. [Release record](verification/v1.1.1.md) |
| Device displays, controls and retained settings | Complete within the [maintainer-confirmed scope](verification/maintainer-validation-2026-10-18.md), including text/artwork options and profile/restart restoration |
| Actual Chrome operation and pairing recovery | Complete within that maintainer report; implementation evidence: [player readiness](verification/player-readiness-and-feedback.md), [cold-tab recovery](verification/browser-connection-recovery.md) |
| Update, retention and rollback | Retention/rollback confirmed by the maintainer. A later installation denial was traced to an Explorer folder handle with a successful retry after closure; no installer code fix is claimed. [Investigation and limits](verification/update-procmon-v1.1.0-2026-10-18.md) |
| Protocol compatibility | Automated/Chromium coverage complete; separate actual Windows sign-off remains. [Protocol verification](verification/protocol-compatibility.md) |
| Popup and official product images | [English/Korean popup layout](verification/popup-button-layout.md) verified. [Official renderings](verification/official-images-2026-10-18.md) display **1.1.1**; the actual Stream Deck capture is unchanged. [Chrome store exports](verification/chrome-store-images-2026-10-18.md) are prepared and checked; actual uploaded media remains separate |
| Repository security | Settings and inspection scope recorded in [security readiness](security-readiness.md) |
| Maker Console DRM | [Not tested](verification/marketplace-drm.md); submission/review and ordinary-package tests do not establish processed-package execution |

## Release scope

v1.1.1 adds consistent popup button sizing, the heading icon, the offline rendering-preview tool and selected product media. The launch/ratings, connection recovery, configurable key/dial displays and protocol features were released in v1.1.0. See the [changelog](../CHANGELOG.md), [v1.1.1 record](verification/v1.1.1.md) and [v1.1.0 record](verification/v1.1.0.md) for version-specific scope.

## Remaining work

1. **Marketplace v1.1.1:** track the review result, Console version identifier and uploaded-file hash. Obtain and test that version's [Console-processed installer](verification/marketplace-drm.md).
2. **Submission media and listing:** use the prepared [Chrome upload files](../store-assets/chrome/README.md#upload-files); check actual uploaded media, supported models/software and privacy declarations against the submitted package. Marketplace exports/uploaded media have separate verification.
3. **Chrome Web Store:** complete its submission and unpacked-to-store migration checks independently of Marketplace. Verify each public install URL after approval/publication.
4. **Windows protocol deployment:** confirm explicit component identities/status and retained pairing on the actual Windows component pair. Controlled compatibility fixtures already pass.
5. **Additional environment coverage:** retain provenance for clean-environment install/uninstall/reset and idle/port-conflict checks outside the existing confirmed scope. Future wire-version changes require tests for their implemented ranges.

## Detailed verification records

### Releases, submissions and media

- [Current Marketplace v1.1.1 review and submission provenance](verification/review-preparation.md)
- [v1.1.1 popup corrections, product media and release verification](verification/v1.1.1.md)
- [v1.1.0 publication, exact-source CI and public package hashes](verification/v1.1.0.md)
- [Selected official images, source provenance and lossless Stream Deck margin correction](verification/official-images-2026-10-18.md)
- [Chrome Web Store upload image dimensions, sources and checksums](verification/chrome-store-images-2026-10-18.md)
- [Marketplace DRM test record (not performed)](verification/marketplace-drm.md)

### Device, browser and protocol verification

- [October 18 maintainer validation of device, Chrome and update/recovery](verification/maintainer-validation-2026-10-18.md)
- [Protocol range negotiation, legacy compatibility and recovery](verification/protocol-compatibility.md)
- [Current Track Dial controls and display](verification/current-track-dial.md)
- [Current Track Dial artwork fit and optional song name](verification/dial-artwork-options.md)
- [Qt artwork rendering correction and configurable text](verification/dial-artwork-rendering.md)
- [Full-width dial scrolling, artist placement and key text options](verification/track-text-layout.md)
- [Player readiness, playback state and mute dial feedback](verification/player-readiness-and-feedback.md)
- [Browser connection and cold-tab recovery regression](verification/browser-connection-recovery.md)
- [Development version/build identity separation and migration](verification/development-versioning.md)

### Installation investigations and historical records

- [Historical v1.0.1 review preparation](verification/review-preparation-v1.0.1.md)
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
