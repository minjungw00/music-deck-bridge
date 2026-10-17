# Successful normal-mode running-plugin update

Evidence inspected October 18, 2026 (Asia/Seoul). **The fourth trace records a successful direct v1.0.1 → v1.0.2 installation with the old plugin running and the developer-mode setting absent. Both old-root rename and candidate deployment succeed.** Developer mode and an official pre-install stop are therefore not universal requirements. This does not establish the component or transient state that caused the first rename denial.

## Provenance and control conditions

| Field | Observed value |
| --- | --- |
| Supplied trace | `music-deck-update-101-to-102-4.PML`, read without modification |
| Format / bytes / events / process records | v9 / 523,606,541 / 1,219,121 / 682 |
| Original SHA-256 | `a2c9db323e6596178f3595bded91cccfa91dcabc78b2903ac4a11c60b77f6844` |
| Capture interval | October 18, 03:07:02.056109–03:07:26.311257 KST |
| Host | Stream Deck 7.6.0.23012, PID **57560**, unchanged from the third successful attempt |
| Baseline preparation before capture | Host log records uninstall AllOk at 03:06:35.778, installation from the same public v1.0.1 Downloads path AllOk at 03:06:43.788 and SDK connection at 03:06:43.854 |
| Baseline installer currently at that path | Public v1.0.1.0, SHA-256 `ccaaf7233637ff5cf32f978e39145188b52f437fc1d5efdf22db60008bf1b49e` |
| Candidate | Unchanged Windows v1.0.2.0 from source `b35323cdfe6725335444f292b559df8bf5b75f42`, [CI run 39050170510](https://github.com/minjungw00/music-deck-bridge/actions/runs/39050170510) |
| Candidate SHA-256 | `716d35e52317a4188941d155e59fc5ba414f8c8984f7a3a541a5106130a057a8` |
| Post-update installed copy | **1.0.2.0**, all **45** candidate package files match byte-for-byte; `.sdPlugin.uninstall` sibling absent at inspection |

The same direct PML method decoded 2,734 UUID-matching path records without selected-record parsing errors. Registry and process events were inspected separately. Raw common-event fields and the exact old-root rename record corroborate timestamps, successful status and `.sdPlugin.uninstall` destination. Raw PML, command lines/environments and unrelated activity remain outside Git; the inspection changed no Windows application state. Baseline reinstall is corroborated by host logs and the observed public archive; no complete before-update installed-file/private-state inventory was collected.

## Measured sequence

All times are KST on October 18. PML indexes are zero-based event-offset indexes.

| Time | Source / index | Observation |
| --- | --- | --- |
| 03:06:43.749232 | PML process table | Old plugin Node PID **61380** starts after baseline reinstall and stays running until update. |
| 03:07:16.395 | Host log | Final v1.0.2 installer received; no official `plugins/stop` request in this host session. |
| 03:07:17.681 | Host log | `Aborting with reason 'Update plugin'`. |
| 03:07:17.981656 | PML 1038517 | Old Node emits Process Exit. |
| 03:07:17.981761 / .981799 | PML 1038522 / 1038523 | Old Node root CloseFile / final IRP_MJ_CLOSE succeed. |
| 03:07:17.990271 | PML 1039065 | Old-root `SetRenameInformationFile` to `.sdPlugin.uninstall` **SUCCESS**, duration 0.6241 ms. |
| 03:07:18.003046 | PML 1040307 | Extracted candidate folder rename/move **SUCCESS**. |
| 03:07:18.008568 / .008739 / .009787 | PML 1040787 / 1040819 / 1040905 | Host's `developer_mode` queries return **NAME NOT FOUND**; no setting writes were found in this trace. |
| 03:07:18.013798 | PML 1041149 | New Node PID **20808** starts. |
| 03:07:18.084 | Host log | Installer `[installLocal:finished] (AllOk)`. |
| 03:07:18.157303 / .159 | PML 1054222 / host log | Developer-mode query again NAME NOT FOUND / SDK plugin connected. |

The root CloseFile → rename interval is **8.5096 ms**, versus 8.4482 ms for the third successful attempt and 8.0029 ms for the first failed attempt. No ACCESS DENIED or SHARING VIOLATION was decoded among the selected matching-path events. A long manual wait or official stop was not needed for this successful normal-mode update; fine-grained timing races are not ruled out.

## Fifth trace: complete installation sequence

The maintainer explicitly reported deleting the plugin, then installing 1.0.1 and 1.0.2 in sequence. Unlike the fourth trace, the supplied `music-deck-update-101-to-102-5.PML` **captures all three stages**, corroborated by the same host log and public/candidate installer paths.

| Field | Observed value |
| --- | --- |
| Format / bytes / events / process records | v9 / 526,987,726 / 1,097,322 / 742 |
| Original SHA-256 | `2731cfa77c4144ad11da62030009d2cf28a434456e27cb5fa01f07c6a114c081` |
| Capture interval | October 18, 03:12:44.538805–03:13:22.176954 KST |
| Host | Same running Stream Deck PID 57560; no host restart during this sequence |
| Mode | Host `developer_mode` queries return NAME NOT FOUND during both baseline and candidate installation; no setting writes found in this trace |
| Packages / installed result | Same checksum-verified public 1.0.1 and fixed 1.0.2 candidate identified above; final manifest 1.0.2.0 and all 45 candidate files match |

The same reader decoded 3,656 matching-path records without selected-record parsing errors, with process/registry events inspected separately. The original file remained unchanged; raw/private data remains outside Git. No ACCESS DENIED or SHARING VIOLATION was decoded among selected matching-path events.

| Time (KST) | Source / zero-based PML index | Observed stage |
| --- | --- | --- |
| 03:12:49.997295 | PML 81528 | Existing Node PID 20808 exits for the explicit uninstall. |
| 03:12:50.005928 / .072 | PML 81907 / host log | Old-root rename succeeds; explicit uninstall finishes AllOk. |
| 03:12:55.130 | Host log | Public v1.0.1 installer requested. |
| 03:12:56.407733 | PML 492397 | Extracted baseline folder deployment succeeds. |
| 03:12:56.418444 | PML 493149 | Baseline plugin Node PID **6204** starts. |
| 03:12:56.491 / .563 | Host log | Baseline installation AllOk / SDK connected. |
| 03:13:02.945 | Host log | Same final v1.0.2 installer requested while baseline Node remains running. |
| 03:13:04.229 | Host log | `Aborting with reason 'Update plugin'`; no second explicit uninstall or official stop precedes this update. |
| 03:13:04.545679 | PML 849215 | Baseline Node PID 6204 exits. |
| 03:13:04.555556 | PML 850483 | Existing baseline root rename to `.sdPlugin.uninstall` succeeds. |
| 03:13:04.567618 | PML 851681 | Extracted 1.0.2 candidate deployment succeeds. |
| 03:13:04.577869 | PML 852845 | New candidate Node PID **15496** starts. |
| 03:13:04.641 / .709 | Host log | Candidate installation AllOk / SDK connected. |

This records **two distinct successful operations after the initial uninstall**: installation of the 1.0.1 baseline, then a real running-plugin 1.0.1 → 1.0.2 update. It is not merely an empty-folder 1.0.2 installation. It repeats the normal-mode result, while still leaving the original failing host/folder state unexplained. The initial uninstall is not a backup rollback or proof of private-state/profile retention; those remain separately scoped checks.

## Conclusions and remaining cause investigation

| Trace | Host / baseline / mode / pre-install state | Outcome |
| --- | --- | --- |
| [First](update-procmon-2026-10-18.md) | Original host and baseline; mode absent; plugin running | Old-root rename ACCESS DENIED |
| [Second](update-procmon-retry-2026-10-18.md) | Same host after failure; mode 1; official stop with Node already absent | Recursive old-folder removal and installation succeed |
| [Third](update-procmon-direct-2026-10-18.md) | Restarted host; reinstalled baseline; mode 1; plugin running | Old-root rename and installation succeed |
| Fourth | Same host as third; reinstalled baseline again; mode absent; plugin running | Old-root rename and installation succeed |
| Fifth | Same host; full initial uninstall and sequential 1.0.1/1.0.2 installation captured; mode absent | Initial uninstall, baseline installation and actual running-plugin update all succeed |

The requested fresh-baseline mode comparison now has successful enabled and absent-setting observations. Neither developer mode nor official stop is a universal prerequisite, and developer mode's absence alone does not explain the original denial. This does not prove the setting could never influence a different failing state.

The unchanged packages can install through the original rename path in normal mode. The original host/installation-folder state or an intermittent filesystem/handle race remains a hypothesis; no particular process, ACL or filter has been identified as the cause. Do not claim a runtime fix or reinterpret the initial failure as success.

Repeating indistinguishable fresh-baseline installs is not required merely to establish that normal-mode updating can work. For further root-cause work, analyze the existing failed/successful records and, if the failure recurs, capture the failing state's handle identities, effective source/parent permissions and relevant filesystem-filter/stack evidence **before resetting it**. Recreating the original failing state in a disposable, backed-up environment would be stronger evidence than attributing success to a mode toggle. Do not require developer mode or change permissions/security settings without supporting evidence.

Installation, SDK reconnection and exact installed bytes are verified. The earlier maintainer confirmed normal operation with Chrome 1.0.1; no new itemized retention/rollback, Chrome 1.0.2 manual operation or Maker Console DRM result follows from this fourth trace. The fixed v1.0.2 candidate and public/submitted v1.0.1 packages remain unchanged.
