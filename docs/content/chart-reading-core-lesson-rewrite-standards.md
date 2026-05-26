# Chart Reading Core Lesson Rewrite Standards

Created: 2026-05-18
Branch target: `codex/trader-ui-product-pass`
Repo: `traderslink-bot/traderslink-trader-improvement-system`
Related docs:

- `docs/content/academy-full-remediation-plan.md`
- `docs/content/chart-reading-market-structure-course-review.md`

## Purpose

This document gives Codex the exact rewrite standard for the required core lessons inside the **Chart Reading And Market Structure** course.

This is not a UI pass.

This is a content/course-quality pass.

The goal is to make the required core path feel like a professional beginner trading course written by someone who understands chart reading, small-cap trading, risk, and post-trade review.

The course should not feel like repeated SEO pages.

The course should not force generic lesson blocks onto every topic.

The course should teach each concept clearly, in the right order, with practical examples and natural journal/product connections.

## Immediate Work Scope

Focus on the required core path for `Chart Reading And Market Structure`.

Do not rewrite optional candlestick or chart-pattern reference libraries unless a clear issue is found.

Do not redesign UI.

Do not create new routes unless a registry/content fix requires it.

Do update lesson order, previous/next links, and required lesson content.

## Required Core Path Order

Use this order for the required course path:

1. `Candlestick Pattern Basics`
2. `Support and Resistance`
3. `How to Draw Support and Resistance`
4. `Support Levels`
5. `Resistance Levels`
6. `Key Levels Trading`
7. `Swing Highs and Swing Lows`
8. `Higher Highs and Higher Lows`
9. `Lower Highs and Lower Lows`
10. `Price Rejection`
11. `Breakout Trading`
12. `Breakdown Trading`
13. `Level Breakout`
14. `Level Reclaim`
15. `Break of Structure`
16. `Pivot Levels`
17. `Previous Day High Low`
18. `Premarket High Low`
19. `High of Day`
20. `Low of Day`
21. `New High of Day`
22. `Compression`
23. `Consolidation`
24. `Chart Pattern Basics`
25. `Gap Fill Trading`

## Why This Order Matters

Teach chart reading in layers:

1. Candles show the raw price behavior.
2. Levels explain where the behavior is happening.
3. Swing highs/lows explain structure.
4. Trend structure explains progress or weakness.
5. Rejection, breakouts, breakdowns, reclaims, and BOS explain reactions around levels and structure.
6. Intraday reference levels explain session-specific context.
7. Compression and consolidation explain range behavior.
8. Chart patterns combine earlier concepts.
9. Gap fill uses prior-session context and level behavior.

Do not teach `Break of Structure` before the learner understands swing highs, swing lows, higher highs, higher lows, lower highs, and lower lows.

## Required Files To Update Or Review

Registry files:

- `academy/_data/lesson-memberships.json`
- `academy/_data/modules.json`
- `academy/_data/courses.json`

Required lesson files:

- `academy/candlestick-patterns.md`
- `academy/support-and-resistance.md`
- `academy/how-to-draw-support-and-resistance.md`
- `academy/support-levels.md`
- `academy/resistance-levels.md`
- `academy/key-levels-trading.md`
- `academy/swing-highs-and-swing-lows.md`
- `academy/higher-highs-higher-lows.md`
- `academy/lower-highs-lower-lows.md`
- `academy/price-rejection.md`
- `academy/breakout-trading.md`
- `academy/breakdown-trading.md`
- `academy/level-breakout.md`
- `academy/level-reclaim.md`
- `academy/break-of-structure.md`
- `academy/pivot-levels.md`
- `academy/previous-day-high-low.md`
- `academy/premarket-high-low.md`
- `academy/high-of-day.md`
- `academy/low-of-day.md`
- `academy/new-high-of-day.md`
- `academy/compression.md`
- `academy/consolidation.md`
- `academy/chart-patterns.md`
- `academy/gap-fill-trading.md`

## Course Tone Standard

Write like a practical trading instructor.

The tone should be:

- Clear.
- Direct.
- Beginner-friendly.
- Professional.
- Practical.
- Cautious about claims.
- Focused on chart context and review.

Avoid:

- Hype.
- Signal language.
- Guaranteed outcome language.
- Prediction claims.
- Overly academic language.
- Overly generic lesson filler.
- Repeating the same headings in every file.
- Turning every concept into a fake interactive review activity.

## Core Rule: Every Lesson Needs A Specific Job

