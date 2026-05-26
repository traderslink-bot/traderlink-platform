# Trader Intelligence Continuous UX/Product Implementation Plan

**Date:** 2026-05-09
**Status:** Active working plan
**Purpose:** Give Codex a detailed execution plan for improving Trader
Intelligence continuously without requiring the user to keep prompting after
each small slice.

**Plan index:** `src/docs/trader-intelligence-plan-index.md`
Use the index to understand how this plan relates to feature-specific follow-up
plans and older historical/prototype plans.

## Product Goal

Trader Intelligence should feel like a useful trade-review product for a human
trader, not an internal diagnostic terminal.

The core product loop should be:

```text
Workspace -> Import -> Saved Trades -> Trade Detail -> Review Queue -> Coach -> Analytics -> Progress
```

The app should help the user answer:

1. What happened?
2. What behavior mattered most?
3. Why did it matter?
4. What should I review first?
5. What should I fix or repeat next?
6. What evidence supports that?
7. How does this pattern show up across my trades?

## User Levels

Design each route for three user levels without making three separate apps.

New traders need:

- one clear next action,
- plain explanations of P/L, open trades, re-entries, review queues, and chart
  context,
- coaching language that says what happened and what to review,
- minimal raw analytics until the meaning is clear.

Intermediate traders need:

- fast filters,
- visible behavior patterns,
- session/time-of-day analytics,
- repeated mistake and strength tracking,
- links from summary numbers back to the trades behind them.

Advanced users need:

- access to details,
- import and review limitations,
- chart-context status,
- evidence depth,
- technical limits and calibration notes behind disclosure or admin routes.

Default UI should serve new and intermediate users first. Advanced information
is allowed only when it is secondary, collapsed, or clearly separated.

## Product Rules

- Keep flat-to-flat round trips as the accounting unit.
- Add higher-level ticker stories above round trips for re-entry review.
- Do not rewrite the importer unless the product layer proves the importer
  contract is blocking a required behavior.
- Beginner UI should use product-ready language, not raw engine internals.
- Advanced/internal details should be behind disclosures or admin routes.
- Visible headings, summaries, badges, pills, and closed-state labels on
  collapsed advanced sections still count as normal UI and must use plain
  trader language.
- Do not expose raw pattern IDs, suppressed behavior IDs, scoring traces,
  dominant families, raw JSON, fixture labels, or diagnostic terms in default
  end-user UI.
- Do not add financial advice, signals, trade calls, guaranteed-profit claims,
  short-seller coaching positioning, borrow/locate analysis, or short-specific
  coaching.
- If a CSV row starts with a sell, the end-user UI should treat it as
  position-history review until short-side product support is intentionally
  added.

## Current State

Completed recently:

- `/analytics` is visually improved and uses saved import data.
- `/trades` has a ticker-story section above the trade cards.
- `/trades` has browse modes for round trips, ticker stories, session stories,
  open/swing, and needs-review views.
- `/trades/[tradeId]` has ticker-story context.
- Same-symbol same-day round trips can be grouped into a story.
- Ticker stories classify:
  - single round trip,
  - closed day-trade re-entry,
  - open intraday re-entry,
  - day trade turned swing,
  - multi-day ticker thread,
  - profit giveback after a positive peak,
  - re-entry that added profit,
  - repeated losing attempts,
  - multiple round trips.
- Ticker story classification now uses explicit story kinds. Repeated losing
  attempts are guarded so they are not described as profit giveback when there
  was no earlier positive P/L peak.
- Ticker stories now expose:
  - primary review question,
  - fix-first action,
  - evidence cards.
- Session stories now sit above single trades and ticker stories for full-day
  review. The first execution-only slice identifies:
  - green-to-red sessions,
  - many attempts on one ticker,
  - high trade-count sessions,
  - open or swing exposure to review,
  - positive controlled sessions,
  - mixed session review.
- `/analytics`, `/coach`, `/progress`, and `/trades` all surface session-story
  counts or panels with plain execution-evidence language.
- `/review` queue cards show why an item is in the queue, what to review, what
  evidence exists, and the `Open Trade Review` action.
- `/review` primary queue cards no longer expose raw candle warehouse/backfill
  diagnostics in the beginner-facing headline.
- `/progress` has a saved-data source panel showing saved trades, completed
  round trips, open/swing items, and review completion.
- `/coach` has a guided coaching flow with:
  - one obvious next action,
  - one overall coaching focus across saved trades,
  - one featured saved trade as evidence beneath that focus,
  - plain behavior explanation,
  - why-it-mattered copy,
  - fix-first action,
  - trades-to-review preview,
  - progress follow-through,
  - proof/repeat sections,
  - behavior impact and repeat-pattern visuals.
- `/coach` lower sections are grouped into supporting checks, proof, and
  next-session planning instead of one long same-weight card dump.
- The first Trade Review Workspace implementation pass is complete:
  - `/trades/[tradeId]` now has a clearer review workspace flow,
  - trade replay shows plain execution labels, position movement, and
    execution-derived P/L progression when available,
  - notes/checklist actions are closer to the review prompt,
  - `/review`, `/coach`, and `/progress` now link into useful trade-detail
    anchors instead of generic trade pages.
- `/trades/[tradeId]` maps raw source labels in evidence areas into
  beginner-facing labels such as chart context evidence, execution replay, and
  saved import data.

Still weak:

- `/coach` now has the overall-focus foundation. Remaining coaching work should
  not restart that first screen. The weak spot is the follow-through after the
  user clicks an evidence trade:
  - the trade-detail page must make replay, writing, checklist, and review
    completion feel like the natural next coaching step,
  - `/review` and `/progress` must explain unfinished reviews, completed
    reviews, and active coaching focus with the same language,
  - lower coach cards should continue to feel like proof and follow-through,
    not a smart report,
  - behavior language should remain short enough to read quickly,
  - charts should support the coaching point without overwhelming it,
  - advanced rule/simulation/confidence material should stay collapsed.
- `/review` has its first coaching-order queue-card pass complete. Remaining
  `/review` work should focus on handoffs from the overall coach into the
  review backlog, mobile tab density, and optional session/date labels if the
  read model exposes them safely.
- `/trades/[tradeId]` should keep using the same coaching vocabulary as
  `/coach` and `/review`, especially around behavior, evidence, and fix-first
  copy.
- `/progress` still needs deeper behavior trend logic after review completion
  data becomes meaningful.
- `/trades` still needs day/session/symbol filters if the saved trade list
  becomes hard to browse after the current view-mode pass.
- Analytics, coach, review, and progress need more chart/visual polish and less
  card sprawl, but the next active batch should prioritize detection
  certification and language hardening before coaching-flow or broader report
  polish.
- Deeper chart/volume comparison for re-entry stories is still incomplete; use
  saved decision-review facts when available, and otherwise show context to
  check instead of making unsupported claims.
- The next active implementation run should start from the next-run plan's
  market-context gate ladder and route handoffs for certified outputs, not from
  the older route-language, ticker-story, or first session-story baseline.
- The app needs stronger empty/loading states and first-user explanations.

## Continuous Work Protocol

When working from this plan:

1. Read `src/docs/codex-project-log.md`.
2. Read this document.
3. Continue the highest-value incomplete run below.
4. Prefer a complete vertical slice over many half-finished changes.
5. Update this document only when the plan changes materially.
6. Update `src/docs/codex-project-log.md` after meaningful implementation.
7. Run focused tests, typecheck, build, and localhost smoke before finishing.
8. Restart localhost after build if it was running.

