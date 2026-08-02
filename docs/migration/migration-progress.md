# TraderLink Platform Migration Progress

**Current phase:** Phase 5 - Module Transfer planning. Phase 4 is complete: Slices A-D passed their technical gates and the owner visually approved Slice E on 2026-08-02.
**Historical pre-runtime implementation state:** The [Phase 3 plan](phase-3-journal-integrity-plan.md) and [tracker](phase-3-journal-integrity-progress.md) preserve the complete pre-runtime design and execution history. The accepted state immediately below supersedes former queued/unexecuted and 331/1/1 planning claims.
**Phase 2 foundation commit:** `fea56307fbd0142ef99b9f13c020451a6a503cc7` (`feat(platform): establish verified database foundation`), preserved locally without push or deployment.
**Phase 3 implementation commit:** `8f6a4d4e4dec20ef6edcd50f476b14d368bde505` (`feat(journal): complete phase 3 integrity foundation`), preserved locally without push or deployment.

**Accepted Phase 3 runtime state:** The exact 11-file focused suite passed all
129 tests with one worker and no file parallelism; the static verifier passed;
and fresh disposable, online backup/restore rehearsal, real migrations,
privacy-safe preview, source-identity preparation, append-only evidence import,
exact reimport, and independent verification passed. `development.sqlite` now
has six migrations, schema digest
`75571914c5fa4bbfe7876c8e9a72cc7d584eab91704d70cf889bf5f1b374a55a`,
2,284 source records, 1,072 Stock executions, 542 preserved unsupported Forex
records, 331 ready closed round trips, zero automatically legitimate-open round
trips, and two contained Data Decisions. The main file is 10,522,624 bytes with
SHA-256 `31101395dafb7bb14c2bf934e3288b40f63a5f8736a1da03cf549c996463af3b`;
its WAL is zero bytes and its SHM is 32,768 bytes. No server, push, deployment,
production, or legacy mutation occurred.

**Historical Slice D source-identity preparation record:** Automation source and dedicated
synthetic coverage are written but unexecuted. Private-source handling
begins with an unscoped privacy-safe parse preview. After verified backup and
migrations, initial creation may link the statement to the seeded Journal
account only at the exact one-globally-active-workspace/one-active-account/
zero-source-identities/no-conflict boundary. If a completed link is encountered
after interruption, exactly one
identity may continue without mutation only when the in-process fingerprint
resolves unambiguously under complete configured retained HMAC authority to that
same sole account. All other existing, missing-authority, mismatched, conflicting, or
ambiguous states stop for factual review/recovery. The command verifies exactly
one link before scoped read-only preview. Normal product imports never auto-link.
This Journal source link is distinct from login: the development-local owner is
authoritative now, and Discord/email remain deferred. Both CLIs load the source
path only from required environment variable
`TRADERLINK_PLATFORM_JOURNAL_IMPORT_SOURCE_PATH` and reject source-path
arguments. The reader accepts a validated preserved-backup CSV while always
rejecting the active replacement repository plus any additional injected test
root, database-like/non-regular/malformed/oversize/evidence-mismatched input,
and descriptor identity changes; it never returns the source path. The locked
preparation proves exactly one globally active workspace before reporting that
count. No real database/private-source operation has begun.

**Historical Slice D import/integrity automation record:** The remaining source is written but
unexecuted. The import uses the same environment-only source path and requires
`NODE_ENV=development` exactly plus a separate action/enable gate, the exact confirmed preview
evidence, the complete retained account and Journal HMAC maps, one prepared IBKR
identity, and the accepted six-migration/owner/account state. The configured
vault must be outside all repository/storage/source boundaries; it promotes an
exclusive flushed hash-addressed object before the normal atomic Journal command,
removes failed pre-promotion temporary files, and reports only a relative
recoverable key plus truthful newly-created-unreferenced or
already-present-reference-unverified state on later failure. Exact
reimport verifies the same object and batch with zero new data. The independent
read-only verifier was designed around the then-proposed post-import 331-ready/one-open/one-needs-decision
gate, ordinal source/fact/execution/provenance evidence,
relationship/allocation/rebuild/idempotency/vault/sidecar proof, and
backup-restore stop on failure. The read-only pre-commit preview no longer claims
round-trip counts it cannot derive. Read-only WAL sidecar absence remains a
runtime gate, not a static proof.

## Completed planning decisions

