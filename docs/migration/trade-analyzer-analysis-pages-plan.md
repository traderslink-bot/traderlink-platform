# Trade Analyzer Analysis Pages Plan

**Status:** Owner-approved implementation complete; final integrated visual review pending.

**Progress:** [Trade Analyzer Analysis Pages Progress](trade-analyzer-analysis-pages-progress.md)

**Related plans:**

- [Daily Trade Analyzer Long-Term Analytics Plan](daily-trade-analyzer-long-term-analytics-plan.md)
- [Moomoo Daily Trade Tracker Analyzer Plan](moomoo-daily-trade-tracker-analyzer-plan.md)
- [Trade Analyzer Help Center Plan](help-center-trade-analyzer-plan.md)

## Outcome

Move saved Trade Analyzer results out of the generic historical Analytics
collection and into an expandable **Trade Analyzer** product group. Replace the
single growing Trade Analysis page with a lightweight **Day Trade Analysis**
landing page and four focused capability pages.

The Trade Analyzer remains embedded in the Daily Trade Tracker for same-day
trade review. These pages are the long-term view over saved eligible Analyzer
results; they are not a second Journal analytics engine and do not analyze all
historical imports.

## Naming and navigation

The permanent naming contract is:

- **Trade Analyzer**: the complete capability family, including chart replay,
  entry/exit analysis, Green-to-red analysis, candle patterns and saved-result
  comparisons.
- **Day Trade Analysis**: the landing page for long-term results from eligible
  analyzed day trades.
- **Swing Trade Analysis**: a future, separate evidence population with
  swing-appropriate timeframes and measurements.

The dashboard receives one collapsible left-navigation group:

```text
Trade Analyzer
  Day Trade Analysis
  Entry & Exit
  Green-to-Red
  Candle Patterns
  Analyzed Trades
```

The group stays collapsed when the user is elsewhere, opens automatically on a
Trade Analyzer route and highlights the current page. It is separate from the
existing historical **Analytics** group because the Analyzer has its own paid
eligibility and market-data boundaries.

## Routes

| Route | Job |
| --- | --- |
| `/analytics/trade-analyzer/day` | Day Trade Analysis landing page |
| `/analytics/trade-analyzer/day/entry-exit` | Entry and exit behavior |
| `/analytics/trade-analyzer/day/green-to-red` | Profit protection, reversal and recovery behavior |
| `/analytics/trade-analyzer/day/candle-patterns` | Observed candle-pattern results |
| `/analytics/trade-analyzer/day/trades` | Searchable analyzed-trade evidence |

The current `/analytics/trade-analysis` route is transitional. After the new
pages are accepted, it redirects to `/analytics/trade-analyzer/day` so saved
links do not break.

## Shared page contract

Every page uses the same selected account, date range, currency partition,
gross/net basis and Analyzer eligibility boundary. Changing a shared filter
changes every card, chart and table on that page. Money from different
currencies is never added together.

Every page shows:

- a plain analyzed/eligible coverage statement;
- sample counts beside rates and averages;
- `N/A` when a denominator or required fact is unavailable;
- observed historical results rather than predictions or instructions; and
- a link to the applicable Help Center guide.

## Contextual Help contract

Every Trade Analyzer page and every distinct analysis section has contextual
Help:

- A question-mark icon in the page-title row links to the complete Help article
  for that capability page.
- A question-mark icon in each section-title row links to the exact Help anchor
  for that section.
- The icon stays in the same top-right section-header location wherever the
  layout permits. Responsive layouts preserve the relationship between the
  title and icon rather than moving Help into an unrelated footer.
- The icon has a visible tooltip and an exact accessible label such as **Help
  for Profit capture**.
- Help navigation must not toggle, sort or expand the underlying analysis
  section accidentally. In an accordion header, the Help control is separate
  from the accordion toggle.
- The Help destination opens in a new browser tab so the analysis filters,
  sorting and pagination remain untouched. Every Analyzer Help link uses this
  same behavior on desktop and mobile.
- If a section is hidden because no evidence exists, any visible unavailable
  state still links to the section that explains the missing-fact rule.

Examples:

