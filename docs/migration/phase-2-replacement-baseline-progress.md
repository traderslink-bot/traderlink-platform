# Phase 2 Replacement Baseline Progress

**Phase:** 2 - Replacement baseline
**Status:** Phase 2 empty database foundation implemented, correction-verified, and technically accepted by the coordinating auditor under delegated owner authority
**Authorized:** 2026-08-01, explicitly by the project owner
**Current boundary:** Phase 2 foundation technical acceptance and the separately tracked development-owner seed are complete. Phase 3 Journal integrity may proceed under its own tracker. Private/legacy trading-data migration must follow the Phase 3 contract; UI, broad checks, push, deployment, and legacy retirement remain separately gated

## Repository boundary

### Preserved legacy reference

- Path: `C:\Users\jerac\Documents\TraderLink\traderslink.pro`.
- Branch: `main`.
- HEAD: `a3193e19806af955093aa236349d796171d9bf97`.
- Locally recorded upstream relationship: 72 commits ahead and 0 behind `origin/main`.
- Remaining tracked product modifications:
  - `app/api/intelligence/dashboard/overview/route.ts`.
  - `src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository.ts`.
- Remaining untracked preservation files: 22.
  - `.agents/skills/lightweight-charts/SKILL.md`.
  - `data/v3-dashboard/dashboard-database-structure.txt`.
  - `data/v3-dashboard/trading-rules-v1-backup-2026-07-30.sqlite` plus WAL/SHM.
  - `data/v3-dashboard/trading-rules-v1.sqlite` plus WAL/SHM.
  - `data/v3-dashboard/trading-rules-v1.sqlite.2026-07-31T02-51-04-825Z.before-temporary-ibkr-load.bak` plus WAL/SHM.
  - `scripts/load-temporary-ibkr-statement.ts`.
  - `skills-lock.json`.
  - `src/lib/trader-analytics/__tests__/workspace-overview-api-route.test.ts`.
  - `src/lib/trader-analytics/server/saved-report-overview-adapter.ts`.
  - `src/scripts/__tests__/load-temporary-ibkr-statement.test.ts`.
  - `traderlink_platform_replacement_migration_plan.md`.
  - `workspace-main-server-error.log`.
  - `workspace-main-server-restart-error.log`.
  - `workspace-main-server-restart.log`.
  - `workspace-main-server.log`.
  - `workspace-server.log`.
- No legacy modification or untracked preservation file was copied into the replacement checkout.

### Replacement checkout

- Path: `C:\Users\jerac\Documents\TraderLink\traderlink-platform`.
- Branch: `codex/traderlink-platform-replacement`.
- HEAD at the accepted clean-checkout checkpoint: `a3193e19806af955093aa236349d796171d9bf97`.
- Accepted backup-baseline commit: `405acf08ce8ac7be6c984cb52082052d18642acc`, with message `docs(migration): record phase 2 backup baseline`.
- Accepted empty-foundation implementation commit: `fea56307fbd0142ef99b9f13c020451a6a503cc7`, with message `feat(platform): establish verified database foundation`. It contains exactly 37 accepted source/test/script and controlling-documentation paths and no database, sidecar, private data, environment file, `node_modules`, log, binary, or unrelated file.
- Remote: `https://github.com/traderslink-bot/traderslink-trader-improvement-system.git`.
- The checkout was clean when the owner accepted the clone checkpoint.
- It is a full, non-shallow, independent clone with its own `.git` directory and object pack, no alternates, no hardlinks, and no registration in the legacy repository's worktree list.
- No upstream was configured and no push, deployment, dependency installation, or server start occurred.
- That accepted backup-baseline commit contains exactly the eight owner-approved documentation/agent files and no product code, database, environment file, log, skill, temporary file, or superseded root draft.
- The branch still has no upstream. Nothing was pushed or deployed.

## Database boundary

