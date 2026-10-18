# Changelog

## v1.1.1-dev — Unreleased

- Keep the English/Korean popup action buttons on one line with equal widths, explicit typography and consistent heights; shorten the English status button to “Status”.
- Show the existing main icon beside the Music Deck Bridge popup heading.

## v1.1.0 — 2026-10-18

- Add Open YouTube Music, Like and Dislike keys. All controls can open a missing player and complete the original input after readiness; reuse existing tabs/apps and preserve command order.
- Recover Chrome connections after extension updates/reinstallation and distinguish retained credentials from a currently connected extension. Keep authentication, ports, UUIDs and profile settings intact.
- Reflect confirmed browser playback in separate Play/Pause icons, and confirmed mute state on the Volume Dial. Wait for actual player readiness and observable playback/track effects before acknowledging commands.
- Rename Track Dial to Current Track Dial without changing its UUID. Rotate for previous/next; press or touch for play/pause. Volume Dial press and touch both toggle mute.
- Add per-dial information/artwork modes, proportional width/height fitting and full-width scrolling. Offer title visibility, optional artist below/inline placement and optional text background.
- Add matching song/artist visibility, artist placement, background and text-mode options to the Now Playing key.
- Introduce explicit protocol range negotiation with separate plugin/extension identities, legacy-v1 support, precise update guidance and recovery using existing credentials.
- Refresh action artwork and popup colors to match the main magenta icon, and include the supplied project thumbnail in README. Hide default titles on Play/Pause, Like, Dislike and Open keys.
- Separate development build identities from release numbers, add browser/Qt/SDK compatibility regressions and retain dated verification records.
- Publish source/Chrome version 1.1.0 and Stream Deck version 1.1.0.0; retain protocol 1 and existing permissions/storage paths. The unpublished 1.0.2 candidate is superseded by this release.
- Record maintainer-completed device, Chrome and update/settings-retention/rollback checks. The historical installation conflict was not reproduced; no confirmed original-cause fix is claimed. New protocol behavior passed local automated and Chromium fixtures; Maker Console DRM and store approval remain separate.

## Historical v1.0.2 candidate — not published, superseded by v1.1.0

- Show only Play on the toggle key when paused and only Pause while playing, following the selected player's reported state, including changes made directly in Chrome. Use Play with the offline title when no player is available.
- Align all seven Stream Deck action families with the main magenta play-disc identity, using matching circular badges, white symbols and dark key backgrounds. Keep action-list icons monochrome and align the Chrome popup palette.
- Add the maintainer-supplied project thumbnail to README and record v1.0.1's Marketplace Pending review status. These candidate assets are separate from the fixed public and submitted v1.0.1 packages.
- Align source/Chrome versions at 1.0.2 and Stream Deck at 1.0.2.0; preserve UUIDs, authentication, shared port, protocol and configuration paths.
- Record the known update-installation rejection and Windows lock diagnostics. This candidate does **not** claim to fix the update conflict; the October 18 running-plugin 1.0.1 → 1.0.2 attempt failed at the directory rename after process exit. A later developer-mode/official-stop retry installed and started 1.0.2 with the same host running. Detailed operation/settings retention, fully exited-host comparison and rollback remain unverified. Maker Console DRM and store approval remain separate.
- Record the maintainer's normal-operation confirmation for plugin 1.0.2 with Chrome extension 1.0.1 after that retry. This confirms the observed mixed-version combination; Chrome 1.0.2 manual operation and itemized retention/rollback checks are separate.
- Record a later successful running-plugin update, including the old-folder rename, with developer mode enabled after host restart and baseline reinstall. Official stop is not universally necessary; the differing conditions do not establish developer mode as the cause or resolve the original failure.
- Record the subsequent successful normal-mode running-plugin update after baseline reinstall, with developer mode absent and exact installed candidate files verified. Developer mode is not a universal prerequisite; the original denial's cause remains unconfirmed.
- Corroborate the full explicit uninstall → public 1.0.1 installation → running-plugin 1.0.2 update sequence in a fifth PML capture. All stages pass in normal mode; distinguish the actual update from the initial baseline installation and from unmeasured settings retention/rollback.

