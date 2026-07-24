# ADR: GA0-B2 Weekday Deterministic Proof v1

**Date:** 2026-07-23 America/Toronto
**Status:** Remediated for second independent re-audit
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

Outlier concentration is the conservative maximum of absolute target-trade
activity concentration and the absolute relevant-net contribution ratios for
the largest winning and losing trades. It is unsafe only when strictly greater
than `2/5`. Claims additionally require non-flat target and baseline means,
mean/median directional agreement, and no leave-one-out direction reversal.
Only an authoritative `completed` run may emit the one tentative tendency
claim. `limited` runs retain their exact tables, series, diagnostics, evidence,
and receipt but omit claims; `blocked` runs emit diagnostics only. Emitted
claims include both supporting and explicit counterexample evidence bundles.

## After-loss, missing data, and currency

An after-loss opportunity uses the latest trade whose `finalExitAt` is strictly
before the current row's `firstEntryAt`, within the same owner, account,
currency, and session date. Same-time completions with one outcome class are
economically equivalent; conflicting outcome classes fail closed as an
explicit unavailable state. A prior loss activates the opportunity; a prior
win or flat resets it; the first trade has no prior state. Open predecessors
and equal entry/exit timestamps do not count as completed.

Currencies remain independent and are never converted or summed. Missing
notional or quantity remains explicitly unavailable, with exact availability
counts and partial-coverage limitations. Entry-time buckets use the trusted
row `firstEntryAt` and B1 timezone, with deterministic 30-minute local
minute-of-day buckets and exact average/median facts; New York conversion
reuses the B1 DST policy.

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

## Independent-audit remediation contracts

The persisted execution now carries a content-addressed authority binding the
tool/policy identities, normalized arguments, source derivation receipt,
partition currency, selected rows/exclusions, run context, and complete output
payload. Re-entry accepts only a strict descriptor-first graph that can be
replayed from the exact B1 source authority and exact-compared artifact by
artifact; runtime `WeakMap` caches are not persistence proof.

The limitation projection policy is versioned as
`ti_v3_weekday_limitation_projection:v1`. All applicable B1 and B2 limitation
codes are projected into every exact table and source-derived series; claims
inherit table/evidence limitations; diagnostics expose the same codes; and the
receipt is the verified union. Intentional filters and partial optional fact
coverage are informational, while evidence, reconstruction, eligibility,
stale, authority, sample, direction, and outlier limitations block claims.

Runtime and canonical graph validation now bound raw property keys at 4,096
code units and charge key code units before NFC normalization. Focused evidence
measures both the 30-row fixture and an accepted 64-row worst-case fixture
against the shared node, key, and 1 MiB aggregate ceilings.

The exclusion ledger claim policy is versioned as
`ti_v3_claim_neutral_exclusion_ledger:v1`. Only an exact canonical-filter
exclusion or an exact documented open-lifecycle exclusion may be neutral. The
complete primary, secondary, source, and authority ledger is evaluated; generic
manifest reasons, unknown source reasons, mixed currency, and any secondary or
source reason outside the explicit allowlist block claims. Neutral disclosures
remain visible in the exclusions table, evidence bundles, and informational
diagnostics without entering authoritative limitation codes.

The execution authority binds the registered tool key
`analyze_performance_by_weekday:v1` directly; `weekday_analysis` is not a
parallel tool alias.

## Consequence

This slice proves the complete deterministic Friday answer package without
adding UI, AI/model calls, market data, deployment, or GA0-B3 behavior.
Consumers must preserve claim absence and explicit unavailable diagnostics
rather than filling them heuristically.
