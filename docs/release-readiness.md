# Release readiness

Last updated: October 29, 2026 (Asia/Seoul). Both official stores are published and normal operation is maintainer-confirmed for 1.1.2. Install from the [official stores](installation.en.md#method-1-official-stores); dated evidence is linked below.

Current development target: **1.1.3-dev**, with [dependency security updates](verification/runtime.md#113-dependency-review) and [artwork/transport fixes](verification/runtime.md#113-artwork-and-transport-fixes). It has not been promoted or published; its automated checks do not extend the 1.1.2 maintainer sign-off to this candidate.

The maintainer confirmed operation after the destination-playback fix and requested refactoring. This confirmation covers the reported startup/destination follow-up within its stated scope. The current refactor preserves those playback policies and keeps the development target fixed; its local verification is separate from the maintainer's pre-refactor confirmation. See the [destination record](verification/runtime.md#navigation-destination-playback) and [refactor record](verification/runtime.md#playback-refactor).

## Distribution status

| Channel | Reported version | State and evidence |
| --- | --- | --- |
| Elgato Marketplace | Last submission **1.1.2** / plugin **1.1.2.0** | **Published**, maintainer-confirmed · [Listing](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd) · [Store record](verification/stores.md) |
| Chrome Web Store | Last submission **1.1.2** | **Published**, maintainer-confirmed · [Listing](https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca) · [Store record](verification/stores.md) |
| GitHub | **v1.1.2**, Chrome **1.1.2**, plugin **1.1.2.0**, protocol **1** | Published October 18 at 23:43 KST · [Release verification](verification/releases.md#v112) |

Store pages, displayed versions and runtime operation were not independently verified. README and both installation guides link to both stores. Published tags/assets and historical submitted descriptions remain fixed under the [versioning policy](versioning.md).

## Verified scope

| Area | Completed evidence | Scope limits |
| --- | --- | --- |
| Release | Exact-source Windows/Ubuntu [CI 39136965856](https://github.com/minjungw00/music-deck-bridge/actions/runs/39136965856): 154 Node tests, two Python tests, Chromium integration, audit with zero reported vulnerabilities, official packaging, source comparison and anonymous public download hashes/bytes | GitHub package verification; store uploads are separate |
| Operation | Maintainer confirmed released 1.1.2, the Chrome-store extension with the released plugin, then both published store components on October 24 | Exact processed-package identity and detailed DRM results not supplied separately |
| Device and recovery | Earlier itemized maintainer checks cover displays, controls, pairing recovery, retained settings and rollback | Each historical sign-off retains its original scope |
| Installation investigation | Explorer descendant-folder handles were observed; closing the folder allowed the same installer to succeed | No installer code fix or universal cause is claimed |
| Media and copy | Actual device capture retained; sample popup renderings show 1.1.1; sized exports and verbatim v1.1.1 submitted descriptions preserved | Later submitted copy and exact uploaded package/media identities were not supplied |

## Remaining work

- For later store revisions, retain version identifiers, uploaded-file hashes, selected media and supplied descriptions. Replace temporary companion-download instructions when revising live listings; preserve historical snapshots.
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
