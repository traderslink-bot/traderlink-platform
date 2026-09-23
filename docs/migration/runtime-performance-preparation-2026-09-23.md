# Runtime performance preparation — September 23, 2026

## Scope and release boundary

Owner approved local preparation following the read-only performance audit.
Base: `9ae6bb62dc64917e129a70342601568200aec3e1` (current production at selection).
Coordinator reuses the clean `codex/dashboard-latency-timing-909081` checkout;
the mixed canonical checkout and other feature owners remain untouched.
No push, deployment, restart, hosted configuration, migration or production
data operation belongs to this preparation. Release remains a later checkpoint.

## Reviewed plan

1. Move ordinary-write foreign-key scans into the existing read-only worker.
   Keep startup/replacement/schema-change verification and migration verification
   synchronous and complete; preserve per-connection foreign-key enforcement.
   Run changed-data FK scans on a fixed five-second cadence and keep the existing
   sixty-second quick-check cadence. One worker per database, no sliding deadlines.
   Check failures remain sticky; worker errors/timeouts require synchronous full
   verification before the next database open. This intentionally changes detection
   latency for violations introduced outside FK-enforced connections, not write
   enforcement. Scheduling is within five seconds, plus worker execution/event-loop
   delay; it is not a hard real-time guarantee.
2. Add an opt-in compact Watchlist list snapshot. Preserve full default API/detail
   contracts, auth, no-store headers, refresh cadence, stream and rendering.
   Remove only detail data unused by the list and preserve reconciliation behavior.
3. Run bounded source/contract checks at each completed slice (no Vitest, full
   build, local server or installed-phone claim). Make two separate local commits.
4. Record exact allowlists/results and deferred hosted build/acceptance. Confirm
   no schema/manifest changes and preserve source-compatible rollback.

## Progress

- [x] Current-production base and isolated existing checkout verified.
- [x] Background foreign-key scan implementation and focused verification.
- [ ] Compact list implementation and focused verification.
- [ ] Local commits and final scope review.
- [ ] Later authorized hosted build, health and measured acceptance.

## Exclusions

No Rules, PWA service-worker/cache/update behavior, TradingView repair, market
data engine, polling-frequency, user data, auth or UI/content changes.

## Integrity slice checkpoint

- `scripts/runtime-integrity-speed-check.cjs --working-tree` passed: fixed FK
  and quick deadlines, advancing an earlier FK deadline, non-sliding writes,
  in-flight dirty retention, sticky failures, stale-generation/identity guards,
  malformed/null/mismatched messages, construction/error/exit/timeout fallback,
  and full-versus-structure-only verifier call sequences.
- Real workers on tiny disposable databases detected orphan rows with and without
  quick check, preserved database bytes, and rejected corrupt SQLite input.
  An FK-enabled writer rejected the invalid insert immediately.
- Bounded semantic TypeScript check: two changed roots / 133 source files,
  zero diagnostics. Existing installed dependencies reused; no install/build.
- Explicit legacy `verifyPlatformDatabaseAfterDataChange` callers retain their
  synchronous FK check. Only the runtime guard uses the new structure-only path.
- No migration manifest, migration, schema, connection pragma or backup/restore
  implementation change. The approved production parent remains source/schema
  compatible for rollback; actual deployment/volume/schema must be checked fresh
  before any eventual release.
- Full hosted build, native-worker production packaging, CPU/RAM observation,
  and natural warm-request timing are **not yet verified**. A worker failure
  intentionally restores full synchronous verification on the next open, so a
  packaging problem could restore the old latency rather than pass unchecked.
