# Trader Intelligence Coach Continuous Product Plan

**Status:** Secondary feature plan; use for coach presentation polish and
certified evidence presentation after the completed detection/language
hardening slices
**Last updated:** 2026-05-10

## Purpose

This plan controls the next `/coach` implementation pass.

Current gate:

- The evidence-gating reference is
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`.
- Do not let `/coach` headlines, badges, chart warnings, proof cards, or
  fix-first actions use a behavior unless the detection is certified and routed
  through the shared fail-closed mapper.
- Unknown, unmapped, or uncertified behavior can appear only as a neutral
  review prompt or inside expanded advanced diagnostics.
- Collapsed advanced-section titles and summaries still count as normal UI and
  must use plain trader language.

2026-05-10 planning audit:

- The overall-focus rebuild is complete.
- The evidence-trade handoff from `/coach` to `/trades/[tradeId]` is complete.
- The review-completion/follow-through loop across coach, trade detail,
  review, and progress is complete.
- The first detection/language hardening baseline is complete for the currently
  surfaced behavior families. Adverse-add execution-only copy now stays neutral
  until chart context proves weakness or repair.
- The first screenshot-guided visual pass is complete: shared dashboard
  surfaces are lighter, lower metric copy is shorter, and visible
  `chart-context` hyphenation was removed.
- The deeper lower-page reduction is complete: the coach has a `Before Next
  Session` plan, duplicate supporting checks are collapsed, and featured
  evidence cards answer what happened / why it mattered / what to do next.
- The behavior-map reuse pass is complete: `/coach` now consumes the same
  certified behavior report as `/analytics` and frames grouped market-context
  findings as `Fix first`, `Repeat first`, or `Needs review`.
- User QA found that this pass still looks too much like duplicated analytics.
  Keep the shared report as the evidence source, but redesign the default
  coach presentation so it feels like coaching rather than another analytics
  card grid.
- Do not restart those completed passes. Use this plan next for screenshot-led
  visual/mobile polish and any coach copy regression found by browser/copy QA.

The coach page should feel like an overall trading coach first. It should not
open as if one single trade, such as "Review AVEX next", is the whole coaching
experience.

Individual trades are evidence. The main coach page is the place where the app
looks across the user's saved trades, finds the most important recurring
behavior or strength, explains why it matters, and gives one fix-first action.

The coach must use both evidence channels described in:

- `src/docs/trader-intelligence-coaching-evidence-model-2026-05-09.md`

Those channels are:

- execution evidence from CSV buys/sells and saved trade reconstruction,
- market context evidence from support/resistance levels, candles, volume, and
  chart action before entry, during the trade, and after exit.

Do not make chart-context claims from execution evidence alone. If the app has
only executions, coach execution decisions. If the app has levels/candles,
coach entry location, adds into chart weakness, volume fade, post-exit
continuation, and whether exits protected or missed the move.

## Product Decision

`/coach` should lead with the user's overall trading pattern.

The first screen should answer:

1. What is the main behavior or strength across my saved trades?
2. How often is it showing up?
3. What did it cost me, protect for me, or help me repeat?
4. Why does it matter?
5. What is the one fix-first or repeat-first action?
6. Which trades prove this pattern?
7. Which trade should I review next?
8. How will I track whether this improves?

The single "next trade to review" card should be secondary. It belongs under
the overall coaching focus as evidence or queue work.

## Page Hierarchy

### 1. Overall Coaching Focus

Lead with the aggregate coaching focus:

- current focus,
- plain explanation,
- count of related trades,
- outcome/cost/protected-profit cue,
- risk-to-reduce or strength-to-repeat cue,
- evidence channel: execution-only, market context, or combined,
- confidence or sample-size warning,
- one fix-first or repeat-first action.

Example:

```text
Current focus: Re-entries are giving back earlier profit.
Found in: 12 saved trades.
Why it matters: You often manage the first move well, but later re-entries give
back part of the earlier gain.
Fix first: Before a re-entry, write the exact condition that must be true before
you reopen the trade.
```

### 2. Why This Matters

Explain the behavior in beginner-readable language.

The copy should say what happened and why it affected the user's review, not
what to buy, sell, or predict.

This section should be able to explain positive behavior too:

```text
This is a strength to keep. You reduced risk while the trade was still paying
you, which protected part of the move before the chart faded.
```

Good pattern:

```text
The issue is not that you re-entered. The issue is that the later attempt
changed the trade from a protected first win into a weaker second decision.
Review whether the second entry still had enough reason to exist.
```

### 3. Fix First

Show one action:

- rule to create,
- checklist item,
- review note prompt,
- behavior to stop or repeat next session.

For strengths, the card should become "Repeat first" or "Preserve this" rather
than forcing negative coaching language.

Avoid long lists of equal-priority coaching tasks.

### 4. Trades To Review Next

Show a compact queue below the overall coaching focus.

This should include:

- best evidence trade,
- 2-5 additional related trades,
- why each trade is in the queue,
- `Open Trade Review`,
- link to the full review queue.

This section is useful when a user imports a week or month of trades at once.
The list should shrink as trades are marked reviewed, solved, or skipped.

### 5. Featured Evidence Trade

The featured trade should answer:

- why this trade proves the current focus,
- what to replay,
- what to write down,
- what chart context is available or waiting.

When market context is available, the featured trade should show the three
chart windows:

- before entry,
- during the trade,
- after exit.

It should not be the page's main headline unless there is no reliable aggregate
focus yet.

### 6. Progress Follow-Through

Show whether the coaching focus is being reviewed and whether enough evidence
exists to claim a trend.

Use honest states:

- "Needs more reviewed trades"
- "Review backlog still high"
- "Pattern repeated in recent saved trades"
- "Not enough completed reviews to measure improvement"

Do not claim improvement just because new trades were imported.

### 7. Advanced Analysis

Collapse by default:

- rule labs,
- simulations,
- confidence language,
- pattern memory,
- raw behavior IDs,
- scoring traces,
- suppressed behavior IDs,
- normalization details,
- diagnostics.

## Naming Rules

Avoid literal daily wording unless the data truly represents the current trading
day.

Replace:

- "Today's review card"
- "What to work on today"

With:

- "Current Coaching Focus"
- "Current Review Plan"
- "Review Session"
- "Trades To Review Next"
- "Review Backlog"
- "Next Trade To Review"

Reason:

- Users may import trades daily, weekly, monthly, or after a long catch-up.
- The coach should work on saved trade history, not assume the user traded or
  imported today.

## Route Boundaries

### `/coach`

Overall coaching page:

- recurring behavior or strength,
- why it matters,
- fix-first action,
- evidence summary,
- review backlog,
- progress follow-through,
- advanced analysis collapsed.

### `/review`

Work queue:

- which trades need review,
- why each trade is queued,
- what to inspect,
- direct action into trade review.

### `/trades/[tradeId]`

Individual trade review workspace:

- what happened in this trade,
- execution replay,
- chart context when available,
- notes/checklist/writing flow,
- why this trade supports a coaching focus.

### `/progress`

Follow-through:

- imported trades vs completed reviews,
- active coaching focus,
- review completion,
- trend honesty,
- insufficient-data warnings.

## Read Model Direction

The UI should consume a product-ready coaching summary, not raw engine internals.

Preferred read-model shape:

```text
overallFocus
  label
  plainExplanation
  occurrenceCount
  estimatedImpact
  evidenceTradeIds
  fixFirstAction
  sampleSizeWarning

