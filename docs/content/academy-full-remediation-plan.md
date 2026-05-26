# TradersLink Academy Full Remediation Plan

Created: 2026-05-18
Last updated: 2026-05-18
Branch target: `codex/trader-ui-product-pass`
Repo: `traderslink-bot/traderslink-trader-improvement-system`

## Purpose

This document is the control plan for improving TradersLink Academy across content quality, course flow, lesson structure, product funnel strategy, and only later UI presentation.

The Academy should feel like a professional free education system for new and developing traders. It should build trust, teach clearly, and naturally guide the right users toward the Trader Intelligence journal app.

The goal is not to create a generic SEO lesson library. The goal is to create useful beginner trading education that connects naturally to the journal, analytics, coaching, review, and improvement features of Trader Intelligence.

## Immediate Priority: Content And Course Structure First

The current problem is mainly the content and course structure, not the UI.

Codex should prioritize:

1. Lesson content quality.
2. Lesson order.
3. Lesson naming.
4. Course and module flow.
5. Removing repeated template sections that do not fit.
6. Making each lesson teach the actual topic clearly.
7. Making Trader Intelligence mentions natural instead of forced.
8. Making the Academy feel like a real beginner trading course.

UI polish can come later. Only touch UI now if a UI issue is directly causing content confusion, broken navigation, duplicate captions, incorrect lesson ordering, or forced product cards.

## UI Priority Rule

Do not redesign the Academy UI during the content remediation unless the UI is blocking the content work.

Only touch UI if needed for one of these reasons:

- The content is displayed in a confusing order.
- Lesson navigation is wrong.
- Images or captions are duplicated or awkward.
- Product-funnel cards are showing in the wrong place.
- Course metadata cannot display because the UI does not support it.
- A content structure improvement requires a small renderer change.

Otherwise, leave UI polish for a later pass.

## Core Diagnosis

The current Academy direction is good, but the lesson content became too template-driven.

Common issues to fix:

1. Many lessons use the same repeated structure even when the structure does not fit the topic.
2. Some sections feel longer than the actual teaching value they provide.
3. `Lesson Objective` is often too obvious or too long for short pattern lessons.
4. `Practical Checklist` appears in places where it feels forced.
5. `Apply This In Review` is being used on static reading lessons where there is no interactive review activity.
6. `Trader Intelligence Bridge` was interpreted too literally and now feels bolted on.
7. Candlestick lessons and chart-pattern lessons need more topic-specific teaching depth.
8. Product funnel copy should feel natural, not like a repeated internal label exposed to users.
9. Some course metadata fields are empty and should be completed to improve course clarity.
10. App mentions should be tied to real product surfaces like journal review, analytics, coaching, risk review, execution review, and playbook building.

## Non-Negotiable Product Strategy

TradersLink Academy is free educational content designed to funnel the right users into the Trader Intelligence journal app.

The funnel should work by making the user think:

> I understand the lesson. Now I can see why reviewing this in my own trades would be useful.

The funnel should not feel like:

> Here is a lesson, and now here is a random product ad.

The Academy should build trust first. Product mentions should support the lesson, not interrupt it.

## Correct Trader Intelligence Funnel Strategy

The original intent was to identify lesson content that naturally relates to the Trader Intelligence app and connect it to the app when useful.

This was misunderstood as adding a repeated visible section called `Trader Intelligence Bridge`.

Do not do that.

### Remove Or Avoid

- Do not use the heading `Trader Intelligence Bridge` inside normal lesson content.
- Do not repeat generic copy across many lessons.
- Do not force an app mention into every lesson.
- Do not make the lesson feel like an ad.
- Do not interrupt the teaching flow.
- Do not imply Trader Intelligence predicts stocks, gives buy/sell signals, guarantees improvement, prevents losses, or diagnoses psychology.

### Use Instead

Use natural product-funnel moments such as:

- Inline lesson-specific mention.
- Small contextual callout.
- Course-level CTA card.
- Module-level CTA card.
- Stronger CTA only inside trade review, coaching, analytics, risk, journaling, and improvement lessons.

Better names for contextual sections:

- `Journal Connection`
- `How This Shows Up In Trade Review`
- `Where Trader Intelligence Helps`
- `Review This In Your Journal`
- `How This Connects To Your Own Trades`

Use these only where they genuinely fit.

## Product Surfaces To Connect To

