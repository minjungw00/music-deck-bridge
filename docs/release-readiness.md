# Release readiness

Last updated: October 18, 2026 (Asia/Seoul); the dated release/manual evidence below was collected on October 17 unless stated otherwise. Latest stable release: **v1.0.1** (Stream Deck **1.0.1.0**). Public v1.0.0/v1.0.1 tags and assets remain fixed. This page summarizes current evidence and remaining work; detailed historical results are retained below.

Latest maintainer confirmation: physical key/dial displays and settings restoration, actual Chrome/YouTube Music controls and pairing recovery, and update/settings retention/rollback are **complete**. The historical installation conflict could not be reproduced; its exact cause remains unconfirmed. See the [October 18 validation record](verification/maintainer-validation-2026-10-18.md). Earlier candidate/PML records below describe their own dated scope and do not reopen those completed checks.

The current **unpublished candidate is v1.0.2** (Stream Deck **1.0.2.0**), selected for the existing artwork, popup and state-linked toggle changes. Final candidate source `b35323c` passed both Windows and Ubuntu [CI run 39050170510](https://github.com/minjungw00/music-deck-bridge/actions/runs/39050170510), and both downloaded artifact inventories and metadata were verified. Its October 18 running-plugin update **failed**; a later developer-mode/official-stop retry **installed and started successfully with the same host running**. The maintainer reports normal operation with **Chrome 1.0.1**. Individual action/retention checks, Chrome 1.0.2 manual operation and rollback remain pending; the candidate does not include a confirmed fix for the original rename failure. See the [candidate scope and comparison status](verification/v1.0.2.md).

A third [running-plugin update with developer mode enabled](verification/update-procmon-direct-2026-10-18.md) passed at 02:58 after host restart and baseline reinstall. The [same fresh-baseline procedure in normal mode](verification/update-procmon-normal-2026-10-18.md) passed at 03:07 with the same host, including the old-root rename and all 45 installed candidate files. Developer mode and official stop are not universal requirements; the original denial's cause remains unknown.

The fifth PML then captures the entire explicit uninstall → public 1.0.1 installation/startup → running-plugin 1.0.2 update sequence at 03:12–03:13, all successful in normal mode. This corroborates an actual update over the running baseline rather than an empty-folder 1.0.2 installation; private-state retention remains separately unmeasured.

The [expected-behavior assessment](verification/update-behavior-assessment.md) classifies direct newer-version updating as the supported normal workflow and the earlier denial as an unresolved conditional installation failure. One-PC repeated tests and public procedural documentation do not establish population frequency or justify calling the failure rare. User guides now distinguish ordinary package updates from replacement/recovery.

## Current evidence

| Verification category | Current result | Evidence / limits |
| --- | --- | --- |
| Current-track key/dial controls and display (development) | Local Qt/SDK checks passed; maintainer device validation complete | [Dial controls](verification/current-track-dial.md), [proportional artwork](verification/dial-artwork-rendering.md), [text options](verification/track-text-layout.md), and [maintainer confirmation](verification/maintainer-validation-2026-10-18.md). |
| Player readiness/state feedback (development) | Local tests passed; maintainer actual-site/device validation complete | [Readiness implementation](verification/player-readiness-and-feedback.md) and [maintainer confirmation](verification/maintainer-validation-2026-10-18.md). |
| Browser connection/cold-tab recovery (development) | Local Node/Chromium checks passed; maintainer Chrome validation complete | [Recovery implementation](verification/browser-connection-recovery.md) and [maintainer confirmation](verification/maintainer-validation-2026-10-18.md). |
| Update/settings retention and rollback (development) | Complete by maintainer report; historical conflict not reproduced | [Confirmed scope and limits](verification/maintainer-validation-2026-10-18.md). No original-cause or runtime-fix claim. |
| Protocol compatibility (development) | Implemented; local HTTP, SDK, worker and actual Chromium fixtures passed | [Protocol evidence](verification/protocol-compatibility.md): independent identities, legacy-v1 support, update guidance, retained credentials and recovery. New-feature device check and final CI remain separate. |
| Release automation (Windows and Ubuntu) | Passed for public v1.0.1 source `a78f7de` | [CI run 39016914494](https://github.com/minjungw00/music-deck-bridge/actions/runs/39016914494): 50 Node tests, 2 Python tests, packaging, checksums, audit and artifact uploads. This is the released source's CI, not a run for later documentation commits. |
| Public packages | Checksums reverified; v1.0.1 runtime unchanged from v1.0.0 | [v1.0.1 evidence](verification/v1.0.1.md); only manifest versions and seven brand PNGs differ. Installed baseline matched all 43 public files before the later successful 1.0.2 retry. |
| Developer installation/operation | Normal operation reported after file replacement/reinstallation guidance | General report only; detailed device/action/settings-retention measurements were not supplied. |
| Install over existing plugin | Four historical host-log failures; exact v1.0.1 → v1.0.2 failure captured October 18 | PML confirms Node/console exit, root close and host DELETE-access open succeeding before the rename returns ACCESS DENIED. Responsible component remains unknown. [Actual trace](verification/update-procmon-2026-10-18.md), [historical investigation](verification/update-installation.md). |
| Official-stop installation retry | Installation/startup passed October 18 with host still running | [Second PML](verification/update-procmon-retry-2026-10-18.md): developer mode temporarily enabled, official stop handled, host recursively removes old folder and deploys same candidate; installer AllOk, SDK reconnected, all 45 installed files match 1.0.2.0. Developer setting restored. Detailed operation/retention and rollback remain pending. |
| Later running-plugin update | Installation/startup and old-root rename passed at 02:58 | [Third PML](verification/update-procmon-direct-2026-10-18.md): developer mode 1, new host and reinstalled baseline, no official stop; exact candidate installed. No isolated cause or universal fix established. |
| Normal-mode running-plugin update | Installation/startup and old-root rename passed at 03:07 | [Fourth PML](verification/update-procmon-normal-2026-10-18.md): same host as third, reinstalled baseline, developer mode absent, no official stop; all 45 candidate files match. Mode is not a universal prerequisite; the original failing state was not recreated. |
| Full sequential-install capture | Initial uninstall, 1.0.1 install and actual 1.0.1 → 1.0.2 update all passed at 03:12–03:13 | [Fifth PML](verification/update-procmon-normal-2026-10-18.md#fifth-trace-complete-installation-sequence): mode absent, baseline Node running until Update plugin, old-root rename and all 45 final file checks pass. Explicit uninstall is not measured retention/rollback. |
| v1.0.2 plugin operation | Normal operation confirmed by maintainer with Chrome **1.0.1** | [Report and scope](verification/update-procmon-retry-2026-10-18.md#maintainer-operational-confirmation). General operation of plugin 1.0.2.0; no separate itemized retention/rollback results or Chrome 1.0.2 manual test supplied. |
| Live directory-lock diagnostic | Complete plugin stop releases the observed lock | Windows DELETE-access probe: sharing violation 32 → success 0 while stopped → 32 after restart. SDK reconnected, developer-mode setting restored, 18 inventoried state files unchanged. [Scope and limits](verification/update-lock-diagnostics.md); direct package update still unverified. |
| File removal/reinstallation | Maintainer report plus later AllOk/SDK connection | Exact steps, before/after retention and backup rollback still need measured evidence. |
| Maker Console DRM | **Not tested** | [Actual processed-package checklist](verification/marketplace-drm.md); local packaging and opaque-manifest tests do not establish DRM compatibility. |
| GitHub security | Verified enabled | Private reports, secret scanning, push protection, Dependabot alerts/fixes; read-only default Actions token. [Security evidence and limited history/artifact inspection](security-readiness.md). |
| Store review/installations | Elgato v1.0.1 Pending review (maintainer report); Chrome preparation pending | [Review preparation](verification/review-preparation.md) and [screenshot plan](../store-assets/README.md#screenshot-capture-plan). No public product install URLs activated. |

## Review preparation in development

The [supplied README thumbnail](assets/music-deck-bridge-thumbnail.png) is included unchanged. All seven action families now match the main icon; the new 288px Marketplace app icon, icon reproduction and asset/packaging checks support the next package. See [branding](branding.md#action-icons) and the [review-preparation checks and limits](verification/review-preparation.md). These source changes do not replace the v1.0.1 file currently in review.

October 18 development separates the toggle key into Play and Pause artwork driven by the selected player's reported playback state. Chrome-side changes, multiple visible keys, reappearance and offline fallback are exercised through the SDK round-trip fixtures; this is separate from installed-device and Maker Console DRM verification.

Local checks for that change passed: 52 Node tests, 2 Python packaging tests, all 38 PNG outputs reproduced byte-for-byte, and official Stream Deck validation/packaging (45 plugin files, including both pause PNG sizes). Windows/Ubuntu CI must match the source SHA of the development package selected for testing.

## Current development version

Current source is **1.0.2-dev**, with fixed Chrome **1.0.2** and Stream Deck **1.0.2.0** manifest values. Ordinary fixes and test builds no longer advance a release number. See [versioning](versioning.md) for build identity, local development packaging and explicit release promotion. Public v1.0.1 and the earlier fixed v1.0.2 comparison candidate remain distinct from current development.

The [version-policy verification](verification/development-versioning.md) records 83 passing Node tests, two Python tests and successful dirty/clean local development builds with fixed version values.

The earlier 1.1.0/1.1.1 files were unpublished development builds whose labels were advanced incorrectly. Their exact test histories remain in the [launch/rating](verification/player-launch-ratings.md) and [continuation](verification/launch-continuation-v1.1.1.md) records; they are not released versions. Current development includes those functionality and pairing/title changes. The maintainer has now confirmed the Windows/Chrome feature checks complete.

## Remaining work, in priority order

1. **P0 — DRM:** obtain the processed installer from the existing Console version when available and validate installation, startup and controls. Marketplace DRM remains separate from the completed ordinary-package update/recovery checks.
2. **P1 — stores:** finish actual en/ko screenshots, supported models/software, public privacy link and data-use declarations. Verify unpacked-to-Chrome-store migration and new pairing. Track both stores independently.
3. **P1 — protocol deployment check:** install the new plugin/extension development pair and confirm explicit version/status and retained pairing. The implementation and local compatibility matrix now pass; this new feature is outside the earlier device sign-off.
4. **P2 — final release checks:** run Windows/Ubuntu CI for the final source and retain exact artifact identity. Complete clean-environment install/uninstall/reset and any remaining idle/port-conflict coverage outside the confirmed scope.

The original installation failure remains a conditional investigation only if it recurs. Existing traces are retained; no confirmed original cause or runtime fix is claimed.

## Detailed verification records

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
- [Expected update behavior, failure classification and limits of generalization](verification/update-behavior-assessment.md)
- [Marketplace DRM test record (not performed)](verification/marketplace-drm.md)

Documentation/evidence changes do not bump component versions. The Music Deck Bridge name, seven main v1.0.1 brand PNGs, Apache-2.0 license, plugin/action UUIDs, authentication, common port and storage paths remain unchanged. The redesigned action PNGs, state-linked toggle images and popup palette are selected for the unpublished v1.0.2 candidate; the submitted and public v1.0.1 packages remain fixed. GitHub Releases, Actions, source builds and future store installs remain documented.
