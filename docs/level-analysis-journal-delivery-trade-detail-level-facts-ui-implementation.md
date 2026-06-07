# Level Analysis Delivery Trade Detail Level Facts UI Implementation

## Purpose

Gate `journal_level_analysis_delivery_trade_detail_level_facts_ui_implementation`
adds the feature-gated saved trade detail display for persisted level-analysis
facts.

This gate wires the existing trade detail page behind explicit feature flags.
It does not change route handlers, storage schema, resolver behavior,
LevelEngine behavior, or the levels-system repo.

## Dependencies

This gate depends on:

- `journal_level_analysis_delivery_trade_detail_level_facts_ui_contract`
- `trade_detail_level_facts_ui_contract_v1`
- `trade_detail_level_facts_read_model_v1`
- `GET /api/trades/[tradeId]/level-analysis/facts`

## Feature Flags

The trade detail page renders level facts only when all are true:

- saved-data mode is active
- `LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_ENABLED=1`
- `LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_UI_ENABLED=1`

The new UI rollout flag is:

`LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_UI_ENABLED`

With flags off, the trade detail page remains visually unchanged.

## Implementation

Added component:

`app/intelligence/trades/[tradeId]/trade-detail-level-facts.tsx`

The component renders:

- `TradeDetailLevelFactsAvailabilityLine`
- `TradeDetailLevelFactsPanel`

The component accepts only `TradeDetailLevelFactsUiContract | null`. It does
not read repositories, call APIs, resolve links, persist links, or inspect raw
source payloads.

Updated page:

`app/intelligence/trades/[tradeId]/page.tsx`

The page now:

- checks the route and UI feature flags
- reads the facts read model through the existing server helper
  `getTradeDetailLevelFactsForApi`
- maps the read model through `buildTradeDetailLevelFactsUiContract`
- renders the availability line inside `What This Review Can Use`
- renders the attached facts panel inside `Supporting Evidence`

## Placement

Availability line:

- target: `data-testid="trade-feedback-scope"`
- position: below the existing scope detail and above the existing next-action
  line

Facts panel:

- target: `data-testid="trade-supporting-details"`
- position: inside the existing `Supporting Evidence` panel before product
  evidence cards

## Rendered States

Attached:

- renders availability line
- renders compact facts panel

Old `LevelAnalysisSnapshot` v1 attached:

- renders availability line
- renders compact facts panel
- shows `not_supplied` 15m status
- tolerates missing density, inventory, and cache fingerprint summaries

Blocked:

- renders availability line
- does not render attached facts

Feature disabled:

- renders nothing

Missing contract:

- renders nothing

## Safety Boundaries

- Preserve old `LevelAnalysisSnapshot` v1 compatibility.
- Preserve packaged review delivery compatibility.
- Treat packaged 15m context as context-only.
- Do not expose raw payloads or raw payload hashes in the UI.
- Do not auto-resolve or auto-persist links during a trade detail read.
- Do not change score, checklist state, coaching, P/L, giveback, behavior
  scoring, or review priority.
- Do not infer execution quality from level facts.
- Do not add buy/sell/hold, recommendation, or trade-advice wording.

## Tests

Focused tests cover:

- attached packaged delivery render output
- old `LevelAnalysisSnapshot` v1 render output
- blocked state without attached facts
- disabled/null contract hidden behavior
- UI feature flag behavior
- no raw payload wording or fields in rendered output
- no recommendation/coaching/grading/P/L/giveback/behavior/trade-advice wording

## Recommended Next Gate

`journal_level_analysis_delivery_trade_detail_level_facts_e2e_seeded_flow`

Reason: the feature-gated UI component is now wired. The next gate should seed
a saved delivery, trade link, and saved trade in a local test database, then
verify the trade detail page renders the level-facts panel end-to-end with both
feature flags enabled.
