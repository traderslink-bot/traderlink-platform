# TraderLink Database Ownership

**Phase:** Phase 1 inventory preserved; replacement database accepted through the local Phase 5 Slice F6 schema/tooling checkpoint
**Status:** Legacy recovery evidence remains read-only. The replacement foundation, owner seed, eighteen-migration module-owned schema, private statement import, exact reimport, append-only evidence vault, empty annotation/saved-view/market-fact/review/Level-Analysis/Academy/Watchlist/Affiliate/hosted-transfer foundations, one reconciled News article/version, and independent verification are technically accepted under delegated owner authority.
**Inspection rule:** The legacy source remains read-only. The verified replacement `development.sqlite` contains 18 migration rows, stable development ownership, one backfilled development authentication identity, zero public sessions, zero Discord memberships, one source-account identity, one accepted-with-decisions import, the accepted Phase 3 Journal evidence, and zero hosted-transfer events. Public owner linking, production-source transfer and deployment have not run and remain deferred.

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

The replacement local development database exists at:

`C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite`

That path is outside both source repositories, uses the permanent platform name rather than V3/V4 terminology, and contains one physical local database with the verified Platform/Journal foundation and explicit module-owned migrations. The coordinating technical auditor accepted its foundation, owner seed, and Phase 3 Journal runtime/database evidence. The private test statement is imported under the controlled Journal source identity and evidence-vault boundary; it is not a V3 database copy or dual write.

The current V3-named database is preserved as verified **legacy recovery evidence**, not as the replacement working database. Its accepted statement facts were imported through the gated Journal process; legacy rules, tags, notes, assignments and old saved trades were test data and were not copied.

At the accepted local Slice F6 schema/tooling checkpoint, the replacement main
file is 11,304,960
bytes with SHA-256
`bcbd40986840e1afb6cd169ea6a26f0ffbb8db9a8b367bc5acd971a7b4430664`.
Migrations 0017-0018 have immutable checksums
`b9599e947b4e45a4b9e4ee730d701682ad2d5e23cf68ac1c6fcbb3f68a37c6f4`
and `d79bb695d5c365343ad381801770281f8291a7c51d8212178b424747a3b8fca8`.
The current post-schema digest is
`7306385ce32329abe73a41fc3ec630c28dc4df7efaaad975b55f8f719dcdf4be`.
The four Level Analysis delivery/link tables, five Candle Review/market-fact
tables, two saved-view tables and all 13 annotation tables are empty. All accepted
execution/import/decision/round-trip counts are unchanged; foreign-key,
`quick_check` and `integrity_check` verification passed. Academy completion/
event tables and all three Watchlist tables remain empty. News has one current
article and one matching immutable version; both Affiliate tables, Discord
membership/session tables and the hosted-transfer ledger are empty. Verified
pre/post-0018 online backup and independent restore pairs are preserved. No
legacy trade, execution, tag, rule or note is a hosted-transfer source.

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
| `data/live-watchlist.sqlite` | 32,768 bytes | `live_watchlist_symbols`, `live_watchlist_health`, and `live_watchlist_archives`; all observed counts zero | Preserved legacy Watchlist evidence. F3 accepted explicit replacement storage and deliberately copied zero rows; do not use this file at runtime. |
| `data/private/trade-journal-v1.sqlite` | 49,152 bytes | 21 tag definitions, 4 tag assignments, 1 seed-state row; Day Session tables exist with no observed records | Preserved legacy test-data evidence only. The owner explicitly rejected recovery of these tags, assignments and old annotated trades. |

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

Replacement F2 ownership is now explicit: Platform owns
`platform_auth_identities` and `platform_auth_sessions`; Academy owns
`academy_lesson_completions` and `academy_lesson_completion_events`. Local
Academy access uses the guarded development Platform user and never uses a
Journal-named database fallback. Public access now uses the same Platform
identity/session boundary. Existing hosted Academy rows remain unchanged
read-only transfer inputs until the authorized production adoption runs.

### News schema

Current owner: News migration/repository boundary in `src/modules/news` and
`src/lib/news/news-article-store.ts`.

- `news_articles`, `news_article_versions`.

F4 local resolution uses the protected `TRADERLINK_PLATFORM_DB_PATH`; the old
`TRADERSLINK_NEWS_DB_PATH` is test-only isolation. The accepted single-node
hosted runtime uses that same Platform database. Academy, generic
Postgres/Neon, Journal-named and repository-local fallbacks are removed.
Ordinary runtime verifies rather than creates or alters schema. The one local
legacy article was reconciled into revision 1; existing hosted News rows remain
read-only transfer inputs until authorized adoption runs.

### Watchlist schema

Current owner: Watchlist migration/repository boundary, with compatibility
domain logic retained in `src/lib/live-watchlist/live-watchlist-store.ts`.

- `live_watchlist_symbols`, `live_watchlist_health`, `live_watchlist_archives`.

