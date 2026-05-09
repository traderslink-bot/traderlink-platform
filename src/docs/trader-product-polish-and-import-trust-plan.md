# Trader Product Polish And Import Trust Plan

## Purpose

This plan tracks the next end-user product layer for Trader Intelligence. The
goal is to make the app easier to trust, easier to import into, and easier to
act on after analysis is complete.

This branch must remain execution-first and product-facing. It does not add
auth, billing, persistence, broker API connections, candle fetching, export
features, or market-structure scoring. Market context can still be displayed
elsewhere as observational context, but this branch cannot use it for score,
severity, queue priority, or coaching conclusions.

## May 9 Product UI Correction Update

Status: completed for the current product-facing prototype.

The latest pass used this product-polish layer inside a clearer end-user app
flow:

```text
Workspace -> Import Trades -> Saved Trades -> Trade Detail -> Review Queue -> Coach -> Analytics
```

Completed improvements:

- Shared presentation components now keep repeated app surfaces consistent:
  `PrimaryActionPanel`, `MetricCard`, `SimpleBarChart`, `MixBar`,
  `AdvancedDisclosure`, and `PlainStateBadge`.
- The coach page now opens with one next action and a three-part review plan:
  avoid this next session, repeat this, and review this trade.
- Review queue lanes now use plain trader language:
  Highest Priority, Chart Context Waiting, Open Trades, Needs Technical
  Follow-Up, and Reviewed With Chart Context.
- Saved trades now lead with the priority trade and show useful grouping before
  the full card list.
- Trade detail now presents what happened, what to review, what to write down,
  and what is unavailable before deeper evidence panels.
- Analytics now starts with a trader-facing report and visible charts instead
  of advanced setup/import-readiness panels.
- Internal/admin-style details remain available through advanced disclosures or
  `/workspace/admin`, but are no longer the primary user presentation.

Next polish target:

- Open screenshots side-by-side for `/analytics`, `/coach`, `/review`,
  `/trades`, and `/trades/[tradeId]`.
- Tighten overlong card values and dense explanatory copy.
- Move any remaining internal-only sections fully under admin if they still
  distract from the end-user review flow.

## Implementation Checklist

- [x] Create coach evidence cards.
  - Add a deterministic evidence-card model for warnings, mistake reads,
    quality scores, rule candidates, import repair items, and positive
    strengths.
  - Every card must include what happened, why it matters, confidence wording,
    source type, related trade IDs, and the review action.
  - Evidence cards must be usable on `/analytics`, `/coach`,
    `/trades/[tradeId]`, and `/review` without exposing raw JSON.

- [x] Add trade grade explainability.
  - For each trade quality scorecard, build a plain-language breakdown of what
    pushed the grade up or down.
  - Include dimension scores, driver facts, top risk, top strength, limitations,
    and a single next review action.
  - Keep the explanation execution-only and prove that market context does not
    affect it.

- [x] Build first import experience output.
  - Create a product view model that explains the import path as steps:
    select broker/file, detect columns, map required fields, validate rows,
    group trades, review repairs, and save in-app.
  - Show readiness, blockers, supported broker labels, accepted/rejected counts,
    duplicate/review counts, and the next action.
  - Do not add a real upload control yet; this remains fixture/in-memory and
    ready for later UI wiring.

- [x] Build trade repair inbox output.
  - Convert import validation and reconciliation results into end-user repair
    cards.
  - Each repair item should have severity, source, issue summary, affected
    request index or trade IDs, suggested fix, and whether analysis is blocked.
  - Prioritize rejected/blocked items first, then warnings, then duplicate
    review items.

- [x] Build personal pattern memory.
  - Combine repeated mistake observations, severity ladder, best/worst pattern
    finder, and repeated strengths into a memory model.
  - Each memory item should state whether it is a leak to fix, a behavior to
    protect, or a pattern to watch.
  - Include occurrence count, confidence, related trades, last seen session, and
    next action.

- [x] Build rule candidate lab.
  - Expand the rule recommendation experience into a lab that shows the
    suggested rule, why it exists, default parameters, flagged trades, expected
    success metric, readiness, and review status.
  - Make it clear that this is not persisted yet and does not claim alternate
    P/L.

- [x] Build session recap page data.
  - Create a session recap model for latest-session best trade, worst trade,
    biggest leak, repeatable behavior, rule focus, next action, and linked
    review trades.
  - Add a `/session-recap` route so this can become a daily product habit.

- [x] Add confidence calibration layer.
  - Add reusable confidence calibration output for reads driven by one trade,
    several trades, repeated behavior, sample data, and low-evidence cases.
  - Product copy must distinguish strong evidence from "review manually" cases.

