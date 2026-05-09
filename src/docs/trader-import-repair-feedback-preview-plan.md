# Trader Import Repair And Feedback Preview Plan

## Summary

This branch deepens `/import-dry-run` into a stronger rough product workflow.
The goal is to make the import preview feel real before auth, billing,
production storage, and final website design exist.

The app should let a user repair obvious row problems locally, capture future
grouping decisions, preview execution-only feedback from grouped trades, inspect
a first-trade replay, read broker-specific import help, and understand privacy
and calibration limits.

This remains a dry-run workflow:

- no imported data is saved
- no export/download feature is added
- no raw JSON panel is added
- no auth, billing, or production database work is added
- no candles, support/resistance, or market-structure work is added locally

`levels-system` remains the owner of candles, support/resistance, VWAP/EMA, and
market structure.

## Product Direction

- Use `/import-dry-run` as the working rough UI for the first import flow.
- Build useful workflow structure now and restyle later for the larger website.
- Keep all new preview conclusions execution-only.
- Make every warning/action traceable to data visible in the app.
- Treat user decisions as a future persistence model, not saved records.

## Implementation Steps

### 1. Editable Row Repair Table

Status: complete

Goal:

Let the user correct obvious CSV row problems in the rough UI and re-run the
preview immediately.

Detailed tasks:

- Add a small CSV grid parser/serializer for UI editing.
- Build a row repair table model from pasted CSV headers and parser row
  outcomes.
- Show:
  - row number
  - row status
  - issue codes
  - symbol
  - side
  - quantity
  - price
  - timestamp/date/time
- In `/import-dry-run`, render editable cells for the visible CSV grid.
- Update the CSV textarea when a cell changes.
- Keep edits local to the browser state only.
- Do not save repaired rows.

Acceptance criteria:

- Missing symbol/bad row samples can be edited in the table.
- The parser preview updates from the edited CSV text.
- The UI does not imply persistence.

### 2. Trade Group Split/Merge Review

Status: complete

Goal:

Let the user express whether grouped trades look right before analysis.

Detailed tasks:

- Add a grouping decision model for every grouped trade.
- Decision options:
  - confirm grouping
  - split later
  - merge later
  - mark as separate trade
  - review open position
- In `/import-dry-run`, add decision controls beside grouped trades.
- Capture the selected decision in local component state.
- Show what the decision would mean later.
- Do not change parser grouping yet.

Acceptance criteria:

- User can locally mark grouping decisions.
- Decisions do not affect scoring or saved data.
- Open positions default to review-needed.

### 3. Dry-Run To Execution Feedback Preview

Status: complete

Goal:

Show what execution-only feedback would say if the current grouped trade were
saved and analyzed later.

Detailed tasks:

- Run `runExecutionFeedback` on `preview.importResult.requests`.
- Build a dry-run feedback preview model with:
  - trade label
  - status
  - gross execution-only P/L
  - primary focus
  - top risk
  - top strength
  - warning count
  - limitations
- Surface this in `/import-dry-run`.
- Keep the copy clear that this is not saved analysis.

Acceptance criteria:

- Valid grouped trades produce feedback preview cards.
- Invalid grouped trades show validation/preview failure.
- Market context is not used.

### 4. First Import Walkthrough Mode

Status: complete

Goal:

Make the dry-run route usable as a step-by-step first-import path.

Detailed tasks:

- Extend the walkthrough with numbered steps:
  - choose/paste CSV
  - confirm broker
  - confirm columns
  - repair rows
  - review grouping
  - preview feedback
  - inspect replay
  - save later when persistence exists
- Mark each step complete/current/blocked/upcoming.
- Surface a compact walkthrough panel near the top.

Acceptance criteria:

- The current next step is always obvious.
- The flow says saving is deferred.

### 5. Broker-Specific Help Panels

Status: complete

Goal:

Give useful import guidance for common broker exports without external website
integration.

Detailed tasks:

- Add help panels for:
  - IBKR
  - Webull
  - Robinhood
  - Moomoo
  - Schwab
  - Generic CSV
- Include:
  - expected report/export name
  - required fields
  - common gotchas
  - support confidence
  - fallback path
- Keep all copy non-certifying and product-safe.

Acceptance criteria:

- Broker help matches the selected broker.
- Help does not promise exhaustive broker support.

### 6. Import Error Library

Status: complete

Goal:

Turn parser failures into polished product help.

Detailed tasks:

- Add error library entries for common issue codes:
  - missing required column
  - missing symbol
  - invalid timestamp
  - missing side
  - invalid quantity
  - invalid price
  - low mapping confidence
  - skipped non-filled order
  - options row rejected
  - P/L mismatch
  - open position
  - duplicate file
- Each entry includes:
  - title
  - why it happened
  - how to fix it
  - whether the user can continue