## v1.0.1 — 2026-10-17

- Introduce the reference-inspired magenta disc, rounded white play triangle and paired sound waves, shared by Stream Deck and Chrome. Use gradients in large icons and flat, simplified toolbar artwork; keep the existing seven action icon families.
- Validate brand PNG sizes, RGBA/transparency, palette, small-size play triangles, manifest references and packaged icon bytes.
- Document the brand palette, icon history and reproducible generation; record the maintainer-reported v1.0.0 Release installation and manual verification. The 0.5.1.0 → 1.0.0.0 transition succeeded after removing the old plugin files and reinstalling, rather than installing over them.
- Document recovery and plugin-folder replacement when Stream Deck rejects a package install over existing files. The first 1.0.1 candidate was rejected by the host installer; restarting restored the old version. No runtime change is attributed to this installation failure.
- Align package/Chrome versions at 1.0.1 and Stream Deck at 1.0.1.0. Preserve plugin/action UUIDs, playback and local protocol code, PIN authentication, ports and settings formats.
- Record the maintainer's normal-operation confirmation for the revised 1.0.1 draft after the corrected installation guidance; preserve the failed install-over-existing result and distinguish unreported detailed retention/device checks in release readiness.

## v1.0.0 — 2026-10-17

- Publish the first GitHub Release with prebuilt Stream Deck and Chrome packages; align source/Chrome versions at 1.0.0 and the Stream Deck manifest at 1.0.0.0.
- Generate SHA256SUMS.txt for the two release assets, reject missing/empty/stale or unexpected assets, and verify downloaded checksums again before attaching only the intended files to a draft release.
- Identify development artifacts by platform and full commit SHA; include source/run metadata, SHA-256 checksums and download guidance while retaining both OS and PR checks.
- Document Releases, Actions, source and future store installation in English/Korean, including package-only setup, updates, source switching and separate store availability.
- Replace the SDK integration test's manual WebSocket framing with a pinned `ws` server, verify normal closure before stopping the plugin, and include socket/process diagnostics on failure.
- Return album art status codes from the bridge and translate them in the Chrome popup's English/Korean catalogs.
- Honor multiple Track Dial ticks in both directions, capped at five skips per event; ignore invalid tick counts.
- Move Stream Deck registration, seven action handlers and rendering to the official SDK 3.0.2, bundled into a standalone executable.
- Validate and package Stream Deck installers in Linux/Windows CI using the pinned CLI; upload both component packages.
- Revoke server authentication on Unpair, reject old command polls on unpair/re-pair, and clear previous player state/commands.
- Restrict Chrome local storage to trusted extension contexts before token access; preserve credentials for retry if server revocation fails.
- Use Music Deck Bridge consistently in the popup, with localized service descriptions.
- Replace unverified artwork with reproducible geometric project icons and include SDK/runtime license notices.
- Add English/Korean store copy and a manual release evidence checklist. Store approval and device/DRM verification remain tracked separately from the GitHub release.
- Organize the Stream Deck plugin and Chrome extension in one repository.
- Adopt the Music Deck Bridge name and `io.github.minjungw00.musicdeckbridge` plugin/action UUID prefix.
- Align component versions and move Chrome popup translations into en/ko message catalogs.
- Add project documentation, licensing, CI and packaging tools.

## v0.5.1

- Replace the volume slider with a native HTML `input type="range"`, styled to match the SDPI layout, following the approach used by Elgato's Discord plugin. Keep the 1–5% range.
- Read `event.target.value` directly on `input` and immediately send the selected value to the plugin.
- Explicitly save the value through `streamDeckClient.setSettings` on `change`, preserving other action settings.
- Prevent delayed `didReceiveSettings` messages from overwriting the slider value being edited.
- Adjust volume and mute through YouTube Music's own controls, keeping the site's desktop/compact sliders and saved volume in sync. Preserve exact 1–5 point dial steps and command order during rapid input.
- Display the site's volume-slider percentage on Stream Deck and reflect manual volume changes made on the site.
- Show the volume percentage without a Volume label on the volume dial display.
- Use **YouTube Music × Stream Deck** in the extension popup without restricting its heading to the + model.
- Store authentication and port configuration in `%APPDATA%\MusicDeckBridge`.
- Remove automatic data migration, the dedicated Pairing PIN action and its assets, and outdated internal identifiers.

