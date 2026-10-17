# Release readiness

Last updated: October 18, 2026 (Asia/Seoul); the dated release/manual evidence below was collected on October 17 unless stated otherwise. Latest stable release: **v1.0.1** (Stream Deck **1.0.1.0**). Public v1.0.0/v1.0.1 tags and assets remain fixed. This page summarizes current evidence and remaining work; detailed historical results are retained below.

## Current evidence

| Verification category | Current result | Evidence / limits |
| --- | --- | --- |
| Release automation (Windows and Ubuntu) | Passed for public v1.0.1 source `a78f7de` | [CI run 39016914494](https://github.com/minjungw00/music-deck-bridge/actions/runs/39016914494): 50 Node tests, 2 Python tests, packaging, checksums, audit and artifact uploads. This is the released source's CI, not a run for later documentation commits. |
| Public packages | Checksums reverified; runtime unchanged from v1.0.0 | [v1.0.1 evidence](verification/v1.0.1.md); only manifest versions and seven brand PNGs differ. Current installed plugin payload matches all 43 public package files. |
| Developer installation/operation | Normal operation reported after file replacement/reinstallation guidance | General report only; detailed device/action/settings-retention measurements were not supplied. |
| Install over existing plugin | Four failures identified in real host logs | Host stops plugin, then cannot rename its directory (`Access is denied`). Process/permission responsible remains unknown. [Investigation](verification/update-installation.md). |
| Live directory-lock diagnostic | Complete plugin stop releases the observed lock | Windows DELETE-access probe: sharing violation 32 → success 0 while stopped → 32 after restart. SDK reconnected, developer-mode setting restored, 18 inventoried state files unchanged. [Scope and limits](verification/update-lock-diagnostics.md); direct package update still unverified. |
| File removal/reinstallation | Maintainer report plus later AllOk/SDK connection | Exact steps, before/after retention and backup rollback still need measured evidence. |
| Maker Console DRM | **Not tested** | [Actual processed-package checklist](verification/marketplace-drm.md); local packaging and opaque-manifest tests do not establish DRM compatibility. |
| GitHub security | Verified enabled | Private reports, secret scanning, push protection, Dependabot alerts/fixes; read-only default Actions token. [Security evidence and limited history/artifact inspection](security-readiness.md). |
| Store review/installations | Elgato v1.0.1 Pending review (maintainer report); Chrome preparation pending | [Submission status and actual screenshot plan](../store-assets/README.md). No public product install URLs activated. |

## Review preparation in development

The [supplied README thumbnail](assets/music-deck-bridge-thumbnail.png) is included unchanged. All seven action families now match the main icon; the new 288px Marketplace app icon, icon reproduction and asset/packaging checks support the next package. See [branding](branding.md#unreleased-action-family) and the [review-preparation checks and limits](verification/review-preparation.md). These source changes do not replace the v1.0.1 file currently in review.

October 18 development separates the toggle key into Play and Pause artwork driven by the selected player's reported playback state. Chrome-side changes, multiple visible keys, reappearance and offline fallback are exercised through the SDK round-trip fixtures; this is separate from installed-device and Maker Console DRM verification.

Local checks for that change passed: 52 Node tests, 2 Python packaging tests, all 38 PNG outputs reproduced byte-for-byte, and official Stream Deck validation/packaging (45 plugin files, including both pause PNG sizes). Windows/Ubuntu CI must match the source SHA of the development package selected for testing.

## Remaining work, in priority order

1. **P0 — update and recovery:** identify the blocked rename's owner/permissions in a controlled test; compare running/fully exited host installation, and measure retained PIN pairing, custom port, profiles and action settings before/after replacement and rollback. Follow the [English](installation.en.md#replacing-plugin-files) / [Korean](installation.ko.md#replacing-plugin-files) backup procedure. A v1.0.2 patch depends on evidence of a code defect.
2. **P0 — DRM:** download the processed v1.0.1 installer from the existing Pending review Console version when available, record its hash/environment and test installation, startup, Chrome/PIN, all seven actions and both dials. Keep update and removal/reinstallation results separate. Marketplace readiness remains pending until this passes.
3. **P1 — stores:** finish actual en/ko popup, action grid, artwork, settings/PIN and Stream Deck + captures; verify dimensions, supported models/software, public privacy link and final data-use declarations. Verify unpacked-to-Chrome-store migration and new pairing. Track the two stores' approvals/installations separately.
4. **P1 — v1.1.0 candidate, after the P0 gates:** design and implement separate plugin/extension versions and protocol compatibility checks. Test equal protocols, differing application versions, both old/new component directions and explicit incompatible-protocol update guidance; preserve PIN/auth, UUIDs, port and storage paths. Do not backport this feature into public v1.0.1. Playback commands/authentication remain unchanged; toggle image synchronization, new action artwork and Chrome popup colors are Unreleased development changes.
5. **P2 — remaining manual coverage:** record clean Windows install/uninstall/reset without separate Node/npm/Python, exact software/device/firmware versions, seven key/dial action results (including Track Dial 1–5 ticks), idle recovery, port conflict/change and normal-tab/PWA behavior. Run Windows/Ubuntu CI on each future code change and the final release source.

## Detailed verification records

- [v1.0.1 publication, package hashes and maintainer reports](verification/v1.0.1.md)
- [v1.0.0 publication and maintainer verification](verification/v1.0.0.md)
- [Pre-v1.0.0 automation and distribution history](verification/v0.5.1.md)
- [Update-installation investigation and redacted host evidence](verification/update-installation.md)
- [Marketplace DRM test record (not performed)](verification/marketplace-drm.md)

Documentation/evidence changes do not bump component versions. The Music Deck Bridge name, seven main v1.0.1 brand PNGs, Apache-2.0 license, plugin/action UUIDs, authentication, common port and storage paths remain unchanged. The redesigned action PNGs, state-linked toggle images and popup palette are Unreleased; the submitted and public v1.0.1 packages remain fixed. GitHub Releases, Actions, source builds and future store installs remain documented.
