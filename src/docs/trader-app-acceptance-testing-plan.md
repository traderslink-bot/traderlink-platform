# Trader App Acceptance Testing Plan

## Summary

This plan adds a deeper automated acceptance suite for the rough Trader
Intelligence product. The goal is to test whether the app works as an end-user
workflow, not only whether routes render.

The suite should click and assert the important product loops:

- every sample trade can open a valid trade autopsy page
- analytics filters and drill-downs change the visible trade set
- filtered analytics rows can open source trade reviews
- unknown CSV headers can be mapped through the import UI
- rejected import rows can be repaired through the import UI
- progress and review pages link back to source trades
- mobile trade detail pages do not create page-level horizontal overflow
- product boundary rules stay intact after interactions

This remains fixture/in-memory product work:

- no auth
- no billing
- no production persistence
- no real broker credentials
- no real saved trades required
- no export/download product affordances
- no local candle/support/resistance/market-structure logic

## Current Decisions

- Use Playwright because it is already installed, verified, and integrated into
  `npm run test:e2e`.
- Keep assertions tied to stable user-facing flows and small `data-testid`
  hooks where interaction state needs to be deterministic.
- Keep the suite fixture-only. Synthetic CSV text is acceptable for broker
  compatibility and repair tests until real anonymized files exist.
- Market context remains observational. The suite must not ask this repo to
  fetch candles or build market structure locally.
- Do not add strict pixel visual snapshots yet. Keep screenshot smoke in the
  existing feature-regression suite until the final website design exists.

## Step 1. Create Acceptance Plan File

Status: completed

Tasks:

- Add this file at `src/docs/trader-app-acceptance-testing-plan.md`.
- Include scope, current decisions, step-by-step implementation plan,
  acceptance criteria, files to touch, and verification commands.
- Update the file as implementation progresses.

Acceptance criteria:

- The plan can be used as the working checklist for this branch.
- The plan clearly separates fixture app testing from future production auth,
  billing, persistence, and market-data work.

## Step 2. Add Stable Acceptance-Test Hooks

Status: completed

Tasks:

- Add deterministic hooks to `/analytics` for:
  - filter selects
  - drill-down buttons
  - drill-down trade rows
  - filtered trade rows
  - filtered trade open links
- Add deterministic hooks to `/import-dry-run` for:
  - column mapping inputs
  - existing broker/sample/file controls
  - existing row repair controls
- Add deterministic hooks to `/trades/[tradeId]` for:
  - page root
  - trade review checklist
  - execution replay section and steps
  - trade quality section
  - decision autopsy section
  - risk/strength review points
- Add deterministic hooks to `/progress` and `/review` where source-trade links
  are part of the acceptance flow.

Acceptance criteria:

- Hooks do not alter product behavior or visible copy.
- Hooks are scoped enough to avoid duplicate IDs on pages with multiple trade
  tables.

## Step 3. All Sample Trade Detail Acceptance Test

Status: completed

Tasks:

- Build the sample saved-trade list from the product fixture repository.
- Loop every sample trade ID.
- Open `/trades/{tradeId}`.
- Assert:
  - expected trade heading is visible
  - execution replay exists
  - replay has at least one step
  - trade quality exists
  - decision autopsy exists when supported
  - review points / risks / strengths exist
  - no framework error copy appears
  - no export/download/raw-debug product surface appears

Acceptance criteria:

- A broken fixture trade route fails the test before an end user sees a 404 or
  blank autopsy page.

## Step 4. Analytics Interaction Acceptance Test

Status: completed

Tasks:

- Open `/analytics`.
- Select a symbol filter and outcome filter.
- Assert the filtered row count matches the product view model.
- Assert excluded rows are no longer visible in the filtered table.
- Click a non-default drill-down.
- Assert the selected drill-down heading and row count update.
- Open a filtered trade review from the filtered table.

Acceptance criteria:

- The analytics page proves that filters and drill-downs are live interactions,
  not static report decorations.

## Step 5. Import Mapping And Repair Acceptance Test

Status: completed

Tasks:

- Upload a CSV with unknown headers.
- Fill explicit column mappings for symbol, timestamp, side, quantity, and
  price.
- Assert the import reaches a usable dry-run state with grouped trade and
  execution feedback preview.
- Upload a row-repair CSV with a rejected row.
- Repair the rejected row through the editable cell.
- Assert the row status changes to accepted and the feedback preview remains
  visible.

Acceptance criteria:

- A user can recover from both mapping-level and row-level import problems
  through the UI.

## Step 6. Progress Link Acceptance Test

Status: completed

Tasks:

- Open `/progress`.
- Assert score dimensions, rule effectiveness, quality trend, mistake targets,
  behavior change, and report history surfaces exist.
- Click an execution quality trendline trade link.
- Assert the correct trade review page opens.

Acceptance criteria:

- Progress visuals remain connected to source trade evidence.

## Step 7. Review Workflow Acceptance Test

Status: completed

Tasks:

- Open `/review`.
- Assert playbook drafts, coach review queue, session coach report, review
  flow, biggest mistake, and lesson draft surfaces exist.
- Open a related trade from the review flow or coach review queue.
- Assert the trade review page opens.
- Assert no production persistence overclaim appears.

Acceptance criteria:

- The review page gives the user a usable review path while staying honest that
  current state is still fixture/in-memory.

## Step 8. Mobile Trade Detail Acceptance Test

Status: completed

Tasks:

- Under the mobile Playwright project, loop every sample trade detail page.
- Assert the expected heading appears.
- Assert replay and trade quality surfaces appear.
- Assert no page-level horizontal overflow.

Acceptance criteria:

- Every fixture trade autopsy remains usable on mobile.

## Step 9. Product Boundary Guard Acceptance Test

Status: completed

Tasks:

- Scan core product routes after the interactive assertions.
- Block:
  - raw JSON / debug JSON copy
  - export/download affordances
  - real persistence claims
  - auth/billing availability claims
  - market-structure scoring or chart-validation overclaims
- Allow sample/in-memory/observational/calibration copy when labeled clearly.

Acceptance criteria:

- The acceptance suite fails if rough product pages start overpromising
  production readiness or market-context scoring.

## Step 10. Full Verification And Documentation Update

Status: completed

Tasks:

- Run:
  - `npm run test:e2e`
  - `npx tsc --noEmit`
  - `npm run lint`
  - `npm run verify:all`
  - `npm audit`
- Update this plan with completion notes.
- Update `README.md` with the new acceptance suite.
- Update `src/docs/codex-project-log.md` with the current resume point and
  best next step.

Acceptance criteria:

- The acceptance suite is part of the regular Playwright command.
- The project log points future work at the correct next branch.

## Files To Add Or Update

- Add:
  `src/docs/trader-app-acceptance-testing-plan.md`
- Add:
  `tests/e2e/app-acceptance.spec.ts`
- Update:
  `app/analytics/analytics-client.tsx`
- Update:
  `app/import-dry-run/import-dry-run-client.tsx`
- Update:
  `app/trades/[tradeId]/page.tsx`
- Update:
  `app/progress/page.tsx`
- Update:
  `app/review/page.tsx`
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
- 2026-05-03: Added `tests/e2e/app-acceptance.spec.ts` with real app
  acceptance coverage for every sample trade autopsy, analytics filters and
  drill-downs, import column mapping, row repair, progress source-trade links,
  guided review source-trade links, mobile trade detail overflow, and product
  boundary guards.
- 2026-05-03: Added stable acceptance-test hooks to analytics, dry-run import,
  trade detail, progress, and review surfaces. These hooks do not change
  visible UI copy or product behavior.
- 2026-05-03: Verification completed:
  - `npm run test:e2e` passed with 31 Playwright tests and 32 intentional
    viewport-scope skips.
  - `npx tsc --noEmit` passed.
  - `npm run lint` passed with 0 errors and 4 pre-existing warnings.
  - `npm run verify:all` passed with 86 Vitest files / 787 tests plus
    levels-system, Layer 2, and Layer 3 checkpoints.
  - `npm audit` passed with 0 vulnerabilities.