F3 local resolution uses the required external `TRADERLINK_PLATFORM_DB_PATH`;
an explicit `LIVE_WATCHLIST_DB_PATH` is limited to non-production focused
isolation and `:memory:` is test-only. The accepted single-node hosted runtime
uses that same Platform database. Academy, generic, V3/Journal-named and
repository-local fallbacks are removed. Ordinary requests verify rather than
create/alter schema. Production hosted rows remain unchanged read-only transfer
inputs until the authorized adoption runs.

### Affiliate schema

Current owner: Platform/Affiliate migration boundary in `src/modules/affiliate`
and `src/lib/affiliate-referrals/affiliate-referral-store.ts`.

- `affiliate_invites`, `affiliate_attributions`.

F4 local resolution and the accepted single-node hosted runtime use the
protected Platform database. Runtime DDL and Academy/generic/Journal-named/
repository-local fallbacks are removed. Attribution is keyed to stable Platform
user ID with immutable first touch. No local affiliate source table or row
existed, so both replacement tables begin empty. The old hosted Discord table
is a read-only transfer source; F6 maps only exact Platform identities and
leaves unresolved rows pending.

## Replacement ownership decision

TraderLink uses one physical local development SQLite database and, for the
accepted beta topology, one physical hosted SQLite database on a persistent
single-writer volume. Logical ownership and migrations remain explicit:

| Schema owner | Owns | May publish |
| --- | --- | --- |
| Platform | Users, sessions, preferences, access/account membership | Authenticated `WorkspaceAccessScope` and narrowed `AccountScope` |
| Journal | Source evidence, imports, executions, decisions, round trips, notes, tags, rules, reviews | Stable workspace/account-scoped execution, round-trip, and trading-day contracts |
| Journal Analytics | Rebuildable metric definitions and materialized summaries when justified | Exact metric rows, aggregates, coverage, limitations |
| Academy | Enrollment/progress/content-state records | Workspace summary and progress contracts |
| Watchlist | Watchlist symbols, health, archives, ingestion state | Workspace summary and symbol contracts |
| News | Article records and ingestion provenance | Article/search/summary contracts |
| Level Analysis | Provider deliveries and symbol facts | Versioned delivery facts; it does not own Journal trades |
| Account/Affiliate | Invites/referrals and account-facing relationships | Account-scoped referral status |

One module must never infer ownership from a generic fallback to `TRADER_INTELLIGENCE_DB_PATH`. The replacement configuration must name the platform database once, choose the module repository explicitly, and use module-owned migration namespaces/history.

## Completed Phase 2 database-creation prerequisites

1. Preserve the July 29 backup and exclude its `v4-temp-sql` experiment from source selection.
2. Use a SQLite online backup for the active configured database after process ownership is known and a backup checkpoint is authorized.
3. Record source path, timestamp, SHA-256, table counts, migration rows, WAL state, and tested restore steps.
4. Prove whether the repository-local 15,368,192-byte file is byte/logically identical to the private configured source.
5. Reconcile the January IBKR source statement to accepted executions, 334 closed/2 open round trips, contained decisions, and all coverage counts.
6. Keep the rejected legacy tag/rule/note/old-trade test data out of the replacement. Export or migrate only proven surviving News/Watchlist/Academy/affiliate facts under their named owners.
7. The schema/module contract and separate database-foundation implementation checkpoint were authorized, implemented, correction-verified, and technically accepted. The replacement database now contains only the verified empty foundation; do not edit the legacy source in place or dual-write silently.

## Phase 2 online-backup and restore checkpoint

- Source: `C:\Users\jerac\Documents\TraderLink\private-data\v3-dashboard\trading-rules-v1.sqlite`.
- Completed backup: `C:\Users\jerac\Documents\TraderLink\private-data\legacy-app\backups\phase-2-20260801T053759Z\trading-rules-v1-online-backup.sqlite`.
- Disposable restored target: `C:\Users\jerac\Documents\TraderLink\private-data\legacy-app\restore-verification\phase-2-20260801T053759Z\trading-rules-v1-restored.sqlite`.
- Backup method: existing `better-sqlite3` `Database.backup` binding over SQLite's online backup API, with the source opened read-only while PID 3160 remained running.
- Backup and restored SHA-256: `92B814735EFF41BAEAFB6BC1F2E8B7E0D4EFDD137416D0C0C80708DB50F5E737`.
- Immediately after the main backup and restore operations, no destination sidecars were observed. Later read-only verification of these WAL-mode databases created sidecars without changing either main database hash:
  - backup WAL: 0 bytes, created `2026-08-01T05:39:42.5618474Z`;
  - backup SHM: 32,768 bytes;
  - restored WAL: 0 bytes, created `2026-08-01T05:40:59.0642485Z`; and
  - restored SHM: 32,768 bytes.
