# Release readiness

Evidence date: October 17, 2026. Release version is **1.0.1** (Stream Deck **1.0.1.0**); the previous stable release **1.0.0** is preserved. This records development checks and outstanding release work; it is not a store approval or hardware certification.

## 1.0.1 GitHub release

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
| Release SHA256SUMS.txt generation and verification | Passed for final CI packages, uploaded assets and public downloads |
| npm audit | 0 reported vulnerabilities |
| Final release Windows / Ubuntu CI and package downloads | Passed on `a78f7de`; [run 39016914494](https://github.com/minjungw00/music-deck-bridge/actions/runs/39016914494) |

Published on October 17, 2026: [v1.0.1 GitHub Release](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.0.1), marked as the latest stable release. The annotated tag resolves to release commit `a78f7de785b96aa9f5673bc41783e8d76f877933`. [Final CI run 39016914494](https://github.com/minjungw00/music-deck-bridge/actions/runs/39016914494) passed on both Windows and Ubuntu, including 50 Node tests, two Python tests, zero npm audit findings, official validation/packaging and artifact uploads.

The exact release commit's Windows packages were selected after both OS downloads passed original checksum inventories and source metadata checks. Their full package payloads match the operationally confirmed `de1a0e9` draft byte-for-byte. The final two-package inventory was verified before upload, after draft download, and again after **public release download**. The API confirmed `draft: false`, `prerelease: false` and latest version `v1.0.1`.

Public download hashes:

```text
ccaaf7233637ff5cf32f978e39145188b52f437fc1d5efdf22db60008bf1b49e  io.github.minjungw00.musicdeckbridge.streamDeckPlugin
c3693c05a62b41bc8b21572872489c7c56432397574113bd6113b00fde79032d  music-deck-bridge-chrome-1.0.1.zip
```

The original v1.0.0 tag object and all three release asset IDs/update timestamps were checked and remain unchanged. This publication record is maintained on `main` after release; the v1.0.1 source tag and published package files remain fixed.

Revised candidate evidence: [CI run 39016410622](https://github.com/minjungw00/music-deck-bridge/actions/runs/39016410622) passed on Windows and Ubuntu for commit `de1a0e9d8922288ab6c3412ce3d05a35ce3f6306`. Both jobs passed 50 Node tests, two Python packaging tests, npm audit (zero reported vulnerabilities), official validation/packaging and artifact upload. Both downloaded artifacts passed source metadata and original checksum verification. The Windows packages were uploaded to the draft and downloaded again for byte/checksum verification.

Initial candidate evidence (before the reference-style icon revision): [CI run 39015337447](https://github.com/minjungw00/music-deck-bridge/actions/runs/39015337447) passed on Windows and Ubuntu for commit `d89fa17f6a616ccafe4fc356790e1c5e8503ae72`. Both logs confirm 50 Node tests, two Python tests, zero npm audit findings, successful official validation/packaging and artifact upload. Both downloaded artifacts passed their original three-file checksum inventories and source metadata checks.

Both CI packages were compared against the published, checksum-verified v1.0.0 downloads. The only changed payload files are the component manifests (version fields only) and the seven representative/category brand PNGs. All other packaged runtime, action, property-inspector, locale and extension files match v1.0.0 byte-for-byte. This supports regression review; it does not establish actual device update/retention results.

Any later release commit, including documentation-only evidence changes, must pass both CI jobs again. The draft/final release notes record the exact selected commit, CI run and downloaded package hashes; use those hashes for manual installation evidence.

### Maintainer operational confirmation

After receiving the revised icons, updated draft packages and file replacement/reinstallation guidance, the maintainer reported **“정상 동작이 확인되었습니다.”** (“Normal operation was confirmed”) on October 17, 2026. This is the operational confirmation for publishing 1.0.1. The report does not change the earlier failed install-over-existing result into a success.

| Check | Recorded result | Scope |
| --- | --- | --- |
| Revised 1.0.1 installation and normal operation | Passed (maintainer operational report) | Confirmation follows the corrected file replacement/reinstallation guidance; exact steps were not restated |
| Combined plugin/Chrome playback operation | Passed (general maintainer report) | Detailed per-action/device results and component-version screenshots were not supplied |
| PIN authentication, custom port, action settings and profile retention | Not individually itemized | General normal operation was confirmed; do not invent separate retention measurements or a clean-reset test |
| Installed icon rendering | No issue reported with revised build | Native-size PNG/pixel review passed automatically/visually; detailed installed-UI captures were not supplied |
| Test environment and installed-copy hashes | Not supplied | Windows, Chrome, Stream Deck software/device/firmware versions and installed-copy hashes can be added when available |
| Public 1.0.1 release | Published and public downloads verified | Exact release commit, successful Windows/Ubuntu CI, payload comparison and SHA-256 hashes are recorded above and in the release notes |

The confirmed draft targeted `de1a0e9d8922288ab6c3412ce3d05a35ce3f6306`. Its published draft checksum inventory was:

```text
1438f064a4f09a54e6adfe90e589b0f9df326ccfafb50713d50db89da0e0075e  io.github.minjungw00.musicdeckbridge.streamDeckPlugin
397df9fbfb6474eb1bf238dfc31371f934b94d2a92b230f43d3d5b77f274fd1b  music-deck-bridge-chrome-1.0.1.zip
```

These identify the supplied draft, not an independently measured installed copy. Subsequent release-source changes recorded evidence and release status only. Final CI package payloads were verified against the confirmed draft byte-for-byte; archive hashes differ because ZIP metadata changed. Use the final public release hashes above for downloads.

Maker Console DRM, clean-PC/reset scenarios, detailed hardware coverage and each store approval remain separate checks. GitHub publication does not mark them complete.

## Reported candidate installation failure

The maintainer clarified the initial 1.0.1 draft test:

- Source: the **v1.0.1 draft Release**, not the latest stable 1.0.0 download. The initial draft targeted `1a6a71fb70fceebc7c60950d8bc8c742e59b1d0f`; a hash for the manually downloaded copy was not supplied.
- Method: double-clicked the new `.streamDeckPlugin` while the existing plugin files remained installed.
- Stream Deck displayed **“플러그인을 설치할 수 없습니다”** (“Unable to install plugin”). Existing actions then stopped and Chrome showed `Failed to fetch`.
- Fully restarting Stream Deck restored functionality, but the installed version remained the previous version. **The 1.0.1 install did not succeed.**
- The earlier 0.5.1.0 → 1.0.0.0 transition used removal of the old plugin files followed by reinstallation. It was not a verified install over existing files.

Assessment: the report identifies a host installation rejection, with the prior install recoverable by restart. Package validation, version ordering (1.0.0.0 < 1.0.1.0), UUIDs and payload inspection are valid; all packaged executable/extension files match 1.0.0. There is no demonstrated new-runtime regression to patch. The precise host rejection reason is **unconfirmed without installation logs**; do not claim every Stream Deck version universally prohibits package updates. Keep runtime code unchanged and correct the installation guidance instead. The revised icons change assets only.

The maintainer later confirmed normal operation after the revised draft and file replacement/reinstallation guidance, as recorded above. The original install-over-existing failure remains recorded; the exact host rejection reason is still unconfirmed. Keep authentication, configuration, profiles and Chrome identity when replacing plugin files.

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
| Stream Deck plugin transition 0.5.1.0 → 1.0.0.0 | Removal/reinstallation passed (maintainer clarification) | Old plugin files were removed before reinstallation; an install over existing files was not tested successfully |
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

This records the completed GitHub Release installation and removal/reinstallation transition without claiming a clean PC, every key/dial scenario, Chrome Web Store installation or Maker Console DRM execution. The DRM-processed package is a separate pending check below.

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
| Clean Windows 10/11 install, uninstall and reset | Pending beyond reported Release install/upgrade | GitHub Release installation, normal operation, manual verification and 0.5.1.0 → 1.0.0.0 removal/reinstallation passed as clarified above. A PC without separately installed Node.js/npm/Python, uninstall/reset, environment details and explicit profile/auth retention still need evidence. |
| All seven actions on actual keys and Stream Deck + dials | Pending | Device models, playback/artwork/title modes, volume steps, touch/push results; confirm the web player processes all 1–5 Track Dial skips per event in both directions |
| Chrome unpacked and store-package install | Pending | First pairing, reload/update, browser restart, normal tab and installed app |
| Idle recovery and port changes/conflicts | Pending | Sleep/reconnect and old-port grace behavior; retry after failed unpair |
| Actual Maker Console DRM build | Pending | Upload with publishing disabled, download processed build, install and exercise all actions |
| Private vulnerability reporting | Enabled and verified | Enabled October 17, 2026; API and public reporting entry checked. See [security verification](security-readiness.md). |
| Secret scanning and push protection | Enabled and verified | API confirms both enabled; Dependabot alerts/fixes also enabled. Limited local history/artifact inspection found no matches; scope in [security verification](security-readiness.md). |
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
