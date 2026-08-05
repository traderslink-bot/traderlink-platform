# Day Trade Tracker And Swing Trade Tracker Plan

**Status:** Owner-approved product split; QA-corrected implementation contract;
technical implementation and live browser acceptance complete; integrated owner
visual/product review pending

**Date:** 2026-08-02

**Canonical application:**
`C:\Users\jerac\Documents\TraderLink\traderlink-platform`

**Controlling replacement plan:**
[TraderLink Platform Replacement Plan](traderlink-platform-replacement-plan.md)

**Preserved Day Session design input:**
[Day Session Page Plan](../day-session-page-plan.md)

**Implementation progress:**
[Day And Swing Trade Tracker Progress](day-and-swing-trade-tracker-progress.md)

## 1. Outcome

Replace the overloaded single Trade Tracker workflow with two clearly named
Journal experiences over the same factual execution ledger:

1. **Day Trade Tracker** organizes current and recently entered day trades by
   their actual trading dates and keeps each day's executions, notes, rules and
   reviews separate.
2. **Swing Trade Tracker** organizes active and recently completed intentional
   swing trades by stable position/round-trip identity across multiple dates and
   preserves one dated note history per swing.

This is a product and writing-workflow split. It is not a split database,
execution ledger, import system, reconstruction engine or analytics authority.

## 2. Fixed owner decisions

- Day trades and swing trades have separate trackers.
- Trade Tracker remains for reliable current/recent trade capture and ongoing
  journaling. It is not a bulk historical-execution entry tool.
- Traders may enter a trade a few days after it occurred. The execution's actual
  timestamp remains authoritative; visit/save time is recorded separately.
- A trader may enter an entire completed swing when it closes, including an
  opening execution from an earlier date.
- Manual entries remain in the main Journal execution ledger beside broker
  imports with distinct provenance. They are never stored in a separate manual
  or swing database.
- A later broker import never replaces, suppresses or changes an accepted manual
  execution without an explicit trader decision. While a possible duplicate is
  pending, the manual execution remains active and the imported candidate is
  preserved but excluded from reconstruction and analytics.
- Manual capture is intentional. A new-trade assertion does not trigger routine
  broker-import opening-inventory or whole-statement coverage questions.
- Trader-authored intent determines Day trade versus Swing trade. Holding time
  and an unmatched execution never assign intent automatically.
- Factual lifecycle and trader intent remain separate. Only a factually
  supported nonzero position can be shown as an active swing.
- `/trades/open` remains the complete factual Open Positions surface for every
  confirmed open lifecycle, including swings, open day trades, unplanned holds,
  other positions and unclassified positions.
- A chain whose active position facts are unresolved is not a confirmed open
  position or active swing until the trader resolves it. A pending provisional
  broker duplicate does not invalidate an already accepted manual lifecycle;
  only the provisional candidate remains ineligible.
- Replacement records that traders deliberately save remain reviewable. Legacy
  trade/tag/rule/note test data is not recovered. The product does not ask
  traders to fabricate subjective notes for days they did not record.
- All displayed trading decimals use at most two decimal places. Editable and
  persisted source values remain lossless.
- Manual entry uses plain trader-facing guidance: enter each execution exactly
  as shown by the broker, including time, price and quantity, because accurate
  details improve future statement matching. UI copy explains actions and
  consequences without internal codes, engine terminology or system language.

## 3. Route and navigation contract

| Route | Product responsibility |
| --- | --- |
| `/trade-tracker` | Day Trade Tracker current/recent working canvas |
| `/trade-tracker/[sessionDate]` | One factual Day Trade Tracker date |
| `/trade-tracker/swings` | Active and recently completed Swing Trade Tracker |
| `/trade-tracker/swings/[positionRef]` | One swing's complete factual lifecycle and dated journal |
| `/trades/open` | All confirmed open positions plus a separate Data Decisions queue |
| `/manual-entry` | Compatibility redirect to `/trade-tracker` |

Static `swings` routes must win over `[sessionDate]`; date validation cannot
interpret `swings` as a trading date.

The `Trades` navigation group becomes:

1. Day Trade Tracker
2. Swing Trade Tracker
3. Round Trips
4. Ticker History
5. Open Positions
6. Candle Review

Both trackers inherit the approved light Material dashboard shell. Neither page
rebuilds the navigation, header or account selector.

## 4. One ledger, two projections

All manual and broker executions retain the accepted Journal boundaries:

- owner, workspace and selected Journal account scope;
- instrument, currency and chronological execution partitioning;
- immutable source/provenance evidence;
- exact-decimal canonical values;
- deterministic allocation and round-trip reconstruction;
- duplicate/overlap detection across manual and broker sources;
- contained Data Decisions for real ambiguity; and
- stable round-trip identity/aliases across deterministic rebuilds.

`trade_style` is not copied onto every execution and is not part of execution
identity. It is a versioned trader-authored plan associated with the resulting
stable round-trip/position identity.

The existing manual source-row `tradeIntent` field is preservation input only.
It must not remain the authoritative style record or allow conflicting intent
on separate executions in the same trade.

### Manual/broker reconciliation contract

A statement imported after manual entry is checked against every eligible
manual execution in the same selected Journal account. Candidate generation is
scoped by account, account-local trading date, instrument, currency and side.
It then compares exact quantity, aggregate quantity, price, aggregate weighted
average price, notional, fees, provider identity and available time evidence.

Exact time is never a required weak-match fact. A trader may have entered only
an approximate time. Time may rank or explain candidates, but it cannot by
itself accept, reject or merge a manual/broker match.

Matching tiers are:

1. A previously confirmed provider execution identity already attached to the
   canonical execution is a strong idempotent match and may attach repeated
   source provenance automatically.
2. Same date/instrument/currency/side with exact quantity and price is a strong
   candidate, but not automatic proof when one source is manual.
3. Same date/instrument/currency/side with exact quantity but a different price
   remains a possible candidate because a manual price may be approximate.
4. One manual aggregate may match several broker fills, or several manual rows
   may match one broker aggregate, when quantities sum exactly. Weighted price,
   notional and chronology are displayed as evidence; they never silently
   collapse the group.
5. Repeated same-size/same-price fills or several possible groupings are an
   ambiguous candidate set. The system does not choose by nearest time.

There is no universal hidden price tolerance that declares equality. Exact
decimal comparisons, quantity sums and weighted prices are shown. Any non-exact
price or grouped-fill conclusion requires the trader.

The v1 durable codes are:

- matching basis: `manual_broker_reconciliation_v1`;
- one-to-one issue: `manual_broker_possible_duplicate`;
- grouped issue: `manual_broker_grouped_fill_candidate`; and
- effect: `provisional_import_withheld_manual_active`.

The Data Decision `overlap_key_sha256` is the reconciliation set's privacy-safe
candidate evidence digest. Raw symbols, prices, quantities, times, broker IDs or
manual text are not encoded into a browser-visible reference or diagnostic log.

When a candidate exists, the import still accepts unrelated valid rows. For the
candidate only:

- the existing manual execution stays `accepted` and continues to drive the
  current position, round trips and analytics;
- the complete broker source row and provider evidence are preserved;
- the provisional imported execution stays `needs_decision` and contributes no
  second position change, P/L or analytics fact;
- Data Decisions shows both sources, every differing fact, the affected trade
  chain and a before/after reconstruction preview; and
- waiting indefinitely is valid and never changes the manual execution.

The current round-trip repository cannot satisfy that rule merely from
`current_state = 'needs_decision'`: it presently loads that execution and applies
its quantity before limiting the chain. Migration 0021 therefore makes pending
reconciliation membership an explicit reconstruction-input exclusion.
`journal_execution_reconciliation_members` joined to a pending reconciliation
set identifies only the provisional imported members to omit. The accepted
manual execution remains in the ordered input. Other kinds of
`needs_decision` execution retain their existing containment behavior.

Import commit must insert the provisional execution, reconciliation set/member
rows, linked Data Decision and import status in the same transaction before any
rebuild runs. The batch becomes `accepted_with_decisions`, not blocked. A
rebuild/query can never observe the provisional execution without its exclusion
membership. Analytics eligibility is derived from the same filtered canonical
reconstruction, not from a separate dashboard-only filter.

The trader actions are:

- `same_execution`: reconcile the broker evidence to the manual record;
- `separate_executions`: accept both as distinct facts and persist the negative
  relationship so the same evidence is not repeatedly questioned;
- `correct_manual_execution`: append a corrected manual version, then re-run
  candidate matching; or
- `decide_later`: retain the pending state with no factual mutation.

These are product labels. The one-to-one `same_execution` action uses the
existing `merge_supported_duplicate` audit action; `separate_executions` uses
`keep_distinct`; and `correct_manual_execution` uses
`correct_execution_fact`. Migration 0021 adds the exact
`reconcile_grouped_fills` decision/event action needed for quantity-conserving
one-to-many or many-to-one resolution. `decide_later` may append a
reconciliation review event but does not resolve the Data Decision or change an
execution.

