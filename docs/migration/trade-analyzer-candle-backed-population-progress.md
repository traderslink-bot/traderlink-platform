# Trade Analyzer Candle-backed Population Progress

**Status:** Implemented locally; focused verification pending.

**Controlling plan:** [Trade Analyzer Analysis Pages Plan](trade-analyzer-analysis-pages-plan.md)

## 2026-08-19 correction

- [x] Confirmed that the shared Day Trade Analysis read model had counted
  current `ready` records with a path summary even where no saved market candle
  backed an execution snapshot.
- [x] Defined an analyzed trade as a current ready result containing at least
  one saved execution snapshot anchored to its exact saved market candle.
- [x] Applied that predicate to the shared long-term aggregates, the available
  reporting-currency lookup and the paginated Analyzed Trades directory.
- [x] Updated the existing Help text to state the same candle-backed boundary.
- [x] Replaced the technical empty-state count with the owner-approved
  subscription-activation explanation.
- [ ] Run the smallest focused static and read-only data checks after the
  concurrent dashboard changes settle. No test suite, database write, browser
  process, commit or deployment is part of this correction.

## Live-data observation

The local development database contained 1,674 current ready records with a
path summary, while only 11 have an execution snapshot anchored to a saved
market candle. The page's prior 820 count was therefore not a factual analyzed
trade count. No Journal data was changed while confirming this.
