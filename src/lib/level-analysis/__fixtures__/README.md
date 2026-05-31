# LevelAnalysisSnapshot Fixtures

This directory contains app-side fixtures for consuming the locked `LevelAnalysisSnapshot` v1 contract from `levels-system`.

## Fixture

- `journal-connector-level-analysis-snapshot-v1.json`

The fixture is copied from:

```text
levels-system/docs/examples/level-analysis-snapshot/journal-connector-contract/journal-connector-level-analysis-snapshot-v1.json
```

It is compact, deterministic, and intended for TraderLink Intelligence / journal adapter tests.

## Boundaries

The fixture is factual chart-analysis context. It is not a trade grade, coaching result, P/L calculation, giveback analysis, behavior score, recommendation, entry decision, exit decision, or trade advice.

Synthetic continuation-map rows are forward-planning chart map levels only. They are not historical support/resistance and must remain visibly marked with `extensionMetadata.extensionSource = "synthetic_continuation_map"`.
