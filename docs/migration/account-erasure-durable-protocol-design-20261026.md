# Durable account erasure protocol — design review candidate

Status: source-design only; not implemented, experimentally verified, or release
ready. No migration identity is allocated. This extends the
[verified blocker report](account-erasure-availability-blocker-20261026.md).
Source baseline and blob receipts remain those in that report. No database,
test, build, preview, hosted operation, or application change was performed.

## Decision and limits

Use durable SQLite erasure intent plus reversible same-filesystem quarantine,
followed by an atomic logical-delete/outbox commit and recoverable physical
purge. Run it in one supervised dedicated worker thread within the existing
single application process. Do not create another service, replica or database.

SQLite and several filesystem unlinks cannot form one atomic transaction.
Physical deletion of multiple files is necessarily observable as partial after
interruption. The guarantee is instead: before logical commit, no private bytes
are irreversibly removed; after logical commit, the account cannot regain access
and a durable manifest retains every remaining purge obligation until complete.
There is no claim of instantaneous physical deletion, secure media overwrite,
backup erasure, or guaranteed completion while storage remains unavailable.

This changes the current failure contract: once logical deletion commits, a
later purge failure cannot roll back the account. A normal success response and
existing cookies are produced only after durable completion. An error or client
disconnect is an ambiguous outcome, never permission to repeat root deletion.
The current callback API cannot honestly retain its rollback-on-purge-failure
promise. This is an architectural contract change requiring explicit acceptance
before implementation, not a routine implementation choice.

## Durable state and storage prerequisites

Propose three internal tables, exact DDL deferred to schema review:

- Operation: random job ID, protocol/schema version, action, authorized root
  identifiers, original account-selection binding, bounded request digest,
  state, timestamps, worker generation and final selection/replacement result.
  Use a unique active-job constraint; one erasure at a time. Scope IDs are
  necessary private operational metadata, never logs or public responses.
- Object obligations: job ID, object kind/vault identity, validated relative
  original and quarantine keys, expected digest/size, captured filesystem
  identity, disposition and purge receipt. Deduplicate shared objects. No file
  contents, original filenames, credentials, raw bodies or session tokens.
- Root/object fences: unique target root and vault/object key, job ID. These
  exclude concurrent root mutation and new references to reserved objects.

Rows must survive deletion of user/workspace/account, so no cascading FK to
those roots. Internal ownership is job-based; only the reviewed erasure and
recovery code may mutate these tables. Existing generic `user_id`,
`workspace_id`, `account_id` deletion loops must be removed/replaced and must
not erase the job ledger. Completed jobs scrub root IDs, object keys and
selection material after no longer needed; keep only bounded aggregate outcome
metadata. Define a short documented completion-retention policy before release.
Incomplete obligations cannot expire silently.

SQLite commit durability and directory fsync behavior must be qualified on the
actual volume/filesystem. Do not assume default SQLite settings survive power
loss. Durable job commits require the reviewed FULL synchronous policy and
supported WAL/rollback recovery; validate per-connection behavior rather than
silently changing global configuration. Quarantine lives within each existing
vault filesystem, mode 0700, files 0600, no cross-device rename or copy fallback.
Use random job-relative keys, exclusive creation, no symlink traversal, exact
root identity/protected-root checks and file/directory fsync at each transition.
If vault mounts do not survive with the database, stop: this protocol is invalid.

An additive migration is required for this selected SQLite-ledger design. A
migration is not mathematically unavoidable: an independently durable filesystem
intent journal is an alternative, but would require a second transaction/recovery
protocol and equally broad access fences. It is not a narrow no-migration fix.
Coordinator must reserve identity/order against the current canonical ledger;
do not use a guessed next ID or reuse held News/Coaching reservations.

## Exact ordering

1. Route retains CSRF, authenticated identity, confirmation, scope and expected
   selection checks. It submits a typed, minimal server-produced command, never
   accepts object paths or SQL. The worker revalidates current authorization,
   active selection, sole ownership and demo identity inside BEGIN IMMEDIATE.
   Authorization is bound at acceptance; restart executes only that committed
   command, never a new client-supplied target.
2. Acceptance transaction checks no active erasure, captures action intent and
   immutable original account set, installs root fences and commits PREPARING.
   No files moved and no logical deletion yet. Pre-acceptance duplicate requests
   resolve the same job through the original selection binding; they never
   select a newly created replacement account.
3. All relevant data writers recheck fences within their write transaction.
   Before quarantine, every existing transaction must finish. Readers of a
   fenced target return the established temporary unavailable path, rather than
   a missing-file error. Already-authorized in-flight readers must drain before
   irreversible commit; include file readers/downloads, import workers and
   account mutation tasks. Scope fences are server enforced, not UI flags.
