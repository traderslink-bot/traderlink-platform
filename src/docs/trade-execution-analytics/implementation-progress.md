# Trade Execution Analytics Engine Implementation Progress

Read the [engine plan](./trade_execution_analytics_engine_plan.md), its
[future-agent appendix](./trade_execution_analytics_engine_future_agent_compatibility_appendix.md),
and the [dashboard operationalization plan](./v3-dashboard-operationalization-plan.md)
together before changing this tracker.

## Current work

- Status: dashboard operationalization Milestone 2 complete; Milestone 3 next
- Work item: stable dashboard contract and formatting-only view models
- Goal: keep one shared, deterministic source of truth for execution analytics;
  attach explicit financial authority before any dashboard migration.
- Constraint: do not route financial values through the legacy number-based CSV
  importer or make migration data look broker-authoritative. The raw parser
  accepts only explicit UTC timestamps; local-time broker exports remain
  unavailable until their timezone conversion has explicit DST policy.

## Completed

- v3 deterministic execution query extension and capability catalog.
- Controlling plan and future-agent compatibility appendix co-located and cross-linked.
- Raw v3 broker CSV parser with source-document digest, explicit column mapping, exact decimals, canonical executions, and focused authority-boundary tests.
- Compound grouping is now available for two or three distinct non-aggregate dimensions. It rejects nested, aggregate, and duplicate dimensions; uses length-prefixed canonical components to avoid identity collisions; and stays bounded by the existing group/result limits.
- Distribution foundation now provides a generic, query-bound, content-addressed result with exact quartiles/median/IQR, explicit histogram boundaries, and bounded evidence per nonempty bucket. It supports P/L, gain/loss P/L, fees, holding time, share quantity, entry notional, and daily P/L; required quantity/notional authority fails closed.
- Distribution findings now provide strict lower/upper quartile tails, exact tail totals, Tukey 1.5×IQR outlier fences/counts, largest absolute-value concentration, and separately bound outlier evidence under the same shared evidence limit.
- Attribution foundation now provides stable, content-addressed within-period segments for every non-aggregate grouping. Each segment exposes exact net/gain/loss contribution, trade frequency, average net result, fee contribution, and largest absolute-trade concentration with bounded evidence. It deliberately does not describe any contribution as causal.
- Period attribution now accepts compatible baseline/comparison grouped queries and exactly reconciles their P/L difference into overall count-frequency, segment-mix, and average-result effects. It also reports segment fee and largest-absolute-trade changes descriptively, and fails closed at the stricter pairwise row/evidence bound.
- Verified query results can now be paged without recalculating metrics. Each content-addressed continuation binds the source result, plan, page size, and next offset; pages preserve row/evidence identities and disclose any upstream result bound.
- The metric-catalog closure track added exact average/median gross P/L, total winning/losing net P/L, fee burden as a percentage of gross profit/loss, and average/median green/red-day P/L. These are generic registry metrics with accumulator/executor coverage, not dashboard calculations.
- Category coverage now includes current winning/losing realized-trade streaks and fail-closed pre-entry filters for trades after the first completed win or loss of their day.
- Row-authority data-quality metrics now count limited analytical rows, unavailable share/notional/source authority, and manual/broker-import/legacy-migration populations. Rejected source rows remain a separate ingestion-receipt concern and are not misrepresented as completed trades.
- Raw CSV ingestion emits attempted-row and structured affected-field facts;
  rejected rows never become financial authority.