- The product direction is a modular platform; Journal Analytics is not the platform architecture.
- A practical replacement analytics path may replace V3 for ordinary dashboards.
- Data correctness remains strict at source-row, execution, round-trip, and metric scope.
- Data Decisions is a required Journal foundation; the trader makes the final factual decision from statement evidence.
- Valid unrelated round trips must remain visible when another round trip needs a decision.
- Statement upload order is irrelevant; reconstruction uses the full chronological execution history for the affected account/instrument/currency chain.
- A round trip starts when position leaves zero and closes when it returns to zero; the next execution after zero begins a new trade.
- Broker-imported and manual Trade Tracker executions share one canonical ledger while preserving source provenance.
- Manual executions use their actual execution date/time and never combine daily notes across trading dates. Their instants are assigned to the Journal account timezone and begin with point-only coverage; each account trading date requires an evidence-bound trader decision before complete/partial daily coverage is asserted, and opening inventory remains separate. The future multi-day Trade Tracker presentation is deliberately deferred for a separate UI plan and owner review.
- January IBKR data is test data, not a complete live customer migration source.
- The architecture is TraderLink Platform; V4 is optional only as a later release label.
- Workspace/folder cleanup requires a user-visible Git and data audit before any removal.
- The current legacy application remains preserved until complete owner-approved replacement acceptance.
- The approved dashboard preservation baseline is the light Material UI design with the complete left navigation. A dark or reduced legacy/experimental shell is not the final dashboard.
- The accepted Calendar has week/month views and sits under Trades in that same dashboard navigation.
- The replacement is now in one clean, traceable full checkout at `C:\Users\jerac\Documents\TraderLink\traderlink-platform`. The current `traderslink.pro` folder remains intact as a recovery/reference archive and need not be deleted.
- `v4-temp-sql` was located inside `C:\Users\jerac\Documents\traderslink.pro back up july 29`; it is an early experiment, not configured, and owner-rejected as a migration source.
- The selected replacement development database is `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite`; it now contains six accepted migration rows and the Phase 3 Journal evidence summarized above. The earlier two-migration/five-table foundation remains historical recovery evidence.
- The owner accepted one active workspace owner, owner/admin access to every active account in the same workspace, member denial until grants are designed, two initial migrations, five empty domain tables, and empty initialization without private seed data.
- The owner-accepted design uses `WorkspaceAccessScope`, versioned broker-account fingerprint/canonicalization/HMAC identities, globally unique migration IDs, exact post-migration schema digests with fail-closed drift detection, separate runtime/initializer modes, canonical UUID-v4/numeric UTC validation, workspace-versus-account isolation, a separate ownership-seed approval gate, the accepted focused verification plan, and the accepted exact implementation-file list.
- Big Time weekly content automation is preserved but explicitly deferred as a low-priority News operation outside the core Journal/database replacement.
- The Phase 3 runtime evidence reconciles all 2,284 source records, including 1,072 Stock execution records and 542 preserved-but-unsupported Forex records. Zero-to-zero arithmetic produces 331 ready closed round trips and two contained decision chains; legacy session/time-gap trade counts are not the target.
- Before adding migration 3, verifier semantics must separate the immutable five-table Phase 2 ownership-foundation profile from the expanding current migration manifest. Ordinary runtime remains strict and never auto-migrates.
- Slice A completed that verifier split and implemented migrations 3-6 in code. The accepted current manifest has six rows and 24 domain tables; the final fresh-disposable and real schema digest is `75571914c5fa4bbfe7876c8e9a72cc7d584eab91704d70cf889bf5f1b374a55a`.
- Slice B code now preserves every CSV record, maps IBKR Stock executions and
  position facts, retains unsupported Forex coverage, unifies manual and broker
  provenance, enforces exact reimport/manual idempotency, reconciles overlaps,
  rejects changed manual facts under a reused idempotency key,
  gives strong provider fill identity precedence without collapsing two
  distinct same-fact provider fills, preserves trader exclusions during later
  broker enrichment, and stores immutable execution versions. Import preview boundaries return
  aggregate, privacy-safe counts and issue/coverage summaries; scoped previews
  plan exact reimports and overlaps without returning broker tokens, raw rows,
  executions, or symbols or mutating source identities. Exact commit retries
  resolve the accepted file digest before parser/mapping work. Its synthetic
  tests later passed in the complete one-worker Phase 3 verification gate.
- Provider identity retained only as conflict provenance becomes an active
  privacy-safe alias after the trader chooses `keep_distinct` or a supported
  duplicate merge. Conflicting alias ownership fails closed. Focused coverage
  later passed in the complete one-worker Phase 3 verification gate.
