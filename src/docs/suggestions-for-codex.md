# Suggestions For Codex

**Created:** 2026-05-11
**Branch reviewed:** `codex/trader-ui-product-pass`
**Repo:** `traderslink-bot/traderslink-trader-improvement-system`

## Purpose

This document captures an outside product, project-management, engineering, and new-user review of the current Trader Intelligence app direction.

Use this as guidance for the next Codex implementation pass. This is not a request to rebuild the engine. The goal is to improve the product experience while preserving the strong evidence-gated architecture that already exists.

## High-Level Verdict

Codex has made real progress. The app is safer, more user-facing, and more honest than earlier versions. The route family now has better labels, saved-import wording, chart-context gating, support/resistance handoffs, session stories, ticker stories, review queues, and coaching/progress loops.

The main remaining issue is product clarity.

The app still feels too much like an engineer's product demo in some areas and not enough like a simple trading-improvement workflow for a newer trader.

The next improvement should not be more metrics by default. The next improvement should be:

1. stronger route identity,
2. fewer equal-priority cards,
3. clearer next actions,
4. beginner-readable explanations,
5. better default hierarchy,
6. preservation of useful deeper data behind organized categories or aside-menu sections.

Do not remove useful data just to make pages shorter. Instead, move the most important guidance first and organize deeper data into categories, disclosures, tabs, or aside-menu sections where it remains accessible.

## Important Product Clarification: Short Selling Is Not A Feature Yet

The current wording `position-history review` is unclear.

It may have been introduced to avoid overclaiming around sell-starting records, but it reads strangely to an end user. It also risks making people think short-selling analysis is a supported feature.

Short selling is not supposed to be a supported app feature yet.

Do not present short-side coaching as if it is fully supported.

Replace unclear wording like:

```text
position-history review
```

With clearer product-safe wording such as:

```text
Sell-starting trade review is limited right now.
```

or:

```text
This saved item starts with a sell-side execution. The app can replay the position history, but full short-trade coaching is not supported yet.
```

or, if the copy appears in a short compact label:

```text
Limited sell-side review
```

Rules:

- Do not imply full short-trade coaching exists.
- Do not make short-selling behavior conclusions.
- Keep sell-starting execution records replayable when the data exists.
- Use clear limitation copy instead of vague terms.
- Prefer a shared copy helper over route-local wording.

## Core Product Direction

The app should make the user feel this loop:

```text
Import trades -> Review the next trade -> Understand the report -> Use the coach -> Track progress
```

Each route should have one primary role.

| Route | Product Role | User Question It Should Answer |
| --- | --- | --- |
| `/workspace` | Home base | What should I do next? |
| `/import-dry-run` | Trust and cleanup | Is this CSV safe to save? |
| `/imports` and `/imports/[batchId]` | Import history/recovery | What did I save and what needs repair? |
| `/trades` | Saved trade library | Which saved trade, ticker story, or session story do I want to open? |
| `/trades/[tradeId]` | Trade review workbench | What happened in this one trade and what lesson should I write? |
| `/review` | Work queue | Which trade should I review now? |
| `/analytics` | Report surface | What patterns exist across my trades? |
| `/coach` | Action plan | What should I fix or repeat next? |
| `/progress` | Follow-through | Am I actually reviewing and improving? |

If two routes start to feel the same, separate their purpose rather than adding more copy.

## Highest Priority: Redesign `/coach` Into A True Coaching Sequence

The current issue is not only that `/coach` uses the same evidence source as `/analytics`. Sharing the evidence source is correct.

The issue is that the coach presentation still feels too close to an analytics report because it renders behavior groups/cards in a broad report-card style.

Keep:

```text
buildAnalyticsBehaviorReport(...)
```

as the shared certified evidence source.

But split presentation:

```text
AnalyticsBehaviorReportPanel
```

For `/analytics`. This can show broad grouped cards, counts, drilldowns, and all report categories.

```text
CoachBehaviorSequence
```

For `/coach`. This should turn the same report into a small guided coaching path.

### CoachBehaviorSequence Should Show

1. The top risk to reduce, when a certified risk exists.
2. The top strength to repeat, when a certified strength exists.
3. The top review prompt, when evidence is uncertain.
4. A plain explanation for a newer trader.
5. One fix-first or repeat-first action.
6. Two to five evidence trades.
7. Links into trade detail, review queue, and progress.

