# Trader Intelligence v2 Deliberate Port Review Summary - 2026-06-12

## Branch

- Working branch: `codex/port-v2-candle-analytics-main`
- Source branch reviewed: `codex/trader-ui-product-pass`
- Current base: merged through `origin/main` at PR-readiness time on
  2026-06-12.
- Direct merge decision: rejected. Use manual porting only.

## Scope Accepted

- Saved review queue priority cutoff changed from `75` to `90` so the default
  highest-priority lane stays focused on urgent chart-data gaps and high-loss
  chart-risk items.
- Synthetic resistance calibration fixed for current levels-system-v2 fixture
  levels.
- Saved import Playwright route check stabilized:
  - generated QA ticker no longer matches the intentional `E2E########`
    synthetic customer-data filter,
  - test follows the import detail page's own "Open trade review" link.
- Documentation added for the deliberate port plan, reviewed source slices, and
  final verification package.
- Current `origin/main` journal-level-analysis CI hardening and seeded
  trade-detail level-facts Playwright flow merged into the branch.
- Merged level-analysis Playwright flow adapted from root routes to the current
  `/intelligence` namespace.

## Scope Rejected

- Root-route rewrites from `/intelligence/*` to `/coach`, `/review`,
  `/analytics`, `/trades`, `/imports`, `/upload-csv`, or `/import-dry-run`.
- Any deletion of journal-level-analysis API routes, docs, contracts, fixtures,
  tests, or UI facts.
- Any support/resistance hunk that restores `levels-system-phase1` or old
  `levels-system` v1 semantics.
- Shared levels-system source diffs that remove v2 evidence fields including
  importance, freshness, extension/synthetic-extension flags, or zone width.
- Source branch downgrades from "open or swing trade" behavior to "open trade"
  only.
- Source branch import grouping changes that remove generic/auto
  sell-starting-trade support.
- Test-only diffs tied to rejected root routes, journal-level-analysis deletes,
  or phase1 levels-system adapter behavior.

## Preserved Requirements

- `levels-system-v2/support-resistance-engine` remains the only support/
  resistance engine import target.
- `/intelligence` remains the Trader Intelligence route namespace.
- Journal-level-analysis work remains in place.
- Free tier remains execution-only.
- Paid chart-context tier may use candle, chart, and level evidence only when
  saved chart-review snapshots or other real chart evidence exist.
- Queued, failed, missing, or basis-unsafe chart data stays execution-only or
  chart-data-needs-review.

## Verification

- `npx tsc --noEmit --pretty false` passed.
- `npm run verify:levels-system -- --reporter=dot` passed: 21 files, 83 tests.
- Focused trader analytics/import/coach Vitest groups passed: 11 files, 101
  tests.
- `npm run build` passed. Existing Turbopack warnings remain for broad
  academy/news file tracing.
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop`
  passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop`
  passed: 1 passed, 1 skipped.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`
  passed: 14 tests.
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop`
  passed: 16 passed, 1 skipped.
- After merging current `origin/main`, the post-merge verification also passed:
  - `npx tsc --noEmit --pretty false`,
  - `npm run verify:levels-system -- --reporter=dot`,
  - focused trader analytics/import/coach Vitest groups,
  - `npx playwright test --config=playwright.level-analysis.config.ts`,
  - free and paid `tier-chart-evidence` Playwright checks,
  - `import-dry-run` desktop Playwright,
  - `app-feature-regression` desktop Playwright.

## Residual Risk

- The source branch still contains UI ideas that may be useful, but they must be
  manually adapted into `/intelligence` route files after checking that the
  target branch does not already contain the behavior.
- The build still reports existing Turbopack broad-file-tracing warnings in
  academy/news stores; this is not new to the port package.
- The first post-merge `npm run test:e2e:level-analysis` attempt built
  successfully but could not start because an old local node process occupied
  port 3101; after clearing that process, the Playwright portion passed.
- This branch is not the production repo and must not be deployed directly.

## Recommended PR Notes

- Lead with the v2-only evidence boundary: free tier execution-only, paid tier
  chart-context only with real saved evidence.
- Call out that direct merge from `codex/trader-ui-product-pass` was avoided
  because it conflicts with `/intelligence`, journal-level-analysis, and
  levels-system-v2 requirements.
- Ask reviewers to focus on:
  - saved review priority behavior,
  - tier/evidence route claims,
  - import detail to trade detail link behavior,
  - levels-system-v2-only imports and v2 evidence fields.

## Next Step

- Open a review/PR from `codex/port-v2-candle-analytics-main` after confirming
  the intended target branch. Future product-pass UI work should be a manual
  `/intelligence` port, not a direct merge.
