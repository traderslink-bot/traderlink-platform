# Trade Analyzer Candle-backed Population Progress

**Status:** Implemented locally; focused static and read-only verification complete.

**Controlling plan:** [Trade Analyzer Analysis Pages Plan](trade-analyzer-analysis-pages-plan.md)

## 2026-08-19 correction

- [x] Confirmed that the shared Day Trade Analysis read model had counted
  current `ready` records with a path summary even where no saved market candle
  backed an execution snapshot.
- [x] Defined an analyzed trade as a current ready result containing at least
  one saved execution snapshot anchored to its exact saved market candle.
- [x] Applied that predicate to the shared long-term aggregates, the available
  reporting-currency lookup and the paginated Analyzed Trades directory. The
  directory also keeps its server-derived selected-account predicate and now
  honors the selected currency partition.
- [x] Updated the existing Help text to state the same candle-backed boundary.
- [x] Replaced the technical empty-state count with the owner-approved
  subscription-activation explanation.
- [x] Ran targeted ESLint and a read-only per-account table check. The
  corrected directory returns zero candle-backed trades for one account and
  eleven for the other, with no Journal write, browser process, commit or
  deployment. The shared account selector's persistent instructional tooltip
  was removed because it obscured the account choices.

## Live-data observation

The local development database contained 1,674 current ready records with a
path summary, while only 11 have an execution snapshot anchored to a saved
market candle. The page's prior 820 count was therefore not a factual analyzed
trade count. No Journal data was changed while confirming this.