- Completed fee-authority and catalog checkpoint: raw executions now declare `complete` or `unknown` charge coverage; unknown coverage fails closed for fee/net/outcome/path analytics rather than implying zero fees. The generic registry now has 121 exact metrics, including missing-charge coverage and winner/loser share-size statistics, and the catalog document maps each planned family to an implementation or explicit boundary.
- Completed catalog-lock checkpoint: the machine-readable plan catalog assigns every registered metric to an implemented plan family and records the non-execution boundaries. Its focused test prevents a registry metric from silently losing plan coverage.
- Completed output-level audit remediation: source-kind and charge-coverage filters/grouping, trough-to-recovery magnitude, verified deterministic finding/sample packets, and FIFO charge-kind allocation are now shared-engine primitives. Commission-only metrics are available only with complete per-kind charge allocation and otherwise fail closed.
- Completed agent-discovery checkpoint: the public execution capability catalog now advertises deterministic, evidence-linked finding/sample packets, source-kind selection, trough recovery, and the explicit authority needed for named commission analytics. Agents consume the result contract rather than calculate or narrate their own financial results.
- Completed operationalization Milestone 0: documented the one-path v3 runtime,
  inventoried the temporary legacy SQLite execution/import/analytics surface,
  and recorded the disposable-data reset procedure. The legacy store remains
  untouched until v3 import-to-dashboard proof; it has no conversion or
  fallback role.
- Started operationalization Milestone 1 with a v3-only local source-document
  store. It persists content-verified raw CSV bytes, declared parser authority,
  canonical accepted executions, rejected-row receipts, and a receipt digest;
  a newly constructed store rehydrates and replays the same identities without
  accessing the legacy SQLite importer.
- Added the first controlled local import entrypoint at
  `POST /api/intelligence/execution-import/v1`. It is v3 owner-guarded and
  real-data-mode restricted; owner scope, canonical account key, private
  storage directory, and optional instrument declarations are server-held.
  Browser submissions cannot select those authorities, and unmapped symbols are
  retained as explicitly unresolved rather than guessed.
- The server-scoped v3 import service can now rehydrate a persisted receipt by
  digest after reconstruction while deriving the same owner/account scope; a
  foreign owner remains unable to read it. Dataset/partition authority remains
  a separate next phase rather than being inferred from raw-source storage.
- Source selection now accepts a bounded set of persisted receipt digests,
  returns them in deterministic order, and rejects duplicates. USD and EUR
  source records remain distinct evidence; no conversion, mixed-currency
  aggregate, correction, or opening-inventory claim is inferred.
- Owner-confirmed safe default: an incomplete statement may retain an open or
  unresolved position without a user-verification requirement. Missing starting
basis or correction authority blocks only affected realized-P/L analytics;
it does not authorize an implied unrealized P/L without market-price data.
The open-position review marker will be lifecycle-derived and automatically
cleared when later broker-confirmed data closes that position; it is not a
sticky verification requirement.
- Implemented that lifecycle projection over the selected persisted receipts:
  it reports open/closed net-quantity state without making a P/L claim, keeps
  unresolved-instrument limitations explicit, and removes only the open-position
  marker when later broker-confirmed fills return the position to zero.
- Completed the Milestone 1 safe-default resolver. It produces a
  content-addressed unavailable readiness receipt from the selected persisted
  source documents, retaining source/execution/lifecycle identities while
  returning no dataset, currency partition, or query identity until explicit
  opening-inventory, correction, and statement-period authority is attached.
  A new service instance returns the same receipt after restart; a later close
  removes only the open-position reason.
- Completed Milestone 2. Selected persisted receipts can now become the
  existing exact v3 dataset/snapshot authority only when server-held statement
  periods, correction authority, and verified starting inventories are supplied.
  A server-only adapter then exposes the capability catalog, currency partition,
  overview, and generic breakdown operations through the existing read-only
  query gateway. Missing authority remains unavailable rather than becoming a
  partial or invented P/L result. The final focused tests and whole-project
  TypeScript check pass.

## Next queue

1. In Milestone 3, add typed client-safe packet contracts, fixtures, and
   formatting-only table/chart/limitation/evidence view models. Do not route
   through the legacy SQLite importer or calculate values in browser code.
2. Preserve complete charge-kind authority requirements; do not manufacture
   exchange/regulatory/borrow labels from combined charges.
3. When the original May 2026 IBKR export is available, import its raw bytes
   through the v3 parser and the new v3 persistence boundary; do not relabel a
   legacy SQLite conversion as raw broker evidence.
