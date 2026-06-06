# LevelAnalysisSnapshot Fixtures

This directory contains app-side fixtures for consuming locked and current
levels-system journal delivery contracts.

## Fixtures

- `journal-connector-level-analysis-snapshot-v1.json`
- `level-analysis-journal-delivery-package-v1.compact.json`

The old single-snapshot fixture is copied from:

```text
levels-system/docs/examples/level-analysis-snapshot/journal-connector-contract/journal-connector-level-analysis-snapshot-v1.json
```

The new packaged delivery fixture is a compact two-symbol derivative of:

```text
levels-system/docs/examples/level-analysis-snapshot/level-candidate-inventory-visibility/volume-session-context/latest-level-candidate-inventory-volume-session-context-review-wiring.json
```

It records the source commit and source artifact path in `fixtureMetadata`.
The compact fixture keeps the current package shape, `entries[]`, cache
fingerprints, density metric, candidate inventory visibility, and
volume/session context, but omits raw candles, full snapshots, raw cache wrapper
payloads, and provider responses.

## Boundaries

The fixture is factual chart-analysis context. It is not a trade grade, coaching result, P/L calculation, giveback analysis, behavior score, recommendation, entry decision, exit decision, or trade advice.

Synthetic continuation-map rows are forward-planning chart map levels only. They are not historical support/resistance and must remain visibly marked with `extensionMetadata.extensionSource = "synthetic_continuation_map"`.
