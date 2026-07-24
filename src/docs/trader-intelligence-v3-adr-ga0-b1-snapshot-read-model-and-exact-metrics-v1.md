# ADR: GA0-B1 Snapshot Read Model and Exact Metric Semantics v1

**Status:** accepted for the GA0-B1 implementation candidate

**Date:** 2026-07-19 America/Toronto

**Scope:** GA0-B1 only

## Context

GA0-A2/A3 provide exact canonical executions, correction replay, FIFO
reconstruction, manifests, eligibility, filters, snapshots, and evidence
inventories. GA0-B1 needs a useful analytical row set without creating a second
financial truth path or treating saved legacy JavaScript numbers as exact v3
authority.

The current saved legacy model does not expose the complete A2/A3 authority set
needed to prove an exact snapshot-bound dataset. Reading the legacy SQLite model
directly, guessing omitted exact values, or migrating owner data is outside this
slice.

## Decision

The B1 adapter consumes one explicit read-only authority bundle:

- an `AnalysisSnapshot` plus its exact `AnalysisSnapshotDependencies`;
- the correction inputs required to replay the accepted correction result;
- the accepted canonical execution catalog;
- relationship resolution and starting-inventory inputs;
- the accepted exact analytical reconstruction;
- the fixed B1 row/session derivation policy.

Before deriving rows, the adapter validates persisted snapshot identity, rebuilds
the snapshot from supplied trusted dependencies, recomputes content identities
for the manifest/filter/eligibility/enrichment/evidence authorities, replays
corrections, rebuilds relationship resolution, reruns accepted reconstruction,
and rebuilds evidence inventories. Every cross-dependency digest and accepted
execution set must agree. A mismatch is a dataset-level failure, not a candidate
exclusion.

The production-shaped local bridge accepts only a `readCurrentExactAuthority`
port. It has no database, repository, migration, or write method. Without a later
exact v3 provider it returns
`ti_v3_current_data_exact_v3_authority_unavailable`. The synthetic in-memory
source exercises the same adapter path in tests.

## Analytical row semantics

One row represents one accepted closed flat-to-flat reconstruction round trip.
Gross P/L, signed charges, net P/L, direction, quantity, and supporting execution
digests are copied from accepted reconstruction truth. P/L is never recalculated.

Supporting executions are resolved from the accepted catalog and ordered through
`orderCanonicalExecutions`. Digest storage order is never promoted to economic
order. The first economically ordered entry supplies the entry timestamp and the
non-authoritative displayed symbol. The final economically ordered exit supplies
the close timestamp. A symbol change is disclosed and the first-entry symbol is
selected deterministically; stable instrument identity remains authoritative.

The v1 civil-session policy supports only:

- UTC with the `UTC` timezone; and
- exchange/owner-local time with `America/New_York`.

It uses explicit Gregorian and U.S. DST rules, fixed weekday enums, and fixed
premarket/regular/after-hours/overnight boundaries. No locale API participates.
GA0-B1 supports `trade_close_date` with `calendar_day`; unsupported date/calendar
semantics fail at dataset level.

The entry notional is exact weighted-average entry price multiplied by exact
entry quantity. It is emitted only when the reduced rational product terminates
within accepted money bounds; otherwise the row carries a structured unavailable
fact and limitation. Share quantity is copied exactly from reconstruction.

## Candidate accounting and filters

The candidate set is the union of reconstructed round trips, round-trip inventory
keys, manifest open positions/exclusions, and reconstruction blocked states.
Every candidate becomes exactly one included row or one exclusion. Duplicate
semantic round-trip occurrences are excluded visibly. Exclusion counts are
computed from primary reasons and must sum to the excluded count.

The accepted `CanonicalQueryFilter` is applied directly for date/range,
account, stable instrument or deterministic displayed symbol, direction,
session, lifecycle, outcome, currency, and evidence capability. Setup filters
and unsupported time/calendar semantics fail closed instead of being ignored.

Currencies are separate canonical partitions. No FX policy exists and no
cross-currency financial aggregation is permitted.

## Exact metric contract

`ExactMetricValue` is a content-addressed union of exact decimal, reduced ratio,
bounded integer string, duration, timestamp/date, enum/state, and structured
unavailable values. Units are mandatory and currency is explicit or null.
Financial JavaScript numbers, implicit rounding, and display conversion are not
accepted authority.

All new authorities validate exact fields, safe-copy untrusted input through the
canonical validation boundary, deeply freeze canonical content, recompute their
digest on re-entry, and reject unknown fields or unsafe nested structures.

## Consequences

- B1 can prove a deterministic analytical dataset from exact A2/A3 authority.
- Current owner storage remains truthfully unavailable until an exact authority
  provider or separately authorized migration exists.
- Open, ineligible, ambiguous, missing-evidence, and filtered candidates remain
  visible without entering closed-trade denominators.
- Weekday conclusions, daily-stop simulation, UI, AI, market data, and migration
  remain outside this ADR and GA0-B1.
