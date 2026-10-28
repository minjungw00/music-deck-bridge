# Changelog

## v1.1.3-dev — unreleased

- Preserve non-square Current Track key artwork proportions with centered fitting and black margins, with or without the optional title backdrop.
- Initialize playback before Previous/Next on a restored or paused player, then confirm both navigation and actual destination playback. A cued destination receives one Play request without replaying navigation.
- Recognize confirmed same-track Previous restarts within the first five seconds, including a seek at time zero; retain autoplay/error reporting and rejection of ambiguous navigation retries.
- Separate ordered control dispatch from outcome confirmation so a pending Previous result cannot block later Pause/Next inputs. Cancel superseded verification without resuming playback or displaying stale failures.
- Recover paused same-item Previous playback even when no seek event is emitted, retain restart evidence through delayed playback, and observe playback instead of waiting for a site's unsettled Play promise.
- Start a cued player through its usable Play control before waiting for loaded media/track metadata; require cueing rather than API initialization alone and respect a known empty queue. Distinguish initialization failure from an unconfirmed dispatched control.
- Use explicit Play API requests for an UNSTARTED restored track with an ID but no ready media; recover an ineffective initial request with bounded, spaced Play retries only while the same player/selection remains unchanged. Stop recovery on progress, later playback control or errors; retain playback confirmation and never replay Toggle/navigation.
- Apply the same bounded Play recovery to an observed Previous/Next destination that remains UNSTARTED after its first Play request; preserve one navigation click and cancellation by later Pause.
- Add bounded playback-failure diagnostics in the extension worker console to distinguish site events, media errors and script exceptions, including phase, numeric code, input-time versus failure-time readiness, dispatched action/API source and user-activation flags.
- Separate injected playback from volume controls and organize observation, diagnostics, event lifecycle, bounded recovery, dispatch and confirmation into named helpers while preserving the serialized MAIN-world entry point.
- Update the Stream Deck SDK to 3.0.3 and CLI to 1.10.3 while retaining Node.js 24.
- Scope a Zod 4.6.7 override to `@elgato/utils` 0.6.1 to address GHSA-mrhx-c7xc-m3w5; add option-schema compatibility and bounded-array rejection regressions.
- Update the CLI's locked `fast-uri` dependency from 3.1.8 to 3.1.9 within its existing allowed range to address URI parsing advisories.

## v1.1.2 — 2026-10-18

- Serialize extension pairing, unpairing, port changes and management reads through server responses and local persistence; failed operations allow subsequent requests to continue.
- Ignore superseded popup responses and retain newer port edits when startup reads or save responses arrive late.
- Preserve compatibility diagnostics, protocol blocking and pending commands when saving replacement pairing credentials fails.
- Coalesce unsent dial feedback into the latest frame while preserving layout-before-content order; retry failed/skipped frames and discard pending content when an action disappears.
- Wait for every overlapping tab-state request before sending its close notification, including when individual requests fail.
- Serialize bridge startup and port changes; reuse an active listener on repeated startup and retain the port-change grace period after persistence failures.
- Reattach player DOM observation after each cached-page restoration, alongside periodic synchronization and command listening.
- Retry failed/skipped SDK image/title outputs on the next repaint and serialize pending field updates so older sends cannot replace the latest state.
- Deduplicate overlapping album artwork downloads by source URL and retain independent pending status when tracks change.
- Separate the plugin into domain policies, application services, transport/storage adapters and presentation modules. Model browser command delivery with explicit states and preserve ordered one-shot delivery.
- Split the Chrome worker into bridge-client, browser-channel, management, player-sync, message-router and page-control modules. Use the real worker import graph in fixtures and include its modules in packaging checks.
- Separate content metadata/execution/lifecycle and inspector translations/volume editing state; load every content module through the same manifest list during reinjection.
- Isolate integration tests with temporary ports and bounded child cleanup, allowing four test processes.
- Reuse the presentation API directly in rendering tests and offline previews, replacing source-text extraction.

## v1.1.1 — 2026-10-18

- Keep the English/Korean popup action buttons on one line with equal widths, explicit typography and consistent heights; shorten the English status button to “Status”.
- Show the existing main icon beside the Music Deck Bridge popup heading.
- Add an offline rendering-preview generator for the English/Korean popup and Stream Deck + layout with sample track metadata and selectable display states.
- Select the English/Korean popup images and actual Stream Deck capture as official product media; balance the capture's outer margins without changing its UI pixels.
- Publish source/Chrome version 1.1.1 and Stream Deck version 1.1.1.0; retain protocol 1, existing permissions, pairing and profile settings. See the [installation investigation](docs/verification/installation.md) for the Explorer-handle failure and successful retry; no installer code fix is claimed.

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
- Record [maintainer-completed device, Chrome and retention/rollback checks](docs/verification/runtime.md#earlier-behavior-confirmation). The installation conflict was not reproduced at that sign-off; no cause fix was claimed. Protocol behavior passed local automated/Chromium fixtures; DRM and store approval remained separate.

## Historical v1.0.2 candidate — not published, superseded by v1.1.0

- Show Play when paused and Pause while playing, following confirmed player state, including changes made in Chrome. Show Play with an offline title when no player is available.
- Align all seven action families and the popup palette with the magenta play-disc identity; retain monochrome action-list icons. Add the supplied project thumbnail to README. Candidate assets remain separate from fixed public/submitted v1.0.1 packages.
- Align source/Chrome at 1.0.2 and Stream Deck at 1.0.2.0. Preserve UUIDs, authentication, shared port, protocol and configuration paths.
- Record failed root-rename updates and later successful developer/normal-mode retries. No installer code fix, universal developer-mode requirement or universal manual-stop requirement was established. Controlled comparisons and installed-file checks are consolidated in the [installation investigation](docs/verification/installation.md).
- Record maintainer-confirmed operation of plugin 1.0.2 with Chrome extension 1.0.1 after a successful retry. Chrome 1.0.2 operation and detailed retention/rollback were outside that report; later evidence is recorded separately in [runtime verification](docs/verification/runtime.md#maintainer-confirmation).

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
