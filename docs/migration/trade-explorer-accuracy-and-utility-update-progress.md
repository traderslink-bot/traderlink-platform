# Trade Explorer Accuracy And Utility Update Progress

**Status:** The approved Journal-only implementation is complete and passes the
focused source checks plus populated desktop and mobile Light-mode browser QA.
The release coordinator has isolated the update on the current production
parent while preserving production's complete appearance system. Final
integrated Dark-mode verification remains open. No automated test suite, push,
merge or deployment was run. The owner selected a direct-to-production release
path with no staging deployment.

**Controlling plan:** [Trade Explorer Accuracy And Utility Update Plan](trade-explorer-accuracy-and-utility-update-plan.md)

**Parent plan:** [Trade Explorer Plan](trade-explorer-platform-plan.md)

## 2026-09-06 planning checkpoint

The owner established that Trade Explorer must remain complete for users who do
not have Trade Analyzer access. Analyzer-owned statistics stay in the Trade
Analyzer section. Trade Explorer may expose an overlapping result only when it
is independently calculated from canonical Journal and Journal Analytics facts
without Analyzer storage, eligibility, snapshots, candles or provider access.

The plan records the complete current seven-view, twelve-sort and grouped-rank
inventory; the accuracy corrections found in the QA; six proposed independent
breakdown views; useful individual-trade, population and Trading Days results;
and exact rules for tags, notes and versioned rule reviews.

### Approval and delivery tracker

- [x] Record the Analyzer/Explorer product and entitlement boundary.
- [x] Record the complete current Trade Explorer surface inventory.
- [x] Record the required accuracy corrections and usefulness rules.
- [x] Record the complete proposed update inventory and deliberate exclusions.
- [x] Owner approved the complete plan on 2026-09-06.
- [x] Reconcile the current dirty checkout with current `origin/main` without
  absorbing or overwriting concurrent work.
- [x] Standalone accuracy/control mockup waived by the owner.
- [x] Separate pre-implementation visual approval waived by the owner.
- [x] Implement the approved accuracy slice and align Help/saved-view/PDF copy.
- [x] Standalone new-view/results mockup waived by the owner.
- [x] Implement the approved new views and results.
- [x] Prove the tags/notes/rules query and presentation contract in source and
  the available populated Demo workflows.
- [x] Complete owner-authorized focused verification without an automated test
  suite.
- [ ] Complete rendered desktop/mobile Light/Dark acceptance.
- [x] Record the owner-selected direct-to-production path with no staging
  deployment.
- [ ] Record any separately owner-authorized Git or production-release
  checkpoint.

## Current repository boundary

At plan creation the canonical checkout is on local `main` at
`5018066fbeca3c88500bec4bcdac762b4936c875`, nine commits ahead of and 305
commits behind the local `origin/main` reference
`592abd11ae33b8239e97adafa99b4e2b4e34baab`. The working tree contains extensive
concurrent changes, including Trade Explorer, saved-view, PDF, Review, shared
shell and migration files. This plan does not declare either local layer safe
to commit or release. Integration reconciliation is the first post-approval
technical checkpoint.

## 2026-09-06 implementation checkpoint

### Delivered surface

- Preserved Trades, Trading Days, Tickers, Entry Times, Holding Time, Position
  Size and Periods, then added Exit Times, Entry Weekday, Direction, Entered
  Quantity, Entry Value and Entry Price.
- Replaced the broad grouped statistic selector with a useful ranking list for
  each view. Duration and size groups are no longer led by tautological
  duration or size rankings, and ticker groups are not ranked by nominal stock
  price.
- Added Largest/Smallest maximum position, Most/Fewest executions and
  Highest/Lowest trading costs row orders. Trading-cost orders exist only for
  the fee-covered Net population; Gross requests are rejected by the strict
  server normalizer.
