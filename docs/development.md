# Development

## Developer requirements

These tools are for contributors; users of prebuilt packages need none of them. See [installation](installation.en.md) for all four installation methods.

- Git, Node.js 24 and npm for source builds and Node checks.
- Python 3.10+ for packaging and Python tests. It is **not required** by `npm run build:plugin` or manual plugin-folder installation.

Packaging automatically tries `python3`/`python` or the Windows `py` launcher. Use `python3` instead of `python` in the commands below on systems without a `python` alias. Run `npm ci --ignore-scripts` to install the pinned official SDK, esbuild and Elgato CLI. `npm run build:plugin` bundles the plugin and its runtime dependencies into `bin/plugin.js`; the output is ignored by Git. Chrome JavaScript is deployed directly.

## Local checks

```sh
npm ci --ignore-scripts
npm run check
npm test
python -m unittest discover -s tests -p "test_*.py"
npm run build:chrome
```

`check` and `test` rebuild the plugin automatically before running. `check` verifies JavaScript syntax, JSON, manifest resource paths, permissions, version agreement, action UUIDs, locale keys and a limited set of accidental credentials/private files. `npm audit` covers npm dependencies; review the vendored sdpi-components/Lit bundle separately when upstream changes.

Node integration tests use temporary APPDATA directories and local TCP/WebSocket servers. Test files run serially because some tests share port `17864`. Keep a normal plugin instance off that port while testing. CI runs on Linux and Windows, validates and packages both components, and uploads artifacts for each OS. SDK integration tests use the pinned `ws` development dependency as their mock Stream Deck server, launch a copied standalone bundle without a local node_modules folder and exercise keys, dials, inspector messages, settings and rendering, including an opaque-manifest fixture. They require a normal WebSocket close handshake before stopping the child, wait for its stdio to close before deleting the installed copy, and report socket lifecycle, exit code/signal and stdout/stderr on failure. That fixture is not a substitute for Maker Console DRM testing.

## Source files

- `streamdeck/src/plugin.cjs`: plugin source.
- `streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/`: plugin resources and generated executable; deployable after `npm run build:plugin`.
- `streamdeck/generate_assets.py`: source for all project brand/action icons, drawn from geometric primitives without external artwork. Optional regeneration requires Pillow 12.0.0 (`python -m pip install Pillow==12.0.0`), then `python streamdeck/generate_assets.py`. No Python packages are required to build or package the committed PNG files.
- `chrome-extension/`: load unpacked directly in Chrome. User-facing popup/manifest strings live in `_locales/en` and `_locales/ko`.
- `store-assets/`: English/Korean listing copy, permissions and capture checklists. Screenshots and promotional images must be captured from the actual product before submission.

Use `io.github.minjungw00.musicdeckbridge` as the plugin UUID and action UUID prefix. Keep package paths, runtime routing, localized action keys, packaging scripts and tests in sync when changing identifiers. Authentication and port files are stored in `%APPDATA%\MusicDeckBridge`.

`MUSIC_DECK_BRIDGE_DEV_TEST=1` exposes deterministic test controls and must never be used in ordinary installs.

Keep the root/lockfile at `X.Y.Z-dev` during development. Chrome uses numeric `X.Y.Z` with `version_name: X.Y.Z-dev`; Stream Deck uses fixed `X.Y.Z.0`. Builds change identity through SHA and metadata, without incrementing release or manifest versions. Use the [versioning workflow](versioning.md) to synchronize or explicitly promote them.

## Browser integration regression

`npm test` runs the Node/SDK/HTTP fixtures. To exercise the actual MV3 runtime on Linux, install Chromium once with `npx playwright install --with-deps chromium`, then run `npm run test:browser`. OpenSSL is required to generate an ephemeral test certificate. Ubuntu CI runs this check automatically.

The browser test uses a fresh temporary profile and a local HTTPS fixture mapped to `music.youtube.com`. Certificate validation is disabled only in that test browser. It exercises real extension storage, authenticated loopback requests, cold-tab navigation, script injection, command/result messages and existing-tab reuse. It checks all eight input types in sequence and replaces a receiver during navigation. It does not establish actual YouTube Music selectors/account behavior, Windows native process startup or Marketplace DRM.

