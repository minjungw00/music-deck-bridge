# Release verification

Evidence date: October 18, 2026 (Asia/Seoul). These are completed GitHub publication checks. Store submissions are recorded [separately](stores.md).

## v1.1.1

[Published](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.1.1) October 18 at 16:16 KST. Tag source: `33b4757364e2e2c153cecc635027024662fffdbd`. Source/Chrome **1.1.1**, plugin **1.1.1.0**, protocol **1**.

Scope: equal single-line popup buttons, heading icon, offline preview tool and selected product images. [Runtime coverage](runtime.md) and [media provenance](media.md) distinguish fixtures from actual device captures. No installer code fix is claimed.

[Exact-source CI 39106843325](https://github.com/minjungw00/music-deck-bridge/actions/runs/39106843325) passed on Windows and Ubuntu: 117 Node tests, two Python distribution tests, syntax/resources/locales/version checks, audit with zero reported vulnerabilities and official Elgato validation/packaging. Ubuntu also passed the actual Chromium MV3 fixture.

Both downloaded OS artifacts matched their source/run/version metadata and checksums. Their 62 plugin and 15 Chrome payload files were identical across OSes and matched the source, accounting for the official CLI removing the plugin manifest's final newline. The release preserves Windows CI archive bytes; draft and public downloads matched them byte-for-byte.

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
