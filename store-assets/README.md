# Store submission guide

This directory contains listing copy, artwork and submission checklists. Track submitted versions, Console identifiers, package hashes, review status and verification results in [release readiness](../docs/release-readiness.md) and its linked verification records.

Start with the store-specific upload guide below. These guides cover future submissions and revisions; current publication and actual submitted copy belong in the [store record](../docs/verification/stores.md). Prepared local media do not identify the files uploaded to a store.

| Store | Assets and checklist |
| --- | --- |
| Elgato Marketplace | [Upload guide and sized exports](elgato/README.md#upload-files): 288px icon, 1920×960 thumbnail and three gallery images |
| Chrome Web Store | [Upload guide and sized exports](chrome/README.md#upload-files): 128px icon, localized 1280×800 screenshots and optional 440×280 promotional tile |
| Both | [Submitted descriptions and English guidance](listing.en.md) / [한국어](listing.ko.md) and public [privacy policy](https://github.com/minjungw00/music-deck-bridge/blob/main/PRIVACY.md) |

## Official product images

Use these maintainer-selected source images for README and listing media:

| Image | Source |
| --- | --- |
| [Stream Deck +](elgato/screenshots/stream-deck-plus.png) | Actual maintainer capture with balanced outer margins |
| [English Chrome popup](chrome/screenshots/popup-en.png) | Version 1.1.1 popup rendering with sample playback data |
| [Korean Chrome popup](chrome/screenshots/popup-ko.png) | Version 1.1.1 popup rendering with sample playback data |

The actual Stream Deck capture takes precedence over the browser-rendered device approximation. The popup images are selected product visuals; their simulated connection status does not establish live-service validation. See the [image provenance record](../docs/verification/media.md). Compose store-specific exports from these sources while preserving proportions and UI content.

The [Chrome Web Store upload set](chrome/README.md#upload-files) and [Elgato Marketplace gallery set](elgato/README.md#upload-files) are exported from these approved sources. The original popup previews and Stream Deck capture remain unchanged.

## Use designs in both stores

| Destination | Additional files | Guide |
| --- | --- | --- |
| Chrome Web Store | Marketplace gallery designs at 1280×800; its thumbnail as 440×280 and 1400×560 promotional tiles | [Marketplace-derived images](chrome/README.md#images-adapted-from-marketplace) |
| Elgato Marketplace | Chrome English screenshot and promotional design at 1920×960 | [Chrome-derived images](elgato/README.md#images-adapted-from-chrome-web-store) |

The common brand already has a [128px Chrome icon](chrome/listing/icon-128.png) and [288px Marketplace icon](elgato/listing/app-icon-288.png). Use the icon at the destination store's required size. The [adaptation record](../docs/verification/media.md#export-checks) documents layout changes and verification.

## Submission workflow

For each submission, match the package, listing claims and media to the same version. Preserve already submitted packages and record revisions separately. Check current Console requirements before exporting media. Reconcile the submitted extension's storage, scripting, alarms and host permissions with the privacy form; the plugin fetches artwork externally.

1. Prepare the version's package, copy, permissions/privacy answers and correctly sized media. Check artwork rights and support/privacy URLs.
2. Retain upload files/hashes and record the store's version identifier, selected media, processing settings and review requests in the [store record](../docs/verification/stores.md).
3. Record approval, public availability and installation/operation separately. Keep README and both installation guides linked to public products; record migration coverage within its tested scope.
4. Preserve submitted descriptions verbatim and add later revisions separately. When updating live copy, replace temporary companion-download instructions with public store links.

Record identified Maker Console processed-package results in the [DRM record](../docs/verification/marketplace-drm.md), separately from local packaging fixtures.

## Screenshot capture plan

Use a clean Windows profile and dummy listening details. Capture each image from the running product; do not present mockups as device evidence.

1. Chrome popup in English and Korean: pairing controls and connected status, with PINs and personal details concealed.
2. Stream Deck action grid: Now Playing artwork, playback buttons and mute, using artwork you have permission to publish in store screenshots.
3. Stream Deck +: visible volume percentage and track dial feedback, plus the 1–5 point step setting.
4. Action settings in English and Korean: title display mode and connection status. Hide live PINs, tokens and local identifying details.
5. Verify current store dimensions and export the requested screenshot and promotional formats into the relevant store-assets subdirectory.

The [shared README and Marketplace thumbnail](elgato/listing/thumbnail-1920x960.png) is promotional artwork. Use the prepared store exports for upload and actual captures for device screenshots. See the [brand guide](../docs/branding.md) for icon design and reproduction.

## Local rendering preview

Generate a local English/Korean popup and Stream Deck + layout preview with the fixture track **Prelude No. 1 in C major, BWV 846 — Kimiko Ishizaka**:

```sh
npm run preview:render -- --cover /path/to/album-cover.jpg
```

Open `dist/previews/prelude-bwv846/index.html` in a browser. This single HTML file embeds its cover, icons, styles and scripts and works offline. It includes language, playback, mute, volume, artwork-fit and text controls and can open the popup alone; `popup-en.html` and `popup-ko.html` are also exported separately. The generator never starts the bridge or reads pairing credentials. All generated files remain under ignored `dist/` and are excluded from product packages.

The popup reuses the real HTML, JavaScript and catalogs with sample responses. Key/dial content uses the plugin's rendering functions. The device frame, native key text and built-in dial layout are browser approximations. Label these as previews; actual captures provide device evidence.

Supply cover artwork appropriate to the intended use. A recording's license does not establish its cover's reuse terms.
