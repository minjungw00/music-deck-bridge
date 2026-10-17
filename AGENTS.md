# Agent instructions

- Make atomic commits using the Conventional Commit format `type: description`. Choose the type to match the change's actual responsibility.
- Keep the current `X.Y.Z-dev` cycle fixed for ordinary changes and identify builds by commit/build metadata. Change the target or promote a release only when explicitly requested by the user; follow [the versioning policy](docs/versioning.md).
