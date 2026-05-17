# TradersLink Academy Course Index

## Purpose

This document defines the long-term structure for **TradersLink Academy**.

TradersLink Academy is the evolved form of the `/learn/` section. The original Learn content began as SEO education, but the product direction is now a guided course-based learning system for traders.

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

- `/learn/sec-filings/` can be a deeper hub because users need a filing map.
- `/learn/sec-filings/form-8-k/` can be deep because users need items, exhibits, financing language, and review workflow.
- `/learn/dilution-risk/` can be deep because the topic has real details users need to understand.
- `/learn/rsi/` should stay focused unless it starts teaching multiple indicators or broader momentum theory.
- `/learn/support-levels/` should be complete, but it does not need to become a full market-structure textbook.

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
| 1 | Trading Foundations | planned | New users need basic market, planning, and risk concepts before advanced topics. |
| 2 | Chart Reading And Market Structure | in_progress | Users need candles, levels, structure, breakouts, breakdowns, and chart context early. |
| 3 | Volume, Liquidity And Order Flow | academy_ready_core | Builds on chart reading and teaches whether activity is clean, thin, fast, or crowded. |
| 4 | Technical Indicators And Tools | planned | Indicators make more sense after price, levels, and volume are understood. |
| 5 | Trading Styles And Playbooks | planned | Users can now combine chart, volume, and tools into recognizable setup categories. |
| 6 | News, Catalysts And SEC Filings | in_progress | High-value TradersLink differentiator, especially for small-cap/news-driven traders. |
| 7 | Small-Cap Stocks, Float And Dilution | planned | Builds naturally from SEC filings and catalyst risk. |
| 8 | Risk Management And Trade Planning | planned | Should be reinforced throughout, then taught deeply as its own course. |
| 9 | Trading Psychology And Discipline | planned | Best taught after users understand what they are trying to execute. |
| 10 | Trade Review And Improvement | planned | Final product bridge into reviewing behavior, mistakes, execution, and Trader Intelligence. |

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

## Course 1: Trading Foundations

### Purpose

Give new traders a clear foundation before they enter charts, scanners, filings, indicators, or setups.

### Audience

- New traders.
- Users overwhelmed by market terminology.
- Users who need basic process before advanced strategy.

### Course Outcome

The user should understand what trading is, why planning matters, what risk means, and why review is part of improvement.

