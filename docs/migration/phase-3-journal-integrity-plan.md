# Phase 3 Journal Integrity Plan

**Status:** Technically accepted on 2026-08-01 by the coordinating auditor under delegated owner authority; Slice A implementation is authorized.
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
| Non-zero chains supported by the statement's open-position facts | 1 |
| Execution-nonzero/statement-zero mismatches requiring a decision | 1 |
| Flip executions in this statement | 0 |
| Same-timestamp execution groups | 1, same side |

The accepted private file is identified for this checkpoint only by SHA-256
`b0d4117c59f8fcbb3601ebc48d38035ad7d46417239a5f4985fdd4d3dfd913ad`
and size 239,292 bytes. Its filename and embedded account identifier remain
private and are not recorded in Git.

The statement covers January 1 through January 31, 2026. Its stock opening
quantities are explicitly zero. That evidence permits a sell from zero to open
a short position; it must not be discarded as a legacy “starting sell.” The
statement contains one supported open stock position. The other non-zero chain
conflicts with the closing statement fact and must be contained in Data
Decisions while the 331 unrelated closed round trips remain usable.

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

`journal_source_row_issues`

- Immutable deterministic findings with scope, code, severity, blocking flag,
  detector/version, and source-row reference when applicable. Resolution is
  derived from an immutable linked decision event; the finding is not rewritten.
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
  columns or logs. Account identity uses the accepted HMAC contract.
- Strong broker fill identity wins. Otherwise content fingerprint plus
  occurrence ordinal may match only when statement coverage makes the match
  unique. Count disagreement or competing candidates creates a Data Decision.

### 6.3 Migration 0005 - Data Decisions

`journal_data_decisions`

- One current contained issue with stable UUID, workspace/account, issue code,
  state (`pending`, `resolved`, or `superseded`), target kind, typed target
  reference or deterministic chain key, effect/coverage code, creation/update
  time, monotonically increasing revision, and current event pointer. Mutations
  require the expected revision so two browser sessions cannot silently
  overwrite each other's factual decision.
- Targets are source issue, execution, position fact, overlap set, or affected
  chain. Constraints require the fields appropriate for that target kind.

`journal_data_decision_events`

- Append-only trader/system history with action, actor, reason, evidence links,
  prior/new execution-version or position-fact links, duplicate counterpart,
  and result state. The resulting rebuild references its triggering decision
  event, avoiding a forward foreign key.
- Supported factual actions are:
  `correct_execution_fact`, `add_missing_execution`, `set_execution_order`,
  `exclude_execution`, `restore_execution`, `merge_supported_duplicate`,
  `keep_distinct`, `supply_opening_inventory`, `correct_position_fact`, and
  `confirm_legitimate_open_position`.
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
  final position quantity, state (`ready_closed`, `legitimate_open`,
  `needs_decision`, or `excluded_by_trader`), decision/coverage
  reason, and deterministic projection fingerprint.
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
4. explicit manual sequence.

A file UUID, upload time, insertion order, or random UUID is never a tie breaker.
Same-time same-side records may use deterministic source order. Same-time
opposite-side records whose order changes a zero crossing create a contained
ordering decision.

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
   `private-data\traderlink-platform\import-artifacts`, verify byte identity,
   and promote it to its digest name before the database commit. The vault is
   never Git or the database-backup directory. Store only a relative object key
   in SQLite.
3. Parse every record and preserve its one-based ordinal and exact field array.
   Section/header/non-execution records are classified, not discarded.
4. Reconcile the source account through the accepted versioned HMAC identity
   service before commit. No raw account identifier or secret appears in logs,
   evidence JSON, documentation, tests, or Git.
5. Produce a privacy-safe preview with aggregate counts, blocking issues,
   contained decisions, overlap status, expected execution/round-trip coverage,
   and no symbols/account identifiers/private row values.
6. Commit source evidence, position facts, execution versions, decisions, and
   the affected full-chain rebuild in one SQLite transaction. A failure leaves
   no partial accepted database import. Because SQLite cannot transact with the
   filesystem, a post-vault/pre-database failure may leave a verified unreferenced
   digest object; report it as recoverable orphan evidence and never delete it
   automatically.
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
   facts plus source coverage intervals for the entire known history.
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
- closed, legitimate-open, needs-decision, and excluded round-trip counts;
- affected versus unaffected chain counts;
- opening/closing position-fact coverage;
- complete, partial, point-only, unknown, overlapping, and missing source
  coverage intervals;
- latest rebuild algorithm/version/digest and freshness; and
- explicit asset-scope exclusions, including Phase 3 Forex coverage.

