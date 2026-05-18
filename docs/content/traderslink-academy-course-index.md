# TradersLink Academy Course Index

## Purpose

This document defines the long-term structure for **TradersLink Academy**.

TradersLink Academy is the evolved form of the `/academy/` section. The original Learn content began as SEO education, but the product direction is now a guided course-based learning system for traders.

The Academy should feel like structured education without calling itself a college or university. Users should be able to move through courses and lessons in a recommended order, track progress, complete lessons, return later, and continue where they left off.

This file is both:

- A strategic plan for how the Academy should work.
- A working index for tracking course and lesson creation progress.

This file is not a production implementation task. Do not create routes, React components, schemas, CSS, or production website files from this document unless explicitly asked.

## Working Product Name

Use this as the working name:

```text
TradersLink Academy
```

Recommended public language:

```text
Build trading skill through guided courses, practical lessons, realistic market examples, and progress tracking.
```

Avoid these names for now:

- TradersLink University
- TradersLink College
- TradersLink School

Reason:

Those names create a useful mental model, but they feel too academic and may overstate the educational format. **Academy** gives the structured learning feel while staying flexible and brandable.

## Core Academy Model

Use this hierarchy:

```text
Academy
  Course
    Module
      Lesson
```

Public UI can simplify this as:

```text
Academy
  Courses
    Lessons
```

Recommended definitions:

- **Academy**: The full TradersLink education experience.
- **Course**: A parent learning path such as Chart Reading, SEC Filings, or Risk Management.
- **Module**: A section inside a course used to group related lessons.
- **Lesson**: A single educational content page with one clear learning objective.
- **Progress**: User-specific completion state for lessons and courses.
- **Review Prompt**: A practical reflection section inside lessons that helps users apply the concept. This should not be positioned as a separate journal product unless the course is specifically about trade review.

## Important Language Decision

Earlier upgraded lessons often used sections like:

```text
How To Review This In Your Trading Journal
```

Going forward, prefer softer lesson-native labels:

```text
Apply This In Review
Review This After A Trade
What To Check In Your Own Trades
After-Trade Review
```

Reason:

Review belongs in the learning flow, but it should not make every lesson feel like it is about journaling. The review section should help users apply the lesson and later connect naturally to Trader Intelligence.

## Academy Learning Principles

Every course should follow these principles:

- Teach concepts in a logical order.
- Let users jump anywhere if they want.
- Never lock users into a rigid path.
- Track progress when users complete lessons.
- Give users a clear next lesson.
- Put content quality and learning value before arbitrary lesson length.
- Make lessons complete enough that users can genuinely learn the topic inside the Academy.
- Avoid buy/sell signal language.
- Avoid guaranteed outcome language.
- Use realistic examples and visuals.
- Use Trader Intelligence as a soft review bridge, not a prediction engine.
- Keep glossary terms as support content, not the main course experience.

## Lesson Depth Standard

Academy lessons are not capped by word count or reading time.

The priority is:

```text
editorial quality -> clear learning -> practical usefulness -> pacing
```

A lesson should be as long as needed to teach the concept well, but no longer than needed to stay focused.

Do not cut important information just because a lesson may take more than 10 minutes to read. If a topic genuinely requires depth, keep the depth. Users should feel that TradersLink Academy gives them the full useful explanation, not a shallow teaser that forces them to search elsewhere.

At the same time, do not pad lessons to increase time on site. Retention should come from the course journey, lesson quality, progress tracking, realistic examples, and clear next steps.

Use these as rough pacing guidelines, not hard caps:

| Lesson Type | Typical Depth | Guidance |
|---|---|---|
| Focused concept lesson | Moderate | Teach one concept clearly with examples, mistakes, and application. |
| Practical workflow lesson | Moderate to deep | Include steps, realistic examples, and review prompts. |
| Major course hub or foundation lesson | Deep when needed | Give users the map, vocabulary, and next path. |
| Technical filing, dilution, risk, or execution lesson | Deep when needed | Do not oversimplify topics where missing details can hurt understanding. |

Split a lesson only when it is trying to teach multiple separate concepts.

Examples:

- `/academy/sec-filings/` can be a deeper hub because users need a filing map.
- `/academy/sec-filings/form-8-k/` can be deep because users need items, exhibits, financing language, and review workflow.
- `/academy/dilution-risk/` can be deep because the topic has real details users need to understand.
- `/academy/rsi/` should stay focused unless it starts teaching multiple indicators or broader momentum theory.
- `/academy/support-levels/` should be complete, but it does not need to become a full market-structure textbook.

The standard is not "short." The standard is **complete, useful, focused, and readable**.

## Completion And Progress Model

Lesson completion should be simple:

```text
Mark Lesson Complete
```

Completion should update:

- Lesson completed state.
- Course progress percentage.
- Academy overall progress.
- Continue-learning card.
- Recently completed lesson history.

Recommended encouragement after completion:

```text
Lesson complete.
You completed 6 of 18 lessons in Chart Reading And Market Structure.
Next lesson: Support Levels.
```

Progress should create small motivation hits without feeling childish:

- Checkmark animation.
- Course progress bar.
- Milestone badges.
- Continue where you left off card.
- Completed lesson count.
- "Next recommended lesson" card.
- Optional streak or weekly progress count.

Avoid:

- Tests and quizzes as required gates.
- Locking lessons behind completion.
- Hype language.
- Treating completion as trading competence.

## Recommended Academy Course Order

Use this as the primary course order on the Academy homepage:

| Order | Course | Status | Why It Sits Here |
|---:|---|---|---|
| 1 | Trading Foundations | academy_ready_core | Completed beginner onboarding and market-basics markdown path, with plan/risk/review lessons cross-listed from completed courses. |
| 2 | Chart Reading And Market Structure | academy_ready_core | Users need candles, levels, structure, breakouts, breakdowns, and chart context early. |
| 3 | Volume, Liquidity And Order Flow | academy_ready_core | Builds on chart reading and teaches whether activity is clean, thin, fast, or crowded. |
| 4 | Risk Management And Trade Planning | academy_ready_core | Risk should come before users study indicators, styles, catalysts, small-cap volatility, and workflows. |
| 5 | Technical Indicators And Tools | academy_ready_core | Completed markdown course path teaches indicators as measurement/context tools after price, levels, volume, and risk. |
| 6 | Trading Styles And Playbooks | academy_ready_core | Completed markdown course path helps users combine chart, volume, tools, and risk into style/playbook categories. |
| 7 | Day Trading Workflow | academy_ready_core | Completed markdown course path covering premarket, watchlists, market open, opening range, midday, power hour, after-hours, and session review. |
| 8 | Swing Trading Workflow | academy_ready_core | Completed markdown course path covering beginner swing planning, risk, levels, volume, catalysts, earnings, news risk, and small-cap swing context. |
| 9 | News, Catalysts And SEC Filings | academy_ready_core | High-value TradersLink differentiator. Core course markdown lesson path is now complete through news-trade review. |
| 10 | Small-Cap Stocks, Float And Dilution | academy_ready_core | Completed markdown course path covering small-cap context, float, share structure, dilution, offerings, securities, corporate actions, cash runway, and going concern. |
| 11 | Halts And High-Volatility Events | academy_ready_core | Completed markdown course path covering halts, resumes, circuit breakers, fast spreads, low-float volatility, and volatile-trade review. |
| 12 | Trading Psychology And Discipline | academy_ready_core | Completed markdown course path covering discipline, FOMO, chasing, revenge trading, overtrading, holding losers, cutting winners, and averaging down. |
| 13 | Trade Review And Improvement | academy_ready_core | Completed markdown course path covering trade review, risk review, planned-vs-actual review, execution review, mistake patterns, swing review, and Trader Intelligence review bridge. |
| 14 | Practice And Improvement | academy_ready_core | Completed markdown course path covering practice loops, paper trading, replay, screenshots, grading, drills, forward testing, and improvement planning. |

Academy Navigation Path Hubs are navigation support, not a numbered course. Use the completed path hubs for Academy homepage entry points, course-page guidance, and continue-learning recommendations.

## 2026-05-17 Academy-Wide Sequence Audit Status

Pass 2 sequence and cross-link audit is complete in:

```text
docs/content/traderslink-academy-sequence-cross-link-audit.md
```

The audit mapped 223 Academy-ready lessons and path hubs, confirmed all `recommended_previous` and `recommended_next` targets resolve locally, fixed stale lesson links, and documented intentional cross-listed navigation exceptions. Future UI should treat the Academy as a course catalog with guided paths and progress-aware recommendations, not as one strict locked lesson chain.

Status definitions:

```text
planned
draft_exists
needs_upgrade
in_progress
academy_ready_core
complete
gap_needed
```

## Academy Readiness Status Model

The older editorial tracker uses `complete` to mean an article has passed the current Learn editorial upgrade workflow.

For TradersLink Academy, use a more precise readiness model:

```text
draft_exists
content_upgraded
academy_format_review_needed
academy_ready
ui_ready
gap_needed
```

Meaning:

- **draft_exists**: A markdown draft exists, but it still needs a full Academy upgrade.
- **content_upgraded**: The lesson has been rewritten as a stronger educational lesson with examples, mistakes, review prompts, links, FAQ/disclaimer, and visuals where useful.
- **academy_format_review_needed**: The lesson is good content, but should be checked against the final Academy structure before website build.
- **academy_ready**: The lesson has final Academy course/module/order metadata, lesson objective, completion behavior assumptions, review-section naming, and next/previous path.
- **ui_ready**: The lesson is ready for production website implementation once the UI is built.
- **gap_needed**: The lesson does not exist yet and should be created.

Important:

The 223 upgraded lessons and path hubs should now be treated as **academy_ready** for the first content-format pass. They still need visual/UI-readiness review before production website implementation.

The migration pass should check:

- `academy_course`
- `academy_module`
- `academy_order`
- `academy_level`
- `recommended_previous`
- `recommended_next`
- cross-listed courses
- consistent lesson objective
- consistent completion CTA assumptions
- review-section naming, especially replacing overused "journal" framing where appropriate
- whether the lesson needs any additional explanation now that it is part of a course
- whether visuals still match the lesson after any content changes

Do not assume a lesson needs a full rewrite just because the Academy format is new. Many completed lessons may only need metadata normalization, section label cleanup, and light additions.

## Course 1: Trading Foundations

### Purpose

Give new traders a clear foundation before they enter charts, scanners, filings, indicators, or setups.

### Audience

- New traders.
- Users overwhelmed by market terminology.
- Users who need basic process before advanced strategy.

### Course Outcome

