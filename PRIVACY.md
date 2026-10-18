# Privacy

Effective date: October 18, 2026.

Music Deck Bridge connects the YouTube Music web player in Chrome to a Stream Deck plugin on the same computer. It has no project-operated server, analytics, advertising or telemetry. It does not read Google passwords, account tokens, payment information or browser history. Normal YouTube Music and Chrome network activity is governed by their providers' policies.

## Data used

| Data | Purpose | Storage and retention |
| --- | --- | --- |
| Song title, artist, video ID, artwork URLs, playing/mute state, volume and like/dislike state | Display the current track and control the player | Plugin memory; replaced as state changes and cleared when the process exits |
| Chrome tab ID and installed-app status | Select a player, preferring the installed Chrome app | Plugin memory; not a persistent browsing record |
| Six-digit pairing PIN | Authorize a new extension connection | Plugin memory; expires after ten minutes or successful pairing |
| Random pairing token and extension origin/ID | Authenticate local requests | Plugin `auth.json`; extension token in `chrome.storage.local`; retained until replaced or deleted |
| Local bridge port | Connect the two components | Plugin `config.json` and extension `chrome.storage.local` (`bridgePort`); retained until changed or deleted |
| Artwork bytes and download errors | Show artwork and connection diagnostics | Plugin memory cache; cleared on plugin exit |
| Queued playback/rating commands | Deliver button and dial input; bind ratings to the intended current track | Plugin memory; consumed on delivery or discarded after five seconds |
| Last command failure code | Explain pairing, delivery or player readiness failures | Plugin memory until successful execution, pairing reset or process exit; bounded codes are also written to the SDK log |
| Browser launch/playback request and acknowledgment | Open or focus YouTube Music, including when no player tab exists | Plugin memory; ordered inputs expire after 45 seconds or clear on completion/pairing reset; repeated Open requests coalesce |

On Windows, plugin files are stored under `%APPDATA%\MusicDeckBridge\`. Chrome manages the extension's local storage inside the active browser profile; the extension does not use Chrome sync storage. Stream Deck separately stores action settings, including title display mode, dial step size and the Current Track Dial display mode, artwork fit, song/artist visibility, text background and scrolling mode, in its profiles.

## Network activity

The extension reads the page player's playback/mute state through a fixed function in the top-level page context, with media-element state as fallback; only those scalar states are added to metadata sync. It reports closed tab IDs and the current music-tab IDs to remove stale players, without retaining a browsing history.

The extension sends player state and authenticated commands to `http://127.0.0.1:<port>` (default `17864`). The bridge listens on the IPv4 loopback interface and accepts Chrome extension origins, with token and paired-origin checks after pairing. The service worker restricts `chrome.storage.local` to trusted extension contexts before accessing tokens. Content scripts cannot read that storage or receive the token through the extension message API. An extension with no local token can report that absence to the bridge using `/status`; the request receives HTTP 401 and grants no state or control access. The bridge retains its saved credentials and can mark the connection unconfirmed and cancel undelivered commands; an active authenticated browser poll takes precedence.

Any control may open `https://music.youtube.com/` in Chrome. Functional inputs wait for the opened player and then operate its controls. Like/dislike inputs from a closed player act on the restored current song; changes are saved by YouTube Music to the signed-in account under its policies. Removing Music Deck Bridge or unpairing does not undo saved song ratings. The extension uses existing site permissions to locate YouTube Music tabs; it does not request access to other sites.

The plugin fetches album artwork over HTTPS from `i.ytimg.com`, `img.youtube.com`, `yt3.ggpht.com`, `yt3.googleusercontent.com` and numbered `lh*.googleusercontent.com` hosts. Redirect destinations must also pass this allowlist. These requests expose your IP address, the requested artwork URL, standard request metadata and a YouTube Music Referer to the image provider. Google account cookies are not supplied by the plugin. Artwork URLs may identify the track being played. **Not all network activity is local.**

No listening data is sent to the project maintainer or sold. Diagnostic logs may contain connection details, artwork URLs or errors; review logs before sharing them. The project does not define a retention policy for logs maintained by Stream Deck or Chrome.

## Permissions

- `storage`: save the pairing token and port locally.
- `scripting`: restore the content script after updates/startup and operate YouTube Music's volume/mute controls in the page's JavaScript environment. Pairing tokens remain in the extension service worker.
- `alarms`: periodically restore player scripts and the browser command connection.
- `https://music.youtube.com/*`: read player metadata/rating state, locate its tabs and operate playback/rating controls on that site.
- `http://127.0.0.1/*`: connect to the configurable local bridge port.

## Delete or reset data

Select **Unpair** in the popup to revoke the server token, delete the plugin's `auth.json` and remove the extension's token. Existing command polls are rejected, and player state and queued commands are cleared. The port is retained. If the bridge cannot be reached or revocation fails, the popup reports failure and retains the token so you can start Stream Deck, match the port and retry. A token already rejected by the server can be removed locally. A new successful pairing replaces the previous token and extension origin and rejects the previous session's pending requests.

For a full reset, quit Stream Deck, delete `%APPDATA%\MusicDeckBridge\auth.json` and `config.json`, and remove the extension through `chrome://extensions` to delete its local storage. To uninstall the plugin, delete `io.github.minjungw00.musicdeckbridge.sdPlugin` from `%APPDATA%\Elgato\StreamDeck\Plugins`. Remove associated Stream Deck actions/profiles through Stream Deck if you also want to delete their settings.

For questions use the [repository issues](https://github.com/minjungw00/music-deck-bridge/issues); for sensitive information follow [SECURITY.md](SECURITY.md). Before Chrome Web Store submission, review this document against the actual submitted version and its store privacy declarations.
