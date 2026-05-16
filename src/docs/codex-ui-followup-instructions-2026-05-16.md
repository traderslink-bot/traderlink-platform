# Codex UI Follow-Up Instructions

Date: 2026-05-16
Branch: `codex/trader-ui-product-pass`
PR: `#9`
Latest reviewed commit before this instruction file: `f754d71a`

## Purpose

This file gives Codex the next focused UI/product implementation pass after the latest Trader Intelligence UI review.

The current UI direction is still:

1. Beginner view first.
2. Advanced evidence second.
3. Admin/debug/dev concepts never visible by default.
4. The normal trader path should feel like:

   Workspace -> Upload CSV -> Import status/history -> Saved trades -> Review queue -> Analytics -> Coach -> Progress.

Do not rebuild completed work unless a concrete regression is found.

## Context To Read First

Before changing code, read these files in this order:

1. `src/docs/trader-intelligence-ui-change-summary-and-next-steps-2026-05-16.md`
2. `src/docs/codex-project-log.md`
3. `plan.md`
4. `src/docs/trader-intelligence-plan-index.md`
5. This file: `src/docs/codex-ui-followup-instructions-2026-05-16.md`

The latest audit found that the current UI pass is directionally correct. The next work should be a targeted simplification pass, not a redesign from scratch.

## Work That Is Already Considered Complete

Do not redo the following unless tests, screenshots, or actual route QA prove a regression:

- `/upload-csv` as the branded beginner CSV entry point.
- `/import-dry-run` as Advanced Import Check.
- `/imports` as Import History with advanced technical details demoted.
- `/trades` route split, day sessions, ticker stories, round trips, calendar, open/swing, and needs-review routes.
- `/analytics` route split with route-specific headings.
- `/coach` route split with the coaching sequence separated from analytics.
- Trade detail candle replay chart and execution strip.
- Advanced details being available behind disclosures.
- Existing behavior mapping, detection, P/L math, saved-trade read models, and import reconstruction logic.

## Main Goal For This Pass

Make the app easier for a new trader by tightening the actual working path:

1. Upload CSV.
2. Resolve import only if needed.
3. Open saved trades or review queue.
4. Review one trade.
5. Write the lesson.
6. Return to coach/progress.

The highest-value target is `/review`, followed by trade detail replay placement and small copy fixes.

## Priority 1: Simplify `/review` Into A True Work Queue

Route:

- `app/review/page.tsx`

Current problem:

`/review` is better than before, but it still feels like a dense dashboard. It has a primary review panel, metrics, work-order cards, session-story handoff, queue tabs, queue cards, coach notes, review flow, and technical states all on one page.

Product goal:

The default `/review` page should feel like a work queue, not a diagnostics dashboard.

Implementation direction:

1. Keep the top header short.
2. Keep the primary action panel as the first meaningful item.
3. Make the first-screen promise simple:
   - Review this trade first.
   - Replay executions.
   - Write one lesson.
   - Continue to the next trade.
4. Reduce visible lane clutter on the default view.
5. Keep only the beginner-important queue lanes visible by default:
   - Highest priority
   - Chart data waiting or missing
   - Open/carryover trades
6. Move detailed lane counts, session story handoff, technical follow-up, evidence-count-heavy sections, and supporting diagnostics below a disclosure or lower on the page.
7. Avoid adding more route clutter unless there is a clear win.

Suggested focused routes only if they simplify the product instead of adding clutter:

- `/review/highest-priority`
- `/review/chart-data`
- `/review/open-carryover`
- `/review/completed`

Do not create these routes unless you can wire them cleanly and keep the main `/review` simpler.

Acceptance criteria:

- A new trader can open `/review` and immediately understand which trade to review first.
- The page does not read like an admin dashboard.
- Technical review states are still available, but they do not dominate the default path.
- The first visible queue card answers:
  - Why it is here
  - What to do now
  - Open trade review
- The page still links correctly into `/trades/[tradeId]#execution` or `/trades/[tradeId]#writing-flow` where appropriate.

## Priority 2: Move Trade Replay Higher On Trade Detail

Route:

- `app/trades/[tradeId]/page.tsx`

Current problem:

The replay chart and execution strip are good, but the `#execution` section appears after too much supporting content. The page says `Replay, decide, write, then continue`, so the DOM order and visual order should match that.

