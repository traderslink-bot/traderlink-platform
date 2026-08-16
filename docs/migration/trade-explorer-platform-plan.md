# Trade Explorer Plan

**Status:** Explorer 1 truthful-ordering correction implemented and tenth-pass
QA complete with the tenth pass finding no new Trade Explorer issue; owner
visual/product review remains. The owner approved construction
of the real trade-exploration workspace on 2026-08-04 and approved the truthful
Trades ordering plus trade-review workflow direction on 2026-08-16. This plan remains
the full target; controls appear only when they execute against accepted Trade Tracker
facts. Future session and analyzer fact contracts still require their own review
before their Explorer controls are enabled.

**Progress:** [Trade Explorer Progress](trade-explorer-platform-progress.md)

## 1. Outcome

Trade Explorer will be Trade Tracker's completed-trade exploration workspace. A
trader will filter completed trades, choose a metric, inspect the actual trades
that produced the result and save useful views for later. Period comparison is
a separate optional tool rather than the page's primary purpose.

It is deliberately not a second analytics engine, a V3 port, or a page of
generic charts. It is a clear, practical place to answer questions such as:

- Which tickers, entry times, holding periods, position sizes, or directions
  have actually worked best for this account?
- How do day trades compare with multi-day completed trades when intentionally
  selected as separate groups?
- Does a setup, tag, rule result, time range, or combination of conditions
  have enough confirmed trades to be meaningful?
- Which exact trades make up a result so the trader can review the evidence
  rather than trust a black-box statistic?

The finished feature should show everything the accepted Trade Tracker facts can
support. It must not hold back a useful calculation merely because it is more
advanced, but it must never invent a value, combine incompatible populations,
or make a thin sample look conclusive.

## 2. Non-negotiable data rules

1. The server derives the active Platform user, workspace and Journal account.
   Browser input never chooses another user's account or supplies raw internal
   identities.
2. The Explorer reads the canonical Journal ledger through Journal Analytics.
   Imported executions, manual executions and accepted corrections are one
   population. How a row entered the Journal is not a user-facing Explorer
   filter or label; V3 data, V3 services and sample data are not runtime
   inputs.
3. Realized trade statistics use only `ready_closed` round trips. Confirmed
   open positions are visible only in an explicitly separate open-position
   context and never enter realized P/L, win rate, expectancy or profit factor.
4. A Data Decision contains only the affected dependent trade/metric. It never
   makes unrelated confirmed trades disappear. The interface does not repeat
   internal explanations of this rule: the selected filters define what the
   trader is viewing, and a short `N/A` appears only when that specific result
   cannot be calculated. Trader attention items remain on Data Decisions, not
   in Trade Explorer.
5. All financial and quantity math remains exact on the server. Trader-facing
   monetary values display with at most two decimal places; counts display as
   whole numbers; percentages, ratios and time display in useful normal form.
   `N/A` means a calculation cannot be made honestly and is never replaced by
   zero.
6. Comparisons cannot mix currencies in a money result. The user must choose
   one currency for a money comparison, or the page offers counts/percentages
   only with a clear multi-currency label.
7. Every visible comparison is reproducible: its filters, money basis,
   account scope, as-of point and capability version are preserved with the
   saved study. A later data correction creates a refreshed result; it does not
   silently rewrite the saved study's recorded parameters.

## 3. What the Explorer will show

### 3.1 First user-facing draft: pages and views

The Explorer is one workspace with these views. They use the same selected
account and filters, so the trader does not have to rebuild a search while
moving between them.

