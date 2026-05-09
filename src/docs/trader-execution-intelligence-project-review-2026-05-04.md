# Trader Execution Intelligence Project Review

Date: 2026-05-04

## Product Target

This app should compete with trading journals by doing something more useful
than storing trades and showing reports.

The target review quality is:

> Your first entry was close to major 4h resistance, the trade had limited
> clean room, and your add increased size after the trade had already used most
> of its favorable move.

That means the product needs to understand:

- the imported execution sequence
- position size changes
- MFE/MAE and trade-window movement
- whether the trader added, reduced, or exited at meaningful moments
- daily/4h support/resistance context from `levels-system`
- how market context interacted with the trader's decisions

The app should not be just another calendar, tag, and P/L journal.

## Competitor Bar

The main external products set this baseline:

- Tradervue: classic journal, reports, charts, tagging, analytics
- TradeZella: polished import, replay, playbooks, reports, AI positioning
- StonkJournal: simple low-friction journaling
- SuperTrader: analytics, mental tracking, AI/copilot positioning

The differentiator for this project should be execution-level intelligence:

- not only "you lose on Fridays"
- not only "your win rate is 42%"
- not only "tag your setup"
- instead: "this specific decision damaged or improved this specific trade"

## Current Architecture Decision

For the first serious market-context pass:

- use daily/4h support and resistance for trader-facing feedback
- do not build feedback around VWAP or EMA
- defer 15m/5m support/resistance coaching until a later tactical layer
- use 1m/5m historical candles only for trade-window movement facts
- keep support/resistance, candle fetching/storage, and level relations owned by
  `levels-system`
- keep P/L, sizing, behavior, review language, and coaching owned by
  `trader-intelligence-v2`

## levels-system Boundary

`levels-system` should provide neutral market facts:

- historical daily/4h support/resistance context as-of each execution
- nearest daily/4h support and resistance
- distance to those levels
- whether execution was near, above, below, into, or through a daily/4h level
- level strength, confidence, timeframe sources, freshness, and evidence
- trade-window MFE/MAE and high/low from 1m/5m candles
- bounded post-exit continuation/reversal facts
- diagnostics for missing/stale/partial/fallback/truncated data

`trader-intelligence-v2` should not calculate those facts locally.

The sibling project handoff is:

- `../levels-system/docs/74_TRADER_INTELLIGENCE_LEVELS_BOUNDARY_HANDOFF_2026-05-04.md`

## Current Local Status

Implemented in this repo:

- `createRawTradeTimelineWithLevelsSystemCandles(...)` calls the shared
  levels-system trade-window API
- all executions are sent to levels-system as `{ timestamp, price, quantity,
  side }`
- trade start/end and bounded `asOfTimestamp` are derived from executions
- raw results expose neutral levels-system trade-window facts
- PatternInput consumes trade-window MFE/MAE facts
- VWAP/EMA PatternInput feedback fields are neutralized
- feedback-facing support/resistance levels are filtered to daily/4h sources
- debug summary reports dynamic benchmarks as disabled for trader feedback
- `buildTradeDecisionReview(...)` now converts normalized patterns into
  scoring, behavior analysis, coaching output, and concrete decision insights
- `TradeAnalysisSummary` now includes `decisionReview`
- the trade-analysis debug dashboard now prints coaching focus and top insight

## Simulations Run

Generated debug dashboard artifacts:

- `artifacts/trade-analysis-current-review`
- `artifacts/trade-analysis-current-review-long-winner`
- `artifacts/trade-analysis-current-review-long-loser`
- `artifacts/trade-analysis-current-review-short-winner`
- `artifacts/trade-analysis-current-review-short-loser`
- `artifacts/trade-analysis-current-review-partial-exits`
- `artifacts/trade-analysis-current-review-open-position`
- `artifacts/trade-analysis-current-review-rapid-fire-execution-cluster`
- `artifacts/trade-analysis-current-review-inconsistent-share-sizing`
- `artifacts/trade-analysis-current-review-repeated-adds`

All reviewed fixture simulations completed.

Observed examples:

- sample fixture: 1 completed trade, 4 support levels, 2 resistance levels, 22
  detected / 22 normalized patterns
- repeated adds before reduction: 1 completed trade, 3 support levels, 8
  resistance levels, 27 detected / 27 normalized patterns
- long winner: 24 detected / 24 normalized patterns
- long loser: 20 detected / 20 normalized patterns
- short winner: 24 detected / 24 normalized patterns
- short loser: 25 detected / 25 normalized patterns
- partial exits: 24 detected / 24 normalized patterns
- open position: completed with an `open_position` warning and 19 detected /
  19 normalized patterns
- rapid-fire execution cluster: 27 detected / 27 normalized patterns
- inconsistent share sizing: 26 detected / 26 normalized patterns

## What This Means

The engine can already run deterministic imported-trade simulations through:

- request validation
- levels-system trade-window candle context
- daily/4h support/resistance mapping
- raw timeline construction
- PatternInput
- pattern detection
- pattern normalization
- debug summary generation
- decision-review coaching generation

The missing product piece is no longer basic coaching generation. The missing
product piece is the user-facing review workflow that turns `decisionReview`
into a clear prototype analysis inside `/import-dry-run`.

## Main Product Gap

The current `/import-dry-run` route is already strong at:

- CSV parsing
- broker presets
- row repair
- confidence gates
- import session state
- execution-feedback preview
- replay preview
- P/L reconciliation
- post-import review queue preview

It still needs to clearly answer:

> What would the app tell me about this imported trade if I continued?

The next feature should expose a prototype analysis panel that connects the
import workflow to the analysis/review engine without pretending persistence is
live.

## Recommended Next Step

Build the `CsvDryRunPrototypeAnalysisPanel` view model and wire it into
`/import-dry-run`.

The panel should show:

- import state: blocked, needs review, ready, or prototype generated
- generated trade preview count
- feedback summary count
- review queue count
- top mistake/strength/autopsy item
- top `decisionReview` coaching headline and fix-first behavior when the
  imported trade can run through trade analysis
- top `decisionReview.insights`
- whether prototype analysis could be generated
- explicit limitations:
  - prototype only
  - not saved to production
  - execution-only unless market context is explicitly shown
  - no export/download

After that, add the first market-context review extension:

- for each generated trade, show the nearest daily/4h support/resistance context
- show whether the trade had clean room or was close to a major level
- keep language neutral until coaching layer intentionally uses it

## Verification Already Passed

Latest verification after the market-context direction change:

```bash
npx tsc --noEmit --pretty false
npm run verify:levels-system
npm test
```

Results:

- `npm run verify:levels-system`: 21 files / 73 tests passed
- `npm test`: 87 files / 799 tests passed

## Immediate Build Order

1. Update the workflow plan and handoff with this review.
2. Add `buildCsvDryRunPrototypeAnalysisPanel(...)`.
3. Feed `TradeAnalysisSummary.decisionReview` into that panel for trades that
   can run the prototype analysis path.
4. Add unit tests for ready, blocked, needs-review, and fee/commission states.
5. Wire the panel into `/import-dry-run`.
6. Add Playwright tests proving the panel appears and does not overclaim saves,
   exports, or market-context conclusions.
7. Run focused and full verification.