## Autonomy Instruction For Codex

The user does not want to approve each small next step. When the user says to
continue, Codex should keep working through this plan for as long as practical
inside the current turn.

Do not stop after one small slice if there is still obvious high-value work in
the active run or the next run.

Default behavior:

1. Finish the current vertical slice.
2. Run the fastest relevant verification.
3. If verification passes and there is still time/context, immediately continue
   to the next item in the same run.
4. If the current run is complete, move to the next run in the suggested
   execution order.
5. Update docs/log only after meaningful implementation or when the resume
   point changes.
6. Save final response for the end of a longer work block, not after every
   minor improvement.

If one item is blocked but other useful work remains, do not stop the entire
run. Park the blocked item, write a short note in the project log or this plan
if it changes the resume point, and continue to the next independent item.

Expected work block size:

- Aim for **multiple related changes per turn**, not one small page tweak.
- A good continuous run should usually include:
  - one read-model or data improvement,
  - one or more route/UI improvements,
  - focused tests or Playwright coverage,
  - typecheck/build,
  - localhost restart/smoke,
  - project log update.
- If a route is being improved, continue into adjacent routes when the same
  design/data pattern clearly applies.

Treat blockers as local by default.

Local blockers should not end the run. Examples:

- one route has confusing data but another route can still be improved,
- one chart needs a missing read-model field but copy/layout cleanup can
  continue,
- one test needs deeper investigation but typecheck/build or another focused
  test can still run,
- one product question affects a future enhancement but current safe UI
  presentation work can continue,
- one API or candle-data path is unavailable but saved-data views, empty states,
  or mock-backed UI can still be improved.

For a local blocker:

1. Leave the blocked area in a coherent state.
2. Add a short `Blocked/parked` note only if it affects the resume point.
3. Continue to the next useful item in the same run.
4. Return to the parked item later if the needed context becomes available.

Only stop the whole run early when:

- a destructive database/filesystem action would be needed,
- a contract change would materially affect importer behavior,
- every remaining useful step depends on product/architecture judgment not
  already clear from this plan,
- every remaining useful step depends on credentials/API access that is
  unavailable,
- verification is failing in a way that makes further edits risky or likely to
  hide the root cause,
- continuing would risk unsafe claims, financial-advice wording, or exposing
  raw/internal data in the default UI.

If none of those blockers apply, keep going.

When uncertain whether a blocker is local or global, assume it is local, reduce
scope, and keep working on adjacent safe improvements.

## Implementation Safety Rules

These rules apply during every long run.

- Do not push to GitHub, create commits, or upload files unless the user
  explicitly asks.
- Do not delete, reset, dedupe, or rewrite saved trade data as part of UI work.
- Do not modify candle warehouse data or imported CSV source files unless the
  user explicitly asks for a data repair task.
- Do not stop the dev server just because the user is clicking around; only
  restart it when build/runtime verification requires it.
- If the dev server must be stopped or restarted, preserve the replay settings
  and restart it before final smoke verification.
- Prefer read models, UI labels, filters, and collapsed advanced sections over
  contract changes while the end-user UX is still being shaped.

## Data Source Priority

End-user routes should choose data sources in this order:

1. Current saved imports and saved review data.
2. Saved decision-review snapshots and candle/context summaries.
3. Product-safe read models derived from saved data.
4. Sample/mock data only when no saved data exists, or when the route clearly
   labels the section as a preview.

Do not mix sample data into a saved-data route without a visible explanation.
If a route has saved trades but shows only one trade or sample metrics, treat it
as a route data-source bug and fix or park it explicitly.

## Parked Work Format

When a local blocker is parked, record it in the project log using this shape:

```text
Parked item:
- Area:
- Why parked:
- Safe work continued:
- Resume trigger:
- Risk if ignored:
```

Keep parked notes short. Do not turn every minor TODO into a blocker; use this
only when the next person would otherwise repeat the same investigation.

## Continuous Run Definition Of Done

A long run is considered complete only when it leaves the app better for a real
end user, not merely cleaner internally.

For each meaningful route touched, verify:

- the first screen tells the user what to do next,
- the route uses saved import data when saved data exists and does not silently
  fall back to sample/mock data,
- beginner-facing copy avoids raw engine/internal terms,
- advanced or diagnostic details are collapsed or moved lower,
- charts/cards explain what they mean in plain language,
- buttons use action language such as `Open Trade Review`, `Review This Trade`,
  or `Check Analytics`,
- repeated same-symbol rows are explained as round trips or ticker stories,
- short-side imports are not marketed as a supported short-trading product,
- mobile layout has no obvious overflow,
- the route has at least one focused regression assertion when structure
  changes materially.

If the run changes product behavior, also update docs/log with the new resume
point and the best next step.

## Design Acceptance Criteria

The target UI should feel like a trader-facing review product inspired by the
clarity of trading journal dashboards, not a backend control panel.

Good enough for the next pass means:

- light app surface with restrained dark accents, not black-card sprawl,
- red and green used consistently for loss/risk and gain/strength,
- charts visible near the decision they support,
- dense data separated into clear sections or left-side navigation,
- one primary action per page or major workflow section,
- no long walls of same-weight cards,
- no raw states or technical labels in normal reading flow,
- explanations written for a new trader without talking down to advanced users.

When improving a page, prefer the following order:

1. Clarify the main user question.
2. Add or improve the visual hierarchy.
3. Add chart/graph support if the data exists.
4. Move advanced details down or behind disclosure.
5. Add focused verification.

## Data Correctness Acceptance Criteria

Data presentation should be conservative and explain uncertainty clearly.

- Flat-to-flat round trips remain the accounting unit.
- Ticker stories sit above round trips and explain same-symbol re-entries.
- Fully closed same-day re-entry should be called a new round trip inside the
  same ticker story.
- Re-entry that remains open past the day-trade window should be flagged as an
  open or swing/overnight review issue when the data supports it.
- If candle, volume, level, or market-context evidence is missing, show what to
  check next instead of making a claim.
- If direction data implies a short or starts with sell-side inventory, keep
  the end-user wording neutral because short-side coaching is not a supported
  product surface yet.
- Do not change importer contracts until the UI/read-model layer proves a clear
  product need and tests describe the expected behavior.

## Do Not Spend Time On Yet

Until the core user-facing app is clear and useful, avoid spending long runs on:

- auth,
- billing,
- deployment,
- new backend persistence,
- rewriting the importer,
- broker import overbuild,
- admin/debug dashboards,
- raw engine tuning that does not improve the user-facing review flow,
- marketing or SEO pages.

If one of these areas appears necessary, first try to solve the user-facing
problem with existing saved data, mock-backed UI, read models, or collapsed
advanced sections.

## Run 1: Re-Entry Story Evidence And Chart/Volume Context

**Goal:** Make ticker stories explain not only that a re-entry happened, but
what changed and what to review.

### 1.1 Connect Available Chart Context

Inspect saved decision-review snapshots and candle/context outputs to see what
safe product facts already exist.

Look for:

- volume at first entry vs re-entry,
- volume trend during second entry,
- level location at first entry vs re-entry,
- whether re-entry happened after a level break,
- whether re-entry happened after momentum faded,
- whether re-entry happened after a failed push,
- whether re-entry held past planned day-trade window.

