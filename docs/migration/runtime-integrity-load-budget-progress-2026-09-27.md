# Runtime integrity scan budget — September 27, 2026

Status: local implementation and deterministic verification complete. Remote
native review/build and production acceptance belong to Coordinator; no deployment
or hosted action performed here.

## Owner-approved policy

Coordinator relayed explicit owner approval after disclosing detection latency:
never overlap full scans; coalesce dirty generations; after each completed scan
idle for at least ten times its wall duration and never less than the existing
minimum intervals; apply that quiet period after mandatory startup verification.
Scheduled or operationally pending verification must not itself block normal
requests after a successful full baseline while structural checks remain valid.
An actual integrity failure remains fail-closed. Startup, migration, manifest,
registry/checksum, schema, FK and quick checks remain mandatory.

This is an intentional safety/availability policy change, not equivalent timing
or a claim that pending verification succeeded. Only the owner-authorized
operational-pending readiness rejection is removed. Identity/structure recovery,
invalid registry/schema, startup failure and observed corruption still reject.

## Evidence and attribution

Coordinator supplied serving `e1592929`, deployment `575cc475...`, instance
`47b9e2dc...`: startup full verification 243,047 ms (FK 45,951 ms, quick check
196,920 ms), followed by a 52,729 ms FK-only scan and a 43,201 ms combined scan.
Earlier instances returned `background_verification_pending` and failed requests.
The exact source allowed FK scans after only five idle seconds even after long
successful work, sustaining high scan occupancy. It also revoked request
availability for operational timeouts despite a previously accepted baseline.

Read/write and read-only openers share one process-global scheduler. No second
ordinary-data trigger bypass was found. Aggregate log timestamps do not prove
overlapping children or sole causation of storage latency. This patch adds numeric
attempt markers so collection timestamps need not be treated as launch evidence.

## Completed implementation

- [x] Apply `max(5 seconds, 10 * wall duration)` as the next-reader floor after
  every child exit, including FK-only and failed/terminated attempts. A combined
  attempt also sets quick eligibility to `max(60 seconds, 10 * wall duration)`.
  Startup full verification establishes the same floors after success. Writes
  retain dirty generations and never shorten these deadlines.
- [x] Preserve actual-exit single flight, bounded hard phase deadlines, termination
  escalation and retries. A failed FK attempt promoted to combined work cannot
  bypass the quick-check minimum. Large timer delays are chunked safely rather
  than overflowing Node's timeout limit into an immediate loop.
- [x] Keep operational work pending and retrying without denying ordinary opens.
  Writes still pass the same manifest/registry/schema structure validator; sticky
  FK/integrity failures still reject all subsequent access. No pending or overdue
  result is mislabeled successful, and late hard-cutoff success remains rejected.
- [x] Prevent synchronous identity/protocol revalidation overlapping a child or
  bypassing the cooldown. Cancel the old generation once, retain occupancy until
  actual exit, and reject identity recovery until full validation may run. This
  is the minimal guard needed by the no-overlap contract, not an async redesign.
- [x] Add bounded log markers: numeric launch/observation time, captured attempt
  generation/data generation, and next eligibility time (zero while occupied).
  Log full baseline completion and failed-reader release; keep existing first-two
  successful-background log limits. No paths, account identifiers or data logged.
- [x] Focused deterministic tests, targeted semantic/lint checks, narrow commit
  and immutable Coordinator handoff.
- [ ] Coordinator native CI and controlled release on reconciled production.
- [ ] Natural scan timing, request availability and actual failure-path acceptance.

## Timing and safety consequences

A 243-second startup full check now grants a 2,430-second (40.5-minute) quiet
period before another reader. A 52.729-second FK attempt receives at least
527.29 seconds of idle time. The scan-plus-cooldown occupancy budget is at most
1/11 for complete cycles; it is not a guarantee about instantaneous I/O or request
latency during an individual scan. Short scans keep the existing minimum gaps.

Detection of newly introduced deep corruption can be delayed by that interval,
scan duration, and further operational failures. Repeated unsuccessful attempts
have no finite successful-verification bound, while a valid last baseline and
structural checks permit ordinary requests. This tradeoff is explicitly approved.
Observed FK failures, SQLite corruption and identity/schema mismatches never
become operational availability exceptions. Startup remains synchronous and may
still take minutes before readiness. Identity recovery also retains synchronous
full validation after its exit/cooldown gate; the broader refactor was excluded.

## Verification and immutable handoff

46/46 serial Node tests pass using the actual transpiled scheduler with controlled
time, process messages/exits and filesystem fingerprints (about 0.53 seconds).
They cover slow startup cooldown, minima, write coalescing, dirty retention,
operational pending availability, retained pending evidence, protocol/identity
exit and cooldown guards, structural rejection, both actual corruption outcomes,
nonzero/late/partial results, spawn failures, termination escalation, generation
isolation and numeric marker privacy. No real database or live service was used.

Targeted TypeScript: one root, 324 resolved source/declaration files, zero
diagnostics. Targeted opener ESLint: zero errors/warnings. Diff check passes.
Native child source and SQL are unchanged; prior native smoke is not proof of
this new scheduler policy. No broad suite, build, server, install or hosted scan.
No UI or Help Center guide change is required.

Exact parent: `264a3da5c313e93047902da55861a6cb1022f7ac`.
Complete four-file allowlist: `src/modules/platform/server/database/open-platform-database.ts`,
`src/modules/platform/server/database/platform-runtime-integrity-retry.test.cjs`,
this progress record and `docs/migration/runtime-integrity-cooldown-progress-2026-09-27.md`.
Port only this incremental child patch onto production `e1592929` or its reconciled
descendant. The parent's maintenance correction and `2af` dependencies are
separate and are not needed by this runtime patch. Do not deploy this older tree.
