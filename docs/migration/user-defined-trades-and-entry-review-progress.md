# User-Defined Trades And Post-Entry Review Progress

**Status:** Staging correction in progress; release handoff pending

**Controlling plan:** [User-Defined Trades And Post-Entry Review Plan](user-defined-trades-and-entry-review-plan.md)

## Staging correction — 2026-09-04

- Workspace Edit Trade now evaluates only the edited trade when describing the
  pending result. A normal final exit is one closed trade; an edit with shares
  remaining is one open trade; only a genuine close followed by a re-entry is
  described as multiple trades. Removing every execution is explicitly a
  delete-trade confirmation.
- Workspace Edit Trade keeps a valid factual execution save independent from
  a best-effort Analyzer/logical-trade refresh, and presents grouped member
  executions in their actual chronological order.
- The atomic Edit Trade command reuses its active Journal transaction while
  adding or removing executions, instead of attempting a nested immediate
  transaction after the trader has confirmed a valid preview.

- A merged trade is now projected as one combined row in Trade Explorer's
  individual-trade view and Trade Breakdown's supporting-trade table. The
  preserved member round trips remain available only for execution detail and
  reversible unmerge history.
- Workspace's Closed trades card now uses the logical-trade reader rather
  than the raw Analytics included-round-trip count.
- Trade Breakdown formats its opening and closing timestamps in the selected
  account timezone rather than rendering the stored UTC values as local time.
- The Workspace edit drawer reads its current merge state before rendering the
  action, retains the drawer after merge/unmerge, and requires an explicit
  unmerge confirmation with Cancel.
- A mixed completed-and-open manual save now materializes logical Analyzer
  subjects only for completed results. The open Day Trade stays savable and is
  not falsely treated as an Analyzer-eligible logical trade.

## Approved direction

- Trade Tracker retains its own full-day execution-entry form.
- Workspace Add Trade remains a separate quick-entry drawer.
- Both paths will use the same server-derived preview of the factual round
  trips created by the entered executions.
- Before saving, both paths let the trader merge/unmerge compatible resulting
  trades and select completed trades for Analyzer use.
- After saving, Trade Tracker returns to its existing session-level journaling
  flow. Workspace keeps its saved review open when it has an authoritative,
  bounded target and exposes Journal expansion there.

## Reader inventory

The current product does not have one reusable displayed-trade reader yet.
Raw factual round trips are counted separately in these user-facing paths:

- Workspace: `workspace-trade-library.ts` counts rows from the derived
  round-trip projection; `workspace-review-summary.ts` counts the selected
  round-trip rows.
- Calendar and dashboard summary: `journal-dashboard-read-model-service.ts`
  derives day and week trade counts from normalized realized round trips;
  `calendar-data.ts` and the Calendar UI display those values.
- Day Trade Tracker: `trade-tracker-platform-data.ts`, `trade-tracker-data.ts`,
  and `day-session-view.tsx` group and count ticker round trips directly.
- Trade Details, notes-session summaries, and saved review cards identify a
  trade by `roundTripId` today.
- Core Analytics and Trade Explorer use normalized Journal Analytics rows and
  trade-level count metrics. Each metric needs an explicit decision about
  whether it measures user-defined trades or factual round trips.

The new reader must become the source for Workspace, Calendar, Day Tracker,
Trade Details, Trade Explorer's individual-trade view, and Trade Breakdown
rows that currently identify a trade by one round trip. A
logical trade presents its combined chronological executions there. Raw
round-trip readers remain necessary for factual execution/allocation detail,
rule-result evidence, imports, and Data Decisions. Aggregate Analytics metrics
remain a separate calculation scope; the current correction covers the
user-visible individual-trade rows and displayed trade counts.

## Plan QA — 2026-09-04

Static source and contract review found these required additions before feature
implementation:

1. **Selected Analyzer work must replace automatic queueing.** The current
   manual-trade command queues every eligible rebuilt round trip immediately
   after a successful save. The user-approved workflow requires that command
   to stop auto-queuing and accept only explicit saved user-trade selections.
2. **Grouped Analyzer requires its own analysis subject.** Current Analyzer
   jobs, analysis history, mismatch evidence, and result readers are keyed to
   exactly one `round_trip_id` and current `round_trip_version_id`. A merged
   user-defined trade cannot be represented truthfully by choosing one member;
   it needs a versioned group-analysis request/snapshot that records all member
   round trips and their current versions.
3. **Membership eligibility needs a fixed compatibility rule.** The plan says
   same account/ticker, but Analyzer and aggregate direction need an explicit
   decision for different direction or currency members. Proposed v1 rule:
   same account, ticker, currency, and direction; same-date candidates first,
   with explicit same-ticker cross-date Swing candidates.
4. **Underlying edits need a precise displayed-count behavior.** If an edit
   changes/removes a grouped member or makes it incompatible, the group must
   enter `Needs review`. The plan needs the owner decision whether that state
   continues to count as one user trade or temporarily displays/counts its
   current factual members separately until the trader resolves it.
5. **Group annotations need a dedicated target contract.** Existing notes,
   tags, and rule reviews target factual round trips. A group-level note/tag
   must receive its own authenticated, account-scoped target; existing member
   annotations must remain where they are. Rule results should aggregate for
   display only, never be copied as new evidence.
6. **New import review needs its own post-commit entry point.** Imports cannot
   reuse a manual-entry preview verbatim. The new-import result needs a bounded
   list of its newly produced factual round trips, then the same merge review;
   it must never offer unrelated historical rows merely because they share a
   ticker.
