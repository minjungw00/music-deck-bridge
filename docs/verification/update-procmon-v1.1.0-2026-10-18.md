# v1.1.0 installation failure and Explorer-handle recovery

Evidence inspected October 18, 2026 (Asia/Seoul). **The old-folder rename denial recurred when updating the installed 1.0.2 development build to public v1.1.0. Live inspection found Explorer holding two handles to the installed `imgs\plugin` directory. The requested close-folder retry records both handles closing, followed by successful installation through the previously failing root rename in the same Stream Deck process.** This strongly supports the open Explorer directory as the immediate blocker in this recurrence. It does not retroactively diagnose every historical failure or establish population frequency.

## Provenance

The supplied PML files were read directly and left unchanged. Analysis used `procmon-parser` 0.4.0, selected UUID-matching path events, separate process/registry records and raw common-event status/destination checks. Raw captures, environments, command lines, unrelated activity and private state remain outside Git. Read-only Windows handle/permission readers did not alter application state; the maintainer performed the installation retry.

| Field | Failed capture | Close-folder retry |
| --- | --- | --- |
| File | `music-deck-update-102-to-110-1.PML` | `music-deck-update-102-to-110-2.PML` |
| Format / bytes | v9 / 2,043,783,281 | v9 / 494,063,284 |
| Events / process records | 4,518,679 / 920 | 1,136,708 / 648 |
| SHA-256 | `a769bd399c39d1131d2fe382ffed25150875b97815f323ecccace34b0341b1da` | `50f3a3a125b6762dda5d3deca3407c433ac72741dbe2222f7742a77472f8b315` |
| Capture interval, KST | 15:00:21.961867–15:01:40.837358 | 15:06:44.689072–15:07:04.210361 |
| Decoded matching-path records | 10,553 | 3,779 |
| Host | Stream Deck 7.6.0.23012, PID 57560 then 12736 | Same PID 12736 |

The installer is public **1.1.0.0** from release source `7eb20a58b22df782af6cd80a360c27cde5100264`, 483,367 bytes, SHA-256 **`ae96cb8a48d6b06baf8a58ba8c822cf4cafea6862249b5e1e7805de8e709ba88`**. Its Downloads copy matches the [published package](v1.1.0.md); the package was not rebuilt or changed for the retry.

Host logs show the baseline was installed at 14:31 from development build `1.0.2-dev+g74897bae4021.local20261018053032879`. After failure, manifest version was **1.0.2.0** and all **62** packaged files matched that staging tree; only two runtime logs were additional. This is an update over an existing installation, rather than installation into an empty Plugins directory. The rejected v1.1.0 runtime had not started.

## Failed sequence

All times are October 18 KST. PML indexes are zero-based event-offset indexes. `root` denotes installed directory `io.github.minjungw00.musicdeckbridge.sdPlugin`; the rename destination is its `.uninstall` sibling.

| Time | Source / index | Observation |
| --- | --- | --- |
| 14:59:58.144 | Previous host log | Public installer requested; first attempt precedes capture. |
| 14:59:59.704–15:00:00.026 | Previous host log | Host aborts old plugin for update, reports it stopped, then root rename `Access is denied` and `InstallError`. |
| 15:00:26.794977 | PML 319214 | PID 57560 root rename **ACCESS DENIED**, with old plugin already stopped. |
| 15:00:36.110720 | PML 940699 | Same denial on another retry. |
| 15:00:41.670626 / 15:00:46.475492 | PML 1056399 / 1139749 | Explicit uninstall fails the same rename. Host nevertheless logs `uninstallLocal:finished (AllOk)` after each denial; that alone does not prove directory removal. |
| 15:00:57.111 / 15:00:58.947130 | Host log / PML 1380894 | User quits Stream Deck; host PID 57560 exits. |
| 15:01:01.393607 | PML 1570465 | New host PID 12736 starts. |
| 15:01:07.006969 | PML 2179628 | Old baseline Node PID 42132 starts from installed root. |
| 15:01:24.192 | Current host log | Same installer requested. |
| 15:01:25.829701 | PML 4231382 | Baseline Node emits Process Exit. |
| 15:01:25.829791 / .829799 | PML 4231387 / 4231388 | Node root CloseFile / final IRP_MJ_CLOSE succeed. |
| 15:01:25.832630 | PML 4231506 | Console process PID 55940 exits. |
| 15:01:25.837432 | PML 4231984 | New host also gets root rename **ACCESS DENIED**; host logs `InstallError` at .838. |

All five captured root renames return raw **0xC0000022**, duration **0.3276–0.4127 ms**, with the `.uninstall` destination corroborated in each raw record. Before each, destination lookup returns NAME NOT FOUND and the host successfully opens the source with **Read Attributes, Delete, Synchronize**, sharing **Read, Write, Delete**. No SHARING VIOLATION appears among selected failed-capture records.

