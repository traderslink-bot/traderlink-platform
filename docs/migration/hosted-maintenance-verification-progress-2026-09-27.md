# Hosted maintenance verification — September 27, 2026

Follow-up approved after the failed maintenance carrier: [single-pass source and
structure-only preflight correction](hosted-maintenance-single-pass-progress-2026-09-27.md).
That record supersedes this first slice's five-pair count and retained full
preflight/entry scans. This file preserves the original checkpoint history.

Status: first-slice implementation and focused verification complete; local source
checkpoint ready for Coordinator integration review.
No release, hosted action, migration or supervisor redesign is authorized here.

## Reviewed plan and complete scope

1. Remove only the immediately repeated FK and quick checks in
   `readSnapshotEvidence`. Its full verifier already requires both checks.
   Retain full independent source, backup and restored-copy verification,
   entry/preflight verification, schema/registry/pragmas, counts, hashes,
   recovery authority and all checkpoint comparisons.
2. Add safe start/completion/failure logs around preflight, checkpoint, directory
   creation, independent evidence verification, copies, hashes and migration.
   Only fixed phase names, status and elapsed milliseconds may be logged.
3. Prove exact scan coverage/order and failure propagation with one small serial
   controlled flow; run targeted semantic/lint checks, no build or broad suite.
4. Make one narrow immutable local commit and hand it to the Coordinator.

Complete file inventory: `platform-database-backup.ts`,
`run-hosted-platform-migration-maintenance.ts`, new
`../observability/platform-maintenance-observability.ts`, focused
`platform-maintenance-verification.test.cjs`, this record, and a backlink from
`runtime-integrity-timeout-recovery-2026-09-27.md`.

The assigned existing checkout remains on `codex/workspace-combined-runtime-repair`
at parent `c3c81e98d5165bc85ebb96892f0a94457964b276`. The two target runtime files
and full verifier are byte-identical between that parent and serving `4770e0e4`.
This is a patch handoff, not a claim this older complete tree is deployable.
Coordinator must integrate onto the reconciled exact schema-compatible source.

## Evidence and equivalence boundary

Before migration, current code performs eight FK/quick pairs: maintenance preflight
one, backup entry one, then source/backup/restore evidence two each. Each evidence
call invokes the full verifier, checks connection pragmas, then repeats FK/quick
without a write between those calls. This slice reduces eight pairs to five;
it does not reuse a result across handles, copies, process lifetimes or writes.
Maintenance still requires the orchestrator's exclusive no-write checkpoint.
The unchanged helper must never be treated as online snapshot-consistency proof.

Recovery evidence reported by Coordinator: cold startup 77.85 seconds, then a
764 ms background FK scan. Rising read bytes with no observed throttling/OOM
supports slow progressing reads. This slice reduces redundant work and makes
phases visible; it cannot guarantee a duration or eliminate storage stalls.

## Progress

- [x] Owner/Coordinator first-slice authorization and clean scope/base verified.
- [x] Implementation and exact focused verification complete.
- [x] Narrow source checkpoint prepared for immutable Coordinator handoff.
- [ ] Coordinator integration, Linux build/rehearsal and separately authorized release.

No change to c3 background scanning, app startup gates, migration SQL/manifest,
entrypoint, timeout policy, writer count, product UI or data. No Help change is
needed for these internal maintenance operations. Logs remain diagnostic only:
`checkpoint started` or directories existing never imply an accepted backup.

## Verification and remaining risks

- 14/14 serial Node checks pass in approximately 0.75 seconds. The harness executes
  the actual full-verifier, backup, maintenance-runner and observer source with
  controlled SQLite/filesystem adapters; no real database or filesystem writes.
  It proves five ordered FK/quick pairs, independent backup/restore coverage,
  failure/copy rejection before migration, unchanged count/hash mismatch gates,
  closed handles, phase ordering/privacy, and logging-error isolation.
- The initial harness run found a fixture module-interop mismatch. The adapter
  was corrected; failure cases now require their exact expected error rather
  than accepting any rejection. No product fix was needed for that harness issue.
- Targeted semantic check: three roots, 145 implementation files, zero diagnostics
  with a 512 MB heap cap. All three runtime files pass targeted ESLint with zero
  errors/warnings. Diff whitespace check passed. Installed dependencies reused.
- No full build, broad suite, native SQLite rehearsal, local server, dependency
  install, hosted write, migration, restart, publication or deployment was run.

This slice does NOT fix the separately reported recurring background quick-check
I/O saturation. Its runtime interval, child deadline, retry and failure behavior
are untouched. Completion-anchored scheduling is only a separate proposal needing
explicit timing-policy review. Storage pressure remains an infrastructure risk.
The Coordinator must reconcile current source/image/schema before integrating,
then perform Linux build and exact restored-copy migration rehearsal. A completed
individual phase log is diagnostic, not whole-checkpoint or release acceptance.