7. **Compatibility, offline, Help, and verification were missing.** Existing
   ungrouped records need an explicit singleton compatibility rule without a
   destructive backfill. Offline submissions cannot show a server-derived
   review until sync completes. Updated Trade Tracker, Workspace entry, import,
   merge/unmerge, and Analyzer Help coverage plus focused command/read-model
   verification are required before release.

## Owner decisions after QA — 2026-09-04

- V1 merge eligibility is confirmed: same account, ticker, currency, and
  direction. Same-date matches are suggested first; same-ticker compatible
  cross-date matches remain an explicit Swing choice.
- If an edit invalidates a saved group, its current factual members display and
  count separately while the group is marked `Review required`.
- There is no product requirement to preserve, migrate, or keep displaying the
  current single-round-trip Analyzer history for owner/demo records. New
  grouped analysis will use its own truthful versioned subject that snapshots
  every included round-trip version. Existing immutable analysis rows can stay
  untouched and become legacy/unread rather than being destructively rewritten.

## Second plan QA — 2026-09-04

This was a static contract and reader review; no app process, test suite,
database migration, or production action was run.

1. **Merged Analyzer needs an explicit temporary-flat event.** The current
   Analyzer accepts only `entry`, `add`, `partial_exit`, and `final_exit` and
   is keyed to one same-day factual round trip. A trader-defined group may
   intentionally go flat, then re-enter the same ticker. Reusing
   `final_exit` for every raw member would make the first temporary exit look
   like the final exit of the whole trading idea. The plan now requires a
   group-only temporary-flat exit event, a later re-entry event, and exactly
   one final exit for the group-level post-exit comparison.
2. **Completed-only boundary is required for V1.** Existing round trips are
   the factual completed unit. Allowing an open position into a merged trade
   would make result, count, Analyzer eligibility, and edit recovery unclear.
   The plan now limits membership and Analyzer selection to completed members.
3. **P/L calculation unit changes only in scoped trade-facing screens.** The
   normalized Journal fact set continues to apply the current Gross/Net and fee
   treatment. Once a trader merges round trips, Workspace, Calendar, Day Trade
   Tracker, and Trade Details must sum every member's current display-eligible
   P/L value and combined executions for that one logical trade; a blank-fee
   member must not disappear. Analytics and Trade Explorer stay unchanged.
4. **Logical intent has a recorded rule.** Cross-date grouping uses logical
   Swing intent for filters and ordinary display. Same-date grouping retains
   the Day Trade or Swing intent selected at entry. A merge never rewrites a
   factual member's own classification.
5. **Analytics populations stay outside this slice.** Existing long-term
   Analyzer readers are hard-coded to raw round-trip analysis records and
   cannot be silently reused as group analytics. Current Analytics and Trade
   Explorer therefore stay unchanged until a separately approved scope.
6. **List correctness and recoverability need explicit acceptance tests.** A
   logical trade must be paged, sorted, and filtered as one row after its
   membership is resolved. Offline entry cannot claim a server-derived review:
   it must wait for synchronized server confirmation. Import review receives
   only the bounded completed-round-trip IDs created by that import, never
   ticker-based historical search. Help coverage must be updated for both
   entry paths, imports, merge/unmerge, logical vs factual counts, and explicit
   Analyzer selection.

## Third plan QA — 2026-09-04

This scope-only static review did not run an app, test suite, migration, or
release.

1. **Scope wording corrected.** One earlier sentence said a merged group would
   count as one trade “everywhere.” That would have pulled current Analytics
   and Trade Explorer into this feature. It now applies only to the scoped
   trade-facing screens: Workspace, Calendar, Day Trade Tracker, and Trade
   Details.
2. **Manual save must be all-or-nothing.** The server preview and chosen
   grouping must be committed through one authenticated atomic command. A
   failed membership write must not leave newly saved executions behind with
   unintended one-member trade views, and a failed execution write must not
   create a group.
3. **Analysis staleness is explicit.** An Analyzer result belongs to the exact
   logical-trade membership/version snapshot it analyzed. An edit or unmerge
   makes it stale for the active logical trade; it is never reassigned and the
   trader explicitly requests another run.
4. **Execution order is factual.** The combined execution view sorts by the
   canonical execution time and uses a deterministic factual tie-breaker. It
   must not depend on browser row order.
5. **Import intent needs an implementation decision before that slice.** The
   existing manual flow carries a Day Trade or Swing choice, while an import
   does not necessarily carry a logical-trade intent. Before import review is
   built, decide whether an imported same-date logical trade defaults to Day
   Trade or asks the trader to choose Day Trade/Swing. Cross-date grouping is
   already explicitly Swing.

## Scope correction — 2026-09-04

The owner clarified that P/L is not frozen at its raw-round-trip calculation
unit. Current Account P/L preference and fee treatment remain intact, but the
scoped trade-facing screens must calculate the displayed P/L/result and share
information for the active logical trade from all its included factual members.
Analytics and Trade Explorer remain outside this change.

## Fourth plan QA — 2026-09-04

This static scope review did not run an app, test suite, migration, or release.

1. **Whole-trade return needs a direct formula.** A merged trade cannot average
   round-trip percentages. Its displayed percentage result must divide the
   logical trade's displayed P/L by the sum of all included entry notional.
2. **Share labels need distinct meanings.** Total-entry and total-exit shares
   are sums of executions. Maximum position size, when displayed, is the
   highest factual held position in the combined chronological ledger; summing
   the peak size of each round trip would overstate it.
3. **Calendar has a cross-date attribution decision.** The current Calendar
   calculates day P/L, trade count, and win rate from factual round trips. A
   logical Swing trade spanning dates cannot have its full P/L and one trade
   count repeated on every date it touched. Before the Calendar reader changes,
   choose one attribution rule for such a trade (for example, show it once on
   its final-exit date and label its opening date). Same-date logical trades do
   not have this ambiguity.