- Do not delete these sidecars during the current correction checkpoint.
- Source, backup, and restored target have the same 34-object schema DDL digest, four ordered migration rows, all 24 table counts, 4,096-byte page size, 3,752 pages, and `quick_check=ok`.
- `PRAGMA schema_version` is SQLite's internal schema-cache cookie, not TraderLink's migration version. SQLite's online backup implementation deliberately updates a new destination's schema cookie, so source value 34 and destination value 1 do not indicate schema loss. The authoritative migration evidence is the matching `schema_migrations` rows, schema DDL digest, table counts, page geometry, hashes, and integrity checks. See [SQLite PRAGMA documentation](https://sqlite.org/pragma.html#pragma_schema_version) and [SQLite backup implementation evidence](https://sqlite.org/matrix/ev/src/backup.html).
- Full evidence and restore instructions are in [Phase 2 Replacement Baseline Progress](phase-2-replacement-baseline-progress.md).

## Phase 2 replacement foundation acceptance

The owner accepted the corrected exact [Replacement Database Schema and Migrations](replacement-database-schema-and-migrations.md) design package. The coordinating technical auditor subsequently accepted the implemented and correction-verified code, empty database, and 10-file/53-test evidence under delegated owner authority. Acceptance includes deterministic post-migration schema-drift verification, global migration identity and recovery rules, versioned privacy-safe account fingerprinting, server-derived `WorkspaceAccessScope`, the owner/admin/member permission model, the separate ownership-seed gate, the focused verification plan, and the exact implementation-file list.

The Phase 2 empty database foundation and follow-on [Development Owner Seed Progress](development-owner-seed-progress.md) checkpoint are technically complete. `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite` contains exactly two migration rows and domain counts 1 user / 1 workspace / 1 owner membership / 1 Journal account / 0 source-account identities. Its expected and actual schema digest remains `5a34f790164e9b8456db88a1052a9b9084bbfbeab4eae8c5eee1f49d5c7194c4`; the main file is 94,208 bytes with post-seed SHA-256 `2497FA605828C9392233F712062CC9FBEDDAB0F2B5E2078AB1A0146494A99C26`. No broker identity or private/legacy trading data was copied. Discord-first public login and optional email/password are deferred until the complete dashboard is preparing to go live.

The paragraph above is the immutable Phase 2 checkpoint, not current database
state. The following paragraph is the immutable Phase 3 checkpoint, not the
current F3 database state. Phase 3 used a fresh online backup/restore rehearsal before
applying migrations 3-6 and importing the accepted private development
statement. The current database has schema digest
`75571914c5fa4bbfe7876c8e9a72cc7d584eab91704d70cf889bf5f1b374a55a`,
main-file SHA-256
`31101395dafb7bb14c2bf934e3288b40f63a5f8736a1da03cf549c996463af3b`,
size 10,522,624 bytes, a zero-byte WAL, and a 32,768-byte SHM. It contains six
migrations, the stable owner/workspace/account, one source identity, one
accepted-with-decisions import, 2,284 source rows, 1,072 Stock executions, 231
position facts, 542 preserved unsupported Forex records, 331 ready closed round
trips, and two contained decisions.

Local-only authority configuration is stored under
`C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform-config`.
Append-only statement evidence is stored under the non-overlapping sibling
`C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform-import-artifacts`.
Neither location belongs in Git. Never print or commit secret values, raw broker
identifiers, identity fingerprints, internal UUIDs, or the private statement
filename. Recovery evidence and exact paths are recorded in the
[Phase 3 progress tracker](phase-3-journal-integrity-progress.md).

The completed Slice D private-source preparation enforced that ownership
boundary. It performed an unscoped privacy-safe parse preview and, only after
verified backup and migrations, inventoried the seeded workspace. Initial
source-identity creation required exactly one active Journal account, zero
non-superseded identities for the source system, and no fingerprint conflict.
Its post-link rerun proved the idempotent no-write path: exactly one identity
resolved unambiguously under the complete configured retained HMAC authority to
the same sole account. Every other account, multiple-identity,
unavailable-authority, mismatch, conflict, or ambiguity path remains fail-closed
for factual trader review or recovery. Exactly one link was verified before the
scoped read-only preview. This broker source-account link is
Journal data ownership, not login authentication; the local development owner
remains authoritative while Discord/email integration is deferred.

## Phase 1 conclusions

- The current application is not using `v4-temp-sql`. It exists only inside the July 29 backup, is not configured, and is rejected as a migration source.
- The current local source is still a V3-named, V3-configured SQLite database outside the repository.
- The loaded January IBKR data exists, but its current schema and derived trades are legacy migration inputs, not automatically trusted replacement outputs.
- Current fallbacks allow unrelated modules to share that Journal database. Fixing this ownership ambiguity is required in the replacement baseline.
- The locked active file is readable but cannot yet receive an accepted immutable hash. This is an expected backup/checkpoint task, not a reason to stop a process during the read-only inventory phase.
