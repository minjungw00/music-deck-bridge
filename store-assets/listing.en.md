# Store copy — English

Reference copy for store listings and review-requested revisions. Confirm the actual dashboard text against the submitted build. Track submitted versions, review status and uploaded-copy provenance in [release readiness](../docs/release-readiness.md) and its linked records.

## Chrome Web Store

Name: **Music Deck Bridge**

Short description: Control YouTube Music from Elgato Stream Deck using a Chrome extension.

Full description:

Music Deck Bridge connects the YouTube Music player in Google Chrome to a Stream Deck on the same Windows computer. Install the companion Music Deck Bridge Stream Deck plugin to use this extension.

- Play or pause, skip tracks and toggle mute from Stream Deck keys.
- Open or focus YouTube Music from a key; controls open a missing player and continue their requested action when ready.
- Like or dislike the current song and press again to remove the rating.
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

Control YouTube Music in Chrome from Stream Deck on Windows. Music Deck Bridge connects a Stream Deck plugin with a companion Chrome extension for playback keys, song information and Stream Deck + dials.

Play, pause, skip tracks, mute, open YouTube Music, and like or dislike the current song. Controls can open a missing player and complete the requested input when ready. Press a rating key again to remove that rating; a signed-in player with working rating controls is required.

The Now Playing key shows artwork, title and artist, with text visibility and scrolling options. The Volume Dial adjusts volume by 1–5 percentage points per tick and mutes on press or touch. The Current Track Dial skips on rotation and plays or pauses on press or touch. Choose song information or fitted album artwork with optional text.

Requires Windows 10/11, Google Chrome 116+, Stream Deck 7.1+ and the companion Chrome extension. Dial controls require Stream Deck +. Install both components on the same PC and pair them with a six-digit PIN. The local bridge port is configurable. English and Korean are supported; normal Chrome tabs and the Chrome-installed YouTube Music app work.

Independent, unofficial integration; not affiliated with or endorsed by Google, YouTube, Elgato or Corsair.

## Permission explanations

| Permission / host | User-facing reason |
| --- | --- |
| storage | Save the local pairing token and bridge port. Content scripts cannot read this storage. |
| scripting | Restore the player connection after extension updates/startup and use the player's own volume/mute controls. |
| alarms | Periodically restore player scripts and the browser command connection. |
| https://music.youtube.com/* | Read current-track/rating information, locate its tabs and operate playback and rating controls on YouTube Music. |
| http://127.0.0.1/* | Connect to the companion plugin on the same computer using its configurable port. |

## Submission links and privacy review

- Project and installation: https://github.com/minjungw00/music-deck-bridge
- Support: https://github.com/minjungw00/music-deck-bridge/issues
- Privacy: https://github.com/minjungw00/music-deck-bridge/blob/main/PRIVACY.md
- License/notices: repository LICENSE and THIRD_PARTY_NOTICES.md, also included in packages.

Before submitting or revising a listing, ensure the public privacy URL matches the uploaded build and review store data-use declarations against PRIVACY.md. The extension handles song metadata, tab IDs and local authentication; the plugin makes external artwork requests. Do not describe all traffic as local. Fill the store's actual privacy form after reviewing its then-current categories.