The user should understand what trading is, why planning matters, what risk means, and why review is part of improvement.

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Start Here | Welcome To TradersLink Academy | `/academy/start-here/` | content_upgraded | complete | New Academy onboarding lesson explaining courses, lessons, progress, review prompts, and non-advice education. |
| 2 | Start Here | How To Use TradersLink Academy | `/academy/how-to-use-traderslink-academy/` | content_upgraded | complete | New lesson explaining navigation, previous/next flow, related lessons, glossary support, completion, and review prompts. |
| 3 | Market Mechanics | What Is A Stock And How Does A Trade Work? | `/academy/what-is-a-stock-and-how-does-a-trade-work/` | content_upgraded | complete | New bridge lesson covering stock ownership, trade matching, bid/ask, last price, order types, liquidity, and review. |
| 4 | Market Mechanics | Stock Market Sessions And Order Flow Basics | `/academy/stock-market-sessions-and-order-flow-basics/` | content_upgraded | complete | New bridge lesson covering premarket, open, midday, close, after-hours, order flow, spread, liquidity, and session review. |
| 5 | Market Basics | Day Trading For Beginners | `/academy/day-trading-for-beginners/` | content_upgraded | complete | Beginner day-trading orientation focused on risk, process, orders, liquidity, review, and avoiding income claims. |
| 6 | Market Basics | Day Trading Vs Swing Trading | `/academy/day-trading-vs-swing-trading/` | content_upgraded | complete | Timeframe comparison covering risk, overnight exposure, screen time, execution, style drift, and review. |
| 7 | Process Basics | Trading Plan | `/academy/trading-plan/` | content_upgraded | complete | Cross-listed from Risk Management course; early process foundation. |
| 8 | Process Basics | Trading Rules | `/academy/trading-rules/` | content_upgraded | complete | Cross-listed from Risk Management course; rules as behavior constraints. |
| 9 | Risk Basics | Risk Management | `/academy/risk-management/` | content_upgraded | complete | Cross-listed from Risk Management course; risk foundation. |
| 10 | Risk Basics | Position Sizing | `/academy/position-sizing/` | content_upgraded | complete | Cross-listed from Risk Management course; size as risk decision. |
| 11 | Risk Basics | Stop Loss | `/academy/stop-loss/` | content_upgraded | complete | Cross-listed from Risk Management course; invalidation and risk control. |
| 12 | Review Basics | Trade Risk Review | `/academy/trade-risk-review/` | content_upgraded | complete | Cross-listed from Trade Review course; early review foundation. |

### Course Status

The Trading Foundations course markdown path is **content_upgraded** across 6 newly created or upgraded beginner lessons plus 6 cross-listed completed plan, risk, and review lessons.

Before production UI implementation, this course still needs:

- Final course membership/cross-listing model so cross-listed Risk and Trade Review lessons can appear in the Trading Foundations sequence without changing canonical lesson ownership.
- Optional first-course visual polish, especially a Trading Foundations course map.
- Progress/lesson completion wiring in the website build phase.

Pass 5 UI readiness note:

- Trading Foundations is ready for UI planning.
- The 12-lesson displayed course path should come from the course index or a future course-membership layer, not only from each lesson's canonical frontmatter.
- Completion should be tracked by lesson slug and count toward every course/path where a cross-listed lesson appears.

### UI Notes

This course should be the first card for new users:

```text
New to trading? Start here.
Build a foundation before jumping into setups, indicators, and fast-moving news.
```

## Course 2: Chart Reading And Market Structure

### Purpose

Teach users how to read price behavior around levels, ranges, structure, breakouts, breakdowns, and gaps.

### Course Outcome

The user should understand how to map obvious levels, recognize market structure, and review price behavior without treating chart patterns as automatic signals.

### Completed Academy-Ready Lessons

These lessons have already been upgraded into the Academy style with metadata, realistic examples, visuals where useful, common mistakes, review prompts, related terms, FAQ, and educational disclaimers.

| Order | Module | Lesson | URL | Status | Last Known Commit |
|---:|---|---|---|---|---|
| 1 | Core Levels | Support And Resistance | `/academy/support-and-resistance/` | complete | `7c46572524af559e42a53a34531272bd3154dd6f` |
| 2 | Core Levels | How To Draw Support And Resistance | `/academy/how-to-draw-support-and-resistance/` | complete | `26daa98458b746ca447a59f593ee5eda6380cffe` |
| 3 | Core Levels | Support Levels | `/academy/support-levels/` | complete | `ea86c4f9` |
| 4 | Core Levels | Resistance Levels | `/academy/resistance-levels/` | complete | `688c4ac7` |
| 5 | Core Levels | Key Levels Trading | `/academy/key-levels-trading/` | complete | `4121eaf9` |
| 6 | Breaks And Reclaims | Breakout Trading | `/academy/breakout-trading/` | complete | `bdd8664e` |
| 7 | Breaks And Reclaims | Breakdown Trading | `/academy/breakdown-trading/` | complete | `bbca46b8` |
| 8 | Breaks And Reclaims | Level Breakout | `/academy/level-breakout/` | complete | `1377793b` |
| 9 | Breaks And Reclaims | Level Reclaim | `/academy/level-reclaim/` | complete | `57664031` |
| 10 | Reaction And Structure | Price Rejection | `/academy/price-rejection/` | complete | `3ff3c7c4` |
| 11 | Reaction And Structure | Break Of Structure | `/academy/break-of-structure/` | complete | `d03cf796` |
| 12 | Swing Structure | Swing Highs And Swing Lows | `/academy/swing-highs-and-swing-lows/` | complete | `94fabc3b` |
| 13 | Swing Structure | Higher Highs And Higher Lows | `/academy/higher-highs-higher-lows/` | complete | `fece7bfe` |
| 14 | Swing Structure | Lower Highs And Lower Lows | `/academy/lower-highs-lower-lows/` | complete | `65a5747d` |
| 15 | Intraday Reference Levels | Pivot Levels | `/academy/pivot-levels/` | complete | `8c7efffa` |
| 16 | Intraday Reference Levels | Previous Day High Low | `/academy/previous-day-high-low/` | complete | `0f638881` |
| 17 | Intraday Reference Levels | Premarket High Low | `/academy/premarket-high-low/` | complete | `a1450f3c` |
| 18 | Intraday Reference Levels | High Of Day | `/academy/high-of-day/` | complete | `b31325b3` |
| 19 | Intraday Reference Levels | Low Of Day | `/academy/low-of-day/` | complete | `b31325b3` |
| 20 | Intraday Reference Levels | New High Of Day | `/academy/new-high-of-day/` | complete | `30cd3b05` |
| 21 | Ranges And Compression | Compression | `/academy/compression/` | complete | `085019d2` |
| 22 | Ranges And Compression | Consolidation | `/academy/consolidation/` | complete | `085019d2` |
| 23 | Gaps | Gap Fill Trading | `/academy/gap-fill-trading/` | complete | `efd6d0ba` |

### Remaining Or Future Chart Lessons

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 35 | Future Chart Reading | Chart Reading Path | `/academy/chart-reading-path/` | gap | gap_needed | Optional later path-hub article if needed for UI/navigation. |

### Completed Candlestick Patterns In Context Course

The candlestick course is **content_upgraded** across all local candlestick drafts, with realistic candlestick SVGs wired where they improve learning.

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Candle Foundation | Candlestick Patterns | `/academy/candlestick-patterns/` | content_upgraded | complete | Course opener; teaches candle anatomy, context, volume, levels, and review. |
| 2 | Wicks And Indecision | Long Wick Candle | `/academy/candlestick-patterns/long-wick-candle/` | content_upgraded | complete | Long upper/lower wick rejection context with realistic SVG support. |
| 3 | Wicks And Indecision | Doji Candle | `/academy/candlestick-patterns/doji/` | content_upgraded | complete | Indecision-at-level context with realistic SVG support. |
| 4 | Rejection And Shift Candles | Engulfing Candle | `/academy/candlestick-patterns/engulfing-candle/` | content_upgraded | complete | Shift-of-control context with realistic SVG support. |
| 5 | Rejection And Shift Candles | Hammer Candlestick | `/academy/candlestick-patterns/hammer/` | content_upgraded | complete | Lower-wick recovery near support with realistic SVG support. |
| 6 | Compression Candles | Inside Bar | `/academy/candlestick-patterns/inside-bar/` | content_upgraded | complete | Compression and range-break review with inside/outside bar SVG support. |
| 7 | Compression Candles | Outside Bar | `/academy/candlestick-patterns/outside-bar/` | content_upgraded | complete | Range expansion and close-location review with inside/outside bar SVG support. |
| 8 | Rejection And Shift Candles | Pin Bar | `/academy/candlestick-patterns/pin-bar/` | content_upgraded | complete | Wick rejection context cross-supported by the long-wick visual. |
| 9 | Tail Candles | Bottoming Tail Candle | `/academy/candlestick-patterns/bottoming-tail/` | content_upgraded | complete | Lower-wick support/recovery context cross-supported by the hammer visual. |
| 10 | Tail Candles | Topping Tail Candle | `/academy/candlestick-patterns/topping-tail/` | content_upgraded | complete | Upper-wick resistance/rejection context cross-supported by the long-wick visual. |
| 11 | Wicks And Indecision | Spinning Top Candle | `/academy/candlestick-patterns/spinning-top/` | content_upgraded | complete | Small-body hesitation context cross-supported by the doji visual. |
| 12 | Candle And Volume Review | Candle Volume Confirmation | `/academy/candlestick-patterns/candle-volume-confirmation/` | content_upgraded | complete | Connects candle shape and volume without treating volume as proof. |
| 13 | Intraday Color Transitions | Red-To-Green Move | `/academy/candlestick-patterns/red-to-green-move/` | content_upgraded | complete | Intraday reference reclaim context with red/green transition visual. |
| 14 | Intraday Color Transitions | Green-To-Red Move | `/academy/candlestick-patterns/green-to-red-move/` | content_upgraded | complete | Intraday reference loss context with red/green transition visual. |

### Completed Chart Patterns In Context Course

