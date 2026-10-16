# Development

## Local checks

Use Node.js 24 and Python 3.10+. Packaging automatically tries `python3`/`python` or the Windows `py` launcher. Use `python3` instead of `python` in the commands below on systems without a `python` alias. No root npm dependencies or compilation step are required. JavaScript files in the plugin/extension folders are the deployed source.

```sh
npm ci --ignore-scripts
npm run check
npm test
python -m unittest discover -s tests -p "test_*.py"
npm run build:chrome
```

`check` verifies JavaScript syntax, JSON, manifest resource paths, permissions, version agreement, action UUIDs, locale keys and a limited set of accidental credentials/private files. `npm audit` covers npm dependencies; review the vendored sdpi-components/Lit bundle separately when upstream changes.

Node integration tests use temporary APPDATA directories and local TCP/WebSocket servers. Test files run serially because some tests share port `17864`. Keep a normal plugin instance off that port while testing. CI runs on Linux and Windows.

## Source files

- `streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/`: deployable plugin, settings and existing icon assets.
- `streamdeck/assets/music-mark.png`: supplied source mark. `generate_assets.py` can resize it into plugin/Chrome brand icons; existing action illustrations are retained. Requires Pillow (`python -m pip install Pillow`), only for optional asset regeneration.
- `chrome-extension/`: load unpacked directly in Chrome. User-facing popup/manifest strings live in `_locales/en` and `_locales/ko`.
- `store-assets/`: preparation checklists; screenshots and promotional images must be captured from the actual product before submission.

Use `io.github.minjungw00.musicdeckbridge` as the plugin UUID and action UUID prefix. Keep package paths, runtime routing, localized action keys, packaging scripts and tests in sync when changing identifiers. Authentication and port files are stored in `%APPDATA%\MusicDeckBridge`.

`MUSIC_DECK_BRIDGE_DEV_TEST=1` exposes deterministic test controls and must never be used in ordinary installs.

Keep the root and Chrome versions aligned, and append a fourth segment for the Stream Deck manifest: `X.Y.Z` becomes `X.Y.Z.0`.

## Packaging

Chrome:

```sh
npm run build:chrome
```

Produces `dist/music-deck-bridge-chrome-<version>.zip` with its manifest at the ZIP root. The packaging script stages an explicit allowlist of source files and adds LICENSE, NOTICE, THIRD_PARTY_NOTICES.md and PRIVACY.md.

Stream Deck (install the reviewed CLI version first):

```sh
npm install --global @elgato/cli@1.10.2
npm run build:streamdeck
```

The script stages the plugin plus notices under `dist/staging/`, invokes `streamdeck validate`, then `streamdeck pack ... --output dist/`. The output is `dist/io.github.minjungw00.musicdeckbridge.streamDeckPlugin`. Review validation warnings before distribution.

For Marketplace distribution, review Elgato's [DRM compatibility requirements](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/), including the official `@elgato/streamdeck` v2+ requirement for Node.js DRM distribution. [CLI packaging reference](https://docs.elgato.com/streamdeck/cli/commands/pack/).

## Release checklist

- Review bundled library versions/licenses and ensure notices are present in both artifacts.
- Resolve SDK/DRM compatibility and pass the official validator/packager.
- Test Windows 10/11 install, uninstall, update and clean reset on actual Stream Deck hardware.
- Check all key actions and Stream Deck + dials, en/ko UI, normal Chrome tab and installed app, artwork, idle recovery, extension reload/re-pairing and live port changes/conflict handling.
- Capture actual screenshots/video; complete store descriptions, permissions, privacy declarations and assets.
- Update versions and CHANGELOG, then create the matching `vX.Y.Z` tag.
- Manually run **Draft release** for an existing matching tag and confirm the readiness input. It reruns checks, builds both packages and creates a draft GitHub Release. Review its files and notes before publishing manually.

The workflow runs manually and creates a draft GitHub Release for review before publication.
