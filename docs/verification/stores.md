# Store submissions

Last updated: October 20, 2026 (Asia/Seoul). The maintainer reports that **Chrome Web Store publication is complete** and confirms that the store extension works with the released Stream Deck plugin. **Elgato Marketplace remains Pending review.** These are maintainer-confirmed results; store dashboards and runtime operation were not independently inspected.

| Store | Last reported submitted version | Current state |
| --- | --- | --- |
| Elgato Marketplace | 1.1.2 / plugin 1.1.2.0 | Pending review |
| Chrome Web Store | 1.1.2 | Published; [public listing](https://chromewebstore.google.com/detail/ldipcjgadbppphalmibkofhigjffnlca) |

Chrome extension ID: `ldipcjgadbppphalmibkofhigjffnlca`. The supplied listing could not be opened by the browsing tool during this update, so public page contents and the displayed version were not independently verified. The report confirms store-extension/released-plugin operation; it does not separately identify an unpacked-to-store migration test or a Marketplace-installed plugin. See [runtime confirmation](runtime.md#chrome-web-store-extension).

## Submitted description history

On October 18, both stores were first reported as registered at v1.1.1, Pending review, then updated to v1.1.2, Pending review, after the maintainer confirmed released-version operation. The October 20 report above updates Chrome publication and operation; no approval outcome for the earlier revision was reported.

| Store | Recorded description revision | Actual submitted text supplied by the maintainer |
| --- | --- | --- |
| Elgato Marketplace | 1.1.1 | [English](../../store-assets/submitted/v1.1.1/elgato-en.md) |
| Chrome Web Store | 1.1.1 | [English](../../store-assets/submitted/v1.1.1/chrome-en.md) · [Korean](../../store-assets/submitted/v1.1.1/chrome-ko.md) |

These three snapshots preserve the supplied text verbatim, including temporary GitHub companion-download links and Elgato spacing. Revised 1.1.2 descriptions were not supplied; the 1.1.1 snapshots are historical evidence, not confirmation of the current submitted copy. Record later supplied revisions separately rather than rewriting them.

## Package and media provenance

The [public v1.1.2 reference](releases.md#v112) records source, CI and package hashes; the [v1.1.1 reference](releases.md#v111) retains the preceding release's identities. The Chrome product URL and extension ID are recorded above. Exact uploaded-file hashes, store version identifiers, the Marketplace product ID, uploaded media selections and publication settings have not been supplied; equality with the public packages/local exports is not independently established. [Prepared media](media.md), [maintainer-confirmed operation](runtime.md#112-refactor) and [Console-processed DRM execution](marketplace-drm.md) have distinct verification scopes.

## Follow-up

1. Track the Marketplace review and any later store revisions; retain version identifiers, uploaded-file hashes and media selections when available.
2. Obtain and test the Marketplace version's Console-processed installer using the [DRM record](marketplace-drm.md).
3. Chrome store-extension/released-plugin operation is maintainer-confirmed. Unpacked-to-store migration/new PIN pairing remains separately unconfirmed. After Marketplace publication, record its public URL, installation and operation of the store-installed pair.
4. README and both installation guides now link to Chrome Web Store. Add the Marketplace link when public and installation is confirmed, and revise live listings' temporary companion-download instructions accordingly. Preserve the submitted snapshots above.
