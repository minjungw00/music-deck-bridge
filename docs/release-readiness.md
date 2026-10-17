# Release readiness

Last updated: October 18, 2026 (Asia/Seoul); the dated release/manual evidence below was collected on October 17 unless stated otherwise. Latest stable release: **v1.0.1** (Stream Deck **1.0.1.0**). Public v1.0.0/v1.0.1 tags and assets remain fixed. This page summarizes current evidence and remaining work; detailed historical results are retained below.

The current **unpublished candidate is v1.0.2** (Stream Deck **1.0.2.0**), selected for the existing artwork, popup and state-linked toggle changes. Final candidate source `b35323c` passed both Windows and Ubuntu [CI run 39050170510](https://github.com/minjungw00/music-deck-bridge/actions/runs/39050170510), and both downloaded artifact inventories and metadata were verified. Its October 18 running-plugin update **failed**; a later developer-mode/official-stop retry **installed and started successfully with the same host running**. The maintainer reports normal operation with **Chrome 1.0.1**. Individual action/retention checks, Chrome 1.0.2 manual operation and rollback remain pending; the candidate does not include a confirmed fix for the original rename failure. See the [candidate scope and comparison status](verification/v1.0.2.md).

A third [running-plugin update with developer mode enabled](verification/update-procmon-direct-2026-10-18.md) passed at 02:58 after host restart and baseline reinstall. The [same fresh-baseline procedure in normal mode](verification/update-procmon-normal-2026-10-18.md) passed at 03:07 with the same host, including the old-root rename and all 45 installed candidate files. Developer mode and official stop are not universal requirements; the original denial's cause remains unknown.

The fifth PML then captures the entire explicit uninstall → public 1.0.1 installation/startup → running-plugin 1.0.2 update sequence at 03:12–03:13, all successful in normal mode. This corroborates an actual update over the running baseline rather than an empty-folder 1.0.2 installation; private-state retention remains separately unmeasured.

The [expected-behavior assessment](verification/update-behavior-assessment.md) classifies direct newer-version updating as the supported normal workflow and the earlier denial as an unresolved conditional installation failure. One-PC repeated tests and public procedural documentation do not establish population frequency or justify calling the failure rare. User guides now distinguish ordinary package updates from replacement/recovery.

## Current evidence

| Verification category | Current result | Evidence / limits |
| --- | --- | --- |
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

## Player launch and ratings development

Feature source `1da3a46` on `feat/player-launch-ratings` prepares source/Chrome 1.1.0 and plugin 1.1.0.0 with Open YouTube Music, Like and Dislike keys, launch fallback from playback inputs, and confirmed rating-state icons. This does not change the fixed 1.0.2 candidate or pending-review 1.0.1 submission. Local checks passed 67 Node tests, two Python tests, 54 reproducible PNGs and official validation/packaging (61 plugin files). Local test packages and exact hashes are in the [feature verification record](verification/player-launch-ratings.md). Windows/Ubuntu CI for this source and actual Chrome/Windows launch/rating operation remain pending; protocol-version negotiation is still separate work.

## Remaining work, in priority order

Latest launch/rating follow-up: source `926d349` prepares **1.1.1 / 1.1.1.0** with clarified reinstall pairing instructions, title-free control keys and original-input continuation after opening a missing player. Local checks pass 78 Node tests, two Python tests and official validation/packaging. The [1.1.1 record](verification/launch-continuation-v1.1.1.md) contains exact local package hashes and the outstanding Windows/Chrome manual matrix; no real-device execution or new store submission is claimed.

1. **P0 — update and recovery:** the fresh-baseline running-plugin comparison now succeeds with developer mode enabled and absent; retain the original failure and official-stop retry rather than repeating equivalent passing installs. Investigate the original host/folder or transient failing state using existing traces and capture handles/effective permissions/filter evidence if it recurs, before resetting that state. Measure retained PIN pairing, custom port, profiles and action settings before/after replacement and rollback; compare further scenarios where they resolve a specific uncertainty. Follow the [English](installation.en.md#replacing-plugin-files) / [Korean](installation.ko.md#replacing-plugin-files) backup procedure. No runtime fix for the original denial is established.
2. **P0 — DRM:** download the processed v1.0.1 installer from the existing Pending review Console version when available, record its hash/environment and test installation, startup, Chrome/PIN, all seven actions and both dials. Keep update and removal/reinstallation results separate. Marketplace readiness remains pending until this passes.
3. **P1 — stores:** finish actual en/ko popup, action grid, artwork, settings/PIN and Stream Deck + captures; verify dimensions, supported models/software, public privacy link and final data-use declarations. Verify unpacked-to-Chrome-store migration and new pairing. Track the two stores' approvals/installations separately.
4. **P1 — launch/rating feature verification:** run Windows/Ubuntu CI for the selected patch source and verify actual Chrome startup, existing tab/PWA reuse, completion of original inputs after launch, blank default titles, rating/cancellation and website-to-key state updates. Follow the [1.1.1 manual matrix](verification/launch-continuation-v1.1.1.md#remaining-manual-checks), including fresh-PIN recovery after extension reinstall, settings retention and real installed selectors.
5. **P1 — protocol compatibility, after the P0 gates:** design and implement separate plugin/extension versions and protocol compatibility checks. Test equal protocols, differing application versions, both old/new component directions and explicit incompatible-protocol update guidance; preserve PIN/auth, UUIDs, port and storage paths. The launch/rating development source does not implement this negotiation. Do not backport it into public v1.0.1 or the fixed v1.0.2 candidate.
6. **P2 — remaining manual coverage:** record clean Windows install/uninstall/reset without separate Node/npm/Python, exact software/device/firmware versions, all actions in the selected build (including Track Dial 1–5 ticks), idle recovery, port conflict/change and normal-tab/PWA behavior. Run Windows/Ubuntu CI on each future code change and the final release source.

## Detailed verification records

- [v1.1.1 launch continuation, pairing guidance and title removal](verification/launch-continuation-v1.1.1.md)
- [Player launch and song ratings: local 1.1.0 feature checks and remaining manual matrix](verification/player-launch-ratings.md)
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
