# Store submissions and review — v1.1.1

Last updated: October 18, 2026 (Asia/Seoul). The maintainer reports that **version 1.1.1 is registered in both Elgato Marketplace and Chrome Web Store, with both reviews pending**. This supersedes the earlier Chrome preparation status. Approval and public availability have not been reported.

## Reported submissions

| Store | Registered version | Review state | Evidence |
| --- | --- | --- | --- |
| Elgato Marketplace | 1.1.1; plugin numeric version 1.1.1.0 | Pending review | October 18 maintainer report |
| Chrome Web Store | 1.1.1 | Pending review | October 18 maintainer report |

The [release readiness summary](../release-readiness.md) is the entry point for current distribution status and remaining work. Store approvals, GitHub publication and actual store-installed operation are separate milestones.

## Package and listing provenance

The public reference is [GitHub v1.1.1](v1.1.1.md), tag source `33b4757364e2e2c153cecc635027024662fffdbd`:

| Reference asset | SHA-256 |
| --- | --- |
| `io.github.minjungw00.musicdeckbridge.streamDeckPlugin` | `ffe7a11c3965d5b7da1169afd16f8f20792c8ae4c9c18bed3234ba46c8750aca` |
| `music-deck-bridge-chrome-1.1.1.zip` | `810ea1cc37db886483842aee8776cbd473d63129ddfb6375e4af0dc4336d25ad` |

These hashes identify the public reference files. The exact uploaded-file hashes, store product/version identifiers, submitted listing/media revisions and publication settings were not supplied. Registration is confirmed by the maintainer report; equality with those reference files and the local listing copy is not independently established. No public store install URL has been supplied.

The Console-processed installer and actual DRM execution remain [unverified](marketplace-drm.md). The [v1.0.1 preparation measurements](review-preparation-v1.0.1.md) remain historical and are not evidence for either current submission.

## Available verification and media

- [Stable release verification](v1.1.1.md): exact-source Windows/Ubuntu CI, official packaging and downloaded/public package checksums.
- [Official source images](official-images-2026-10-18.md): stable 1.1.1 English/Korean sample-data popup renderings and the unchanged actual Stream Deck capture.
- [Chrome upload media](chrome-store-images-2026-10-18.md): 128px icon, localized 1280×800 screenshots and 440×280 promotional tile.
- [Marketplace upload media](elgato-store-images-2026-10-18.md): 288px app icon, 1920×960 thumbnail and three English gallery images.
- [Maintainer device/Chrome validation](maintainer-validation-2026-10-18.md) and the [later installation investigation](update-procmon-v1.1.0-2026-10-18.md), each with its original scope and date.

## Review follow-up

1. Track each store's decision independently. Record its product/version identifier, exact uploaded files and review-requested listing/media revisions when available.
2. Test the Marketplace version's [Console-processed installer](marketplace-drm.md) separately from the GitHub package.
3. After approval and publication, verify each product URL and store installation. Check Chrome unpacked-to-store migration/new PIN pairing and operation of the store-installed component pair.
4. Add verified public links to README and both installation guides when each store becomes available. Continue linking GitHub packages while approval/public installation is pending.
