# Trader Intelligence Review Queue Continuous Product Plan

**Date:** 2026-05-09
**Status:** Secondary feature plan; use for queue polish, missing anchors, and
route-specific copy regressions after the completed detection/language
hardening slices
**Primary route:** `/review`

## Purpose

This plan captures review-queue work for the coaching-adjacent batch. The
review page should feel like a work queue for a trader, not a status report or
technical queue dump.

Current gate:

- The evidence-gating reference is
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`.
- Review queue reasons, lane labels, priority explanations, badges, and visible
  collapsed technical summaries must use the shared fail-closed behavior
  mapper when they mention behaviors.
- Unknown, unmapped, or uncertified behavior should become a neutral review
  prompt, not a queue priority or confident conclusion.

2026-05-09 update:

- The first-screen `/coach` pass is complete enough to continue into this plan.
- Treat `/review` as a coaching-adjacent continuation point that consumes the
  shared fail-closed behavior mapper produced by the detection/language
  hardening work.
- Improvements here should support the coaching flow, not become a separate
  broad review-page redesign.

2026-05-10 implementation note:

- The first review-flow copy cleanup is complete. The Review Flow links no
  longer show raw saved trade IDs; they use plain `Open trade 1`, `Open trade
  2`, etc., while preserving deep links and test IDs.
- Advanced queue status remains collapsed by default, and the shared lighter
  app surface now applies to the review route.
- Next review work should focus on queue-card density, mobile tab reduction,
  and session/date labels if the saved review queue read model exposes them
  without importer changes.

The route should answer:

1. What should I review first?
2. Why is this trade in the queue?
3. What exactly should I look at?
4. What evidence exists?
5. Where do I open the replay and write the review?
6. How does this connect to coaching and progress?

## Product Goal

`/review` should become the bridge between saved trades, coach, and progress.
It should get the user into the right trade review quickly, with enough context
to know what to write down.

## Product Rules

- The first item should be one obvious review action.
- Queue items should use beginner-facing language.
- Raw states and diagnostic labels belong in collapsed technical sections only.
- Visible collapsed-section labels still count as normal UI and must use plain
  trader language.
- Saved trades, ticker stories, and chart-context status should be explained in
  plain language.
- If chart context is missing, say what is waiting or what to check next. Do not
  imply the system already knows volume/level conclusions without evidence.
- Short-looking or sell-starting imported rows should use neutral
  position-history wording in the end-user UI.
- Do not add financial advice, trade calls, signals, guaranteed-profit claims,
  or short-seller coaching language.

## Target Page Shape

1. Review This First
   - one primary card,
   - symbol/session/result,
   - why it matters,
   - what to review,
   - `Open Trade Review` button to the writing flow or replay.
2. Queue Lanes
   - Highest Priority,
   - Chart Context Waiting,
   - Open Trades,
   - Needs Technical Follow-Up,
   - Reviewed With Chart Context.
3. Saved Review Items
   - cards grouped by lane,
   - each card names the user action.
4. Coaching Handoff
   - link to `/coach` when the queue exposes a repeated behavior.
5. Progress Handoff
   - explain that imported trades are history and completed reviews are
     progress.
6. Technical Limits
   - collapsed diagnostics only.

## Coaching Lessons To Reuse

From the coaching plan:

- do not show many equal-priority cards,
- make one next action obvious,
- use evidence-backed wording,
- explain behavior terms in plain language,
- link directly to the trade replay, writing flow, or evidence section,
- collapse engine details and raw states.

## Implementation Runs

### Run A: First Review Card

- Select the most useful queue item from saved data.
- Show why it is first.
- Show what the user should write down.
- Link to `/trades/[tradeId]#writing-flow` or `/trades/[tradeId]#execution`.

Current status:

- A first review card exists, but the next pass should verify it reads like a
  coaching handoff for a new trader and not just a queue summary.

### Run B: Lane Language Cleanup

