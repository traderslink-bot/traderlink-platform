# User-Defined Trades And Post-Entry Review Plan

**Status:** Implemented; staging correction in progress; release handoff pending

**Date:** 2026-09-04

**Controlling tracker plan:** [Day Trade Tracker And Swing Trade Tracker Plan](day-and-swing-trade-tracker-plan.md)

**Implementation progress:** [User-Defined Trades And Post-Entry Review Progress](user-defined-trades-and-entry-review-progress.md)

## Workspace Edit boundary

The Workspace Edit Trade drawer does not save a closed factual round trip plus
a later open position as one trade, and it does not save an existing closed
trade as open. Those previews state that the edit cannot be saved as one trade
there and do not offer confirmation. This boundary leaves the factual execution
ledger unchanged.

## Outcome

Keep the Journal's factual execution and zero-to-zero round-trip reconstruction
unchanged, while giving traders a second, user-authored definition of a trade.
A trader may merge compatible round trips into one trade they consider a single
trading idea. Once merged, that user-defined trade is the unit shown for
ordinary trade counts, trade-level review, and Trade Analyzer selection.
Where a trade-facing screen currently shows the executions for one round trip,
it instead shows the combined included executions for that one user-defined
trade in factual chronological order, with a deterministic factual tie-breaker
when executions share a timestamp. The underlying round trips remain available
as factual detail; they do not appear as separate user-facing trades while they
are members of an active group.

The first user interface is a shared post-entry review panel. Workspace Add
Trade keeps its drawer open after the server preview identifies the resulting
trades. Day Trade Tracker uses the same review panel for full-session entry and
review. The small entry drawer does not force a trader to navigate away merely
to add notes, tags, rules, merge trades, or select Analyzer runs.

## Owner-controlled user-facing copy boundary

This implementation does not add optional descriptions, general instructions,
feature explanations, promotional copy, notifications, or newly authored
empty-state prose. It implements the approved behavior, data, controls, and
machine-readable states; the owner will add that broader user-facing wording
after these updates are complete. Concise, decision-critical validation,
warning, and status text is permitted where execution entry, trade
construction, merging/unmerging, a changed trade, or an unsafe/stale save must
tell the trader what happened and what action is required. Existing copy is
left unchanged unless the owner explicitly required its removal in this plan;
removing obsolete Moomoo Analyzer requirements does not authorize replacement
prose. Required accessible names for new interactive controls use only their
approved short control labels.

## Fixed product decisions

- Raw executions, factual round trips, allocation history, import provenance,
  Data Decisions, and exact financial values remain canonical and unmodified.
- No existing trade is automatically grouped or migrated. Existing historical
  round trips remain one displayed trade each unless a later, separately
  authorized workflow permits that trader to group them.
- New manual-entry and import results begin as one user-defined trade per
  factual round trip. The trader alone may merge or unmerge them.
- A merge is never automatic. Suggestions are limited to the same account and
  ticker, currency, and direction. Same-date candidates appear first; a trader
  may explicitly choose compatible same-ticker round trips across dates for a
  swing trade. Members must be consecutive in that compatible chronological
  chain. The server rejects a selection that skips an intervening compatible
  round trip because leaving it out would make the trade story and Analyzer
  incomplete, and the review provides a concise decision-critical warning for
  that rejected merge.
- An unmerged factual round trip counts as one trade. A merged set of two or
  more round trips counts as one trade in every user-facing trade list and
  count. Workspace, Trade Explorer's individual-trade view, and Trade
  Breakdown must read the active logical-trade projection. Raw round trips
  remain available only as execution and factual-detail evidence.
- Underlying round trips remain visible inside a merged trade as factual
  history. They are not hidden, rewritten, or represented as a different
  execution chain.
- A merged trade's factual span begins at its first included entry and ends at
  its final included exit. In the scoped trade-facing screens, its displayed
  P/L, result, and quantities are calculated from every included factual round
  trip so that they describe the trader's one actual trade.
- Only completed factual round trips may be a member of a logical trade in
  this first release. Open positions remain their own factual position and are
  never selectable for merge or Analyzer use.
- When all selected same-date trades have the same Day Trade or Swing intent,
  the merged trade keeps that intent. If their intents differ, merge
  confirmation requires the trader to choose Day Trade or Swing; the server
  never infers which one they meant. A cross-date merge must be explicitly
  saved as a Swing trade. The
  chosen logical-trade intent drives the existing Workspace filters, which are
  the place to find Swing trades in this release. For a cross-date Swing,
  Workspace sorting and date-range filtering use its final-exit date in the
  account trading timezone and display its opening date. It never changes a
  raw round trip's factual classification.
- Existing rule results remain tied to the factual round trip that produced
  them. The merged-trade view displays that evidence together without
  duplicating or moving a rule result.
- A trader may add a new rule review to an active logical trade after it is
  saved. That review has its own logical-trade target; it does not rewrite,
  copy, or replace factual member rule evidence. On unmerge it remains with
  the retired logical-trade history, like group-level notes and tags.
- Notes and tags remain preserved on their originating round trip. Once a
  user-defined trade has been saved, its review surface can let the trader add
  new group-level notes/tags and display selected member annotations; no
  existing annotation is silently removed.
- If a logical trade is unmerged, its group-level notes and tags remain on the
  retired logical-trade history record. They are never copied or silently
  applied to the restored one-member trades; the member's own annotations
  remain exactly where they were.
- Analyzer requests are made only for an explicit selected completed
  user-defined trade. Grouped analysis consumes the chronological executions of
  every included round trip as one selected trading idea. The current
  one-minute Trade Analyzer is selectable only when that complete combined
  execution ledger falls within one `America/New_York` market date. A
  cross-date Swing remains a normal merged trade for P/L, Calendar, details,
  notes, tags, and rules, but its Analyzer action is unavailable. It does not
  consume a Moomoo request. Multi-day Swing analysis is a separate future
  feature. The owner will add any explanatory wording later.
