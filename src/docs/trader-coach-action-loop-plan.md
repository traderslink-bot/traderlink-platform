# Trader Coach Action Loop Plan

## Purpose

This plan tracks the next product branch for turning trader analytics into a
clear coaching loop: what to review, what rule would have helped, what trader
archetype is emerging, what to prepare for next session, and whether review work
is being completed.

This branch stays execution-only. It must not add auth, billing, persistence,
exports, broker providers, candle fetching, or market-structure scoring.

## Implementation Checklist

- [x] Build mistake timeline output that places likely mistakes on the trade
  execution replay.
- [x] Build rule simulation output that shows which trades would be flagged by
  suggested rules without pretending to simulate alternate P/L.
- [x] Build trader archetype profile output from repeated execution behavior.
- [x] Build a session prep card with one rule, one behavior to avoid, one
  behavior to repeat, and a short review list.
- [x] Build review completion loop output for review, lesson, rule, and
  follow-up states.
- [x] Build trade similarity output that connects a trade to similar prior
  execution patterns.
- [x] Build mistake severity ladder output ranked by frequency, cost,
  confidence, recurrence, and rule impact.
- [x] Build confidence-language output so product copy uses strong, moderate,
  or manual-review wording based on evidence quality.
- [x] Build end-user empty states for no-trade, one-trade, all-winner,
  all-loser, sample-data, and ready states.
- [x] Build a coach home screen view model and route for the user's next best
  action.
- [x] Wire the coach action loop into the product analytics view model and
  public exports.
- [x] Add focused tests for every helper and market-context isolation.
- [x] Verify TypeScript, focused tests, full tests, lint, build, and route smoke.

## Decisions

- Add one new product module:
  `src/lib/trader-analytics/product/coach-action-loop.ts`.
- Add one new end-user route: `/coach`.
- Enhance `/trades/[tradeId]` with similar trades and mistake timeline.
- Keep all output deterministic and fixture/in-memory for now.
- Do not add any export/download affordance.
- Do not update the `levels-system` handoff unless this branch hits a blocker.

## Acceptance Criteria

- `/coach` gives a user one clear next action, one rule focus, one prep card,
  review-loop status, archetype read, severity ladder, rule simulations, and
  empty-state guidance.
- `/trades/[tradeId]` shows where mistakes likely started and which trades look
  similar.
- Rule simulation flags trades but does not claim alternate P/L.
- Confidence wording makes low-evidence reads sound appropriately cautious.
- Tests prove the coach loop is execution-only and market context does not
  change its scoring or conclusions.

## Verification Commands

- `npx vitest run src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts`
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

- Added `src/lib/trader-analytics/product/coach-action-loop.ts` as the pure
  product builder layer for mistake timelines, rule simulations, archetype
  profile, session prep, review completion, similarity groups, severity ladder,
  confidence language, empty states, and coach home output.
- Added public contracts for the coach action loop through
  `src/lib/trader-analytics/product/types.ts` and
  `src/lib/trader-analytics/index.ts`.
- Wired `coachActionLoop` into
  `buildProductTraderAnalyticsViewModel(...)`.
- Added `/coach` as the end-user coach action route.
- Added the coach route to the platform module with no raw JSON/export
  affordance.
- Enhanced `/trades/[tradeId]` with the per-trade mistake timeline and similar
  trades panels.
- Added `/coach` to the home entry surface.
- Added focused tests in
  `src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts`.

## Verification Results

- `npx vitest run src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts src/lib/trader-analytics/__tests__/platform-ready-feature-module.test.ts`
  passed with 3 files / 20 tests.
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 11 files /
  72 tests.
- `npx tsc --noEmit` passed.
- `npm run verify:all` passed with 79 files / 733 tests, plus the
  `levels-system`, Layer 2, and Layer 3 checkpoints.
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings.
- `npm run build` passed and produced `/coach`.
- Local route smoke against the existing dev server passed for `/`, `/coach`,
  `/analytics`, `/review`, `/progress`, and `/trades/trade-rapid-fire`.
