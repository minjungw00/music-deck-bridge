# Contributing

Read the [development guide](docs/development.md) and [architecture](docs/architecture.md) before changing code. Use the issue templates for bug reports and feature requests. Report vulnerabilities privately through [SECURITY.md](SECURITY.md).

## Setup and checks

Use Node.js 24 and npm; Python 3.10+ is needed for packaging and Python tests. From the repository root:

```sh
npm ci --ignore-scripts
npm run check
npm test
python -m unittest discover -s tests -p "test_*.py"
```

Use `python3` if your system has no `python` alias. Check/test commands rebuild the plugin automatically. See [local checks](docs/development.md#local-checks) for browser tests and CI coverage.

## Making changes

- Edit plugin modules in `streamdeck/src/` and Chrome source in `chrome-extension/`; see the [source map](docs/development.md#source-files).
- Keep the selected version fixed during ordinary work. Follow the [versioning policy](docs/versioning.md) for a new development target or explicit release promotion.
- Test affected behavior, including pairing, live port changes and Stream Deck actions where relevant. Cover protocol, identifier and storage changes with meaningful regressions.
- Keep Chrome en/ko message keys synchronized. Update privacy documentation when data handling changes.
- Keep credentials and runtime data out of the repository. Preserve upstream copyright and license notices.

## Commits and review

Make atomic Conventional Commits using `type: description`, for example `docs: explain PIN pairing` or `fix: restore player connection after updates`.

In pull requests, explain the behavior change, relevant validation and any Windows/device checks still outstanding. Contributions use the project's Apache-2.0 license unless explicitly agreed otherwise.
