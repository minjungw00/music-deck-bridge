# Protocol compatibility implementation and verification

Evidence date: October 18, 2026 (Asia/Seoul). Version remains **1.0.2-dev**; Chrome **1.0.2**, Stream Deck **1.0.2.0**, explicit wire range **1–1**. No public release/tag or submitted store package was replaced.

The maintainer [confirmed the preceding device, Chrome and update/recovery checks complete](maintainer-validation-2026-10-18.md) before requesting this feature. This record covers the new protocol change; it does not reopen the historical installation conflict, which was not reproduced.

## Implemented behavior

The [protocol contract](../protocol.md) separates application identity from wire compatibility, negotiates intersecting ranges and supports both directions of the known implicit legacy-v1 contract. Unsupported or malformed explicit ranges produce precise update/invalid-metadata guidance. Authentication precedes negotiation. PIN/token, UUIDs, port and storage paths remain unchanged. Incompatible commands and queued pre-mismatch inputs are discarded; compatible replacement recovers using existing credentials. `/unpair` remains available.

The same pure negotiation module is bundled in Node and included explicitly in the Chrome archive. The classic worker loads it using the [documented MV3 import mechanism](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/basics#import-scripts). New fields are additive; legacy compatibility does not imply that old releases contain new optional actions.

## Local automated results

- `npm test`: **117 passed**, including the bounded five-second recheck/recovery path.
- `npm run check`: syntax, resources/JSON, locales, development versions and basic secret checks passed.
- Python distribution tests: **2 passed**, including the shared module at the Chrome archive root.
- `npm run test:browser`: passed in actual **Chromium 156.0.8078.4** / MV3 worker with a local fixture site. The worker imports its dependency, exchanges explicit-v1 identity, blocks an input after an injected future-protocol response, preserves the token and recovers when the compatible response is restored. Nine cold-tab actions, readiness/state sync and receiver-replacement checks also pass.
- Official Elgato CLI validation/packaging passed, **62 plugin files**. The shared module is embedded in the standalone runtime; no extra runtime installation or plaintext manifest reading is required.

| Scenario | Evidence |
| --- | --- |
| Equal wire versions / different application labels | Shared engine, real HTTP bridge, SDK inspector and worker |
| Overlapping ranges / both update directions | Shared engine with explicit local/peer ranges |
| Old extension request without metadata → new plugin | Actual bridge legacy-wire fixture |
| New extension → old plugin response without metadata | Worker fixture and existing older-plugin polling-fallback tests |
| Invalid/null/string/reversed ranges | Shared engine and extension error paths |
| Incompatible pairing | PIN retained, auth file absent, wrong PIN rejected first |
| Incompatible authenticated request | HTTP 409, pending poll closed, queue cleared, auth/config bytes unchanged |
| Recovery / explicit unpair | Existing token reused, stale inputs not replayed, incompatible unpair succeeds |
| Actual SDK input while incompatible | Alert and protocol error without launch/delivery, ordinary and opaque-manifest fixtures |
| English/Korean feedback | Inspector and popup fixtures |

Legacy fixtures exercise the prior HTTP contract; actual archived component binaries or Marketplace DRM were not installed in this test. The future-protocol browser response is deliberately injected because no production protocol-2 component exists. These distinctions preserve the limits of the matrix.

## Remaining checks

Run Windows/Ubuntu CI for the selected final source. Install both new development components in the actual environment and check explicit identity/status and retained pairing. Incompatibility behavior is covered by controlled fixtures; a future real wire change must add tests for its implemented versions and migration. DRM and store installation/migration remain separate release gates.
