# Level Analysis Trade Detail Level Facts CI Hardening

## Purpose

Gate `journal_level_analysis_delivery_trade_detail_level_facts_ci_hardening`
makes the seeded trade-detail level facts browser proof enforceable in CI
without broadening the product behavior surface.

The gate keeps the proof offline and deterministic. It does not call IBKR, does
not fetch candles, and does not modify the levels-system repo.

## Decision

The seeded browser flow should run as a path-scoped GitHub Actions workflow
rather than inside the full default CI job.

Reason:

- the flow builds and starts the Next app, so it is heavier than unit tests
- it is only relevant when level-analysis delivery, trade-linking,
  trade-detail UI, route, test, or package files change
- path scoping keeps regular PR feedback fast while still protecting the
  persisted level-analysis-to-trade-detail path

## Workflow

Added:

`/.github/workflows/level-analysis-trade-detail-facts.yml`

The workflow runs on pull requests and `main` pushes when relevant files change:

- level-analysis API routes
- saved trade API route files
- intelligence trade detail UI files
- `src/lib/level-analysis/**`
- the focused seeded Playwright spec
- the focused Playwright config
- package manifests
- the workflow itself

The workflow:

1. checks out the repository
2. installs Node `22`
3. runs `npm ci`
4. installs Playwright Chromium and system dependencies
5. runs `npm run test:e2e:level-analysis`
6. uploads Playwright and isolated SQLite artifacts on failure

## Playwright Hardening

Updated:

`playwright.level-analysis.config.ts`

Changes:

- removed import-time deletion of the whole level-analysis artifact directory
- writes the SQLite test database under an isolated per-run artifact directory
- supports explicit `LEVEL_ANALYSIS_E2E_DB_PATH` overrides
- uses GitHub reporter output in CI while preserving the list reporter
- pins the focused browser proof to one worker
- allows one CI retry for browser/environment flake while keeping local runs
  single-attempt

## Preserved Boundaries

- no levels-system changes
- no LevelEngine changes
- no storage schema changes
- no route behavior changes
- no live candle or broker fetches
- old `LevelAnalysisSnapshot` v1 support remains covered by existing unit/API
  tests
- raw source payloads remain preserved on delivery records but are not exposed
  by the user-facing trade detail UI
- no recommendations, trade advice, coaching, grading, P/L, giveback, behavior
  scoring, buy/sell/hold decisions, or execution-quality inference

## Validation

Focused commands:

```bash
npm run test:e2e:level-analysis
npx tsc --noEmit --pretty false
```

The workflow itself uses the same `npm run test:e2e:level-analysis` command
after installing Playwright Chromium.

## Next Gate

No broader implementation gate is required for this branch.

The next useful step is operational: open the PR, confirm the new path-scoped
workflow runs on GitHub, and keep any future failures limited to CI/test
hardening unless they expose an actual trade-detail level facts regression.