| View | What the trader sees and does |
| --- | --- |
| **Explore** | Filter completed trades, choose a metric and inspect the actual matching trades. This is the default view. |
| **Compare** | Build two to four named periods and see their key results side by side. This is separate and optional. |
| **Breakdowns** | Split the selected trades by ticker, weekday, entry time, market session, hold time, size, direction, day-trade status, result, tag, setup or supported rule result. Ticker is a central way to focus and explore trades, but not the default period-comparison axis. Sort each result column to find the strongest and weakest groups. |
| **Trades** | A filterable evidence list of every completed trade behind the current comparison. Open a trade to see its executions, tags, notes and available analyzer observations. |
| **Timeline** | Completed-trade and daily P/L views across the selected period, with selectable date ranges and the ability to open the exact day or trade. |
| **Sessions** | Compare pre-market, regular-hours and post-market entries/exits. This is a focused view of the session filters and time-of-day results, not a separate calculation system. |
| **Patterns** | Compare saved tags, setups, rule results and—when available—stored entry/exit analyzer observations. It never guesses a pattern that was not saved or observed. |
| **Saved studies** | Reopen a named comparison with its original filters, groups and selected basis. A saved study is private to the selected trading account. |

The first implementation organizes results into factual table families rather
than forcing unrelated metrics into one table: Trades, Trading Days, Tickers,
Entry Times, Holding Time, Position Size and Periods. Each family owns its
labels, columns and useful sort choices. Day-path metrics such as red-to-green
and green-to-red appear only in Trading Days. The unfinished comparison builder
is withheld from this first draft and will return as a separate feature after
the Explorer views are accepted.

The approved Trades correction separates individual-trade ordering from group
statistics. Trades defaults to all directions with the most recently closed
trade first. Its `Sort trades` choices may order only factual row values such as
close time, P/L, return, holding time, shares and entry value. Profit factor,
win rate, averages, medians and expectancy remain clearly labelled summaries of
the selected population; they never pretend to rank one trade. Winning, losing
and flat trades remain explicit Result filters rather than hidden side effects
of a statistic choice. Grouped views use `Rank by` only where the selected
statistic can truthfully order the returned groups.

The first screen should be compact: date, ticker, metric and other primary
filters followed immediately by the actual matching-trade list. Advanced
controls open only when the trader chooses them. Period comparison is a
separate optional section below the Explorer results. There is no visible
execution-origin filter and no repeated data-integrity language.

### 3.2 Study builder

A study starts with a base population of completed trades, then adds two to
four named comparison groups. A group can be built from one or several of the
following confirmed Trade Tracker facts:

| Area | Available comparison choices |
| --- | --- |
| Time | closed date range, month, week, year, entry weekday, entry-time bucket, holding-duration range |
| Market session | entry session and exit session: pre-market, regular hours, post-market or a trade that crossed sessions |
| Instrument | ticker/instrument, direction, currency, selected trading account |
| Trade shape | automatically derived day trade or other completed trade, entered quantity, maximum position size, entry value, holding-duration buckets |
| Result | win/loss/flat, gross or net basis, P/L range |
| Trade review | tags, setups, trade notes present, day review state, and rules only when their saved meaning makes the comparison factual |
| Market analysis | entry/exit snapshots, candle observations and supported candle types only where a saved normalized analysis snapshot exists |

The initial screen must make common comparisons easy without forcing a trader
to learn filters:

- Month versus month, year versus year and later custom date range versus date
  range comparisons are the primary Explorer use case.
- Ticker is a primary search, filter and breakdown. Ticker versus ticker may
  be useful later, but is not the default comparison.
- Morning versus later entry-time periods.
- Pre-market versus regular-hours versus post-market entries or exits.
- Fast exits versus longer holds.
- Long versus short.
- Day trades versus other completed trades, when the trader deliberately wants
  that comparison.
- Tag/setup/rule-result groups, once those facts have enough supported data.

The trader can name groups in plain terms (for example, “First 30 minutes” and
“After 10:30”). The server stores the normalized factual filters, not the
display name as authority.

### 3.3 Comparison summary

Every group receives the same compact scorecard so no group is favored by a
different calculation. The default scorecard contains:

- completed trades, wins, losses and flat trades;
- gross P/L, net P/L, fees and the selected gross/net result basis;
- win rate, average trade, median trade, average winner, average loser,
  median winner and median loser;
- largest winner, largest loser, profit factor, expectancy and win/loss ratio;
- total P/L by completed trading day, average and median daily P/L, green/red
  day counts and best/worst day;