When a lesson naturally connects to the app, tie it to one or more of these surfaces:

- Trade Journal
- Trade Review
- Execution Review
- Risk Review
- Analytics
- Coaching
- Journal Notes
- Playbook Builder
- Mistake Pattern Tracking
- Progress Tracking
- News/Filing Review
- Session Review

Each app connection must be specific to the lesson topic.

Bad:

> Trader Intelligence is being built to help traders review completed trades by candle pattern, location, volume, entry timing, failure behavior, and repeated reaction patterns.

Better:

> When reviewing a doji trade, the important question is not just whether a doji appeared. The useful review is where it appeared, what level was nearby, and whether price confirmed or ignored the hesitation.

Better with product tie-in:

> Trader Intelligence is designed to help traders review completed trades in that kind of context, so candle names do not become guesses after the fact.

## Funnel Strength Rules

Use different funnel strength depending on lesson type.

### Light Mention

Use for foundation and simple concept lessons.

Examples:

- Candlestick definitions
- Basic chart concepts
- Basic market terms
- Indicator introductions

Recommended style:

A short inline sentence or a small `Journal Connection` paragraph only if useful.

### Medium Mention

Use for lessons where reviewing personal behavior is clearly useful.

Examples:

- Breakout trading
- Chasing stocks
- Pullbacks
- Support and resistance
- Volume confirmation
- VWAP reclaim
- Failed breakout
- Risk/reward
- Stop loss

Recommended style:

A contextual callout that explains how the concept appears in completed trade review.

### Strong Mention

Use where the lesson directly matches the product.

Examples:

- Execution review
- Trade grading
- Mistake pattern review
- Trade review and improvement
- Planned vs actual trade review
- Trading improvement plan
- Coaching lessons
- Analytics lessons
- Risk review lessons

Recommended style:

A clear CTA that ties to Trader Intelligence features.

## Lesson-Type Templates

Do not force every lesson into the same template.

Use the lesson type to decide the structure.

## Concept Lesson Template

Use for support and resistance, volume, liquidity, float, dilution, market cap, SEC filings, halts, sessions, and basic market mechanics.

Recommended sections:

1. What It Means
2. Why Traders Care
3. How It Shows Up On A Chart, Filing, Or Trade
4. What Can Go Wrong
5. Common Mistakes
6. Practical Checklist, only if the checklist is genuinely useful
7. Journal Connection, only if natural
8. Key Takeaway
9. Related Lessons
10. FAQ
11. Educational Disclaimer

Do not use a checklist if the lesson is only explaining a definition and the checklist adds no value.

## Candlestick Course Structure

It is acceptable to have a first lesson called `Candlestick Patterns` followed by individual candle-type lessons such as Doji, Hammer, Engulfing Candle, Long Wick Candle, and Inside Bar.

That structure is correct only if the first lesson is a true overview/foundation lesson.

The first candlestick lesson should not try to teach every candle pattern in detail. It should teach the foundation that makes the later individual candle lessons easier to understand.

### Recommended Display Title

The route can remain `/academy/candlestick-patterns/` for SEO, but the display title should be clearer.

Recommended display title:

> Candlestick Pattern Basics

Other acceptable options:

- How Candlestick Patterns Work
- Candlestick Reading Basics
- Candlestick Anatomy And Context
- How To Read Candlesticks In Context

### What The First Candlestick Lesson Should Teach

The overview lesson should teach:

1. What a candlestick is.
2. Candle body.
3. Candle wick.
4. Open, high, low, close.
5. Close location.
6. Candle range.
7. Why timeframe matters.
8. Why volume matters.
9. Why location matters.
10. Why candle names are not trade signals.
11. How to think about single-candle and multi-candle patterns.
12. Why the next candle and broader chart context matter.

The overview lesson should answer:

> How do candlesticks work, and how should I think about patterns?

Individual candle-type lessons should answer:

> What does this specific candle look like, where does it matter, how does it fail, and what should I watch next?

### Correct Relationship Between Overview And Type Lessons

`Candlestick Pattern Basics` should teach anatomy, context, volume, timeframe, and why patterns are not signals by themselves.

`Doji Candle` should teach what a doji looks like, what hesitation means, when it matters, when it is noise, how confirmation/failure works, and how beginners misuse it.

`Long Wick Candle` should teach rejection, failed pushes, wick direction, close location, level context, and why not every wick is meaningful.