| Analysis surface | Help destination |
| --- | --- |
| Green-to-Red page title | `/help/trade-analyzer/green-to-red-analysis` |
| Profit capture | `/help/trade-analyzer/green-to-red-analysis#profit-capture` |
| Green-to-red outcomes | `/help/trade-analyzer/green-to-red-analysis#green-to-red-outcomes` |
| Risk-management behavior | `/help/trade-analyzer/green-to-red-analysis#risk-management-behavior` |
| Entry opportunity and risk | `/help/trade-analyzer/entry-exit-analysis#entry-opportunity-risk` |
| Timing and holding | `/help/trade-analyzer/entry-exit-analysis#timing-holding` |
| Candle-pattern results | `/help/trade-analyzer/candle-patterns#pattern-results` |
| Analyzed Trades table | `/help/trade-analyzer/analyzed-trades#trade-table` |

Each linked Help section defines every card, table column, chart, status,
population, denominator, result-per-page control and `N/A` state shown in the
corresponding product section. A general article introduction is not sufficient
for a section-level Help link.

## Day Trade Analysis landing page

The landing page is an orientation and summary, not another long report. It
shows:

- analyzed eligible trades, eligible trades and coverage percentage;
- analyzed execution count;
- win rate, average return and average actual result;
- total actual result, total result at measured sustained opportunities and
  total missed opportunity; and
- four capability cards linking to Entry & Exit, Green-to-Red, Candle Patterns
  and Analyzed Trades.

The landing page has no long tables and no pagination.

## Entry & Exit page

This page owns long-term comparisons derived from saved entry, add, partial-exit
and final-exit snapshots:

- entry opportunity and risk, including average/median MFE and MAE per share;
- entry-time and total-holding-time groups;
- Session VWAP, timeframe-specific EMA 9 and relative-volume context;
- execution-candle location and precision where supported;
- exit giveback from the best prior favorable completed-candle price;
- volume and turnover comparisons where their exact saved facts support them;
- combined-trade versus execution-occurrence population labels; and
- an optional execution-level evidence table when individual occurrences are
  useful to inspect.

Fixed five-row buckets do not paginate. A growing execution-evidence table does.

## Green-to-Red page

This page owns profit capture and profit-protection behavior:

- never green, stayed green, Green-to-red ended red, recovered and ended flat;
- total actual result, potential result and missed opportunity for ended-red
  trades;
- average and median peak profit retained;
- peak-to-red and peak-to-final-exit reversal;
- time from first green to first red;
- recovery rate and average recovery time;
- adding after the measured peak; and
- partial exit before the first move below breakeven.

The page reports correlation only. It never claims that adding, holding or
scaling out caused an outcome. Fixed status and behavior cohorts do not
paginate. A growing supporting-trades table does.

## Candle Patterns page

This page owns saved observed pattern comparisons:

- one-minute and five-minute timeframes;
- entry versus exit executions;
- exact execution candle versus one or two completed candles before execution;
- occurrence count and distinct-trade count;
- win rate, average return, average result, potential result and missed
  opportunity where supported; and
- the canonical plain-language pattern name and definition.

Patterns after an execution remain excluded. Every result states that a
completed pattern is an observation, not a prediction or trading signal.

The ranked pattern chart and pattern table share the same filters and selected
result slice. The table paginates when the grouped result count exceeds one
page.

## Analyzed Trades page

This page is the complete evidence list behind the other pages. Each row can
show:

- ticker, direction, close date and execution count;
- actual result and return percentage;
- strongest sustained opportunity, potential result and missed opportunity;
- peak profit retained and peak-to-exit time;
- Green-to-red outcome;
- current Analyzer revision/availability state in plain language; and
- a link to the exact Daily Trade Tracker replay.

It supports ticker search, outcome filters and sorting without changing the
underlying facts.

## Pagination and growing-result controls

Pagination is required for growing result collections, not for every visual.

### Standard table behavior

- The top right of a paginated result surface shows **Results per page**.
- Standard choices are `10`, `25`, `50` and `100`; the default is `25`.
- The surface shows `Showing X-Y of Z` plus accessible Previous and Next
  controls.
- Search, filters, sort, date range, currency and money basis are applied
  before pagination. A changed search/filter resets the surface to page 1.
- Page and page-size state use URL search parameters when it is useful to keep
  a filtered view shareable or restorable.
