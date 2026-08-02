# Phase 3 Journal Integrity Progress

**Status:** Phase 3 runtime-complete and technically accepted under delegated
owner authority. The corrected implementation, exact 11-file/129-test focused
suite, static verifier, fresh disposable proof, protected backup/restore
rehearsal, real migrations, private preview/import/exact-reimport, append-only
evidence vault, and independent database verification all passed. The package
remains local, unpushed, and undeployed. Phase 4 Core Analytics planning is
next.
**Implementation commit:** `8f6a4d4e4dec20ef6edcd50f476b14d368bde505`
**Controlling plan:** [Phase 3 Journal Integrity Plan](phase-3-journal-integrity-plan.md)

## 2026-08-01 runtime acceptance checkpoint

- The exact focused gate passed all 129 tests across 11 files using one worker,
  no file parallelism, and a 300-second per-test ceiling. The Phase 3 static
  verifier passed with six migrations, 24 domain tables, 50 required
  production/support files, and 11 focused test files.
- A fresh disposable database proved the accepted two-migration prefix resumes
  through migrations 3-6, schema digest
  `75571914c5fa4bbfe7876c8e9a72cc7d584eab91704d70cf889bf5f1b374a55a`,
  rollback, import, exact reimport, and integrity verification.
- A fresh SQLite online backup and byte-identical restore were created outside
  the repository. The restored rehearsal successfully applied migrations 3-6
  and preserved the accepted owner counts before the real database was changed.
- Private preview found 2,284 source records, 1,072 mapped Stock executions,
  116 mapped position-source rows producing 231 facts, 554 automatic
  non-execution records, 542 preserved unsupported Forex records, and zero
  blocking corrections. An exact, narrow adapter correction accepts the known
  sparse IBKR `Codes` legend shape while continuing to reject malformed rows.
- The first post-import verifier rejected the historical 331/1/1 assumption.
  One chain has a matching Open Positions quantity but conflicting
  Mark-to-Market closing quantities; another conflicts with zero closing facts.
  The database was restored from the verified backup, expectations were
  corrected to 331 ready / 0 automatically legitimate open / 2 decisions, and
  the complete focused/static gate was rerun before repeating the real sequence.
- The accepted rerun created exactly one source identity, one
  accepted-with-decisions import, 2,284 immutable source rows, 1,072 executions,
  231 position facts, 542 unsupported Forex records, 333 active projections,
  331 ready closed projections, and two contained Data Decisions. Exact reimport
  reused the same batch and added zero executions.
- The private authority is stored only under
  `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform-config`.
  The append-only evidence vault is the non-overlapping sibling
  `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform-import-artifacts`.
  No secret, broker identifier, internal UUID, or private filename is recorded
  here.
- Independent verification passed migration/schema, foreign-key, quick and
  integrity checks, retained HMAC authority, vault bytes, ordinal source
  evidence, relationship integrity, allocation conservation, rebuild freshness,
  forks, and idempotency. The final database is 10,522,624 bytes with SHA-256
  `31101395dafb7bb14c2bf934e3288b40f63a5f8736a1da03cf549c996463af3b`,
  zero-byte WAL, and 32,768-byte SHM. No server, push, deployment, production,
  or legacy mutation occurred.

## Historical 2026-08-01 Slice D source static acceptance

- Coordinator static acceptance followed correction of the 116-source-row versus
  231-position-fact count gate, the deterministic 331-ready/one-supported-open/
  one-needs-decision fixture, immutable row/fact/execution/provenance comparison,
  vault temporary cleanup and race/orphan semantics, Journal HMAC validation,
  the exact development-only gate, full historical authority, and HMAC-backed
  evidence-account fingerprint resolution to the seeded account.
- At this historical point, this accepted source only; the later runtime
  checkpoint above supersedes that limitation.