- Added opened/closed time, trade type, shares entered, maximum shares held,
  weighted entry/exit, entry value, return on entry value, trading costs and
  execution structure to individual-trade results while preserving Review,
  exact executions, ticker links and bounded cursors.
- Added the selected-population distribution, outlier, streak, execution,
  concentration and trading-day summaries. The 50th percentile now uses the
  exact population median, avoiding a contradictory result on even-sized
  populations.
- Expanded Trading Days with first entry, last exit, ticker count, trade/win/
  loss counts, selected-basis P/L, best/worst trade, win rate, maximum realized
  drawdown, realized recovery, peak-profit giveback and realized day movement.
  The copy explicitly distinguishes the Journal realized-P/L path from Trade
  Analyzer market-price paths.
- Added exact tag/Untagged, trade-note, review-incomplete, current immutable
  custom trade-rule, day-note and current immutable day-rule filters. Tag and
  rule results are described as associations, not causes. Preset factual rules
  remain read-only in Review.
- Extended saved-view validation, current-view PDF generation and Help content
  for the complete view, sort, filter and calculation inventory.
- Preserved logical-trade projection using only Journal membership facts and
  restored the migration sources required by the active migration manifest
  from the exact `origin/main` versions without changing the Git index.

### Trade Analyzer boundary proof

The Trade Explorer read, saved-view and PDF paths import no Trade Analyzer,
Level Analysis, candle, market-data provider or entitlement module. Every new
result is calculated from canonical Journal executions, round trips, charges,
notes, tags and versioned rule reviews. MFE/MAE, saved stop/target facts,
candle-derived results, indicator values, named market-session claims and
post-exit market outcomes remain excluded.

### Focused source verification

- Targeted ESLint passes for the 23 changed Trade Explorer, Journal Analytics,
  Help and logical-trade source files.
- Scoped `git diff --check` passes.
- A direct import scan of the Explorer read, saved-view and PDF paths finds no
  Analyzer, Level Analysis, candle, provider or entitlement import.
- The real route compiled successfully in the running Next development app.
- A whole-project TypeScript check was attempted once with a bounded heap and
  ended in V8 out-of-memory before emitting a TypeScript diagnostic. It was not
  repeated on the resource-constrained machine.
- Per owner instruction, Vitest and every other automated test suite remained
  unrun.

### Populated browser verification

A disposable 128-migration Platform database and the built-in Demo account were
used; no private Journal database or invented ad-hoc market data was used. The
rendered `/analytics/trade-explorer` route showed 104 completed trades.

- All 13 View choices rendered their intended result table. The six new views
  produced populated Exit Time, Entry Weekday, Direction, Entered Quantity,
  Entry Value and Entry Price groups with explicit non-overlapping buckets.
- The Gross selector exposed 16 compatible row orders; Net exposed all 18,
  including both cost orders. Largest and smallest maximum-position orders,
  most-executions order and both Net cost orders were applied through the UI.
- Gross and Net each returned All, Wins, Losses and Flat populations without a
  stale-result or request error.
- All 104 rendered Gross P/L rows independently reconciled to `$12,944.25`:
  `$19,166.96` winning P/L divided by `$6,222.71` absolute losing P/L equals
  `3.08016`, matching the displayed `3.08` Profit factor.
- Save and restore succeeded for a disposable named view. Current-view PDF
  generation returned HTTP 200. Review loaded notes, tags, custom/preset rule
  areas and save state. Exact execution expansion returned three buys and three
  sells for the checked trade. Page 2 loaded through the bounded cursor.
- Exact tag, note-present, review-incomplete and Trading Days no-day-note
  filters all returned successfully and retained the overlap/association copy.
- Desktop and 390 x 844 mobile Light mode rendered without a runtime error.
  Mobile used the filter drawer, two-column selected-trade summaries and trade
  cards with exact-execution actions. Browser console error count was zero.

### Remaining rendered gate