## Fifth plan QA — 2026-09-04

This static contract review did not run an app, test suite, migration, or
release.

1. **Existing raw trades need safe singleton fallback.** The plan intentionally
   avoids a destructive backfill. The shared logical-trade reader therefore
   treats a pre-feature raw round trip without a persisted logical record as a
   one-member logical trade until a new grouping command materializes a record.
2. **Group annotations need unmerge behavior.** Group-level notes/tags remain
   attached to the retired logical-trade history on unmerge. They are not
   copied to every restored member; raw member annotations remain unchanged.
3. **Logical trade navigation needs a new reference.** Current Workspace,
   Calendar, edit, and Analyzer routes identify the target by `roundTripId`.
   New logical-trade actions need an opaque authenticated logical-trade
   reference. Existing raw links stay factual-detail links rather than guessing
   whether a member should open its containing group.
4. **Import style remains a later bounded decision.** Before the import review
   slice, decide whether an imported same-day logical trade defaults to Day
   Trade or asks the trader to choose Day Trade/Swing. This does not block the
   schema/manual-entry slices.

## Sixth plan QA — 2026-09-04

This static source/contract review did not run an app, test suite, migration,
or release.

1. **Rule reviews require a logical-trade target.** Current rule reviews can
   target only a trading day or raw round trip. The approved Journal flow says
   a saved resulting trade can include rules, so a new group-level rule review
   is required. It remains separate from, and never copies, factual member
   rule evidence; after unmerge it remains on the retired group history.
2. **Logical-trade deletion is deliberately out of scope.** Current Workspace
   deletion is a raw-round-trip operation that deletes its executions. It must
   not appear on a merged logical trade until an explicitly designed choice can
   tell the trader whether it deletes a member, all members, or only removes
   the grouping. Existing raw factual-detail deletion behavior is unchanged.

## Seventh plan QA — 2026-09-04

This static chronology and date-boundary review did not run an app, test suite,
migration, or release.

1. **Calendar attribution uses the account trading timezone.** Current
   Calendar uses the account's trading timezone to derive a closed trade's
   local date. The approved final-exit-date rule for cross-date Swing trades
   must use that same timezone, not UTC or the browser timezone.
2. **Non-adjacent membership needs an owner rule.** The plan permits the
   trader to choose compatible same-ticker round trips, but does not state
   whether they may group the first and third while leaving an intervening
   compatible round trip separate. This affects the truthfulness of the
   grouped execution story and Analyzer event stream. Recommended rule: group
   members must be consecutive in the compatible chronological chain; if the
   trader wants the first and third grouped, they include the middle one or
   leave all three separate.

## Owner Calendar decision — 2026-09-04

- A cross-date logical Swing trade appears once in Calendar on its final-exit
  date and shows its opening date. Calendar does not duplicate its whole-trade
  P/L or trade count on every trading date it touched.

## Owner chronology decision — 2026-09-04

- Logical-trade members must be consecutive in their compatible chronological
  chain. The review plainly explains when a proposed selection skips an
  intervening compatible round trip: excluding it would make the trade story
  and Analyzer incomplete. The user can include the middle trade or keep the
  trades separate.

## Eighth plan QA — 2026-09-04

This static command/offline-boundary review did not run an app, test suite,
migration, or release.

1. **Reuse existing save safeguards.** The manual-entry contract already has a
   signed preview reference, expected account-selection reference, and
   idempotency key. Logical-trade save retains all three. A stale preview,
   account change, edited entries, or changed selected member causes no partial
   write and asks the trader to review again.
2. **Offline cannot invent a group.** The device outbox retains factual
   executions only. It cannot calculate server round trips, choose a merge, or
   spend an Analyzer request. Once synchronized online, the app can offer the
   bounded saved-trade review for the trader to make those choices.

## Ninth plan QA — 2026-09-04

This static server-authority/history review did not run an app, test suite,
migration, or release.

1. **The server revalidates every grouping.** The signed preview proves the
   underlying entry set, but the logical-trade command must still enforce
   completed state, account, ticker, currency, direction, and consecutive
   compatible order. Client warnings are helpful guidance, not authority.
2. **Compatible edits advance current membership.** If a factual member is
   edited without becoming incompatible, its group remains active but records
   the new current round-trip version in its membership history. The display
   recalculates from that current version and any prior group Analyzer result
   becomes stale; the earlier membership/version remains historically visible.

## Tenth plan QA — 2026-09-04

This was a static current-Analyzer and plan review only. No app process, test
suite, migration, provider request, or release action was run.

1. **Cross-date Swing analysis cannot be promised today.** The current
   one-minute Trade Analyzer derives a single `tradingDateNewYork`, rejects a
   target whose final exit is on a different `America/New_York` date, and uses
   one market-session set for that date. The plan now limits selection to a
   complete logical-trade ledger within one New York market date. A cross-date
   Swing stays fully usable for its normal trade-facing P/L, Calendar, and
   review surfaces, but plainly reports that one-day analysis is unavailable,
   without consuming a request. A truthful multi-day Swing Analyzer remains a
   separate future scope.

## Eleventh plan QA — 2026-09-04

This was a static concurrency and recovery review only. No app process, test
suite, migration, or release action was run.

1. **Overlapping review panels need a database-enforced membership boundary.**
   Two browser tabs could otherwise submit overlapping merge/unmerge choices
   after each has shown a valid preview. The plan now requires the schema and
   one immediate command transaction to ensure that a factual round trip has
   at most one active logical-trade membership. If another command changed one
   of those memberships first, the later command writes nothing and plainly
   asks the trader to review the current trades again.

