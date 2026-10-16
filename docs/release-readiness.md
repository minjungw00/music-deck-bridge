# Release readiness

Evidence date: October 17, 2026. Source version remains **0.5.1**. This records development checks and outstanding release work; it is not a store approval or hardware certification.

## Implemented

- Official `@elgato/streamdeck` 3.0.2 integration; registration, seven actions and output use SDK APIs.
- Standalone runtime bundle, lockfile-pinned CLI 1.10.2, Linux/Windows packaging CI and package artifact uploads.
- Server-side unpair and re-pair revocation, old-poll termination, state/command reset and trusted-context token storage.
- Consistent product title, reproducible project icons and bundled runtime license notices.
- English/Korean store text and permission explanations in [store assets](../store-assets/listing.en.md).

## Local automated evidence

Run the commands in [development](development.md) against the exact release commit. The current changes were checked on Linux with Node.js 24.19.0 and CLI 1.10.2:

- Syntax, manifest/resources, versions, translations and basic accidental-secret checks.
- 38 passing Node regression tests, including standalone SDK key/dial/inspector/settings/rendering tests and opaque-manifest fixtures.
- Authentication tests for unpair/re-pair, pending polls, old commands, restart persistence, storage access failure and offline retry.
- 2 passing Python packaging boundary/notice tests.
- Official Stream Deck CLI validation and `.streamDeckPlugin` generation, and Chrome ZIP generation.
- `npm audit`: zero reported vulnerabilities in the locked dependency graph.

The opaque-manifest fixture only tests the SDK's handling of a non-JSON manifest. It does not reproduce Maker Console encryption. New GitHub CI runs, Windows behavior and device results must be recorded below.

## Required manual evidence

| Check | Status | Evidence to record |
| --- | --- | --- |
| GitHub CI for final commit on Ubuntu and Windows | Pending | Commit SHA and successful run URL; inspect both uploaded packages |
| Clean Windows 10/11 install, update, uninstall and reset | Pending | OS, Chrome and Stream Deck versions; package hashes and results |
| All seven actions on actual keys and Stream Deck + dials | Pending | Device models, playback/artwork/title modes, volume steps, touch/push results |
| Chrome unpacked and store-package install | Pending | First pairing, reload/update, browser restart, normal tab and installed app |
| Idle recovery and port changes/conflicts | Pending | Sleep/reconnect and old-port grace behavior; retry after failed unpair |
| Actual Maker Console DRM build | Pending | Upload with publishing disabled, download processed build, install and exercise all actions |
| Private vulnerability reporting | Disabled at last check | Public GitHub API returned `enabled: false` on October 17, 2026; maintainer must enable and verify the private reporting entry point |
| Secret scanning and push protection | Unverified | Maintainer verifies repository settings and reviews repository history |
| Store screenshots and promotional images | Pending | Actual en/ko popup, Now Playing, settings and dial captures; current store image specifications |
| Store declarations, public privacy link and final listing | Pending | Review [English](../store-assets/listing.en.md)/[Korean](../store-assets/listing.ko.md) copy against final build and current forms |

## Screenshot capture plan

Use a clean Windows profile and dummy listening details. Capture each image from the running product; do not present mockups as device evidence.

1. Chrome popup in English and Korean: pairing controls and connected status, with PINs and personal details concealed.
2. Stream Deck action grid: Now Playing artwork, playback buttons and mute, using artwork you have permission to publish in store screenshots.
3. Stream Deck +: visible volume percentage and track dial feedback, plus the 1–5 point step setting.
4. Action settings in English and Korean: title display mode and connection status. Hide live PINs, tokens and local identifying details.
5. Verify current store dimensions and export the requested screenshot and promotional formats into the relevant store-assets subdirectory.

After all required checks pass, update all versions to the chosen release version, finalize CHANGELOG and create its matching tag. Only then run the manual Draft release workflow and review its draft files before publishing. No release tag, store submission or publication is performed by these changes.