- Configured legacy source: `C:\Users\jerac\Documents\TraderLink\private-data\v3-dashboard\trading-rules-v1.sqlite`.
- Completed online backup: `C:\Users\jerac\Documents\TraderLink\private-data\legacy-app\backups\phase-2-20260801T053759Z\trading-rules-v1-online-backup.sqlite`.
- Disposable restore-verification target: `C:\Users\jerac\Documents\TraderLink\private-data\legacy-app\restore-verification\phase-2-20260801T053759Z\trading-rules-v1-restored.sqlite`.
- Selected replacement database: `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite`.
- The selected replacement database exists with the verified two-migration, five-zero-row-domain-table empty foundation. Owner bootstrap and private/legacy data migration have not run.
- The formerly recorded legacy process tree is stopped, and ports 3000, 3010, and 3011 are clear. Historical backup sections below retain the process state that applied during those dated operations.

## Online-backup record

| Field | Evidence |
| --- | --- |
| Method | Existing `better-sqlite3` `Database.backup` binding over the SQLite online backup API; source opened read-only |
| Started | `2026-08-01T05:38:43.910Z` |
| Finished | `2026-08-01T05:38:44.244Z` |
| Duration | 334 ms |
| Source size | 15,368,192 bytes |
| Source last write before/after | `2026-07-30T22:51:05.5102511-04:00`; unchanged at this checkpoint |
| Source WAL state | Journal mode `wal`; `-wal` present at 0 bytes; `-shm` present at 32,768 bytes |
| Backup size | 15,368,192 bytes |
| Backup sidecars immediately after backup | None observed |
| Backup sidecars after later verification | WAL 0 bytes, created `2026-08-01T05:39:42.5618474Z`; SHM 32,768 bytes |
| Backup SHA-256 | `92B814735EFF41BAEAFB6BC1F2E8B7E0D4EFDD137416D0C0C80708DB50F5E737` |
| Source process | PID 3160 stayed running on port 3000; no process action was required |

## SQLite and schema evidence

| Evidence | Source | Backup | Restored target |
| --- | ---: | ---: | ---: |
| SQLite library version | 3.53.0 | 3.53.0 | 3.53.0 |
| `PRAGMA schema_version` | 34 | 1 | 1 |
| `PRAGMA user_version` | 0 | 0 | 0 |
| Journal mode | wal | wal | wal |
| Page size | 4,096 | 4,096 | 4,096 |
| Page count | 3,752 | 3,752 | 3,752 |
| User-table count | 24 | 24 | 24 |
| Schema-object count | 34 | 34 | 34 |
| Schema DDL SHA-256 | `D61CEE56585672798A017C4E1CA5DFCAA128ED48ED9E25CBDCA621ED51CDB328` | Same | Same |
| `PRAGMA quick_check` | ok | ok | ok |

