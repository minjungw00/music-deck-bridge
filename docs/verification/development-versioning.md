# Development version policy verification

Evidence date: October 18, 2026 (Asia/Seoul). Source `a5e9634fa82398902685530d1bc5b7eefdcaf383` on `feat/player-launch-ratings`. The source version is fixed at **1.0.2-dev**, Chrome numeric version **1.0.2**, and Stream Deck **1.0.2.0**. The previous 1.1.0/1.1.1 labels were unpublished test builds; their original hashes remain in their historical records.

## Checks

Local Linux, Node.js 24.19.0, Python 3.12.3 and pinned Elgato CLI 1.10.2:

| Check | Result |
| --- | --- |
| Syntax, versions, manifests, resource paths, locale keys and basic secret checks | Passed |
| Node suite | **83/83 passed** |
| Python packaging tests | **2/2 passed** |
| Actual `npm run build:dev` with uncommitted changes | Passed; development metadata records `dirty: true` |
| Actual `npm run build:dev` from the committed source | Passed; `dirty: false` and exact source SHA recorded |
| Platform version values across the two builds | Unchanged; only build ID, metadata and package checksums differ |
| Official validation/packaging | Passed; **61** plugin files |
| Final checksum inventory | All two-package and metadata hashes verified |
| Development release rejection and explicit promotion | Tested in isolated fixtures; no development version passes release generation/verification or the release-tag gate |
| Documentation links/anchors and whitespace | Passed |

Version tests promote a temporary fixture, preserving identifiers/permissions and rejecting a different target. The real checkout remains `1.0.2-dev`; no release promotion, tag, store upload or publication was performed. CI configuration retains both Windows and Ubuntu jobs; a remote run for this source has not been recorded. Actual Windows installation/DRM and the earlier feature manual checks remain separate.

## Clean local build

Build ID: `1.0.2-dev+ga5e9634fa823.local20261017193927537`.

Output: `dist/development/1.0.2-dev+ga5e9634fa823.local20261017193927537/`.

`BUILD-INFO.json` records development channel, logical/numeric versions, full commit, ref, platform, architecture, build time and clean worktree status. Its checksum is included alongside the two packages:

```text
1867bc3f2ff14555c3e51748b15891f9b677ce0bc8fea42e92082c63d0227903  io.github.minjungw00.musicdeckbridge.streamDeckPlugin
4ce31de4bd2e86a20be821bd3bf8ba03f64f1d072b05daddd8df9ef0624c6cbe  music-deck-bridge-chrome-1.0.2-dev.zip
475650900c3b510fb54f9ad60e8d5ba9b50f878c9184410e1ea598822243c3f3  BUILD-INFO.json
```

## Migration

The development numeric version is intentionally lower than the previously mislabeled 1.1.x test packages. If one is installed, use private backups and the documented file-replacement path once to move to this development cycle. Equal-version rebuilds also use development replacement/reload. Do not generate another release increment to work around an installer comparison. Keep the same Chrome folder and auth/config/profiles; if the extension was removed/reinstalled, pair with a new PIN.

The stable workflow and platform constraints are documented in [versioning](../versioning.md). Historical artifact names/bytes remain evidence only and are not retroactively renamed or described as public releases.
