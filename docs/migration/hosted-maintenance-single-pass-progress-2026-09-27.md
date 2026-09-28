# Hosted maintenance single-pass verification — September 27, 2026

Status: local implementation and focused controlled verification complete.
Coordinator integration, native rehearsal, measured maintenance-window decision
and release remain outstanding. No hosted or configuration actions performed.

## Approval and controlling inventory

The owner authorized proceeding through the backed-up release work. Coordinator
assigned the diagnosis from chat 01a050dc-6271-7c13-b4b4-5e82f21f8549 and accepted
the exact technical file/behavior plan before editing. The following complete
cumulative maintenance inventory includes the earlier unreleased `2af964a8` slice:

1. `src/modules/platform/server/database/run-platform-migrations.ts`
2. `src/modules/platform/server/database/run-hosted-platform-migration-maintenance.ts`
3. `src/modules/platform/server/database/platform-database-backup.ts`
4. `src/modules/platform/server/database/platform-maintenance-verification.test.cjs`
5. `src/modules/platform/server/observability/platform-maintenance-observability.ts`
6. `instrumentation-node.ts`
7. `docs/migration/hosted-maintenance-single-pass-progress-2026-09-27.md`
8. `docs/migration/hosted-maintenance-verification-progress-2026-09-27.md`
9. `docs/migration/runtime-integrity-timeout-recovery-2026-09-27.md` (earlier backlink only)

The incremental patch parent is `89c08ef39651fb6ab10623a741861c44cdd585b1`.
Production base for cumulative maintenance review is
`e159292900b7be252a6547412993d83312e74bac`. The exact incremental commit and raw
cumulative allowlisted diff hash are supplied in the immutable handoff. Do not
deploy this older entire checkout or assume the incremental patch includes its
unreleased logger/dedup dependencies. No feature files, 0147 migration/manifest,
runtime scan scheduler, timeout, cache settings or configuration are changed.

## Approved plan and completed implementation

- [x] Add explicit `verifyPlatformMaintenancePreflightStructure`, preserving
  manifest validity, registry prefix/checksum, expected tables and schema digest.
  Only the exact-predecessor apply path uses it. Full runtime verification and
  `already_applied` full verification retain their original scan behavior.
- [x] Gather source evidence once, before recovery authority, directory creation
  and copying. That evidence includes full FK/quick verification plus pragmas,
  registry/schema, counts, page geometry, file hash/identity and sidecars.
- [x] Retain one complete independent full verification on each source, copied
  backup and restored-copy handle. No result cache or receipt crosses handles.
  The earlier `2af` change removes only explicit duplicate evidence pragmas.
- [x] Preserve recovery-authority checks and comparisons across registry, counts,
  geometry, schema and backup/restore file bytes. Migration/postchecks unchanged.
- [x] Add safe phase start/completion/failure timings, including the actual existing
  readiness call only when maintenance was requested. Ordinary startup follows
  its original readiness call. Background workers still wait for readiness;
  errors still exit through the existing runtime catch.
- [x] Execute focused controlled flow, targeted semantic/lint checks and inspect
  the narrow diff. Prepare immutable local commit and Coordinator handoff.
- [ ] Coordinator native rehearsal with representative restored data and measured
  phase durations, compatible schema/source reconciliation, and release decision.

## Check counts and safety boundary

The original release path performs eight complete FK/quick pairs before applying
migration: preflight one, backup-entry one, then source/backup/restore two each.
The first unreleased `2af` slice reduces that to five. This cumulative correction
performs exactly three: source one, copied backup one, restored copy one. The
structure-only preflight itself supplies no data-integrity acceptance: migration
cannot begin until all independent checkpoint checks and comparisons succeed.

These counts exclude initializer/post-migration and hosted readiness verification,
which remain unchanged and add further work. In the already-applied branch,
preflight still performs one full pair and then ordinary hosted readiness runs.
The structure helper is not a general bypass flag and must not be used to grant
runtime readiness or skip backup verification.

The orchestrator must maintain an exclusive no-write maintenance state throughout
source evidence, authority verification, copies and migration. Existing source
hash/count evidence is not an online concurrent-writer snapshot guarantee. Moving
source evidence before authority does not authorize intervening writes. The
original independent comparison and restored-copy requirements remain mandatory.

## Verification evidence and limitations

- 27/27 serial Node tests pass in approximately 0.65 seconds. They execute actual
  transpiled verifier, backup, maintenance runner, observer and runtime entrypoint
  with controlled SQLite/filesystem/readiness adapters. No real files/databases,
  application processes, timers or hosted scans are created.
- Exact three-pair ordering and four separate read-only handles are asserted.
  Fixtures reject manifest/registry/table/digest failures before data scans;
  exact predecessor mismatch, all FK/quick/copy failures, source/backup/restore
  pragma failures, missing authority and count/hash mismatch prevent migration.
  Already-applied still executes full checks. Migration and readiness failures
  prevent worker startup. Logs contain fixed phase/status/duration fields only;
  unavailable logging does not alter outcomes.
- Targeted semantic check: three roots, 334 resolved source/declaration files,
  zero diagnostics. Entrypoint transpilation has zero diagnostics; its full
  transitive runtime graph is reserved for remote CI. Five changed runtime files
  pass targeted ESLint with zero errors/warnings. Git diff check passes.
- This is controlled call-flow evidence, not a native restored-database migration
  rehearsal. No broad suite, build, server, dependency install or hosted operation
  was run. No UI or Help guide update is needed for internal maintenance changes.

## Availability and remaining release gate

This is a single-replica, zero-writer-overlap startup-maintenance architecture.
Guarded scans, hashes, copies, migration and readiness delay availability; reducing
duplicate scans cannot promise they finish within the existing 300-second health
window. Storage-pressure variance remains material. Coordinator must choose and
measure an adequate bounded maintenance window before release. Do not fake
readiness, bypass scans, add a second writer or repeatedly retry the same carrier
as a substitute for that decision. Serving during maintenance with writer
quiescence would require a separate reviewed design and is outside this patch.