The existing `merge_supported_duplicate` implementation currently requires
exact identity facts including `executedAtUtc`. Tracker 1 must not weaken that
ordinary merge globally. It adds a reconciliation-set-authorized one-to-one
path that may accept a time, price and/or fee difference only when all candidate
members, account scope, account-local date, instrument, currency, side, exact
quantity and expected versions match the still-pending set and the trader
confirms the displayed before/after preview. The reconciliation-specific path
may also accept a displayed manual/broker price difference because the manual
price may be approximate; the broker price becomes the confirmed current fact
and the original manual price remains in version history. Date, symbol,
instrument, currency, side or total-quantity differences cannot be smuggled
through this path.

For a confirmed one-to-one match, the stable manual execution ID is retained.
Broker provenance/identity is attached and an immutable new version may replace
approximate manual time, price, fees or other confirmed facts with broker facts. The
original manual source and version remain in history.

For a confirmed one-to-many or many-to-one fill match, exact broker fills become
the active canonical executions so allocation arithmetic remains factual. The
manual execution records are superseded, not deleted; their source evidence,
identity aliases and reconciliation lineage remain visible as `Reconciled to
broker fills`. Nothing is superseded before confirmation.

Every reconciliation resolution is atomic and optimistic:

- `same_execution` one-to-one appends/attaches broker facts, supersedes the
  provisional candidate, resolves the set/decision and rebuilds once;
- grouped same-execution resolution accepts all exact broker members,
  supersedes all replaced manual members, resolves the set/decision and
  rebuilds once;
- separate resolution accepts every provisional broker member, records the
  durable negative relationship, resolves the set/decision and rebuilds once;
- any stale member version, changed selection, changed set revision, quantity
  conservation failure or reconstruction failure rolls back every mutation.

An exact reimport or a new import carrying the same provider/content evidence
must attach provenance to the existing pending set rather than creating another
provisional execution or Data Decision. Stronger evidence may enrich the
pending candidate display, but it cannot resolve the set without the trader.
While pending, broker-only fees or more precise time remain visible evidence;
they do not silently alter the manual execution or upgrade fee/net-P/L coverage.

## 5. Manual trade capture versus historical import

### Normal recent-entry boundary

The first release uses an account-local trailing seven-calendar-day recent-entry
window, including today:

- a new day trade may be entered for today or the previous six calendar days;
- a completed swing may be entered when its closing execution is inside that
  window, even when its opening execution is older;
- an active swing may be entered with its true earlier opening date because it
  is still a current position; and
- an already tracked manual trade may receive a versioned factual correction
  after the window; the correction does not pretend to be a new current entry.

Older untracked completed activity belongs in broker statement import or a
future separately planned historical manual-import workflow. The Day Trade
Tracker does not expose a bulk old-trade backfill mode.

The recent-entry window is one named server configuration value used by UI and
commands. It is not duplicated as magic numbers in components.

### Actual execution dates

Every manual execution row has its own:

- trading date;
- execution time;
- account/source timezone;
- side, quantity, price, fees and currency; and
- stable client row identity for preview corrections.

The current one-date-per-batch UI is insufficient and must be replaced. A
single submission may contain Monday, Tuesday and Wednesday executions or an
August 2 opening and August 5 closing execution.

After save, the Journal assigns each execution to its actual account-local
trading date. Whole-day notes and reviews are never combined merely because the
executions were submitted together.

## 6. Manual preview and focused save flow

Manual capture remains server preview then commit, but deterministic results do
not require a separate confirmation ceremony:

1. The trader chooses Day Trade Tracker or Swing Trade Tracker and enters one or
   more dated executions.
2. The server validates and previews the rows against the complete selected
   account/instrument/currency ledger without mutating facts.
3. The preview groups the rows into complete trades, active-position candidates,
   additions/reductions to tracked positions and factual conflicts.
4. The selected Tracker supplies Day or Swing style. When the result is
   deterministic, the client commits it directly; when facts conflict, the
   trader answers only the specific plain-language question required.
5. Commit writes manual source evidence/executions, the validated manual boundary
   assertion, style-plan event and deterministic rebuild in one retry-safe
   command.
6. The response provides the affected Day Tracker dates and/or Swing Tracker
   position refs without exposing internal UUIDs.

The preview uses a short-lived, signed opaque ref bound to the authenticated
owner/workspace/account, normalized payload digest, expected account-selection
ref and expiry. Commit revalidates the payload and is idempotent.

### Manual position relationships

The server derives one bounded relationship for each previewed trade. These
values remain internal in the ordinary deterministic UI; the trader sees a
focused question only when an existing position or flip makes the relationship
genuinely ambiguous:

- `start_new_trade`: the position for this manually tracked trade was zero
  immediately before its first opening execution;
- `continue_tracked_position`: the executions add to or reduce the selected
  existing legitimate-open position;
- `close_tracked_position`: the executions reduce or close the selected
  existing legitimate-open position; or
- `not_finished`: return to entry without committing the proposed trade group.

For a new long, the first opening side is Buy. For a new short, the first
opening side is Sell. A Sell is never guessed to be a new short when a tracked
long may exist.

`start_new_trade` is an explicit trader-authored zero-boundary fact for this
manual trade, not a broker-statement opening-inventory guess. The server rejects
it with a stable relationship-conflict code when the canonical selected-account
ledger already contains an incompatible open position. It does not create a
routine opening-inventory Data Decision.

### Exact manual point evidence

The submitted rows are point evidence for the executions the trader intentionally
entered. A balanced deterministic group may be saved as a complete round trip
without asking the trader to restate what the rows already prove. This is not a
claim that every execution in the entire brokerage account or trading day was
entered.

Daily/account coverage therefore remains honestly partial unless separate
evidence proves otherwise, while a fully supplied manual round trip may still
have exact execution-level P/L. The generic
`manual_trading_day_coverage_unconfirmed` decision is not created merely because
the trader used the intentional manual tracker.

## 7. Day Trade Tracker

### Product boundary

Day Trade Tracker focuses on trades intended for same-day management and on the
current/recent dates when reliable notes are still practical.

The current canvas includes:

- manual execution entry at the top;
- today/current-week navigation;
- each affected day's completed day trades;
- day trades still open, clearly separate from swings;
- trade tags, trade notes and rule reviews;
- whole-day rules and daily notes; and
- links to affected Data Decisions when an actual conflict exists.

### Late day-trade entry

When Wednesday submission contains Monday, Tuesday and Wednesday trades:

- executions are saved on their actual dates;
- the response shows separate `Review Monday`, `Review Tuesday` and
  `Review Wednesday` actions;
- each date has its own daily note and rule-review record;
- entry time remains Wednesday in provenance; and
- no combined three-day note is created.

Within the recent-entry window, the trader may add notes after entering the
trade. The UI labels notes with their actual creation/update timestamps. After
the window, existing factual executions and previously saved notes remain
readable; later revisions remain timestamped and never look contemporaneous.

### Day trade held open

A Day trade that remains open does not become a swing automatically. It stays
classified `day_trade_still_open` and appears on Open Positions. On a later
account-local day, the trader may:

- keep it classified as an open day trade;
- reclassify it as `swing` with recorded transition time/context;
- classify it as `unplanned_hold` or `other`; or
- close/reduce it with new executions.

Reclassification never rewrites the original plan.

## 8. Swing Trade Tracker

### Active swing definition

An active swing requires both:

1. a current `legitimate_open` factual round-trip projection with nonzero
   remaining position; and
2. the current active trader-authored style plan `swing` for that same stable
   round-trip identity.

Neither fact alone is enough. A swing plan cannot turn an unresolved execution
chain into a confirmed position, and holding duration cannot create a swing
plan.

### Swing entry cases

The preview handles:

- opening executions only: confirm `Active swing trade`;
- opening and closing executions on different dates: confirm `Completed swing
  trade`;
- a planned swing closed the same day: retain Swing intent in the tracker and
  classify its completed analytics fact as a Day trade;
- executions adding to/reducing an existing swing: link the selected active
  position and preserve its identity/history; and
- a direction flip: close the prior swing and require a new plan for the excess
  position in the opposite direction.

### Active swing list

`/trade-tracker/swings` shows:

- active swings first;
- symbol, direction, remaining quantity and average entry;
- first entry date/time and account-local days held;
- current trader-authored Swing classification and any later classification
  change that is useful to the review;
- today/current review-date note state;
- latest prior note and next-session plan;
- tags and applicable rule-review state;
- Add, Reduce and Close execution actions; and
- recently completed swings beneath the active list.

No unrealized P/L is guessed. It is shown only when an accepted market-fact and
valuation contract supplies it with timestamp/coverage.

### Swing detail

`/trade-tracker/swings/[positionRef]` shows:

- immutable execution/allocation timeline;
- factual position changes by actual execution date;
- style-plan history and declaration times;
- initial thesis/trade note;
- dated daily swing notes;
- tags and rule reviews;
- linked Data Decisions and coverage; and
- exit review after closure.

The page does not duplicate execution facts into an annotation table.

## 9. Swing intent and reclassification

Initial style values:

- `day_trade`
- `swing`
- `other`

Open-position status values:

- `day_trade_still_open`
- `swing`
- `unplanned_hold`
- `other`
- `unclassified`

Every declaration stores for evidence and rebuild safety:

- stable position/round-trip target;
- style/status;
- whether the trader says it was planned from entry or reclassified later;
- claimed effective execution time when applicable;
- actual declaration timestamp;
- source UI and reason code;
- expected prior revision; and
- idempotency key.

The stored plan/reclassification evidence remains available for audit and
rebuild safety, but ordinary Swing UI does not display “Planned from entry.”
Choosing Swing Tracker already communicates the trader's intent. A later
classification change may display the date it was changed without implying
that the earlier declaration timestamp was rewritten.

If a round-trip rebuild preserves identity, the plan follows its new version. If
identity becomes ambiguous or is superseded without one safe successor, the
plan becomes `needs_relink` and fails closed rather than attaching to a different
trade.

## 10. Daily swing notes

Swing notes are not whole-day notes and are not one mutable lifetime note.

One current note exists per owner/workspace/account, stable round-trip and
account-local review date. Each current record has immutable revisions.

Initial fields:

- `reviewDate`
- `note`
- optional `nextSessionPlan`
- `createdAtUtc`
- `updatedAtUtc`
- `revision`

An active swing card appears automatically on the current working canvas even
when there are no executions that day. No empty note row is automatically
created. Saving a swing note does not create a traded day, change daily/weekly
trade counts or create P/L.

Review dates use the selected Journal account timezone. Weekend/non-market-day
notes are allowed when the trader deliberately writes one, but they remain
review-only dates and do not masquerade as trading days.

### Late and retrospective notes

If a completed August 2-5 swing is first entered August 5:

- the executions retain August 2 and August 5 timestamps;
- style declaration and initial written review record August 5 creation time;
- no August 2-4 notes are invented; and
- an explicitly backdated review retains both `reviewDate` and the real later
  `createdAtUtc`, and the UI labels it `Added retrospectively`.

When a swing closes, its active card moves to completed history. All dated notes
remain attached to the same stable round-trip. Becoming flat and later reopening
the ticker creates a new round-trip/style/note history.

## 11. Open Positions relationship

`/trades/open` remains source-neutral and factual. It groups or filters current
confirmed positions as:

- Active swing
- Day trade still open
- Unplanned hold
- Other
- Not classified

Chains whose active position facts require a decision remain in a separate
`Needs a trader decision` section and are not included in confirmed-open totals.
A confirmed manual open remains in Open Positions when only a provisional
broker duplicate is pending; the provisional candidate contributes no second
quantity.

Changing the classification in Open Positions or either tracker calls the same
versioned plan service. Data is not moved between databases or copied between
trackers.

## 12. Database plan

The accepted Journal Administration plan retains migrations 0019 and 0020.
This feature uses the next migration:

### Migration 0021: trade tracking and execution reconciliation

`0021_journal_trade_tracking_and_reconciliation.ts` adds:

1. `journal_trade_style_plans`
   - current style/status projection per stable round trip;
   - owner/workspace/account composite scope;
   - claimed effective time, declaration time, current revision and state;
   - active, closed, needs-relink lifecycle; and
   - no physical delete.
2. `journal_trade_style_plan_events`
   - immutable declaration/reclassification/close/relink history;
   - reason/source, expected revision, idempotency and timestamps.
3. `journal_swing_daily_notes`
   - current note per round trip and account-local review date;
   - note/next-session plan, revision and timestamps;
   - uniqueness on owner/account/round-trip/review-date.
4. `journal_swing_daily_note_revisions`
   - immutable text revisions with actor/time/idempotency;
   - no raw execution or market facts.
5. `journal_manual_trade_boundary_assertions`
   - versioned explicit `start_new_trade`, `continue_tracked_position` or
     `close_tracked_position` relationship;
   - normalized manual payload/position target evidence, exact assertion time
     and idempotency;
   - no claim of complete brokerage-day coverage.
6. `journal_execution_reconciliation_sets`
   - durable account-scoped manual/broker candidate group;
   - matching-basis version, pending/same/separate state, linked Data Decision,
     resolution time and current revision.
7. `journal_execution_reconciliation_members`
   - immutable membership for manual executions, provisional imported
     executions and preserved broker source rows;
   - member role, candidate evidence digest and no duplicated raw private data.
8. `journal_execution_reconciliation_events`
   - append-only candidate, decide-later, same, separate, correction and
     supersession history with actor/time/idempotency.

