# Runtime integrity timeout recovery — September 25, 2026

Status: implemented; focused regression and targeted semantic checks passed.
Not deployed or accepted on production yet.

The owner directly approved the background database-check repair, preserving
corruption safeguards, its tests and deployment in the Coordinator task. The
Coordinator owns this implementation; the Reverse Splits worker paused edits
and the Watchlist task independently reviews the immutable result.

## Evidence and contract

The previous 30-second background deadline expired during production scans.
Its fallback then ran full verification synchronously on ordinary requests;
observed scans took 34–102 seconds. Production was restored to the verified
127-migration recovery source before this repair.

- Give first and subsequent background scans a bounded 120-second deadline.
- Retain pending FK/quick checks after operational failure and retry without
  another write, with 5/10/20/40/60-second capped backoff.
- Keep one worker slot occupied until actual exit, including after timeout,
  error or cancellation for a new database generation.
- Unresolved failed background validation denies opens promptly with the existing
  integrity failure and `background_verification_pending`; it never starts a
  full synchronous scan solely because the background worker failed. Healthy
  ordinary background scans do not block requests.
- Preserve mandatory startup, identity/schema, registry and structural checks.
  Explicit worker identity mismatches still require full verification.
- Genuine FK/quick-check and SQLite CORRUPT/NOTADB failures remain fail-closed.
  Preserve an observed FK failure if a later scan throws.
- Successful retry clears retry state, not dirty work from concurrent writes.
  Stale worker generations cannot approve or corrupt newer state.
- Bounded diagnostics report the first two FK-only and first two combined scans,
  including their durations, to verify real repeated completion after deployment.
  No database paths, identities or contents are logged.

No schema, data, permissions, notification preferences, providers, UI or Help
changes. Existing Reverse Splits source is preserved in full. This contract
supersedes only the operational-error synchronous fallback in the earlier
[runtime integrity repair](runtime-integrity-performance-repair-2026-09-11.md).

## Verification

- `node --test src/modules/platform/server/database/platform-runtime-integrity-retry.test.cjs`:
  21/21 passed, serial controlled workers/clock/filesystem; 0.52 seconds total.
  Existing TypeScript dependency through NODE_PATH; no install or Vitest.
- Targeted TypeScript semantic check: one root plus 135 resolved implementation
  files, zero diagnostics, 512 MB heap cap. Whitespace/diff check passed.
- No real database, actual worker threads, provider requests, notification sends,
  application server or broad build were used by the simulated tests.

Pending: immutable review, fresh exact target schema/volume gate, guarded release,
actual hosted native-worker success and repeated healthy cycles with owner page
verification. Simulations do not prove hosted availability. Keep the verified
127-compatible recovery image available; no further migration is required.