No aggregate reports a fabricated zero for unavailable facts. A metric may use
only the records whose required state is eligible.

## 11. Local secret and evidence-vault preparation

Before the private import commit, create a random account-identity HMAC key
outside Git, SQLite, logs, and the database-backup directory. Its key-version
label is immutable. The local secret must be readable only by the current
Windows user and supplied to the import process through the accepted server-only
configuration. Recovery evidence records only the version label and a successful
non-secret challenge, never the key or raw account identifier.

The evidence vault is outside Git and has a hash-addressed layout. Before import,
verify that the exact source hash matches the accepted private baseline. After
copy, verify byte identity and ensure no public URL or repository path exposes
the artifact.

## 12. Implementation slices and focused verification

Implementation proceeds in complete, reviewable batches. Each focused Vitest
command uses one worker and disables file parallelism.

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
  coverage, correction precedence, and owner/account isolation.

### Slice C - Data Decisions and rebuilds

- Add decision repositories/services, full-chain round-trip builder, stable
  identity/alias behavior, allocations, position reconciliation, trading days,
  and aggregate coverage.
- Test long, short, partial, multi-day, repeated same-symbol, open, flip,
  out-of-order upload, cross-statement closure, missing-period containment,
  conflicting boundary position facts, missing opening inventory, same-time
  ambiguity, missing-price versus missing-fee metric containment, one bad trade
  with valid earlier/later same-symbol and other-symbol neighbors, all supported
  decision actions, stale decision-revision rejection, rebuild idempotency, and
  transaction rollback.

### Slice D - private migration checkpoint

1. Run the static migration-file verifier.
2. Run only the Phase 3 focused tests with one worker/no file parallelism.
3. Initialize and import synthetic data into a new disposable database; verify
   counts, digests, integrity, idempotency, and rollback.
4. Create a new online backup of the current replacement database and restore it
   to a separate target. Verify registry, schema digest, counts, relationships,
   HMAC recovery authority, page geometry, `foreign_key_check`, `quick_check`,
   and file evidence.
5. Apply migrations 3-6 to the restored disposable target and independently
   verify the seeded ownership plus zero Phase 3 domain rows.
6. Apply migrations 3-6 to the real replacement database only after steps 1-5
   pass. Verify before importing private data.
7. Prepare the local HMAC secret and evidence vault, then run a read-only,
   privacy-safe private import preview.
8. Require the preview to reconcile 2,284 total records, 1,072 stock execution
   records, 542 preserved unsupported Forex records, 670 non-Trade records, 115
   Stock mark-to-market records covering 113 symbols with finite zero opening
   quantities, one Stock open-position record, 331 closed round trips, two
   non-zero chains, one statement-supported legitimate open chain, and one
   contained closing-position mismatch. The identical raw-record pair must
   remain occurrence-distinct. A variance stops before commit.
9. Atomically commit the private source import and rebuild. Re-run the same
   import to prove idempotency without adding rows.
10. Independently reopen and verify schema/migration digests, counts,
    relationships, exact source/evidence hashes, execution-version/provenance
    completeness, allocation conservation, position reconciliation, decision
    containment, coverage, and sidecar state.

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
src/modules/journal/server/executions/
src/modules/journal/server/data-decisions/
src/modules/journal/server/round-trips/

src/scripts/
  verify-traderlink-platform-phase-3-files.ts
  preview-traderlink-platform-journal-import.ts
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
- the real replacement database contains the reconciled statement evidence,
  one HMAC-linked source-account identity, one accepted-with-decisions import,
  all 2,284 immutable source records, 1,072 stock executions in the canonical
  versioned ledger, 542 explicitly unsupported Forex records, 331 ready closed
  round trips, one supported open chain, and one contained pending position
  mismatch, subject to exact preview reconciliation immediately before commit;
- all other valid chains remain visible and coverage explains every exclusion;
- no private value is committed or exposed; and
- the master plan, progress tracker, migration register, schema document, and
  Phase 3 tracker record the exact commit/database/evidence boundary.

UI acceptance, Phase 4 analytics, public login, deployment, and legacy
retirement remain outside this exit condition.

## 16. Technical acceptance record

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
- Manual/correction entries have provenance and idempotency; adding a missing
  execution cannot bypass source evidence.
- Position checkpoints, shorts, partials, flips, same-time ordering, overlap,
  duplicate occurrences, and metric-specific missing-price/fee coverage have
  explicit behavior and focused tests.

No unresolved technical planning issue remains for Slice A. Later slices remain
subject to their stated focused, disposable, backup/restore, preview, and
private-data gates.
