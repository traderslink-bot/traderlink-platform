# Phase 2 Replacement Baseline Progress

**Phase:** 2 - Replacement baseline
**Status:** In progress; the preservation/clone checkpoint is owner-accepted and the corrected legacy backup/restore documentation checkpoint awaits owner review
**Authorized:** 2026-08-01, explicitly by the project owner
**Current boundary:** Documentation and legacy SQLite online-backup/restore verification only; do not create the replacement development database until the next owner checkpoint

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
- Remote: `https://github.com/traderslink-bot/traderslink-trader-improvement-system.git`.
- The checkout was clean when the owner accepted the clone checkpoint.
- It is a full, non-shallow, independent clone with its own `.git` directory and object pack, no alternates, no hardlinks, and no registration in the legacy repository's worktree list.
- No upstream was configured and no push, deployment, dependency installation, or server start occurred.
- The backup documentation checkpoint initially added or updated this progress file, the master plan, `migration-progress.md`, and `migration-register.md`. The owner-requested correction also updates `AGENTS.md`, `database-ownership.md`, `workspace-inventory.md`, and `workspace-and-worktree-cleanup-plan.md`. These eight documentation changes remain uncommitted pending owner review.

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

## Checkpoint result and stop boundary

- [x] Preservation documentation committed without product code, private data, or logs.
- [x] Independent replacement clone created and accepted.
- [x] Legacy source backed up online while PID 3160 remained active.
- [x] Completed backup hashed and verified.
- [x] Backup restored to a disposable private-data target and reconciled.
- [x] No source or destination main database content, process, application, environment file, dependency, server, or production state changed. Later read-only verification created only the documented empty WAL/SHM sidecars beside the new backup and restored targets.
- [ ] Owner reviews and accepts this backup/restore checkpoint.
- [ ] Replacement `development.sqlite` creation remains prohibited until that acceptance and explicit continuation.
