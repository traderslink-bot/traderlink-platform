# Trader Intelligence v2 Port Handoff - 2026-06-11

## Branch

- Working branch: `codex/port-v2-candle-analytics-main`
- Repo: `C:\Users\jerac\Documents\TraderLink\trader-intelligence-v2-main-merge`
- Status at handoff: clean worktree after the handoff documentation commit

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

Known build warnings remain the existing Turbopack broad dynamic-file-pattern warnings in academy/news stores.

## Known Separate Failure

The following focused calibration test currently fails and should be handled as a separate calibration task:

```text
npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=verbose
```

Observed result:

- expected `failCount: 0`
- actual `failCount: 3`

This is separate from the UI tier-gating work. The tier route matrix, focused import/tier tests, build, and app regression passed.

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

Fix or formally triage the decision-review quality dashboard calibration failure, then prepare a review/PR that highlights the tier-boundary commits separately from the broader levels-system-v2 and vendor cleanup history.
