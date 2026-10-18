# Store submission guide

This directory contains listing copy, artwork and submission checklists. Track submitted versions, Console identifiers, package hashes, review status and verification results in [release readiness](../docs/release-readiness.md) and its linked verification records.

| Store | Assets and checklist |
| --- | --- |
| Elgato Marketplace | [Plugin submission guide](elgato/README.md), app icon, actual key/dial and settings screenshots |
| Chrome Web Store | [Extension submission guide](chrome/README.md), extension icons, actual popup screenshots and promotional images |
| Both | [English](listing.en.md) / [Korean](listing.ko.md) listing copy and public [privacy policy](https://github.com/minjungw00/music-deck-bridge/blob/main/PRIVACY.md) |

## Official product images

Use these maintainer-selected source images for README and listing media:

| Image | Source |
| --- | --- |
| [Stream Deck +](elgato/screenshots/stream-deck-plus.png) | Actual maintainer capture with balanced outer margins |
| [English Chrome popup](chrome/screenshots/popup-en.png) | Version 1.1.1 popup rendering with sample playback data |
| [Korean Chrome popup](chrome/screenshots/popup-ko.png) | Version 1.1.1 popup rendering with sample playback data |

The actual Stream Deck capture takes precedence over the browser-rendered device approximation. The popup images are selected product visuals; their simulated connection status does not establish live-service validation. See the [image provenance record](../docs/verification/official-images-2026-10-18.md). Compose store-specific exports from these sources while preserving proportions and UI content.

## Submission workflow

For each submission, match the package, listing claims and media to the same version. Preserve already submitted packages and record revisions separately. Check current Console requirements before exporting media. Reconcile the submitted extension's storage, scripting, alarms and host permissions with the privacy form; the plugin fetches artwork externally.

The submissions and public installation URLs are independent. Activate each URL in README and both installation guides only after that product is approved, public and its store installation is verified. Record actual Maker Console package execution in the [DRM test record](../docs/verification/marketplace-drm.md).

## Screenshot capture plan

Use a clean Windows profile and dummy listening details. Capture each image from the running product; do not present mockups as device evidence.

1. Chrome popup in English and Korean: pairing controls and connected status, with PINs and personal details concealed.
2. Stream Deck action grid: Now Playing artwork, playback buttons and mute, using artwork you have permission to publish in store screenshots.
3. Stream Deck +: visible volume percentage and track dial feedback, plus the 1–5 point step setting.
4. Action settings in English and Korean: title display mode and connection status. Hide live PINs, tokens and local identifying details.
5. Verify current store dimensions and export the requested screenshot and promotional formats into the relevant store-assets subdirectory.

The [supplied README thumbnail](../docs/assets/music-deck-bridge-thumbnail.png) is promotional artwork. Prepare store-specific sizes separately and use actual captures for product screenshots. See the [brand guide](../docs/branding.md) for icon design and reproduction.

## Local rendering preview

Generate a local English/Korean popup and Stream Deck + layout preview with the fixture track **Prelude No. 1 in C major, BWV 846 — Kimiko Ishizaka**:

```sh
npm run preview:render -- --cover /path/to/album-cover.jpg
```

Open `dist/previews/prelude-bwv846/index.html` in a browser. This single HTML file embeds its cover, icons, styles and scripts and works offline. It includes language, playback, mute, volume, artwork-fit and text controls and can open the popup alone; `popup-en.html` and `popup-ko.html` are also exported separately. The generator never starts the bridge or reads pairing credentials. All generated files remain under ignored `dist/` and are excluded from product packages.

The popup reuses the actual HTML, JavaScript and catalogs with in-memory sample responses. Track-key and dial content reuse the plugin's rendering functions and artwork layout. The device frame, native key text and built-in dial layout are browser approximations; these previews do not establish actual hardware or live-service behavior. Keep them labelled as previews and retain actual product captures for submission evidence. Supply cover artwork appropriate to the intended use; a recording's license does not by itself establish the cover's reuse terms.
