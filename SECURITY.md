# Security

Do not post vulnerabilities, real PINs, bearer tokens, `auth.json`, private keys or sensitive logs in public issues.

Use [GitHub private vulnerability reporting](https://github.com/minjungw00/music-deck-bridge/security/advisories/new). Private reporting was enabled and verified on October 17, 2026. If the form becomes unavailable, ask the maintainer for a private reporting channel through the repository contact options without including exploit details or secrets. No unverified email address is provided.

Include the affected version, Windows/Chrome/Stream Deck versions, reproduction steps, impact and a minimal proof of concept with dummy data. Review the [architecture](docs/architecture.md) for the local origin/token boundary and permitted artwork hosts.

Private reporting, secret scanning, push protection, Dependabot alerts and automated security fixes were verified enabled on October 17, 2026. Existing weekly dependency updates and read-only default Actions permissions are retained. See the [security verification record](docs/security-readiness.md) for API checks and the limited history/distribution inspection scope. Local checks only detect a limited set of accidental secrets.

Recheck repository settings before each release and keep this reporting route aligned with the actual configuration.
