# Phase 3 Journal Integrity Progress

**Status:** Slice A migration compatibility and schema are implemented,
focused-verified, disposable-database verified, and technically accepted under
delegated owner authority. Slice B source evidence and execution-ledger service
implementation is the active boundary.
**Controlling plan:** [Phase 3 Journal Integrity Plan](phase-3-journal-integrity-plan.md)

## Entry boundary

- Replacement repository: `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
- Branch: `codex/traderlink-platform-replacement`
- Entry HEAD: `8c5b303567b13731bfe90370762242358f9cc71f`
- Working tree at planning entry: clean
- Replacement database: accepted two-migration foundation plus verified
  development ownership counts 1/1/1/1/0
- Public login: deferred; committed `development_local` seed is authoritative
- Legacy app/database: preserved read-only recovery/reference inputs
- GitHub/upstream/deployment: none

## Planning evidence reconciled

- The private statement contains 2,284 CSV records.
- Its accepted checkpoint identity is 239,292 bytes with SHA-256
  `b0d4117c59f8fcbb3601ebc48d38035ad7d46417239a5f4985fdd4d3dfd913ad`;
  the private filename/account identifier is not recorded.
- 1,614 are Trade data records: 1,072 Stocks and 542 Forex.
- The remaining 670 records include 115 Stock mark-to-market records covering
  113 symbols with finite zero opening quantities and one Stock open-position
  record.
- Every record will be preserved; Forex is explicit unsupported coverage in
  this equity Journal phase.
- Stock position evidence covers 113 symbols with explicit zero opening
  quantities.
- Independent zero-to-zero reconstruction produces 331 closed round trips and
  two non-zero chains.
- One non-zero chain matches the statement open position; one conflicts with a
  statement-zero closing fact and becomes a contained Data Decision.
- Legacy 334-closed/2-open saved-trade grouping is comparison evidence only and
  is not the replacement target.

## Plan-review checklist

- [x] All raw records, manual entries, position facts, executions, decisions,
  round trips, allocations, aliases, trading days, and coverage have owners.
- [x] Immutable evidence/version/event records are separated from current
  pointers and rebuildable projections.
- [x] Exact decimal, source time, timezone, tie-order, and canonical JSON rules
  are explicit.
- [x] Reimport, overlap, duplicate occurrence, manual/broker matching, and
  upload-order behavior are explicit.
- [x] Opening inventory, short sales, partials, flips, open positions, statement
  mismatches, and chain containment are explicit.
- [x] Phase 2 historical-foundation versus current-manifest verifier semantics
  are identified as a required prerequisite refactor.
- [x] HMAC secret recovery and the hash-addressed private evidence vault are
  outside Git, SQLite, logs, and the database-backup directory.
- [x] Disposable, backup/restore, rollback, idempotency, private preview, atomic
  commit, and independent-verification gates are explicit.
- [x] UI, analytics, login, push, deployment, and deletion boundaries are
  explicit.

## Current stop boundary

### Slice A implementation and audit

- Added migrations `0003_journal_import_evidence`,
  `0004_journal_execution_ledger`, `0005_journal_data_decisions`, and
  `0006_journal_round_trip_projection` to the six-entry static manifest.
- The current schema contains 24 managed domain tables plus the migration
  registry. Migrations 3-6 add source evidence, import events, coverage
  intervals, instruments, position facts, versioned executions/provenance/
  aliases, Data Decisions/events, rebuild evidence, stable/versioned round
  trips, exact allocations/aliases, and trading-day identity.
- The immutable Phase 2 ownership-foundation profile remains exactly its five
  original tables. Explicit prefix verification can inspect the accepted
  two-migration foundation, while ordinary runtime still rejects it as pending.
- The development-owner verifier continues to require exactly one user,
  workspace, owner membership, and account while allowing later correctly
  scoped source identities.
- Added canonical decimal, currency, timezone, date, UTC, SHA-256, and token
  storage validators. Phase 3 migrations contain no SQLite `REAL` financial
  fields and no V3/V4-temp dependency.
- Static Phase 3 file verification passed for six migrations, 24 domain tables,
  four Phase 3 migration files, and seven Slice A production/test files.
- The first focused one-worker run reached application tests and found one old
  test-only temporary migration order (`3`) now occupied by the accepted third
  migration. It was changed to unused order `99`; no production/schema defect
  caused that failure.
- The complete corrected focused run passed all seven files and all 53 tests
  with one worker and file parallelism disabled.
- A first disposable six-migration database was created before the final
  schema-hardening audit at
  `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\verification\phase-3-slice-a-20260801T121500Z.sqlite`.
  It remains preserved as superseded disposable evidence; it was not reused or
  deleted.
- The final corrected disposable database is
  `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\verification\phase-3-slice-a-corrected-20260801T121700Z.sqlite`.
  It has six migration rows, 24 zero-row domain tables, SQLite 3.53.0, 4,096-byte
  pages, 152 pages, size 622,592 bytes, matching expected/actual schema SHA-256
  `1436d96512354914289b356ac8f7311a6237e242fe32ea34178da656ea62cb57`,
  file SHA-256
  `eca50f90244c0d477ebd8f05939c207d473e3a231269079c035a4be13f53a5f8`,
  `foreign_key_check=ok`, `quick_check=ok`, and `integrity_check=ok`. Read-only
  verification left expected WAL/SHM sidecars beside this disposable database.
- The schema-hardening audit added batch/row provenance matching, relative
  forward-slash-only vault keys, paired statement/UTC bounds, immutable mapping
  objects, source identity/version pairing, chain-specific rebuild foreign
  keys, and instrument/currency-specific position-fact supersession. The full
  focused sequence passed again afterward.
- The Node/tsx startup first reproduced the known Windows memory error before
  project code loaded. The accepted command-local preload was used only for the
  affected focused commands and removed afterward. No project/global/system
  configuration changed.
- The real `development.sqlite` was not opened by the migration code. Its size
  remains 94,208 bytes, last-write time remains the accepted seed time, SHA-256
  remains `2497FA605828C9392233F712062CC9FBEDDAB0F2B5E2078AB1A0146494A99C26`,
  and no sidecars are present. It still has the accepted two-migration seeded
  boundary; migrations 3-6 have not been applied to it.

### Current stop boundary

Slice B may implement source evidence, import parsing/reconciliation, and the
canonical execution-ledger services against new disposable databases. No real
database migration, HMAC secret, evidence-vault copy, private statement preview
or import may occur until the later Slice D backup/restore and private-preview
gates. UI, public login, push, deployment, deletion, and production work remain
out of scope.

## Next action

Preserve the accepted Slice A code/documentation checkpoint locally, then begin
Slice B with source-evidence and execution-ledger contracts/repositories using
synthetic fixtures only.