## Twelfth plan QA — 2026-09-04

This was a static tracker-contract and plan review only. No app process, test
suite, migration, or release action was run.

1. **Day Tracker needed cross-date attribution too.** Calendar already assigns
   a cross-date Swing's completed P/L and count to its final-exit date, but the
   plan did not state how the daily session review avoids duplicating that
   trade. The plan now gives Day Trade Tracker the same rule: the earlier date
   shows only that day's factual Swing execution activity and a clear link to
   the complete Swing; the completed logical-trade row, count, and full P/L
   appear once on the final-exit date. Swing Trade Tracker remains the full
   multi-day lifecycle surface.

## Owner direction and Thirteenth plan QA — 2026-09-04

The owner removed Swing Trade Tracker because its current page does not use the
space well. This feature must not restore it or treat it as a dependency.
Workspace is the discovery surface for Swing trades through its existing
filter; Calendar and Trade Details remain the related date/detail surfaces.

Static plan QA found that the previous cross-date display statement still
named Swing Trade Tracker as the lifecycle surface. It is superseded for this
feature: Workspace filters by the logical trade's trader-selected intent and,
for a cross-date Swing, sorts and applies date range by final exit in the
account timezone while showing the opening date. Day Trade Tracker stays a
same-day session-entry and review surface; it does not need a new multi-day
Swing lifecycle view. No app process, test suite, migration, or release action
was run.

## Owner Analyzer delivery direction — 2026-09-04

The active scope stays with Tracker entry/review, user-defined trade
formation, merge/unmerge, selected Analyzer requests, and the resulting
trade-facing display. Raw executions and zero-to-zero factual round trips stay
the Journal's factual truth; the active logical trade is the trader-authored
unit for the scoped trade-facing counts, P/L, review, and selected analysis.

During beta, all Analyzer market-data delivery uses one designated server-side
shared Moomoo connection, never each trader's own broker connection. Analyzer
delivery is cache-first: shared saved one-minute session candles are reused
across users before any provider request, and concurrent misses for the same
provider/session key are coalesced. A trader may use an available on-demand
Analyzer request on an eligible historical logical trade; a cache miss then
requests Moomoo data and reports a plain no-coverage result if unavailable.
The actual historical coverage limit is set only after the planned provider
probe; the product does not prefetch old candles just for possible future
requests, while already saved evidence remains usable.

## Owner cache-retention clarification and required coverage probe — 2026-09-04

The date boundary is for the **shared full-session candle reuse cache**, not a
limit on a user's historical Analyzer request. The earlier seven-day draft is
superseded. During the 2026-09-04 transition, a request for a trade with a
final exit in the preceding ten 24-hour days persists shared candles because
another beta user may trade the same ticker/date. From 2026-09-04 onward, every
trade newly submitted to TradersLink persists all candle data retrieved for its
Analyzer request. An older pre-activation selected trade outside the ten-day
transition can still call the designated Moomoo connection and produce a saved
analysis, but does not add its full session candles to the shared reuse cache.
Existing analysis evidence and already saved historical sessions remain
available. No beta cache pruning is planned; a possible later monthly cache
cleanup must be separately designed and preserve saved analysis evidence.

Before a user-facing historical-age limit is chosen, the owner will run the
required probe through their own account by selecting real historical trades
for on-demand analysis. Record only the date, request outcome, and coverage
result; the probe establishes the actual one-minute Moomoo coverage window and
must not disclose account credentials or private trade details.

## Fourteenth plan QA — 2026-09-04

This was a static current-Analyzer runtime, cache-schema, and plan review only.
No app process, test suite, provider request, migration, or release action was
run.

1. **Shared provider requires an actual runtime replacement.** The current
   Analyzer runtime creates its Moomoo provider from each queued job's user and
   account scope. The beta contract requires a server-only resolver for the
   designated shared connection, with no fallback to a requesting trader's
   connection when unavailable.
2. **The existing cache key is suitable for reuse.** Its unique identity is
   provider/version, symbol, New York trading date, one-minute interval, and
   session policy—not a user or account—so it can safely be the shared
   current-trade cache after the provider resolver changes.
3. **Older non-shared retrieval needs a separate path.** The current job path
   creates a persistent market-session cache set before every fetch. That
   conflicts with the beta rule against adding random old historical sessions
   to the reusable cache. The plan now requires a per-analysis retrieval path
   that saves the result/evidence but does not create full shared session
   candles for an older pre-activation miss.
4. **The activation rule needs a trusted date.** The cache choice must use the
   server-recorded accepted time of the factual entry/import command. It cannot
   be inferred from execution date, browser time, or when someone later clicks
   Analyzer.

## Owner beta connection-copy direction — 2026-09-04

No UI code is changed during planning. The implementation must change
`/account/trading` **Broker connections** to say only that users can import
their trade history, Moomoo is the currently supported connection, and users
of other brokers can import historical statements. Remove its **Attention**
section and **About Moomoo data** link.

The quoted paragraph saying a user needs a free/connected Moomoo account is
rendered by one shared no-analysis component across the six current
`/analytics/trade-analyzer/day` routes. Removing only that paragraph would
leave a separate conditional Moomoo prompt and **Connect Moomoo** action. The
plan therefore removes all three from those Analyzer pages. A focused copy
audit must also update other Analyzer-related Workspace, Tracker, shared prompt,
Broker helper, and Help text while preserving accurate Moomoo trade-import
instructions.

## Fifteenth plan QA — 2026-09-04

