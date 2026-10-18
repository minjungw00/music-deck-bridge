# Documentation

## Guides

| Topic | Document |
| --- | --- |
| Installation, pairing, updates and removal | [English](installation.en.md) / [한국어](installation.ko.md) |
| Symptoms, recovery and diagnostic logs | [Troubleshooting](troubleshooting.md) |
| Builds, packaging, tests and release procedure | [Development](development.md) |
| Development versions, build identity and release promotion | [Versioning](versioning.md) |
| Components, protocol and storage | [Architecture](architecture.md) |
| Application identities, legacy connections and protocol compatibility | [Protocol](protocol.md) |
| Icon design, palette and reproduction | [Branding](branding.md) |
| Documentation artwork provenance | [Artwork](assets/README.md) |
| Store copy, media and submission procedure | [Store submission guide](../store-assets/README.md) |

## Release and verification records

[Release readiness](release-readiness.md) summarizes distribution status and remaining work. Six topic records retain the evidence:

| Topic | Record |
| --- | --- |
| Publication, source, CI and package hashes | [Releases](verification/releases.md) |
| Automated checks and maintainer confirmation | [Runtime](verification/runtime.md) |
| Update failures, comparisons and diagnosis | [Installation](verification/installation.md) |
| Official image sources and export checks | [Media](verification/media.md) |
| Review status and actual submitted descriptions | [Store submissions](verification/stores.md) |
| Processed-package identity and execution | [Marketplace DRM](verification/marketplace-drm.md) |

See also [security readiness](security-readiness.md) and the [changelog](../CHANGELOG.md).

## Maintaining documentation

Keep guides focused on product behavior and repeatable procedures. Consolidate dated outcomes, package identities and investigation conclusions in the relevant topic record; update the current summary rather than creating a file for each intermediate test. Remove superseded checklists and repeated observations. Git history retains detailed earlier measurements.

Keep review status and outstanding release checks in release readiness and submission records. Preserve actual submitted copy under `store-assets/submitted/<version>/`; distinguish it from preparation guidance. Later revisions must not silently rewrite a submitted snapshot or released package identity.

When an investigation changes a procedure, update both installation languages together and retain the evidence's scope and uncertainty in its topic record. A single environment's result is not a general guarantee.
