# Level Analysis Delivery Trade Detail Level Facts UI Contract

## Purpose

Gate `journal_level_analysis_delivery_trade_detail_level_facts_ui_contract`
locks the UI-facing contract for showing persisted level-analysis facts on the
saved trade detail page.

This gate adds a pure contract/helper and compact fixtures. It does not wire
the production trade detail page, add route handlers, add storage migrations,
change LevelEngine behavior, or modify the levels-system repo.

## Dependencies

This gate depends on:

- `journal_level_analysis_delivery_trade_detail_level_facts_ui_design`
- `journal_level_analysis_delivery_trade_detail_level_facts_route_implementation`
- locked read model `trade_detail_level_facts_read_model_v1`
- route `GET /api/trades/[tradeId]/level-analysis/facts`

## Contract Module

Module:

`src/lib/level-analysis/level-analysis-trade-detail-level-facts-ui-contract.ts`

Contract version:

`trade_detail_level_facts_ui_contract_v1`

Primary helper:

```ts
buildTradeDetailLevelFactsUiContract(readModel)
```

The helper:

- validates the source read model
- maps availability to the existing `What This Review Can Use` placement
- maps attached facts to compact `Supporting Evidence` panel sections
- omits raw payloads and raw payload hashes
- fails if prohibited fields or wording appear
- does not call routes, repositories, resolvers, ingestion, or UI code

## UI Contract Shape

`TradeDetailLevelFactsUiContract` includes:

- `contractVersion`
- `sourceReadModelContractVersion`
- `factualOnly`
- `savedTradeId`
- `featureEnabled`
- `status`
- `placement`
- `availabilityLine`
- `factsPanel`
- `summary`
- `limitations`

## Placement Contract

Availability target:

`data-testid="trade-feedback-scope"`

Availability position:

`below_scope_detail_before_next_action`

Facts target:

`data-testid="trade-supporting-details"`

Facts position:

`supporting_evidence_before_product_evidence_cards`

## Availability States

Supported states:

- `attached`
- `not_checked`
- `feature_disabled`
- `blocked_by_as_of_policy`
- `unavailable_for_symbol_provider`
- `quarantined_or_unsafe`

Only `attached` renders a facts panel. Other states render either a compact
availability line or remain hidden when disabled.

## Facts Panel Sections

Attached facts can render these sections:

- `header`
- `nearest_levels`
- `context_summaries`
- `coverage_and_diagnostics`
- `source_integrity`
- `limitations`

The sections are compact row/badge data, not React components. Future UI work
can render these rows without reading persistence internals.

## Compatibility

The contract preserves:

- packaged review delivery payloads with context-only 15m facts
- old `LevelAnalysisSnapshot` v1 links with `not_supplied` 15m status
- missing old-snapshot facts such as density, candidate inventory, and cache
  fingerprint summaries
- blocked and unavailable states without attached facts

## Safety Boundaries

- Preserve raw source payloads only on delivery records.
- Do not expose raw payloads or raw payload hashes through the UI contract.
- Do not auto-resolve or auto-persist links during a display read.
- Do not change review score, checklist state, coaching, P/L, giveback,
  behavior scoring, or review priority.
- Do not infer execution quality from level facts.
- Do not add buy/sell/hold, recommendation, or trade-advice wording.
- Treat packaged 15m context as context-only.

## Fixtures

Fixtures live under:

`src/lib/level-analysis/__fixtures__/trade-detail-level-facts-ui-contract/`

Fixtures:

- `trade-detail-level-facts-ui.attached.compact.json`
- `trade-detail-level-facts-ui.old-snapshot-attached.compact.json`
- `trade-detail-level-facts-ui.blocked-asof.compact.json`
- `trade-detail-level-facts-ui.not-checked.compact.json`
- `trade-detail-level-facts-ui.feature-disabled.compact.json`

All fixtures are compact, facts-only, and exclude raw payloads.

## Tests

Focused tests cover:

- compact fixture factual-only assertions
- attached packaged delivery UI contract derivation
- old `LevelAnalysisSnapshot` v1 UI compatibility
- blocked, not-checked, and feature-disabled states without attached panels
- summary helper output
- malformed contract and invalid read-model rejection
- raw payload exclusion
- prohibited recommendation/coaching/grading/P/L/giveback/behavior/trade-advice
  wording exclusion

## Recommended Next Gate

`journal_level_analysis_delivery_trade_detail_level_facts_ui_implementation`

Reason: the UI display contract and fixtures are now locked. The next step is
to add a feature-gated pure display component and wire it into the trade detail
page behind the approved UI flag, without changing persistence, routes, or
LevelEngine behavior.
