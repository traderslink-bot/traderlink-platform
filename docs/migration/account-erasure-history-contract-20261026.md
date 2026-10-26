# Durable deletion history contract — owner-approved 30-day retention

Owner decision relayed by Coordinator on 2026-10-26: member-linked history,
30 days, no further retention preference question. Producer is the erasure
worker; consumer is the separate audited Administration feature. This contract
is published BEFORE expanded producer writes. No hosted operation is authorized.

## Exact table and indexes

Amend only the source-only, unapplied 0183/order 220 migration; do not register a
new migration or edit the mixed working manifest. Add exactly this third table:

```sql
CREATE TABLE platform_erasure_history (
  receipt_id TEXT PRIMARY KEY NOT NULL,
  member_user_id TEXT NOT NULL,
  member_display_name TEXT NOT NULL CHECK(length(member_display_name)<=200),
  action TEXT NOT NULL CHECK(action IN (
    'trade_tracker_account','demo_trade_tracker_account','traderlink_account')),
  phase TEXT NOT NULL CHECK(phase IN (
    'accepted','not_deleted','committed_cleanup_pending','complete','outcome_unknown')),
  accepted_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  committed_at_utc TEXT,
  finished_at_utc TEXT,
  expires_at_utc TEXT NOT NULL,
  safe_failure_kind TEXT CHECK(safe_failure_kind IS NULL OR safe_failure_kind IN (
    'transaction_rolled_back','cleanup_unavailable','interrupted_before_receipt')),
  CHECK(expires_at_utc>accepted_at_utc)
) STRICT, WITHOUT ROWID;
CREATE INDEX platform_erasure_history_recent
  ON platform_erasure_history(accepted_at_utc DESC,receipt_id DESC);
CREATE INDEX platform_erasure_history_member_recent
  ON platform_erasure_history(member_user_id,accepted_at_utc DESC,receipt_id DESC);
CREATE INDEX platform_erasure_history_expiry
  ON platform_erasure_history(expires_at_utc,receipt_id);
CREATE INDEX platform_erasure_history_phase_recent
  ON platform_erasure_history(phase,accepted_at_utc,receipt_id);
```

No FK to deleted user/workspace/account. `receipt_id` is a random internal UUID;
the corresponding outbox operation uses the SAME ID if logical deletion commits.
`member_user_id` is a stable internal Platform UUID and name is a server-read
snapshot. No account ID/name, email, auth subject, IP, body, token, source key,
digest, broker identifier, note or trade payload is stored. History is a narrow
explicit 30-day privacy exception, not a deleted-user directory without expiry.
Completed outbox target binding and object details still scrub as before.
The phase index bounds interrupted-acceptance recovery without scanning completed
history. It adds no fields and changes no consumer row contract.

## State meanings and writes

| Phase | Evidence and display meaning |
| --- | --- |
| `accepted` | Authenticated, confirmed, currently authorized request admitted by the worker; no completed outcome yet. Never claim deletion completed or failed from this phase. |
| `not_deleted` | The logical deletion transaction rolled back and no committed outbox exists for this receipt; original rows and private bytes are preserved. |
| `committed_cleanup_pending` | Logical deletion AND cleanup obligations committed atomically; physical cleanup is unfinished or needs attention. Never label this “not deleted.” |
| `complete` | Logical deletion committed and every private object was purged or retained for a surviving reference. |
| `outcome_unknown` | An admitted request was interrupted before a terminal/committed receipt could be established; no blind retry or invented completion. |

Acceptance commits in a separate short immediate transaction AFTER current
authentication/owner/scope/confirmation/expected selection and demo/full-owner
preconditions. Rejects before that point (including CSRF, unauthenticated calls,
invalid confirmation or an occupied worker) are outside this history's coverage.
The API still revalidates scope/session inside the actual deletion transaction.

The logical-delete transaction updates the same receipt to
`committed_cleanup_pending` and sets `committed_at_utc` in the SAME commit as
outbox/row deletion. An explicit caught rollback may set `not_deleted` only after
checking no operation committed. A purge failure keeps committed phase and may
set only safe category `cleanup_unavailable`. Completion updates history in the
same transaction as the outbox completion marker. No root deletion is replayed.

After actual prior worker exit/process recovery, an `accepted` receipt without
an outbox is conservatively marked `outcome_unknown`, category
`interrupted_before_receipt`; no historical 499 is backfilled or attributed.
Existing committed jobs reconcile their linked receipt from durable outbox
state. If the DB cannot persist an outcome, the last durable phase remains the
only available evidence. Absence of history is not evidence nothing happened.

`finished_at_utc` is the terminal processing time for `not_deleted`, `complete`
or `outcome_unknown`; it is NOT automatically a deletion completion timestamp.
`committed_at_utc` is separate. A still-pending cleanup has no finish time.

## Retention and read contract

`expires_at_utc = accepted_at_utc + 30*24*60*60*1000 milliseconds`, computed from
the worker's clock, fixed once and never extended by retry/recovery. Every
reader MUST apply `expires_at_utc > serverNowUtc` before disclosure, independent
of physical purge scheduling. Expired rows are deleted from the live history table in bounded
off-main batches (128 rows per pass) on worker invocations and periodic hosted
housekeeping (15-minute cadence; full batches schedule another pass after 2 seconds,
with no overlapping worker or independent deletion queue). Storage failure may
delay physical removal, never reader expiry.
Pending outbox obligations remain until resolved even if their history expires.

Internal type contract: `ErasureHistoryPhase` is the five-value phase union;
`ErasureHistoryRow` has the exact SQL column names above, nullable timestamps/
category as indicated. Producer module will be
`src/modules/platform/server/privacy/platform-erasure-history.ts`; schema lives
in `platform-erasure-recovery-schema.ts`. Consumer may import types only.

Administration owns existing owner-only authorization, explicit reason/audit,
opaque receipt references, safe plain-language mappings and bounded cursor
reads. It MUST NOT expose `member_user_id` or raw `receipt_id` in browser DTOs.
Use `(accepted_at_utc,receipt_id)` for stable descending cursor ordering and
limit 51 to expose 50 plus continuation. Member-specific lookup uses the member
index. No all-history scan/count is required. Avoid action/phase filters that
would require scanning an unbounded candidate population without reviewed
index support. Missing tables/migration mean unavailable, not zero outcomes.

This is history of admitted requests under the new protocol, not all endpoint
attempts since launch. No invented historical person, action or outcome.

## Producer ownership and verification

Expanded producer paths: schema module/reserved 0183 descriptor, new history
repository/types, erasure command acceptance/error transitions, recovery
completion/reconciliation, worker entrypoint and existing supervisor housekeeping
timer. Keep the shared manifest unchanged and return a pure147 registration
delta against production760 with THREE managed tables. Packaging/startup remains
the erasure slice. Administration UI/routes/contracts stay with its worker.

Disposable checks must establish rejected requests create no history; confirmed
rollback never becomes committed; post-commit failure never becomes not-deleted;
accepted crash becomes unknown without replay; committed crash resumes exactly
the same job; all three actions/name snapshots; fixed expiry through recovery;
reader cutoff and physical batch limit; target deletion preserves only this
explicit history exception; no sensitive fields or raw IDs in public responses.