Replace raw/internal state labels with:

- Highest Priority,
- Chart Context Waiting,
- Open Trades,
- Needs Technical Follow-Up,
- Reviewed With Chart Context.

Every lane should explain what belongs there.

### Run C: Queue Item Card Shape

Every item should show:

- symbol,
- date/session,
- gross result or open status,
- why it is in the queue,
- what to review,
- available evidence,
- action button.

Current status:

- Implemented the first saved queue card pass on `/review`.
- The default saved queue now appears before the chart-context status/support
  material.
- Each item now follows the coaching order:
  1. symbol and gross result,
  2. why it is here,
  3. what to review,
  4. evidence status,
  5. `Open Trade Review` and replay actions,
  6. technical review limits collapsed below the card.
- Queue actions now use end-user wording: mark reviewed, mark solved, and skip
  for now.
- Advanced queue status and technical limits are collapsed by default.

Follow-up focus:

- Add session/date labels to queue items if the saved review queue read model
  exposes them without importer changes.
- Decide whether the queue should show fewer tabs by default on mobile.
- If the card references coaching, it should point to the trade replay,
  writing flow, or `/coach#coaching-session`, not to a generic page.

### Run D: Coach And Progress Links

- Add coach handoff when a behavior repeats.
- Add progress handoff when review completion matters.
- Keep links contextual; avoid generic page dumping.

Next active run focus:

- The first coach/review/progress loop is complete. Review items can send the
  trader into trade writing/replay, trade detail can send the trader back to
  coach/progress/review, and progress links back to the active focus.
- Future Run D work should be limited to missing anchors, broken handoff
  context, mobile density, or a new certified evidence family that needs a
  review queue reason.
- Do not add generic cross-links just to connect pages.

### Run E: Technical Section Collapse

- Move raw counts, diagnostics, chart-context technical limits, and storage/import
  statuses into collapsed sections.
- Default view should stay beginner-friendly.

### Run F: Regression Coverage

Add/update tests for:

- first review card exists,
- lane labels are user-facing,
- queue cards link to useful anchors,
- raw/internal terms are absent from primary UI,
- banned claims are absent,
- mobile layout remains usable.

## Acceptance Criteria

- A new trader can tell what to review first within the first screen.
- Every queue item has a reason and an action.
- The page feels like a work queue, not a dashboard of statuses.
- Queue-to-trade and queue-to-coach links preserve context.
- Technical details are available but do not dominate.

## Implementation Status As Of 2026-05-10

Completed enough to avoid duplicate work:

- The first review card and saved queue card shape are implemented.
- Lane labels use user-facing wording instead of raw route states.
- Queue items follow the coaching order: result, reason, what to review,
  evidence status, and action.
- Advanced queue status and technical limits are collapsed by default.
- Chart-evidence queue items can link to the trade-detail chart handoff anchor.
- Session-story queue handoffs now exist when a broader trading-day story is
  relevant to the trade.
- The review work order includes the progress/coach loop instead of ending at
  the queue.

Do not rebuild in the next run:

- first review card,
- lane rename pass,
- base saved queue card shape,
- chart-evidence handoff link,
- session-story handoff,
- completed coach/progress review loop.

Best next review-queue work:

- add session/date labels only if the current read model exposes them safely,
- reduce mobile tab/card density if screenshot QA shows crowding,
- fix broken or missing anchors to replay, writing, chart evidence, or coach,
- add queue reasons only for newly certified evidence families,
- keep diagnostics collapsed.

## Verification

At the end of a review-queue implementation run:

```powershell
npx tsc --noEmit --pretty false
npm run build
```

Run focused Playwright for:

- `/review` desktop,
- `/review` mobile,
- lane labels,
- trade-detail anchor links,
- raw/internal term safety,
- coach/progress handoff links.

Update `src/docs/codex-project-log.md` with what changed, verification, parked
items, and next best continuation.