The mixed canonical checkout could not provide truthful Dark-mode QA because
its unrelated staged shell changes removed the appearance provider. The
release coordinator confirmed those deletions are not in production and
created a clean package from the current production parent with the complete
appearance system preserved. Trade Explorer uses the shared theme tokens and
contains no Analyzer fallback. Final desktop/mobile Dark verification now
remains a release-candidate acceptance action rather than a source-ownership
blocker.

### Direct production release decision

On 2026-09-06 the owner directed that Trade Explorer go directly to production
instead of staging. No commit, push, merge, migration or deployment was
authorized by that decision, and none occurred. Once production publication is
separately authorized, the release must be serialized through the shared
Railway lane and record the `main` source branch, exact remote parent and
published SHAs, complete file allowlist, Railway deployment ID/status and
`/api/platform/health` result. The unresolved integrated Dark-mode gate must be
closed against the production candidate before publication where possible, or
immediately after the direct deployment if it is genuinely production-only.

### Requirement-by-requirement completion audit

| Requirement | Authoritative evidence | State |
| --- | --- | --- |
| Preserve seven existing views and twelve existing row sorts | The rendered View menu contains all seven legacy choices; the rendered Gross sort menu contains the complete legacy inventory plus four non-fee additions. Trades, Trading Days, Tickers, Entry Times, Holding Time, Position Size and Periods each rendered populated results. | Proved |
| Add six breakdown views and six row sorts | Exit Times, Entry Weekday, Direction, Entered Quantity, Entry Value and Entry Price each rendered populated results. The rendered sort menus expose Largest/Smallest maximum position, Most/Fewest executions and Net-only Highest/Lowest trading costs; both position orders, Most executions and both cost orders were applied successfully. | Proved |
| Useful compatible rankings | Every view has an explicit allowlist in `RESULT_VIEWS`; the rendered Tickers list excludes nominal price and exposes only trade count, P/L, average/median P/L, win rate, profit factor, return on entry value and average holding time. Outcome and money-basis filtering is applied before rendering and repeated by the server allowlist. | Proved |
| Exact labels and coverage | Populated tables show non-overlapping quantity/value/price bands, separate Shares entered and Maximum shares held, local opened/closed times, explicit Gross/Net labels and Net fee-coverage copy. | Proved |
| Currency and Trade type saved/restored | Both controls are part of the strict query and saved-view normalizer. A complete disposable view saved and restored with its current Trades/Gross/all-results definition. | Proved |
| Factual tags, notes and rules | Account-scoped annotation joins use stable target IDs and immutable rule versions. Exact tag, note-present, review-incomplete and no-day-note filters rendered successfully; overlap and association copy remained visible. | Proved, with custom-rule option population source-verified because the Demo account had no custom rules |
| Realized Trading Days boundary | The rendered day table includes realized drawdown, recovery, giveback and `Red → green`/`Neither` day movement; source and Help state that these use closed-trade P/L order rather than candle or market-price paths. | Proved |
| No Analyzer dependency | Direct import scan across client, action, service, saved-view and PDF paths found no Analyzer, Level Analysis, candle, provider or entitlement import. | Proved |
| Same inventory without Analyzer access | Page-model composition has no Analyzer entitlement input or branch, and all results are derived within the Journal reporting runtime. | Proved in source; no separate non-entitled identity fixture exists in the disposable local runtime |
| Supporting completed trades | The Trades view retains Review, ticker links, exact execution expansion and opaque-cursor pagination for the selected aggregate population; grouped calculations reconcile their complete population before pagination and current-view PDF exports the complete matching population. | Proved |
| Desktop/mobile Light render | Desktop tables, 390 x 844 filter drawer, selected-trade grid and mobile cards rendered against 104 Demo trades with no console error or failure surface. | Proved |
| Desktop/mobile Dark render and owner acceptance | The production-based package preserves the complete appearance provider and contract. | Pending release-candidate verification |

No commit, push, merge, deployment or production action occurred.
