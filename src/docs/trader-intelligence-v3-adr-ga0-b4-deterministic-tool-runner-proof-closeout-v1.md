# ADR: GA0-B4 Deterministic Tool-Runner Proof Closeout v1

Date: 2026-07-25
Status: implementation candidate; independent audit required
Scope: local Trader Intelligence v3 GA0-B4 only

## Decision

GA0-B4 exposes exactly two registered executable identities:

- `analyze_performance_by_weekday:v1`
- `simulate_daily_stop_rule:v1`

The final registry is content-addressed, canonically ordered by Unicode
codepoint, deeply immutable, and verified before dispatch. The generic runner
accepts one closed request shape, verifies the registry snapshot, tool/version,
authority identities, exact arguments, dataset derivation, and partition before
calling the already accepted B2 or B3 executor. Unknown tools, versions,
foreign arguments, registry tampering, and authority mismatches reject before
financial execution and return stable runner error codes and paths.

The runner result carries the selected registry identity, normalized argument
digest, run context, execution graph, and receipt. It does not change the
accepted tool status semantics: completed, limited, and blocked remain owned by
the selected executor and its verified eligibility/partition authority.

## Replay and graph proof

The persisted envelope contains the runner/envelope versions, final registry
snapshot, selected entry digest, normalized argument digest, and execution
graph. Generic rehydration reconstructs the selected tool from the closed
allowlist, replays it against a read-only source, and compares the canonical
execution graph and argument identity. Relabelled envelopes and altered entry
identities fail closed.

`validateCrossArtifactConsistency` verifies run-context identity, unique
table/claim/series/evidence identities, receipt membership, claim-to-table
metric/effect cells, series source-table/point ordering, diagnostics, and
expected tool identity. `resolveAnalyticalEvidenceBundle` resolves included
rows and excluded candidates only through the verified partition and dataset;
it rejects duplicates, mixed inclusion, missing candidates, and invalid
simulation populations.

## Diagnostics and property strategy

The B4 tests cover unknown tool/version rejection, foreign argument rejection,
registry tampering, persisted graph tampering, cross-tool artifact
substitution, repeated fixed-seed identities, all supported B3 threshold values
`1` through `5`, evidence resolution, graph consistency, and independent B2/B3
reference tests retained from the accepted slices. Production/reference
disagreements fail the suite; B4 does not copy either financial algorithm.

## Scale proof

The fixed seed is `0x4b344c`. The synthetic scale dataset contains exactly
10,000 verified analytical rows over 20 UTC session dates with wins, losses,
flats, charges inherited in the analytical row, and daily threshold-reaching
patterns. It is a mixed-currency dataset: 100 USD rows form the selected,
supported USD partition (five rows per date) and 9,900 EUR rows remain verified
in the unselected second currency partition. This exercises both registered
tools through the generic runner while keeping the selected proof population
large enough to span all 20 sessions/weekdays and both daily-stop outcomes.

The scale test asserts row count, max-plus-one stable oversized rejection,
table/row/claim/series/point/evidence/diagnostic bounds, serialized output
size, and canonical identity stability after row permutation. It uses a
generous 600-second elapsed-time budget and is not a microbenchmark. The final
focused verifier measured 301.44 seconds on Node v24.11.0, Windows x64, with
Vitest 4.1.4. The
expensive runner call is made once; the permuted input rebuilds and compares the
canonical dataset identity without duplicating the full analyzer call in the
same test.

The accepted B1 row/dataset/evidence limits were raised to 10,000 only where
the scale proof needs them. Runtime and canonical serialization guardrails were
raised to bounded 25,000-array/500,000-key/2,000,000-node/16 MiB aggregate
limits, with max-plus-one dataset rejection retained. Evidence validation also
uses per-run sets/maps for partition and candidate lookup so large populations
do not create avoidable quadratic scans. These are bounded proof-capacity
changes, not unbounded input acceptance.

## Verification surface

`src/scripts/verify-trader-intelligence-v3-ga0-b.ts` runs the B1 dataset and
contract tests, B2 production/reference/replay tests, B3 production/reference/
replay tests, B4 runner/consistency/evidence/replay tests, the fixed-seed scale
proof, architecture boundaries, and private-data safety. It makes no model,
market-data, broker, payment, Discord, database, or deployment call. CI invokes
the same focused verifier; it does not weaken existing gates.

## Boundaries and deferred work

This ADR adds no UI, App Router route, AI prompt/model call, natural-language
query parser, market/candle/VWAP/setup/catalyst/level analytics, broker write,
database persistence, payment/auth change, production deploy, or GA0-C work.
The clean B4 branch must be independently audited before merge or any later
production handoff.
