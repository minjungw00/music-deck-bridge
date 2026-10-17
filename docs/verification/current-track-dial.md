# Current Track Dial controls and display

Evidence date: October 18, 2026 (Asia/Seoul). Unpublished **1.0.2-dev** cycle; platform versions remain Chrome **1.0.2**, Stream Deck **1.0.2.0**. No remote release, store submission change or installed Windows-file replacement is part of this work.

## Requested behavior and implementation

| Action | Rotate | Push | Touch strip tap |
| --- | --- | --- | --- |
| Volume Dial | Change volume using the saved step | Toggle mute | Toggle mute |
| Current Track Dial | Previous/next, retaining one track per tick and the five-tick cap | Play/pause | Play/pause |

The previously named Track Dial is renamed **Current Track Dial / 현재 곡 다이얼** in the manifest and English/Korean catalogs. The `.trackdial` UUID remains unchanged so existing assignments/settings can migrate. Its default action icon and runtime icon use the existing branded Play/Pause assets; confirmed player state selects Play or Pause. Volume touch no longer sends a playback toggle; its trigger descriptions and draft listings match the new mute mapping.

Current Track Dial settings add `dialDisplay`, independently saved per action:

- `info` (default): built-in `$A1`, showing playback icon and song name.
- `artwork`: custom `layouts/current-track-artwork.json`, with a centered 100 × 100 image in the 200 × 100 touch-strip area. Missing/loading artwork falls back to the playback icon. Changing tracks clears the old cover while the new one loads; disconnect clears it too.

Layout updates are awaited before feedback, through a queue for each action instance. Unchanged cached images are not retransmitted. Mode switches, multiple dial instances and reappearance restore the chosen layout/content. The custom layout is included explicitly in the distribution allowlist; a packaging regression check caught its omission before that allowlist was updated. No new bitmap generation, browser permissions or Chrome runtime changes are required.

## Local verification

- `npm test`: **100 passed**. Real SDK/WebSocket fixtures check volume touch → mute, current-track push/touch → playback, tick counts/directions, playback artwork, information/artwork layout switching, fallback and saved-mode restoration. Both ordinary and opaque-manifest SDK paths pass.
- Renderer fixtures check cached cover delivery, no duplicate transmissions, replacement/loading/offline fallback, per-instance settings and rapid layout/content ordering.
- `npm run check`: syntax, manifests/resources, locales, development versions and basic secret checks passed.
- Python packaging suite: **2 passed**, including presence of the custom layout in the staged plugin.
- Official Elgato CLI validation/packaging: passed, **62 plugin files** including the custom layout.

The layout and feedback mechanism follows [Elgato's dial/layout documentation](https://docs.elgato.com/streamdeck/sdk/guides/dials/). These tests establish emitted SDK messages and packaged resources, not physical touch-strip rendering. The existing Chromium checks are recorded separately in the [player-readiness evidence](player-readiness-and-feedback.md); this plugin-only change does not repeat that browser suite.

## Remaining device checks

1. Replace the plugin using the [development build procedure](../versioning.md#build-and-test-development-packages); verify an existing Track Dial action appears as Current Track Dial without reassigning it.
2. Confirm Volume Dial push and screen touch both mute/unmute, and the confirmed icon follows the player.
3. Confirm Current Track Dial push and touch play/pause, rotation changes one track per tick, and browser-side play/pause changes its icon.
4. Choose both display modes, including while artwork downloads, then switch profiles/restart Stream Deck. Check the centered album image, fallback, independent settings on multiple dials and return to icon/name mode on the actual device.