reviewQueuePreview
  nextTrade
  relatedTrades
  fullQueueHref

progressFollowThrough
  importedTradeCount
  completedReviewCount
  unresolvedReviewCount
  trendState
  nextProgressAction

advanced
  diagnostics
  confidence
  raw support data
```

If aggregate focus data is not yet reliable, the page may fall back to a
featured trade, but the copy must say:

```text
Save and review more trades to build an overall coaching focus.
```

## Implementation Runs

### Run A: Rename And Reframe First Screen

**Status:** First implementation pass complete on 2026-05-09.

- Replace literal daily copy with session/backlog copy.
- Make the first card the overall coaching focus.
- Demote "next trade to review" into a queue/evidence section.
- Keep one primary action, but make it serve the coaching focus.

### Run B: Aggregate Coaching Focus

**Status:** Product read-model extraction started on 2026-05-09.

- Build or tighten the product read model for the overall focus.
- Use saved imports and saved review data first.
- Count related trades when safely available.
- Show impact/protected-profit only when the source data supports it.
- Add sample-size warnings.

### Run C: Trades To Review Next

**Status:** First compact queue preview is implemented on `/coach`.

- Show 2-5 trades related to the current focus.
- Include why each is useful evidence.
- Link each to `/trades/[tradeId]#writing-flow` or `#execution`.
- Link to `/review` for the full queue.