- If an underlying edit makes a member incompatible or removes it from a saved
  group, the group becomes `Review required`; its current factual members
  display and count separately until the trader resolves the group. A normal
  edit that retains compatible members keeps the group intact, records the new
  current member version in logical-trade history, and leaves the former member
  version historically reviewable.
- A saved Analyzer result is a historical membership/version snapshot. Any
  member edit or unmerge makes that result stale for the active logical trade;
  the trader must explicitly request a new analysis. It is never silently
  transferred to a changed group.
- This feature does not introduce a logical-trade delete action. Existing
  raw-round-trip deletion remains a factual-detail operation; a logical trade
  never presents it as though it would safely delete one member or all members.
  A multi-member delete workflow needs its own separately approved design.
- During beta, every Analyzer market-data request uses one designated,
  server-side shared Moomoo connection. A trader's own broker connection is
  never used to analyze their trade, and the shared connection's identity and
  credentials are never exposed in the product, logs, or responses. Analyzer
  runs are always explicit user selections, and automatic post-save analysis
  stays removed. A user must have at least one Moomoo-request use remaining to
  start any new analysis. After that access gate passes, the server checks
  stored candle coverage before reserving or consuming a use. Complete stored
  coverage is free to analyze and leaves the balance unchanged. A cache miss
  that will start a request through the designated shared connection consumes
  a use. At zero remaining, the user cannot start another analysis even if its
  candles are already stored or its session fetch is already in flight. Work
  already requested and existing ready results remain accessible. The worker
  resolves only that
  configured provider scope; if it is unavailable, it reports the
  provider-unavailable state and never falls back to the requesting trader's
  connection. The beta defaults are 10 actual Moomoo acquisitions per user per
  day and 100 per user per fixed 30-day allowance period. These are
  request-protection allowances, not limits on the number of trades that may be
  analyzed: one compatible stored-candle set may support additional analyses
  without reducing either allowance.
- Every form that lets the trader select newly saved trades for Analyzer shows
  one compact `Analyzer uses` block with `{daily} available today` and
  `{period} available this period · resets in {days} days`. The number of
  additional trades selectable in that form is the lower of the current daily
  availability and current 30-day-period availability, never less than zero.
  The beta selection UI conservatively permits no more newly selected trades
  than that displayed remainder: each
  selection occupies one visible selection slot and deselection restores it.
  This client selection count is not an allowance deduction. After processing,
  the form refreshes from the server-authoritative balance; cache-backed work
  and coalesced analyses do not reduce the actual balance.
- When `Save trades` accepts those selections, its existing atomic transaction
  places one temporary allowance reservation per accepted selected trade. The
  server calculates daily availability and 30-day-period availability
  separately by subtracting their applicable consumed uses and active
  reservations, then exposes the lower value as the selectable remainder. This
  conservative beta reservation prevents another tab from accepting the same
  final use; it is not a permanent deduction.
- At zero, the Analyzer selection control remains visible but cannot add a new
  selection. Clicking it shows the approved concise status, `You have used all
  available Trade Analyzer uses.` Trade saving remains available. Existing
  requested/ready work and the one lineage-scoped correction opportunity remain
  governed by their existing exceptions rather than this new-selection gate.
  In particular, if the original acquisition consumed the user's final use,
  its approved first correction still runs. Later new trade-entry reviews show
  zero and cannot select new Analyzer work until allowance is available again.
- The Moomoo-request allowance belongs to the stable Platform user across all
  of that user's workspaces and trading accounts; switching accounts cannot
  reset or multiply it. New requests enter one database-backed FIFO queue for
  the designated Analyzer connection. Only one outbound Analyzer market-data
  acquisition may use that connection at a time. A repeat click, retry, or
  second tab for the same analysis snapshot does not create a duplicate queue
  item or Moomoo request.
- Owner-only Analyzer administration exposes the user daily allowance (default
  10), user 30-day allowance (default 100), global rolling-24-hour Moomoo
  acquisition ceiling (default 120), minimum delay between provider
  acquisitions (default two seconds), and an Analyzer enabled/disabled control.
  It also supports an individual user's allowance override and an individual
  allowance reset. Global provider concurrency remains fixed at one and is not
  an editable setting. This beta slice does not add a separate configurable
  trade-analysis count.
- Owner administration defines usage without mixing free analysis with user
  deductions. Daily and 30-day-period user usage count only user-charged
  acquisitions. Global rolling-24-hour usage and total acquisition reporting
  count every Moomoo candle acquisition, including correction-waived
  acquisitions. An acquisition enters those counts when provider dispatch
  begins under the established reservation rule.
- An individual override independently replaces that user's daily allowance,
  30-day allowance, or both until the owner removes it; removal returns the
  user to the current defaults. Separate owner actions reset the user's current
  daily charged usage or current 30-day-period charged usage without deleting
  the acquisition ledger. Beta administration does not add override
  expiration, scheduling, or a separate management-history interface. Setting
  changes and resets remain auditable server-side.
- Per-user daily and fixed 30-day allowance boundaries use
  `America/New_York`. The 30-day cycle begins when that Platform user's
  first real-account Analyzer selection is successfully accepted and reserved,
  covers 30 consecutive New York calendar dates, and resets at midnight
  starting the next 30-day cycle. Merely opening a form, reading the count, or
  changing an admin default does not activate it. Before activation, the real-
  account UI shows the full daily and period allowances and `resets in 30
  days`. The UI derives later whole days until reset from the server. An
  acquisition belongs to the daily and 30-day period in which its outbound
  Moomoo acquisition begins, even if the user submitted it earlier. An owner
  usage reset changes the current usage value without restarting the 30-day
  cycle.
