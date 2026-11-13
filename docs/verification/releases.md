# Release verification

Publication evidence updated November 14, 2026 (Asia/Seoul). The [latest-release API](https://api.github.com/repos/minjungw00/music-deck-bridge/releases/latest) identifies v1.2.0 as non-draft/non-prerelease. Store submissions are recorded [separately](stores.md).

## v1.2.0

[Published](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.2.0) November 14 at 00:42:50 KST through the explicitly authorized direct GitHub path. Annotated tag `v1.2.0` (`ed46318b90ec99f2265baac455c6f679df6ae792`) resolves to source `ff139a755b25d36fc103799fa58956789808cb82`. Source/Chrome **1.2.0**, plugin **1.2.0.0**, protocol **1**. The development label was removed without selecting another cycle.

Scope: live popup controls/artwork, token-free standalone control using the shared Chrome engine, volume slider/mute, Volume Up / Down keys and configurable numeric feedback, PIN/setup layout, eight-language UI and localization fixes, shared artwork admission and volume-state refactoring. Release notes retain outstanding real-site/device/native-startup/DRM coverage and the local short-deadline fixture observations; [runtime evidence](runtime.md#november-14-stable-release-checks) separates the measured clock jumps from the unproven failure cause. No 1.2.0 store submission was performed.

[Exact-source CI 43454249656](https://github.com/minjungw00/music-deck-bridge/actions/runs/43454249656) passed on Windows and Ubuntu: 288 Node tests, two Python packaging tests, static checks, zero reported npm audit vulnerabilities and official Elgato validation/packaging on each OS. Ubuntu also passed three Chromium fixtures (MV3 player, eight native popup catalogs and 64 inspector locale/action/settings combinations). Local stable-source static/audit/Python/browser checks passed; its first full Node run passed 286/288, followed by five passing targeted wall-clock and monotonic-clock comparisons. This is not recorded as a passing local full stable-source Node run.

Both downloaded CI artifacts matched GitHub's outer-archive digests, source/run/version metadata and internal checksums. All 76 plugin / 44 extension payload files matched the source and each other across OSes, comparing the CLI-normalized manifest as JSON. CI metadata is retained separately and excluded from the three release assets. The release preserves the Windows CI archive bytes.

All three files downloaded from the draft matched the prepared inventory before publication. Authenticated latest-release metadata then reported `draft: false`, `prerelease: false`; anonymous public downloads matched all three prepared files byte-for-byte and passed the release checksum verifier. Previous public tags/assets, submitted packages, delivered development folders and existing previews remain preserved. Repository [security settings and open alerts](../security-readiness.md) were rechecked without changing settings. Store publication and physical installation results remain separate.

| Public asset | Bytes | SHA-256 |
| --- | --- | --- |
| `io.github.minjungw00.musicdeckbridge.streamDeckPlugin` | 548994 | `e60149ca97452c8cb5a5690f468b2b51d75e4fa2dc8a93ad4883e676ddc5acb9` |
| `music-deck-bridge-chrome-1.2.0.zip` | 160154 | `a7ffb9eefe5d813da5232dca6a7f00144bfc6a2d977cbdb1917921d8b4ee6b79` |
| `SHA256SUMS.txt` | 221 | `94c2cee7dac2465c28a3306fe0d106cfdce4a4870dd6944cd7fcc006894d3fca` |

The maintainer subsequently judged canonical replacement acceptable before store publication and authorized it as an exception to the existing preservation rule. Replacement preparation retains verified copies of all six files and the preceding notes/metadata; the corrected source will use the normal three-file inventory and an archived reference to the original tag. Exact-source validation and actual replacement remain pending. The original and temporary r1 observations below/above retain their historical scope.

### r1 Chrome revision

At the maintainer's request, the existing 1.2.0 release received a separately identified Chrome **r1** revision on November 14 at **01:28:19 KST**. Application versions remain Chrome/source 1.2.0 and plugin 1.2.0.0. The immutable original `v1.2.0` tag and all three original asset IDs, sizes and bytes remain unchanged. Source revision tag `v1.2.0-r1` points to `8933d1cca5fb1b60c183b2f88bb405d9beb6acb9`; the automatically generated source archives under the original release still refer to the original tag.

The fix adds Open YouTube Music to an empty popup and reuses/focuses existing tabs without pairing. [Exact-source CI 43462436276](https://github.com/minjungw00/music-deck-bridge/actions/runs/43462436276) passed on Windows and Ubuntu: 297 Node tests, two Python cases, checks, audit with zero reported vulnerabilities and official packaging on each OS; Ubuntu passed all three Chromium fixtures. All 44 Chrome and 76 plugin payloads matched source and each other across platforms. The plugin payload also matched the original published package, which is reused byte-for-byte. The renamed r1 Chrome ZIP preserves Windows CI archive bytes; renaming does not change its internal numeric version.

The new three assets were anonymously downloaded and matched the prepared files. The original three were also downloaded again and matched their retained hashes/bytes. `SHA256SUMS-r1.txt` covers the revised Chrome ZIP, revision metadata and reused original plugin; the original checksum inventory remains intact. Release notes recommend the r1 download and source links above the original note text, which was preserved verbatim. No new store submission, real-site, physical-device, Windows PWA/native-startup or processed DRM execution was performed; [runtime coverage](runtime.md#november-14-post-release-popup-opening-fix) retains fixture scope.

| Added asset | Bytes | SHA-256 |
| --- | --- | --- |
| `music-deck-bridge-chrome-1.2.0-r1.zip` | 160682 | `676fc6674be20b8c99f47fe920f377b3b5d5f914eb3993b9fc6fa376f6279864` |
| `BUILD-INFO-r1.json` | 1151 | `a358fa6145b9163fb161dad7d5cd7c5a1d3a69df4aebb370b8dd19b0e6fc1e50` |
| `SHA256SUMS-r1.txt` | 309 | `90b7fb2a64114cfc867d674ce79e5c0c9ed73f52bf45b9436da7b90f66fd0dca` |

## v1.1.3

[Published](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.1.3) October 29 at 08:22:07 KST, following explicit maintainer authorization. Annotated tag `v1.1.3` resolves to source `5a844743116783b6025823bcbfb497e7190ec492`. Source/Chrome **1.1.3**, plugin **1.1.3.0**, protocol **1**. The selected target was promoted without selecting a new development cycle.

Scope: proportional Current Track key artwork, bounded startup/destination playback recovery, independent dispatch/result confirmation, bounded diagnostics, playback refactoring and SDK/CLI/security dependency updates. [Runtime evidence](runtime.md#current-evidence) separates maintainer-confirmed recovery before the refactor from automated coverage of the final source. The release notes disclose unconfirmed Previous outcomes at a restored selection's beginning and outstanding independent Windows hardware/native-startup, signed-in Music and identified Maker Console DRM execution coverage.

[Exact-source CI 40786383387](https://github.com/minjungw00/music-deck-bridge/actions/runs/40786383387) passed on Windows and Ubuntu. Both job logs confirm 218 Node tests, two Python packaging tests, checks, audit with zero reported vulnerabilities and official Elgato validation/packaging. Ubuntu also passed Chromium 156.0.8078.4 MV3 integration using a local player fixture. A separate local run of the stable source passed these checks as well; its modeled later Pause timings were 33/33 ms, not device measurements. Repository security settings and open alerts were [rechecked](../security-readiness.md) before release.

Both downloaded CI artifacts matched GitHub's outer-archive digest and their source/run/version metadata and checksum inventories. All 60 plugin and 25 Chrome payload files matched the source-verified local packages; Windows/Ubuntu payload bytes were identical. The CLI-normalized plugin manifest was compared to source as JSON. CI `BUILD-INFO.json` describes a CI build (`channel: development`) of stable source 1.1.3; that file is retained for provenance and excluded from the release assets.

The release preserves Windows CI package bytes. A draft was uploaded and its three files downloaded and compared before publication; subsequent anonymous public downloads matched all three prepared release files byte-for-byte. GitHub reports v1.1.3 as latest, non-draft and non-prerelease. Previous tags/assets, submitted packages and delivered development folders were preserved. No store submission was performed as part of the October 29 GitHub release. The [later Elgato public listing observation](stores.md#public-description-correction) has its own scope. The hashes below identify GitHub assets.

| Public asset | Bytes | SHA-256 |
| --- | --- | --- |
| `io.github.minjungw00.musicdeckbridge.streamDeckPlugin` | 522218 | `77989618b96aec355b353eac7a94a7691b1a65bd3a402379d3700b5be1e3b4f9` |
| `music-deck-bridge-chrome-1.1.3.zip` | 57209 | `cd4cb574f1fa41d25f3af1bf00d5ae262b76325dbe9fa667290f86a05c540bdd` |
| `SHA256SUMS.txt` | 221 | `92a184d0c071ee2737ff3a9a18fc0b50972f36718a781639406678437665afc5` |

## v1.1.2

[Published](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.1.2) October 18 at 23:43 KST. Tag source: `0e0401f2f2635677c14cdb9f967410dda51bbe29`. Source/Chrome **1.1.2**, plugin **1.1.2.0**, protocol **1**.

Before the October 29 v1.1.3 promotion, a read-only latest-release API check still identified v1.1.2 with the same asset names, sizes and package digests below. That earlier recheck was metadata verification, not a fresh download/rehash or runtime test.

Scope: role-based plugin/extension/content/inspector modules, pairing persistence and management ordering, port lifecycle, bounded/retryable display output, artwork deduplication and tab/page recovery. The maintainer confirmed normal operation before release; that report and its limits are recorded in [runtime verification](runtime.md#112-refactor).

[Exact-source main CI 39136965856](https://github.com/minjungw00/music-deck-bridge/actions/runs/39136965856) passed on Windows and Ubuntu: 154 Node tests, two Python packaging tests, syntax/resources/locales/version checks, audit with zero reported vulnerabilities and official Elgato validation/packaging. Ubuntu also passed the actual Chromium MV3 local fixture.

Release-time API checks found no open Dependabot or secret-scanning alerts; existing reporting/scanning/protection settings remained enabled.

Both downloaded OS artifacts matched source/run/version metadata and checksums. Their 60 plugin and 24 Chrome payload files were identical across OSes and matched the tagged source, accounting for the official CLI removing the plugin manifest's final newline.

The release preserves Windows CI archive bytes. Draft downloads and anonymous public downloads matched all three prepared release files byte-for-byte; at publication GitHub reported v1.1.2 as the latest, non-draft, non-prerelease release. Store submissions and Console-processed DRM execution remain separate.

| Public asset | Bytes | SHA-256 |
| --- | --- | --- |
| `io.github.minjungw00.musicdeckbridge.streamDeckPlugin` | 466733 | `a7fb228da9a8eac454ddaa99834cce48c745839071d9ed2428c319fe79680590` |
| `music-deck-bridge-chrome-1.1.2.zip` | 51884 | `024e81f54279b209c6c167225ca76516ceedb611c99084f1b8cbba3bbdfe2e1b` |
| `SHA256SUMS.txt` | 221 | Covers exactly the two packages above |

## v1.1.1

[Published](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.1.1) October 18 at 16:16 KST. Tag source: `33b4757364e2e2c153cecc635027024662fffdbd`. Source/Chrome **1.1.1**, plugin **1.1.1.0**, protocol **1**.

Scope: equal single-line popup buttons, heading icon, offline preview tool and selected product images. [Runtime coverage](runtime.md) and [media provenance](media.md) distinguish fixtures from actual device captures. No installer code fix is claimed.

[Exact-source CI 39106843325](https://github.com/minjungw00/music-deck-bridge/actions/runs/39106843325) passed on Windows and Ubuntu: 117 Node tests, two Python distribution tests, syntax/resources/locales/version checks, audit with zero reported vulnerabilities and official Elgato validation/packaging. Ubuntu also passed the actual Chromium MV3 fixture.

Both downloaded OS artifacts matched their source/run/version metadata and checksums. Their 62 plugin and 15 Chrome payload files were identical across OSes and matched the source, accounting for the official CLI removing the plugin manifest's final newline.

The release preserves Windows CI archive bytes; draft and public downloads matched them byte-for-byte.

| Public asset | Bytes | SHA-256 |
| --- | --- | --- |
| `io.github.minjungw00.musicdeckbridge.streamDeckPlugin` | 483383 | `ffe7a11c3965d5b7da1169afd16f8f20792c8ae4c9c18bed3234ba46c8750aca` |
| `music-deck-bridge-chrome-1.1.1.zip` | 45884 | `810ea1cc37db886483842aee8776cbd473d63129ddfb6375e4af0dc4336d25ad` |
| `SHA256SUMS.txt` | 221 | Covers exactly the two packages above |

## v1.1.0

[Published](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.1.0) October 18 at 14:52 KST. Tag source: `7eb20a58b22df782af6cd80a360c27cde5100264`. Source/Chrome **1.1.0**, plugin **1.1.0.0**, protocol **1**.

Scope: player launch/command continuation, ratings, connection recovery, playback/mute feedback, configurable key/dial artwork/text and protocol negotiation. [Exact-source main CI 39101874429](https://github.com/minjungw00/music-deck-bridge/actions/runs/39101874429) passed the same 117 Node/two Python tests, checks, audit and official packaging on both OSes, plus Ubuntu Chromium integration. Downloaded artifact metadata/checksums, identical unpacked OS payloads and draft/public Windows package bytes were verified.

| Public asset | Bytes | SHA-256 |
| --- | --- | --- |
| `io.github.minjungw00.musicdeckbridge.streamDeckPlugin` | 483367 | `ae96cb8a48d6b06baf8a58ba8c822cf4cafea6862249b5e1e7805de8e709ba88` |
| `music-deck-bridge-chrome-1.1.0.zip` | 45786 | `9a137d821de98e9cf1f48e2b826f90dd5abc20873d27389712b04e62cdca1765` |
| `SHA256SUMS.txt` | 221 | Covers exactly the two packages above |

## Earlier history

[v1.0.0](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.0.0) and [v1.0.1](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.0.1) were published October 17. Their tags/assets remain unchanged; their release pages retain package inventories. The unpublished v1.0.2 candidate was superseded by v1.1.0. Intermediate development labels do not represent additional public releases.

v1.0.0 used a geometric red mark; v1.0.1 introduced the magenta play-disc mark, followed by matching action icons. Earlier artwork and detailed intermediate measurements remain in Git history. Current behavior is described in the [changelog](../../CHANGELOG.md) and guides.
