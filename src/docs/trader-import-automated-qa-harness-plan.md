# Trader Import Automated QA Harness Plan

## Summary

This branch adds automated QA around the `/import-dry-run` import product flow.
The goal is to stress the import parser, dry-run view models, route contracts,
copy safety, and rough visual surface without needing real user CSV files yet.

This remains fixture-only and execution-only:

- no real broker credentials
- no real saved trades
- no production persistence
- no end-user data export/download features
- no local candle, support/resistance, or market-structure work

2026-05-03 update:

Playwright has now been intentionally added as the browser-backed E2E layer for
this workflow. The existing screenshot-ready visual contract is now connected to
real Chromium desktop, tablet, and mobile smoke tests against a production build.

## Step 1. CSV Mutation Test Harness

Status: complete

Goal:

Automatically create broken variants of representative broker CSV fixtures and
prove the app detects, explains, and queues the right repair actions.

Detailed tasks:

- Add a deterministic mutation harness near the current dry-run workflow code.
- Mutate existing sample presets into cases such as:
  - missing symbol
  - missing price
  - renamed unknown headers
  - blank rows
  - extra account/activity rows
  - cancelled orders
  - duplicated fills
  - open positions
  - weird timestamp formats
- For each mutation, run `buildCsvDryRunImportExperience`.
- Assert expected outcomes:
  - accepted execution count
  - rejected/skipped rows
  - readiness status
  - repair queue lane
  - anomaly type
  - learning urgency

Acceptance criteria:

- Mutation cases are generated from current fixtures.
- Each mutation has stable expected outcome checks.
- No live market data or external broker files are required.

## Step 2. Broker Format Regression Matrix

Status: complete

Goal:

Protect known broker import formats as the parser and product views evolve.

Detailed tasks:

- Build a table-driven matrix for:
  - IBKR
  - Webull
  - Robinhood
  - Moomoo
  - Schwab
  - generic CSV
- Track:
  - accepted execution count
  - rejected row count
  - skipped row count
  - grouped trade count
  - readiness status
  - broker support confidence
  - expected warning/error codes
- Add tests that compare actual dry-run results against the matrix.

Acceptance criteria:

- Every supported broker preset is covered.
- Regression failures point to the broker/preset and count that changed.

## Step 3. Import Flow Route Smoke Tests

Status: complete

Goal:

Catch route-level breakage and unsafe surface regressions.

Detailed tasks:

- Add an import dry-run route smoke contract.
- Verify the route source contains required product panels:
  - import session summary
  - readiness breakdown
  - repair impact
  - row repair table
  - grouping review
  - feedback preview
  - replay preview
  - P/L reconciliation
  - review queue preview
  - broker mapping learning
  - anomaly detector
  - setup tagging
  - privacy/safety copy
- Verify unsafe surface labels remain absent:
  - raw JSON
  - debug JSON
  - export button
  - download report
  - guaranteed/certified broker support

Acceptance criteria:

- Route source smoke test fails if a required panel disappears.
- Route source smoke test fails if banned product surface copy appears.

## Step 4. Repair Impact Simulation Tests

Status: complete

Goal:

Prove the automated harness can simulate a user repairing a bad CSV row.

Detailed tasks:

- Start from the missing-symbol fixture.
- Build a baseline dry-run experience.
- Apply `applyCsvDryRunCellEdit`.
- Rebuild the experience with `repairImpactBaseline`.
- Assert:
  - rejected rows decrease
  - accepted executions increase
  - confidence score improves or stays bounded
  - review queue changes
  - row repair table reflects the corrected row

Acceptance criteria:

- Simulation is deterministic.
- The test does not require a browser.

## Step 5. No-Market-Context Guard Tests

Status: complete

Goal:

Prove import QA remains independent from `levels-system` market context.

Detailed tasks:

- Assert these models report no market-context usage:
  - execution feedback preview
  - feedback comparison
  - anomaly detector
  - setup tagging
  - import session summary/readiness/review queue by contract
- Assert no candle/support/resistance terms appear in import QA reasons where
  they would imply chart analysis.
- Keep setup tags as user labels only.

Acceptance criteria:

- Tests fail if market context starts affecting import QA conclusions.

## Step 6. End-To-End Dry-Run Workflow Test

Status: complete

Goal:

Simulate the rough user path without a browser.

Detailed tasks:

- Use the unknown-header sample to prove mapping repair works.
- Use the missing-symbol sample to prove row repair works.
- Pass setup tag selections and grouping decisions through the dry-run builder.
- Assert the decision capture model includes:
  - confirmed mapping
  - edited row / repaired state
  - confirmed grouping
  - approved feedback preview
  - selected setup tag
- Assert the import summary reaches the expected ready/review state.

Acceptance criteria:

- The workflow test represents how the future UI state can be saved later.
- No persistence is implemented.

## Step 7. Copy Safety Audit Expansion

Status: complete

Goal:

Automatically protect product copy from unsafe claims.

Detailed tasks:

- Expand dry-run copy safety tests for:
  - guaranteed broker support
  - certified import support
  - final analysis claims
  - saved/imported claims in dry-run state
  - raw/debug JSON
  - export/download controls
  - market-structure overclaims
- Reuse `buildProductCopyQualitySystem` where practical.
- Add explicit route-source checks for banned button/control copy.

Acceptance criteria:

- Unsafe import copy examples fail the audit.
- Current route copy passes product-safety checks.

## Step 8. Visual Regression Screenshot-Ready Contract

Status: complete, now backed by Playwright

Goal:

Prepare the route for future automated screenshots without adding a new browser
test dependency now.

Detailed tasks:

- Add a `CsvDryRunVisualRegressionContract` model.
- Include viewports:
  - desktop
  - tablet
  - mobile
