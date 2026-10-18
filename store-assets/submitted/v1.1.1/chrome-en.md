Music Deck Bridge requires BOTH this Chrome extension and the companion Stream Deck plugin on the same Windows PC. The extension cannot control a Stream Deck on its own.

Companion Stream Deck Plugin:
https://github.com/minjungw00/music-deck-bridge/releases/latest

**FEATURES**

Control play/pause, skip tracks, mute, open YouTube Music, and Like/Dislike from Stream Deck keys. Show artwork, title, and artist. On Stream Deck +, use volume and current-track dials with configurable displays, artwork sizing and scrolling text. Like/Dislike requires an available rating control in the signed-in player. English and Korean UI included.

**SETUP**

1. Add this extension from the Chrome Web Store.
2. Until the Elgato Marketplace plugin is published, download the Stream Deck installer (.streamDeckPlugin) from:
https://github.com/minjungw00/music-deck-bridge/releases/latest
3. Double-click the .streamDeckPlugin file to install it in the Stream Deck app.
4. Add any Music Deck Bridge action to your Stream Deck. Select the action, open its settings, and click Generate PIN.
5. Open this extension's toolbar popup and enter the six-digit PIN within 10 minutes. Both components use local port 17864 by default.
6. Open music.youtube.com in Chrome, or launch YouTube Music as an installed Chrome app (PWA), and play a track.

**REQUIREMENTS**

Windows 10/11, Google Chrome 116+, Stream Deck software 7.1+, and a Stream Deck device. Dial actions require Stream Deck +. No extra Node.js or npm installation is needed for the prebuilt plugin.

**PRIVACY**

The extension uses a PIN-authenticated local connection to the companion plugin. Playback metadata is used for device displays; the plugin fetches artwork from approved Google/YouTube image hosts. No project-operated analytics server.

Unofficial integration; not affiliated with or endorsed by Google, YouTube, Elgato or Corsair.

Installation guide: https://github.com/minjungw00/music-deck-bridge/blob/main/docs/installation.en.md

Privacy policy: https://github.com/minjungw00/music-deck-bridge/blob/main/PRIVACY.md