`Engulfing Candle` should teach shift in control, candle relationship, volume/context, false engulfing signals, and confirmation/failure.

The problem is not the existence of an overview lesson. The problem is whether the overview lesson is doing the right job.

## Candlestick Lesson Template

Use for doji, hammer, engulfing candle, long wick, pin bar, inside bar, outside bar, topping tail, bottoming tail, spinning top, red-to-green, green-to-red, and candle-volume confirmation.

Recommended sections:

1. What It Looks Like
2. What It Usually Shows
3. Where It Matters Most
4. What Confirms It
5. What Makes It Weak Or Misleading
6. Beginner Traps
7. Example Chart Read
8. Journal Connection, optional and short
9. Key Takeaway
10. FAQ
11. Educational Disclaimer

Avoid these in normal candlestick lessons unless they truly fit:

- Long `Lesson Objective`
- Generic `Practical Checklist`
- Generic `Apply This In Review`
- Generic `Trader Intelligence Bridge`

Candlestick lessons should teach chart reading, not worksheet behavior.

## Chart Pattern Course Structure

The chart-pattern course should follow the same overview-plus-specific-lessons rule.

It is acceptable to have:

1. Chart Patterns
2. Bull Flag Pattern
3. Ascending Triangle Pattern
4. Failed Breakout Pattern
5. Other specific pattern lessons

But the first chart-pattern lesson should be an overview/foundation lesson, not a shallow duplicate of the individual pattern pages.

Recommended display title options:

- Chart Pattern Basics
- How Chart Patterns Work
- Chart Patterns In Context

The chart-pattern overview should teach:

1. Patterns are structures, not predictions.
2. Clean patterns versus forced patterns.
3. Volume and level context.
4. Risk location.
5. Failure conditions.
6. Why a pattern label is not enough.
7. How the individual pattern lessons will be organized.

## Chart-Pattern Lesson Template

Use for bull flag, ascending triangle, wedge, double top, base breakout, rectangle, channel, parabolic move, failed breakout, inverse head and shoulders, and related chart structures.

Recommended sections:

1. Pattern Structure
2. What Makes It Clean
3. What Makes It Forced
4. Volume And Level Context
5. Where It Usually Fails
6. Entry And Risk Concept, without buy/sell instructions
7. Beginner Mistakes
8. Example Chart Read
9. Journal Connection, optional
10. Key Takeaway
11. FAQ
12. Educational Disclaimer

Chart-pattern lessons should teach the difference between a real structure and a forced label.

## Risk Lesson Template

Use for risk management, stop loss, position sizing, max loss, mental stop vs hard stop, daily loss limit, risk/reward ratio, and overnight risk.

Recommended sections:

1. What The Risk Concept Means
2. Why It Matters
3. How Traders Get In Trouble
4. Planning Before The Trade
5. What To Review After The Trade
6. Common Mistakes
7. Trader Intelligence Connection, stronger CTA allowed
8. Key Takeaway
9. FAQ
10. Educational Disclaimer

Risk lessons can have stronger app connections because Trader Intelligence directly supports risk review.

## Trade Review Lesson Template

Use for execution review, trade grading, mistake pattern review, planned vs actual trade review, trade replay review, trade risk review, watchlist review, session review, and improvement-plan lessons.

Recommended sections:

1. What You Are Reviewing
2. Why It Matters
3. What To Look For
4. Review Questions
5. Mistake Patterns
6. Improvement Plan
7. Where Trader Intelligence Helps
8. Key Takeaway
9. FAQ
10. Educational Disclaimer

This is where `Apply This In Review` belongs if the phrase is used at all.

## Psychology And Discipline Lesson Template

Use for FOMO, revenge trading, overtrading, holding losers, cutting winners, averaging down, trading discipline, and related behavior lessons.

Recommended sections:

1. What The Behavior Looks Like
2. Why It Happens
3. How It Shows Up In Trades
4. What It Can Cost
5. How To Review It Without Excuses
6. Coaching Or Analytics Connection
7. Key Takeaway
8. FAQ
9. Educational Disclaimer

Be careful not to sound like psychological diagnosis. Keep it as trading behavior review.

## Course Flow Guidance

The course sequence is mostly correct and should remain close to this:

1. Trading Foundations
2. Chart Reading And Market Structure
3. Volume, Liquidity And Order Flow
4. Risk Management And Trade Planning
5. Technical Indicators And Tools
6. Trading Styles And Playbooks
7. Day Trading Workflow
8. Swing Trading Workflow
9. News, Catalysts And SEC Filings
10. Small-Cap Stocks, Float And Dilution
11. Halts And High-Volatility Events
12. Trading Psychology And Discipline
13. Trade Review And Improvement
14. Practice And Improvement

A beginner should learn:

- What a stock/trade is.
- How sessions and order flow work.
- Basic day trading versus swing trading.
- Why risk comes first.
- How candlesticks work at a basic level.
- How support and resistance work.
- How breakouts, breakdowns, reclaims, and rejections work.
- How trend structure works.
- How volume and liquidity affect moves.
- How indicators support context but do not replace price action.
- How styles/playbooks differ.
- How news, float, dilution, and halts change risk.
- How psychology and review reveal repeated behavior.
- How practice turns lessons into improvement.

### Chart Reading Course Structure Correction

`Chart Reading And Market Structure` should remain one course. It should not be split into separate candlestick and chart-pattern courses at this stage, because candles, levels, structure, ranges, and chart patterns all depend on one another.

Correct structure:

1. The required course path teaches one core candlestick overview lesson.
2. Individual candle-type pages such as Doji, Long Wick, Engulfing Candle, and Hammer are reference-library pages inside the same course.
3. The required course path teaches one core chart-pattern overview lesson.
4. Individual pattern pages such as Bull Flag, Double Top, Wedge, Failed Breakout, and VWAP Reclaim are reference-library pages inside the same course.
5. Reference-library pages should be available to learners, but they should not reset lesson numbering or look like the main beginner path.
6. The main path should guide learners through candles, levels, breaks/reclaims, structure, intraday reference levels, ranges, chart-pattern context, and gaps.

This keeps the Academy useful for beginners while still preserving deeper reference content for users who want to explore a specific candle or pattern.

## Course Metadata Cleanup

Review `academy/_data/courses.json`.

Fill empty fields such as:

- `audience`
- `course_outcome`

These should guide UI cards and content direction.

Example for `chart-reading-market-structure`:

Audience:

> Beginner and developing traders who need to understand candles, levels, price reactions, trend structure, and intraday chart context before studying advanced setups.

Course outcome:

> By the end, the trader should be able to read basic candles, map key levels, recognize basic structure shifts, avoid chasing poor locations, and explain trades using chart context.

Example for `trade-review-improvement`:

Audience:

> Traders who want to improve by reviewing completed trades, repeated mistakes, execution quality, risk behavior, and decision patterns.

Course outcome:

> By the end, the trader should understand how to turn completed trades into structured review notes, mistake patterns, and practical improvement steps.

## UI And Lesson Presentation Guidance

The lesson page should feel like a polished educational page, not a raw markdown dump.

Important UI/content rules:

1. Static lessons should not pretend to be interactive.
2. Avoid wording that implies the user is completing an in-page exercise unless the UI actually supports it.
3. Lesson navigation should be clear and separate from the lesson body.
4. Related links should not interrupt the teaching flow.
5. Product cards should be visually distinct but not aggressive.
6. Long sidebars should remain helpful and not overwhelm the main reading experience.
7. Course cards should explain who the course is for and what the user will learn.
8. Lesson content should use shorter sections and better visual rhythm.
9. Use images where they teach something specific, not just for decoration.
10. Avoid duplicate alt text or duplicate image captions showing back to back.

## Image And Visual Guidance

For candlestick and chart-pattern lessons, visuals are critical.

Each visual should teach one specific idea.

Good visual uses:

- Candle body, wick, open, high, low, close.
- Doji at resistance with next-candle rejection.
- Doji in chop showing why it is noise.
- Bull flag with clean pullback and defined failure.
- Forced bull flag that is actually extended chop.
- Support becoming resistance after breakdown.
- Resistance becoming support after reclaim.
- Clean level map versus cluttered level map.

Avoid:

- Generic chart images that do not explain the lesson.
- Duplicate image caption text appearing twice.
- Decorative visuals that add no teaching value.

## Priority Pass 1: Candlestick Content And Course Structure

Fix the candlestick overview and type lessons first because the Doji example exposes the template problem clearly.

Content-first remediation order:

