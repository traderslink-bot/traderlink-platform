# TraderLink Database Ownership

**Phase:** 1 - inventory and baseline  
**Status:** Current local evidence recorded; replacement development path selected but not created  
**Inspection rule:** All Phase 1 database inspection is read-only. No copy, migration, pragma change, process stop, or database write was performed.

## Direct answer about `v4-temp-sql`

No `v4-temp-sql` directory exists at either active-project location:

- `C:\Users\jerac\Documents\TraderLink\traderslink.pro\v4-temp-sql`
- `C:\Users\jerac\Documents\TraderLink\v4-temp-sql`

A direct two-level search under `C:\Users\jerac\Documents\TraderLink` also found no folder with the expected V4/SQL naming. No source or environment reference to `v4-temp-sql` was found.

The owner then identified its actual location as a mistakenly used backup folder. Targeted read-only inspection confirmed:

| Path | Size | Disposition |
| --- | ---: | --- |
| `C:\Users\jerac\Documents\traderslink.pro back up july 29\v4-temp-sql\dashboard-test.sqlite3` | 749,568 bytes | Early experimental database; not configured and owner-rejected as a migration source |
| `C:\Users\jerac\Documents\traderslink.pro back up july 29\v4-temp-sql\load_ibkr_executions.py` | 15,595 bytes | Early loader reference only |
| `C:\Users\jerac\Documents\traderslink.pro back up july 29\v4-temp-sql\[redacted-account]_202601_202601_January.csv` | 239,292 bytes | Private statement evidence inside the backup; preserve privately and do not commit |

The owner described this as an early-stage experiment containing no required replacement data. Its internal row population is irrelevant to source selection and was not accepted as migration evidence. Therefore, **`v4-temp-sql` is not the current database and will not be used for the replacement**. Preserve it as part of the July 29 backup; do not copy its name or wire it into configuration.

## Current configured local runtime

`.env.local` is the only repository environment file found. Secrets and identity values were not printed. The relevant configured modes are:

| Setting | Current safe value/state |
| --- | --- |
| `TRADER_INTELLIGENCE_DEPLOYMENT_PROFILE` | `private_owner_alpha` |
| `TRADER_INTELLIGENCE_HOSTING_MODE` | `local_only` |
| `TRADER_INTELLIGENCE_STORAGE_MODE` | `local_sqlite` |
| `TRADER_INTELLIGENCE_DATA_MODE` | `real_owner_data` |
| `TRADER_INTELLIGENCE_DB_PATH` | `C:\Users\jerac\Documents\TraderLink\private-data\v3-dashboard\trading-rules-v1.sqlite` |
| `TRADER_INTELLIGENCE_RULES_DB_PATH` | Same private V3-era database path |
| Owner/origin/account/instrument settings | Present; values withheld from documentation |
| `TRADER_INTELLIGENCE_JOURNAL_DB_PATH` | Absent |
| Academy, News, Watchlist, affiliate, general database URLs | Absent in `.env.local` |
| News and Watchlist local path overrides | Absent in `.env.local` |

This configuration means the current import repository, saved trades/reports, Level Analysis persistence, and trading rules resolve to the private V3-era database. Trade tags and Day Session notes use a separate repository-local fallback. Academy, News, Watchlist, and affiliate local storage can also fall back to `TRADER_INTELLIGENCE_DB_PATH` when their own settings are absent. That cross-module fallback is a significant coupling hazard even when their tables have not yet been created in the configured file.

## Selected replacement development database

The replacement local development database will be created at:

`C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite`

That path does not exist at the Phase 1 checkpoint. It is outside both source repositories, uses the permanent platform name rather than V3/V4 terminology, and will contain one physical local database with explicit module-owned migrations and repositories. Creation, schema initialization, or data migration requires explicit Phase 2 authorization.

The current V3-named database is accepted as a possible **migration input**, not as the replacement working database. It must first pass online-backup, restore, provenance, and source-statement reconciliation gates.