- Include required panel labels and expected layout notes.
- Include screenshot target route `/import-dry-run`.
- Add tests proving every required panel label exists in the route source.
- Add tests proving the contract has no raw/export/debug surface.

Acceptance criteria:

- Contract can later drive Playwright screenshots.
- Current tests already catch missing panel labels.

## Step 9. Playwright Browser E2E Harness

Status: complete

Goal:

Turn the screenshot-ready visual contract into a repeatable browser test that
proves `/import-dry-run` works in a real rendered app surface.

Detailed tasks:

- Add `@playwright/test` as a dev dependency.
- Install the Chromium browser runtime locally.
- Add `playwright.config.ts`.
- Run E2E against a production build with `next start` on isolated port `3100`
  instead of relying on any already-running dev server.
- Add browser tests for:
  - required import product panels
  - banned unsafe product surfaces
  - local CSV file input
  - row repair from rejected to accepted
  - setup/playbook tag selection
  - feedback preview reviewed checkbox
  - desktop/tablet/mobile screenshot smoke targets
  - page-level horizontal overflow guard
- Add stable `data-testid` hooks only to controls that the E2E tests interact
  with.
- Keep all assertions execution/import-only; market context is not used.

Acceptance criteria:

- `npm run test:e2e` builds the app, starts `next start`, and passes the
  Chromium desktop/tablet/mobile suite.
- Screenshots and traces are written only under ignored `/artifacts` output.
- The route remains free of raw JSON, debug JSON, export/download, guaranteed
  broker support, and market-validated setup claims.

## Files To Add Or Update

- Add this plan file:
  `src/docs/trader-import-automated-qa-harness-plan.md`
- Add:
  `src/lib/trader-analytics/product/csv-dry-run-automated-qa.ts`
- Update:
  `src/lib/trader-analytics/index.ts`
- Add tests:
  `src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts`
- Add:
  `playwright.config.ts`
- Add:
  `tests/e2e/import-dry-run.spec.ts`
- Update:
  `app/import-dry-run/import-dry-run-client.tsx`
- Update:
  `package.json`
- Update:
  `README.md`
- Update:
  `src/docs/codex-project-log.md`

## Verification Plan

- `npx vitest run src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts`
- `npx vitest run src/lib/trader-analytics/__tests__`
- `npm run test:e2e`
- `npx tsc --noEmit`
- `npm run verify:all`
- `npm run lint`
- `npm run build`
- Smoke-test `/import-dry-run` when a dev server is already running.

## Completion Log

- 2026-05-03: Plan created. Implementation in progress.
- 2026-05-03: Completed the automated import QA harness branch.
  - Added `src/lib/trader-analytics/product/csv-dry-run-automated-qa.ts`.
  - Added deterministic CSV mutation cases for missing symbols, missing prices,
    renamed headers, blank rows, account activity rows, cancelled orders,
    duplicated fills, open positions, and weird timestamps.
  - Added broker regression matrix coverage for IBKR, Webull, Robinhood,
    Moomoo, Schwab, and generic CSV.
  - Added repair impact simulation around `applyCsvDryRunCellEdit`.
  - Added no-market-context guard checks for import QA, feedback preview,
    anomaly detection, and setup tags.
  - Added end-to-end dry-run workflow simulation for mapping repair, row repair,
    setup tagging, decision capture, and feedback preview.
  - Added route smoke and banned-surface contracts for `/import-dry-run`.
  - Added copy safety audit expansion for guaranteed/certified/raw/export
    claims.
  - Added screenshot-ready visual regression contract for desktop, tablet, and
    mobile targets without adding a browser test dependency.
  - Added focused tests in
    `src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts`.
  - Verification passed:
    - `npx vitest run src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts`
      passed with 1 file / 8 tests.
    - `npx vitest run src/lib/trader-analytics/__tests__` passed with 18
      files / 126 tests.
    - `npx tsc --noEmit` passed.
    - `npm run verify:all` passed with 86 files / 787 tests plus shared-engine,
      Layer 2, and Layer 3 checkpoints.
    - `npm run lint` passed with 0 errors and 4 pre-existing warnings.
    - `npm run build` passed and produced `/import-dry-run`.
    - Existing dev server smoke at `http://localhost:3000/import-dry-run`
      returned 200 and included the core import intelligence panels.
- 2026-05-03: Completed the Playwright browser E2E upgrade.
  - Added `@playwright/test` and installed Chromium.
  - Added `playwright.config.ts`.
  - Added `tests/e2e/import-dry-run.spec.ts`.
  - Added stable E2E hooks to `/import-dry-run`.
  - Updated the visual regression contract from `not_installed` to
    `playwright_chromium`.
  - The E2E suite now validates required panels, banned unsafe surfaces, local
    CSV file import, row repair, setup tagging, feedback review state, viewport
    screenshots, and horizontal page overflow across desktop, tablet, and
    mobile.
  - The harness runs against `npm run build` plus `next start` on port `3100`
    so it does not depend on a stale local `next dev` process.
  - Fixed a duplicate React key warning in the import confidence gate reason
    list that Playwright surfaced.
  - Verification passed:
    - `npm run test:e2e` passed with 9 browser tests across Chromium desktop,
      tablet, and mobile.
    - `npx vitest run src/lib/trader-analytics/__tests__/trader-import-automated-qa-harness.test.ts`
      passed with 1 file / 8 tests.
    - `npx vitest run src/lib/trader-analytics/__tests__` passed with 18
      files / 126 tests.
    - `npx tsc --noEmit` passed.
    - `npm run verify:all` passed with 86 files / 787 tests plus shared-engine,
      Layer 2, and Layer 3 checkpoints.
    - `npm run lint` passed with 0 errors and the same 4 pre-existing warnings.
    - `npm run build` passed as part of `npm run test:e2e`.
