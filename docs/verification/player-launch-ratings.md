# Player launch and song rating verification

Evidence date: October 18, 2026 (Asia/Seoul). Feature source: `1da3a46844b247cc10481458f86db9f986fc653b`, branch `feat/player-launch-ratings`. Source/Chrome version **1.1.0**, plugin **1.1.0.0**. Not published or submitted to a store. The fixed [v1.0.2 candidate](v1.0.2.md) remains separate.

## Scope

- Add Open YouTube Music, Like and Dislike keys, bringing the manifest to ten actions with en/ko labels and magenta icons.
- Open focuses the selected existing tab/PWA, or creates a Chrome music tab. Playback inputs toggle an existing player or open the site when none exists. Opening does not request automatic song playback.
- A paired worker listens even with zero music tabs. Native fallback starts standard Windows Chrome with a fixed URL, without a shell, when a request is undelivered. Repeated in-flight launches coalesce; delivered requests are not replayed through fallback.
- Like/dislike use the site's current-song controls, toggle off on repeat, and display outlined/filled thumbs from confirmed state. Queued ratings carry a video ID or title/artist identity; another track's command is discarded.
- Preserve existing plugin/action UUIDs, PIN/authentication, shared port and storage paths. Add no extension permissions. Existing player controls retain the legacy extension path; new features require matching components.
- Explicit protocol-version negotiation is not implemented by this change. The earlier installer rename failure is still unresolved.

## Local automated evidence

Environment: Linux, Node.js 24.19.0, Python 3.12.3, Pillow 12.0.0 in a temporary renderer directory, pinned Elgato CLI 1.10.2. TCP integration tests ran with local listeners permitted. No Windows application or installed plugin was changed.

| Check | Result |
| --- | --- |
| Syntax, manifests, versions, resource paths, locale keys and basic secret checks | Passed |
| Node suite | **67/67 passed** |
| Python packaging suite | **2/2 passed**, including selected-rating images |
| Icon regeneration | All **54** PNGs reproduced byte-for-byte; new icon variants visually inspected |
| Official Stream Deck validate/pack | Passed; **61** plugin files |
| Chrome packaging and strict two-package checksum inventory | Passed |
| Local dependency audit | `npm audit --offline`: zero reported; no fresh registry advisory query |
| Documentation links/anchors and whitespace | Passed |

Tests cover zero-player browser requests, existing selected PWA reuse, discarded/frozen/loading tabs, top-frame playback, browser acknowledgment, pairing revocation, fixed-URL/no-shell native launch arguments and spawn failures, repeated rating cancellation, stale-track rejection, confirmed rating images and existing keys/dials through the bundled SDK with both readable and opaque-manifest fixtures. Native spawning and Chrome APIs are mocked; this is not a real Windows/Chrome execution result or actual Maker Console DRM execution.

## Local test packages

Packages are under `dist/feature-v1.1.0/` with `SHA256SUMS.txt`. They were built locally from the feature source, not downloaded from Windows CI. Existing top-level `dist/` packages were retained separately.

```text
97b3b30eb373f0a1879abdda1edd36dae22927cd20413ac1d6b54f2650bbf571  io.github.minjungw00.musicdeckbridge.streamDeckPlugin
0e9a5a5c5cf9f10eda95d08ffc6ab0f34fe586e486d26ebe6be481fa2d9909fb  music-deck-bridge-chrome-1.1.0.zip
```

## Remaining manual checks

1. Run Windows/Ubuntu CI for the exact selected source before distribution.
2. Install both matching components with private backups. Confirm existing pairing, port, profiles and action settings survive.
3. With Chrome fully closed, press Open and playback keys; verify standard-path Chrome starts and the music page opens. Check repeated presses for duplicate launches.
4. With Chrome running but no music tab, verify a new music tab. With an existing music tab/PWA, verify reuse/focus; playback inputs should control the selected player without bringing a normal playing window to the foreground.
5. On a signed-in current song, test Like, cancellation, Dislike, cancellation and switching between them. Confirm changes made in the website update every visible rating key, including returning keys. Record actual rating-control markup if selectors need adjustment.
6. Verify missing/disabled controls and song changes do not apply a stale rating. Test native launch failure for unsupported/custom Chrome installation paths and check the alert/log.
7. Complete real device, settings-retention, rollback and processed-DRM checks separately. Store approval and installation remain independent.

General usage is in the [English](../installation.en.md#launch-and-song-ratings) / [Korean](../installation.ko.md#youtube-music-실행과-곡-평가) installation guides; this record contains the measured results and their limits.
