# Documentation

## Guides

| Topic | Document |
| --- | --- |
| Installation, pairing, updates and removal | [English](installation.en.md) / [한국어](installation.ko.md) |
| Symptoms, recovery and diagnostic logs | [Troubleshooting](troubleshooting.md) |
| Builds, packaging, tests and release procedure | [Development](development.md) |
| Components, protocol and storage | [Architecture](architecture.md) |
| Icon design, palette and reproduction | [Branding](branding.md) |
| Documentation artwork provenance | [Artwork](assets/README.md) |
| Store copy, media and submission procedure | [Store submission guide](../store-assets/README.md) |

## Release and verification records

- [Release readiness](release-readiness.md): current release/submission status, remaining work and links to detailed test records.
- [Security readiness](security-readiness.md): repository settings, dated checks and inspection limits.
- [Verification records](verification/): version-specific results, environment details, logs, observations and investigation history, indexed in [release readiness](release-readiness.md#detailed-verification-records).
- [Changelog](../CHANGELOG.md): changes by version.

## Maintaining documentation

Keep guides focused on product behavior, requirements and repeatable procedures. Put dated observations, individual test outcomes, machine-specific details, source/package hashes and investigation conclusions in verification records. Keep current review status and outstanding release checks in release readiness rather than repeating them across guides or listing copy.

When an investigation changes a procedure, update the guide with the resulting instructions and keep the evidence, scope and uncertainty in the corresponding record. Preserve useful recovery steps without presenting one environment's result as a general guarantee. Update the English and Korean installation guides together.