## Current database/file inventory

### Active configured source candidate

| Property | Evidence |
| --- | --- |
| Path | `C:\Users\jerac\Documents\TraderLink\private-data\v3-dashboard\trading-rules-v1.sqlite` |
| Size | 15,368,192 bytes |
| User tables | 24 |
| Current access | Read-only SQLite queries succeeded; direct file hashing was blocked because another process holds the file |
| WAL/SHM | Present; WAL was zero bytes at observation time |
| Role | Current configured local source for V3 import/saved-trade/report storage, Level Analysis tables, and rules |
| Replacement disposition | Legacy source candidate. Freeze and back up with SQLite online backup at an authorized checkpoint; never let the replacement share writes with it. |

Fresh read-only counts at the Phase 1 snapshot:

| Table/capability | Rows |
| --- | ---: |
| `normalized_executions` | 1,072 |
| `saved_trades` | 336 |
| `saved_trade_execution_links` | 1,072 |
| `import_batches` | 2 |
| `import_rows` | 1,312 |
| `import_issues` | 141 |
| `import_repair_items` | 141 |
| `decision_review_jobs` | 336 |
| `execution_feedback_summaries` | 336 |
| `trade_grouping_diagnostics` | 336 |
| `saved_reports` | 1 |
| `route_read_model_metadata` | 1 |
| `owner_workspace_accounts` | 1 |
| Current rules records | 0 |
| Current notes/review-state records | 0 |
| Recorded schema migrations | 4 |

The 336 saved trades include the previously observed 334 closed and 2 open trades, but Phase 1 has not re-derived those two state counts independently from source executions. Those values remain reconciliation targets, not yet replacement acceptance proof.

### Repository-local files

| Path | Size | Observed contents | Ownership/disposition |
| --- | ---: | --- | --- |
| `data/v3-dashboard/trading-rules-v1.sqlite` | 15,368,192 bytes | Same table counts and timestamp/size as the configured private file; hash equality not established because the configured source is locked | Untracked duplicate/copy candidate. Preserve until provenance and exact equality are proven; never use as the replacement working database. |
| `data/v3-dashboard/trading-rules-v1-backup-2026-07-30.sqlite` | 1,757,184 bytes | 1 batch, 240 import rows, 138 issues/repair items, no normalized executions, saved trades, or reports | Historical pre-load backup candidate. Preserve until snapshot lineage is recorded. |
| `data/v3-dashboard/trading-rules-v1.sqlite.2026-07-31T02-51-04-825Z.before-temporary-ibkr-load.bak` | 1,757,184 bytes | 24 tables; 1 batch, 240 import rows, 138 issues/repair items, no normalized executions, saved trades, links, reports, or route metadata | Timestamped backup made immediately before the temporary load. SHA-256 `76734F9E462BD8FDA687DB0DD417C9393E79E55B9B26DB7652DF013FD1002A18`; preserve as the clearest pre-load snapshot. |
| `data/trader-intelligence.sqlite` | 348,160 bytes | 29 tables; one `news_articles` row; Journal/auth/reflection tables otherwise effectively empty in the observed counts | Mixed legacy local fallback. Do not treat as the Journal source. Preserve News evidence until reconciled. |
| `data/live-watchlist.sqlite` | 32,768 bytes | `live_watchlist_symbols`, `live_watchlist_health`, and `live_watchlist_archives`; all observed counts zero | Watchlist local fallback. Preserve until Watchlist storage baseline is accepted. |
| `data/private/trade-journal-v1.sqlite` | 49,152 bytes | 21 tag definitions, 4 tag assignments, 1 seed-state row; Day Session tables exist with no observed records | Current trade-tag/Day Session fallback. Journal-owned data requiring migration into the future Journal schema. |