### Suggested Modules And Lessons

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Start Here | Welcome To TradersLink Academy | `/learn/start-here/` | gap | gap_needed | New first lesson that explains courses, lessons, progress, and non-advice education. |
| 2 | Start Here | How To Use TradersLink Academy | `/learn/how-to-use-traderslink-academy/` | gap | gap_needed | Replace old possible "how to use Learn" idea with Academy-specific onboarding. |
| 3 | Market Basics | Day Trading For Beginners | `/learn/day-trading-for-beginners/` | draft | needs_upgrade | Should orient users without encouraging day trading. |
| 4 | Market Basics | Day Trading Vs Swing Trading | `/learn/day-trading-vs-swing-trading/` | draft | needs_upgrade | Helps users choose later course paths. |
| 5 | Process Basics | Trading Plan | `/learn/trading-plan/` | draft | needs_upgrade | Must be early because every future setup needs a plan. |
| 6 | Process Basics | Trading Rules | `/learn/trading-rules/` | draft | needs_upgrade | Turns plan into behavior. |
| 7 | Risk Basics | Risk Management | `/learn/risk-management/` | draft | needs_upgrade | Should be a foundation primer here, with deeper course later. |
| 8 | Risk Basics | Position Sizing | `/learn/position-sizing/` | draft | needs_upgrade | Teaches size as a risk decision. |
| 9 | Risk Basics | Stop Loss | `/learn/stop-loss/` | draft | needs_upgrade | Teaches invalidation and risk control without command language. |
| 10 | Review Basics | Trade Review | `/learn/trade-risk-review/` | draft | needs_upgrade | Use as early intro to review process. |

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
| 1 | Core Levels | Support And Resistance | `/learn/support-and-resistance/` | complete | `7c46572524af559e42a53a34531272bd3154dd6f` |
| 2 | Core Levels | How To Draw Support And Resistance | `/learn/how-to-draw-support-and-resistance/` | complete | `26daa98458b746ca447a59f593ee5eda6380cffe` |
| 3 | Core Levels | Support Levels | `/learn/support-levels/` | complete | `ea86c4f9` |
| 4 | Core Levels | Resistance Levels | `/learn/resistance-levels/` | complete | `688c4ac7` |
| 5 | Core Levels | Key Levels Trading | `/learn/key-levels-trading/` | complete | `4121eaf9` |
| 6 | Breaks And Reclaims | Breakout Trading | `/learn/breakout-trading/` | complete | `bdd8664e` |
| 7 | Breaks And Reclaims | Breakdown Trading | `/learn/breakdown-trading/` | complete | `bbca46b8` |
| 8 | Breaks And Reclaims | Level Breakout | `/learn/level-breakout/` | complete | `1377793b` |
| 9 | Breaks And Reclaims | Level Reclaim | `/learn/level-reclaim/` | complete | `57664031` |
| 10 | Reaction And Structure | Price Rejection | `/learn/price-rejection/` | complete | `3ff3c7c4` |
| 11 | Reaction And Structure | Break Of Structure | `/learn/break-of-structure/` | complete | `d03cf796` |
| 12 | Swing Structure | Swing Highs And Swing Lows | `/learn/swing-highs-and-swing-lows/` | complete | `94fabc3b` |
| 13 | Swing Structure | Higher Highs And Higher Lows | `/learn/higher-highs-higher-lows/` | complete | `fece7bfe` |
| 14 | Swing Structure | Lower Highs And Lower Lows | `/learn/lower-highs-lower-lows/` | complete | `65a5747d` |
| 15 | Intraday Reference Levels | Pivot Levels | `/learn/pivot-levels/` | complete | `8c7efffa` |
| 16 | Intraday Reference Levels | Previous Day High Low | `/learn/previous-day-high-low/` | complete | `0f638881` |
| 17 | Intraday Reference Levels | Premarket High Low | `/learn/premarket-high-low/` | complete | `a1450f3c` |
| 18 | Intraday Reference Levels | High Of Day | `/learn/high-of-day/` | complete | `b31325b3` |
| 19 | Intraday Reference Levels | Low Of Day | `/learn/low-of-day/` | complete | `b31325b3` |
| 20 | Intraday Reference Levels | New High Of Day | `/learn/new-high-of-day/` | complete | `30cd3b05` |
| 21 | Ranges And Compression | Compression | `/learn/compression/` | complete | `085019d2` |
| 22 | Ranges And Compression | Consolidation | `/learn/consolidation/` | complete | `085019d2` |
| 23 | Gaps | Gap Fill Trading | `/learn/gap-fill-trading/` | complete | `efd6d0ba` |

### Remaining Or Future Chart Lessons

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 24 | Candlestick Context | Candlestick Patterns | `/learn/candlestick-patterns/` | draft | needs_upgrade | Should introduce candles as context, not signals. |
| 25 | Candlestick Context | Long Wick Candle | `/learn/candlestick-patterns/long-wick-candle/` | draft | needs_upgrade | Needs realistic candle visuals. |
| 26 | Candlestick Context | Doji | `/learn/candlestick-patterns/doji/` | draft | needs_upgrade | Teach indecision with context. |
| 27 | Candlestick Context | Engulfing Candle | `/learn/candlestick-patterns/engulfing-candle/` | draft | needs_upgrade | Avoid automatic reversal claims. |
| 28 | Candlestick Context | Hammer | `/learn/candlestick-patterns/hammer/` | draft | needs_upgrade | Must avoid "hammer means buy" language. |
| 29 | Candlestick Context | Inside Bar | `/learn/candlestick-patterns/inside-bar/` | draft | needs_upgrade | Good bridge to compression. |
| 30 | Chart Patterns | Chart Patterns | `/learn/chart-patterns/` | draft | needs_upgrade | Should be a pattern context hub. |
| 31 | Chart Patterns | Bull Flag | `/learn/chart-patterns/bull-flag/` | draft | needs_upgrade | Avoid continuation guarantee. |
| 32 | Chart Patterns | Ascending Triangle | `/learn/chart-patterns/ascending-triangle/` | draft | needs_upgrade | Needs level and volume context. |
| 33 | Chart Patterns | Double Top | `/learn/chart-patterns/double-top/` | draft | needs_upgrade | Avoid reversal guarantee. |
| 34 | Chart Patterns | Failed Breakout Pattern | `/learn/chart-patterns/failed-breakout-pattern/` | draft | needs_upgrade | Strong fit with current chart course. |

