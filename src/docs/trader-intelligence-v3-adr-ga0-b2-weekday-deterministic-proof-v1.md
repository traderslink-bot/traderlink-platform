# ADR: GA0-B2 Weekday Deterministic Proof v1

**Date:** 2026-07-23 America/Toronto
**Status:** Implemented for independent audit
**Tool:** `analyze_performance_by_weekday:v1`

## Decision

GA0-B2 implements one deterministic, snapshot-bound weekday analysis tool. The
tool consumes the verified GA0-B1 analytical dataset and emits exact tables,
validated claims, chart-ready series, diagnostics, evidence references, and a
reproducible run receipt. It does not parse natural language, call a model,
render charts, mutate journal data, or infer missing entry-time facts.

The v1 question compares one explicit target weekday, defaulting to Friday,
with the disjoint baseline of all other represented weekdays. Arguments use
canonical English weekday values and are rejected rather than localized or
guessed.

## Registered execution contract

The content-addressed registry entry declares the tool key/version, a
tool-specific deterministic executor, CAD/USD currencies, UTC and
America/New_York time zones, versioned comparison/evidence/outlier policies,
all proof output classes, and claims as the only output class a limited run may
omit. Shared contract additions are optional so accepted GA0-B1 payloads remain
valid; the B2 verifier makes them mandatory for this tool.

## Exact metrics and row semantics

All financial arithmetic uses exact decimal or exact rational primitives, never
binary floating-point conversion. By weekday and target/baseline it calculates:

- trade, win, loss, and flat counts;
- gross profit/loss, charges, net P/L, expectancy, and median P/L;
- win rate, best and worst trade, and leave-one-out net/direction;
- after-loss opportunities, traded count, and rate;
- quantity/notional availability, totals, and medians;
- target contribution to aggregate net and absolute P/L.

Ratios become canonical decimals only when their denominator terminates in base
ten within the configured scale; otherwise the exact fraction is retained.
Weekdays use semantic Monday-through-Sunday order independent of input order.
Target and baseline are exhaustive and disjoint over included rows.

## Sample, outlier, and claim policy

- fewer than 5 target trades: `insufficient`;
- 5 through 9 target trades: `descriptive_only`;
- at least 10 target and 20 baseline trades: `claim_eligible`;
- all other sample compositions: `descriptive_only`.

Outlier concentration is largest absolute target-trade P/L divided by the sum
of absolute target-trade P/L and is unsafe only when strictly greater than
`2/5`. Claims additionally require non-flat target and baseline means,
mean/median directional agreement, and no leave-one-out direction reversal.
Limited or ineligible runs retain tables, series, diagnostics, and receipts but
omit claims. Emitted claims include both supporting and explicit counterexample
evidence bundles.

## After-loss, missing data, and currency

An after-loss opportunity uses only the immediately preceding completed trade
in canonical order within the same owner, account, currency, and session date.
A prior loss activates the opportunity; a prior win or flat resets it; the
first trade has no prior state.

Currencies remain independent and are never converted or summed. Missing
notional or quantity remains explicitly unavailable. Entry-time buckets are
explicitly unavailable because the accepted B1 row does not prove entry time.

## Evidence, series, receipt, and determinism

Evidence is bound to stable row identities and content-addressed bundles. Table
cells may carry cell-level evidence. Claims carry supporting and counterexample
bundle digests. Verified chart-ready series cover weekday net P/L, expectancy,
trade count, and target-versus-baseline expectancy. Nonmonetary series have no
currency; monetary series preserve source-table currency. The run receipt binds
the registry entry, arguments, snapshot/dataset receipts, every output artifact,
diagnostics, and every used evidence digest.

Equivalent row permutations produce identical artifact identities. Focused
tests cover exact metrics, target/baseline partitioning, sample states, outlier
suppression, currency isolation, after-loss semantics, blocked authority, and
replay determinism.

## Bounded graph validation

The accepted graph guards were smaller than the accepted B1 maximum dataset: a
valid 30-trade fixture exceeded the former 1,024-total-key ceiling. Bounded
limits are raised to 65,536 nodes and 16,384 keys. Depth, string length, array
length, and per-object key limits remain bounded, and over-budget payloads are
still rejected.

## Consequence

This slice proves the complete deterministic Friday answer package without
adding UI, AI/model calls, market data, deployment, or GA0-B3 behavior.
Consumers must preserve claim absence and explicit unavailable diagnostics
rather than filling them heuristically.
