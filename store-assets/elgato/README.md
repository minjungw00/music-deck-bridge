# Elgato submission assets

Keep product screenshots and store artwork here.

Submission status: **v1.0.1 uploaded, Pending review**, reported by the maintainer on October 17, 2026. The submitted file hash and Console product/version ID were not supplied; do not infer them from a local development build. No public product install URL is recorded. After approval and publication, verify the actual product URL and add it to README and both installation guides. Track this independently of the Chrome Web Store listing; until then use the [package installation guide](../../docs/installation.en.md).

- Use publisher UUID `io.github.minjungw00.musicdeckbridge` and confirm supported device models.
- Capture Now Playing artwork, key controls, Stream Deck + dial feedback and settings/PIN flow in English and Korean.
- Use the prepared [English](../listing.en.md) / [Korean](../listing.ko.md) text; verify it against the submitted build.
- Check current Maker Console image specifications and SDK/DRM requirements before export.
- Use the magenta 1.0.1 representative icons from `streamdeck/generate_assets.py`; see the [brand guide](../../docs/branding.md). Retain the project and bundled-library notices.
- Record hardware and Maker Console DRM results in [release readiness](../../docs/release-readiness.md).
- Do not use the automated opaque-manifest fixture as evidence of actual DRM compatibility.

See the [shared submission status and actual screenshot plan](../README.md).

## Prepared exports and remaining media

`app-icon.png` is the reproducible 288×288 PNG export of the unchanged main v1.0.1 brand. The [current product guidelines](https://docs.elgato.com/guidelines/products/) specify a 288×288 app icon, 1920×960 PNG thumbnail/gallery images and at least three gallery items. These dimensions were checked on October 17, 2026; review the actual Console fields when submitting media.

The supplied [README thumbnail](../../docs/assets/music-deck-bridge-thumbnail.png) remains its original 1672×941 size. It is promotional artwork and is not a ready-sized 1920×960 store export or an actual product capture. Actual key/dial, settings and PIN-flow screenshots are still needed in this repository.

The 28 redesigned action assets are **Unreleased** and are not part of the pending-review v1.0.1 submission. Prepare any future revised package as a separate version with its own CI, hashes and manual/DRM evidence. Leave the existing submission and public release files intact. Download the existing Console version's processed package for the [DRM test](../../docs/verification/marketplace-drm.md) when available.
