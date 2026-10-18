# Marketplace DRM verification

Last updated: October 18, 2026 (Asia/Seoul). **DRM execution not performed.** The maintainer reports **v1.1.1 newly submitted and Pending review**. The [current submission record](review-preparation.md) tracks that report; the [v1.0.1 preparation record](review-preparation-v1.0.1.md) is historical. GitHub packages, general operational reports and automated opaque-manifest fixtures do not establish actual Console-processed execution.

## Package provenance

| Field | Value / status |
| --- | --- |
| Public reference release | [v1.1.1](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.1.1), source `33b4757364e2e2c153cecc635027024662fffdbd` |
| Installer filename | `io.github.minjungw00.musicdeckbridge.streamDeckPlugin` |
| Public reference SHA-256 | `ffe7a11c3965d5b7da1169afd16f8f20792c8ae4c9c18bed3234ba46c8750aca` |
| Actual uploaded-file SHA-256 | Not supplied; not independently matched to the public reference |
| UUID / version | `io.github.minjungw00.musicdeckbridge` / `1.1.1.0` |
| Maker Console product/version identifier | Not supplied |
| Upload / review status | October 18, 2026 maintainer report: v1.1.1 submitted, Pending review; processing details not supplied |
| Processed installer path / SHA-256 | Not supplied |
| Publication | No approval/public product URL reported; Publish after review setting not supplied. Keep publication disabled for any additional DRM-only test submission. |

Static preparation matches the documented DRM prerequisites: SDK 3.0.2, manifest SDKVersion 3 and minimum Stream Deck 7.1. The application uses a constant plugin identifier and stores auth/config outside the distributed plugin folder. These observations do not establish behavior of an encrypted package.

## Obtain the actual processed package

For **v1.1.1**, already in review, open the product's **Versions** tab and download that version's processed installer when available. Elgato's [DRM testing instructions](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/#testing-with-drm) describe uploading with **Publish after review unselected** when an additional test submission is needed. [Maker Console's version downloads](https://docs.elgato.com/maker-console/managing-products/#versions) apply DRM to compatible plugins. Local CLI packaging alone does not perform this processing.

Save the processed installer separately from the GitHub original and compute its SHA-256. Record Console version/status and timestamps; do not overwrite published GitHub assets. Supply the actual processed installer and its provenance for execution testing; possession of a normal GitHub installer does not satisfy this step.

## Actual Windows test record

Record the Windows edition/build, Chrome version, Stream Deck software, device model/firmware, extension version/ID, input and processed package hashes, previous installed version, timestamps and redacted host/plugin logs for the actual DRM test environment.

Back up profiles, plugin files and `%APPDATA%\MusicDeckBridge` privately. Follow the [settings-preserving installation procedure](../installation.en.md#replacing-plugin-files). Keep one active Chrome extension. For the update case, first verify existing pairing and settings without generating a new PIN; perform fresh PIN pairing separately afterward.

| Test | Actual result / evidence |
| --- | --- |
| Processed package installs and installed version is correct | Pending |
| Plugin starts and SDK connects without DRM/integrity errors | Pending |
| Existing Chrome pairing, custom port, profiles and action settings survive replacement | Pending |
| Fresh PIN pairing with the Chrome extension | Pending |
| Now Playing: title, artist, album art, scroll/static text and key playback | Pending |
| Play / Pause key | Pending |
| Previous Track key | Pending |
| Next Track key | Pending |
| Mute key | Pending |
| Volume Dial: rotation, 1–5 point step, push and touch mute | Pending |
| Current Track Dial: both directions, 1–5 skips per event, push/touch playback and information/artwork/text options | Pending |
| Open YouTube Music and cold-player command continuation | Pending |
| Like / Dislike: toggle rating and confirmed selection feedback | Pending |
| Component versions/protocol status and compatible reconnect with retained credentials | Pending |
| Host restart and Chrome reconnect | Pending |
| Existing-install update attempt, with exact version pair and host exit state | Pending; retain failures separately from removal/reinstallation |
| Backup rollback and retained pairing/settings | Pending |

If a test fails, preserve pre/post processing packages and redacted logs, distinguish installation from runtime/Chrome failures, and record exact reproduction steps. Compare plaintext payloads only where readable; an encrypted manifest is expected to differ. Do not modify protected distributed files to bypass integrity checks.

Complete sign-off requires the actual processed installer, environment/provenance and measured results above. Store review, approval, public installation and Chrome Web Store migration remain independent checks.
