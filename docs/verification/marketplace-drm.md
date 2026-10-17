# Marketplace DRM verification

Evidence date: October 17, 2026 (Asia/Seoul). **Not performed. Marketplace distribution is not ready for sign-off.** The GitHub package, general operational report and automated opaque-manifest fixture are separate evidence.

## Package provenance

| Field | Value / status |
| --- | --- |
| Input release | [v1.0.1](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.0.1), source `a78f7de785b96aa9f5673bc41783e8d76f877933` |
| Input installer | `io.github.minjungw00.musicdeckbridge.streamDeckPlugin` |
| Input SHA-256 | `ccaaf7233637ff5cf32f978e39145188b52f437fc1d5efdf22db60008bf1b49e` |
| UUID / version | `io.github.minjungw00.musicdeckbridge` / `1.0.1.0` |
| Maker Console product/version identifier | Not supplied |
| Upload/processing date | Not performed in this session |
| Processed installer path / SHA-256 | Not supplied |
| Publication | Must remain disabled during this test; no public store URL recorded |

Static preparation matches the documented DRM prerequisites: SDK 3.0.2, manifest SDKVersion 3 and minimum Stream Deck 7.1. The application uses a constant plugin identifier and stores auth/config outside the distributed plugin folder. These observations do not establish behavior of an encrypted package.

## Obtain the actual processed package

Follow Elgato's [DRM testing instructions](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/#testing-with-drm): upload the fixed v1.0.1 installer with **Publish after review unselected**, open the product's **Versions** tab, select the uploaded version and download its processed installer. [Maker Console's version downloads](https://docs.elgato.com/maker-console/managing-products/#versions) apply DRM to compatible plugins. Local CLI packaging alone does not perform this processing.

Save the processed installer separately from the GitHub original and compute its SHA-256. Record Console version/status and timestamps; do not overwrite or re-upload published GitHub assets. No relevant Maker Console integration was found in the available plugin search, and no processed package was identified in the inspected Downloads installers. An authenticated Console session or a supplied processed package is required for the next step.

## Actual Windows test record

Record the Windows edition/build, Chrome version, Stream Deck software, device model/firmware, extension version/ID, input and processed package hashes, previous installed version, timestamps and redacted host/plugin logs. The host inspected during the [update investigation](update-installation.md) runs Windows 11 Education 10.0.26300 and Stream Deck 7.6.0.23012; this is not a DRM execution environment record until the processed build is actually tested there.

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
| Volume Dial: rotation, 1–5 point step, push mute and touch playback | Pending |
| Track Dial: both directions, 1–5 skips per event, push/touch playback | Pending |
| Host restart and Chrome reconnect | Pending |
| Existing-install update attempt, with exact version pair and host exit state | Pending; retain failures separately from removal/reinstallation |
| Backup rollback and retained pairing/settings | Pending |

If a test fails, preserve pre/post processing packages and redacted logs, distinguish installation from runtime/Chrome failures, and record exact reproduction steps. Compare plaintext payloads only where readable; an encrypted manifest is expected to differ. Do not modify protected distributed files to bypass integrity checks.

Complete sign-off requires the actual processed installer, environment/provenance and measured results above. Store review, approval, public installation and Chrome Web Store migration remain independent checks.
