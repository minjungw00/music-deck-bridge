# Current-track text width, artist placement and key options

Evidence date: October 18, 2026 (Asia/Seoul). The unpublished cycle remains **1.0.2-dev**, Stream Deck **1.0.2.0**, Chrome **1.0.2**. This change affects the plugin only.

## Corrected dial scrolling

The maintainer reported text appearing only in the left half of the artwork dial while scrolling. The native field already spans 200 px, but the previous implementation sent only 14 graphemes per frame. Narrow Latin glyphs did not fill that pixel area. The correction sends the full cyclic string and relies on native clipping at the field's boundary. Grapheme-safe stepping, the initial pause and 380 ms cadence remain; scroll frames update text without resending album artwork.

The [Qt text fixture](../../tests/rendering/track_text_qt.py) uses the real renderer's emitted feedback and the packaged layout's rectangles. In Qt **6.10.3**, a generated long Latin title previously ended at x=120. The replacement's initial and advanced frames reached x=199 in the same 200 px field. Separate title/artist rows reached x=198–199. This checks emitted text and a local Qt paint reference, not the installed host's exact native text renderer.

## Artist placement and matching key controls

- The artwork dial adds `artworkArtistPosition`: `inline` (default, preserving existing settings) or `below`. In below mode, `songTitleAbove` and `songArtist` are two native 200 × 26 text fields; the old combined `songName` field is disabled. Changing placement, hiding text, missing artist data and disconnect explicitly disable unused fields.
- The Now Playing key adds independent `showTitle` / `showArtist` (both true by default), `artistPosition` (`below` by default, or `inline`) and `titleBackground` (false by default). Existing `titleMode` values and action UUIDs are retained.
- The key retains native title rendering and the manifest's default bottom alignment / font size 10. Its optional background is a black band composited behind the native title onto the cached cover or bundled fallback icon. One-line and two-line variants are cached separately. With all text hidden, the original image is restored without a band.
- English/Korean property-inspector controls save choices per action. Artist-position controls appear when the corresponding artist is enabled; dial text controls additionally require artwork mode and its title enabled. Key and dial defaults preserve their earlier layouts.

## Local checks

- `npm test`: **111 passed**. Renderer fixtures cover full-width scroll strings, Unicode/reset behavior, inline/below switching, stale text clearing, independent key visibility, backdrop line counts, fallback/restoration and no repeated image transmission on scroll. Inspector fixtures check localized controls, defaults and conditional visibility. Real SDK/WebSocket fixtures check settings changes for both actions in ordinary and opaque-manifest paths, including bundled fallback image access.
- `npm run check`: syntax, resources/JSON, locales, development-version consistency and basic secret checks passed.
- Python packaging tests: **2 passed**.
- Optional Qt text/backdrop fixture: passed the old-window reproduction, six active text-field/frame width checks and both key background variants. No personal browser profile or external service is used.
- Official Elgato CLI validation/packaging: passed, **62 files**, including the updated five-item custom layout and bundled background helper.

Run the optional pixel fixture with PySide6-Essentials available:

```sh
QT_QPA_PLATFORM=offscreen python3 tests/rendering/track_text_qt.py
```

The field configuration follows the [official Elgato layout reference](https://docs.elgato.com/streamdeck/sdk/references/layouts/). Earlier image-fit evidence remains in the [Qt artwork rendering record](dial-artwork-rendering.md).

## Device retest

1. On an artwork dial, select scrolling with a long English title and verify that text occupies the full strip width, then check Korean/emoji text.
2. Enable artist display and switch between below/inline while scrolling and truncating. Check that switching back, disabling artist/title and losing the player clears unused rows.
3. On the Now Playing key, independently toggle song/artist visibility, switch artist position, and enable/disable the background with a cover and fallback icon. Check the black band behind the default bottom-aligned title and removal when all text is hidden.
4. Use different settings on several keys/dials, change profiles and restart Stream Deck. Verify restored settings and existing play/pause/rotation controls.

These physical-device checks remain pending; local pixel/SDK tests do not establish their completion.