## Course 3: Volume, Liquidity And Order Flow

### Purpose

Teach users how participation, liquidity, spread, fills, Level 2, tape, and volume context affect trade quality.

### Course Outcome

The user should understand that activity and liquidity are context, not confirmation. They should know how volume, bid/ask, spread, slippage, Level 2, time and sales, and unusual volume affect review.

### Completed Academy-Ready Lessons

| Order | Module | Lesson | URL | Status | Last Known Commit |
|---:|---|---|---|---|---|
| 1 | Volume Foundation | Volume | `/learn/volume/` | complete | `72a62c5a` |
| 2 | Volume Foundation | Relative Volume | `/learn/relative-volume/` | complete | `f191d165` |
| 3 | Volume Foundation | Relative Volume RVOL | `/learn/relative-volume-rvol/` | complete | `f714877e` |
| 4 | Volume Foundation | Volume Spike | `/learn/volume-spike/` | complete | `b74f09f9` |
| 5 | Liquidity Foundation | Liquidity | `/learn/liquidity/` | complete | `debb3ce8` |
| 6 | Liquidity Foundation | Dollar Volume | `/learn/dollar-volume/` | complete | `30d417ee` |
| 7 | Liquidity Foundation | Spread | `/learn/spread/` | complete | `255f7a89` |
| 8 | Quotes And Execution | Bid And Ask | `/learn/bid-and-ask/` | complete | `5dd2af67` |
| 9 | Quotes And Execution | Slippage | `/learn/slippage/` | complete | `13a86228` |
| 10 | Quotes And Execution | Market Orders Vs Limit Orders | `/learn/market-orders-vs-limit-orders/` | complete | `8ac5648f` |
| 11 | Order Flow Tools | Level 2 | `/learn/level-2/` | complete | `8a9fc350` |
| 12 | Order Flow Tools | Time And Sales | `/learn/time-and-sales/` | complete | `58ea3ca3` |
| 13 | Volume At Price | Volume By Price | `/learn/volume-by-price/` | complete | `5a5bfc59` |
| 14 | Scanner Context | Unusual Volume | `/learn/unusual-volume/` | complete | `80c78592` |

### Course Status

The core Volume, Liquidity And Order Flow course is **academy_ready_core**.

Future additions can exist, but the main path is already strong enough for a website course build.

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

### Suggested Modules And Lessons

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Indicator Foundation | What Are Trading Indicators? | `/learn/trading-indicators/` | gap | gap_needed | New hub lesson needed. |
| 2 | Indicator Foundation | Indicators Lag Price | `/learn/why-indicators-lag/` | gap | gap_needed | Important anti-signal lesson. |
| 3 | Indicator Foundation | Indicator Overload | `/learn/indicator-overload/` | gap | gap_needed | Teaches too many tools can create confusion. |
| 4 | Trend Tools | Moving Averages | `/learn/moving-averages/` | gap | gap_needed | Common beginner indicator. |
| 5 | Trend Tools | VWAP | `/learn/vwap/` | gap | gap_needed | High-value day-trader tool. |
| 6 | Trend Tools | Anchored VWAP | `/learn/anchored-vwap/` | gap | gap_needed | Advanced context tool. |
| 7 | Momentum Tools | RSI | `/learn/rsi/` | gap | gap_needed | Must avoid overbought/oversold signal claims. |
| 8 | Momentum Tools | MACD | `/learn/macd/` | gap | gap_needed | Teach momentum/lag context. |
| 9 | Volatility Tools | Bollinger Bands | `/learn/bollinger-bands/` | gap | gap_needed | Teach volatility envelope context. |
| 10 | Volatility Tools | ATR | `/learn/atr/` | gap | gap_needed | Strong risk/sizing bridge. |
| 11 | Volume Tools | Volume Profile | `/learn/volume-by-price/` | existing | complete | Already completed in Volume course; can be cross-listed here. |
| 12 | Setup Tool Context | VWAP Reclaim | `/learn/chart-patterns/vwap-reclaim/` | draft | needs_upgrade | Could live here or in Trading Styles. |

## Course 5: Trading Styles And Playbooks

