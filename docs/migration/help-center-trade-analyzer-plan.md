# Trade Analyzer Help Center Plan

**Status:** Owner-approved collection implemented; final integrated visual review pending.

**Progress:** [Trade Analyzer Help Center Progress](help-center-trade-analyzer-progress.md)

**Related plans:**

- [Help Center And Daily Trade Tracker Guides Plan](help-center-daily-trade-tracker-plan.md)
- [Trade Analyzer Analysis Pages Plan](trade-analyzer-analysis-pages-plan.md)
- [Moomoo Daily Trade Tracker Analyzer Plan](moomoo-daily-trade-tracker-analyzer-plan.md)

## Outcome

Add **Trade Analyzer** as its own expandable Help Center collection. Explain the
Analyzer as a reusable capability rather than treating it as a permanent
subsection of Daily Trade Tracker.

Daily Trade Tracker continues to explain how a trader reaches and uses the
Analyzer inside the daily journaling workflow. It links to the Trade Analyzer
collection for chart, metric, pattern, path and long-term analysis definitions.
The same collection can later serve a standalone Analyze a Trade surface and
Swing Trade Analyzer without duplicating articles.

## Help navigation

The Help Center left navigation adds one collapsible top-level collection:

```text
Trade Analyzer
  Overview
  Chart replay
  Entry & exit analysis
  Green-to-red analysis
  Candle patterns
  Day Trade Analysis
  Analyzed trades
  Data availability and limitations
```

Only the active Help collection expands automatically. The user can collapse it
to keep the Help navigation usable as more collections are published.

## Page and section Help-link contract

The Analyzer UI links directly into this collection:

- Every Analyzer page has one question-mark icon beside its page title that
  opens the complete matching article.
- Every distinct analysis section has another question-mark icon in the same
  top-right header position where possible.
- The section icon opens an exact stable anchor, not merely the article top.
- Each target section explains every result, fact, chart, table column,
  population, denominator, pagination control and unavailable state visible in
  that product section.
- Tooltip and accessible-label wording use **Help for [section name]**.
- The link opens the Help destination in a new browser tab on desktop and
  mobile so analysis filters, sorting and pagination remain untouched. It does
  not accidentally toggle an accordion or change product state.

Required Green-to-Red anchors include:

- `#profit-capture`;
- `#green-to-red-outcomes`;
- `#risk-management-behavior`; and
- `#supporting-trades` when that growing evidence table is published.

Equivalent exact anchors are required for every Entry & Exit, Candle Patterns,
Day Trade Analysis and Analyzed Trades section. Anchor identifiers are a public
Help contract: later copy edits do not silently rename or remove them.

## Routes

| Route | Article |
| --- | --- |
| `/help/trade-analyzer` | Collection overview |
| `/help/trade-analyzer/overview` | What the Trade Analyzer is and where it is available |
| `/help/trade-analyzer/chart-replay` | Candles, executions, indicators, timeframes and controls |
| `/help/trade-analyzer/entry-exit-analysis` | Individual, combined and long-term entry/exit results |
| `/help/trade-analyzer/green-to-red-analysis` | Profit protection, reversal, recovery and related statistics |
| `/help/trade-analyzer/candle-patterns` | Every detected pattern and pattern-result comparison |
| `/help/trade-analyzer/day-trade-analysis` | Landing page, filters, coverage and capability pages |
| `/help/trade-analyzer/analyzed-trades` | Evidence table, filters, sorting and pagination |
| `/help/trade-analyzer/data-availability` | Moomoo, timing, eligibility and factual limitations |

## Article 1: Overview

Explain:

- the difference between Trade Analyzer, Day Trade Analysis and ordinary
  historical Analytics;
- where the Analyzer is currently embedded in Daily Trade Tracker;
- that accurate execution dates, seconds, prices and quantities determine the
  chart and analysis;
- that the Analyzer uses saved broker/Journal executions and Moomoo candles;
- that an ordinary free Moomoo account can unlock supported chart-data access
  without opening a cash or margin trading account;
- that Moomoo execution importing is a separate capability requiring a real
  supported trading account;
- that analysis describes recorded outcomes and does not issue a signal; and
- which features currently support day trades, with Swing support clearly
  labelled future until implemented.

## Article 2: Chart replay

Explain every visible chart control and fact:

- candlestick open, high, low and close;
- candle volume and turnover;
- numbered buy/sell labels, exact anchors and execution details;
- the selected trade label and how another trade replaces it in the ticker's
  one chart;
- Session VWAP and timeframe-specific EMA 9;
- one-minute, five-minute, 15-minute and one-hour views;
- one-minute and five-minute written analysis versus higher-timeframe chart
  context;
- candle-pattern labels and key;
- hover/select details;
- plus/minus zoom, desktop Ctrl/Cmd-wheel zoom, ordinary page scrolling,
  mobile pinch zoom and horizontal movement; and
