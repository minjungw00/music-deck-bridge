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

## Conclusions and remaining cause investigation

| Trace | Host / baseline / mode / pre-install state | Outcome |
| --- | --- | --- |
| [First](update-procmon-2026-10-18.md) | Original host and baseline; mode absent; plugin running | Old-root rename ACCESS DENIED |
| [Second](update-procmon-retry-2026-10-18.md) | Same host after failure; mode 1; official stop with Node already absent | Recursive old-folder removal and installation succeed |
| [Third](update-procmon-direct-2026-10-18.md) | Restarted host; reinstalled baseline; mode 1; plugin running | Old-root rename and installation succeed |
| Fourth | Same host as third; reinstalled baseline again; mode absent; plugin running | Old-root rename and installation succeed |

The requested fresh-baseline mode comparison now has successful enabled and absent-setting observations. Neither developer mode nor official stop is a universal prerequisite, and developer mode's absence alone does not explain the original denial. This does not prove the setting could never influence a different failing state.

The unchanged packages can install through the original rename path in normal mode. The original host/installation-folder state or an intermittent filesystem/handle race remains a hypothesis; no particular process, ACL or filter has been identified as the cause. Do not claim a runtime fix or reinterpret the initial failure as success.

Repeating indistinguishable fresh-baseline installs is not required merely to establish that normal-mode updating can work. For further root-cause work, analyze the existing failed/successful records and, if the failure recurs, capture the failing state's handle identities, effective source/parent permissions and relevant filesystem-filter/stack evidence **before resetting it**. Recreating the original failing state in a disposable, backed-up environment would be stronger evidence than attributing success to a mode toggle. Do not require developer mode or change permissions/security settings without supporting evidence.

Installation, SDK reconnection and exact installed bytes are verified. The earlier maintainer confirmed normal operation with Chrome 1.0.1; no new itemized retention/rollback, Chrome 1.0.2 manual operation or Maker Console DRM result follows from this fourth trace. The fixed v1.0.2 candidate and public/submitted v1.0.1 packages remain unchanged.
