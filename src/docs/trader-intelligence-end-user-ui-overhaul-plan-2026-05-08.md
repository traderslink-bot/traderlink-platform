# Trader Intelligence End-User UI Overhaul Plan

**Date:** 2026-05-08  
**Branch:** `codex/trader-ui-product-pass`  
**Status:** Historical broad UI roadmap. Do not use as the current
implementation plan; start from root `plan.md` and the plan index.
**Primary goal:** Make Trader Intelligence feel clear, visual, useful, and human
for newer traders while still giving intermediate and advanced users enough
depth.

## Direct Assessment

The last implementation pass improved hierarchy, wording, and route structure,
but it did not make the product visually strong enough yet.

What improved:

- The app now has clearer route flow.
- Internal labels are less visible in beginner-facing areas.
- `/trader-intelligence` now previews a clean single-trade review model.
- The first user-facing review summary layer exists.

What is still not good enough:

- The UI still feels too much like dark admin cards.
- The analytics do not yet feel like a proper trader report.
- The app needs more visual explanation: charts, colored outcome views, P/L
  curves, win/loss mix, behavior-cost visuals, execution timeline graphics, and
  clearer red/green gain/loss language.
- The sample/saved data visible at localhost may be too thin to judge the
  product experience.
- A new trader still needs more guided explanation, more examples, more visual
  context, and less dense text.

This plan treats the next work as a real product overhaul, not a small polish
pass.

## Product North Star

Trader Intelligence should answer these questions in order:

1. What happened in this trade?
2. What was the main behavior?
3. Why did that behavior matter?
4. What is the one fix-first or repeat-first action?
5. What evidence supports that conclusion?
6. What does this pattern look like across many trades?

Default UI should be simple. Advanced details should exist, but stay collapsed
or inside admin/debug routes.

## Core User Flow To Build Toward

```text
Workspace
  -> Import Trades
  -> Saved Trades
  -> Single Trade Review
  -> Review Queue
  -> Coach
  -> Analytics / Progress
  -> Learn
```

The app should not feel like a collection of unrelated dashboards. It should
feel like a trader reviewing a real trading day.

## Target Users

### New Trader

Needs:

- plain words,
- one main takeaway,
- obvious next action,
- examples of terms like chasing, profit protection, adding into weakness,
- red/green visual feedback,
- fewer metrics at once.

Avoid:

- raw pattern IDs,
- scoring traces,
- dominant families,
- suppressed behavior IDs,
- dense tables as the first thing shown.

### Intermediate Trader

Needs:

- trade timeline,
- P/L by trade,
- session/time-of-day visuals,
- behavior trend visuals,
- mistake cost,
- before/after evidence.

### Advanced User

Needs:

- advanced analysis details,
- raw pattern traceability,
- calibration and diagnostics,
- import repair details,
- market context availability.

These should be available, but not primary.

## Visual Product Direction

The current dark style can stay, but it needs more product design and less
terminal/dashboard feeling.

Use:

- red for losses, risk, giveback, unresolved issues,
- green for wins, strengths, protected profit,
- amber for caution, needs review, missing context,
- cyan/blue for navigation, current focus, chart context,
- small but meaningful charts on the first viewport,
- compact labels with hover/tooltips where needed,
- clear section titles written like a human review.

Avoid:

- walls of equal cards,
- huge text blocks inside metric cards,
- raw identifiers in normal UI,
- sections where every panel feels equally important,
- chartless analytics pages.

## Phase 1: Visual Foundation And Chart Components

Build a small visual reporting layer that can be reused across analytics,
trade detail, coach, and progress.

### Components To Add

Suggested location:

```text
app/report-ui.tsx
```

or, if it grows:

```text
app/report-ui/
  pnl-line-chart.tsx
  outcome-donut-chart.tsx
  session-bar-chart.tsx
  behavior-cost-chart.tsx
  execution-timeline-chart.tsx
  trade-calendar-heatmap.tsx
```

Components:

- `PnlLineChart`
  - equity-style P/L curve across trades.
  - green above zero, red below zero.
- `OutcomeDonutChart`
  - win/loss/flat mix.
  - should work as a simple CSS/SVG chart, not a huge chart library.
- `SessionBarChart`
  - premarket/open/midday/close/after-hours P/L.
- `EntryHourHeatmap`
  - hour-of-day performance with red/green intensity.
- `BehaviorCostChart`
  - mistake/habit counts or estimated cost by behavior.
- `ExecutionTimelineChart`
  - buys/adds/reductions/exits on a horizontal timeline.
  - position size bar.
  - realized P/L progress when available.
- `ReviewOutcomeBadge`
  - Strong, Mixed, Weak, Needs more data.
- `PlainTooltip`
  - short definitions for new traders.

### Acceptance Criteria

