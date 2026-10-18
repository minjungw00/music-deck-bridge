# Agent instructions

## Workflow

- Make atomic commits using the Conventional Commit format `type: description`, with a type matching the change's responsibility. If the user requests uncommitted changes, do not stage or commit them.
- Keep the selected development version fixed during ordinary work. Change the target or promote a release only when explicitly requested; follow the [versioning policy](docs/versioning.md).
- Preserve published tags/assets and already submitted packages. Record later changes as separate revisions rather than replacing distributed artifacts.

## Verification and diagnosis

- Run checks proportional to the change. Prefer existing meaningful tests; do not add tests that merely mirror a trivial edit.
- Distinguish implementation completed, automated fixture passed, maintainer-confirmed operation and independently observed operation. State what was verified and what remains uncertain; simulated results do not establish real-environment behavior.
- Respect completed maintainer validation within its stated scope. Do not request a repeat solely to fill omitted metadata; new behavior or regressions need separate evidence.
- Separate measured facts, supported interpretations and unresolved questions. Use controlled comparisons to investigate causes. A workaround or failure to reproduce does not establish a code fix or justify generalizing to all environments.

## Documentation

- Keep general guides focused on repeatable instructions. Put dated observations, individual test outcomes and machine-specific investigation details in verification records.
- Keep documents concise and consolidate evidence by topic. Avoid a new document per build, retry or small feature; remove duplicate explanations, obsolete checklists and superseded records. Git history retains earlier detail.
- Update current status without rewriting the scope or outcome of historical evidence. Keep release, submission, review, publication and actual installation results distinct.
- Preserve actual submitted descriptions verbatim and distinguish them from reference copy. Record later revisions separately.

## Images

- Preserve actual screenshot UI pixels. For crop/margin adjustments, use ordinary image tools without stretching or redrawing the interface. Clearly label sample-data renderings and approximations.
