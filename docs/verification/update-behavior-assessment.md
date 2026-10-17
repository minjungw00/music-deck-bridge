# Expected update behavior and limits of the observed failures

Assessment date: October 18, 2026 (Asia/Seoul). **The successful direct updates match the expected installation workflow. The earlier access-denied failure is an unresolved, condition-dependent installation failure, not evidence that Stream Deck generally prohibits updates over installed plugins. Its population frequency is unknown.**

## Public primary-source evidence

| Source | What it supports | What it does not establish |
| --- | --- | --- |
| [Elgato Stream Deck 6.4/6.4.1 release notes](https://edge.elgato.com/egc/sd_content/releasenotes/6.4.1.html) | Per-plugin automatic/manual updates and update notifications are product features. | The exact local-installer rename implementation, current failure rates or a cause for this incident. |
| [Elgato Stream Deck 6.8 release notes](https://help.elgato.com/hc/en-us/articles/29844501142801-Elgato-Stream-Deck-6-8-Release-Notes) | Automatic plugin updates continue through Marketplace sign-in. | Successful testing of Music Deck Bridge's future Marketplace/DRM path. |
| [Official installer packaging documentation](https://docs.elgato.com/streamdeck/cli/commands/pack/) and [SDK distribution documentation](https://docs.elgato.com/streamdeck/sdk/introduction/distribution/) | `.streamDeckPlugin` is the supported distributable installer format for direct users and Marketplace; validation precedes packaging. | A validation pass guarantees installation on every existing Windows state. |
| [Google Meet plugin maintainer's Updating instructions](https://github.com/ChrisRegado/streamdeck-googlemeet/blob/master/README.md#updating) | Another plugin's owner instructs users to open the newer package to update; its development section distinguishes packages that do not increase the version. | Prevalence, or identical runtime, host version, DRM or Windows permissions. |
| [Elite plugin maintainer's update/recovery instructions](https://github.com/mhwlng/streamdeck-elite/blob/master/README.md) | Some maintainers document quit/remove/reinstall procedures for their own plugins. | That such removal is universally required, or that their issue is the same ACCESS DENIED rename. |

These sources describe supported features and individual procedures, not representative reliability statistics. Limited public-source searches did not establish a confirmed same-cause diagnosis for this exact 7.6.0.23012 rename failure. Absence of a matching published diagnosis does not prove rarity. Generic “unable to install” reports cannot be counted as this specific failure without comparable logs.

## Local evidence

- [First PML](update-procmon-2026-10-18.md): existing 1.0.1, absent developer-mode setting, old host PID 23212. Node exits and closes the observed root handle, DELETE-access open succeeds, but old-root rename returns ACCESS DENIED. Four older host-log failures are also retained; this was not simply one unrepeatable dialog.
- [Second PML](update-procmon-retry-2026-10-18.md): official-stop retry succeeds by recursive removal/deployment after enabling developer mode. This is a separate installation path, not a repaired failed rename.
- [Third PML](update-procmon-direct-2026-10-18.md): direct running-plugin update succeeds, including the original rename path, after host restart and baseline reinstall with developer mode enabled.
- [Fourth and fifth PMLs](update-procmon-normal-2026-10-18.md): direct running-plugin updates also succeed with developer mode absent. The fifth includes initial uninstall, public 1.0.1 installation/startup, then a genuine update of the running 1.0.1 to the fixed 1.0.2 candidate. Final 45 candidate files match in each inspected successful case.

The candidate bytes did not change between failed and successful attempts. The first pre-update root was created October 17 at 17:15:34; the fifth pre-update baseline root was recreated October 18 at 03:12:56. Host PID changed from 23212 to 57560 between the first and later direct-update tests. Recorded ordinary directory attributes, requested DELETE access and Read/Write/Delete sharing were the same in both compared rename attempts. Folder recreation and host restart are observed changes; a repaired ACL, particular blocking handle or filesystem filter is not an established cause.

## Assessment

| Question | Assessment |
| --- | --- |
| Is the current successful workflow normal expected behavior? | **Yes.** A newer same-UUID package can update an installed, running plugin while the host performs stop/replacement/start. The successful local traces support this for the measured environment and packages. |
| Must users delete the old plugin, enable developer mode or issue a stop command for every update? | **No such general requirement is supported.** Normal-mode direct updates passed; preserve removal/replacement as recovery when necessary. The initial deletion in the fifth trace prepares its 1.0.1 baseline, not an extra deletion between 1.0.1 and 1.0.2. |
| Was the earlier failure an expected universal limitation? | **No evidence supports that interpretation.** The same package/version pair subsequently succeeds through the same rename operation. Classify it as an unresolved conditional installer failure. |
| Was the earlier failure statistically rare or unique to this user? | **Unknown.** All measured traces come from one PC, one host version and related installation states. Repeated successes after reinstall are correlated, not an independent user sample. |
| Does success prove the original bug is fixed or harmless? | **No.** The original failing state was reset rather than reproduced and corrected by a demonstrated patch. Recurrence and impact remain possible. |

This distinguishes **expected behavior** from **observed frequency**. It is reasonable to infer that the current direct-update success represents the intended workflow; it is not reasonable to infer a numerical success rate, label the initial failure “rare”, or claim all existing installations are covered. Host/folder state and transient contention remain hypotheses, not a confirmed diagnosis.

## Documentation and release consequences

Use ordinary newer-package installation as the default package-update procedure. Keep private backups, installed-version checks and a separately labelled replacement/recovery procedure; do not require developer mode as routine setup. Same-version development rebuilds and intentional downgrades may need replacement because they are not newer-version updates. Preserve existing explicit recovery anchors for links.

Suggested evidence wording: **“Normal-mode 1.0.1 → 1.0.2 direct updating was verified in the maintainer's environment. Earlier old-folder rename failures remain unresolved; recovery is documented.”** Do not publish this as an update-conflict runtime fix. The candidate, old public/submitted packages, UUIDs and configuration paths remain fixed.

To assess general reliability beyond the current environment, independent Windows users/machines or profiles, other supported host versions and preserved older installation states provide stronger evidence than more identical fresh-baseline repetitions on this PC. Actual Marketplace-processed DRM installation/update, itemized settings retention and rollback remain separate unverified checks; public documentation of Marketplace auto-updates does not complete them.
