# Level Analysis Delivery Trade Detail Level Facts Route Implementation

## Purpose

Gate `journal_level_analysis_delivery_trade_detail_level_facts_route_implementation`
adds a feature-gated trade-detail API route for the locked facts-only
level-analysis read model.

This gate does not add production UI wiring, storage migrations, resolver
behavior, LevelEngine changes, durable schema changes, or levels-system
changes.

## Dependencies

This gate depends on:

- `journal_level_analysis_delivery_trade_detail_level_facts_read_model_contract`
- persisted `JournalLevelAnalysisTradeLinkRecord` rows
- the existing trade-link repository
- the locked `TradeDetailLevelFactsReadModel` contract

## Route

Route:

`GET /api/trades/[tradeId]/level-analysis/facts`

Feature flag:

`LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_ENABLED=1`

When the flag is disabled, the route returns:

```json
{
  "ok": false,
  "code": "feature_disabled",
  "message": "Level analysis trade-detail facts API is disabled."
}
```

When enabled, the route returns the locked
`trade_detail_level_facts_read_model_v1` shape for the requested saved trade.

## Server Helper

Helper:

```ts
getTradeDetailLevelFactsForApi({
  savedTradeId,
  featureEnabled,
})
```

Behavior:

- reads the latest persisted trade link for the saved trade when enabled
- delegates read-model construction to
  `buildTradeDetailLevelFactsReadModel`
- returns `feature_disabled` when called with `featureEnabled: false`
- returns `not_checked` when no link exists
- returns attached facts for linked old `LevelAnalysisSnapshot` v1 records
- returns attached facts for linked packaged review delivery records

The helper does not resolve candidates, persist links, mutate records, expose
raw payloads, or inspect LevelEngine internals.

## Compatibility

The route preserves both supported source shapes:

- old `LevelAnalysisSnapshot` v1 single-snapshot payloads
- packaged review delivery payloads with `entries[]`

Old snapshot facts surface `fifteenMinuteContextOnlyStatus: "not_supplied"`.
Packaged review delivery facts must remain `context_only` for 15m context.

## Safety Boundaries

- Preserve raw source payloads only on delivery records.
- Do not expose raw source payloads from the trade-detail facts route.
- Do not auto-resolve or auto-persist trade links during a read.
- Do not add production UI dependencies.
- Do not add recommendations, coaching, grading, P/L, giveback analysis,
  behavior scoring, buy/sell/hold decisions, or trade-advice wording.
- Do not infer execution quality from level facts.

## Validation

Focused tests cover:

- packaged delivery facts returned from a persisted trade link
- old `LevelAnalysisSnapshot` v1 facts returned from a persisted manual link
- feature-disabled route behavior
- no-link `not_checked` behavior
- raw payload exclusion
- no recommendation/coaching/grading/P/L/giveback/behavior/trade-advice wording

## Recommended Next Gate

`journal_level_analysis_delivery_trade_detail_level_facts_ui_design`

Reason: the display-oriented route and server helper now exist behind a feature
flag. The next step is to design exact trade-detail placement, copy, and
loading/error states before implementing any UI.