- why timeframe changes alter candles, EMA 9 and pattern results.

## Article 3: Entry & exit analysis

The article has clear Entry, Exit, Combined trade and Long-term results
sections.

### Individual execution analysis

Explain **View analysis** for every fill:

- exact execution time including seconds, shares and price;
- Entry versus Exit meaning for Long and Short trades;
- execution-candle location and precision;
- Session VWAP and EMA 9 distance in dollars and percentage;
- candle/session volume, relative volume and turnover;
- exact and preceding candle patterns;
- favorable and adverse movement after the fill;
- saved 5/15/30/60-minute paths where available; and
- why a one-minute candle cannot prove whether its high or low occurred before
  the fill.

### Combined analysis

Explain quantity-weighted combined entry and exit, actual Journal result,
holding time, MFE, MAE, giveback, partial exits and the difference between one
execution's response and the complete trade's path.

### Long-term Entry & Exit page

Explain every table/card field:

- execution occurrences versus distinct trades;
- opportunity-trade count;
- win rate;
- average return;
- average actual, potential and missed result;
- average/median favorable and adverse move per share;
- entry-time and holding-time cohorts;
- VWAP, EMA 9 and relative-volume buckets; and
- exit-giveback buckets.

Use separate stable anchors for **Entry opportunity and risk**, **Timing and
holding**, **Entry execution context**, **Exit execution context** and the
execution-evidence table. Each anchor explains all facts shown in that section.

## Article 4: Green-to-red analysis

Explain every single-trade status:

- Never green;
- Green and stayed above breakeven;
- Green to red, ended red;
- Green to red, recovered; and
- Green to red, ended flat.

Define every underlying statistic in plain language:

- first green and first red;
- peak calculated profit and time;
- peak-to-red and peak-to-final-exit reversal;
- first recovery and recovery time;
- actual result;
- strongest sustained completed-close opportunity;
- potential result and missed opportunity;
- average and median peak profit retained;
- add after the measured peak; and
- partial exit before the first move below breakeven.

The long-term section explains sample counts, win rate, average return, average
result, ended-red actual/potential/missed totals, recovery rate and the observed
add/scale-out comparisons. State clearly that comparisons do not prove
causation or prescribe an exit.

The article is divided into exact UI-matching Help sections:

- **Profit capture** explains actual result, potential result, missed
  opportunity, sustained opportunity, average/median peak profit retained,
  peak-to-exit giveback and peak-holding cohorts.
- **Green-to-red outcomes** explains every status, count, rate, duration,
  recovery and damage card/table result.
- **Risk-management behavior** explains add-after-peak and scale-out cohorts,
  their denominators and the non-causal interpretation.
- **Supporting trades** explains its filters, columns and pagination when the
  evidence table is published.

## Article 5: Candle patterns

Document all currently supported canonical patterns and update the article when
the detector inventory changes:

- Compression;
- Bullish and Bearish compression break;
- Bullish and Bearish engulfing shift;
- Bullish and Bearish expansion;
- Confirmed Hammer;
- Confirmed Shooting Star;
- Lower-wick and Upper-wick rejection; and
- Possible high-volume exhaustion.

For every pattern explain:

- what completed candle facts were observed;
- when confirmation becomes available;
- one-minute versus five-minute detection;
- exact execution candle versus one or two candles before execution;
- why after-execution patterns are excluded from entry/exit comparisons; and
- why a familiar-looking candle may correctly receive no label.

The long-term pattern-results section defines occurrence count, distinct-trade
count, opportunity-trade count, win rate, average return, average actual result,
potential result and missed opportunity. It also explains ranked-chart and
table pagination controls.

Provide exact anchors for the page summary, ranked chart, pattern-results table
and supported-pattern definitions.

## Article 6: Day Trade Analysis

Explain the lightweight landing page and its four capability destinations:

1. Entry & Exit;
2. Green-to-Red;
3. Candle Patterns; and
4. Analyzed Trades.

Define:

- analyzed eligible trades and all eligible trades;
- coverage percentage;
- analyzed executions;
- win rate versus average return;
- gross versus net basis;
- currency and date-range filters;
- total actual result;
- result at best sustained opportunities; and
- total missed opportunity.

Clarify that Day Trade Analysis uses saved Analyzer evidence rather than every
historical Journal trade.

Provide exact anchors for eligibility/coverage, overall results,
actual-versus-opportunity totals and the capability navigation cards.

## Article 7: Analyzed trades

Explain each evidence-table column and control:

- ticker, direction, close date and executions;
- actual P/L and return;
- sustained opportunity, potential result and missed opportunity;
- captured percentage and peak-to-exit time;
- Green-to-red status;
- ticker/outcome filters and sortable headings;
- **Results per page**, `Showing X-Y of Z`, Previous and Next; and
- **View day** as the link to the exact Daily Trade Tracker replay.

Explain that filters and sorting apply before pagination and that changing a
filter returns the table to its first page.