The chart-pattern course is **content_upgraded** across all local chart-pattern drafts except VWAP Reclaim, which is already completed and cross-listed from Technical Indicators.

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Pattern Foundation | Chart Patterns | `/academy/chart-patterns/` | content_upgraded | complete | Course opener; teaches patterns as review structures, not predictions. |
| 2 | Continuation Context | Bull Flag Pattern | `/academy/chart-patterns/bull-flag/` | content_upgraded | complete | Controlled pullback context with realistic SVG support. |
| 3 | Continuation Context | Ascending Triangle Pattern | `/academy/chart-patterns/ascending-triangle/` | content_upgraded | complete | Flat resistance and higher-low pressure context with realistic SVG support. |
| 4 | Range And Base Patterns | Base Breakout | `/academy/chart-patterns/base-breakout/` | content_upgraded | complete | Base/range breakout and hold/fail review with realistic SVG support. |
| 5 | Range And Base Patterns | Rectangle Pattern | `/academy/chart-patterns/rectangle-pattern/` | content_upgraded | complete | Sideways range support/resistance context with realistic SVG support. |
| 6 | Trend Channels And Wedges | Channel Pattern | `/academy/chart-patterns/channel-pattern/` | content_upgraded | complete | Sloped range context with realistic SVG support. |
| 7 | Trend Channels And Wedges | Wedge Pattern | `/academy/chart-patterns/wedge-pattern/` | content_upgraded | complete | Narrowing range/compression context with realistic SVG support. |
| 8 | Trend Channels And Wedges | Rising Wedge | `/academy/chart-patterns/rising-wedge/` | content_upgraded | complete | Upward narrowing structure with break/failure review. |
| 9 | Trend Channels And Wedges | Falling Wedge | `/academy/chart-patterns/falling-wedge/` | content_upgraded | complete | Downward narrowing structure with reclaim/failure review. |
| 10 | Reversal And Failure Context | Double Top | `/academy/chart-patterns/double-top/` | content_upgraded | complete | Repeated resistance context with realistic SVG support. |
| 11 | Reversal And Failure Context | Inverse Head And Shoulders | `/academy/chart-patterns/inverse-head-and-shoulders/` | content_upgraded | complete | Neckline and improving-structure context with realistic SVG support. |
| 12 | Reversal And Failure Context | Failed Breakout Pattern | `/academy/chart-patterns/failed-breakout-pattern/` | content_upgraded | complete | Breakout failure and late-entry review with realistic SVG support. |
| 13 | Extension Context | Parabolic Move | `/academy/chart-patterns/parabolic-move/` | content_upgraded | complete | Acceleration/extension risk context with realistic SVG support. |
| 14 | Setup Tool Context | VWAP Reclaim | `/academy/chart-patterns/vwap-reclaim/` | content_upgraded | complete | Cross-listed from Technical Indicators And Tools. |

### UI Readiness Status

Pass 5 UI readiness review is complete in `docs/content/traderslink-academy-ui-readiness-chart-reading.md`.

Recommended future UI model:

- Show Chart Reading And Market Structure as one parent course.
- Show the 23 core Chart Reading lessons as the primary course path.
- Show Candlestick Patterns In Context and Chart Patterns In Context as supporting submodules or pattern libraries.
- Track core course progress separately from candlestick and chart-pattern library progress.
- Store lesson completion by slug so cross-listed lessons such as `/academy/chart-patterns/vwap-reclaim/` can count in every course or library where they appear.
- Use context-specific navigation inside the future UI so learners entering from Chart Patterns can continue through the chart-pattern library while canonical lesson ownership stays unchanged.

## Course 3: Volume, Liquidity And Order Flow

### Purpose

Teach users how participation, liquidity, spread, fills, Level 2, tape, and volume context affect trade quality.

### Course Outcome

The user should understand that activity and liquidity are context, not confirmation. They should know how volume, bid/ask, spread, slippage, Level 2, time and sales, and unusual volume affect review.

### Completed Academy-Ready Lessons

| Order | Module | Lesson | URL | Status | Last Known Commit |
|---:|---|---|---|---|---|
| 1 | Volume Foundation | Volume | `/academy/volume/` | complete | `72a62c5a` |
| 2 | Volume Foundation | Relative Volume | `/academy/relative-volume/` | complete | `f191d165` |
| 3 | Volume Foundation | Relative Volume RVOL | `/academy/relative-volume-rvol/` | complete | `f714877e` |
| 4 | Volume Foundation | Volume Spike | `/academy/volume-spike/` | complete | `b74f09f9` |
| 5 | Liquidity Foundation | Liquidity | `/academy/liquidity/` | complete | `debb3ce8` |
| 6 | Liquidity Foundation | Dollar Volume | `/academy/dollar-volume/` | complete | `30d417ee` |
| 7 | Liquidity Foundation | Spread | `/academy/spread/` | complete | `255f7a89` |
| 8 | Quotes And Execution | Bid And Ask | `/academy/bid-and-ask/` | complete | `5dd2af67` |
| 9 | Quotes And Execution | Slippage | `/academy/slippage/` | complete | `13a86228` |
| 10 | Quotes And Execution | Market Orders Vs Limit Orders | `/academy/market-orders-vs-limit-orders/` | complete | `8ac5648f` |
| 11 | Order Flow Tools | Level 2 | `/academy/level-2/` | complete | `8a9fc350` |
| 12 | Order Flow Tools | Time And Sales | `/academy/time-and-sales/` | complete | `58ea3ca3` |
| 13 | Volume At Price | Volume By Price | `/academy/volume-by-price/` | complete | `5a5bfc59` |
| 14 | Scanner Context | Unusual Volume | `/academy/unusual-volume/` | complete | `80c78592` |

### Course Status

The core Volume, Liquidity And Order Flow course is **academy_ready_core**.

Future additions can exist, but the main path is already strong enough for a website course build.

### UI Readiness Status

Pass 5 UI readiness review is complete in `docs/content/traderslink-academy-ui-readiness-volume-liquidity.md`.

Recommended future UI model:

- Show Volume, Liquidity And Order Flow as one compact 14-lesson course.
- Group the course into Volume Foundation, Liquidity Foundation, Quotes And Execution, Order Flow Tools, Volume At Price, and Scanner Context.
- Use a straightforward `completed lessons / 14` progress model.
- Treat execution-mechanics visuals as important learning assets; do not crop quote panels, spread labels, fills, Level 2 depth, time-and-sales prints, or volume-by-price profiles into unreadable thumbnails.
- Keep app bridges restrained and review-focused, with Execution Review as the strongest future surface once routes and fields are stable.
- Store completion by lesson slug so cross-listed uses of volume, liquidity, spread, slippage, volume-by-price, and unusual volume can count wherever those lessons appear.

## Course 4: Technical Indicators And Tools

### Purpose

Teach indicators as measurement and context tools, not signal machines.

### Course Outcome

The user should understand what each indicator measures, when it can help, when it can mislead, and how it should be reviewed with price, volume, levels, and risk.

### Framing Rule

Do not teach indicators as:

```text
RSI below 30 means buy.
MACD cross means buy.
VWAP break means buy.
```

Teach them as:

```text
What the indicator measures.
What context it can add.
When it becomes misleading.
How to review it with price, volume, levels, and risk.
```

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Indicator Foundation | What Are Trading Indicators? | `/academy/trading-indicators/` | content_upgraded | complete | New course opener; indicators framed as context and measurement tools, not signals. |
| 2 | Indicator Foundation | Indicators Lag Price | `/academy/why-indicators-lag/` | content_upgraded | complete | Teaches confirmation versus prediction and late-entry risk. |
| 3 | Indicator Foundation | Indicator Overload | `/academy/indicator-overload/` | content_upgraded | complete | Teaches tool clutter, duplicate inputs, and simpler review. |
| 4 | Trend Tools | Moving Averages | `/academy/moving-averages/` | content_upgraded | complete | Covers trend context, lag, chop risk, and late confirmation. |
| 5 | Trend Tools | VWAP | `/academy/vwap/` | content_upgraded | complete | Teaches intraday average-price context without treating VWAP as support/resistance certainty. |
| 6 | Trend Tools | Anchored VWAP | `/academy/anchored-vwap/` | content_upgraded | complete | Covers event-based anchors, anchor bias, and review discipline. |
| 7 | Momentum Tools | RSI | `/academy/rsi/` | content_upgraded | complete | Teaches momentum context and overbought/oversold caution without signal language. |
| 8 | Momentum Tools | MACD | `/academy/macd/` | content_upgraded | complete | Teaches momentum shifts, histogram context, lag, and choppy cross risk. |
| 9 | Volatility Tools | Bollinger Bands | `/academy/bollinger-bands/` | content_upgraded | complete | Teaches volatility expansion/contraction and band-touch caution. |
| 10 | Volatility Tools | ATR | `/academy/atr/` | content_upgraded | complete | Bridges volatility, risk distance, position sizing, spread, and slippage review. |
| 11 | Volume Tools | Volume By Price | `/academy/volume-by-price/` | content_upgraded | complete | Cross-listed from Volume course; useful as a volume-at-price tool. |
| 12 | Setup Tool Context | VWAP Reclaim | `/academy/chart-patterns/vwap-reclaim/` | content_upgraded | complete | Teaches VWAP reclaim behavior, failed reclaims, chase risk, and review context. |

### Course Status

The Technical Indicators And Tools course markdown path is **academy_ready_core** across 11 newly created or upgraded lessons plus the cross-listed Volume By Price lesson from the completed Volume course.

Before production UI implementation, this course still needs:

- Visual asset review for indicator-specific diagrams where visuals would improve learning.
- Optional realistic SVGs for VWAP, RSI/MACD, Bollinger Bands, and ATR only if they clearly support the lesson content.
- Final production UI schema review once the website build begins.

## Course 5: Trading Styles And Playbooks

### Purpose

Help users understand different trading styles and setup categories after they understand charts, volume, and basic tools.

### Course Outcome

The user should understand how traders categorize trade ideas without treating any style or setup as a guaranteed edge.

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Style Selector | Trading Styles Overview | `/academy/trading-styles/` | content_upgraded | complete | New course opener; explains styles as review/playbook categories, not identities or guarantees. |
| 2 | Style Selector | Day Trading | `/academy/day-trading/` | content_upgraded | complete | Style overview focused on intraday planning, risk, execution, and review. |
| 3 | Style Selector | Swing Trading | `/academy/swing-trading/` | content_upgraded | complete | Style overview focused on multi-session planning, overnight risk, catalyst review, and style drift. |
| 4 | Style Selector | Scalping Stocks | `/academy/scalping-stocks/` | content_upgraded | complete | Execution-sensitive style lesson covering spread, slippage, liquidity, trade count, and review. |
| 5 | Style Selector | Short Selling Basics | `/academy/short-selling-basics/` | content_upgraded | complete | New bridge lesson covering borrowed shares, covering, borrow risk, squeeze risk, halt risk, and review without short-signal framing. |
| 6 | Style Selector | Momentum Trading | `/academy/momentum-trading/` | content_upgraded | complete | Teaches momentum as planned participation context and separates it from chasing. |
| 7 | Setup Types | Pullbacks And Dip-Buy Setups | `/academy/pullbacks-and-dip-buy-setups/` | content_upgraded | complete | Gap lesson created with careful review-based framing; avoids treating dips as instructions. |
| 8 | Setup Types | Breakout Setups | `/academy/breakout-trading/` | content_upgraded | complete | Cross-listed from Chart Reading. |
| 9 | Setup Types | Breakdown Setups | `/academy/breakdown-trading/` | content_upgraded | complete | Cross-listed from Chart Reading. |
| 10 | Setup Types | Reclaim Setups | `/academy/level-reclaim/` | content_upgraded | complete | Cross-listed from Chart Reading. |
| 11 | Setup Types | Gap Fill Setups | `/academy/gap-fill-trading/` | content_upgraded | complete | Cross-listed from Chart Reading. |
| 12 | Setup Types | News Fade | `/academy/news-fade/` | content_upgraded | complete | Teaches catalyst/reaction fade review without assuming every news move fades. |
| 13 | Setup Types | Sell The News | `/academy/sell-the-news/` | content_upgraded | complete | Teaches expected-news reaction review without using the phrase as a trade command. |
| 14 | Multi-Day Context | Multi-Day Runner | `/academy/multi-day-runner/` | content_upgraded | complete | Teaches attention, float, volume, supply, exhaustion, and chase-risk context. |
| 15 | Risk Context | Chasing Stocks | `/academy/chasing-stocks/` | content_upgraded | complete | Cross-listed from Trading Psychology; caps the course with late-entry risk review. |

