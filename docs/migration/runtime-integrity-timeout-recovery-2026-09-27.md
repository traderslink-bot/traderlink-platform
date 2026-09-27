# Bounded runtime integrity recovery — September 27, 2026

Status: local implementation and focused verification complete; source ready for
Coordinator review. Git records the immutable checkpoint and its exact parent.
No deployment authority. Coordinator owns remote build and release acceptance.

## Evidence and approved scope

Exact production base: `a741710f53503339b7df1882b472b00f8c0f56cb`.
The September 25 scheduler discards every result after a combined 120-second
FK/quick-check deadline, then retries the same scan while denying database opens.
The Coordinator reported a successful 132,487.5 ms startup scan: FK 43,264.9 ms
and quick check 89,097.7 ms. This supports deadline starvation; it does not prove
the underlying I/O/CPU cause or rule out corruption in an uncompleted scan.

The Coordinator accepted this bounded design and assigned the existing clean
`workspace-release-runtime-repair` checkout on
`codex/workspace-combined-runtime-repair`, exact production base above. Canonical
mixed work and the separate coaching registration file remain untouched.

## Implementation plan

1. Preserve fail-closed readiness after 120 seconds until a complete validated
   result and child exit. No partial-pass reopening or synchronous fallback.
2. Execute the same read-only snapshot checks in one isolated Node child. The FK
   phase has 120 seconds including startup. Only timely validated FK completion
   permits another 120 seconds for quick check, capped at 240 seconds from launch.
   Duplicated progress cannot slide either deadline. FK violations skip quick
   check and remain sticky, as do SQLite corruption results.
3. At the hard deadline send SIGTERM, then SIGKILL after a fixed five-second
   grace if exit has not occurred. Keep the single-flight slot until actual exit;
   never release it merely because a signal was sent. Report a missing exit once
   after another five seconds and stay closed without overlapping retries.
4. Preserve exact startup/migration/schema/connection checks, generation and
   identity validation, dirty writes during scanning, and capped retry backoff.
   Normal writes advance dataGeneration, not the identity generation: a result
   must echo its captured dataGeneration, not the latest write counter.
5. Add privacy-safe phase timing/outcome diagnostics and focused controlled
   clock/IPC verification. No UI/Help behavior changes or schema/data changes.

## Progress

- [x] Exact-source diagnosis and Coordinator design/workspace approval.
- [x] Implementation and focused verification.
- [x] Narrow four-file source checkpoint prepared for Coordinator handoff.
- [ ] Coordinator remote Linux standalone/native packaging smoke and build.
- [ ] Separately authorized release and repeated hosted recovery/health evidence.

## Limits and acceptance

This repairs discarded-completion starvation, not the underlying scan cost.
An overdue successful scan still denies opens between 120 seconds and completion.
An individual phase exceeding 120 seconds still fails. OS-uninterruptible I/O
can delay even SIGKILL: never claim a signal proves resource release. Missing
exit remains fail-closed, with one retained slot and bounded diagnostics; an
operator must investigate rather than spawn overlapping scans or restart blindly.
Timer dispatch also depends on the parent event loop. Message and exit handlers
recheck the absolute hard deadline; delayed IPC never extends the quick phase
because its deadline uses the child's actual phase start. Operational retries
retain the existing 5/10/20/40/60-second capped backoff, only after actual exit;
no polling loop, overlapping process or synchronous timeout fallback is added.

## Local verification

- 36/36 serial controlled-clock/process tests passed in about 0.6 seconds using
  the existing `platform-runtime-integrity-retry.test.cjs` and borrowed installed
  TypeScript through NODE_PATH. No install, real database or real child ran.
- The 132-second case denies at 120 seconds, does not reopen on a result alone,
  then recovers after valid completion and exit. It schedules no redundant scan
  without a new write; concurrent writes retain their pending scan.
- Covered independent phase/total hard limits, SIGTERM then SIGKILL, no exit/no
  overlap, no-result exit, spawn-error close, malformed/duplicate progress,
  phase timestamp validation, delayed IPC, nonzero exit, sticky corruption even
  around the hard cutoff, old-generation cancellation, and identity/schema gates.
- Executed the literal child source with stubbed SQLite: readonly/fileMustExist,
  connection close, CORRUPT/NOTADB classification and FK violation short-circuit.
- Targeted TypeScript semantic check: one root and 135 implementation files,
  zero diagnostics; 512 MB heap limit. Targeted source-text ESLint: zero errors
  and warnings after correcting one prefer-const issue. Diff whitespace passed.
- Help guides reviewed for unavailable-state guidance. No guide change needed:
  this changes internal scan recovery, not a user control, data or workflow.

Success logs remain bounded for routine checks; overdue recovery is logged even
after those initial samples so a later outage has explicit recovery evidence.
No private database path, stored contents, account identifiers or secrets appear
in these diagnostics. Node child stderr/stdout are ignored; startup/load failures
are treated as operational failure and cannot approve readiness.

Remote acceptance must use the exact Linux Node 24 standalone image and native
better-sqlite3 package: tiny disposable good/FK-invalid/corrupt databases, actual
IPC/exit and kill behavior, no live expensive integrity scan. Then verify exact
source/schema/volume and natural repeated background cycles plus public health.
No local server, dependency install, Vitest, broad tests/builds, live database
operation, notification, push, deployment or hosted configuration is authorized.
