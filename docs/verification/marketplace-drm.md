# Marketplace DRM verification

Last updated: October 24, 2026 (Asia/Seoul). **Normal operation of both published store components is maintainer-confirmed.** This record tracks the narrower processed-package identity and detailed DRM coverage; it does not reopen that completed confirmation.

See [store status](stores.md), [runtime confirmation](runtime.md#official-store-components) and [public source/package hashes](releases.md#v112).

<a id="required-input"></a>

## Package identity

For the last reported submission, **v1.1.2**, the exact uploaded-file hash and Console-processed installer were not supplied. If obtained, retain the processed version ID, processing status, download time and SHA-256 separately from the GitHub original. Preserve public GitHub assets.

The inspected source uses SDK 3.0.2, manifest SDKVersion 3, Stream Deck minimum 7.1, a constant UUID and state outside the plugin folder. Packaging and opaque-manifest fixtures cover static paths; they do not verify encryption/integrity behavior.

Use Elgato's [DRM testing instructions](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/#testing-with-drm) and [Console version downloads](https://docs.elgato.com/maker-console/managing-products/#versions). An additional DRM-only submission, if needed, follows the documented **Publish after review unselected** procedure.

## Windows execution record

The following detailed results were **not separately recorded for an identified processed package**:

- Installation, intended version startup and SDK connection without DRM/integrity errors.
- Retained pairing, custom port, profiles and per-action settings after an update.
- Fresh PIN pairing and restart/reconnect.
- All keys: playback, previous/next, mute, launch/continuation, ratings and current-track feedback.
- Both dials: rotate, press/touch, step settings and configurable artwork/text.
- Explicit protocol identity/status, retained-token reconnect and backup rollback.

When recording additional package evidence, include OS/Chrome/Stream Deck/device versions, extension ID/version, previous plugin version and original/processed hashes/timestamps. Follow [settings-preserving replacement](../installation.en.md#replacing-plugin-files), keep one active extension and check retained pairing before generating a new PIN.

Keep redacted failure logs and distinguish installation, runtime and Chrome errors. Do not modify protected distributed files to bypass integrity checks. Maintainer confirmation and earlier itemized checks retain their scopes in [runtime verification](runtime.md#maintainer-confirmation).
