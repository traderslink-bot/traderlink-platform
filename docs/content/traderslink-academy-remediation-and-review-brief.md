# TradersLink Academy Remediation And Review Brief

Date: 2026-05-18

Status: active remediation brief

Primary URL under review: `/academy`

Local preview URL used during build: `http://127.0.0.1:3102/academy`

Current pushed branch: `codex/trader-ui-product-pass`

Latest Academy app commits at time of this brief:

- `b5eb1ee6 feat: add academy route content loader`
- `a2ed22e4 feat: add academy progress navigation`
- `a18f6437 fix: place academy path links after lesson navigation`

## Why This Brief Exists

The Academy has moved beyond SEO article production. It is now intended to be a real guided learning product for newer traders, with courses, lessons, progress, realistic visuals, and simple next-step navigation.

The current implementation proves the `/academy` app route, content loader, registry, course pages, path hubs, lesson pages, local progress UI, and previous/next lesson navigation can work. However, the user review surfaced a major editorial and instructional problem: many lessons still read like templated SEO-to-Academy conversions instead of polished lessons written by a professional trading instructor.

This file is the shared remediation and review brief. It can be used by Codex, ChatGPT, or a human reviewer to evaluate the Academy as:

- A professional stock-market education product.
- A beginner-friendly guided trading curriculum.
- A course/lesson learning experience, not a blog archive.
- A UI/UX learning path for end users.
- A content system that should support the Trader Intelligence app only where natural.

## User Feedback That Triggered This Brief

The user reviewed the `Doji Candle` lesson and raised these concerns:

- The lesson objective felt longer and heavier than the actual opening lesson.
- The repeated `Lesson Objective`, `Practical Checklist`, `Apply This In Review`, and `Trader Intelligence Bridge` structure felt forced.
- The `Apply This In Review` section did not make sense in context because the lesson itself already tells the user the candle pattern.
- The Trader Intelligence bridge sounded like an awkward inserted note rather than a natural connection to app functionality.
- The content may be technically covering the right topics, but the learning experience is disappointing if each lesson feels like the same template.
- Candlestick and chart-pattern lessons should be better organized.
- Candles may need clearer grouping, such as bullish, bearish, indecision, wick/rejection, continuation, reversal, and confirmation/context.
- Chart patterns need a more professional structure around continuation, reversal, failure, breakout, breakdown, and retest behavior.
- The lesson count/order behavior appears confusing in some course/sidebar views, especially when submodules reset display order.

The user explicitly wants the Academy to feel more like a real trader education product, not a pile of templated articles.

## Codex Reply That Should Guide Remediation

Codex agreed with the critique:

- The Doji lesson is not good enough.
- The issue likely applies to many lessons, especially shorter candle/pattern lessons.
- The UI cards are intended for end users, but they may need better placement and hierarchy.
- The lesson content itself is the bigger problem.
- A single repeated template should not be used for every lesson type.
- The visible heading `Trader Intelligence Bridge` should generally be removed or replaced with more natural product/app references only where appropriate.
- Some lesson types should not have a full `Practical Checklist`.
- Some lesson types should not have `Apply This In Review`.
- The Academy needs content-type-specific lesson formats.

## Important Product Intent

The Academy should guide users through a determined path without locking them in.

The preferred lesson-page hierarchy is:

1. Main lesson content.
2. Clear previous/next lesson buttons directly under the main content.
3. Supporting related lessons/terms/product education below the main navigation.
4. Secondary course lesson list in the sidebar.
5. Progress UI that is helpful but not louder than learning.

The Academy should not feel like a blog.

The Academy should not feel like every page was generated from one rigid format.

The Academy should not over-promote the app. Product references should be restrained, useful, and tied to real review/coaching/analytics workflows.

## Current UI Intent

The following cards/components are intended for end users:

- `Lesson Progress`: local-only lesson completion until account sync is built.
- `Course Context`: tells the user where the lesson sits in the course/module.
- `Course Lessons`: lets users jump around without making jumping the main path.
- Bottom `Previous lesson` and `Next lesson`: primary navigation for guided learning.
- `Trader Intelligence` related content: should be subtle, route-safe, and only shown when it genuinely supports the lesson.

Current concern:

The cards may be structurally useful, but the content inside the lesson can make the whole experience feel weak if it is repetitive, generic, or misplaced.

## Editorial Diagnosis

The Academy currently has broad coverage, but not all lessons have the right instructional shape.

Examples:

- `Support and Resistance` is closer to a real full lesson and can support objectives, examples, checklist, review prompts, and related lessons.
- `Doji Candle` is a small concept lesson and should be tighter, more visual, and more context-driven.
- SEC filing lessons can support checklists because traders need a repeatable document-reading process.
- Risk, trade planning, and review lessons can support checklists and journal/review prompts.
- Short candlestick/pattern lessons should generally avoid bulky objectives and forced review sections.

## Lesson-Type Formats To Use Going Forward

### Short Candle / Pattern Lesson

Use for lessons such as Doji, Hammer, Engulfing Candle, Inside Bar, Double Top, Wedge, Bull Flag.

Recommended structure:

1. What it is.
2. What it shows on a chart.
3. Where it matters.
4. Where it fails or misleads.
5. Realistic chart example.
6. Common mistakes.
7. Before you move on.
8. Previous/next buttons from the app page.
9. Related lessons/terms below.

Avoid by default:

- Long `Lesson Objective` sections.
- Generic `Practical Checklist`.
- Generic `Apply This In Review`.
- Visible `Trader Intelligence Bridge` heading.

Product bridge rule:

Only mention Trader Intelligence naturally if the lesson relates to tagging/reviewing completed trades, for example: "Later, this can be reviewed as a candle-context tag beside entry location, volume, and follow-through." Do not use a standalone bridge block unless the lesson is specifically about review, analytics, coaching, or app workflow.

### Full Concept Lesson

Use for lessons such as Support and Resistance, Volume, Liquidity, Risk Management, Trading Plan, SEC Filings.

Recommended structure:

1. What it is.
2. Why it matters.
3. How to use/read it.
4. Realistic examples.
5. Common mistakes.
6. Practical checklist when the topic genuinely benefits from one.
7. Review questions only when the topic maps to a realistic review workflow.
8. Previous/next buttons.
9. Related lessons/terms.

### Workflow Lesson

Use for day-trading workflow, swing-trading workflow, trade review, practice improvement.

Recommended structure:

1. Goal of the workflow.
2. When to use it.
3. Step-by-step process.
4. What good execution looks like.
5. What common failure looks like.
6. How to review it.
7. Where the app may support the process.

### SEC Filing / Catalyst Lesson

Use for 8-K, 10-Q, S-1, offerings, dilution, reverse splits, going concern.

Recommended structure:

1. What the filing/event is.
2. Why traders watch it.
3. What sections/terms matter.
4. What it does not mean by itself.
5. Realistic trader review example.
6. Red flags and common misunderstandings.
7. Filing-reading checklist.
8. Related filings/events.

## Candlestick Course Remediation

Current candlestick lesson files include:

- `academy/candlestick-patterns.md`
- `academy/candlestick-patterns/long-wick-candle.md`
- `academy/candlestick-patterns/doji.md`
- `academy/candlestick-patterns/engulfing-candle.md`
- `academy/candlestick-patterns/hammer.md`
- `academy/candlestick-patterns/inside-bar.md`
- `academy/candlestick-patterns/outside-bar.md`
- `academy/candlestick-patterns/pin-bar.md`
- `academy/candlestick-patterns/bottoming-tail.md`
- `academy/candlestick-patterns/topping-tail.md`
- `academy/candlestick-patterns/spinning-top.md`
- `academy/candlestick-patterns/candle-volume-confirmation.md`
- `academy/candlestick-patterns/red-to-green-move.md`
- `academy/candlestick-patterns/green-to-red-move.md`

Recommended organization:

1. Candlestick Patterns In Context
2. Candle Anatomy And Reading Bodies/Wicks
3. Indecision Candles
   - Doji
   - Spinning Top
4. Wick And Rejection Candles
   - Long Wick Candle
   - Pin Bar
   - Bottoming Tail
   - Topping Tail
5. Range And Expansion Candles
   - Inside Bar
   - Outside Bar
   - Engulfing Candle