### Course Status

The Trading Styles And Playbooks course markdown path is **academy_ready_core** across 10 newly created or upgraded lessons plus 5 cross-listed completed lessons from Chart Reading and Trading Psychology.

Before production UI implementation, this course still needs:

- Visual asset review for style-selector or playbook-flow diagrams if they improve learning.
- Optional realistic chart/workflow visuals for momentum, pullbacks, news fades, sell-the-news reactions, and multi-day runners.
- Final production UI schema review once the website build begins.

## Course 6: News, Catalysts And SEC Filings

### Purpose

Teach users how to review news, catalysts, company announcements, filings, and event-driven stock movement.

### Course Outcome

The user should understand what caused a stock to move, how to review the quality of the catalyst, how filings change context, and how to avoid headline chasing.

### Completed Academy-Ready Lessons

| Order | Module | Lesson | URL | Status | Last Known Commit |
|---:|---|---|---|---|---|
| 1 | Catalyst Foundation | Stock Catalysts | `/academy/stock-catalysts/` | complete | `63dff225` |
| 2 | Press Releases | Stock Press Releases | `/academy/press-releases/` | complete | `a089acc5` |
| 3 | Press Releases | How To Read Stock Press Releases | `/academy/how-to-read-stock-press-releases/` | complete | `31f3f02c` |
| 4 | SEC Filing Foundation | SEC Filings | `/academy/sec-filings/` | complete | `4616c671` |
| 5 | SEC Filing Foundation | How To Use EDGAR Source Documents | `/academy/how-to-use-edgar-source-documents/` | complete | `57dfbb82` |

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 6 | SEC Filing Foundation | Form 8-K | `/academy/sec-filings/form-8-k/` | content_upgraded | complete | Current-event filing workflow, item/exhibit review, financing language, and review prompts added. |
| 7 | Company Reports | Form 10-K | `/academy/sec-filings/form-10-k/` | content_upgraded | complete | Annual report, audited financials, risk factors, cash, debt, share structure, and going-concern context. |
| 8 | Company Reports | Form 10-Q | `/academy/sec-filings/form-10-q/` | content_upgraded | complete | Quarterly report, unaudited financials, cash changes, operating updates, and risk review. |
| 9 | Company Reports | Form 20-F | `/academy/sec-filings/form-20-f/` | content_upgraded | complete | Foreign private issuer annual report context, financial statements, and risk disclosures. |
| 10 | Company Reports | Form 6-K | `/academy/sec-filings/form-6-k/` | content_upgraded | complete | Foreign issuer current reports, foreign-market disclosures, press releases, and interim updates. |
| 11 | Registration Statements | Form S-1 | `/academy/sec-filings/form-s-1/` | content_upgraded | complete | Registration statement, resale shares, selling stockholders, warrants, and future supply context. |
| 12 | Registration Statements | Form S-3 | `/academy/sec-filings/form-s-3/` | content_upgraded | complete | Shelf registration, offering distinction, eligibility, and future offering context. |
| 13 | Registration Statements | Form F-1 | `/academy/sec-filings/form-f-1/` | content_upgraded | complete | Foreign issuer registration statement, IPO/resale context, risk factors, and share supply. |
| 14 | Registration Statements | Form F-3 | `/academy/sec-filings/form-f-3/` | content_upgraded | complete | Foreign issuer shelf registration, eligibility, prospectus supplements, and offering context. |
| 15 | Transaction Registration | Form S-4 | `/academy/sec-filings/form-s-4/` | content_upgraded | complete | Merger securities, exchange offers, shareholder votes, transaction terms, and deal risk. |
| 16 | Transaction Registration | Form S-8 | `/academy/sec-filings/form-s-8/` | content_upgraded | complete | Employee benefit plan securities, compensation shares, available share pools, and supply context. |
| 17 | Prospectus Supplements | Form 424B5 | `/academy/sec-filings/form-424b5/` | content_upgraded | complete | Prospectus supplement, offering terms, warrants, proceeds, and dilution context. |
| 18 | Prospectus Supplements | Form 424B3 | `/academy/sec-filings/form-424b3/` | content_upgraded | complete | Prospectus updates, resale context, registered securities, and plan of distribution. |
| 19 | Prospectus Supplements | Form 424B4 | `/academy/sec-filings/form-424b4/` | content_upgraded | complete | Final prospectus details, offering terms, underwriters, proceeds, and risk disclosure. |
| 20 | Registration Effectiveness | EFFECT Notice | `/academy/sec-filings/effect-notice/` | content_upgraded | complete | Effectiveness notice, related registration statement, resale eligibility, and timing context. |
| 21 | Insider Ownership | Form 3 | `/academy/sec-filings/form-3/` | content_upgraded | complete | Initial insider ownership, officer/director holdings, and beneficial ownership baseline. |
| 22 | Insider Ownership | Form 4 | `/academy/sec-filings/form-4/` | content_upgraded | complete | Insider transactions, transaction codes, grants, exercises, sales, and footnotes. |
| 23 | Insider Ownership | Form 5 | `/academy/sec-filings/form-5/` | content_upgraded | complete | Annual insider ownership cleanup, late/exempt transactions, and follow-up review. |
| 24 | Beneficial Ownership | Schedule 13D | `/academy/sec-filings/schedule-13d/` | content_upgraded | complete | Large beneficial ownership, activist intent, purpose of transaction, and position changes. |
| 25 | Beneficial Ownership | Schedule 13G | `/academy/sec-filings/schedule-13g/` | content_upgraded | complete | Passive/institutional beneficial ownership, ownership percentage, amendments, and float context. |
| 26 | Proxy Statements | Form DEF 14A | `/academy/sec-filings/form-def-14a/` | content_upgraded | complete | Definitive proxy statements, shareholder votes, governance, compensation, and meeting proposals. |
| 27 | Proxy Statements | Form PRE 14A | `/academy/sec-filings/form-pre-14a/` | content_upgraded | complete | Preliminary proxy statements, proposed votes, corporate actions, and changes before final proxy. |
| 28 | Late Filing Notices | NT 10-K | `/academy/sec-filings/nt-10-k/` | content_upgraded | complete | Late annual report notices, delay reasons, reporting risk, and follow-up filing review. |
| 29 | Late Filing Notices | NT 10-Q | `/academy/sec-filings/nt-10-q/` | content_upgraded | complete | Late quarterly report notices, delay reasons, reporting controls, and follow-up 10-Q context. |
| 30 | Exchange And Listing Events | Form 25 | `/academy/sec-filings/form-25/` | content_upgraded | complete | Delisting, exchange removal, deregistration context, listing status, and liquidity risk. |
| 31 | News Categories | Earnings News | `/academy/earnings-news/` | content_upgraded | complete | Revenue, losses, margins, guidance, cash, and reaction review added. |
| 32 | News Categories | FDA News Stocks | `/academy/fda-news-stocks/` | content_upgraded | complete | Regulatory event types, development stage, cash context, and review workflow added. |
| 33 | News Categories | Clinical Trial News | `/academy/clinical-trial-news/` | content_upgraded | complete | Phase, endpoints, sample size, safety, cash context, and review workflow added. |
| 34 | News Categories | Contract News Stocks | `/academy/contract-news-stocks/` | content_upgraded | complete | Customer name, terms, value, timing, execution context, and review workflow added. |
| 35 | News Categories | Partnership News Stocks | `/academy/partnership-news-stocks/` | content_upgraded | complete | Partner quality, terms, commercial mechanics, filing context, and review workflow added. |
| 36 | News Categories | Merger News Stocks | `/academy/merger-news-stocks/` | content_upgraded | complete | Deal type, consideration, closing conditions, filings, dilution context, and review workflow added. |
| 37 | News Review | How To Review News Trades | `/academy/how-to-review-news-trades/` | content_upgraded | complete | Course capstone review lesson added for catalyst, reaction, risk, execution, and repeated patterns. |

### Course Status

The News, Catalysts And SEC Filings course markdown path is **academy_ready_core** across the catalyst, press release, EDGAR source-document, SEC filing, news category, and news-trade review lessons.

Before production UI implementation, this course still needs:

- Visual asset review to decide which filing/news lessons need SVG support.
- Optional course intro/landing copy for the Academy course page.
- Final production UI schema review once the website build begins.

## Course 7: Small-Cap Stocks, Float And Dilution

### Purpose

Teach small-cap-specific context: float, share structure, offerings, dilution, warrants, reverse splits, cash needs, and financing cycles.

### Course Outcome

