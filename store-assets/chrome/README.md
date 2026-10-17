# Chrome Web Store submission assets

Keep extension screenshots and promotional images here.

Use the submitted version's magenta icons in `chrome-extension/icons/`. See the [brand guide](../../docs/branding.md) for palette, size and reproduction details.

Record the submitted version, ZIP hash, listing identifier and review result in [release readiness](../../docs/release-readiness.md). After approval and publication, verify the actual product URL and add it to README and both installation guides independently of Marketplace. Test switching from the unpacked extension with removal and new PIN pairing; until then use the [unpacked installation guide](../../docs/installation.en.md).

- Capture English and Korean pairing/status screens without real PINs, tokens or personal listening details.
- Use the prepared [English](../listing.en.md) / [Korean](../listing.ko.md) descriptions and permission explanations; verify them against the submitted ZIP.
- Declare each permission and reconcile store data-use answers with `PRIVACY.md` and the submitted version.
- Confirm support/privacy URLs, current screenshot/promotional dimensions and artwork rights.
- Submit the Chrome ZIP with `manifest.json` at its root, rather than the repository ZIP.

See the [shared submission guide and screenshot plan](../README.md).

## Media requirements

The [Chrome listing instructions](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) specify a 128×128 store icon, at least one 1280×800 screenshot (up to five), and a 440×280 small promotional tile. The 1400×560 marquee tile is optional. The committed `chrome-extension/icons/128.png` supplies the store icon. Capture the actual popup in both supported locales; the README banner is promotional artwork, not screenshot evidence. Prepare the required promo export separately and verify the final form against the uploaded ZIP and privacy policy.

Capture the popup from the final submitted ZIP so its appearance and localized text match the listing media.
