# Level Analysis Journal Delivery Persistence Contract Fixtures

These fixtures lock the journal-side persistence/API contract for validated
levels-system delivery payloads.

They are compact contract examples only. They intentionally omit raw candles,
full snapshots, raw cache wrapper payloads, provider responses, durable database
rows, production route handlers, and UI state.

Fixtures:

- `delivery-record.accepted.compact.json`
- `delivery-record.quarantined.compact.json`
- `api-responses.compact.json`

The accepted fixture is based on the app-side compact packaged delivery fixture:

```text
src/lib/level-analysis/__fixtures__/level-analysis-journal-delivery-package-v1.compact.json
```

The original source artifact metadata remains:

```text
levels-system commit f57e8efe9954388ba44adea8bffde180cf6e4c73
docs/examples/level-analysis-snapshot/level-candidate-inventory-visibility/volume-session-context/latest-level-candidate-inventory-volume-session-context-review-wiring.json
```

The fixtures preserve only factual chart context. They are not production
persistence, API wiring, coaching, grading, P/L analysis, behavior scoring, or
trade instruction artifacts.
