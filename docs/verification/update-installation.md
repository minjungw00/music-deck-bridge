# Plugin update installation investigation

Evidence collected October 17, 2026 (Asia/Seoul). Status: **installer failure identified; live directory-lock release confirmed; historical post-stop failure and measured package-update/recovery procedure still pending**. See the [controlled Windows lock diagnostics](update-lock-diagnostics.md). No plugin runtime patch or version bump is justified by this evidence.

Subsequent October 18 evidence: the [v1.0.1 → v1.0.2 PML trace](update-procmon-2026-10-18.md) reproduces the failure after Node/console exit and a successful DELETE-access open. It identifies the exact candidate installer and preserved installed baseline; the component denying the rename remains unconfirmed. The October 17 observations below are retained as history.

A later [official-stop retry](update-procmon-retry-2026-10-18.md) succeeded with the same candidate and host PID; all 45 installed files match 1.0.2.0 and the SDK reconnected. The host removed the old folder recursively instead of using the denied old-root rename. Detailed retention/operation and rollback remain pending; this does not mark ordinary direct updates fixed.

## Environment and provenance

The existing Windows host logs were read from WSL without stopping or changing the installed application. Raw logs remain on the host; only the relevant redacted entries are committed in [update-installation.log.txt](update-installation.log.txt). Machine identifiers, device serial numbers, unrelated plugin activity and user paths are omitted.

| Field | Observed value |
| --- | --- |
| Windows | Windows 11 Education, 10.0.26300 (Stream Deck log header) |
| Stream Deck software | 7.6.0.23012 |
| Attached device firmware | 2.0.3.7; exact model not established from this inspection |
| Chrome version | Not collected |
| Currently installed plugin | Manifest `1.0.1.0`; every one of the 43 public v1.0.1 package files matches the installed file bytes |
| Downloads installer at initial inspection | `1.0.1.0`, SHA-256 `1438f064a4f09a54e6adfe90e589b0f9df326ccfafb50713d50db89da0e0075e` — the previously supplied revised draft, not the final public archive |
| Failed-attempt installer provenance | The log records the Downloads path but no package hash or before/after manifest versions; today's file cannot establish which bytes were present during each earlier attempt |

The current draft installer and public v1.0.1 installer have identical file payloads; archive metadata accounts for different archive hashes. The public package is identified in [v1.0.1 verification](v1.0.1.md).

## Observed failure

Four attempts failed at **16:58:40.004, 16:59:02.932, 17:00:54.101 and 17:05:19.894 KST**. In the first attempt, the host logged:

1. `Aborting with reason 'Update plugin'`.
2. `Process stopped (killed)` and `Plugin finished`.
3. `ESDPluginManager::UninstallPlugin`: renaming the installed `.sdPlugin` directory to `.sdPlugin.uninstall` failed with `Access is denied`.
4. `[installLocal:install] (InstallError)`.

This establishes the immediate rejection in the **host's removal/rename stage**, after it stopped the old runtime. The stopped bridge explains the reported `Failed to fetch`. Restarting the host reconnects the existing plugin in the logs at 17:05:54.752; this does not establish that the preceding update succeeded.

A directory/file handle, current working directory, ACL or another process could prevent the rename. The logs do **not** identify a lock owner or prove a runtime defect. Capture the failing rename with Windows Process Monitor (including result and process/stack details), or inspect open handles during a controlled reproduction, before selecting a code fix. Do not change ACLs, run as administrator or reset authentication based only on this message.

At **17:15:34.319**, the host logged `[installLocal:finished] (AllOk)` and then `Plugin connected` at 17:15:34.379. This corroborates a later successful installation and SDK connection, alongside the maintainer's normal-operation report. The log alone does not establish removal steps, action behavior or settings retention.

## Package comparison

Both public releases were downloaded again, and all entries in their published `SHA256SUMS.txt` passed. Their ZIP inventories contain the same paths: 43 plugin files and 14 extension files per version.

| Check | v1.0.0 → v1.0.1 result |
| --- | --- |
| Plugin version | `1.0.0.0` → `1.0.1.0` |
| UUID, seven action UUIDs, CodePath, Node.js 24, SDK 3, Stream Deck minimum 7.1 | Unchanged |
| Plugin payload changes | Manifest version only; four representative/category PNGs |
| Chrome payload changes | Manifest version only; three brand PNGs |
| Plugin bundle, extension runtime, inspector, locale and action assets | Byte-for-byte unchanged |
| Added/removed payload paths | None |

Package structure and unchanged runtime bytes provide no evidence of a new runtime regression. Published tags and assets remain fixed.

## Update and recovery verification matrix

| Scenario | Evidence / remaining work |
| --- | --- |
| Package over existing files while host is running | Four logged rename/access-denied failures; precise version pair at failure not captured |
| Quit host completely, retain old folder, then launch package | Pending controlled comparison; opening the package starts Stream Deck, so record whether the old plugin starts before replacement |
| Move old plugin folder outside Plugins, install replacement | Maintainer reports normal operation after replacement/reinstallation guidance; later AllOk/SDK connection corroborated; exact steps not restated |
| Restart after rejected update | Maintainer reported recovery of old version; reconnects also appear in host logs |
| Controlled plugin stop/restart and lock probe | At 19:18 KST, root DELETE-access probe changed 32 → 0 → 32; plugin reconnected and 18 inventoried state files remained unchanged. [Scope and developer-mode prerequisite](update-lock-diagnostics.md). This is not a package-update test. |
| Restore backed-up plugin after failed replacement | Procedure documented; end-to-end rollback and retention measurements pending |
| PIN token, Chrome identity, custom port, profiles and per-action settings retained | Storage locations are unchanged; separate before/after measurements still pending |
| Maker Console processed build | Separate [DRM verification](marketplace-drm.md); not tested here |

Use the [English](../installation.en.md#replacing-plugin-files) / [Korean](../installation.ko.md#replacing-plugin-files) replacement and recovery instructions. Before further testing, back up profiles, the plugin folder and `%APPDATA%\MusicDeckBridge` privately; never commit authentication files or raw logs. Keep the same Chrome profile, extension ID and absolute unpacked-extension path.

For each controlled test, record installer SHA-256, source tag/run, installed manifest versions before/after, start/end timestamps, host running/fully exited state, removal method and result. Compare authentication/configuration privately while the host is stopped; after restart, verify the existing pairing without generating a PIN, matching custom port, profile actions, title mode, dial step and playback. Record failures as well as successes. A separate fresh pairing test belongs to the DRM matrix; it must not replace a retention check.

P0 remains open until the normal update/recovery procedure and retention checks are measured. A v1.0.2 patch is conditional on further evidence; protocol changes remain a later v1.1.0 candidate.

## Investigation-session automated checks

The unchanged v1.0.1 runtime was rechecked on WSL/Linux (Node.js 24.19.0): `npm run check`, all 50 Node regression tests and both Python packaging tests passed. `npm audit` reported zero vulnerabilities. Both public release checksum inventories passed again, and release asset IDs/update timestamps/digests and both local annotated tag objects were unchanged at the final recheck. These are local checks and public-release preservation checks, not a new Windows/Ubuntu CI run or manual retention/DRM evidence.