`PRAGMA schema_version` is SQLite's internal schema-cache cookie, not TraderLink's application migration version. SQLite's online backup process deliberately updates a new destination's schema cookie. Therefore, the source value 34 and new-destination value 1 do not indicate schema loss. The authoritative migration evidence is the matching four `schema_migrations` rows, schema DDL digest, table counts, page geometry, main database hashes, and `quick_check=ok`. See [SQLite PRAGMA documentation](https://sqlite.org/pragma.html#pragma_schema_version) and [SQLite backup implementation evidence](https://sqlite.org/matrix/ev/src/backup.html).

### Migration rows

| Row | Migration ID | Applied at |
| ---: | --- | --- |
| 1 | `001_saved_import_to_coaching_loop` | `2026-07-29T00:34:29.174Z` |
| 2 | `002_persisted_repair_and_review_state` | `2026-07-29T00:34:29.174Z` |
| 3 | `003_persisted_decision_review_snapshots` | `2026-07-29T00:34:29.174Z` |
| 4 | `004_owner_workspace_and_csv_mapping_templates` | `2026-07-29T00:34:29.174Z` |

The same four rows, IDs, order, and timestamps exist in the source, backup, and restored target.

### Table counts

| Table | Rows |
| --- | ---: |
| `csv_mapping_templates` | 0 |
| `decision_review_diagnostics` | 0 |
| `decision_review_jobs` | 336 |
| `decision_review_snapshots` | 0 |
| `execution_feedback_summaries` | 336 |
| `import_batches` | 2 |
| `import_issues` | 141 |
| `import_repair_events` | 0 |
| `import_repair_items` | 141 |
| `import_rows` | 1,312 |
| `normalized_executions` | 1,072 |
| `owner_workspace_accounts` | 1 |
| `route_read_model_metadata` | 1 |
| `saved_reports` | 1 |
| `saved_trade_execution_links` | 1,072 |
| `saved_trade_notes` | 0 |
| `saved_trades` | 336 |
| `schema_migrations` | 4 |
| `ti_v3_execution_rule_commands` | 0 |
| `ti_v3_manual_custom_rule_lifecycle_events` | 0 |
| `ti_v3_manual_custom_rule_versions` | 0 |
| `ti_v3_manual_custom_rules` | 0 |
| `trade_grouping_diagnostics` | 336 |
| `trade_review_item_states` | 0 |

Every table count matches across the source, completed backup, and restored target.

## Restore verification

- The completed backup was opened read-only and restored through the same SQLite online-backup API into the disposable target.
- Restore started at `2026-08-01T05:40:28.116Z` and finished at `2026-08-01T05:40:28.317Z` in 201 ms.
- The restored file is 15,368,192 bytes and has SHA-256 `92B814735EFF41BAEAFB6BC1F2E8B7E0D4EFDD137416D0C0C80708DB50F5E737`, byte-identical to the completed backup.
- No restored sidecar was observed immediately after the main restore operation. Later read-only verification of the WAL-mode restored database created a zero-byte WAL at `2026-08-01T05:40:59.0642485Z` and a 32,768-byte SHM. The restored main database hash remained unchanged and identical to the backup.
- Schema digest, all migration rows, all 24 table counts, page geometry, and `quick_check=ok` match the completed backup and legacy source.

### Restore instructions

1. Confirm the immutable backup path and verify its SHA-256 is `92B814735EFF41BAEAFB6BC1F2E8B7E0D4EFDD137416D0C0C80708DB50F5E737` before restoring.
2. Choose a new private-data destination that does not already exist. Never restore over the legacy source or the selected replacement `development.sqlite` path.
3. Open the completed backup read-only with SQLite 3.53.0 or a compatible SQLite library.
4. Run the SQLite online backup API from the completed backup into the new destination. The verified implementation used the existing `better-sqlite3` `Database.backup` binding and did not require dependency installation.
5. Open the restored destination read-only and require `PRAGMA quick_check` to return `ok`.
6. Compare the 34 schema objects and DDL digest, four ordered migration rows, 24 table counts, page size, and page count against this record.
7. Keep the completed backup immutable. Any later production or replacement migration uses a new explicitly authorized target and never writes back to the legacy source.

## Accepted replacement schema and migration checkpoint

At the earlier design-only checkpoint, the owner accepted the corrected exact [Replacement Database Schema and Migrations](replacement-database-schema-and-migrations.md) design. That dated acceptance completed schema design review but did not then authorize database creation or implementation; the later implementation and delegated-audit records below supersede that former current boundary.

The owner has accepted these architectural directions:

- the external `development.sqlite` path with no V3 fallback or copied legacy/private seed data;
- one physical SQLite database with Platform-owned lifecycle and module-owned migrations;
- two initial migrations and five empty domain tables;
- one active workspace owner;
- owners/admins may access every active account in their workspace, while members receive no account access until grants are deliberately designed;
- exact decimal-string finance, explicit currency/timezone, WAL, foreign keys, forward-only migrations, and verified backup recovery; and
- the future Journal direction for source rows, execution versions/provenance, Data Decisions, round trips/allocations, manual entries, trading days, notes, rules, tags, reviews, and aliases.

The accepted exact design boundary is:

- required path configuration `TRADERLINK_PLATFORM_DB_PATH`, with selected value `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite` and no V3 fallback;
- `WorkspaceAccessScope` for owner/admin/member workspace access and narrowed `AccountScope` for account operations;
- versioned fingerprint scheme, adapter canonicalization, and strong HMAC keys with fail-closed matching, rotation, backup, and recovery;
- globally unique migration IDs, `migration_id` registry primary key, unique global execution order, and static filename/ID verification;
- required per-migration `post_schema_sha256` values and deterministic `sqlite_schema` digest verification that fails closed on table, explicit-index, view, or trigger drift without using SQLite's internal `schema_version` cookie as authority;
- ordinary startup that opens only a complete managed database and an explicit initializer that alone may create/bootstrap/resume;
- migration order 1 `0001_platform_identity`, then order 2 `0002_journal_account_boundary`;
- empty Platform user/workspace/membership tables and empty Journal account/source-identity tables only;
- canonical lowercase UUID-v4/RFC-variant and numeric UTC-millisecond database checks plus strict service validation;
- corrected workspace-owned versus account-scoped isolation and same-workspace owner/admin account-creator authorization;
- a separate later ownership-seed approval to create the development user, workspace, owner membership, and Journal account after empty initialization and before Phase 3;
- future Journal import, source-row, execution, provenance, Data Decision, round-trip/allocation, identity-alias, note, tag, rule, and review table names reserved but not created;
- UTC/IANA-timezone, UUID, exact decimal, explicit currency, isolation, module ownership, and no-dual-write rules; and
- the focused verification plan for migration identity/order, schema-digest stability and drift detection, runtime/initializer behavior, malformed UUID/timestamps, HMAC rotation, cross-workspace denial, and same-workspace authorization; and
- the exact implementation-file list and responsibilities recorded in the accepted design.

The documentation correction affects the existing five-document review package plus `AGENTS.md`, `module-contracts.md`, and `database-ownership.md`. No historical Phase 1 handoff was rewritten. No database, application code, migration file, test, environment file, dependency, or process was changed for this proposal.

## Database-foundation implementation checkpoint

The owner explicitly authorized the accepted Phase 2 database-foundation implementation on 2026-08-01. Initial boundary verification found the exact replacement path, branch `codex/traderlink-platform-replacement`, accepted design HEAD `f577335d8ad9a6e2d5a8d02717e04e57d8d3977b`, intended remote, no upstream, one independent worktree, and a clean working tree. The replacement private-data directory and `development.sqlite` were absent. PID 3160 remained present, while ports 3000, 3010, and 3011 had no listener at the implementation start; Codex did not stop or restart any process.

`npm ci --no-audit --no-fund` installed the exact lockfile once. `package.json` and `package-lock.json` remained unchanged, and `node_modules` remained ignored. The complete accepted production-file and ten-test batch was implemented and initially left unstaged for audit. No user, workspace, membership, Journal account, source identity, legacy data copy, environment file, server, or UI was created by the code-writing batch.

The owner changed only the timing of broad verification for this checkpoint. Run the following sequence once, sequentially, after the complete batch is ready:

1. `git diff --check`;
2. the static migration-file verifier;
3. the ten accepted files in one focused Vitest invocation;
4. initialization and verification against one new disposable external database; and
5. only after all prior steps succeed, initialization and verification of the real empty `development.sqlite`.

Do not run broad ESLint, full-project TypeScript, complete Vitest, build, browser/E2E, or CI-equivalent checks during this checkpoint. Those checks remain required at the final replacement-acceptance boundary; their timing is deferred, not removed.

### Focused verification results

- `git diff --check` passed before the focused sequence.
- The ordinary `npx.cmd tsx` static-verifier invocation reproduced the earlier Node 24.11.0 `uv_os_get_passwd ... ENOMEM` startup failure before TraderLink code loaded. The command-line data-URL shim did not reach this `tsx` version's isolated loader/child process. An equivalent temporary CommonJS preload outside the repository, supplied only through the verifier command's process environment, allowed the same installed `tsx` verifier to run. No project, global, or system setting changed.
- The static migration-file verifier passed for `0001_platform_identity` and `0002_journal_account_boundary`, including exact filenames, literal IDs, namespaces, and global execution order.
- The first accepted one-worker Vitest run completed with 9 files passing and one application test failing: the unmanaged-database runtime case returned `TRADERLINK_PLATFORM_INTEGRITY_FAILED` before `TRADERLINK_PLATFORM_UNMANAGED_SCHEMA`. Runtime validation was narrowly corrected to classify the managed schema before checking persistence pragmas.
- The complete accepted command was rerun with `--reporter=dot --maxWorkers=1 --no-file-parallelism`: all 10 files and all 41 tests passed. No broad suite ran.
- The owner-authorized legacy process tree was already stopped before verification: launcher PID 23608, legacy server PID 3160, and worker PID 29576 are absent. Ports 3000, 3010, and 3011 are clear. Codex did not restart them.

### Independent audit correction results

- The independent audit accepted the real empty-database evidence but identified missing focused cases, verifier pragma enforcement, machine-specific repository roots, and incomplete online-backup/recovery evidence.
- The correction pass did not initialize, recreate, or write the disposable or real database. It did not start a server, bootstrap identity data, copy legacy/private data, or perform a Git action.
- The read-only verifier now fails closed unless foreign keys, busy timeout, WAL, and synchronous `NORMAL` all match the accepted values. Its migration count follows the current manifest and the explicit empty-foundation table contract instead of a literal two-row check.
- Default repository protection is derived from the active module location and can be supplied an exact explicit root list for moved-repository tests and legacy/replacement coexistence.
- Online-backup evidence now records exact registry rows, every user-table count, expected/actual schema digests, pragma/WAL state, page geometry, integrity checks, timestamps, SQLite version, source/backup/restored file evidence, and byte identity for the backup/restored pair. It inventories non-superseded HMAC/canonicalizer version labels and requires a server-only recovery-authority callback without recording secrets or raw source identifiers. Maintenance state, destructive-plan acceptance, environment switching, and migration start remain later orchestrator responsibilities.
- Missing cases were added inside the accepted ten files: checksum tampering, unknown/out-of-order history, changed explicit index, existing zero-byte and zero-table initialization, unmanaged initializer rejection, verifier pragma rejection, retained/current canonicalizer matching/rotation and missing-canonicalizer rejection, portable moved-root protection, and backup/recovery evidence gates.
- The ordinary static-verifier invocation again failed in Node 24.11.0 startup with `uv_os_get_passwd ... ENOMEM` before TraderLink loaded. The established command-local preload was used only for the affected invocation and removed immediately; the static verifier then passed.
- The first correction-focused application run passed all 10 accepted files and all 53 tests using `--reporter=dot --maxWorkers=1 --no-file-parallelism`. No correction-pass application test failed.

### Disposable empty-foundation evidence

- Path: `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\verification\phase-2-empty-foundation.sqlite`.
- SQLite 3.53.0; 94,208-byte main file; 4,096-byte pages; 23 pages.
- Migration 1 checksum `e2ccbc367e274162b0a9141dc73eddf68bf5624ff4fca4ca06f97efe6d00cbb8`, post-schema digest `46c3d210d8af289b8048ea14a86e43313cb8076944ba983874fcaccae3b64466`.
- Migration 2 checksum `ff4bbc84114a8d99b5d06192fe3e3e094069c11a1a7eb1868fc35ce912c071d7`, final expected/actual schema digest `5a34f790164e9b8456db88a1052a9b9084bbfbeab4eae8c5eee1f49d5c7194c4`.
- Five domain tables all contain zero rows. `foreign_keys=1`, `busy_timeout=5000`, journal mode `wal`, and synchronous mode `NORMAL` (`1`). Foreign-key, quick, and integrity checks are `ok`.
- Main-file SHA-256 `0ABD8979FA56B099BBBC8EA2963E7AE44A5E3603694F41531A076D5627C0A4F0`. Read-only verification left a zero-byte WAL and 32,768-byte SHM sidecar.

### Real empty development database evidence

- Path: `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite`.
- SQLite version, migration checksums/post-schema digests, schema digest, pragmas, integrity results, page geometry, file size, table inventory, and all five zero domain counts match the disposable foundation.
- Main-file SHA-256 `426DA6848F9FC8D65C20B239D9F2949133ABAB5CD745FE38014AE4035549CF1B`. Read-only verification left a zero-byte WAL and 32,768-byte SHM sidecar.
- No user, workspace, membership, Journal account, source identity, owner/private value, or legacy row was created or copied.

## Checkpoint result and stop boundary

- [x] Preservation documentation committed without product code, private data, or logs.
- [x] Independent replacement clone created and accepted.
- [x] Legacy source backed up online while PID 3160 remained active.
- [x] Completed backup hashed and verified.
- [x] Backup restored to a disposable private-data target and reconciled.
- [x] No source or destination main database content, process, application, environment file, dependency, server, or production state changed. Later read-only verification created only the documented empty WAL/SHM sidecars beside the new backup and restored targets.
- [x] Owner accepted the corrected online-backup, restore-verification, and documentation checkpoint.
- [x] The accepted eight-file backup baseline was committed as `405acf08ce8ac7be6c984cb52082052d18642acc`; it was not pushed.
- [x] Exact replacement database schema and migration design prepared and linked.
- [x] Owner accepted the schema direction and the initial single-owner/owner-admin/member permission decisions.
- [x] Requested foundation corrections applied to the documentation review package.
- [x] Owner accepted the corrected exact schema/migration design, including schema digest, migration identity, initialization recovery, versioned account fingerprinting, `WorkspaceAccessScope`, permission model, ownership-seed gate, verification plan, and exact implementation-file list.
- [x] Schema design review is complete.
- [x] Database-foundation implementation explicitly authorized; exact production/test file batch prepared and left unstaged.
- [x] Static migration-file verification passed after an environment-only preload workaround; the earlier `ENOMEM` remains classified as a Node/Windows startup failure, not an application result.
- [x] Initial focused one-worker verification passed: 10 test files and the then-present 41 tests.
- [x] Independent-audit corrections passed static verification and the expanded 10-file/53-test focused run; the coordinating technical auditor accepted the code, database boundary, and test evidence under delegated owner authority.
- [x] The accepted 37-path implementation package was preserved locally in commit `fea56307fbd0142ef99b9f13c020451a6a503cc7`; it was not pushed or deployed.
- [x] Disposable empty-foundation database initialized and verified successfully.
- [x] Real empty `development.sqlite` initialized and verified only after every preceding focused check passed.
- [x] Phase 2 closed without owner/workspace/account rows; follow-on local-only preparation is tracked separately in [Development Owner Seed Progress](development-owner-seed-progress.md).
- [x] Development seed and independent verifier passed the static contract and all three focused files/all eleven tests with one worker; the coordinating technical auditor accepted the result.
- [x] Development seed backed up, previewed, explicitly confirmed, atomically executed, and independently verified at domain counts 1/1/1/1/0 with matching schema/migration digests.

The owner delegated technical code/database/test/Git checkpoint acceptance to the coordinating auditor. Personal owner involvement is reserved for irreversible or external actions and final visual/product approval. The Phase 2 empty database foundation and local-only development seed are technically complete; Phase 3 is unblocked. Public login is intentionally deferred until go-live preparation.
