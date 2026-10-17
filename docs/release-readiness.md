# Release readiness

Evidence date: October 17, 2026. Source version is **1.0.1** (Stream Deck **1.0.1.0**); the published stable baseline is **1.0.0**. This records development checks and outstanding release work; it is not a store approval or hardware certification.

## 1.0.1 brand release candidate

This patch introduces the [magenta play-disc brand](branding.md) in seven representative/category PNGs. All 28 action PNGs reproduce byte-for-byte from 1.0.0. Playback, local communication and authentication code are unchanged; plugin/action UUIDs, permissions, configuration paths and settings formats are preserved. Protocol compatibility negotiation for independently updated components is deferred to a separate **1.1.0 candidate** feature.

Local evidence on October 17, 2026 (Linux, Node.js 24.19.0, Python 3.12.3, optional Pillow 12.0.0, Elgato CLI 1.10.2):

| Check | Result |
| --- | --- |
| Syntax, versions, manifests, resources, locales and basic secret checks | Passed |
| Node regression tests, including PIN/auth, playback, ports, settings and SDK round trips | 50/50 passed |
| Python packaging tests, including exact packaged brand PNG bytes | 2/2 passed |
| Brand dimensions, RGBA/alpha, palette and manifest references | Passed for all seven PNGs |
| 16px colored and 28px monochrome play triangle | Pixel checks and visual review passed; installed-UI review pending |
| Reproducible icon generation | All 35 PNGs reproduced byte-for-byte; all 28 action PNGs match 1.0.0 |
| Chrome ZIP and official Stream Deck validation/packaging | Passed |
| Release SHA256SUMS.txt generation and verification | Passed locally; final CI downloads must be verified separately |
| npm audit | 0 reported vulnerabilities |
| Final commit Windows / Ubuntu CI and package downloads | Pending; record exact SHA/run and hashes in release notes |

Required 1.0.1 manual evidence is separate from the completed 1.0.0 report below:

| Check | Status | Evidence to record |
| --- | --- | --- |
| Plugin update 1.0.0.0 → 1.0.1.0 | Pending | Install the candidate installer over 1.0.0; record source SHA/run/hash, Windows, Stream Deck software, device/firmware and update result |
| Chrome extension update 1.0.0 → 1.0.1 | Pending | Update the existing unpacked extension folder and reload it; preserve extension identity; record Chrome version, update result and visible new icon |
| Existing PIN authentication, port, action settings and profiles retained | Pending on actual install | Keep existing data/profile; confirm existing pairing without reset, custom port, title/volume settings and all existing action instances |
| Playback controls, keys/dials and installed icon rendering | Pending on actual hardware/UI | Confirm play/pause, previous/next, mute, volume/track dials as applicable; inspect representative/category/Chrome icons |
| Public v1.0.1 GitHub Release | Pending the checks above | Use the exact commit's passing Windows/Ubuntu CI packages; verify downloaded checksums, inspect packaged manifests/resources and preserve v1.0.0 |

Do not mark these manual checks complete from source equivalence or automated tests. Prepare a draft with the candidate packages for installation testing; publish the new tag's Release after the update/retention results are recorded. Maker Console DRM and each store approval remain separate pending checks and do not become complete with a GitHub Release.

## 1.0.0 GitHub release

The maintainer requested a version change and GitHub release on October 17, 2026. The released package and Chrome versions are 1.0.0; Stream Deck uses 1.0.0.0. README and both installation guides use GitHub Releases as the default download route; store URLs remain inactive. The exact release commit passed both CI platforms before publication. Manual evidence is updated below from the maintainer report on October 17, 2026; unperformed checks remain pending.

Local checks for 1.0.0 passed: `npm run check`, all 46 Node tests, both Python packaging tests, and `npm audit` (zero reported vulnerabilities). The [v1.0.0 release notes](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.0.0) record the exact release commit, final Windows/Ubuntu CI run and package hashes after remote verification.

## 1.0.0 maintainer manual verification

Reported by the maintainer on October 17, 2026:

