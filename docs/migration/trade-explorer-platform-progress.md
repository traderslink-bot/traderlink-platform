# Trade Explorer Progress

**Status:** Explorer 1 truthful-ordering correction implemented, tenth-pass QA
complete with the tenth pass finding no new Trade Explorer issue, and awaiting
owner visual/product review. The owner approved implementation on 2026-08-04
and the corrected Trades/review direction on 2026-08-16.

**Controlling plan:** [Trade Explorer Plan](trade-explorer-platform-plan.md)

## Current checkpoint

The owner requested a full-capability Trade Explorer where traders can filter
and inspect the trades and statistics their confirmed Trade Tracker facts support,
rather than a reduced replacement of the legacy V3 Explorer. Period comparison
is a separate optional tool.

The planning audit confirmed that the active replacement already provides the
foundation for the first Explorer slice: exact completed-round-trip analytics,
gross/net basis, metrics including win rate, profit factor, expectancy and
medians, bounded evidence, date/instrument/direction/provenance/outcome/time/
size/holding filters, and accepted groupings. The future page will reuse that
foundation rather than copy V3 calculation code.

Explorer 1 now has the replacement route/service/action/client construction
implemented. It uses the active Journal Analytics service and exact metric
registry; it does not create a database migration, provider request or V3
dependency. The first live view supports actual date, currency, ticker,
direction, outcome, weekday, entry-time, holding-time and
size filters together with real grouped results. The primary interaction now
shows the actual matching trades directly beneath the filters, and the Result
filter narrows that list to wins, losses or flat trades. Pre-market,
regular-hours and post-market selectors remain planned until their
exchange-session fact contract is accepted.

The owner review replaced the mixed metric selector with factual result-table
families. The live first draft now offers Trades, Trading Days, Tickers, Entry
Times, Holding Time, Position Size and Periods. Each grouped view has its own
columns and client-side highest/lowest sorting over the returned groups. The
Trades view shows shares, weighted average entry and exit prices, entry value,
P/L, return, holding time and execution count with bounded pagination.
Red-to-green and green-to-red now appear only as day movement in Trading Days.
The incomplete comparison UI is withheld pending later focused review.

The view-family revision retains the useful analytics catalog in the grouped
views without implying that a population statistic can order individual
trades. Trades now uses `Sort trades`; Trading Days and the other grouped views
use `Rank by`. Trading Days offers daily-result and daily-movement statistics,
while the other grouped views offer trade-population statistics. A selected
grouped statistic becomes the active group ordering and a visible table
column. The initial page read no longer calculates and discards a separate
Analytics Lab preview before calculating the Explorer result.

Trade rows now expand in place to show their execution time, side, shares and
price. The interaction keeps at most one row open: selecting a different trade
closes the first, while selecting the open trade again hides its executions.
The detail read reuses the existing owner/account-scoped Journal endpoint and
does not reload the full Explorer result.

The execution detail is presented as a compact nested table instead of
stretching across the full result width. Win, loss and flat are explicit
Result choices that apply to the Trades list, its summary and pagination.
Selecting a grouped statistic no longer silently changes that Result filter.

The selector audit also aligned winner/loser-specific averages and holding-time
statistics with their matching trade populations. Trading Days now offers only
group statistics that can meaningfully reorder individual dates: trade count,
daily P/L, intraday drawdown, recovery and peak-profit giveback. Day movement
remains visible in the table. Binary day-type counts and scale-in/scale-out
counts are withheld until they have a separate truthful filter contract.

## 2026-08-16 owner-approved correction

A source and live-browser audit reproduced the owner's report. In Trades, the
Statistic selector changed the summary above the table but did not order the
trade rows. Winning trades appeared to work only because that statistic
silently changed the Result filter. Profit factor and average holding time are
population statistics and cannot truthfully rank an individual trade. The
server already returned evidence newest-first, but the initial query incorrectly
selected only Long trades.

The approved correction is implemented and:

- default Trades to all directions and most recently closed first;
- replace Statistic with truthful server-paginated `Sort trades` choices in the
  Trades view;
- keep Winning, Losing and Flat under the explicit Result filter;
- retain population statistics as a compact summary rather than implying that
  they reorder individual trades;
- use `Rank by` for grouped result families where a statistic really orders the
  groups; and
- tighten the evidence table with `Avg entry`, `Avg exit` and `Entry value`
  without removing useful columns.