Every required lesson must have one clear job.

Examples:

- `Support and Resistance` teaches the broad concept of price reaction zones.
- `Support Levels` teaches support-specific behavior.
- `Resistance Levels` teaches resistance-specific behavior.
- `Key Levels Trading` teaches how to combine important levels into a usable map.
- `Breakout Trading` teaches the broad breakout concept and chase risk.
- `Level Breakout` teaches the lifecycle of one marked level after price clears it.
- `Compression` teaches tightening price action and patience.
- `Consolidation` teaches broader sideways digestion and range behavior.

If two lessons sound like they teach the same thing, rewrite them so their jobs are clearly different.

## Section Rules

Do not force the same structure onto every lesson.

Avoid using these headings repeatedly across required lessons unless they truly fit:

- `Lesson Objective`
- `What You Should Understand Before Reading This`
- `Quick Definition`
- `Practical Checklist`
- `Apply This In Review`
- `Trader Intelligence Bridge`

### Lesson Objective Rule

For most lessons, remove the long objective list and replace it with a short one-sentence goal near the intro.

Bad:

```md
## Lesson Objective

By the end of this lesson, you should be able to:

- Explain the concept in chart-reading context.
- Identify where it appears on a realistic chart.
- Review the concept with levels, volume, liquidity, and risk in mind.
- Avoid treating it as a guaranteed trading signal.
```

Better:

```md
Goal: Learn how support and resistance help traders read price location, plan risk, and review whether trades were taken near useful levels.
```

### Practical Checklist Rule

Keep practical checklists only where the lesson teaches a process.

Good places for checklists:

- How to Draw Support and Resistance
- Key Levels Trading
- Risk-oriented level planning
- Trade review lessons

Usually avoid checklist blocks in simple concept lessons unless the checklist is short and genuinely useful.

### Apply This In Review Rule

Do not use `Apply This In Review` as a generic heading.

Use natural headings instead:

- `Review This In Your Journal`
- `How This Shows Up In Trade Review`
- `What To Track After The Trade`
- `Level Review Questions`
- `Key Takeaway`

Use review sections only when the topic naturally connects to completed trade review.

### Trader Intelligence Bridge Rule

Do not use `Trader Intelligence Bridge` as a visible lesson heading.

Product connections should be natural and lesson-specific.

Good:

> In a journal, the useful note is not just that price broke resistance. The useful note is whether the level was marked before the trade, whether volume supported the break, and whether price held above the level after the entry.

Bad:

> Trader Intelligence is being built to help traders review completed trades by pattern, location, volume, entry timing, failure behavior, and repeated reaction patterns.

## Preferred Lesson Structures

## Structure A: Concept Lesson

Use for:

- Support and Resistance
- Support Levels
- Resistance Levels
- Swing Highs and Swing Lows
- Higher Highs and Higher Lows
- Lower Highs and Lower Lows
- Price Rejection
- Pivot Levels
- Previous Day High Low
- Premarket High Low
- High of Day
- Low of Day
- New High of Day

Suggested sections:

```md
# Lesson Title

Intro paragraph that explains the concept in plain language.

Goal: One sentence explaining what the learner should understand after reading.

## What It Means

## Why Traders Watch It

## What It Looks Like On A Chart

## What Makes It Useful

## What Makes It Misleading

## Common Mistakes

## Review This In Your Journal

## Key Takeaway

## Related Lessons

## FAQ

## Educational Disclaimer
```

Use only the sections that fit. Do not include empty or forced sections.

## Structure B: Process Lesson

Use for:

- How to Draw Support and Resistance
- Key Levels Trading

Suggested sections:

```md
# Lesson Title

Intro paragraph explaining the process and why it matters.

Goal: One sentence.

## What You Need First

## Step 1: Start With The Bigger Picture

## Step 2: Mark The Obvious Areas

## Step 3: Keep The Levels That Affect The Current Plan

## Step 4: Remove Clutter

## Clean Example

## Common Mistakes

## Level Review Questions

## Key Takeaway

## FAQ

## Educational Disclaimer
```

## Structure C: Reaction/Break Lesson

Use for:

- Breakout Trading
- Breakdown Trading
- Level Breakout
- Level Reclaim
- Break of Structure

Suggested sections:

```md
# Lesson Title

Intro paragraph explaining the reaction/change in price behavior.

Goal: One sentence.

## What It Means

## What Needs To Be True First

## What A Cleaner Version Looks Like

## What Makes It Risky Or Misleading

## Failure Behavior

## Example Chart Read

## Common Mistakes

## Review This In Your Journal

## Key Takeaway

## FAQ

## Educational Disclaimer
```

## Structure D: Range/Pattern Foundation Lesson

Use for:

- Compression
- Consolidation
- Chart Pattern Basics

Suggested sections:

```md
# Lesson Title

Intro paragraph.

Goal: One sentence.

## What It Means

## What It Looks Like On A Chart

## Why Traders Watch It

## What Makes It Useful

## What Makes It Misleading

## Failure Or Fakeout Behavior

## Common Mistakes

## Review This In Your Journal

## Key Takeaway

## FAQ

## Educational Disclaimer
```

## Structure E: Gap Context Lesson

Use for:

- Gap Fill Trading

Suggested sections:

```md
# Gap Fill Trading

Intro paragraph.

Goal: One sentence.

## What A Gap Is

## What A Gap Fill Means

## Why Traders Watch Gap Areas

## What Makes A Gap Fill More Realistic

## What Makes A Gap Fill Misleading

## Example Chart Read

## Common Mistakes

## Review This In Your Journal

## Key Takeaway

## FAQ

## Educational Disclaimer
```

## Model Rewrite: Support and Resistance

Use this as the style target for broad concept lessons. Codex does not have to copy this word-for-word if existing content is already strong, but the final lesson should match this clarity and structure.

