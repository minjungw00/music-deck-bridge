# Browser connection and cold-tab command recovery

Evidence date: October 18, 2026 (Asia/Seoul). Unpublished development cycle **1.0.2-dev**; Chrome numeric version **1.0.2**, Stream Deck numeric version **1.0.2.0** remain fixed. Identify packaged source with its `BUILD-INFO.json`; no release or remote deployment is part of this work.

## Report and inspected installation

The maintainer reported that extension reinstallation left Chrome without credentials while the inspector still said connected until an input was used. That input opened another music window despite an existing player. After fresh PIN pairing, every functional control could open a missing music window but fail with a warning triangle; the opened page already had a song and player bar.

Read-only inspection found the historically labeled unpublished **1.1.1.0** plugin installed, and the **1.1.1** unpacked extension. The installed extension's `background.js` and `content.js` matched the working source before this fix byte-for-byte. This excludes a stale copy of those scripts as the sole explanation. No private token values or browser page contents were printed. The host log records installation and inspector activity, without a command-level exception establishing this report's exact Windows failure.

## Reproduced defects and changes

| Defect | Evidence | Change |
| --- | --- | --- |
| Recent traffic treated as connected after credentials disappeared | Inspector previously trusted a 45-second timestamp; a credential-free popup check did not contact the bridge | Use active authenticated polls and a three-second gap allowance; refresh inspector each second. A missing-token `/status` notice still receives 401, retains stored auth and cannot displace an authenticated browser poll. Without a live poll, it suppresses launching and cancels undelivered input. |
| Native and extension tab creation race | Native fallback passed the music URL regardless of an existing tab in Chrome; no extension reply was required before opening it | With stored auth, native startup wakes Chrome without a URL. The authenticated extension selects or creates the player. |
| Navigation removes an injected receiver | Actual Chromium returned `Could not establish connection. Receiving end does not exist.` between successful injection and message delivery | Retry this definite pre-delivery failure within the existing deadline. Keep ambiguous lost replies non-retryable to avoid duplicate next/rating actions. |
| Browser and per-tab long polls compete for the same HTTP connection pool | Controlled comparison restoring only modern per-tab polling fails on `dislike` in the repeated cold-tab sequence: `bridge-unavailable`, with `legacyPollsStarted: 6`. Suppressing these polls passes the same sequence. | Modern extensions use one browser command channel plus metadata sync. A 404 from older plugins enables legacy per-tab polling. Transient channel failures retry after one second. |
| Warning triangle lacks command diagnostics | Previous result ACK carried only `ok: false`; ordinary console output did not use the SDK file logger | Carry bounded failure codes to the inspector and SDK log, retain auth, distinguish bridge failure from auth rejection, and clear inspector failure after success. |

The connection-pool interpretation is supported by the isolated comparison and Chromium's [normal socket pool default of six connections per group](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/net/socket/client_socket_pool_manager.cc). This identifies reproducible defects consistent with the report; it does not reconstruct every event in the maintainer's Windows session.

## Automated verification

- `npm test`: **89 passed**, including real SDK inspector exchanges, loss-of-credentials detection without a button press, retained auth, protection of a live authenticated poll, expired contact timestamps, native URL suppression, missing-receiver retry, transient reconnect and legacy channel fallback.
- `npm run test:browser`: **1 integration test passed** with actual **Chromium 156.0.8078.4** and Playwright **1.64.1**. It uses the real MV3 worker/content scripts, local storage, authenticated bridge and command ACKs. Eight input types each open a cold tab and complete once: Play/Pause, Previous, Next, Mute, Like, Dislike, Volume delta and Open. Repeated Open/Next reuse the existing tab; forced receiver replacement recovers without duplicating the effect. Modern per-tab HTTP poll count stays zero.
- `npm run check`: passed syntax, JSON, resources, locales, version and basic secret checks.
- Python packaging tests: **2 passed**.
- `npm audit`: **0 vulnerabilities**.

The browser fixture serves local HTML over HTTPS at the mapped music hostname, using an ephemeral certificate and a disposable profile. It models available player controls, not the actual signed-in YouTube Music application. It does not launch Windows Chrome, use the maintainer's browser profile or prove real website selectors/account behavior. Ubuntu CI now runs this browser regression; the modified workflow has not been run remotely as part of this session.

## Remaining manual checks

1. Replace both components with the matching development build. Follow [development replacement](../versioning.md#build-and-test-development-packages): the inspected historical 1.1.1.0 installation has a higher numeric version than the corrected 1.0.2.0 development target. A standard newer-version installer comparison does not cover this downgrade. Back up settings/auth first; do not delete authentication to install a development build.
2. Reload the extension in its permanent unpacked folder. If it has already been removed/reinstalled, pair with a new PIN and match the port. Without pressing any key, verify that losing extension credentials changes the inspector state and does not open another music tab.
3. In the paired Chrome profile, test each key and dial with Chrome running/no music tab, with an existing tab/PWA, and with Chrome fully closed. Confirm one player, original-input completion and absence of a warning triangle. Include repeated close/open cycles and plugin restart while Chrome remains running.
4. If a warning remains, record the inspector's last-command code and the installed plugin's SDK `logs` files, with the exact build ID, Chrome version/profile and input. Confirm actual website rating/volume selectors separately. Do not send PINs or token files.
