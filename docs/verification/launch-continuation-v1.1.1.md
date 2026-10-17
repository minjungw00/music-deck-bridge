# Launch continuation and pairing guidance — v1.1.1

Historical development-package record. The 1.1.0/1.1.1 labels below were never public releases and are retained only to identify the original test files. Current development follows the fixed-cycle [versioning policy](../versioning.md).

Evidence date: October 18, 2026 (Asia/Seoul). Source `926d34937f2098abd1c3f14cf711c71763037a34` on `feat/player-launch-ratings`; includes pairing-guidance commit `5e84654`. Source/Chrome **1.1.1**, plugin **1.1.1.0**. These are unpublished development packages following the [1.1.0 feature build](player-launch-ratings.md).

## Report and changes

The maintainer reported that after plugin update and Chrome extension reinstallation, the inspector displayed “PIN 등록됨” while Chrome reported no pairing. Extension removal deletes its local token while the plugin can retain its old credentials; the old inspector text treated that stored record as a pairing label. No Windows private authentication files were inspected for this follow-up.

- Distinguish unconfirmed extension communication from stored credentials, explain new-PIN recovery after extension reinstall and prioritize newly issued PIN instructions. Authentication still requires a valid PIN; stored plugin credentials do not authorize a reinstalled extension by themselves.
- Remove default text titles from Play/Pause, Like, Dislike and Open in the manifest and clear previously pushed runtime titles. State images remain active.
- Route every key/dial input through launch continuation when needed. Retain ordered commands for up to 45 seconds, including through native Chrome startup; only duplicate Open requests coalesce.
- Wait up to 30 seconds for a usable player, then perform the original input. Cold-start playback means Play, avoiding a Pause if playback already resumed. Ratings requested without an existing player apply to its restored current song; existing-player ratings retain track-identity checks.
- Deduplicate completed content-script request IDs. Retry explicit not-ready responses; do not retry ambiguous delivery. Pairing changes cancel queued work, and the worker confirms both local credentials and server authorization before acting after loading.

## Automated verification

Local Linux, Node.js 24.19.0, Python 3.12.3, pinned Elgato CLI 1.10.2:

| Check | Result |
| --- | --- |
| Syntax, versions, manifests, resources, locales and basic secret checks | Passed |
| Node suite | **78/78 passed** |
| Python packaging suite | **2/2 passed** |
| Official Stream Deck validator/packager | Passed; **61** plugin files |
| Final two-package inventory and checksums | Generated and verified |
| Local Markdown links/anchors and whitespace | Passed |

The new bridge test delays browser connection beyond the actual native-fallback timer, then receives every queued key/dial input in order and checks pairing-change cancellation. Native process creation is skipped in test mode. Extension fixtures exercise loading/discarded/frozen tabs, deferred controls, non-replayed requests, restored playback, stale ratings, missing credentials and server-side revocation while local tokens remain. SDK tests check blank titles alongside selected-state images. Actual Windows/Chrome UI behavior and Maker Console DRM are not established by these fixtures.

## Packages

Local output: `dist/feature-v1.1.1/`. Install both matching components. Keep the unpacked extension's existing folder and reload it; if it has already been removed/reinstalled, match any custom port and pair again with a newly generated PIN.

```text
5db4854a7fa09a8bd5729266349ae0cf2e449c29a6c2b681fd0dda355fb53be1  io.github.minjungw00.musicdeckbridge.streamDeckPlugin
14f703542e862a69676a8d94b6566039302df62bd40f10ba63b87bb37237e38f  music-deck-bridge-chrome-1.1.1.zip
```

## Remaining manual checks

1. Upgrade the installed 1.1.0 plugin to 1.1.1.0 and update Chrome in place. After any prior extension removal, perform fresh PIN pairing and verify the shared port, profiles and action settings.
2. Confirm all four requested key types have no default titles, including previously configured instances, while Play/Pause and rating images still follow site state.
3. With Chrome fully closed, test each function, including dial rotation/push/touch, and verify the original input runs after startup exactly once. Repeat with Chrome running but no music tab and with an existing PWA/loading/discarded tab.
4. Verify a restored paused player starts from Play, and a restored playing player remains playing. Test next/previous, mute, volume and each rating/cancellation on a signed-in restored song.
5. Verify loading without a selected song, sign-in requirements, disabled controls, timeout, repeated inputs and a pairing change while waiting. Opening cannot invent a playable song or bypass site sign-in/autoplay restrictions.
6. Run Windows/Ubuntu CI for the selected source and complete the separate retention, rollback, real-device and processed-DRM checks before the relevant release sign-off.
