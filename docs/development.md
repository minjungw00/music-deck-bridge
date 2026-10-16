# Development

## Local checks

Use Node.js 24 and Python 3.10+. Packaging automatically tries `python3`/`python` or the Windows `py` launcher. Use `python3` instead of `python` in the commands below on systems without a `python` alias. Run `npm ci --ignore-scripts` to install the pinned official SDK, esbuild and Elgato CLI. `npm run build:plugin` bundles the plugin and its runtime dependencies into `bin/plugin.js`; the output is ignored by Git. Chrome JavaScript is deployed directly.

```sh
npm ci --ignore-scripts
npm run check
npm test
python -m unittest discover -s tests -p "test_*.py"
npm run build:chrome
```

`check` and `test` rebuild the plugin automatically before running. `check` verifies JavaScript syntax, JSON, manifest resource paths, permissions, version agreement, action UUIDs, locale keys and a limited set of accidental credentials/private files. `npm audit` covers npm dependencies; review the vendored sdpi-components/Lit bundle separately when upstream changes.

Node integration tests use temporary APPDATA directories and local TCP/WebSocket servers. Test files run serially because some tests share port `17864`. Keep a normal plugin instance off that port while testing. CI runs on Linux and Windows, validates and packages both components, and uploads artifacts for each OS. SDK integration tests launch a copied standalone bundle without a local node_modules folder and exercise keys, dials, inspector messages, settings and rendering, including an opaque-manifest fixture. That fixture is not a substitute for Maker Console DRM testing.

## Source files

- `streamdeck/src/plugin.cjs`: plugin source.
- `streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/`: plugin resources and generated executable; deployable after `npm run build:plugin`.
- `streamdeck/generate_assets.py`: source for all project brand/action icons, drawn from geometric primitives without external artwork. Optional regeneration requires Pillow 12.0.0 (`python -m pip install Pillow==12.0.0`), then `python streamdeck/generate_assets.py`. No Python packages are required to build or package the committed PNG files.
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

Stream Deck (uses the lockfile-pinned CLI 1.10.2):

```sh
npm ci --ignore-scripts
npm run build:streamdeck
```

The build first bundles the SDK and bridge; the packaging script stages the plugin plus notices under `dist/staging/`, invokes `streamdeck validate`, then `streamdeck pack ... --output dist/`. The output is `dist/io.github.minjungw00.musicdeckbridge.streamDeckPlugin`. Review validation warnings before distribution.

For Marketplace distribution, review Elgato's [DRM compatibility requirements](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/), including the official `@elgato/streamdeck` v2+ requirement for Node.js DRM distribution. [CLI packaging reference](https://docs.elgato.com/streamdeck/cli/commands/pack/).

## Release checklist

- Review bundled library versions/licenses and ensure notices are present in both artifacts.
- Pass the official validator/packager and download the processed DRM build from Maker Console (with publishing disabled) for an actual install/run test. SDK migration and local packaging do not complete this step.
- Test Windows 10/11 install, uninstall, update and clean reset on actual Stream Deck hardware.
- Check all key actions and Stream Deck + dials, en/ko UI, normal Chrome tab and installed app, artwork, idle recovery, extension reload/re-pairing and live port changes/conflict handling.
- Capture actual screenshots/video; complete store descriptions, permissions, privacy declarations and assets.
- Update versions and CHANGELOG, then create the matching `vX.Y.Z` tag.
- Manually run **Draft release** for an existing matching tag and confirm the readiness input. It reruns checks, builds both packages and creates a draft GitHub Release. Review its files and notes before publishing manually.

The workflow runs manually and creates a draft GitHub Release for review before publication.
