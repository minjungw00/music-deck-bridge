# Marketplace review preparation

Evidence date: October 17, 2026 (Asia/Seoul). The maintainer reports **v1.0.1 uploaded to Elgato Marketplace, Pending review**. This records work possible while review is pending; it does not establish approval or successful execution of a DRM-processed package.

Subsequent development on October 18 separates the toggle key's Play/Pause artwork and synchronizes its image with reported playback. See [current behavior and previews](../branding.md#action-icons). The 51-test/43-plugin-file measurements below describe the earlier preparation source; they do not cover this later change.

## Completed in the development source

- Root README uses the supplied 1672×941 thumbnail without altering its bytes. [Artwork provenance and checksum](../assets/README.md).
- All 28 action PNGs use the main brand's magenta circular badge, white symbols and dark surface; action-list exports remain monochrome. Now Playing uses the play-disc mark. [Action preview and palette](../branding.md#action-icons).
- The seven main v1.0.1 brand PNGs are byte-for-byte preserved. A reproducible 288px store app icon is prepared separately.
- Chrome popup colors and keyboard focus match the brand; white text on the deep-magenta primary button has approximately 4.98:1 contrast. Playback, protocol, PIN/authentication, UUIDs, common port and storage paths are unchanged.
- README, both installation guides and store/DRM records distinguish Elgato Pending review from Chrome preparation, actual DRM testing and public installation.
- Store image sizes were checked against the linked [Elgato](../../store-assets/elgato/README.md#media-requirements) and [Chrome](../../store-assets/chrome/README.md#media-requirements) requirements. The supplied README image is not a store-sized export or actual product screenshot.

## Automated evidence

Local WSL/Linux, Node.js 24.19.0, Python 3.12.3, Pillow 12.0.0 for regeneration, pinned Elgato CLI 1.10.2:

| Check | Result |
| --- | --- |
| Syntax, manifests, versions, resource paths, locales and basic secret checks | Passed |
| Node regression suite, including action palette/cutout/distinct-glyph checks | 51/51 passed |
| Python packaging tests, including all action icon/key bytes | 2/2 passed |
| PNG regeneration into a separate temporary directory | All 36 outputs match committed bytes |
| Main representative/category/Chrome PNG comparison with public v1.0.1 | All 7 unchanged |
| Chrome ZIP and official Stream Deck validation/packaging | Passed |
| Local package checksums | Generated and verified |
| Payload comparison with public v1.0.1 | Same 43 plugin / 14 Chrome paths; only 28 action PNGs and Chrome `popup.html` differ |
| npm audit | Zero reported vulnerabilities |
| Documentation links and anchors | Checked without missing local destinations |

Windows/Ubuntu CI must cover the exact preparation-branch commit, including packaging and source/hash metadata. Use the run attached to the branch in [CI](https://github.com/minjungw00/music-deck-bridge/actions/workflows/ci.yml) and match its full SHA; the historical release run does not validate these new assets. Downloaded development packages carry `BUILD-INFO.json` and must not be confused with the stable release sharing the current source version number.

GitHub API rechecks confirm private vulnerability reporting, secret scanning, push protection and Dependabot security updates remain enabled, with read-only default workflow tokens. Public v1.0.0/v1.0.1 release identities, asset IDs/update times/digests and annotated tag objects were rechecked unchanged. The [security record](../security-readiness.md) describes the existing limited secret-inspection scope.

## Still requires external evidence

The source artwork/popup changes are **Unreleased** and do not replace the already submitted package. No new version/tag/release, Marketplace resubmission or publication was performed. Select a version and complete the release checks before distributing a revised package.

The Console product/version identifier, uploaded-file hash, processing details and Publish after review setting were not supplied. The current Downloads installer matches the original public GitHub package and does not establish possession of a processed build. Download the processed file from the existing Console version when available, then complete the [DRM matrix](marketplace-drm.md).

Actual en/ko screenshots, detailed hardware checks, Chrome store migration, the blocked-rename owner and measured settings-preserving update/rollback remain open. Keep the protocol feature as a separate v1.1.0 candidate after the P0 evidence; no protocol code has been added during review preparation.