- Demo account trades are examples for product review and are not eligible for
  new Analyzer selection, correction, allowance reservation, deduction, or
  Moomoo acquisition because the example executions are not guaranteed to
  match real candle data. Existing prebuilt Demo Analyzer results remain
  visible as view-only examples. Demo activity never activates or changes the
  stable Platform user's real-account allowance period, and Analyzer allowance
  counts are not presented as usable Demo controls.
- Admin setting increases apply to new work immediately. A decrease prevents
  later work once the applicable limit is reached but does not cancel an
  acquisition already dispatched. Disabling Analyzer prevents new work while
  preserving ready results and allowing already-dispatched provider work to
  finish. All limits and overrides are stored server-side and enforced
  atomically with the allowance ledger and global provider lease.
- A reservation becomes a consumed use when the outbound Moomoo market-data
  acquisition actually begins, not when the analysis result is saved. If
  Moomoo returns no coverage or an error after receiving that request, the use
  still counts because the shared connection was used. Factual ineligibility,
  execution/market-data mismatch detected from stored facts, a complete cache
  hit, provider unavailability detected before dispatch, cancellation before
  dispatch, or an expired worker lease that never reached Moomoo releases or
  avoids the reservation. Internal pagination/retries for one bounded session
  acquisition do not become extra user allowance charges. One Analyzer candle
  acquisition counts once regardless of how many internal HTTP pages or
  retries it requires. Separate provider rate and retry controls limit the
  underlying outbound calls. Owner administration reports total Analyzer
  candle acquisitions, user-charged acquisitions, correction-waived
  acquisitions, and current daily, 30-day-period, and global usage using that same
  once-per-acquisition unit. Cache-only analysis, pagination, and retry totals
  do not require dedicated beta admin reporting; ordinary operational logging
  may retain the information needed to diagnose provider failures.
- A selection reservation becomes consumed only when its work causes a Moomoo
  candle acquisition. Complete compatible cache coverage releases it. When
  several reserved selections are coalesced into one acquisition, that one
  acquisition consumes one reservation and the redundant reservations are
  released. Factual ineligibility, cancellation, or other work that ends before
  provider dispatch also releases its reservation. Release and consumption are
  atomic and idempotent.
- When an acquisition finds that the trader's execution information must be
  corrected before analysis can complete and records the Analyzer's factual
  execution-correction-required outcome, that consumed use grants one
  correction resubmission for the same analysis lineage. The first corrected
  resubmission does not consume another use even if its changed execution span
  requires a new Moomoo candle acquisition, and this single correction remains
  permitted if the original acquisition reduced the user's balance to zero.
  This waiver is consumed by that first corrected resubmission and cannot be
  transferred to another trade or unrelated analysis. The server permits it
  only through the correction workflow for a new version of the same saved
  logical trade. Ticker, execution date, time, price, quantity, or side may
  change when correcting that trade because any of those entered facts could
  have caused the mismatch; the correction credit follows the stable logical
  trade and recorded Analyzer correction lineage, not matching field values.
  If the trader corrects the execution information again, a further
  acquisition consumes another use; compatible stored candles still avoid a
  deduction under the normal cache rule. The correction lineage, waiver state,
  dispatch, and charge outcome must be server-authoritative and auditable so
  repeated clicks or concurrent tabs cannot create multiple free acquisitions.
- One original user-charged candle acquisition can authorize at most one
  correction-waived candle acquisition, even when the original acquisition
  supplied several selected trades that report execution-correction-required.
  The first corrected resubmission consumes the granted correction opportunity
  whether it uses stored candles or needs an acquisition. Stored-candle work
  remains free; if that first correction needs Moomoo, the corresponding
  acquisition is waived. If several trades received correction-required
  outcomes from the same original charged acquisition, the first eligible
  corrected resubmission atomically claims the correction opportunity. If it
  is cache-only, no acquisition is needed and the opportunity is still
  consumed; if it needs Moomoo, that one acquisition is waived. Every
  correction acquisition still uses the single global queue, obeys provider
  spacing and rate protection, counts toward the global rolling-24-hour
  ceiling, and appears in owner administration.
- One shared cache-miss acquisition may supply several trades selected together
  by the same user when they need the same compatible market-session coverage.
  It consumes one use when that one Moomoo acquisition starts, not one use per
  resulting analysis. Other users' submitted work remains queued; it never
  calls the shared connection concurrently. A ready result for an unchanged
  snapshot opens without a use, and an
  explicitly requested analysis for an edited snapshot does not reduce the
  balance when saved candles cover it, provided the user had at least one use
  remaining when starting it. The allowance ledger, session lease,
  provider-dispatch marker, and job idempotency are coordinated so concurrent
  requests cannot exceed the initiating user's remaining allowance or charge
  for work that never reached Moomoo.
- Analyzer market-data delivery is cache-first. Before a provider request, the
  server looks up the shared one-minute market-session cache for the provider
  version, U.S. stock symbol, `America/New_York` trading date, and session
  policy. If saved candles cover the executions and required post-exit window,
  the Analyzer uses that evidence without a Moomoo request, regardless of the
  trade's age. After each acquisition completes and persists eligible candles,
  the next queued request rechecks coverage before deciding whether another
  Moomoo request is required.
- `Stored candle coverage` means a verified compatible Analyzer candle set with
  the same provider key and adapter version, symbol/exchange identity, New York
  trading date, one-minute interval, session policy, and enough uninterrupted
  coverage for this trade's executions and required analysis window. A partial
  set that still requires Moomoo consumes one request when that acquisition is
  dispatched. Candle-shaped rows from another module, provider/version, or
  account-scoped legacy contract are not silently treated as reusable evidence.
  An already-ready result for the exact unchanged analysis snapshot opens
  directly and also requires no provider request.