- Slice C code now atomically connects accepted imports to source/chain Data
  Decisions and full-account deterministic rebuilds. It supports zero-to-zero
  long/short/partial/multi-day/repeated/flip grouping, statement-supported open
  positions, position-checkpoint containment and later recovery, exact
  allocation conservation, stable identities, stale-finding supersession,
  consequential full-chain same-time order decisions, exact import-state
  reconciliation, evidence-bound source-row actions, supplied missing
  position facts, honest accepted source limitations, all accepted trader
  actions including reviewed statement-coverage supply, statement-only
  carried-position visibility, stale-chain retirement after an instrument
  correction, and a privacy-safe aggregate coverage read model with explicit
  account timezone/currency, gap, overlap, and mismatch counts. Manual batch
  order is not treated as authoritative execution order. Its synthetic
  tests later passed in the complete one-worker Phase 3 verification gate.

## Current verified local baseline

| Measure | Value | Meaning |
| --- | --- | --- |
| Normalized executions | 1,072 | January IBKR test dataset |
| Saved trades | 336 | Derived current local data |
| Closed trades | 334 | Candidate realized-P/L population after eligibility checks |
| Open trades | 2 | Must remain visible separately from realized analytics |
| Workspace overview | Unverified | Existing repair is uncommitted and not accepted |

The currently configured local source is `C:\Users\jerac\Documents\TraderLink\private-data\v3-dashboard\trading-rules-v1.sqlite`. `v4-temp-sql` exists only inside the July 29 backup and is not the configured database.

## Phase 1 inventory findings

- Current source has 96 page routes and 61 Route Handlers: 24 dashboard pages, 52 legacy `/intelligence` pages, and 20 Platform/peer-module pages.
- The dashboard family is real source, not redirected wholesale into `/intelligence`; older route documentation is stale.
- 107 source files directly reference V3. Default local runtime and CI remain V3-coupled.
- Current local storage fallbacks can mix Platform/Academy, News, Watchlist, affiliate, Level Analysis, rules, tags, and Journal data under confusing paths.
- The parent workspace has 88 immediate folders. Seventeen canonical worktrees have commits outside current main, and the old `trader-intelligence-v2` repository/worktrees contain substantial dirty/unique work.
- Node PID 3160 serves port 3000 and used roughly 1.28 GB working memory at observation; it and the active database were not stopped.
- The Big Time scheduler source can mutate Git and deploy production; installed Windows task state/path is still unknown because task enumeration was denied.
- Module contracts, the 126-metric migration catalog, additional possible analytics, risks, and acceptance gates are now drafted under `docs/migration/`.

## Phase 0 exit checklist

- [x] Master replacement plan created in `docs/migration/`.
- [x] Import Integrity and Data Decisions contract created.
- [x] Migration register created.
- [x] Per-phase chat and handoff protocol created.
- [x] Legacy V3 plan and agent guidance marked as superseded for future platform work.
- [x] Project owner explicitly accepted the Phase 0 planning package on 2026-07-31.

## Phase 0 acceptance and handoff

The approved closure record is [Phase 0 Planning Handoff](phase-0-planning-handoff.md). It records the repository and working-tree state, the unverified database/process boundaries, accepted decisions, deferred work, exact Phase 1 scope, and prohibited actions.

The owner explicitly authorized Phase 1 in the current chat on 2026-07-31. Phase 1 remains limited to inspection and migration-document work. Its live tracker is [Phase 1 Inventory and Baseline Progress](phase-1-inventory-and-baseline-progress.md).

## Phase 1 acceptance and next boundary

1. The owner accepted the Phase 1 inventory, folder dispositions, current legacy source, backup-only V4 conclusion, approved dashboard/Calendar baseline, clean replacement path, module contracts, analytics first slice, risks, and replacement-start boundary on 2026-08-01.
2. Carry the two machine-state unknowns forward with explicit evidence gates: the installed Big Time scheduled-task target must be proven only before that low-priority automation is changed/reactivated or its related folder is considered for cleanup, and the exact process holding the legacy database must be proven before a later authorized stop/copy.
3. The owner explicitly authorized Phase 2 and accepted its preservation-commit and independent-clone checkpoint on 2026-08-01.

## Phase 2 preservation, clone, and database-backup checkpoint