### Purpose

Help users understand different trading styles and setup categories after they understand charts, volume, and basic tools.

### Course Outcome

The user should understand how traders categorize trade ideas without treating any style or setup as a guaranteed edge.

### Suggested Modules And Lessons

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Style Selector | Trading Styles Overview | `/learn/trading-styles/` | gap | gap_needed | New course opener. |
| 2 | Style Selector | Day Trading | `/learn/day-trading/` | draft | needs_upgrade | Style overview, not promotion. |
| 3 | Style Selector | Swing Trading | `/learn/swing-trading/` | draft | needs_upgrade | Style overview. |
| 4 | Style Selector | Scalping Stocks | `/learn/scalping-stocks/` | draft | needs_upgrade | Must emphasize speed/risk/execution. |
| 5 | Style Selector | Momentum Trading | `/learn/momentum-trading/` | draft | needs_upgrade | Fits user question around momentum. |
| 6 | Setup Types | Pullbacks And Dip-Buy Setups | `/learn/pullbacks-and-dip-buy-setups/` | gap | gap_needed | Better title than "dip buys"; avoid buy instruction framing. |
| 7 | Setup Types | Breakout Setups | `/learn/breakout-trading/` | existing | complete | Cross-list from Chart Reading. |
| 8 | Setup Types | Breakdown Setups | `/learn/breakdown-trading/` | existing | complete | Cross-list from Chart Reading. |
| 9 | Setup Types | Reclaim Setups | `/learn/level-reclaim/` | existing | complete | Cross-list from Chart Reading. |
| 10 | Setup Types | Gap Fill Setups | `/learn/gap-fill-trading/` | existing | complete | Cross-list from Chart Reading. |
| 11 | Setup Types | News Fade | `/learn/news-fade/` | draft | needs_upgrade | Also belongs in News course. |
| 12 | Setup Types | Sell The News | `/learn/sell-the-news/` | draft | needs_upgrade | Needs careful non-signal framing. |
| 13 | Multi-Day Context | Multi-Day Runner | `/learn/multi-day-runner/` | draft | needs_upgrade | Should teach review context, not hype. |
| 14 | Risk Context | Chasing Stocks | `/learn/chasing-stocks/` | draft | needs_upgrade | Also belongs in Psychology. |

## Course 6: News, Catalysts And SEC Filings

### Purpose

Teach users how to review news, catalysts, company announcements, filings, and event-driven stock movement.

### Course Outcome

The user should understand what caused a stock to move, how to review the quality of the catalyst, how filings change context, and how to avoid headline chasing.

### Completed Academy-Ready Lessons

| Order | Module | Lesson | URL | Status | Last Known Commit |
|---:|---|---|---|---|---|
| 1 | Catalyst Foundation | Stock Catalysts | `/learn/stock-catalysts/` | complete | `63dff225` |
| 2 | Press Releases | Stock Press Releases | `/learn/press-releases/` | complete | `a089acc5` |
| 3 | Press Releases | How To Read Stock Press Releases | `/learn/how-to-read-stock-press-releases/` | complete | `31f3f02c` |
| 4 | SEC Filing Foundation | SEC Filings | `/learn/sec-filings/` | complete | `4616c671` |

### Next Priority Lessons

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 5 | SEC Filing Foundation | Form 8-K | `/learn/sec-filings/form-8-k/` | draft | not_started | Current next recommended upgrade. |
| 6 | SEC Filing Foundation | Form S-1 | `/learn/sec-filings/form-s-1/` | draft | needs_upgrade | Registration statement education. |
| 7 | SEC Filing Foundation | Form S-3 | `/learn/sec-filings/form-s-3/` | draft | needs_upgrade | Shelf registration education. |
| 8 | SEC Filing Foundation | Form 424B5 | `/learn/sec-filings/form-424b5/` | draft | needs_upgrade | Offering terms education. |
| 9 | News Categories | Earnings News | `/learn/earnings-news/` | draft | needs_upgrade | Numbers, guidance, reaction. |
| 10 | News Categories | FDA News Stocks | `/learn/fda-news-stocks/` | draft | needs_upgrade | Regulatory catalysts. |
| 11 | News Categories | Clinical Trial News | `/learn/clinical-trial-news/` | draft | needs_upgrade | Trial phase/endpoints/context. |
| 12 | News Categories | Contract News Stocks | `/learn/contract-news-stocks/` | draft | needs_upgrade | Named customer, terms, timeline. |
| 13 | News Categories | Partnership News Stocks | `/learn/partnership-news-stocks/` | draft | needs_upgrade | Vague vs specific partner news. |
| 14 | News Categories | Merger News Stocks | `/learn/merger-news-stocks/` | draft | needs_upgrade | Merger terms and risk. |
| 15 | News Review | How To Review News Trades | `/learn/how-to-review-news-trades/` | draft | needs_upgrade | Could bridge to Trade Review course. |

