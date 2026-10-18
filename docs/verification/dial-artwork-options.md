# Current Track Dial artwork options

Evidence date: October 18, 2026 (Asia/Seoul). The unpublished development cycle remains **1.0.2-dev**, with Stream Deck **1.0.2.0** and Chrome **1.0.2**. This change requires only the plugin package; the Chrome extension is unchanged.

## Behavior

In album-artwork mode, each Current Track Dial saves two additional settings:

| Setting | Values | Default |
| --- | --- | --- |
| `artworkFit` | `height`: show the full cover centered; `width`: fill the strip, cropping overflow | `height` |
| `artworkShowTitle` | Show or hide the song name in a black-backed bottom text band | `false` |

The custom layout has a 200 × 100 artwork pixmap, a separate centered 100 × 100 playback fallback and an optional text overlay. Validated cached PNG/JPEG/WebP data is embedded in an SVG with `meet` or `slice` aspect-ratio handling; no remote image reference is embedded. The native title text has an ellipsis overflow rule. Title-only changes do not retransmit the cover. Missing/loading/invalid images use the playback fallback; disconnection clears the old cover and title.

Both controls appear only when album artwork is selected. Existing actions retain full-image fitting and a hidden title. Layout sequencing and the action UUID remain unchanged. English/Korean settings and installation instructions describe these choices.

## Local verification

- `npm test`: **103 passed**, including per-dial fit/title options, title-only updates, cache/fallback handling, layout ordering, property-inspector visibility/defaults and actual SDK settings/reappearance messages on ordinary and opaque-manifest paths.
- `npm run check`: syntax, JSON/resources, locales, versions and basic secret checks passed.
- Python packaging tests: **2 passed**.
- Official Elgato CLI validation/packaging: passed, **62 plugin files**, including the updated custom layout.
- Chromium **156.0.8078.4** decoded the renderer's SVG using the actual square plugin icon as a raster fixture. Both outputs were 200 × 100 with an opaque center. At pixel `(10, 50)`, height fitting was transparent (alpha 0) and width fitting was opaque (alpha 255), confirming full-image margins versus filling/cropping without stretching. This temporary local fixture used no personal browser profile or YouTube Music session.

The layout uses the documented [Elgato layout properties](https://docs.elgato.com/streamdeck/sdk/references/layouts/): overlapping items have distinct `zOrder` values, and text/image enablement changes through feedback. Chromium verifies SVG rendering; it does not establish Stream Deck's physical rendering behavior.

## Remaining device checks

1. Replace the plugin with the new development build and select **Album artwork** on Current Track Dial.
2. Switch between height and width fitting. Confirm image proportions, central placement and cropping on the touch strip, including across track changes.
3. Enable/disable **Show song name**. Check Korean/emoji/long titles, readability, ellipsis and clearing when no player is available.
4. Use different settings on two dials, switch profiles and restart Stream Deck. Verify each choice is restored, then return to icon/name mode and check the existing controls.
