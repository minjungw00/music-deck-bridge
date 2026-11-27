# Product image verification

Source/store evidence: October 18, 2026; development key-background evidence: November 13, 2026 (Asia/Seoul). The maintainer selected the actual Stream Deck capture and two popup renderings as official source images. Store upload inventories and regeneration commands are in the [Chrome](../../store-assets/chrome/README.md) and [Marketplace](../../store-assets/elgato/README.md) guides.

## Source provenance

| Source | Dimensions | SHA-256 |
| --- | --- | --- |
| [Actual Stream Deck + capture](../../store-assets/elgato/screenshots/stream-deck-plus.png) | 658×513 | `4837527e3940a5659f6c59c2b0227a521f336f138e8e602b8910a5c171c2a7c3` |
| [English popup](../../store-assets/chrome/screenshots/popup-en.png) | 435×678 | `dc03291ee445b8f87965283a3eff11c8698c0a3315d16152106e260c0a9525d4` |
| [Korean popup](../../store-assets/chrome/screenshots/popup-ko.png) | 435×678 | `5eb814f072f1ed1c55fb8827c62edc7b4357e96dfcf7a9f9ffec56f1c9d1f705` |

The 810×519 device original was cropped to `[75, 5, 733, 518)` using ordinary image tools explicitly authorized by the maintainer. UI bounds `[123, 53, 685, 470)` leave **48px on all four sides**; UI pixels were preserved. No exact installed component version is inferred from the capture.

The popup images render the actual stable **1.1.1** HTML/JavaScript/catalogs with simulated connected-state responses. Chromium 156.0.8078.4 and temporary Windows fonts were used; fonts are not redistributed. These are sample-data visuals, not live-service evidence. The browser-rendered device approximation was rejected for official media.

The displayed recording is *Prelude No. 1 in C major, BWV 846 — Kimiko Ishizaka*. The recording's [Bandcamp page](https://kimikoishizaka.bandcamp.com/album/bach-well-tempered-clavier-book-1) identifies a CC0 release; this does not independently establish the cover artwork's license. The maintainer selected the supplied capture for publication.

## Export checks

| Destination | Prepared formats |
| --- | --- |
| Chrome listing | 128×128 RGBA icon (96px mark, 16px transparent border), two 1280×800 RGB screenshots, 440×280 RGB promo |
| Marketplace listing | 288×288 RGBA app icon, 1920×960 thumbnail and three gallery images |
| Chrome cross-store alternatives | Three Marketplace designs at 1280×800; thumbnail designs at 440×280 and 1400×560 |
| Marketplace cross-store alternatives | English Chrome composite and text-free promo at 1920×960 |

All **16 export PNGs** were checked for dimensions/mode and visually inspected. Compositions preserve the source UI at native dimensions: pixel comparisons found zero popup differences and zero device-interior differences, excluding only the outer 24px blank margin affected by rounded card corners. Re-running the base renderers reproduced the committed exports without changing source images.

The [root README thumbnail](../../store-assets/elgato/listing/thumbnail-1920x960.png) shares the Marketplace export; SHA-256 `a985e3deb2b01353492b68a7c3ee2a0517b04a4ff6e83c0adb6389874caf25e1`. Regenerate via `node scripts/render-elgato-store.mjs`. Cross-store variants use the source renderer's `--for chrome` or `--for elgato` option.

These local files do not identify which media were uploaded. Actual submission provenance is tracked in [store submissions](stores.md); earlier per-export checksum inventories remain in Git history.

## November 28 1.3.0 Elgato gallery drafts

The initial, superseded gallery draft (`0ea98cf`) had three 1920 × 960 RGB PNGs. The artwork example used the plugin's key renderer, an original geometric cover, a sparse group with a blank position, width fitting, 15% gaps and an optional action icon. The inspector screenshot showed the same width and gap settings. The playback example used the packaged Repeat and Shuffle icons and the English Chrome preview at its native size. The dial example captured the bundled inspector in both display modes and rendered the artwork feedback from the plugin's touch-strip layout in Chromium. The inspector and popup used sample settings and playback data.

Separately, on Windows Stream Deck 7.6.1.23033 with build `394b941`, the existing Stream Deck Plus page showed one cover across six linked keys, along with the saved 31% volume and artwork/title on the Current Track Dial while no Music player was active. The original page was restored after capture. The native software capture was kept out of the gallery drafts because the cover's reuse terms were unverified. The capture establishes software preview output; physical key and touch-strip output require separate verification.

## November 28 revised 1.3.0 Elgato gallery

The [four revised gallery drafts](../../store-assets/drafts/v1.3.0/README.md) use the layout, background colors and typography of the [published Marketplace gallery](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd). The Stream Deck MK.2 and Stream Deck + product images come from [Elgato's device guide](https://www.elgato.com/us/en/explorer/products/stream-deck/which-stream-deck-should-you-get/). Packaged action icons and a newly drawn sample cover were composited onto the key displays. The linked example shows eight distinct crops of the same cover across the Stream Deck + keys.

The two Chrome popup panels were captured from the bundle's English UI with sample playback in paired and standalone modes. The YouTube Music panel uses cropped Chrome and YouTube Music UI from a designated Windows playback window with the same original cover and sample title composited into it. Account controls, bookmarks and the original album cover were kept outside the export. The four English RGB PNGs were checked at 1920 × 960 and visually reviewed against the published design.

## Development key backgrounds

On November 13, the 1.2.0-dev renderer changed 24 device key/state PNGs and their ten matching popup copies to full-canvas square dark backgrounds. Pillow 12.0.0 generated candidates in a separate temporary directory before application. Decoded central 75% rectangles, covering the disc and symbol, matched the preceding images exactly; all 26 other generated brand/store/monochrome assets matched byte-for-byte. Existing submitted media, source captures, published packages and earlier development folders were preserved.

An actual Chromium rendering of the cropped popup control row was byte-identical before/after the PNG replacement. The eight asset tests and two Python packaging tests passed, including opaque device-key corners, preserved monochrome/brand transparency, state glyphs, exact popup-copy equality and package bytes. This validates asset geometry and packaging; no physical keycap-radius match or new device operation is claimed.
