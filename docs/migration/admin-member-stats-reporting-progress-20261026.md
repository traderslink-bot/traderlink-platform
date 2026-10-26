# Admin member stats and deletion reporting — 2026-10-26

Status: feature implementation and release preparation underway; unverified, not deployed. Owner approved
proceeding after the source inventory and Watchlist tracking discussion. VPS
Coordinator reserved the narrow file set for worker chat
`01a178fe-4a19-7062-814b-534c2cc4e95b`. Parent worker
`01a178a8-0cec-7c72-aa8b-58506f2f3c03` retains erasure engine/design ownership.

## Current implementation and definitions

- Directory and audited details separately show last recorded authentication,
  session activity and Watchlist visit. Authentication evidence is the later of
  identity authentication time and latest session creation time; session touches
  no longer appear as fresh authentication in this presentation. The old mixed
  `lastSuccessfulAuthenticationAtUtc` field remains for compatibility, and its
  existing dependent filters/attention rules are unchanged.
- Two optional additive fields carry new evidence. Watchlist `undefined` means
  the ledger table is unavailable; `null` means no recorded event for that user.
  The latest visit is read using one prepared top-one lookup per visible member
  (at most 50, or one in private details). Browser payloads contain timestamps only,
  never raw user IDs or event history. Owner visits remain excluded at collection.
- The misleading Online now label is replaced by recent session activity, without
  claiming current presence or changing existing filter semantics. Overview's
  Discord-only metric is explicitly labeled Discord session activity; its SQL
  and population are unchanged under the labels-only reservation.
- Every member is still included by default, summary totals remain global,
  filters/counts/pagination and audited access/controls remain in place. Added
  the missing manual-entry-issues option to API validation/type narrowing, plus
  Pending Data Decisions across the page, API and read model.
- Desktop now uses six compact columns and a native detail expansion retaining
  every original fact; mobile retains the same facts. Successful account controls
  refresh the server-rendered directory when the result dialog closes so its
  visible state does not stay stale. Refresh is deferred because opaque refs
  regenerate on a server render and can remount dialogs, hiding the receipt.
- Desktop/mobile facts use the same source; UI copy distinguishes record absence
  from evidence that someone did not view a page. Dates remain UTC. Clarified
  that Journal account totals include demo accounts and manual counts are
  executions rather than trades.
- Private details expose existing first-session, total-session and latest-Academy
  evidence. Zero Academy completions no longer imply missing source provenance.
- Control success/error alerts render outside the detail conditional so a
  successful action does not hide its receipt. Unknown transport outcomes do
  not assert action failure; enable copy supports all connected login methods.
- The audited30-day history view reads the parent's durable records for all
  three actions. Before its migration, history is unavailable rather than zero
  outcomes. No earlier incident or person-specific history is backfilled.

## Watchlist limitation and remaining slices

The original recorder sent one unchecked browser POST at mount, with no retry.
Returning to an already-open tab generates no visit. Owner accounts, archives,
and other unsupported pages are excluded. A mounted recorder is not proof of
visible reading. Eastern-day Watchlist totals and UTC member timestamps differ.
The existing presence migration alone is not an active presence implementation.

Coordinator subsequently cleared and reserved these additional exact files:

- `app/watchlist/watchlist-visit-recorder.tsx`: owner explicitly approved up to
  two background retries provided the change stays straightforward and avoids
  slowing the app. Implemented delays of 1 and 3 seconds following a failed
  attempt, for network errors and HTTP 500/502/503/504 only. Requests are serial,
  reuse the identical body/event ID, stop on success or other HTTP status, and
  cancel scheduled retries on cleanup. No rendering await, polling, presence
  collection or new event on returning to a tab. In-flight keepalive remains as
  before. Retry deduplication uses the existing event primary key and ON CONFLICT
  DO NOTHING; no server/schema change. At most three attempts per effect setup;
  existing React development effect replay can issue the same deduplicated ID.
- `app/(dashboard)/admin/watchlist/watchlist-usage-admin-panel.tsx`: describe
  recorded visits and collection gaps honestly.