4. Under BEGIN IMMEDIATE, generate the schema-reviewed rooted row closure and
   candidate artifacts. For every candidate recheck all canonical reference
   tables, including other owners/accounts; any surviving reference means KEEP
   and no quarantine. Reserve only genuinely unshared objects, with transactional
   object fences that block new references. Commit the complete manifest before
   moving any file. Unknown object reference tables/schema versions fail closed.
5. Outside a long SQLite transaction, verify each original object's path,
   type, digest, size and protected boundaries; rename to its exclusive job
   quarantine path in the same filesystem; fsync affected directories; then
   persist QUARANTINED. Intent precedes rename, so a crash between rename and
   status update is reconciled from both validated locations. No unlink yet.
   Both locations present, neither present, unexpected identity, wrong content,
   cross-device operation or broken fence is a conflict requiring inspection.
   Never overwrite a file to make reconciliation succeed.
6. Once all required objects are quarantined, BEGIN IMMEDIATE revalidates fences,
   original root/selection/demo facts, manifest version, closure and shared
   references. Suspend only the required reviewed deletion guards inside this
   transaction; delete the rooted closure; perform demo lifecycle/replacement
   atomically where applicable; restore original guards; retain global FK check.
   Persist LOGICALLY_COMMITTED plus purge obligations and final response-selection
   result in this SAME transaction as deletion. Commit before irreversible purge.
   A failed/ambiguous commit is resolved by reading this job state after SQLite
   recovery, never by assuming rollback or repeating the delete.
7. Only proven LOGICALLY_COMMITTED permits purge. Per bounded object batch,
   obtain BEGIN IMMEDIATE, verify job/object fence and no surviving references,
   validate quarantine identity and unlink; fsync parent directory; persist the
   receipt and commit. If interrupted after unlink but before receipt, the
   committed job plus exclusive quarantine namespace and confirmed absence of
   both original/quarantine makes the same obligation recoverable as purged.
   Missing files before logical commit are never interpreted as success.
   A new surviving reference is a safety violation: retain bytes, fence the
   affected source operation and report conflict. Never delete shared content.
8. Mark COMPLETE only when every required object is durably absent, every KEEP
   object remains unmodified, guards/FKs are valid and the logical result is
   persisted. Release fences in the completion transaction. Full deletion's
   sessions have already been removed by logical commit. Normal JSON and cookie
   behavior is emitted only after COMPLETE. Retention cleanup scrubs private
   job fields in a later idempotent transaction.

Pre-commit failure changes the state to RESTORING. Restore quarantined files to
their exact original paths, verify content, fsync directories, persist each
restoration and release fences only after every original is verified present.
Only then mark ABORTED with original data untouched. If restore fails, retain
fences and recovery state; do not expose an account with missing private sources.
Process interruption never triggers a speculative restore: recover SQLite first
and distinguish PREPARING/RESTORING from LOGICALLY_COMMITTED.

## Root closure and action behavior

Build a reviewed FK graph for the exact canonical manifest. Materialize row
keys before deleting any root or directly scoped row; include explicit non-FK
relationships currently deleted by account/workspace/user predicates. Follow
incoming dependencies only from those seeded rows, handling composite FKs with
SQLite parent collation/affinity and NULL semantics, implicit parent keys,
cycles, WITHOUT ROWID tables and multiple paths. Deduplicate by complete stable
key. FK reachability alone does not authorize deleting shared ownership rows:
review each relation's erasure policy and reject unknown/shared-policy ambiguity.
Use targeted indexed predicates and scoped key tables; impose row/object/byte
budgets before quarantine. A budget refusal rolls back preparation completely.
Do not truncate the closure or sweep unrelated orphan rows. Preserve global FK
validation, whose cost remains database-wide.

| Action | Logical commit contract |
| --- | --- |
| Trade Tracker account | Delete only authorized original account and its reviewed descendants; retain siblings/user/workspace; clear selection cookie as today. |
| Demo Trade Tracker account | Validate demo identity, record cleared lifecycle; retain return selection when siblings remain. When none remain, create exactly one Primary Journal with original base currency/timezone in the deletion transaction and store its selection result. Recovery never creates a second replacement. |
| TraderLink account | Revalidate sole membership/ownership; delete original workspace/accounts/user and approved identity-release edges, sessions and scoped records; preserve unrelated users and shared artifacts. Clear existing auth/legacy/selection cookies only on completed response. |

The two demo service entrypoints are retained through the same command state
machine. Every service entrypoint must require it; a legacy optional synchronous
purge callback must not remain a bypass. Normal API is still completion-based,
never 202. Post-commit operational failure may return the existing unavailable
shape; generic UI must not promise that failure means nothing was deleted.
Lost response cookies cannot be repaired by blindly rerunning deletion; normal
authentication/account selection must safely resolve stale cookies. Completed
jobs may be acknowledged only to the original still-authorized session; full
deletion does not authorize unauthenticated job-status access.

## Worker, recovery and availability