- The next gate remains the existing exact eleven-file one-worker command, the
  Phase 3 static verifier, and a fresh disposable six-migration plus import,
  exact-reimport, and independent-verifier proof. Only after all pass may the
  verified backup/restore and real preparation, unscoped/scoped preview, vault
  promotion, import, exact reimport, and independent verification sequence run.
  Any failure requires restoration from the verified pre-operation backup.
- Phase 4 and dashboard implementation remain gated by the Phase 3 exit
  condition.

## Entry boundary

- Replacement repository: `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
- Branch: `codex/traderlink-platform-replacement`
- Entry HEAD: `8c5b303567b13731bfe90370762242358f9cc71f`
- Working tree at planning entry: clean
- Replacement database: accepted two-migration foundation plus verified
  development ownership counts 1/1/1/1/0
- Public login: deferred; committed `development_local` seed is authoritative
- Planned Slice D source-account confirmation is Journal import ownership, not
  login authentication; it adds no user/provider/session or public auth route
- Concurrent Discord-bootstrap drafts were rejected during Slice B/C audit.
  The guarded development-owner seed remains the only bootstrap implementation;
  no Discord route or authenticated-owner bootstrap belongs in this phase.
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
- [x] Disposable, backup/restore, rollback, idempotency, unscoped private parse
  preview, exact one-owner source-link preparation, post-link scoped preview,
  vault-before-import commit, and independent-verification gates are explicit.
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

### Slice B implementation pending focused verification

- Added a record-preserving CSV lexer with quoted-field/newline handling,
  occurrence-distinct duplicate records, bounded payload/record/field limits,
  canonical raw-field JSON, and record/file SHA-256 evidence.
- The server import boundary now accepts bytes, hashes those exact bytes before
  parsing, and uses fatal UTF-8 decoding. Invalid byte sequences fail as
  unsupported encoding; a BOM may be omitted from parsed text without being
  omitted from the authoritative file hash or byte count.
- Added a server-only IBKR Activity Statement adapter that preserves every
  record, maps supported Stock executions, retains Forex as explicit
  unsupported coverage, extracts statement/account identity in memory, maps
  opening/closing/open-position facts, and reports missing facts rather than
  discarding the whole statement.
- Repeated equivalent account/period metadata is tolerated. Distinct source
  accounts in one file now block account assignment, while conflicting or
  malformed statement periods become a contained review with unknown coverage;
  neither path silently selects the last metadata row.
- Added canonical decimal and IANA-local-time normalization without JavaScript
  floating-point conversion for authoritative financial facts.
- IANA-local time conversion now rejects nonexistent daylight-saving times and
  decision-gates repeated local times instead of silently choosing a UTC
  offset. The source text/timezone remain preserved for trader review.
- Source/account timezone mismatches are visible import decisions.
  Statement-period dates count as complete account-date coverage only when the
  source timezone matches the Journal account trading timezone.
- Added account-identity-integrated import repositories/services for exact file
  reimport, manual-batch idempotency, immutable source rows/events/findings,
  explicit statement/point-only coverage, and account/workspace isolation.
  A reused manual idempotency key succeeds only for the exact same normalized
  source-row payload; changed facts fail as a conflict instead of silently
  returning the earlier batch.
- Each distinct manual account trading date now opens one
  evidence-bound coverage decision. The trader may confirm complete or partial
  coverage only for that exact date; the system does not infer full-day coverage
  or zero opening inventory from the presence of manual executions. Entry times
  are converted to the Journal account timezone before assigning the date.
- Public import previews now expose only privacy-safe aggregate counts, issue
  summaries, periods, and coverage. Workspace-scoped previews add read-only
  exact-reimport and overlap planning without returning broker account tokens,
  raw rows, executions, or symbols and without updating source-identity state.
- Exact commit retries resolve the stored file digest before parser/mapping work,
  so a previously accepted byte-identical statement remains a true no-op even
  after adapter changes. New imports independently verify parser file evidence
  and reject private broker account tokens in evidence object keys.
- Added one canonical versioned execution ledger for broker and manual facts,
  HMAC-derived privacy-safe aliases, occurrence-aware overlap reconciliation,
  safe broker-fee enrichment through a new immutable version, contained fact/
  count conflicts, provenance, and optimistic correction versioning.
- Strong broker fill identities now remain authoritative across overlapping
  files. Different provider fill IDs with identical normalized facts remain
  distinct executions, while a repeated provider ID resolves to its existing
  execution even if another identical fill owns the content-occurrence alias.
  Changed core facts on the same provider ID are preserved as contained conflict
  evidence without creating a third execution. Broker enrichment and conflict
  handling preserve a trader's existing exclusion. Content-only overlap planning
  now inventories all non-superseded current executions with the same canonical
  facts, including provider-distinct executions that cannot share the unique
  occurrence alias; one candidate may match, while multiple candidates produce
  the existing overlap ambiguity instead of silently choosing the alias owner.
- Execution/content privacy hashing now accepts one active key version plus the
  complete retained base64 key map. Planning inventories every scoped HMAC
  scheme referenced by broker/content aliases and provider provenance, fails
  recovery-required before insertion when authority is missing, matches strong
  and content identities across all candidate schemes, and deduplicates
  rotation-only copies for content-count decisions. Conflicting candidates fail
  closed; safe prior-key matches establish/touch active aliases without changing
  the stable execution or weakening provider-distinct trader decisions. Because
  immutable provenance still references its original scheme, every referenced
  key remains required indefinitely in Phase 3; alias promotion alone is not key
  retirement, and no evidence-migration/retention policy is implemented here.
- Added three focused synthetic test files covering record preservation,
  repeated occurrences, malformed CSV, IBKR Stock/Forex/position mapping,
  exact reimport, overlapping and reverse-order statements, explicit gaps,
  manual point-only coverage, manual/broker reconciliation and enrichment,
  duplicate counts, workspace/account isolation, and immutable corrections.
- The attempted three-file Vitest command specified one worker and disabled file
  parallelism, but the command was rejected before a process started because
  the current task's controlling instructions prohibit Vitest/other tests. No
  test or database process ran. These focused checks remain mandatory before
  Slice B technical acceptance and before any Slice D database operation.
- `git diff --check` passes. No private fixture, account value, database, source
  statement, evidence-vault object, HMAC secret, server, dependency, staging,
  commit, push, deployment, or legacy file was changed.

### Slice C implementation pending focused verification

- Added a full-account, instrument/currency chronological reconstruction service
  using exact decimal arithmetic. It supports long, short, partial, multi-day,
  repeated-symbol, zero-crossing flip, closed, and statement-supported open
  projections without time-gap/session grouping.
- Current position facts participate in chain discovery even when no execution
  for that symbol is inside the uploaded coverage. A statement-only non-zero
  holding remains visible as an `opening_execution_outside_coverage` projection
  and Data Decision instead of disappearing from the dashboard. A trader's
  explicit confirmation versions that position fact as a trusted current open
  holding and resolves it to `legitimate_open`; it does not fabricate the
  missing entry execution or make entry-price/P/L metrics available.
- Position checkpoints now contain conflicting or mismatched intervals and
  restart reconstruction from the next supported fact. Later valid same-symbol
  trades and unrelated symbols remain independently usable.
- Added allocation-conservation enforcement, stable execution-set round-trip
  aliases, append-only rebuild/version/allocation evidence, trading-day identity
  in the account timezone, full-history idempotency, and explicit complete/
  partial/unavailable coverage.
- Same-time order ambiguity is now decided by full-chain reconstruction, not
  by the file adapter. With all uploaded statements and position facts present,
  the builder compares the two deterministic side orders and opens one
  contained chain decision only when allocation roles or quantities can change.
  Mixed-side fills that cannot change the trade boundary remain usable.
  Ordering decisions accept a bounded same-timestamp sequence only; the server
  derives the canonical key and rejects collisions or arbitrary time-moving
  sort strings. Manual batch position is explicitly unverified rather than an
  authoritative execution sequence. The rebuild algorithm is versioned as
  `zero_to_zero_v2`.
- General execution-fact corrections cannot smuggle in a client-selected order
  key. An unchanged execution instant retains its prior key; a corrected instant
  receives a server-derived unverified key and must still map back to the
  preserved local timestamp/timezone. Ordering remains a separate decision.
- Added typed Data Decision targets/actions, optimistic decision revisions,
  immutable user correction evidence, execution correction/order/exclusion/
  restore, supported duplicate merge/keep-distinct, missing-execution entry,
  opening inventory, missing-position-fact supply, position correction,
  reviewed statement-coverage supply, confirmed-open, and
  accepted-source-limitation workflows. Imported row
  decisions are evidence-linked and cannot mutate an unrelated execution or
  position fact; accepting a source limitation never upgrades coverage.
- Position-correction evidence now derives one effective fact version, includes
  it in the immutable normalized/idempotency payload, and inserts that exact
  version. The pre-acceptance mapping contract is `position_fact_mapping_v2`;
  reusing a key across ordinary-correction and confirmed-open semantics fails
  closed. Exact checkpoints also require their UTC instant to agree with the
  effective date in the source timezone and, when supplied, the full source
  timestamp text. Non-exact precision behavior is unchanged.
- Source issues enforce an issue-specific action matrix: for example, a
  missing-price decision cannot be marked resolved by changing execution order,
  a price correction cannot alter the evidenced symbol/time/side/quantity/fee
  facts, and a position-fact issue must supply its matching fact kind. Unknown
  future issue codes fail closed except for an explicit accepted source
  limitation.
- Unmapped execution and position rows now retain an optional normalized
  instrument/currency and independently recoverable UTC instant in immutable
  issue evidence. Partially mapped position rows remain classified as needing
  correction while preserving valid sibling facts. Rebuilds hold only
  projections in that chain and time segment through the next supported
  position checkpoint. Unknown time conservatively holds that known chain;
  accepting the limitation changes the reason but never upgrades the dependent
  projection. A supplied replacement execution/position fact must match the
  preserved chain and known instant. Unrelated symbols remain usable.
- Source-chain containment is restricted to genuinely unmapped execution or
  position facts. An invalid optional provider identity stays visible in Data
  Decisions without blocking a factually complete round trip, while mapped
  missing-price and overlap issues continue through their existing targeted
  execution/metric controls.
- A known-time pending or accepted source-chain limitation now ends only at a
  checkpoint group whose current facts assert exactly one unique canonical
  quantity. A conflicting multi-fact checkpoint retains the existing hold and
  UTC/rank semantics until a later supported single-valued checkpoint; the
  queued synthetic regression proves the intervening projection remains
  contained while a subsequent independent trade is eligible.
- Source-issue resolution now recomputes the import batch's exact pending count.
  The final resolution appends the batch transition to `accepted`; retrying an
  accepted file returns its still-current pending source decisions without
  reopening resolved immutable issues. Aggregate coverage separately reports
  resolved actions and accepted source limitations by issue code.
- `overlap_set` remains a reserved, fail-closed storage target until persisted
  membership can bind it to exact executions. Current overlap decisions stay
  bound to immutable source issues. Phase 3 exclusion remains execution-scoped;
  rebuild evidence reports excluded execution counts and no unsupported direct
  round-trip exclusion state is emitted.
- Fact and ordering corrections preserve an existing trader exclusion, and
  superseded duplicates cannot be revived through a correction. Only the
  explicit restore action changes an excluded execution back to active use.
- Obsolete pending chain findings are retained but superseded through a new
  append-only `superseded_by_rebuild` system event. This corrects reverse-order
  upload behavior so an earlier statement can repair a chain without leaving a
  stale warning visible.
- Added an atomic command boundary that commits the accepted source rows,
  execution facts, source decisions, full account rebuilds, and current chain
  decisions in one SQLite transaction. Exact file/manual retries remain no-op.
- Account-wide rebuilds also establish their own outer immediate transaction,
  so a standalone maintenance rebuild cannot commit only the early chains if a
  later chain fails.
- Account chain discovery includes active prior round-trip projections. If a
  corrected execution moves to another instrument/currency chain and leaves no
  current fact behind, the former chain is rebuilt empty and its stale
  projection is superseded instead of remaining visible.
- Round-trip continuity now prefers active execution-overlap candidates, then
  falls back to deterministically sorted distinct superseded-current candidates
  only when the active set is empty. The queued synthetic regression forces the
  old chain to rebuild first, changes both chain and allocation quantity, and
  requires the same stable UUID to reactivate on the new chain; multiple matches
  remain ambiguous.
- Added a privacy-safe account coverage read model for source classifications,
  import/execution/decision states, pending reasons, current position facts,
  coverage kinds, account timezone/currency scope, compatible complete
  intervals, timezone mismatches, overlaps, gaps, date bounds, unsupported asset
  categories, active round-trip states, and latest rebuild digests. Aggregate
  chain health now uses every latest non-forked rebuild chain as its denominator,
  including a chain with zero active projections. A latest rebuild is affected
  when it records a needs-decision projection, has a pending chain decision, or
  has a current relevant execution/position source-chain issue that is pending
  or accepted as a source limitation; all other latest rebuilds are unaffected.
  The read boundary checks leaf uniqueness by the actual scoped
  instrument/currency tuple and verifies every stored chain digest against its
  deterministic workspace/account/instrument/currency derivation, so a corrupt
  hash cannot conceal a fork.
  Rebuild freshness is honestly labeled `recorded_not_recomputed` until an
  independent verifier recomputes the inputs.
- Added focused synthetic coverage for all decision actions, source-row target
  binding, honest accepted limitations, missing position facts, position-only
  carried holdings and effective trader confirmation, stale revisions,
  rollback, rebuild idempotency, allocation conservation, long/short/partial/
  multi-day/repeated/flip behavior, reverse-order cross-statement closure,
  missing-month coverage, position-mismatch containment and later recovery,
  missing-price versus unreported-fee behavior, same-time ambiguity, and stable
  identity across an old-chain-first instrument/quantity correction.
- Added focused source coverage for invalid human-readable statement dates,
  structural header/data field-count mismatch, position rows whose effective
  period needs trader correction, trader-verified UTC resolution of a repeated
  daylight-saving clock time, unverified manual same-time order, account-timezone
  trading-date assignment, exact-date manual coverage confirmation,
  consequential versus non-consequential mixed-side timestamps, exact import
  state reconciliation, accepted-limitation aggregates, and prevention of
  resolved source-issue reopening, plus pending/accepted containment across a
  conflicting checkpoint until a later single-valued checkpoint. These cases
  are written but unexecuted. A queued zero-projection aggregate regression also
  proves that a pending or accepted known-chain source limitation remains
  affected, while a clean zero-fact maintenance rebuild is counted unaffected.
  Static regression source also covers a duplicate tuple leaf with an
  inconsistent hash and a unique latest leaf whose hash is corrupt.
- Queued position-correction regression source proves fact-version idempotency
  separation, exact local-date and local-time mismatch rejection, coherent
  exact-fact persistence, and the versioned immutable mapping evidence. It is
  written but unexecuted under the active static-only rule.
- Added focused synthetic coverage for distinct identical provider fills,
  repeated strong-identity overlap, same-provider changed-fact containment,
  exclusion-preserving broker enrichment, and activation of provider evidence
  after a trader confirms an ambiguous fill is distinct. These tests are
  written but remain unexecuted under the active no-test rule.
- Added focused synthetic source for privacy key-map validation and purpose
  separation, retained-key import rotation with active broker/content alias
  establishment, rotation-only content-count deduplication, missing recovery
  authority with no import/execution insertion, and cross-scheme provider-alias
  conflict. A separate A/B/content-only regression proves provider-distinct
  identical fills remain ambiguous without a reliable identity. These cases are
  written but remain unexecuted under the static-only rule.
- Migrations 0003, 0005, and 0006 changed only in source and have not been applied to the real
  database. Its previously verified disposable database remains immutable
  historical evidence; it must not be adopted or repaired. The combined gate
  will create a new disposable database and record the new schema digest.
- `git diff --check` passes. The code and tests remain unstaged and uncommitted;
  no real/disposable database, source statement, private evidence, secret,
  process, dependency, push, deployment, or legacy file changed in Slice C.

### Slice D preview/source-identity automation source - written, unexecuted

- The accepted real baseline has one active seeded Journal account and zero
  source-account identities. A scoped preview cannot run at that boundary because
  unmatched identities correctly require explicit confirmation.
- Slice D now begins private-source handling with an unscoped privacy-safe parse
  preview whose raw account identifier remains only inside the server operation.
  After verified backup and migrations, a future narrow server-only preparation
  command inventories active accounts and non-superseded source identities.
- For this one-owner migration only, it may transactionally call
  `confirmSourceIdentityLinkRecord()` when the locked database proves exactly
  one globally active workspace, that workspace has exactly one active Journal
  account, there are zero identities for the source system, and no fingerprint
  conflict. On rerun after a completed link, one sole identity may
  continue without mutation only when the in-process statement fingerprint
  resolves under complete configured retained HMAC authority to that identity
  and the same sole account.
  Another account, multiple identities, missing/unsupported authority, mismatch,
  conflict, or ambiguity stops for factual trader review/recovery. Normal product
  imports never auto-link.
- The command must verify exactly one linked identity before commit and record
  only privacy-safe counts/digests. Its creation transaction rolls back on any
  failure; its post-link resume path is read-only and makes the command
  idempotent across interruption. The scoped read-only preview then runs and must
  match the accepted unscoped aggregate evidence before vault promotion or
  database import. A later preview/count stop leaves import untouched and uses
  the verified backup/restore procedure if the pre-link boundary must be restored.
- This link associates broker source evidence with the existing Journal account;
  it is not login authentication. The local `development_local` owner remains
  authoritative, while Discord-first and optional email login remain deferred.
- The production-quality static source now includes the strict unscoped CSV
  reader/aggregate preview, explicit IBKR canonicalizer, development-owner scope
  derivation, complete retained-HMAC loading, and one-transaction initial-link or
  no-write resume preparation command. Both CLIs load the source path only from
  the required `TRADERLINK_PLATFORM_JOURNAL_IMPORT_SOURCE_PATH` environment
  value and reject every source-path argument. The source may be a validated
  preserved-backup CSV, while the active repository is always forbidden and an
  injected test root is only an additional exclusion. Database-like,
  non-regular, malformed, empty, oversize, evidence-mismatched, or
  descriptor-swapped input fails without returning a path or private field. The
  locked preparation also proves exactly one globally active workspace before
  reporting `activeWorkspaceCount: 1`.
- Dedicated synthetic coverage is written for allowlisted output, path/evidence
  rejection, environment-only path loading, non-bypassable repository
  containment, exact six-migration and ownership/account/identity cardinality,
  cross-account conflict, rollback, exactly-one postcondition, no-write resume,
  missing retained authority, and serialized-error redaction. It has not run.
- No normal preview/import path gained auto-link behavior. No database, private
  source, HMAC configuration, backup, vault, import, or process was opened or
  executed in this source-only checkpoint.

### Slice D vault/import/integrity automation source - written, unexecuted

- The remaining Slice D automation source is now written and unstaged. The
  import command requires `NODE_ENV=development` exactly, accepts no source-path argument, re-reads the
  environment-only source bytes, binds the exact confirmed hash/size/aggregate
  preview, rechecks the six-migration owner/account/identity boundary under an
  immediate transaction, loads complete retained account plus Journal
  execution/content HMAC authority, and calls the normal Journal integrity
  command service. It never auto-links a source identity.
- The evidence vault is configured by
  `TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT`. It must be an absolute
  non-reparse directory outside every repository, database, backup, restore,
  verification, and preserved-source tree. Only
  `ibkr/<lowercase-source-sha256>.csv` is stored in SQLite. Exclusive restrictive
  temporary creation, flush, byte/hash re-read, atomic promotion, identical-
  object resume, conflict refusal, pre-promotion temporary cleanup, and
  privacy-safe recoverable-orphan reporting are implemented without overwrite
  or automatic final-object deletion. Later database failure distinguishes a
  newly created unreferenced object from an already-present reference-unverified
  object.
  `TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON` supplies the
  complete protected backup/source/restore/verification root inventory rather
  than relying on hard-coded machine paths.
- The pre-commit gate now states only what the same-byte parser/scoped planner
  can prove: 2,284 records, 1,072 mapped Stock executions, 542 unsupported Forex
  records, 670 non-Trade records, 115 mark-to-market rows over 113 symbols, 116
  mapped position source rows producing 231 facts, one open-position row, the
  occurrence-distinct duplicate pair, and internally consistent identity/
  overlap counts. The former pre-commit assertion of 331 closed, one supported
  open, and one contained mismatch was infeasible without commit/rebuild and was
  corrected to a mandatory post-import independent-verifier gate.
- The independent verifier source opens SQLite read-only and requires the exact
  manifest/schema/pragmas/integrity boundary, sole development-owner scope,
  exactly one IBKR identity/import, complete referenced account and Journal HMAC
  authority across current and historical identity rows, exact vault
  inventory/object bytes, ordinal-by-ordinal source evidence, position facts,
  execution content/provenance, append-only current pointers and revisions,
  relationship integrity, allocation conservation,
  trading-day coverage, deterministic current rebuilds, no forks, exact reimport
  batch identity, the then-proposed post-import projection counts, sidecar state,
  and an unchanged main file during verification. The later runtime result
  established that a read-only WAL connection may create a zero-byte WAL and
  32,768-byte SHM without mutating the main database. Its DTO is an
  aggregate/stable-ID allowlist and direct failures print stable codes only.
- One dedicated synthetic test file covers environment-only path loading,
  repository/storage/reparse exclusions, identical/conflicting vault objects,
  write/flush/promotion faults, orphan rollback, wrong evidence, missing identity
  or retained authority, normal-command import, exact no-write reimport, and
  relationship/fork/allocation/rebuild/evidence corruption with stable-check and
  leakage assertions. The deterministic source is shaped for an eventual clean
  331-ready/one-open/one-needs-decision verifier pass; the runtime checkpoint
  corrected that historical fixture to 331/0/2.
  The Phase 3 inventory now expects 50 unique files, 13 Slice D automation files,
  and 11 focused test files. None has been executed in this static-only task.

The combined Slice B/C focused suite and static verifier must run with one
worker and no file parallelism before disposable or real database work in Slice
D. Because migrations 0003, 0005, and 0006 were refined, the fresh disposable proof must also
re-run the complete six-migration schema, rollback, prefix, and integrity
checks. No real database migration, HMAC secret,
evidence-vault copy, private statement preview or import may occur before that
gate. UI, public login, push, deployment, deletion, and production work remain
out of scope.

## Next action

The Phase 3 implementation and evidence are preserved in local commit
`8f6a4d4e4dec20ef6edcd50f476b14d368bde505`, with no private database,
statement, configuration, vault object, or secret. The complete closure is the
[Phase 3 Journal Integrity Handoff](phase-3-journal-integrity-handoff.md).
Next, perfect and accept the Phase 4 Core Analytics plan before implementation.
Phase 4 must read the accepted Journal ledger/projection/coverage contracts,
keep the two decision chains out of unsupported realized metrics without hiding
their activity, and must not create a V3 analytics dependency. UI work remains
separately gated by iterative owner visual review.