- `app/(dashboard)/account/account-erasure-controls.tsx`: replace unsupported
  Nothing was deleted / retry claims with unknown-outcome guidance only.

These source edits are complete, not executed or deployed. Recorder retries
can reduce lost events but cannot recover old missing visits, survive every
navigation/unmount, prove page visibility or guarantee a responsiveness SLA.
No speed claim is made. The Privacy hunk changes only three error strings,
including 409 current-state guidance; it does not change request, response,
cookie, polling or erasure behavior. Exact copy/hash receipt sent to Coordinator
for integration with the parent's unchanged erasure source.

Returning-tab presence/heartbeat collection needs its own explicit definition;
do not inflate page-view counts by treating each heartbeat as a new visit.
Durable erasure reporting depends on the parent's existing
[protocol design](account-erasure-durable-protocol-design-20261026.md), not this UI.
The Oct 26 9:59 a.m. Eastern POST/499 is attempted endpoint use only; action,
person and commit outcome are unknown. Deleted users need an appropriately
retained separate outcome source; the current-user directory is not that source.

## Source review and acceptance limits

No tests of any kind, lint/type/build/browser checks, runtime, database query,
provider/hosted operation, migration, preview, Git staging/commit/push, or deployment
was performed. Shell reads, source diff inspection and source hashes are handoff
evidence only, not execution verification. Historical checks in the older member
directory progress record do not validate this slice.

Independent Coordinator source review rejected the initial grouped all-history
Watchlist aggregate. It has been replaced with the exact-result indexed lookup
and reserved additive migration below. No plan/timing/equivalence rehearsal has
run, and no measured performance improvement is claimed. The query and index
must ship together under Coordinator migration/recovery gates.
Snapshot consistency is retained for the directory's read transaction. The
existing detail service still uses separate reads; do not describe it as an
atomic snapshot.

Source review follows the React skill: existing MUI/theme tokens, direct imports,
server-side data reads, opaque references, existing hooks order, responsive
markup, semantic definition lists and theme-inheriting alerts. No local dark
palette or new shell was introduced. Desktop/mobile and Light/Navy Dark
appearance, focus/disabled/error/success behavior remain visually unverified.
Reviewed existing public Help and Privacy wording for the copy expansion: no
Help article promises that a failed deletion response proves rollback, and the
Privacy page does not prescribe blind retries. No guide edit is required for
this correction. Durable outcome/recovery UI still needs a future guide review.

## Exact feature allowlist

1. `app/admin/journal/users/page.tsx`
2. `app/admin/journal/users/user-detail-button.tsx`
3. `app/admin/journal/page.tsx` — one metric label only
4. `src/modules/journal/server/administration/journal-admin-user-service.ts`
5. `app/api/admin/journal/users/route.ts`
6. `src/modules/journal/contracts/journal-administration-contracts.ts`
7. `docs/migration/admin-member-stats-reporting-progress-20261026.md`
8. `docs/migration/journal-admin-member-directory-progress.md` — link only

9. `app/watchlist/watchlist-visit-recorder.tsx`
10. `app/(dashboard)/admin/watchlist/watchlist-usage-admin-panel.tsx` — copy only
11. `app/(dashboard)/account/account-erasure-controls.tsx` — error copy only
12. `src/modules/platform/server/database/migrations/0184_platform_watchlist_usage_user_recent.ts`
13. `src/modules/platform/server/administration/platform-admin-sensitive-access.ts`
14. `src/modules/platform/server/administration/platform-admin-reference-authority.ts`
15. `app/privacy/page.tsx` — one factual retention paragraph only

Expansion SHA-256 receipts:

- Recorder: `d49b0508d3191003964f1e63d6fbec10819792a1a50439f88a533c464cbc4092`
- Usage panel: `f856151a79972c329d6cb771bcaa5817938f5377994ed831c54bc555db970de6`
- Erasure controls, including accepted-request retention notice: `50778267844cb7e54bc8792a58d5b397ae6c58c18237e898d87f7fc7ffcd5bd9`

All three expansion files had no working diff before editing. The coordinator
confirmed no overlapping owner work. Parent erasure route/service/design remain
untouched. No additional files are authorized by these reservations.