### Run D: Progress Follow-Through

**Status:** First shared follow-through model implemented on 2026-05-09.

- Show imported vs reviewed counts.
- Explain why progress may not move after import until reviews are completed.
- Link to `/progress` only where it explains the active coaching focus.

### Run E: Collapse Advanced Analysis

**Status:** First demotion pass complete for non-primary coach tools.

- Move rule labs, simulations, confidence language, and diagnostics lower.
- Keep them available for advanced users.
- Do not expose raw engine language in the default flow.

### Run F: Visual And Copy QA

**Status:** Initial focused verification complete; keep active only for specific
browser/readability issues found during the next handoff pass.

- Desktop and mobile screenshot review.
- Shorten long cards.
- Use red/green/amber/blue consistently.
- Assert banned claims and raw/internal terms are absent from primary UI.

### Run G: Detection Certification And Human Trader Language

**Status:** Added after engineer review on 2026-05-09. This is now the highest
value next coaching continuation before more visual polish.

Problem:

- Some behavior labels still sound like engine or analyst wording instead of
  trader language.
- Example: "Added After Failed Premise" is not clear for a newer trader and
  should not appear in the default UI.
- Some detections are useful signals but still need certification before they
  can drive confident coach conclusions.
- The coach needs to explain what happened, why it mattered, how the app
  detected it, and what to fix first.

Required work:

- Work from
  `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`
  before making more coach visual polish.
- Use `src/docs/trader-intelligence-behavior-language-and-detection-audit-2026-05-09.md`
  as the behavior-language source of truth.
- Certify the detection contract before using a behavior in the primary coach
  headline or fix-first action.
- Build or tighten a shared trader-facing language mapper for coach focus
  labels, mistake taxonomy labels, pattern labels, review queue reasons, and
  trade-detail behavior summaries.
- Replace awkward/internal wording in primary coach UI:
  - "Added After Failed Premise" -> "Kept adding before reducing risk"
  - "adverse move" -> "the trade moved against you"
  - "revenge trading" -> "possible revenge re-entry" unless repeated evidence
    is strong enough to support stronger wording
  - "premise" -> "trade idea" only in advanced or explanatory copy when needed
- Keep "how detected" details available in advanced/collapsed areas, not the
  first card.
- Add tests that block confusing wording from primary coach UI.

Product rule:

If the app cannot prove the behavior from executions, candles, levels, volume,
or saved reviews, the coach must not present it as a conclusion. It should
become a review prompt or stay internal until the detection is certified.

## Acceptance Criteria

- A user can tell the page is coaching their overall trading, not only one
  selected trade.
- The first screen names one overall focus and one fix-first action.
- A single trade is clearly labeled as evidence or "next trade to review", not
  as the whole coach.
- The page works when trades were imported later than the trade date.
- The page does not assume the user enters trades daily.
- The review queue preview helps users with large catch-up imports.
- Advanced analysis exists but is not the default experience.
- The coach never provides financial advice, trade calls, signals, guaranteed
  improvement, or short-seller coaching.

## Implementation Status

Completed in the first coach-overall-focus pass:

- `/coach` page title now leads as "Your Trading Coach" instead of a single
  trade review headline.
- The primary card now starts with "Current Coaching Focus" and names the
  behavior across saved trades before the evidence trade.
- Literal daily wording was removed from the default coach UI.
- The featured trade is labeled as evidence, not the whole coaching experience.
- A compact "Trades To Review Next" preview now sits under the overall focus.
- `/review` and `/progress` handoffs now point back to the coaching focus
  anchor instead of the old single-session anchor.
- Saved review queue preview language maps internal lane ids to user-facing
  labels.
- Focused Playwright coverage now asserts the new coach-first contract.

Completed in the coach/progress follow-through pass:

- Added a shared product helper for coaching progress follow-through:
  imported trades, finished reviews, review backlog, progress state, and next
  action.
- `/coach` now has a dedicated "Progress Follow-Through" panel explaining why
  saved imports are history and completed reviews are what make progress
  measurable.
- `/progress` now uses the same follow-through language and separates saved
  trade count, finished reviews, backlog, and insufficient-data status.
