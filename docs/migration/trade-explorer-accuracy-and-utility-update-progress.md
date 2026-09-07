# Trade Explorer Accuracy And Utility Update Progress

**Status:** Follow-up correction in progress on 2026-09-06. The earlier
Journal-only release remains live. The owner approved the complete correction
inventory, waived further approval pauses and directed the verified package to
the release coordinator for production. No automated test suite will run.

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
- [x] Complete rendered desktop/mobile Light/Dark acceptance.
- [x] Record the owner-selected direct-to-production path with no staging
  deployment.
- [x] Record the owner-authorized Git and production-release checkpoint.

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

### Production rendered acceptance

The mixed canonical checkout could not provide truthful Dark-mode QA because
its unrelated staged shell changes removed the appearance provider. The
release coordinator confirmed those deletions were not in production and
created a clean package from the current production parent with the complete
appearance system preserved. After release, signed-in production browser QA
rendered 508 completed trades and passed in desktop and 390 x 844 mobile Light
and Dark modes. The mobile drawer, filters, summary, actions and trade cards
remained readable without page-level horizontal overflow after the responsive
transition. Browser warnings and errors remained empty.

### Direct production release decision

On 2026-09-06 the owner directed that Trade Explorer go directly to production
instead of staging. The release coordinator serialized the exact allowlisted
commit chain through `main`. Final source
`add0c27dafd4822eb924e48a3620e15a0cffe808` deployed as Railway deployment
`fac00386-c6ab-4e71-a2ed-7a35bcc3ba00` with status `SUCCESS`. Startup verified
115 migrations, maintenance controls were absent and direct
`/api/platform/health` returned HTTP 200 with `ready` / `sqlite_single_node`.
No migration, data, staging or hosted-configuration change occurred.

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
| Desktop/mobile Dark render | Signed-in production passed desktop and 390 x 844 mobile Dark rendering with readable controls/cards, no page-level horizontal overflow and no browser warnings/errors. | Proved |

Production release and post-release rendered acceptance are complete. Final
source is `add0c27dafd4822eb924e48a3620e15a0cffe808`; Railway deployment is
`fac00386-c6ab-4e71-a2ed-7a35bcc3ba00` with status `SUCCESS`.

## 2026-09-06 owner correction checkpoint

The owner approved one complete follow-up slice:

- retain automatic account-local same-day Day trade classification for useful
  historical imports, separate from intentional Swing style;
- remove the Selected trades card;
- repair Exit Times and Entry Price request validation;
- rename the views to Total Entry Shares, Total Entry Value and Share Size;
- add a separate execution-derived money-based Position Size view;
- add Premarket, Regular Hours and Post market entry-session filtering;
- expand Trading Days and Tickers into their contributing trades;
- add the complete requested Trading Days sort inventory and `Sort days` label;
- replace Trades Review actions with in-page Workspace Trade Details; and
- reuse the same Details drawer from every expanded grouped trade row.

### Follow-up delivery tracker

- [x] Record and perfect the correction contract before source edits.
- [x] Implement strict query, grouping, result and saved-view contracts.
- [x] Implement the corrected controls, grouped expansions and Details drawer.
- [x] Align PDF and Help copy.
- [x] Complete focused static verification without an automated test suite.
- [ ] Complete integrated desktop/mobile Light/Dark browser verification.
- [x] Create the narrow local correction commit.
- [x] Hand the exact allowlist to the production coordinator.
- [ ] Record published SHA, Railway deployment and health result.

Implementation now derives entry sessions and maximum position value entirely
from Journal execution facts. Exit Times and Entry Price are accepted by the
same strict grouping allowlist used by the request normalizer. Trading Days and
Tickers lazy-load their completed trades in pages of up to 100, and every
expanded trade uses the shared Trade Details drawer with its Analyzer tab
suppressed in Trade Explorer.

Focused ESLint over all changed TypeScript/TSX files and `git diff --check`
pass. No automated test suite was run, per the project instruction. Both the
repository-wide and narrowed TypeScript compiler passes reached the existing
2 GB Node heap limit; memory was not raised because this computer is governed
by the low-resource policy. The local review database path recorded by the old
environment file is no longer present, so integrated visual proof is reserved
for the direct production candidate after the coordinator publishes it.

The complete 22-file implementation package is local commit
`ab5e77eb18e962a1b37a410e2e5d2336a9fa510e`, parented to
`3008ead809dc87a00ae9d1629d0687e01f6a6736` in the isolated
`trade-explorer-production-package-941e` worktree. Its exact allowlist and the
owner's direct-production authorization were sent to the existing Railway
release coordinator. Publication, deployment and production rendering remain
coordinator-owned.
