# Popup button layout

Verified October 18, 2026 (Asia/Seoul), development cycle **1.1.1-dev**.

The 290px popup previously allowed the English “Check status” label to wrap. Flex alignment then stretched its neighboring buttons to the two-line height. The status label is now “Status”; buttons inherit the popup's 13px font, use a 20px line height, 36px minimum height and no wrapping. The three connection controls divide the available row equally. Korean labels remain unchanged.

## Verification

A one-off Playwright/Chromium fixture loaded the actual popup HTML/JavaScript with English and Korean message catalogs and simulated connected-state responses. Windows Segoe UI and Malgun Gothic font files were supplied to the temporary Linux browser for font coverage, without adding fonts to the extension. Both previews were visually inspected. They are layout fixtures, not new screenshots of live Chrome/YouTube Music operation.

| Measurement, CSS pixels | English | Korean |
| --- | --- | --- |
| Popup width / document scroll width | 290 / 290 | 290 / 290 |
| Each connection-control button | 80 × 36 | 80 × 36 |
| Apply button height | 36 | 36 |
| Button font size | 13 | 13 |
| Wrapped or clipped button labels | None | None |

Existing version-policy and extension-localization tests pass, including input validation and pairing/status handlers. Repository syntax, manifest resources, locales, version synchronization and basic secret checks pass. No runtime/protocol behavior changed.

## Heading icon

The popup now displays the bundled `icons/128.png` main icon at **28 × 28 CSS pixels**, to the left of the heading with an **8px** gap. The image has empty alternative text because the adjacent heading supplies the product name. The same English/Korean Chromium fixture verifies successful image loading, vertical centering and a single-line heading, while retaining the button measurements above and no horizontal overflow. Both updated previews were visually inspected; extension-localization and repository checks pass.

Root/lockfile version is **1.1.1-dev**; Chrome numeric version **1.1.1**, display version **1.1.1-dev**; Stream Deck numeric version **1.1.1.0**. The public v1.1.0 release remains fixed. Development packages use commit/build metadata under the existing [versioning policy](../versioning.md).
