# Account erasure availability and durable cleanup implementation

Status: producer source verified and handed off; source held. Includes the
owner-approved 30-day member-linked outcome history. No worker deployment.
Coordinator now owns the authorized combined rehearsal, sole joint build and
release when its target/volume/recovery/health gates pass. Owner authorized broader implementation and disposable synthetic checks
on 2026-10-26, then paused/resumed this chat. No authority for hosted DB access,
migration, publication, restart or deployment was granted. Coordinator retains
release authority. Existing compiled `StJKT` assets were not rebuilt/replaced.

## Source and ownership

Assigned VPS `vmi3679948`, existing checkout
`/home/traderlink/projects/traderlink-platform`, branch `main`, HEAD
`ef2d97b031b546f392769fd5725b3dba95d252f0`. Mixed unrelated work is preserved;
no branch/index/ref/commit operation. The exact review parent is recorded
production source `760e754e2e5755e5b47cefaa82c54f39bc538d48`, not local HEAD.

Erasure owns route/service plus new privacy protocol/worker/verification files,
the reserved descriptor, worker packaging and a narrow startup hook. The working
migration manifest is deliberately NOT edited: a standalone 147 registration
delta is prepared against the immutable146 production manifest. The source
artifact must preserve production760 header removal and exclude unrelated
Coaching/Membership/Community, integrity-night-window and timing changes.

Admin worker `01a178fe-4a19-7062-814b-534c2cc4e95b` independently owns the
copy-only uncertainty change in `account-erasure-controls.tsx`. Its approved
receipt is SHA-256
`50778267844cb7e54bc8792a58d5b397ae6c58c18237e898d87f7fc7ffcd5bd9`.
Public Privacy disclosure receipt: `app/privacy/page.tsx`, SHA-256
`9d798656b71233231d54d6f01c5873675fd7773d52c0bbf49d373ece2f057847`.
This worker did not edit either disclosure file; preserve their approved hunks in the
Coordinator's integrated source. Public Account Help now explains unconfirmed
outcomes without claiming rollback or encouraging another deletion.

## Protocol refinement from the original candidate

The [original design](account-erasure-durable-protocol-design-20261026.md)
proposed pre-commit quarantine and broad fences. Source inventory supports a
smaller commit-first outbox for the existing publisher paths, avoiding every
pre-commit rename/unlink and all temporary unreadability of live source files.
This implementation supersedes that candidate; it does not implement its
three-table quarantine protocol.

1. Keep HTTP CSRF/authentication/confirmation/selection checks. Worker revalidates
   current active user, workspace, owner membership, identity/session and account
   selection within the immediate writer transaction. A separate short accepted
   history receipt commits after the first successful authorization check and
   before logical deletion; authorization is rechecked in the deletion transaction. Production cannot use its
   local-development command mode.
2. Materialize the exact root-scoped deletion key closure BEFORE deleting rows.
   Capture account-column rows plus explicit notification roots, or authorized
   user/workspace roots plus the identity-release claimed-user relation. Traverse
   incoming FK edges with composite/implicit parent keys, parent-side affinity
   and collation, nullable references, cycles and stable row keys. Native
   SET NULL/DEFAULT policies preserve shared payloads; table-reference case is
   normalized rather than silently skipping incoming dependencies. Never select
   unrelated orphan rows. Refuse cross-account/workspace descendants rather than
   guessing shared ownership policy. Worker opener retains strict canonical
   manifest/schema admission; unknown table/key shapes fail closed.
3. Temporarily lift existing delete guards only inside the transaction, delete
   selected rows, preserve demo lifecycle/replacement semantics, restore every
   original guard and retain global FK validation. No private file is removed.
4. Validate each unshared private object and its protected vault boundary,
   digest, size, persistent parent-directory identity and directory-fsync support.
   Persist job plus every object obligation in the SAME transaction as logical
   deletion. Failure before commit rolls back rows/guards/job and preserves bytes.
   The worker connection uses FULL synchronous durability after its existing
   connection admission, leaving ordinary connection policies unchanged.
5. After commit, mark each object `unlink_pending` in its own durable transaction
   before unlink. Under the next immediate transaction, recheck surviving
   references, verify exact bytes, unlink and fsync the directory, then record
   the purge receipt. A newly shared object is verified and retained. A missing
   `prepared` object is an error. A missing `unlink_pending` object can be safely
   reconciled after a process interruption because logical deletion and its
   unlink intent already committed. Missing obligation rows refuse completion.
