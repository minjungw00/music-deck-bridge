# Successful stopped-plugin retry: v1.0.1 → v1.0.2

Evidence inspected October 18, 2026 (Asia/Seoul). **Installation and SDK reconnection succeeded with Stream Deck still running, after the official plugin-stop request. All 45 installed candidate files match the selected package.** The maintainer subsequently confirmed normal operation with plugin 1.0.2 and Chrome extension 1.0.1. Individual action checks, measured pairing/settings retention and rollback remain separate. The earlier [running-plugin update failure](update-procmon-2026-10-18.md) remains a failure.

## Provenance and conditions

| Field | Observed value |
| --- | --- |
| Supplied trace | `music-deck-update-101-to-102-2.PML`, read without modification |
| Format / bytes / events / process records | v9 / 918,886,698 / 2,097,632 / 796 |
| Original SHA-256 | `31937aa1c7e2f586fa92172d792ee95434c15cadc12f0683b0c123bcc9bbb718` |
| Capture interval | October 18, 02:44:49.408299–02:45:39.616040 KST |
| Installer | Same final Windows candidate, source `b35323cdfe6725335444f292b559df8bf5b75f42`, [CI run 39050170510](https://github.com/minjungw00/music-deck-bridge/actions/runs/39050170510) |
| Installer SHA-256 | `716d35e52317a4188941d155e59fc5ba414f8c8984f7a3a541a5106130a057a8` |
| Host | Stream Deck 7.6.0.23012, PID **23212**, the same host as the failed attempt; no host restart during this retry |
| Plugin before retry | Old plugin already stopped after the earlier failure; prior read-only process inspection found zero matching Node processes. The second trace has no matching plugin Node before deployment. |
| Developer mode | PML records absent value → DWORD 1 at 02:44:56.814691 and host reads of 1 during installation. A read-only post-test query confirms the value is absent again, restoring its original state. |
| Installed copy after retry | Manifest **1.0.2.0**, all **45** packaged files match the exact candidate byte-for-byte; new Node PID **54320** running |

The same direct PML reader and ASCII/UTF-16LE matching method as the first inspection decoded 3,443 matching-path records, with no selected-record parsing errors. Process lifecycle and `developer_mode` registry events were inspected separately. Key file operation timestamps/statuses were checked against raw common-event headers. Raw PML, environment/command-line data and unrelated activity remain private and outside Git. This inspection did not start/stop applications, run another installer, delete installed files or change developer mode.

## Measured sequence

Times are KST on October 18. PML indexes are zero-based event-offset indexes. `plugin root` refers to the installed UUID's `.sdPlugin` folder.

| Time | Source / index | Observation |
| --- | --- | --- |
| 02:44:56.814691 | PML 559528 | `reg.exe` sets developer mode to DWORD 1. |
| 02:45:03.669 | Host log | Official `streamdeck://plugins/stop/io.github.minjungw00.musicdeckbridge` request handled. No old plugin termination follows; its process was already absent. |
| 02:45:23.798 | Host log | Same final v1.0.2 installer received, about 20 seconds after the stop request. |
| 02:45:25.672827 | PML 1808481 | Existing root metadata read succeeds; creation/modification timestamps match the old root seen in the failed trace. |
| 02:45:25.672891 | PML 1808485 | First delete-disposition attempt on the nonempty old root returns `NOT EMPTY` (`0xC0000101`); host proceeds to enumerate/remove its contents. |
| 02:45:25.673126 onward | PML 1808495 onward | Host successfully marks the old bundle and other files/directories for deletion. Explorer notification events observe the change; they are not evidence of manual Explorer removal. |
| 02:45:25.680633 | PML 1808821 | Host's delete-disposition operation on the emptied old root succeeds. |
| 02:45:25.680918 | PML 1808828 | Rename/move of the extracted candidate folder from the host's temporary directory succeeds. |
| 02:45:25.690226 | PML 1809080 | New plugin Node PID 54320 starts with the installed plugin root as CWD. |
| 02:45:25.752 | Host log | `[installLocal:finished] (AllOk)` for Music Deck Bridge. |
| 02:45:25.828 | Host log | `Plugin connected`; SDK connection established. |

The installer replaced the old folder itself. The trace does not show a successful old-root → `.sdPlugin.uninstall` rename; that operation was not used in this retry. No ACCESS DENIED or SHARING VIOLATION was decoded among the selected matching-path events. The initial nonempty-directory delete result is followed by successful recursive cleanup and installation, not an overall installation error.

## Maintainer operational confirmation

After this retry, the maintainer reported **“동작은 정상적으로 진행됩니다. chrome 확장 프로그램은 여전히 1.0.1입니다.”** on October 18. Record general normal operation for the measured plugin **1.0.2.0** with extension **1.0.1**. This is an observed mixed-version combination, not a test of Chrome 1.0.2 or a full independent-component compatibility matrix. The report does not individually itemize all seven actions, Play/Pause rendering cases, custom port, unchanged pairing, profiles/settings retention or rollback; do not mark those measurements complete or infer a new pairing/reset.

## Interpretation and remaining checks

- The measured **developer-mode + official-stop + install** procedure succeeded in this environment without quitting the Stream Deck host or manually moving the old plugin folder. Record scenario B's installation/startup as passed, with the conditions above.
- This retry followed the failed scenario A; it was not a separate freshly restored baseline. Process absence, elapsed time, developer mode and the host's handling of the official stop request are not independently varied. Do not attribute success to a specific delay or claim that process termination alone fixes the problem.
- The two traces use different replacement operations: old-root rename denial in A versus host recursive removal and candidate deployment in B. The official stop request may affect the host's loaded-plugin state and installation path, but internal causality is an inference, not established from host source. The original rename denial's responsible component remains unknown.
- This is a measured installation procedure, not a plugin runtime fix or proof that ordinary direct updates now work. Developer mode need not remain enabled after the test; its original absence was verified restored.
- The `no matching or required profiles found` warning follows installer AllOk and concerns importing profiles bundled with a plugin. It does not by itself establish loss or preservation of existing user profiles. Existing PIN pairing, custom port, profiles/title/dial settings, all seven actions and the new Play/Pause rendering still need explicit operation/retention checks. Rollback and a fully exited-host comparison remain separate, unperformed scenarios.
- Preserve the exact candidate and both traces for release notes. Do not overwrite public/submitted v1.0.1 packages or label the update conflict resolved. Actual Maker Console DRM remains untested.
