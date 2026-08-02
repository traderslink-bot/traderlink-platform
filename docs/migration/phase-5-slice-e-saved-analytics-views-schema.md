# Phase 5 Slice E Saved Analytics Views Schema

**Status:** Accepted and disposable proof complete; real migration application authorized
**Migration:** `0008_journal_analytics_saved_views`
**Module namespace:** `journal`
**Execution order:** 8

## Outcome

Analytics Lab views are durable, versioned settings owned by the trader's
selected user-defined Journal account. They are not broker records and do not
move between accounts based on statement provenance. Legacy V3 JSON saved
views were test state and are not copied. Both replacement tables therefore
start empty.

## Persisted query contract

The persisted query version is `analytics_lab_view_v1`. The normalized JSON
contains exactly the accepted Analytics Lab filter and presentation fields:

- metric, grouping and gross/net basis;
- currency, ticker, direction, execution provenance and realized outcome;
- entry weekday, entry-time interval and optional entry-time bucket;
- inclusive closing-date range;
- exact optional holding-duration, entered-quantity, maximum-position and
  entry-notional bounds; and
- evidence row limit.

The opaque `expectedAccountSelectionRef` is never stored. It is request state,
not view content. Saving validates the supplied selection reference, runs the
same strict query normalizer used for execution, removes the reference and
serializes the remaining fields in one fixed property order. Loading injects a
fresh server-derived selection reference before returning a query to the
browser and validates the reconstructed query again.

Canonical JSON uses `JSON.stringify` on the fixed-order normalized object with
no added whitespace. `query_sha256` is the lowercase hexadecimal SHA-256 of
the exact UTF-8 JSON bytes. Unknown fields, invalid enum values, noncanonical
decimal strings, invalid date/range combinations or a digest mismatch fail;
they are never repaired or guessed.

## Table `journal_analytics_saved_views`

- `saved_view_id`: canonical UUID v4 primary key.
- `workspace_id`, `account_id`: composite Journal-account owner.
- `current_version_id`: immutable version currently presented.
- `lifecycle_state`: `active` or `retired`.
- `revision`: positive optimistic-concurrency revision.
- `created_by_user_id`: server-derived author.
- `created_at_utc`, `updated_at_utc`: canonical millisecond UTC timestamps.

The row has a composite foreign key to `journal_accounts`, an author foreign
key to `platform_users` and a deferred composite foreign key to its current
version. An account/state/update index supports deterministic listing. Database
triggers reject an insert or reactivation that would create more than 100
active views for one Journal account.

## Table `journal_analytics_saved_view_versions`

- `saved_view_version_id`: canonical UUID v4 primary key.
- `workspace_id`, `account_id`, `saved_view_id`: owning view identity.
- `version_number`: positive and unique within the view.
- `event_kind`: `created`, `updated` or `retired`.
- `name`: trimmed display name of 1 through 80 characters with no control
  characters.
- `query_version`: exactly `analytics_lab_view_v1`.
- `normalized_query_json`: valid JSON object, at most 65,536 bytes.
- `query_sha256`: canonical lowercase SHA-256.
- `lifecycle_state`: `active` or `retired`, matching the version event.
- `authored_by_user_id`, `created_at_utc`: server-derived author and time.

The table has composite foreign keys to its account-scoped view and author.
Database triggers reject every update or delete, preserving immutable history.
Retirement appends a final version and advances the parent row; no ordinary
command hard-deletes either table.

## Command and read rules

1. List/read/create/update/retire always require the server-derived active
   Journal account and the current opaque selection reference.
2. Create requires a unique generated view/version identity and starts at
   revision/version 1.
3. Update and retirement require the exact expected revision. A stale revision
   rolls back the entire transaction and returns an ordinary conflict.
4. All writes use one immediate transaction. The new immutable version and
   parent pointer/state change commit together or neither commits.
5. Only active views are returned in the normal list. Retired history remains
   storage evidence and cannot be silently reactivated.
6. The UI can load a view, save the current filters as a new view, update an
   existing active view and retire it. Loading does not execute a write.
7. View names and saved queries never contain user, workspace, Journal-account,
   broker-account, statement, execution, trade-note, tag or rule identifiers.

## Required proof order

1. Confirm ports 3000, 3010 and 3011 are stopped and the real replacement WAL
   is zero bytes.
2. Create an online backup and independent restored verification of the current
   seven-migration database.
3. Apply migration 0008 to a disposable restored copy.
4. Prove empty initialization, schema digest, foreign keys, `quick_check` and
   `integrity_check`.
5. Seed two test Journal accounts only in a disposable database and prove
   account isolation, the 100-view cap, strict normalization, stale-selection
   rejection, stale-revision rollback, immutable versions and retirement.
6. Verify the disposable database can be backed up and restored.
7. Apply migration 0008 to the real replacement database with both saved-view
   tables empty, then run read-only database and Analytics Lab verification.

No V3 JSON file, legacy annotation, old saved trade or private statement is
copied as part of this migration.

## Accepted backup and disposable evidence

The pre-write online backup started at `2026-08-02T11:09:53.616Z` from the
unchanged seven-migration database. The source remained 10,825,728 bytes with
SHA-256 `856c5779e075eaaa9a8bafd2f3dab5e34126692e49f5cfb62d737d51a4b75b96`.
The backup and independently restored main files are byte-identical with
SHA-256 `72824f1801a6f4d86a9658fb53367a9c20eef9059e510f762dcbb2a374d0a5ca`:

- backup: `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\backups\phase-5-slice-e2-20260802T110951Z\development-pre-saved-views.sqlite`;
- restore: `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\restore-verification\phase-5-slice-e2-20260802T110951Z\development-restored.sqlite`.

Migration 0008 was then applied alone to a disposable copy of that restored
database. Its accepted immutable migration checksum is
`b152896c81ffc7e8702399ed91768cebf32bf705f7b66b3c6b7e520607694d46` and
its post-schema SHA-256 is
`040f2448fafb6d2d3122787b4b522f109bfa815cc79d7118741d4fc005b14a5c`.
The disposable database contains eight migration rows and 39 domain tables;
both saved-view tables contain zero rows. Foreign keys, `quick_check` and
`integrity_check` pass.

The 10,870,784-byte disposable main file had SHA-256
`dc55fa08a1f75a36ff16752478276317522584194069773ac5cbd15240c3f707`.
Its online backup and independent restored copy are byte-identical with
SHA-256 `3358a8abd767c2d433685032ba513eb8908ac457595bc051372297fa4d27c1bc`.
Registry rows, all 40 table counts including the migration registry, page
geometry and recovery authority match exactly.

Five focused files pass 24 tests with one Vitest worker. The proofs cover
two-account isolation, strict query and name validation, digest tampering,
stale-revision rollback without an orphan version, immutable version history,
retirement without deletion, the 100-active-view service limit and the
independent database trigger limit. Dependency-scoped TypeScript, targeted
lint, static migration verification and the active Phase 5 V3-free dependency
gate also pass.