### Coach Should Not Default To

- all behavior groups as equal cards,
- a dense metrics grid,
- an analytics-like report wall,
- multiple competing fix-first actions,
- internal evidence labels in primary UI,
- chart conclusions that are not certified.

### Coach Default Page Hierarchy

Recommended default order:

1. **Current Coaching Focus**
   - One headline.
   - One explanation.
   - One primary action.

2. **Why This Matters**
   - Beginner-readable explanation.
   - Tie the behavior to cost, protected profit, repeated weakness, or repeatable strength only when evidence supports it.

3. **Fix First / Repeat First**
   - One rule or checklist item.
   - Do not create long equal-priority lists.

4. **Trades That Prove It**
   - Two to five evidence trades.
   - Each card should explain why it is evidence.
   - Link to `/trades/[tradeId]#writing-flow` or the most useful anchor.

5. **Review Queue Handoff**
   - Continue the work queue.
   - Link to `/review`.

6. **Progress Follow-Through**
   - Explain that progress depends on completed reviews, not just imported trades.

7. **Supporting Details**
   - Collapsed by default.
   - Can include broad behavior map, diagnostics, counts, confidence, and advanced details.

### Coach Copy Rules

Use language like:

```text
The issue is not that you re-entered. The issue is that the later attempt changed a protected first win into a weaker second decision.
```

Use positive framing when appropriate:

```text
This is a strength to keep. You reduced risk while the trade was still paying you, which protected part of the move before the chart faded.
```

Avoid forcing everything into negative coaching language. If the best finding is a strength, the primary action should be `Repeat first`, `Preserve this`, or `Keep this rule`, not `Fix first`.

## `/analytics`: Keep The Data, Improve The Hierarchy

The user wants as much useful data as possible. Do not remove useful analytics just to make the page shorter for beginners.

Instead, make analytics easier on the eyes and more category-driven.

Analytics should answer:

```text
What happened across my trades?
```

Coach should answer:

```text
What should I do about it?
```

### Analytics Should Lead With

1. Overall result.
2. Biggest cost or leak.
3. Best repeatable strength.
4. Most important behavior pattern.
5. Trades behind the numbers.

After the top story, deeper analytics can be organized into categories.

### Suggested Analytics Categories

Use aside menu sections or clear category panels:

- **Results**
  - Gross P/L curve.
  - Win/loss mix.
  - Best/worst trades.
  - Daily P/L calendar.

- **Timing**
  - P/L by session.
  - Entry hour.
  - Hold timing.
  - Cross-session holds.

- **Behavior**
  - Certified behavior report.
  - Risks to reduce.
  - Strengths to repeat.
  - Review prompts.

- **Ticker Stories**
  - Same-symbol re-entries.
  - Profit giveback.
  - Re-entry added profit.
  - Repeated losing attempts.
  - Open re-entry or swing transition.

- **Session Stories**
  - Green-to-red sessions.
  - Many attempts on one ticker.
  - High trade-count sessions.
  - Strengths worth repeating.

- **Chart Evidence**
  - Support/resistance exits.
  - Volume comparison.
  - After-exit movement.
  - Protected-profit-before-fade.
  - Chart context waiting.

### Analytics Should Keep Deeper Data Accessible

Do not cut useful data. Instead:

- collapse dense evidence counts by default,
- use aside links for categories,
- show top insights first,
- use `AdvancedDisclosure` for technical details,
- allow drilldown from each category into the relevant trades,
- make report cards visually lighter and less repetitive.

## `/workspace`: Make It A Simple Home Base

The workspace is improving, but it still risks feeling like an internal control panel.

A newer trader should not have to understand every app area immediately.

### Recommended Workspace Hierarchy

1. **Your next step**
   - If no saved import: `Import trades`.
   - If saved trades exist: `Review next trade`.
   - If review backlog exists: `Open Trade Review`.
   - If enough reviews are done: `Open coach` or `Check progress`.

2. **Main workflow**
   - Import trades.
   - Review next trade.
   - Check analytics.
   - Open coach.
   - Track progress.

3. **Status summary**
   - Saved trades.
   - Review queue.
   - Chart data still missing.
   - Latest import.

4. **App areas**
   - Keep core routes visible.
   - Put supporting tools behind `More review tools`.
   - Keep beta/admin notes collapsed.

