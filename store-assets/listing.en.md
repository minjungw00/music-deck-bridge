# Store copy — English

Draft for the current 1.0.0 source. Check every claim against the final submitted build. Screenshots and release approval are still pending; see [release readiness](../docs/release-readiness.md).

## Chrome Web Store

Name: **Music Deck Bridge**

Short description: Control YouTube Music from Elgato Stream Deck using a Chrome extension.

Full description:

Music Deck Bridge connects the YouTube Music player in Google Chrome to a Stream Deck on the same Windows computer. Install the companion Music Deck Bridge Stream Deck plugin to use this extension.

- Play or pause, skip tracks and toggle mute from Stream Deck keys.
- Show the current song, artist and album artwork on a Now Playing key.
- Use Stream Deck + dials to adjust volume or change tracks.
- Connect using a six-digit PIN generated in the Stream Deck action settings.
- Use a regular Chrome tab or YouTube Music installed as a Chrome app.
- Choose English or Korean through your browser and Stream Deck language settings.

Requires Windows 10/11, Google Chrome 116+, Stream Deck software 7.1+ and the companion plugin. Dial controls require Stream Deck +. YouTube Music playback and account requirements are governed by YouTube Music.

Communication between the extension and plugin uses an authenticated local bridge. The plugin downloads album artwork from approved Google/YouTube image hosts. Music Deck Bridge has no project-operated server, analytics or advertising. See the privacy policy for exact data handling and retention.

This is an independent, unofficial integration. It is not affiliated with or endorsed by Google, YouTube, Elgato or Corsair.

## Elgato Marketplace

Name: **Music Deck Bridge**

Summary: Control the YouTube Music web player from Stream Deck keys and Stream Deck + dials.

Description:

Keep playback controls and current-track information on Stream Deck while YouTube Music runs in Chrome. Music Deck Bridge provides seven actions: Now Playing, Play / Pause, Previous Track, Next Track, Mute, Volume Dial and Track Dial.

The Now Playing key shows artwork, title and artist and supports scrolling text. The volume dial adjusts YouTube Music by 1–5 percentage points per tick and mutes on push. The track dial skips on rotation and plays or pauses on push. Tap either dial's touch area to play or pause.

Install the companion Chrome extension from the project installation guide, then generate a PIN in any action's settings and enter it in the extension popup. Both components must run on the same Windows computer. The default bridge port is 17864 and can be changed in either component. Unpair revokes the connection on both sides when the bridge is reachable.

Requires Windows 10/11, Chrome 116+ and Stream Deck 7.1+. Key actions support Stream Deck key devices; the two dial actions require Stream Deck +. English and Korean are included. An installed YouTube Music Chrome app is preferred when both it and a regular player tab are open.

Independent, unofficial integration; not affiliated with or endorsed by Google, YouTube, Elgato or Corsair.

## Permission explanations

| Permission / host | User-facing reason |
| --- | --- |
| storage | Save the local pairing token and bridge port. Content scripts cannot read this storage. |
| scripting | Restore the player connection after extension updates/startup and use the player's own volume/mute controls. |
| alarms | Periodically restore connections to open YouTube Music windows. |
| https://music.youtube.com/* | Read current-track information and operate playback on YouTube Music. |
| http://127.0.0.1/* | Connect to the companion plugin on the same computer using its configurable port. |

## Submission links and privacy review

- Project and installation: https://github.com/minjungw00/music-deck-bridge
- Support: https://github.com/minjungw00/music-deck-bridge/issues
- Privacy: https://github.com/minjungw00/music-deck-bridge/blob/main/PRIVACY.md
- License/notices: repository LICENSE and THIRD_PARTY_NOTICES.md, also included in packages.

Before submission, ensure the public privacy URL matches the uploaded build and review store data-use declarations against PRIVACY.md. The extension handles song metadata, tab IDs and local authentication; the plugin makes external artwork requests. Do not describe all traffic as local. Fill the store's actual privacy form after reviewing its then-current categories.
