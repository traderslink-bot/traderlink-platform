# ADR: GA1-A Generic Deterministic Trade Query Gateway v1

**Date:** 2026-07-25 America/Toronto
**Status:** implementation candidate for independent audit
**Base:** `b640ba599a4b9604395d203b6224b45d9de21208`
**Branch:** `agent/trader-intelligence-v3-ga1-a-generic-query-gateway`

## Decision

GA1-A adds one closed generic query-plan DSL and one deterministic executor over
the accepted GA0-B analytical dataset. Future named analytics must compile to
this engine rather than duplicate filtering, grouping, exact metrics, evidence,
or replay.

The engine is domain/server-side only. It has no route, browser, UI, model,
market-data, broker, database driver/write, payment, authentication, hosting,
or deployment dependency.

## Query-plan authority

`ti_v3_trade_query_plan_v1` is versioned and content-addressed. It binds the
exact snapshot, canonical filter, analytical dataset and derivation receipt,
currency partition, owner/account scope, filters, one grouping, metrics,
ordering, limits, and policies.

Validation rejects unknown/missing fields, accessors and non-plain records,
foreign authorities, mixed currency, foreign account scope, duplicate filters
or metrics, contradictory ranges, invalid times/dates, unsupported policies,
and max-plus-one. Semantic sets normalize to one identity independent of caller
order. Persisted plans must carry the exact digest.

The accepted B1 dataset and partition remain financial/data authority. GA1-A
does not create a second row truth.

## Read-only gateway

`ti_v3_read_only_trade_query_gateway:v1` accepts only a verified dataset source
and accepted currency partition. It returns immutable bounded rows and source
exclusions. It exposes no SQL, joins, database handle, source file, credential,
or provider payload.

Accepted in-process objects use the GA0-B weak-map verification fast path.
Plain persisted objects re-enter through full receipt reconstruction. The first
adapter wraps the existing snapshot read model; a future production database
adapter must stay behind this read-only interface.

## Supported semantics

Filters: inclusive date range, account, symbol/instrument, direction, currency,
gain/loss/flat, weekday, entry/exit time, derived exact entry price,
owner/account/session sequence, previous strictly completed outcome, holding
time, repeat ticker attempt, exact share quantity, and exact entry notional.
The legacy `price_range` and `position_size` names normalize to
`entry_price_range` and `entry_notional_range`, so aliases do not create
different plan identities. Exit-price filtering fails closed because the
accepted analytical row does not carry exact exit-price authority; GA1-A does
not reconstruct or estimate it.

Previous outcome uses the latest completion strictly before entry. Mixed
outcomes at one latest completion timestamp are `ambiguous`; lexical identity
is not a temporal tie-breaker.

One grouping is allowed: aggregate, day, month, Monday-based week, weekday,
configurable entry/exit time bucket, entry-price range, sequence, previous
outcome, repeat attempt, holding-time bucket, share-quantity bucket,
entry-notional bucket, direction, symbol, or account. Boundaries are
deterministic, canonical, lower-inclusive and upper-exclusive, with an open
final bucket. Empty buckets are omitted.

The content-addressed execution-only metric registry contains 86 active v1
declarations. Every declaration binds purpose, exact source fields, required
derived semantics, authority, unit/currency behavior, exact calculation and
aggregation policy, compatible canonical filters/groupings, sample and
unavailable policy, limitations, evidence, ordering, test keys, deprecation
state, and declaration digest. Declarations use explicit metric families for
gross P/L, charges, daily paths, direction, repeat chronology, outcome,
duration, quantity, and notional authority; they are not inferred from a broad
name fallback. A query may select at most 64 metrics.

The foundational projections cover population/coverage, activity, core
financials, outcome quality, holding time, share quantity, entry notional,
daily consistency, streaks, and leave-one-out concentration. A single shared
accumulator scans each included group once and retains daily realized-path
state for inexpensive follow-on metrics. The executor contains no ordinary
metric-specific branch; it asks the registry-backed projector for selected
values.

All financial and ratio calculation uses accepted exact decimal/ratio
primitives. JavaScript floating point is not financial authority. Profit factor
is unavailable with a zero exact loss denominator. Size metrics are unavailable
when accepted quantity or notional authority is incomplete.

## Audit-remediation semantics

For a grouped result, `candidate_count` is the number of verified gateway rows
assignable to that group before query filters, `included_count` is the emitted
group population after filters, and `excluded_count` is their exact difference.
Source-level excluded candidates without an analytical row cannot be assigned
to a group and produce an explicit limitation. Result-row count fields,
count-metric values, evidence group identity, and evidence population count are
verified together.

`groupLimit` is a fail-closed bound on the included group inventory.
`resultRowLimit` is a deterministic output bound applied only after canonical
metric/group ordering. Evidence is generated only for emitted rows. Bounding
adds `ti_v3_query_result_rows_bounded`; it does not silently relabel a rejected
query.

`ti_v3_trade_query_comparison_v1` compares two separately validated aggregate
executions over the same partition/currency authority. A comparison accepts
only executor-issued verified-execution capabilities, not structurally valid
or re-digested caller objects. Persisted comparisons reconstruct against those
two verified executions before their comparison digest is accepted. It preserves
both exact populations and evidence identities, emits exact differences, and
emits percentage differences only for a non-zero numeric baseline.

## Evidence and replay

Every material result group has content-addressed evidence binding the plan and
all upstream authorities. It records a population digest over every included
row plus bounded deterministic supporting/counterexample candidates resolving
to exact rows, executions, and occurrence keys. Selection is stable under
input permutation.

`ti_v3_persisted_trade_query_v1` stores the partition, normalized plan, full
result, execution receipt, and envelope digest. Replay verifies the envelope,
reopens the exact gateway, verifies the plan, reruns the generic executor, and
requires canonical equality of the whole result graph. Relabelled plans,
authorities, evidence, results, policies, receipts, or digests fail.

## Capacity and complexity

| Boundary | Maximum |
| --- | ---: |
| canonical filters | 16 |
| registered metrics | 86 |
| selected metrics per query | 64 |
| orderings | 3 |
| groups / rows | 256 |
| evidence candidates per group | 16 |
| total evidence candidates | 512 |
| diagnostics | 128 |
| grouping boundaries | 64 |
| serialized plan | 65,536 code units |
| serialized result | 1,048,576 code units |

The executor uses a session/completion sweep, one filter pass, group assignment,
one shared accumulator pass per emitted group, cached reusable totals,
classifications, extrema, and sorted value inventories, registry projections,
canonical group ordering, and bounded evidence. The formerly documented target
`O(R + G log G + M × G + E)`, aside from accepted authority verification and
That former linear target is superseded by
`O(R log R + G log G + M x G + E)`: sorting occurs once per accumulated value
inventory, not once per selected metric. All contract maxima fail closed at
max-plus-one.

## Explicit exclusions and future boundary

GA1-A excludes natural language, model calls, Analytics/Coach agents,
Simulation Bot, UI/chat/charts, candles, VWAP/EMA/MFE/MAE, setups, catalysts,
support/resistance/zones, simulations, broker integration, database migrations
or writes, unrestricted SQL/joins, payment, auth, hosting, deployment, and
owner trade data in Git.

GA1-B may add governed presets, retrieval, and deterministic similar-trade
search by compiling to this engine. A future model may create validated plans
and explain verified results; it may not receive raw authority or calculate
financial truth.
