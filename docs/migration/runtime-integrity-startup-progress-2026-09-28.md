# Runtime integrity startup correction — 2026-09-28

Status: narrow source candidate and focused simulated proof complete. No push, deployment, database mutation, migration or hosted configuration change by this task. Coordinator owns release and hosted acceptance.

## Evidence and approved boundary

Coordinator supplied exact production parent `f702f7254d05c5f9d8e2d8addc92076673ebccdf`, whose tree restores `705385767d45704320cedb02b967d6341027ecc6`. The rollback deployment's synchronous first-open scans took FK 54.759 seconds plus quick_check 104.327 seconds, totaling 159.282 seconds. With the sole persistent volume and zero deployment overlap, readiness was unavailable during that work. These timings are Coordinator-reported, not newly measured by this task.

The owner-approved correction intentionally admits requests after the fast structural/connection checks while the first mandatory full data scan is pending. This is a detection-latency change: pending is not verified, and existing data violations might not be detected until the background scan reaches them. Failed or timed-out workers retain bounded retries; repeated operational failure provides no finite successful-verification deadline. Actual detected corruption or foreign-key failure remains latched and rejects subsequent opens.

## Corrections

- First-open runtime verification calls the existing synchronous structure validator: complete manifest, applied migration registry/checksums, expected tables, migration count and schema digest still gate access. Connection/path/persistence checks in both openers are unchanged. A second structure fingerprint check rejects file identity/schema changes during this startup validation.
- Publish the shared process state and schedule exactly one zero-delay timer. The current request returns before the native child is launched. Both FK and quick_check are marked due; the existing isolated read-only child performs the combined scan.
- Do not establish success timestamps or startup cooldowns for work that has not run. Do not log a full baseline success. The new diagnostic states that structure passed and the data scan was scheduled.
- Preserve the complete worker, actual-exit occupancy, generation/data-generation identities, pre/post file/schema fingerprints, corruption and FK latches, late-failure handling, phase deadlines, retry limits, cooldowns and numeric diagnostics.
- Keep identity/structure/protocol recovery on the existing fail-closed full-revalidation path, including waiting for actual child exit and cooldown. Migration, backup and maintenance full verification are unchanged.

## Verification

- `scripts/runtime-integrity-startup-proof.cjs` runs against an exact commit, optionally reading the two allowlisted candidate source files from a scratch directory. It uses fake timers, child processes, filesystem metadata and database access; it never opens a real database or starts a real child/server.
- Passing candidate proof: actual readonly opener returns before scan launch; repeated opens schedule only one combined scan; result alone cannot release the reader slot; unchanged data does not rescan after success; invalid structure rejects before scheduling; FK and corruption failures remain latched; spawn failure retains bounded retry; timeout retains occupancy and late corruption still latches; changed identity rejects and cannot overlap the child.
- Negative control against unmodified `f702f7254`: fails at the expected synchronous full scan. This establishes that the proof distinguishes the first-open correction from the old behavior.
- Targeted TypeScript syntax/transpile and ESLint: zero errors or warnings in the two candidate modules and proof script. Diff whitespace check required at checkpoint.
- No Vitest, broad tests, production build, full semantic typecheck or hosted timing check by this task. This is simulated source proof, not proof of native scan performance or outage-free deployment.

## Allowlist and release order

Infrastructure checkpoint contains only:

- `src/modules/platform/server/database/open-platform-database.ts`
- `src/modules/platform/server/database/run-platform-migrations.ts` (contract comment only)
- `scripts/runtime-integrity-startup-proof.cjs`
- `docs/migration/runtime-integrity-startup-progress-2026-09-28.md`

The separate child checkpoint reapplies Package A's five application sources and documentation only. Watchlist Package B is excluded. Exact commits, blob hashes and patches are recorded in `qa-evidence/pwa-startup-repair-20260928.json` after checkpoint creation.

Coordinator acceptance: exact deployed source/parent/allowlist, successful startup and HTTP health with schema 129, first combined scan scheduled then completed, no duplicate reader, failure/timeout diagnostics, and measured visitor availability during the single-volume cutover. Removing the synchronous scan does not eliminate all possible zero-overlap restart downtime. Do not weaken storage ownership or add deployment overlap as part of this correction.

Rollback: no data/schema rollback is needed. Reverting infrastructure restores the long synchronous startup scan and therefore may recreate the availability problem. Package A can be reverted while retaining the infrastructure correction; card and summary/detail API changes must stay paired.