- `/progress` no longer renders every saved trade inside the execution quality
  trendline by default; it shows a focused preview and links to saved trades or
  analytics for the full list.
- Coach impact wording now avoids calling positive gross P/L evidence "cost";
  it uses evidence/impact language and asks the user to review whether the
  behavior helped or simply appeared in winners.
- The extra coach tool cards for rules, compare, and onboarding moved behind
  the supporting coach details disclosure so the default coach flow stays
  focused.

Completed in the coach evidence-trade handoff pass:

- `/coach` now chooses the primary evidence trade from the current overall
  coaching focus, rather than defaulting to the first unrelated queue item.
- Coach trade links carry `from=coach` and the current focus label into
  `/trades/[tradeId]`, so the trade page can explain why the user landed there.
- `/trades/[tradeId]` now shows a dedicated "Coach Handoff" panel when opened
  from coach, separating:
  - the overall coaching focus,
  - what this specific trade may show,
  - what evidence to prove,
  - how to finish the loop.
- The trade-review note/checklist surface now has an "After Saving This Review"
  handoff back to coach, progress, the review queue, and saved trades.
- `/coach` lower proof queue and evidence-card links now use the same focused
  evidence set as the top coach session instead of falling back to generic
  proof lists.
- `/review` now includes a "Check progress" step in the work order after the
  user opens, replays, writes, and returns to coach.
- `/progress` now links the active coaching focus back to `/coach#next-action`
  and `/review?queue=highest_priority`.
- Focused Playwright now verifies the coach -> trade-detail -> review-completion
  loop.

Completed in the first coach presentation-polish pass:

- Added a shared workflow handoff under the overall focus so `/coach` reads as:
  overall pattern -> evidence trade -> review queue -> progress.
- Renamed the short session-plan cards to `Fix First`, `Repeat First`, and
  `Review Next Trade`.
- Kept the single evidence trade secondary to the overall coaching focus.
- Updated adverse-add primary labels through the shared behavior mapper so
  execution-only add evidence says `Review adds that need chart context`
  instead of implying the add was automatically bad.
- Verified coach route coverage, banned-claim coverage, TypeScript, build, and
  mobile overflow after the pass.

Completed in the coach lower-page reduction pass:

- `/coach` now keeps duplicate/heavy supporting material collapsed by default:
  review summary totals, behavior-impact charts, proof queue, extra evidence
  cards, rule ideas, pattern memory, score details, rule evidence checks,
  current pattern internals, review-completion detail, and confidence wording.
- Added a visible `Before Next Session` plan panel with one rule to use, one
  behavior to reduce, one strength to repeat, timing check, quick checklist,
  and one next action.
- Featured coach evidence cards now answer:
  - what happened,
  - why it mattered,
  - what to do next.
- The saved-review summary remains available inside the supporting-details
  disclosure instead of competing with the main coaching flow.
- Focused desktop Playwright, mobile overflow, TypeScript, and build passed
  after this pass.

Completed in the coach behavior-map reuse pass:

- Added shared `app/behavior-report-panel.tsx` so `/coach` and `/analytics`
  render the same certified behavior-report groups.
- `/coach` now renders `Behavior Coaching Map` between the review-session flow
  and the review backlog.
- The coaching map summarizes certified risks as `Fix first`, certified
  strengths as `Repeat first`, and uncertain/prompt-only chart behavior as
  `Needs review`.
- The side menu now links to `Behavior Map`.
- The pass does not add new behavior detections. It consumes the existing
  certified saved trade-thread market-context findings through
  `buildAnalyticsBehaviorReport(...)`.
- Focused unit, TypeScript, production build, desktop coach/analytics
  Playwright, banned-claim Playwright, browser smoke, and `git diff --check`
  passed after this pass.

User QA follow-up after the behavior-map reuse pass:

- The evidence source is correct, but the default `/coach` presentation is not
  distinct enough from `/analytics`.
- `/analytics` should remain the broad report surface where all behavior
  groups can appear as cards.
- `/coach` should use the same shared report to select and guide one small
  coaching path:
  - top behavior family to reduce,
  - top behavior family to repeat,
  - plain explanation of what that means,
  - one fix-first or repeat-first action,
  - two to five evidence trades,
  - links into trade detail and review queue.
