# Installation investigation

Evidence collected October 17–18, 2026 (Asia/Seoul). A reproduced update failure was traced to an Explorer handle on a descendant folder; closing that folder allowed the same installer to succeed. **No installer code fix is claimed.** Recovery instructions belong in the [installation guide](../installation.en.md#replacing-plugin-files) and [troubleshooting guide](../troubleshooting.md).

## Evidence summary

The inspected environment used Windows 11 Education 10.0.26300 and Stream Deck 7.6.0.23012. Failures occurred when Stream Deck renamed the installed `.sdPlugin` root to `.sdPlugin.uninstall`, after stopping the old Node runtime. A stopped bridge's `Failed to fetch` was a consequence of the rejected update, not evidence of a Chrome-version incompatibility.

| Time (KST) | Observation |
| --- | --- |
| Oct 17, 16:58–17:05 | Four host-log rename/access-denied failures after runtime exit. The exact failed-attempt installer bytes and lock owner were not captured. A later 17:15 AllOk/SDK reconnect confirmed installation success. |
| Oct 18, 02:28 | v1.0.1 → v1.0.2 development candidate: root rename denied after Node exit; DELETE-access open succeeded. Owner still unidentified. |
| 02:45 | Same candidate/host succeeded after official plugin stop in developer mode, using recursive old-folder removal instead of root rename. |
| 02:58 and 03:07 | Fresh-baseline, running-plugin updates succeeded in developer mode and normal mode respectively. Neither developer mode nor manual plugin stop is universally necessary. |
| 03:12–03:13 | Explicit uninstall → public v1.0.1 install → running-plugin candidate update succeeded in normal mode; all 45 installed files matched. |
| 15:00–15:01 | Development v1.0.2 → public v1.1.0: five root-rename denials, including with Node absent and after host restart. Destination absent; DELETE-access opens succeeded. |
| 15:04:52 | Live inspection found Explorer PID 11800 holding two handles to the installed `imgs\plugin` directory, with an Explorer window open there. |
| 15:06:48 → 15:06:56 | User closed only that Explorer folder. Both handles closed; the same host PID 12736 then renamed the root successfully using the same installer, without host exit or plugin deletion. |

## Decisive comparison

The two user-provided captures were inspected with `procmon-parser` 0.4.0 and raw status/destination checks, alongside read-only live handle inspection. They were read from the Windows `Downloads/ProcessMonitor` directory:

| PML | Bytes | SHA-256 |
| --- | --- | --- |
| `music-deck-update-102-to-110-1.PML` | 2043783281 | `a769bd399c39d1131d2fe382ffed25150875b97815f323ecccace34b0341b1da` |
| `music-deck-update-102-to-110-2.PML` | 494063284 | `50f3a3a125b6762dda5d3deca3407c433ac72741dbe2222f7742a77472f8b315` |

In the retry, Explorer handle-close events occurred at **15:06:48.299150/.299344**, followed by successful root rename at **15:06:56.851602**, new Node startup, AllOk and SDK connection. All 62 installed files matched the public v1.1.0 package. A later read-only probe's sharing violation occurred after the new runtime started and was not an installer failure.

The earlier public v1.0.0/v1.0.1 package comparison found identical paths and runtime/inspector/locale bytes; only version manifests and brand PNGs changed. Both checksum inventories passed. This provides no evidence of a newly introduced runtime regression.

## Conclusion and limits

Explorer's descendant-folder handles are a supported cause of the final recurrence, with a measured close-folder recovery. Protected processes were not exhaustively inspectable. The evidence does not identify every earlier denial's owner or establish how frequently other installations fail. Successful fresh-baseline updates show the failure is conditional; they do not erase the failed cases.

Pairing/settings retention and rollback were separately [confirmed by the maintainer](runtime.md#maintainer-confirmation). Maker Console DRM and store-install migration remain separate. Detailed intermediate traces and the former redacted host-log excerpt are retained in Git history; raw PMLs and private state are not committed.