For the post-restart failure, Node root CloseFile → rename is **7.6417 ms**, calculated from raw FILETIME values. Earlier retries fail with Node already absent for many seconds. Waiting for old Node exit or restarting only Stream Deck did not resolve this recurrence. Developer-mode queries after restart return NAME NOT FOUND, as in earlier successful normal-mode traces.

Resolved stack modules include FLTMGR, kernel, ntdll/KernelBase, StreamDeck and Qt. They do not identify a denying security filter; similar modules occur on the successful retry.

## Live failing-state inspection

At **15:04:52**, a read-only Windows handle snapshot found Explorer PID **11800** holding handles **0x9fd4** and **0xa24c** to `root\imgs\plugin`. No installed-tree handles were found in other accessible processes. The scan completed after checking **7,554** disk-file handles, but **149** processes were inaccessible; this does not exclude all other system-wide holders. A DELETE-access open of the root with Read/Write/Delete sharing, without requesting deletion, succeeded.

At **15:05:56**, equivalent probes of root, `imgs`, `imgs\plugin`, `imgs\actions`, `property-inspector`, `bin` and `logs` succeeded. Root, parent and `imgs\plugin` had ordinary Directory attributes, inherited ACLs and no explicit deny ACEs in inspected DACLs. These are not full effective-permission checks of every operation. An Explorer window independently reported `root\imgs\plugin`; the filtered process inventory showed host PID 12736 and no plugin Node.

A successful DELETE-access open alone does not prove rename will succeed. Microsoft's [FILE_RENAME_INFORMATION documentation](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/ns-ntifs-_file_rename_information) describes additional open-handle constraints on directory renaming. The observed descendant-directory handles were a concrete candidate, without requiring an ACL repair or plugin working-directory change.

## Close-folder retry

The maintainer was asked to close the Explorer view of `imgs\plugin`, or navigate elsewhere, and retry the identical installer without deleting the plugin or quitting Stream Deck. The follow-up PML records:

| Time | PML index / source | Observation |
| --- | --- | --- |
| 15:06:48.299150 / .299163 | 270971 / 270974 | Explorer closes one `imgs\plugin` handle; final IRP_MJ_CLOSE succeeds. |
| 15:06:48.299344 / .299358 | 270998 / 271000 | Explorer closes the second handle; final IRP_MJ_CLOSE succeeds. |
| 15:06:55.415 | Host log | Same public installer requested in unchanged host PID 12736. |
| 15:06:56.851602 | 948492 | Root rename to `.sdPlugin.uninstall` **SUCCESS**, raw status 0, duration **0.5103 ms**. |
| 15:06:56.864466 | 948952 | Renamed old directory removal succeeds after recursive cleanup. |
| 15:06:56.867141 | 949052 | Extracted v1.1.0 candidate deployment rename **SUCCESS**. |
| 15:06:56.878100 | 949377 | New plugin Node PID **32208** starts. |
| 15:06:56.924 / 15:06:57.005 | Host log | Installation `AllOk`, then SDK plugin connected. |

This uses the previously failing **root rename**, unlike the [earlier official-stop recovery](update-procmon-retry-2026-10-18.md) that recursively removed the original root before deployment. No host restart, baseline reinstall or developer-mode change intervenes in the follow-up trace. Old plugin Node was already absent before both the failed retry at 15:00:26 and this successful retry; plugin absence alone does not explain the difference.

An initial NOT EMPTY while removing the renamed directory is followed by recursive cleanup and successful final removal. The retry's single SHARING VIOLATION at **15:07:02.032746**, index **1076082**, is the investigation's own read-only PowerShell DELETE-access probe **after installation succeeded**, while new Node PID 32208 is running. It is not an installer failure. The later snapshot finds that Node's normal root handle and no Explorer handles under the installed tree.

Post-installation inspection verifies manifest **1.1.0.0** and all **62** files against the public installer byte-for-byte; `.sdPlugin.uninstall` is absent. This verifies installation and SDK reconnection, not additional device-operation, settings-retention or protocol-matrix sign-off.

## Interpretation and scope

The captures and live snapshot strongly support an **Explorer-held descendant-directory handle** as the immediate blocker: repeated unchanged-package denials persist across a host restart, then the two known Explorer handles close and the same host/package succeeds through the same root rename. Closing that Explorer view is a verified recovery for this observed state. Runtime changes, version increments, ACL changes or disabling security software are not supported by this evidence.

The [original failed 1.0.1 → 1.0.2 trace](update-procmon-2026-10-18.md) lacks an equivalent close-handle comparison at its own failure time. Do not attribute every historical denial to this cause or describe this as a source-code fix. Public v1.1.0 and submitted Marketplace v1.0.1 packages remain unchanged.
