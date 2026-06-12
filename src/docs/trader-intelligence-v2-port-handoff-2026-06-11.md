# Trader Intelligence v2 Port Handoff - 2026-06-11

## Branch

- Working branch: `codex/port-v2-candle-analytics-main`
- Repo: `C:\Users\jerac\Documents\TraderLink\trader-intelligence-v2-main-merge`
- Status at handoff: clean worktree after the calibration documentation commit

## Non-Negotiables

- Use `levels-system-v2/support-resistance-engine` only.
- Do not restore, import, or depend on old `levels-system` v1 / phase1.
- Preserve the newer `/intelligence` route namespace.
- Preserve journal-level-analysis work.
- Free tier is execution-only.
- Paid chart-context tier is executions plus real candle/chart/level evidence.
- Do not make candle, chart, support, or resistance claims without saved evidence.
- Do not deploy from this repo.

## Recent Tier Boundary Commits

- `808fccea` Make Intelligence overview tier aware
- `2631be20` Gate ticker story chart evidence by tier
- `5ad0e790` Gate coach ticker story chart metrics by tier
- `79088f57` Gate progress chart metrics by tier
- `86dadf8c` Make trade detail review copy tier aware
- `7bae7e2d` Gate import chart review flows by tier
- `eb4a244b` Gate import dry run chart review by tier
- `a13de83e` Calibrate decision review resistance scenarios

## What This Branch Now Enforces

- Free execution-only mode keeps chart evidence, candle movement, support/resistance, volume evidence, chart-review controls, and chart-hydration promises out of the user-facing flow.
- Paid chart-context mode keeps those surfaces available when the active tier and saved evidence allow them.
- Upload and advanced import tools are dynamic routes so runtime tier configuration is honored.
- Upload no longer auto-starts chart review in free mode.
- Import detail and import dry-run hide chart-review diagnostics and resume controls in free mode.
- Trade detail, progress, coach ticker stories, ticker story direct pages, overview, analytics, and import entry points now have tier-aware copy or route coverage.

## Verification Passed

- `npx tsc --noEmit --pretty false`
- `npx vitest run src/lib/trader-analytics/__tests__/tier-config.test.ts src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts --reporter=dot`
- `npm run build`
- `TRADER_INTELLIGENCE_TIER=free_execution npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
- `TRADER_INTELLIGENCE_TIER=chart_context npx playwright test tests/e2e/tier-chart-evidence.spec.ts --project=chromium-desktop --reporter=dot`
- `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop --reporter=dot`
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=verbose`
- `npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot`
- `npm run verify:levels-system -- --reporter=dot`

Known build warnings remain the existing Turbopack broad dynamic-file-pattern warnings in academy/news stores.

## Resolved Calibration Follow-Up

The focused decision-review quality dashboard failure has been resolved by `a13de83e`.

The prior `failCount: 3` was caused by stale synthetic CSV prices in the three
major-resistance scenarios. The current levels-system-v2 fixture exposes major
overhead resistance at `1.3100`; the scenario first entries now use `1.3097`,
so the expected `distanceToResistance=0.02%` and
`nearestResistanceStrength=major` claims are backed by the v2 relation facts.
No product logic was loosened.

## Port Guidance

Do not blindly merge `codex/trader-ui-product-pass` or this branch into `main`.

Port deliberately:

1. Preserve `/intelligence` route structure.
2. Preserve journal-level-analysis files and behavior.
3. Port shared v2 candle/levels/coaching/analytics behavior first.
4. Port UI second, adapted to main's current route shape.
5. Keep free-tier execution-only copy separate from paid chart-context copy.
6. Re-run the tier matrix in both tiers after every route-surface port.

## Best Next Step

Prepare a review/PR that highlights the tier-boundary commits, the resolved
synthetic calibration follow-up, and the broader levels-system-v2 and vendor
cleanup history as separate review threads.
