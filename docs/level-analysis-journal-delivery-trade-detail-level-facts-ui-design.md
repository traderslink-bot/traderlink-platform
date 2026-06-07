# Level Analysis Delivery Trade Detail Level Facts UI Design

## Purpose

Gate `journal_level_analysis_delivery_trade_detail_level_facts_ui_design`
defines how the saved trade detail page should display persisted
levels-system facts after a trade has a trusted level-analysis trade link.

This is a design gate. It does not add production UI wiring, route handlers,
storage migrations, resolver behavior, LevelEngine changes, or levels-system
changes.

## Current State

Completed gates now provide:

- source-preserving ingestion for old `LevelAnalysisSnapshot` v1 payloads and
  packaged review delivery payloads
- durable delivery persistence and feature-gated delivery APIs
- durable trade-link persistence and feature-gated trade-link APIs
- review-queue level-facts availability read models
- a locked trade-detail facts read-model contract
- feature-gated route:
  `GET /api/trades/[tradeId]/level-analysis/facts`

The trade detail page at `app/intelligence/trades/[tradeId]/page.tsx` already
has the correct evidence boundary:

- `What This Review Can Use`
- `Supporting Evidence`

The level-facts UI should extend those sections. It should not create a new
parallel review system.

## Design Goals

- Show whether level facts are attached, unavailable, blocked, or disabled.
- Surface compact factual context when facts are attached.
- Keep facts separate from scoring, coaching, checklist state, P/L, and review
  priority.
- Avoid raw payload exposure.
- Preserve old `LevelAnalysisSnapshot` v1 compatibility.
- Preserve packaged review delivery context-only 15m status.
- Keep the route and UI behind feature flags until implementation is reviewed.

## Non-Goals

- No production UI wiring in this gate.
- No automatic trade-link resolution during trade detail reads.
- No durable storage changes.
- No LevelEngine changes.
- No levels-system changes.
- No recommendations, coaching, grading, P/L, giveback analysis, behavior
  scoring, buy/sell/hold decisions, or trade-advice wording.

## Source Contract

The UI implementation should consume only:

`GET /api/trades/[tradeId]/level-analysis/facts`

Expected response:

`trade_detail_level_facts_read_model_v1`

The page should not consume:

- raw delivery records
- raw source payloads
- `JournalLevelAnalysisTradeLinkRecord` directly
- admin/debug raw payload routes
- private levels-system or LevelEngine internals

## Feature Flags

Required display flag:

`LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_ENABLED=1`

Optional implementation flag if the page needs an additional UI rollout guard:

`LEVEL_ANALYSIS_JOURNAL_TRADE_DETAIL_LEVEL_FACTS_UI_ENABLED=1`

If a separate UI flag is added, both flags should be required for the visible
panel. The API route can remain controlled by the existing display-route flag.

## Placement

### What This Review Can Use

Add one compact availability line inside the existing
`data-testid="trade-feedback-scope"` panel.

Recommended position:

- below `decisionReviewStatus.detail`
- above `Next: {decisionReviewStatus.nextAction}`

The line should use the read model `availability` state and remain factual:

- attached: `Level facts attached`
- not checked: `Level facts not checked`
- feature disabled: do not show the line unless debug visibility is enabled
- blocked by as-of policy: `Level facts blocked by as-of policy`
- unavailable: `Level facts unavailable`
- quarantined or unsafe: `Level facts quarantined`

The line must not change the existing review scope, next action, checklist
status, score, or coaching copy.

### Supporting Evidence

Add a compact `Level Facts` block inside the existing `Supporting Evidence`
panel under `AdvancedDisclosure`.

Recommended position:

- before existing product evidence cards when facts are attached
- after the empty-state copy when facts are not attached only if a factual
  unavailable state should be visible

The block should appear only when:

- the UI flag is enabled
- the route returns `featureEnabled: true`
- `display.shouldShowFactsPanel === true`
- `availability.availability === "attached"`
- `attachedFacts` is present

Blocked and unavailable states should remain short status rows. They should not
render a facts panel.

## Attached Facts Layout

