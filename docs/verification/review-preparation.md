# Marketplace review status and preparation

Last updated: October 18, 2026 (Asia/Seoul). The maintainer reports **v1.1.1 newly submitted to Elgato Marketplace and Pending review**. This replaces v1.0.1 as the current review target in project documentation. Approval, public availability and actual execution of a Console-processed package have not been reported.

## Distribution status

| Channel | Current state | Evidence |
| --- | --- | --- |
| GitHub | v1.1.1 published | [Release and package verification](v1.1.1.md) |
| Elgato Marketplace | v1.1.1 submitted, Pending review | October 18 maintainer report |
| Chrome Web Store | Preparation; no submission or public URL reported | [Submission guide](../../store-assets/chrome/README.md) |

Store approval and GitHub publication are independent. Keep the [release readiness summary](../release-readiness.md) as the entry point for current status and remaining work.

## Submission provenance

| Field | Value / status |
| --- | --- |
| Reported Marketplace version | 1.1.1; plugin numeric version 1.1.1.0 |
| Public reference source | Tag v1.1.1, commit `33b4757364e2e2c153cecc635027024662fffdbd` |
| Public reference installer SHA-256 | `ffe7a11c3965d5b7da1169afd16f8f20792c8ae4c9c18bed3234ba46c8750aca` |
| Actual uploaded-file hash | Not supplied; equality with the public reference is not independently established |
| Maker Console product/version ID and processing/publication settings | Not supplied |
| Processed installer and actual DRM execution | Not supplied / [not tested](marketplace-drm.md) |

The public reference hash identifies the GitHub package, not an independently inspected Marketplace upload or processed download. Earlier v1.0.1 preparation measurements are retained in the [historical record](review-preparation-v1.0.1.md).

## Completed preparation

- v1.1.1 is published with exact-source Windows/Ubuntu CI, official packaging and verified public package checksums. Protocol negotiation and the previously planned controls/display features are included in the released source.
- English and Korean official popup renderings now display plugin/extension **1.1.1**. The actual Stream Deck capture is retained unchanged. [Image sources and checksums](official-images-2026-10-18.md).
- README and the [store asset inventory](../../store-assets/README.md#official-product-images) use the canonical images. [English](../../store-assets/listing.en.md) and [Korean](../../store-assets/listing.ko.md) listing copy and the public privacy policy are available.
- [Chrome Web Store image exports](chrome-store-images-2026-10-18.md) provide the 128px store icon, English/Korean 1280×800 screenshots and required 440×280 promotional tile.
- [Marketplace image exports](elgato-store-images-2026-10-18.md) provide the 288px app icon, 1920×960 thumbnail and three English gallery images for key controls, dials and Chrome connection.
- Device/Chrome checks, settings retention and installation diagnosis remain linked from [release readiness](../release-readiness.md), with their original scope and dates.

## Remaining submission work

1. Track the v1.1.1 review result and record its Console version ID, uploaded-file hash and processing/publication settings when available.
2. Download and test that version's Console-processed installer using the [DRM record](marketplace-drm.md).
3. Check the actual submitted listing/media and supported models against the submitted package. Image exports for both stores are prepared and verified; the media actually uploaded to either store has separate verification.
4. Complete Chrome Web Store preparation and unpacked-to-store migration testing independently. Activate each public store URL only after that product is approved, public and its installation is verified.
