# Changelog

## Unreleased

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
