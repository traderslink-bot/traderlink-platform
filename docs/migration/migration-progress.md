# TraderLink Platform Migration Progress

**Current phase:** Phase 3 - Journal integrity Slice A (migration compatibility and schema). The Phase 2 foundation and local development ownership seed are technically accepted and complete under delegated owner authority.
**Current implementation state:** The local-only seed passed its static verifier and all three focused files/all eleven tests with one worker, was backed up, previewed, atomically executed, and independently verified. The database contains domain counts 1/1/1/1/0 with matching schema/migration digests. The [Phase 3 plan](phase-3-journal-integrity-plan.md) and [tracker](phase-3-journal-integrity-progress.md) are technically accepted and define the migrations, evidence/ledger/decision/rebuild contracts, and private-source gates. Slice A is authorized; no Phase 3 code, migration, source-account identity, or private/legacy trading data has yet been added.
**Phase 2 foundation commit:** `fea56307fbd0142ef99b9f13c020451a6a503cc7` (`feat(platform): establish verified database foundation`), preserved locally without push or deployment.

## Completed planning decisions

- The product direction is a modular platform; Journal Analytics is not the platform architecture.
- A practical replacement analytics path may replace V3 for ordinary dashboards.
- Data correctness remains strict at source-row, execution, round-trip, and metric scope.
- Data Decisions is a required Journal foundation; the trader makes the final factual decision from statement evidence.
- Valid unrelated round trips must remain visible when another round trip needs a decision.
- Statement upload order is irrelevant; reconstruction uses the full chronological execution history for the affected account/instrument/currency chain.
- A round trip starts when position leaves zero and closes when it returns to zero; the next execution after zero begins a new trade.
- Broker-imported and manual Trade Tracker executions share one canonical ledger while preserving source provenance.
- Manual executions use their actual execution date/time and never combine daily notes across trading dates. The future multi-day Trade Tracker presentation is deliberately deferred for a separate UI plan and owner review.
- January IBKR data is test data, not a complete live customer migration source.
- The architecture is TraderLink Platform; V4 is optional only as a later release label.
- Workspace/folder cleanup requires a user-visible Git and data audit before any removal.
- The current legacy application remains preserved until complete owner-approved replacement acceptance.
- The approved dashboard preservation baseline is the light Material UI design with the complete left navigation. A dark or reduced legacy/experimental shell is not the final dashboard.
- The accepted Calendar has week/month views and sits under Trades in that same dashboard navigation.
- The replacement is now in one clean, traceable full checkout at `C:\Users\jerac\Documents\TraderLink\traderlink-platform`. The current `traderslink.pro` folder remains intact as a recovery/reference archive and need not be deleted.
- `v4-temp-sql` was located inside `C:\Users\jerac\Documents\traderslink.pro back up july 29`; it is an early experiment, not configured, and owner-rejected as a migration source.
- The selected replacement development database is `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite`; it exists with exactly two migration rows, the five intended domain tables at zero rows, and final schema digest `5a34f790164e9b8456db88a1052a9b9084bbfbeab4eae8c5eee1f49d5c7194c4`. Its implementation and correction verification are technically accepted.
- The owner accepted one active workspace owner, owner/admin access to every active account in the same workspace, member denial until grants are designed, two initial migrations, five empty domain tables, and empty initialization without private seed data.
- The owner-accepted design uses `WorkspaceAccessScope`, versioned broker-account fingerprint/canonicalization/HMAC identities, globally unique migration IDs, exact post-migration schema digests with fail-closed drift detection, separate runtime/initializer modes, canonical UUID-v4/numeric UTC validation, workspace-versus-account isolation, a separate ownership-seed approval gate, the accepted focused verification plan, and the accepted exact implementation-file list.
- Big Time weekly content automation is preserved but explicitly deferred as a low-priority News operation outside the core Journal/database replacement.
- The Phase 3 planning evidence reconciles all 2,284 source records, including 1,072 Stock execution records and 542 preserved-but-unsupported Forex records. Zero-to-zero arithmetic produces 331 closed round trips, one statement-supported open chain, and one contained closing-position mismatch; legacy session/time-gap trade counts are not the target.
- Before adding migration 3, verifier semantics must separate the immutable five-table Phase 2 ownership-foundation profile from the expanding current migration manifest. Ordinary runtime remains strict and never auto-migrates.

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
- The selected replacement database `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite` now contains only the verified two-migration, five-empty-domain-table foundation. Owner bootstrap remains separate and prohibited.
- The configured legacy source was backed up with the SQLite online backup API while PID 3160 remained running. The completed backup is `C:\Users\jerac\Documents\TraderLink\private-data\legacy-app\backups\phase-2-20260801T053759Z\trading-rules-v1-online-backup.sqlite`, SHA-256 `92B814735EFF41BAEAFB6BC1F2E8B7E0D4EFDD137416D0C0C80708DB50F5E737`.
- The backup was restored to a separate disposable private-data target. All 24 table counts, four migration rows, schema DDL digest, page geometry, and `quick_check=ok` match the legacy source and completed backup.
- No sidecars existed immediately after the main backup and restore operations. Later read-only verification of the WAL-mode files created zero-byte WAL and 32,768-byte SHM sidecars beside both new databases; the main database hashes remain unchanged and identical. The sidecars remain preserved pending a separately authorized cleanup decision.
- Complete evidence and restore instructions are in [Phase 2 Replacement Baseline Progress](phase-2-replacement-baseline-progress.md).
- The owner accepted that corrected backup/restore checkpoint and the corrected exact schema/migration design. The accepted [Replacement Database Schema and Migrations](replacement-database-schema-and-migrations.md) package fixes the empty database foundation, migration registry and schema digest, Platform identity, Journal account boundary, versioned identity recovery, `WorkspaceAccessScope`, permission model, future Journal table map, separate ownership-seed gate, recovery rules, exact implementation files, and focused verification cases.

Current boundary: the coordinating technical auditor accepted the [Development Owner Seed Progress](development-owner-seed-progress.md) implementation and post-write evidence; no separate personal owner review is required. Phase 3 may now design and implement the Journal source-row, import, canonical execution, Data Decisions, and round-trip foundation against stable internal UUID ownership. Public login/account integration is not a prerequisite: Discord-first login is reconciled before go-live, with email/password left optional. Broad lint, full-project TypeScript, full regression, build, browser/E2E, and CI-equivalent checks remain deferred to final replacement acceptance without being removed from that gate. No push, deployment, deletion, production change, or legacy retirement is authorized.