- Surface matching entries on `/import-dry-run`.

Acceptance criteria:

- Common errors show helpful copy.
- No debug-only language leaks into user copy.

### 7. Dry-Run Replay Preview

Status: complete

Goal:

Show a simple replay for the first grouped trade directly in the import flow.

Detailed tasks:

- Build a replay preview model from the first grouped trade timeline.
- Include:
  - execution index
  - side
  - shares
  - price
  - position after execution
  - role label when inferable
  - risk direction
- Render as simple CSS bars/timeline rows.
- Do not require candles.

Acceptance criteria:

- First grouped trade has an execution replay preview.
- Open positions are visibly marked.

### 8. Row Privacy / Safety Copy

Status: complete

Goal:

Make the rough UI clear that pasted/local CSV data is previewed locally in the
current app state and not saved by this flow.

Detailed tasks:

- Add privacy/safety copy to `/import-dry-run`.
- Add copy audit terms for:
  - no save claim conflicts
  - export/download language
  - guarantee/certification claims
  - market-context overclaims
- Surface the privacy copy near CSV input.

Acceptance criteria:

- User can see that dry-run data is not saved.
- Copy audit catches unsafe alternatives.

### 9. Mobile Pass On The New Import Flow

Status: complete

Goal:

Keep the expanded dry-run UI usable on smaller screens.

Detailed tasks:

- Add mobile QA checklist items for:
  - CSV input
  - mapping table
  - row repair table
  - grouped trade review
  - feedback preview
  - replay preview
  - broker help
- Ensure layout uses single-column stacking on mobile.
- Avoid horizontally required controls except data-like mini timelines.

Acceptance criteria:

- Mobile QA model covers the new panels.
- Build succeeds with responsive layout classes.

### 10. User Decision Capture Model

Status: complete

Goal:

Prepare future product analytics and persistence by modeling what choices a
user makes during import review.

Detailed tasks:

- Add a decision capture model with decision types:
  - confirmed mapping
  - edited row
  - ignored warning
  - confirmed grouping
  - requested split later
  - requested merge later
  - approved feedback preview
  - deferred import
- In `/import-dry-run`, locally track row edit and grouping decisions.
- Show a summary of captured decisions.
- Keep the decisions in client state only.

Acceptance criteria:

- Decisions are visible in the UI.
- Decisions are not saved.
- The model can later become an import-batch event log.

## Files To Add Or Update

- Add `src/docs/trader-import-repair-feedback-preview-plan.md`.
- Extend `src/lib/trader-analytics/product/csv-dry-run-workflow.ts`.
- Extend public dry-run types in `src/lib/trader-analytics/product/types.ts`.
- Extend exports in `src/lib/trader-analytics/index.ts`.
- Update `app/import-dry-run/import-dry-run-client.tsx`.
- Add focused tests.
- Update project log and README after verification.

## Verification Plan

- `npx vitest run src/lib/trader-analytics/__tests__/trader-import-repair-feedback-preview.test.ts`
- `npx vitest run src/lib/trader-analytics/__tests__`
- `npx tsc --noEmit`
- `npm run verify:all`
- `npm run lint`
- `npm run build`
- Smoke-test `/import-dry-run`.

## Completion Log

- 2026-05-03: Plan created. Implementation in progress.
- 2026-05-03: Completed the import repair and feedback preview branch.
  - Added editable row repair models and `applyCsvDryRunCellEdit`.
  - Added grouping decision review models and local UI controls.
  - Added execution-only feedback preview from grouped dry-run trades.
  - Added first grouped-trade replay preview with role and risk labels.
  - Added broker help panels, matched import error library, privacy notice,
    mobile QA model, and future decision capture model.
  - Extended `/import-dry-run` to display all ten planned workflow surfaces.
  - Added focused coverage in
    `src/lib/trader-analytics/__tests__/trader-import-repair-feedback-preview.test.ts`.
  - Updated public exports through `src/lib/trader-analytics/index.ts`.
  - Verification passed:
    - `npx vitest run src/lib/trader-analytics/__tests__/trader-import-repair-feedback-preview.test.ts src/lib/trader-analytics/__tests__/trader-csv-dry-run-import-ui.test.ts`
      passed with 2 files / 13 tests.
    - `npx vitest run src/lib/trader-analytics/__tests__` passed with 16
      files / 109 tests.
    - `npx tsc --noEmit` passed.
    - `npm run verify:all` passed with 84 files / 770 tests plus shared-engine,
      Layer 2, and Layer 3 checkpoints.
    - `npm run lint` passed with 0 errors and 4 pre-existing warnings.
    - `npm run build` passed and produced `/import-dry-run`.
    - Existing dev server smoke at `http://localhost:3000/import-dry-run`
      returned 200 and contained the new row repair, feedback preview, replay
      preview, and error library surfaces.
