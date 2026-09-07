# Trade Explorer Accuracy And Utility Update Plan

**Status:** Owner-approved correction slice in progress on 2026-09-06. The
earlier Journal-only release remains live while this exact follow-up is built
and verified locally. The owner explicitly waived further approval pauses and
directed the completed package to the production release coordinator.

**Parent plan:** [Trade Explorer Plan](trade-explorer-platform-plan.md)

**Progress:** [Trade Explorer Accuracy And Utility Update Progress](trade-explorer-accuracy-and-utility-update-progress.md)

## 1. Owner decision and outcome

This update makes `/analytics/trade-explorer` a more accurate and useful way to
study completed Trade Tracker trades without making Trade Explorer depend on
Trade Analyzer.

Trade Analyzer is a separate product area with separate access and saved
market-data facts. A statistic stays in Trade Analyzer when it needs Analyzer
eligibility, Analyzer revisions, saved candles, market replay, an external
market-data provider or a Trade Analyzer calculation. Trade Explorer may expose
an overlapping idea only when it can calculate the result independently from
canonical Journal and Journal Analytics facts available to every eligible Trade
Explorer user.

The result must let a trader answer practical questions about individual
trades, the selected trade population, trading days, tags and rules. A control
or statistic is added only when it has a clear trading question, an exact fact
and formula contract, adequate coverage behavior and evidence that opens back
to the contributing trades.

## 2. Product and entitlement boundary

### 2.1 Facts Trade Explorer may use

Trade Explorer may use only these account-scoped sources:

- current active `ready_closed` round trips from the canonical Journal ledger;
- the accepted executions allocated to those round trips;
- exact execution time, side, price, quantity, role and supported fee facts;
- round-trip direction, open/close time, holding duration, entered quantity,
  maximum position, entry notional, weighted entry/exit price and execution
  count derived solely from those executions;
- Gross or Net realized P/L under the user's Account P/L preference, with the
  existing fee-coverage rules;
- Journal Analytics filters, groupings, exact metrics, coverage and bounded
  evidence contracts;
- trader-authored trade notes, tags and exact versioned rule-review facts; and
- daily notes and exact day-rule reviews when a Trading Days result explicitly
  uses the trading-day identity.

Derived Explorer results must be reproducible from those inputs with no read of
Trade Analyzer storage and no check for Trade Analyzer entitlement.

### 2.2 Statistics that remain in Trade Analyzer

Trade Explorer must not display, filter, rank, group, summarize, export or save
any of these Analyzer-owned results:

- MFE, MAE, room after entry or any favorable/adverse price excursion;
- peak open/unrealized P/L, continuous profit duration, profit captured,
  retained peak profit or profit-taking opportunity thresholds;
- trade-level Green-to-Red, stayed-green, recovered or never-green states that
  depend on the market-price path while the trade was open;
- Session VWAP, EMA, RSI, relative volume, candle/session volume or turnover;
- candle-pattern observations, execution-candle location, candle edge distance
  or timing claims that require candle order;
- post-exit 5/15/30/60-minute price outcomes or exit giveback from a saved
  favorable candle price;
- Analyzer scenario, priority, coaching, counterfactual or profit-protection
  conclusions;
- analyzed-trade/event counts, Analyzer coverage, Analyzer revision state or
  Analyzer availability; and
- any statistic sourced from Level Analysis market-session candles, Analyzer
  event snapshots, Moomoo or another market-data provider.

An optional `Open in Trade Analyzer` navigation action may be offered from a
trade detail when separately approved. It cannot show an Analyzer value,
coverage teaser or locked statistic inside Trade Explorer.

### 2.3 Similar names must identify different facts

Journal-only realized results remain permitted even when an Analyzer feature
uses similar language. The UI and contracts must distinguish them:

- `Maximum intraday realized drawdown` is the decline in cumulative realized
  P/L across completed trades closing on one trading day. It is not a trade's
  unrealized drawdown or MAE.