Implementation direction:

1. Keep the trade summary and `Replay, decide, write, then continue` workflow near the top.
2. Move the `#execution` replay section directly after that early flow.
3. Keep session story, ticker story, chart-data review, checklist, risks/strengths, score detail, and advanced evidence below replay.
4. Do not remove the execution strip.
5. Do not expand Risks And Strengths by default. Keep it visually demoted.
6. Make sure any anchors from `/review`, `/coach`, and `/analytics` still land correctly.

Acceptance criteria:

- A user opening a trade review sees the replay path before secondary evidence sections.
- The chart and execution strip remain the main replay focus.
- The page still supports coach/review return paths.
- Risks And Strengths stay secondary.

## Priority 3: Fix Small Beginner Copy Issues

### `/upload-csv`

Files:

- `app/upload-csv/page.tsx`
- `app/upload-csv/upload-csv-client.tsx`

Current issue:

The primary button says `Upload and save trades`, but not every upload will save immediately. Duplicate review, repair, or acknowledgement states may need review first.

Change the button copy to one of these:

- `Upload CSV`
- `Check CSV and continue`

Preferred: `Check CSV and continue`.

Also review surrounding success/attention copy to make sure it does not overpromise that all trades were saved when the route is only asking the user to review an import first.

### `/imports`

File:

- `app/imports/page.tsx`

Current issue:

The page header and a lower section both use `Import History`, which can feel repetitive.

Change the lower section heading to one of:

- `Recent imports`
- `Saved imports`

Preferred: `Recent imports`.

Also consider hiding or visually shrinking `Unresolved Repairs` when the count is zero. Do not remove the section entirely if doing so would make repair state hard to find when it matters.

## Priority 4: Light `/trades` Landing Simplification

Route:

- `app/trades/page.tsx`

Current issue:

The landing page is much better, but it still has a lot of cards and metrics before the trader settles into one action.

Implementation direction:

1. Keep the review priority panel.
2. Keep day sessions and browse modes easy to find.
3. Consider moving some metric cards lower or into a supporting section.
4. Avoid showing too many chart/evidence/add-quality counters on the first screen unless they directly help the user choose what to do next.

Acceptance criteria:

- `/trades` feels like a saved-trade starting point, not an analytics dashboard.
- The obvious next actions are:
  - Review next trade
  - Open day sessions
  - Browse ticker stories or round trips

## Do Not Do In This Pass

Do not:

- Rewrite analytics math.
- Rewrite P/L calculations.
- Rewrite import reconstruction.
- Rewrite behavior detection or scoring.
- Rebuild the workspace dashboard.
- Rebuild the whole visual system.
- Add admin/debug links to normal trader navigation.
- Surface raw batch IDs, raw engine labels, mapping confidence, write safety, cost policy, calibration, or QA concepts in beginner UI.
- Replace the completed route split work with a new unrelated IA.

## Copy Rules

Use plain trader-facing language.

Prefer:

- Upload CSV
- Import History
- Saved trades
- Review queue
- Chart data
- Chart evidence
- Replay trade
- Write lesson
- Coach focus
- Progress follow-through

Avoid in normal UI:

- batch ID
- mapping confidence
- calibration
- write safety
- cost policy
- QA
- debug
- internal
- raw engine labels
- chart-context phrasing

Advanced disclosures may contain necessary technical details, but the disclosure summary itself should still be understandable to a trader.

## Verification To Run

After changes, run the most relevant checks you can:

```bash
npx tsc --noEmit --pretty false
npm run build
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"
```

If you only change copy/layout and full Playwright is too broad, run the closest focused tests that cover:

- `/review`
- `/trades/[tradeId]`
- `/upload-csv`
- `/imports`
- core mobile route usability

Update docs after meaningful implementation:

1. Append a short dated entry to `src/docs/codex-project-log.md`.
2. Update `src/docs/trader-intelligence-ui-change-summary-and-next-steps-2026-05-16.md` only if the route hierarchy or completed-work list materially changes.
3. Do not create duplicate docs for tiny changes.

## Final Response Expected From Codex

When finished, Codex should report:

1. Files changed.
2. What changed by route.
3. Verification commands run and results.
4. Any remaining UI risks or follow-up items.
5. Whether any planned simplification was intentionally skipped and why.
