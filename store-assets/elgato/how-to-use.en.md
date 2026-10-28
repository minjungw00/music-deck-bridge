# Elgato How to Use — proposed replacement

Draft for pasting into Maker Console; not submitted or published. This is a description revision for the public listing displaying **1.1.2**, not a package release. See the [public-page observation and submission history](../../docs/verification/stores.md).

## Existing section to replace

Replace the current public English description from `How to Use:` through the final `not affiliated with Google, YouTube or Elgato.` sentence, immediately before `What's new?`. Leave the preceding component notice, companion Chrome Web Store link and feature description unchanged.

The following is the public-page text, with blank-line spacing normalized. It is not the preserved [v1.1.1 submission](../submitted/v1.1.1/elgato-en.md).

```text
How to Use:

Install this plugin from Elgato Marketplace.

Until the Chrome Web Store version is published, download the Chrome extension ZIP from: https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca
Extract the Chrome ZIP to a permanent folder. In Chrome, open chrome://extensions, enable Developer mode, choose Load unpacked, and select the folder containing manifest.json. Keep this folder.

Add any Music Deck Bridge action in Stream Deck. Open its settings and select Generate PIN. Enter the six-digit PIN in the Chrome extension popup within 10 minutes.

Open music.youtube.com in Chrome or the YouTube Music Chrome app.
Requires Windows 10/11, Chrome 116+ and Stream Deck 7.1+. Dial actions require Stream Deck +. Prebuilt packages need no separate Node.js or npm. Independent, unofficial integration; not affiliated with Google, YouTube or Elgato.
```

## New text to paste

```text
How to Use:

Music Deck Bridge requires BOTH the Stream Deck plugin and its companion Chrome extension on the same Windows PC. Neither component works on its own.

Recommended installation — official stores:

1. Install this plugin from Elgato Marketplace.
2. In Chrome, open the companion extension's Chrome Web Store page, select Add to Chrome and confirm installation:
https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca

Optional installation — Chrome extension ZIP from GitHub Releases:

Use this option instead of step 2 above if you prefer to install the Chrome extension manually. Download music-deck-bridge-chrome-<version>.zip from the latest stable GitHub Release:
https://github.com/minjungw00/music-deck-bridge/releases/latest

Use the packaged Chrome extension ZIP, not a Source code archive. Extract it to a permanent folder. In Chrome, open chrome://extensions, enable Developer mode, choose Load unpacked, and select the folder containing manifest.json. Keep this folder. Keep only one active copy of the extension.

Pair and start playback — for either installation method:

1. Add any Music Deck Bridge action in Stream Deck. Open its settings and select Generate PIN.
2. Enter the six-digit PIN in the Chrome extension popup within 10 minutes, then select Connect.
3. Open music.youtube.com in Chrome or the YouTube Music Chrome app.

Requires Windows 10/11, Chrome 116+ and Stream Deck 7.1+. Dial actions require Stream Deck +. Prebuilt packages need no separate Node.js or npm. Independent, unofficial integration; not affiliated with Google, YouTube or Elgato.
```
