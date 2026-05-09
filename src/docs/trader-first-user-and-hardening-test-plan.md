# Trader First-User And Hardening Test Plan

## Summary

This plan adds the next automated product-hardening layer after the current
feature-regression and acceptance suites.

The current app is well tested with sample saved trades. The next risk is a
brand-new user who has not imported anything yet. The app must not feel broken
when there are no saved trades, no reports, no review history, and no connected
broker.

This branch should also add broader app safety tests:

- first-user / no-trades experience
- first import journey
- internal link crawl
- accessibility smoke
- cross-browser smoke
- performance smoke
- CSV abuse cases
- product truthfulness guards

This branch remains product-test scaffolding:

- no auth
- no billing
- no production database
- no real broker credentials
- no export/download features
- no candle fetching in this repo
- no support/resistance or market-structure building in this repo

## Important Design Decision

The existing saved analytics view model intentionally requires at least one
saved report. Instead of faking a full empty analytics report and weakening that
contract, this branch adds a dedicated first-run route that represents the
pre-import product state.

The first-run route explains what a new user can do before saved analytics
exist, then routes them into `/import-dry-run`. Existing sample-backed pages
stay sample-backed until real persistence exists.

## Step 1. Create The Working Plan File

Status: completed

Tasks:

- Add `src/docs/trader-first-user-and-hardening-test-plan.md`.
- Include detailed steps, decisions, acceptance criteria, files to touch, and
  verification commands.
- Update this plan as work progresses.

Acceptance criteria:

- The file becomes the working tracker for this branch.

## Step 2. Add A First-Run Empty-State Route

Status: completed

Tasks:

- Add `/first-run`.
- Present the first-user state clearly:
  - no saved trades yet
  - no analytics report yet
  - no review history yet
  - no broker connection yet
  - no market-context scoring yet
- Provide practical next actions:
  - open CSV dry run
  - review supported broker formats
  - map/repair a CSV
  - preview execution-only feedback
- Keep the wording product-facing and not debug-style.
- Link the route from `/`.

Acceptance criteria:

- A brand-new user has a useful starting page that does not pretend saved data
  exists.
- The route does not call `levels-system`, fetch candles, or create reports.

## Step 3. First Import Journey Test

Status: completed

Tasks:

- Start at `/first-run`.
- Click into `/import-dry-run`.
- Upload a synthetic CSV.
- Repair or map if needed.
- Confirm trade grouping and feedback preview appear.
- Confirm the app says persistence comes later.

Acceptance criteria:

- The browser test proves a no-data user can reach useful feedback preview
  without saved trades.

## Step 4. No-Trades / Empty-State Boundary Test

Status: completed

Tasks:

- Open `/first-run`.
- Assert the first-user copy is visible.
- Assert no saved analytics/report/review claims appear.
- Open a definitely missing trade route.
- Assert it shows the framework 404 state rather than crashing.
- Confirm the user has a path back to import from the first-run surface.

Acceptance criteria:

- The no-data state is explicit and honest.
- Missing trade detail routes fail safely.

## Step 5. Internal Link Crawler

Status: completed

Tasks:

- From `/`, collect same-origin internal links that are visible in the rendered
  home route.
- Visit each unique link once.
- Fail on:
  - app error copy
  - 404 copy
  - HTTP status `>= 400`
  - browser runtime errors
- Include `/first-run` in the route set.

Acceptance criteria:

- Home navigation cannot silently point users to broken pages.

## Step 6. Accessibility Smoke

Status: completed

Tasks:

- Check important interactive controls have accessible names:
  - home navigation links
  - CSV dry-run sample select
  - broker select
  - timezone input
  - local CSV input
  - CSV textarea
  - analytics filters
  - mapping fields
- Check keyboard Tab navigation reaches import controls.
- Check key form controls are not disabled when the workflow expects them to be
  usable.

Acceptance criteria:

- The rough product UI remains basic-keyboard and label usable.

## Step 7. Cross-Browser Smoke

Status: completed

Tasks:

- Add Playwright Firefox smoke coverage if the browser can be installed and run
  locally.
