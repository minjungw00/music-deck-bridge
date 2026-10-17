# Contributing

Read [development](docs/development.md) and [architecture](docs/architecture.md) first. Bug reports and feature requests can use the issue templates. Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

Use Node.js 24. Run `npm ci --ignore-scripts`, `npm run check`, `npm test`, and `python -m unittest discover -s tests -p "test_*.py"` before submitting changes. Use Python 3.10+ for packaging. Edit plugin source in `streamdeck/src/plugin.cjs`; the official SDK and runtime dependencies are bundled by `npm run build:plugin`. The check/test commands rebuild it automatically. Chrome source is edited directly in `chrome-extension/`. Both package builds run in CI.

Keep the current `X.Y.Z-dev` version fixed for ordinary changes; follow the [versioning policy](docs/versioning.md) for explicit release promotion. Keep changes focused and verify pairing, live port changes and Stream Deck actions. Cover changes to the bridge protocol, identifiers or storage with relevant regression tests. Never add real credentials or runtime data. Keep Chrome en/ko message keys in sync and update privacy documentation when data handling changes.

Use atomic Conventional Commits in the form `type: description`, choosing a type that describes the responsibility, for example `docs: explain PIN pairing` or `fix: restore player connection after updates`. In pull requests, explain the behavior change and relevant validation, including any Windows/device checks still outstanding.

Contributions are submitted under the project's Apache-2.0 license unless explicitly agreed otherwise. Preserve upstream copyright and license notices when updating bundled third-party files.