6. Intraday Color-Shift Moves
   - Red-To-Green Move
   - Green-To-Red Move
7. Confirmation And Follow-Through
   - Candle Volume Confirmation

Important note:

Do not teach these as buy/sell signals. Teach them as context that must be read beside location, trend, level, volume, liquidity, and follow-through.

## Chart Pattern Course Remediation

Current chart-pattern lesson files include:

- `academy/chart-patterns.md`
- `academy/chart-patterns/bull-flag.md`
- `academy/chart-patterns/ascending-triangle.md`
- `academy/chart-patterns/base-breakout.md`
- `academy/chart-patterns/rectangle-pattern.md`
- `academy/chart-patterns/channel-pattern.md`
- `academy/chart-patterns/wedge-pattern.md`
- `academy/chart-patterns/falling-wedge.md`
- `academy/chart-patterns/rising-wedge.md`
- `academy/chart-patterns/double-top.md`
- `academy/chart-patterns/inverse-head-and-shoulders.md`
- `academy/chart-patterns/failed-breakout-pattern.md`
- `academy/chart-patterns/parabolic-move.md`
- `academy/chart-patterns/vwap-reclaim.md`

Known gap to review:

- Double Bottom may be missing or not clearly represented.
- Traditional Head And Shoulders may be missing, while Inverse Head And Shoulders exists.
- Chart-pattern organization should distinguish continuation, reversal, failed-breakout/fakeout, and level-reclaim behavior.

Recommended organization:

1. Chart Patterns In Context
2. Continuation / Consolidation Patterns
   - Bull Flag
   - Ascending Triangle
   - Rectangle
   - Channel
   - Base Breakout
3. Wedge Patterns
   - Wedge Pattern Overview
   - Rising Wedge
   - Falling Wedge
4. Reversal / Exhaustion Patterns
   - Double Top
   - Double Bottom
   - Head And Shoulders
   - Inverse Head And Shoulders
   - Parabolic Move
5. Failure / Reclaim Patterns
   - Failed Breakout Pattern
   - VWAP Reclaim

Important note:

Pattern names should never be presented as predictions. Each pattern lesson should explain what the pattern is, why context matters, and how it can fail.

## Lesson Count / Ordering Concern

The user noticed that some lesson counts seem to reset to `1`.

Likely source:

- The registry stores lesson display order within submodules/modules.
- The UI currently displays `Lesson {display_order}` inside the sidebar.
- For submodule/library lessons, this can look like a new course sequence starts, even when the user expects a continuous course path.

Review question:

Should the UI display:

- `Lesson 1`, `Lesson 2`, etc. only for required core lessons?
- `Module 4 - Lesson 1` for submodule/library lessons?
- `Pattern 1 of 14` or `Candle 3 of 14` for libraries?
- A global course sequence number plus module-specific order?

Recommended direction:

Use plain labels that explain the collection:

- `Core lesson 3`
- `Candle pattern 2`
- `Chart pattern 5`
- `Optional library lesson`

Avoid implying all lessons are part of the same required sequence when many are library/reference lessons.

## App Bridge Remediation Rules

Remove or rewrite generic visible headings like:

```text
Trader Intelligence Bridge
```

Use app references only when they feel natural:

- Trade review lessons.
- Journal/review process lessons.
- Analytics/coaching lessons.
- Risk and behavior lessons.
- Pattern/candle lessons only when discussing tagging or reviewing completed trades.

Examples of better app-adjacent copy:

- "If this pattern shows up often in your completed trades, it can be useful to tag it beside location, volume, and follow-through."
- "This is the kind of behavior a review tool can help you study after the trade, not during the trade."
- "For review, the important question is whether the pattern matched your plan or became a reason to react."

Avoid:

- Hard selling the app.
- Generic repeated bridge blocks.
- Predictive claims.
- Claims that analytics will guarantee improvement.
- Any buy/sell signal language.

## External Reviewer Prompt

Use this prompt if asking ChatGPT or another reviewer to review the Academy:

```text
You are reviewing TradersLink Academy as a professional stock market instructor, trading education curriculum designer, editorial director, and UI/UX learning-product expert.

Review the Academy at /academy as an end-user learning journey, not as SEO content.

Focus on:

1. Whether each lesson feels like a real trading lesson or a templated article.
2. Whether the course order makes sense for newer traders.
3. Whether candlestick and chart-pattern lessons are organized professionally.
4. Whether lesson sections are appropriate for the lesson type.
5. Whether generic sections like Lesson Objective, Practical Checklist, Apply This In Review, and Trader Intelligence Bridge are useful or forced.
6. Whether the previous/next lesson flow is obvious and helpful.
7. Whether secondary cards like Course Context, Course Lessons, and Lesson Progress support learning without distracting.
8. Whether product/app references feel natural, restrained, and review-focused.
9. Whether any lesson teaches patterns as signals or implies prediction, profit, or guaranteed outcome.
10. Whether the Academy feels like a coherent course experience rather than a blog archive.

Pay special attention to the Candlestick Patterns In Context and Chart Patterns areas.

The desired result is a professional Academy for traders, with course/module/lesson flow, realistic examples, chart context, and clear next-step navigation. Users should be guided but not locked into the path.

Do not focus on source citations unless a fact appears inaccurate. Do not ask to expose sources in the user-facing content.

Return:

- Biggest curriculum problems.
- Biggest UI/learning-flow problems.
- Lesson-format problems by lesson type.
- Specific fixes for candlestick lessons.
- Specific fixes for chart-pattern lessons.
- Recommendations for app bridge/product references.
- Any missing lessons or missing groupings.
- A prioritized remediation plan.
```

## Codex Remediation Plan

### Pass 1: Lesson-Type Policy

Create or update a short lesson-format policy so each lesson type has the right structure.

Outcome:

- Stop forcing one template across all lessons.
- Define what sections belong to candle/pattern lessons versus full concept lessons.

### Pass 2: Candlestick Patterns In Context

Audit and rewrite the candlestick course/library first.

Tasks:

- Reorganize module grouping.
- Rewrite `Doji Candle` as the model small-pattern lesson.
- Apply the same shape to the rest of the candle lessons.
- Remove forced checklists/review prompts where they do not belong.
- Make every candle lesson visual-first and context-first.
- Keep previous/next flow simple.

### Pass 3: Chart Patterns

Audit and rewrite the chart-pattern lessons.

Tasks:

- Reorganize continuation, wedge, reversal, exhaustion, and failure/reclaim groupings.
- Add missing Double Bottom and Head And Shoulders lessons if confirmed missing.
- Make each pattern lesson explain context, failure modes, and review points without turning the pattern into a signal.

### Pass 4: UI Course/Library Ordering

Review how course lesson counts, module counts, library lessons, and optional lessons display.

Tasks:

- Fix confusing `Lesson 1` resets in sidebar/cards.
- Use labels like `Core lesson`, `Candle pattern`, `Chart pattern`, or `Optional library lesson`.
- Keep the primary path simple and the library accessible.

### Pass 5: App Bridge Cleanup

Remove generic `Trader Intelligence Bridge` sections from lessons where they feel forced.

Tasks:

- Keep product references only where natural.
- Prefer inline review-focused phrasing.
- Avoid app promotion inside small concept lessons.

### Pass 6: Full Academy Content Sweep

After candles and patterns are corrected, repeat the same lesson-type audit across:

- Trading Foundations.
- Chart Reading And Market Structure.
- Volume, Liquidity And Order Flow.
- Risk Management And Trade Planning.
- Technical Indicators And Tools.
- Trading Styles And Playbooks.
- Day Trading Workflow.
- Swing Trading Workflow.
- News, Catalysts And SEC Filings.
- Small-Cap Stocks, Float And Dilution.
- Halts And High-Volatility Events.
- Trading Psychology And Discipline.
- Trade Review And Improvement.
- Practice And Improvement.

## Definition Of Done

The Academy is not done until:

- Lessons feel intentionally written for their topic type.
- New traders can follow a clear path without confusion.
- Candle and chart-pattern sections are professionally grouped.
- The app UI supports learning rather than exposing raw content structure.
- App bridges are restrained and natural.
- No lesson implies a trading signal, prediction, profit, or guaranteed outcome.
- The course/library distinction is clear.
- The previous/next path is obvious.
- Secondary exploration remains available but does not dominate.

