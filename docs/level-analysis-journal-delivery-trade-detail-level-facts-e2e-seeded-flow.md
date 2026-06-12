# Level Analysis Trade Detail Level Facts E2E Seeded Flow

## Purpose

Gate `journal_level_analysis_delivery_trade_detail_level_facts_e2e_seeded_flow`
adds an offline browser proof that accepted levels-system delivery facts can move
from fixture-backed ingestion to a saved trade detail page.

The flow is deterministic. It does not call IBKR, does not fetch candles, and
does not modify the levels-system repo.

## Current Dependency Chain

This gate depends on the merged journal-side gates:

- delivery ingestion
- persistence/API design
- persistence contract
- persistence implementation
- persistence-to-journal linking design
- journal linking contract and implementation
- trade-detail level facts read model design, contract, and route implementation
- trade-detail level facts UI design, contract, and implementation

## Seeded Browser Flow

The focused Playwright spec is:

`tests/e2e/level-analysis-trade-detail-seeded-flow.spec.ts`

The dedicated config is:

`playwright.level-analysis.config.ts`

The config creates an isolated SQLite database under:

`artifacts/level-analysis-e2e/trade-detail-level-facts.sqlite`

The test:

1. Opens `/import-dry-run`.
2. Saves a compact generic CSV import for symbol `DEVS`.
3. Reads the saved trade from `/api/trades`.
4. Posts the compact packaged delivery fixture to
   `/api/level-analysis/deliveries`.
5. Persists the trade link through `/api/level-analysis/trade-links`.
6. Verifies `/api/trades/[tradeId]/level-analysis/facts`.
7. Opens `/trades/[tradeId]`.
8. Asserts the level facts availability line and attached facts panel render.
9. Asserts the panel does not expose raw payload terms or prohibited advice
   language.

## Feature Flags

The dedicated Playwright config enables only the flags needed for this proof:

- `LEVEL_ANALYSIS_JOURNAL_DELIVERY_API_ENABLED=1`
- `LEVEL_ANALYSIS_JOURNAL_TRADE_LINK_API_ENABLED=1`
- `LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_ENABLED=1`
- `LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_UI_ENABLED=1`

Admin raw debug is intentionally not enabled.

## Fixture Boundary

The level-analysis delivery seed uses:

`src/lib/level-analysis/__fixtures__/level-analysis-journal-delivery-package-v1.compact.json`

That fixture is a compact journal-side copy of the levels-system packaged
delivery artifact and preserves source metadata. It omits raw candles, full
snapshots, raw cache wrappers, and provider responses.

No live IBKR login is required for this gate.

## Safety Rules

The seeded flow keeps these boundaries:

- Do not modify levels-system files.
- Do not change LevelEngine behavior.
- Do not fetch live candle data.
- Do not expose raw source payloads or raw payload hashes in the trade detail UI.
- Treat 15m facts as context-only.
- Keep old `LevelAnalysisSnapshot v1` compatibility in the existing unit/API
  tests.
- Do not add recommendations, trade advice, coaching, grading, P/L, giveback
  analysis, behavior scoring, buy/sell/hold decisions, or execution-quality
  inference.

## Validation Command

Run the focused seeded browser flow with:

```bash
npm run test:e2e:level-analysis
```

The script runs `npm run build` first, then Playwright with
`playwright.level-analysis.config.ts`.

## Recommended Next Gate

`journal_level_analysis_delivery_trade_detail_level_facts_ci_hardening`

Reason: the deterministic seeded browser proof exists. The next useful step is
to decide whether this focused flow should become part of regular CI, remain a
manual release-gate check, or run only when level-analysis/trade-detail files
change.