6. Mark complete only after every obligation is purged or retained; scrub object
   keys/hashes and target binding. Retain only random operation ID, action,
   timestamps and aggregate object count in the outbox. A separate owner-approved
   history retains member UUID/display name and evidenced outcome for 30 days, then
   expires and purges it. Unfinished cleanup obligations never expire.
7. Return normal `deleted` JSON and existing cookie behavior only after the
   writer closes its DB and actually exits. No 202, timeout kill, client-disconnect
   cancellation, automatic root-deletion replay, or independent deletion queue.
   One supervised off-main worker handles startup recovery and 15-minute history
   housekeeping. Full 128-row expiry batches schedule another pass after 2 seconds,
   after actual prior worker exit. Failed recovery remains durably pending.

Post-commit purge failure means logical deletion is already permanent, with
cleanup still pending. It cannot truthfully mean that nothing was deleted.
This explicit failure contract was part of the broader correction authorized
by the owner. Physical multi-file unlink is not atomic; recovery obligations,
not a fabricated all-or-nothing filesystem claim, cover interruption.

## Shared-file publication audit

Primary evidence promotion and publication run within the same immediate write
transaction at both commit paths in `journal-import-product-service.ts` and in
`journal-private-source-import.ts`. The cleanup transaction takes that same
SQLite writer lock and rechecks `journal_import_batches.evidence_object_key`.
Thus another primary publisher either commits a surviving reference before the
check, or promotes/recreates bytes after cleanup before publishing its reference.
Support-source keys are independently random and non-reused; existing support
publication in `journal-support-consent-service.ts` does not publish an arbitrary
client-supplied prior key. Cleanup additionally rechecks all surviving support
object references. No broad source-vault access fence is introduced.

This audit is specific to these publishers and manifest. Any new publisher must
preserve atomic primary promotion/reference publication and non-reused support
keys, or revise the protocol before using it. No external out-of-band file
writer or overlapping application replica is authorized.

## Bounds and availability limits

One worker, zero queued independent requests, at most 1,000,000 materialized row
keys, 10,000 candidate objects, 256 MiB per object and 2 GiB total object bytes.
Root closure checks a cooperative 30-second phase budget between SQL operations;
budget refusal rolls back rather than truncating deletion. No claim of a hard
deadline during native SQL/I/O. Pending jobs exclude another deletion via the
unique active slot; supervisor occupancy remains through actual worker exit.

Unrelated WAL readers and the JS event loop can continue while the erasure
worker executes. The synthetic loopback responsiveness check covers the actual
closure engine holding an immediate transaction, not a full deployed Next
health/browser acceptance. Global FK validation remains database-wide; missing
child indexes can still cause scoped SQL scans. Worker isolation does not cure
shared-volume stalls or guarantee performance for arbitrary data populations.

**Important residual limitation:** other existing main-thread SQLite writers
retain their normal 5000 ms busy timeout. Session activity touches and background
completion writes can still stall JS for up to that wait while erasure holds the
writer lock. This bounded slice removes the direct unbounded synchronous erasure
path, not all app-wide synchronous database waits. No fully-nonblocking claim.
Normal synchronous runtime opens/structural validation/readiness also remain.

A blanket 0 ms admission prototype was discarded before integration: session-touch
BUSY can become a false authentication failure, and login-mail/notification
delivery can finish externally before their receipt write, producing ambiguous
retry behavior. No auth/job receipt is suppressed. The shared opener is unchanged
by this feature; removal receipt Git blob
`ebb81344cbe00fa5d98a3ed98d11d416e0456577` includes only its pre-existing dirty work.
Coordinator marked the proposed admission-hook reservation released/unused.

Smallest separate proposal, requiring owner approval before product behavior
changes: defer optional session touches without invalidating an already-verified
session or fabricating last-seen timestamps; prevent new durable-job claims
during erasure; await actual writer exit before recording an already-completed
external effect, keeping its existing idempotency and receipt. Review
`platform-session-service.ts`, `platform-login-mail-queue.ts`,
`platform-remote-notification-delivery-service.ts` and the relevant analyzer/
broker/background completion paths before proposing any general admission
policy. Verify expired/revoked sessions still fail, no duplicate delivery, no
lost completion receipt, preserved durable retries and prompt unrelated reads.
This proposal is not implemented or silently assigned to another worker.