All six application files were clean in the pre-edit source diff. No unknown
hunks were absorbed; unrelated mixed Coaching/Membership/Community work, shared
manifest, erasure route/service and compiled artifacts are untouched. No migration
was required by the initial implementation, but source review requires the
additive index below. Owner subsequently waived UI acceptance and staging and
explicitly requested complete work followed by deployment. Owner also approved
ONE production build/type check, keeping test suites and database operations
disabled. Coordinator reserves that build for the exact final production
candidate in an isolated build root; do not overwrite the mixed Coaching
compiled artifact. Build is not yet run. This source is not release-ready.

## Reserved lookup migration and pure production registration delta

Coordinator reservation: platform namespace,
`0184_platform_watchlist_usage_user_recent`, execution order 221,
export `platformWatchlistUsageUserRecentMigration`. SQL:

```sql
CREATE INDEX platform_watchlist_usage_events_user_recent ON platform_watchlist_usage_events(user_id, visited_at_ms DESC);
```

SQL canonical checksum (one statement, trailing newline per migration contract):
`75be416e265842e61f4ba4a9fb07874a5653f88c8b0263665e98c0e401647f7a`.
Descriptor source SHA-256:
`81735edb82254e9a655870b5e6a3375a6bac6a26487d74f3e38c5c4d8ae86873`.

Prepared query, bound to one authorized visible user's server-side ID:

```sql
SELECT visited_at_ms AS latest_visit_ms
FROM platform_watchlist_usage_events
WHERE user_id = ?
ORDER BY visited_at_ms DESC
LIMIT 1
```

Source equivalence: `visited_at_ms` is a non-null positive INTEGER. The first
descending timestamp equals the previous MAX; ties return the same timestamp.
No row still means no recorded visit, not evidence of non-visiting. Absent table
still means unavailable. No date cutoff, collection/exclusion/auth change or
private browser identity introduced. Index covers equality, ordering and result;
the chosen SQLite plan and runtime work are not experimentally established.

Shared dirty migration manifest is NOT edited by this worker. For exact
production parent `760e754e2e5755e5b47cefaa82c54f39bc538d48`, Coordinator integrates
only these additions to `platform-migration-manifest.ts`:

```ts
import { platformWatchlistUsageUserRecentMigration } from "./migrations/0184_platform_watchlist_usage_user_recent";
```

Append this descriptor entry to `platformMigrationFileEntries` after the existing
0176 entry, before manifest validation:

```ts
Object.freeze({ sourcePath: "src/modules/platform/server/database/migrations/0184_platform_watchlist_usage_user_recent.ts", migration: platformWatchlistUsageUserRecentMigration }),
```

No managed-table addition: index-only migration creates no table, and the
existing table-name projection defaults unmapped migration IDs to an empty list.
Production146 plus this descriptor alone is147, not a copy of the mixed manifest.
If parent erasure order220 is selected before index221, the joint prefix differs;
Coordinator must reconcile release order BEFORE applying either. Never apply221
then insert220 or pending193–219 into its applied prefix. Backup/restore rehearsal,
strict-ledger compatible recovery/final images and one-volume writer gates remain
Coordinator-owned. No migration is applied by this document or source descriptor.

Required isolated acceptance remains unrun and not authorized by the build-only
approval: initialize disposable exact146, apply only the selected new descriptor(s),
compare old/new lifetime results including ties/absence/unrelated users and
representative large history, and inspect EXPLAIN QUERY PLAN for covering top-one
access. Confirm unrelated rows/trigger behavior and recovery compatibility.
Coordinator will request narrowly scoped execution authority if required.

## Full deletion-reporting dependency

Parent's initial source candidate provided `platform_erasure_operations` with
action, state (`purge_pending` or `complete`), creation/completion times and object
count. Completed target bindings/object obligations are scrubbed for privacy.
That alone could support anonymous committed/complete aggregates, but could not establish
attempts before commit, failed attempts, historical unknown outcomes or a named
deleted member's history. Parent subsequently published the approved30-day
history contract below. No
duplicate engine/ledger, fabricated receipt or name-based association is added.

## Owner-confirmed 30-day member-linked reporting