The separately approved trade-review direction will follow this correctness
checkpoint and its owner visual review. Notes, tags and rule reviews will open
from one narrow Review action in a desktop side panel or mobile full-screen
sheet rather than becoming more table columns. The other active dashboard-wide
mobile-friendliness chat owns shared shell and general responsive changes; this
slice will not overwrite those files.

The correction implementation is now assembled. Trade ordering is applied to
the complete filtered server population before bounded pagination, uses exact
decimal comparisons for P/L, shares and entry value, compares returns as exact
ratios, places unavailable values last and binds each opaque continuation
cursor to its selected ordering. The Trades UI defaults to all directions and
Newest first, offers only factual row sort choices, keeps Result filtering
explicit, shows the selected population's compact summary and uses the approved
short table labels and tighter spacing. Grouped views retain factual statistics
under `Rank by`.

Checkpoint QA passes for the implemented correction. Focused Vitest ran with
one worker and no file parallelism: 2 files and 24 tests pass. The proof covers
all 12 visible trade-order promises over the complete filtered population,
bounded-page continuity, cursor/order mismatch rejection, exact decimal and
rational comparison, visible-option-to-server-order binding,
gross-versus-net P/L and return ordering, gross-versus-net Result filtering,
default/all/long/short direction behavior, and exact reconciliation between the
visible trade count/P/L summary and the table for Gross/Net plus
All/Wins/Losses/Flat. The grouped-statistic inventory test also proves that
every visible `Rank by` choice is unique and has an implemented or conditional
analytics capability; permanently unavailable metrics are not offered.

A separate 26-check source-to-interface and Next.js-boundary audit confirms the
visible defaults, controls, labels and compact summary are wired to those
contracts. The first audit found and removed a second grouped `Sort by` control
that could contradict `Rank by`. The second audit found that draft filter
changes could be combined with an older pagination cursor before Apply, and
that overlapping requests could allow an older response to replace a newer
choice. Pagination now uses the last successfully applied query and order,
summary labels use the last applied basis, view/rank state is applied only with
its successful response, stale responses are ignored, and Reset invalidates
pending reads. Targeted ESLint passes for all changed TypeScript and TSX files.

A third independent QA pass added partial-fee-coverage and ordering-edge
fixtures. It proves that Gross P/L includes both closed trades while Net P/L
includes only the fee-covered trade, reports the omitted count, and keeps the
summary reconciled with the table. The Trades summary now says `Fee-covered
trades` under Net P/L and plainly explains that Gross P/L includes trades
without complete fee details. Equal P/L values use the deterministic newest
tie-breaker, while a return that cannot be calculated stays last under both
Highest and Lowest return ordering. A 31-check source audit also reconfirmed
the owner/account-scope guards, serializable Next.js client/server boundary,
last-successful-query pagination, stale-response guards, visible labels and
absence of internal limitation codes in the trader-facing UI.

A fourth independent QA pass covered multiple trade currencies. It confirmed
that the analytics service returns separate CAD/USD partitions, declares the
money-partition limitation, rejects an individual-trade table until one
currency is selected, and returns only the selected currency's rows. The
grouped UI no longer flattens unlike currencies into one apparent ranking:
groups are ranked within their currency/trading-timezone partition, every row
shows that partition, and the summary explains the separation instead of
displaying one partition's metric as a combined result. Group keys now also
include timezone to remain unique. The pass additionally corrected Trading
Days to show its factual empty state when a selected day-result subset has no
matching rows. The final fourth-pass source audit covers 41 currency,
truthfulness, account-scope, concurrency and Next.js-boundary promises.

### Fifth QA pass

The owner correctly challenged the earlier incremental QA passes. The fifth
pass restarted from the complete Explorer interaction matrix instead of only
rechecking the most recent fix. It corrected these additional boundaries:

- Gross and Net grouped columns, defaults and ranking now stay on the selected
  Result basis. Multi-currency Trades counts use the post-Result included
  population rather than the broader ready-closed population.
- Summary and table reads must have the same fact revision, basis and currency.
  Continuation cursors are now bound to the fact revision, complete population
  filter digest and selected row order. The digest includes day/multi-day trade
  classification as well as the other population filters.
- The initial date span and ticker choices cover every available currency, not
  only the first currency. Individual trades still require one currency, and
  grouped money results remain visibly partitioned by currency/timezone. Money
  amounts use their recorded currency code rather than an assumed dollar sign.
- Changing filters, page, order or Reset cancels an in-flight execution-detail
  response. Execution times use the selected account timezone, and trade rows
  can be expanded with Enter or Space.