Add only factual, evidence-backed read-model fields. If the data is missing,
show "Chart context to check" rather than making a conclusion.

### 1.2 Add Thread Context Evidence Types

Extend ticker-story evidence with safe categories:

- `profit_giveback`
- `reentry_added_profit`
- `reentry_still_open`
- `day_trade_turned_swing`
- `reentry_time_gap`
- `reentry_more_complex`
- `volume_context_available`
- `volume_context_waiting`
- `level_context_available`
- `level_context_waiting`
- `momentum_context_waiting`

Each evidence item must include:

- title,
- plain detail,
- review action,
- evidence source,
- tone: danger, warning, success, info.

### 1.3 Improve Ticker Story UI

On `/trades`:

- Show story type, lifecycle, total story P/L, giveback, open/swing state.
- Add filter controls:
  - All ticker stories,
  - Re-entry gave back profit,
  - Day trade turned swing,
  - Open re-entry,
  - Re-entry added profit,
  - Needs chart context.
- Keep full saved trade list below.
- Do not hide the round-trip cards.

On `/trades/[tradeId]`:

- Add "This trade is part of a ticker story" near the top.
- Show related round trips with:
  - first push,
  - re-entry 1,
  - re-entry 2,
  - current marker,
  - P/L,
  - time gap,
  - open/closed/swing state.
- Add a "Review the story" question before diagnostics.

### 1.4 Tests

Add tests for:

- same-day closed re-entry with giveback,
- same-day re-entry that added profit,
- open re-entry,
- day trade turned swing,
- chart context missing,
- chart context present if safe snapshot data exists,
- banned product phrases absent.

## Run 2: Coach As A Guided Coaching Session

**Status:** Overall-focus and first follow-through passes are implemented.
This section remains active for the current coaching-continuation batch, but do
not restart the old single-trade-first rebuild or the completed overall-focus
reframe. Use this section with
`src/docs/trader-intelligence-coach-continuous-product-plan-2026-05-09.md` to
continue the loop: overall focus -> evidence trade -> writing/checklist ->
review completion -> progress follow-through.

**Goal:** Make `/coach` feel like an overall trading coach that reviews the
user's saved trade history, identifies the most important recurring behavior or
strength, and then uses individual trades as evidence.

Hard acceptance rule:

- `/coach` must lead with one overall coaching focus across saved trades:
  one main behavior or strength, occurrence/evidence context, why it matters,
  and one fix-first action.
- A single trade can be the best evidence trade or the next trade to review,
  but it should not be presented as the whole coaching experience unless the app
  does not yet have enough saved/reviewed data to build an aggregate focus.
- The first screen should make the coaching session obvious without requiring
  the user to understand analytics, diagnostics, pattern IDs, or internal
  scoring.
- Supporting data can exist below the session flow, but it must not compete
  visually with the primary coaching path.
- Do not use literal daily wording unless the data truly represents the current
  trading day. Users may import trades at the end of a week, month, or catch-up
  period.

### 2.1 Coach Flow Reference

Keep the top of `/coach` organized around:

1. "Start here"
2. "Current Coaching Focus"
3. "Why it matters"
4. "Fix first"
5. "Trades to review next"
6. "Open the evidence trade"
7. "Track progress"

Keep evidence panels lower than the overall focus, and keep
advanced/supporting sections collapsed or visually secondary.

Rename or replace:

- "Today's review card" -> "Current Review Plan" or "Review Session"
- "What to work on today" -> "Current Coaching Focus"
- "Review one trade" as the top page concept -> "Trades To Review Next" below
  the overall coaching focus.

### 2.2 Coach Card Reference

Use or refine components such as:

- `CoachStepPanel`
- `CoachEvidenceCard`
- `BehaviorPatternCard`
- `FixFirstActionCard`
- `RepeatThisCard`
- `AvoidThisCard`

Each card should answer:

- what the trader did,
- why it mattered,
- what evidence supports it,
- what to do next.

Add or refine an aggregate focus card before individual-trade cards. It should
answer:

- what pattern appears across saved trades,
- how many trades support it,
- what result/cost/protected-profit cue is available,
- which trade is the best evidence,
- what to fix first.

Current guardrail:

- The aggregate focus card already exists. Do not rebuild it first. Only refine
  this area if browser QA shows a specific problem or if the evidence-trade
  handoff exposes missing copy/links.

### 2.3 Beginner Language

Replace confusing labels:

- "Archetype" -> "Current Pattern"
- "Top Severity" -> "Most Expensive Habit"
- "Mistake To Rule" -> "Rule To Create"
- "Rule Candidate Lab" -> advanced
- "Rule Simulations" -> advanced
- "Confidence Language" -> advanced

### 2.4 Visuals

Add at least two simple visuals:

- behavior impact or protected-profit chart,
- wins/losses behind the current coaching point,
- session/time-of-day chart for the behavior if available.

### 2.5 Tests

Assert:

- `/coach` shows "Start here" and "Fix first",
- it shows "Current Coaching Focus" before the featured evidence trade,
- it links to one specific trade as evidence or next review work,
- it avoids literal daily wording unless the data is truly current-day scoped,
- it shows a "Trades To Review Next" or review-backlog preview when saved queue
  data exists,
- no raw internal terms appear in the primary UI,
- empty state says to save one broker CSV.

## Run 3: Review Queue As A Real Work Queue

**Status:** First queue-card implementation pass is complete. Use this section
together with
`src/docs/trader-intelligence-review-queue-continuous-product-plan-2026-05-09.md`
for follow-up handoff, mobile density, lane-language, and technical-collapse
work after the coach evidence-trade handoff pass.

**Goal:** Make `/review` feel like a queue of work, not a status report.

### 3.1 Queue Structure

Page order:

1. Review this first.
2. Queue lanes.
3. Saved review items.
4. Lesson/playbook material.
5. Advanced technical limits.

### 3.2 Lane Language

Use:

- Highest Priority
- Chart Context Waiting
- Open Trades
- Needs Technical Follow-Up
- Reviewed With Chart Context

Avoid:

- raw diagnostic buckets,
- analysis_failed,
- market_context_unavailable,
- blocked_open_trade.

### 3.3 Queue Item UX

Every queue item should show:

- symbol,
- session/date,
- why it is in the queue,
- what to review,
- current evidence,
- button: "Open Trade Review."

### 3.4 Tests

Assert:

- primary queue item visible,
- lane labels are user-facing,
- each visible item has an action,
- technical/diagnostic content is collapsed.

## Run 4: Trade Detail As The Main Review Workspace

**Goal:** Make `/trades/[tradeId]` the place a trader actually writes and
understands the review.

### 4.1 Above The Fold

Show:

- symbol,
- date/session,
- gross P/L,
- trade lifecycle,
- chart context status,
- ticker story status,
- primary next action,
- checklist progress.

### 4.2 Trade Replay

Improve visual replay:

- clearer horizontal timeline,
- buy/add/reduce/exit markers,
- position size bars,
- realized P/L progress,
- current/related ticker-story markers,
- open/swing warning when relevant.

### 4.3 Writing Flow

Make note-taking obvious:

- "What happened?"
- "What behavior mattered?"
- "What will I do next time?"
- "What evidence supports this?"