1. Fix `academy/candlestick-patterns.md` as the foundation lesson.
2. Fix each individual candlestick lesson so it teaches the unique candle clearly.
3. Clean up forced `Apply This In Review`, `Practical Checklist`, and `Trader Intelligence Bridge` sections across these files.
4. Update lesson display titles if needed for clarity.
5. Keep product mentions natural and minimal unless a journal/review connection is genuinely helpful.
6. Leave UI polish for later unless required by the content.

Files likely involved:

- `academy/candlestick-patterns.md`
- `academy/candlestick-patterns/doji.md`
- `academy/candlestick-patterns/long-wick-candle.md`
- `academy/candlestick-patterns/hammer.md`
- `academy/candlestick-patterns/engulfing-candle.md`
- `academy/candlestick-patterns/inside-bar.md`
- `academy/candlestick-patterns/outside-bar.md`
- `academy/candlestick-patterns/pin-bar.md`
- `academy/candlestick-patterns/spinning-top.md`
- `academy/candlestick-patterns/topping-tail.md`
- `academy/candlestick-patterns/bottoming-tail.md`
- `academy/candlestick-patterns/red-to-green-move.md`
- `academy/candlestick-patterns/green-to-red-move.md`
- `academy/candlestick-patterns/candle-volume-confirmation.md`

### Doji Remediation Requirements

The Doji lesson should not just say indecision.

It should teach:

- What a doji looks like.
- Why open and close being close together matters.
- Why wick size matters.
- Why volume matters.
- Doji in chop.
- Doji after a strong move.
- Doji at resistance.
- Doji at support.
- Doji on low volume.
- Doji on elevated volume.
- Doji followed by confirmation.
- Doji followed by continuation against expected reversal.
- Why a doji is not a trade plan.
- What a beginner should watch next.

Suggested replacement sections:

1. What A Doji Looks Like
2. What A Doji Actually Shows
3. Where A Doji Matters
4. When A Doji Means Almost Nothing
5. Confirmation And Failure
6. Beginner Traps
7. Example Chart Read
8. Journal Connection
9. Key Takeaway
10. FAQ
11. Educational Disclaimer

Keep `Journal Connection` short and natural.

## Priority Pass 2: Chart Patterns In Context

Fix the chart-pattern overview and type lessons after candlesticks.

Content-first remediation order:

1. Fix `academy/chart-patterns.md` as the chart-pattern foundation lesson.
2. Fix each individual chart-pattern lesson so it teaches the unique structure clearly.
3. Clean up forced `Apply This In Review`, `Practical Checklist`, and `Trader Intelligence Bridge` sections across these files.
4. Update lesson display titles if needed for clarity.
5. Keep product mentions natural and minimal unless a journal/review connection is genuinely helpful.
6. Leave UI polish for later unless required by the content.

Files likely involved:

- `academy/chart-patterns.md`
- `academy/chart-patterns/bull-flag.md`
- `academy/chart-patterns/ascending-triangle.md`
- `academy/chart-patterns/base-breakout.md`
- `academy/chart-patterns/channel-pattern.md`
- `academy/chart-patterns/double-top.md`
- `academy/chart-patterns/failed-breakout-pattern.md`
- `academy/chart-patterns/falling-wedge.md`
- `academy/chart-patterns/inverse-head-and-shoulders.md`
- `academy/chart-patterns/parabolic-move.md`
- `academy/chart-patterns/rectangle-pattern.md`
- `academy/chart-patterns/rising-wedge.md`
- `academy/chart-patterns/vwap-reclaim.md`
- `academy/chart-patterns/wedge-pattern.md`

### Bull Flag Remediation Requirements

The Bull Flag lesson should teach the difference between:

- A real controlled pullback.
- Random chop after a green candle.
- A flag that is too extended.
- A flag breaking directly into resistance.
- A failed flag.
- A chase entry.
- A structured entry near defined risk.

Suggested replacement sections:

1. Pattern Structure
2. What Makes A Bull Flag Clean
3. What Makes A Bull Flag Forced
4. Volume And Level Context
5. Where Bull Flags Usually Fail
6. Entry And Risk Concept
7. Beginner Mistakes
8. Example Chart Read
9. Journal Connection
10. Key Takeaway
11. FAQ
12. Educational Disclaimer

## Priority Pass 3: Product Funnel Cleanup

