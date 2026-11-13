# Store submissions

Last updated: November 14, 2026 (Asia/Seoul). Direct public-page retrieval confirmed **1.1.3** in both stores. The October 24 maintainer report of both stores' publication and normal operation is historical and has a separate scope.

## Current listings

| Store | Public status | Last maintainer-reported submission | Listing and ID |
| --- | --- | --- | --- |
| Elgato Marketplace | **1.1.3**, dated **November 2, 2026** on the listing, independently re-read November 14 | Historical **1.1.2** / plugin **1.1.2.0** | [Music Deck Bridge](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd) · `044e81d9-9671-4277-bcb9-ce8b6d38c3fd` |
| Chrome Web Store | **1.1.3**, updated **October 30, 2026** on the official English/Korean pages, independently read November 14. Earlier user publication confirmation remains historical evidence. | Historical **1.1.2** | [Music Deck Bridge](https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca) · `ldipcjgadbppphalmibkofhigjffnlca` |

The October 24 report confirms normal operation of the then-published store components without an itemized installation/migration or control inventory. The listings, store dashboards and runtime operation were not independently inspected for that report. See [runtime confirmation](runtime.md#official-store-components).

GitHub [v1.1.3](releases.md#v113) was published October 29. No store submission was performed as part of that GitHub release. The November 6 observation establishes Elgato public listing status by that date. Maker Console submission and review history, internal version identifiers and the meaning of the displayed date in that workflow remain unverified.

## November 14 public listing review and 1.2.0 drafts

The official [Chrome English](https://chromewebstore.google.com/detail/music-deck-bridge/ldipcjgadbppphalmibkofhigjffnlca?hl=en), [Chrome Korean](https://chromewebstore.google.com/detail/music-deck-bridge/ldipcjgadbppphalmibkofhigjffnlca?hl=ko) and [Elgato](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd) public pages each returned HTTP 200 in direct requests. The web search/open tool could not open Chrome, but the direct responses contained its public description and Details fields. Both Chrome locales showed 1.1.3, October 30, 2026 and two UI languages. This independently establishes the official displayed update date without replacing the earlier user report or third-party observation below. Elgato again showed 1.1.3, November 2, 2026 and English/Korean.

The live descriptions still focus on paired Stream Deck use and English/Korean UI. Elgato repeats its assertion that neither component works independently; Chrome's opening requirement also makes paired setup appear mandatory. Both are valid context for the existing 1.1.3 listing, but need revision for 1.2.0 standalone popup controls and eight UI languages. The English/Korean Chrome pages show Markdown-style heading asterisks as literal text in the retrieved page. Companion links contain no UTM parameters. Elgato's current How to Use correctly recommends Add to Chrome and keeps the GitHub ZIP as an optional manual method. Its Related Download currently points to GitHub Releases.

[Prepared 1.2.0 copy](../../store-assets/drafts/v1.2.0/README.md) contains complete Chrome English/Korean descriptions, a complete Elgato English description and separate What's new text. It separates standalone and paired setup, includes volume keys/feedback and eight UI languages, uses plain headings and correctly describes external artwork requests. These are unsubmitted proposals, not snapshots of actual submissions. The three v1.1.1 submitted description snapshots remain unchanged, including their original spacing; no 1.2.0 store submission, approval or publication was performed by this task.

The initial Elgato draft was 1,417 characters including LF newlines (1,430 with CRLF), within the [250–1,500-character English description guidelines](https://docs.elgato.com/guidelines/products/#description). That count covers the whole replacement and UTM link, not What's new. The Chrome drafts use the released package's existing short descriptions; the [manifest description](https://developer.chrome.com/docs/extensions/reference/manifest/description) and dashboard long description are separate fields. No released package, runtime URL, submitted media or tag was replaced. Existing local store popup exports depict 1.1.1 and plugin-required guidance, so they are identified as needing refreshed 1.2.0 visuals rather than silently relabeled.

The subsequent editorial revision simplifies the three product descriptions at the maintainer's request. Volume is listed alongside playback, navigation, ratings and mute; per-key step sizes, display durations, percent options, version-update instructions and command-channel implementation details are removed from the descriptions. The revised Elgato body is 1,232 characters including LF newlines (1,245 with CRLF). Separate What's new copy remains a version-change field; UTM destinations and submitted snapshots are unchanged.

New store-to-store links use `utm_source=elgato_marketplace` or `chrome_web_store`, `utm_medium=referral` and `utm_campaign=companion_setup`, distinct from the shipped `streamdeck_plugin` / `chrome_extension` product sources. Both proposed URLs returned HTTP 200 and reached the expected product with all three parameters retained; Chrome redirected its short path to the canonical named path. This verifies routing, not analytics collection. [Chrome's official documentation](https://developer.chrome.com/docs/webstore/google-analytics#using-utm-parameters) describes these parameters for page-view/install attribution with Analytics opt-in. Publisher configuration and actual attribution were not inspected. No corresponding official Elgato UTM-reporting guarantee was established, so the draft does not promise it. Support, guide and privacy links remain canonical.

GitHub [1.2.0](releases.md#v120) is published; that is separate from the stores' observed 1.1.3 state and these proposed listing revisions. The exact uploaded store archives, Console history and processed installers remain unverified.

The later maintainer-authorized [1.2.0 Chrome r1 attachment](releases.md#r1-chrome-revision) includes the popup-opening fix while preserving the original GitHub tag/files and numeric version. The prepared submission index now selects `music-deck-bridge-chrome-1.2.0-r1.zip` (SHA-256 `676fc6674be20b8c99f47fe920f377b3b5d5f914eb3993b9fc6fa376f6279864`) with the unchanged plugin. This is package preparation; no store upload/review/publication is recorded.

## Chrome Web Store publication evidence

On November 13, 2026, the user reported directly confirming the official Chrome Web Store publication of **1.1.3**. This report establishes user-confirmed publication; the listing could not be independently opened during this review.

The November 10 Chrome-Stats observation supplied for this review reported **1.1.3** and **Last updated: 2026-10-30**. A November 13 retrieval of the [same record](https://chrome-stats.com/d/ldipcjgadbppphalmibkofhigjffnlca) returned those fields in a snapshot marked **Data ingested on: 2026-11-08**; the November 10 collection date was not independently verified. At that November 13 review, the October 30 update date was a third-party observation rather than a confirmed official update or publication date. Official listing copy, submission/review history, store-package SHA-256, identity with the GitHub release asset and installation/runtime results for an identified 1.1.3 store package were unverified.

## Submitted description history

| Report date (KST) | Reported state |
| --- | --- |
| October 18 | Both stores initially submitted at 1.1.1, Pending review; updated to 1.1.2, Pending review after released-version operation was confirmed |
| October 20 | Chrome publication and store-extension/released-plugin operation confirmed; Marketplace still Pending review |
| October 24 | Both publications complete and normal operation confirmed |

No separate approval outcome for the earlier revision was reported. The maintainer supplied these actual **v1.1.1** descriptions:

| Store | Preserved submitted text |
| --- | --- |
| Elgato Marketplace | [English](../../store-assets/submitted/v1.1.1/elgato-en.md) |
| Chrome Web Store | [English](../../store-assets/submitted/v1.1.1/chrome-en.md) · [Korean](../../store-assets/submitted/v1.1.1/chrome-ko.md) |

The three snapshots remain verbatim, including temporary GitHub companion-download links and Elgato spacing. Revised 1.1.2 descriptions were not supplied. These snapshots document historical submissions, not the current live copy; later supplied revisions belong in separate files.

## Public description correction

On November 6, 2026, the [public Elgato listing](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd) showed **1.1.3** with the displayed date **November 2, 2026**. Its English How to Use recommends installing the companion extension via **Add to Chrome** in the Chrome Web Store. It offers the packaged Chrome extension ZIP from GitHub Releases as an optional manual method, with extraction and Chrome's **Load unpacked** step. This observation covers the listing text. The exact submitted description and any connection to the local draft remain unverified.

The maintainer's October 28 inspection and an independent October 29 read found **1.1.2** with the earlier How to Use text. It still described the extension as awaiting publication and pointed to the Chrome Web Store address for a ZIP download.

The October 29 [English How to Use draft](../../store-assets/elgato/how-to-use.en.md) was local and unpublished at that review. It proposed the same split between installation methods, following the [English installation guide](../installation.en.md). The draft and the old v1.1.1 prefix with its companion URL updated totaled 1,460 characters against the [description limit](https://docs.elgato.com/guidelines/products/#description). That count applies to the historical draft and prefix.

The October 29 review could not open the Chrome Web Store listing. It did confirm from the [Chrome listing guide](https://developer.chrome.com/docs/webstore/cws-dashboard-listing#graphic_assets) that the small promotional tile is optional and updated the local upload guide.

## Package and media provenance

[GitHub release verification](releases.md) retains source, CI and public package hashes for v1.2.0 and earlier releases. The Elgato listing does not identify the 1.1.3 upload file or its SHA-256, selected media, publication settings or a Console-processed installer. The relationship between the store package and the GitHub asset remains unverified. No installation or DRM execution of an identified 1.1.3 store package has been verified.

[Prepared media](media.md), [maintainer-confirmed operation](runtime.md#official-store-components) and [Console-processed DRM evidence](marketplace-drm.md) have distinct scopes.

## Follow-up

- Record later store revisions with version identifiers, uploaded-file hashes, media selections and supplied descriptions when available.
- Preserve separately obtained processed-installer identity and detailed DRM results in the [DRM record](marketplace-drm.md). Completed operation does not need repeating solely for missing metadata.
