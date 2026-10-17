# Installation

[한국어](installation.ko.md) · [Troubleshooting](troubleshooting.md)

Install **both** the Stream Deck plugin (which runs the local bridge) and the Chrome extension. All four methods use the same PIN pairing procedure and support a normal YouTube Music tab or the app installed through Chrome (PWA).

**Recommended: [GitHub Releases](https://github.com/minjungw00/music-deck-bridge/releases/latest) for stable packages.** Actions provides development builds; approved store listings are still pending. Prebuilt packages need no separate Node.js, npm or Python installation.

- [Requirements](#requirements)
- [Method 1: GitHub Releases](#method-1-github-releases)
- [Method 2: GitHub Actions](#method-2-github-actions)
- [Method 3: Build from source](#method-3-build-from-source)
- [Method 4: Official stores](#method-4-official-stores)
- [Pairing](#pairing)
- [Updating](#updating)
- [Switching installation methods](#switching-installation-methods)
- [Uninstalling](#uninstalling)

## Requirements

| Component | Required |
| --- | --- |
| Windows | 10 / 11 |
| Google Chrome | 116+ |
| Stream Deck software | 7.1+; includes the plugin's Node.js 24 runtime |
| Device | Key actions target Stream Deck key models; volume/track dials require Stream Deck + |

## Method 1: GitHub Releases

Use the [latest stable release](https://github.com/minjungw00/music-deck-bridge/releases/latest). No build tools are required:

1. Open the most recent stable release, avoiding entries marked **Pre-release**, and download both assets from that same release:
   - `io.github.minjungw00.musicdeckbridge.streamDeckPlugin`
   - `music-deck-bridge-chrome-<version>.zip`
2. Double-click the `.streamDeckPlugin` and confirm installation in Stream Deck. Check that **Music Deck Bridge** appears in its action list.
3. Extract the Chrome ZIP into a permanent folder, for example `%LOCALAPPDATA%\MusicDeckBridge\chrome-extension`. Keep this folder after installation. It must contain `manifest.json` directly, rather than another nested folder.
4. Open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose that extracted folder. Pin the extension to the toolbar if useful. This follows Chrome's [unpacked extension instructions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-an-unpacked-extension).
5. Complete [Pairing](#pairing).

Use the packaged Chrome ZIP, rather than GitHub's automatically generated **Source code** archives. Do not drag the ZIP into Chrome or install an arbitrary CRX.

## Method 2: GitHub Actions

Development builds include recent changes and may be unstable. They require GitHub sign-in to download. [GitHub retains artifacts for 90 days by default](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts); repository settings can shorten retention, and artifacts may expire or be deleted. They are temporary downloads.

1. Sign in to GitHub and open [CI runs](https://github.com/minjungw00/music-deck-bridge/actions/workflows/ci.yml).
2. Select a recent **successful CI run for `main`**, with both Windows and Ubuntu jobs passed. Avoid pull request runs and builds from other branches.
3. Under **Artifacts**, download `music-deck-bridge-dev-windows-<commit-sha>`. Ubuntu artifacts test packaging and are not a supported Linux installation.
4. Extract the downloaded artifact ZIP. Inside are the `.streamDeckPlugin`, a separate `music-deck-bridge-chrome-<version>.zip`, `BUILD-INFO.json` and `SHA256SUMS.txt`. `BUILD-INFO.json` records the full commit, source ref, version, platform and run URL; confirm the ref is `refs/heads/main` and keep this file for bug reports.
5. Double-click the `.streamDeckPlugin` to install it. Extract the **inner Chrome ZIP** into a permanent folder and load that folder at `chrome://extensions` with **Developer mode → Load unpacked**. Select the folder containing `manifest.json`, not the outer artifact folder.
6. Complete [Pairing](#pairing) and check playback controls.

Both package versions may remain unchanged across multiple development builds. Identify the build by its commit SHA and run URL. Install both components from the same run; development packages have no automatic updates.

## Method 3: Build from source

For developers and contributors. Install Git, **Node.js 24 and npm**, then run:

```sh
git clone https://github.com/minjungw00/music-deck-bridge.git
cd music-deck-bridge
npm ci --ignore-scripts
npm run build:plugin
```

This creates the standalone `bin/plugin.js` bundle, including the official SDK. **Python is not needed for this build or manual folder installation.**

1. Quit Stream Deck using its system tray menu; closing its window may leave it running. Back up an existing plugin folder outside the Plugins directory before replacing it.
2. Copy the entire `streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin` folder into `%APPDATA%\Elgato\StreamDeck\Plugins`. Paste this path into File Explorer; `%APPDATA%` is your roaming application data folder. The installed manifest must be at:

   ```text
   %APPDATA%\Elgato\StreamDeck\Plugins\io.github.minjungw00.musicdeckbridge.sdPlugin\manifest.json
   ```

3. Copy the repository's `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES.md` and `PRIVACY.md` into the installed plugin folder, then restart Stream Deck.
4. Open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose the repository's `chrome-extension/` folder containing `manifest.json`.
5. Complete [Pairing](#pairing).

To create installable packages yourself, also install **Python 3.10+** (`python3`, `python`, or Windows `py`) and run:

```sh
npm run build:streamdeck
npm run build:chrome
```

The files are written to `dist/` with the same names as release packages. Stream Deck packaging uses the lockfile-pinned Elgato CLI installed by `npm ci`. See [development](development.md) for testing, debugging and release checks.

## Method 4: Official stores

Public store installation links are not available yet. Use the GitHub packages:

| Component | Store | Installation until available |
| --- | --- | --- |
| Stream Deck plugin | Elgato Marketplace | Use a GitHub Release package |
| Chrome extension | Chrome Web Store | Extract and load the Chrome ZIP |

After each listing becomes public, its verified product URL will appear here. Install the plugin from Elgato Marketplace and add the extension from Chrome Web Store, then complete [Pairing](#pairing). Once both are available, stores become the first recommended method.

The stores may launch separately. For example, once the Chrome listing is available, you can combine it with a GitHub Release plugin. Keep only one active copy of each component and follow [Switching installation methods](#switching-installation-methods).

## Pairing

1. Drag a Music Deck Bridge key or dial action onto your Stream Deck.
2. Select that action and choose **Generate PIN** in its settings.
3. Open the Chrome extension popup, enter the six-digit PIN, then select **Connect**. The PIN expires in ten minutes and can be used once.
4. Open [YouTube Music](https://music.youtube.com/), start a track, then use **Check status** in the popup.
5. Try play/pause, previous/next, mute and artwork. On Stream Deck +, try volume and track dials. Volume accepts 1–5 percentage points per tick; the track dial skips one track per tick, capped at five per event.

The extension prefers an installed Chrome YouTube Music app if both it and a regular tab are open.

### Launch and song ratings

Add **Open YouTube Music**, **Like** and **Dislike** from the Music Deck Bridge action list.

- **Open YouTube Music** focuses the selected open player, including a Chrome-installed app, or opens a Chrome tab if no player exists.
- **Now Playing** and **Play / Pause** control an existing player; if none exists, they open YouTube Music. Dial play/pause inputs behave the same way. Opening the page does not automatically start a song; sign in or start playback on the site when needed.
- **Like** and **Dislike** use the current song's own rating buttons. Press the same key again to remove that rating. A filled thumb and check mark reflect the site's confirmed selection, including changes made in Chrome. Ratings require an available signed-in player with working rating controls.

Install matching plugin and extension builds for these features. Keep the extension paired in the Chrome profile you use for YouTube Music. If Chrome is fully closed, the plugin starts Chrome from its standard Windows installation location and opens a tab. Other browsers and custom Chrome installation paths are not launch targets.

### Custom port

The default port is `17864`. Set an unused integer from `1024` to `65535` in any action's settings or the extension popup. All plugin actions share this port. A connected client follows a live port change; if disconnected or asleep, manually match both ports.

## Updating

Back up Stream Deck profiles before changing installations. Keep `%APPDATA%\MusicDeckBridge`: authentication (`auth.json`) and the shared port (`config.json`) are stored separately from the plugin. Ordinary updates should retain them and Stream Deck profiles. A changed extension ID requires new PIN pairing.

| Installed from | Update procedure |
| --- | --- |
| GitHub Releases | Download both matching packages. For a newer plugin version, install its package over the existing plugin as below; update the Chrome folder in place. |
| GitHub Actions | Select another successful `main` run and record its SHA. Use package installation for a newer plugin version; same-version development rebuilds may need the recovery/replacement procedure below. No automatic updates. |
| Source | Pull the chosen revision, run `npm ci --ignore-scripts` and `npm run build:plugin`, quit Stream Deck, replace the installed plugin folder including notices, then restart. |
| Official stores, once available | Use each store's update mechanism; check that both components have updated. |

For an unpacked Chrome extension, replace the contents of its existing permanent folder with the new extracted files (or update the same source checkout), preserving the **absolute folder path**. Click **Reload** at `chrome://extensions` and refresh YouTube Music if needed. Do not load every new version as another extension.

<a id="package-updates"></a>

### Install a newer plugin package

1. Back up the installed plugin folder and `%APPDATA%\MusicDeckBridge` privately, alongside the profile backup. [Verify the downloaded checksums](#verify-downloaded-files).
2. Leave the existing plugin installed and double-click the newer `.streamDeckPlugin` package. Complete the installation in Stream Deck. Developer mode and a manual plugin stop are not routine requirements.
3. Check that the installed plugin version changed to the intended version, then verify the existing pairing, shared port, actions and profiles. Update/reload Chrome in its existing folder as described above. Do not reset pairing to perform an ordinary update.

If Stream Deck rejects the package, record the error, installed version and host logs before using recovery below. Same-version or older packages may be reported as already installed; use backed-up replacement for intentional development rebuilds/downgrades.

<a id="replacing-plugin-files"></a>

### Recover a rejected install by replacing plugin files

Use this procedure after an installation rejection or when intentionally replacing a development build whose version is not newer. It is a recovery option rather than a requirement for every update.

For a package update in this situation:

1. Back up Stream Deck profiles and the installed plugin folder. Back up `%APPDATA%\MusicDeckBridge` privately as well. If investigating an installation error, save `%APPDATA%\Elgato\StreamDeck\logs\StreamDeck*.log` and matching JSON logs, plus the plugin's `logs` folder if present, before replacing files. Do not share PINs/tokens or unredacted personal data.
2. **Quit Stream Deck from its system tray menu**, rather than just closing its window. Close Explorer windows and terminals opened inside the plugin folder. If moving the folder still gives access denied, stop and inspect open handles/permissions before retrying; do not delete the backups.
3. Move only `%APPDATA%\Elgato\StreamDeck\Plugins\io.github.minjungw00.musicdeckbridge.sdPlugin` to a backup location **outside** the `Plugins` directory. Do not leave a renamed second copy inside `Plugins`.
4. Keep `%APPDATA%\MusicDeckBridge\auth.json`, `config.json`, Stream Deck profiles and the existing Chrome extension. This is a file replacement, not a full reset: do not unpair or remove the extension.
5. Start Stream Deck, then double-click the newly downloaded `.streamDeckPlugin`. Confirm installation and check that the installed manifest's `Version` is the intended version (`X.Y.Z.0` for release `X.Y.Z`). A completed download or restored old actions alone does not establish an update.
6. Reload the existing Chrome extension after updating its files. Confirm pairing, matching ports, saved action settings/profiles and playback controls.

If installation fails, quit Stream Deck, move any incomplete new plugin folder out of `Plugins`, restore the backed-up plugin folder to its original path and restart. If needed, restore the matching Chrome files in the same extension folder and reload. Keep authentication/configuration and profiles. Record the actual installed version and inspect the host installation log; do not repeatedly reinstall or reset pairing to diagnose `Failed to fetch`.

If the extension reports `Failed to fetch`, follow [Troubleshooting](troubleshooting.md). Check that Stream Deck is running, verify the installed plugin version and match the ports before changing pairing.

### Verify downloaded files

Actions builds and Releases include `SHA256SUMS.txt`. Download it alongside the release packages, or extract it from the Actions artifact. In PowerShell opened in the package folder, run:

```powershell
Get-FileHash -Algorithm SHA256 -Path .\*.streamDeckPlugin, .\music-deck-bridge-chrome-*.zip
```

Compare each hash with the line for that filename in `SHA256SUMS.txt` (uppercase/lowercase does not matter). For development builds, you can also check `BUILD-INFO.json` with `Get-FileHash -Algorithm SHA256 .\BUILD-INFO.json`. If a hash differs, download the files again from the same release/run before installing.

## Switching installation methods

All plugin builds use UUID `io.github.minjungw00.musicdeckbridge`; use one installed version. Unpacked and store Chrome extensions can have different IDs. Two active extensions can replace each other's authentication and interrupt control.

| Switch | Procedure |
| --- | --- |
| Actions → Releases | Install the stable package as a normal update if its plugin version is newer; otherwise use backed-up replacement. Update the existing unpacked Chrome folder in place and reload. |
| Releases → Actions | Replace both components with a matching `main` build; updates become manual and stability is not guaranteed. |
| GitHub → Elgato Marketplace | Once approved, back up profiles and plugin files, quit Stream Deck and remove the existing plugin folder as below. Restart and install the Marketplace plugin; verify existing actions and settings. |
| Unpacked Chrome → Chrome Web Store | While Stream Deck and the old extension are connected, choose **Unpair** and confirm success, then remove the old extension. Install the approved store extension and pair with a new PIN. |
| Source → Distributed packages | Stop using the development plugin/extension, replace the plugin with the chosen package, and update the same Chrome folder or unpair/remove the development extension before loading another installation. |

If the old extension is unavailable, remove/disable it before pairing the replacement. New pairing revokes the old server credential. Leave `%APPDATA%\MusicDeckBridge` and Stream Deck profiles in place during a normal switch; reset only when intended. Recheck the shared port and all existing actions after changing sources.

## Uninstalling

While Stream Deck is running and both ports match, choose **Unpair** in the extension popup. It revokes server and Chrome tokens and closes pending commands. If revocation fails, the token is retained for retry; resolve the connection and retry before removal. The port setting remains.

Quit Stream Deck from the tray, then remove `io.github.minjungw00.musicdeckbridge.sdPlugin` from `%APPDATA%\Elgato\StreamDeck\Plugins`. Restart Stream Deck. Remove the Chrome extension separately at `chrome://extensions`; its extracted folder can then be deleted.

For a **full reset**, also delete `%APPDATA%\MusicDeckBridge\auth.json` and `config.json` while Stream Deck is stopped. Stream Deck action settings/profiles are managed separately; see [privacy](../PRIVACY.md) for retention details.
