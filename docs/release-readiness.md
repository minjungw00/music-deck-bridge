# Release readiness

Updated November 7, 2026 (Asia/Seoul) with the November 6 Elgato listing observation. General installation starts with the [official stores](installation.en.md#method-1-official-stores). Public releases, local development and store processing have separate evidence.

## Current versions and distribution

| Channel | Version / state | Evidence |
| --- | --- | --- |
| GitHub | **v1.1.3**, Chrome **1.1.3**, plugin **1.1.3.0**, protocol **1** | Published October 29 at 08:22 KST; latest non-draft/non-prerelease API result and anonymous download bytes verified · [Release record](verification/releases.md#v113) |
| Elgato Marketplace | Public listing **1.1.3**, dated **November 2, 2026** on the page | November 6 observation confirmed the version and corrected installation copy. Last maintainer-reported submission was **1.1.2** / plugin **1.1.2.0** · [Store record](verification/stores.md) |
| Chrome Web Store | Publication reported October 24. Current listed version is unverified. | Last maintainer-reported submission was **1.1.2** · [Store record](verification/stores.md) |
| Release checkout | **1.1.3**, Chrome **1.1.3**, plugin **1.1.3.0**, protocol **1** | Authorized promotion complete; tag source `5a8447431167`, final stable-source CI/packages and GitHub publication verified; no next development target selected |

The [Elgato listing now recommends Add to Chrome and offers the GitHub Releases ZIP as an optional manual method](verification/stores.md#public-description-correction). The October 29 draft is historical reference copy.

## Development validation

The [runtime record](verification/runtime.md#current-evidence) is the source for detailed scope, failed-candidate history and the [local artifact inventory](verification/runtime.md#development-artifact-inventory).

| Area | Current evidence | Remaining limit |
| --- | --- | --- |
| Final development checks | At `131b5ef3ebe2`: fresh locked install, 218 Node tests, two Python tests, syntax/resources/versions, audit with zero reported vulnerabilities and Chromium MV3 integration; exact-source [Windows/Ubuntu CI](https://github.com/minjungw00/music-deck-bridge/actions/runs/40785323853) passed | Automated fixtures; no independent Windows/site operation |
| Startup and destination playback | Maintainer reported new-window recovery normal, then confirmed destination recovery before refactoring | Preserve that confirmation; it is not a complete post-refactor/hardware inventory |
| First Previous at a restored selection | Later real log shows healthy playing state; the site button similarly restarts the same song after time has advanced; boundary regression is included in the passing 218-test full run | Actual queue/history absence remains an interpretation; a restart at zero without observable evidence can remain unconfirmed |
| Security dependencies | Dated locked installation/audit and schema comparisons support the scoped Zod override | Review the override when utils declares a patched range; audit results are time-specific |
| Development packages | Clean `131b5ef3ebe2` [review build](verification/runtime.md#development-artifact-inventory): official validator/packager passed; checksums, all payload files, versions and legal notices match source | Linux development packages; that review checked CI metadata only. Final stable-source archives and public bytes were subsequently verified below |

## Published release and historical verification

| Area | Completed evidence | Scope limits |
| --- | --- | --- |
| Latest GitHub release, 1.1.3 | Exact-source Windows/Ubuntu [CI 40786383387](https://github.com/minjungw00/music-deck-bridge/actions/runs/40786383387): 218 Node tests, two Python tests, Chromium integration, audit with zero reported vulnerabilities, official packaging, source comparison and anonymous public download hashes/bytes | GitHub packages only. Store package identity and new hardware/DRM operation remain unverified. |
| Earlier release, 1.1.2 | Exact-source Windows/Ubuntu [CI 39136965856](https://github.com/minjungw00/music-deck-bridge/actions/runs/39136965856): 154 Node tests, two Python tests, Chromium integration and verified public package bytes | Historical scope retained in [release verification](verification/releases.md#v112) |
| Earlier operation, 1.1.2 | Maintainer confirmed released 1.1.2, the Chrome-store extension with the released plugin, then both published store components on October 24 | Exact processed-package identity and detailed DRM results not supplied separately |
| Device and recovery | Earlier itemized maintainer checks cover displays, controls, pairing recovery, retained settings and rollback | Each historical sign-off retains its original scope |
| Installation investigation | Explorer descendant-folder handles were observed; closing the folder allowed the same installer to succeed | No installer code fix or universal cause is claimed |
| Media and copy | Actual device capture retained; sample popup renderings show 1.1.1; sized exports and verbatim v1.1.1 submitted descriptions preserved | Later submitted copy and exact uploaded package/media identities were not supplied |

## Remaining work

The authorized 1.1.3 GitHub release is complete through the direct publication path in the [release checklist](development.md#release-checklist). Exact tagged-source CI, both OS package payloads, release inventories and anonymous public downloads passed verification. Release notes disclose outstanding manual coverage. The [runtime record](verification/runtime.md#current-evidence) preserves the scope of maintainer confirmation.

- Record the 1.1.3 Maker Console submission and review history, version identifier, uploaded-file identity and SHA-256, selected media and exact submitted description when available.
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
