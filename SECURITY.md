# Security

Do not post vulnerabilities, real PINs, bearer tokens, `auth.json`, private keys or sensitive logs in public issues.

Use [GitHub private vulnerability reporting](https://github.com/minjungw00/music-deck-bridge/security/advisories/new) if enabled. If unavailable, ask the maintainer for a private reporting channel through the repository contact options without including exploit details or secrets. No unverified email address is provided.

Include the affected version, Windows/Chrome/Stream Deck versions, reproduction steps, impact and a minimal proof of concept with dummy data. Review the [architecture](docs/architecture.md) for the local origin/token boundary and permitted artwork hosts.

Before release, the maintainer should enable private vulnerability reporting, secret scanning and push protection where available, and review existing history and distribution contents. Local checks only detect a limited set of accidental secrets.

Rechecked October 17, 2026: the public GitHub private-vulnerability-reporting API still returned `enabled: false`. The maintainer must enable this repository setting before advertising private reporting as available. This check does not verify secret scanning or push protection settings.