- Request ordering is fixed: first return an exact already-requested queued or
  ready result; then enforce factual eligibility and the hard positive-balance
  gate for any new analysis; then use complete compatible stored coverage or
  place the request in the single shared-connection queue. When the request
  reaches the head of that queue, the worker rechecks compatible coverage. If
  an earlier request filled it, analysis proceeds without reducing the user's
  balance. Otherwise the worker requests only the missing required range and
  consumes one use when that outbound acquisition begins. A user at zero cannot
  start new cached or provider-backed analysis.
- Before any outbound acquisition, the worker also enforces the configured
  global rolling-24-hour ceiling and the minimum provider-request spacing. A
  Moomoo rate-limit response honors `Retry-After` when supplied and otherwise
  uses bounded exponential backoff. Retries that belong to one bounded
  acquisition do not create additional user allowance charges.
- A trader may request an eligible historical logical-trade analysis on
  demand. Stored candle coverage makes that analysis free. When shared saved
  coverage is missing, the server requires an available Moomoo-request use and
  requests the one-minute candles from the designated connection rather than
  rejecting the trade because of age. A historical-coverage boundary is set
  only after the provider probe establishes the real supported window; until
  then, a provider no-coverage outcome is stored as a distinct state and does
  not pretend the trade was analyzed. The owner will add its user-facing
  wording later. This release does not prefetch old sessions merely because
  they might be requested later.
- Beta shared-cache retention begins on 2026-09-04. During the transition,
  a request for a trade whose final exit is within the preceding ten 24-hour
  days persists the full shared market-session candles for reuse by another
  user trading the same symbol/date. From that activation date forward, every
  trade newly submitted to TradersLink persists all candle data retrieved for
  its Analyzer request, regardless of the trade's execution date. An older,
  pre-activation trade outside that ten-day transition window can still fetch
  and analyze through Moomoo, but does not add a new reusable full-session
  cache entry. The analysis result and its existing immutable per-analysis
  evidence remain saved for that trader; only the low-value shared full-session
  reuse cache is skipped. Any already saved historical candle session remains
  reusable and is not discarded. No cache pruning runs during beta; any later
  monthly cache cleanup needs its own approved retention design and must not
  erase saved analysis evidence.
- `Submitted from 2026-09-04 onward` is determined only from the server-recorded
  accepted timestamp of the trade's factual entry/import command, never a
  browser timestamp, execution date, or later Analyzer-click time. The command
  and read model carry that trusted value into cache-retention selection.
- Before a public historical-age message is set, the owner must run the
  required coverage probe through their own account: select real historical
  trades for on-demand analysis and record only the trade date, request
  outcome, and coverage result. The probe uses the same designated shared
  Moomoo connection and establishes how far back one-minute data is actually
  available; it must not expose account credentials or private trade details.

## Entry and review flow

### Workspace Add Trade

1. The trader enters chronological executions and chooses Day Trade or Swing.
2. `Review trades` asks the existing authenticated server preview to construct
   factual round trips. No Journal facts are written at this point.
3. The drawer changes to `Review trades found` and remains open. It lists the
   previewed groups with ticker, direction, entry/last-execution time, share
   information, and factual state.
4. The trader may return to execution entry, merge/unmerge compatible preview
   groups, and select completed same-market-date resulting trades for later
   Analyzer requests. The review shows the shared `Analyzer uses` block:
   `{daily} available today` and `{period} available this period · resets in
   {days} days`. Selection is capped by whichever availability is lower.
   Each newly selected trade occupies one visible slot and deselection restores
   it, so the form does not accept more selections than the displayed
   remainder. Cache checks and deductions remain internal; the review does not
   identify which trade used stored candles. At zero, clicking the still-
   visible Analyzer selection control shows `You have used all available Trade
   Analyzer uses.` without blocking `Save trades`. Already-requested queued
   work and ready results remain available. A cross-date Swing's current one-
   day Analyzer control is unavailable and cannot be selected; the owner will
   add its explanation.
5. `Save trades` commits the exact previewed executions and chosen user-trade
   grouping as one authenticated, atomic command: it either saves both the
   factual entries and their intended logical-trade memberships, or saves
   neither. If the preview expires, the entries change, the selected account
   changes, or a selected member has changed, it saves nothing and asks the
   trader to review again. The same database transaction creates idempotent
   Analyzer queue records and temporary allowance reservations for any accepted
   selected eligible resulting trades. It does not call Moomoo during the save;
   the background worker processes those committed records afterward under the
   approved cache, queue, and allowance contract. Therefore a successful trade
   save cannot lose accepted Analyzer selections, while a failed save creates
   neither trades, Analyzer queue work, nor reservations. The action remains
   labeled `Save trades`; it does not become a separate `Save and analyze
   selected` action.
6. The drawer stays on the saved review only while the server can return a
   bounded, account-scoped result. Each saved trade can then expand its
   Journal section for notes, tags, and rules. It never chooses a trade by
   browser guess.

### Day Trade Tracker

Day Trade Tracker keeps its own existing full-day execution-entry form. It
uses the shared post-entry trade-construction review only after the trader
submits those executions: merge/unmerge and eligible Analyzer selection happen
before the save. Once saved, the tracker returns to its existing broader session view
where the trader adds trade notes, tags, and rules, alongside the day-level
session notes/tags/rules and review context. It is the natural screen for a
trader reviewing an entire session; it is not required merely to finish a
Workspace entry.

Its trade-selection review uses the same remaining-count and zero-use behavior
as Workspace Add Trade. This shared behavior is implemented once rather than
giving the two forms different allowance calculations or messages.

### Workspace drawer tab change

