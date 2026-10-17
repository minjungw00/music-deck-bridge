# Failed v1.0.1 → v1.0.2 update: Process Monitor evidence

Evidence inspected October 18, 2026 (Asia/Seoul). **Direct update failed; the old plugin and console processes exited and the source directory's DELETE-access open succeeded before the rename was denied. The component responsible for that denial is not yet established.** No runtime fix follows from this trace alone.

## Source and method

The maintainer supplied `music-deck-update-101-to-102.PML` under the Windows Downloads/ProcessMonitor directory. The original file was read without modification. Raw PML, process command lines/environments, machine identifiers and unrelated activity are not committed.

| Field | Observed value |
| --- | --- |
| PML format / size | v9 / 2,007,049,660 bytes |
| Original SHA-256 | `9ba87ee5b0c3f0a1eac8d74e074743c656f31c24b144c4f9325c097cf380baaf` |
| Capture interval | October 18, 02:27:32.303831–02:28:40.087560 KST |
| Event/process inventory | 4,459,640 events / 858 process records |
| Windows version in PML header | 10.0.26300.2 |
| Stream Deck | 7.6.0.23012; PID 23212 |
| Attempted installer | Plugin `1.0.2.0`, source `b35323cdfe6725335444f292b559df8bf5b75f42`, Windows [CI run 39050170510](https://github.com/minjungw00/music-deck-bridge/actions/runs/39050170510) |
| Installer SHA-256 | `716d35e52317a4188941d155e59fc5ba414f8c8984f7a3a541a5106130a057a8` |
| Installed plugin after failure | `1.0.1.0`; all 43 public v1.0.1 packaged files still match byte-for-byte |

The installer hash matches the exact Windows candidate selected before this test. Its adjacent BUILD-INFO identifies version 1.0.2, the source/ref and CI run above. Host logs record that same Downloads installer path and the failed attempt.

The PML was read directly in WSL using [procmon-parser](https://github.com/eronnen/procmon-parser) 0.4.0, installed only under `/tmp`, without starting Process Monitor or capturing new Windows activity. ASCII and UTF-16LE UUID occurrences in the event area were mapped to PML event offsets; 2,577 matching-path events were decoded, including 525 for the installed plugin tree. Relevant process start/exit events were read separately from the full event-offset inventory. No selected-record parsing errors occurred. Raw common-event fields independently corroborated the key process/file operation IDs, timestamps and NTSTATUS values. The parser does not decode rename-specific details; the destination is corroborated by the host log and the raw rename record's target string. No native Process Monitor CSV export or symbol-server resolution was performed.

## Timeline

All times are KST on October 18. `plugin root` means `%APPDATA%\Elgato\StreamDeck\Plugins\io.github.minjungw00.musicdeckbridge.sdPlugin`. PML record indexes below are zero-based indexes into the saved event-offset array, not filtered display row numbers.

| Time | Source / record index | Observation |
| --- | --- | --- |
| 02:27:49.347664 | PML 1507976 | Plugin `node.exe` PID 40440 starts with the plugin root as its current directory. |
| 02:27:49.363172 | PML 1509503 | Node opens the root with Execute/Traverse + Synchronize and sharing Read/Write, without Delete sharing. |
| 02:28:09.281 | Stream Deck log | Host receives the final v1.0.2 candidate installer. |
| 02:28:11.031 | Stream Deck log | `Aborting with reason 'Update plugin'`. |
| 02:28:11.340891 | PML 3893013 | Node PID 40440 emits `Process Exit`. |
| 02:28:11.340977 / .340985 | PML 3893018 / 3893019 | Node's plugin-root `CloseFile` and final `IRP_MJ_CLOSE` both succeed. |
| 02:28:11.343087 | PML 3893118 | Its child `Conhost.exe` PID 51212 exits. |
| 02:28:11.348 | Stream Deck log | Host records `Process stopped (killed)` and `Plugin finished`. |
| 02:28:11.348719 | PML matching-path event | Opening the `.sdPlugin.uninstall` target returns `NAME NOT FOUND`. |
| 02:28:11.348773 | PML 3893540 | Host opens the source root with Read Attributes + Delete + Synchronize; sharing Read/Write/Delete; **SUCCESS**. |
| 02:28:11.348980 | PML 3893561 | Host `SetRenameInformationFile` on the source root returns **ACCESS DENIED**, NTSTATUS `0xC0000022`, duration 0.4001 ms. |
| 02:28:11.349424 / .349431 | PML 3893585 / 3893586 | Host closes its rename-related root file object successfully. |
| 02:28:11.350 | Stream Deck log | Rename to `.sdPlugin.uninstall` failed with `Access is denied`; installer reports `InstallError`. |

The observed Node root close precedes the rename by about 8 ms; the child console exit precedes it by about 6 ms. This is a measured failure after process termination, rather than an installer dialog shown while the old runtime remains running.

## Findings and limits

- This reproduces scenario A with a known version pair and exact installer hash. It does **not** establish update success, authentication/settings retention, recovery or rollback.
- A simple explanation that the old Node process remained running and retained its observed root handle does not fit this trace: its exit and both close operations are recorded before the host's successful DELETE-access open. The stopped-host sharing probe from October 17 and this actual installer result must remain distinct.
- The target was absent immediately before the rename. The current `.sdPlugin.uninstall` sibling is also absent; a leftover destination directory is not demonstrated here.
- No `SHARING VIOLATION` was decoded for the installed tree in the selected events. Successful CreateFile/CloseFile counts balance for those recorded paths before the failure except for the host's own rename-related open. This is a coarse event balance, **not** a complete handle-identity inventory or proof that every kernel/file reference was released.
- The failed rename stack resolves by captured module address ranges to Windows FLTMGR/ntoskrnl/ntdll/KernelBase, StreamDeck.exe and Qt libraries. Filter Manager's presence alone does not identify the denying component. Defender accessed some plugin files earlier; those accesses alone do not establish that it blocked this rename. ACLs, a filesystem filter or a host/API issue cannot be selected as the cause from this record alone.
- The updated runtime cannot start before replacement of the old plugin directory. A new toggle/icon build cannot be assumed to repair this pre-start installation failure. No CWD workaround, permission change, security exclusion or forced handle closure was applied during this inspection.

## Next controlled comparison

Preserve this failed result and compare the **same checksum-verified candidate** after fully unloading the old plugin. Capture before invoking the installer and verify process absence, the installed manifest, original pairing/custom port/profiles and action operation. Test a fully exited host separately: opening the package may launch the old runtime before installation. Folder removal/reinstallation remains a separate recovery scenario, followed by measured retention/rollback.

If a verified-unloaded attempt still reaches the same failed rename despite a successful DELETE-access open, focus subsequent diagnostics on the rename operation's effective permissions, filesystem filters and host/API behavior. The existing full PML remains available for further analysis; another ordinary host log alone will not explain the denial. Do not declare a plugin code defect or fixed update until the comparison supports it.
