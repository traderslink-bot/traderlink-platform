# Account erasure: actual retry repair — November 19, 2026

Status: source batch verified by18 focused tests and targeted lint; Coordinator
integration, independent review and actual performance qualification remain open.
Coordinator assignment reuses `/home/traderlink/projects/community-erasure-production-repair-20261119`,
branch `codex/community-erasure-live-retry-repair-20261119`, clean tracked parent
`fcd190742d7f35a3d9bf1b76d50ab36d9bf7fe01`. Historical untracked proofs and
frozen packets remain intact. Core may not commit, push, register migrations,
retry production deletion, change hosted state or disturb Whop/preview3038.

## Actual evidence

Root's captured request returned HTTP500 after69978ms. Its existing captured
500-row log has SHA-256
`0d5441b114afe633c4dc3ce5dfea5705b725964c6835588a8b80d6edf7b9b1d9`.
Embedded timestamps and durations establish module fence22918ms, rooted
capture13245ms, selected-row deletion30129ms, followed by an11ms admission
failure during logical settlement. The total logical phase was66516ms.
No global foreign-key-check phase was reached. Earlier13.27-second capture
estimates included approximately27ms preceding the instrumented capture.
Interleaved multiline stdout cannot safely be parsed as consecutive objects.

Root's query-only outcome receipt SHA-256
`5455c6cea1608242e900293f02f79c4e4a061084b279a7b8911f8054d5f7aca3`
confirms the original history/receipt remains accepted, the operation is ready
with expired deadline, the lifecycle is settling with user attached, and no
logical deletion/recovery operation committed. The ordinary user and both
protected users remain active. Core read existing artifacts only; no hosted
query or retry was issued.

During this request, health requests timed out while one captured request later
spent24674ms reaching Node and24.4ms inside its health handler. This establishes
an availability problem outside that handler. Live Watchlist ticker writes
already used asynchronous lock retry; their SQLITE_BUSY errors alone do not
prove they froze the thread. Remaining synchronous health/patch writers and
Stats writer paths belong to their assigned workers. Core's synchronous
five-minute session-activity update is included in this batch.

## Source changes

- The rooted closure now schedules only parents whose selected keys grew.
  Unchanged parent keys cannot reveal additional children while the same
  immediate transaction holds main rows unchanged. Growing/cyclic parents are
  scheduled again. Exact composite/collation joins, incoming-FK policies,
  exclusions, ownership checks, row/time budgets and native FK enforcement stay
  in place. An empty selected-key table does not issue a DELETE.
- Phase/failure diagnostics are one JSON string per event, so worker/main line
  interleaving cannot mix object fields. Separate Partner and Stripe phases
  retain every existing call/recheck. Root/edge/delete table events report only
  validated schema names, selected-key counts, timings and fixed failure
  categories; only queries at least50ms or failures are emitted. No identity,
  binding value, source payload, path or exception text is logged.
- The shared `database/nonblocking-sqlite-write.ts` helper acquires a whole
  immediate transaction at synchronous busy_timeout0 and restores the exact
  previous timeout before yielding. Only BEGIN contention is retried. Once a
  callback/revalidation/commit has started, its errors propagate without
  replay. Callbacks are synchronous; external effects stay outside them.
  Optional revalidation runs after fresh lock acquisition. Wait defaults to
 5000ms with100ms yields, bounded0–30000ms; delay is bounded1–1000ms. Cancellation
  leaves no transaction. Budget exhaustion throws the original busy error;
  consumers retain their queue head/payload. This helper does not own a queue.
- Session resolution still validates active user/identity/session and fixed
  expiry. Optional last-seen housekeeping tries the writer once without waiting.
  A busy writer or an existing caller transaction leaves persisted last-seen
  unchanged for a future request; it never extends expiry or reports a touch
  that did not persist. A failed acquired update remains an authentication error.

Stats consumes the shared helper/API through the Coordinator. Live Watchlist
source has not been assigned to Core. Paid independently proposed grouping the
exhaustive principal-absence predicate per table rather than scanning once per
user-FK column; Core has not edited that Paid-owned file. Root was asked for
plan-only evidence and assignment. Neither the global authority guard nor final
same-transaction preparation may be skipped for ordinary subjects.

## Verification and remaining boundary

Four focused native files passed18 tests in one checkpoint, with no full-schema
initialization/global setup: closure graph/cross-scope/native-FK tests;
atomic/privacy-safe diagnostic tests; real two-connection lock acquisition,
heartbeat, revalidation, exhaustion, rollback/no-replay, nesting and cancellation;
session contention with persisted-time, revocation, disabled identity/user and
expiry checks. Targeted ESLint on all11 runtime/test files passed with zero
errors/warnings in the same resource slot. The tests took1.141s wall time and
lint2.069s. Actual available memory before launch was7305637888 bytes, with no
memory pressure; both resource guards were acquired and released without
changing another owner's token/process. Initial launch deferred while another
worker owned the common-heavy guard. A later optional transitive type-check
attempt also deferred before launch because that guard was owned; no fresh
TypeScript pass, full build, browser acceptance or actual worker-package proof
is claimed by this checkpoint. The Coordinator owns combined validation.

The review-only [current-fcd index proposal](account-erasure-production-repair-20261119/structural-index-proposal-current-fcd.json)
links the historical exact-schema native benchmark with the new actual timings.

The earlier canonical child-FK plan and synthetic benchmark still prove missing
leading execution_id indexes cause repeated unrelated child scans during native
execution deletion. The two-index review-only proposal remains preserved;
there is no DDL, registration or profile/catalog change in this batch. The new
worklist does not remove that native FK cost. The23-second module fence remains
unattributed at its internal subphase level; it cannot honestly be declared
fixed from fixture results. Production erasure completion is OPEN and no
additional POST may be used as a diagnostic experiment.

The Account Help guides were reviewed. Existing deletion guidance asks members
to contact support before retrying an unconfirmed outcome, and Security shows
persisted activity. No new user control/flow or wording change is required.