- Keep the cross-browser project narrow so test time does not explode.
- Smoke the most important routes:
  - `/`
  - `/first-run`
  - `/import-dry-run`
  - `/analytics`
  - `/trades/trade-rapid-fire`

Acceptance criteria:

- Chromium remains the full test browser.
- Firefox proves basic route rendering where available.
- If Firefox cannot run in this environment, document the blocker and keep the
  plan honest.

## Step 8. Performance Smoke

Status: completed

Tasks:

- Measure load time with Playwright around key routes:
  - `/`
  - `/first-run`
  - `/analytics`
  - `/import-dry-run`
  - `/trades/trade-rapid-fire`
- Keep thresholds local and generous enough to avoid flaky failures.
- Use this as a smoke guard against accidental multi-second regressions, not a
  final production performance budget.

Acceptance criteria:

- Core rough-product routes load within the local smoke threshold.

## Step 9. CSV Abuse Tests

Status: completed

Tasks:

- Test CSV inputs through `/import-dry-run` for:
  - blank CSV
  - header-only CSV
  - wrong delimiter
  - duplicated headers
  - bad numeric formats
  - huge synthetic CSV
  - mixed stock/options-like rows where supported by current parser behavior
- Confirm the app shows review/repair guidance instead of crashing.
- Confirm no market-data or candle work is triggered.

Acceptance criteria:

- Bad CSVs produce usable dry-run feedback, not runtime failure.

## Step 10. Product Truthfulness Guards

Status: completed

Tasks:

- Scan key routes for overclaims:
  - `/`
  - `/first-run`
  - `/import-dry-run`
  - `/analytics`
  - `/review`
  - `/progress`
  - `/trades/trade-rapid-fire`
- Block claims that imply:
  - real saved user data exists before persistence
  - auth is live
  - billing is live
  - a broker is connected
  - export/download is available to end users
  - market structure is used for scoring or setup validation

Acceptance criteria:

- Product copy stays honest while the app is still fixture/in-memory.

## Step 11. Verification And Documentation

Status: completed

Tasks:

- Run:
  - `npm run test:e2e`
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm run verify:all`
  - `npm audit`
- Update:
  - this plan
  - `README.md`
  - `src/docs/codex-project-log.md`

Acceptance criteria:

- The branch is fully verified and future sessions can resume cleanly.

## Files To Add Or Update

- Add:
  `src/docs/trader-first-user-and-hardening-test-plan.md`
- Add:
  `app/first-run/page.tsx`
- Add:
  `tests/e2e/app-first-user-hardening.spec.ts`
- Update:
  `app/page.tsx`
- Update if needed:
  `playwright.config.ts`
- Update:
  `README.md`
- Update:
  `src/docs/codex-project-log.md`

## Verification Commands

- `npm run test:e2e`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run verify:all`
- `npm audit`

## Completion Log

- 2026-05-03: Plan created before implementation.
- 2026-05-03: Added `/first-run` as the honest no-saved-trades starting
  surface and linked it from `/`.
- 2026-05-03: Added `tests/e2e/app-first-user-hardening.spec.ts` covering the
  first import journey, no-trades boundary, internal link crawling,
  accessibility smoke, Firefox route smoke, local performance smoke, CSV abuse
  inputs, and product truthfulness guards.
- 2026-05-03: Added the narrow `firefox-smoke` Playwright project and installed
  the local Firefox browser used by the smoke route test.
- 2026-05-03: Verification completed:
  - `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop`
    passed with 7 tests and 1 expected project-scope skip.
  - `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=firefox-smoke`
    passed with 1 Firefox smoke test and 7 expected project-scope skips.
  - `npm run test:e2e` passed with 39 Playwright tests and 56 expected
    viewport/project-scope skips.
  - `npx tsc --noEmit` passed.
  - `npm run lint` passed with 0 errors and 4 pre-existing warnings.
  - `npm run build` passed and prerendered `/first-run`.
  - `npm run verify:all` passed with 86 Vitest files / 787 tests plus the
    levels-system, Layer 2, and Layer 3 checkpoints.
  - `npm audit` passed with 0 vulnerabilities.
