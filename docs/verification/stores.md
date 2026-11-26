# Store submissions

Last updated November 27, 2026 (Asia/Seoul).

## Current listings

| Store | Public version | Displayed date | Listing and ID |
| --- | --- | --- | --- |
| Elgato Marketplace | **1.2** in Details, **1.2.0** in What's new | **November 23, 2026** | [Music Deck Bridge](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd) · `044e81d9-9671-4277-bcb9-ce8b6d38c3fd` |
| Chrome Web Store | **1.2.0** in English and Korean | Updated **November 14, 2026** | [Music Deck Bridge](https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca) · `ldipcjgadbppphalmibkofhigjffnlca` |

## November 27 publication verification

The maintainer reported that 1.2.0 publication was complete in both stores. At 01:57 KST, direct requests without signing in returned HTTP 200 for the [Chrome English listing](https://chromewebstore.google.com/detail/music-deck-bridge/ldipcjgadbppphalmibkofhigjffnlca?hl=en), [Chrome Korean listing](https://chromewebstore.google.com/detail/music-deck-bridge/ldipcjgadbppphalmibkofhigjffnlca?hl=ko) and [Elgato listing](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd). The Elgato version and date matched on a second request with a fresh query parameter. The table records the dates the stores display. The exact time each update became public is unknown.

Both Chrome pages list eight languages and describe the standalone popup and optional Stream Deck pairing. Elgato's description recommends Add to Chrome for the companion extension, describes PIN pairing and mentions standalone popup use. Its release notes cover Volume Up / Down keys, the popup and eight UI locales. The observed descriptions have links to the companion store with the prepared UTM source, medium and campaign values. Analytics collection was outside the verification scope.

The [local 1.2.0 drafts](../../store-assets/drafts/v1.2.0/README.md) are reference material. Exact Console fields, submission and review history, uploaded package hashes, selected media and processed installers were unavailable. Installation, YouTube Music playback, Stream Deck operation and DRM for the 1.2.0 store packages were outside the verification scope. [GitHub release verification](releases.md#v120) covers the separately distributed packages.

## Earlier store releases

The October 24 report confirms normal operation of the then-published 1.1.2 store components without an itemized installation/migration or control inventory. The listings, store dashboards and runtime operation were not independently inspected for that report. See [runtime confirmation](runtime.md#official-store-components).

GitHub [v1.1.3](releases.md#v113) was published October 29. No store submission was performed as part of that GitHub release. The November 6 observation establishes Elgato public listing status by that date. Maker Console submission and review history, internal version identifiers and the meaning of the displayed date in that workflow remain unverified.

## November 14 public listing review and 1.2.0 drafts

The official [Chrome English](https://chromewebstore.google.com/detail/music-deck-bridge/ldipcjgadbppphalmibkofhigjffnlca?hl=en), [Chrome Korean](https://chromewebstore.google.com/detail/music-deck-bridge/ldipcjgadbppphalmibkofhigjffnlca?hl=ko) and [Elgato](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd) public pages each returned HTTP 200 in direct requests. The web search/open tool could not open Chrome, but the direct responses contained its public description and Details fields. Both Chrome locales showed 1.1.3, October 30, 2026 and two UI languages. This independently establishes the official displayed update date without replacing the earlier user report or third-party observation below. Elgato again showed 1.1.3, November 2, 2026 and English/Korean.

The 1.1.3 descriptions emphasized paired Stream Deck use and English/Korean UI. Elgato said neither component worked independently, and Chrome's opening requirement made paired setup appear mandatory. The English/Korean Chrome pages displayed literal Markdown heading asterisks. Their companion links had no UTM parameters. Elgato's How to Use recommended Add to Chrome and offered the GitHub ZIP for manual installation. Its Related Download pointed to GitHub Releases.

The initial [1.2.0 drafts](../../store-assets/drafts/v1.2.0/README.md) covered English and Korean Chrome descriptions, the English Elgato description and separate What's new text. They described standalone and paired setup, volume keys and feedback, eight UI languages and external artwork requests. The November 14 work prepared drafts and preserved the three verbatim v1.1.1 submissions.

The initial Elgato draft was 1,417 characters including LF newlines (1,430 with CRLF), within the [250–1,500-character English description guidelines](https://docs.elgato.com/guidelines/products/#description). That count covers the whole replacement and UTM link, not What's new. The Chrome drafts use the released package's existing short descriptions; the [manifest description](https://developer.chrome.com/docs/extensions/reference/manifest/description) and dashboard long description are separate fields. No released package, runtime URL, submitted media or tag was replaced. Existing local store popup exports depict 1.1.1 and plugin-required guidance, so they are identified as needing refreshed 1.2.0 visuals rather than silently relabeled.

The subsequent editorial revision simplifies the three product descriptions at the maintainer's request. Volume is listed alongside playback, navigation, ratings and mute; per-key step sizes, display durations, percent options, version-update instructions and command-channel implementation details are removed from the descriptions. The revised Elgato body is 1,232 characters including LF newlines (1,245 with CRLF). Separate What's new copy remains a version-change field; UTM destinations and submitted snapshots are unchanged.

New store-to-store links use `utm_source=elgato_marketplace` or `chrome_web_store`, `utm_medium=referral` and `utm_campaign=companion_setup`, distinct from the shipped `streamdeck_plugin` / `chrome_extension` product sources. Both proposed URLs returned HTTP 200 and reached the expected product with all three parameters retained; Chrome redirected its short path to the canonical named path. This verifies routing, not analytics collection. [Chrome's official documentation](https://developer.chrome.com/docs/webstore/google-analytics#using-utm-parameters) describes these parameters for page-view/install attribution with Analytics opt-in. Publisher configuration and actual attribution were not inspected. No corresponding official Elgato UTM-reporting guarantee was established, so the draft does not promise it. Support, guide and privacy links remain canonical.

At the November 14 review, GitHub [1.2.0](releases.md#v120) was published and the stores displayed 1.1.3.

The later maintainer-authorized [temporary 1.2.0 Chrome r1 attachment](releases.md#temporary-r1-chrome-revision-superseded) included the popup-opening fix while preserving the original GitHub tag/files and numeric version. At that stage the submission index selected `music-deck-bridge-chrome-1.2.0-r1.zip` (SHA-256 `676fc6674be20b8c99f47fe920f377b3b5d5f914eb3993b9fc6fa376f6279864`) with the unchanged plugin for package preparation.

The maintainer subsequently authorized replacing the canonical GitHub 1.2.0 package/tag before store publication. The submission index now selects the corrected `music-deck-bridge-chrome-1.2.0.zip` (SHA-256 `f423aef0414da08480ceaef4145b4b1ef0866107eb8b375e285a8a3324341397`) with the unchanged plugin. The temporary r1 attachments were removed; initial/r1 source and hash history remains in [release verification](releases.md#current-corrected-publication). No store upload or publication was performed by this task.

### Eight-language description drafts

At the maintainer's request, the prepared set now contains **16 product descriptions**: Chrome and Elgato copies for `en`, `ko`, `zh_CN`, `zh_TW`, `ja`, `es`, `fr` and `de`, matching both products' UI locale coverage. The previously simplified general feature descriptions remain the basis; per-key step sizes, numeric-feedback durations, version-update instructions and implementation details are excluded. Elgato setup now explicitly selects the localized Connect button after entering the PIN, including in the English base copy. Guide links in the six new Chrome translations identify the existing English guide rather than implying translated guides exist. UI language coverage does not commit customer-support or legal-policy translations.

[Chrome's listing guide](https://developer.chrome.com/docs/webstore/cws-dashboard-listing#localize-your-listing) supports per-locale descriptions matching packaged `_locales` directories and asks for consistent feature claims. [Elgato's description guide](https://docs.elgato.com/guidelines/products/#description) requires English and 250–1,500 characters; its [Language field](https://docs.elgato.com/maker-console/managing-products/#details) lists product-supported languages rather than establishing localized-description fields. Consequently, English is the Elgato publishing draft and the other seven are reference translations; no non-English publishing support was established.

All 16 UTF-8 files passed checks for exact locale coverage, shared URL destinations, UTM values and plain-text formatting. Every Elgato body fits 250–1,500 characters including line breaks (maximum 1,462 with CRLF). The index's eight short-description values match the released catalogs and fit 132 characters. All relative documentation links resolve. These checks do not constitute native-speaker review or Console acceptance. Existing submitted snapshots, runtime sources, versions and released archives are unchanged; no upload/publication was performed.

| Locale | Chrome characters (LF) | Elgato characters (LF) |
| --- | --- | --- |
| `en` | 2091 | 1248 |
| `ko` | 1484 | 943 |
| `zh_CN` | 1303 | 803 |
| `zh_TW` | 1321 | 809 |
| `ja` | 1504 | 909 |
| `es` | 2548 | 1419 |
| `fr` | 2661 | 1449 |
| `de` | 2493 | 1440 |

## Chrome Web Store publication evidence

On November 13, 2026, the user reported directly confirming the official Chrome Web Store publication of **1.1.3**. The listing could not be independently opened that day. The [November 14 review](#november-14-public-listing-review-and-120-drafts) independently confirmed it.

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

[GitHub release verification](releases.md) retains source, CI and public package hashes for v1.2.0 and earlier releases. The November observations of 1.1.3 did not establish the Elgato upload hash, media provenance, publication settings, processed installer identity or runtime and DRM results for that package.

[Prepared media](media.md), [maintainer-confirmed operation](runtime.md#official-store-components) and [Console-processed DRM evidence](marketplace-drm.md) have distinct scopes.

## Follow-up

- Record later store revisions with version identifiers, uploaded-file hashes, media selections and supplied descriptions when available.
- Preserve separately obtained processed-installer identity and detailed DRM results in the [DRM record](marketplace-drm.md). Completed operation does not need repeating solely for missing metadata.
