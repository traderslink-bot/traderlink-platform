# Trader Actual App QA And Visual Regression Plan

## Summary

This plan adds a deeper automated product QA layer for the rough Trader
Intelligence app.

The goal is to test the actual app like a user would use it:

- open real routes in a browser
- click through real controls
- upload and repair CSV data
- confirm visual pages are not blank or broken
- confirm important analytics claims link back to evidence
- check mobile interaction behavior
- scan core routes with an automated accessibility engine
- harden CSV import against messy real-world files
- keep product copy honest while auth, billing, persistence, broker sync, and
  market-context scoring are not live

This branch is still product QA scaffolding. It must not add:

- auth
- billing
- production persistence
- export/download controls
- candle fetching
- support/resistance calculation
- VWAP/EMA calculation
- market-structure calculation
- market-structure scoring

`levels-system` remains the owner of candles, support/resistance, and market
structure. This app may test that market context does not leak into execution
QA claims, but it should not build or depend on market context locally.

## May 9 UI QA Update

Status: completed for the current UI/user-friendliness pass.

The latest app QA run verified the corrected end-user route flow after the UI
was reorganized around:

```text
Workspace -> Import Trades -> Saved Trades -> Trade Detail -> Review Queue -> Coach -> Analytics
```

Additional QA coverage now protects:

- user-facing copy replacing internal labels such as CSV dry run, saved sqlite,
  sample fallback, market gaps, open blocks, and analysis failed.
- chart visibility on `/analytics`.
- primary action visibility on `/coach`.
- review queue lane language and "Open Trade Review" actions on `/review`.
- saved-trade triage language on `/trades`.
- trade-detail review workspace sections on `/trades/[tradeId]`.
- copy safety against trade calls, guaranteed-profit language, short-seller
  coaching positioning, and financial-advice positioning.
- mobile overflow after the new card/grid layouts.

Latest checks passed:

```powershell
npx tsc --noEmit --pretty false
npm run build
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop -g "saves a generic CSV import|shows unavailable daily/4h market context|repairs a missing-quantity"
```

## Design Decisions

### Screenshot Strategy

Do not add brittle pixel-perfect screenshot baselines yet.

The current UI is intentionally rough and will later be restyled to match the
larger website. Pixel baselines would create maintenance drag before the design
system is settled.

Instead, this branch adds screenshot-backed visual smoke:

- capture screenshots as Playwright artifacts
- assert the page is not blank
- assert the page has meaningful text density
- assert the viewport has visible content
- assert there is no page-level horizontal overflow
- assert route-specific headings and product anchors are visible

This gives practical visual regression protection without locking the temporary
rough UI into pixel snapshots.

### Accessibility Strategy

Use `@axe-core/playwright` for automated route-level accessibility smoke.

The first pass should focus on high-confidence serious issues:

- critical
- serious

This avoids turning rough styling or lower-priority warnings into noisy blockers
while still catching real accessibility failures.

### Actual App Browser Strategy

The preferred Codex in-app browser plugin requires a Node REPL tool that is not
available in this VS Code tool surface. Therefore, this branch uses the repo's
existing Playwright browser automation as the actual app test driver.

The tests still exercise the actual app:

- Next production build
- `next start`
- real browser page loads
- real clicks
- real local CSV upload buffers
- real screenshots
- real accessibility scans

## Step 1. Create The Working Plan File

Status: completed

Tasks:

- Add `src/docs/trader-actual-app-qa-and-visual-regression-plan.md`.
- Include detailed implementation steps, acceptance criteria, and verification
  commands.
- Keep the file updated as the branch progresses.

Acceptance criteria:

- Future sessions can understand exactly what this QA branch added and why.

## Step 2. Add Accessibility Tooling

Status: completed

Tasks:

- Add `@axe-core/playwright` as a development dependency.
- Use it only in Playwright tests.
- Keep axe checks scoped to critical/serious violations on core routes.
- Do not create a separate accessibility runner.

