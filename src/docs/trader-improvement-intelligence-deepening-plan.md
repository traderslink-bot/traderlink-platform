# Trader Improvement Intelligence Deepening Plan

## Purpose

This plan tracks the next product layer for Trader Intelligence: helping a trader
understand what they did, what it cost, what worked, and what to change next.

This branch stays execution-first. Candle levels and market structure from
`levels-system` may be displayed later, but they must not affect trade quality,
mistake cost, rule evaluation, or final coaching conclusions until calibrated.

## Implementation Checklist

- [x] Deepen execution replay with decision roles, position before/after,
  position percent of max size, average open price, realized P/L progress,
  risk direction, and linked review labels.
- [x] Add deterministic per-trade quality scoring for entry discipline, add
  discipline, exit discipline, risk control, sizing consistency, and overall
  quality.
- [x] Expand mistake observations with confidence, reason, and suggested review
  action.
- [x] Strengthen rule-builder recommendations with suggested rule titles and
  expected success metrics.
- [x] Add playbook/readiness buckets for execution-only trade setup groupings.
- [x] Add a latest-session daily coach report with best trade, worst trade,
  biggest mistake, best repeatable behavior, rule focus, and next-session
  actions.
- [x] Add behavior visuals for quality, mistakes, rule violations, execution
  buckets, duration buckets, and session behavior.
- [x] Add best/worst pattern finder output to identify the highest-value review
  target.
- [x] Wire the new intelligence into `/analytics`, `/review`, `/progress`, and
  `/trades/[tradeId]`.
- [x] Add focused tests for replay roles, quality scoring, mistake mapping,
  coach reports, playbook buckets, visuals, best/worst patterns, and market
  context gating.

## Decisions

- Keep this as fixture/in-memory product work.
- Do not add auth, billing, persistence, or exports.
- Do not add new candle-provider work in this repo.
- Keep market structure observational and out of scoring.
- Prefer enhancing existing routes over adding new routes.

## Acceptance Criteria

- The app can explain a single trade with richer execution replay and quality
  scoring.
- The analytics view can identify the latest session's coach report and the
  highest-value review target.
- The progress view can show quality and behavior trend visuals without market
  data.
- Rule recommendations are tied to repeated behavior and include measurable
  success metrics.
- Tests prove execution-only scoring is stable and market-context calibration
  remains gated.

## Verification Commands

- `npx vitest run src/lib/trader-analytics/__tests__`
- `npx tsc --noEmit`
- `npm run verify:all`
- `npm run lint`
- `npm run build`

## Current Status

- Started: 2026-05-03
- Completed: 2026-05-03
- Status: implementation complete for the fixture/in-memory product layer.
- Verification completed:
  - `npx vitest run src/lib/trader-analytics/__tests__`: 10 files / 65 tests
  - `npx tsc --noEmit`: passed
  - `npm run verify:all`: 78 files / 726 tests, plus shared-engine, Layer 2,
    and Layer 3 checkpoints
  - `npm run lint`: passed with the same 4 pre-existing warnings
  - `npm run build`: passed
  - Existing dev server smoke passed at `http://localhost:3000` for `/`,
    `/analytics`, `/review`, `/progress`, and `/trades/trade-rapid-fire`