- `/analytics` has at least 4 real visual charts above or near first viewport.
- `/trades/[tradeId]` has a visual execution timeline.
- `/coach` has at least one visual behavior/mistake-cost chart.
- Mobile view has no horizontal overflow.
- Text remains readable without shrinking based on viewport width.

## Phase 2: Better Demo And Localhost Data

The app is hard to judge if localhost only shows one or two thin examples.
Create richer demo data so the UI can be evaluated like a real trader used it.

### What To Add

Add a richer demo dataset with:

- 30 to 50 trades,
- mix of wins, losses, flats,
- at least 8 symbols,
- premarket, open, midday, close, after-hours sessions,
- multiple execution counts per trade,
- examples of:
  - chase entry,
  - poor profit protection,
  - premature exit,
  - adding into weakness,
  - strong profit protection,
  - structured execution,
  - open trade,
  - chart context waiting,
  - needs more data.

### Product Reason

The user needs to see charts and analytics with enough data to understand the
experience. One saved trade makes every dashboard look empty or awkward.

### Acceptance Criteria

- Local sample mode looks like a real week or month of trading.
- Analytics charts are visually meaningful without requiring a saved CSV.
- Sample mode is clearly labeled as sample data, but not in ugly internal terms.
- Saved-import mode still overrides sample data when real imports exist.

## Phase 3: Wire User-Facing Review Summary Into Real Trade Detail

The mock `/trader-intelligence` route is only a preview. The next product step
is to make `/trades/[tradeId]` use the same user-facing summary model.

### Work

- Build an adapter from saved trade review data to
  `UserFacingTradeReviewSummary`.
- Keep engine/coaching internals unchanged.
- Replace the top of `/trades/[tradeId]` with:
  - main issue or strength,
  - result/outcome badge,
  - confidence with explanation,
  - what happened,
  - why it mattered,
  - fix first,
  - evidence timeline,
  - glossary cards,
  - advanced details collapsed.

### UI Structure

```text
Single Trade Review
  Top summary:
    symbol, date, P/L, outcome, confidence
  Main takeaway:
    issue/strength + one fix-first action
  Visual timeline:
    executions, size, P/L progress
  Explanation:
    what happened / why it mattered / what to write down
  Evidence:
    human-readable evidence cards
  Advanced:
    pattern IDs, scoring details, diagnostics
```

### Acceptance Criteria

- A new trader can understand the trade review without opening advanced details.
- Advanced details preserve traceability.
- Low-confidence reviews say “Needs more data” clearly.
- Strength-first reviews show reinforcement language, not only criticism.

## Phase 4: Analytics Redesign Into A Real Report

Analytics should stop feeling like a list of cards. It should look like a
trader report.

### Above The Fold

Show:

- total gross P/L,
- win rate,
- trade count,
- best trade,
- worst trade,
- biggest repeated risk,
- best repeated strength,
- next trade to review.

### Charts To Add

- P/L curve across trades.
- Win/loss/flat donut chart.
- P/L by session bar chart.
- Entry hour heatmap.
- Behavior cost/count chart.
- Best/worst trade list with red/green outcome color.

### Presentation

Use a layout like:

```text
Analytics
  This Period Summary
  [P/L curve] [Win/Loss donut]
  [Session P/L bars] [Entry hour heatmap]
  [Behavior cost chart]
  Trades behind the number
  Advanced diagnostics collapsed
```

### Acceptance Criteria

- User sees charts immediately.
- Red/green visual language makes outcomes obvious.
- Each chart has one plain sentence explaining what it means.
- No chart uses raw labels like `behavior_risk_rates` in visible UI.

## Phase 5: Coach Redesign Into A Human Review Plan

Coach should feel like a practical plan for the next session, not a diagnostics
screen.

### Top Layout

```text
Do this next:
  Review RP424864D

Avoid next session:
  Replay the repeated risk

Repeat:
  Preserve clean entry and exit

Why:
  3 trades showed this pattern
```

### Visuals

- Behavior-cost mini chart.
- Recent pattern trend.
- “Fix first” action card.
- “Repeat this” strength card.
- Evidence list tied to actual trades.

### Acceptance Criteria

- Top of `/coach` shows one primary action.
- The page gives one fix-first behavior, not five equal suggestions.
- Repeated behavior is visualized with counts/trend.
- Technical rule labs and simulations stay in advanced sections.

## Phase 6: Review Queue And Saved Trades Cleanup

The review queue should feel like a work queue. Saved trades should feel like a
trade journal.

### Review Queue

Add:

- lane counts with color,
- priority reason,
- “what to review” sentence,
- “open trade review” action,
- visual lane grouping.

### Saved Trades

Add:

- card/table toggle later,
- color-coded P/L,
- outcome badge,
- review status badge,
- behavior summary,
- mini sparkline if possible,
- filter chips for win/loss/session/status/behavior.