## Course 7: Small-Cap Stocks, Float And Dilution

### Purpose

Teach small-cap-specific context: float, share structure, offerings, dilution, warrants, reverse splits, cash needs, and financing cycles.

### Course Outcome

The user should understand that small-cap stock movement often depends on float, liquidity, share supply, financing history, and dilution risk.

### Suggested Modules And Lessons

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Small-Cap Foundation | Small-Cap Stocks | `/learn/small-cap-stocks/` | draft | needs_upgrade | Course opener. |
| 2 | Small-Cap Foundation | Penny Stocks | `/learn/penny-stocks/` | draft | needs_upgrade | Must avoid hype. |
| 3 | Float Foundation | Stock Float | `/learn/stock-float/` | draft | needs_upgrade | Core concept. |
| 4 | Float Foundation | Low Float Stocks | `/learn/low-float-stocks/` | draft | needs_upgrade | Avoid "low float runs" hype. |
| 5 | Float Foundation | Float Rotation | `/learn/float-rotation/` | draft | needs_upgrade | Advanced small-cap lesson. |
| 6 | Share Structure | Float Vs Shares Outstanding | `/learn/float-vs-shares-outstanding/` | draft | needs_upgrade | Good bridge to dilution. |
| 7 | Share Structure | Fully Diluted Shares | `/learn/fully-diluted-shares/` | draft | needs_upgrade | Important for warrants/convertibles. |
| 8 | Valuation Context | Market Cap Vs Fully Diluted Market Cap | `/learn/market-cap-vs-fully-diluted-market-cap/` | draft | needs_upgrade | Helps avoid surface-level market cap review. |
| 9 | Dilution Foundation | Dilution | `/learn/dilution/` | draft | needs_upgrade | Core concept. |
| 10 | Dilution Foundation | Dilution Risk | `/learn/dilution-risk/` | draft | needs_upgrade | Broad risk lesson. |
| 11 | Dilution Foundation | How To Spot Dilution Risk | `/learn/how-to-spot-dilution-risk/` | draft | needs_upgrade | High priority after SEC filing lessons. |
| 12 | Offerings | Stock Offerings | `/learn/stock-offerings/` | draft | needs_upgrade | Offering hub. |
| 13 | Offerings | Public Offering | `/learn/public-offering/` | draft | needs_upgrade | Offering type. |
| 14 | Offerings | Registered Direct Offering | `/learn/registered-direct-offering/` | draft | needs_upgrade | Small-cap relevant. |
| 15 | Offerings | Private Placement | `/learn/private-placement/` | draft | needs_upgrade | Small-cap relevant. |
| 16 | Offerings | At The Market Offering | `/learn/at-the-market-offering/` | draft | needs_upgrade | ATM context. |
| 17 | Offerings | Shelf Registration | `/learn/shelf-registration/` | draft | needs_upgrade | Important after S-3. |
| 18 | Offerings | Shelf Registration Vs Offering | `/learn/shelf-registration-vs-offering/` | draft | needs_upgrade | Prevents overreacting to shelf filings. |
| 19 | Securities | Warrants | `/learn/warrants/` | draft | needs_upgrade | Core dilution/security lesson. |
| 20 | Securities | Warrants Vs Options | `/learn/warrants-vs-options/` | draft | needs_upgrade | Clarifies common confusion. |
| 21 | Securities | Pre-Funded Warrants | `/learn/pre-funded-warrants/` | draft | needs_upgrade | Important offering term. |
| 22 | Securities | Convertible Notes | `/learn/convertible-notes/` | draft | needs_upgrade | Key small-cap risk. |
| 23 | Securities | Preferred Stock | `/learn/preferred-stock/` | draft | needs_upgrade | Often appears in filings. |
| 24 | Corporate Actions | Reverse Split | `/learn/reverse-split/` | draft | needs_upgrade | Important small-cap context. |
| 25 | Corporate Actions | Reverse Split Vs Dilution | `/learn/reverse-split-vs-dilution/` | draft | needs_upgrade | Clarifies two separate concepts. |
| 26 | Corporate Actions | Forward Split | `/learn/forward-split/` | draft | needs_upgrade | Less urgent, but useful. |
| 27 | Risk Context | Cash Runway | `/learn/cash-runway/` | draft | needs_upgrade | Financing pressure context. |
| 28 | Risk Context | Going Concern | `/learn/going-concern/` | draft | needs_upgrade | Risk language in filings. |