Associated `-wal` and `-shm` files are present for the repository-local databases. All observed WAL files were zero bytes. Working SQLite databases and their sidecars do not belong in the repository under the replacement plan, but no file may be moved or deleted until backup, provenance, reader/writer, and reconciliation gates are met.

The similarly sized `trading-rules-v1-backup-2026-07-30.sqlite` has a different SHA-256 (`1B66DFA0D5A182F39780597FFF38227974001040AADB68E470B4B1FB6BDB2084`), so the two 1,757,184-byte backups must not be treated as byte-identical merely because their observed row counts match.

## Current schema families and writers

### V3 import, saved-trade, review, and read-model schema

Current owner: `src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository.ts`.

Tables created by its migrations:

- `schema_migrations`.
- `import_batches`, `import_rows`, `import_issues`, `import_repair_items`, `import_repair_events`.
- `normalized_executions`.
- `saved_trades`, `saved_trade_execution_links`, `trade_grouping_diagnostics`.
- `execution_feedback_summaries`.
- `decision_review_jobs`, `decision_review_snapshots`, `decision_review_diagnostics`.
- `saved_reports`, `route_read_model_metadata`.
- `saved_trade_notes`, `trade_review_item_states`.
- `owner_workspace_accounts`, `csv_mapping_templates`.

The repository opens the resolved database read/write, switches to WAL, runs migrations at access time, and is called by import, trades, reports, review, and Level Analysis code. It depends on V3 local-persistence path validation. This schema is legacy migration input, not the final canonical Journal schema.

### Level Analysis schema

Current owner: `src/lib/level-analysis`.

- `level_analysis_delivery_records`.
- `level_analysis_delivery_symbol_summaries`.
- `journal_level_analysis_trade_links`.

These repositories call the same Trader Intelligence database accessor and migrations, so they currently share the configured V3 database. Future owner: Level Analysis owns delivery facts; Journal owns the stable link to a Journal round trip/execution identity.

### Trading Rules schema

Current owners: `src/lib/trader-intelligence-rules` plus types/replay logic imported from V3.

- `ti_v3_execution_rule_commands`.
- `ti_v3_manual_custom_rules`.
- `ti_v3_manual_custom_rule_versions`.
- `ti_v3_manual_custom_rule_lifecycle_events`.

The execution-rule repository resolves `TRADER_INTELLIGENCE_RULES_DB_PATH`, then `TRADER_INTELLIGENCE_DB_PATH`, and validates it through the V3 persistence policy. Future owner: Journal. Preserve rule/version/lifecycle history without requiring the V3 dashboard engine.

### Trade tags and Day Session schema

Current owners: `src/lib/trader-intelligence-tags` and `src/lib/trader-intelligence-day-session-journal`.

- `ti_v3_trade_tags`, `ti_v3_trade_tag_assignments`, `ti_v3_trade_tag_seed_state`.
- `ti_v3_day_session_notes`, `ti_v3_day_session_rule_reviews`.

Without `TRADER_INTELLIGENCE_JOURNAL_DB_PATH`, both use `data/private/trade-journal-v1.sqlite`. The tag repository can copy a legacy LocalAppData database into that repository path when the target does not exist. This automatic copy and repository-local working database must be replaced by an explicit, auditable migration. Future owner: Journal.

### Academy identity/progress schema

Current owner: `src/lib/academy/academy-progress-store.ts`.

- `academy_users`, `academy_sessions`, `academy_lesson_completions`.

Hosted resolution: `ACADEMY_DATABASE_URL`, then `DATABASE_URL`. Non-production SQLite fallback: `TRADER_INTELLIGENCE_DB_PATH`, then `data/trader-intelligence.sqlite`. Future owner: Platform identity for the user/session facts and Academy for lesson completion; the public module contract must hide physical table placement.

### News schema

Current owner: `src/lib/news/news-article-store.ts`.

- `news_articles`.

