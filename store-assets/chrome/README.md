# Chrome Web Store submission assets

Use this guide to select Chrome upload files and regenerate exports. See the [shared submission workflow](../README.md#submission-workflow) for package/copy provenance and publication records.

## Upload files

Use the files in [listing/](listing/) for the Chrome Web Store upload fields:

| Field | File | Dimensions |
| --- | --- | --- |
| Store icon | [icon-128.png](listing/icon-128.png) | 128 × 128 |
| English screenshot | [screenshot-en-1280x800.png](listing/screenshot-en-1280x800.png) | 1280 × 800 |
| Korean localized screenshot | [screenshot-ko-1280x800.png](listing/screenshot-ko-1280x800.png) | 1280 × 800 |
| Small promotional tile, required | [promo-small-440x280.png](listing/promo-small-440x280.png) | 440 × 280 |

Upload the English screenshot to the English/default listing and the Korean screenshot to the Korean localized listing. The promotional tile is shared across locales and contains no text. The icon has a 96 × 96 artwork area inside a transparent 16px border. Screenshots and the promotional tile are opaque RGB PNGs; screenshots fill the canvas with square outer corners.

The screenshots combine the approved **1.1.1** popup rendering with the actual Stream Deck capture, both at native pixel dimensions, and state that the companion plugin is required. The popup uses sample playback data. Export verification and source hashes are recorded in the [image verification record](../../docs/verification/media.md).

## Images adapted from Marketplace

These alternative exports in [cross-store/](cross-store/) reuse the Marketplace designs at Chrome Web Store resolutions:

| Upload field | File | Dimensions |
| --- | --- | --- |
| English screenshot — keys | [from-elgato-gallery-01-keys-1280x800.png](cross-store/from-elgato-gallery-01-keys-1280x800.png) | 1280 × 800 |
| English screenshot — dials | [from-elgato-gallery-02-dials-1280x800.png](cross-store/from-elgato-gallery-02-dials-1280x800.png) | 1280 × 800 |
| English screenshot — pairing | [from-elgato-gallery-03-pairing-1280x800.png](cross-store/from-elgato-gallery-03-pairing-1280x800.png) | 1280 × 800 |
| Alternative small promotional tile | [from-elgato-thumbnail-small-440x280.png](cross-store/from-elgato-thumbnail-small-440x280.png) | 440 × 280 |
| Optional marquee promotional tile | [from-elgato-thumbnail-marquee-1400x560.png](cross-store/from-elgato-thumbnail-marquee-1400x560.png) | 1400 × 560 |

The three English screenshots can accompany the original English screenshot, within the five-screenshot limit. Choose one small promotional tile for that upload field; the marquee uses its own optional field. Keep [icon-128.png](listing/icon-128.png) as the store icon: both designs share the same brand. See the [adaptation record](../../docs/verification/media.md#export-checks) for source mapping and checks.

## Source images and submission

The selected popup images are [English](screenshots/popup-en.png) and [Korean](screenshots/popup-ko.png), rendered from version **1.1.1** with sample data. Use these canonical sources for product media. See the [shared image inventory](../README.md#official-product-images) for provenance and selection.

The listing icon and promotional tile use the existing magenta main mark and action icons. Packaged extension icons remain in `chrome-extension/icons/`. See the [brand guide](../../docs/branding.md) for palette, size and reproduction details.

Retain the submitted version, ZIP hash, listing identifier and review outcome in the [store record](../../docs/verification/stores.md). For unpacked-to-store migration, use the [switching procedure](../../docs/installation.en.md#switching-installation-methods) and record new-PIN coverage separately from normal operation.

- Capture English and Korean pairing/status screens without real PINs, tokens or personal listening details.
- Use the [submitted English](../submitted/v1.1.1/chrome-en.md) / [Korean](../submitted/v1.1.1/chrome-ko.md) descriptions as the revision baseline; see [permission guidance](../listing.en.md#permission-explanations) when preparing changes.
- Declare each permission and reconcile store data-use answers with `PRIVACY.md` and the submitted version.
- Submit the Chrome ZIP with `manifest.json` at its root, rather than the repository ZIP.

Use the [shared capture plan](../README.md#screenshot-capture-plan) for new screenshots.

## Media requirements

The [Chrome listing instructions](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) require a 128×128 store icon, at least one screenshot (up to five), and a 440×280 small promotional tile. The detailed [image guide](https://developer.chrome.com/docs/webstore/images) accepts 1280×800 or 640×400 screenshots and prefers 1280×800. The 1400×560 marquee tile is optional; an adapted export is available above.

Before submission, confirm that the screenshots match the submitted ZIP and the listing/privacy declarations. The smaller images in `screenshots/` are source previews; upload the correctly sized files in `listing/`.

## Regenerate exports

With repository dependencies and Playwright Chromium installed, run from the repository root:

```sh
node scripts/render-chrome-store.mjs
```

The script composes approved source PNGs and brand artwork into four listing PNGs without starting the bridge or reading credentials.

| Optional environment variable | Purpose |
| --- | --- |
| `CHROME_STORE_BROWSER` | Existing Chromium executable |
| `CHROME_STORE_FONT_DIR` | Local Windows Segoe UI/Malgun Gothic fonts |

Fonts are used temporarily and are not distributed. Refresh approved popup sources when preparing newer-version media.

Regenerate the five Marketplace-derived alternatives with the source design's renderer:

```sh
node scripts/render-elgato-store.mjs --for chrome
```

That command uses `ELGATO_STORE_BROWSER` / `ELGATO_STORE_FONT_DIR` and writes only `chrome/cross-store/`.
