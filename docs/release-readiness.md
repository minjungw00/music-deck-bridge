# Release readiness

Reviewed October 29, 2026 (Asia/Seoul). General installation starts with the [official stores](installation.en.md#method-1-official-stores). Public releases, local development and store processing have separate evidence.

## Current versions and distribution

| Channel | Version / state | Evidence |
| --- | --- | --- |
| GitHub | **v1.1.2**, Chrome **1.1.2**, plugin **1.1.2.0**, protocol **1** | Latest non-draft/non-prerelease release re-read through GitHub API on October 29; original publication/byte checks in [Releases](verification/releases.md#v112) |
| Elgato Marketplace | Public listing **1.1.2**; last reported plugin submission **1.1.2.0** | Public version/copy inspected October 29; normal store operation maintainer-confirmed October 24 · [Store record](verification/stores.md) |
| Chrome Web Store | Last reported submission **1.1.2**, published | Maintainer-confirmed publication/operation October 24; current page/version could not be independently read · [Store record](verification/stores.md) |
| Development checkout | **1.1.3-dev**, Chrome numeric **1.1.3**, plugin **1.1.3.0**, protocol **1** | Dependency security updates, proportional key artwork, playback recovery and refactor; no 1.1.3 release promotion or store submission is recorded |

## Development validation

The [runtime record](verification/runtime.md#current-evidence) is the source for detailed scope, failed-candidate history and the [local artifact inventory](verification/runtime.md#development-artifact-inventory).

| Area | Current evidence | Remaining limit |
| --- | --- | --- |
| Automated refactor checks | At `cbd17925ad7d`: 217 Node tests, two Python tests, syntax/resources/versions and Chromium MV3 integration | Local fixtures; no independent Windows/site operation |
| Startup and destination playback | Maintainer reported new-window recovery normal, then confirmed destination recovery before refactoring | Preserve that confirmation; it is not a complete post-refactor/hardware inventory |
| First Previous at a restored selection | Later real log shows healthy playing state; the site button similarly restarts the same song after time has advanced; three targeted fixtures pass | Actual queue/history absence remains an interpretation; no full-suite result claimed for the later test-only revision |
| Security dependencies | Dated locked installation/audit and schema comparisons support the scoped Zod override | Review the override when utils declares a patched range; audit results are time-specific |

## Published release and historical verification

| Area | Completed evidence | Scope limits |
| --- | --- | --- |
| Release | Exact-source Windows/Ubuntu [CI 39136965856](https://github.com/minjungw00/music-deck-bridge/actions/runs/39136965856): 154 Node tests, two Python tests, Chromium integration, audit with zero reported vulnerabilities, official packaging, source comparison and anonymous public download hashes/bytes | GitHub package verification; store uploads are separate |
| Operation | Maintainer confirmed released 1.1.2, the Chrome-store extension with the released plugin, then both published store components on October 24 | Exact processed-package identity and detailed DRM results not supplied separately |
| Device and recovery | Earlier itemized maintainer checks cover displays, controls, pairing recovery, retained settings and rollback | Each historical sign-off retains its original scope |
| Installation investigation | Explorer descendant-folder handles were observed; closing the folder allowed the same installer to succeed | No installer code fix or universal cause is claimed |
| Media and copy | Actual device capture retained; sample popup renderings show 1.1.1; sized exports and verbatim v1.1.1 submitted descriptions preserved | Later submitted copy and exact uploaded package/media identities were not supplied |

## Remaining work

Prepare 1.1.3 only through the authorized [release checklist](development.md#release-checklist) and [versioning policy](versioning.md). Confirm the final source/CI/packages and document remaining manual coverage; a fixed development number or passing model is not a release.

- The Elgato installation-copy correction is still a [local draft](../store-assets/elgato/how-to-use.en.md). Apply and record it as a later listing revision when submitted; preserve actual submitted snapshots.
- For later store revisions, retain version identifiers, uploaded-file hashes, selected media and supplied descriptions. Refresh version-labelled sample media to match the submitted build.
- Record separately obtained Console-processed package identity and detailed DRM results. Completed store-operation validation does not need repeating solely for missing metadata.
- For future wire changes, test the implemented version ranges and explicit component identity/status behavior.
- Extend evidence to independent/clean Windows environments and idle/port-conflict scenarios outside the existing maintainer-confirmed scope.

## Verification records

### Releases, submissions and media

| Record | Purpose |
| --- | --- |
| [Releases](verification/releases.md) | Published source, exact-source CI, public hashes and history |
| [Stores](verification/stores.md) | Publication, submitted descriptions and provenance |
| [Media](verification/media.md) | Image sources, lossless crops and exports |
| [Marketplace DRM](verification/marketplace-drm.md) | Processed-package identity and detailed execution coverage |

### Runtime and installation

| Record | Purpose |
| --- | --- |
| [Runtime](verification/runtime.md) | Automated coverage, maintainer sign-offs and protocol limits |
| [Installation](verification/installation.md) | Failed/successful comparisons and Explorer-handle diagnosis |

See [security verification](security-readiness.md) for repository settings and inspection limits, and the [changelog](../CHANGELOG.md) for versioned changes.