- `Realized day went green-to-red` may describe a day whose cumulative realized
  P/L was positive and finished negative. It is not the Analyzer's intratrade
  market-price Green-to-Red result.
- `Return on entry value` is realized P/L divided by execution-derived entry
  notional. It is not MFE, captured opportunity or return from a market-price
  high.

If the distinction cannot be made obvious in the visible title, the result is
not added to Trade Explorer.

## 3. Complete current surface inventory

This inventory controls the update. Nothing in the current surface may be lost
silently while the feature is corrected.

### 3.1 Existing result views

1. Trades
2. Trading Days
3. Tickers
4. Entry Times
5. Holding Time
6. Position Size
7. Periods, with Day, Week, Month and Year grouping

### 3.2 Existing individual-trade sorts

1. Newest first
2. Oldest first
3. Highest P/L first
4. Lowest P/L first
5. Highest return first
6. Lowest return first
7. Longest hold first
8. Shortest hold first
9. Most shares first
10. Fewest shares first
11. Highest entry value first
12. Lowest entry value first

Trades may be sorted only by a fact on each row. Population statistics such as
win rate, profit factor, averages, medians, streaks and concentration never
become individual-trade sorts.

### 3.3 Existing grouped rankings

The non-day grouped views currently share 31 basis-adjusted choices when Result
is All:

- trade count and selected-basis P/L;
- average P/L, median P/L, best trade, worst trade, profit factor and return on
  entry notional;
- win/loss/flat counts and rates, average winning trade, average losing trade
  and average win/loss ratio;
- average, median, minimum and maximum holding time plus average winner and
  loser holding time;
- average, median and maximum share quantity;
- average, median and maximum entry notional; and
- average entry and average exit price.

The existing outcome rules reduce that inventory to 19 choices for Wins or
Losses and 13 for Flat by removing constant, impossible or redundant results.
That behavior is retained.

Trading Days currently owns five All-result choices: trade count,
selected-basis P/L, maximum intraday realized drawdown, maximum realized
recovery from trough and maximum peak-profit giveback. It reduces to trade
count plus P/L for Wins/Losses and trade count for Flat.

### 3.4 Existing filters and result controls

The update preserves closing-date range, ticker, direction, Gross/Net result
basis, result, view, order/rank direction, result rows per page, entry weekday,
entry-time detail, entry time, holding-time range, entered-quantity range,
maximum-position range and entry-value range. Saved views, current-view PDF,
trade Review, execution expansion and bounded pagination remain part of the
feature.

Currency and day/multi-day trade type already exist in the strict query and
saved-view contracts but are not consistently selectable in the main Explore
controls. This plan makes both visible.

## 4. Required accuracy corrections

1. Reconcile the current dirty Trade Explorer overlay with current
   `origin/main` before editing. Preserve the current Account P/L preference,
   logical-trade projection, ticker deep link, saved views, PDF export, Review
   editor and mobile-card work.
2. Replace overlapping `Up to` labels for position size and entry value with
   explicit non-overlapping ranges. Shares and money receive separate,
   trader-relevant bucket definitions.
3. Correct share terminology:
   - cumulative entry quantity is `Shares entered`;
   - largest concurrent absolute position is `Maximum shares held`;
   - metrics calculated from maximum position use `maximum shares` in their
     visible names.
4. Rename `Return` to `Return on entry value` wherever that is the formula.
5. Rename From/To to `Closed from` and `Closed to` because realized trades are
   selected by closing trading date.
6. Render an entry-time bucket as its full interval, such as `09:30–09:59`, in
   the account trading timezone.
7. Make filtered population labels explicit: Wins, Losses or Flat trades rather
   than a generic Trades label after the Result filter is applied.
8. Add visible Currency and Trade type controls. Use `Day trade` and
   `Multi-day trade`; holding duration must not infer intentional Swing status.
9. Keep Gross and Net results aligned with the Account preference. Blank-fee
   manual trades remain visible under the accepted manual-fee contract, while
   imported trades lacking required fee facts remain outside Net calculations
   with exact coverage.
