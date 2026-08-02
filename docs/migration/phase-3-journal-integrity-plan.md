# Phase 3 Journal Integrity Plan

**Status:** Runtime-complete and technically accepted under delegated owner authority. The exact 11-file suite passed 129 tests with one worker and no file parallelism; the static verifier, fresh disposable proof, protected backup/restore rehearsal, private preview/import/exact-reimport, append-only vault, and independent real-database verification all passed. The implementation remains local and unpushed. Phase 4 Core Analytics planning is the next boundary.
**Phase:** 3 - Journal integrity
**Owner modules:** Journal, with Platform owning the physical migration runner
**Replacement repository:** `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
**Replacement database:** `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite`

## 1. Outcome

Phase 3 replaces the legacy import/trade authority with a factual Journal path:

```text
private source evidence or manual entry
  -> immutable source records and explicit coverage
  -> one account-scoped execution ledger with immutable versions
  -> contained Data Decisions for unresolved facts
  -> deterministic full-chain rebuilds
  -> closed, open, or needs-decision round-trip projections
```

One unresolved chain may exclude only that chain from dependent results. It
must never hide unrelated valid executions or round trips. The trader controls
factual corrections; the system controls validation, position arithmetic,
provenance, rebuilds, and visible coverage.

This phase is backend and data integrity work. It does not redesign Imports,
Data Decisions, Trade Tracker, Trades, Calendar, Workspace, or Analytics UI.
Visible work will receive a separate UI plan and iterative owner review.

## 2. Accepted entry boundary

Phase 2 is complete at replacement commit `8c5b303567b13731bfe90370762242358f9cc71f`.
The replacement database contains:

- two accepted schema migrations;
- one development user;
- one development workspace;
- one active owner membership;
- one active Journal account;
- zero broker/source-account identities; and
- no import, source-row, execution, decision, round-trip, or private statement data.

The committed local-only `development_local` ownership seed is authoritative.
Discord/public-login bootstrap drafts are not Phase 3 inputs and must not be
restored. Public login is deferred until the complete dashboard is preparing
to go live; later identity linking must preserve the current stable UUIDs.

The Slice D source-account link is Journal import ownership, not login
authentication. It binds a broker statement's server-only source identity to the
already seeded Journal account; it does not create a Platform user, login
provider, session, or public authentication route. The local development owner
remains authoritative now. Discord-first login and optional email/password
remain deferred until go-live preparation.

The legacy application and database remain read-only recovery/reference
sources. No dual write, route cutover, deployment, push, legacy deletion, or
production mutation is part of Phase 3.

## 3. Reconciled private-source evidence

Read-only inspection established the following planning baseline without
placing private values or the private filename in Git:

| Evidence | Reconciled result |
| --- | ---: |
| CSV records, including section/header/non-execution records | 2,284 |
| `Trades,Data` records | 1,614 |
| Stock execution records | 1,072 |
| Forex trade records | 542 |
| Non-Trade records | 670 |
| Stock inventory symbols | 113 |
| Stock mark-to-market records | 115 |
| Stock open-position records | 1 |
| Exact duplicate raw records | 1 pair |
| Stock chains under zero-to-zero arithmetic | 113 |
| Closed zero-to-zero round trips | 331 |
| Execution-derived non-zero chains | 2 |
| Non-zero chains independently safe to classify as legitimately open | 0 |
| Non-zero chains requiring a contained trader decision | 2 |
| Flip executions in this statement | 0 |
| Same-timestamp execution groups | 1, same side |

The accepted private file is identified for this checkpoint only by SHA-256
`b0d4117c59f8fcbb3601ebc48d38035ad7d46417239a5f4985fdd4d3dfd913ad`
and size 239,292 bytes. Its filename and embedded account identifier remain
private and are not recorded in Git.

The statement covers January 1 through January 31, 2026. Its stock opening
quantities are explicitly zero. That evidence permits a sell from zero to open
a short position; it must not be discarded as a legacy “starting sell.” The
statement also reports a non-zero Open Positions quantity for one chain, but
two Mark-to-Market rows give conflicting closing quantities for that same
instrument. The other non-zero chain conflicts with zero closing-position
facts. The system must not choose between those facts: both chains are contained
in Data Decisions for the trader, while the 331 unrelated closed round trips
remain usable.

The legacy database remains comparison evidence only. Its 1,072 executions and
336 saved trades (334 closed and 2 open) were produced by legacy session/time-gap
splits and are not a replacement target. Legacy repair rows, review jobs,
feedback summaries, saved trades, JSON projections, and old “dismissed” issue
state are not copied as trader-approved truth.

All 2,284 source records are preserved. The 542 Forex records are classified
as retained evidence with `equity_journal_not_enabled` coverage in this phase;
they are neither silently discarded nor converted into stock executions.

## 4. Non-negotiable integrity rules

1. Raw source evidence is immutable. Corrections create new execution or
   position-fact versions and retain the prior facts.
2. A source file is identified by its SHA-256. A source record is identified by
   file SHA-256 plus one-based record ordinal, including repeated identical
   records. A manual/correction record is identified by its server-issued batch
   identity plus ordinal and an idempotency key; it never pretends to have a
   broker-file digest.
3. An exact file reimport is idempotent. One identical row pair inside a file
   remains two occurrence-distinct records unless stronger broker identity or a
   trader decision proves duplication.
4. Broker and manual executions use the same ledger and reconstruction path.
   Provenance differs; analytics population does not.
5. Upload/submission order never controls grouping. The full affected
   workspace/account/instrument/currency chain is rebuilt chronologically.
6. Source times retain original text, source timezone, parser/time-normalization
   version, canonical UTC, and a deterministic tie key.
7. Financial numbers use validated canonical decimal strings. JavaScript
   `number`, SQLite `REAL`, and implicit binary-float conversion are prohibited
   for authoritative quantities, prices, fees, position arithmetic, and future
   money calculations.
8. No missing value becomes zero. Unsupported, absent, ambiguous, excluded,
   open, and pending-decision states remain explicit.
9. A user decision cannot override arithmetic. A non-zero chain becomes closed
   only through a supported execution or corrected opening/closing position
   fact.
10. Every read and write binds both `workspace_id` and `account_id` through a
    server-derived scope. Client-supplied IDs never grant access.

## 5. Migration structure

Phase 3 adds four forward-only Journal migrations to the Platform-owned static
manifest. Migration statements and post-schema digests remain immutable after
application.

| Order | Migration | Purpose |
| ---: | --- | --- |
| 3 | `0003_journal_import_evidence` | Import envelope/events, every raw source record, source coverage intervals, findings, instruments, and opening/closing position facts |
| 4 | `0004_journal_execution_ledger` | Stable executions, immutable factual versions, provenance, and overlap identities |
| 5 | `0005_journal_data_decisions` | Current contained decisions and append-only trader/system decision events |
| 6 | `0006_journal_round_trip_projection` | Rebuild evidence, stable round trips, immutable projections, allocations, aliases, and trading-day identity |

Migrations 3-6 are additive. They do not reinterpret or copy legacy tables.
They are first applied to a disposable copy and then to the replacement
database only after the backup/restore and focused-verification gates in this
plan pass.

### Required Phase 2 verifier refactor

Before migration 3 is added, the existing manifest/verifier names and modes
must be separated so later migrations cannot redefine the accepted Phase 2
foundation:

- replace `platformEmptyFoundationDomainTableNames` with an immutable five-table
  ownership-foundation list;
- keep complete managed-table names derived from the current manifest;
- support verifying an explicitly selected historical manifest prefix without
  treating it as ordinary runtime readiness;
- make current-database verification report all current managed tables and the
  final migration digest;
- keep the development-owner relationship verifier valid after a source-account
  identity and Journal rows exist; it must require exactly one user/workspace/
  owner membership/account while allowing verified, correctly scoped later
  rows; and
- keep ordinary runtime strict: an accepted historical prefix still reports
  migrations pending and is never automatically upgraded by application start.

This refactor is a compatibility prerequisite, not a weakening of migration or
schema-drift checks.

## 6. Schema contract

Every table is `STRICT`. Every UUID is canonical lowercase RFC 4122 version 4.
Every UTC timestamp is `YYYY-MM-DDTHH:mm:ss.sssZ`. All current-state tables
retain immutable history through version/event tables. Cross-scope references
use composite workspace/account keys where applicable.

### 6.1 Migration 0003 - source evidence

`journal_import_batches`

- Stable immutable import identity plus an audited current-state pointer,
  workspace/account/source identity, source kind
  (`broker_statement` or `manual_batch`), source system, adapter/version,
  parser/version, and mapping/version.
- File SHA-256, byte count, MIME/encoding, privacy-safe display label, and a
  relative evidence-vault object key. The original filename is not required and
  must not be exposed in documentation or logs.
- Broker-statement file fields are required for `broker_statement` and forbidden
  for `manual_batch`. Manual/correction batches instead carry a server-issued
  idempotency key so a retried save cannot duplicate an execution.
- Optional statement-period dates and declared source timezone.
- An immutable snapshot of the adapter mapping contract used for this import;
  custom mappings are preserved rather than reinterpreted under later defaults.
- Current state: `preview`, `blocked`, `accepted`,
  `accepted_with_decisions`, or `superseded`.
- Exact preserved-row, mapped-execution, unsupported, issue, and pending-decision
  counts.
- Exact reimport uniqueness for one workspace/source digest. A file assigned to
  a conflicting account is rejected/decision-gated rather than silently shared.

`journal_import_events`

- Append-only sequence per batch for preview, block, acceptance, supersession,
  and acceptance/supersession state changes.
- Resolving a source issue recomputes the batch's exact pending-decision count.
  The last resolution appends the transition from `accepted_with_decisions` to
  `accepted`; accepting a source limitation is a reviewed resolution, not an
  invented fact or a coverage upgrade.
- Actor, canonical time, prior/new state, and reason code. Later rebuild rows
  reference their triggering import event, avoiding a forward/circular foreign
  key from migration 3 to migration 6.
- No private source values in event messages.

`journal_source_rows`

- One immutable row for every CSV record, including section names, headers,
  non-execution data, Forex, blank-but-meaningful records, and repeated rows.
- Unique `(import_batch_id, record_ordinal)` and unique source identity derived
  from file SHA-256 plus one-based ordinal.
- Section, record type, asset category, exact raw record SHA-256, canonical raw
  field-array JSON for private review, content fingerprint, and occurrence
  ordinal.
- Initial classification is immutable. Effective disposition is derived from
  the latest accepted decision event rather than rewriting raw evidence.
- `mapped_coverage_fact` identifies immutable trader-supplied statement-period
  evidence created by a coverage Data Decision; it is not an execution or a
  claim derived from upload order.

`journal_source_row_issues`

- Immutable deterministic findings with scope, code, severity, blocking flag,
  detector/version, and source-row reference when applicable. Resolution is
  derived from an immutable linked decision event; the finding is not rewritten.
- When a failed execution or position row still has a safely normalized
  instrument/currency, the finding stores that chain scope and its independently
  recoverable UTC instant. This contains uncertainty to dependent projections;
  a row whose time cannot be established conservatively affects the full known
  symbol chain.
- Chain containment is limited to findings that remove execution/position facts
  required for reconstruction. An invalid optional provider identity remains a
  visible deduplication review but does not suppress otherwise valid execution
  arithmetic. Mapped missing-price and overlap findings use their own existing
  execution/metric containment instead of a second chain-wide hold.
- Informational non-execution rows do not count as problems. Import-blocking
  findings are limited to unsafe file/mapping/parser conditions that prevent a
  faithful commit.

`journal_source_coverage_intervals`

- Immutable account/source/asset-class coverage claims with local start/end,
  timezone, optional canonical UTC bounds, and coverage kind (`complete`,
  `partial`, `point_only`, or `unknown`).
- Broker statement sections may establish complete execution coverage only for
  the asset classes and period they actually report. Manual entry is
  `point_only` and never implies that no other account activity occurred.
- Accepted statement intervals are unioned by fact, not upload order. Overlaps
  reconcile identities. A gap is explicit coverage loss and is never interpreted
  as a period with zero activity.

`journal_instruments`

- Workspace-owned stable instrument UUID, asset class, normalized symbol,
  quote currency, and optional versioned provider identity.
- No symbol-only cross-workspace authority and no assumption that identical
  display symbols are the same instrument across asset classes/venues.

`journal_position_facts`

- Immutable opening/closing/open-position facts linked to their source row or
  a trader correction.
- Fact kind, effective local date/time precision, source timezone, optional
  canonical UTC instant, instrument/currency, canonical quantity decimal,
  source/version, and superseded fact link. The effective current fact is the
  latest non-excluded fact in the immutable supersession chain.
- A correction's effective fact version is part of its immutable normalized
  evidence and idempotency contract. A key reused between ordinary correction
  and confirmed-open semantics fails closed instead of returning evidence with
  the wrong fact version. The pre-acceptance correction mapping is versioned as
  `position_fact_mapping_v2` for this payload change.
- An `exact` position checkpoint requires canonical UTC whose date in the stored
  source timezone equals the effective local date. When original local timestamp
  text is present, that same UTC instant must map back to the complete stored
  local date and time. Date/day-start/day-end behavior is unchanged.
- Closing-statement facts reconcile execution-derived ending quantity. A
  matching non-zero fact establishes a legitimate open chain. A mismatch opens
  a contained decision and cannot be waved closed.

### 6.2 Migration 0004 - canonical execution ledger

`journal_executions`

- Stable owner/account execution UUID, current version pointer, and current
  state: `accepted`, `needs_decision`, `excluded_by_trader`, or `superseded`.
- Instrument and trade currency are explicit; source type is not a separate
  ledger.

`journal_execution_versions`

- Immutable monotonically numbered facts for one stable execution.
- Original timestamp text, IANA timezone, time parser version, UTC timestamp,
  deterministic source-order key, side, canonical positive quantity, canonical
  positive price, nullable canonical fees with an explicit source sign
  convention, fee currency, trade currency, instrument, fact-completeness code,
  actor/source reason, and creation time.
- A current `accepted` execution has every required time/order, instrument,
  currency, side, quantity, and price fact. A row missing identity, time, side,
  or quantity remains source evidence needing correction and does not become an
  accepted ledger execution. When position-changing facts are complete but
  price is missing, a `needs_decision` execution version may retain a null price
  so position consequences remain visible; it cannot produce a `ready_closed`
  round trip or realized metric.
- Corrections insert a new version and atomically move the current pointer.
  Authoritative financial facts never live only in JSON.

`journal_execution_provenance`

- Many-to-many link from an execution version to a source record and import
  batch with provenance kind (`broker`, `manual`, `correction`, or
  `overlap_match`).
- Manual entries are represented by a `manual_batch` and source records created
  from the exact user-entered facts, so later broker matching does not create a
  second trade system.

`journal_execution_identity_aliases`

- Versioned privacy-safe digests for broker execution/fill identity, manual
  identity, and content-plus-occurrence overlap identity.
- Raw broker account/order/execution identifiers are not stored in alias
  columns or logs. Account and execution/content identity configurations use
  the accepted active-key-version plus complete retained base64 key-map shape,
  with separate HMAC purposes for broker identity and normalized content.
- Before overlap planning, every HMAC scheme referenced by scoped broker/content
  aliases or provider-identity provenance must be recoverable from the configured
  key map. A missing or unsupported scheme fails closed as recovery-required;
  it is never interpreted as evidence of a new execution.
- Strong provider identity and content-occurrence candidates are evaluated across
  every configured key version. Rotation-only copies of one logical content
  alias are counted once, while one identity resolving to different executions
  fails closed. An unambiguous retained-key match keeps the stable execution and
  establishes/touches its active-key alias; alias ownership is never remapped.
- Strong broker fill identity wins. Otherwise content fingerprint plus
  occurrence ordinal may match only when statement coverage makes the match
  unique. Count disagreement or competing candidates creates a Data Decision.
- Two different strong broker fill identities remain two executions even when
  every normalized economic fact is identical. The second execution does not
  steal the first execution's content-occurrence alias. A later overlap carrying
  either strong identity resolves to that exact execution; an overlap without a
  reliable identity inventories all non-superseded current executions with the
  same canonical content facts, including provider-distinct executions without
  the unique content alias. One candidate may match; more than one remains
  decision-bound and is never silently assigned to the alias owner.
- When the same strong identity arrives with changed core facts, the source row
  is attached to the existing execution as conflict evidence and the affected
  execution requires a Data Decision; the import never creates a third
  execution merely because its content fingerprint changed. A trader's prior
  exclusion is preserved during overlap matching and fee enrichment.
- A `keep_distinct` or supported duplicate-merge decision promotes any
  privacy-safe provider identity retained in provenance into the active alias
  registry. Conflicting provider identities fail closed instead of silently
  remapping another execution.

### 6.3 Migration 0005 - Data Decisions

`journal_data_decisions`

- One current contained issue with stable UUID, workspace/account, issue code,
  state (`pending`, `resolved`, or `superseded`), target kind, typed target
  reference or deterministic chain key, effect/coverage code, creation/update
  time, monotonically increasing revision, and current event pointer. Mutations
  require the expected revision so two browser sessions cannot silently
  overwrite each other's factual decision.
- Stored targets may represent source issue, execution, position fact, overlap
  set, or affected chain. The initial service opens source/execution/position/
  chain targets only. `overlap_set` remains fail-closed and reserved until a
  persisted membership/evidence relation can bind every permitted execution;
  duplicate import findings use their evidence-bound source issue meanwhile.

`journal_data_decision_events`

- Append-only trader/system history with action, actor, reason, evidence links,
  prior/new execution-version or position-fact links, duplicate counterpart,
  and result state. The resulting rebuild references its triggering decision
  event, avoiding a forward foreign key.
- Supported factual actions are:
  `correct_execution_fact`, `add_missing_execution`, `set_execution_order`,
  `exclude_execution`, `restore_execution`, `merge_supported_duplicate`,
  `keep_distinct`, `supply_opening_inventory`, `supply_position_fact`,
  `supply_coverage_fact`, `correct_position_fact`,
  `confirm_legitimate_open_position`, and `accept_source_limitation`.
- A source-row decision is evidence-bound: execution actions may affect only an
  execution whose provenance includes that row, and position corrections may
  affect only a fact sourced from that row. A row that could not be mapped may
  instead create the missing execution or position fact from trader-entered
  statement evidence. Where the failed row retained a known chain/time scope,
  the supplied fact must match that instrument, currency, and recoverable
  instant. It may never resolve an unrelated account fact or different point in
  the same account history.
- An issue-specific correction changes only facts authorized by that issue. In
  particular, resolving `execution_price_missing` must preserve the evidenced
  instrument, currency, local/UTC time, side, quantity, fee facts, and ordering;
  only the missing price/completeness may be supplied. Broader corrections use
  an explicit execution-level review rather than overloading a source finding.
- `accept_source_limitation` is valid only for a preserved source issue. It
  records that the trader reviewed the unavailable fact without inventing a
  value or upgrading unknown/partial coverage to complete.
- `supply_coverage_fact` is valid only for a preserved missing, conflicting, or
  account-timezone-mismatched statement coverage issue. It creates immutable
  correction evidence and a linked coverage interval in the Journal account's
  trading timezone; it cannot be used against an unrelated chain or issue.
- Correcting facts or same-time order never implicitly restores an execution
  the trader excluded, and a superseded duplicate cannot be revived through a
  correction. Restoration remains a separate explicit trader action.
- `superseded_by_rebuild` is a system-only lifecycle event, not a trader action.
  When newly accepted facts or an out-of-order statement remove or change a
  chain finding, the prior pending decision becomes append-only superseded
  history before the current finding is opened. Stale warnings never remain
  current and no decision history is deleted.
- `add_missing_execution` always creates a manual/correction source record and
  provenance before it creates an execution version. The decision history may
  never inject an execution with no source evidence.
- `confirm_legitimate_open_position` is valid only when current position evidence
  supports the non-zero ending quantity. If statement facts say zero, the user
  must correct the position fact or supply/correct/exclude execution evidence;
  confirmation alone cannot change arithmetic.

### 6.4 Migration 0006 - rebuildable round trips

`journal_chain_rebuilds`

- Append-only completed rebuild evidence for one workspace/account/instrument/
  currency chain: exactly one triggering import event, decision event, manual
  event, or explicit maintenance reason; algorithm version; ordered-input
  digest; output digest; previous rebuild; counts by state; first/last execution
  times; completion time; and coverage status.
- The first implementation always rebuilds the full chain. An earliest-change
  optimization is prohibited until an equivalence proof is accepted.

`journal_round_trips`

- Stable trade UUID and current projection pointer. It contains identity and
  lifecycle state, not mutable financial facts.

`journal_round_trip_versions`

- Immutable projection for a rebuild: direction, opened/closed timestamps,
  final position quantity, state (`ready_closed`, `legitimate_open`, or
  `needs_decision`), decision/coverage
  reason, and deterministic projection fingerprint.
- Trader exclusion is execution/source-evidence scoped in Phase 3. Excluded
  executions are omitted from reconstruction, counted explicitly in rebuild
  coverage, and cause superseded/rebuilt projections; a future direct
  whole-round-trip exclusion requires its own stable UI/evidence contract.
- Realized P/L is not made authoritative in Phase 3. Phase 4 calculates it from
  eligible versioned executions under a separate metric contract.

`journal_round_trip_execution_allocations`

- Ordered exact canonical quantity allocated from an execution version to a
  round-trip version.
- Allocation role records opening, adding, reducing, closing, flip-closing, or
  flip-opening. The sum of allocations equals the execution quantity for every
  fully accepted execution.

`journal_round_trip_identity_aliases`

- Maps prior deterministic projection keys to the stable trade UUID so future
  notes, tags, and reviews survive a rebuild.
- Exact projection matches retain identity. Unambiguous execution-overlap
  continuity may retain identity. Ambiguous continuity creates a new identity
  and a visible reconciliation item; it is never silently guessed.
- Overlap continuity is active-first. If an account rebuild processes the old
  chain first and that chain has just superseded the prior current projection,
  the new chain may consult the superseded current version only when no active
  execution-overlap candidate exists. Candidate UUIDs are distinct and sorted;
  exactly one may be reactivated, while multiple candidates remain ambiguous.

`journal_trading_days`

- Stable workspace/account/local trading-date/timezone identity derived from
  actual execution time, not entry/submission time.
- It provides the later anchor for daily notes and rule reviews. Phase 3 does
  not decide the multi-day Trade Tracker screen or store daily analytics.

## 7. Canonical value rules

### Decimal strings

Normalized decimals use plain base-10 text only: no exponent, leading plus,
negative zero, redundant leading zeroes, or trailing fractional zeroes. Zero is
exactly `0`. Values are length-bounded and validated in TypeScript and by SQL
shape checks. Phase 3 arithmetic uses a dedicated `decimal.js` clone with an
explicit precision budget exceeding every accepted input/output bound. Inputs
that cannot be represented without rounding are preserved as raw evidence and
decision-gated; they are never rounded silently.

All SHA-256 values stored by Phase 3 are lowercase 64-character hexadecimal
strings. External tools may display uppercase, but comparison normalizes case
and persisted evidence remains lowercase.

### Time and order

Every execution stores source timestamp text, source timezone, parser version,
canonical UTC, and deterministic order evidence. Order priority is:

1. broker execution/fill sequence when authoritative;
2. provider order plus fill sequence;
3. statement-effective order using statement identity and record ordinal; or
4. explicit trader-confirmed manual sequence.

Manual batch array position or submission order is not an authoritative
same-time sequence. Until the trader confirms a consequential same-time order,
manual rows use deterministic unverified ordering only for repeatable previews.

Local timestamps that fall in a daylight-saving gap are invalid. A repeated
local timestamp that maps to more than one UTC instant is preserved as source
evidence and decision-gated; the normalizer never silently chooses one offset.
The trader may resolve that row by supplying the verified canonical UTC instant;
the server proves that it formats back to the preserved local timestamp in the
declared source timezone and records explicit manual-UTC parser provenance.
Statement-period dates are complete coverage only when their declared source
timezone matches the Journal account's trading timezone. A mismatch is a
contained source issue and remains partial/unknown for account-date analytics;
date labels from different timezone frames are never treated as identical
intervals.

A file UUID, upload time, insertion order, or random UUID is never a tie breaker.
Same-time same-side records may use deterministic source order. The adapter
does not guess whether opposite-side rows matter because it cannot yet see the
account's complete opening position. Full-chain reconstruction compares the
allocation result of the opposite deterministic side orders after all uploaded
statements and current position facts are known. Only a group whose order can
change opening/adding/reducing/closing/flip allocation creates one contained
chain ordering decision; a mixed-side group that cannot change the trade
boundary remains usable.
Trader ordering decisions accept only a positive bounded sequence within the
execution's existing canonical timestamp. The server derives the canonical
order key and rejects a sequence already used by another current execution in
the same account/instrument/currency/timestamp group; the client cannot submit
an arbitrary sort key or change execution time through an ordering action.

### Canonical JSON

JSON is allowed only for preserved raw field arrays and versioned non-financial
metadata. It uses UTF-8, LF normalization, stable key ordering where objects are
required, and explicit contract versions. Authoritative quantity, price, fee,
time, state, ownership, and relationship fields remain typed columns.

## 8. Import and overlap behavior

1. Stream/read the source under a strict byte limit and compute SHA-256 before
   parsing. Reject unsupported encoding, unsafe control characters, malformed
   quoting, inconsistent record structure that prevents faithful parsing, or a
   missing mapping as a blocked preview.
2. Copy the exact accepted source bytes to a temporary object in the
   hash-addressed private evidence vault under
   `private-data\traderlink-platform-import-artifacts`, verify byte identity,
   and promote it to its digest name before the database commit. The vault is
   never Git or the database-backup directory. Store only a relative object key
   in SQLite.
3. Parse every record and preserve its one-based ordinal and exact field array.
   Section/header/non-execution records are classified, not discarded.
4. Reconcile the source account through the accepted versioned HMAC identity
   service before commit. No raw account identifier or secret appears in logs,
   evidence JSON, documentation, tests, or Git.
   Multiple equivalent account rows may repeat, but distinct account identities
   in one file are a blocking conflict; the adapter never selects the last row.
   Normal product preview/import paths never auto-link an unmatched source
   identity. The one-owner Slice D preparation exception requires the explicit
   server-only sequence and exact preconditions in Section 12 before a scoped
   preview can run.
   Conflicting/malformed statement-period rows are preserved and contained as
   a review issue with unknown coverage rather than silently selecting a period.
5. Produce a privacy-safe preview with aggregate counts, blocking issues,
   contained decisions, overlap status, expected execution/round-trip coverage,
   and no symbols/account identifiers/private row values.
6. Commit source evidence, position facts, execution versions, decisions, and
   the affected full-chain rebuild in one SQLite transaction. A failure leaves
   no partial accepted database import. Because SQLite cannot transact with the
   filesystem, a post-vault/pre-database failure may leave a verified digest
   object. Report a newly created object as `vault_object_unreferenced`; report
   an already-present object only as `vault_object_reference_unverified` until
   database state proves otherwise. Never delete either final object
   automatically. Remove only the restrictive unique temporary file after a
   failed pre-promotion attempt.
7. Exact file reimport resolves to the existing batch and creates no second
   source rows or executions. Overlap matching is strongest-ID-first and
   occurrence-aware. Ambiguity remains a decision.

The original private statement remains untouched. The Phase 3 evidence vault
copy is additive. No file retention/deletion workflow is implemented in this
phase; later user-facing deletion must distinguish removing an upload artifact
from deleting durable Journal facts and must be separately planned.

## 9. Position and round-trip reconstruction

For each workspace/account/instrument/trade-currency chain:

1. Load the current accepted execution versions and applicable current position
   facts plus source coverage intervals for the entire known history. Discover
   chains from both executions and current position facts; a non-zero holding
   with no in-coverage execution remains a visible outside-coverage projection
   and decision rather than being omitted.
2. Require a supported opening position fact at the earliest coverage boundary.
   A statement-supplied explicit zero is valid. If no fact exists, create a
   contained `opening_inventory_required` decision rather than assuming zero.
3. Sort by canonical UTC plus the accepted deterministic source-order key.
4. Apply signed quantities with exact decimal arithmetic. At zero, a buy opens
   long and a sell opens short. Partial entries/exits remain in the same trip.
5. Returning exactly to zero closes the trip. The next non-zero execution starts
   another trip, even for the same symbol and date.
6. A quantity that crosses zero is split exactly: the first allocation closes
   the prior trip and the remainder opens the opposite trip.
7. Containment follows actual dependency, not a blanket symbol-chain switch:
   a missing price limits the round trip/metrics that use that price; a missing
   optional fee limits fee/net metrics only; and a missing side, quantity, time,
   or consequential execution order limits the position-dependent interval.
   That interval ends when correction resolves it or a supported position
   checkpoint/all valid interpretations re-establish the same position. Closed
   trips before it and independently reconstructable trips after it remain
   eligible, including later same-symbol trades.
   An unmapped execution or position row with a known symbol/currency is
   persisted against that chain. Its known time is contained through the next
   supported position checkpoint; if time is unavailable, only that
   symbol/currency chain is held. A trader-supplied replacement fact must match
   the preserved chain/time scope. Accepting the source limitation records
   review but never makes the dependent projections complete.
   A grouped checkpoint ends this containment only when its current facts assert
   exactly one unique canonical quantity. Conflicting multi-fact checkpoints do
   not end the hold; the existing UTC/rank ordering remains authoritative until
   a later supported single-valued checkpoint.
8. Reconcile arithmetic at every applicable opening, closing, and open-position
   checkpoint, not only at the earliest/latest record. Contiguous monthly
   statements may close a trade opened in the previous statement regardless of
   upload order. An uncovered time gap or conflicting overlapping position fact
   contains only projections that depend on crossing that gap/checkpoint;
   completed trades wholly inside verified coverage remain usable.
9. At the latest checkpoint, matching non-zero evidence yields
   `legitimate_open`; a mismatch yields `needs_decision`.
10. Commit a rebuild record, immutable round-trip versions, allocations, stable
   identity/aliases, and trading-day identities in one transaction.

## 10. Coverage contract

Phase 3 read services and the verifier return privacy-safe aggregate coverage:

- preserved source records by classification;
- mapped, accepted, needs-decision, excluded, superseded, unsupported, and
  duplicate/overlap execution counts;
- pending decisions by reason;
- closed, legitimate-open, and needs-decision round-trip counts, plus explicit
  excluded-execution counts from the latest rebuilds;
- affected versus unaffected chain counts whose denominator is every latest
  non-forked rebuild chain, including chains with zero active projections. A
  latest chain is affected when its rebuild reports a needs-decision projection,
  a chain-target decision remains pending, or a relevant execution/position
  source-chain issue is pending or trader-accepted as a source limitation.
  Aggregation fails closed when an actual scoped instrument/currency tuple has
  multiple latest leaves or a stored chain key differs from its deterministic
  workspace/account/instrument/currency derivation;
- opening/closing position-fact coverage;
- complete, partial, point-only, unknown, overlapping, and missing source
  coverage intervals;
- latest rebuild algorithm/version/digest and freshness; and
- explicit asset-scope exclusions, including Phase 3 Forex coverage.

No aggregate reports a fabricated zero for unavailable facts. A metric may use
only the records whose required state is eligible.

## 11. Local secret and evidence-vault preparation

Before the private import commit, create random account-identity and Journal
execution/content HMAC keys outside Git, SQLite, logs, and the database-backup
directory. Each key-version label is immutable. Both server-only configurations
use an active key version plus the complete retained base64 key map; Slice D may
use one recovery authority for both purposes, but their HMAC purpose domains
remain separate. Every key version referenced by account identities, execution
aliases, content-occurrence aliases, or provider-identity provenance must remain
available indefinitely under Phase 3. Promoting an active alias does not retire
the immutable prior-key provenance that still references its scheme. Retirement
requires a separately designed and verified evidence migration plus retention
policy; that mechanism is out of scope and must not be inferred from alias
promotion alone. Missing or unsupported retained authority blocks preview/import
with recovery-required rather than permitting duplicate facts. The local secrets
must be readable only by the current Windows user. Recovery evidence records
only version labels, referenced-scheme coverage, and successful non-secret
challenges, never a key, digest input, or raw account/execution identifier.

The evidence vault is outside Git and has a hash-addressed layout. Before import,
verify that the exact source hash matches the accepted private baseline. After
copy, verify byte identity and ensure no public URL or repository path exposes
the artifact.

## 12. Implementation slices and focused verification

Implementation proceeds in complete, reviewable batches. Each focused Vitest
command uses one worker and disables file parallelism.

The complete current Phase 3 focused test list is exactly these eleven files,
each included once:

- `src/modules/journal/contracts/journal-storage-values.test.ts`
- `src/modules/journal/server/accounts/journal-account-boundary.test.ts`
- `src/modules/journal/server/accounts/journal-account-fingerprint-rotation.test.ts`
- `src/modules/journal/server/accounts/journal-source-identity-preparation.test.ts`
- `src/modules/journal/server/accounts/journal-account-authorization.test.ts`
- `src/modules/journal/server/database/journal-integrity-migrations.test.ts`
- `src/modules/journal/server/imports/record-preserving-csv.test.ts`
- `src/modules/journal/server/imports/ibkr-activity-statement-adapter.test.ts`
- `src/modules/journal/server/imports/journal-import-service.test.ts`
- `src/modules/journal/server/imports/journal-private-source-automation.test.ts`
- `src/modules/journal/server/journal-integrity-command-service.test.ts`

The static verifier is queued and unexecuted. Its exact command is:

```powershell
npx.cmd tsx src/scripts/verify-traderlink-platform-phase-3-files.ts
```

The eleven-file focused suite is also queued and unexecuted. Its exact command
for the later runtime gate is:

```powershell
npx.cmd vitest run src/modules/journal/contracts/journal-storage-values.test.ts src/modules/journal/server/accounts/journal-account-boundary.test.ts src/modules/journal/server/accounts/journal-account-fingerprint-rotation.test.ts src/modules/journal/server/accounts/journal-source-identity-preparation.test.ts src/modules/journal/server/accounts/journal-account-authorization.test.ts src/modules/journal/server/database/journal-integrity-migrations.test.ts src/modules/journal/server/imports/record-preserving-csv.test.ts src/modules/journal/server/imports/ibkr-activity-statement-adapter.test.ts src/modules/journal/server/imports/journal-import-service.test.ts src/modules/journal/server/imports/journal-private-source-automation.test.ts src/modules/journal/server/journal-integrity-command-service.test.ts --reporter=dot --maxWorkers=1 --no-file-parallelism
```

This direct command is the controlling Phase 3 list; the generic package
`test` script is not a substitute because it discovers the broader repository.

The owner prefers Node/TypeScript checks to be batched when resource pressure
or the active task's testing rule makes per-slice execution impractical. A code
slice may therefore be followed by the next synthetic-only code slice while its
focused command remains queued. This changes timing, not acceptance: every
queued Slice B/C focused test and static verifier must pass together before any
Slice D disposable migration, real-database migration, evidence-vault write, or
private-source preview/import.

### Slice A - migration compatibility and schema

- Refactor historical-foundation/current-manifest verifier semantics.
- Add migrations 3-6, manifest entries, managed-table map, storage validators,
  and schema-digest/static-file verification.
- Test clean initialization through migration 6, exact prefix resume, tampering,
  unknown objects, foreign keys, uniqueness, cross-scope denial, and rollback.
- Apply only to a new disposable database at this slice.

### Slice B - source evidence and execution ledger

- Add source-file/IBKR adapter boundary, evidence repositories, canonical
  decimals/times, account identity integration, execution versioning,
  provenance, and overlap reconciliation.
- Use synthetic fixtures only in Git tests. Private source values never become
  fixtures or snapshots.
- Test every-record preservation, identical occurrence handling, exact reimport,
  overlapping statements, manual/broker matching, unsupported Forex coverage,
  random-order contiguous statements, explicit coverage gaps, manual point-only
  coverage, account-timezone trading-date assignment, one date-bound
  completeness decision per manual trading day, correction precedence, and
  owner/account isolation.

### Slice C - Data Decisions and rebuilds

- Add decision repositories/services, full-chain round-trip builder, stable
  identity/alias behavior, allocations, position reconciliation, trading days,
  and aggregate coverage.
- Test long, short, partial, multi-day, repeated same-symbol, open, flip,
  out-of-order upload, cross-statement closure, missing-period containment,
  conflicting boundary position facts, position-only carried holdings, missing
  opening inventory, same-time ambiguity, missing-price versus missing-fee
  metric containment, evidence-bound source-row actions, supplied missing
  position facts, honest accepted source limitations, one bad trade with valid
  earlier/later same-symbol and other-symbol neighbors, all supported decision
  actions, stale decision-revision rejection, rebuild idempotency, and transaction
  rollback. Include a deterministic old-chain-before-new-chain correction that
  changes allocation identity and proves the stable round-trip UUID survives.
  Also prove that a conflicting checkpoint cannot end a known-time pending or
  accepted source limitation before a later single-valued checkpoint.
  Aggregate coverage must also prove that a latest rebuilt known chain with no
  active projection remains in the denominator and affected while its relevant
  source limitation is pending or accepted; a clean zero-projection rebuild is
  counted unaffected.
  Position-correction coverage proves that fact-version semantics participate
  in idempotency and that exact UTC/local-date/local-time mismatches fail closed
  while a coherent exact checkpoint is accepted.
- Same-time coverage includes both a consequential mixed-side group and a
  mixed-side group whose order cannot change allocation. Only the former may
  open a chain decision. Import-batch coverage proves exact pending counts, the
  append-only final transition to `accepted`, and no reopening of a resolved
  immutable source issue. Aggregate coverage separately exposes
  trader-accepted source limitations by issue code. Coverage-action cases prove
  that a trader can supply a reviewed statement interval without upgrading an
  unrelated issue, can promote only the exact reviewed manual trading date from
  point-only to complete/partial coverage, and cannot use that confirmation to
  imply zero opening inventory. Import structure cases prove that a header/data
  field-count mismatch blocks acceptance without discarding the raw row.

### Slice D - private migration checkpoint

1. Run the static migration-file verifier.
2. Run only the Phase 3 focused tests with one worker/no file parallelism.
3. Initialize and import synthetic data into a new disposable database; verify
   counts, digests, integrity, idempotency, and rollback.
4. Run an unscoped, privacy-safe parse preview of the private statement. The raw
   source-account identifier may exist only inside that server-side operation;
   it is never returned, logged, documented, or written to preview evidence.
   All private-source commands load one absolute read-only `.csv` path only from the
   required `TRADERLINK_PLATFORM_JOURNAL_IMPORT_SOURCE_PATH` environment
   variable; no source-path argument is accepted, so the private filename cannot
   enter command history or process arguments. The reader permits the preserved
   backup location, always rejects the active replacement repository (an
   injected test root is an additional exclusion, never a replacement), and
   rejects links, non-regular/empty/oversize files, non-CSV/database content,
   malformed path values, descriptor-identity changes, and any hash/size
   mismatch. No source path is returned, logged, or copied.
5. Create a new online backup of the current replacement database and restore it
   to a separate target. Verify registry, schema digest, counts, relationships,
   HMAC recovery authority, page geometry, `foreign_key_check`, `quick_check`,
   and file evidence.
6. Apply migrations 3-6 to the restored disposable target and independently
   verify the seeded ownership plus zero Phase 3 domain rows.
7. Apply migrations 3-6 to the real replacement database only after steps 1-6
   pass. Verify before importing private data.
8. Prepare the local HMAC recovery authority and evidence-vault configuration;
   do not copy/promote the private artifact or import rows yet.
9. Inventory every active workspace, the seeded workspace's active Journal
   accounts, and all non-superseded source identities for the statement source
   system. Record only privacy-safe counts and schema/migration evidence.
10. For this one-owner private migration only, the future narrow server-side
    preparation command re-parses the source in process. Initial creation may
    call `confirmSourceIdentityLinkRecord()` only when the locked database has
    exactly one globally active workspace, that workspace has exactly one active
    Journal account, there are zero non-superseded source identities for that
    source system, and no fingerprint conflict. On rerun, exactly one non-superseded
    identity is accepted as already prepared only when the in-process statement
    fingerprint resolves unambiguously to that identity and the same sole active
    account under the complete configured retained HMAC authority; this path
    performs no identity mutation. An identity linked to another account,
    multiple identities, unsupported/missing authority, mismatch, or ambiguity
    stops for factual trader review/recovery. Normal product preview/import paths
    never inherit this preparation exception.
11. Verify exactly one non-superseded linked source identity in the seeded
    workspace, then rerun the scoped read-only privacy-safe preview. The scoped
    preview must not mutate identity state or expose the raw account identifier.
12. Require the same-byte scoped preview to reconcile every pre-commit fact the
    parser and planner can truthfully prove: 2,284 total records, 1,072 mapped
    stock executions, 542 preserved unsupported Forex records, 670 non-Trade
    records, 115 Stock mark-to-market rows covering 113 symbols with finite zero
    opening quantities, 116 position source rows producing 231 immutable position
    facts, one Stock open-position row, and the occurrence-distinct identical raw
    record pair. Require the exact confirmed source hash, byte size, aggregate-
    preview digest, identity-resolved account, zero blocking parse findings, and
    internally consistent scoped new/matched/ambiguous counts. A variance stops
    before vault promotion. The read-only preview cannot truthfully compute
    committed round-trip projections, so 331 ready-closed and two contained
    decision projections are not pre-commit assertions.
13. Require the append-only vault root from
    `TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT`, outside every repository,
    database, backup, restore, verification, and preserved-source tree. Write the
    exact accepted bytes to an exclusive restrictive temporary file, flush and
    re-read hash/size evidence, then atomically promote only
    `ibkr/<lowercase-source-sha256>.csv`. An identical existing object is an
    idempotent match; any mismatch fails closed. Vault promotion precedes the one
    atomic normal Journal import/decision/rebuild command. Re-run the same import
    to prove the same import-batch identity with zero new rows or executions.
    `TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON` must enumerate the
    preserved backup/source, backup-target, restore-target, and verification
    roots so the vault boundary fails closed if any protected location moves.
14. Independently reopen the database read-only and verify exact schema/migration
    history, owner/account/source-identity relationships, complete referenced
    account and execution/content HMAC authority, including every historical
    account-identity scheme/key/canonicalizer still referenced by a superseded
    row, vault inventory and object bytes, exact ordinal-by-ordinal immutable
    source-row evidence, position facts, execution content and provenance,
    import/source/execution/version/provenance/decision/rebuild/allocation/
    trading-day/coverage relationships, exact-decimal allocation conservation,
    rebuild freshness and forks, idempotency evidence, sidecars, and privacy-safe
    counts. The runtime acceptance requirement is no pending non-empty WAL before
    or after verification and no main-database mutation. A read-only WAL-mode
    connection may create a zero-byte WAL and 32,768-byte SHM without changing
    database content. Only this post-import gate may assert 331 ready-closed
    projections, zero automatically legitimate-open projections, and two
    contained needs-decision projections.
    Any failure stops acceptance and requires restoration from the verified
    pre-import backup; the append-only vault object remains reported/recoverable.

The source-link preparation command is idempotent across a post-link
interruption. Its creation path is one `BEGIN IMMEDIATE` operation that rechecks
the accepted schema/migration boundary, sole active workspace/account,
zero-identity precondition, fingerprint conflict state, and exactly-one postcondition before
commit; any failure rolls back the link. Its resume path runs the same complete
configured retained HMAC authority and sole-account checks, proves the existing
sole identity matches, and performs no mutation. A successfully confirmed or
resumed link is a
separately evidenced preparation checkpoint; if the later scoped preview or
count gate fails, stop before vault promotion/import. Returning to the pre-link
database requires the verified backup/restore procedure, never an ad-hoc
identity deletion or silent supersession. Vault promotion still precedes the
atomic database import; a later import failure rolls back import rows and
reports a newly created object as unreferenced or an already-present object as
reference-unverified.

The preparation and import command source is development-only. Import requires
`NODE_ENV=development` exactly as well as its explicit action and enable flag;
missing, test, and production environments fail closed. Later execution
requires the exact action `prepare_journal_source_identity`, the explicit
`TRADERLINK_PLATFORM_ALLOW_JOURNAL_SOURCE_IDENTITY_PREPARATION=1` gate, the
required `TRADERLINK_PLATFORM_JOURNAL_IMPORT_SOURCE_PATH` environment value, the
complete account-identity HMAC key map and active key version, and the source
hash, byte size, and aggregate-preview digest produced by the preceding preview.
The import command separately requires `import_journal_source`,
`TRADERLINK_PLATFORM_ALLOW_JOURNAL_SOURCE_IMPORT=1`, complete retained account
and Journal execution/content HMAC maps, the evidence-vault root, and the exact
confirmed preview evidence. None of the preparation gates alone authorizes
migration, backup, vault promotion, or import.

Broad lint, full-project TypeScript, complete regression, production build,
browser/E2E, and CI-equivalent checks remain deferred to final replacement
acceptance. This timing rule does not remove them.

## 13. Planned implementation areas

```text
src/modules/platform/server/database/
  platform-migration-manifest.ts
  verification profiles and focused tests