- average and median holding time, average entry time and entry-time
  distribution;
- average and median entered quantity, maximum position and entry value;
- trade count and a short `N/A` reason only when the selected calculation is
  unavailable.

The comparison itself shows the absolute result for each group plus a clearly
labeled difference and percentage difference where a percentage is meaningful.
No percentage difference is shown when the baseline is zero or unavailable.
The page may show a compact “small sample” label where it helps the trader
interpret a comparison, but does not hide a valid statistic or turn the screen
into warnings. The exact threshold and wording are a UI-review decision.

### 3.4 Breakdowns and distributions

The Explorer will let the trader split the selected population by one
dimension at a time and compare the resulting groups using the same scorecard.
Supported breakdowns initially reuse the accepted Journal Analytics dimensions:

- ticker;
- close day, week, month and year;
- entry weekday and time bucket (5, 15, 30 or 60 minutes);
- long/short direction;
- day-trade status;
- holding-duration bucket;
- entered-quantity, maximum-position and entry-value bucket;
- win/loss/flat result; and
- entry session and exit session once the exchange-session contract is added.

The page also provides useful visual summaries when they clarify a comparison:

- P/L over time, with completed-trade and daily-result views;
- win/loss distribution;
- holding-time distribution;
- entry-time heat map by weekday/time bucket;
- ticker leaderboard with sortable consistent metrics;
- cumulative realized P/L for the selected population; and
- a scatter/distribution view of selected supported pairs such as size versus
  result or holding time versus result.

Charts are helpers, not a second source of truth. Each chart has a matching
table or accessible details list; no chart is created for a measure that the
Trade Tracker cannot calculate honestly.

### 3.5 Trade evidence and drill-down

Every card, table row and chart selection can open its evidence list without
losing the current study. The evidence view includes the closed trade's ticker,
direction, close date/time, entry and exit summary, execution count, holding
time, quantity, gross P/L, net P/L, fees when known, tags/rules/notes that the
trader is allowed to see, and a route to the relevant Trade, Calendar or
Tracker detail when that route exists.

The detail view may reveal execution rows on demand. It never exposes raw
broker-statement rows, private statement filenames, broker account identifiers
or another account's data. Evidence pagination is server-bounded and uses
opaque cursors.

### 3.6 Analyzer-backed comparisons

The Daily Trade Tracker analyzer is a separate, currently paused Yahoo-backed
feature. Explorer does not wait for it and does not request market data itself.
When normalized saved analysis snapshots become available, the Explorer can
add a clearly separated “Entry and exit analysis” area covering only the
snapshots actually present, including:

- entry/add/partial-exit/final-exit count and coverage;
- supported price, volume, VWAP, EMA and RSI observations at each saved event;
- selected small-cap candle-pattern observations; and
- post-exit 5/15/30/60-minute outcomes where the stored analysis has coverage.

This area shows a simple analyzed-trade/event count only when that context is
helpful. It never claims that an absent snapshot means a condition did not
occur, sends an on-demand Yahoo request, grades a trade, or converts a market
observation into a trader's intent, tag or rule result.

## 4. Deliberate separation of populations

The comparison controls must make these distinctions obvious:

| Population | Use in Explorer |
| --- | --- |
| Confirmed completed round trips | Default and primary comparison population. |
| Day trade | Automatic factual classification: opened and closed on the same account trading date. It is not a statement about intention. |
| Other completed trade | A completed trade that did not open and close on the same trading date. This is a factual timing counterpart, not an intentional swing label, and need not be shown unless the trader selects it. |
| Intentional swing / long-term / bag-holding state | Trader-authored open-position classification. It may be filtered or shown as context only after a closed-trade history contract is confirmed; it never turns an open position into realized performance. |
| Legitimate open position | Separate inventory view only, with no realized comparison metrics. |
| Needs Decision / excluded / superseded | Never used as a completed-trade metric. They remain in Data Decisions and are not presented in Trade Explorer. |
| Unresolved market-analysis snapshot | The trade remains in normal Trade Tracker comparisons; it is excluded only from the related analyzer statistic. |

