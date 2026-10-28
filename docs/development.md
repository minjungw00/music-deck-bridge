# Development

Use the [installation guides](installation.en.md) for normal use. This guide covers source changes, local checks, packaging and releases.

- [Developer requirements](#developer-requirements)
- [Local checks](#local-checks)
- [Source files](#source-files)
- [Browser integration regression](#browser-integration-regression)
- [Packaging](#packaging)
- [Release checklist](#release-checklist)

## Developer requirements

| Tool | Used for |
| --- | --- |
| Git, Node.js 24 and npm | Source builds, Node tests and the pinned SDK/CLI dependencies |
| Python 3.10+ | Packaging and Python tests; optional for a plugin bundle or manual folder installation |
| Playwright Chromium and OpenSSL | The Linux browser integration test |
| Pillow 12.0.0, optional | [Regenerating icons](branding.md#reproduction-and-validation) |

Packaging tries `python3`, `python` or the Windows `py` launcher. Use `python3` in the commands below if your system has no `python` alias.

## Local checks

From the repository root:

```sh
npm ci --ignore-scripts
npm run check
npm test
python -m unittest discover -s tests -p "test_*.py"
npm run build:chrome
```

`check` and `test` rebuild the plugin automatically. `npm ci` installs the pinned official SDK, esbuild and Elgato CLI.

| Check | Coverage |
| --- | --- |
| `npm run check` | JavaScript syntax, JSON, manifest resources, permissions, versions, action UUIDs, locale keys and limited accidental-secret patterns |
| `npm test` | Node, HTTP, SDK, settings and rendering fixtures; four test processes |
| Python tests | Package allowlists, notices and preserved resource bytes |
| `npm audit` | npm dependency advisories; review the vendored sdpi-components/Lit bundle separately |

### Integration fixtures and CI

Node integration tests need permission to open local TCP/WebSocket listeners. They use temporary APPDATA directories and ports from `tests/helpers/bridge.mjs`, leaving the default bridge port free.

SDK fixtures use the pinned `ws` development dependency to emulate Stream Deck and launch a copied standalone bundle without `node_modules`. They exercise keys, dials, inspector messages, settings, rendering and opaque manifests. Cleanup requires a normal WebSocket close, bounded child shutdown and closed process/stdio before deleting temporary files. Failures report socket lifecycle, exit code/signal and stdout/stderr.

CI checks and packages both components on Windows and Ubuntu, including pull requests. Ubuntu artifacts demonstrate packaging; Linux runtime use is not supported. Opaque-manifest fixtures do not establish Maker Console DRM execution. Dated results belong in the [verification records](README.md#release-and-verification-records).

## Source files

| Path | Responsibility |
| --- | --- |
| `streamdeck/src/` | Plugin modules; `plugin.cjs` composes domain, application, adapter and presentation layers |
| `streamdeck/io.github.minjungw00.musicdeckbridge.sdPlugin/` | Plugin resources and generated `bin/plugin.js`; deployable after `npm run build:plugin` |
| `chrome-extension/` | Chrome source, loaded unpacked directly; popup/manifest strings are in `_locales/en` and `_locales/ko` |
| `scripts/package.py` | Explicit package allowlists; add every new runtime resource here |
| `streamdeck/generate_assets.py` | Geometric brand/action icon source; committed PNGs need no Python packages to build or package |
| `store-assets/` | Listing copy, source captures, sample popup renderings and sized upload images |

`npm run build:plugin` bundles the official SDK and runtime dependencies into the ignored `bin/plugin.js`. Chrome JavaScript is deployed directly. Its `background.js` loads classic worker modules under `background/`; `content.js` composes modules under `content/`. The manifest's ordered content list is reused for reinjection.

See [code boundaries](architecture.md#code-boundaries) for module ownership, [plugin identity](architecture.md#plugin-identity) for UUIDs/storage and the [versioning policy](versioning.md) for fixed development targets and build metadata. Identifier changes must keep manifests, paths, routing, locales, packaging and tests synchronized.

`MUSIC_DECK_BRIDGE_DEV_TEST=1` exposes deterministic test controls. Use it only in fixtures.

## Browser integration regression

On Linux, install Chromium once, then run the actual MV3 fixture:

```sh
npx playwright install --with-deps chromium
npm run test:browser
```

OpenSSL generates an ephemeral test certificate. Ubuntu CI runs this check automatically.

The test uses a fresh temporary profile and local HTTPS fixture mapped to `music.youtube.com`. Certificate validation is disabled only in that test browser. It exercises real extension storage, authenticated loopback requests, cold-tab navigation, script injection, command/result messages and existing-tab reuse.

Nine inputs include the Now Playing key and Open YouTube Music. The fixture delays player readiness after visible controls, models stale media-element state and replaces a receiver during navigation. It does not establish signed-in YouTube Music behavior, Windows native startup or Marketplace DRM.

Playback cases also cover ignored initial/destination Play requests, one navigation click per input, bounded recovery, later Pause and superseded monitors. MAIN-world helpers must remain self-contained when serialized; add any new worker module to both the import graph and package allowlist. Keep actual-site comparisons in [runtime verification](verification/runtime.md).

## Packaging

### Local development builds

```sh
npm run build:dev
```

Both components, source metadata and checksums go into a distinct `dist/development/<build-id>/` folder. Versions remain fixed during the development cycle; see [build identity and replacement](versioning.md#build-and-test-development-packages).

### Individual packages

These commands default to `dist/` and also run in clean CI checkouts:

```sh
npm run build:chrome
npm run build:streamdeck
```

| Output | Packaging behavior |
| --- | --- |
| `music-deck-bridge-chrome-<version>.zip` | Stages the source allowlist with `manifest.json` at the ZIP root |
| `io.github.minjungw00.musicdeckbridge.streamDeckPlugin` | Bundles the SDK/bridge, stages under `dist/staging/`, then runs the pinned CLI 1.10.3 validator and packager |

Both packages include LICENSE, NOTICE, THIRD_PARTY_NOTICES.md and PRIVACY.md. Review validation warnings before distribution. See the [official CLI packaging reference](https://docs.elgato.com/streamdeck/cli/commands/pack/).

### CI development artifacts

Artifacts are named `music-deck-bridge-dev-<windows|ubuntu>-<full-commit-sha>`. For testers, select successful `main` runs with both OS jobs passed. Downloads require GitHub sign-in and updates are manual. Retention follows repository settings, normally 90 days.

After packaging, `node scripts/artifacts.mjs development` uses GitHub Actions environment variables to create:

- `BUILD-INFO.json`: channel, source/numeric versions, build ID, SHA/ref, platform/architecture, run URL and attempt. Pull-request artifacts retain their merge ref/SHA.
- `SHA256SUMS.txt`: hashes of both packages and the metadata file.

Metadata stays alongside the packages and is not injected into either component.

### Release assets

After an authorized [version promotion](versioning.md#promote-a-release), build both packages into a clean `dist/` without old packages or development metadata, then run:

```sh
node scripts/artifacts.mjs release
node scripts/artifacts.mjs verify
```

The commands require the nonempty packages matching `package.json`, generate checksums and reject stale versions, unexpected files, malformed inventories or changed bytes. `dist/staging/` is allowed locally and excluded from uploads. No additional Node dependencies are required.

A GitHub release contains exactly:

```text
io.github.minjungw00.musicdeckbridge.streamDeckPlugin
music-deck-bridge-chrome-<version>.zip
SHA256SUMS.txt
```

Marketplace processing is separate. Review Elgato's [DRM distribution requirements](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/), including official SDK v2+ for Node.js DRM, and retain processed-package evidence in the [DRM record](verification/marketplace-drm.md).

## Release checklist

Keep the selected development target fixed until a maintainer authorizes promotion. Record the target, exact source SHA, package checksums, CI results and outstanding checks in [release readiness](release-readiness.md) and its topic records. Preserve published tags/assets and submitted packages; later changes are separate revisions.

1. Review [repository security settings](security-readiness.md), the [reporting route](../SECURITY.md), bundled library versions/licenses and package notices.
2. Pass local/CI checks and the official validator/packager. For actual DRM coverage, download the Maker Console processed build with publishing disabled and record its install/run results; local SDK fixtures do not complete this step.
3. Verify relevant Windows 10/11 installation, removal, updates and reset on Stream Deck hardware. Cover keys/dials, en/ko UI, Chrome tab/app, artwork, idle recovery, reload/re-pairing, live ports and conflicts. Respect completed maintainer validation within its stated scope.
4. Prepare actual screenshots/video, store descriptions, permission/privacy declarations and upload assets.
5. When authorized, run `npm run version:release -- X.Y.Z` for the current target, update CHANGELOG, pass final checks and create the matching `vX.Y.Z` tag. Development versions cannot pass the release gate.
6. Choose the publication path below and verify downloaded asset names and checksums before publication. GitHub publication and store approval remain separate results.

| Publication path | Required evidence and behavior |
| --- | --- |
| Manual **Draft release** workflow | Tagged source includes current artifact scripts. Set readiness confirmation only when its checks are complete. The workflow reruns checks, builds packages, verifies transfer checksums and attaches only the three release assets to a draft. Review notes/files before publishing manually. |
| Maintainer-requested direct GitHub release | Use a successful Windows/Ubuntu CI run for the exact tagged commit, verify package checksums and describe outstanding manual checks in release notes. |