## v0.5.0

- Send volume slider changes to the plugin immediately and prevent delayed settings messages from replacing the most recently selected value. Keep 1–5% per tick, defaulting to 4%, with persistence handled by the SDPI component.
- Add a shared, configurable local server port to every key/dial action and the Chrome popup. The default is `17864`; accepted values are integers from `1024` to `65535`. The bind address remains `127.0.0.1`.
- When paired, changing the port in Chrome updates both the plugin server and extension. All Stream Deck actions share the same port.
- Persist the port in `%APPDATA%\YTMPWADeckBridge\config.json`, keeping authentication separately in `auth.json`.
- Retain the existing port if the new port is occupied or the configuration cannot be saved, and display the error.
- Keep the previous listener for up to two minutes and notify connected extensions of the new port. Stopped or sleeping Chrome instances may need their port matched manually.
- Reuse the extension's `http://127.0.0.1/*` permission without requesting new browser permissions for each port.

## v0.4.0

- Scroll both the song title and artist independently when **Scroll left** is selected. Short text stays fixed; **Truncate** applies to both fields.
- Apply an explicit dark theme to fix unreadable settings text. Bundle Elgato's sdpi-components v4.0.1 locally, sourced from the provided Elgato ChatGPT/Codex plugin, using `sdpi-item`, `sdpi-select`, `sdpi-range` and `sdpi-button` without a CDN.
- Follow the Stream Deck application language for settings and action names, and the Chrome display language for the popup: Korean for Korean, English otherwise. Preserve existing action settings and volume values.
- Distinguish saved authentication, extension communication, active player and idle/delayed player states. Recheck settings connection status about every five seconds.
- Enlarge the white shapes in key/dial images while keeping their 72×72 and 144×144 (@2x) sizes. Keep the separate 20×20 action-list icons at their designated size.
- Use the `scripting` permission to reinject into existing YouTube Music tabs/app windows after extension updates, Chrome startup and one-minute recovery checks. Add a versioned guard against duplicate controllers; protected or discarded tabs may still require a manual refresh.
- Extend player liveness from 3.5 to 90 seconds and treat an active waiting command channel as a heartbeat, reducing false offline status during Chrome timer throttling. Discarded tabs still require recovery; Memory Saver exceptions can help prevent discarding.

## v0.3.0

- Request artwork at up to 512px when supported Google/YouTube image URLs specify smaller `w60-h60`, `w120-h120` or `s120` dimensions. Inspect `srcset` and Media Session candidates, and retry the original URL if the upgraded URL fails. Source/CDN quality and the Stream Deck + display resolution still limit the result.
- Add **Truncate** and **Scroll left** settings to Now Playing. Scroll long titles left through an 11-character display window while keeping artist names truncated. A manually fixed Stream Deck key title can prevent dynamic titles from appearing.
- Unify key/dial settings into a shared, compact layout using standard controls. Remove custom red buttons, decorative panels and themes; load no extra UI library from the internet.
- Allow PIN generation from every key/dial's settings. Hide the legacy Pairing PIN action from the new action list while preserving existing instances. PINs remain valid for ten minutes.
- Replace the volume-step setting with a 1–5% slider, defaulting to 4%, stored per dial. Clamp previously saved values above 5 to 5 in the settings UI.
- Enlarge key/dial shapes while keeping them inside the red circular border.

## v0.2.0

- Expand DOM thumbnail selectors and add Media Session artwork fallback. Support numbered `lh*.googleusercontent.com` hosts and `image/webp`; strictly validate Google/YouTube image hosts and download up to 2 MB. Show download failures under **Check status → Album art** in the extension popup.
- Redraw all eight action icons with vector-based shapes and safe margins inside the red circular border to prevent clipping.
- Add a per-dial volume-step setting of 1–20%, defaulting to 4%, configured through the Volume Dial settings and Apply button.
- Add a separate local long-polling request so dial events can deliver commands immediately. Keep the regular 550 ms state sync as a fallback for network or extension restarts.
