# ADR: GA0-A3 Temporal, Manifest, and Snapshot Authority v1

Date: 2026-07-18
Status: required-fix remediation candidate; independent re-audit required
Branch: `agent/trader-intelligence-v3-ga0-a3-manifests`
Base: `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a`

## Decision

GA0-A3 uses append-only, content-addressed authority for corrections, dataset
coverage, per-capability eligibility, canonical filters, analysis snapshots,
and evidence references.

- A correction records valid/effective, optional first-public, observed,
  recorded, corrected, and optional superseded time. Temporal contradiction,
  missing or ambiguous targets, cycles, post-deletion corrections, unsupported
  states, and cutoff exclusions use stable fail-closed reason codes.
- Replay separates base-active facts from a verified available execution
  catalog. Replacements resolve exactly once and supersession must continue the
  same root/current-replacement lineage.
- Correction replay sorts verified semantic records canonically. Caller order,
  persistence row identity, UUIDs, display text, locale, and implicit wall time
  do not control the result.
- Factual lifecycle and review disposition are separate contracts. A legacy
  mark-closed action can be represented only as an annotation and cannot change
  executions, inventory, P&L, correction truth, or canonical identity.
- A dataset manifest commits to owner/account scope, source documents,
  executions, corrections, policies, statement periods, gaps, overlaps,
  exclusions, prior inventory, open positions, currencies, deletion state, and
  reconstruction status.
- Eligibility is authoritative only when calculated from the verified
  manifest, retrospective policy, correction result, cutoff, coverage, and
  evidence. A blocked
  reconstruction or coaching capability does not automatically block execution
  review or export.
- An analysis snapshot accepts only calculator-authoritative eligibility and a
  verified canonical empty-enrichment set bound to its manifest/cutoff. It
  binds exactly one manifest, correction cutoff, policy
  set, eligibility set, enrichment identity, intent/rule cutoff, analysis
  cutoff, canonical filter, and evidence namespace.
- Evidence identity is derived from a verified snapshot and validates subject
  membership in that snapshot. It uses semantic keys, not
  broker rows, database IDs, account numbers, or filesystem paths.
- Relative date resolution is an injected calendar dependency. A verified
  receipt binds the request, fixed clock, calendar policy/version, session
  evidence, and resolved UTC range; canonical filters consume that receipt.

## Consequences

Equivalent canonical reimports retain identity, while meaningful facts,
coverage, corrections, policy, eligibility, or enrichment changes invalidate
dependent authority. Runtime verification is required at every persisted,
adapter, tool, manifest, filter, evidence, and snapshot boundary.

This ADR creates no analytics, UI, chart, AI, market-data, support/resistance,
or deployment authority. GA0-A3 remains unaccepted until independent re-audit.