## Migration, digest domains and release gates

Coordinator reserved namespace `platform`, export
`platformAccountErasureRecoveryMigration`, ID
`0183_platform_account_erasure_recovery`, order 220, exactly three tables:
`platform_erasure_operations`, `platform_erasure_objects` and
`platform_erasure_history`. The unapplied descriptor was amended under the
owner-confirmed 30-day retention decision; four history indexes bound recent,
member-specific, expiry and interrupted-phase lookups.
Standalone production 146 -> 147; no dependency on held 193–219 nodes. If 220 is
selected first, Coordinator must reconcile unapplied combined migrations ABOVE
the applied 220 prefix. Do not rewrite those migrations in this feature.

Historical hosted ordered migration-ledger identity digest:
`2fd30a5d96e6585b011c5557a6229bc75c8aa1c9800970574a4ce31621819f5c`.
This was supplied by Coordinator, not freshly sampled here. It is NOT a physical
`sqlite_schema` digest.

Fresh synthetic 146 physical-schema digest from immutable 760 source:
`45e694d19e9349c2f92bf7f70c19804d3c4216373c0ee3e7179ac439a846165d`.
Its exact domain is non-`sqlite_` table/index/view/trigger rows from
`sqlite_schema`, ordered by type/name/tbl_name COLLATE BINARY; serialize arrays
`[type,name,tbl_name,normalizePlatformLineEndings(sql)]` via `JSON.stringify`,
append one newline, SHA-256 UTF-8. See `platform-schema-digest.ts`. Comparing
these two unlike digest domains is not evidence of a hosted schema mismatch.

Migration SQL checksums use normalized statement strings joined by
`\n-- traderlink-statement-boundary --\n`, trim trailing newlines, append one
newline, SHA-256 UTF-8. Final source receipts include all ordered IDs, namespaces,
orders and checksums; no private data or runtime UUIDs.

Fresh synthetic 147 initialization/worker execution is not hosted-target
acceptance. Release requires fresh exact source/ledger/volume checks, capacity,
backup/restore and target 146-to-147 rehearsal, compatible prebuilt 147 application
and recovery images BEFORE volume handoff, one writer/zero overlap, and final
health plus actual browser/concurrent-request qualification. Old 146-only runtime
cannot be assumed a strict-readiness-compatible rollback after 147. Do not restore
an older DB over newer user data or discard unfinished purge obligations. No standalone 147
production release of this slice is selected. The owner has authorized the
Coordinator to finish/rehearse/build/deploy the combined feature when ready. Coordinator later reported current
main `2b4e0c2e00935bc4b0e61d06471eafac2d7fe122` (parent 760), with 11 Watchlist
files that must remain. Production 760 is this artifact's immutable verification
base, not the next release parent. Reconcile the narrow patch against freshly
verified current main; never reset/rebase this mixed checkout. Reserved index
0184/order221 may join the release. If 221 is applied first, this still-unapplied
220 must be reassigned above 221 before integration; no such reassignment here.

## Read contract for Administration outcome reporting

Server-only owner-authorized reads must first establish that the registered
tables are available. Absence is unavailable evidence, never zero deletions.
Use opaque administration references rather than exposing operation IDs. Do not
return object keys, file digests/sizes, vault identities or target bindings to
the browser. Scope private detail access through the existing audited owner
authorization; this schema creates no additional administrator permission.

`platform_erasure_operations` contains `operation_id`, `target_binding_sha256`,
`action`, `state`, `active_slot`, `created_at_utc`, `completed_at_utc`, and
`object_count`. `purge_pending` means logical deletion COMMITTED and physical
cleanup is unfinished; it does not mean the deletion is waiting to start.
`complete` means every manifest object was purged or retained for a surviving
reference. `object_count` counts deduplicated private objects, not accounts,
users, executions or trades. Completed rows have no target binding or object
details. There is at most one active operation globally.