The standalone pre-save `Journal` tab is removed from new-entry mode only after
the review panel replaces it. Journaling is not removed: it moves to the
expanded resulting-trade review item where the target is unambiguous. Saved
Trade Details continues to expose the existing Journal content.

### Saved-trade merge and unmerge

The existing Edit Trade drawer is the beta post-save merge/unmerge surface; no
separate route or full-page merge workflow is added. `Merge Trade` changes the
drawer temporarily from editing to candidate selection while keeping the
current trade selected. The drawer requests a new bounded, authenticated
server merge-candidate response for that current saved trade; it never derives
candidates from the browser's existing table rows. Same-day compatible
candidates appear first. Eligible cross-date candidates appear separately
under `Other dates` and confirmation classifies the result as Swing. The trader
selects candidates by the opaque references in that server response, reviews
the resulting combined trade and resulting trade count, then confirms with
`Merge Trades`. A merged trade offers `Unmerge Trade` from the same drawer.

Merge/unmerge never runs against unsaved execution fields. If the Edit Trade
form is dirty, the trader must save those execution changes or discard them
before entering merge selection. The server then derives candidates from the
new current trade version and revalidates them again when the merge is
confirmed. The drawer returns to the saved trade after the command succeeds.

### Offline boundary

Offline entry preserves the current device outbox for factual executions only.
It cannot show a server-derived `Review trades found` panel, create a guessed
logical grouping, or select Analyzer work. After a successful synchronized save
the app may present the bounded saved-trade review so the trader can explicitly
merge/unmerge or request analysis while online.

## Required beta connection and copy-removal changes

These are implementation requirements of the shared Moomoo provider change,
not edits to make during plan review.

### Account Trading

On `/account/trading`, keep the **Broker connections** title. Remove the
**Attention** heading, the introductory/attention text that presents a personal
Moomoo connection as a Trade Analyzer requirement, and the **About Moomoo
data** link. Do not add replacement descriptive or instructional copy in this
slice; the owner will supply it later. Moomoo connection controls remain only
for supported trade importing and are not presented as an Analyzer requirement.

### Day Trade Analyzer pages

Remove the quoted user-Moomoo requirement from the shared no-analysis state on
every current Day Trade Analyzer route:

- `/analytics/trade-analyzer/day`
- `/analytics/trade-analyzer/day/trades`
- `/analytics/trade-analyzer/day/entry-exit`
- `/analytics/trade-analyzer/day/green-to-red`
- `/analytics/trade-analyzer/day/mfe-mae`
- `/analytics/trade-analyzer/day/candle-patterns`

The associated **Connect Moomoo** action and conditional Moomoo-connection
prompt are also removed from these Analyzer pages. No Analyzer surface may
claim that the signed-in trader must connect Moomoo; the designated shared
connection is server-only infrastructure.

This is also an eligibility change, not copy-only. Analyzer queueing must stop
checking the requesting user's Moomoo connection and must remove the current
seven-day eligibility rejection. Eligibility comes from the selected active
logical trade, the one-market-date Analyzer boundary, entitlement, and
supported U.S. stock facts and a positive Moomoo-request balance for every new
analysis. After that gate, complete cached candles permit analysis without
reducing the balance; a cache miss consumes one use when the designated shared
connection is called. A
missing requesting-user connection never returns `connection_required`;
shared-provider failure, historical no-coverage, cache-miss allowance
exhaustion, and factual ineligibility remain distinct plain outcomes.

Before implementation acceptance, remove the obsolete Analyzer connection
requirement from Workspace first-time onboarding and Trade Tracker alerts/status
as well as the shared Analyzer prompt usage. On `/account/trading`, remove
Analyzer claims from reconnect warnings and Broker connection helpers without
adding new explanations. Remove the same obsolete requirement from Trade
Analyzer/Tracker Help guides without authoring replacement prose. Preserve
accurate existing Moomoo execution-import controls and labels, and do not change
unrelated chart connection policy without owner approval.

## Data and read-model contract

1. Add an account-scoped, trader-owned logical-trade record, version/history,
   and membership record. Membership points to stable factual round-trip
   identity and records the member's version at the grouping event; it never
   replaces execution or allocation evidence.
2. Each newly accepted factual round trip receives a one-member logical trade.
   Merge replaces those active one-member logical-trade views with one active
   multi-member logical trade. Unmerge restores active one-member views.
   Pre-feature factual round trips without a persisted logical record read as
   one-member logical trades without a destructive backfill; a record is
   materialized only when a new permitted grouping command needs one.
3. A factual round trip belongs to at most one active logical trade for its
   account. Membership changes are authenticated, optimistic, append-only or
   otherwise historically reviewable, and reversible by the trader.
   The schema and one immediate write transaction enforce that active-membership
   invariant. A second tab or delayed command that overlaps a membership
   already changed by another command makes no partial change and returns the
   plain instruction to review the current trades again.
   The server revalidates completed state, same account/ticker/currency/
   direction, and consecutive compatible order for every command; client-side
   guidance is never the authority for membership.
4. A raw-round-trip edit or rebuild that removes a grouped member or changes
   its ticker, currency, or direction marks the affected logical trade for
   review and returns its current factual members to separate displayed/count
   units until the trader resolves the group. It never silently moves a member
   into a different trader-defined group.
5. A logical-trade command derives every member only from the signed server
   entry preview, bounded post-import result, or fresh bounded authenticated
   merge-candidate response for the current saved trade that initiated it.
   Browser-provided ticker, price, quantity, or historical identifiers are
   never trusted to add a member. Manual save commits are atomic with their
   memberships and selected Analyzer queue records, use the existing
   expected-account selection reference and idempotency key, and reject
   stale/changed previews or a changed active-membership version without a
   partial write or orphaned Analyzer job.
