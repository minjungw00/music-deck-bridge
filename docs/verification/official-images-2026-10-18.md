# Selected official product images

Evidence date: October 18, 2026 (Asia/Seoul). The maintainer selected three images for official product media: the English and Korean popup renderings, and a newly supplied actual Stream Deck capture. The maintainer rejected the browser-rendered Stream Deck approximation for this use and explicitly authorized ordinary cropping tools to balance the real capture's margins.

## Canonical assets

| File | Dimensions | Provenance |
| --- | --- | --- |
| [Stream Deck +](../../store-assets/elgato/screenshots/stream-deck-plus.png) | 658 × 513 | Maintainer's actual capture, outer margins cropped only |
| [English popup](../../store-assets/chrome/screenshots/popup-en.png) | 435 × 678 | Unchanged selected rendering, sample track/connection data, displayed version 1.1.1-dev |
| [Korean popup](../../store-assets/chrome/screenshots/popup-ko.png) | 435 × 678 | Unchanged selected rendering, sample track/connection data, displayed version 1.1.1-dev |

The popup files supplied in the maintainer's image directory match the previously generated `dist/previews/prelude-bwv846/popup-en.png` and `popup-ko.png` byte-for-byte. Their rendering uses the actual extension UI with simulated responses; official selection does not turn them into live Chrome/YouTube Music verification. The Stream Deck capture does not embed a component version, so no exact installed version is inferred from its appearance.

## Stream Deck margin correction

The supplied `musicdeckbridge-screenshot.png` is **810 × 519**. Its background is opaque RGB **45, 45, 45**. Non-background UI bounds are **[123, 53, 685, 470)**, using left/top-inclusive and right/bottom-exclusive coordinates. Original left/top/right/bottom margins are **123 / 53 / 125 / 49 px**.

The selected image is the exact rectangle **[75, 5, 733, 518)** from the original, producing **658 × 513** with **48 px on all four sides** of the UI. A standard Canvas crop copied the existing pixels and exported PNG; no scaling, recoloring, content generation or UI reconstruction was applied. Pixel comparison verifies the output against that rectangle of the original. The supplied Windows original remains unchanged.

| Image | SHA-256 |
| --- | --- |
| Supplied Stream Deck original | `7188558f705b516c4b0f89f665374088121d824448b9f6ac6e8d8cb26b59ca56` |
| Selected cropped Stream Deck image | `4837527e3940a5659f6c59c2b0227a521f336f138e8e602b8910a5c171c2a7c3` |
| Selected English popup | `198f47708a67c2ff9afb7e7f4ab352124568498c972778a8b0edcb98d99af6bc` |
| Selected Korean popup | `4e77af580e882019817a6e6bba965e4a44bdb418831bceef871419402da6bd4e` |

## Use and limits

README and the store asset inventory reference these three canonical files. The earlier generated Stream Deck mockup remains a development preview and is not selected official media. These files are source images, not newly prepared store-dimension exports or evidence of store approval. Final-package capture/appearance matching remains part of submission preparation.

Visible album content identifies **Prelude No. 1 in C major, BWV 846**, performed by **Kimiko Ishizaka**, from [Bach: Well-Tempered Clavier, Book 1](https://kimikoishizaka.bandcamp.com/album/bach-well-tempered-clavier-book-1). The maintainer approved these images for use; this record does not add a new finding about the cover's reuse terms. Embedded third-party artwork is not relicensed by the project's Apache-2.0 code/icon license.

The development cycle remains **1.1.1-dev**. No application code, release assets, public tag or store submission is changed by selecting these images.
