# Trader Review Habit Loop Plan

## Purpose

This plan tracks the next end-user product layer for turning analysis into a
repeatable trader-improvement habit:

1. find the mistake
2. review the exact trade
3. convert the mistake into a rule candidate
4. compare similar trades
5. measure whether the behavior is improving
6. come back to the app for the next review session

This branch stays execution-first and product-facing. It does not add auth,
billing, persistence, broker API connections, candle fetching, export/download
features, or market-structure scoring. Market context remains observational and
must not affect rule conversion, review checklist status, behavior change,
trade comparison, onboarding, or safety-copy conclusions.

## Implementation Checklist

- [x] Build mistake-to-rule conversion flow.
  - Convert repeated mistake observations into draft rule candidates.
  - Each draft needs a title, source mistake, reason, affected trades, default
    parameters, measurement metric, readiness, review status, and a clear
    limitation that no alternate P/L is being claimed.
  - Drafts are deterministic view-model data only; do not persist real rules.

- [x] Build trade review checklist per trade.
  - Each saved trade gets a checklist for entry, add, exit, sizing, risk,
    lesson, and rule-needed review.
  - Checklist items must have status, evidence, linked labels, and a next
    review action.
  - The trade detail page should show this checklist beside existing autopsy
    and grade explainability.

- [x] Build behavior change tracker.
  - Compare current report behavior to the prior report where available.
  - Track adverse adds, rapid-fire clusters, open positions, rule violations,
    overall quality, and repeated mistakes.
  - Include current value, previous value, delta, direction, sample-size warning,
    related trade IDs, and next action.

- [x] Build user-facing data quality score.
  - Use import readiness, repair inbox, duplicate/reconciliation counts,
    accepted/rejected counts, and sample-data state.
  - Produce a 0-100 score, status, checks, blockers, warnings, and next action.
  - This must be about execution-import trust, not market-data quality.

- [x] Build coach language refinement layer.
  - Centralize product copy guidance for strong, moderate, and low-evidence
    claims.
  - Require copy to be factual, execution-linked, sample-size aware, and
    action-oriented.
  - Flag overclaiming language such as guaranteed, would have made, proves,
    prediction, and certainty claims.

- [x] Build setup/playbook drafting from execution patterns.
  - Turn existing playbook buckets into draft setup/playbook cards.
  - Each draft should include source bucket, qualifying trades, average quality,
    gross P/L, protect/fix focus, readiness, and next action.
  - Do not claim true market setup quality until market context is calibrated.

- [x] Build trade comparison output and route.
  - Select useful pairs such as best vs worst trade or similar execution
    patterns.
  - Compare P/L, quality, execution count, top risk, top strength, and review
    prompt.
  - Add `/compare-trades` as a product-facing route with no raw JSON/export.

- [x] Build review streaks and habits.
  - Use existing review workflow, notes, rule candidates, and report state to
    create review habit metrics.
  - Track review completion, lessons captured, rules drafted, follow-through,
    and next habit action.
  - Do not implement real persistence yet.

- [x] Build end-user onboarding path.
  - Create an onboarding path for import, repair, first report, coach queue,
    first trade review, first rule draft, and progress review.
  - Add `/onboarding` as a product-facing route.
  - Keep it focused on product flow, not auth/billing/platform setup.

- [x] Build product safety copy audit.
  - Audit generated habit-loop copy for forbidden overclaiming terms.
  - Include route/panel coverage and a pass/fail result.
  - Add tests proving unsafe copy is absent from the new product outputs.

- [x] Wire into product surfaces.
  - Add `reviewHabitLoop` to `ProductTraderAnalyticsViewModel`.
  - Export builders and types from `src/lib/trader-analytics/index.ts`.
  - Surface the new data on `/coach`, `/analytics`, `/progress`,
    `/trades/[tradeId]`, `/compare-trades`, `/onboarding`, and `/`.
  - Register new routes in the platform route module.

- [x] Add focused tests.
  - Test mistake-to-rule draft shape and no alternate-P/L claims.
  - Test trade checklist item coverage and per-trade mapping.
  - Test behavior change calculations with current/prior reports.
  - Test data quality score and blockers.
  - Test playbook drafts, comparison output, review habits, onboarding path,
    and safety-copy audit.
  - Test market context remains unused.

- [x] Verify and update handoff docs.
  - Run focused Vitest coverage for the new layer.
  - Run trader analytics tests, TypeScript, full verification, lint, build, and
    route smoke.
  - Update this plan, `src/docs/codex-project-log.md`, and README when complete.

## Decisions

- Add one new product module:
  `src/lib/trader-analytics/product/review-habit-loop.ts`.
- Add two new product routes:
  - `/compare-trades`
  - `/onboarding`
- Reuse existing `productPolish`, `coachActionLoop`,
  `improvementIntelligence`, `productIntelligence`, `productization`, and
  `reportHistory` outputs.
- Keep everything deterministic and fixture/in-memory for now.
- Do not add upload controls, persistence, auth, billing, or exports.
- Do not update the `levels-system` handoff unless a real shared-engine blocker
  appears.

## Acceptance Criteria

- The app can show a complete review habit loop from detected mistake to draft
  rule and progress tracking.
- Each trade can show a structured checklist, not just passive analytics.
- The user can compare two trades side by side.
- The user can follow an onboarding path without leaving the app.
- Product copy avoids overclaiming and keeps confidence language calibrated.
- All new conclusions remain execution-only.

## Verification Commands

- `npx vitest run src/lib/trader-analytics/__tests__/trader-review-habit-loop.test.ts`
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

- Added `src/lib/trader-analytics/product/review-habit-loop.ts` as the pure
  product builder layer for:
  - mistake-to-rule conversion drafts
  - per-trade review checklists
  - behavior change tracking
  - user-facing data quality score
  - coach language refinement and safety-copy audit
  - execution-pattern playbook drafting
  - trade comparison
  - review habit metrics
  - end-user onboarding path
- Added review-habit contracts to
  `src/lib/trader-analytics/product/types.ts`.
- Exported the new builders and types through
  `src/lib/trader-analytics/index.ts`.
- Wired `reviewHabitLoop` into
  `buildProductTraderAnalyticsViewModel(...)`.
- Added `/compare-trades` and `/onboarding`, and registered both in the
  platform route module.
- Enhanced `/analytics`, `/coach`, `/imports`, `/review`, `/progress`, and
  `/trades/[tradeId]` with the review habit loop outputs.
- Updated `/` with onboarding and compare-trades entries.
- Added focused tests in
  `src/lib/trader-analytics/__tests__/trader-review-habit-loop.test.ts`.

## Verification Results

- `npx vitest run src/lib/trader-analytics/__tests__/trader-review-habit-loop.test.ts`
  passed with 1 file / 7 tests.
- `npx vitest run src/lib/trader-analytics/__tests__` passed with 13 files /
  86 tests.
- `npx tsc --noEmit` passed.
- `npm run verify:all` passed with 81 files / 747 tests, plus the
  `levels-system`, Layer 2, and Layer 3 checkpoints.
- `npm run lint` passed with 0 errors and the same 4 pre-existing warnings.
- `npm run build` passed and produced `/compare-trades` and `/onboarding`.
- Local route smoke against the existing dev server passed for `/`,
  `/analytics`, `/coach`, `/compare-trades`, `/imports`, `/onboarding`,
  `/review`, `/progress`, `/session-recap`, and
  `/trades/trade-rapid-fire`.