6. Create one shared account-scoped logical-trade read model for Workspace,
   Calendar, Day Tracker, and Trade Details. Workspace, Calendar, and Trade
   Details use the active logical trade and its combined chronological
   executions. Day Tracker uses the same resulting trade for its same-day
   session review and its shared post-entry review panel, without becoming a
   multi-day Swing lifecycle view. Raw-round-trip views remain available where
   factual detail is the purpose.
7. New trade-facing links, drawers, edit/review operations, and Analyzer
   selection use an authenticated opaque logical-trade reference rather than a
   raw `roundTripId`. Existing raw-round-trip links remain factual-detail
   links; they never guess that a member should open a containing active group.
8. Group-level note, tag, and new rule-review records use the logical-trade
   identity and the same account-scoped authority. Existing raw annotations and
   rule evidence remain independently readable factual records. Retiring a
   group through unmerge never copies its group-level records to the members.
9. Preserve the current Account P/L preference and fee treatment, but apply
   them to the active logical trade in the scoped trade-facing screens. Its
   displayed P/L/result is the sum of every included member's current
   display-eligible P/L value, so no blank-fee member is omitted. Its displayed
   quantities use the combined member executions. This changes the calculation
   unit from one round trip to one active logical trade; it does not change
   Analytics or Trade Explorer calculations.
10. Cursoring, sorting, and filtering for ordinary trade lists occur at the
   logical-trade level, after memberships are resolved. A page must never
   split one logical trade into multiple rows or count it once per raw member.
11. Logical-trade percentage result uses the displayed logical-trade P/L divided
   by the sum of all included entry-execution notional. It never averages the
   percentages of its member round trips. Display total-entry shares and
   total-exit shares are the sums of the included execution quantities; a
   maximum-position-size label, if shown, is the highest factual position held
   at any point in the combined execution ledger, not the sum of member peaks.
12. A cross-date Swing trade appears once in Calendar, on the final-exit date
    in the account's configured trading timezone, and visibly states its
    opening date. Calendar does not duplicate that whole trade's count or P/L
    across every date it touched.
13. This release does not add or depend on a separate Swing Trade Tracker.
    Workspace filters and Trade Details are the logical Swing discovery and
    review surfaces. Day Trade Tracker remains a day/session entry and review
    surface; it does not become a multi-day Swing lifecycle view.
14. Analytics and Trade Explorer remain unchanged in this slice. Execution and
   market-context metrics remain raw-factual metrics unless the versioned group
   Analyzer has calculated that exact logical-trade event stream. A later,
   separately approved analytics scope can decide which aggregate measures
   should use logical trades.
15. Add a Platform-user-scoped Moomoo-request allowance ledger. Its period
    boundaries use the configured daily and fixed 30-day beta policy, with
    defaults of 10 and 100 actual Moomoo acquisitions respectively. Its
    reservation is associated with the initiating user and
    the unique shared market-session acquisition, not every logical-trade
    analysis that consumes those candles. Cache decision, queue order,
    reservation, provider-dispatch finalization, pre-dispatch release,
    head-of-queue coverage recheck, and expired-lease recovery must be auditable
    without storing provider credentials or exposing another user's activity.
    Daily and 30-day-period boundaries use `America/New_York`, and usage is
    assigned when the outbound acquisition begins. The 30-day cycle is anchored
    to the first successfully accepted and reserved real-account Analyzer
    selection. Viewing the allowance or changing defaults does not activate it,
    and an admin usage reset does not move its reset date. Demo activity is
    excluded from the ledger.
    The available balance presented for new selection subtracts active
    selection reservations as well as consumed uses. Reservations belong to
    accepted queue records and are released or consumed idempotently.
16. Cache resolution and allowance reservation follow one server-authoritative
    order: exact already-requested queued/ready result, factual eligibility,
    positive-balance gate for new work, verified complete compatible stored
    candles, then the database-backed single-connection queue. At the head of
    the queue, the worker rechecks coverage and atomically reserves any still-
    required acquisition before dispatch. A partial cache requests only the
    missing required range; unrelated legacy/module candle sets are not
    eligible evidence. Zero remaining blocks all new analysis but not access to
    work the user already requested or results already produced.
    The one approved execution-correction resubmission is part of its original
    analysis lineage rather than new work, so its single-use waiver may proceed
    at zero balance. A later correction is new chargeable work whenever it
    requires another acquisition.
    The selection UI's one-slot-per-trade budget is conservative presentation,
    not the ledger authority. Save revalidates the current remaining allowance
    server-side and atomically reserves one slot per accepted selected trade. A
    concurrent tab cannot create more accepted new selections than the current
    remainder; a trade save may still succeed when an Analyzer selection is
    rejected by this recheck. Actual usage remains once per dispatched
    acquisition. Cache outcomes release their reservations; coalesced work
    consumes one and releases its redundant reservations.
17. The Analyzer's shared Moomoo provider has a global concurrency of one.
    Completing one acquisition wakes or advances the next queued request
    subject to the configured provider-request spacing, which defaults to two
    seconds; processing is not intentionally delayed to a once-per-minute
    cadence. The default global ceiling is 120 actual Moomoo acquisitions in a
    rolling 24-hour window. Each queued request rechecks the newly saved
    coverage before any further provider call.
18. Add owner-only Analyzer controls to the existing administration surface:
    enabled/disabled, daily and 30-day per-user request allowances, global
    rolling-24-hour request ceiling, request spacing, individual-user
    allowance override, and individual-user allowance reset. Concurrency stays
    fixed at one. Do not add a separate trade-analysis quota during beta.
    Report total acquisitions, user-charged acquisitions, correction-waived
    acquisitions, and current daily, 30-day-period, and global usage. Do not build
    dedicated cache-only, pagination, or retry admin totals for beta.
    Daily/30-day-period user usage contains only charged acquisitions; global
    and total usage include charged and correction-waived acquisitions. Daily
    and 30-day per-user overrides are independent and persist until removed.
    Provide separate resets for current daily and current 30-day-period charged
    usage without deleting acquisition history, and without beta scheduling or
    override-expiration controls.