Dedicated worker thread owns its SQLite connection and all heavy filesystem/SQL
work. Main thread never opens the erasure writer, polls SQLite synchronously,
executes closure/FK work or waits on locks for this command. Bounded IPC contains
only command/result/phase summaries. One active worker/job and zero independent
queued deletion commands; duplicates attach to the existing result. Shared SQLite
still serializes ordinary writers. This is one erasure executor in the existing
single-volume app, not permission for another unrestricted writer service.

Cooperative budgets apply between phases/objects; pre-commit expiry transitions
to restore, post-commit expiry retains pending purge for recovery. No timeout,
client disconnect or shutdown request terminates a running writer or releases
occupancy. Worker error retains occupancy until actual exit; parent reads no
ambiguous success. Replacement/recovery starts only after proven exit. An IPC
timeout is diagnostic, never a second executor. A hung filesystem call cannot
be given a safe hard deadline; do not claim bounded elapsed completion.

Startup recovers active jobs before enabling fenced target reads/writes or any
vault-reference publisher. Start exactly one recovery worker, validate protocol,
schema/vault identities and durable states, reconcile file transitions, then
restore pre-commit jobs or resume post-commit purge. Do not replay POST. Normal
unrelated traffic may proceed only through paths proven not to synchronize on
the worker. Global readiness/ordinary database opens currently have synchronous
checks: their lock/I/O coupling must be audited separately. Off-main execution
does not eliminate shared-volume stalls or guarantee every page/health response.
Keep logs to job-independent phase labels, aggregate counts/durations and stable
error codes; no IDs, paths, digests, keys, request bodies or cookies.

## Required isolated verification before implementation acceptance

No case below was executed. Use only authorized disposable synthetic data.

- All actions and both demo entrypoints; sole-owner denial, CSRF, session changes,
  stale selection, repeated original POST, replacement selection and cookie parity.
- Exact target completeness and unrelated-row equality on large unrelated News/
  Journal populations; pre-existing unrelated orphan produces integrity refusal,
  never cleanup. Composite/implicit/null FKs, cycles, WITHOUT ROWID, shared edges,
  missing indexes, unknown schema and every row/object budget boundary.
- Fail/interrupt immediately before and after every intent commit, rename,
  directory fsync, object-state update, logical delete, guard drop/restore, FK
  check, logical commit, unlink, receipt commit, completion and metadata scrub.
  Include SQLite ambiguous commit, disk full/read-only, EIO, corrupt/truncated
  ledger, missing/duplicate quarantine entries and unsupported directory fsync.
- Fail the second object's verification/purge after the first transition. Before
  commit prove complete restoration or continued fencing; after commit prove
  zero restored account access and eventual purge on recovery. Prove no early
  `deleted`, no lost obligation and no double demo replacement.
- Shared object before reservation, concurrent reference publication/read/import,
  pending read handle/download, competing account deletion, symlink/path swap,
  hash/size mismatch, protected roots and cross-device vaults. Preserve bytes for
  all surviving references and reject fence bypasses.
- Request disconnect, lost success IPC, worker crash, application/host restart,
  storage hang, delayed exit and drain/release behavior. Prove one executor and
  bounded queue/memory; never use a kill-on-timeout writer policy.
- Concurrent unrelated static/page/API/health reads and ordinary writes during
  every phase, cold/warm reads and global FK validation. Report shared-volume
  limitations; measure actual SQL rows/I/O, not merely asynchronous scheduling.
- Exact production manifest compatibility plus any selected News index or later
  Coaching prefix; rehearsal/backup/recovery image gates remain Coordinator-owned.

## Implementation scope and review outcome

The original route/service/one-worker allowlist is insufficient. Minimum areas:

- Existing route and erasure service; new internal job repository/contracts,
  closure builder and worker supervisor/entrypoint under platform privacy.
- Existing evidence and support-source vault modules: validated reversible
  quarantine/restore/purge primitives with durable transitions.
- New reserved additive migration and canonical migration manifest; schema
  validation/immutability rules for internal jobs and fences.
- Authentication/request scope, Journal import/source-reference writers/readers,
  demo/account mutation and support-source services: transaction-safe fence and
  in-flight-reader coordination. Exact call-site allowlist requires a focused
  source inventory before any edit; this design does not claim it is complete.
- Hosted startup/shutdown worker integration and bounded observability; review
  readiness and database opener lock coupling. Add only demonstrated changes.
- Isolated failure verifier and focused contract tests when authorized; Privacy
  Help guidance only if the eventual visible failure/recovery contract changes.

Review outcome: coherent candidate protocol, with explicit semantic and scope
expansion, not a narrow ready patch. No implementation authorization inferred.
Blocking decisions are acceptance of post-commit pending purge semantics,
durability qualification and an exact cross-cutting fence inventory. Migration
reservation and isolated fault verification are prerequisites to release work.
An operational inability to recover must surface as a precise privacy obligation,
not be hidden by deleting its manifest or returning fabricated success.