`platform_erasure_objects` contains `operation_id`, `ordinal`, `kind`,
`object_key`, `sha256`, `size_bytes`, `vault_identity`, and `phase`.
`prepared` means committed obligation, no durable unlink intent yet;
`unlink_pending` means its unlink intent committed, requiring reconciliation;
`purged` and `retained` are per-object receipts. Object rows disappear when the
whole operation completes. These internal phases must be translated to plain
language rather than printed as codes.

The new third table supplies admitted-request history under the explicit
owner-approved 30-day exception. Its exact DDL, five phases, safe failure kinds,
retention, producer write boundaries and audited read contract are in
[the history contract](account-erasure-history-contract-20261026.md). It records
accepted/not-deleted/committed-cleanup-pending/complete/unknown outcomes, never
backfills the historical 499 or infers its person/action. Rejected unauthenticated,
CSRF-invalid, unconfirmed or worker-busy requests are outside coverage. The legacy
`privacyRequestState: not_available` field remains unavailable evidence.

Completed outbox rows remain anonymous, but history separately retains the
approved stable member UUID and display-name snapshot until fixed expiry from
acceptance. Readers exclude expired rows immediately. Physical expiry batches
are bounded and off-main; unfinished cleanup obligations survive history expiry.
Browser DTOs never expose raw member/receipt IDs, target bindings or object facts.

Bound history reads to 50 plus continuation through the approved indexes and
existing audited owner-access boundary. No all-history aggregate/polling scan
is required. Missing tables mean unavailable, not zero deletions. Honest reporting
preserves the distinction between endpoint attempts and durable admitted-request,
logical-deletion and cleanup evidence.

## Verification record

Final focused serial result: **56/56 tests across 8 files**. Targeted TypeScript:
**22 roots, zero diagnostics**; targeted ESLint passes. The exact-production 760
plus standalone 147 private-file verifier and packaged worker both pass fresh
synthetic fixtures. Native Node 24.22.0 / SQLite 3.53.0; linked 30-day history is
recorded and completed by the packaged worker. No further heavy worker checks
are planned; Coordinator owns the combined 220+221 rehearsal and sole joint build.

Immutable source patch:
`/tmp/traderlink-erasure-release-20261026/final/erasure-source.patch`, SHA-256
`44f1ab3b04091cec5894299d930029a499fa621d1558cc2b32c572860164097d`.
Complete 28-file allowlist, per-file Git/SHA-256 provenance, pure 147 registration
patch, source SQL, ordered 147 identities and native result are in that same
`final/` directory. Code/disclosure source is frozen; documentation receipts do
not broaden the code allowlist. The current mixed working manifest remains
untouched by this feature. Do not deploy the dirty checkout.

Final 0183/order 220 SQL checksum:
`4970c600cb3be750271786ac6b1c5b9980aa66b89267eddb02d06bb2481a2337`.
Fresh synthetic 147 physical-schema SHA-256:
`b60d08bdb7f87ef9e7841649c3a404870337a7fd93c3bc01d01ad515741a50af`.
This is a fresh-source physical schema receipt, not the hosted ordered-ledger
identity digest and not production-data rehearsal acceptance. A joint 148 image
must have matching 148-aware recovery/readiness; standalone 147 proof is not that
acceptance.

Ready existing isolated rehearsal entrypoint:
`./node_modules/.bin/tsx src/scripts/verify-platform-account-erasure.ts` from the
Coordinator's isolated joint candidate. It creates/removes fresh temporary
synthetic DB/vault fixtures and never opens the configured live DB.


Focused serial synthetic suite and final source receipts are recorded in the
immutable handoff artifact. Coverage includes root boundaries, nullable/composite
FKs, cycles, long chains, row-budget rollback, large unrelated population,
guards/global FK failure rollback, all actions/demo modes, stale session/scope/
selection rejection, shared-reference races, missing obligations, pre-commit
purge refusal, three actual process-exit cutpoints on disposable WAL/files,
HTTP/cookie/CSRF/error parity, worker actual-exit occupancy and native-worker
loopback responsiveness. Not every filesystem/volume failure or power-loss
behavior is experimentally qualified; hosted storage durability remains a gate.

Targeted Node worker bundles and private-file verifier were built in `/tmp`
using this source allowlist plus 169 dependency sources read from immutable 760
Git blobs. No application build, existing compiled asset rewrite, preview,
hosted DB inspection/migration/restart, commit, push or deployment was run.
All actual DB execution used fresh disposable synthetic fixtures only.