19. Demo Analyzer is view-only. Preserve existing prebuilt analyzed examples,
    but do not offer new Demo analysis, correction resubmission, selection
    reservation, allowance use, or Moomoo dispatch. Demo activity cannot start
    or change a user's real-account 30-day period.

## Delivery slices

1. **Contract and migration:** logical-trade/membership schema, scoped command
   authority, preview/commit extensions, and compatibility behavior for
   existing rows.
2. **Shared review panel:** expose the existing server preview groups to the
   client; build the review panel, merge selection, and one-at-a-time expanded
   journaling surface in Workspace and Day Trade Tracker.
   Add the saved-trade `Merge Trade`/`Unmerge Trade` mode inside the existing
   Edit Trade drawer. Require execution edits to be saved or discarded first;
   show same-day candidates first and cross-date candidates under `Other
   dates`. Supply candidates only through a new bounded, authenticated server
   response for the current saved trade and revalidate them on confirmation.
   In both entry forms, display the compact daily and 30-day-period `Analyzer
   uses` values and days until period reset, use one
   temporary selection slot per newly selected trade, restore the slot on
   deselection, and preserve trade saving when no Analyzer uses remain.
3. **Logical-trade projections:** one shared reader plus Workspace, Calendar,
   Day Tracker, and Trade Details adoption. Workspace supplies the existing
   Swing filter over logical-trade intent; Day Tracker remains a same-day
   session surface. Existing accounts retain one trade per raw round trip until
   the user makes a permitted group. Do not change Analytics or Trade Explorer
   in this slice.
4. **Analyzer selection:** replace automatic post-save Analyzer queueing with
   explicit selected user-trade requests, and create a versioned group-analysis subject
   that snapshots every included current round-trip version rather than
   pretending a multi-member analysis belongs to one member. Its chronological
   event stream represents intermediate zero-position exits as a distinct
   temporary-flat event and preserves one final exit for the complete logical
   trading idea; it must not label the first raw round-trip exit as the final
   exit of a merged trade. Resolve complete shared cached session coverage
   before requesting the designated shared Moomoo connection. Queue all
   remaining misses behind one global connection lease. An eligible historical
   selection may request missing
   one-minute coverage while the user has an available Moomoo-request use;
   stored coverage requires no use, and provider coverage determines the
   truthful outcome. Apply the beta cache
   policy: persist all retrieved candles for a trade submitted on or after
   2026-09-04, plus the ten-day transition window; preserve individual
   historical analysis evidence without adding an older pre-activation cache
   miss to the shared reuse pool. Replace the current job-scoped provider
   resolver with a designated shared-provider resolver. The global provider
   lease serializes every Analyzer market-data acquisition. For an older
   pre-activation miss, do not publish fetched candles as a persistent reusable
   full-session cache row; retain only the analysis's required immutable
   evidence. A later queued request cannot treat that non-retained fetch as
   stored reusable coverage. For manual/session entry, create the selected
   resulting trades' idempotent Analyzer queue records and temporary allowance
   reservations in the same database transaction as the factual executions and
   logical memberships; provider work remains asynchronous and never occurs
   inside that save transaction.
5. **Imports and edit resilience:** offer the same review/merge capability for
   newly completed import results, preserve raw import facts, and require a
   clear repair path after an underlying member changes.
6. **Shared-provider copy removal:** remove personal-Moomoo Analyzer
   requirements/actions from `/account/trading`, all six Day Analyzer routes,
   related onboarding, Tracker, and Help surfaces without adding replacement
   descriptions or instructions and without removing Moomoo execution-import
   controls.
7. **Analyzer eligibility cutover:** remove requesting-user Moomoo readiness and
   the hard-coded seven-day age gate from Analyzer queue eligibility. Route
   eligible on-demand requests through the designated shared provider and the
   beta cache policy, with separate quota, no-coverage, provider-unavailable,
   and factual-ineligibility outcomes.
8. **Moomoo-request allowance lifecycle:** implement a Platform-user-scoped,
   transactional reservation ledger around shared-session cache misses and the
   single global provider queue.
   Require a positive balance for every new analysis, then analyze complete
   cache hits without reducing it; deduplicate repeated clicks/tabs; consume
   one user's use only when their queued outbound Moomoo acquisition begins;
   release work that never dispatches;
   recover expired pre-dispatch reservations; and apply separate provider
   retry/rate protection. Track a single-use, lineage-scoped correction waiver
   after an Analyzer execution-correction-required outcome; permit that first
   corrected resubmission at zero balance, then apply normal cache and
   acquisition charging to any later correction. One original charged
   acquisition permits at most one waived correction acquisition for a new
   version of the same saved logical trade submitted through the correction
   workflow. When several affected trades shared that acquisition, the first
   eligible corrected resubmission atomically claims the correction
   opportunity; it is consumed even when stored candles make that correction
   cache-only.
9. **Single shared-provider worker:** drain queued Analyzer market-data work
   serially with no concurrent request against the designated Moomoo
   connection. Recheck stored coverage for every item when it reaches the head,
   fetch only its missing required range, persist eligible new coverage, then
   advance subject to the configured request spacing, rolling ceiling, and
   rate-limit backoff.
10. **Owner Analyzer administration:** add the approved server-backed controls
    for global enablement, per-user daily/30-day request allowances, global
    rolling-24-hour ceiling, request spacing, individual override, and reset.
    Keep provider concurrency fixed at one and omit a separate analyzed-trade
    limit. Report total, user-charged, and correction-waived acquisitions plus
    current daily, 30-day-period, and global usage; leave cache-only, pagination, and
    retry totals out of the beta admin UI.