Acceptance criteria:

- `package.json` and `package-lock.json` include the accessibility test helper.
- The app can run automated accessibility smoke inside `npm run test:e2e`.

## Step 3. Add Actual App QA Playwright Suite

Status: completed

Tasks:

- Add `tests/e2e/app-actual-qa.spec.ts`.
- Keep it desktop-primary for deeper interactions.
- Add project skips so tablet/mobile/firefox only run the checks intended for
  those projects.
- Reuse the existing production `next start` Playwright config.

Acceptance criteria:

- The new suite runs as part of `npm run test:e2e`.
- The suite does not duplicate every older acceptance test, but checks new QA
  risks.

## Step 4. Visual Smoke Snapshots

Status: completed

Tasks:

- Visit:
  - `/`
  - `/first-run`
  - `/import-dry-run`
  - `/analytics`
  - `/review`
  - `/progress`
  - `/trades/trade-rapid-fire`
- For each route:
  - wait for network idle
  - assert expected heading
  - assert visible content density
  - assert screenshots have bytes and are attached to Playwright output
  - assert no app error copy
  - assert no page-level horizontal overflow

Acceptance criteria:

- Core routes produce useful screenshot artifacts.
- A blank, broken, horizontally overflowing, or app-error page fails the test.

## Step 5. Accessibility Scanner

Status: completed

Tasks:

- Run axe against:
  - `/`
  - `/first-run`
  - `/import-dry-run`
  - `/analytics`
  - `/review`
  - `/progress`
  - `/trades/trade-rapid-fire`
- Fail on critical or serious issues.
- Attach violation summaries when failures occur.

Acceptance criteria:

- Core rough-product routes have automated accessibility smoke coverage.

## Step 6. Import Workflow Stress Testing

Status: completed

Tasks:

- Exercise the actual `/import-dry-run` UI with deterministic actions:
  - change broker types
  - upload/paste multiple CSV shapes
  - edit mapping fields
  - repair rows
  - set setup/playbook tags where controls exist
  - change grouping review decisions where controls exist
- Confirm after each step:
  - page did not crash
  - import summary remains visible
  - feedback preview state is understandable
  - product truthfulness guards still pass

Acceptance criteria:

- Import UI survives realistic user tinkering without impossible states or
  runtime failure.

## Step 7. Metric-To-Evidence Tests

Status: completed

Tasks:

- On `/analytics`, verify major claims can lead to evidence:
  - filtered trade rows link to trade detail
  - drill-down or highlighted trade evidence opens the correct trade page
- On `/progress`, verify quality trend or progress source trade links open
  trade detail.
- On `/review`, verify related/focus trade links open trade detail.
- Confirm destination pages show execution replay, trade quality, and decision
  evidence.

Acceptance criteria:

- The app does not leave users with unsupported claims; key insights can be
  traced to source trades.

## Step 8. Mobile Interaction Tests

Status: completed

Tasks:

- On mobile viewport:
  - open `/import-dry-run`
  - upload a CSV with a rejected row
  - repair the row
  - confirm controls remain tappable
  - confirm feedback preview appears
  - confirm no page-level horizontal overflow
- On mobile trade detail:
  - open `/trades/trade-rapid-fire`
  - confirm replay/autopsy sections are readable
  - confirm key source links and panels do not overflow page width

Acceptance criteria:

- Mobile tests cover interaction, not just rendering.

## Step 9. Product Truthfulness Audit

Status: completed

Tasks:

- Expand route-level copy guards for:
  - export/download controls
  - raw debug data on end-user pages
  - production persistence claims
  - authenticated-user claims
  - active billing/plan-enforcement claims
  - connected broker-account claims
  - market-structure scoring/setup-validation claims
  - candle/support-resistance-backed import QA claims
- Reuse this guard throughout the new QA suite.

Acceptance criteria:

- Core routes and stress workflows fail if they begin overclaiming product
  capabilities that are not live yet.

## Step 10. Data Quality Torture Tests

