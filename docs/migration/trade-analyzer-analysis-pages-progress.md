# Trade Analyzer Analysis Pages Progress

**Plan:** [Trade Analyzer Analysis Pages Plan](trade-analyzer-analysis-pages-plan.md)

**Plain-language presentation:** [Trade Analyzer Plain-Language Insights Progress](trade-analyzer-plain-language-insights-progress.md)

**Final-exit follow-through:** The plain-language evidence table now exposes
only the persisted 30-minute final-exit observation per trade. Long trades say
whether price rose after the sale and short trades say whether price fell after
the cover; zero, adverse and unavailable observations remain explicit. A later
60-minute reconciliation is not substituted for this first-review fact.

**Single-trade factual outcome review:** [Single-Trade Factual Outcome
Presentation Plan](single-trade-factual-outcome-presentation-plan.md) and its
[progress record](single-trade-factual-outcome-presentation-progress.md) now
hold the owner-reviewable direct-copy contract. No application source is part
of that review checkpoint.

**Profit-protection card-first review:** [Trade Analyzer Profit-Protection
Presentation Plan](trade-analyzer-profit-protection-presentation-plan.md) and
its [progress record](trade-analyzer-profit-protection-presentation-progress.md)
make the Trade Tracker card a hard owner-approval gate before any further
Trade Analyzer results-page implementation.

Raw first-green, first-red and recovery timestamps remain detailed historical
evidence, but repeated microcap crossings no longer create main-card sentences.

The fixed microcap gates apply only to the single-trade feedback sentence.
Future long-term analysis uses continuous stored peak, duration,
realized/open-position, final-result and exact avoided-loss facts, with a
separately defined population and visible sample count for every aggregate.

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
- [x] Owner accepted the completed design and waived any additional integrated
  desktop/mobile visual review after reviewing enough of the implemented UI.
- [x] Created narrow local implementation checkpoint `91579840`
  (`feat(trade-analyzer): split day analysis capabilities`).
- [x] Corrected the accordion Help-control boundary in `f795baec`
  (`fix(trade-analyzer): isolate contextual help controls`) so the Help action
  is not nested inside the accordion toggle.

## Coordination

- The dedicated Trade Analyzer route family is the accepted presentation over
  the existing saved Analyzer facts.
- No migration number is reserved by this planning checkpoint.
- The initial paid lookback value remains intentionally unset pending a later
  Moomoo test-account exercise.
- Focused ESLint, the capped narrow TypeScript project, saved-fact
  reconciliation and Help target/anchor checks pass. Three bounded canonical
  dashboard starts did not reach a port 3010 listener before CPU progress
  stalled at roughly 1.5 GB working set. Every process created by those starts
  was stopped and port 3010 was confirmed released. The owner subsequently
  accepted the completed design and explicitly waived another browser review.

## Dashboard owner-review correction - 2026-08-17

- Trade Analyzer now appears before Analytics in the left navigation.
- Day Trade Analysis is visually the parent of Entry & Exit, MFE & MAE,
  Green-to-Red, Candle Patterns and Analyzed Trades.
- One shared presentation catalog now uses retail-facing directional names,
  including **Bullish Hammer**, **Bearish Shooting Star**, **Bullish
  Engulfing**, and **Bearish Engulfing**, without changing any detector.
- Daily Trade Tracker uses **Show on chart** for an execution. The complete
  trade analysis and Green-to-Red review remain visible while its chart marker
  is selected.
- Targeted ESLint and project TypeScript pass. Owner visual review remains; no
  test suite, build, browser server, commit or deployment ran.

## Empty-state correction - 2026-08-25

- [x] Restored the shared **No completed day trades** message across the Daily
  Trade Analyzer route family to the approved completed-trade availability
  sentence, with no Moomoo connection action.
- [x] Moved the approved beta Moomoo market-data guidance and primary
  **Connect Moomoo** action to the distinct **No trades have been analyzed**
  state, which is shared by every Day Trade Analyzer capability route.
- [x] Confirmed the published Trade Analyzer Help already explains the free
  Moomoo-account connection path and keeps execution imports separate, so no
  guide revision was needed for this narrowly scoped correction.

## Dashboard contextual Help correction - 2026-08-25

- [x] Kept the global Help Center question-mark behavior unchanged.
- [x] Removed the DashboardPage page-icon spacer so its contextual Help icon
  no longer reserves vertical space before page content.
- [x] Limited contextual page Help icons to routes with an explicit published
  guide target; Help Center routes continue to render no duplicate icon.

## Financial outcome color consistency - 2026-08-29

- [x] Applied the shared outcome convention to Day Trade Analysis summary
  cards, comparison tables, supporting trades, Analyzed Trades and Candle
  Pattern occurrence details: positive P/L and return are green, negative are
  red, and zero or unavailable values use standard text.
- [x] Preserved MFE/MAE movement colors, win-rate presentation, opportunity-gap
  values and every calculation and label.
- [x] Reviewed the Trade Analyzer Help guide. This visual-only convention does
  not change the documented behavior or require copy updates.
- [ ] Complete owner desktop/mobile visual review before release acceptance.
