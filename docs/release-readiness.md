# Release readiness

Evidence date: October 17, 2026. Source version is **1.0.0** for the maintainer-requested GitHub release. This records development checks and outstanding release work; it is not a store approval or hardware certification.

## 1.0.0 GitHub release

The maintainer requested a version change and GitHub release on October 17, 2026. Package and Chrome versions are 1.0.0; Stream Deck uses 1.0.0.0. Store copy now targets that source version. README and both installation guides use GitHub Releases as the default download route; store URLs remain inactive. The final commit must pass both CI platforms before release assets are selected. Manual evidence below remains outstanding unless a result is recorded.

Local checks for 1.0.0 passed: `npm run check`, all 46 Node tests, both Python packaging tests, and `npm audit` (zero reported vulnerabilities). The [v1.0.0 release notes](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.0.0) record the exact release commit, final Windows/Ubuntu CI run and package hashes after remote verification.

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
| Clean Windows 10/11 install, update, uninstall and reset | Partially reported; clean-PC evidence pending | The supplied installation plan reports a successful actual package install and normal operation, without OS/device versions, commit or hashes. Repeat on a Windows PC without separately installed Node.js/npm/Python; record OS, Chrome, Stream Deck/device versions, source run/commit, SHA-256 hashes, pairing/playback, reinstall/update/uninstall/reset results and profile/auth retention. This report does not complete hardware or DRM certification. |
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