This was a static Analyzer eligibility and user-facing dependency review. No
app process, test suite, provider request, migration, or release action was
run.

1. **Deleting copy alone would leave the old restriction active.** The current
   Analyzer queue service rejects targets at seven days and checks the queued
   trade owner's Moomoo `quote:read` connection. It returns
   `connection_required` before queueing. The implementation must remove both
   conditions: the seven/ten-day rules govern shared-cache retention, not
   historical request eligibility, and the designated shared connection—not
   the requesting user's connection—provides missing candles.
2. **Analyzer pages also contain a separate access gate.** All six Day Analyzer
   routes read requesting-user Moomoo access and can render a shared connection
   prompt independently of the quoted empty-state paragraph/button. Their
   access read and prompt usage must be removed from Analyzer presentation.
3. **The same obsolete requirement appears at other Analyzer entry points.**
   Workspace onboarding, both Trade Tracker route states, Account reconnect
   messaging, Broker helper/setup text, and Analyzer/Tracker Help still tell a
   user to connect Moomoo for analysis. The plan now requires a focused removal
   from Analyzer behavior/copy while preserving Moomoo execution-import
   controls and leaving unrelated chart policy for a separate owner decision.
4. **Failure reasons stay truthful.** No personal Moomoo connection is required.
   Quota exhausted, unsupported/ineligible trade, shared-provider unavailable,
   and historical no coverage are separate states; none may be mislabeled as
   `Connect Moomoo`.

## Sixteenth plan QA — 2026-09-04

The completion-based charging conclusion recorded in items 3-6 below was
superseded by the owner's Moomoo-request-only allowance correction immediately
following this QA. The correction record below is controlling.

This was a static Analyzer allowance lifecycle and current job-idempotency
review. No app process, test suite, provider request, migration, or release
action was run.

1. **The plan named an allowance but did not define its owner.** It is now
   explicitly keyed to the stable Platform user across that user's workspaces
   and accounts, so changing an account cannot multiply the allowance.
2. **The current job uniqueness is not a complete quota contract.** Current
   Analyzer jobs deduplicate a raw round-trip version and requested coverage
   within an account, but logical-trade membership versions and a user-wide
   allowance do not exist yet. The plan now requires an atomic reservation for
   the exact logical-trade snapshot and an idempotent same-snapshot response.
3. **Only a produced analysis should consume an analysis use.** The plan now
   finalizes one use when a ready result is saved. A cached session still
   counts because the selected trade was analyzed; no coverage, provider
   failure, factual ineligibility, execution-data mismatch, and work that never
   begins release the reservation instead of pretending an analysis occurred.
4. **Failed calls still need abuse protection.** Releasing an Analyzer use on
   failure cannot permit unlimited repeated provider calls. That protection is
   a separate bounded attempt/rate rule, not a false completed-analysis charge.
5. **Crashes and concurrent tabs needed an explicit recovery rule.** Allowance
   reservation, idempotent job creation, ready-result finalization, and expired
   lease recovery must be transactional enough that two tabs cannot overspend
   and a worker crash cannot strand a user's allowance permanently.
6. **The user must see the state before selecting trades.** Workspace and Day
   Tracker review must show remaining Analyzer uses, disable exhausted
   selection, reopen an already-ready current result without charging again,
   and explain when a changed trade version would require a new analysis.

## Owner corrections after Sixteenth QA — 2026-09-04

The zero-balance exceptions in items 1 and 5 below were superseded by the
owner's hard-stop correction recorded after the Seventeenth QA. Stored candles
still do not reduce a positive balance, but zero blocks all new analysis.

The limit exists to protect the one shared Moomoo connection, not to limit how
many analyses can be produced from candles TradersLink already stores.

1. The server checks complete stored candle coverage first. A cache hit does
   not consume the user's allowance, including for an edited trade snapshot or
   when the user has zero Moomoo requests remaining.
2. One use is reserved only after a shared-session cache miss and is consumed
   when the outbound Moomoo acquisition begins. A request that reaches Moomoo
   counts even if it returns an error or no historical coverage.
3. A reservation is released when factual checks fail, the provider is known
   unavailable before dispatch, work is cancelled before dispatch, or a worker
   lease expires without reaching Moomoo.
4. Same-session selections are coalesced. If one Moomoo acquisition supplies
   multiple trades or users, only the initiating user's request consumes one
   use; joiners and later cache consumers do not.
5. The UI exposes the remaining Moomoo-request count and cache/request state.
   Exhaustion blocks only work that needs a new Moomoo request; cached and
   already-ready analyses remain available.
6. Provider pagination, retries, and connection-wide rate protection remain
   separate operational controls and do not multiply the user's one bounded
   session-acquisition charge.

The owner also set a user-facing copy boundary. Do not add optional
descriptions, general instructions, feature explanations, notifications, or
new empty-state prose during this implementation. The owner will add that copy
after the functional updates. Concise decision-critical validation, warnings,
and statuses remain permitted for execution entry, trade construction,
merge/unmerge decisions, changed trades, and stale or unsafe saves where the
trader must understand what happened and what action is required. Obsolete
personal-Moomoo Analyzer copy/actions are removed without replacement prose.

## Seventeenth plan QA — 2026-09-04

The zero-balance in-flight exception and cache-before-allowance ordering in
items 1-2 below were superseded by the owner's hard-stop correction immediately
after this QA. The compatibility and coalescing findings remain controlling for
users who still have a positive balance.

The later owner-approved global single-connection queue also supersedes the
cross-user in-flight joining/fan-out described in items 1, 2, and 5. Separate
users wait, then recheck persisted coverage when their request reaches the head.

