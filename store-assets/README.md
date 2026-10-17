# Store submission status

As of October 17, 2026, both store submissions remain pending. No actual product captures, processed-DRM test results, approvals or public installation URLs are recorded. Follow the update/recovery and DRM P0 gates before store submission and v1.1.0 feature development.

| Store | Prepared | Still required |
| --- | --- | --- |
| Elgato Marketplace | v1.0.1 magenta brand assets; [English](listing.en.md) and [Korean](listing.ko.md) copy | Actual screenshots, portal-specific exports, processed DRM execution and installer retention evidence, final form review and approval |
| Chrome Web Store | v1.0.1 magenta icons, permission explanations and public [privacy policy](https://github.com/minjungw00/music-deck-bridge/blob/main/PRIVACY.md) | Actual popup screenshots, final data-use declarations, unpacked-to-store migration with new pairing, review and approval |

The submissions and public installation URLs are independent. Activate each URL in README and both installation guides only after that product is approved, public and its store installation is verified.

## Screenshot capture plan

Use a clean Windows profile and dummy listening details. Capture each image from the running product; do not present mockups as device evidence.

1. Chrome popup in English and Korean: pairing controls and connected status, with PINs and personal details concealed.
2. Stream Deck action grid: Now Playing artwork, playback buttons and mute, using artwork you have permission to publish in store screenshots.
3. Stream Deck +: visible volume percentage and track dial feedback, plus the 1–5 point step setting.
4. Action settings in English and Korean: title display mode and connection status. Hide live PINs, tokens and local identifying details.
5. Verify current store dimensions and export the requested screenshot and promotional formats into the relevant store-assets subdirectory.


See the [Elgato](elgato/README.md) / [Chrome](chrome/README.md) submission folders and [DRM test record](../docs/verification/marketplace-drm.md). Reconcile the submitted build's actual storage, scripting, alarms and host permissions with the privacy form; artwork is fetched externally by the plugin.