## Course 8: Risk Management And Trade Planning

### Purpose

Teach users how to define risk, size trades, plan invalidation, manage trades, and protect against preventable account damage.

### Course Outcome

The user should understand how risk, sizing, stops, loss limits, reward/risk, and trade plans work together.

### Suggested Modules And Lessons

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Planning | Trading Plan | `/learn/trading-plan/` | draft | needs_upgrade | Cross-listed from Foundations. |
| 2 | Planning | Trading Rules | `/learn/trading-rules/` | draft | needs_upgrade | Rules as behavior constraints. |
| 3 | Risk Basics | Risk Management | `/learn/risk-management/` | draft | needs_upgrade | Course foundation. |
| 4 | Risk Basics | Position Sizing | `/learn/position-sizing/` | draft | needs_upgrade | Size from risk, not emotion. |
| 5 | Risk Basics | Risk Reward Ratio | `/learn/risk-reward-ratio/` | draft | needs_upgrade | Needs nuanced expectation framing. |
| 6 | Risk Basics | Stop Loss | `/learn/stop-loss/` | draft | needs_upgrade | Invalidation concept. |
| 7 | Risk Basics | Mental Stop Vs Hard Stop | `/learn/mental-stop-vs-hard-stop/` | draft | needs_upgrade | Execution and discipline context. |
| 8 | Account Protection | Max Loss | `/learn/max-loss/` | draft | needs_upgrade | Per-trade or session loss guardrail. |
| 9 | Account Protection | Daily Loss Limit | `/learn/daily-loss-limit/` | draft | needs_upgrade | Strong behavior protection lesson. |
| 10 | Trade Management | Trade Management | `/learn/trade-management/` | draft | needs_upgrade | Managing after entry. |
| 11 | Trade Management | Profit Protection | `/learn/profit-protection/` | draft | needs_upgrade | Avoid profit promise language. |
| 12 | Event Risk | Overnight Risk | `/learn/overnight-risk/` | draft | needs_upgrade | Also belongs in swing course. |
| 13 | Event Risk | Holding Through News | `/learn/holding-through-news/` | draft | needs_upgrade | Strong bridge to News course. |

## Course 9: Trading Psychology And Discipline

### Purpose

Teach the behavior patterns that damage trader consistency: chasing, FOMO, revenge trading, overtrading, holding losers, cutting winners, and rule-breaking.

### Course Outcome

The user should understand common behavioral traps and how to review them without shame or vague motivation.

### Suggested Modules And Lessons

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Discipline Foundation | Trading Discipline | `/learn/trading-discipline/` | draft | needs_upgrade | Course foundation. |
| 2 | Impulse Patterns | FOMO Trading | `/learn/fomo-trading/` | draft | needs_upgrade | Strong product bridge. |
| 3 | Impulse Patterns | Chasing Stocks | `/learn/chasing-stocks/` | draft | needs_upgrade | Should tie to volume/news/chart context. |
| 4 | Impulse Patterns | Revenge Trading | `/learn/revenge-trading/` | draft | needs_upgrade | Needs practical intervention framing. |
| 5 | Impulse Patterns | Overtrading | `/learn/overtrading/` | draft | needs_upgrade | Session behavior lesson. |
| 6 | Trade Management Errors | Holding Losers Too Long | `/learn/holding-losers-too-long/` | draft | needs_upgrade | Review-focused, not shaming. |
| 7 | Trade Management Errors | Cutting Winners Too Early | `/learn/cutting-winners-too-early/` | draft | needs_upgrade | Avoid profit guarantee. |
| 8 | Position Behavior | Averaging Down | `/learn/averaging-down/` | draft | needs_upgrade | Risk/process lesson. |