Persist existing review actions/notes if the current route already supports
them. Do not add backend persistence unless already available.

### 4.4 Similar Trades

Make similar-trade cards easier to understand:

- "Similar because..."
- shared behavior,
- outcome,
- link to open review.

### 4.5 Tests

Assert:

- trade detail shows trade replay,
- ticker story context appears for multi-round-trip trades,
- review question/fix-first action appear,
- notes/actions remain available,
- mobile has no horizontal overflow.

## Run 5: Saved Trades Navigation And Grouping

**Goal:** Make `/trades` a useful browsing surface for real imported trade
history.

### 5.0 Saved Trade Grouping Audit

Before adding more controls, verify what repeated same-symbol rows actually
represent.

Check whether repeated rows are:

- true duplicate saved trades,
- separate flat-to-flat round trips,
- multiple executions inside one round trip,
- same-symbol re-entries inside one ticker story,
- open trades that carried across sessions,
- grouping artifacts caused by import or report joins.

If duplicate saved records exist, document the source and avoid hiding the issue
with UI filters. If rows are legitimate round trips, explain them clearly and
link them into ticker stories. If the cause is uncertain, park destructive
dedupe work and continue with non-destructive labeling and grouping.

### 5.1 View Modes

Add view controls:

- Round Trips
- Ticker Stories
- Day View
- Open/Swing
- Needs Review

Default can remain current card view, but users should understand why repeated
same-symbol rows exist.

### 5.2 Filters

Add or refine:

- symbol search,
- date/session filter,
- P/L filter,
- open trades,
- swing/overnight,
- chart data still missing,
- reviewed/unreviewed.

### 5.3 User Explanation

Add one small explanation:

> Round trips show each flat-to-flat trade. Ticker stories group same-symbol
> re-entries so you can review whether later attempts helped or hurt the
> original idea.

### 5.4 Tests

Assert:

- repeated symbols can be viewed as a ticker story,
- round-trip cards remain accessible,
- filter labels are plain,
- no short-coaching copy appears.

## Run 6: Analytics Report Polish

**Goal:** Keep improving `/analytics` from "better" to "credible trader report."

### 6.1 Page Organization

Left nav sections:

- Overview
- P/L
- Sessions
- Time of Day
- Behaviors
- Ticker Stories
- Trade List
- Advanced

### 6.2 Visuals

Strengthen:

- P/L curve,
- outcome mix,
- P/L by session,
- P/L by entry hour,
- behavior risk counts,
- ticker story giveback chart,
- best/worst trade cards.

### 6.3 Reduce Sloppy Lower Sections

After the first analytics cards, avoid mixed-density piles. Each section should
have:

- one heading,
- one sentence,
- one main visual/table,
- one action.

### 6.4 Tests

Assert:

- charts render above the fold,
- section nav exists,
- no horizontal overflow,
- user-facing route avoids banned phrases.

## Run 7: Progress Page

**Goal:** Make `/progress` reflect real saved imports and feel useful.

### 7.1 Saved Data

Verify `/progress` always uses saved import data when available.

### 7.2 Progress Concepts

Show:

- reviewed trades,
- repeated behavior count,
- fixed/reduced behavior count if available,
- current focus rule,
- progress by week/session,
- open review items.

### 7.3 Empty State

If not enough trades:

> Save a broker CSV and complete a few reviews to unlock progress tracking.

### 7.4 Tests

Assert:

- saved trade count is reflected,
- sample fallback is only shown when no saved import exists,
- progress route uses plain copy.

## Run 8: Visual Design System Pass

**Goal:** Make all core routes feel like the same app.

### 8.1 Shared Components

Consolidate:

- metric cards,
- primary action panels,
- chart cards,
- evidence cards,
- status badges,
- side nav,
- advanced disclosure,
- empty states.

### 8.2 Color Rules

Use:

- green: gains, strengths, completed/protected,
- red/rose: losses, giveback, high-risk behavior,
- amber: caution, waiting, incomplete,
- blue/cyan: focus/current/chart context.

Avoid:

- black card sprawl,
- one-note dark gray,
- giant text blocks in compact cards,
- decorative gradients/orbs.

### 8.3 Responsive Rules

Check:

- mobile no overflow,
- text fits,
- charts remain readable,
- side nav collapses or stacks cleanly,
- buttons are tap-friendly.

## Run 9: Copy QA And Safety

**Goal:** Make language clearer and safe across the app.

### 9.1 Routes

Audit:

- `/workspace`
- `/import-dry-run`
- `/imports`
- `/trades`
- `/trades/[tradeId]`
- `/review`
- `/coach`
- `/analytics`
- `/progress`

### 9.2 Replace Internal Terms

Avoid in primary UI:

- saved_sqlite,
- sample fallback,
- fixture,
- diagnostic,
- analysis_failed,
- market_context_unavailable,
- blocked_open_trade,
- raw json,
- job,
- readiness score.

### 9.3 Approved Language

Use:

- saved import data,
- sample data until you save an import,
- execution review,
- trade replay,
- chart data still missing,
- evidence-backed review,
- saved review queue,
- trade management feedback,
- performance insights,
- mistake tracking.

### 9.4 Tests

Add or update copy-safety tests for primary routes.

## Run 10: Verification And Regression Harness

**Goal:** Keep the app from regressing while the UI changes quickly.

### 10.1 Required Commands

Run after meaningful changes:

```powershell
npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts
npx tsc --noEmit --pretty false
npm run build
```

Run route-specific Playwright when UI structure changes:

```powershell
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"
```

When working a batch, add or run focused assertions for the routes touched:

- coaching batch: `/coach`, `/trades/[tradeId]`, `/review`, `/progress`,
- data browsing batch: `/trades`, `/trades/[tradeId]`, `/analytics`,
- reporting batch: `/analytics`, `/progress`, `/coach`,
- polish batch: changed shared components plus every route they affect.

Assertions should verify the user-facing text and workflow, not only that the
route returns 200.

### 10.2 Localhost Smoke

After build, restart localhost with replay settings and smoke:

- `/workspace`
- `/trades`
- one `/trades/[tradeId]`
- `/review`
- `/coach`
- `/analytics`
- `/progress`

### 10.3 Saved Data Verification

For saved-data routes, verify they reflect the current saved import instead of
stale sample data.

Check:

- `/trades` shows the saved trade count and at least one real saved symbol,
- `/analytics` aggregates all saved trades, not only one visible trade,
- `/progress` reflects saved import counts or clearly explains why progress
  cannot be calculated yet,
- `/coach` links the user to one specific saved trade when saved trades exist,
- sample-data language appears only when no saved import exists or when the
  route explicitly says it is previewing a sample.

If a saved-data assertion fails, treat it as a product bug for that route. Park
destructive data repair, but continue with non-destructive route fixes where
possible.

### 10.4 Screenshot Review

For visual/UI work, capture or inspect desktop and mobile route screenshots.

Required routes after broad UI changes:

- `/coach`,
- `/review`,
- `/trades`,
- one `/trades/[tradeId]`,
- `/analytics`,
- `/progress`.

Screenshot review should check:

- no obvious horizontal overflow,
- no black-card sprawl returning,
- charts are visible near their related explanation,
- first screen has one clear primary action,
- metric-card copy is not too long for the card,
- red/green/amber/blue meanings are consistent,
- advanced/internal sections do not dominate the page.