Migration 0021 also extends the immutable Data Decisions event-action contract
with `reconcile_grouped_fills`. Because SQLite check constraints cannot be
altered in place, it uses a verified create-copy-count-and-digest-swap sequence
inside the migration transaction for `journal_data_decision_events`. Every
existing event must survive byte-for-byte at the column-value level; any count,
digest, foreign-key or integrity mismatch rolls back the migration.

The round-trip execution-input query is extended to exclude only imported
execution members of pending reconciliation sets. Migration/static verification
must prove the exclusion is account-scoped, cannot hide a manual member, and
ceases atomically when a separate decision accepts the broker executions.

Foreign keys require matching workspace/account scope and the appropriate
round-trip, execution, source-row, decision or reconciliation-set target. Every
projection change and event/revision append is one transaction with expected
revision. Tables have exact active-style, review-date, round-trip,
reconciliation-state and candidate-member indexes.

The migration does not reinterpret old per-execution `tradeIntent` values or
create synthetic swing notes. Existing test-only style values remain historical
source evidence until deliberately superseded by a trader declaration.

## 13. Server contracts

Planned Journal modules:

- `src/modules/journal/contracts/journal-manual-trade-capture-contracts.ts`
- `src/modules/journal/contracts/journal-trade-style-contracts.ts`
- `src/modules/journal/contracts/journal-swing-note-contracts.ts`
- `src/modules/journal/contracts/journal-execution-reconciliation-contracts.ts`
- `src/modules/journal/server/manual-trades/journal-manual-trade-preview-service.ts`
- `src/modules/journal/server/manual-trades/journal-manual-trade-command-service.ts`
- `src/modules/journal/server/trade-style/journal-trade-style-repository.ts`
- `src/modules/journal/server/trade-style/journal-trade-style-service.ts`
- `src/modules/journal/server/swing-notes/journal-swing-note-repository.ts`
- `src/modules/journal/server/swing-notes/journal-swing-note-service.ts`
- `src/modules/journal/server/reconciliation/journal-execution-reconciliation-repository.ts`
- `src/modules/journal/server/reconciliation/journal-execution-reconciliation-service.ts`
- `src/modules/journal/server/product/journal-day-tracker-read-service.ts`
- `src/modules/journal/server/product/journal-swing-tracker-read-service.ts`

The services consume canonical Journal repositories. They do not query V3,
legacy databases or a separate manual/swing store.

### APIs

- `POST /api/platform/journal/manual-trades/preview`
- `POST /api/platform/journal/manual-trades/commit`
- `GET /api/platform/journal/trade-tracker/day`
- `GET /api/platform/journal/trade-tracker/swings`
- `GET /api/platform/journal/trade-tracker/swings/[positionRef]`
- `POST /api/platform/journal/trade-style/[positionRef]`
- `POST /api/platform/journal/swings/[positionRef]/notes`

Every mutation requires authenticated account scope, expected account-selection
ref, CSRF/same-origin protection, idempotency and expected revision where a
current projection exists. Opaque refs are target- and account-bound.

## 14. Important edge cases

- Multiple execution dates in one batch group into their actual day views.
- Multiple trades in one batch receive separate style confirmation.
- Multiple Journal accounts never share style or notes.
- Many broker sources may feed one Journal account without changing style
  ownership.
- A trader holding the same ticker in a different Journal account has a separate
  position and journal.
- A new same-account trade cannot claim `start_new_trade` when a conflicting
  canonical position is already open.
- Scale-in/scale-out preserves the stable position when reconstruction safely
  preserves identity.
- Flat then reopen creates a new style/note history.
- Direction flip closes the old position and creates a newly classified one.
- A later broker import with a possible manual match preserves unrelated rows,
  keeps the manual execution active and withholds only the imported candidate
  until the trader decides.
- Reimporting the same pending broker evidence enriches the existing candidate
  set and never creates another provisional execution or decision.
- Exact time disagreement does not prevent candidate detection.
- Repeated identical fills never resolve by nearest timestamp.
- A confirmed one-to-one match retains the manual execution identity and adds
  broker provenance/versioned facts.
- A confirmed grouped-fill match supersedes, but never deletes, the manual
  execution projection in favor of exact broker fills.
- A confirmed separate result persists so the same pair/group is not repeatedly
  presented as a duplicate.
- Rebuild ambiguity moves annotations to `needs_relink`; no silent reassignment.
- Planned swing closed the same day retains Swing intent while its completed
  analytics fact is classified as a Day trade.
- Day trade held overnight remains an open day trade until the trader changes
  it.
- A note on a date without executions does not create performance activity.
- Missing market data displays unavailable rather than zero unrealized P/L.

