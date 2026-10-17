# Successful running-plugin update with developer mode enabled

Evidence inspected October 18, 2026 (Asia/Seoul). **The third trace records a successful running-plugin update, including the old-root → `.sdPlugin.uninstall` rename that failed in the first trace. No official plugin-stop request preceded this update in the new host session.** Developer mode was enabled; the host and baseline installation had also changed, so developer mode is not isolated as the cause.

Subsequent [normal-mode control at 03:07](update-procmon-normal-2026-10-18.md): a fresh-baseline running-plugin update also succeeds with the developer-mode setting absent, using the same host. The proposed mode comparison below has now been performed; developer mode is not a universal installation prerequisite, and the original denial's cause remains unconfirmed.

## Provenance and changed conditions

| Field | Observed value |
| --- | --- |
| Supplied PML | `music-deck-update-101-to-102-3.PML`, read without modification |
| Format / bytes / events / process records | v9 / 672,933,853 / 1,597,153 / 741 |
| Original SHA-256 | `d3f78f6c4b24ac3cbeb75916f6f70612a8c04f4751ad5690686561012488513b` |
| Capture interval | October 18, 02:57:36.463209–02:58:14.752184 KST |
| Host | Stream Deck 7.6.0.23012, PID **57560**, started at 02:56:49; different from the earlier host PID 23212 |
| Baseline preparation before capture | Host log records explicit plugin uninstall AllOk at 02:57:04.327, installation from the Downloads baseline path AllOk at 02:57:08.479 and SDK connection at 02:57:08.529 |
| Baseline installer at that path when inspected | Public v1.0.1.0; SHA-256 `ccaaf7233637ff5cf32f978e39145188b52f437fc1d5efdf22db60008bf1b49e` |
| Candidate installer | Unchanged final Windows v1.0.2.0, source `b35323cdfe6725335444f292b559df8bf5b75f42`, [CI run 39050170510](https://github.com/minjungw00/music-deck-bridge/actions/runs/39050170510) |
| Candidate SHA-256 | `716d35e52317a4188941d155e59fc5ba414f8c8984f7a3a541a5106130a057a8` |
| Post-update installed copy | **1.0.2.0**, all **45** candidate package files match byte-for-byte |

The baseline uninstall/reinstall occurred before the PML capture. Its host-log installer path and the currently observed baseline archive corroborate preparation; no complete before-update installed-file/private-state inventory was collected in this inspection. Do not treat this as a measured backup rollback or assume retained settings from the explicit uninstall.

The same direct PML method decoded 2,794 UUID-matching path records without selected-record parsing errors. Process lifecycle and developer-mode registry events were inspected separately. Raw event headers corroborated key statuses/timestamps, and the old-root rename record contains the `.sdPlugin.uninstall` destination string. Raw PML and unrelated/private process data remain outside Git. This inspection changed no Windows application state.

## Measured sequence

All times are KST on October 18; PML indexes are zero-based event-offset indexes.

| Time | Source / index | Observation |
| --- | --- | --- |
| 02:57:08.440014 | PML process table | Old plugin Node PID **33744** starts and remains running until the installer stops it. |
| 02:57:46.278183 | PML 631405 | `reg.exe` changes absent `developer_mode` to DWORD **1**. |
| 02:58:05.815 | Host log | Same v1.0.2 candidate installation requested; no `plugins/stop` request in this host log. |
| 02:58:07.245 | Host log | `Aborting with reason 'Update plugin'`. |
| 02:58:07.559948 | PML 1443610 | Old plugin Node emits `Process Exit`. |
| 02:58:07.560019 / .560048 | PML 1443615 / 1443616 | Old Node root CloseFile and final IRP_MJ_CLOSE succeed. |
| 02:58:07.568246 | PML 1444311 | Host root open with Delete access and Read/Write/Delete sharing succeeds. |
| 02:58:07.568467 | PML 1444332 | Old-root `SetRenameInformationFile` to `.sdPlugin.uninstall` **succeeds**; duration 0.4573 ms. |
| 02:58:07.580053 | PML 1444771 | Rename/move of the extracted candidate folder succeeds. |
| 02:58:07.585578 | PML 1444946 | Host reads developer mode as DWORD 1 during deployment/startup. |
| 02:58:07.589826 | PML 1445150 | New plugin Node PID **59624** starts. |
| 02:58:07.651 / .726 | Host log | Installer AllOk / plugin SDK connected. |

No ACCESS DENIED or SHARING VIOLATION was decoded among the selected matching-path events. Root CloseFile → rename was **8.4482 ms**, compared with **8.0029 ms** in the first failed trace. This success did not require a long manual wait after stopping the old plugin.

## Comparison and implications

| Trace | Starting conditions | Replacement operation / outcome |
| --- | --- | --- |
| [First](update-procmon-2026-10-18.md), 02:28 | Developer-mode queries report missing value; old installed baseline; host PID 23212; plugin running | Old-root rename ACCESS DENIED; no update |
| [Second](update-procmon-retry-2026-10-18.md), 02:45 | Same host/baseline after failed update; Node already absent; developer mode enabled and official stop requested | Host recursively removes old root and deploys candidate; success |
| Third, 02:58 | New host PID 57560; explicit uninstall/reinstall baseline; developer mode enabled; plugin running; no official stop | Old-root rename and candidate deployment both succeed |

The first PML's developer-mode queries were checked separately and return NAME NOT FOUND, including the host query at 02:27:57.163486. This corroborates the absent-setting condition rather than inferring it only from a later registry snapshot.

- Official stop is **not shown to be universally necessary**: this attempt succeeds while the old plugin is running and the installer performs the stop. The earlier stopped-plugin procedure remains one measured successful procedure.
- The original rename operation is capable of succeeding with the unchanged runtime/packages. Neither a permanently broken package structure nor an unavoidable Node CWD lock explains all three results.
- Developer mode is a candidate factor, but host restart, baseline folder recreation and possible resulting handle/permission state also differ from the first attempt. Do not identify developer mode as the confirmed root cause or recommend it as a permanent installation requirement.
- The most useful next control is the **same fresh baseline procedure and running-plugin update with developer mode absent**, using the same candidate, host version and matching capture. Repeat under enabled mode if needed. Neither that mode-only comparison nor time-matched failed-state retry controls are complete yet.
- Successful install/SDK connection and exact installed bytes are confirmed. No new itemized playback, pairing/settings retention, Chrome 1.0.2 or DRM result is established by this trace; retain the earlier maintainer operation report with its original scope.
