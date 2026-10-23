# Marketplace DRM verification

Last updated: October 24, 2026 (Asia/Seoul). **Published store components: normal operation confirmed by the maintainer.** Both Elgato Marketplace and Chrome Web Store publication are complete according to the October 24 report. The report does not separately identify the Console-processed package/hash or provide the detailed DRM matrix below. This record tracks that narrower evidence and does not reopen the completed store-operation confirmation. See [runtime confirmation](runtime.md#official-store-components), [store submissions](stores.md) and [public source/package hashes](releases.md#v112).

## Required input

For the submitted **v1.1.2** version, retain the Maker Console processed installer's version ID, processing status, download time and SHA-256 separately from the GitHub original. Neither the actual uploaded-file hash nor the processed package has been supplied. Do not replace published GitHub assets.

The inspected source uses SDK 3.0.2, manifest SDKVersion 3, Stream Deck minimum 7.1, a constant UUID and state outside the plugin folder. Ordinary packaging and opaque-manifest fixtures cover those static paths; they do not verify encryption/integrity behavior.

Refer to Elgato's [DRM testing instructions](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/#testing-with-drm) and [Console version downloads](https://docs.elgato.com/maker-console/managing-products/#versions). If an additional DRM-only test submission is needed, follow the documented **Publish after review unselected** procedure.

## Windows execution record

The matrix below tracks detailed results for an identified Console-processed package. The maintainer's completed store-operation confirmation and earlier itemized validation retain their scopes in [runtime verification](runtime.md#maintainer-confirmation).

Record OS/Chrome/Stream Deck/device versions, extension ID/version, previous plugin version, original/processed package hashes and timestamps. Back up profiles and private auth/config; follow the [settings-preserving replacement guide](../installation.en.md#replacing-plugin-files). Keep one active extension and test retained pairing before creating a new PIN.

| Check | Result |
| --- | --- |
| Processed installer installs, correct version starts and SDK connects without DRM/integrity errors | Not separately recorded |
| Existing pairing, custom port, profiles and per-action settings survive update | Not separately recorded |
| Fresh PIN pairing and restart/reconnect | Not separately recorded |
| All keys: playback, previous/next, mute, launch/continuation, ratings and current-track feedback | Not separately recorded |
| Both dials: rotate, press/touch, step settings and configurable artwork/text | Not separately recorded |
| Explicit protocol identity/status, retained-token reconnect and backup rollback | Not separately recorded |

Keep redacted logs and exact steps for failures; distinguish installation, runtime and Chrome errors. Do not modify protected distributed files to bypass integrity checks. DRM execution, store approval and public installation/migration are separate results.