src/modules/journal/contracts/
  canonical decimals, source/import, execution, decision,
  round-trip, and coverage contracts

src/modules/journal/server/database/migrations/
  0003_journal_import_evidence.ts
  0004_journal_execution_ledger.ts
  0005_journal_data_decisions.ts
  0006_journal_round_trip_projection.ts

src/modules/journal/server/imports/
  journal-evidence-vault.ts
  journal-import-source-preview.ts
  journal-private-source-import.ts
  journal-private-source-automation.test.ts
src/modules/journal/server/verification/
  journal-integrity-verifier.ts
src/modules/journal/server/executions/
src/modules/journal/server/decisions/
src/modules/journal/server/round-trips/

src/modules/journal/server/accounts/
  ibkr-source-account-canonicalizer.ts
  journal-development-owner-scope.ts
  journal-source-identity-preparation.ts
  journal-source-identity-preparation.test.ts

src/scripts/
  verify-traderlink-platform-phase-3-files.ts
  preview-traderlink-platform-journal-import.ts
  prepare-traderlink-platform-journal-source-identity.ts
  import-traderlink-platform-journal-source.ts
  verify-traderlink-platform-journal-integrity.ts
```

Exact files may be split for maintainability, but ownership and contracts may
not move into V3, dashboard pages, route handlers, or browser code. Replacement
Journal files may reuse behavior only after removing V3 authority, time-gap/
session grouping, starting-sell skipping, float arithmetic, and private-data
coupling. No new replacement import may depend on a V3 module.

## 14. Stop conditions

Stop before mutation when any of the following occurs:

- the replacement Git tree contains unexplained concurrent changes;
- the live database registry/digest/counts differ from the accepted boundary;
- the backup, restore, secret-recovery, or disposable migration proof fails;
- the private file hash or aggregate source counts differ from the accepted
  evidence;
- the unscoped preview cannot safely parse exactly one source identity, the
  seeded workspace does not contain exactly one active Journal account, or the
  source-system identity inventory is neither zero for initial creation nor one
  sole identity that resolves under complete configured retained HMAC authority
  to that same account for idempotent resume;
- any source identity points to another account, multiple identities exist,
  retained HMAC authority is unsupported/missing, a fingerprint conflicts or
  mismatches, or the preparation command cannot prove exactly one linked identity;
- the post-link scoped preview is not identity-resolved, read-only, privacy-safe,
  or count-equivalent to the accepted unscoped evidence;
- the vault root overlaps any repository, database, backup, restore,
  verification, or preserved-source tree; contains a reparse escape or unmanaged
  object; or an existing digest-named object does not match exact bytes;
- vault promotion or atomic import reports a recoverable orphan; stop database
  acceptance, retain/report the relative object key, and follow verified
  backup/restore rather than deleting or overwriting the object;
- the independent post-import verifier finds a relationship, allocation,
  authority, evidence, rebuild, idempotency, sidecar, count, or concurrent-file
  mismatch; restore the verified pre-import database before continuing;
- private values would enter Git, console evidence, tests, documentation, or a
  public path;
- overlap cannot be resolved without a trader decision;
- any chain other than the affected chain becomes unavailable because of one
  contained issue; or
- a proposed action requires a push, deployment, production mutation, legacy
  deletion, or user-visible UI decision.

## 15. Exit condition

Phase 3 is technically complete only when:

- migrations 3-6 and the verifier compatibility refactor are committed locally;
- focused schema/import/ledger/decision/rebuild tests pass with one worker;
- disposable initialization/import, backup, restore, migration, rollback, and
  idempotency evidence pass;
- the unscoped parse preview, exact sole-account initial-or-idempotent-resume
  preparation gate, transactional source-link confirmation when needed,
  exactly-one linked-identity check, and post-link scoped preview all pass with
  privacy-safe evidence;
- the real replacement database contains the reconciled statement evidence,
  one explicitly confirmed HMAC-linked source-account identity, one
  accepted-with-decisions import,
  all 2,284 immutable source records, 1,072 stock executions in the canonical
  versioned ledger, 542 explicitly unsupported Forex records, 331 ready closed
  round trips, zero automatically legitimate-open chains, and two contained
  pending position decisions, with parse/planning evidence reconciled immediately before commit
  and all projection claims independently verified only after import;
- all other valid chains remain visible and coverage explains every exclusion;
- no private value is committed or exposed; and
- the master plan, progress tracker, migration register, schema document, and
  Phase 3 tracker record the exact commit/database/evidence boundary.

UI acceptance, Phase 4 analytics, public login, deployment, and legacy
retirement remain outside this exit condition.

## 16. Technical acceptance record

The 2026-08-01 runtime checkpoint satisfied the exit condition. The focused
suite passed all 129 tests across the exact 11 files with one worker and no file
parallelism. The static inventory verifier found six migrations, 24 Journal
domain tables, 50 required production/support files, and 11 focused test files.
A fresh disposable database proved prefix resume, migrations 3-6, rollback,
import, exact reimport, schema and integrity checks. A fresh online backup was
restored and migrated successfully before the real database was changed.

The first real post-import verification correctly rejected the earlier
331/1/1 planning assumption. The database was restored from the verified backup,
the synthetic and verifier expectations were corrected to the factual 331/0/2
result, and the complete focused/static gate was rerun successfully before the
real migration/import sequence was repeated. The final real database has schema
digest `75571914c5fa4bbfe7876c8e9a72cc7d584eab91704d70cf889bf5f1b374a55a`,
main-file SHA-256
`31101395dafb7bb14c2bf934e3288b40f63a5f8736a1da03cf549c996463af3b`,
size 10,522,624 bytes, a zero-byte WAL, and a 32,768-byte SHM. Independent
verification passed foreign keys, quick/integrity checks, authority retention,
source/evidence relationships, allocation conservation, rebuild freshness,
idempotency, vault bytes, and privacy-safe counts. No server, push, deployment,
or legacy mutation occurred.

The final plan review corrected and accepted these material points before
implementation:

- Phase 2 historical-foundation verification is separated from the expanding
  current migration manifest.
- Opening inventory is evidence-based; missing evidence never silently becomes
  zero.
- Random-order statements carry explicit complete/partial/point-only/unknown
  coverage intervals, so a missing month is not treated as no trading.
- Containment follows factual dependency, allowing valid later same-symbol and
  unrelated trades to remain usable.
- Raw source records, current pointers, immutable execution/position versions,
  decision events, and rebuildable round-trip projections have distinct roles.
- Vault promotion precedes the atomic SQLite import, and any unreferenced vault
  object after failure is preserved/reported instead of silently deleted.
- Initial source-account assignment is an explicit one-owner migration
  preparation checkpoint between unscoped and scoped previews. It is
  transactionally fail-closed, idempotently resumable after a completed link,
  never available as normal-product auto-linking, and is distinct from Platform
  login authentication.
- Manual/correction entries have provenance and idempotency; adding a missing
  execution cannot bypass source evidence. Manual trading days remain point-only
  until a date-bound trader coverage decision, and opening inventory remains a
  separate fact.
- Position checkpoints, shorts, partials, flips, same-time ordering, overlap,
  duplicate occurrences, and metric-specific missing-price/fee coverage have
  explicit behavior and focused tests.

No unresolved Phase 3 technical issue remains. The earlier Slice A disposable
proof remains immutable historical evidence; the later fresh disposable and
real-database checkpoints are the accepted current evidence. Phase 4 remains
subject to the Journal coverage and decision boundaries established here.
