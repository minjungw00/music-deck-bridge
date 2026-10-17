# Security

Do not post vulnerabilities, real PINs, bearer tokens, `auth.json`, private keys or sensitive logs in public issues.

Use [GitHub private vulnerability reporting](https://github.com/minjungw00/music-deck-bridge/security/advisories/new). If the form becomes unavailable, ask the maintainer for a private reporting channel through the repository contact options without including exploit details or secrets.

Include the affected version, Windows/Chrome/Stream Deck versions, reproduction steps, impact and a minimal proof of concept with dummy data. Review the [architecture](docs/architecture.md) for the local origin/token boundary and permitted artwork hosts.

Maintainers track repository security settings and inspection results in the [security verification record](docs/security-readiness.md). Local checks detect only a limited set of accidental secrets.

Recheck repository settings before each release and keep this reporting route aligned with the actual configuration.