Owner explicitly selected member-linked history, delegated choosing the useful
retention window, then confirmed: "good do what you said 30 days is fine".
Use 30 days from the original recorded attempt; updates/recovery must not extend
the retention clock. No further preference gate remains. Parent owns the exact
durable history schema, writes, recovery and actual expiry purge; Coordinator
requested folding it into UNAPPLIED0183/order220 rather than inventing another ID.
Consumer SQL now uses the actual stable contract in
[Durable deletion history contract](account-erasure-history-contract-20261026.md),
Final producer contract SHA-256
`550a53110e725943139982a49236bcf3169830d4300402d285345f172c20c8a4`.
The final contract adds the producer phase-reconciliation index, with no change
to consumed columns, phases, action union or expiry semantics.

Admin UI is now implemented in the existing user-detail-button module as the
separate `DeletionHistoryButton` export, opened from Members. It requests a
reason-selected audited POST with bounded pagination, renders member display
name/action/outcome/times/expiry only, does not export or persist private data,
does not poll, and clears loaded private history on close/new page/error. The
typed UI contract is not execution evidence; parent writer/migration plus this
consumer must be integrated and verified before release.

To preserve the exact existing file ownership, the briefly created new
deletion-history-button.tsx under the initial expansion reservation was moved
in full into the existing module and only that own new file was removed after
Coordinator superseded the new-file plan. No new route/service file is retained.

Coordinator additionally reserved the two administration helpers and public
Privacy paragraph listed in the full allowlist above.

Audit database CHECK from0019 permits existing `user_detail_accessed` and
`authority`, but NOT a new `erasure_history_accessed` action. No audit DDL/action
was added. The helper adds only the allowed authority target plus an optional
literal server `view: erasure_history`; it rejects any other history combination
than user_detail_accessed/authority/fixed account_erasure_history. Reason/rate/
scope/hash behavior and existing callers are preserved. Audit detail records
the view and access reason, never member names, targets or private history.

Opaque reference authority adds only the `erasure_history` kind. Existing
encryption, key/payload/scope checks and token parsing are unchanged. Consumer
must issue/accept ONLY that kind for history-table lookup, not reuse audit-event
identities or expose raw request/member UUIDs.

## Completed Administration history consumer

`POST /api/admin/journal/users` accepts only action `deletion_history`, a valid
existing sensitive-access reason and optional bounded opaque cursor. Existing
GET behavior is preserved. POST enforces existing mutation/same-origin guards,
owner authorization, `read_user_details`, sensitive rate limits and no-store
headers. No data is returned if the required audit cannot be persisted.
Unavailable reads are audited as failed, not fabricated successes.

`JournalAdminUserService.erasureHistory` uses the actual history table contract,
a read transaction, strict server-side expiry cutoff and accepted-time30-day
bound, stable descending `(accepted_at_utc,receipt_id)` keyset ordering, and
LIMIT51 for at most50 records plus continuation. There is no all-history count,
phase/action filter or polling. Cursors resolve only as erasure_history and
must target unexpired history rows; expired/missing anchors fail closed.
Missing table means unavailable. History SQL selects no member UUID, private
object field or raw failure category for disclosure. Browser receives only
display name, action, plain mapped outcome, timestamps and encrypted receipt ref.

State mapping: accepted→attempted, not_deleted→failed before commit,
committed_cleanup_pending→committed with cleanup pending, complete→completed,
outcome_unknown→unknown. Only complete maps finished_at_utc to cleanup completion;
failed/unknown terminal timestamps are never called deletion completion.
All actions have distinct plain labels. Coverage explicitly excludes pre-admission
rejects and earlier untracked requests. Shared files survive when still referenced.

The Privacy control and one paragraph in the Privacy page disclose the
restricted30-day display-name/request-outcome record, reader expiry and automated
cleanup. Neither promises immediate backup or storage-failure purge. Parent
owns actual off-main expiry deletion, writes/recovery and amended0183/order220
table/index registration. No producer path is changed by this consumer.

Administration source is complete; integration, build, isolated verification
and production release remain coordinated work, not evidence supplied by this
document. No tests or application build have run in this chat.