### Rename For Beginner Clarity

`Chart Context Waiting` is accurate but may be unclear for newer traders.

Consider:

```text
Chart data still missing
```

Detail:

```text
Some trades can be replayed now, but chart, level, or volume evidence is still waiting.
```

## `/review`: Make It Feel Like A Task List

The review route has the right concept: one trade at a time.

The current queue cards still risk being too dense because they show why it is here, what to review, evidence, counts, status labels, buttons, state details, and technical limits.

### Recommended Review Queue Card Default

Visible by default:

- Ticker.
- P/L.
- Review status.
- Why review this.
- Do this now.
- Primary button: `Open Trade Review`.

Collapsed/details:

- Chart risk count.
- Chart strength count.
- Review prompt count.
- Diagnostics.
- Updated timestamp.
- Technical limits.
- Raw-ish queue status.

### Review Page Role

`/review` should answer:

```text
Which trade should I review now, and what should I do when I open it?
```

It should not try to become analytics, coach, and trade detail all at once.

## `/trades/[tradeId]`: Keep It A Workbench, But Reduce Top-Level Overwhelm

Trade detail is powerful. It has execution replay, ticker story, session story, chart context, notes, checklist, evidence, coach handoff, and progress links.

The problem is not that those sections exist. The problem is that the top of the page needs to make the review process feel simple.

### Recommended Top Flow

1. **Replay what happened**
   - Entry, adds, reductions, exits, position changes, P/L path.

2. **Decide what this trade proves**
   - Execution-only evidence.
   - Chart/level evidence only when saved.
   - Session or ticker story when relevant.

3. **Write one lesson**
   - What happened.
   - Why it mattered.
   - What to do next time.

4. **Continue**
   - Mark reviewed.
   - Return to queue.
   - Open coach/progress.

### Trade Detail Should Avoid

- making the first screen feel like a full report,
- exposing too many optional evidence panels before the user writes the lesson,
- vague sell-starting labels such as `position-history review`,
- implying short-side coaching is supported.

### Keep Advanced Data

Do not remove optional evidence. Put it in lower sections or collapsed panels:

- score explanation,
- supporting evidence,
- behavior timeline,
- similar trades,
- advanced diagnostics,
- raw calculation notes.

## `/trades`: Keep It As A Library, Not A Coach

Saved trades should help the user browse and find evidence.

It should be good at:

- saved trade list,
- filters,
- ticker stories,
- session stories,
- support/resistance exit filters,
- volume evidence filters,
- open/swing review filters,
- current-view explanation.

It should not become the main coaching route. It should link into coach or review when the user needs action.

## `/progress`: Keep It Honest

Progress should not claim improvement just because trades were imported.

Progress should distinguish:

- saved trades,
- completed reviews,
- unresolved review queue,
- active coaching focus,
- repeated behavior after review,
- not enough reviewed history yet.

Good copy:

```text
Progress is not measurable yet. Review more saved trades first so the app can compare behavior after the lesson is written.
```

Avoid:

- implying imported trades equal learning,
- claiming behavior improved without completed review history,
- over-ranking trends with tiny samples.

## Engineering Recommendations

### 1. Extract Large Route Components

Several route files are doing too much. Extract route sections into components.

Suggested files:

```text
app/coach/coach-behavior-sequence.tsx
app/coach/coach-review-plan.tsx
app/coach/coach-evidence-trades.tsx
app/analytics/analytics-report-summary.tsx
app/analytics/analytics-category-section.tsx
app/review/review-queue-card.tsx
app/review/review-work-order.tsx
app/trades/[tradeId]/trade-review-flow.tsx
app/trades/[tradeId]/trade-evidence-panels.tsx
app/workspace/workspace-next-step.tsx
```

Do not create a giant new abstraction if a local component is enough. The goal is readability and route ownership.

### 2. Keep Labels Out Of Route-Local Maps

Do not add route-local behavior label maps.

If a user-facing label is needed, it should come from one of:

- shared behavior mapper,
- product read model,
- import user-copy helper,
- trade display copy helper,
- shared app UI copy helper.

Route files can compose UI, but they should not invent new behavior meanings.

### 3. Add Product-Specific UI Primitives

The existing shared UI primitives are useful, but the product now needs more specific components.

Suggested primitives:

```text
NextStepPanel
EvidenceTradeList
BeginnerExplanationCard
CoachRuleCard
ReviewTaskCard
ChartContextStatusCard
NotEnoughEvidenceNotice
```

Use these where they make routes feel less like generic metric dashboards.

### 4. Keep Evidence Gates Strict

Do not create new confident coach claims unless the evidence is certified.

Rules:

- Execution-only adverse movement can say the trader added after price moved against them.
- It cannot say the add was a bad dip buy unless chart/level/candle evidence proves weakness or no repair.
- Support/resistance claims require saved level/distance evidence.
- Volume claims require saved volume evidence.
- Post-exit continuation claims require measured after-exit candles.
- Missing or partial evidence should become a review prompt or hidden/internal state.

### 5. Preserve Useful Data Through Progressive Disclosure

The goal is not less data. The goal is better hierarchy.

Use:

- top-level summary,
- category sections,
- aside navigation,
- collapsible evidence details,
- drilldown links to trades,
- advanced diagnostics lower on the page.

Avoid:

- removing useful reports,
- hiding all advanced data so power users cannot inspect it,
- making every card equal priority,
- showing raw/internal labels in default UI.

## Suggested Next Implementation Pass

### Primary Slice: Coach-Specific Behavior Sequence

Implement a coach-specific sequence using the existing behavior report data.

Steps:

1. Keep analytics behavior report card grid on `/analytics`.
2. Stop using the same broad card grid as the default `/coach` behavior section.
3. Create a coach-specific component that selects:
   - top risk group,
   - top strength group,
   - top review-prompt group.
4. Show one guided coaching path.
5. Show two to five evidence trades.
6. Link to trade detail, review queue, and progress.
7. Move full behavior-map/card-grid details into a collapsed supporting section if still useful.

### Secondary Slice: Review Queue Density

Simplify default review queue cards.

Visible:

- Ticker.
- P/L.
- Why it is here.
- What to do now.
- Open Trade Review.

Collapsed:

- evidence counts,
- diagnostics,
- technical limits,
- updated timestamps.

### Third Slice: Trade Detail Top Flow

Make the top of `/trades/[tradeId]` read as:

```text
Replay -> Decide -> Write -> Continue
```

Keep supporting evidence lower or collapsed.

Replace unclear sell-starting wording.

### Fourth Slice: Analytics Category Hierarchy

Keep the data. Improve organization.

Add or refine categories:

- Results,
- Timing,
- Behavior,
- Ticker Stories,
- Session Stories,
- Chart Evidence.

Make the first analytics screen identify the most important report story before showing dense details.

### Fifth Slice: Workspace Simplicity

Make the workspace feel like a beginner home base:

- one next step,
- one workflow,
- compact status,
- collapsed supporting tools.

## Verification Recommendations

After route UI changes:

```powershell
npx tsc --noEmit --pretty false
npm run build
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "coach product loop|analytics product intelligence|guided review workflow|saved trade routing|progress and behavior|banned product claims|market context observational"
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "keeps core mobile routes usable"
```

If behavior labels or copy helpers change, also run the relevant user-facing behavior and trader-analytics tests.

## Acceptance Criteria

A newer trader should be able to answer these without understanding the engine:

1. Where do I start?
2. Which trade do I review next?
3. What happened in this trade?
4. What lesson should I write?
5. What pattern exists across my trades?
6. What should I fix or repeat next session?
7. Is chart context available or still waiting?
8. Is progress measurable yet?

A power user should still be able to access:

1. detailed analytics,
2. evidence counts,
3. ticker stories,
4. session stories,
5. chart/level/volume/post-exit evidence,
6. support/resistance exit filters,
7. import diagnostics,
8. advanced technical details.

The product should feel simpler without becoming less powerful.

## What Not To Redo

Do not rebuild completed foundational work unless a real regression appears:

- detection/language baseline,
- shared behavior mapper,
- ticker stories,
- session stories,
- support/resistance exit logic,
- volume comparison logic,
- protected-profit-before-fade logic,
- adverse-add ambiguity split,
- import-flow trust polish,
- workspace visual migration,
- coach old-card cleanup,
- historical level context guardrails.

## Final Product Principle

The engine can know a lot.

The UI should decide what matters first.

Do not remove useful data. Organize it so the user sees the next decision first, then can drill into the evidence when they are ready.