| Check | Result | Evidence / scope |
| --- | --- | --- |
| GitHub Release package installation | Passed (maintainer report) | Installed the published package; exact download/file details can be added below |
| Installed package normal operation | Passed (maintainer report) | Normal operation confirmed after installation |
| Manual functional verification | Complete (maintainer report) | Detailed action/device coverage was not supplied; do not infer every hardware scenario |
| Stream Deck plugin upgrade 0.5.1.0 → 1.0.0.0 | Passed (maintainer report) | Does not establish the later 1.0.0.0 → 1.0.1.0 upgrade |
| Windows / Ubuntu tests and packaging | Passed (GitHub CI) | [Run 39011082543](https://github.com/minjungw00/music-deck-bridge/actions/runs/39011082543), release commit `722552f3fc04f5753755cbfb0d4a5b40442ea582` |

Environment and provenance fields intentionally remain open where the report supplied no details:

| Field | Recorded value |
| --- | --- |
| Windows edition / version / build | Not recorded — add actual test environment |
| Chrome version | Not recorded — add actual test environment |
| Stream Deck software version | Not recorded — add actual test environment |
| Stream Deck model / firmware | Not recorded — add actual device details |
| Installer source URL / downloaded filename | GitHub Release package reported; exact source/file not recorded. Reference: [v1.0.0 assets](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.0.0) |
| Downloaded package SHA-256 | Not recorded for the manually installed copy; published hashes are in the release notes |
| Manual test date / action coverage / notes | Report received October 17, 2026; detailed execution notes not recorded |

This records the completed GitHub Release installation and upgrade without claiming a clean PC, every key/dial scenario, Chrome Web Store installation or Maker Console DRM execution. The DRM-processed package is a separate pending check below.

## Implemented

- Official `@elgato/streamdeck` 3.0.2 integration; registration, seven actions and output use SDK APIs.
- Standalone runtime bundle, lockfile-pinned CLI 1.10.2, Linux/Windows packaging CI and package artifact uploads.
- Server-side unpair and re-pair revocation, old-poll termination, state/command reset and trusted-context token storage.
- Consistent product title, reproducible project icons and bundled runtime license notices.
- English/Korean store text and permission explanations in [store assets](../store-assets/listing.en.md).
- Standard `ws` SDK test server, explicit error/close handling, normal close-handshake assertions and child-process diagnostics; cleanup waits for child stdio closure on Windows.
- Language-independent album art status codes localized by Chrome, and Track Dial multi-tick handling capped at five skips per event.

## Baseline local automated evidence (0.5.1)

Run the commands in [development](development.md) against the exact release commit. The 0.5.1 baseline was checked on Linux with Node.js 24.19.0 and CLI 1.10.2:

- Syntax, manifest/resources, versions, translations and basic accidental-secret checks.
- 40 passing Node regression tests, including standalone SDK key/dial/inspector/settings/rendering tests and opaque-manifest fixtures, all album art status translations, and track dial direction/count/burst/invalid-input coverage.
- Authentication tests for unpair/re-pair, pending polls, old commands, restart persistence, storage access failure and offline retry.
- 2 passing Python packaging boundary/notice tests.
- Official Stream Deck CLI validation and `.streamDeckPlugin` generation, and Chrome ZIP generation.
- `npm audit`: zero reported vulnerabilities in the locked dependency graph.

The opaque-manifest fixture only tests the SDK's handling of a non-JSON manifest. It does not reproduce Maker Console encryption.

## Installation and distribution update evidence

Local Linux checks on October 17, 2026 with Node.js 24.19.0 and Python 3.12.3:

- `npm run check` passed, including unchanged component versions at 0.5.1 and plugin UUID/runtime checks.
- All 46 Node tests passed (40 existing regressions plus six build metadata/checksum tests). Local TCP/WebSocket integration tests required execution outside the sandbox, which blocks loopback listeners.
- Both Python packaging tests passed; both actual packages were generated and the official Stream Deck validator passed.
- Release checksum generation and verification passed on those packages. Regression tests reject missing/empty/stale assets, unexpected files, malformed inventories and corrupted downloads.
- `npm audit` reported zero vulnerabilities in the locked dependency graph.
- Local documentation links and section anchors were checked. Both installation guides cover all four methods and common pairing, updating, switching and removal procedures.

The revised workflows still require a successful Windows/Ubuntu GitHub run on the final commit. These local results do not replace the pending clean Windows installation, hardware, DRM or store evidence below.

## GitHub CI evidence

Verified on October 17, 2026: [CI run 38958092483](https://github.com/minjungw00/music-deck-bridge/actions/runs/38958092483) succeeded on both Ubuntu and Windows for `main` commit `59f9321` (`59f932186ebc88823fdf54c62709ad8ba9922f75`). Both job logs and uploaded artifact metadata were checked.

| Automated check | Ubuntu | Windows |
| --- | --- | --- |
| Syntax, manifests, resources, versions, locales and basic secret checks | Passed | Passed |
| Node regression tests | 40/40 passed | 40/40 passed |
| Python packaging tests | 2/2 passed | 2/2 passed |
| `npm audit` | 0 reported vulnerabilities | 0 reported vulnerabilities |
| Chrome extension ZIP generation | Passed | Passed |
| Elgato CLI validation and `.streamDeckPlugin` packaging | Passed | Passed |
| Package artifact upload | `packages-ubuntu-latest` uploaded | `packages-windows-latest` uploaded |

These results supersede the Windows failure in baseline [CI run 38956429342](https://github.com/minjungw00/music-deck-bridge/actions/runs/38956429342) for `eb137f6`, where both SDK round trips failed with `read ECONNRESET`. The passing run includes the standard `ws` test server and connection shutdown fixes. `npm audit` covers the locked npm dependency graph only.

Automated checks are complete for `59f9321`; Windows hardware, store-installed packages and Maker Console DRM execution remain unverified. Both OS jobs and their package uploads must pass again for the final release commit, and the resulting packages must be inspected and tested before publication.

## Required manual evidence

| Check | Status | Evidence to record |
| --- | --- | --- |
| Final release commit CI and package inspection | Recorded per release | See the v1.0.0 release notes for the final commit SHA, successful Windows/Ubuntu run, package inspection and SHA-256 hashes |
| Clean Windows 10/11 install, uninstall and reset | Pending beyond reported Release install/upgrade | GitHub Release installation, normal operation, manual verification and 0.5.1.0 → 1.0.0.0 upgrade passed as reported above. A PC without separately installed Node.js/npm/Python, uninstall/reset, environment details and explicit profile/auth retention still need evidence. |
| All seven actions on actual keys and Stream Deck + dials | Pending | Device models, playback/artwork/title modes, volume steps, touch/push results; confirm the web player processes all 1–5 Track Dial skips per event in both directions |
| Chrome unpacked and store-package install | Pending | First pairing, reload/update, browser restart, normal tab and installed app |
| Idle recovery and port changes/conflicts | Pending | Sleep/reconnect and old-port grace behavior; retry after failed unpair |
| Actual Maker Console DRM build | Pending | Upload with publishing disabled, download processed build, install and exercise all actions |
| Private vulnerability reporting | Rechecked: disabled | Public GitHub API again returned `enabled: false` on October 17, 2026; maintainer must enable and verify the private reporting entry point |
| Secret scanning and push protection | Unverified | Maintainer verifies repository settings and reviews repository history |
| Store screenshots and promotional images | Pending | Actual en/ko popup, Now Playing, settings and dial captures; current store image specifications |
| Store declarations, public privacy link and final listing | Pending | Review [English](../store-assets/listing.en.md)/[Korean](../store-assets/listing.ko.md) copy against final build and current forms |
| Elgato Marketplace public install URL | Pending approval/publication | Verify the product URL and plugin install before activating it in README and both installation guides |
| Chrome Web Store public install URL | Pending approval/publication | Verify the product URL and extension install independently; test removal of the unpacked extension and new PIN pairing |

## Screenshot capture plan

Use a clean Windows profile and dummy listening details. Capture each image from the running product; do not present mockups as device evidence.

1. Chrome popup in English and Korean: pairing controls and connected status, with PINs and personal details concealed.
2. Stream Deck action grid: Now Playing artwork, playback buttons and mute, using artwork you have permission to publish in store screenshots.
3. Stream Deck +: visible volume percentage and track dial feedback, plus the 1–5 point step setting.
4. Action settings in English and Korean: title display mode and connection status. Hide live PINs, tokens and local identifying details.
5. Verify current store dimensions and export the requested screenshot and promotional formats into the relevant store-assets subdirectory.

For workflow-based draft releases, complete the checks described by the readiness input before confirming it. The maintainer requested direct GitHub publication of 1.0.0; use the exact tagged commit's successful Windows/Ubuntu CI packages, inspect both components and verify SHA-256 hashes before publication. Record the CI run and package hashes in the release notes. This GitHub release does not complete the pending hardware, Maker Console DRM or store checks, and does not submit either component to a store.
