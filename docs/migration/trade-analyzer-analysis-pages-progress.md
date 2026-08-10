# Trade Analyzer Analysis Pages Progress

**Plan:** [Trade Analyzer Analysis Pages Plan](trade-analyzer-analysis-pages-plan.md)

## Current checkpoint - 2026-08-09

- [x] Owner approved separating Trade Analyzer from generic historical
  Analytics.
- [x] Owner approved the expandable Trade Analyzer navigation group.
- [x] Owner approved a lightweight Day Trade Analysis landing plus Entry &
  Exit, Green-to-Red, Candle Patterns and Analyzed Trades capability pages.
- [x] Recorded which growing tables paginate and which fixed cards, cohorts and
  charts do not.
- [x] Locked analyzed/eligible coverage, retained access to completed analysis
  after cancellation and the later Moomoo lookback test boundary.
- [x] Documented the future Swing Trade Analysis separation.
- [x] Defined page-level and section-level question-mark Help links with stable
  exact anchors and consistent responsive placement.
- [x] Owner approved the written plan and authorized completing the full
  revised implementation before one final review.
- [x] Implemented the expandable Trade Analyzer navigation and five routes.
- [x] Implemented page-size controls, stable filtering/sorting and pagination
  for growing trade and pattern results; fixed cohorts remain unpaginated.
- [x] Added page-level and section-level question-mark Help links that open
  exact stable Help anchors in a new tab.
- [x] Added the ranked pattern view and kept summaries calculated from the
  complete filtered population.
- [x] Kept coverage unavailable instead of falsely treating all historical
  Journal day trades or the 14 saved analyses as the paid eligibility
  denominator while the Moomoo lookback decision remains deferred.
- [x] Redirected transitional `/analytics/trade-analysis` requests while
  preserving supported filter query parameters.
- [ ] Complete final integrated desktop/mobile visual review.
- [x] Created narrow local implementation checkpoint `91579840`
  (`feat(trade-analyzer): split day analysis capabilities`).

## Coordination

- The current combined Trade Analysis implementation remains the factual source
  and review reference until the replacement pages are accepted.
- No migration number is reserved by this planning checkpoint.
- The initial paid lookback value remains intentionally unset pending a later
  Moomoo test-account exercise.