Audit every lesson for the current `Trader Intelligence Bridge` copy.

For each instance:

1. Remove the heading if it appears in lesson markdown.
2. Decide whether the lesson needs a product mention at all.
3. If yes, replace with a natural inline mention or `Journal Connection` callout.
4. Make the copy specific to the exact lesson.
5. Route stronger CTAs to course/module cards or true trade-review lessons.

Example replacements:

### Candlestick Example

Instead of:

> Trader Intelligence is being built to help traders review completed trades by candle pattern, location, volume, entry timing, failure behavior, and repeated reaction patterns.

Use:

> A doji is only useful in review if the trader records the context around it. The important note is where it formed, what level was nearby, and whether price confirmed or ignored the hesitation.

### Risk Example

Use:

> Trader Intelligence is designed to help traders review whether losses came from the setup failing, oversizing, moving stops, averaging down, or ignoring the original invalidation plan.

### Psychology Example

Use:

> One emotional trade may feel random, but repeated FOMO entries, revenge trades, or late exits become easier to see when a journal groups them over time.

### Trade Review Example

Use:

> This is the core reason Trader Intelligence exists: to turn completed trades into reviewable patterns so traders can see what they are repeating instead of guessing from memory.

## Priority Pass 4: Lesson Body Cleanup

Review all lesson files for these weak sections:

- `Lesson Objective`
- `Practical Checklist`
- `Apply This In Review`
- `Trader Intelligence Bridge`

Do not remove them blindly. Decide by lesson type.

### Lesson Objective Rules

Keep only when it helps the user understand a larger course lesson.

For short candle or pattern pages, either remove it or make it one sentence.

Bad:

> By the end of this lesson, you should be able to recognize the pattern, read the candle beside levels, identify failure conditions, review entry and exit, and use the pattern as context.

Better:

> Goal: Learn what a doji shows, where it matters, and why it should not be used as a trade signal by itself.

### Practical Checklist Rules

Use only when the user can actually apply the checklist.

Better for:

- Support and resistance.
- Drawing levels.
- Risk planning.
- Trade plans.
- Review workflows.

Usually not needed for:

- Simple candlestick definitions.
- Simple chart-pattern descriptions.
- Basic glossary-style lessons.

### Apply This In Review Rules

Use mostly in review-specific lessons.

If used elsewhere, rename or rewrite to fit the topic.

Possible alternatives:

- `What To Look For Next`
- `How To Read It On A Chart`
- `What Would Confirm It`
- `How It Fails`
- `Journal Connection`

## Priority Pass 5: Registry And Routing Cleanup

Review these files:

- `academy/_data/courses.json`
- `academy/_data/modules.json`
- `academy/_data/lesson-memberships.json`
- `academy/_data/app-bridges.json`
- `academy/_data/path-hubs.json`
- `academy/_data/visual-overrides.json`

Goals:

1. Make course/module ordering logical for beginners.
2. Make course cards explain audience and outcome.
3. Keep candlestick and chart-pattern libraries as supporting libraries under chart reading.
4. Make bridge metadata drive natural product placement, not repeated lesson text.
5. Make app bridge placement match bridge strength.
6. Keep hard app links disabled unless the route actually exists and is ready.

## Priority Pass 6: UI Rendering Improvements Later

UI work is not the current priority.

Review these only after the content/course pass, or earlier only if content is being displayed incorrectly:

- `app/academy/[...slug]/page.tsx`
- `app/academy/page.tsx`
- `app/academy/courses/[courseId]/page.tsx`
- `app/academy/paths/[pathId]/page.tsx`
- `src/lib/academy/academy-markdown.tsx`
- `src/lib/academy/academy-content.ts`
- `src/lib/academy/academy-progress.tsx`

Goals for the later UI pass:

1. Lesson pages should read like professional articles.
2. Course pages should clearly show course outcomes.
3. Sidebar should help navigation without overwhelming the lesson.
4. Product funnel cards should be optional and context-aware.
5. Do not show a product card just because bridge metadata exists.
6. Product cards should use helpful labels, not internal labels.
7. `Continue The Learning Path` should stay separated from the main lesson body if that improves reading flow.
8. Avoid duplicate image captions or alt text being displayed awkwardly.

## Quality Bar For A Finished Lesson

A finished lesson should pass these checks:

1. Would a brand-new trader understand it?
2. Does it teach the concept clearly without overpromising?
3. Does it avoid signal language?
4. Does it avoid repeated template filler?
5. Does every section belong?
6. Does the image teach something specific?
7. Does the lesson connect to the next lesson naturally?
8. Is any product mention helpful instead of forced?
9. Is the CTA specific to the lesson topic?
10. Would the page make the user trust TradersLink more?

## Quality Bar For A Finished Course

A finished course should pass these checks:

1. The course has a clear audience.
2. The course has a clear outcome.
3. Lessons build in a logical order.
4. Early lessons do not assume advanced knowledge.
5. Later lessons build on earlier concepts.
6. Cross-listed lessons do not confuse progress.
7. Library modules are visually separate from required core lessons.
8. Product funnel moments are present but not aggressive.
9. The course feels useful even if the user never signs up.
10. The course makes the app feel like a logical next step.

## Validation Requirements

After changes, run relevant checks available in the project.

Suggested commands if available:

```bash
npm run validate:academy
npm test
npx tsc --noEmit
```

If the exact Academy validation script name differs, inspect `package.json` and run the correct registry/content validation command.

## Deliverables

Codex should deliver:

1. Updated Academy lesson markdown files.
2. Updated bridge/product funnel strategy in content and/or registry files.
3. Updated course metadata where empty or weak.
4. Updated UI rendering only if needed to support better presentation.
5. A summary of changed files.
6. A short explanation of what changed and why.
7. Validation results.

## Current Branch Progress Notes

These notes preserve the current branch direction and should be updated by Codex after each remediation pass.

### Pass 1: Candlestick Content

Status from current branch: reported complete as of 2026-05-18.

Reported work:

- Rewrote the Doji lesson first as the model cleanup for the candlestick set.
- Cleaned the Candlestick Patterns In Context course overview so candle lessons are grouped by learning role instead of appearing as a flat SEO list.
- Removed forced visible sections from the candlestick lesson set, including `Lesson Objective`, `Practical Checklist`, `Apply This In Review`, and `Trader Intelligence Bridge`.
- Reworked candlestick lessons around topic-specific teaching sections.
- Kept product references natural, restrained, and tied to review behavior instead of repeating a product bridge block.

Codex should verify that this pass now follows the clarified overview-plus-type-lesson structure above.

### Pass 2: Chart Patterns

Status from current branch: reported complete as of 2026-05-18 for the current Chart Patterns In Context markdown files.

Reported work:

- Cleaned the Chart Patterns course overview so it explains pattern groups, including continuation, compression, reversal/failure, and tool-based patterns.
- Reworked the Bull Flag lesson as the model chart-pattern cleanup with clean-versus-forced structure, volume context, risk concept, failure behavior, and a topic-specific journal review section.
- Removed forced visible sections from the chart-pattern lesson set, including `Lesson Objective`, `Practical Checklist`, `Apply This In Review`, and `Trader Intelligence Bridge`.
- Replaced repeated product bridge blocks with topic-specific review sections focused on the actual pattern being taught.
- Neutralized repeated frontmatter CTA copy in the chart-pattern set so product routing can be handled by registry/app bridge data instead of visible template language.

Codex should verify that this pass now follows the clarified overview-plus-type-lesson structure above.

### Pass 3: Product Funnel Cleanup

Status from current branch: broad visible-heading cleanup reported complete as of 2026-05-18.

Reported work:

- Removed the repeated visible `Trader Intelligence Bridge` section from Academy markdown lessons.
- Removed remaining repeated body-level `Trader Intelligence is being built...` sentences from small-cap, dilution, and SEC filing lessons where the copy acted like a generic product bridge instead of lesson-specific education.
- Replaced those repeated small-cap and filing mentions with neutral journal-review language focused on float, filings, dilution context, risk, execution, research gaps, and source context.

Remaining recommendation:

- Frontmatter `cta` fields and intentionally product-focused lessons still contain Trader Intelligence references. Keep those as registry/product-funnel inputs for now, then review them during Priority Pass 5 so route cards can decide when they should be visible.

## Final Reminder

The Academy should not feel like a bunch of SEO pages. It should feel like a real beginner trading course created by someone who understands charts, small caps, risk, psychology, and post-trade improvement.

The free lessons should teach first. The Trader Intelligence app should appear as the natural next step when the lesson makes the reader realize that tracking and reviewing their own trades would help.
