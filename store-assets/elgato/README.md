# Elgato submission assets

Keep product screenshots and store artwork here.

## Upload files

Use the files in [listing/](listing/) for the Maker Console media fields:

| Field | File | Dimensions |
| --- | --- | --- |
| App icon | [app-icon-288.png](listing/app-icon-288.png) | 288 × 288 |
| Thumbnail | [thumbnail-1920x960.png](listing/thumbnail-1920x960.png) | 1920 × 960 |
| Gallery 1 — key controls | [gallery-01-keys-1920x960.png](listing/gallery-01-keys-1920x960.png) | 1920 × 960 |
| Gallery 2 — dial controls | [gallery-02-dials-1920x960.png](listing/gallery-02-dials-1920x960.png) | 1920 × 960 |
| Gallery 3 — Chrome connection | [gallery-03-pairing-1920x960.png](listing/gallery-03-pairing-1920x960.png) | 1920 × 960 |

Upload all three numbered gallery files in that order; the separate thumbnail does not replace a gallery item. All explanatory text is English, as required by Marketplace. The app icon is byte-identical to the canonical [app-icon.png](app-icon.png).

The galleries use the approved actual Stream Deck capture at native pixel dimensions. The Chrome connection image also includes the approved English **1.1.1** popup rendering, labelled as sample playback data. Sources, export checks and hashes are recorded in the [image verification record](../../docs/verification/media.md).

## Images adapted from Chrome Web Store

These alternative exports in [cross-store/](cross-store/) reuse the Chrome designs at Marketplace resolution:

| Upload field | File | Dimensions |
| --- | --- | --- |
| Additional gallery image — extension and Stream Deck | [from-chrome-screenshot-en-1920x960.png](cross-store/from-chrome-screenshot-en-1920x960.png) | 1920 × 960 |
| Alternative thumbnail — main mark and playback icons | [from-chrome-promo-1920x960.png](cross-store/from-chrome-promo-1920x960.png) | 1920 × 960 |

Choose a thumbnail and retain at least three gallery items when selecting a combination. Keep [app-icon-288.png](listing/app-icon-288.png) as the app icon: both designs share the same brand. Marketplace exports use English text and the English popup; the Korean popup remains a Chrome-localized image. See the [adaptation record](../../docs/verification/media.md#export-checks) for source mapping and checks.

## Source images and submission

Use the selected [Stream Deck + capture](screenshots/stream-deck-plus.png) for product media. Its outer margins are balanced without changing UI pixels. See the [shared image inventory](../README.md#official-product-images).

Record the submitted version, package hash, Console product/version ID, processing settings and review result in [release readiness](../../docs/release-readiness.md). After approval and publication, verify the actual product URL and add it to README and both installation guides. Track this independently of the Chrome Web Store listing; until then use the [package installation guide](../../docs/installation.en.md).

- Use publisher UUID `io.github.minjungw00.musicdeckbridge` and confirm supported device models.
- Capture Now Playing artwork, key controls, Stream Deck + dial feedback and settings/PIN flow in English and Korean.
- Use the [submitted English description](../submitted/v1.1.1/elgato-en.md) as the revision baseline; see [metadata and permission guidance](../listing.en.md) when preparing changes.
- Check current Maker Console image specifications and SDK/DRM requirements before export.
- Use the submitted version's magenta representative icons from `streamdeck/generate_assets.py`; see the [brand guide](../../docs/branding.md). Retain the project and bundled-library notices.
- Record hardware and Maker Console DRM results in [release readiness](../../docs/release-readiness.md).
- Do not use the automated opaque-manifest fixture as evidence of actual DRM compatibility.

See the [shared submission guide and screenshot plan](../README.md).

## Media requirements

The [product guidelines](https://docs.elgato.com/guidelines/products/) require a 288×288 PNG app icon, 1920×960 PNG thumbnail/gallery images, English text and at least three gallery items (up to ten). The prepared upload set includes the icon, a separate thumbnail and three gallery images. Review the actual Console fields when submitting media.

The root README shares the [1920×960 Marketplace thumbnail](listing/thumbnail-1920x960.png). The smaller image in `screenshots/` is the canonical capture source, not the sized gallery upload.

Download the selected Console version's processed package for the [DRM test](../../docs/verification/marketplace-drm.md). Match its hash and results to that submission, separately from local build checks.

## Regenerate exports

With repository dependencies and Playwright Chromium installed, run from the repository root:

```sh
node scripts/render-elgato-store.mjs
```

The script composes existing project artwork and approved capture PNGs without starting the bridge or reading credentials. It writes only the five listing PNGs. `ELGATO_STORE_BROWSER` can select an existing Chromium executable; `ELGATO_STORE_FONT_DIR` can supply local Windows Segoe UI fonts for rendering. No font files are distributed. Keep the approved popup source in sync when preparing media for a newer version.

Regenerate the two Chrome-derived alternatives with the source design's renderer:

```sh
node scripts/render-chrome-store.mjs --for elgato
```

That command uses `CHROME_STORE_BROWSER` / `CHROME_STORE_FONT_DIR` and writes only `elgato/cross-store/`.