## Course 10: Trade Review And Improvement

### Purpose

Teach users how to review decisions, executions, context, mistakes, and repeated patterns. This is the strongest natural bridge to Trader Intelligence.

### Course Outcome

The user should understand how improvement happens through structured review, not just reading lessons.

### Suggested Modules And Lessons

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Review Foundation | Trade Review And Improvement | `/learn/trade-review-and-improvement/` | gap | gap_needed | New course opener. |
| 2 | Review Foundation | Trade Risk Review | `/learn/trade-risk-review/` | draft | needs_upgrade | Existing draft can become core lesson. |
| 3 | Review Foundation | How To Review News Trades | `/learn/how-to-review-news-trades/` | draft | needs_upgrade | Cross-listed from News course. |
| 4 | Review Foundation | Swing Trade Journal | `/learn/swing-trade-journal/` | draft | needs_upgrade | Swing-specific review. |
| 5 | Review Process | Planned Vs Actual Trade | `/learn/planned-vs-actual-trade-review/` | gap | gap_needed | Strong Trader Intelligence bridge. |
| 6 | Review Process | Execution Review | `/learn/execution-review/` | gap | gap_needed | Slippage/spread/order-type bridge. |
| 7 | Review Process | Mistake Pattern Review | `/learn/mistake-pattern-review/` | gap | gap_needed | Behavior review without shame. |
| 8 | Product Bridge | How Trader Intelligence Helps Review Trades | `/learn/trader-intelligence-trade-review/` | gap | gap_needed | Soft product education, not hard sales. |

## Cross-Listed Lesson Rules

Some lessons can appear in more than one course. This is good for navigation, but each lesson should still have one primary course.

Examples:

- `/learn/breakout-trading/` primary: Chart Reading; cross-list: Trading Styles.
- `/learn/gap-fill-trading/` primary: Chart Reading; cross-list: Trading Styles and News.
- `/learn/volume-by-price/` primary: Volume; cross-list: Technical Indicators And Tools.
- `/learn/news-fade/` primary: Trading Styles or News; cross-list: Psychology if framed around chasing/fading.
- `/learn/how-to-review-news-trades/` primary: Trade Review; cross-list: News.

Recommended metadata fields for future lessons:

```yaml
academy_course: "Chart Reading And Market Structure"
academy_module: "Core Levels"
academy_order: 1
academy_level: "Foundation"
recommended_previous: "/learn/..."
recommended_next: "/learn/..."
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
| Chart Reading And Market Structure | 23 | Strong course core already created. Needs candlestick and chart pattern expansions later. |
| Volume, Liquidity And Order Flow | 14 | Core course path is academy-ready. |
| News, Catalysts And SEC Filings | 4 | Foundation started. Next lesson should be Form 8-K. |
| Trading Foundations | 0 | Existing drafts need upgrade plus onboarding gap lessons. |
| Technical Indicators And Tools | 0 | Mostly gap lessons needed. |
| Trading Styles And Playbooks | 0 | Existing drafts plus several gap lessons. |
| Small-Cap Stocks, Float And Dilution | 0 | Many drafts exist; high-value future course. |
| Risk Management And Trade Planning | 0 | Many drafts exist; high-value future course. |
| Trading Psychology And Discipline | 0 | Many drafts exist; strong retention/product bridge. |
| Trade Review And Improvement | 0 | Needs new course opener and product-aligned review lessons. |

Total Academy-ready lessons currently represented in this index:

```text
41
```

Current best next editorial action:

```text
/learn/sec-filings/form-8-k/
```

Reason:

The Academy just completed the SEC filings hub. Form 8-K is the natural next lesson because it teaches the most common current-event filing users will encounter after press releases and catalysts.

## Maintenance Instructions

When a lesson is created or upgraded:

1. Update the lesson row in this file.
2. Update `docs/content/learn-editorial-upgrade-tracker.md`.
3. Update `docs/content/learn-image-asset-manifest.md` if visuals are created.
4. Update `docs/content/HANDOFF_2026-05-08.md`.
5. Keep course order and recommended next lesson aligned.
6. If a new gap lesson is discovered, add it here before drafting.

This file should become the master Academy index used by Codex and future website implementation work.
