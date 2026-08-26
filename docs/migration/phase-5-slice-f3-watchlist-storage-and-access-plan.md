# Phase 5 Slice F3 Watchlist Storage And Access Plan

**Status:** Locally accepted through Phase 6 focused/integrated verification; hosted production adoption remains external

**Scope:** Phase 5 Slice F3 only

**Parent plan:** [Remaining Modules Plan](phase-5-slice-f-remaining-modules-plan.md)

**Current dashboard integration record:** [Watchlist Dashboard Integration Progress](watchlist-dashboard-integration-progress.md)

## Outcome

Preserve the existing useful Watchlist experience while giving its
storage, publisher mutations and access decisions explicit owners. Runtime
Watchlist code must no longer create or alter schemas as a side effect of a
page/API request and must never borrow Academy, generic, V3, Journal or
repository-local storage.

This slice does not redesign the Watchlist UI, activate public Platform login,
change the member-access product policy or deploy anything. The owner later
set that policy: the Watchlist is free for verified TradersLink Discord server
members; the owner-only Admin Watchlist remains separate.

The later Dashboard integration preserves the same Watchlist routes, data,
access service and publisher contract. It changes only the signed-in shell and
the owner-only Dashboard navigation visibility; its progress record is kept
separate so this accepted storage/access plan stays the source of truth for
the persistent Watchlist boundary.

## Product boundary

The Watchlist is shared premium market content. It is not a trader's imported
execution data, does not belong to a Journal account and does not change when a
user switches Journal accounts.

Watchlist owns:

- current symbols and their complete published state;
- global market-data health;
- archive snapshots and the three-day archive retention policy;
- publisher ingestion, recap and authorized archive reset behavior;
- Watchlist-specific provider facts and revision ordering.

Platform owns:

- stable users and authentication identities;
- the verified TradersLink Discord-server membership decision;
- the guarded login-free local-development identity;
- the future Discord-to-Platform identity activation in Slice F6.

Journal, Journal Analytics and Academy do not own or query Watchlist records.
Watchlist does not write executions, round trips, lesson progress or Journal
annotations.

## Verified current inventory

Preserve these routes and behaviors:

- `/watchlist`
- `/watchlist/[symbol]`
- `/watchlist/archive`
- `/watchlist/archive/[archiveId]`
- `/watchlist/how-it-works`
- `GET /api/live-watchlist`
- `GET /api/live-watchlist/symbols/[symbol]`
- `GET /api/live-watchlist/stream`
- `POST /api/live-watchlist/ingest`
- `GET /api/live-watchlist/recap`
- `POST /api/live-watchlist/archive/reset`

The current store maintains three tables: `live_watchlist_symbols`,
`live_watchlist_health` and `live_watchlist_archives`, plus an archive lookup
index. The hosted path also has a symbol revision column used for concurrent
publisher writes. Current runtime code creates or modifies these objects on
first access.

The preserved legacy local Watchlist database is
`C:\Users\jerac\Documents\TraderLink\traderslink.pro\data\live-watchlist.sqlite`.
It is 32,768 bytes, passes `quick_check` and has zero rows in all three tables.
It is preservation evidence only and is not copied into the replacement.

No current process environment provides a Watchlist database URL, Watchlist
path override, Premium role or generic database URL. This does not prove that
the deployed production environment or hosted database is empty.

## Problems this slice corrects

1. Local storage can inherit `TRADER_INTELLIGENCE_DB_PATH`, coupling Watchlist
   to the rejected engine/database boundary.
2. Hosted storage can inherit Academy or generic database URLs without naming
   Watchlist ownership.
3. Local storage defaults to a database inside the repository.
4. SQLite and hosted schemas are created or altered during ordinary access.
5. Page/API access decisions depend directly on the legacy Academy session
   type instead of a Watchlist/Platform access contract.
6. SQLite and hosted symbol schemas differ because only hosted storage records
   the concurrency revision.
7. Production rows have not been inventoried or backed up from this local
   environment and therefore cannot safely be adopted, rewritten or deleted.

## Storage contract

### Replacement development database

Migration `0014_watchlist_storage` adds these Watchlist-owned objects to the
existing replacement `development.sqlite`:

- `live_watchlist_symbols`
- `live_watchlist_health`
- `live_watchlist_archives`
- `live_watchlist_archives_symbol_archived_at_idx`

The symbol table includes the revision column in both SQLite and hosted
storage. JSON payloads remain lossless compatibility envelopes for the
existing publisher and clients. Symbols are canonical uppercase tokens,
timestamps are non-negative Unix milliseconds and revisions are non-negative
integers. The archive table preserves immutable snapshots; retention cleanup
and authorized reset remain deliberate commands.

The Platform migration registry owns initialization order and schema digest.
Ordinary Watchlist reads and writes verify the completed schema and never run
DDL.

### Explicit configuration

Local replacement runtime uses the already required
`TRADERLINK_PLATFORM_DB_PATH`. An explicit `LIVE_WATCHLIST_DB_PATH` remains
allowed only for focused non-production isolation and must never resolve
inside a repository. `:memory:` is accepted only while `NODE_ENV=test`.

Hosted runtime uses only `LIVE_WATCHLIST_DATABASE_URL`. It must not fall back
to `ACADEMY_DATABASE_URL`, `DATABASE_URL`, `TRADER_INTELLIGENCE_DB_PATH` or a
repository-local file. Production SQLite is rejected.

An explicit hosted initialization/adoption command, not an ordinary request,
owns hosted DDL. Runtime verifies the required tables, columns and index before
serving or accepting mutations. Existing hosted rows must first pass the Phase
6 backup, schema/count/revision and restore gates.