If screenshots show visual problems on one route, fix that route if the cause is
clear. If one screenshot issue is local and another route can still improve,
park the local issue and continue the batch.

### 10.5 Copy Safety

Assert banned product phrases are absent:

- financial advice,
- signals,
- trade calls,
- guaranteed profits,
- short-seller coaching.

## Suggested Execution Order

Use this order unless the user redirects:

1. Start with the current next-run execution plan:
   `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`.
   The detection/language plan is now the evidence-gating reference, not a
   reason to redo completed baseline work.
2. Treat Run 1.1 as complete enough for the current UI pass. Park remaining
   chart/volume enrichment unless it directly blocks safe coaching, review, or
   ticker-story copy.
3. Continue analytics/coach presentation polish using certified read models.
4. Improve `/review`, `/trades/[tradeId]`, and `/progress` only for missing
   anchors, mobile density, visual readability, or a newly certified evidence
   family.
5. Improve `/progress` behavior-trend depth once more reviews are marked
   complete.
6. Add `/trades` day/session/symbol filters if browsing remains too dense.
7. Do cross-route visual system cleanup.
8. Do copy QA.
9. Strengthen regression coverage.

When one item is complete and verified, immediately start the next item unless
one of the stop conditions applies.

If an item in this sequence is locally blocked, skip forward to the next
independent item and keep the work block moving. Do not wait for user approval
unless the blocker is global under the autonomy rules above.

## Long Continuous Run Checklist

Use this checklist when the user asks to keep going without repeated prompts.

Work through as many blocks as practical in one run. A blocker inside one block
does not block the other blocks unless it changes shared contracts, saved-data
integrity, or product safety.

## Long Run Batch Strategy

When starting a long implementation run, choose one batch and carry it as far as
practical before stopping.

Preferred batches:

- **Coaching Product Session batch:** `/coach` smoke ->
  `/trades/[tradeId]` -> `/review` -> `/progress`, with `/analytics` only for supporting
  charts.
  Use when the problem is coaching flow, review language, evidence
  presentation, or the user not knowing what to do next. This is the next
  major product-flow batch after the current Detection And Language Hardening
  Batch. Do not treat it as active until user-facing behavior labels are
  inventoried, gated, and routed through the fail-closed mapper.
- **Trade Review Workspace batch:** `/trades/[tradeId]` -> `/review` ->
  `/coach` -> `/progress`, with `/trades` as the source route.
  Use when the problem is the end-to-end flow for understanding, writing,
  finishing, and tracking one saved trade review. The first implementation pass
  is complete; keep it as the reference flow for coach evidence links.
- **Data browsing batch:** `/trades` -> `/trades/[tradeId]` -> `/analytics`.
  Use when the problem is repeated tickers, round trips, ticker stories, open
  trades, or swing detection.
- **Reporting batch:** `/analytics` -> `/progress` -> `/coach`.
  Use when the problem is charts, combined stats, performance insight, or
  progress tracking.
- **Polish batch:** shared app UI -> route cards/charts/badges -> copy tests.
  Use when the app feels visually inconsistent or too internal.

Inside a batch:

1. Inspect the current route output and available read models.
2. Confirm whether the route is using saved imports, saved review snapshots, or
   sample/mock data.
3. Improve the route that creates the clearest user value first.
4. Carry any reusable component or copy cleanup into the next route in the
   batch.
5. Add or update focused tests before moving too far.
6. If a route is locally blocked, park it and continue to the next route in the
   batch.

## Feature-Specific Follow-Up Plans

Use this continuous UX/product plan as the active top-level roadmap. When a
route-specific batch is complete, use these feature plans as the next detailed
working docs:

- `src/docs/trader-intelligence-analytics-continuous-product-plan-2026-05-09.md`
  for `/analytics` report layout, chart hierarchy, drill-downs, saved-data
  correctness, and trader-readable metric explanations.
- `src/docs/trader-intelligence-coach-continuous-product-plan-2026-05-09.md`
  for `/coach` overall coaching focus, review-session language, trades-to-
  review queue, evidence trade handling, and advanced-section demotion.
- `src/docs/trader-intelligence-review-queue-continuous-product-plan-2026-05-09.md`
  for `/review` queue flow, lane language, coaching handoff, evidence links,
  and beginner-friendly review work orders.
- `src/docs/trader-intelligence-progress-continuous-product-plan-2026-05-09.md`
  for `/progress` behavior tracking, completed-review progress, imported-vs-
  reviewed trade separation, and coaching follow-through.

These files are not a reason to bypass the active Detection And Language
Hardening Batch. They exist so future runs can carry the same product lessons
into each major feature without turning this top-level plan into an unworkable
mega-document.

### Block A: Overall Coach Guided Session

- Make `/coach` read like an overall trading coach from top to bottom, not a
  diagnostic report and not a single-trade review page.
- The first screen should answer, in this order:
  - current coaching focus across saved trades,
  - how often it appears or how much evidence supports it,
  - why it mattered,
  - the one fix-first action,
  - which saved trade is the best evidence,
  - where to open the replay or write the review,
  - which trades are next in the review backlog.
- Add clear coaching stages:
  - Start here,
  - Current Coaching Focus,
  - Why it mattered,
  - Fix first,
  - Trades To Review Next,
  - Open evidence,
  - Track progress.
- Add stronger visual support near the coaching point:
  - behavior impact or protected-profit chart,
  - behavior count chart,
  - win/loss or outcome mix when it clarifies the point,
  - red/green P/L or giveback/protection cueing,
  - review queue progress,
  - one featured evidence trade card,
  - short review queue preview.
- Add "what this means" explanations for new traders:
  - chasing,
  - adding into weakness,
  - premature exit,
  - poor profit protection,
  - strong profit protection,
  - structured execution,
  - needs more data.
- Keep the coaching language evidence-backed:
  - name the trade, replay, timing, review queue, or saved behavior evidence,
  - never imply a buy/sell recommendation,
  - never claim guaranteed improvement,
  - never present short-specific coaching in the end-user UI.
- Move or soften internal support panels:
  - rule labs,
  - simulations,
  - confidence language,
  - pattern memory,
  - raw behavior IDs,
  - scoring traces,
  - suppressed behavior IDs,
  - normalization details.
- If saved trades exist, do not lead with mock/sample coaching. If saved trades
  are missing, show a plain empty state: "Save one broker CSV to unlock
  coaching from your own trades."
- Do not use "today" wording unless the data really represents the current
  trading day. Prefer "Current Coaching Focus", "Current Review Plan",
  "Review Session", "Trades To Review Next", and "Review Backlog".
- Verify with focused Playwright from both perspectives:
  - engineer: saved-data route, anchors, no raw/internal terms, no banned
    product claims,
  - end user: one clear session path, understandable labels, no card dump, no
    mobile overflow.

### Block B: Review Queue

- Keep `/review` as a queue of work. The first queue-card pass is complete, so
  do not rebuild it unless browser QA shows a clear usability issue:
  - Review this first,
  - lanes,
  - saved review items,
  - completed/context-ready items,
  - technical limits collapsed.
- Follow-up work should be limited to coaching handoffs, mobile density, lane
  language, and missing anchors that support the `/coach` loop.
- Every item should continue to show:
  - why this is in the queue,
  - what to review,
  - what evidence exists,
  - action to open the trade.
- Add copy tests or Playwright assertions for lane labels.

