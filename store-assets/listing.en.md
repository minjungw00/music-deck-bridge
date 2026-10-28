# Store listing copy — English

## Submitted descriptions

The maintainer supplied these descriptions as the actual **v1.1.1** submissions. Preserve their wording; record later revisions separately. [Submission status and provenance](../docs/verification/stores.md) distinguishes these snapshots from package and media evidence.

| Store | Submitted text |
| --- | --- |
| Elgato Marketplace | [English](submitted/v1.1.1/elgato-en.md) |
| Chrome Web Store | [English](submitted/v1.1.1/chrome-en.md) · [Korean](submitted/v1.1.1/chrome-ko.md) |

## Metadata suggestions

| Field | Suggested value |
| --- | --- |
| Name | **Music Deck Bridge** |
| Chrome short description | Control YouTube Music from Elgato Stream Deck using a Chrome extension. |
| Marketplace summary | Control the YouTube Music web player from Stream Deck keys and Stream Deck + dials. |

These short-field suggestions and the permission explanations below are preparation guidance; actual submitted values for those fields were not supplied.

## Permission explanations

| Permission / host | User-facing reason |
| --- | --- |
| storage | Save the local pairing token and bridge port. Content scripts cannot read this storage. |
| scripting | Restore scripts after extension updates/startup, read player state, and execute and confirm playback, track-navigation and volume/mute controls in the page. |
| alarms | Periodically restore player scripts and the browser command connection. |
| https://music.youtube.com/* | Read current-track/rating information, locate its tabs and operate playback and rating controls on YouTube Music. |
| http://127.0.0.1/* | Connect to the companion plugin on the same computer using its configurable port. |

## Submission links and privacy review

- [Project and installation](https://github.com/minjungw00/music-deck-bridge)
- [Support](https://github.com/minjungw00/music-deck-bridge/issues)
- [Privacy policy](https://github.com/minjungw00/music-deck-bridge/blob/main/PRIVACY.md)
- Companion downloads: [Elgato Marketplace](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd) / [Chrome Web Store](https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca)
- License/notices: repository LICENSE and THIRD_PARTY_NOTICES.md, also included in packages.

Before submitting or revising a listing, ensure the public privacy URL matches the uploaded build and review store data-use declarations against PRIVACY.md. The extension handles song metadata, tab IDs and local authentication; the plugin makes external artwork requests. Do not describe all traffic as local. Fill the store's actual privacy form after reviewing its then-current categories.