Status: completed

Tasks:

- Add deterministic CSV torture cases:
  - duplicate executions
  - reversed timestamps
  - partial fills
  - short trade
  - open position
  - mixed symbols
  - fees and commissions
  - weird but parseable date formats
  - extra unknown columns
  - very small share sizes
- Run all cases through the actual upload control.
- Confirm the UI produces repair/review/feedback guidance and does not crash.

Acceptance criteria:

- The dry-run import page handles messy CSVs like a real user would bring in.

## Step 11. Actual Browser Walkthrough

Status: completed

Tasks:

- Use Playwright to run a product walkthrough:
  - home
  - first-run
  - import dry-run
  - upload/repair CSV
  - analytics
  - trade detail
  - review
  - progress
- Confirm the user can keep moving through the app.
- Confirm console/page/request failures are trapped.

Acceptance criteria:

- The route and interaction loop works as a coherent rough product.

## Step 12. Verification And Documentation

Status: completed

Tasks:

- Run:
  - focused new QA suite on desktop
  - focused new QA suite on mobile if applicable
  - `npm run test:e2e`
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm run build`
  - `npm run verify:all`
  - `npm audit`
- Update:
  - this plan
  - `README.md`
  - `src/docs/codex-project-log.md`

Acceptance criteria:

- The whole branch is verified and future sessions have a clean resume point.

## Files To Add Or Update

- Add:
  `src/docs/trader-actual-app-qa-and-visual-regression-plan.md`
- Add:
  `tests/e2e/app-actual-qa.spec.ts`
- Update:
  `package.json`
- Update:
  `package-lock.json`
- Update if needed:
  `playwright.config.ts`
- Update:
  `README.md`
- Update:
  `src/docs/codex-project-log.md`

## Verification Commands

- `npx playwright test tests/e2e/app-actual-qa.spec.ts --project=chromium-desktop`
- `npx playwright test tests/e2e/app-actual-qa.spec.ts --project=chromium-mobile`
- `npm run test:e2e`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- `npm run verify:all`
- `npm audit`

## Completion Log

- 2026-05-03: Plan created before implementation.
- 2026-05-03: Added `@axe-core/playwright` for browser accessibility smoke.
- 2026-05-03: Added `tests/e2e/app-actual-qa.spec.ts` covering screenshot
  visual smoke, axe accessibility checks, import workflow stress, metric-to-
  evidence links, mobile import repair, mobile trade autopsy, product
  truthfulness, CSV torture inputs, and a rough product walkthrough.
- 2026-05-03: The new accessibility checks found and drove real improvements:
  - raised dark-shell helper text contrast for `text-zinc-500` content inside
    dark main surfaces
  - added explicit accessible names to import dry-run controls, mapping fields,
    grouping/setup selects, row repair inputs, and CSV text/file controls
  - added explicit accessible names to analytics filter selects
- 2026-05-03: Hardened browser failure traps to ignore favicon abort noise in
  Firefox while preserving real request failure detection.
- 2026-05-03: Verification completed:
  - `npx playwright test tests/e2e/app-actual-qa.spec.ts --project=chromium-desktop`
    passed with 7 tests and 1 expected mobile-scope skip.
  - `npx playwright test tests/e2e/app-actual-qa.spec.ts --project=chromium-mobile`
    passed with 2 tests and 6 expected desktop-scope skips.
  - `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=firefox-smoke`
    passed with 1 Firefox smoke test and 7 expected project-scope skips.
  - `npm run test:e2e` passed with 48 Playwright browser tests and 71 expected
    viewport/project-scope skips.
  - `npx tsc --noEmit` passed.
  - `npm run lint` passed with 0 errors and 4 pre-existing warnings.
  - `npm run build` passed.
  - `npm run verify:all` passed with 86 Vitest files / 787 tests plus the
    levels-system, Layer 2, and Layer 3 checkpoints.
  - `npm audit` passed with 0 vulnerabilities.