```md
---
title: "Support and Resistance: A Practical Trading Guide"
slug: "/academy/support-and-resistance/"
primary_keyword: "support and resistance"
secondary_keywords:
  - "support levels"
  - "resistance levels"
  - "trading levels"
  - "key levels trading"
  - "support and resistance zones"
search_intent: "Learn what support and resistance are, why traders watch these levels, how to avoid common mistakes, and how to review trades around them."
status: "draft"
product_area: "Education"
availability: "educational"
content_type: "academy_lesson"
funnel_stage: "awareness"
priority: "3"
cta: "Review whether trades happened near useful levels, into resistance, after support failed, or in the middle of an unclear range."
learning_track: "Chart Reading And Market Structure"
academy_level: "Foundation"
academy_order: 2
academy_module: "Chart Reading Basics And Core Levels"
academy_course: "Chart Reading And Market Structure"
recommended_previous: "/academy/candlestick-patterns/"
recommended_next: "/academy/how-to-draw-support-and-resistance/"
visual_assets:
  - "/academy/images/chart-reading/support-resistance-candlestick-diagram.svg"
  - "/academy/images/chart-reading/support-breaks-becomes-resistance.svg"
  - "/academy/images/chart-reading/resistance-breaks-becomes-support.svg"
  - "/academy/images/chart-reading/bad-support-resistance-example.svg"
internal_links:
  - "/academy/how-to-draw-support-and-resistance/"
  - "/academy/support-levels/"
  - "/academy/resistance-levels/"
  - "/academy/key-levels-trading/"
schema:
  - "Article"
  - "FAQPage"
last_reviewed: "2026-05-18"
meta_title: "Support and Resistance Trading Guide"
meta_description: "Learn what support and resistance are, why traders watch key levels, common mistakes, realistic examples, and how to review trades around levels."
---

# Support and Resistance: A Practical Trading Guide

Support and resistance are price areas where traders watch for possible reactions. Support is an area where price has held before or where buyers may step in. Resistance is an area where price has rejected before or where buyers may hesitate.

Goal: Learn how support and resistance help traders read price location, plan risk, and review whether trades were taken near useful levels.

Support and resistance are not magic lines. They are decision areas. Price can bounce, reject, break through, fake out, reclaim, or ignore them depending on volume, liquidity, catalyst strength, order flow, and market context.

## What It Means

Support is usually below the current price. Traders watch it because price has previously held, bounced, or attracted demand there.

Resistance is usually above the current price. Traders watch it because price has previously stalled, rejected, or found supply there.

A level is useful when it helps answer practical questions:

- Where is price compared with an important area?
- Is the trade happening near support, near resistance, or in the middle of a range?
- Where would the trade idea be wrong?
- Where could price run into trouble?
- Did the trader chase into a bad location?

## Why Traders Watch Levels

Levels help traders organize the chart. Instead of reacting to every candle, a trader can compare price to areas that mattered before.

For small-cap and momentum traders, this matters because price can move quickly. A stock can look strong on a scanner, but if it is already pushing into a major resistance area, the trade location may be risky. A stock can look weak, but if it is sitting on support, the trader still needs to see whether support holds, breaks, or reclaims.

## Zones, Not Perfect Lines

Beginners often draw support and resistance as exact lines. That can help at first, but real price action is usually messier.

A better way to think about levels is as zones.

A useful zone may include:

- Candle bodies.
- Wick highs or lows.
- Repeated reactions.
- Prior breakout or breakdown areas.
- Areas where volume expanded.

A good zone should make decisions clearer. If the chart becomes covered in lines, the levels are no longer helping.

![Chart diagram comparing cluttered support and resistance lines with cleaner decision zones.](/academy/images/chart-reading/bad-support-resistance-example.svg)

## When Support Becomes Resistance

Support can become resistance after price breaks below it. Traders who expected support to hold may later sell or hesitate when price retests that same area from below.

![Candlestick chart showing broken support later acting as resistance during a retest.](/academy/images/chart-reading/support-breaks-becomes-resistance.svg)

The important review question is not whether the level was perfect. The important question is whether support failed and whether the trader respected that change.

## When Resistance Becomes Support

Resistance can become support after price breaks above it. Traders often call this a role reversal. The old resistance area becomes a place to watch on a pullback.

![Candlestick chart showing broken resistance later acting as support during a pullback.](/academy/images/chart-reading/resistance-breaks-becomes-support.svg)

This does not guarantee continuation. It gives the trader a clear area to review: did price hold the old resistance area, or did the breakout fail?

## Realistic Example

A stock gaps up after news and pushes from $2.20 to $3.10. It rejects near $3.15 twice before the open.

A trader may mark $3.15 as resistance.

If price later approaches that area again, useful questions include:

- Is volume increasing into the level?
- Is price holding higher lows below resistance?
- Is the stock extended from support?
- Did price reject immediately or consolidate near the level?
- If price breaks through, does it hold above the level or fail back under it?

The level does not tell the trader what to do. It gives the trader context for planning and review.

## Common Mistakes

Common mistakes include:

- Drawing too many levels.
- Treating every level as equally important.
- Expecting penny-perfect reactions.
- Buying directly into resistance without a plan.
- Holding after the support area that defined the trade has failed.
- Moving levels after the trade to make the decision look better.
- Ignoring volume, liquidity, spread, and catalyst context.

## Review This In Your Journal

After a trade, support and resistance review should focus on trade location and decision quality.

Useful journal questions:

- Did I enter near support, near resistance, or in the middle of a range?
- Was I chasing into an obvious resistance area?
- Did I respect the level I planned around?
- Did I keep holding after support failed?
- Did I exit before a planned level without a reason?
- Did the level actually matter, or did I force it onto the chart after the trade?

The goal is not to prove the level was perfect. The goal is to learn whether the decision around the level was planned, consistent, and risk-aware.

## Key Takeaway

Support and resistance are decision areas, not guarantees. They help traders understand price location, plan risk, and review whether entries and exits made sense around important chart zones.

## Related Lessons

- [How to Draw Support and Resistance](/academy/how-to-draw-support-and-resistance/)
- [Support Levels](/academy/support-levels/)
- [Resistance Levels](/academy/resistance-levels/)
- [Key Levels Trading](/academy/key-levels-trading/)

## FAQ

### What is support and resistance in trading?

Support and resistance are price areas where traders watch for possible reactions. Support is usually an area below price where buyers may appear. Resistance is usually an area above price where sellers may appear or buyers may hesitate.

### Are support and resistance exact prices?

Not always. Many traders treat support and resistance as zones rather than exact lines, especially on volatile stocks.

### Does support and resistance guarantee a bounce or rejection?

No. A level can break, reclaim, fake out, or fail. Support and resistance should be used as context, not as a guarantee.

### Why do traders use support and resistance?

Traders use support and resistance to organize risk, plan entries and exits, identify important chart areas, and review whether trades were taken in logical locations.

### How many support and resistance levels should I draw?

Only draw levels that help decision-making. Too many levels can make the chart noisy and harder to use.

## Educational Disclaimer

This guide is for educational purposes only. It is not financial advice and does not tell you to buy, sell, or hold any stock. Support and resistance do not guarantee price movement, profitability, better decisions, or reduced losses. Always use risk management and review your own trades carefully.
```

## Model Rewrite: Breakout Trading

