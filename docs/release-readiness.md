# Release readiness

Last updated: October 18, 2026 (Asia/Seoul). Current distribution status and remaining checks are summarized here; completed evidence is consolidated by topic below.

## Distribution status

| Channel | Version and state | Record |
| --- | --- | --- |
| GitHub | **v1.1.1**, published October 18 at 16:16 KST | [Release verification](verification/releases.md#v111) |
| Elgato Marketplace | **v1.1.1**, registered, **Pending review** | [Store submissions](verification/stores.md) |
| Chrome Web Store | **v1.1.1**, registered, **Pending review** | [Store submissions](verification/stores.md) |

The selected development target is **1.1.2-dev**: Chrome numeric version **1.1.2**, plugin **1.1.2.0**, protocol **1**. Its architectural refactor and local validation are recorded in [runtime verification](verification/runtime.md#112-development-refactor). The published/submitted v1.1.1 artifacts above remain separate and fixed under the [versioning policy](versioning.md). Public store install links await approval, publication and installation verification.

## Verified scope

- **Release:** exact-source Windows/Ubuntu CI, 117 Node tests, two Python tests, Chromium integration, official packaging and public download checksums/bytes passed.
- **Device/Chrome:** the maintainer confirmed displays, controls, pairing recovery, retained settings and rollback. That sign-off predates protocol negotiation and the later v1.1.1 popup corrections.
- **Installation:** a later rename denial was reproduced and traced to an Explorer folder handle; closing that folder allowed the same installer to succeed. No installer code fix is claimed.
- **Media/copy:** official popup renderings display 1.1.1, the actual device capture is retained, and store-sized exports are prepared. Actual submitted descriptions are preserved in English for both stores and Korean for Chrome; uploaded package/media identities remain unconfirmed.

## Remaining work

1. Track both store reviews and requested revisions; retain store IDs, uploaded-file hashes and media selections.
2. Obtain and execute the Marketplace **Console-processed v1.1.1 installer**; DRM execution is still untested.
3. After publication, verify each install URL, store-installed operation and Chrome unpacked-to-store migration/new PIN pairing. Update public companion-download links and live listing instructions accordingly.
4. Confirm explicit component identities/protocol status and retained pairing on the actual Windows pair; compatibility fixtures already pass.
5. Extend evidence to independent/clean Windows environments and idle/port-conflict scenarios outside the existing maintainer-confirmed scope. Future wire changes need tests for their implemented ranges.

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