- Flat P/L is no longer styled as a gain. An unavailable day-movement result no
  longer falls through to `Neither`; grouped `N/A` values now have one concise
  trader-facing explanation. A Rank by choice that cannot be calculated for
  any matching group says so directly.
- `Worst trade` and `Worst trading day` default to Lowest first. Profit factor
  uses exact rational comparison and holding-time ranks use duration values.
- Visible Trade Explorer and Core Analytics Help copy now uses `Trade Tracker`,
  not `Journal`. Help documents the exact Trades/Result/Rank by, fee-coverage
  and currency behavior.

The complete bounded matrix now passes 7 test files and 54 tests with one
worker and no file parallelism. It covers query validation, exact math, fact
normalization, metric capability availability, all primary and advanced
filters, all 12 individual-trade order promises, Gross/Net and
Wins/Losses/Flat reconciliation, bounded pagination, stale cursor rejection,
multi-currency separation, exact decimal/rational/duration group comparison,
worst-result direction and the visible Next.js/UI/Help contract. Targeted
ESLint passes for every changed TypeScript/TSX file.

The whole-project TypeScript check now reports only two concurrent errors:
the mobile session's candle-pattern drawer still uses an unsupported Drawer
prop, and the separate AI language-inventory test has a `never` type mismatch.
It reports no Trade Explorer-owned error. The required dashboard-template
verifier passes 5 of 7 checks; its two failures are also in concurrent shared
mobile-shell files (`feature-help-link.tsx` and `dashboard-shell.tsx`), not the
Explorer page. Those files were preserved for their owning session.

### Sixth QA pass

The sixth pass re-audited the active controls against both the server query and
the values a trader can actually see. It found and corrected these remaining
truthfulness and interaction gaps:

- Rank by now offers only the Gross or Net P/L that matches Result basis. The
  client and server both canonicalize an older opposite-basis selection.
- Wins, Losses and Flat now hide statistics that are impossible, constant or
  duplicates under the selected Result. This includes Profit factor and
  win/loss ratio under a single outcome, fixed 0%/100% rates, nonmatching
  counts, duplicate winner/loser averages and outcome-constant day movement.
  Redundant win/loss/rate group columns are also removed while one Result is
  active. Trading Days was narrowed to the rankings that can really reorder
  dates. Under Flat, individual P/L and return sorts are hidden and both client
  and server safely fall back to Newest first.
- Average and median holding-time statistics now render as readable seconds,
  minutes or hours instead of a bare millisecond number. The same formatter
  keeps row holding times factual to at most two decimal places.
- Ordinary exact-number and entry-time input is canonicalized before the
  server validates it. Changing entry-time detail clears a time that does not
  align with the new bucket rather than sending a predictably invalid query.
- A successful request no longer overwrites a filter changed while that request
  was running. Draft controls remain visible and a concise notice says when
  Update results is still required. Failed actions keep the last successful
  table; a changed trading-account scope requires a page refresh rather than
  leaving another account's stale table visible.
- The server applies day/multi-day trade type to ready rows and no longer
  attributes open, decision or unsupported coverage rows to a trade type they
  do not have. Its cursor digest already includes that filter.
- Closed rows now show the exact local close time and timezone. Nested missing
  execution prices say `Not recorded`; P/L headings state Gross or Net; and
  the desktop evidence table keeps compact padding without stretching every
  column across the full page.
- The metric payload is limited to visible Explorer selectors. Profit factor
  and row-level N/A states have exact trader-facing explanations, and visible
  Help now matches the Result/Rank by behavior without using `Journal` as the
  product name.

The final bounded matrix passes 8 files and 59 tests with one worker and no
file parallelism. It covers the complete 12-sort trade-row contract, exact
decimal/rational/return comparison, readable duration formatting, dynamic
Result-dependent option availability, all primary and advanced filters,
Gross/Net and Wins/Losses/Flat reconciliation, pagination/cursor rejection,
multi-currency partitions, metric capability availability, query validation,
fact normalization and the visible Next.js/UI/Help boundary. Targeted ESLint
passes for all 14 files in this slice, and targeted diff whitespace validation
passes.

The current whole-project TypeScript check reports no Trade Explorer error. Its
four failures are concurrent work in Data Decisions and the AI language
inventory. The required dashboard-template verifier remains 5 of 7: its two
failures are concurrent `feature-help-link.tsx` and `dashboard-shell.tsx`
changes owned by the mobile-friendliness session. Those files were preserved.