### Data preservation

- Copy zero rows from the legacy local Watchlist database.
- Do not connect to or mutate the production Watchlist database in Slice F3.
- Do not infer production emptiness from local emptiness.
- Preserve existing state JSON and archive semantics so production rows can be
  transferred without lossy field conversion.
- Stop if a future production inventory finds an incompatible schema, invalid
  JSON, duplicate identity or revision regression.

## Access contract

Watchlist access is available to a stable Platform user with a current verified
membership in the configured TradersLink Discord server. It is global to that
user and is never scoped to a workspace or Journal account. A Premium role is
not required.

For local review, only the guarded loopback development boundary may derive
the seeded development Platform user. No Discord login is required locally.

Production pages and Watchlist APIs use the Watchlist access service rather
than importing Academy session storage directly. That service requires the
existing exact Discord provider/session identity and current configured-server
membership evidence; it does not use a display name, email, fuzzy match or
Premium role. The ordinary Watchlist navigation entry is visible to those
members. The Admin Watchlist page, its navigation entry and its runtime relay
remain restricted to the separate stable two-owner Discord-subject allowlist.

Authenticated stream/list/symbol reads use the user access contract. Publisher
ingest, recap and archive reset continue to require the exact publisher bearer
token and never accept a browser session as mutation authority. Tokens and raw
authentication subjects are never logged or persisted as evidence.

## Implementation sequence

1. Add and statically verify migration `0014_watchlist_storage`.
2. Add Watchlist-owned storage configuration and schema-verification helpers.
3. Refactor the existing store to use those helpers without changing domain
   patch, reconciliation, archive or recap semantics.
4. Add the Platform-owned Watchlist access result and the temporary production
   Discord compatibility adapter.
5. Route pages and read APIs through the access service without UI redesign.
6. Keep publisher routes on their explicit machine token and verify that user
   sessions cannot authorize publisher mutations.
7. Run focused static/type/lint verification, disposable database proof and
   real replacement database migration/verification. Focused Vitest execution
   remains policy-deferred if the active agent instruction continues to block
   it.
8. Create and restore-verify pre/post migration backups before recording the
   technical checkpoint.

## Acceptance gates

- No active Watchlist import references V3 analytics or V3 storage.
- No Watchlist storage resolver references Academy, generic or Journal paths.
- No working database is created inside either repository.
- A normal request executes no `CREATE`, `ALTER` or migration DDL.
- Local loopback review works under the seeded Platform user without Discord.
- Production Watchlist access requires verified TradersLink Discord-server
  membership and does not require a Premium role.
- The ordinary Watchlist navigation entry is visible to verified members;
  Admin Watchlist and its relay remain owner-only.
- Journal-account switching does not alter Watchlist data or access.
- Publisher token routes remain separate from user routes.
- Current/symbol/archive/recap/health/revision behavior remains covered.
- The replacement database, backup and restored copy pass migrations, schema
  digest, `foreign_key_check`, `quick_check` and exact table-count comparison.
- Production storage remains untouched until the separately recorded Phase 6
  preservation and transfer gate.

## Rollback

Before applying migration `0014`, create and restore-verify a replacement
database backup. If migration or runtime verification fails, stop all writers,
restore that verified backup to a new target and return the launcher to the
pre-F3 database path. Never delete the failed database or overwrite the backup.

Hosted rollback is not exercised in this slice. Phase 6 must create a hosted
backup/export with schema and row evidence before any hosted schema adoption or
data transfer.

## Technical completion checkpoint

Migration `0014_watchlist_storage` is applied as the only F3 database change.
Its immutable checksum is
`84c03b1338ef1c73bccb80e4ca68a6090f90fb0a608fbe56a1bf78325b4829b3`
and the current post-schema digest is
`02c03c5e02ea31050b03f3c3662517da1813d240e004bff2658508acc67f6b25`.
The real replacement database has 14 migrations, 55 domain tables and 56
total application tables. Its main file is 11,190,272 bytes with SHA-256
`b0164b6f77ee91153b882a6a4a12caee210ce9423c949f3d971b15322b377afe`.

All three Watchlist tables begin empty. Journal remains at 1,072 executions,
333 round trips and two Data Decisions; Academy remains at zero completions.
The revision column, archive index, archive-update immutability trigger,
foreign keys, schema digest, `quick_check`, `integrity_check` and the complete
migration registry pass.

The pre-F3 backup and restored copy are byte-identical at SHA-256
`04511ecfc0b17af3586a46f31442b664bf4f7910e6809cc624f12d139be315fa`
under the `phase-5-f3-20260802T142726Z` backup and restore-verification
directories. The post-F3 backup and restored copy are byte-identical at
SHA-256
`58ee0ab12aea89181e8af594a33fcbda07ef954c9746745f1b684d4df0831790`
under the matching `phase-5-f3-20260802T142910Z` directories.

A fresh disposable database initialized all 14 migrations with the same
schema digest and every domain table empty. A separate disposable runtime
proof preserved `closed` market health, round-tripped a current symbol,
created an eligible immutable archive and exercised authorized archive reset.
No real Watchlist row was created.

Dependency-scoped TypeScript, targeted lint, static migration verification,
the 107-file active no-V3 gate and real/disposable database proofs pass. One
new two-case access test and the existing Watchlist persistence/concurrency
tests are updated, but Vitest execution remains policy-deferred to Phase 6.
No production database, public identity, process, port, Git stage/commit/push
or deployment changed.
