# Release readiness

Last updated: October 24, 2026 (Asia/Seoul). Current distribution status and remaining checks are summarized here; completed evidence is consolidated by topic below.

## Distribution status

| Channel | Version and state | Record |
| --- | --- | --- |
| GitHub | **v1.1.2**, published October 18 at 23:43 KST | [Release verification](verification/releases.md#v112) |
| Elgato Marketplace | **Published**, maintainer-confirmed; last reported submission **v1.1.2** | [Public listing](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd) · [Store record](verification/stores.md) |
| Chrome Web Store | **Published**, maintainer-confirmed; last reported submission **v1.1.2** | [Public listing](https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca) · [Store record](verification/stores.md) |

The current GitHub stable release is **1.1.2**: Chrome **1.1.2**, plugin **1.1.2.0**, protocol **1**. The maintainer confirmed operation of the GitHub release, later the published Chrome extension with the released plugin, and now publication and normal operation of both official store components. Exact-source Windows/Ubuntu CI, package/source comparison and anonymous public downloads passed verification. The refactor and subsequent confirmations are recorded in [runtime verification](verification/runtime.md#112-development-refactor). Previously published packages and the recorded v1.1.1 submitted descriptions remain fixed under the [versioning policy](versioning.md). README and both installation guides link to both stores. Store publication and runtime results are maintainer-confirmed, without independent page/runtime verification.

## Verified scope

- **Release:** exact-source Windows/Ubuntu [CI 39136965856](https://github.com/minjungw00/music-deck-bridge/actions/runs/39136965856), 154 Node tests, two Python tests, Chromium integration, dependency audit with zero reported vulnerabilities, official packaging and public download checksums/bytes passed for v1.1.2.
- **Operation:** the maintainer confirmed normal operation of both published store components on October 24, following the released-version and Chrome-store confirmations. Earlier itemized confirmation covers displays, controls, pairing recovery, retained settings and rollback within its original scope. Exact Console-processed package identity and detailed DRM execution results were not supplied separately; this does not reopen completed normal-operation confirmation.
- **Installation:** a later rename denial was reproduced and traced to an Explorer folder handle; closing that folder allowed the same installer to succeed. No installer code fix is claimed.
- **Media/copy:** official popup renderings display 1.1.1, the actual device capture is retained, and store-sized exports are prepared. The supplied v1.1.1 descriptions remain preserved in English for both stores and Korean for Chrome; revised 1.1.2 copy and exact uploaded package/media identities were not supplied.

## Remaining work

1. Track later store revisions and retain version identifiers, uploaded-file hashes and media selections when available; both public product URLs/IDs are recorded.
2. Record separately obtained Console-processed package identity and detailed DRM results without repeating completed store-operation validation solely for missing metadata.
3. When revising live listings, replace temporary companion-download instructions with public store links and record later supplied descriptions separately from historical snapshots.
4. For future wire changes, test their implemented version ranges and explicit component identities/status. Current compatibility fixtures and maintainer confirmations retain their stated scopes.
5. Extend evidence to independent/clean Windows environments and idle/port-conflict scenarios outside the existing maintainer-confirmed scope.

## Verification records

### Releases, submissions and media

| Record | Purpose |
| --- | --- |
| [Releases](verification/releases.md) | Published source, exact-source CI, public hashes and compact history |
| [Store submissions](verification/stores.md) | Review status, actual submitted descriptions and missing provenance |
| [Media](verification/media.md) | Source images, lossless crop and export checks |
| [Marketplace DRM](verification/marketplace-drm.md) | Processed-package provenance and detailed execution coverage |

### Runtime and installation

| Record | Purpose |
| --- | --- |
| [Runtime](verification/runtime.md) | Automated coverage, maintainer sign-off and protocol limits |
| [Installation](verification/installation.md) | Failed/successful comparisons, Explorer-handle evidence and conclusion |

[Security readiness](security-readiness.md) covers repository security settings and inspection limits. The [changelog](../CHANGELOG.md) describes user-visible changes. Superseded intermediate reports remain in Git history rather than separate active documents.