## 15. Implementation sequence

### Tracker 0: Documentation acceptance

- Link this contract from the master plan, inventory, route ownership,
  migration register and prior Day Session plan.
- Record the owner-approved two-tracker decision.
- Do not implement before the documentation QA checkpoint is coherent.

### Tracker 1: Manual preview and multi-date capture

- Add per-row execution date/time.
- Implement preview/commit and explicit manual trade-boundary assertions.
- Replace routine import-style manual coverage/opening-inventory decisions.
- Preserve genuine conflict/overlap Data Decisions.
- Implement date/instrument/currency/side candidate generation without exact
  time as an identity requirement.
- Keep manual executions active and provisional broker candidates ineligible
  until `same_execution` or `separate_executions` is confirmed.
- Support one-to-one and quantity-conserving grouped-fill reconciliation.
- Add the reconstruction-input exclusion for only the provisional members of a
  pending reconciliation set; do not weaken other `needs_decision` containment.
- Add a set-authorized time-tolerant one-to-one merge without weakening the
  ordinary exact merge command.
- Prove retry safety and exact-date grouping.

### Tracker 2: Style persistence

- Complete and verify the already approved Journal Administration migrations
  0019 and 0020 before creating tracker migration 0021. Administration UI may
  continue later, but the immutable database history cannot skip or reorder its
  reserved migrations.
- Back up/restore-verify the protected database.
- Implement migration 0021 after accepted migrations 0019/0020.
- Add style plan/events and rebuild-safe identity behavior.
- Remove per-execution intent as active UI authority.

### Tracker 3: Day Trade Tracker revision

- Rename and focus the existing route/navigation.
- Connect multi-date response actions and recent-entry boundary.
- Preserve existing approved current-day visual language, notes, tags and rules.
- Keep older factual history honest and separately timestamp late writing.

### Tracker 4: Swing Trade Tracker

- Add active/recently-completed list and position detail.
- Add dated swing notes and position-level execution actions.
- Preserve facts and show no guessed unrealized P/L.

### Tracker 5: Open Positions integration

- Add trader-authored classifications and filters.
- Keep factual unresolved chains in the separate Data Decisions section.
- Prove both tracker views and Open Positions read the same position/style
  authority.

### Tracker 6: Integrated acceptance

- Run focused checks per slice with one worker under resource pressure.
- At the integrated checkpoint run broader type/lint/regression/build/browser,
  privacy, database and recovery verification.
- Obtain visual review only after the two real workflows and their complete UI
  are technically complete.
- Update the master plan, progress, register and project log.

## 16. Verification contract

### Manual capture

- Every row retains its actual date/time and full decimal precision.
- Monday/Tuesday/Wednesday rows never combine daily notes.
- Current/recent day trades and older-opening active/recently closed swings obey
  the defined entry boundary.
- A start-new-long and start-new-short work from explicit trader assertion.
- A conflicting existing position fails without partial writes.
- Preview/commit retry does not duplicate evidence, executions, plans or notes.
- Deterministic balanced manual groups save without a redundant confirmation
  screen; real relationship conflicts still require a focused trader choice.
- Saved manual execution corrections create immutable versions, reject stale or
  cross-account references and rebuild all old/new affected chains and dates.
- Routine intentional manual capture does not create import opening-inventory or
  whole-day-completeness decisions.
- Genuine broker/manual overlap and factual conflicts still enter Data
  Decisions.
- Pending manual/broker reconciliation counts the manual execution exactly once
  and excludes only the provisional imported candidate.
- The batch reports `accepted_with_decisions`; pending candidates do not block
  unrelated rows or contaminate the manual chain's ordered input/digest.
- A statement containing one candidate still imports every unrelated valid row.
- Approximate manual time does not prevent a same-date/facts candidate.
- Repeated identical fills produce an explicit candidate group, never an
  automatic nearest-time match.
- `same_execution` preserves history and prevents double counting;
  `separate_executions` activates both and prevents repeated prompting.
- One-to-many and many-to-one confirmation conserves exact quantity and uses
  exact broker fills as the active canonical facts.
- Resolution is all-or-nothing under stale-version, account-selection,
  conservation and rebuild failures.
- Reimporting identical pending evidence is idempotent and produces one
  candidate set/decision.
- Pending broker fees/time do not change manual facts or metric coverage.

### Style and lifecycle

- Style is one versioned position-level record, never conflicting execution-row
  labels.