The user should understand that small-cap stock movement often depends on float, liquidity, share supply, financing history, and dilution risk.

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Small-Cap Foundation | Small-Cap Stocks | `/academy/small-cap-stocks/` | content_upgraded | complete | Course opener covering market cap, volatility, liquidity, catalysts, filings, and risk. |
| 2 | Small-Cap Foundation | Penny Stocks | `/academy/penny-stocks/` | content_upgraded | complete | Penny-stock risk, low-priced securities, spreads, promotions, and company quality. |
| 3 | Float Foundation | Stock Float | `/academy/stock-float/` | content_upgraded | complete | Tradable share supply, float size, liquidity, turnover, and share availability. |
| 4 | Float Foundation | Low Float Stocks | `/academy/low-float-stocks/` | content_upgraded | complete | Low-float volatility, liquidity gaps, halts, spread risk, and crowding. |
| 5 | Float Foundation | Float Rotation | `/academy/float-rotation/` | content_upgraded | complete | Volume versus float, scanner context, repeated turnover, and crowding risk. |
| 6 | Share Structure | Float Vs Shares Outstanding | `/academy/float-vs-shares-outstanding/` | content_upgraded | complete | Float, shares outstanding, restricted shares, insider holdings, and tradable supply. |
| 7 | Share Structure | Fully Diluted Shares | `/academy/fully-diluted-shares/` | content_upgraded | complete | Warrants, options, convertibles, preferred stock, and potential future share count. |
| 8 | Valuation Context | Market Cap Vs Fully Diluted Market Cap | `/academy/market-cap-vs-fully-diluted-market-cap/` | content_upgraded | complete | Basic market cap versus fully diluted valuation and hidden supply context. |
| 9 | Dilution Foundation | Dilution | `/academy/dilution/` | content_upgraded | complete | New share issuance, ownership percentage, share count, and financing context. |
| 10 | Dilution Foundation | Dilution Risk | `/academy/dilution-risk/` | content_upgraded | complete | Cash needs, financing mechanisms, shelf registrations, warrants, convertibles, and offering risk. |
| 11 | Dilution Foundation | How To Spot Dilution Risk | `/academy/how-to-spot-dilution-risk/` | content_upgraded | complete | Cash runway, filings, shelf capacity, ATM programs, warrants, convertibles, and financing history. |
| 12 | Offerings | Stock Offerings | `/academy/stock-offerings/` | content_upgraded | complete | Equity offering structures, pricing, proceeds, share count, warrants, and financing context. |
| 13 | Offerings | Public Offering | `/academy/public-offering/` | content_upgraded | complete | Registered public offerings, pricing, underwriters, warrants, proceeds, and dilution context. |
| 14 | Offerings | Registered Direct Offering | `/academy/registered-direct-offering/` | content_upgraded | complete | Registered direct offerings, investors, pricing, warrants, placement agents, and share supply. |
| 15 | Offerings | Private Placement | `/academy/private-placement/` | content_upgraded | complete | Private placements, restricted securities, registration rights, warrants, and resale context. |
| 16 | Offerings | At The Market Offering | `/academy/at-the-market-offering/` | content_upgraded | complete | ATM programs, shelf capacity, gradual share sales, volume impact, and filing context. |
| 17 | Offerings | Shelf Registration | `/academy/shelf-registration/` | content_upgraded | complete | Shelf capacity, future offerings, prospectus supplements, and timing context. |
| 18 | Offerings | Shelf Registration Vs Offering | `/academy/shelf-registration-vs-offering/` | content_upgraded | complete | Difference between registering securities and actually selling securities. |
| 19 | Securities | Warrants | `/academy/warrants/` | content_upgraded | complete | Warrant terms, exercise price, expiration, cashless exercise, and potential future shares. |
| 20 | Securities | Warrants Vs Options | `/academy/warrants-vs-options/` | content_upgraded | complete | Warrant/option differences, issuer impact, dilution, and trading context. |
| 21 | Securities | Pre-Funded Warrants | `/academy/pre-funded-warrants/` | content_upgraded | complete | Pre-funded warrant mechanics, ownership limits, offering structure, and share-count context. |
| 22 | Securities | Convertible Notes | `/academy/convertible-notes/` | content_upgraded | complete | Convertible debt, conversion terms, fixed versus variable conversion, and dilution risk. |
| 23 | Securities | Preferred Stock | `/academy/preferred-stock/` | content_upgraded | complete | Preferred stock rights, conversion, liquidation preference, voting, and dilution context. |
| 24 | Corporate Actions | Reverse Split | `/academy/reverse-split/` | content_upgraded | complete | Reverse split mechanics, exchange compliance, share count adjustment, and post-split context. |
| 25 | Corporate Actions | Reverse Split Vs Dilution | `/academy/reverse-split-vs-dilution/` | content_upgraded | complete | Difference between share consolidation and ownership dilution. |
| 26 | Corporate Actions | Forward Split | `/academy/forward-split/` | content_upgraded | complete | Forward split mechanics, share count adjustment, price adjustment, and context review. |
| 27 | Risk Context | Cash Runway | `/academy/cash-runway/` | content_upgraded | complete | Cash balance, burn rate, financing runway, and capital need review. |
| 28 | Risk Context | Going Concern | `/academy/going-concern/` | content_upgraded | complete | Going concern warnings, substantial doubt, cash needs, operating losses, and financing risk. |

### Course Status

The Small-Cap Stocks, Float And Dilution course markdown path is **academy_ready_core** across all 28 planned lessons.

Before production UI implementation, this course still needs:

- Visual asset review to decide which lessons need chart, filing, or share-structure diagrams.
- Optional course intro/landing copy for the Academy course page.
- Final production UI schema review once the website build begins.


## Course 8: Risk Management And Trade Planning

### Purpose

Teach users how to define risk, size trades, plan invalidation, manage trades, and protect against preventable account damage.

### Course Outcome

The user should understand how risk, sizing, stops, loss limits, reward/risk, and trade plans work together.

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Planning | Trading Plan | `/academy/trading-plan/` | content_upgraded | complete | Course opener covering written process, setup criteria, risk rules, and review process. |
| 2 | Planning | Trading Rules | `/academy/trading-rules/` | content_upgraded | complete | Rule clarity, behavior constraints, triggers, exceptions, and review process. |
| 3 | Risk Basics | Risk Management | `/academy/risk-management/` | content_upgraded | complete | Risk per trade, position size, invalidation, daily limit, loss control, and review process. |
| 4 | Risk Basics | Position Sizing | `/academy/position-sizing/` | content_upgraded | complete | Account risk, trade risk, stop distance, share size, liquidity, slippage, and max loss. |
| 5 | Risk Basics | Risk Reward Ratio | `/academy/risk-reward-ratio/` | content_upgraded | complete | Planned risk, potential reward, win-rate context, realistic targets, invalidation, and review after exit. |
| 6 | Risk Basics | Win Rate, Reward/Risk, And Expectancy | `/academy/win-rate-reward-risk-and-expectancy/` | content_upgraded | complete | New bridge lesson connecting win rate, average winner, average loser, reward/risk, expectancy, sample size, and review. |
| 7 | Risk Basics | Stop Loss | `/academy/stop-loss/` | content_upgraded | complete | Invalidation level, stop type, position size, liquidity, gap risk, discipline risk, and review outcome. |
| 8 | Risk Basics | Mental Stop Vs Hard Stop | `/academy/mental-stop-vs-hard-stop/` | content_upgraded | complete | Execution discipline, order risk, liquidity, gap risk, platform access, emotional delay, and review evidence. |
| 9 | Account Protection | Max Loss | `/academy/max-loss/` | content_upgraded | complete | Per-trade max loss, session max loss, account impact, position sizing, stop discipline, and shutdown plan. |
| 10 | Account Protection | Daily Loss Limit | `/academy/daily-loss-limit/` | content_upgraded | complete | Daily loss number, stop-trading trigger, reset rule, revenge risk, overtrading risk, and review plan. |
| 11 | Trade Management | Trade Management | `/academy/trade-management/` | content_upgraded | complete | Initial plan, risk adjustment, partial exits, stop movement, adding rules, time in trade, and exit review. |
| 12 | Trade Management | Profit Protection | `/academy/profit-protection/` | content_upgraded | complete | Open profit, giveback risk, exit plan, trailing logic, liquidity, news risk, and review after exit. |
| 13 | Event Risk | Overnight Risk | `/academy/overnight-risk/` | content_upgraded | complete | Gap risk, news risk, position size, liquidity, borrow or margin risk, exit access, and next-day plan. |
| 14 | Event Risk | Holding Through News | `/academy/holding-through-news/` | content_upgraded | complete | Scheduled catalysts, unexpected news, position size, gap risk, liquidity, thesis dependence, and review outcome. |

### Course Status

The Risk Management And Trade Planning course markdown path is **academy_ready_core** across all 14 planned lessons.

Before production UI implementation, this course still needs:

- Visual asset review to decide which lessons need planning, sizing, risk, or trade-management diagrams.
- Optional course intro/landing copy for the Academy course page.
- Final production UI schema review once the website build begins.


## Course 9: Trading Psychology And Discipline

### Purpose

Teach the behavior patterns that damage trader consistency: chasing, FOMO, revenge trading, overtrading, holding losers, cutting winners, and rule-breaking.

### Course Outcome

The user should understand common behavioral traps and how to review them without shame or vague motivation.

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Discipline Foundation | Trading Discipline | `/academy/trading-discipline/` | content_upgraded | complete | Course opener covering rule adherence, pressure points, vague versus reviewable rules, and discipline review. |
| 2 | Impulse Patterns | FOMO Trading | `/academy/fomo-trading/` | content_upgraded | complete | Fear-of-missing-out triggers, late entries, scanner/social pressure, and structured review. |
| 3 | Impulse Patterns | Chasing Stocks | `/academy/chasing-stocks/` | content_upgraded | complete | Late-entry risk, extension, spread/slippage, nearby levels, and chase-behavior review. |
| 4 | Impulse Patterns | Revenge Trading | `/academy/revenge-trading/` | content_upgraded | complete | Emotional follow-up trades after losses, re-entry behavior, size increases, and interruption rules. |
| 5 | Impulse Patterns | Overtrading | `/academy/overtrading/` | content_upgraded | complete | Trade quality, session triggers, boredom/frustration, repeated re-entries, and stop-trading review. |
| 6 | Trade Management Errors | Holding Losers Too Long | `/academy/holding-losers-too-long/` | content_upgraded | complete | Planned versus unplanned losses, invalidation, stop movement, averaging down, and exit-delay review. |
| 7 | Trade Management Errors | Cutting Winners Too Early | `/academy/cutting-winners-too-early/` | content_upgraded | complete | Planned profit protection versus fear-based exits, target review, scaling, and early-exit patterns. |
| 8 | Position Behavior | Averaging Down | `/academy/averaging-down/` | content_upgraded | complete | Planned scaling versus emotional adding, risk expansion, invalidation, and average-down review. |

### Course Status

The Trading Psychology And Discipline course markdown path is **academy_ready_core** across all 8 planned lessons.

Before production UI implementation, this course still needs:

- Visual asset review to decide whether behavior-loop, session-sequence, or trade-management diagrams would improve learning.
- Optional course intro/landing copy for the Academy course page.
- Final production UI schema review once the website build begins.

## Course 10: Trade Review And Improvement

### Purpose

Teach users how to review decisions, executions, context, mistakes, and repeated patterns. This is the strongest natural bridge to Trader Intelligence.

### Course Outcome

