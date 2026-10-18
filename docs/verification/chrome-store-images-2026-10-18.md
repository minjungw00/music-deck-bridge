# Chrome Web Store image exports

Evidence date: October 18, 2026 (Asia/Seoul). The maintainer requested submission icons and screenshots at Chrome Web Store resolutions. Four PNGs are exported under `store-assets/chrome/listing/`; the required small promotional tile is included with the icon and two localized screenshots.

## Requirements and upload mapping

The official [listing instructions](https://developer.chrome.com/docs/webstore/cws-dashboard-listing#graphic-assets) and [image guide](https://developer.chrome.com/docs/webstore/images) were checked on the evidence date. They specify a 128×128 PNG icon, screenshots at 1280×800 or 640×400 (1280×800 preferred), and a required 440×280 promotional tile. The optional 1400×560 marquee is outside this set. Screenshots are localized; the small promotional tile is shared across locales.

See the [upload guide](../../store-assets/chrome/README.md#upload-files) for field-to-file mapping. Source popup PNGs at 435×678 are retained as previews and are not the store-sized uploads.

## Source and rendering provenance

- The main mark and four playback/volume glyphs come from the existing project brand/action PNGs. The 128px listing icon places the brand in a 96px square artwork area with a transparent 16px border.
- Both screenshots compose the approved stable **1.1.1** popup rendering with the actual Stream Deck capture from the [official source inventory](official-images-2026-10-18.md). The popup is sample playback data; the Stream Deck view is the maintainer's capture. The screenshots label that distinction and the companion-plugin requirement.
- The popup (435×678) and Stream Deck capture (658×513) are placed at native pixel sizes without stretching or resampling. A rounded card clips only the capture's blank outer corners. The canonical input files are unchanged.
- The 440×280 promotional tile uses only existing project brand/action artwork and geometric decoration, without locale-specific text or album imagery.
- `scripts/render-chrome-store.mjs` renders HTML/CSS compositions in Chromium **156.0.8078.4**, device scale 1, without network requests, bridge startup or credential access. Local Windows Segoe UI/Malgun Gothic fonts are supplied for headings; no font files are redistributed.

## Verification

Both localized screenshots and the promotional tile were visually inspected. All four PNG headers have the required exact dimensions, 8-bit channels and no interlacing. Screenshots/promo use opaque RGB (24-bit); the store icon uses RGBA (32-bit). Every icon pixel outside the 96px artwork area is transparent. Both screenshots have square, opaque outer corners and no letterbox border; the composed popup/Stream Deck UI remains visible in full.

Decoded-pixel comparisons find zero differences between either composed popup and its original image, and zero differences throughout the Stream Deck image's interior, excluding only a 24px outer background margin affected by the rounded card corners. The actual controls and display pixels are preserved.

The approved source hashes remain unchanged: English popup `dc03291ee445b8f87965283a3eff11c8698c0a3315d16152106e260c0a9525d4`, Korean popup `5eb814f072f1ed1c55fb8827c62edc7b4357e96dfcf7a9f9ffec56f1c9d1f705`, Stream Deck capture `4837527e3940a5659f6c59c2b0227a521f336f138e8e602b8910a5c171c2a7c3`.

| File | Pixels | Bytes | SHA-256 |
| --- | --- | --- | --- |
| [icon-128.png](../../store-assets/chrome/listing/icon-128.png) | 128 × 128 | 9625 | `5f66d57c22f87be7c9186599a3e90a0dd2c5cd2c36b2473bfeb0046dd818f12f` |
| [promo-small-440x280.png](../../store-assets/chrome/listing/promo-small-440x280.png) | 440 × 280 | 57179 | `1e990b9f149d9264a13a60a08cc2674753d5787ac5cb8388cb58250ca6f3fb43` |
| [screenshot-en-1280x800.png](../../store-assets/chrome/listing/screenshot-en-1280x800.png) | 1280 × 800 | 309031 | `53001ef8c3745ba206088b28e493d1b37d57ef3179461da0aed79f664886f424` |
| [screenshot-ko-1280x800.png](../../store-assets/chrome/listing/screenshot-ko-1280x800.png) | 1280 × 800 | 302960 | `6c02ce29e9e5dca5c6e2c44a6c3718d7d778941780a97d2212788c5e108cf339` |

No application code, package versions, public release assets or existing store submission is changed by exporting these images. Final listing upload/privacy checks and Chrome Web Store review remain separate.