- [x] Build execution quality trendline.
  - Add a trade-by-trade trendline for quality score, direction vs previous
    trade, grade band, and related review action.
  - Add report-level trend summary when history exists.
  - Use simple CSS bars/rows in the UI, no chart dependency.

- [x] Build coach review queue.
  - Combine import repairs, highest-cost mistake, repeated behavior, rule lab,
    lowest-quality trade, and best repeatable behavior into one prioritized
    queue.
  - Each queue item needs a lane, priority, title, reason, linked route, related
    trades, and the next action.
  - Keep all items inside the app. Do not add export or download actions.

- [x] Wire into product surfaces.
  - Add the product polish view model to
    `ProductTraderAnalyticsViewModel`.
  - Export public builders and types from
    `src/lib/trader-analytics/index.ts`.
  - Surface the new data on `/coach`, `/analytics`, `/review`, `/progress`,
    `/imports`, `/trades/[tradeId]`, and `/session-recap`.
  - Update home navigation and platform route policy for the new recap route.

- [x] Add focused tests.
  - Test evidence card shape and source links.
  - Test grade explainability is bounded, deterministic, and execution-only.
  - Test first import experience and trade repair inbox counts/priorities.
  - Test pattern memory, rule lab, confidence calibration, trendline, session
    recap, and coach review queue.
  - Test market context remains unused for these product conclusions.

- [x] Verify and update handoff docs.
  - Run focused Vitest coverage for the new layer.
  - Run trader analytics tests, TypeScript, full verification, lint, build, and
    route smoke.
  - Update this plan, `src/docs/codex-project-log.md`, and README when the work
    is complete.

## Decisions

- Add one new product module:
  `src/lib/trader-analytics/product/product-polish.ts`.
- Add one new end-user route: `/session-recap`.
- Reuse the existing `coachActionLoop`, `improvementIntelligence`,
  `productIntelligence`, `productization`, and `importInbox` outputs.
- Do not create a new scoring engine. This branch explains and prioritizes
  existing execution-only analysis.
- Do not add export/download features.
- Do not update the `levels-system` shared handoff unless this branch hits a
  true shared-engine blocker.

## Acceptance Criteria

- The product can show users why a warning, grade, rule candidate, or repair
  item exists.
- Import users can see a clear first-import path and repair inbox before real
  upload UI exists.
- The app can remember repeated personal patterns and turn them into a
  prioritized coaching queue.
- Session recap exists as a first-class route and product habit.
- Execution quality trendline is visible without a new chart library.
- Tests prove all new product conclusions stay execution-only.

## Verification Commands

- `npx vitest run src/lib/trader-analytics/__tests__/trader-product-polish.test.ts`
- `npx vitest run src/lib/trader-analytics/__tests__`
- `npx tsc --noEmit`
- `npm run verify:all`
- `npm run lint`
- `npm run build`

## Current Status

- Started: 2026-05-03
- Completed: 2026-05-03
- Status: complete for the fixture/in-memory product prototype.

## Completed Implementation

- Added `src/lib/trader-analytics/product/product-polish.ts` as the pure
  product builder layer for:
  - coach evidence cards
  - trade grade explainability
  - first import experience
  - trade repair inbox
  - personal pattern memory
  - rule candidate lab
  - session recap data
  - confidence calibration
  - execution quality trendline
  - coach review queue
- Added product-polish contracts to
  `src/lib/trader-analytics/product/types.ts`.
- Exported the new builders and types through
  `src/lib/trader-analytics/index.ts`.
- Wired `productPolish` into
  `buildProductTraderAnalyticsViewModel(...)`.
- Added `/session-recap` and registered it in the platform route module.
- Enhanced `/analytics`, `/coach`, `/review`, `/progress`, `/imports`, and
  `/trades/[tradeId]` with the new product-polish outputs.
- Updated `/` with a session recap entry.
- Added focused tests in
  `src/lib/trader-analytics/__tests__/trader-product-polish.test.ts`.

## Verification Results

- `npx vitest run src/lib/trader-analytics/__tests__/trader-product-polish.test.ts`
  passed with 1 file / 7 tests.
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 12 files /
  79 tests.
- `npx tsc --noEmit` passed.
- `npm run verify:all` passed with 80 files / 740 tests, plus the
  `levels-system`, Layer 2, and Layer 3 checkpoints.
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings.
- `npm run build` passed and produced `/session-recap`.
- Local route smoke against the existing dev server passed for `/`,
  `/analytics`, `/coach`, `/imports`, `/review`, `/progress`,
  `/session-recap`, and `/trades/trade-rapid-fire`.
