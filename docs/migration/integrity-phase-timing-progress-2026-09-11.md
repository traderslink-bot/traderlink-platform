# Integrity phase timing — September 11, 2026

Status: deployed as `a31cd79d47e887743529f8156af0766f4673269c`, parent `6b88642e407186e11f7e58516d746a8c0fe02bec`. Railway `e2ba0c34-adda-4570-9f61-376e662f6ae5` SUCCESS; coordinator verified actual source, original sole volume, 119 migration registry and app/proxy health at 20:38:26 UTC. Hosted build/TypeScript passed. No validation policy change.

## First bounded live window

The old QA browser tab could not be attached reliably; recovered through a fresh signed-in tab. Those browser-tool timeouts are not app performance evidence. Observed normal Watchlist polling through 20:46:54 UTC, including 15 completed requests before a successful app-update reload and 11 after it. Three explicit read-only samples at 20:42:49 returned HTTP 200 in 129.5/144.8/154.5 ms, handlers 25.7/31.8/40.4 ms. No measured full-integrity call occurred in this window. This does not invalidate the earlier 4499.5 ms scan or establish a performance fix; the new per-phase breakdown remains uncaptured. No write, cache invalidation, extra forced verification or preference change was used to manufacture a slow sample. Stop polling after this bounded observation rather than leaving an indefinite QA workload.

The [live follow-up](pwa-live-follow-up-2026-09-11.md) measured one full verifier taking 4499.5 ms inside a 4780.4 ms Watchlist request. This extension separates five numeric phases: manifest validation, registry/table/prefix validation, actual schema digest verification, foreign-key check and quick check. Phase durations are nested inside full integrity/authentication/handler durations and are not additive to them.

Exact code scope:

- `src/modules/platform/server/observability/platform-request-timing.ts`: extends the finite timing-name union.
- `src/modules/platform/server/database/run-platform-migrations.ts`: wraps existing operations without altering their sequence, inputs, return result, throw behavior or invocation frequency. Preserves newer production safeMigrationDriverMessage/sqliteError diagnostics.

No cache TTL, connection reuse, background worker, validation policy, database migration, schema, identity or permission change. No actual database scan was triggered during local verification.

`scripts/integrity-phase-timing-check.cjs` compares extracted production and follow-up verifier functions with isolated dependencies. Validation order/result match on success; each of ten operation failures propagates the original error and stops at the same point. All five phase labels recorded. Request-timing isolation/error/privacy checks and focused ESLint pass. The earlier exact candidate dependency typecheck remains baseline evidence, not a new full-build pass.

Immutable [two-file patch](qa-evidence/integrity-phase-timing-6b88642e-20260911.patch), SHA256 `a502db2808cd17982eef54e560493c3af74702aaac12477a1e033e280303de8e`; [base/final source record](qa-evidence/integrity-phase-timing-6b88642e-20260911.json), SHA256 `328dbbecbfd1bfbec899612e8c8a112a03ffdf1249d0ccaa3766a556bbb5a585`. Coordinator owns source reconciliation and serialized release under standing owner approval.

After authorized deployment, take a bounded set of normal authenticated requests and inspect measured phases before selecting a repair. A pure computation reduction that preserves checks differs from delaying corruption detection; no timing/freshness-policy change has been approved or implemented. The separate PWA update timeout remains open.

The deployed follow-up captured both cold and warm phase evidence. The selected bounded repair and its explicit detection-timing tradeoff are tracked in [Runtime integrity performance repair](runtime-integrity-performance-repair-2026-09-11.md).