10. Keep money grouped by currency and trading-day results partitioned by
    currency/timezone. No cross-currency P/L total is introduced.

## 5. View and ranking usefulness contract

Every view owns a curated primary `Rank by` list. A secondary `More statistics`
group may retain another mathematically valid option only when its meaning is
clear and it adds a distinct question.

| View | Primary ranking questions |
| --- | --- |
| Trading Days | Trades, P/L, realized drawdown, recovery and giveback |
| Tickers | Trades, P/L, average/median P/L, win rate, profit factor, return on entry value and average hold |
| Entry Times | Trades, P/L, average/median P/L, win rate, profit factor, return on entry value and average hold |
| Holding Time | Trades, P/L, average/median P/L, win rate, profit factor and return on entry value |
| Position Size | Trades, P/L, average/median P/L, win rate, profit factor, return on entry value and average hold |
| Periods | Trades, P/L, average/median P/L, win rate, profit factor, best trade and worst trade |

The first presentation removes tautological primary choices: duration groups
are not primarily ranked by their duration, size groups are not primarily
ranked by size, and mixed-ticker groups are not promoted by nominal stock price.

## 6. Complete proposed target inventory for this update

### 6.1 New breakdown views

These six views are the complete proposed expansion for this update:

1. Entry Weekday
2. Direction
3. Entered Quantity
4. Entry Value
5. Entry Price
6. Exit Time

They reuse existing Journal Analytics facts and are added only when each view's
bucket labels, primary rankings, result columns, currency/timezone behavior and
evidence drill-down are approved. Trade Type remains a required filter in this
update; a dedicated Trade Type view waits for a strict grouping contract and a
separate usefulness decision.

### 6.2 Individual-trade additions

Add these row facts where space and responsive review approve them:

- Shares entered and Maximum shares held as distinct facts;
- opened time and closed time in the account timezone;
- entry/add/reduction/exit counts summarized as execution structure; and
- trading costs when the selected trade has factual fee coverage.

Add these six individual-trade sorts:

1. Largest maximum position first
2. Smallest maximum position first
3. Most executions first
4. Fewest executions first
5. Highest trading costs first
6. Lowest trading costs first

Trading-cost sorts appear only for a fee-covered population and never treat a
missing fee as zero.

### 6.3 Whole-population results

Add a compact `Selected trades` summary rather than forcing these into every
grouped table:

- completed trades and included/fee-covered sample size;
- selected-basis P/L, average P/L, median P/L and profit factor;
- P/L percentiles and population standard deviation;
- P/L excluding the largest winner, largest loser and both;
- largest winner share of gross profit and largest loser share of absolute
  gross loss;
- longest/current winning and losing streaks;
- average executions per trade and scale-in/scale-out trade counts; and
- largest ticker and trading-day P/L concentration.

Each result links to or preserves the exact contributing trade population.
Rates and ratios keep trade count beside them; a small-sample treatment is
presentational context, not a reason to hide a factual result.

### 6.4 Trading-day results

Expand Trading Days with:

- first entry, last exit, active tickers and completed-trade count;
- selected-basis daily P/L, largest winner and largest loser;
- average/median daily P/L and green/red/flat day counts over the selection;
- maximum intraday realized drawdown, realized recovery and peak-profit
  giveback as visible results; and
- day-note state and exact day-rule-review coverage when those filters are
  selected.

The follow-up adds an Entry Session filter using the existing Journal Analytics
execution-time grouping: Premarket is 04:00-09:29, Regular Hours is
09:30-15:59 and Post market is 16:00-19:59 in the selected account's recorded
trading timezone. Trades outside those ranges remain available under All
sessions and are not silently assigned to one of the three named selections.
This is an execution-time classification calculated entirely by Trade Explorer;
it does not use Analyzer candles, market replay or provider data.

### 6.5 Owner-approved production correction slice

The complete correction target is:

1. Keep the factual completed-trade type behavior: a trade opened and closed
   on the same account-local date is a Day trade; a trade crossing dates is a
   Multi-day trade. This makes historical imports useful without requiring
   retrospective manual labeling and remains separate from intentional Swing
   style.
2. Remove the `Selected trades` statistics card. Those whole-population results
   do not update with every grouped-view selection and therefore do not belong
   in the result table area.
3. Repair Exit Times and Entry Price request validation so Update results
   applies both views.
4. Rename the View choices `Entered Quantity` to `Total Entry Shares` and
   `Entry Value` to `Total Entry Value`.
5. Rename the share-based Position Size view to `Share Size`, with `Peak shares
   held` as its grouped fact. Add a separate `Position Size` money view based on
   maximum position value. Maximum position value is maximum shares held
   multiplied by the trade's quantity-weighted average entry price; it is
   calculated from Journal executions only and is not a live market value.
6. Add the Entry Session filter defined above and preserve it through saved
   views, comparison inputs and PDF filter summaries.
7. Make Trading Days and Tickers rows expandable. Each expansion lazily loads
   the complete matching trade rows under the active filters and partition,
   shows ticker/date/direction/Total Entry Shares/Total Entry Value/P&L, and
   offers Details for each trade.
8. Add the Trading Days sort choices Total Trades, Total Wins, Total Losses,
   selected-basis P/L, Largest Winner, Largest Loser, Win Rate, Maximum Realized
   Drawdown, Realized Recovery and Peak-Profit Giveback. Label the control
   `Sort days`.
9. Rename the Trades table `Review` column and action to `Details`. Details in
   Trades and grouped expansions opens the existing Workspace Trade Details
   drawer inside Trade Explorer without navigation.
10. Preserve exact-execution expansion in Trades. Removing the table Review
    action does not delete saved notes, tags, rules or their filters.

### 6.6 Tags, notes and rules

- Add tag membership filters and one-tag-at-a-time breakdowns using exact
  trader-selected tag IDs. A trade with several tags contributes to several
  tag groups, so the UI states that tag groups overlap and their totals are not
  expected to reconcile.
- `Untagged` is offered only when complete assignment coverage can distinguish
  no tag from unavailable annotation data.
- Add note-present and review-incomplete filters as workflow tools. Note text is
  never mined to invent a setup, strategy, mistake or sentiment.
- Add trade-rule filters and breakdowns using exact rule ID, immutable version,
  applicability and saved result. Followed, Broken, Not reviewed and Not
  applicable remain distinct.
- Preset factual rule results remain read-only. Trader-reviewed custom rule
  results retain their existing edit contract.
- Day-rule results appear only in Trading Days; trade-rule results appear only
  in completed-trade populations. The denominator is applicable reviewed
  targets, never all trades by default.
- Rule or tag performance is presented as association in the selected history,
  never as proof that a rule or tag caused a profitable result.
- A normalized Setup result remains deferred. Traders may use an explicit tag
  for a setup; Trade Explorer does not infer setups from notes or executions.

## 7. Delivery checkpoints and approval gates

### Checkpoint 0 — plan and integration baseline

1. Owner reviews and approves this complete target inventory.
2. Audit current `origin/main`, the dirty working tree and all Trade
   Explorer-owned files before any source edit.
3. Record the exact preserved saved-view, PDF, Review, mobile and deep-link
   behavior.

### Checkpoint 1 — accuracy and control implementation

1. Implement the corrected filters, labels, curated Rank-by choices, summary
   and all existing views directly in the integrated Trade Explorer.
2. Preserve the existing accepted Material composition and responsive
   conventions while making the approved plan changes.
3. A standalone visual mockup and separate pre-implementation visual approval
   are not required for this update.

### Checkpoint 2 — accuracy completion

Implement Section 4 as one coherent slice. Update saved-view display, PDF
headings and Help anywhere the corrected meaning appears. Do not add the new
views in this checkpoint.

### Checkpoint 3 — independent views and results