Hosted resolution includes News/Postgres/Neon/Academy/general URLs. Local resolution uses `TRADERSLINK_NEWS_DB_PATH`, then `TRADER_INTELLIGENCE_DB_PATH`, then `data/trader-intelligence.sqlite`. Future owner: News. Remove the dependency on a Journal-named fallback.

### Watchlist schema

Current owner: `src/lib/live-watchlist/live-watchlist-store.ts`.

- `live_watchlist_symbols`, `live_watchlist_health`, `live_watchlist_archives`.

Hosted resolution: `LIVE_WATCHLIST_DATABASE_URL`, Academy URL, then general URL. Local resolution: `LIVE_WATCHLIST_DB_PATH`, then `TRADER_INTELLIGENCE_DB_PATH`, then `data/live-watchlist.sqlite`. Future owner: Watchlist. Remove the dependency on a Journal-named fallback.

### Affiliate schema

Current owner: `src/lib/affiliate-referrals/affiliate-referral-store.ts`.

- `affiliate_invites`, `affiliate_discord_referrals`.

Hosted resolution: affiliate URL, Academy URL, then general URL. Local resolution can use `TRADER_INTELLIGENCE_DB_PATH`. Future owner: Platform/Account pending product review. Remove the Journal-named fallback.

## Replacement ownership decision

TraderLink may use one physical local development SQLite database and one physical hosted SQL database, but logical ownership and migrations must be explicit:

| Schema owner | Owns | May publish |
| --- | --- | --- |
| Platform | Users, sessions, preferences, access/account membership | Authenticated owner/account context |
| Journal | Source evidence, imports, executions, decisions, round trips, notes, tags, rules, reviews | Stable owner-scoped execution/round-trip/day contracts |
| Journal Analytics | Rebuildable metric definitions and materialized summaries when justified | Exact metric rows, aggregates, coverage, limitations |
| Academy | Enrollment/progress/content-state records | Workspace summary and progress contracts |
| Watchlist | Watchlist symbols, health, archives, ingestion state | Workspace summary and symbol contracts |
| News | Article records and ingestion provenance | Article/search/summary contracts |
| Level Analysis | Provider deliveries and symbol facts | Versioned delivery facts; it does not own Journal trades |
| Account/Affiliate | Invites/referrals and account-facing relationships | Account-scoped referral status |

One module must never infer ownership from a generic fallback to `TRADER_INTELLIGENCE_DB_PATH`. The replacement configuration must name the platform database once, choose the module repository explicitly, and use module-owned migration namespaces/history.

## Required migration checkpoint before Phase 2 database creation

1. Preserve the July 29 backup and exclude its `v4-temp-sql` experiment from source selection.
2. Use a SQLite online backup for the active configured database after process ownership is known and a backup checkpoint is authorized.
3. Record source path, timestamp, SHA-256, table counts, migration rows, WAL state, and tested restore steps.
4. Prove whether the repository-local 15,368,192-byte file is byte/logically identical to the private configured source.
5. Reconcile the January IBKR source statement to accepted executions, 334 closed/2 open round trips, contained decisions, and all coverage counts.
6. Export/migrate the 4 current tag assignments and any surviving News/Watchlist/Academy/affiliate facts under their named owners.
7. Create the replacement database only after the schema/module contract is owner-accepted; do not edit the legacy source in place or dual-write silently.

## Phase 1 conclusions

- The current application is not using `v4-temp-sql`. It exists only inside the July 29 backup, is not configured, and is rejected as a migration source.
- The current local source is still a V3-named, V3-configured SQLite database outside the repository.
- The loaded January IBKR data exists, but its current schema and derived trades are legacy migration inputs, not automatically trusted replacement outputs.
- Current fallbacks allow unrelated modules to share that Journal database. Fixing this ownership ambiguity is required in the replacement baseline.
- The locked active file is readable but cannot yet receive an accepted immutable hash. This is an expected backup/checkpoint task, not a reason to stop a process during the read-only inventory phase.
