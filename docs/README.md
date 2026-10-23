# Documentation

Start with the [English installation guide](installation.en.md) or [한국어 설치 안내](installation.ko.md). Both begin with the recommended official-store installation.

## Guides

### Using Music Deck Bridge

| Task | Guide |
| --- | --- |
| Install, pair, update or remove | [English](installation.en.md) / [한국어](installation.ko.md) |
| Diagnose connection, player or installation problems | [Troubleshooting](troubleshooting.md) |
| Understand data handling or report a vulnerability | [Privacy](../PRIVACY.md) / [Security](../SECURITY.md) |

### Developing and publishing

| Task | Guide |
| --- | --- |
| Set up, build, test and package | [Development](development.md) / [Contributing](../CONTRIBUTING.md) |
| Select a development target or promote a release | [Versioning](versioning.md) |
| Understand modules, storage and request flow | [Architecture](architecture.md) |
| Change identities or wire compatibility | [Protocol](protocol.md) |
| Reproduce icons and documentation artwork | [Branding](branding.md) / [Artwork](assets/README.md) |
| Prepare listing copy, screenshots and submissions | [Store submission guide](../store-assets/README.md) |

## Release and verification records

[Release readiness](release-readiness.md) summarizes current distribution and remaining evidence. The [changelog](../CHANGELOG.md) records versioned changes.

| Evidence | Record |
| --- | --- |
| Published source, CI and package hashes | [Releases](verification/releases.md) |
| Automated coverage and maintainer confirmations | [Runtime](verification/runtime.md) |
| Update failures, controlled comparisons and diagnosis | [Installation](verification/installation.md) |
| Image sources, lossless crops and export checks | [Media](verification/media.md) |
| Store publication, submitted descriptions and provenance | [Stores](verification/stores.md) |
| Processed-package identity and detailed execution coverage | [Marketplace DRM](verification/marketplace-drm.md) |
| Repository settings and inspection limits | [Security verification](security-readiness.md) |

## Maintaining documentation

Keep guides focused on repeatable procedures. Put dated outcomes, package identities and machine-specific investigations in the relevant verification record. Consolidate evidence by topic; Git history retains superseded detail.

Update both installation languages when a procedure changes, and check incoming section links. Keep automated fixtures, maintainer confirmation and independent observation distinct, with each result's original scope.

Preserve released packages and actual submitted copy under `store-assets/submitted/<version>/`. Record later revisions separately and distinguish preparation guidance from actual submissions.
