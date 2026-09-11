# Runtime integrity performance repair — September 11, 2026

Status: implementation and focused verification in progress. No repair release has been published.

## Measured problem

Production `20f44776ef7e50c9a00e436670e689cb7a33f556` recorded one natural warm full verification at 3818.4 ms: manifest 0.2 ms, registry 5.1 ms, schema 5.4 ms, foreign keys 214.9 ms and SQLite quick check 3592.7 ms. A cold-start sample took 11340.2 ms, led by foreign keys at 9313.9 ms and quick check at 1866.3 ms. The synchronous data checks run on the Next.js event loop, so they can delay unrelated pages and static assets. The production HTTP log showed this shared delay on Workspace, Watchlist, market halts, the service worker and a static icon.

## Bounded repair contract

- The first verification for each process and database identity remains the existing full synchronous verifier.
- A database file identity change, SQLite schema-version change, migration, backup, restore and explicit maintenance verification continue through the existing full verifier.
- Authentication, workspace scope, user rows, market data and financial facts are never cached by this repair.
- An ordinary database/WAL data change immediately runs the existing manifest, applied-migration registry, expected-table, schema-digest and foreign-key checks. Only `PRAGMA quick_check` moves off the main event loop.
- The unchanged quick check runs in a dedicated read-only, `query_only` worker. The worker receives only the validated database path and structural fingerprint. It imports no application modules and performs no writes.
- Dirty data starts a fixed, non-sliding quick-check deadline. The healthy-process target is one run per 60 seconds while data continues to change, plus the scan duration; it is not a hard wall-clock guarantee during process failure or shutdown.
- One process-global coordinator exists per validated database path. It coalesces overlapping triggers and retains a pending dirty generation when writes occur during a scan.
- Every worker result carries its coordinator generation and pre/post database identity plus schema version. A stale result cannot approve a replaced database or clear a newer failure.
- A quick-check corruption result is sticky and every later open fails closed, including a matching fingerprint. Only a successful explicit full verification for the current database identity may clear it.
- Worker construction error, timeout, early exit, malformed result or native-module packaging failure marks the next database open as requiring the existing full synchronous verifier. It never records a successful check.
- Hosted proof logs the first successful background quick check once per process. Failure outcomes are naturally bounded by the fixed worker schedule and fail-closed state. These messages contain only an outcome and numeric duration; they never include a database path, identity or stored data.
- Worker handles and timers are bounded, unreferenced where appropriate, and closed or terminated on completion and timeout. Notification and Analyzer worker schedules do not change.

This deliberately changes detection timing for physical SQLite page corruption after an ordinary data write. The old path detected it on the next database open but could freeze the whole app for several seconds. The new path targets detection within about 60 seconds plus scan duration while preserving immediate structural and foreign-key validation. The owner expressly authorized the joint app-speed diagnosis and repair; the release coordinator independently required the safeguards above.

## Acceptance gates

- Focused static and type checks on the exact candidate.
- Disposable clean, ordinary-write, schema-change, replacement and corrupt-database cases.
- Stale result, overlap, timeout, worker error/early-exit and fail-closed recovery cases with controlled worker dependencies.
- Exact Docker standalone/native `better-sqlite3` worker packaging verification.
- No notification or Analyzer cadence change.
- Coordinator review, exact allowlist release, hosted source/volume/migration/health proof, worker readiness and a natural warm latency comparison.

The temporary slow-phase warning will be removed after the production repair is measured.
