# ADR: GA0-B1 Acyclic Artifact Identity and Proof Contracts v1

**Status:** accepted for the GA0-B1 implementation candidate

**Date:** 2026-07-19 America/Toronto

**Scope:** shared B1 contracts only

## Context

The GA0-B plan described final run receipts that reference tables, claims,
series, diagnostics, and evidence while evidence also referred to a tool run.
Hashing the final receipt into its own dependencies would require a placeholder,
post-hash mutation, or self-referential digest. None is acceptable authority.

Later slices need stable contracts now, but B1 must not implement a weekday tool,
daily-stop tool, tool runner, conclusion policy, sample thresholds, or real
analytical output.

## Decision: identity DAG

The authoritative graph is:

```text
verified snapshot + canonical filter + analytical dataset + normalized arguments
  -> analysis run context
  -> exact metrics
  -> evidence bundles / exact tables / claims / chart-ready series / diagnostics
  -> final analysis run receipt
```

The run context contains tool and policy versions plus snapshot, filter, dataset,
and normalized-argument identities. Artifacts reference the run-context digest,
never the final run-receipt digest. The final receipt references the completed
artifact digests. No digest is patched after construction.

Wall-clock execution time, persistence/database IDs, localized display strings,
transient job IDs, and operational timing are excluded from analytical identity.
An accepted analysis cutoff is already factual input through the snapshot and
dataset identities.

## Shared proof contracts

- Exact tables contain ordered semantic columns, exact metric cells, row evidence,
  exact summary alternatives where valid, scope metadata, counts, eligibility,
  and limitations.
- Evidence bundles bind snapshot/filter/dataset through the run context and carry
  included/excluded state, round-trip keys, occurrence keys, comparison identity,
  and limitations.
- Validated claims are machine-readable contracts tied to one table and exact
  effect metric. B1 tests use contract-only fixtures; B1 emits no real conclusion.
- Chart-ready series select exact cells from a verified table. The builder copies
  the selected metric identity, requires the table as its accessible alternative,
  and cannot introduce a financial calculation or rendering.
- Diagnostics are content-addressed semantic entries bound to the run context.
- The final run receipt records artifact identities, counts, status, limitations,
  and diagnostics after all artifacts exist.

All builders and persisted/untrusted verifiers reject unknown fields, duplicate
identities, dependency mismatches, malformed exact values/digests, currency/unit
mismatches, oversized collections, and unsafe nested input. Canonical content is
safe-copied and deeply immutable.

## Tool-registry boundary

B1 defines metadata contracts only. An entry records tool/version identity,
argument-schema digest, required row fields, output contract keys, evidence
policy identity, supported currencies/timezones, deprecation state, and focused
test keys. Its executable state is fixed to `contract_only_no_runner`, and its
minimum-sample policy state is `deferred_to_tool_slice`.

The registry snapshot is a deterministic content-addressed set of those entries.
It contains no callback, runner, prompt, threshold, weekday tool implementation,
or daily-stop implementation. Executable B2/B3 entries must be added only in
their authorized slices.

## Consequences

- Artifact identities are acyclic and independently re-verifiable.
- Tables, claims, series, and evidence cannot drift across run contexts silently.
- Series remain evidence data with an exact table alternative, not graphics.
- Real conclusion semantics and executable registry behavior remain deferred.
- The final receipt can be constructed exactly once after its artifacts without
  an identity loop.
