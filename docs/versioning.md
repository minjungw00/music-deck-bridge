# Versioning and development builds

Application release numbers and [wire protocol versions](protocol.md) are independent. The plugin and extension report their own application identities; only intersecting protocol ranges determine communication compatibility. Ordinary application changes do not increment the protocol version.

## Development cycle

### Version and build identity

Choose the intended release number once, then keep `package.json` and the lockfile at `X.Y.Z-dev` throughout development. Ordinary fixes, documentation changes, commits, CI runs and local test builds do not increment that number. A new intended release number is a maintainer decision, not an installer workaround.

Build identity is separate: `BUILD-INFO.json` records the full commit, build ID, platform and CI run/attempt or local build time. Local builds also record whether uncommitted changes were present. A dirty build is not an exact reproduction of its recorded commit; keep the delivered checksums for its identity.

The following values are illustrative:

| Field | Development example | Promoted release example |
| --- | --- | --- |
| Root and lockfile version | `1.1.0-dev` | `1.1.0` |
| Chrome `version` | `1.1.0` | `1.1.0` |
| Chrome `version_name` | `1.1.0-dev` | Omitted |
| Stream Deck `Version` | `1.1.0.0` | `1.1.0.0` |
| Build identity | Commit SHA plus CI/local build information | Approved source tag and package checksums |

Chrome requires a [numeric version and provides `version_name` for display](https://developer.chrome.com/docs/extensions/reference/manifest/version). Stream Deck requires [four numeric version components](https://docs.elgato.com/streamdeck/sdk/references/manifest/#manifest). These manifest numbers are fixed platform values, not evidence that a build has been released. Do not increment a fourth component per development build.

### Select a development target

Start an explicitly selected development cycle with:

```sh
npm run version:dev -- X.Y.Z
```

The command synchronizes the root, lockfile and both manifests. Repeating it with the same target does not increment versions. UUIDs, authentication, ports and configuration paths stay the same.

## Build and test development packages

```sh
npm run check
npm test
npm run build:dev
```

`build:dev` rebuilds the plugin, packages both components and writes `BUILD-INFO.json` and `SHA256SUMS.txt` under `dist/development/<build-id>/`. Each invocation gets a distinct build ID without editing source versions. CI uses its existing SHA-named artifacts and records the same separation between version and build identity.

### Replace an equal-version package

Same-cycle development packages have equal numeric versions. Stream Deck may reject installation as already installed; promoting the same target also leaves its numeric value unchanged. Use the backed-up [file replacement procedure](installation.en.md#replacing-plugin-files) for development replacement/downgrade, or the [source installation workflow](installation.en.md#method-4-build-from-source). Keep the unpacked Chrome extension in the same folder and reload it instead of removing/reinstalling it. Keep one active plugin and extension copy.

If an earlier development package has a higher numeric version, migrate with backed-up file replacement. Do not increase the intended release number just to make that installer accept an update. Public users upgrading from an older public release still use the ordinary newer-package update path.

## Promote a release

Only when preparing an authorized release, explicitly promote the current development target:

```sh
npm run version:release -- X.Y.Z
```

The command accepts only the current target, removes `-dev` and the Chrome development label, and updates all version sources together. It does not create a tag, publish a release or upload to a store. Run the [release checklist](development.md#release-checklist), validate final packages and create the matching tag only when authorized. Existing public tags and package files remain immutable.

The draft-release workflow checks the stable source version, matching tag and platform manifests. Artifact release/verification commands reject `-dev` versions. Development metadata is not accepted in the release-asset inventory. After a release, select the next development cycle explicitly; ordinary build commands never select or promote a release.
