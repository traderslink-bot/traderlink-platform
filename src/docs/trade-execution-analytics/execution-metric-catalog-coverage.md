# Execution-Derived Metric Catalog Coverage

Read this audit together with the [controlling plan](./trade_execution_analytics_engine_plan.md), the [future-agent appendix](./trade_execution_analytics_engine_future_agent_compatibility_appendix.md), and [implementation progress](./implementation-progress.md).

## Purpose

The completion standard for this engine is not a set of dashboard cards. It is a complete, exact catalog of every fact that can be derived from verified execution records within the engine boundary.

For every planned result, this audit must establish exactly one state:

- `implemented`: a versioned registry key, exact executor projection, authority/limitation policy, and focused verification exist;
- `canonical-equivalent`: the planned wording maps to one named metric with the same declared semantics;
- `requires-execution-field`: the result is mathematically valid but the verified source must provide an additional execution field;
- `not-execution-derived`: the result needs market, plan, or other non-execution authority and belongs to another engine.

No dashboard calculation may satisfy this audit on its own. The generic query engine is the authority.

## Current Verified Baseline

- The v3 metric registry declares **121** exact execution-only metric keys in `analytics/query/metrics/metric-registry.ts`.
- Every declared key is accepted by the generic query plan and projected by `analytics/query/metrics/query-metrics.ts`.
- Existing focused registry tests execute the catalog in real query batches, including zero-population, winner-only, loser-only, missing-size, missing-notional, and zero-denominator cases.
- The registry already covers population, P/L, outcome, daily, behavior, holding-time, size/notional, return, streak, concentration, realized-drawdown, realized-giveback, and day-transition families.

This confirms a substantial foundation. It does **not** yet prove one-to-one coverage of every result named in the controlling plan.

## Completed During This Closure Track

The first plan-to-registry audit pass identified and implemented ten genuine execution-derived additions:

- average and median gross P/L;
- total winning and total losing net P/L;
- fee burden as a percentage of gross profit and gross loss;
- average and median green-day P/L;
- average and median red-day P/L.

Each is a versioned generic query metric with exact arithmetic, source-field declarations, deterministic unavailable behavior, and focused query execution coverage. This was added to the shared accumulator/registry/executor, not to a dashboard.

The category audit also added current winning and losing realized-trade streak metrics. They use the verified final completion order and return zero for the inactive direction rather than inventing a current streak.

The pre-entry daily-path filter now supports `after_first_win` and `after_first_loss`. Both conditions require an unambiguous completed-trade path within the same trading day; same-time mixed outcomes fail closed instead of creating a false behavioral result.

The data-quality catalog now reports, from canonical analytical rows, limited-authority trades, missing share-quantity authority, missing entry-notional authority, unavailable source authority, and manual/broker-import/legacy-migration populations. These counts let a result disclose which completed analytical trades carry limitations without conflating a limited row with a rejected import row.

## Plan-to-Code Closure Matrix

| Plan family | Closure state | Canonical authority |
| --- | --- | --- |
| Counts, P/L, outcomes, and concentration | implemented | Registry metrics plus aggregate/symbol/direction groupings and deterministic ordering |
| Daily, weekly, monthly, period, and session results | implemented | Day/week/month/year/session/time groupings, daily metrics, and compatible period comparison |
| Sequence, repeat attempt, streak, and pre-entry behavior | implemented | Verified completed-trade chronology, behavior filters/groupings, and generic metrics |
| Price, share/notional size, and hold-time performance | implemented | Exact range filters/buckets, compound groupings, size/holding metrics, and query ordering |
| Realized drawdown, giveback, and green/red transitions | implemented | Ordered daily realized-P/L accumulator and day grouping/ranking |
| Combined charges and fee impact | implemented when charge coverage is complete | Explicit charge-coverage state, charge metrics, source/size/price groupings |
| Rejected-row timestamp/price/quantity/direction facts | implemented outside financial rows | Persisted raw-ingestion quality report; rejected rows never become trades |
| Commission-only results | requires-execution-field | FIFO round-trip allocation currently retains only combined signed charges |
| Market/setup/VWAP/optimal-exit or planned-risk results | not-execution-derived | Belongs to later market, setup, or risk-plan authority |

The machine-readable lock is `analytics/query/metrics/execution-plan-catalog.ts`. Its focused test requires every registered metric to be assigned to one implemented plan family and rejects duplicate family keys or duplicate metric assignments within a family. The two zero-metric entries are intentional, explicit boundaries rather than omissions.

## Remaining Source-Layer Boundaries

- Map every plan metric wording to a canonical key or a genuine omission. Existing generic groupings may satisfy outputs such as fees by ticker or size-bucket P/L without a second dedicated metric.
- Determine which data-quality counts require source-document rejection/coverage authority rather than a completed canonical execution row. These must be exposed from the ingestion/coverage layer rather than fabricated by the query accumulator.
- Completed ingestion-quality authority: every raw CSV import now persists a non-financial receipt with attempted/accepted/rejected counts, issue codes, and affected fields. The read-only aggregate report covers accepted and rejected documents without granting rejected rows financial authority.
- Determine whether commission-only metrics are possible from the current canonical `signedCharges` field. If a broker does not separate commissions from other charges, the engine must expose only the combined charge fact and mark commission-only results unavailable.

## Audit Method

For each metric bullet in the plan's Core Metric Library and Analytics Categories:

1. Map it to a registry key or record it as a genuine omission.
2. Verify the metric has exact arithmetic, its required execution fields, and explicit unavailable behavior.
3. Verify it works under aggregate and compatible grouping queries.
4. Test independently calculated values and adversarial unavailable cases.
5. Record its canonical key here; aliases belong in documentation, not duplicate financial calculations.

## Catalog Closure Order

1. Audit the existing 97-key registry against the plan's count, P/L, win/loss, daily, risk-like, time, size, and fee libraries.
2. Implement any missing exact metrics in the shared accumulator, registry, and executor as one coherent catalog change.
3. Audit every planned grouping, filter, comparison, ranking, and data-quality result that can be derived from executions.
4. Completed: the execution-plan catalog test fails if a registered metric loses its planned-family binding.
5. Resume agent-facing capability discovery, query explanation, and dashboard replacement work only through this locked catalog.

## Boundaries

The catalog must be exhaustive for available execution facts, but it must still fail closed. For example, an execution export without an allocated commission field cannot prove commission-only metrics; a source without complete entry/exit timestamps cannot prove holding-time metrics. Those are `requires-execution-field`, not estimates.