### Acceptance Criteria

- A trader knows which trade to review first.
- Saved trades are scannable.
- Open trades and chart-context-waiting trades are understandable.

## Phase 7: Import Flow For Real Humans

Import should feel like a clean onboarding flow, not a repair console.

### Import Steps

```text
1. Upload executions
2. Confirm broker mapping
3. Review grouped trades
4. Save import
5. Start first review
```

### UI Changes

- Stepper at top.
- Human explanation for rejected rows.
- “What happens next” panel after save.
- Primary CTA: “Review first trade.”
- Advanced repair details collapsed.

### Acceptance Criteria

- New trader can import without understanding parser internals.
- Repair flow still works.
- Import confidence is explained plainly.

## Phase 8: Beginner Education Layer

Add a lightweight `Learn` or glossary surface.

### Terms

- chasing,
- profit protection,
- averaging down,
- adding into weakness,
- premature exit,
- failed breakout,
- support,
- resistance,
- reclaim,
- breakout,
- giveback,
- open profit,
- risk/reward,
- partial exit,
- re-entry.

### Where It Appears

- inline cards on trade detail,
- tooltips on analytics/coach,
- optional `/learn` route later.

### Acceptance Criteria

- New traders can understand key terms without leaving the review.
- Definitions are short and practical.
- No financial advice language.

## Phase 9: Admin And Advanced Isolation

Keep advanced power, but stop letting it leak into the default app.

### Move Or Hide By Default

- calibration,
- platform readiness,
- review cockpit,
- import trials,
- repair wizard,
- raw route/workflow readiness,
- scoring traces,
- suppressed IDs,
- pattern IDs,
- normalization details.

### Acceptance Criteria

- Normal user navigation promotes only:
  - Workspace,
  - Import,
  - Trades,
  - Review,
  - Coach,
  - Analytics,
  - Progress,
  - Learn.
- Admin/debug surfaces remain available under `/workspace/admin` or `/debug`.

## Phase 10: Visual QA And End-User Testing

Every meaningful UI pass should include screenshots and route checks.

### Required Checks

- `npx tsc --noEmit --pretty false`
- `npm run build`
- focused Vitest for mapper/chart data shaping
- Playwright desktop route crawl
- Playwright mobile overflow smoke
- screenshot captures for:
  - `/workspace`
  - `/trader-intelligence`
  - `/trades`
  - `/trades/[tradeId]`
  - `/review`
  - `/coach`
  - `/analytics`

### Visual Review Checklist

- Does first viewport show the main action?
- Are gains/losses visually obvious?
- Are charts visible without deep scrolling?
- Does a new trader understand the terms?
- Are advanced details collapsed?
- Is any card text too long?
- Does mobile stack cleanly?
- Is there any horizontal overflow?

## Suggested Implementation Order

### Run 1: Visual Chart Foundation And Demo Data

Build chart primitives and richer sample data first. This makes every following
screen easier to judge.

Deliverables:

- chart/report components,
- richer sample trade dataset,
- `/analytics` first viewport with real visual charts,
- screenshot proof.

### Run 2: Real Trade Detail Review Workspace

Wire `UserFacingTradeReviewSummary` into `/trades/[tradeId]`.

Deliverables:

- real summary adapter,
- visual execution timeline,
- glossary cards,
- advanced collapsed details,
- trade-detail Playwright coverage.

### Run 3: Coach And Review Queue

Make coach and review queue feel like the daily work plan.

Deliverables:

- redesigned coach top section,
- behavior-cost chart,
- cleaner review queue lanes,
- trade cards with clear reasons/actions.

### Run 4: Import Flow And Learn Layer

Make onboarding/import understandable, then add education where terms need it.

Deliverables:

- import stepper,
- post-save “review first trade” handoff,
- glossary/learn components.

### Run 5: Admin Isolation And Final Visual QA

Move remaining internals out of normal navigation and do full responsive
screenshots.

Deliverables:

- cleaned navigation,
- admin/debug route separation,
- full screenshot set,
- copy safety scan.

## Non-Goals For This Roadmap

- Do not build billing.
- Do not build auth.
- Do not change engine contracts just to make UI easier.
- Do not overbuild broker integrations before the review experience is clear.
- Do not add trade calls, signals, financial advice, or guaranteed performance
  claims.
- Do not make short-seller coaching part of the default product language.

## Definition Of Done

This overhaul is successful when a new trader can open localhost and understand:

- where to start,
- what trade to review,
- what the app thinks happened,
- what behavior mattered most,
- why it mattered,
- what one action to fix or repeat,
- how their trades are trending visually,
- where advanced details live if they want them.

The app should feel like a clean trading review tool, not a diagnostic terminal.