This prevents the confusing comparison of active swings against day trades
while still allowing a trader to make a deliberate completed-trade study later.

## 5. User experience and routes

1. Add a canonical Platform route under `/analytics/trade-explorer` and a
   clear “Trade Explorer” item under Trades. The preserved legacy
   `/intelligence/analytics/trade-explorer` redirect may point to this route
   once the replacement page is accepted; until then it continues to point to
   `/analytics/lab`.
2. Preserve the approved light Material dashboard shell. The page has one
   clear title, a compact filter/study bar, comparison groups, scorecards,
   breakdowns and evidence. It must remain usable on mobile by stacking cards
   and using an intentional details panel rather than horizontal overflow.
   The completed-trade table keeps its useful financial columns compact, using
   `Avg entry`, `Avg exit` and `Entry value` labels with tighter cell spacing.
   Notes, tags and rules do not become additional data columns. A narrow Review
   action opens a right-side trade-review panel on desktop and the same editor
   as a full-screen sheet on mobile. Previous/next controls support reviewing
   many matching trades without returning to the top of the page. Existing
   execution detail remains separately available from the trade row.
3. Start with an understandable empty state: “Add completed trades to compare
   results here.” It does not show fixtures or sample comparisons.
4. Explain only the immediate value of a control in trader language. Avoid
   engine, eligibility, internal state and code language.
5. Allow saved named studies using the accepted Analytics saved-view ownership,
   versioning and account scope where the existing strict query contract can
   represent them. Comparison-group persistence may require an additive
   versioned schema/contract; it must not squeeze arbitrary Explorer JSON into
   the existing Lab view shape.
6. Provide a concise export/share-ready table for a study only after a
   privacy, account-scope and exact-value export contract is approved. It is
   not part of the first interactive Explorer UI.

## 6. Technical design

### 6.1 Reuse before new computation

The initial service composes the existing `JournalAnalyticsService`, metric
registry, exact accumulator, normalized fact reader and opaque evidence
pagination. It must not duplicate decimal math or rebuild Journal round trips.

The requested Explorer contract will contain:

- a base normalized Analytics query;
- two-to-four validated comparison group filters;
- selected money basis and one-currency restriction for money metrics;
- selected metric/breakdown/chart identifiers from a strict allowlist;
- opaque expected account-selection reference and as-of timestamp; and
- bounded evidence table page/cursor state.

The server validates that each group is a strict narrowing of the base
population, derives account/workspace/user scope, calculates every group using
the same capability registry, and returns the internal calculation-state record
needed for accurate display. The client can never provide SQL, an arbitrary
metric formula, direct UUIDs, broker statement rows or another account ID.

### 6.2 New facts and capabilities

No schema change is required for the first Explorer if it only presents current
Journal Analytics facts and saved views. New facts require their own reviewed
Journal/Analytics contract before they become filterable or comparable:

- stable tag/setup and rule-evaluation links to a completed trade;
- completed review/day-context facts with a defined relationship to a trade;
- entry and exit market-session classification using the relevant exchange
  calendar, including early closes and non-trading days;
- analyzer snapshot indexes and coverage records;
- closed-trade lifecycle classification from intentional open-position states;
- exports, sharing, scheduled reports or AI summaries.

Adding a UI filter is never permission to infer the missing fact. A proposed
filter remains disabled with a concise explanation until its data contract,
storage, backfill policy and verification are accepted.

### 6.3 Performance and cost

- Initial responses are server-composed, bounded by existing group and evidence
  limits, and calculate only selected metrics rather than all possible charts.
- Breakdowns and evidence details load on demand; repeated queries may use a
  short account-scoped cache only when the cache key includes normalized query,
  as-of point, capability version and data-revision marker.
- No Explorer request triggers Yahoo, a candle download, an AI call or any
  external provider request.
