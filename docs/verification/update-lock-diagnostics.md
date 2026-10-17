# Windows directory-lock diagnostics

Evidence date: October 17, 2026 (Asia/Seoul), on the Windows host from the [installation investigation](update-installation.md). **A live plugin-directory lock and its release on complete plugin stop were measured. A successful package update and the original post-termination failure remain unverified.**

Subsequent October 18 evidence: an [actual v1.0.1 → v1.0.2 update trace](update-procmon-2026-10-18.md) records Node/console exit and root-handle closure, followed by a successful host DELETE-access open and a denied rename. That failed direct update narrows the investigation; it does not turn this historical stop/restart diagnostic into an installer success.

## Read-only inspection

The installed plugin remains public v1.0.1 (`1.0.1.0`). No installer was run and no plugin files, authentication settings, port settings or profiles were replaced during this investigation.

Native Windows handle queries found the running plugin's `node.exe` holding a directory handle to the plugin root. `explorer.exe` held two handles under `imgs/plugin`. A `CreateFile` probe requesting DELETE access with all sharing flags, without a delete/rename operation, returned:

| Directory | Windows result |
| --- | --- |
| Plugin root | 32: `ERROR_SHARING_VIOLATION` |
| `imgs`, `imgs/plugin`, `imgs/actions`, `property-inspector`, `bin`, `logs` | 0: access granted |

The inspection checked 7,396 accessible disk handles; 140 processes could not be opened. It is not exhaustive evidence about protected/system processes. Directory attributes were ordinary `Directory`, ACL inheritance was enabled, no explicit deny rules were present, and `.sdPlugin.uninstall` did not exist. These observations do not establish every effective permission or the historical failure's lock owner. Explorer's open handles alone do not demonstrate a blocking lock.

Windows documents that a process's [current working directory prevents directory deletion/move/rename](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setcurrentdirectory). [CreateFile sharing rules](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew) explain the DELETE-access probe. The running Node process's root handle is consistent with this mechanism; it is not, by itself, proof of a defect in Stream Deck's update shutdown.

## Controlled stop / restart

The [official CLI stop command](https://docs.elgato.com/streamdeck/cli/commands/stop/) uses `streamdeck://plugins/stop/<uuid>` in pinned CLI 1.10.2. The initial attempt at 19:15 KST was rejected by Stream Deck 7.6.0.23012 with `Feature only enabled in developer mode`; the process remained running. A handled deep link or a CLI success message is insufficient evidence that the process actually stopped.

At **19:18:07–19:18:10 KST**, the original registry value/type/presence of `developer_mode` was preserved, developer lifecycle control was enabled temporarily, and the test stopped and restarted only Music Deck Bridge. A `finally` block restored the original registry setting after restart.

| Measurement | Result |
| --- | --- |
| Before stop | One plugin Node process; root DELETE-access error 32 |
| After stop | Zero matching plugin Node processes; root DELETE-access error **0** |
| After restart | One new plugin Node process; root DELETE-access error 32 |
| SDK reconnection | Host logged `Plugin connected` at 19:18:09.473 KST |
| Original developer-mode setting | Restored, including registry value type/presence |
| Private state comparison | All 18 inventoried auth/config, installed manifest and profile JSON file contents unchanged; no new inventoried paths |
| Installed version | `1.0.1.0` throughout |

The relevant host sequence was:

```text
19:18:08.304  Aborting with reason 'Plugin deleted' (official developer stop)
19:18:08.616  Process stopped (killed); Plugin finished
19:18:08.650  Stop deep link handled
19:18:09.387  Restart deep link handled
19:18:09.473  Plugin connected
```

`Plugin deleted` is the host's stop reason text here; no plugin folder was deleted. Private file hashes were compared in memory; neither file contents nor authentication hashes are published. This measures stop/restart retention, not package-update retention or physical playback controls.

## Implications and next test

The lock is releasable; the failure has not been shown to be impossible to resolve. A complete plugin unload before invoking the installer is a candidate update procedure to compare against direct installation while running. The developer stop route is not an ordinary-mode solution on this host; do not require users to leave developer mode enabled. The existing [backup/file-replacement recovery](../installation.en.md#replacing-plugin-files) remains available.

The original failures happened after a `Process stopped` log, whereas this test checked after the stop command completed and the process list was empty. The missing measurement is the directory sharing state at the original installer rename attempt. A shutdown timing issue or an additional handle at that moment remains a hypothesis. Test a controlled existing-version → new-version package installation with installer timestamps, process disappearance, sharing probes and preserved-state comparisons before claiming the direct update is fixed.

A new package's runtime cannot execute before the installer replaces the old files. A patch affecting startup/cleanup may help later upgrades but cannot be assumed to repair the first transition from an already-installed old runtime. Do not blindly change `process.cwd()` to avoid the lock: SDK 3.0.2 derives plugin identity, manifest access, localization paths and logging locations from it. Any such change needs SDK/DRM-compatible design and regression evidence.
