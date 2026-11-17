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

## Standalone Trade Analyzer design and navigation — November 16, 2026

- Put every existing `/analytics/trade-analyzer/…` page in the top-level Trade Analyzer sidebar group. The general Analytics group belongs to Trade Journal. Keep the existing Analyzer URLs available for saved links.
- Use `/trade-analyzer` as the feature home and link to it and the analyzed-trade history from a dedicated Welcome card. Lead with manual execution entry in a trading account and use **Analyze trades** to submit one trade or a batch. Keep **To analyze** for saved trades awaiting analysis and **Your analyzed trades** for completed results. Open one trade's existing chart and Trade Analysis card at a time, with tabs to switch among trades in a small new batch.
- At first sign-in the existing flow automatically loads the Demo account and its trades. While Demo is active, open the Analyzer home on its saved demo analyses with one trade's chart and analysis in view. Use the shared **Viewing demo data** notice and clear action at the upper left of every Analyzer analysis page. The existing clear confirmation returns to Workspace onboarding. Once onboarding has a trading account ready, Trade Analyzer opens on manual entry.
- On the Analyzer home, show the **Explore Trade Analyzer with demo data** card at the upper left above the page title. Identify the August trades as samples for demonstration, point out the chart, entry and exit markers, and Trade Analysis card, and explain that users clear demo data before entering their own trades. Place the existing **Clear demo data and start fresh** action at the lower left of the card with space between the text and button. Keep the card specific to Trade Analyzer.
- Use saved Analyzer results from the selected account for the Analyzer reports and analyzed-trade history. Display any eligible-trade coverage count as coverage, with report metrics based on analyzed trades.

The sidebar checkpoint implemented the grouping for existing pages.
The feature link reads **Trade Analyzer**. **Trend & Momentum** has its own
multi-line chart icon, verified in the desktop sidebar and mobile drawer.

## Standalone Trade Analyzer implementation — November 17, 2026

- Scope QA confirmed that the existing manual-entry preview supplies a deterministic trade boundary per group and that the commit service queues each selected eligible group in the same transaction as the executions. Trade Analyzer uses those day-entry routes and the selected trading account. It keeps per-trade outcomes separate from the save receipt so saved executions are visible even when analysis cannot start.
- The home adds shared-date manual entry, To analyze, and one result at a time for saved executions, current analysis, or a new batch. A batch uses tabs for up to six trades and a picker for larger batches. The analyzed-trade history opens the exact trade in the new home. A connection failure during commit uses the existing receipt check before permitting another write.
- The same demo data and clear flow are used on the new home. Older Analyzer reports retain the shared demo notice, their separate plan gate, date filters, and candle-backed analysis population.
- The signed-in home menu keeps Trading Tools first and adds Trade Analyzer and analyzed history links. Sidebar navigation and the Trade Analyzer Help guide include the direct entry and analysis flow.
- Discord onboarding in this checkout defers Demo provisioning and preserves the initial account selection. The isolated Demo browser test used an active sample account to exercise the Analyzer’s Demo view. First-login account selection belongs to the existing Demo onboarding flow.
- Verification passed 37 focused tests covering dashboard structure, manual entry, Analyzer reads, and demo behavior. Isolated Chromium exercised Light desktop entry for one trade and a batch, exact saved prices, per-trade queueing, tab switching, selecting an existing trade in To analyze, and recovery after a lost commit response. Navy Dark mobile exercised the saved demo chart and Analysis card, trade selection, confirmation dialog, report notice, the history link into a saved analysis, and account isolation. The form also fit at 320 px. New requests were verified through their queued state with the market-data workers disabled. The full TypeScript check reports the existing missing `jsdom` declaration in `feature-page-embed-host.test.ts`.


## Integrated Home and Trade Analyzer QA

- Reproduced an overnight position appearing in To analyze after its closing execution was saved. The list now filters to complete day trades using the opening and final closing date in New York before pagination. A grouped trade stays eligible when only one member has an older analysis.
- Reproduced a saved trade with no action after its allowance request failed. Try again reloads the saved trade and rechecks its allowance before showing Analyze trade.
- Isolated Chromium passed both regressions. The 102-test focused suite covered routing, permissions, migration, manual-entry recovery, saved analysis, and Demo clearing. The full TypeScript check reported the existing `jsdom` declaration gap in `feature-page-embed-host.test.ts`.

### Saved indicator display

The saved-analysis notice explains unavailable indicator history without
asking traders viewing read-only samples to run another analysis. The Help
Center scopes **Refresh indicator history** to the trader’s own account. The
Trade Analyzer chart draws Session VWAP, EMA 9, EMA 20, and RSI 14 at one CSS
pixel.

Verified all four series settings and measured the rendered sample overlays
at one CSS pixel in desktop and mobile Chromium. Both views displayed the
saved-data notice. The focused Analyzer and dashboard suite passed 18 tests.

### Follow-up QA

- The trade picker used opening times rounded to the minute. It now formats the saved opening timestamp to the second in the selected account’s timezone, so trades in the same ticker and minute can be distinguished.
- The expanded 139-test suite included analysis selection, worker completion with synthetic market data, and retry behavior.
- Chromium verified a seven-trade mobile batch with fourteen executions, including two AAPL trades in one minute. The picker distinguished both and displayed the selected trade. Entry rejected a future date while preserving the draft. The overnight and allowance-retry regressions also passed again. Separate isolated cases verified Demo history and keyboard navigation, and that a lost save response can be recovered without another write.

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