- Holding duration never changes style.
- Reclassification preserves original and actual declaration times.
- Swing and Day tracker intent stays trader-authored. Independently, every
  ready-closed round trip is classified for analytics as a Day trade when its
  opening and final closing executions share the account trading date, or a
  Multi-day trade when they do not.
- Scale-in/out preserves identity; flat/reopen and flips produce the correct new
  lifecycle.
- Rebuild ambiguity never silently moves writing.

### Notes and views

- One swing/date note cannot cross user/account/position boundaries.
- Note revisions reject stale writers and remain immutable.
- No empty note is auto-created.
- A review-only date does not change trading-day counts/P&L.
- Late notes show their actual creation time and retrospective state.
- Closing a swing preserves its full note history.
- Day Tracker, Swing Tracker and Open Positions reconcile to the same factual
  ledger and style-plan service.

### Presentation

- Both trackers use the approved light Material shell and exact account scope.
- Labels clearly say Day Trade Tracker, Swing Trade Tracker and Open Positions.
- Only the most-specific active Tracker link uses the active navigation color.
- Day Tracker does not duplicate full active-Swing lifecycle cards; Swing fills
  remain visible as factual dated executions and Swing lifecycle management stays
  on Swing Tracker.
- Ordinary UI does not expose internal relationship/style codes or “Planned from
  entry.”
- Displayed trading decimals have at most two places; inputs remain lossless.
- Empty/unavailable/conflict states are honest and contain no sample/V3 fallback.
- Manual-entry and Data Decisions copy uses ordinary trader language. Stable
  codes and implementation terms remain server-side or in developer evidence.

## 17. Stop conditions

Stop the affected implementation if:

- separate Day/Swing execution stores or databases are introduced;
- style is inferred from elapsed time or unmatched rows;
- manual capture silently assumes an existing position is zero despite a ledger
  conflict;
- a possible imported duplicate becomes analytics-eligible while its manual
  counterpart remains active and the trader has not decided;
- exact time is required to discover a manual/broker candidate;
- a weak or grouped candidate automatically replaces a manual execution;
- a provisional imported candidate enters the round-trip ordered input merely
  because its execution state is `needs_decision`;
- the ordinary exact duplicate merge is globally weakened to ignore time;
- a grouped resolution partially accepts/supersedes members before failure;
- repeated import evidence creates duplicate pending sets or decisions;
- a manual execution or its source history is physically deleted during
  reconciliation;
- routine intentional manual entry is forced through import-only uncertainty;
- multiple execution dates share one daily note/review;
- old completed trades can be bulk-entered through the normal tracker;
- a late note appears as though written contemporaneously;
- an unresolved active-position chain is called an active swing (a separately
  withheld provisional duplicate does not invalidate an accepted manual open);
- a rebuild attaches style/notes to an ambiguous different trade;
- swing notes create trades, executions, P/L or traded-day counts;
- Open Positions loses non-swing/unclassified positions;
- V3/sample data becomes runtime authority; or
- migrations 0019/0020 are displaced from the accepted Admin plan.

## 18. Acceptance checklist

- [x] Owner chose separate Day Trade and Swing Trade trackers.
- [x] Both trackers share one canonical Journal ledger.
- [x] Trade Tracker remains current/recent journaling, not historical backfill.
- [x] Completed swings may be entered when they close with their true earlier
      opening executions.
- [x] Per-execution date/time and preview/commit are connected.
- [x] Manual boundary assertions replace routine import-style uncertainty.
- [x] Manual/broker candidates ignore exact time as a hard requirement and
      preserve one active position effect while pending.
- [x] Same/separate/correct/later decisions work for one-to-one and grouped
      fills without losing either source history.
- [x] Pending reconciliation explicitly excludes only provisional imported
      members from reconstruction and remains idempotent across reimports.
- [x] Day notes remain separated by actual trading date.
- [x] Style is position-level, versioned and rebuild-safe.
- [x] Active swings appear automatically without creating empty daily notes.
- [x] Swing daily notes preserve real and retrospective timestamps.
- [x] Completed swings retain notes; flat/reopen starts new history.
- [x] Open Positions retains every factual classification and pending decisions.
- [ ] Focused and integrated verification pass.
- [ ] Owner reviews the complete real-data Day/Swing experience.

## 19. Explicitly deferred

- Bulk historical manual-execution backfill.
- Automatic AI swing summaries or advice.
- Automatic style inference from duration, chart behavior or overnight holding.
- Guessed unrealized P/L.
- Portfolio/strategy lot separation inside one netted account beyond the
  accepted Journal account/instrument/currency execution model.
- Automatic market-calendar note creation or reminders.
- Cross-account swing aggregation.
- Public deployment and production Discord activation.
