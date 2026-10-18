# Product image verification

Evidence date: October 18, 2026 (Asia/Seoul). The maintainer selected the actual Stream Deck capture and two popup renderings as official source images. Store upload inventories and regeneration commands are in the [Chrome](../../store-assets/chrome/README.md) and [Marketplace](../../store-assets/elgato/README.md) guides.

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
