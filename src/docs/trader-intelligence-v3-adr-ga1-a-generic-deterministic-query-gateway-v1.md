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
time, repeat ticker attempt, and entry-notional position size.

Previous outcome uses the latest completion strictly before entry. Mixed
outcomes at one latest completion timestamp are `ambiguous`; lexical identity
is not a temporal tie-breaker.

One grouping is allowed: aggregate, month, Monday-based week, weekday,
configurable entry/exit time bucket, price range, sequence, previous outcome,
repeat attempt, holding-time bucket, position-size bucket, direction, symbol,
or account. Boundaries are deterministic, canonical, lower-inclusive and
upper-exclusive, with an open final bucket. Empty buckets are omitted.

Metrics: candidate/included/excluded and win/loss/flat counts; exact gross,
charges and net P/L; average, median, expectancy, win rate and profit factor;
average/median size and holding time; largest winner/loser contribution; and
net P/L excluding either outlier.

All financial and ratio calculation uses accepted exact decimal/ratio
primitives. JavaScript floating point is not financial authority. Profit factor
is unavailable with a zero exact loss denominator. Size metrics are unavailable
when accepted notional authority is incomplete.

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
| filters | 15 |
| metrics | 22 |
| orderings | 3 |
| groups / rows | 256 |
| evidence candidates per group | 16 |
| total evidence candidates | 512 |
| diagnostics | 128 |
| grouping boundaries | 64 |
| serialized plan | 65,536 code units |
| serialized result | 1,048,576 code units |

The executor uses a session/completion sweep, one filter pass, one group pass,
reusable exact accumulators/sorts, canonical group ordering, and bounded
evidence. Target behavior is approximately `O(R + G log G + E)`, aside from
accepted authority verification and bounded median sorts. All contract maxima
fail closed at max-plus-one.

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