- Large collections use bounded server reads. The client does not receive an
  unlimited account history merely to paginate it locally.
- If the complete result has 10 or fewer rows, the page-size selector and page
  controls are hidden.

### Charts and cards

- Time-series charts use date range, zoom and timeframe controls; they are not
  split into artificial pages.
- Ranked categorical charts use a top-N/result-count selector or the same
  paginated slice as their supporting table.
- Fixed metric cards, status cohorts and capability cards never paginate.
- A dynamic card collection paginates only when it grows beyond a useful
  single-screen set; its top-right selector uses display-appropriate choices
  rather than table defaults.
- Pagination never changes the denominator used by a card, rate or average.
  Summary calculations always describe the complete filtered population.

### Page-specific pagination

| Surface | Pagination |
| --- | --- |
| Day Trade Analysis summary and capability cards | No |
| Entry/Exit fixed context and timing cohorts | No |
| Entry/Exit execution evidence table | Yes, default 25 |
| Green-to-red fixed outcomes and behavior cohorts | No |
| Green-to-red supporting-trades table | Yes, default 25 |
| Candle-pattern ranked table | Yes when over 10 rows, default 25 |
| Analyzed Trades table | Yes, default 25 |

## Paid eligibility and retained access

Keep the eligibility model deliberately small:

1. Coverage is `analyzed eligible trades / all eligible trades`.
2. Older Journal imports outside the user's Analyzer eligibility period do not
   enter either number.
3. A trade without the supported facts required for analysis is not eligible;
   the UI gives a short reason when that distinction matters.
4. An active paid entitlement is required to create a new analysis.
5. A completed analysis created while entitled remains readable after the user
   stops paying.
6. Import date does not make an old trade eligible.
7. The initial historical lookback length remains undecided until it is tested
   later with the owner's Moomoo test account. Do not hardcode or advertise a
   value before that test.

The local test account should eventually show 14 of 14 when its test eligibility
period covers the 14 saved analyses. It must not infer 14 of 14 merely from the
fact that 14 analyses already exist; the test needs an explicit eligibility
boundary.

## Swing-trade expansion

Swing trades do not join the day-trade population. A future Swing Trade
Analysis landing mirrors the capability navigation but uses swing-appropriate
holding periods, multi-session opportunity/risk, gaps and higher timeframes.
Shared UI and read-model utilities may be reused; evidence and aggregates stay
separate.

When Swing support is added, the left navigation can show **Day Trade Analysis**
and **Swing Trade Analysis** as the two landing destinations, with capability
navigation inside the selected landing. Do not add ten flat sidebar links.

## Implementation sequence

1. Preserve the accepted current page as the factual reference implementation.
2. Add the Trade Analyzer navigation group and new route shell.
3. Build the Day Trade Analysis landing from the existing read model.
4. Move Entry/Exit, Green-to-Red, Candle Patterns and Analyzed Trades into their
   focused pages without changing calculations.
5. Add bounded pagination only to the growing tables defined above.
6. Keep the eligibility denominator unavailable until the entitlement source
   and Moomoo lookback decision are available; do not infer it from saved
   analyses or all historical Journal trades.
7. Redirect the transitional route after the owner approved completing the
   full revised page family as one final-review checkpoint.

## Verification and acceptance

- Account isolation, current Analyzer revision matching, exact Journal result
  reconciliation and currency separation remain mandatory.
- Page totals and rates describe the complete filtered population, not only the
  current table page.
- Pagination has no duplicates or skipped rows under a stable sort and bounded
  cursor/order contract.
- Desktop and mobile review covers navigation expansion, empty/small/large
  result states, page-size selection and return to the correct Tracker day.
- Every page and section question-mark icon resolves to a published Help route
  and exact stable anchor; no icon lands only at the Help Center start page.
- Help icons remain consistently positioned and keyboard/touch accessible
  without triggering another section control.
- Each page requires owner visual approval before the current combined page is
  retired.
- Do not run Vitest during the active UI-design cadence.

## Deliberately deferred

- The production historical lookback duration.
- Swing Trade Analyzer calculations and pages.
- Predictive scores, trade signals or prescriptive exit recommendations.
- Cross-currency totals.
- An unlimited historical Analyzer backfill.
