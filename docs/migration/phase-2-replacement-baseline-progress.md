# Phase 2 Replacement Baseline Progress

**Phase:** 2 - Replacement baseline
**Status:** In progress; the preservation/clone, corrected legacy backup/restore, and corrected exact replacement schema/migration design checkpoints are owner-accepted. Schema design review is complete; database-foundation implementation is the next separately authorized checkpoint
**Authorized:** 2026-08-01, explicitly by the project owner
**Current boundary:** Documentation acceptance only. Migration/database implementation has not started; do not create the replacement development database or implement migration code until that separate checkpoint is explicitly authorized

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
- The selected replacement database remains absent. No schema or replacement data was created.
- PID 3160 remained running and listening on `127.0.0.1:3000` throughout the first backup attempt. It was not stopped or restarted.

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

The owner accepted the corrected exact [Replacement Database Schema and Migrations](replacement-database-schema-and-migrations.md) design. This acceptance completes schema design review; it does not authorize database creation or implementation.

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
- a separate later owner-bootstrap approval to create the real user, workspace, owner membership, and Journal account after empty initialization and before Phase 3;
- future Journal import, source-row, execution, provenance, Data Decision, round-trip/allocation, identity-alias, note, tag, rule, and review table names reserved but not created;
- UTC/IANA-timezone, UUID, exact decimal, explicit currency, isolation, module ownership, and no-dual-write rules; and
- the focused verification plan for migration identity/order, schema-digest stability and drift detection, runtime/initializer behavior, malformed UUID/timestamps, HMAC rotation, cross-workspace denial, and same-workspace authorization; and
- the exact implementation-file list and responsibilities recorded in the accepted design.

The documentation correction affects the existing five-document review package plus `AGENTS.md`, `module-contracts.md`, and `database-ownership.md`. No historical Phase 1 handoff was rewritten. No database, application code, migration file, test, environment file, dependency, or process was changed for this proposal.

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
- [x] Owner accepted the corrected exact schema/migration design, including schema digest, migration identity, initialization recovery, versioned account fingerprinting, `WorkspaceAccessScope`, permission model, owner-bootstrap gate, verification plan, and exact implementation-file list.
- [x] Schema design review is complete.
- [ ] Replacement `development.sqlite` creation and migration/database implementation remain the next separately authorized checkpoint and have not started.
- [ ] Real owner/workspace/account bootstrap remains prohibited until its later separate approval after empty initialization.
