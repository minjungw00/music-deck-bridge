# Installation

[한국어](installation.ko.md) · [Troubleshooting](troubleshooting.md)

Install **both** components on Windows 10/11. Use Chrome 116+ and Stream Deck 7.1+. Volume and track encoder actions require Stream Deck +.

## Stream Deck plugin

1. Download or clone the repository.
2. Quit Stream Deck using the system tray menu. Closing its window alone may leave it running.
3. Copy the entire `streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin` folder into:

   ```text
   C:\Users\username\AppData\Roaming\Elgato\StreamDeck\Plugins
   ```

   Replace `username` with your Windows account name. The installed manifest must be at:

   ```text
   C:\Users\username\AppData\Roaming\Elgato\StreamDeck\Plugins\io.github.minjungw00.musicdeckbridge.sdPlugin\manifest.json
   ```

4. Copy the repository's `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES.md` and `PRIVACY.md` into the installed plugin folder.
5. Start Stream Deck and find **Music Deck Bridge** in the action list.

If replacing an existing installation, back up its folder first.

## Chrome extension

1. Open `chrome://extensions` in Google Chrome.
2. Turn on **Developer mode**.
3. Select **Load unpacked** and choose this repository's `chrome-extension` folder, which contains `manifest.json`.
4. Pin **Music Deck Bridge** to the toolbar if useful.

## Pair and use

1. Drag a Music Deck Bridge key or dial action onto your Stream Deck.
2. Select that action and choose **Generate PIN** in its settings.
3. Open the Chrome extension popup, enter the six-digit PIN, then select **Connect**. The PIN expires in ten minutes and can be used once.
4. Open [YouTube Music](https://music.youtube.com/), start a track, then use **Check status** in the popup.
5. Try play/pause, skip, mute and artwork. On Stream Deck +, try the volume and track dials. The volume step setting accepts 1–5 percentage points per tick.

You can install YouTube Music as a Chrome app through Chrome's app installation UI. The extension also works with a regular tab and prefers an installed app if both are open.

## Custom port

The default port is `17864`. Set an unused integer from `1024` to `65535` in any action's settings or in the extension popup. The setting applies to all plugin actions. A connected client follows a live port change; if the components were disconnected/asleep, manually match both ports.

## Update

Quit Stream Deck, back up the installed plugin folder, and replace it with the updated `io.github.minjungw00.musicdeckbridge.sdPlugin` folder in the Plugins directory above. Include the license/privacy files as described in the installation steps, then restart Stream Deck. Pairing and port data are stored separately and remain available.

Keep your Chrome unpacked folder at the same absolute path. After updating source files, open `chrome://extensions` and click **Reload** for this extension. Refresh YouTube Music if it does not reconnect. A different extension ID requires a new pairing.

## Remove or reset

Quit Stream Deck, then delete `io.github.minjungw00.musicdeckbridge.sdPlugin` from `C:\Users\username\AppData\Roaming\Elgato\StreamDeck\Plugins`. Remove the extension separately at `chrome://extensions`.

**Unpair** in the popup removes only the Chrome token. For a full reset, also delete `%APPDATA%\MusicDeckBridge\auth.json` and `config.json` while Stream Deck is stopped. See [privacy](../PRIVACY.md) for action settings and retention details.