Use a dense, unframed layout inside the existing panel instead of nested cards.

Recommended sections:

- Header row:
  - symbol
  - provider
  - as-of timestamp
  - source kind
  - 15m context-only status
- Nearest levels:
  - nearest support
  - nearest resistance
  - price, bucket, distance, and extension marker when present
- Context summaries:
  - density metric summary
  - candidate inventory gap summary
  - volume/session context summary
- Coverage and diagnostics:
  - bucket counts
  - extension counts or extension coverage warnings
  - synthetic continuation-map summary
  - diagnostics
- Source integrity:
  - cache mismatch count
  - prohibited-language hit count
  - source file metadata as compact paths, not clickable file access
- Limitations:
  - missing facts
  - limitations from the read model
  - safety flags as factual badges when useful

## Empty, Loading, And Error States

### Loading

If implemented client-side, show a single muted status row:

`Level facts loading`

Do not reserve a large blank panel.

Server-side rendering is preferred if the trade detail page can read the route
or helper without adding client fetch complexity.

### Not Checked

Show either no visible row, or a compact debug-safe row:

`Level facts not checked`

No action copy should imply the trader should change behavior.

### Feature Disabled

Default user-facing behavior:

- hide the level-facts row and panel

Debug or internal behavior:

- show `Level facts disabled`

### Blocked By As-Of Policy

Show a compact status row:

`Level facts blocked by as-of policy`

Do not render nearest support/resistance or other attached facts.

### Quarantined Or Unsafe

Show a compact status row only if useful for internal review:

`Level facts quarantined`

Do not render any attached facts or raw source details.

### Route Error

The page should fail closed:

- keep the existing trade detail page usable
- omit the facts panel
- optionally show `Level facts unavailable`
- never block the trade review workflow

## Copy Rules

Allowed words:

- level facts
- chart evidence
- supporting evidence
- nearest support
- nearest resistance
- as of
- context-only
- source integrity
- limitations
- missing facts

Do not use:

- recommendation
- trade advice
- buy
- sell
- hold
- coaching
- grade
- P/L
- giveback
- behavior score
- should have
- should enter
- should exit

Note: the broader trade detail page already has execution and P/L sections.
This rule applies to the level-facts UI copy and fixtures for this feature.

## Component Boundary

Recommended implementation shape:

- Add a small server helper to load the read model for the trade detail page.
- Add a pure display component, for example
  `TradeDetailLevelFactsPanel`.
- Keep formatters local or in a small level-analysis UI helper if reused.
- Keep tests focused on rendered state and prohibited wording.

Suggested component props:

```ts
interface TradeDetailLevelFactsPanelProps {
  readModel: TradeDetailLevelFactsReadModel;
}
```

The component should not:

- call persistence repositories directly
- call resolver or ingest APIs
- accept raw payloads
- compute journal evaluations
- infer execution quality

## Mobile And Accessibility

- Use one-column stacking on mobile.
- Keep label/value rows wrapping cleanly.
- Avoid horizontal overflow from source file paths and hashes.
- Use regular text labels for support/resistance facts; avoid icon-only facts.
- Ensure status rows are readable without color.
- Keep source paths truncated or wrapped with `break-all`.

## Test Plan For Implementation

Future implementation tests should cover:

- feature flag off hides user-facing panel
- attached packaged delivery renders compact facts
- old `LevelAnalysisSnapshot` v1 renders attached facts with
  `not_supplied` 15m status
- not-checked state does not render attached facts
- blocked and quarantined states do not render attached facts
- route errors fail closed
- raw payload keys are absent from rendered output
- source file paths do not overflow on mobile
- no prohibited recommendation/coaching/grading/P/L/giveback/behavior/trade
  advice wording appears in the level-facts UI
- existing trade detail evidence, checklist, scoring, and P/L sections remain
  unchanged except for the added factual level-facts display

## Recommended Next Gate

`journal_level_analysis_delivery_trade_detail_level_facts_ui_contract`

Reason: the UI placement and copy rules are now designed. Next, lock a compact
UI component contract and render fixtures before wiring the component into the
live trade detail page.
