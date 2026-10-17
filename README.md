# Music Deck Bridge

Control YouTube Music from Elgato Stream Deck using a Chrome extension.

[한국어 설치 안내](docs/installation.ko.md) · [Installation](docs/installation.en.md) · [Troubleshooting](docs/troubleshooting.md)

Music Deck Bridge contains two components that must be installed together: a Stream Deck plugin that runs a local bridge, and a Chrome extension that reads and controls the YouTube Music web player. It works with a normal Chrome tab or the YouTube Music app installed through Chrome (PWA).

## Features

- Current song, artist and album artwork on a key; press to play or pause.
- Play/pause, previous track, next track and mute keys.
- Volume dial with 1–5 percentage points per tick and push to mute.
- Track dial with one track per tick (up to five per event) and push to play/pause.
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

## Installation

**Download the stable packages from [GitHub Releases](https://github.com/minjungw00/music-deck-bridge/releases/latest).** Prebuilt packages need no separate Node.js, npm or Python installation: Stream Deck provides the plugin runtime. Install both the `.streamDeckPlugin` and the Chrome extension, then complete PIN pairing.

| Method | Audience and availability | Instructions |
| --- | --- | --- |
| GitHub Releases | General users; stable prebuilt packages | [English](docs/installation.en.md#method-1-github-releases) / [한국어](docs/installation.ko.md#method-1-github-releases) |
| GitHub Actions | Testers; latest development packages, stability not guaranteed; GitHub sign-in required | [English](docs/installation.en.md#method-2-github-actions) / [한국어](docs/installation.ko.md#method-2-github-actions) |
| Build from source | Developers; requires Node.js 24 and npm, plus Python 3.10+ for packaging | [English](docs/installation.en.md#method-3-build-from-source) / [한국어](docs/installation.ko.md#method-3-build-from-source) |
| Official stores | General users; Elgato Marketplace and Chrome Web Store links pending approval, tracked separately | [English](docs/installation.en.md#method-4-official-stores) / [한국어](docs/installation.ko.md#method-4-official-stores) |

See the guides for [PIN pairing](docs/installation.en.md#pairing), updates, switching installation methods and removal. Chrome ZIP packages must be extracted to a permanent folder and loaded unpacked in Developer mode.

## Development

Install Node.js 24, then run:

```sh
npm ci --ignore-scripts
npm run check
npm test
```

`npm run build:plugin` needs only Node.js and npm. Packaging uses Python 3.10+ (`python3`, `python`, or Windows `py`). See [development and release checks](docs/development.md) for source builds, tests and packaging.

```text
streamdeck/        Plugin source, bundle/resources and icon generator
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
