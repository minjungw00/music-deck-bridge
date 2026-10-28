# Store submissions

Last updated: October 29, 2026 (Asia/Seoul). **Both stores are published and normal operation is maintainer-confirmed as reported on October 24.** During the October 24 update, store dashboards, page contents/displayed versions and runtime operation were not independently inspected; neither supplied listing could be opened by the browsing tool. The later public-description inspection below has a separate scope.

## Current listings

| Store | Last reported submission | Public listing and ID |
| --- | --- | --- |
| Elgato Marketplace | 1.1.2 / plugin 1.1.2.0 | [Music Deck Bridge](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd) · `044e81d9-9671-4277-bcb9-ce8b6d38c3fd` |
| Chrome Web Store | 1.1.2 | [Music Deck Bridge](https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca) · `ldipcjgadbppphalmibkofhigjffnlca` |

The October 24 report confirms normal operation of the published store components without an itemized installation/migration or control inventory. See [runtime confirmation](runtime.md#official-store-components).

GitHub [v1.1.3](releases.md#v113) was published October 29. No 1.1.3 store submission or approval was performed or reported; the listing and submitted-description evidence below remains scoped to the earlier store versions.

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

The maintainer reported that an October 28, 2026 inspection of the [public Elgato listing](https://marketplace.elgato.com/product/music-deck-bridge-044e81d9-9671-4277-bcb9-ce8b6d38c3fd) showed **1.1.2** and a Chrome Web Store link, but its How to Use still described the extension as awaiting publication and used the Chrome Web Store address as a ZIP download location. An independent browser read on October 29 found the same displayed version and installation wording. This establishes an inconsistency in the public Elgato description; it does not establish the current Chrome Web Store description or Maker Console contents, neither of which was inspected.

The [proposed English How to Use replacement](../../store-assets/elgato/how-to-use.en.md) separates Add to Chrome installation from optional GitHub Releases ZIP installation, following the [English installation guide](../installation.en.md). The October 29 documentation revision shortens the draft to fit the [description limit](https://docs.elgato.com/guidelines/products/#description) with the retained prefix, preserving the same-PC notice, feature description, six-digit PIN's ten-minute validity and compatibility requirements. The old v1.1.1 prefix with its companion URL updated plus this replacement totals 1,460 characters; the actual complete Console text must still be counted when applying. The draft has not been submitted or published. Actual submitted snapshots remain unchanged; no new installation/runtime result is implied.

The same review re-read the public Elgato page as 1.1.2 with the contradictory unpublished-extension/ZIP instruction still present. Chrome Web Store could not be opened by the tool, so its current description/version was not reverified. The [Chrome listing guide](https://developer.chrome.com/docs/webstore/cws-dashboard-listing#graphic_assets) identifies the small promotional tile as optional; the local upload guide now reflects that, while preserving all prepared images. This is documentation/reference verification, not store approval or a new submission.

## Package and media provenance

[Public v1.1.2](releases.md#v112) and [v1.1.1](releases.md#v111) records retain source, CI and GitHub package hashes. Exact uploaded-file hashes, store version identifiers, selected media and publication settings were not supplied. Equality with public packages or local exports is not independently established.

[Prepared media](media.md), [maintainer-confirmed operation](runtime.md#official-store-components) and [Console-processed DRM evidence](marketplace-drm.md) have distinct scopes.

## Follow-up

- Record later store revisions with version identifiers, uploaded-file hashes, media selections and supplied descriptions when available.
- Preserve separately obtained processed-installer identity and detailed DRM results in the [DRM record](marketplace-drm.md). Completed operation does not need repeating solely for missing metadata.
- README and both installation guides link to both stores. When revising live listings, replace temporary companion-download instructions with those public links and preserve the historical submitted snapshots.