- Larger accounts use server pagination, pre-approved aggregate read models or
  indexed Journal facts. Any material persistence/rollup change requires an
  explicit migration, recovery rehearsal and reconciliation against the exact
  base query before use.

## 7. Complete delivery sequence

### Explorer 1 — contract and factual core

1. Audit the active Journal Analytics query/metric registry against this plan,
   including which metrics/breakdowns are already complete, conditional or
   unavailable.
2. Define strict comparison-group request/result contracts, concise unavailable
   states, capability mapping and exact comparison arithmetic.
3. Implement the server-only comparison service and focused contract tests,
   including account isolation, mixed currency, zero denominator, contained
   Data Decisions, exact decimal and no-V3/no-sample rules.

### Explorer 2 — usable exploration workspace

1. Build `/analytics/trade-explorer` in the approved shell.
2. Add the filter builder, metric selector, actual matching-trade list and
   evidence drill-down, with period comparison kept as a separate optional
   section.
3. Correct the Trades contract so all directions/newest-first is the default,
   individual rows receive only truthful server-side sort choices and grouped
   statistics rank only factual groups.
4. Obtain owner visual approval before adding the trade-review editor, more
   controls or charts.

### Explorer 3 — advanced studies and saved work

1. Add up-to-four groups, named comparisons, comparison deltas, sorting,
   chart/table views and versioned saved studies.
2. Add the approved completed-trade Review panel over the existing stable
   round-trip note, tag and trade-rule-review contracts. Custom trade rules may
   be marked Followed, Broken or Not reviewed; deterministic preset results
   remain factual and read-only. Add other Journal facts only after their own
   accepted contract.
3. Prove saved study ownership, optimistic update behavior, immutable history
   and that a saved study refreshes visibly rather than silently changing its
   definition.

### Explorer 4 — analyzer-backed study area

1. Resume only after the Yahoo analyzer's coverage/data quality is accepted.
2. Add saved-snapshot filters/breakdowns, simple analyzed-event counts where
   useful and evidence links.
3. Confirm no Explorer route creates provider work or makes a claim beyond
   saved observations.

### Explorer 5 — accessibility, scale and final acceptance

1. Verify keyboard/mobile use, readable tables, chart alternatives and concise
   `N/A` states.
2. Run the agreed focused performance/reconciliation checks against a private
   read-only dataset and a scale fixture.
3. Complete owner browser/product review of empty, small, large, one-currency,
   multi-currency, unresolved-decision and analyzer-partial-coverage states.

## 8. Acceptance criteria

The Trade Explorer is ready only when all of the following are true:

- A trader can create and compare at least two named groups of their own
  confirmed completed trades without entering a raw query.
- Each scorecard, table and chart follows the selected filters and displays
  only metrics supported by those facts, without repetitive internal notes.
- Every metric can be traced to the contributing completed trade list; exact
  values reconcile to the Journal Analytics result for the same filter.
- Clicking a trade row reveals that trade's executions directly beneath it.
  Only one trade is expanded at a time, and clicking the expanded row closes
  it without navigating away from the Explorer.
- Unresolved trades, open positions, missing fees, multi-currency money values
  and incomplete analyzer snapshots are contained with concise `N/A` behavior,
  not silently made into zeroes or misleading comparisons.
- Manual, broker and corrected executions remain part of one authorized
  account-scoped ledger without being separated into user-facing categories.
- No V3 import, V3 database access, sample data, external market-data call or
  AI request is on the Explorer path.
- The light Material UI is visually approved by the owner on desktop and
  mobile; its data and interactions are also browser-verified.

## 9. Explicitly out of scope until separately planned

- Trade recommendations, entry/exit grading, automatic strategy decisions or
  AI conclusions about why a trade succeeded or failed.
- Unrealized P/L, estimated market value or live price data in realized-trade
  comparisons.
- Combining different currencies into a fake dollar total.
- Inferring a setup, rule outcome, trader intent, reverse split, missing fee or
  market observation from a pattern.
- Sharing a study with another user, public leaderboards, benchmarking against
  other traders or any cross-account comparison without a separate privacy and
  product contract.