### Block C: Trade Detail Workspace

- Make `/trades/[tradeId]` the main review workspace.
- Improve:
  - visual trade replay,
  - ticker-story evidence,
  - notes/actions placement,
  - similar trades,
  - chart-context status,
  - open/swing warnings.
- Keep diagnostics lower and collapsed.

### Block D: Saved Trades Browser

- Improve `/trades` browsing:
  - round-trip vs ticker-story explanation,
  - ticker-story filters,
  - view modes if practical,
  - symbol/date/session filters if low-risk,
  - open/swing/needs-context filters.
- Keep individual round trips accessible.

### Block E: Analytics And Progress

- Continue `/analytics` lower-page cleanup:
  - fewer sloppy stacked sections,
  - clearer section nav,
  - ticker-story analytics,
  - giveback/re-entry visuals.
- Improve `/progress`:
  - saved-data progress,
  - reviewed trade count,
  - active focus rule,
  - repeated behavior trend,
  - clear empty state.

### Block F: Cross-Route Polish

- Apply consistent cards/charts/badges across:
  - `/workspace`,
  - `/trades`,
  - `/trades/[tradeId]`,
  - `/review`,
  - `/coach`,
  - `/analytics`,
  - `/progress`.
- Remove primary UI wording that sounds like debug/admin tooling.
- Add/adjust regression tests.

### Verification At End Of A Long Run

Run at minimum:

```powershell
npx tsc --noEmit --pretty false
npm run build
```

Run focused tests touched by the work, for example:

```powershell
npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts
npx playwright test tests/e2e/app-feature-regression.spec.ts -g "coach|review|trade" --project=chromium-desktop
```

Restart localhost and smoke the routes changed.

Also perform the saved-data and screenshot checks from Run 10 for the routes
touched in the batch. At minimum, confirm that `/trades`, `/analytics`,
`/progress`, and `/coach` are using saved imports or clearly explaining when
they cannot.

If one verification command fails:

- capture the failing command in the project log,
- fix it immediately if the cause is clear,
- if the cause is isolated, continue with unaffected tests and routes,
- stop only if the failure makes the app state unreliable or further work would
  make the problem harder to diagnose.

## Historical Product-Flow Context

This section is now historical context for the product-flow work. The current
active execution plan is:

- `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`

The next active run should start with detection/language leak search,
behavior-contract hardening, evidence-channel gates, and certified strengths
before continuing into route-level wiring.

The first implementation pass of the **Trade Review Workspace Batch** is
complete enough to use as the evidence foundation for later coaching work.

The **Coaching Product Session Batch** should resume after the active
detection/language gates are safe, unless browser QA finds a clear coach
regression during the next-run smoke checks.

Primary implementation route for the next product-flow run after the active
detection/language run:

- `/coach`

Product center of gravity after detection/language hardening:

- `/coach`

Adjacent routes to carry improvements into:

- `/review` for the queue cards and coaching handoff,
- `/trades/[tradeId]` for replay and writing anchors,
- `/progress` for follow-through tracking,
- `/analytics` only when a small chart or report link directly supports the
  coaching point.

Completed foundation from the first Trade Review Workspace pass:

- selected a representative saved OMEX trade from the current saved import,
- improved `/trades/[tradeId]` replay, position movement, P/L progression, and
  writing-workspace placement,
- moved notes/checklist actions closer to the review prompt,
- carried useful trade-detail anchors into `/review`, `/coach`, and
  `/progress`,
- verified the changed flow with typecheck, build, focused Playwright, mobile
  route checks, visual smoke, and localhost smoke.

Do not redo that same first pass unless a visual/browser review shows a clear
regression.

### Historical Next Product-Flow Batch: Coaching Product Session Continuation

Goal:

- Keep `/coach` as the lead feature while carrying its coaching flow into the
  adjacent routes that make the coaching experience work:
  `/trades/[tradeId]`, `/review`, `/progress`, and small `/analytics` links only
  when they directly support the coaching point.

Current status:

- The first-screen `/coach` overall-focus reframe is complete enough for the
  next continuation and should not be restarted.
- The coach now leads with "Your Trading Coach" and a "Current Coaching Focus"
  card before the evidence trade.
- A shared coach follow-through model now separates saved imports, finished
  reviews, review backlog, and insufficient-data progress states.
- `/coach` and `/progress` use that follow-through model so the user can see
  why importing many trades does not automatically mean progress has been
  measured.
- `/progress` now caps the execution-quality trend preview and links to saved
  trades or analytics for the full list instead of rendering every saved trade
  inline.
- Lower `/coach` tool cards for rules, compare, and onboarding have been moved
  behind supporting coach details so the default path is less random.
- The trade-detail review note box now carries the coaching prompt into the
  evidence trade: what happened, what behavior mattered, and the fix-first rule.
- The lower `/coach` sections now have proof and next-session grouping.
- `/trades/[tradeId]` now uses safer source labels in evidence surfaces.
- `/review` saved queue cards now match the same coaching order:
  symbol/result, why it is here, what to review, evidence, `Open Trade Review`,
  replay, and collapsed technical limits.
- `/coach` has a first compact "Trades To Review Next" preview and `/review`
  plus `/progress` now link back to the coaching focus anchor.
- The coach evidence-trade handoff is now implemented: `/coach` selects an
  evidence trade related to the current focus, carries the focus into
  `/trades/[tradeId]`, and the trade page explains how to finish the review and
  return to coach/progress.
- `/review` and `/progress` now have explicit handoff links in the same loop:
  review work order -> progress follow-through, and progress active focus ->
  coach/review.
- The deeper `/coach` lower-page reduction is complete: the default coach page
  now has a `Before Next Session` plan and hides duplicate/heavy supporting
  checks behind one supporting-details disclosure.
- Featured coach evidence cards now answer what happened, why it mattered, and
  what to do next.
- `/trades/[tradeId]` now keeps replay/checklist/notes/chart/ticker/session
  handoffs visible while collapsing optional score explanation, supporting
  evidence, behavior timeline, similar trades, and journal prompts.
- The next high-value work is not to restart the first-screen coach rebuild,
  redo the review queue card shape, rebuild progress follow-through, redo the
  coach -> trade-detail handoff, or redo the new collapsed support sections.
  It is screenshot-led visual/mobile polish for the changed coach and
  trade-detail surfaces, then `/analytics` lower-page polish or route
  copy/anchor repairs when QA shows concrete friction.

End-user questions the page must answer before lower analytics:

1. What is the main recurring behavior or strength across my saved trades?
2. How often is it showing up, or how much evidence supports it?
3. Why did it matter to my result or decision quality?
4. What one fix-first action should I take?
5. Which trade is the best evidence?
6. Which trades should I review next?
7. Where do I open the replay and write the review?
8. How will progress show whether this focus is improving?

Implementation checklist:

Completed in the first coaching-session pass:

- inspected `/coach` with saved import data,
- confirmed saved imports drive the route when they exist,
- reused the highest-priority saved review item as the featured evidence case,
- rebuilt the first screen into a coaching session path:
   - start coaching,
   - replay the evidence trade,
   - name the behavior or strength,
   - explain why it mattered,
   - write the fix-first rule,
   - check repeats,
   - track progress,
- added trader-readable behavior explanation and why-it-mattered copy,
- added compact visuals for:
   - behavior count,
   - behavior impact or protected profit,
   - review queue/progress state,