Provide exact anchors for the filters, trade table, opportunity columns and
pagination controls even when those subjects share one article.

## Article 8: Data availability and limitations

Explain:

- the current Moomoo market-data connection and saved server-side candle reuse;
- execution imports as a separate broker permission;
- same-day analysis and the exit-plus-60-minute completion window;
- the one post-session reconciliation after Moomoo finalizes candles;
- supported U.S. premarket, regular-session and after-hours coverage;
- the current overnight-session exclusion;
- incomplete, pending and unavailable analysis states;
- the intraminute high/low sequence limitation;
- paid eligibility and retained access to completed analysis after cancellation;
- older historical imports remaining in Journal/ordinary Analytics without
  entering Analyzer coverage; and
- the undecided initial lookback period, which must not be stated as 30 days or
  another value before the Moomoo test-account decision.

## Pagination documentation standard

Whenever a Help article describes a growing result surface, it explains:

- where the top-right **Results per page** selector appears;
- the available page sizes for that surface;
- that cards and summary calculations describe the full filtered population,
  not only the current page;
- how search/filter/sort interact with paging;
- why fixed summary tables and time-series charts do not paginate; and
- how ranked charts use top-N or synchronize with a supporting table instead.

Screenshots are added only after the corresponding UI has owner approval so
the Help Center does not preserve obsolete layouts.

## Daily Trade Tracker Help revisions

Daily Trade Tracker remains a complete workflow guide. It does not duplicate
the full Analyzer reference.

### Collection overview

- Keep executions, trades, ticker cards, notes, tags, rules, open positions and
  Mark day reviewed as Daily Tracker responsibilities.
- Describe chart replay and analysis as the embedded Trade Analyzer capability.
- Link to the Trade Analyzer overview and Data availability articles.

### Guide 3: Review trades and executions

- Keep trade selection, multi-trade ticker behavior, execution rows, **View
  analysis**, **Combined overview** and the selected chart behavior.
- Retain a short explanation of Entry/Exit and Green-to-red placement.
- Replace duplicated metric definitions with direct links to **Entry & exit
  analysis** and **Green-to-red analysis**.

### Guide 4: Charts and trade analysis

- Rename the guide to **Chart replay and Trade Analyzer** when the new
  collection publishes.
- Keep instructions specific to using the chart inside Daily Trade Tracker.
- Link detailed chart/indicator definitions to **Chart replay** and detected
  pattern definitions to **Candle patterns**.
- Link long-term result comparisons to **Day Trade Analysis** rather than
  describing them as Daily Tracker features.

### Guide 6: Data timing and limitations

- Keep same-day readiness, 60-minute completion, post-session reconciliation
  and Moomoo connection instructions because they affect the Tracker workflow.
- Link the reusable evidence/eligibility explanation to **Data availability and
  limitations**.
- Do not claim or advertise a historical lookback value until it is approved.

### Cross-links and search

- Trade Analyzer articles link back to the relevant Daily Tracker workflow
  steps and exact replay page.
- Daily Tracker articles link to exact Analyzer article anchors rather than only
  the collection landing.
- Help search indexes both collections and uses aliases such as MFE, MAE,
  missed profit, left on the table, scaling out, VWAP, EMA 9 and Green-to-red.
- Search results never imply that ordinary historical Analytics and paid Trade
  Analyzer coverage use the same population.

## Writing standard

- Define the user-facing purpose before explaining the calculation.
- Use plain trading language and short examples.
- Separate actual money earned/lost from potential or missed opportunity.
- Separate win rate from return percentage.
- Label per-share price movement as per-share movement, not whole-trade money.
- Include sample size and unavailable states.
- Do not use internal database, revision, queue or entitlement codes.
- Do not make predictive, causal or advisory claims.

## Implementation sequence

1. Add the Trade Analyzer collection metadata, overview and collapsible Help
   navigation entry.
2. Publish Overview and Chart replay.
3. Publish Entry & exit, Green-to-red and Candle patterns.
4. Publish Day Trade Analysis, Analyzed trades and Data availability after the
   split product pages are visually accepted.
5. Revise the three Daily Tracker articles and add exact cross-links.
6. Update Help search records and verify every route/anchor.
7. Complete desktop/mobile owner review before committing the Help slice.

## Acceptance

- Every current chart, Analyzer control, single-trade statistic and long-term
  page statistic has a plain-language definition.
- Daily Tracker workflow guidance remains complete without duplicating the
  Analyzer reference library.
- The Help left navigation stays usable with the new collapsed collection.
- Search opens the exact relevant section.
- Every product question-mark Help link resolves to its intended published
  article and exact anchor, and every linked section explains all visible facts
  in its matching product section.
- Desktop and mobile tables, anchors, collection navigation and pagination
  explanations are reviewed.
- The final commit contains only the approved Help collection, Daily Tracker
  guide revisions and controlling documents.