This was a static cache-compatibility, request-ordering, and shared-session race
review. No app process, test suite, provider request, migration, or release
action was run.

1. **Allowance was still checked too early for in-flight work.** A user with no
   remaining requests must be able to join an identical acquisition that
   another request already started because that user does not cause a new
   Moomoo call. The plan now checks ready result, complete cache, and existing
   in-flight acquisition before allowance.
2. **Only the session-lease winner may reserve a use.** Cache miss, allowance
   reservation, and session-lease ownership cannot be separate racing actions.
   The plan now requires an atomic lease/reservation claim and a final coverage
   recheck before provider dispatch; losing requests join without charge.
3. **`Stored candles` needed a compatibility definition.** Free reuse requires
   matching Analyzer provider/version, symbol/exchange, New York date,
   one-minute interval, session policy, and complete required coverage. Older
   account-scoped Candle Review data or another provider contract cannot be
   silently reused merely because it contains candle-shaped rows.
4. **Partial coverage is not a free cache hit.** If the selected trade requires
   additional Moomoo data, the resulting outbound acquisition consumes one use
   when dispatched. An exact ready analysis or complete compatible stored
   coverage remains free.
5. **Non-retained historical fetches still need in-flight fan-out.** An older
   pre-activation acquisition that is intentionally not retained as a reusable
   full-session cache must still feed every analysis already joined to that
   lease. Once that joined work completes, later requests cannot discover the
   transient fetch as stored coverage; only the individual immutable analysis
   evidence remains.
6. **Copy boundary remains intact.** The implementation exposes these states
   without optional descriptions or explanations. Necessary execution and
   merge/unmerge validation and decision-critical warnings remain permitted.

## Owner hard-stop allowance correction — 2026-09-04

Reaching zero ends the user's ability to start new Analyzer work. Stored
candles still do not consume a use, but they do not bypass a zero balance.

1. Existing ready results and work the user already requested remain
   accessible and may finish after the balance reaches zero.
2. Every new analysis requires at least one remaining Moomoo-request use as an
   access gate, including a cache hit or an attempt to join another user's
   in-flight session acquisition.
3. After a positive-balance user passes that gate, a complete compatible cache
   hit or joined in-flight acquisition does not reduce the balance. Only a new
   outbound Moomoo acquisition consumes one use.
4. At zero, all controls that would initiate a new analysis are unavailable.
   This is a functional state; the owner will supply optional explanatory copy.
5. The server order is now: return the exact already-requested queued/ready
   state, validate the trade, enforce positive balance for new work, resolve
   complete compatible cache/in-flight work, and only then claim and charge a
   new session acquisition when required.

## Owner-approved global Moomoo queue — 2026-09-04

The designated Analyzer connection processes one market-data acquisition at a
time. User submissions remain asynchronous and do not expose this internal
queue.

1. A new eligible request with a positive balance uses complete compatible
   stored candles immediately or enters the database-backed provider queue.
2. The worker completes the active Moomoo acquisition before taking the next
   queued item. It then rechecks stored coverage because an earlier request may
   have supplied some or all required candles.
3. Complete newly stored coverage produces the analysis without reducing the
   next user's balance. Partial coverage causes the worker to request only the
   missing required range and consumes one use when that Moomoo acquisition
   starts.
4. The queue advances promptly after each completion rather than intentionally
   waiting for a once-per-minute poll between every item. Lease recovery still
   prevents a crashed worker from creating concurrent provider calls.
5. Do not add queue positions, waiting explanations, cache-use notices,
   deduction notices, or references to another user's request. The user submits
   normally and receives the existing completed-analysis result and existing
   completion notification when ready.
6. The previously approved broader copy boundary remains: only necessary
   execution and merge/unmerge validation or decision-critical warnings may be
   added by this implementation.

## Owner-approved beta allowances and administration — 2026-09-04

The beta protection policy limits actual outbound use of the designated Moomoo
connection rather than imposing a separate limit on analyzed trades.

1. The default Platform-user allowance is 10 actual Moomoo acquisitions per
   day and 100 per fixed 30-day period. Compatible stored candles remain free after
   a positive-balance user passes the existing access gate.
2. The default global safety ceiling is 120 actual Moomoo acquisitions in a
   rolling 24-hour window. Shared-provider concurrency remains fixed at one.
3. The queue applies a configurable minimum delay between provider
   acquisitions, defaulting to two seconds. A provider `Retry-After` response
   is honored; otherwise bounded exponential backoff applies.
4. Owner-only Analyzer administration will control enabled/disabled, the daily
   and 30-day per-user allowances, the global rolling ceiling, and request
   spacing. It will also support an individual user's allowance override and
   reset. Concurrency is deliberately not editable.
5. This beta scope does not add a separate configurable limit for the number of
   trades analyzed. A trade analysis consumes allowance only when it causes an
   actual outbound Moomoo acquisition under the established cache and queue
   rules.
6. Increased settings affect new work immediately. Decreases block later work
   after the new limit is reached; dispatched work may finish. Disabling the
   Analyzer blocks new work without removing completed results or cancelling a
   provider acquisition already in progress.
7. No new user-facing cache, deduction, queue, rate-limit, or administrative
   explanation is added. Existing completion behavior remains unchanged.
8. One Analyzer candle acquisition counts once for both user allowance and
   owner administration, regardless of its internal HTTP pagination or retry
   count. Provider-call rate protection remains independently enforced.