- Legacy reference: `C:\Users\jerac\Documents\TraderLink\traderslink.pro`, `main` at `a3193e19806af955093aa236349d796171d9bf97`.
- The legacy worktree retains exactly two tracked product modifications and 22 untracked preservation files. They remain outside the replacement checkout.
- Replacement: `C:\Users\jerac\Documents\TraderLink\traderlink-platform`, branch `codex/traderlink-platform-replacement`, remote `https://github.com/traderslink-bot/traderslink-trader-improvement-system.git`.
- The replacement was clean at the accepted clone checkpoint. No upstream, push, deployment, dependency installation, environment copy, or server start occurred.
- Accepted backup-baseline commit: `405acf08ce8ac7be6c984cb52082052d18642acc`. It records the corrected backup baseline in exactly eight documentation/agent files and was not pushed.
- Accepted empty-foundation implementation commit: `fea56307fbd0142ef99b9f13c020451a6a503cc7`. It records exactly 37 accepted source/test/script and controlling-documentation paths and contains no database, sidecar, private data, environment file, dependency tree, log, or unrelated file. It was not pushed or deployed.
- At this Phase 2 checkpoint, the selected replacement database contained only the verified two-migration, five-empty-domain-table foundation. Later owner seed and Phase 3 records supersede that historical state.
- The configured legacy source was backed up with the SQLite online backup API while PID 3160 remained running. The completed backup is `C:\Users\jerac\Documents\TraderLink\private-data\legacy-app\backups\phase-2-20260801T053759Z\trading-rules-v1-online-backup.sqlite`, SHA-256 `92B814735EFF41BAEAFB6BC1F2E8B7E0D4EFDD137416D0C0C80708DB50F5E737`.
- The backup was restored to a separate disposable private-data target. All 24 table counts, four migration rows, schema DDL digest, page geometry, and `quick_check=ok` match the legacy source and completed backup.
- No sidecars existed immediately after the main backup and restore operations. Later read-only verification of the WAL-mode files created zero-byte WAL and 32,768-byte SHM sidecars beside both new databases; the main database hashes remain unchanged and identical. The sidecars remain preserved pending a separately authorized cleanup decision.
- Complete evidence and restore instructions are in [Phase 2 Replacement Baseline Progress](phase-2-replacement-baseline-progress.md).
- The owner accepted that corrected backup/restore checkpoint and the corrected exact schema/migration design. The accepted [Replacement Database Schema and Migrations](replacement-database-schema-and-migrations.md) package fixes the empty database foundation, migration registry and schema digest, Platform identity, Journal account boundary, versioned identity recovery, `WorkspaceAccessScope`, permission model, future Journal table map, separate ownership-seed gate, recovery rules, exact implementation files, and focused verification cases.

Current boundary: the coordinating technical auditor accepted the completed
[Phase 3 Journal Integrity Progress](phase-3-journal-integrity-progress.md)
runtime and database evidence; no separate personal owner review is required.
Phase 4 Slices A-D are technically accepted. Slice A passed targeted lint,
dependency-scoped TypeScript, and 2 focused files/9 tests with one worker. Slice
B passed targeted lint, dependency-scoped TypeScript over 14 roots/imports, and
6 focused files/34 tests with one worker and no file parallelism. The result is
one Journal-owned fact set, exact normalized populations and fee handling, 22
first-slice metrics, and reconciling daily/ticker/30-minute groups without
touching the real database. Slice C then passed targeted lint,
dependency-scoped TypeScript over 22 roots/imports, the 8-file/45-test
one-worker suite, a 10,000-execution scale proof and the static verifier. Its
registry has all 126 legacy candidates plus 84 additional capabilities: 181
implemented/conditional and 29 explicitly unavailable, digest
`bc49aaceebff2af7b2a35bc16f99f89e9c1d3ceb461b234d2ac21992cfd3049e`.
Slice D then passed targeted lint, dependency-scoped TypeScript, 1 focused
file/2 tests with one worker, and the privacy-safe real-database verifier. It
proved 331 ready closed, zero legitimate open, two contained decisions, 331
fee-complete rows, identical production/independent exact row digests, six
reconciling service reads, complete 331-row keyset pagination, unchanged main
database hash/size and no non-empty WAL. Slice E then implemented the
development-only scope/launcher and cut Workspace, Round Trips, the overview
API, and five standard Analytics routes to replacement services. Focused lint,
scoped TypeScript, two files/11 one-worker tests, the static route verifier and
real browser/API checks passed; the database hash/size and zero-byte WAL remain
unchanged. The owner approved the preserved light Material dashboard on
2026-08-02, closing the remaining Slice E gate. The temporary review process
was stopped and port 3010 is not listening. The owner's review also confirmed
the Phase 5 entry list: Calendar, Trade Tracker and Rules still depend on
inherited V3 access; Ticker/Open Trades, Data Decisions, Manual Entry and
Analytics Lab remain incomplete replacement surfaces. Public
login/account integration
is not a prerequisite: Discord-first login is reconciled before go-live, with
email/password left optional. Broad lint, full-project TypeScript, full
regression, build, browser/E2E, and CI-equivalent checks remain deferred to the
final replacement acceptance gate without being removed from it. No push,
deployment, deletion, production change, or legacy retirement is authorized.
