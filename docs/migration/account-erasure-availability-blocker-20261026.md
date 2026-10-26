# Account erasure availability — source-only stop

Status: blocked before implementation; no runtime patch; not release ready.

## Source receipt and ownership

Assigned existing integration checkout: `/home/traderlink/projects/traderlink-platform`.
Branch `main`, local HEAD `ef2d97b031b546f392769fd5725b3dba95d252f0`;
mixed unrelated tracked/untracked work preserved. No branch/index/ref changes.
This worker's assignment is erasure only; Coordinator retains release authority.
No new independent ownership register was found among the scoped progress records;
the explicit assignment supplies this slice's authority, not authority over shared files.

Recorded production parent: `760e754e2e5755e5b47cefaa82c54f39bc538d48`.
Local Git contains that commit. Its tree and current working file hashes agree:

| File | Git blob |
| --- | --- |
| `app/api/platform/account-erasure/route.ts` | `5e34f2cabe5edfce6ea569e3f8d754b5a132cbc3` |
| `src/modules/platform/server/privacy/platform-erasure-service.ts` | `6e9e27e35038f7645324000a3ec521c2f82c6cea` |

Read-only incident plan SHA-256 verified:
`47088fadb9ea199d3b46e0250f251d11a71a359afe3b60d30c7a7c949e293c35`.
No hosted metadata or schema was refreshed; schema146 remains supplied context.

## Precise source/design blocker

`withPermanentDeleteTransaction` invokes the operation, restores guards, performs
global FK validation, then commits via the immediate transaction wrapper.
Every erasure variant invokes `purgePrivateArtifacts` inside that operation.
The route loops through objects and calls the vault purge functions sequentially.
`purgeJournalEvidenceObject` (vault source line 486) and
`purgeJournalSupportSource` (support vault line 177) call `unlinkSync`.
Those irreversible filesystem changes do not roll back with SQLite.

After one unlink, a second object's verification/purge failure, FK validation
failure, commit failure, or process interruption can leave restored database
references to a deleted object. This is a pre-existing source risk, not an
observed production outcome. The existing disposable verifier's injected failure
throws before performing any purge; it does not establish partial-purge or
interruption recovery. It was read, not executed.

A worker that never times out or retries still cannot make filesystem unlink
atomic with SQLite commit or prevent process/host interruption. Moving purge
after commit reverses the failure window and changes existing semantics. Merely
moving this code off-main therefore cannot establish the requested crash/privacy
guarantees. No approved durable purge/commit/recovery protocol is supplied, and
inventing one within route/service/worker alone without failure verification is
speculative. The immutable incident plan explicitly requires that review before
selecting process isolation.

Separately, replacing the global orphan sweep requires capturing all scoped
deleted rows before the existing direct deletes, complete composite-key and
nullable-FK handling, cycle/shared-reference policy, and fail-closed schema
coverage against the exact canonical manifest. Local shared dependencies and
manifest are dirty. A generic traversal written here without the forbidden
isolated deletion/isolation checks would not establish preservation of all
three actions, demo replacement/lifecycle, and unrelated-row equality. Global
FK validation must remain until equivalent validation is proven.

## Disposition

No application file changed; runtime patch allowlist is empty. No patch should
be released from this stop report. Semantic regression risk introduced: none;
existing availability/scope/partial-purge risks remain unresolved.

Before implementation can proceed, select and review a durable recovery
protocol, its handling of ambiguous completion and shared private objects, and
single-erasure occupancy through actual worker exit. Reserve a migration only
if the selected protocol requires persistent database state; migration need is
undetermined, not zero. Separately authorize isolated synthetic failure and
closure verification, or provide independently validated implementation evidence.
These are proposed prerequisites, not actions performed or permissions requested.

No tests, type/lint checks, build, preview, database open/query/scan, migration,
hosted change, commit, push, or deployment performed. Reverse splits and Setup
Detection untouched. No UI behavior changed; Help Center update is unnecessary
for this source-only stop. Documentation-only allowlist: this report and the
link in `account-settings-and-erasure-progress.md`.