The user should understand how improvement happens through structured review, not just reading lessons.

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Review Foundation | Trade Review And Improvement | `/academy/trade-review-and-improvement/` | content_upgraded | complete | Course opener covering review categories, outcome versus decision quality, and improvement notes. |
| 2 | Review Foundation | Trade Risk Review | `/academy/trade-risk-review/` | content_upgraded | complete | Planned versus actual risk, invalidation, size, stops, adds, slippage, and repeated risk behavior. |
| 3 | Review Process | Planned Vs Actual Trade Review | `/academy/planned-vs-actual-trade-review/` | content_upgraded | complete | Plan versus actual setup, entry, risk, size, management, exit, and adjustment review. |
| 4 | Review Process | Execution Review | `/academy/execution-review/` | content_upgraded | complete | Entry timing, fill quality, order type, spread, slippage, liquidity, and exit execution review. |
| 5 | Review Process | Mistake Pattern Review | `/academy/mistake-pattern-review/` | content_upgraded | complete | Repeated behavior patterns, mistake tags, context triggers, and rule improvements without shame framing. |
| 6 | Review Process | Building A Playbook From Reviewed Trades | `/academy/building-a-playbook-from-reviewed-trades/` | content_upgraded | complete | New bridge lesson turning reviewed trade samples into setup criteria, disqualifiers, risk rules, and forward-testable playbook updates. |
| 7 | Specialized Review | How To Review News Trades | `/academy/how-to-review-news-trades/` | content_upgraded | complete | Cross-listed completed News course capstone for catalyst, reaction, risk, execution, and news-trade review. |
| 8 | Specialized Review | Swing Trade Journal | `/academy/swing-trade-journal/` | content_upgraded | complete | Multi-session thesis, levels, overnight risk, catalysts, daily management notes, and swing-trade review. |
| 9 | Product Bridge | How Trader Intelligence Helps Review Trades | `/academy/trader-intelligence-trade-review/` | content_upgraded | complete | Review-only product bridge explaining Trader Intelligence as completed-trade analysis, not prediction. |

### Course Status

The Trade Review And Improvement course markdown path is **academy_ready_core** across 8 newly upgraded or created lessons plus the already-completed cross-listed news-trade review lesson.

Before production UI implementation, this course still needs:

- Visual asset review to decide whether review workflow, planned-vs-actual, execution, or pattern diagrams would improve learning.
- Optional course intro/landing copy for the Academy course page.
- Final production UI schema review once the website build begins.

## Course 11: Day Trading Workflow

### Purpose

Teach users how a day trading session fits together from preparation through review, without turning time-of-day concepts into signals.

### Course Outcome

The user should understand how to prepare before the open, filter a watchlist, observe the market open, use opening range context, manage midday and power-hour behavior, review after-hours risk, and complete a structured session review.

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Session Framework | Day Trading Workflow | `/academy/day-trading-workflow/` | content_upgraded | complete | New course opener with realistic session-map SVG; teaches prepare, observe, execute, and review. |
| 2 | Preparation | Premarket Trading | `/academy/premarket-trading/` | content_upgraded | complete | Upgraded premarket lesson with catalyst, PMH/PML, spread, liquidity, and realistic SVG support. |
| 3 | Preparation | Day Trading Watchlist | `/academy/day-trading-watchlist/` | content_upgraded | complete | New watchlist-filter lesson covering catalyst, volume, liquidity, spread, levels, and noise reduction. |
| 4 | Market Open | Market Open Trading | `/academy/market-open-trading/` | content_upgraded | complete | Upgraded market-open lesson with opening volatility, premarket level interaction, spread/slippage, and realistic SVG support. |
| 5 | Market Open | Opening Range | `/academy/opening-range/` | content_upgraded | complete | New opening-range lesson with opening range high/low zones, failed extension review, and realistic SVG support. |
| 6 | Midday Filtering | Midday Trading | `/academy/midday-trading/` | content_upgraded | complete | Upgraded midday lesson with low-volume chop, boredom risk, filtering, and realistic SVG support. |
| 7 | Late Session | Power Hour Trading | `/academy/power-hour-trading/` | content_upgraded | complete | Upgraded final-hour lesson with late-session reassessment, volume return, close planning, and realistic SVG support. |
| 8 | Extended Hours | After-Hours Trading | `/academy/after-hours-trading/` | content_upgraded | complete | Upgraded after-hours lesson with headline/source review, spread/liquidity risk, overnight context, and realistic SVG support. |
| 9 | Review | Day Trading Session Review | `/academy/day-trading-session-review/` | content_upgraded | complete | New course capstone lesson connecting session segments to completed-trade review and Trader Intelligence. |

### Cross-Listed Support Lessons

These completed lessons should be linked from the Day Trading Workflow course UI where useful:

- `/academy/day-trading/`
- `/academy/day-trading-for-beginners/`
- `/academy/vwap/`
- `/academy/chart-patterns/vwap-reclaim/`
- `/academy/premarket-high-low/`
- `/academy/high-of-day/`
- `/academy/low-of-day/`
- `/academy/relative-volume-rvol/`
- `/academy/liquidity/`
- `/academy/spread/`
- `/academy/slippage/`
- `/academy/overtrading/`
- `/academy/max-loss/`

### Course Status

The Day Trading Workflow course markdown path is **academy_ready_core** across 9 lessons, including 4 new gap lessons, 5 upgraded session drafts, and 5 realistic SVG assets.

Before production UI implementation, this course still needs:

- Final Academy migration pass for UI-ready metadata and completion behavior.
- Optional course intro/landing copy for the Academy course page.
- Final production UI schema review once the website build begins.

## Course 15: Academy Navigation Path Hubs

### Purpose

Connect completed courses into clearer recommended learning paths before production website implementation. These hubs are not production routes yet; they are content and planning assets that future UI work can use for course cards, progress paths, next steps, and continue-learning behavior.

### Course Outcome

The user should be able to choose a practical path through the Academy: chart reading, news and filings, trade review, or risk discipline. Each hub explains which lessons to take, why the order matters, and how the path connects to trade review and Trader Intelligence.

### Completed Path Hub Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Academy Path Hubs | Chart Reading Path | `/academy/chart-reading-path/` | content_upgraded | complete | New path hub with SVG map connecting levels, structure, candles, patterns, volume, workflow, and review. |
| 2 | Academy Path Hubs | News And Filings Path | `/academy/news-and-filings-path/` | content_upgraded | complete | New path hub with dashboard SVG connecting catalysts, press releases, SEC filings, offerings/dilution, and news-trade review. |
| 3 | Academy Path Hubs | Trade Review Path | `/academy/trade-review-path/` | content_upgraded | complete | New path hub with workflow SVG connecting plan-vs-actual, risk review, execution review, mistake patterns, practice, and Trader Intelligence review support. |
| 4 | Academy Path Hubs | Risk Discipline Path | `/academy/risk-discipline-path/` | content_upgraded | complete | New path hub with workflow SVG connecting plans, sizing, stops, limits, discipline behaviors, and review/practice. |

### Cross-Listed Support Lessons

These path hubs should be discoverable from the Academy homepage and relevant course pages:

- `/academy/how-to-use-traderslink-academy/`
- `/academy/support-and-resistance/`
- `/academy/stock-catalysts/`
- `/academy/sec-filings/`
- `/academy/trade-review-and-improvement/`
- `/academy/risk-management/`
- `/academy/trading-discipline/`
- `/academy/practice-trading/`

### Course Status

The Academy Navigation Path Hubs set is **academy_ready_core** across 4 new path hubs and 4 realistic SVG/path-map assets.

Before production UI implementation, these hubs still need:

- Product decision on whether these are standalone lessons, course pages, or navigational panels.
- Final production UI schema review once the website build begins.

## Course 12: Practice And Improvement

### Purpose

Turn the Academy from passive reading into repeatable skill building through practice loops, simulation, replay, screenshots, grading, focused drills, forward testing, and improvement planning.

### Course Outcome

The user should understand how to practice one skill at a time, review simulated and completed decisions, avoid hindsight bias, build samples, and turn review notes into a practical improvement plan.

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Practice Foundation | Practice Trading | `/academy/practice-trading/` | content_upgraded | complete | New course opener with realistic practice-feedback-loop SVG; teaches focus, simulation, review, adjustment, and repetition. |
| 2 | Simulation Basics | Paper Trading | `/academy/paper-trading/` | content_upgraded | complete | New lesson teaching paper trading usefulness and limitations without treating simulated results as proof. |
| 3 | Replay Practice | Trade Replay Review | `/academy/trade-replay-review/` | content_upgraded | complete | New replay lesson with realistic timeline SVG; teaches pause-before-reveal review and hindsight-bias reduction. |
| 4 | Preparation Review | Watchlist Review | `/academy/watchlist-review/` | content_upgraded | complete | New lesson teaching planned versus reactive ticker selection, catalyst/volume/liquidity review, and watchlist filter improvement. |
| 5 | Visual Review | Setup Screenshot Review | `/academy/setup-screenshot-review/` | content_upgraded | complete | New screenshot lesson with realistic chart-review SVG; teaches before/during/after context capture. |
| 6 | Process Scoring | Trade Grading | `/academy/trade-grading/` | content_upgraded | complete | New lesson teaching process grades across plan, risk, execution, management, and behavior. |
| 7 | Focused Drills | One-Rule Practice Drill | `/academy/one-rule-practice-drill/` | content_upgraded | complete | New lesson teaching one reviewable rule at a time as a focused drill. |
| 8 | Sample Building | Forward Testing Trading | `/academy/forward-testing-trading/` | content_upgraded | complete | New lesson teaching forward-test samples without guarantee language. |
| 9 | Improvement Planning | Trading Improvement Plan | `/academy/trading-improvement-plan/` | content_upgraded | complete | New course capstone connecting review evidence to practice methods, rule changes, samples, and review dates. |

### Cross-Listed Support Lessons

These completed lessons should be linked from the Practice And Improvement course UI where useful:

- `/academy/trade-review-and-improvement/`
- `/academy/trade-risk-review/`
- `/academy/planned-vs-actual-trade-review/`
- `/academy/execution-review/`
- `/academy/mistake-pattern-review/`
- `/academy/trading-rules/`
- `/academy/trading-discipline/`
- `/academy/overtrading/`
- `/academy/trader-intelligence-trade-review/`

### Course Status

The Practice And Improvement course markdown path is **academy_ready_core** across 9 new lessons and 3 realistic SVG assets.

Before production UI implementation, this course still needs:

- Final Academy migration pass for UI-ready metadata and completion behavior.
- Optional course intro/landing copy for the Academy course page.
- Final production UI schema review once the website build begins.

## Course 13: Halts And High-Volatility Events

### Purpose

Teach interruption risk, volatility risk, halt/resume behavior, broad-market circuit breaker context, fast-spread risk, low-float volatility, and high-volatility trade review.

### Course Outcome

