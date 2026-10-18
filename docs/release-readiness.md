# Release readiness

Last updated: October 18, 2026 (Asia/Seoul). Current distribution status and remaining checks are summarized here; completed evidence is consolidated by topic below.

## Distribution status

| Channel | Version and state | Record |
| --- | --- | --- |
| GitHub | **v1.1.2**, published October 18 at 23:43 KST | [Release verification](verification/releases.md#v112) |
| Elgato Marketplace | **v1.1.1**, registered, **Pending review** | [Store submissions](verification/stores.md) |
| Chrome Web Store | **v1.1.1**, registered, **Pending review** | [Store submissions](verification/stores.md) |

The current GitHub stable release is **1.1.2**: Chrome **1.1.2**, plugin **1.1.2.0**, protocol **1**. The maintainer confirmed normal operation before authorizing promotion. Exact-source Windows/Ubuntu CI, package/source comparison and anonymous public downloads passed verification. Its architectural refactor, local validation and maintainer confirmation are recorded in [runtime verification](verification/runtime.md#112-development-refactor). The previously published/submitted v1.1.1 artifacts remain separate and fixed under the [versioning policy](versioning.md). Public store install links await approval, publication and installation verification.

## Verified scope

- **Release:** exact-source Windows/Ubuntu [CI 39136965856](https://github.com/minjungw00/music-deck-bridge/actions/runs/39136965856), 154 Node tests, two Python tests, Chromium integration, dependency audit with zero reported vulnerabilities, official packaging and public download checksums/bytes passed for v1.1.2.
- **Device/Chrome:** the maintainer confirmed normal operation after the 1.1.2 refactor. Earlier itemized sign-off covers displays, controls, pairing recovery, retained settings and rollback within its original scope; neither report establishes Marketplace DRM execution.
- **Installation:** a later rename denial was reproduced and traced to an Explorer folder handle; closing that folder allowed the same installer to succeed. No installer code fix is claimed.
- **Media/copy:** official popup renderings display 1.1.1, the actual device capture is retained, and store-sized exports are prepared. Actual submitted descriptions are preserved in English for both stores and Korean for Chrome; uploaded package/media identities remain unconfirmed.

## Remaining work

1. Track both store reviews and requested revisions; retain store IDs, uploaded-file hashes and media selections.
2. Obtain and execute the Marketplace **Console-processed v1.1.1 installer**; DRM execution is still untested.
3. After publication, verify each install URL, store-installed operation and Chrome unpacked-to-store migration/new PIN pairing. Update public companion-download links and live listing instructions accordingly.
4. For future wire changes, test their implemented version ranges and explicit component identities/status. Current compatibility fixtures and the maintainer's normal-operation confirmation retain their stated scopes.
5. Extend evidence to independent/clean Windows environments and idle/port-conflict scenarios outside the existing maintainer-confirmed scope.

## Verification records

### Releases, submissions and media

| Record | Purpose |
| --- | --- |
| [Releases](verification/releases.md) | Published source, exact-source CI, public hashes and compact history |
| [Store submissions](verification/stores.md) | Review status, actual submitted descriptions and missing provenance |
| [Media](verification/media.md) | Source images, lossless crop and export checks |
| [Marketplace DRM](verification/marketplace-drm.md) | Required processed package and pending execution matrix |

### Runtime and installation

| Record | Purpose |
| --- | --- |
| [Runtime](verification/runtime.md) | Automated coverage, maintainer sign-off and protocol limits |
| [Installation](verification/installation.md) | Failed/successful comparisons, Explorer-handle evidence and conclusion |

[Security readiness](security-readiness.md) covers repository security settings and inspection limits. The [changelog](../CHANGELOG.md) describes user-visible changes. Superseded intermediate reports remain in Git history rather than separate active documents.