- started consistent color meaning:
   - red for loss, risk, giveback, or problem behavior,
   - green for gain, strength, protected profit, or repeatable behavior,
   - amber for needs attention,
   - blue/neutral for navigation, context, or unavailable information.

Continue from here:

1. Work from
   `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`.
   Use the detection/language hardening plan only as the evidence gate when a
   new behavior claim appears.
2. Keep `/coach` stable and smoke it only to confirm the current overall focus,
   focused evidence trade, trades-to-review preview, progress follow-through,
   `Before Next Session` plan, and supporting-details disclosure still render
   correctly.
3. Inspect screenshots before changing `/coach` again. Touch it only for
   visible density, mobile overflow, unclear copy, or handoff regressions.
4. Inspect `/trades/[tradeId]` screenshots for the collapsed supporting-details
   section and mobile reading order. Keep replay, checklist, notes, and
   chart/ticker/session handoffs prominent.
5. Continue into `/analytics` lower-page polish when coach/trade detail are
   visually stable.
6. Add only contextual handoffs:
   - `/review` item -> `/trades/[tradeId]#writing-flow`,
   - trade writing flow -> coach session where useful,
   - `/coach` -> `/progress` when it explains follow-through,
   - avoid generic page dumping.
7. Keep `/progress` focused on imported history vs finished reviews. Add deeper
   trend logic only after completed-review history exists.
8. Collapse or demote advanced/internal material:
   - rule labs,
   - simulations,
   - confidence language,
   - pattern memory,
   - raw behavior IDs,
   - scoring traces,
   - suppressed behavior IDs,
   - normalization details.
9. Add or update focused tests for:
    - one obvious coach primary action,
    - overall coaching focus appears before single-trade evidence,
    - no literal daily wording unless the data is actually current-day scoped,
    - trades-to-review queue preview is present when saved queue data exists,
    - featured trade evidence and trade-detail anchors,
    - trade-detail writing flow explains what to write and how completion
      feeds coaching/progress,
    - review queue cards use the coaching order,
    - no raw/internal diagnostic terms in default coach UI,
    - no banned product claims,
    - saved-data empty state,
    - mobile usability.
10. Run verification:
    - focused coach/review/progress Playwright,
    - `npx tsc --noEmit --pretty false`,
    - `npm run build`,
    - localhost smoke for `/coach`, `/review`, `/progress`, and the featured
      `/trades/[tradeId]` anchor.

### Continuous Work Ladder For The Next Run

This is the next run ladder. Do not stop after one route-sized improvement if
the repo still has clear, safe work remaining in this ladder.

Work in this order:

1. Reorientation and copy/evidence safety scan
   - Use
     `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
     as the evidence-gating reference, not as a reason to redo completed
     baseline work.
   - Re-run a quick leak scan for behavior labels that can reach primary UI.
   - If a new label appears, classify it as certified detection, review prompt,
     or internal signal before it can drive a primary conclusion.
   - If no new behavior claim appears, continue directly into coach/analytics
     presentation polish.
2. `/coach` current-state smoke
   - Open the saved-data coach page.
   - Confirm the page still leads with an overall coaching focus, one reason,
      one fix-first action, focused evidence trade, trades-to-review preview,
      `Before Next Session` plan, collapsed supporting details, and progress
      follow-through.
   - Treat a missing overall focus as a regression, not as the normal first
      implementation task.
   - Do not rebuild the coach first screen unless the smoke check finds a clear
      regression.
3. Coach/analytics behavior-language presentation
   - Use
     `src/docs/trader-intelligence-behavior-language-and-detection-audit-2026-05-09.md`.
   - Replace any newly discovered awkward/internal labels in primary UI with
     trader-facing labels.
   - Explain behaviors in the form:
     `what happened -> why it mattered -> what to review -> fix first`.
   - Move detection mechanics into advanced/collapsed copy.
   - Add regression tests only when this run changes route-facing labels or
     behavior contracts.
4. `/coach` lower-page grouping
   - Move rule labs, simulations, confidence language, and other advanced
      analysis behind collapsed sections when they are still too prominent.
   - Keep proof, next-session plan, and evidence cards readable for newer
      traders.
   - Refine "Trades To Review Next" only if the handoff check shows the current
      preview is unclear.
5. `/review` and `/progress` regression-only handoff check
   - Do not rebuild the queue-card shape or progress follow-through unless
      browser QA shows a clear regression.
   - Confirm `/review` still links to the trade writing flow, coach focus, and
      progress follow-through.
   - Confirm `/progress` still links to coach focus and the review queue.
6. `/trades/[tradeId]` regression-only handoff check
   - Do not rebuild the coach handoff unless browser QA shows a regression.
   - Confirm coach-sourced trade URLs still show the "Coach Handoff" and "After
      Saving This Review" panels.
   - Keep technical review limits collapsed.
7. Visual/readability sweep
   - Compare `/coach`, `/review`, `/trades/[tradeId]`, and `/progress` at
     desktop and mobile widths.
   - Shorten long card copy.
   - Use red/green/amber/blue consistently.
   - Keep important actions above advanced/detail sections.
8. Regression coverage
   - Update tests for every UI contract changed in this run.
   - Prefer focused Playwright on coach/review/progress/trade detail before
     broad suite runs.
9. Verification and logging
   - Run typecheck, build, focused Playwright, and localhost smoke.
   - Update the project log and relevant feature plan statuses.

Continuation rule:

- If a step is blocked by missing data or a risky contract change, park that
  specific item in the project log and continue to the next independent step in
  this ladder.
- Stop only for destructive data operations, importer contract changes,
  architecture choices that would affect multiple layers, or verification
  failures that make the app state unreliable.
- Do not stop just because one route improvement is complete.

Hard acceptance criteria:

- `/coach` has one obvious first action.
- `/coach` leads with an overall coaching focus across saved trades, not a
  single trade as the whole page.
- The next trade to review is clearly framed as evidence or queue work beneath
  the overall coaching focus.
- The coach page does not assume the user imports or reviews trades daily.
- `/review` has one obvious first queue action and does not make the user infer
  what to do from status counts.
- `/review` queue cards follow the coaching order:
  what to review, why it matters, evidence, `Open Trade Review`, then technical
  limits.
- A newer trader can understand the page without knowing internal behavior
  engine terms.
- The coach names the evidence source: trade replay, session timing, review
  queue, saved behavior evidence, or completed review history.
- The coach gives one fix-first action, not a scattered list of equal-priority
  ideas.
- The page uses visuals to support the coaching point, not to overwhelm it.
- Advanced/internal details are collapsed or demoted.
- No primary UI exposes raw pattern IDs, scoring traces, suppressed behavior
  IDs, raw JSON, fixture labels, debug language, or short-specific coaching.
- No product copy says or implies financial advice, signals, trade calls,
  guaranteed profits, or guaranteed improvement.
- Mobile and desktop first screens both show a coherent coaching path.

Deprioritized until the coaching session path is strong:

- broad `/analytics` lower-page redesign,
- deeper `/progress` trend logic beyond coach follow-through,
- importer contract changes,
- saved trade data repair or dedupe,
- deeper candle/volume claims not already supported by saved evidence.

The older Trade Review Workspace acceptance criteria below remain useful as a
reference when tuning or extending the review flow.

The prior Trade Review Workspace run followed one saved trade through the full
review experience and made the connected routes support that flow. Keep the
details below as the acceptance checklist for future refinements.

### Completed Reference: Trade Review Workspace Batch

Goal:

- Make the user path from `/trades` -> `/trades/[tradeId]` -> `/review` ->
  `/coach` -> `/progress` feel like one coherent trade-review workflow.
- Improve the trade-detail page enough that it can become the main place a user
  understands, writes, and finishes a review.

Primary route:

- `/trades/[tradeId]`

Adjacent routes to carry improvements into:

- `/trades`
- `/review`
- `/coach`
- `/progress`
- `/analytics` only if the trade-detail changes expose a report/chart gap

Ready-to-work checklist:

Use this checklist when extending the trade-review workspace again. Do not stop
for another plan review unless one of these checks reveals a real architecture
or safety problem.

1. Read the latest entry in `src/docs/codex-project-log.md`.
2. Read `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
   first. Read this historical product-flow context only when the active
   next-run plan reaches trade-review workspace work.