The user should understand that halts and high-volatility events are risk and review context, not trade triggers. They should know how to review interruption risk, spread, depth, slippage, size, and market structure after volatile events.

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Halt Foundation | Trading Halts | `/academy/trading-halts/` | content_upgraded | complete | New course opener with realistic halt timeline SVG; teaches halt types, interruption risk, and official source checks. |
| 2 | Single-Stock Halts | Volatility Halts | `/academy/volatility-halts/` | content_upgraded | complete | New lesson teaching rapid-move halts, low-float context, halt risk, and no directional assumptions. |
| 3 | Single-Stock Halts | Halt Resume | `/academy/halt-resume/` | content_upgraded | complete | New lesson with realistic spread/depth SVG; teaches resume instability, spread, depth, and slippage review. |
| 4 | Market-Wide Events | Market-Wide Circuit Breakers | `/academy/market-wide-circuit-breakers/` | content_upgraded | complete | New lesson with circuit-breaker context SVG and official-rule verification framing. |
| 5 | Execution Risk | Fast Spread Risk | `/academy/fast-spread-risk/` | content_upgraded | complete | New lesson teaching spread widening, depth, slippage, and chart-versus-execution review. |
| 6 | Small-Cap Volatility | Low-Float Volatility | `/academy/low-float-volatility/` | content_upgraded | complete | New lesson connecting low float, volume spikes, halt risk, spread, liquidity, and dilution context. |
| 7 | Event Review | High-Volatility Trade Review | `/academy/high-volatility-trade-review/` | content_upgraded | complete | New course capstone for reviewing volatile trades by halt risk, spread, slippage, liquidity, size, and behavior. |

### Cross-Listed Support Lessons

These completed lessons should be linked from the Halts And High-Volatility Events course UI where useful:

- `/academy/low-float-stocks/`
- `/academy/float-rotation/`
- `/academy/volume-spike/`
- `/academy/spread/`
- `/academy/slippage/`
- `/academy/liquidity/`
- `/academy/level-2/`
- `/academy/risk-management/`
- `/academy/trade-risk-review/`
- `/academy/execution-review/`

### Course Status

The Halts And High-Volatility Events course markdown path is **academy_ready_core** across 7 new lessons and 3 realistic SVG assets.

Before production UI implementation, this course still needs:

- Optional course intro/landing copy for the Academy course page.
- Final production UI schema review once the website build begins.

## Course 14: Swing Trading Workflow

### Purpose

Teach swing trading as a multi-session workflow built around thesis, daily chart levels, position risk, overnight exposure, catalyst quality, volume follow-through, event risk, small-cap context, and review.

### Course Outcome

The user should understand that swing trading is not simply slower day trading. They should know how to plan and review a swing trade before holding, define invalidation, size around overnight risk, evaluate catalysts and news, and review hold decisions across multiple sessions.

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Swing Trading Foundation | Swing Trading For Beginners | `/academy/swing-trading-for-beginners/` | content_upgraded | complete | Upgraded course opener with multi-session plan SVG; teaches beginner swing workflow, planned swing versus failed day trade, and review structure. |
| 2 | Risk And Invalidation | Swing Trading Risk Management | `/academy/swing-trading-risk-management/` | content_upgraded | complete | Upgraded lesson with gap-risk SVG; teaches invalidation, position sizing, overnight exposure, event checks, and changing risk while open. |
| 3 | Levels And Chart Planning | Swing Trading Support Resistance | `/academy/swing-trading-support-resistance/` | content_upgraded | complete | Upgraded lesson teaching higher-timeframe support/resistance zones, level maps, reaction review, volume context, and failed-level review. |
| 4 | Participation And Follow-Through | Swing Trading Volume | `/academy/swing-trading-volume/` | content_upgraded | complete | Upgraded lesson with catalyst timeline SVG; teaches volume as participation and follow-through context, not a standalone signal. |
| 5 | Catalyst Context | Swing Trading Catalysts | `/academy/swing-trading-catalysts/` | content_upgraded | complete | Upgraded lesson teaching source/detail review, catalyst quality, filings, chart reaction, volume follow-through, and catalyst fade. |
| 6 | Event Risk | Swing Trading Earnings | `/academy/swing-trading-earnings/` | content_upgraded | complete | Upgraded lesson teaching pre-earnings, through-earnings, and post-earnings risk, gap exposure, guidance, and reaction review. |
| 7 | Event Risk | Swing Trading News Risk | `/academy/swing-trading-news-risk/` | content_upgraded | complete | Upgraded lesson teaching known versus surprise risk, overnight headlines, filings, thesis changes, levels, volume, and liquidity review. |
| 8 | Small-Cap Swing Context | Small Cap Swing Trading | `/academy/swing-trading-small-caps/` | content_upgraded | complete | Upgraded course capstone teaching float, filings, dilution, liquidity, catalyst quality, volume follow-through, halt/gap risk, and full-context review. |

### Cross-Listed Support Lessons

These completed lessons should be linked from the Swing Trading Workflow course UI where useful:

- `/academy/swing-trading/`
- `/academy/day-trading-vs-swing-trading/`
- `/academy/support-and-resistance/`
- `/academy/overnight-risk/`
- `/academy/position-sizing/`
- `/academy/stock-catalysts/`
- `/academy/sec-filings/`
- `/academy/small-cap-stocks/`
- `/academy/trading-halts/`
- `/academy/swing-trade-journal/`

### Course Status

The Swing Trading Workflow course markdown path is **academy_ready_core** across 8 upgraded lessons and 3 realistic SVG assets.

Before production UI implementation, this course still needs:

- Optional course intro/landing copy for the Academy course page.
- Final production UI schema review once the website build begins.

## Pass 5 UI Readiness Batch Status

Pass 5 UI readiness review is complete for all current Academy course groups and Academy Navigation Path Hubs.

Completed Pass 5 audit files:

| Course / Group | Pass 5 File | UI Planning Result |
|---|---|---|
| Trading Foundations | `docs/content/traderslink-academy-ui-readiness-trading-foundations.md` | Ready for UI planning once course membership/cross-listing model is decided. |
| Chart Reading And Market Structure | `docs/content/traderslink-academy-ui-readiness-chart-reading.md` | Ready with parent-course/submodule model for core path plus pattern libraries. |
| Volume, Liquidity And Order Flow | `docs/content/traderslink-academy-ui-readiness-volume-liquidity.md` | Ready as a compact 14-lesson execution-awareness path. |
| Risk Management And Trade Planning | `docs/content/traderslink-academy-ui-readiness-risk-management.md` | Ready for UI planning; six-SVG risk visual batch remains launch-polish work. |
| Technical Indicators And Tools | `docs/content/traderslink-academy-ui-readiness-technical-indicators.md` | Ready for UI planning; seven-SVG indicator visual batch remains launch-polish work. |
| Trading Styles And Playbooks | `docs/content/traderslink-academy-ui-readiness-trading-styles.md` | Ready with cross-listed lesson support and shared completion by slug. |
| Day Trading Workflow | `docs/content/traderslink-academy-ui-readiness-day-trading-workflow.md` | Ready as a session-timeline course. |
| Swing Trading Workflow | `docs/content/traderslink-academy-ui-readiness-swing-trading-workflow.md` | Ready as a multi-session workflow course. |
| News, Catalysts And SEC Filings | `docs/content/traderslink-academy-ui-readiness-news-catalysts-sec-filings.md` | Ready as a large hierarchical course with filing-library/module-progress behavior. |
| Small-Cap Stocks, Float And Dilution | `docs/content/traderslink-academy-ui-readiness-small-cap-float-dilution.md` | Ready with grouped supply-and-risk modules; visual batch remains launch-polish work. |
| Halts And High-Volatility Events | `docs/content/traderslink-academy-ui-readiness-halts-high-volatility.md` | Ready as a compact risk-event course. |
| Trading Psychology And Discipline | `docs/content/traderslink-academy-ui-readiness-trading-psychology.md` | Ready as a non-shaming behavior-review course; behavior-loop visuals remain launch-polish work. |
| Trade Review And Improvement | `docs/content/traderslink-academy-ui-readiness-trade-review-improvement.md` | Ready as the Academy review hub and restrained Trader Intelligence bridge. |
| Practice And Improvement | `docs/content/traderslink-academy-ui-readiness-practice-improvement.md` | Ready as a practice-loop course. |
| Academy Navigation Path Hubs | `docs/content/traderslink-academy-ui-readiness-navigation-path-hubs.md` | Ready as optional guided-route support, not numbered courses. |

Global Pass 5 product notes:

- Store completion by lesson slug.
- Support course-specific membership and navigation for cross-listed lessons.
- Use module progress for large courses such as News/Filings and Small-Cap/Floating/Dilution.
- Treat missing visual batches from Pass 4 as launch-polish work unless production design requires them earlier.
- Keep app bridges restrained until Pass 6 and until product routes are stable.

## Pass 6 App Bridge Status

Pass 6 restrained app bridge audit is complete for all current Academy course groups and Academy Navigation Path Hubs.

Audit file:

- `docs/content/traderslink-academy-app-bridge-audit-pass6.md`

Global Pass 6 decisions:

- Do not add hard app route links yet.
- Use app bridge language only where it supports completed-trade review, risk review, execution review, session review, news/filing review, coaching, analytics, progress, review notes, or playbook building.
- Keep the Academy education-first; do not turn course pages into product funnels.
- Use course-level or module-level bridge cards later, not repeated product cards on every lesson.
- Keep bridge copy non-predictive, non-promissory, and non-signal-oriented.
- Store future bridge cards as route-safe UI metadata once product routes and app feature names are stable.
- Strongest core bridge courses: Volume/Liquidity, Risk Management, Trading Styles/Playbooks, Day Trading Workflow, News/Filings, Small-Cap/Float/Dilution, Halts/Volatility, Trading Psychology, Trade Review, and Practice/Improvement.
- Lighter bridge contexts: Trading Foundations, Chart Reading libraries, Technical Indicators, Swing Workflow, and Path Hubs.

## Production Content Model Status

Academy production content model planning is complete.

Planning file:

- `docs/content/traderslink-academy-production-content-model-plan.md`

Global content model decisions:

- Keep markdown lesson files in `academy/` as canonical educational content.
- Add or generate a separate course membership layer for future production.
- Store user completion by lesson slug.
- Use context-specific navigation from course/path membership when a lesson is cross-listed.
- Keep frontmatter previous/next as canonical lesson navigation.
- Model path hubs separately from numbered courses.
- Store future app bridge cards as route-safe UI metadata, with hard app links disabled until app routes and claims are stable.
- Do not duplicate markdown lesson files for cross-listed placements.

## Academy Content Registry Draft Status

Academy content registry draft planning is complete.

Registry draft file:

- `docs/content/traderslink-academy-content-registry-draft.md`

Registry draft result:

- Maps the homepage course order into stable draft `course_id` values.
- Lists module IDs, module titles, module types, display behavior, and progress behavior.
- Lists displayed lesson membership for the current course sequences and pattern libraries.
- Identifies canonical versus cross-listed lesson ownership.
- Keeps completion keyed by public lesson slug.
- Documents context-specific navigation expectations for cross-listed lessons and path hubs.
- Keeps Academy Navigation Path Hubs as optional guided-route support, not numbered courses.
- Adds route-safe app bridge candidates with hard links disabled.
- Captures visual readiness and launch-polish visual flags.
- Adds a registry QA checklist for future production conversion.

No production website files, routes, schemas, or components were created.

