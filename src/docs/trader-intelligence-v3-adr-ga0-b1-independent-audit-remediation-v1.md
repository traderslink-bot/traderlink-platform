# ADR: GA0-B1 Independent-Audit Remediation v1

**Status:** accepted for the GA0-B1 remediation candidate

**Date:** 2026-07-23 America/Toronto

**Scope:** GA0-B1 only

## Context

The independent GA0-B1 audit accepted the overall direction but identified eight
authority gaps. The gaps shared one cause: several B1 contracts carried claimed
digests, counts, classifications, or display facts without rebuilding those
facts from the accepted A2/A3 authority graph.

This ADR narrows the accepted B1 decisions. It does not authorize a B2 tool
runner, a production handoff, deployment, owner-data migration, or a new
analytical truth path.

## R1: starting inventory is manifest-bound authority

Every `StartingInventoryContract` state is content-addressed in the
`starting_inventory` domain. The digest covers:

- policy version, state, as-of timestamp, and coverage state;
- owner, account, stable instrument, and currency ledger identity;
- accepted prior lots, FIFO ordinals, basis policy, quantities, and prices;
- signed charges and charge-coverage state; and
- source identity, document, row locator, execution digest, source kind, and
  evidence class.

The manifest records a non-null starting-inventory digest for `proven_flat`,
`accepted_prior_lots`, and `unknown`. Its prior-inventory ledger key includes
owner, account, stable instrument, and normalized lowercase currency. The B1
adapter requires an exact one-to-one ledger-key, state, and digest match between
the manifest and supplied inventories before reconstruction.

## R2: run context is constructed from verified authorities

An analysis run context can no longer be assembled from naked digest strings or
a caller-selected eligibility state. Its builder requires:

- the actual verified snapshot and exact snapshot dependencies;
- the actual canonical filter;
- the actual analytical dataset receipt;
- content-addressed normalized arguments; and
- the actual verified tool-registry entry.

The builder checks snapshot/filter/dataset manifest, cutoff, correction,
eligibility, supported timezone/currency, required row fields, argument-schema,
tool, and tool-policy identity. It derives eligibility from the registry's
required capability and accepts only `eligible` or `limited`.

## R3: evidence membership is dataset-derived

An analytical evidence bundle selects dataset candidate keys. It does not accept
caller-authored round-trip keys, occurrence keys, exclusion reasons, or
limitations.

For included membership, the builder resolves exact analytical rows and derives
round-trip keys, occurrence keys, and limitations. For excluded membership, it
resolves exact dataset exclusions and derives semantic round-trip keys,
occurrence keys, primary exclusion reasons, source limitations, and source
reason codes. A missing candidate or wrong inclusion state fails closed.

## R4: claims derive effects from exact table cells

A validated claim carries a machine-readable effect derivation:

- `table_cell` copies one exact verified cell; or
- `difference` subtracts one compatible exact-decimal cell from another using
  accepted exact-decimal arithmetic.

Direction, exact effect, sample sizes, evidence digests, counterexample evidence,
and limitations are derived. The subject/comparison groups must name the source
rows. A caller cannot supply a free-standing effect or sample count.

## R5: currency and series/table scope are exact

Monetary units require one canonical currency. Non-monetary units require
`currency: null`. Tables must match the run's verified filter timezone/date
basis, one dataset currency partition where data exists, dataset counts,
capability eligibility, and exact limitations.

Chart-ready series must match the source table's currency, timezone, date basis,
denominator policy, counts, and limitations. Points and accessibility summaries
select exact table cells; their exact values and sample sizes are derived.
Caller-authored accessibility facts are rejected.

## R6: the final receipt verifies the actual artifact graph

The run receipt moved to the terminal edge of the dependency graph. Its builder
requires actual tables, claims, series, evidence bundles, diagnostics, and the
verified run context.

It re-verifies every artifact, requires referenced tables and evidence to be
present, rejects duplicate or unused evidence, and derives artifact digests,
dataset counts, limitations, diagnostics identity, and run status. The receipt
does not accept caller-authored status, counts, limits, or digest arrays.

## R7: exclusion reasons preserve source truth and semantic identity

Manifest exclusions are mapped through
`ti_v3_manifest_exclusion_reason_mapping:v1`. Each dataset exclusion records:

- the mapped primary dataset reason;
- the original manifest source reason; and
- the mapping policy key and version.

Manifest exclusions that identify executions belonging to a reconstructed row
are promoted to that row's semantic round-trip identity. Included rows and
exclusions are then reconciled so one semantic candidate is counted once.

## R8: civil dates and exchange sessions are distinct

UTC mode derives a UTC civil date and weekday and emits
`session: not_applicable`. It does not invent New York market sessions.

New York session classification requires the exact filter-bound, content-
addressed `DateResolutionReceipt`, `trading_session` calendar basis, a versioned
calendar policy, and evidence for the resolved local session date. Holidays,
missing evidence, mismatched receipts, and unsupported calendars fail closed.
Regular and early-close boundaries come from the receipt; premarket,
after-hours, and overnight classification is relative to those accepted
boundaries.

The deterministic New York DST implementation has an explicit lower bound of
2007, the first year of the encoded U.S. DST rule. Earlier timestamps fail
closed.

## Consequences and stop boundary

- B1 artifacts are derived from actual authority objects, not mutually
  consistent-looking claims.
- Persisted/untrusted re-entry still requires identity and graph verification.
- Focused tests cover authority substitution, invented evidence, free-standing
  effects, currency/scope drift, receipt drift, semantic candidate deduplication,
  holidays, early close, DST transitions, and the 2006/2007 boundary.
- PR review threads remain unresolved for independent re-audit.
- The draft PR remains unmerged and no production deployment is authorized.
