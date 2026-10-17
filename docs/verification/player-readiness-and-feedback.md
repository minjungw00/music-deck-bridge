# Player readiness and playback feedback

Evidence date: October 18, 2026 (Asia/Seoul). Development cycle remains **1.0.2-dev**, Chrome **1.0.2**, Stream Deck **1.0.2.0**. Builds are distinguished by commit/build metadata; this work does not publish a release or change the installed Windows files.

## Maintainer report

After the [connection recovery build](browser-connection-recovery.md), opening a missing player using Play/Pause or Current Track produced a YouTube Music error toast. Previous/Next opened the player without a toast but did not perform the input. Like, Dislike and Mute worked after opening. The maintainer confirmed that manually starting playback once in the new window restored the Stream Deck playback/track controls. A further report said the Play/Pause artwork did not follow browser playback state. The Volume Dial was requested to show mute artwork while muted.

The toast and manual-play recovery do not independently establish whether the specific Windows failure was incomplete initialization, autoplay rejection or another provider error. No live signed-in browser debugging session was attached. The implementation defects below were reproduced in controlled fixtures; their resolution on actual YouTube Music still requires the manual checks below.

## Changes and comparison

- Playback/track controls previously acknowledged a successful DOM click without waiting for player readiness or observing its effect. They now use a fixed top-frame `MAIN` function, check player/available queue readiness, click the site's control and confirm playback/pause, track/queue-index change or Previous-to-start. Before dispatch, not-ready remains retryable. After dispatch, no observed effect is ambiguous and is not retried. Confirmation is bounded by ten seconds and the original command deadline.
- An isolated comparison using extension code from **71adefd** against the delayed-readiness fixture fails the first cold Play: the command was acknowledged but its expected effect is absent. The revised extension passes the same fixture, including the Current Track key, with no pre-readiness clicks.
- Metadata sync now prefers scalar site-player playback/mute state over a possibly inactive media element. The browser fixture deliberately leaves the media element reporting paused while the site API reports playback; the outgoing sync must report playing. It also checks API mute state.
- Closed tabs are removed through authenticated `/player-closed`. A closing tab's outstanding sync completes before its close notification; later sync from the removed tab is ignored. Authenticated browser polls also reconcile the current music-tab IDs, covering lost close events during full browser exit. This prevents a closed PWA's old state from overriding a live normal tab for the remaining metadata lease.
- The Volume Dial uses the existing branded mute/volume PNGs in the `$B1` layout's `icon` feedback field. SDK tests verify confirmed mute, unmute and removal of preferred-player state; a press alone does not optimistically change the icon. The supported field is documented in [Elgato's dial layouts](https://docs.elgato.com/streamdeck/sdk/guides/dials/).
- Bounded diagnostics distinguish `autoplay-blocked`, `player-error` and `playback-unconfirmed`. Browser autoplay restrictions are not bypassed, and no browser permissions are added.

## Local checks

- Node suite: **95 passed**, including player readiness, actual-effect confirmation, expired input, API state versus stale media, Previous-to-start, autoplay/player errors, sender validation, SDK Play/Pause images, mute feedback and closed-PWA cleanup/reconciliation.
- Actual **Chromium 156.0.8078.4** integration fixture: **1 passed**, exercising **9 cold-tab actions** (eight command types, with both Play/Pause and Current Track), readiness delay, canonical playback/mute sync, existing-tab reuse and receiver replacement.
- Syntax/resources/version/locale/basic-secret checks and **2 Python packaging tests** passed.

These checks use modeled site controls and public player-method shapes. They establish extension/bridge/SDK behavior, not current signed-in YouTube Music selectors, Windows native Chrome startup, physical touch-strip rendering or Marketplace DRM.

## Remaining device checks

1. Update both matching development components and reload the unpacked extension in its permanent folder. Preserve pairing; issue a fresh PIN only if the extension was removed or its credentials were lost. Follow [development replacement](../versioning.md#build-and-test-development-packages) if the installed historical numeric version is higher.
2. Close all music tabs/PWAs while keeping Chrome running. Test Play/Pause, Current Track, Previous and Next separately. Confirm the original input completes, the site shows no error toast, and one music tab exists. Repeat with Chrome fully closed.
3. Start/pause in Chrome and verify all Play/Pause key instances update. Repeat after closing a formerly selected PWA while a normal music tab remains, and after restarting Chrome.
4. Push the Volume Dial to mute/unmute and change mute in Chrome. Confirm the touch-strip icon follows actual state and remains correct after action/profile changes.
5. If playback still fails, record the inspector's last-command code, exact build ID, Chrome version and SDK log. `autoplay-blocked` requires allowing site playback; `playback-unconfirmed` must not be treated as proof that no input executed. Do not share PINs or token files.