Implement the six Section 6.1 views, the individual-trade additions, population
summary and expanded Trading Days presentation using the existing Journal
Analytics engine and the approved plan composition.

### Checkpoint 4 — tags, notes and rules

First prove the stable round-trip/day annotation joins, overlap behavior,
versioned rule meaning and bounded query shape. Then implement the approved
filters and breakdowns in the integrated Trade Explorer.

### Checkpoint 5 — acceptance

After the owner authorizes verification, check every existing and new view,
every compatible sort/rank, every Result/Basis combination, saved-view restore,
PDF output, Review, pagination and evidence drill-down. Render desktop and
mobile in Light and Dark modes with applicable loading, empty, success, warning
and error states. No test, build, server or browser command is authorized by
this planning document alone.

### Checkpoint 6 — direct production release

The owner decided on 2026-09-06 that this update will go directly to production
without a staging deployment. This release-path decision does not by itself
authorize a commit, push, merge, migration or deployment.

When the owner separately authorizes the production release, it must follow the
shared Railway one-writer release contract. The release record must identify
the configured `main` source branch, exact remote parent SHA, published SHA,
complete file allowlist, Railway deployment ID and final status, and the
`/api/platform/health` result. Final desktop/mobile Light/Dark verification must
use the integrated production candidate before publication when that state is
available. If a production-only condition can be verified only after the
direct deployment, the release remains incomplete until that immediate check
passes or the release owner executes the approved repair or rollback path.

## 8. Technical safeguards

- Trade Explorer client, action, service and export paths must not import or
  call the Trade Analyzer or Level Analysis modules.
- No Explorer request may start Analyzer work, request candles, call a market
  data provider or require `quote:read`/Analyzer entitlement.
- The same Trade Explorer controls and Journal-derived results are available to
  users with and without Trade Analyzer access.
- All row ordering happens over the complete filtered server population before
  bounded pagination. Group rankings use exact values and place unavailable
  results last.
- Every saved view and PDF preserves the corrected view, filters, money basis,
  currency, timezone and ordering without storing Analyzer identifiers.
- New annotation filters use bounded, server-derived account scope and stable
  IDs. Browser input never supplies another account or arbitrary metric/formula.
- Data Decisions remain metric-specific. One unresolved chain cannot hide an
  unrelated valid trade.
- Help Center guidance is reviewed for every visible change and updated in the
  same accepted slice.

## 9. Acceptance criteria

The update is complete only when:

- all seven existing views and all twelve existing trade sorts remain present
  unless the owner explicitly approves a replacement;
- the six new breakdown views and six new row sorts perform their exact visible
  promises or remain unshipped;
- every view exposes only useful, compatible primary rankings;
- bucket, shares, dates, times, return, result basis and coverage labels state
  exactly what was calculated;
- Currency and Trade type can be selected and restored through saved views;
- tags, notes and rules follow their factual and overlap contracts;
- Trading Days clearly separates realized trade-path facts from Analyzer
  market-price-path facts;
- source review proves no Analyzer/Level Analysis/provider dependency on the
  Explorer read, saved-view or PDF paths;
- a non-Analyzer user receives the complete Trade Explorer result inventory;
- every aggregate opens or preserves its exact supporting completed trades;
  and
- desktop/mobile Light/Dark integrated rendering passes before the direct
  production release is declared complete; the owner instructed this follow-up
  to continue without another visual-approval pause.

## 10. Explicitly deferred or excluded

- Every Analyzer-owned statistic in Section 2.2.
- Exchange-calendar claims, holiday/half-day inference and live session state.
- Inferred setups, strategies, mistakes, emotions or rule results.
- Live/unrealized P/L, live prices and external market-data calls.
- Cross-currency money totals or implicit FX conversion.
- Predictive scoring, recommendations or claims of causation.
- A dedicated Trade Type view until its grouping and usefulness contract is
  separately accepted.
- New public sharing, report scheduling or AI-generated conclusions.
