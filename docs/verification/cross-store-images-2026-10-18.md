# Images adapted for both stores

Evidence date: October 18, 2026 (Asia/Seoul). The maintainer requested that the image designs used for one store also be available for the other. Seven additional PNGs are generated under the destination store's `cross-store/` directory. Existing upload files remain unchanged.

## Design and field mapping

- Marketplace's three gallery designs become **1280×800** English Chrome screenshots. Its thumbnail becomes a **440×280** small promotional tile and an optional **1400×560** marquee tile.
- Chrome's English screenshot becomes a **1920×960** Marketplace gallery image. Its text-free promotional design becomes a separate **1920×960** alternative thumbnail.
- Both stores use the same brand. Existing destination icons remain the correct exports: [Chrome 128px](../../store-assets/chrome/listing/icon-128.png) and [Marketplace 288px](../../store-assets/elgato/listing/app-icon-288.png).
- Marketplace requires English explanatory text, so that destination uses the English popup. The Korean version remains available for Chrome localization.

The [Chrome image requirements](https://developer.chrome.com/docs/webstore/images) and [Marketplace product guidelines](https://docs.elgato.com/guidelines/products/) were rechecked on the evidence date. Use the destination [Chrome](../../store-assets/chrome/README.md#images-adapted-from-marketplace) or [Marketplace guide](../../store-assets/elgato/README.md#images-adapted-from-chrome-web-store) to select screenshot versus promotional fields and retain the required gallery count.

## Rendering and verification

The source renderer accepts `--for chrome` or `--for elgato` to write the other store's additional assets. Layouts reflow headings, annotations and image positions for each canvas; the complete source PNG is not stretched or letterboxed. Companion-component wording follows the destination product. The small promotional tile omits the secondary footer to keep its text readable.

The actual **658×513** Stream Deck capture and **435×678** sample-data English popup are reused at native pixel dimensions. Pixel comparisons find zero differences for the full popup and the device capture's interior, excluding only the outer 24px background margin affected by rounded card corners. These remain the approved [source images](official-images-2026-10-18.md), not new live-service or hardware captures.

Chromium **156.0.8078.4**, device scale 1, rendered the layouts offline with temporary Windows Segoe UI/Malgun Gothic fonts. No font files are redistributed. All seven outputs were visually inspected and verified as 8-bit opaque RGB PNGs at their named resolutions. Text fits within each canvas.

Both original renderer commands were rerun without flags, and every existing `listing/` file remained byte-identical. Application sources/version manifests and the canonical source PNGs are unchanged.

| Destination / file | Pixels | Bytes | SHA-256 |
| --- | --- | --- | --- |
| [chrome/cross-store/from-elgato-gallery-01-keys-1280x800.png](../../store-assets/chrome/cross-store/from-elgato-gallery-01-keys-1280x800.png) | 1280 × 800 | 354730 | `ada2adac2370450d3ae6bfe763968549ae285959112243de2559e32ee1e0dcdd` |
| [chrome/cross-store/from-elgato-gallery-02-dials-1280x800.png](../../store-assets/chrome/cross-store/from-elgato-gallery-02-dials-1280x800.png) | 1280 × 800 | 358393 | `0a6e5ad25747e08dc8e24a92480615d558fffad7a7305f030d09ceafc9b5f35f` |
| [chrome/cross-store/from-elgato-gallery-03-pairing-1280x800.png](../../store-assets/chrome/cross-store/from-elgato-gallery-03-pairing-1280x800.png) | 1280 × 800 | 316447 | `a637693dd7784ccb0d07ab026b31ffa02f566a7416932fdb91a1c9040b408cab` |
| [chrome/cross-store/from-elgato-thumbnail-marquee-1400x560.png](../../store-assets/chrome/cross-store/from-elgato-thumbnail-marquee-1400x560.png) | 1400 × 560 | 281486 | `270ae37a34425fe78df23d0f36b03dcc1078ba77f20a221009a9b0fadf43ab15` |
| [chrome/cross-store/from-elgato-thumbnail-small-440x280.png](../../store-assets/chrome/cross-store/from-elgato-thumbnail-small-440x280.png) | 440 × 280 | 65896 | `1086c59a9c9ec852fbfd3aa5e9a1d71afde8807ed8109303179e2ebd8b2d50ff` |
| [elgato/cross-store/from-chrome-promo-1920x960.png](../../store-assets/elgato/cross-store/from-chrome-promo-1920x960.png) | 1920 × 960 | 556607 | `d23ac4ae23177ac4dc472c9922a05600b01925bf08a808a2499e84b317a6ac9e` |
| [elgato/cross-store/from-chrome-screenshot-en-1920x960.png](../../store-assets/elgato/cross-store/from-chrome-screenshot-en-1920x960.png) | 1920 × 960 | 499245 | `f89eafd625a907f8d21bcc0136b00eecc4f3d4f0eea35a64cb82fb45981d3763` |

These are additional media choices. This preparation does not edit either store dashboard, resubmit packages or change the reported v1.1.1 review status. Refer to the [submission record](review-preparation.md) for that state and actual uploaded-file provenance.
