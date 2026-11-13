# Store submissions

Last updated: November 13, 2026 (Asia/Seoul). The Elgato public listing displayed **1.1.3** on November 6. The October 24 maintainer report of both stores' publication and normal operation is historical and has a separate scope.

## Current listings

| Store | Public status | Last maintainer-reported submission | Listing and ID |
| --- | --- | --- | --- |
| Elgato Marketplace | **1.1.3**, dated **November 2, 2026** on the listing, as observed November 6 | Historical **1.1.2** / plugin **1.1.2.0** | [Music Deck Bridge](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd) · `044e81d9-9671-4277-bcb9-ce8b6d38c3fd` |
| Chrome Web Store | **1.1.3** publication directly confirmed by the user on November 13. Official update date and current copy remain unverified. | Historical **1.1.2** | [Music Deck Bridge](https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca) · `ldipcjgadbppphalmibkofhigjffnlca` |

The October 24 report confirms normal operation of the then-published store components without an itemized installation/migration or control inventory. The listings, store dashboards and runtime operation were not independently inspected for that report. See [runtime confirmation](runtime.md#official-store-components).

GitHub [v1.1.3](releases.md#v113) was published October 29. No store submission was performed as part of that GitHub release. The November 6 observation establishes Elgato public listing status by that date. Maker Console submission and review history, internal version identifiers and the meaning of the displayed date in that workflow remain unverified.

## Chrome Web Store publication evidence

On November 13, 2026, the user reported directly confirming the official Chrome Web Store publication of **1.1.3**. This report establishes user-confirmed publication; the listing could not be independently opened during this review.

The November 10 Chrome-Stats observation supplied for this review reported **1.1.3** and **Last updated: 2026-10-30**. A November 13 retrieval of the [same record](https://chrome-stats.com/d/ldipcjgadbppphalmibkofhigjffnlca) returned those fields in a snapshot marked **Data ingested on: 2026-11-08**; the November 10 collection date was not independently verified. The October 30 update date remains a third-party observation, not a confirmed official update or publication date. Current official listing copy, submission/review history, store-package SHA-256, identity with the GitHub release asset and installation/runtime results for an identified 1.1.3 store package remain unverified.

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

[GitHub release verification](releases.md) retains source, CI and public package hashes for v1.1.3 and earlier releases. The Elgato listing does not identify the 1.1.3 upload file or its SHA-256, selected media, publication settings or a Console-processed installer. The relationship between the store package and the GitHub asset remains unverified. No installation or DRM execution of an identified 1.1.3 store package has been verified.

[Prepared media](media.md), [maintainer-confirmed operation](runtime.md#official-store-components) and [Console-processed DRM evidence](marketplace-drm.md) have distinct scopes.

## Follow-up

- Record later store revisions with version identifiers, uploaded-file hashes, media selections and supplied descriptions when available.
- Preserve separately obtained processed-installer identity and detailed DRM results in the [DRM record](marketplace-drm.md). Completed operation does not need repeating solely for missing metadata.
