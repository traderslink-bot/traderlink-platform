# Trader App Feature Regression QA Plan

## Summary

This plan expands Playwright from a single `/import-dry-run` browser harness
into a broader app-feature regression suite for the trader improvement product.

The goal is not final UI polish. The goal is to prove the rough product app
actually renders, navigates, updates, and protects key product boundaries:

- end-user routes load
- core feature panels are visible
- the import workflow can parse and repair representative CSVs
- analytics, review, progress, and trade detail pages expose the expected
  product surfaces
- browser console errors, hydration errors, failed requests, and layout overflow
  are caught automatically
- market context remains observational and does not leak into import QA,
  execution-only scoring, rule recommendations, or final coaching conclusions

This branch remains fixture-only and execution-first:

- no auth
- no billing
- no production persistence
- no broker credentials
- no real saved trades required
- no export/download product affordances
- no local candle/support/resistance/market-structure logic

## May 9 UI/User-Friendliness Regression Update

Status: completed

The app UI correction pass added regression coverage for the new user-facing
workflow:

```text
/workspace -> /import-dry-run -> /imports -> /trades -> /review -> /coach -> /analytics
```

New/updated assertions protect:

- `/workspace` as the app home with import, next trade review, analytics, and
  coach actions.
- `/analytics` as a chart-first report surface with visible P/L, win/loss,
  session, entry-hour, and execution-habit charts.
- `/coach` as a plain review plan with a primary action, avoid/repeat/review
  cards, and evidence-backed language.
- `/review` as a saved work queue with clearer queue lanes and "Open Trade
  Review" actions.
- `/trades` and `/trades/[tradeId]` as saved-trade and per-trade review
  workspaces instead of internal status dashboards.
- Copy safety for core routes, including banned product phrases such as trade
  calls, guaranteed profits, short-seller coaching, and financial-advice
  positioning.
- Mobile overflow across the core product routes after the new card grids and
  primary action panels.

Latest verification:

```powershell
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"
```

Both passed after the UI/copy updates.

## Current Decisions

- Use Playwright Chromium because it is already installed and verified.
- Run against `npm run build` plus `next start` through the existing
  Playwright config so stale `next dev` state cannot make false failures.
- Keep route assertions focused on stable product labels and headings rather
  than final visual styling.
- Treat desktop, tablet, and mobile as real product targets.
- Use synthetic CSV fixtures for broker import behavior until real anonymized
  broker files exist.
- Test market-context boundaries through visible product copy and page text,
  not by adding any candle/structure calculations in this repo.

## Step 1. Full App Route Smoke Test

Status: completed

Goal:

Prove the main end-user product routes render successfully.

Routes:

- `/`
- `/analytics`
- `/imports`
- `/import-dry-run`
- `/review`
- `/progress`
- `/trades/trade-rapid-fire`
- `/coach`
- `/session-recap`
- `/import-health`
- `/import-trials`
- `/repair-wizard`
- `/review-cockpit`
- `/calibration`
- `/compare-trades`
- `/onboarding`
- `/account`
- `/platform-readiness`

Detailed tasks:

- Add a route registry inside the Playwright spec.
- For each route, navigate to the path.
- Assert the expected H1 or major heading is visible.
- Assert the page body is not blank.
- Assert the page does not show framework error text.
- Assert no unsafe end-user surface labels appear.

Acceptance criteria:

- Every listed route passes in Chromium.
- Failures name the route and missing heading clearly.

## Step 2. Console Error Trap

Status: completed

Goal:

Fail browser tests when the app emits real runtime breakage.

Detailed tasks:

- Attach listeners for:
  - `console.error`
  - uncaught `pageerror`
  - failed network requests
  - HTTP responses with status `>= 400`
- Ignore harmless browser-level noise only if necessary.
- Assert no collected problem exists at the end of each feature test.

Acceptance criteria:

- Hydration errors, missing chunks, failed route requests, and runtime
  exceptions fail the test.

## Step 3. Broker Import Feature Tests

Status: completed

Goal:

Exercise broker CSV import behavior through the real UI.

Broker fixtures:

- IBKR
- Webull
- Robinhood
- Moomoo
- Schwab
- generic CSV

Detailed tasks:

- Use synthetic CSV text, not real customer data.
- Upload each fixture through the local CSV input.
- Select the matching broker format in the UI.
- Assert rows/trades update.
- Assert feedback preview or repair guidance appears.
- Assert no raw/debug/export/download surface appears.

Acceptance criteria:

- Each broker fixture reaches a visible dry-run state.
- Generic CSV reaches a grouped trade and feedback preview.

## Step 4. Import Repair User Journey

Status: completed

Goal:

Prove common repair cases are visible and actionable in the UI.

Repair cases:

- missing quantity
- missing timestamp
- unknown headers
- skipped cancelled order
- open position
- duplicate fill
- bad broker mapping

Detailed tasks:

- Drive the existing `/import-dry-run` controls.
- For missing quantity, edit the repair cell and assert the row becomes
  accepted.
- For unknown headers, assert the column mapping assistant reports blocked or
  mapping-needed state.
- For skipped/cancelled/open/duplicate cases, assert the relevant review,
  anomaly, queue, or lifecycle copy appears.

Acceptance criteria:

- At least one repair case is corrected through the UI.
- The remaining repair cases prove the expected review states are displayed.

## Step 5. Analytics Page Product Test

Status: completed

Goal:

Prove `/analytics` displays the core trader improvement product surfaces.

Expected surfaces:

- daily coach report
- mistake frequency / mistake observations
- quality trend
- best/worst patterns
- review queue
- behavior visuals
- rule or recommendation surfaces

Acceptance criteria:

- `/analytics` shows the major panels that make the app useful as a trader
  improvement product.
- The page does not make market-context scoring claims.

## Step 6. Trade Detail Autopsy Test

Status: completed

Goal:

Prove `/trades/trade-rapid-fire` shows the per-trade autopsy experience.

Expected surfaces:

- execution replay
- trade quality score
- top mistake / risk evidence
- top strength evidence
- position timeline / decision timeline
- observational market-context boundary when context appears

Acceptance criteria:

- A trader can open a trade detail page and see execution-centered feedback.
- Market structure, if visible, remains observational/debug/supporting.

## Step 7. Review Workflow Test

Status: completed

Goal:

Prove `/review` exposes the guided review workflow.

Expected surfaces:

- coach report or rule focus
- checklist/review actions
- related trades
- guided next step
- no persistence overclaim

Acceptance criteria:

- The review route gives the user a clear review path without claiming saved
  production state.

## Step 8. Progress Page Test

Status: completed

Goal:

Prove `/progress` exposes behavior change and score trend surfaces.

Expected surfaces:

- quality score trend
- mistake reduction
- rule effectiveness
- behavior visuals
- progress links to trades where available

Acceptance criteria:

- The progress route contains trend/progress surfaces and no export/download
  affordance.

## Step 9. Mobile Regression Suite

Status: completed

Goal:

Catch mobile layout breakage on the highest-value end-user flows.

Mobile routes:

- `/import-dry-run`
- `/analytics`
- `/trades/trade-rapid-fire`
- `/review`
- `/progress`

Detailed tasks:

- Run these routes under the configured mobile project.
- Assert key headings still render.
- Assert there is no page-level horizontal overflow.
- Assert key controls remain visible where practical.

Acceptance criteria:

- Mobile route smoke passes without horizontal page overflow.

## Step 10. Visual Baseline Screenshots

Status: completed

Goal:

Capture screenshot artifacts that make blank pages, collapsed layouts, or
missing panels easy to inspect.

Routes:

- `/analytics`
- `/trades/trade-rapid-fire`
- `/review`
- `/progress`
- `/import-dry-run`

Detailed tasks:

- Capture viewport screenshots in the Playwright report attachments.
- Do not introduce strict pixel snapshots yet.
- Assert screenshot buffers are non-empty.

Acceptance criteria:

- Playwright attaches screenshot artifacts for the core product routes.

## Step 11. No-Market-Context Leakage Test

Status: completed

Goal:

Protect the core rule that execution-only product surfaces cannot silently use
or overclaim market structure.

Detailed tasks:

- Check `/import-dry-run`, `/analytics`, `/review`, `/progress`, and
  `/trades/trade-rapid-fire`.
- Assert the pages do not include claims such as:
  - market-validated setup
  - market structure used for scoring
  - market structure used for grade
  - candle-confirmed rule
  - support/resistance-backed import
- Allow observational/calibration copy when it is clearly labeled.

Acceptance criteria:

- Browser tests fail if market context starts being presented as final scoring,
  final coaching, import QA, or rule pass/fail evidence.

## Step 12. End-To-End Demo User Path

Status: completed

Goal:

Prove a demo user can move through the product without dead ends.

Path:

1. Start at `/`.
2. Open `/import-dry-run`.
3. Upload a CSV.
4. Repair a row.
5. Preview feedback.
6. Open `/analytics`.
7. Open `/trades/trade-rapid-fire`.
8. Open `/review`.
9. Open `/progress`.

Acceptance criteria:

- The path completes without browser errors.
- The path touches the import, analytics, trade detail, review, and progress
  loops.

## Files To Add Or Update

- Add this plan:
  `src/docs/trader-app-feature-regression-qa-plan.md`
- Add:
  `tests/e2e/app-feature-regression.spec.ts`
- Update if needed:
  `tests/e2e/import-dry-run.spec.ts`
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
- 2026-05-03: Implemented `tests/e2e/app-feature-regression.spec.ts` with
  app-wide route smoke coverage, browser console/runtime failure traps,
  representative broker CSV uploads, repair journeys, product-surface checks
  for analytics/trade detail/review/progress, mobile overflow checks, visual
  screenshot smoke attachments, market-context overclaim guards, and an
  end-to-end demo path.
- 2026-05-03: Fixed a real `/analytics` mobile layout overflow by allowing the
  trade-table grid/card containers to shrink and scroll internally instead of
  widening the full page.
- 2026-05-03: Verification completed:
  - `npm run test:e2e` passed with 24 Playwright tests and 18 intentional
    viewport-scope skips.
  - `npx tsc --noEmit` passed.
  - `npm run lint` passed with 0 errors and 4 pre-existing warnings.
  - `npm run verify:all` passed with 86 Vitest files / 787 tests plus
    levels-system, Layer 2, and Layer 3 checkpoints.
  - `npm audit` passed with 0 vulnerabilities.
