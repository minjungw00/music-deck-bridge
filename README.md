# Music Deck Bridge

Control YouTube Music from Elgato Stream Deck using a Chrome extension.

[한국어 설치 안내](docs/installation.ko.md) · [Installation](docs/installation.en.md) · [Troubleshooting](docs/troubleshooting.md)

Music Deck Bridge contains two components that must be installed together: a Stream Deck plugin that runs a local bridge, and a Chrome extension that reads and controls the YouTube Music web player. It works with a normal Chrome tab or the YouTube Music app installed through Chrome (PWA).

## Features

- Current song, artist and album artwork on a key; press to play or pause.
- Play/pause, previous track, next track and mute keys.
- Volume dial with 1–5 percentage points per tick and push to mute.
- Track dial with turn to skip and push to play/pause.
- English and Korean settings; truncated or scrolling track titles.
- Six-digit PIN pairing, an authenticated loopback bridge and a configurable shared port.
- Preference for an installed Chrome app when both an app and browser tab are open.

## Requirements

| Component | Supported target |
| --- | --- |
| OS | Windows 10 / 11 |
| Browser | Google Chrome 116+ |
| Stream Deck software | 7.1+ (provides Node.js 24) |
| Device | Key actions target Stream Deck key models; encoder actions require Stream Deck + |
| Languages | English / 한국어 |

## Install from source

1. Download or clone this repository. Quit Stream Deck from its system tray menu.
2. Copy the `streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin` folder into `C:\Users\username\AppData\Roaming\Elgato\StreamDeck\Plugins`, replacing `username` with your Windows account name. Copy the root `LICENSE`, `NOTICE`, `THIRD_PARTY_NOTICES.md` and `PRIVACY.md` into the installed plugin folder, then start Stream Deck.
3. Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `chrome-extension/`.
4. Add a Music Deck Bridge action in Stream Deck. In its settings, select **Generate PIN**.
5. Open the extension popup and enter the six-digit PIN within ten minutes. The default port is `17864`.
6. Open or refresh [YouTube Music](https://music.youtube.com/) in Chrome and play a track.

See the installation guides for updates, custom ports and removal. Source installation needs no separate Node.js installation; development and packaging do.

## Development

Install Node.js 24, then run:

```sh
npm ci --ignore-scripts
npm run check
npm test
```

Packaging uses Python 3.10+ (`python3`, `python`, or Windows `py`). `npm run build:chrome` creates a ZIP with `manifest.json` at its root. Stream Deck packaging additionally requires the Elgato CLI. See [development and release checks](docs/development.md).

```text
streamdeck/        Stream Deck plugin package and source artwork
chrome-extension/ Chrome Manifest V3 extension and en/ko locales
tests/            Node.js regression tests and Python packaging tests
scripts/          Validation and packaging tools
docs/             Architecture, installation and development guides
store-assets/     Store submission assets and checklists
```

## Privacy, security and license

Playback data travels between the extension and `127.0.0.1`; the plugin also downloads artwork from approved Google/YouTube image servers. See [privacy](PRIVACY.md), [security reporting](SECURITY.md), [third-party notices](THIRD_PARTY_NOTICES.md) and [contribution guidelines](CONTRIBUTING.md).

Project code is licensed under [Apache-2.0](LICENSE). Bundled third-party code retains its own license.

This is an independent, unofficial project, unaffiliated with Google, YouTube, Elgato or Corsair. Their names identify compatible products and remain the property of their respective owners.