Use this as the style target for reaction/break lessons.

```md
# Breakout Trading: How to Read Breakouts Without Chasing

Breakout trading means watching price move through an important level such as resistance, high of day, premarket high, previous day high, or the top of a range.

Goal: Learn how to read breakout quality without treating every break of resistance as a good trade.

A breakout is not automatically a good setup. The quality depends on the level, volume, liquidity, risk, follow-through, and whether the trader planned the idea before the move or chased after it.

## What A Breakout Actually Is

A breakout happens when price moves above a level that was holding it down.

Common breakout levels include:

- Resistance.
- High of day.
- Premarket high.
- Previous day high.
- Opening range high.
- Range high.
- Chart-pattern resistance.

The break itself is only one part of the read. A useful breakout also needs context around the level.

## What Needs To Be True First

Before calling something a meaningful breakout, the level should matter.

Ask:

- Was the level visible before the move?
- Did price react there before?
- Was price building below the level or randomly spiking?
- Was there room before the next resistance area?
- Was volume supporting the move?
- Was the spread manageable?

If the level was only noticed after the candle already ran, the trade may be more reactive than planned.

## What A Cleaner Breakout Looks Like

Cleaner breakouts often have several things in common:

- A clear level.
- Price pressing into the level.
- Higher lows or tightening action below resistance.
- Volume expanding into the break.
- A manageable spread.
- A defined invalidation area.
- Follow-through or a hold above the broken level.

No single item guarantees continuation. The point is that the trade should be reviewable.

## What Makes A Breakout Risky

Breakouts become harder to manage when the entry is far from the level.

Risk increases when:

- The trader enters after a large candle has already stretched.
- The next resistance level is nearby.
- Volume fades after the break.
- The spread is wide.
- Price immediately falls back under the level.
- The trader has no invalidation plan.

A stock can keep going after an extended breakout, but the trade location may still be poor.

## Failed Breakouts

A failed breakout happens when price breaks above a level but cannot hold above it.

A failed breakout does not mean the level was useless. It means the breakout behavior did not hold.

Useful questions:

- Did price close or hold above the level?
- Did volume continue or fade?
- Did price fall back under the breakout area?
- Did the trader respect the failed level?
- Was the entry late enough that risk became hard to control?

## Example Chart Read

A small-cap stock consolidates under high of day near $3.40. Pullbacks become smaller, and volume starts increasing as price approaches the level.

A planned trader would ask:

- Was $3.40 marked before the trade?
- Did price build below the level?
- Did volume expand during the break?
- Did price hold above $3.40 after the break?
- Was the entry close enough to defined risk?
- Was another resistance level nearby?

If price immediately falls back under $3.40, the trade should be reviewed as a possible failed breakout.

## Common Mistakes

Common breakout mistakes include:

- Buying after the move is already extended.
- Ignoring nearby resistance.
- Assuming volume guarantees continuation.
- Holding after price fails back below the breakout level.
- Re-entering repeatedly without a new setup.
- Calling every green candle a breakout.

## Review This In Your Journal

A breakout trade should be reviewed by separating setup quality from execution quality.

Useful journal questions:

- Was the breakout level marked before the trade?
- Was the entry near the level or far above it?
- Did price hold the level after the break?
- Did volume support the move?
- Did I chase because I was afraid of missing it?
- Did I respect the failed breakout if it lost the level?

The goal is not to prove the breakout was good or bad. The goal is to understand whether the trade was planned, late, or reactive.

## Key Takeaway

A breakout is a move through a level, not a guaranteed opportunity. The best breakout review focuses on level quality, entry location, volume, risk, and what price did after the break.
```

## Model Rewrite: Break Of Structure

Use this as the style target for structure/change lessons.