No browser server, production build, database mutation or broad regression
suite ran in the sixth pass. Port 3010 remains stopped at the owner's request
and will not be restarted until the owner asks to review the page or starts it
independently. Visual and live interaction acceptance therefore remains the
only QA boundary not completed for this correction.

### Seventh through ninth QA passes

The seventh pass restarted at the action, client-state and metric-request
boundaries. It removed Result-specific win/loss/flat counts that duplicated the
already-filtered trade count, compares draft and applied queries by their actual
values instead of object identity, limits the base metric request to values the
current result tables use, and refreshes safely after session, workspace or
account access changes. The opaque cursor audit confirmed that the cursor digest
already excludes request time and pagination state while retaining every
population filter, fact revision and row order.

The eighth pass compared calculation meaning as well as metric identifiers. It
removed the duplicate Expectancy/average-P/L ranking from this compact Explorer
selector, uses the selected Gross or Net P/L directly for Trading Days instead
of displaying the same daily result twice, treats canonically equivalent numeric
and time filters as the same draft, and prevents an older response from
overwriting a newer Highest/Lowest choice. Net Result filtering now retains the
omission count for trades whose result cannot be classified without fee facts.

The ninth pass tightened that fee boundary: a missing-fee trade remains visible
in Net coverage when its Net Result is unknowable, while a factual Gross Result
can exclude it before fee coverage is counted. The fee-coverage explanation now
appears in grouped views as well as Trades. Oversized grouped results receive a
plain request to narrow the filters, stale pagination cursors explain that the
results changed, and the server rejects metrics outside the same strict Explorer
allowlist used by the visible Rank by control.

### Tenth QA pass — first clean pass

The tenth pass restarted from the complete user-facing promise matrix and found
no new Trade Explorer issue. The bounded checkpoint passes 9 files and 60 tests
with one worker and no file parallelism. It covers query contracts, exact math,
fact normalization, capability availability, all primary and advanced filters,
all 12 individual-trade row orders, grouped orders, Gross/Net plus
Wins/Losses/Flat reconciliation, fee-complete and fee-incomplete coverage,
multi-currency separation, cursor invalidation, readable duration and money
formatting, strict visible/server metric alignment, stale-response handling,
account-scope recovery, trader-facing copy and Help coverage.

Targeted ESLint passes for all 15 Trade Explorer-owned TypeScript and TSX files.
Targeted diff whitespace validation passes. The whole-project TypeScript check
reports no Trade Explorer error; its four errors are concurrent work in Data
Decisions and the AI language inventory. The required dashboard-template verifier
passes 5 of 7 checks; its two failures remain concurrent shared mobile-session
changes in `feature-help-link.tsx` and `dashboard-shell.tsx`. Those files were not
changed by this work. Visible Trade Explorer copy contains no `trading journal`
name. Port 3010 is not listening, as requested.

No live browser run was made because the owner asked that port 3010 remain off
until review is requested. No production build, database mutation, commit, push
or deployment was performed in these passes. Live visual/interaction acceptance
and the separately approved notes/tags/rules Review panel remain the next owner
review boundaries.

## Next action after plan approval

Complete the owner visual/interaction check when requested. After owner
approval, add the completed-trade Review panel over the existing stable
annotation contracts without placeholder controls. Recheck the now-aligned
Trade Explorer Help coverage if the approved interaction changes.

### Mobile presentation integration

After the Trade Explorer source boundary was released, the dashboard mobile
slice preserved its completed query and result behavior while replacing the
phone-sized filter grid with a full-height filter drawer. Grouped results and
individual trades now use readable phone cards; each trade card preserves all
displayed evidence and expands its exact executions in place. Desktop keeps the
compact table presentation. Grouped views use 10/25/50/100 client-side rows per
page, while individual-trade previous/next actions remain bounded by the
existing opaque cursor contract.

Core Analytics Help now explains the phone filter, card and execution-detail
interaction. Targeted `git diff --check` passes. No automated test suite,
typecheck, lint, build, commit, push or deployment was run during this
owner-approval slice.

Controlled browser acceptance now passes at desktop, 390 x 844, 320 x 568 and
844 x 390. Desktop retains its table; mobile uses cards with no horizontal
overflow. The full-height filter drawer has unique field IDs and 44-pixel
actions. A trade card expanded its exact two executions. The grouped Ticker
view defaulted to 25 bounded rows, changed to 10, and advanced from `1-10 of
135` to `11-20 of 135`. No duplicate IDs, console errors or runtime error
surface appeared. Owner visual approval remains the next checkpoint.