## Owner visual review checkpoints

- Workspace drawer desktop and full-width mobile: execution entry -> Review
  trades found -> save state -> expanded saved-trade Journal.
- Workspace and Day Tracker Analyzer selection: visible remaining count,
  selection/deselection slot updates, server recheck, zero-use click status,
  and trade saving still available at zero.
- Demo Workspace and Day Tracker: existing prebuilt Analyzer results remain
  visible, no new Analyzer selection/count control is usable, and no Demo
  action creates a reservation or provider request.
- Daily Trade Tracker: keep its full-day entry form, use the shared merge and
  Analyzer-selection review after entry, then return to its existing session
  journaling/review without duplicated controls.
- Merge/unmerge affordance, underlying-round-trip detail, and resulting trade
  count language, including clear guidance when a non-consecutive selection is
  not permitted.
- Edit Trade drawer saved-trade merge mode: unsaved edits cannot be merged,
  same-day candidates appear first, `Other dates` creates a Swing trade, and
  confirmation previews the resulting combined trade and trade count. The
  candidate list comes from a fresh bounded authenticated server response and
  is revalidated at confirmation.
- Same-date members with matching intent retain it; differing Day/Swing intents
  require an explicit selection before merge confirmation.
- User-facing behavior when a grouped trade needs review after an edit.
- A compatible member edit keeps the group but clearly refreshes its displayed
  result and marks its previous Analyzer result stale.
- Unmerge behavior for retired group-level notes/tags and the difference
  between a new logical-trade link and an existing factual-detail link.
- Group-level rule review alongside raw member rule evidence; no logical-trade
  delete action in this release.
- Cross-date Swing Calendar attribution uses the account trading timezone.
- Workspace Swing filter, cross-date final-exit-date ordering, and visible
  opening date; no separate Swing Trade Tracker is required.
- Analyzer request from a saved logical trade: complete shared cached coverage,
  one same-ticker/date cache miss shared by two users, and an older uncached
  request that calls Moomoo only after the user's request allowance is checked
  and records no coverage distinctly if unavailable, without adding its full
  session to the shared cache or adding owner-facing explanation copy.
- Moomoo-request allowance states in Workspace and Day Tracker: visible
  remaining uses, all new selections disabled at zero, already-requested and
  ready results still accessible, a stored-candle selection leaving a positive
  balance unchanged, double-click/retry coalescing, an edited-snapshot cache
  hit, a partial-coverage request fetching only the missing range, and a
  provider failure after dispatch consuming the one request that reached
  Moomoo. These are functional states only; this slice adds no optional
  explanation copy, cache-use notice, queue-position/status notice, or mention
  of another user's request. Preserve the existing completed-analysis result
  and notification behavior.
- Atomic entry save with Analyzer selections: successful save creates all
  accepted selected idempotent queue records and reservations without calling
  Moomoo; stale or failed save creates neither trade changes, Analyzer jobs, nor
  reservations. Cache/coalescing releases unused reservations and provider
  dispatch consumes one.
- Owner administration: daily/30-day-period usage counts only charged acquisitions;
  global/total usage also counts correction-waived acquisitions; independent
  daily/30-day overrides can be removed to restore defaults; current daily
  and 30-day-period charged usage can be reset separately without moving the
  period reset date.
- First-use activation and Demo boundary: a real user's first accepted reserved
  selection starts the 30-day cycle; passive viewing does not. Demo retains
  only its prebuilt view-only Analyzer examples and cannot affect allowances or
  Moomoo usage.
- Beta cache boundary: a trade submitted on/after 2026-09-04 saves retrieved
  candles; an older pre-activation trade outside the ten-day transition window
  retains its saved analysis evidence but does not create shared candle cache.
- Designated shared Moomoo provider unavailable: no user-connection fallback.
- Server-recorded accepted-at timestamp determines the submitted-from-today
  cache rule; the browser and later Analyzer-request time cannot change it.
- Owner-run historical Moomoo coverage probe through their own account before
  publishing a historical-age limit or related unavailable message.
- `/account/trading` Broker connections in Light and Navy Dark modes, with
  import controls preserved, no user-Moomoo Analyzer requirement, and no new
  replacement description/instruction copy.
- Every Day Analyzer route's empty/no-access state without a Connect Moomoo
  paragraph, button, or prompt.
- Workspace and Trade Tracker Analyzer entry points for a user with no Moomoo
  connection: selectable when entitlement, positive allowance, and trade facts
  permit; stored candles do not reduce a positive balance, and no personal
  connection-required redirect or alert appears.
- A Workspace edit that rebuilds a closed factual round trip into a current
  open position preserves the trader's selected Day Trade or Swing style on
  that rebuilt position. A Swing must display as `Open swing` and remain
  available through the existing Workspace Swing filter.
- A close followed by re-entry remains one closed factual round trip and one
  open position. The confirmation uses that exact result; it does not invent a
  completed logical merge or change the closed leg's factual P/L.
- After the trader explicitly confirms a Workspace Edit Trade addition, that
  new row is a separate factual execution even if its displayed facts match an
  earlier manual execution. The command must not silently deduplicate it and
  leave the confirmed edit as a no-op.
- `/account/trading` reconnect and connection-helper states discuss importing
  only; Analyzer and unrelated chart policy do not leak into that copy.

## Acceptance boundary

This work is not complete until Workspace, Calendar, and Trade Details show
the same user-defined trade and its combined chronological executions; Day
Trade Tracker uses the shared post-entry review and correctly shows same-day
session results; raw round-trip evidence remains visible and unchanged;
merge/unmerge is reversible and account-scoped. Workspace can find Swing
trades through its existing filter. Analytics and Trade Explorer remain outside
this acceptance boundary.
