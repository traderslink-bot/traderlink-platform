# Runtime integrity scan cooldown — September 27, 2026

Status: implementation and focused controlled verification complete. Native CI,
release and natural hosted-cycle acceptance remain Coordinator-owned gates.

## Approved scope and plan

Coordinator relayed the owner's direction to diagnose and fix the recurring
outage and explicitly approved this timing-policy change after describing it
to the owner. Work stays in the assigned existing repair checkout. No hosted
actions, cache changes, migrations, broad local suites or builds are authorized.

- [x] Anchor healthy FK/quick scheduling to actual process exit, with respective
  five-second/sixty-second intervals; retain dirty work from concurrent writes.
- [x] Anchor operational retry backoff to actual exit, with the corresponding
  interval as a minimum; never permit FK-only recovery from failed combined work.
- [x] Preserve full scans, single-flight occupancy, schema/identity gates,
  sticky corruption, generation isolation and all existing phase deadlines.
- [x] Verify focused scheduler cases, targeted source diagnostics and patch.
- [ ] Coordinator remote build/native smoke and controlled release.
- [ ] Observe natural hosted scans and availability before claiming outage fixed.

## Diagnosis and chronology

The confirmed scheduler defect is start-anchored cadence plus failure-anchored
retry delay. Long scans can consume their entire interval, and termination can
consume the retry delay. Thus another reader can start immediately after exit,
continuing expensive whole-database reads. This proves amplification potential;
it does not prove the initial storage slowdown or its only cause.

September 11 changes `96a1cf41`/`914f0ffc` already used start-anchored quick checks
every sixty seconds with a thirty-second timeout and synchronous fallback.
September 23 change `6f5226a3`, deployed as `67eadb8e` on September 24 01:27 UTC
(September 23 Eastern), moved FK checking off requests to a five-second cadence
and one read transaction for combined checks. Moving FK off changed-data requests
does not itself prove a higher aggregate FK workload. September 25 records show
30/63-second background timeouts and 39.9/102.3-second synchronous fallbacks at
17:32–17:36 UTC, before reverse-split collector activation and before `efd75f38`.
The latter introduced pending/503 recovery and a 120-second timeout; it changed
the failure symptom, not the first recorded slowdown. September 27 `c3c81e98`
also follows the earlier failures. No consistently stable last source is proven.

The dependency lock blob is identical at `914f0ffc`, `67eadb8e` and `4770e0e4`.
Coordinator's actual-image metadata reports SQLite 3.53.0, 16 MiB private cache,
mmap disabled, and 719,777 pages of 4096 bytes. SQLite's quick check traverses
btree/freelist/overflow pages and validates table records; it is not a metadata
probe. Kernel I/O waits and refault counters support storage/cache pressure but
do not distinguish host contention from application-generated pressure alone.
No source evidence of duplicate integrity schedulers was found: read/write
handles share the process-global map and the child imports no application code.

## Implementation and timing tradeoff

Release deadlines are separate from successful verification evidence. Optional
deadline fields preserve existing process-global v3 entries during module reload.
Every child exit enforces a five-second gap before any next reader; a combined
exit also sets its next quick-check deadline to exit plus sixty seconds. This
global gap prevents an overdue quick check bypassing the FK release cooldown.
Spawn construction failure uses the failed creation time as its release.

Operational failure retains pending readiness and marks dirty work, but retry
eligibility stays at infinity until actual exit. Exit then applies the existing
5/10/20/40/60-second capped backoff, floored at five seconds for FK-only and sixty
seconds for combined attempts. A failed combined retry still performs both checks.
Result IPC alone and signal requests cannot release occupancy or approve health.
Old-generation exit can delay new work but cannot clear its failure/pending state.

This intentionally increases detection/recovery latency to reduce repeated I/O.
A successful combined scan of duration D now has at least D+60 seconds between
combined starts; intervening FK occupancy can delay it further. Failed combined
recovery cannot start until sixty seconds after exit, then retains the existing
phase limits (less than 240 seconds total). Repeated failures, uninterruptible
exit or a blocked event loop prevent an overall recovery guarantee. An isolated
quick check still exceeding 120 seconds remains fail-closed; this patch cannot
guarantee storage performance. No timeouts, cache/mmap settings or checks change.

## Evidence and handoff

Forty serial Node tests execute the actual transpiled scheduler against controlled
processes, filesystem fingerprints and time; no real database or app server runs.
They cover long successful scans, writes during snapshots/cooldown, expired quick
deadlines during FK work, delayed termination, combined retry floors, spawn errors,
complete-result/actual-exit recovery, stale generations and sticky corruption.
The first pass exposed an old test that advanced through a newly delayed FK scan;
its cycle now explicitly completes that scan before testing the next quick cycle.
This is controlled scheduling evidence, not native SQLite or production proof.
Targeted semantic check: one root, 324 resolved source/declaration files, zero
diagnostics. Targeted opener ESLint: zero errors/warnings. Git diff check passes.

Exact patch parent is `2af964a8bbccd1d6676ab3382d85f59c2b8dbcd2`.
Only this child commit is the outage slice. Do not include the parent's separate
maintenance deduplication or deploy this old checkout tree. Coordinator must port
the narrow patch onto reconciled production source (`48a66955` / `4770e0e4` tree).
Allowlist: runtime opener, its focused test, this progress record, and the parent
recovery document backlink. No UI or Help Center guide change is required.