- This follow-up is complete: the mirrored behavior-card section has been
  replaced by a coach-specific sequence without deleting the certified data
  source.

Completed in the coach behavior-sequence pass:

- `/coach` now renders `Behavior Coaching Sequence` as the default behavior
  section instead of the mirrored analytics-style behavior-card grid.
- The sequence consumes the same certified `buildAnalyticsBehaviorReport(...)`
  source, selects top risk, top strength, and top review prompt, and keeps
  uncertain chart behavior as a review prompt rather than a conclusion.
- Evidence trades link into `/trades/[tradeId]#writing-flow`, with review queue
  and progress follow-through available from the same panel.
- The previous `Behavior Coaching Map` remains available only in supporting
  details so the evidence audit trail is still reachable without dominating the
  coach experience.

Remaining work after the 2026-05-10 lower-page reduction:

- Keep the shared behavior mapper as the allowlist. If a behavior is not mapped
  as a certified detection, `/coach` must not show it as a confident conclusion.
- Do not rebuild the shared behavior report data grouping or the May 11 coach
  behavior sequence unless QA finds a concrete regression.
- Do not let uncertified detections drive coach headlines, proof cards,
  fix-first actions, or progress claims.
- Continue extracting route-local coach wording only when it duplicates the
  shared helper or creates a copy-safety risk.
- Use screenshots for the next `/coach` pass. Focus only on real visual/mobile
  defects in the top flow, `Before Next Session` panel, or supporting-details
  disclosure. Do not rebuild the new shared workflow handoff strip or the
  lower-page collapse.
- Use certified read-model counts for evidence cards. If a route wants a new
  chart, counter, or statement, first verify the evidence family is certified
  or present it as a neutral review prompt.
- Deeper `/progress` trend logic still depends on meaningful completed-review
  history; until then the UI should keep saying progress is not measurable yet.
- Keep `/review` handoff work limited to missing anchors, mobile tab density,
  and route-specific copy regressions unless browser QA shows a clear usability
  issue.

## Verification

Run after implementation:

```powershell
npx tsc --noEmit --pretty false
npm run build
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop --grep "coach product loop|guided review workflow|progress and behavior visual surfaces"
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop --grep "keeps banned product claims out of core product routes|keeps market context observational"
```

Also inspect `/coach`, `/review`, `/trades/[tradeId]`, and `/progress` on
desktop and mobile widths.

## Current Next Step After Detection Hardening

Continue without restarting Run A, the first Run C queue preview, the first Run
D follow-through implementation, the coach -> trade-detail handoff, the
detection/language baseline, or the completed adverse-add repair wording pass.

Important:

- Use the active detection/language plan only when a new behavior claim,
  market-context family, or unclear label appears.
- Do not redo the app-wide inventory, shared mapper/registry, or completed
  coach handoff loop unless a regression is found.
- The next coach-specific work should be a presentation/readability pass that
  consumes existing certified read models, or a small route pass for a newly
  certified evidence family.

The next coding pass should:

1. Smoke `/coach` long enough to confirm the current overall-focus card,
   focused evidence trade, trades-to-review preview, progress follow-through,
   and `Before Next Session` panel still render correctly.
2. Audit visible coach behavior labels for any new confusing/internal wording.
   Replace through the shared trader-facing mapper/read model, not a route-local
   table.
3. Add or update tests only where the route copy or behavior family changed.
   Existing guards already block phrases such as "Added After Failed Premise"
   and raw pattern/taxonomy wording from primary coach UI.
4. Touch `/coach` again only for screenshot-proven visual density, handoff link
   regressions, or a clear browser QA regression after the lower-page collapse
   and May 11 behavior sequence.
5. Do a desktop/mobile readability pass across `/coach`, `/trades/[tradeId]`,
   `/review`, and `/progress`, shortening long card copy and keeping
   advanced/supporting sections collapsed.

`/progress` should only receive deeper trend logic after real completed-review
history exists.

If the aggregate coaching read model is missing a field:

- park that missing field in the project log,
- use the existing aggregate focus and continue with presentation polish,
- still refine the trades-to-review preview if queue data exists and it affects
  the handoff,
- still demote advanced sections,
- still update focused tests and verification.

Do not redo the first-screen rename/reframe unless browser QA shows a clear
regression. The page should continue to lead with the overall coaching focus,
not a single-trade coaching experience.
