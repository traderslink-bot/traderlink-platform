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
- [x] Compact list implementation and focused verification.
- [x] Two separate local slices and final scope review (local Git history records commits).
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

Integrity local commit: `6f5226a3c0d23e4ebdf923d29b02cf1571594602`.

## Compact list checkpoint

- `?view=list` opts into the compact transport after the existing authorization.
  The default endpoint remains full, authenticated and `private, no-store`.
  Server-rendered list props are compact as well. The client normalizes either
  compact or legacy full replies so an old-server rollback remains compatible.
- Detail, archive and stream transports remain full and unchanged. List stream
  events are projected before storing them in client state. Neither the SQL
  state read/parse cost nor SSE network bytes are claimed to be reduced.
- Preserved every list field: symbol/status, timestamps/activation sorting,
  price/revision/observation, country and its independent card timestamp,
  session grouping, followup/reversal flags, visibility and lifecycle labels.
  Cards, ladders and level maps are not transmitted in compact snapshots.
- `scripts/watchlist-list-payload-check.cjs 9ae6bb62dc64917e129a70342601568200aec3e1`
  passed 324 reconciliation pairs, 324 stream merge comparisons, 20 pure list
  element-tree comparisons against that unchanged production source, removal
  timing, auth-denied/no-read, legacy/default/unknown/compact response and no-store
  checks. This is a source-level contract proof, not rendered-browser acceptance.
- Synthetic six-symbol payload: 144,124 to 3,004 JSON bytes (about 98% smaller).
  The earlier live sample was approximately 191 KB; no post-change live payload
  or speed improvement has been measured because nothing is deployed.
- Bounded semantic check: client/list/reconciliation roots, 23 source files,
  zero diagnostics. Page and API syntax checks passed. The proof harness initially
  omitted its `formatDate` dependency; the harness was corrected and rerun clean.
- Next.js/React guidance applied: minimize server/client serialization without
  caching authenticated data, keep functional state updates and existing effect
  cleanup/coalescing. No UI wording/layout, hooks lifecycle or polling changes.

## Later release acceptance, not performed here

1. Fresh remote/deployed source, lane ownership, mounted volume and exact applied
   migration identities; rebase/integrate only these allowlisted changes if the
   production parent advances. No schema migration is introduced by either slice.
2. Owner-authorized after-hours release with verified prior healthy rollback;
   hosted build/typecheck and native worker packaging, then public health.
3. Natural warm signed-in timings, worker outcomes and CPU/RAM, compact response
   bytes, list flags/groups/removals, ticker detail and a real installed PWA.
4. On an unavailable app, restore the verified compatible healthy release before
   any retry. Do not claim phone acceptance or live speed from the local proof.
