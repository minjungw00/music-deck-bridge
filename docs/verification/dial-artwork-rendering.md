# Dial artwork proportions and configurable text

Evidence date: October 18, 2026 (Asia/Seoul). Development cycle remains **1.0.2-dev**, Stream Deck **1.0.2.0**, Chrome **1.0.2**. This is a plugin-only runtime change; the Chrome extension does not need replacement.

Follow-up: [full-width text and shared key options](track-text-layout.md) replace the dial's fixed 14-grapheme scroll window and add below/inline artist placement. The results below describe the earlier build; the image-fitting correction is retained.

## Reproduction and correction

The maintainer reported that both artwork fit choices stretched the image horizontally on the physical dial. The earlier [artwork-options verification](dial-artwork-options.md) checked Chromium rendering, which did not establish Qt rendering behavior.

With **Qt SVG 6.10.3**, the old SVG's embedded `image` element produced identical stretched output for `preserveAspectRatio="xMidYMid meet"` and `slice`. Its height-fitted square image was opaque at the left edge of the 200 × 100 viewport, rather than leaving a margin. This reproduces the reported symptom in a local Qt fixture; the installed Stream Deck's exact Qt version has not been identified.

The replacement reads the cached PNG/JPEG/WebP dimensions using bundled **image-size 2.0.4** and explicitly supplies an image rectangle with the original proportions:

- Height fit: scale by `100 / originalHeight`, then center horizontally/vertically.
- Width fit: scale by `200 / originalWidth`, then center horizontally/vertically.
- The SVG viewport stays 200 × 100 and clips overflow. For a square cover, the rectangles are `[50, 0, 100, 100]` and `[0, -50, 200, 200]` respectively.

The helper caches only the current cover's two variants. Text changes do not regenerate/resend the image. Corrupt headers, unsupported types and invalid dimensions fall back to the playback icon. The parser is pure JavaScript, bundled into the standalone plugin; no native binary or extra installation step is required. Its MIT license is included in the redistributed notices.

## Text controls

With **Show song name** enabled, each dial independently saves:

| Setting | Behavior | Default |
| --- | --- | --- |
| `artworkShowArtist` | Append ` — artist` after the title | false |
| `artworkTitleBackground` | Enable a black text background; otherwise transparent | false |
| `artworkTitleMode` | `truncate` uses native ellipsis; `scroll` scrolls left | truncate |

The artist/background controls and text-mode selector appear when artwork and its title are enabled. Title visibility still defaults to false. Scrolling shares the Current Track key's grapheme handling, 380 ms cadence and initial pause, with a 14-grapheme dial window. Track or relevant text-mode changes reset it. Scroll frames send text only; artist/name clear on disconnect. In information mode, existing playback controls/display behavior is retained.

## Verification

- `npm test`: **105 passed**, including independent fit/text settings, cache behavior, corrupt-image fallback, Unicode scrolling/reset/timer eligibility, inspector control visibility/defaults and settings restoration through real SDK/WebSocket messages (ordinary and opaque-manifest fixtures).
- `npm run check`: passed syntax, resources/JSON, locales, development-version consistency and basic secret checks.
- Python packaging tests: **2 passed**.
- `npm install --save-exact --ignore-scripts image-size@2.0.4`: audit reported **0 vulnerabilities** across 79 packages.
- Optional [Qt regression fixture](../../tests/rendering/dial_artwork_qt.py): **24 outputs passed**, generated square/landscape/portrait/wide fixtures in PNG/JPEG/WebP, each in both fit modes. A grid of output pixels matched an independently drawn proportional raster reference (tolerance 8 per channel). The same fixture verifies that the previous SVG reproduces identical stretched output in both modes.
- Official Elgato CLI layout validation and plugin packaging passed, with **62 files**, including the updated layout and bundled parser.

Run the Qt fixture with PySide6-Essentials available on the Python import path:

```sh
QT_QPA_PLATFORM=offscreen python3 tests/rendering/dial_artwork_qt.py
```

PySide6 is a local verification tool, not a plugin dependency or a default CI requirement. Layout properties follow the [Elgato layout reference](https://docs.elgato.com/streamdeck/sdk/references/layouts/); rendering is exercised using [Qt SVG's QSvgRenderer](https://doc.qt.io/qt-6/qsvgrenderer.html).

## Remaining physical-device checks

Install the new plugin development package. Verify both fit choices on the touch strip, including width-mode cropping without stretching. Enable the title and try artist/background on and off, long Korean/emoji text in both modes, two differently configured dials and settings restoration after profile switching/restart. Local Qt pixels and emitted SDK messages do not substitute for these device checks.