3. Pick the representative saved trade using the criteria below.
4. Inspect the current `/trades/[tradeId]` output for that trade.
5. Identify the smallest read-model/UI change that improves replay, writing,
   ticker-story context, or note/action placement.
6. Implement that change.
7. Carry resulting anchor/copy updates into `/review`, `/coach`, and
   `/progress` when the same flow depends on them.
8. Add/update focused assertions before broad visual polishing.
9. Run typecheck/build and focused browser checks.
10. If all checks pass and time/context remain, continue to the next item in
    this same batch rather than returning to planning.

Representative saved trade selection:

Before editing UI, choose one real saved trade as the main test case. Prefer a
trade with as many of these properties as possible:

1. saved import data, not sample data,
2. completed round trip,
3. saved decision-review snapshot,
4. belongs to a multi-round-trip ticker story,
5. has non-zero P/L,
6. has multiple executions so replay/position progression is meaningful.

Also inspect one edge case if easy:

- open trade or open re-entry,
- day-trade-to-swing ticker story,
- sell-starting/position-history item.

Do not repair, delete, dedupe, or rewrite those trades. Use them only as
read-only product test cases.

Hard acceptance criteria:

- The first screen of `/trades/[tradeId]` answers:
  - what happened,
  - what to review,
  - what to write down,
  - what evidence is available or waiting.
- Trade replay shows each execution in plain language and makes position-size
  movement visible.
- P/L progression is shown when available and labeled as realized or
  execution-derived. If exact progression is not safely available, show final
  gross P/L only and park the progression field.
- Ticker-story context appears before lower diagnostics when the trade belongs
  to a multi-round-trip story.
- Notes/actions remain reachable without scrolling through advanced details.
- Technical limits stay collapsed or below the human review flow.
- `/review` and `/coach` link to useful anchors on the trade detail page, such
  as replay, writing flow, checklist, or evidence.
- `/progress` explains the difference between saved imported trades and
  completed reviews.
- No primary UI exposes raw engine IDs, raw diagnostics, raw JSON, fixture
  labels, or short-seller coaching language.

Do as much of this batch as practical in one run:

1. Inspect one real saved trade from the current CSV-backed import.
2. Confirm the trade detail page is using saved data, saved review snapshots,
   ticker-story data, and review notes/actions where available.
3. Improve the visual trade replay:
   - clearer buy/add/reduce/exit labels,
   - position-size progression,
   - realized P/L progression when available,
   - open/swing status when relevant,
   - current round-trip marker inside the ticker story.
4. Add or improve the trade-detail writing workspace:
   - what happened,
   - behavior or strength to name,
   - why it mattered,
   - fix first,
   - evidence to check,
   - note/review action placement.
5. Keep ticker-story context near the writing flow:
   - first push,
   - re-entry attempts,
   - giveback/additional-profit evidence,
   - day-trade-to-swing warning when supported,
   - chart data still missing/available wording.
6. Improve similar-trade cards:
   - explain why the trade is similar,
   - show outcome,
   - link to open review,
   - avoid raw pattern IDs or internal labels.
7. Carry the improved trade-detail language back into `/review`:
   - queue items should point to replay, writing, and evidence sections,
   - the primary queue action should land on the most useful anchor.
8. Carry the improved trade-detail language into `/coach`:
   - featured coaching trade should link to the same replay/writing sections,
   - coach should say what trade it wants reviewed and why.
9. Carry the completion/progress connection into `/progress`:
   - make it clear that imported trades are history,
   - finished reviews are progress,
   - unresolved queue items are remaining work.
10. Add or update focused tests:
    - trade detail has replay/writing/ticker-story/evidence sections,
    - review queue links to the useful trade-detail section,
    - coach featured trade links to a real saved trade when saved trades exist,
    - progress reflects saved import counts and review completion.
11. Run verification:
    - `npx vitest run src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts`
    - `npx tsc --noEmit --pretty false`
    - `npm run build`
    - focused Playwright for trade/review/coach/progress
    - mobile route usability for touched routes
    - localhost smoke for `/trades`, one `/trades/[tradeId]`, `/review`,
      `/coach`, and `/progress`.
12. Update `src/docs/codex-project-log.md` with:
    - what changed,
    - verification,
    - parked local blockers if any,
    - next best continuation.

Out-of-scope for this batch:

- importer contract rewrites,
- saved data repair or dedupe,
- new broker import behavior,
- auth/billing/admin surfaces,
- deeper candle/volume claims that are not already supported by saved evidence,
- broad analytics redesign unless needed to support a trade-detail link or
  regression test.

If the trade-detail replay is blocked by missing read-model fields, do not stop
the run. Park the missing field, improve the safe visual/copy pieces that use
existing data, and continue into `/review`, `/coach`, or `/progress`.

Run 1 remaining chart/volume enrichment remains parked unless a specific route
needs it for safe wording. Do not stop this batch just because deeper
candle/volume comparison is incomplete.

After this batch, the likely next continuation is:

- `/analytics` lower-page chart/report polish,
- `/progress` behavior-trend depth,
- cross-route visual polish and copy QA.

Readiness decision:

- As of the 2026-05-10 plan architecture audit, this plan is ready for a
  longer continuous implementation run, but the active next work has moved past
  the first detection/language baseline.
- Continue to use
  `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
  as the active execution ladder, with
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  as the evidence-gating reference when a new behavior claim appears.
- Do not rebuild completed slices: overall coach focus, evidence-trade
  handoff, review-completion follow-through, review queue first card, ticker
  stories, first session-story layer, chart-context bridge, add-quality split,
  after-exit certification, support/resistance exits, re-entry volume
  comparison, protected-profit-before-fade, or strength-to-repeat session
  stories. Also do not rebuild saved-trade pagination, the analytics
  ticker-story summary/evidence-count collapse, the shared mobile page-section
  menu collapse, `/review` queue first-batch limit, or `/progress` chart
  evidence-count collapse unless a regression appears.
- The best next work is now focused screenshot fixes only when a concrete issue
  appears, or a genuinely distinct evidence family only when saved chart,
  level, candle, volume, or after-exit evidence can prove the claim.
- If a route asks for a new behavior statement and the evidence is not strong
  enough, present it as a neutral review prompt or keep it internal.
- Coaching lessons that apply to other features have been split into
  feature-specific follow-up plans for analytics, review queue, and progress.
