# Marketplace DRM verification

Last updated: October 18, 2026 (Asia/Seoul). **Actual processed-package execution: not tested.** Review status is in [store submissions](stores.md); public source/package hashes are in [release verification](releases.md#v111).

## Required input

Download the submitted **v1.1.1** version's processed installer from Maker Console and retain its version ID, processing status, download time and SHA-256 separately from the GitHub original. Neither the actual uploaded-file hash nor the processed package has been supplied. Do not replace published GitHub assets.

The inspected source uses SDK 3.0.2, manifest SDKVersion 3, Stream Deck minimum 7.1, a constant UUID and state outside the plugin folder. Ordinary packaging and opaque-manifest fixtures cover those static paths; they do not verify encryption/integrity behavior.

Refer to Elgato's [DRM testing instructions](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/#testing-with-drm) and [Console version downloads](https://docs.elgato.com/maker-console/managing-products/#versions). If an additional DRM-only test submission is needed, follow the documented **Publish after review unselected** procedure.

## Windows execution record

Record OS/Chrome/Stream Deck/device versions, extension ID/version, previous plugin version, original/processed package hashes and timestamps. Back up profiles and private auth/config; follow the [settings-preserving replacement guide](../installation.en.md#replacing-plugin-files). Keep one active extension and test retained pairing before creating a new PIN.

| Check | Result |
| --- | --- |
| Processed installer installs, correct version starts and SDK connects without DRM/integrity errors | Pending |
| Existing pairing, custom port, profiles and per-action settings survive update | Pending |
| Fresh PIN pairing and restart/reconnect | Pending |
| All keys: playback, previous/next, mute, launch/continuation, ratings and current-track feedback | Pending |
| Both dials: rotate, press/touch, step settings and configurable artwork/text | Pending |
| Explicit protocol identity/status, retained-token reconnect and backup rollback | Pending |

Keep redacted logs and exact steps for failures; distinguish installation, runtime and Chrome errors. Do not modify protected distributed files to bypass integrity checks. DRM execution, store approval and public installation/migration are separate results.
