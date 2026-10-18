# Repository security verification

Checked October 17, 2026 (Asia/Seoul) against `minjungw00/music-deck-bridge` using the authenticated GitHub REST API. These settings are independent of store approval and hardware verification.

| Setting | Verified state / action |
| --- | --- |
| Private vulnerability reporting | Initially disabled; enabled and re-read as `enabled: true` |
| Secret scanning | Already enabled; left enabled |
| Push protection | Already enabled; left enabled |
| Dependabot vulnerability alerts | Initially disabled (API 404 explicitly reported disabled); enabled, subsequent read succeeded |
| Dependabot automated security fixes | Enabled; re-read as `enabled: true`, `paused: false` |
| Scheduled dependency updates | Existing weekly npm and GitHub Actions configuration retained in `.github/dependabot.yml` |
| Default workflow token | Read permissions; workflow approval of pull requests disabled |
| CI workflow permissions | `contents: read` |
| Release workflow permissions | Read by default; only the draft-release job requests `contents: write` |

Private reports use the repository's [private vulnerability form](https://github.com/minjungw00/music-deck-bridge/security/advisories/new), also linked by [SECURITY.md](../SECURITY.md). The public Advisories page returned HTTP 200 and exposed the private form link and “Report a vulnerability” label. No vulnerability report was submitted to test the route. GitHub documents the [reporting entry point and enabled setting](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository).

Read-only rechecks (GitHub CLI, with authenticated repository access):

```sh
gh api repos/minjungw00/music-deck-bridge/private-vulnerability-reporting
gh api repos/minjungw00/music-deck-bridge --jq '.security_and_analysis'
gh api repos/minjungw00/music-deck-bridge/vulnerability-alerts --silent
gh api repos/minjungw00/music-deck-bridge/automated-security-fixes
gh api repos/minjungw00/music-deck-bridge/actions/permissions/workflow
```

The alerts endpoint returns an empty successful response when enabled; inspect its exit status. Do not interpret an arbitrary permission-related 404 as proof that the setting is disabled.

## Limited history and artifact inspection

At starting commit `58d8783`, 297 unique blobs reachable from all locally available refs were inspected with the same three explicit secret-content patterns as the existing checker: private-key headers, GitHub token formats and persisted 64-hex bridge-token JSON values. No matches were found. This did not fetch every deleted branch or pull-request ref, detect every secret provider/encoding or replace GitHub scanning and alert review.

Both v1.0.0 and v1.0.1 public downloads passed their SHA-256 inventories. All four archives (43 plugin files and 14 Chrome files per release) were checked for the same content patterns and credential filenames (`auth.json`, `.env` variants and private-key/container extensions); no matches were found. Package file boundaries and runtime license notices remain covered by the existing packaging tests. The runtime comparison is summarized in the [update investigation](verification/installation.md); the [v1.0.0](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.0.0) and [v1.0.1](https://github.com/minjungw00/music-deck-bridge/releases/tag/v1.0.1) release assets retain their checksum inventories.

Run `npm run check` for tracked-source checks and `npm audit` for the current locked dependency graph. These checks do not certify the absence of all credentials or vulnerabilities. Keep reports, PINs, tokens, authentication backups and raw host logs out of public issues.
