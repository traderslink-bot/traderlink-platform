# Coaching production integration preparation — October 16, 2026 UTC

This is a prepared source artifact and synthetic rehearsal, not a production
release candidate approved for deployment. No branch, runtime file, hosted record,
configuration or database was changed. Production deployment remains unauthorized.

## Exact source and prepared artifacts

Remote refs were read during this checkpoint: main
`82784f53cf8aaf94a4f6efb810b9c0b5ed99fba9`, staging
`0509afea52b5a227cc48831c8c0352f8a8b7f0e0`.
Main has13 unique commits and staging244 since their common ancestor. A dry-run
Git merge produced tree `aea0cf67b562c8d4c16e93db558105e3e68fb441`, without
conflicts or checkout/index/branch changes. This retains17 production files
relative to staging, including gain-start controls, latest Watchlist changes and
supporting Help/recap code. Newer SQLite code also combines cleanly; semantic
integration/build verification is still required.

Raw staging manifest is a staging-only compatibility carrier. It changes25
production migration execution orders while retaining their checksums. Promoting
that ordering would fail production prefix validation. Source production has140
migrations; Coaching adds20. These are SOURCE counts, not new hosted-ledger proof.

Prepared production-only manifest preserves the complete140-entry production
identity/order/checksum prefix and appends20 unchanged Coaching SQL migrations at
orders159–178. Production starts with gaps in its execution order; count and
maximum order are different. No historical SQL or migration ID is rewritten.
Prepared tree `1f82da50b80ec9b835426a69d4567426957c66b8` contains this correction.
It is a Git tree object, not a commit or published branch. Its complete268-file
scope is retained in the proposal below, and must be reviewed before approval.

Artifacts under
`/workspaces/traderslink-coordinator/preservation/coaching-production-readiness-20261016/`:
- `candidate-proposal.json`: exact parents/tree identities and complete file scope.
- `production-platform-migration-manifest.ts`: production-only manifest artifact.
- `production-manifest.patch`: single-file patch against the dry integration tree.
- `source-reconciliation-before.json` and `source-reconciliation-after.json`:
  exact source migration comparisons and synthetic rehearsal results.

Do not apply this artifact to the existing staging database: its retained160-row
ledger uses a different order. Do not rewrite that ledger, reset staging, switch
its volume, or delete QA evidence. The isolated artifact is preserved separately
from all running application files. Temporary Git index resides in the artifact
folder; the active checkout index and branch are unchanged.

## Verification and proof boundaries

| Item | Result |
| --- | --- |
| Source integration conflict detection | PASS — dry merge only, not semantic/build proof |
| Original staging manifest versus production prefix | FAIL as expected —25 order conflicts, no SQL checksum conflicts |
| Prepared production-only manifest versus production prefix | PASS — full prefix identical, no order/checksum conflicts |
| In-memory production-schema upgrade | PASS —378 tables, quick_check ok, zero foreign-key violations |
| In-memory fresh initialization | PASS — same378 tables, quick_check ok, zero foreign-key violations |
| Synthetic initialization creates no pilot seed records | PASS — zero communities/operator grants/roles/destinations in both cases |
| Existing staging compatibility | INCOMPATIBLE by design — preserve its history; requires a separate rehearsal strategy |
| Integrated candidate lint/types/build/affected-flow verification | NOT RUN — no finalized release commit yet |
| Hosted production ledger/backup/config/recovery | NOT VERIFIED by source-only rehearsal |
| Final production release/owner acceptance | NOT AUTHORIZED / not ready |

The in-memory fixture contains no copied customer data or real attachments. It
does not prove populated production upgrade, persistence, backup restoration,
key recovery, capacity or final operating readiness. Both commissions remain off;
student bulk export remains excluded. No existing QA fixture was touched.

## Work to complete before requesting production release approval

1. Coordinate current main and other feature owners; recheck refs and reserve the
   migration ordering, especially other pending membership migrations. This
   artifact reserves no shared migration lineage or release slot.
2. Materialize the reviewed integration and production-only manifest in a clean,
   isolated release candidate, preserving current production changes. Review the
   full268-file scope; it includes shared shell/auth/storage and is not a tiny patch.
3. Run one combined candidate verification/build gate and a bounded disposable
   production-lineage rehearsal. Reuse passed behavior evidence; test changed
   integration surfaces. Do not replace or migrate the existing staging fixture.
4. Complete authorized read-only production migration/configuration inventory,
   synthetic-data/bootstrap safeguards, disabled commissions, worker/retention/
   recurrence operating envelope, protected media/backup/restore and rollback
   gates. Any hosted backup/maintenance/release action requires its own authority.
5. Reconcile required L07–L09 acceptance. Onboarding provider-failure/race has
   isolated actual-service/component proof; staging observations and sanitized
   request capture remain explicitly untested. Do not waive required acceptance
   or call this whole-feature readiness. Owner-deferred optional tests stay closed.
6. Present the exact candidate/parent/file allowlist, rehearsals, recovery plan and
   unresolved items for separate production release authorization. No deploy now.

## Onboarding failure/race checkpoint

`verify-community-installation-status.cjs` PASS: actual action/service/SQL with
isolated provider; owner/admission/identity gates, provider403/429/500, malformed/
throwing/incomplete inventory, no immediate retries and zero writes.
`verify-community-installation-browser.cjs` PASS: actual React/MUI form, Light/Navy
1440×900 and390×900, four statuses, cancellation/recheck, safe error guidance,
Connect gating, pending controls and stale response on server selection change.
No hosted provider called. Screenshot artifacts `/tmp/community-installation-qa-AWNKBW/`.
These runtime files match the tested staging source. No coding defect reproduced;
no new runtime/Help change is justified. Actual staging mobile onboarding remains
separate from these component fixtures and passed mobile mapping/channel pages.


## Subsequent local UI slice — candidate refresh required

Owner requested Edit on every selected Coaching service card and preview entry.
`coaching-plan-builder.tsx` and Coaching Help were updated and verified in isolated
Light/Navy desktop/mobile component checks. The tree IDs and268-file proposal
above intentionally preserve their original checkpoint; they do NOT include this
new slice. Include it explicitly before materializing the combined candidate. No
production/staging branch, deployment or database changed for this UI work.


## Subsequent usability batch — refresh required

The October16 owner-approved UX01–UX13 local correction batch is documented in
[usability corrections](coaching-usability-corrections-20261016.md). Earlier tree
objects and file scope above do not include it. Explicitly refresh source and
verification before materializing/releasing the combined production candidate.
Neither the existing staging ledger nor current production has been modified.
