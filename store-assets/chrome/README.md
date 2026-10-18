# Chrome Web Store submission assets

Keep extension screenshots and promotional images here.

## Upload files

Use the files in [listing/](listing/) for the Chrome Web Store upload fields:

| Field | File | Dimensions |
| --- | --- | --- |
| Store icon | [icon-128.png](listing/icon-128.png) | 128 × 128 |
| English screenshot | [screenshot-en-1280x800.png](listing/screenshot-en-1280x800.png) | 1280 × 800 |
| Korean localized screenshot | [screenshot-ko-1280x800.png](listing/screenshot-ko-1280x800.png) | 1280 × 800 |
| Small promotional tile, required | [promo-small-440x280.png](listing/promo-small-440x280.png) | 440 × 280 |

Upload the English screenshot to the English/default listing and the Korean screenshot to the Korean localized listing. The promotional tile is shared across locales and contains no text. The icon has a 96 × 96 artwork area inside a transparent 16px border. Screenshots and the promotional tile are opaque RGB PNGs; screenshots fill the canvas with square outer corners.

The screenshots combine the approved **1.1.1** popup rendering with the actual Stream Deck capture, both at native pixel dimensions, and state that the companion plugin is required. The popup uses sample playback data. Export verification and source hashes are recorded in the [Chrome store image record](../../docs/verification/chrome-store-images-2026-10-18.md).

## Images adapted from Marketplace

These alternative exports in [cross-store/](cross-store/) reuse the Marketplace designs at Chrome Web Store resolutions:

| Upload field | File | Dimensions |
| --- | --- | --- |
| English screenshot — keys | [from-elgato-gallery-01-keys-1280x800.png](cross-store/from-elgato-gallery-01-keys-1280x800.png) | 1280 × 800 |
| English screenshot — dials | [from-elgato-gallery-02-dials-1280x800.png](cross-store/from-elgato-gallery-02-dials-1280x800.png) | 1280 × 800 |
| English screenshot — pairing | [from-elgato-gallery-03-pairing-1280x800.png](cross-store/from-elgato-gallery-03-pairing-1280x800.png) | 1280 × 800 |
| Alternative small promotional tile | [from-elgato-thumbnail-small-440x280.png](cross-store/from-elgato-thumbnail-small-440x280.png) | 440 × 280 |
| Optional marquee promotional tile | [from-elgato-thumbnail-marquee-1400x560.png](cross-store/from-elgato-thumbnail-marquee-1400x560.png) | 1400 × 560 |

The three English screenshots can accompany the original English screenshot, within the five-screenshot limit. Choose one small promotional tile for that upload field; the marquee uses its own optional field. Keep [icon-128.png](listing/icon-128.png) as the store icon: both designs share the same brand. See the [adaptation record](../../docs/verification/cross-store-images-2026-10-18.md) for source mapping and checks.

## Source images and submission

The selected popup images are [English](screenshots/popup-en.png) and [Korean](screenshots/popup-ko.png), rendered from version **1.1.1** with sample data. Use these canonical sources for product media. See the [shared image inventory](../README.md#official-product-images) for provenance and selection.

The listing icon and promotional tile use the existing magenta main mark and action icons. Packaged extension icons remain in `chrome-extension/icons/`. See the [brand guide](../../docs/branding.md) for palette, size and reproduction details.

Record the submitted version, ZIP hash, listing identifier and review result in [release readiness](../../docs/release-readiness.md). After approval and publication, verify the actual product URL and add it to README and both installation guides independently of Marketplace. Test switching from the unpacked extension with removal and new PIN pairing; until then use the [unpacked installation guide](../../docs/installation.en.md).

- Capture English and Korean pairing/status screens without real PINs, tokens or personal listening details.
- Use the prepared [English](../listing.en.md) / [Korean](../listing.ko.md) descriptions and permission explanations; verify them against the submitted ZIP.
- Declare each permission and reconcile store data-use answers with `PRIVACY.md` and the submitted version.
- Confirm support/privacy URLs, current screenshot/promotional dimensions and artwork rights.
- Submit the Chrome ZIP with `manifest.json` at its root, rather than the repository ZIP.

See the [shared submission guide and screenshot plan](../README.md).

## Media requirements

The [Chrome listing instructions](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) require a 128×128 store icon, at least one screenshot (up to five), and a 440×280 small promotional tile. The detailed [image guide](https://developer.chrome.com/docs/webstore/images) accepts 1280×800 or 640×400 screenshots and prefers 1280×800. The 1400×560 marquee tile is optional; an adapted export is available above.

Before submission, confirm that the screenshots match the submitted ZIP and the listing/privacy declarations. The smaller images in `screenshots/` are source previews; upload the correctly sized files in `listing/`.

## Regenerate exports

With repository dependencies and Playwright Chromium installed, run from the repository root:

```sh
node scripts/render-chrome-store.mjs
```

The script composes the approved source PNGs and existing brand artwork without starting the bridge or reading credentials. It writes only the four listing PNGs. `CHROME_STORE_BROWSER` can select an existing Chromium executable; `CHROME_STORE_FONT_DIR` can supply local Windows Segoe UI/Malgun Gothic fonts. Fonts are used temporarily for rendering and are not distributed. Refresh the approved popup source images when preparing media for a newer version.

Regenerate the five Marketplace-derived alternatives with the source design's renderer:

```sh
node scripts/render-elgato-store.mjs --for chrome
```

That command uses `ELGATO_STORE_BROWSER` / `ELGATO_STORE_FONT_DIR` and writes only `chrome/cross-store/`.