## Cross-Listed Lesson Rules

Some lessons can appear in more than one course. This is good for navigation, but each lesson should still have one primary course.

Examples:

- `/academy/breakout-trading/` primary: Chart Reading; cross-list: Trading Styles.
- `/academy/gap-fill-trading/` primary: Chart Reading; cross-list: Trading Styles and News.
- `/academy/volume-by-price/` primary: Volume; cross-list: Technical Indicators And Tools.
- `/academy/news-fade/` primary: Trading Styles or News; cross-list: Psychology if framed around chasing/fading.
- `/academy/how-to-review-news-trades/` primary: Trade Review; cross-list: News.

Recommended metadata fields for future lessons:

```yaml
academy_course: "Chart Reading And Market Structure"
academy_module: "Core Levels"
academy_order: 1
academy_level: "Foundation"
recommended_previous: "/academy/..."
recommended_next: "/academy/..."
cross_listed_courses:
  - "Trading Styles And Playbooks"
completion_enabled: true
```

## Academy UI Plan

### Academy Homepage

The homepage should be a learning dashboard, not a blog index.

Recommended sections:

1. Continue Learning.
2. Recommended Starting Point.
3. Course Cards.
4. In-Progress Courses.
5. Completed Lessons.
6. Explore All Lessons.
7. Glossary Support.

Course card should show:

- Course name.
- Short outcome statement.
- Lesson count.
- User progress.
- Recommended level.
- Continue button.

### Course Page

Each course page should show:

- Course title.
- What you will learn.
- Recommended course order.
- Modules.
- Lesson list.
- Completion status per lesson.
- Course progress.
- Next recommended lesson.
- Related courses.

### Lesson Page

Each lesson page should show:

- Course breadcrumb.
- Lesson title.
- Lesson objective.
- Estimated reading time if available.
- Previous/next lesson.
- Main educational content.
- Visuals.
- Common mistakes.
- Apply/Review section.
- Related lessons.
- Related glossary terms.
- Mark lesson complete button.

### Progress And Motivation

Completion feedback should feel premium:

```text
Lesson complete.
You are 42% through Volume, Liquidity And Order Flow.
Next: Time And Sales.
```

Milestones:

- First lesson complete.
- First course started.
- 25%, 50%, 75%, 100% course completion.
- Course complete.
- 10 lessons complete.
- Return streak or weekly progress if desired.

## Content Upgrade Standards

Every Academy lesson should include:

- Learning metadata.
- Previous/next lesson metadata.
- Clear learning objective.
- Practical explanation.
- Realistic example.
- Common mistakes.
- Apply/Review section.
- Soft Trader Intelligence bridge where relevant.
- Related lessons.
- Related glossary terms.
- FAQ when useful.
- Educational disclaimer.
- No buy/sell signal language.
- No guarantee language.
- Realistic visual support when useful.

Visuals should:

- Use realistic trading dashboards or red/green candlesticks for chart lessons.
- Use filing/news dashboard diagrams for SEC/news lessons.
- Avoid random abstract shapes.
- Include title and desc tags.
- Avoid buy/sell/profit/guarantee language.
- Be readable on mobile.

## Overall Academy Progress Snapshot

Current known Academy-ready lesson groups:

| Course | Academy-Ready Lessons | Notes |
|---|---:|---|
| Chart Reading And Market Structure | 23 | Core course has completed its first Academy format migration pass: normalized academy metadata, lesson objectives, practical checklist naming, Apply This In Review, and Trader Intelligence Bridge labels. |
| Candlestick Patterns In Context | 14 | Full candlestick course markdown path has passed Academy format migration check: metadata, lesson objectives, checklist, review, Trader Intelligence bridge, and visuals are already normalized. |
| Chart Patterns In Context | 14 | Full chart-pattern course markdown path has passed Academy format migration check: metadata, lesson objectives, checklist, review, Trader Intelligence bridge, and visuals are already normalized. VWAP Reclaim remains cross-listed from Technical Indicators. |
| Day Trading Workflow | 9 | Full day-trading workflow course markdown path is now content-upgraded across session framework, premarket prep, watchlist filtering, market open, opening range, midday filtering, power hour, after-hours context, and session review. Five realistic SVGs were created and manifest-tracked. |
| Practice And Improvement | 9 | Full practice course has passed Academy format migration check across practice foundation, paper trading, replay review, watchlist review, screenshot review, trade grading, one-rule drills, forward testing, and improvement planning. Three realistic SVGs are already manifest-tracked. |
| Halts And High-Volatility Events | 7 | Full event-risk course has passed Academy format migration check across trading halts, volatility halts, halt resumes, market-wide circuit breakers, fast-spread risk, low-float volatility, and high-volatility trade review. Three realistic SVGs are already manifest-tracked. |
| Swing Trading Workflow | 8 | Full swing-trading workflow course has passed Academy format migration check across beginner swing planning, risk management, support/resistance planning, volume, catalysts, earnings, news risk, and small-cap swing context. Three realistic SVGs are already manifest-tracked. |
| Academy Navigation Path Hubs | 4 | Four path hubs have passed Academy path-hub readiness checks across chart reading, news and filings, trade review, and risk discipline. Four realistic SVG/path-map assets are already manifest-tracked. |
| Volume, Liquidity And Order Flow | 14 | Core course path has passed Academy format migration check: metadata, lesson objectives, checklist, review, Trader Intelligence bridge, and visuals are normalized. |
| News, Catalysts And SEC Filings | 37 | Full course markdown path has passed Academy format migration across catalysts, press releases, EDGAR source-document review, SEC filings, news categories, and news-trade review. Needs visual review before UI-ready. |
| Trading Foundations | 6 | Beginner onboarding, market-mechanics, and market-basics lessons have passed Academy format migration check; plan/risk/review lessons are cross-listed from completed Risk and Trade Review courses. Needs visual review before UI-ready. |
| Technical Indicators And Tools | 11 | Full indicator course markdown path has passed Academy format migration check across indicator foundation, trend tools, momentum tools, volatility tools, and VWAP reclaim. Volume By Price is cross-listed from the completed Volume course. Needs visual review before UI-ready. |
| Trading Styles And Playbooks | 15 | Full course sequence has passed Academy format migration check across style selector lessons, short selling basics, pullback context, news-fade/sell-the-news context, multi-day runner context, and cross-listed breakout, breakdown, reclaim, gap-fill, and chasing lessons. Needs visual review before UI-ready. |
| Small-Cap Stocks, Float And Dilution | 28 | Full course markdown path has passed Academy format migration across small-cap context, float, dilution, offerings, securities, corporate actions, cash runway, and going concern. Needs visual review before UI-ready. |
| Risk Management And Trade Planning | 14 | Full course markdown path has passed Academy format migration across planning, rules, expectancy, risk basics, account protection, trade management, and event risk. Needs visual review before UI-ready. |
| Trading Psychology And Discipline | 8 | Full course markdown path has passed Academy format migration check across discipline, FOMO, chasing, revenge trading, overtrading, holding losers, cutting winners, and averaging down. Needs visual review before UI-ready. |
| Trade Review And Improvement | 9 | Full course sequence has passed Academy format migration check across review foundation, risk review, planned-vs-actual review, execution review, mistake patterns, playbook building, news-trade review, swing review, and Trader Intelligence review bridge. The news-trade review lesson is cross-listed from the completed News course. Needs visual review before UI-ready. |
| Day Trading Workflow | 9 | Full day-trading workflow course has passed Academy format migration check across session framework, premarket prep, watchlist filtering, market open, opening range, midday filtering, power hour, after-hours context, and session review. Five realistic SVGs are already manifest-tracked. |

Total Academy-ready lessons currently represented in this index:

```text
223
```

More precise current state:

| State | Lesson Count | Meaning |
|---|---:|---|
| content_upgraded | 223 | Lessons already upgraded into strong educational content with realistic examples, review prompts, visuals where useful, and safer non-advice language. |
| academy_format_review_needed | 0 | All 223 content-upgraded lessons and path hubs represented in this index have passed the first Academy format migration or readiness check. |
| academy_ready | 223 | Chart Reading core, Candlestick Patterns, Chart Patterns, Volume/Liquidity, Technical Indicators, Trading Styles, News/SEC Filings, Risk Management, Small-Cap/Float/Dilution, Trading Psychology, Trade Review, Day Trading Workflow, Practice/Improvement, Halts/High-Volatility, Swing Trading Workflow, Academy path hubs, and Trading Foundations have passed the first Academy format migration check. The final reconciliation corrected Chart Patterns to 14 Academy-ready entries, and the first six master-audit bridge lessons have now been added. |

The 223 content-upgraded lessons are not throwaway work. They are now the Academy-ready content foundation. The next step is to review visual/UI readiness and create or upgrade missing assets only when a real learning gap appears.

Current best next editorial action:

```text
Create Batch 1 Technical Indicators SVG assets
```

Reason:

The Academy visual/UI-readiness review is complete in `docs/content/learn-academy-visual-ui-readiness-review.md`. All 223 content-upgraded lessons and path hubs represented in this index have completed the first Academy format migration or readiness check. The highest-value next content-only work is the first targeted visual batch for Technical Indicators And Tools.

## Recommended Work Method From Here

Do not go back to isolated SEO article production.

Work course-by-course and lesson-by-lesson using this file as the source of truth.

Recommended workflow:

1. Pick the current course and next lesson from this index.
2. Read the existing draft if it exists.
3. Decide whether the lesson needs:
   - full content upgrade,
   - light Academy format migration,
   - visual creation,
   - metadata normalization,
   - or a brand-new gap draft.
4. Upgrade or create the markdown lesson.
5. Add realistic visuals only when they improve learning.
6. Update the image manifest if visuals are created.
7. Update the editorial tracker.
8. Update this Academy index.
9. Update the handoff.
10. Commit in clear chunks.

Existing content-upgraded lessons should get an **Academy migration pass** before the website build. That pass should not rewrite everything. It should:

- Add final Academy metadata.
- Confirm course/module/order.
- Rename review sections if needed.
- Add a short lesson objective if missing.
- Add or refine completion-oriented "what you should now understand" framing if useful.
- Confirm previous/next lesson flow.
- Add content only where the lesson is too thin for the Academy standard.
- Leave strong existing content intact.

New or not-yet-upgraded drafts should receive the full editorial workflow.

## Maintenance Instructions

When a lesson is created or upgraded:

1. Update the lesson row in this file.
2. Update `docs/content/learn-editorial-upgrade-tracker.md`.
3. Update `docs/content/learn-image-asset-manifest.md` if visuals are created.
4. Update `docs/content/HANDOFF_2026-05-08.md`.
5. Keep course order and recommended next lesson aligned.
6. If a new gap lesson is discovered, add it here before drafting.

This file should become the master Academy index used by Codex and future website implementation work.