```md
# Break of Structure: How Traders Review Market Structure Changes

A break of structure happens when price breaks a meaningful swing high, swing low, support area, or resistance area that helped define the current chart structure.

Goal: Learn how to recognize when price has changed the structure that supported the trade idea.

A break of structure does not guarantee a reversal or continuation. It tells the trader that the chart context may have changed.

## What Needs To Be Understood First

Before a trader can identify a break of structure, they need to know what structure existed before the break.

That means identifying:

- Swing highs.
- Swing lows.
- Higher highs.
- Higher lows.
- Lower highs.
- Lower lows.
- Support and resistance.
- The level that mattered to the trade idea.

If there was no clear structure before the break, the break may not mean much.

## What It Means

A break of structure is a meaningful break of a prior structural level.

That level may be:

- A higher low in an uptrend.
- A lower high in a downtrend.
- A range high or range low.
- A support area.
- A resistance area.
- A swing point that defined the trade idea.

The key word is meaningful. A tiny wick through a random level is not always a structure break.

## Uptrend Structure Break

In an uptrend, buyers often defend higher lows. If price loses the most recent meaningful higher low and cannot reclaim it, the uptrend structure may be weakening.

Review questions:

- Which higher low mattered?
- Was that level visible before the trade?
- Did price break it clearly?
- Did price reclaim it or stay below it?
- Did the trader keep holding after the structure failed?

This does not mean the stock must collapse. It means the old structure no longer looks as strong.

## Downtrend Structure Break

In a downtrend, sellers often defend lower highs. If price breaks above a meaningful lower high and holds, the weak structure may be changing.

Review questions:

- Which lower high mattered?
- Did price break above it clearly?
- Did price hold above it or reject back below?
- Was there still major resistance nearby?
- Did the trader keep assuming weakness after structure changed?

This does not guarantee a reversal. It means the prior weakness needs to be reviewed.

## What Makes It Useful

Break of structure is most useful when it changes the trade plan.

It can help traders:

- Identify when a trend is weakening.
- Define invalidation around a swing point.
- Avoid holding after the structure that supported the idea failed.
- Review whether entries aligned with the active structure.
- Compare different timeframes before judging the break.

If the break does not change the plan, it may not be important enough to act on.

## What Makes It Misleading

Break of structure can mislead when traders over-label the chart.

Common problems:

- Calling every wick a structure break.
- Ignoring timeframe.
- Drawing structure only after the trade.
- Assuming every break starts a new trend.
- Ignoring volume and liquidity.
- Forgetting that price can fake out and reclaim quickly.

## Example Chart Read

A stock moves from $2.00 to $3.20 while forming higher lows at $2.35, $2.60, and $2.85.

If price later loses $2.85 and cannot reclaim it, the most recent higher low has failed. That may be a break of structure because the uptrend depended on buyers defending higher pullbacks.

The review is not "the stock must go down now." The review is "the structure that supported the long idea has changed."

## Review This In Your Journal

A structure review should focus on whether the trader adapted when the chart changed.

Useful journal questions:

- What structure was in place before the trade?
- What swing high or swing low mattered most?
- Was the structure level marked before entry?
- Did the break happen on the timeframe that mattered?
- Did the break invalidate the trade idea?
- Did I follow the plan after the structure changed?

## Key Takeaway

A break of structure is a context change, not a prediction. It is useful when it identifies that the level or swing point supporting the trade idea has failed or changed.
```

## Model Rewrite: Compression

Use this as the style target for range/compression lessons.

```md
# Compression Trading: How Traders Review Tightening Price Action

Compression happens when price action tightens and volatility contracts. The chart may show smaller candles, smaller pullbacks, lower volume, and price pressing near a level.

Goal: Learn how to recognize useful compression without assuming it must break in one direction.

Compression can lead to expansion, but it can also fail, fake out, or stay choppy.

## What Compression Looks Like

Compression usually means the range is getting tighter.

Common signs include:

- Smaller candle ranges.
- Smaller pullbacks.
- Higher lows pressing into resistance.
- Lower highs pressing into support.
- Volume drying up before an attempted move.
- A clear level nearby.

The important part is not just that price is tight. It is where the tightness is happening.

## Why Traders Watch It

Traders watch compression because it can show pressure building before a larger move.

Instead of chasing a big candle after expansion, a trader may review whether price tightened first and whether the range created a clearer risk area.

## Compression Near A Level

Compression is more useful when it forms near a meaningful area.

Examples:

- Higher lows under resistance.
- Lower highs above support.
- Tight candles near VWAP.
- A narrow range near high of day.
- A range tightening after a strong move.

Compression in the middle of random chop is less useful.

## Failed Compression Break

A failed compression break happens when price leaves the tight range but cannot hold outside it.

Useful questions:

- Was the range truly tightening before the break?
- Did volume expand on the break?
- Did price hold outside the range?
- Was the entry near the range or late after expansion?
- Did the trader respect the failed side of the setup?

## Common Mistakes

Common mistakes include:

- Entering before the range is actually tight.
- Assuming compression always breaks upward.
- Confusing random chop with useful compression.
- Buying after the expansion candle is already extended.
- Ignoring nearby resistance or support.
- Drawing the range only after the move happens.

## Review This In Your Journal

Compression trades are worth reviewing because they test patience and timing.

Useful journal questions:

- Was price actually compressing, or was it just choppy?
- Did I identify the range before entering?
- Did I enter before the break, on the break, or after the move was extended?
- Did volume confirm the expansion?
- Did price hold the breakout or breakdown level?
- Did I respect the failed level?

## Key Takeaway

Compression is tightening price action near a meaningful area. It can help traders plan around a clearer range, but it does not predict direction by itself.
```

