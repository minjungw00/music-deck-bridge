# Elgato submission assets

Keep product screenshots and store artwork here.

Use the selected [Stream Deck + capture](screenshots/stream-deck-plus.png) for product media. Its outer margins are balanced without changing UI pixels. See the [shared image inventory](../README.md#official-product-images).

Record the submitted version, package hash, Console product/version ID, processing settings and review result in [release readiness](../../docs/release-readiness.md). After approval and publication, verify the actual product URL and add it to README and both installation guides. Track this independently of the Chrome Web Store listing; until then use the [package installation guide](../../docs/installation.en.md).

- Use publisher UUID `io.github.minjungw00.musicdeckbridge` and confirm supported device models.
- Capture Now Playing artwork, key controls, Stream Deck + dial feedback and settings/PIN flow in English and Korean.
- Use the prepared [English](../listing.en.md) / [Korean](../listing.ko.md) text; verify it against the submitted build.
- Check current Maker Console image specifications and SDK/DRM requirements before export.
- Use the submitted version's magenta representative icons from `streamdeck/generate_assets.py`; see the [brand guide](../../docs/branding.md). Retain the project and bundled-library notices.
- Record hardware and Maker Console DRM results in [release readiness](../../docs/release-readiness.md).
- Do not use the automated opaque-manifest fixture as evidence of actual DRM compatibility.

See the [shared submission guide and screenshot plan](../README.md).

## Media requirements

`app-icon.png` is the reproducible 288×288 PNG export of the main brand. The [product guidelines](https://docs.elgato.com/guidelines/products/) specify a 288×288 app icon, 1920×960 PNG thumbnail/gallery images and at least three gallery items. Review the actual Console fields when submitting media.

The supplied [README thumbnail](../../docs/assets/music-deck-bridge-thumbnail.png) is 1672×941. Export a separate 1920×960 promotional image and capture key/dial, settings and PIN-flow screenshots from the submitted build.

Download the selected Console version's processed package for the [DRM test](../../docs/verification/marketplace-drm.md). Match its hash and results to that submission, separately from local build checks.