9. If that acquisition determines that incorrect execution information must be
   corrected and records the Analyzer execution-correction-required outcome,
   the user receives one correction resubmission for the same
   analysis lineage without another allowance deduction, even when the first
   correction requires fresh Moomoo candles or the original acquisition reduced
   the balance to zero. A second correction that requires another acquisition
   consumes another use. Any correction fully covered by compatible stored
   candles remains free under the normal cache rule.
10. Correction-credit state is server-authoritative, single-use, and tied to
    the original analysis lineage so it cannot be reused for another trade or
    multiplied by retries, duplicate clicks, or concurrent tabs.
11. One original user-charged candle acquisition can authorize no more than one
    correction-waived candle acquisition, even if several selected trades used
    the original candles. The first eligible corrected resubmission atomically
    claims the correction opportunity; a cache-only correction consumes the
    opportunity without needing a waiver, while a Moomoo-backed correction
    uses its one acquisition waiver. It must be a new version of the same saved
    logical trade submitted through the Analyzer correction workflow; ticker,
    execution date, time, price, quantity, and side may legitimately change
    because any entered fact could be the correction.
12. A waived correction acquisition still uses the global FIFO queue, obeys
    spacing/rate protection, counts toward the global rolling ceiling, and is
    visible to the owner. Administration reports total, user-charged, and
    correction-waived acquisitions plus current daily, 30-day-period, and global
    usage. Dedicated cache-only, pagination, and retry totals are not required
    in the beta admin UI; ordinary operational logging remains sufficient.
13. Daily and fixed 30-day user allowances use `America/New_York`. A user's
    30-day cycle begins when their Analyzer allowance is first activated,
    covers 30 consecutive New York calendar dates, and resets at midnight for
    the next cycle. Usage is assigned when the outbound acquisition begins.
    Admin usage resets do not move the period reset date.
14. Special queued-work policy at the global ceiling and when the Analyzer is
    disabled remains an owner decision for later usage experience; this plan
    does not add cancellation or new user-facing queue behavior for those
    cases. Existing admin limit changes continue to govern later submissions
    without interrupting an acquisition already dispatched.

## Owner-approved beta merge surface and admin semantics — 2026-09-04

1. The existing Edit Trade drawer is the post-save merge/unmerge surface. It
   temporarily changes to candidate selection rather than navigating to a new
   page. The current trade remains selected, same-day compatible candidates
   appear first, and eligible cross-date candidates appear under `Other dates`.
2. The merge preview shows the resulting combined trade and trade count.
   `Merge Trades` confirms; a merged trade exposes `Unmerge Trade` in the same
   drawer.
3. Execution edits must be saved or discarded before merge selection. The
   candidate list and final server validation use the current saved trade
   version.
4. Same-date trades with matching Day/Swing intent retain it. If intents
   differ, the trader must select Day Trade or Swing during merge confirmation.
   Cross-date merges are explicitly Swing.
5. The entry-review action remains `Save trades`. After its atomic trade save
   succeeds, the selected eligible Analyzer work is submitted under the
   approved allowance contract; no separate `Save and analyze selected` label
   is introduced.
6. Daily and 30-day-period admin usage count only user-charged acquisitions. Global
   rolling-24-hour and total usage count all Moomoo candle acquisitions,
   including correction-waived acquisitions.
7. Individual daily and 30-day allowance overrides are independent, persist
   until removed, and return to current defaults when removed. Separate reset
   actions return current daily or current 30-day-period charged usage to zero
   without deleting acquisition history. No expiration, scheduling, or separate
   management-history UI is added for beta; changes remain auditable
   server-side.

This was an approved planning update only. No feature code, database migration,
provider request, test suite, app process, or release action was run.

## Owner-approved merge authority and atomic Analyzer selection — 2026-09-04

1. Edit Trade obtains merge candidates from a fresh bounded, authenticated
   server response for the current saved trade. The browser selects opaque
   references from that response; it never promotes existing table rows or
   browser-supplied trade facts into merge authority.
2. Merge confirmation revalidates account, membership version, completed
   state, compatibility, and consecutive order. A stale response produces no
   partial membership change.
3. `Save trades` creates idempotent Analyzer queue records for selected
   eligible resulting trades in the same database transaction as executions
   and logical memberships. A successful save cannot lose the selections, and
   a failed/stale save creates no orphaned Analyzer work.
4. The save transaction never calls Moomoo. The global background worker later
   processes the committed queue records under the approved cache, allowance,
   correction, and shared-provider rules.

This was an approved planning update only. No feature code, database migration,
provider request, test suite, app process, or release action was run.

## Owner-approved Analyzer selection count — 2026-09-04

1. Workspace Add Trade and Day Trade Tracker show one compact `Analyzer uses`
   block with `{daily} available today` and `{period} available this period ·
   resets in {days} days` wherever resulting trades can be selected.
2. For beta, each newly selected trade occupies one visible selection slot and
   deselection restores it. The forms do not accept more new selections than
   the displayed remainder.
3. Selection slots are presentation only, not deductions. The server rechecks
   allowance at save, and actual usage is still deducted only for a dispatched
   Moomoo candle acquisition. Cache-backed and coalesced work leave the actual
   balance unchanged, and the form refreshes from the server result.
4. At zero, the Analyzer control remains visible. Clicking it shows `You have
   used all available Trade Analyzer uses.` Saving the trades remains
   available.
5. A concurrent allowance change can reject affected Analyzer selections
   without rejecting the factual trade save. The one correction opportunity,
   existing queued work, and ready results retain their previously approved
   exceptions.
6. The selectable count is the lower of daily availability and 30-day-period
   availability, never below zero. Both forms share this behavior and copy; no separate selection-count system
   is implemented for each surface.

This was an approved planning update only. No feature code, database migration,
provider request, test suite, app process, or release action was run.