## Packaging

For local development packages, use `npm run build:dev`. It builds both components into a distinct `dist/development/<build-id>/` folder and includes local source metadata and checksums. See [development builds and replacement](versioning.md#build-and-test-development-packages). The individual commands below default to `dist/` and are also used by clean CI checkouts.

CI keeps both Windows and Ubuntu checks, including PR builds. Downloadable development builds are identified as `music-deck-bridge-dev-<windows|ubuntu>-<full-commit-sha>`. Recommend only successful `main` runs with both jobs passed to users; Ubuntu artifacts are packaging evidence, not Linux runtime support.

After both packages are built, `node scripts/artifacts.mjs development` records the development channel, source version, numeric package version, build ID, GitHub source SHA/ref, platform/architecture, run URL and attempt in `dist/BUILD-INFO.json` and hashes both packages plus this metadata in `dist/SHA256SUMS.txt`. This command uses GitHub Actions environment variables. PR artifacts keep their merge ref and SHA, distinct from `main`. Metadata/checksums remain alongside the packages; nothing is injected into the plugin or extension. Artifact retention follows repository settings (90 days by default); users must sign in to download and update development packages manually.

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

After building both components in a clean `dist/` (no old packages or development metadata), prepare release assets:

```sh
node scripts/artifacts.mjs release
node scripts/artifacts.mjs verify
```

This requires exactly the nonempty plugin installer and the Chrome ZIP matching `package.json`'s version, creates `SHA256SUMS.txt`, and rejects unexpected files. `dist/staging/` is allowed locally but never uploaded. Release verification compares both exact asset names and hashes, rejecting missing/empty packages, stale versions, malformed checksum lists and changed contents. No extra dependencies are needed for these Node commands.

The draft release contains exactly:

```text
io.github.minjungw00.musicdeckbridge.streamDeckPlugin
music-deck-bridge-chrome-<version>.zip
SHA256SUMS.txt
```

For Marketplace distribution, review Elgato's [DRM compatibility requirements](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/), including the official `@elgato/streamdeck` v2+ requirement for Node.js DRM distribution. [CLI packaging reference](https://docs.elgato.com/streamdeck/cli/commands/pack/).

## Release checklist

Keep the development target fixed while editing and testing; incrementing a released version requires a separate maintainer decision. Track the selected version, exact source SHA, package checksums, CI results and remaining manual checks in [release readiness](release-readiness.md) and the corresponding [verification record](README.md#release-and-verification-records). Keep released tags/assets and already submitted packages fixed; distribute changes as a new version.

The manual **Draft release** workflow requires its readiness confirmation to be true only when the described checks have actually been completed. For a maintainer-requested direct GitHub release, use packages from a successful Windows/Ubuntu CI run for the exact tagged commit, verify their checksums, and describe outstanding manual checks in the release notes. GitHub publication and store approval are separate decisions.

- Review repository security settings and the reporting route in [SECURITY.md](../SECURITY.md).
- Review bundled library versions/licenses and ensure notices are present in both artifacts.
- Pass the official validator/packager and download the processed DRM build from Maker Console (with publishing disabled) for an actual install/run test. SDK migration and local packaging do not complete this step.
- Test Windows 10/11 install, uninstall, update and clean reset on actual Stream Deck hardware.
- Check all key actions and Stream Deck + dials, en/ko UI, normal Chrome tab and installed app, artwork, idle recovery, extension reload/re-pairing and live port changes/conflict handling.
- Capture actual screenshots/video; complete store descriptions, permissions, privacy declarations and assets.
- When authorized to prepare the release, run `npm run version:release -- X.Y.Z` for the current target, update CHANGELOG, pass final checks and create the matching `vX.Y.Z` tag. Development versions cannot pass the release gate.
- Ensure the tagged source includes the current artifact scripts. Manually run **Draft release** for an existing matching tag and confirm the readiness input. It reruns checks, builds both packages, generates checksums and verifies them again after transfer to the draft job. Only the three named release assets are attached. Review the draft files and notes before publishing manually.

The workflow runs manually and creates a draft GitHub Release for review before publication.
