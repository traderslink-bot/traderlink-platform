# Trader Intelligence Progress Continuous Product Plan

**Date:** 2026-05-09
**Status:** Follow-up feature plan
**Primary route:** `/progress`

## Purpose

This plan captures progress-page work that should follow the active Detection
And Language Hardening Batch and the relevant coaching handoff work. The
progress page should not merely echo imported trade counts. It should show
whether the trader is completing reviews and whether the coaching focus is
improving over time.

The coaching plan's key lesson applies here:

> A trader should see one focus, the evidence behind it, and the next follow-up
> action.

## Product Goal

`/progress` should help the user answer:

1. How many imported trades are saved?
2. How many trades have I actually reviewed?
3. What behavior am I currently working on?
4. Is that behavior repeating less, repeating more, or not measured yet?
5. Which trades still need review before progress is meaningful?
6. What should I do next?

Progress should track both improvement and preservation:

- risky behavior reducing over time,
- strong behavior repeating over time,
- review work completed,
- missing evidence that prevents a trend claim.

2026-05-10 implementation note:

- The first progress workflow and screenshot-guided polish passes are complete.
- Progress now has the coach -> review queue -> analytics -> progress handoff,
  lighter shared report surfaces, shorter market-context metric copy, and
  user-facing saved report labels.
- Do not rebuild imported-vs-reviewed separation, active focus handoff,
  ticker/session-story counters, or current insufficient-data honesty unless a
  regression is found.

## Product Rules

- Separate imported trade history from completed review progress.
- Do not imply behavior improvement until there is enough completed-review or
  saved report evidence.
- Active focus labels, trend labels, progress statuses, and behavior
  explanations must use certified detections from the shared fail-closed
  behavior mapper.
- Unknown, unmapped, or uncertified behavior should appear only as a neutral
  review prompt or stay out of the primary progress view.
- Use sample-size warnings when the trend is thin.
- Do not make claims that require unavailable market/candle context.
- Keep execution-only progress separate from market-context progress. Do not
  claim entries improved near support/resistance, exits improved after
  continuation, or volume-aware behavior changed unless chart/levels evidence is
  present.
- Track strengths as first-class progress items when the evidence supports
  them, such as profit protection, structured execution, or good loss
  containment.
- Visible collapsed advanced-section headings and summaries count as normal UI
  and must use trader-readable language.
- Do not expose raw behavior IDs, scoring traces, debug wording, fixture labels,
  raw JSON, or storage internals in the normal UI.
- Do not add financial advice, trade calls, signals, guaranteed-profit claims,
  or short-seller coaching language.

## Target Page Shape

1. Progress Summary
   - saved imported trades,
   - completed reviews,
   - open/swing items,
   - active focus rule or behavior.
2. Current Focus
   - behavior/strength being worked on,
   - why it matters,
   - coach evidence link,
   - next review action.
3. Review Completion
   - reviewed vs waiting,
   - queue link,
   - completed-review trend.
4. Behavior Trend
   - improving,
   - getting worse,
   - unchanged,
   - needs more reviews.
5. Follow-Through
   - rules created,
   - lessons written,
   - repeat checks,
   - open items.
6. Advanced Context
   - collapsed data quality, source, and technical limitations.

## Coaching Lessons To Reuse

- One focus first.
- Evidence before advice-like language.
- Plain explanation of what the metric means.
- Red/green/amber color semantics:
  - red for deteriorating behavior or unresolved risk,
  - green for completed reviews or improving behavior,
  - amber for needs more evidence,
  - neutral for unavailable/not-yet-measured.
- Link to the exact trade, review queue, or coach section that explains the
  progress item.

## Implementation Runs

### Run A: Imported Vs Reviewed Separation

- Make saved imported trade count clear.
- Make completed review count clear.
- Explain that analytics can update from imports before progress improves.
- Add empty state:
  "Review a saved trade to start progress tracking."

### Run B: Active Coaching Focus

- Pull the active focus from coach/review data when available.
- Show one current behavior or strength.
- Link back to `/coach` and the featured trade evidence.
- Keep the focus human-readable.

### Run C: Behavior Trend Read Model

- Build or tighten a product-safe trend model:
  - current count/rate,
  - previous count/rate when available,
  - trend direction,
  - sample-size warning,
  - related trade IDs.
- Do not claim improvement when the model only has one report or too few
  completed reviews.

### Run D: Review Habit And Follow-Through

- Show lessons written, rules drafted, reviews completed, and remaining queue.
- Link each item to the relevant trade/review/coach route.
- Avoid gamified streaks unless they are tied to meaningful review behavior.

### Run E: Visual Polish

- Add compact progress bars or trend cards.
- Keep visual density lower than analytics.
- Use charts to show progress, not to create a second analytics dashboard.

### Run F: Regression Coverage

Add/update tests for:

- saved imported trades are counted,
- completed reviews are counted separately,
- active focus is visible when available,
- insufficient-progress copy is honest,
- raw/internal terms are absent from primary UI,
- banned claims are absent,
- mobile layout remains usable.

## Acceptance Criteria

- A user understands why `/progress` may not change immediately after importing
  a CSV.
- A user sees what review work remains before progress is meaningful.
- Progress points back to coaching and trade review instead of becoming another
  disconnected report page.
- The page avoids overclaiming improvement.
- Advanced/data-source details are available but not dominant.

## Implementation Status As Of 2026-05-10

Completed enough to avoid duplicate work:

- `/progress` separates saved imported trades from completed reviews.
- The page explains that imports can update analytics before progress becomes
  measurable.
- The active coaching focus links back to `/coach` and the review queue.
- The first shared workflow handoff is implemented so progress points back
  through `/coach`, `/review`, `/analytics`, and the progress follow-through
  section instead of feeling like a disconnected report.
- Follow-through cards use shared product language for backlog, finished
  reviews, and insufficient-data states.
- Progress can consume ticker-story, session-story, support/resistance exit,
  volume comparison, protected-profit-before-fade, add-quality, post-exit, and
  strength-to-repeat session counters from the saved trade-thread read model.
- The route keeps trend claims conservative when completed-review history is
  thin.

Do not rebuild in the next run:

- imported-vs-reviewed separation,
- active coaching focus handoff,
- the first shared workflow handoff,
- first follow-through cards,
- ticker/session story counters,
- protected-profit, support/resistance, volume, and strength-session metric
  wiring,
- insufficient-data honesty.

Best next progress work:

- improve visual polish and mobile density for the existing cards,
- add deeper behavior trend charts only when there is enough completed-review
  history or saved report history to support the trend,
- preserve strength-to-repeat trends as first-class progress items,
- add route links from trend cards to the exact trades/reviews behind the
  number.

## Verification

At the end of a progress implementation run:

```powershell
npx tsc --noEmit --pretty false
npm run build
```

Run focused Playwright for:

- `/progress` desktop,
- `/progress` mobile,
- imported-vs-reviewed copy,
- coach/review/trade links,
- trend or insufficient-data states,
- raw/internal term safety.

Update `src/docs/codex-project-log.md` with what changed, verification, parked
items, and next best continuation.