## Overlap Decisions Codex Must Make

## Breakout Trading vs Level Breakout

Keep both only if they are clearly different.

`Breakout Trading` should teach:

- Broad breakout concept.
- Breakout quality.
- Chase risk.
- Failed breakout behavior.

`Level Breakout` should teach:

- What happens after one marked level breaks.
- Whether price holds above the level.
- Whether it retests.
- Whether it fails back below.
- How one specific level moves from resistance to context.

If `Level Breakout` repeats `Breakout Trading`, merge or shorten it.

## Support and Resistance vs Support Levels vs Resistance Levels

Keep all three only if their jobs stay separate.

`Support and Resistance` = broad concept.

`Support Levels` = support-specific behavior.

`Resistance Levels` = resistance-specific behavior.

## High of Day vs New High of Day

Keep both only if their jobs stay separate.

`High of Day` = the current session high as a reference level.

`New High of Day` = the live event of price pushing into a fresh session high, often tied to momentum/scanner behavior.

## Compression vs Consolidation

Keep both only if their jobs stay separate.

`Compression` = tightening range / volatility contraction.

`Consolidation` = broader sideways digestion / range holding.

## Product Funnel Standard

The free Academy course should naturally funnel users toward Trader Intelligence, but the product should not interrupt the lesson.

Use journal/review language when it fits:

- Review whether entries happened near planned levels.
- Review whether breakouts were chased.
- Review whether support failed and was ignored.
- Review whether structure changed and the trader adapted.
- Review whether patterns were visible before the trade or labeled after.

Avoid:

- `Trader Intelligence Bridge`
- generic app copy repeated across lessons
- hard-selling
- prediction claims
- signal language
- guaranteed improvement claims

## Frontmatter CTA Standard

If a lesson has a `cta` field, make it specific to the lesson.

Bad:

```yaml
cta: "Trader Intelligence is being built to help traders review trades around support, resistance, execution, and repeated decision patterns."
```

Better:

```yaml
cta: "Review whether trades happened near useful levels, into resistance, after support failed, or in the middle of an unclear range."
```

Examples:

Support and Resistance:

```yaml
cta: "Review whether trades happened near useful levels, into resistance, after support failed, or in the middle of an unclear range."
```

Breakout Trading:

```yaml
cta: "Review whether breakout entries were planned near a level or chased after extension."
```

Break of Structure:

```yaml
cta: "Review whether trades adapted when the structure supporting the idea changed."
```

Compression:

```yaml
cta: "Review whether tight ranges improved patience and timing or became another reason to anticipate too early."
```

## Execution Instructions For Codex

1. Read this file.
2. Read `docs/content/chart-reading-market-structure-course-review.md`.
3. Read `docs/content/academy-full-remediation-plan.md`.
4. Update the required core lesson order in `academy/_data/lesson-memberships.json`.
5. Update previous/next links for affected lessons.
6. Update frontmatter previous/next values if needed.
7. Rewrite or clean the required core lesson bodies using the standards above.
8. Do not redo optional candlestick/chart-pattern reference libraries unless a clear issue is found.
9. Do not redesign UI.
10. Run validation.
11. Report changed files and validation results.

## Validation

Inspect `package.json` and run the correct Academy validation command.

Suggested commands if available:

```bash
npm run validate:academy
npm test
npx tsc --noEmit
```

If the exact command differs, use the correct command from `package.json`.

## Final Acceptance Criteria

The pass is complete when:

1. Required lesson order matches this document.
2. Swing structure is taught before break of structure.
3. Core lessons no longer feel like repeated templates.
4. Similar lessons have distinct jobs.
5. Product mentions are natural and journal/review-focused.
6. Frontmatter CTA copy is less generic.
7. Optional candle/pattern lessons remain reference libraries.
8. Validation passes.
9. Codex reports remaining concerns clearly.