## Owner-approved beta selection reservation — 2026-09-04

1. `Save trades` atomically creates one temporary allowance reservation for
   each accepted selected trade alongside its queue record, executions, and
   logical membership. The displayed remaining count subtracts consumed uses
   and active reservations.
2. A reservation becomes consumed only when that work causes a Moomoo candle
   acquisition. Complete cache coverage releases it. Coalesced work consumes
   one reservation and releases redundant reservations. Work ending before
   provider dispatch also releases its reservation.
3. Reservation creation, release, and consumption are server-authoritative,
   atomic, and idempotent. This prevents separate tabs from accepting the same
   final use without adding another beta UI.
4. The approved first execution correction does not require a new available
   selection slot. If the original acquisition used the trader's final use,
   that correction still runs; the next new entry review shows zero and blocks
   only new Analyzer selections.
5. A failed or stale trade save creates no queue record or reservation. If an
   Analyzer selection loses the allowance recheck, the factual trade may still
   save while that selection is not accepted.

This was an approved planning update only. No feature code, database migration,
provider request, test suite, app process, or release action was run.

## Owner-approved daily and 30-day allowance display — 2026-09-04

1. The former calendar-month allowance is replaced by a fixed recurring
   30-day user allowance period. It begins when the Platform user's Analyzer
   allowance is first activated, covers 30 consecutive `America/New_York`
   calendar dates, and resets at midnight for the next period.
2. Analyzer selection surfaces show one compact block: `Analyzer uses`,
   `{daily} available today`, and `{period} available this period · resets in
   {days} days`.
3. The number of additional trades selectable is the lower of daily
   availability and 30-day-period availability. Each value subtracts the
   consumed user-charged acquisitions and active reservations applicable to
   that period; the displayed value never falls below zero.
4. Daily limits continue to apply near the end of the 30-day period even when
   the user has a larger period balance. An admin usage reset does not restart
   the 30-day countdown.

This was an approved planning update only. No feature code, database migration,
provider request, test suite, app process, or release action was run.

## Owner-approved allowance activation and Demo boundary — 2026-09-04

1. A real Platform user's fixed 30-day allowance cycle starts only when their
   first real-account Analyzer selection is successfully accepted and reserved.
   Opening a form, viewing the remaining count, or changing an admin default
   does not start the cycle.
2. Before first use, the real-account selection UI shows the full allowances
   and `resets in 30 days`. Later countdown values come from the server. Admin
   usage resets do not restart an active period.
3. Demo executions are examples and are not guaranteed to match actual market
   candles. Demo trades cannot start new Analyzer work, corrections,
   reservations, deductions, or Moomoo acquisitions.
4. Existing prebuilt analyzed Demo trades remain visible as view-only product
   examples. Demo activity never starts or changes the user's real-account
   allowance period, and the allowance count is not presented as a usable Demo
   control.

This was an approved planning update only. No feature code, database migration,
provider request, test suite, app process, or release action was run.

This was an approved planning update only. No feature code, database migration,
provider request, test suite, app process, or release action was run.

## Implementation started — 2026-09-04

The owner authorized complete implementation without pausing at intermediate
visual checkpoints. Migration `0115_journal_logical_trades` now defines the
account-scoped logical-trade identity, immutable versions, versioned factual
round-trip membership, one-active-membership enforcement, and immutable event
history. Existing factual round trips remain compatible one-member trades until
a grouping command needs to materialize them.

No provider request, production data change, push, deployment, or release action
has occurred. The unrelated Trade Details story-ledger work remains outside this
feature slice.

## Completed implementation checkpoint — 2026-09-04

- Migrations `0115` and `0116` add versioned logical trades, immutable
  membership history, group reviews, Analyzer requests, reservations,
  allowances, acquisitions, correction opportunities, and owner settings.
- Workspace Add Trade and Day Trade Tracker share the same post-entry review:
  resulting trades can be merged/unmerged before save and completed day trades
  can be selected explicitly for Analyzer use.
- Edit Trade provides authenticated merge/unmerge selection for saved trades.
  Workspace, Calendar, Day Tracker, and Trade Details now present active logical
  trades with combined chronological executions and group-level review data.
- Analyzer uses the designated shared Moomoo connection through one persistent
  FIFO acquisition worker, rechecks compatible stored candle coverage, applies
  the approved retention rule, enforces daily/fixed-30-day/global acquisition
  controls, and preserves the single correction waiver.
- Demo remains view-only for prebuilt Analyzer examples. Personal Moomoo
  Analyzer prompts and the obsolete Analyzer connection copy were removed;
  Moomoo remains available on Account for broker execution imports.
- Owner administration exposes the designated connection, beta limits, usage,
  per-user overrides, and daily/period resets.

## Focused verification

- The bounded server TypeScript check covering logical-trade commands, manual
  entry integration, Analyzer repositories/worker/routes, migration `0116`, and
  hosted worker scheduling passed with no errors.
- The bounded UI TypeScript check found no feature errors. It reported only the
  pre-existing duplicate `fancy-canvas` identity errors caused by type-checking
  this dependency-light worktree against the canonical checkout's modules.
- A disposable empty database initialized through migration `0116` and matched
  the updated migration manifest.
- `git diff --check` passed. Broad tests, Vitest, a production build, and a local
  app process were intentionally not run under the low-resource project policy.

## Release boundary

No push, Railway action, production mutation, or provider-depth request was
performed here. Before production release, the Release Coordinator must make
the staging Railway application match production application configuration and
schema behavior, deploy this exact commit set to staging, verify the scoped
flows there, and only then publish the same accepted code to production. This
does not authorize copying production user data into staging.
