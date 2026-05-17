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
| 6 | News, Catalysts And SEC Filings | content_upgraded | High-value TradersLink differentiator. Core course markdown lesson path is now complete through news-trade review. |
| 7 | Small-Cap Stocks, Float And Dilution | content_upgraded | Completed markdown course path covering small-cap context, float, share structure, dilution, offerings, securities, corporate actions, cash runway, and going concern. |
| 8 | Risk Management And Trade Planning | content_upgraded | Completed markdown course path covering plans, rules, sizing, stops, loss limits, trade management, profit protection, overnight risk, and holding through news. |
| 9 | Trading Psychology And Discipline | content_upgraded | Completed markdown course path covering discipline, FOMO, chasing, revenge trading, overtrading, holding losers, cutting winners, and averaging down. |
| 10 | Trade Review And Improvement | content_upgraded | Completed markdown course path covering trade review, risk review, planned-vs-actual review, execution review, mistake patterns, swing review, and Trader Intelligence review bridge. |

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

The 41 already upgraded lessons should be treated as **content_upgraded** and mostly close to **academy_ready**, but they still need an Academy migration pass before final website implementation.

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

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 5 | SEC Filing Foundation | Form 8-K | `/learn/sec-filings/form-8-k/` | content_upgraded | complete | Current-event filing workflow, item/exhibit review, financing language, and review prompts added. |
| 6 | Company Reports | Form 10-K | `/learn/sec-filings/form-10-k/` | content_upgraded | complete | Annual report, audited financials, risk factors, cash, debt, share structure, and going-concern context. |
| 7 | Company Reports | Form 10-Q | `/learn/sec-filings/form-10-q/` | content_upgraded | complete | Quarterly report, unaudited financials, cash changes, operating updates, and risk review. |
| 8 | Company Reports | Form 20-F | `/learn/sec-filings/form-20-f/` | content_upgraded | complete | Foreign private issuer annual report context, financial statements, and risk disclosures. |
| 9 | Company Reports | Form 6-K | `/learn/sec-filings/form-6-k/` | content_upgraded | complete | Foreign issuer current reports, foreign-market disclosures, press releases, and interim updates. |
| 10 | Registration Statements | Form S-1 | `/learn/sec-filings/form-s-1/` | content_upgraded | complete | Registration statement, resale shares, selling stockholders, warrants, and future supply context. |
| 11 | Registration Statements | Form S-3 | `/learn/sec-filings/form-s-3/` | content_upgraded | complete | Shelf registration, offering distinction, eligibility, and future offering context. |
| 12 | Registration Statements | Form F-1 | `/learn/sec-filings/form-f-1/` | content_upgraded | complete | Foreign issuer registration statement, IPO/resale context, risk factors, and share supply. |
| 13 | Registration Statements | Form F-3 | `/learn/sec-filings/form-f-3/` | content_upgraded | complete | Foreign issuer shelf registration, eligibility, prospectus supplements, and offering context. |
| 14 | Transaction Registration | Form S-4 | `/learn/sec-filings/form-s-4/` | content_upgraded | complete | Merger securities, exchange offers, shareholder votes, transaction terms, and deal risk. |
| 15 | Transaction Registration | Form S-8 | `/learn/sec-filings/form-s-8/` | content_upgraded | complete | Employee benefit plan securities, compensation shares, available share pools, and supply context. |
| 16 | Prospectus Supplements | Form 424B5 | `/learn/sec-filings/form-424b5/` | content_upgraded | complete | Prospectus supplement, offering terms, warrants, proceeds, and dilution context. |
| 17 | Prospectus Supplements | Form 424B3 | `/learn/sec-filings/form-424b3/` | content_upgraded | complete | Prospectus updates, resale context, registered securities, and plan of distribution. |
| 18 | Prospectus Supplements | Form 424B4 | `/learn/sec-filings/form-424b4/` | content_upgraded | complete | Final prospectus details, offering terms, underwriters, proceeds, and risk disclosure. |
| 19 | Registration Effectiveness | EFFECT Notice | `/learn/sec-filings/effect-notice/` | content_upgraded | complete | Effectiveness notice, related registration statement, resale eligibility, and timing context. |
| 20 | Insider Ownership | Form 3 | `/learn/sec-filings/form-3/` | content_upgraded | complete | Initial insider ownership, officer/director holdings, and beneficial ownership baseline. |
| 21 | Insider Ownership | Form 4 | `/learn/sec-filings/form-4/` | content_upgraded | complete | Insider transactions, transaction codes, grants, exercises, sales, and footnotes. |
| 22 | Insider Ownership | Form 5 | `/learn/sec-filings/form-5/` | content_upgraded | complete | Annual insider ownership cleanup, late/exempt transactions, and follow-up review. |
| 23 | Beneficial Ownership | Schedule 13D | `/learn/sec-filings/schedule-13d/` | content_upgraded | complete | Large beneficial ownership, activist intent, purpose of transaction, and position changes. |
| 24 | Beneficial Ownership | Schedule 13G | `/learn/sec-filings/schedule-13g/` | content_upgraded | complete | Passive/institutional beneficial ownership, ownership percentage, amendments, and float context. |
| 25 | Proxy Statements | Form DEF 14A | `/learn/sec-filings/form-def-14a/` | content_upgraded | complete | Definitive proxy statements, shareholder votes, governance, compensation, and meeting proposals. |
| 26 | Proxy Statements | Form PRE 14A | `/learn/sec-filings/form-pre-14a/` | content_upgraded | complete | Preliminary proxy statements, proposed votes, corporate actions, and changes before final proxy. |
| 27 | Late Filing Notices | NT 10-K | `/learn/sec-filings/nt-10-k/` | content_upgraded | complete | Late annual report notices, delay reasons, reporting risk, and follow-up filing review. |
| 28 | Late Filing Notices | NT 10-Q | `/learn/sec-filings/nt-10-q/` | content_upgraded | complete | Late quarterly report notices, delay reasons, reporting controls, and follow-up 10-Q context. |
| 29 | Exchange And Listing Events | Form 25 | `/learn/sec-filings/form-25/` | content_upgraded | complete | Delisting, exchange removal, deregistration context, listing status, and liquidity risk. |
| 30 | News Categories | Earnings News | `/learn/earnings-news/` | content_upgraded | complete | Revenue, losses, margins, guidance, cash, and reaction review added. |
| 31 | News Categories | FDA News Stocks | `/learn/fda-news-stocks/` | content_upgraded | complete | Regulatory event types, development stage, cash context, and review workflow added. |
| 32 | News Categories | Clinical Trial News | `/learn/clinical-trial-news/` | content_upgraded | complete | Phase, endpoints, sample size, safety, cash context, and review workflow added. |
| 33 | News Categories | Contract News Stocks | `/learn/contract-news-stocks/` | content_upgraded | complete | Customer name, terms, value, timing, execution context, and review workflow added. |
| 34 | News Categories | Partnership News Stocks | `/learn/partnership-news-stocks/` | content_upgraded | complete | Partner quality, terms, commercial mechanics, filing context, and review workflow added. |
| 35 | News Categories | Merger News Stocks | `/learn/merger-news-stocks/` | content_upgraded | complete | Deal type, consideration, closing conditions, filings, dilution context, and review workflow added. |
| 36 | News Review | How To Review News Trades | `/learn/how-to-review-news-trades/` | content_upgraded | complete | Course capstone review lesson added for catalyst, reaction, risk, execution, and repeated patterns. |

### Course Status

The News, Catalysts And SEC Filings course markdown path is **content_upgraded** across the catalyst, press release, SEC filing, news category, and news-trade review lessons.

Before production UI implementation, this course still needs:

- Visual asset review to decide which filing/news lessons need SVG support.
- Optional course intro/landing copy for the Academy course page.
- Progress/lesson completion wiring in the website build phase.

## Course 7: Small-Cap Stocks, Float And Dilution

### Purpose

Teach small-cap-specific context: float, share structure, offerings, dilution, warrants, reverse splits, cash needs, and financing cycles.

### Course Outcome

The user should understand that small-cap stock movement often depends on float, liquidity, share supply, financing history, and dilution risk.

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Small-Cap Foundation | Small-Cap Stocks | `/learn/small-cap-stocks/` | content_upgraded | complete | Course opener covering market cap, volatility, liquidity, catalysts, filings, and risk. |
| 2 | Small-Cap Foundation | Penny Stocks | `/learn/penny-stocks/` | content_upgraded | complete | Penny-stock risk, low-priced securities, spreads, promotions, and company quality. |
| 3 | Float Foundation | Stock Float | `/learn/stock-float/` | content_upgraded | complete | Tradable share supply, float size, liquidity, turnover, and share availability. |
| 4 | Float Foundation | Low Float Stocks | `/learn/low-float-stocks/` | content_upgraded | complete | Low-float volatility, liquidity gaps, halts, spread risk, and crowding. |
| 5 | Float Foundation | Float Rotation | `/learn/float-rotation/` | content_upgraded | complete | Volume versus float, scanner context, repeated turnover, and crowding risk. |
| 6 | Share Structure | Float Vs Shares Outstanding | `/learn/float-vs-shares-outstanding/` | content_upgraded | complete | Float, shares outstanding, restricted shares, insider holdings, and tradable supply. |
| 7 | Share Structure | Fully Diluted Shares | `/learn/fully-diluted-shares/` | content_upgraded | complete | Warrants, options, convertibles, preferred stock, and potential future share count. |
| 8 | Valuation Context | Market Cap Vs Fully Diluted Market Cap | `/learn/market-cap-vs-fully-diluted-market-cap/` | content_upgraded | complete | Basic market cap versus fully diluted valuation and hidden supply context. |
| 9 | Dilution Foundation | Dilution | `/learn/dilution/` | content_upgraded | complete | New share issuance, ownership percentage, share count, and financing context. |
| 10 | Dilution Foundation | Dilution Risk | `/learn/dilution-risk/` | content_upgraded | complete | Cash needs, financing mechanisms, shelf registrations, warrants, convertibles, and offering risk. |
| 11 | Dilution Foundation | How To Spot Dilution Risk | `/learn/how-to-spot-dilution-risk/` | content_upgraded | complete | Cash runway, filings, shelf capacity, ATM programs, warrants, convertibles, and financing history. |
| 12 | Offerings | Stock Offerings | `/learn/stock-offerings/` | content_upgraded | complete | Equity offering structures, pricing, proceeds, share count, warrants, and financing context. |
| 13 | Offerings | Public Offering | `/learn/public-offering/` | content_upgraded | complete | Registered public offerings, pricing, underwriters, warrants, proceeds, and dilution context. |
| 14 | Offerings | Registered Direct Offering | `/learn/registered-direct-offering/` | content_upgraded | complete | Registered direct offerings, investors, pricing, warrants, placement agents, and share supply. |
| 15 | Offerings | Private Placement | `/learn/private-placement/` | content_upgraded | complete | Private placements, restricted securities, registration rights, warrants, and resale context. |
| 16 | Offerings | At The Market Offering | `/learn/at-the-market-offering/` | content_upgraded | complete | ATM programs, shelf capacity, gradual share sales, volume impact, and filing context. |
| 17 | Offerings | Shelf Registration | `/learn/shelf-registration/` | content_upgraded | complete | Shelf capacity, future offerings, prospectus supplements, and timing context. |
| 18 | Offerings | Shelf Registration Vs Offering | `/learn/shelf-registration-vs-offering/` | content_upgraded | complete | Difference between registering securities and actually selling securities. |
| 19 | Securities | Warrants | `/learn/warrants/` | content_upgraded | complete | Warrant terms, exercise price, expiration, cashless exercise, and potential future shares. |
| 20 | Securities | Warrants Vs Options | `/learn/warrants-vs-options/` | content_upgraded | complete | Warrant/option differences, issuer impact, dilution, and trading context. |
| 21 | Securities | Pre-Funded Warrants | `/learn/pre-funded-warrants/` | content_upgraded | complete | Pre-funded warrant mechanics, ownership limits, offering structure, and share-count context. |
| 22 | Securities | Convertible Notes | `/learn/convertible-notes/` | content_upgraded | complete | Convertible debt, conversion terms, fixed versus variable conversion, and dilution risk. |
| 23 | Securities | Preferred Stock | `/learn/preferred-stock/` | content_upgraded | complete | Preferred stock rights, conversion, liquidation preference, voting, and dilution context. |
| 24 | Corporate Actions | Reverse Split | `/learn/reverse-split/` | content_upgraded | complete | Reverse split mechanics, exchange compliance, share count adjustment, and post-split context. |
| 25 | Corporate Actions | Reverse Split Vs Dilution | `/learn/reverse-split-vs-dilution/` | content_upgraded | complete | Difference between share consolidation and ownership dilution. |
| 26 | Corporate Actions | Forward Split | `/learn/forward-split/` | content_upgraded | complete | Forward split mechanics, share count adjustment, price adjustment, and context review. |
| 27 | Risk Context | Cash Runway | `/learn/cash-runway/` | content_upgraded | complete | Cash balance, burn rate, financing runway, and capital need review. |
| 28 | Risk Context | Going Concern | `/learn/going-concern/` | content_upgraded | complete | Going concern warnings, substantial doubt, cash needs, operating losses, and financing risk. |

### Course Status

The Small-Cap Stocks, Float And Dilution course markdown path is **content_upgraded** across all 28 planned lessons.

Before production UI implementation, this course still needs:

- Visual asset review to decide which lessons need chart, filing, or share-structure diagrams.
- Optional course intro/landing copy for the Academy course page.
- Progress/lesson completion wiring in the website build phase.


## Course 8: Risk Management And Trade Planning

### Purpose

Teach users how to define risk, size trades, plan invalidation, manage trades, and protect against preventable account damage.

### Course Outcome

The user should understand how risk, sizing, stops, loss limits, reward/risk, and trade plans work together.

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Planning | Trading Plan | `/learn/trading-plan/` | content_upgraded | complete | Course opener covering written process, setup criteria, risk rules, and review process. |
| 2 | Planning | Trading Rules | `/learn/trading-rules/` | content_upgraded | complete | Rule clarity, behavior constraints, triggers, exceptions, and review process. |
| 3 | Risk Basics | Risk Management | `/learn/risk-management/` | content_upgraded | complete | Risk per trade, position size, invalidation, daily limit, loss control, and review process. |
| 4 | Risk Basics | Position Sizing | `/learn/position-sizing/` | content_upgraded | complete | Account risk, trade risk, stop distance, share size, liquidity, slippage, and max loss. |
| 5 | Risk Basics | Risk Reward Ratio | `/learn/risk-reward-ratio/` | content_upgraded | complete | Planned risk, potential reward, win-rate context, realistic targets, invalidation, and review after exit. |
| 6 | Risk Basics | Stop Loss | `/learn/stop-loss/` | content_upgraded | complete | Invalidation level, stop type, position size, liquidity, gap risk, discipline risk, and review outcome. |
| 7 | Risk Basics | Mental Stop Vs Hard Stop | `/learn/mental-stop-vs-hard-stop/` | content_upgraded | complete | Execution discipline, order risk, liquidity, gap risk, platform access, emotional delay, and review evidence. |
| 8 | Account Protection | Max Loss | `/learn/max-loss/` | content_upgraded | complete | Per-trade max loss, session max loss, account impact, position sizing, stop discipline, and shutdown plan. |
| 9 | Account Protection | Daily Loss Limit | `/learn/daily-loss-limit/` | content_upgraded | complete | Daily loss number, stop-trading trigger, reset rule, revenge risk, overtrading risk, and review plan. |
| 10 | Trade Management | Trade Management | `/learn/trade-management/` | content_upgraded | complete | Initial plan, risk adjustment, partial exits, stop movement, adding rules, time in trade, and exit review. |
| 11 | Trade Management | Profit Protection | `/learn/profit-protection/` | content_upgraded | complete | Open profit, giveback risk, exit plan, trailing logic, liquidity, news risk, and review after exit. |
| 12 | Event Risk | Overnight Risk | `/learn/overnight-risk/` | content_upgraded | complete | Gap risk, news risk, position size, liquidity, borrow or margin risk, exit access, and next-day plan. |
| 13 | Event Risk | Holding Through News | `/learn/holding-through-news/` | content_upgraded | complete | Scheduled catalysts, unexpected news, position size, gap risk, liquidity, thesis dependence, and review outcome. |

### Course Status

The Risk Management And Trade Planning course markdown path is **content_upgraded** across all 13 planned lessons.

Before production UI implementation, this course still needs:

- Visual asset review to decide which lessons need planning, sizing, risk, or trade-management diagrams.
- Optional course intro/landing copy for the Academy course page.
- Progress/lesson completion wiring in the website build phase.


## Course 9: Trading Psychology And Discipline

### Purpose

Teach the behavior patterns that damage trader consistency: chasing, FOMO, revenge trading, overtrading, holding losers, cutting winners, and rule-breaking.

### Course Outcome

The user should understand common behavioral traps and how to review them without shame or vague motivation.

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Discipline Foundation | Trading Discipline | `/learn/trading-discipline/` | content_upgraded | complete | Course opener covering rule adherence, pressure points, vague versus reviewable rules, and discipline review. |
| 2 | Impulse Patterns | FOMO Trading | `/learn/fomo-trading/` | content_upgraded | complete | Fear-of-missing-out triggers, late entries, scanner/social pressure, and structured review. |
| 3 | Impulse Patterns | Chasing Stocks | `/learn/chasing-stocks/` | content_upgraded | complete | Late-entry risk, extension, spread/slippage, nearby levels, and chase-behavior review. |
| 4 | Impulse Patterns | Revenge Trading | `/learn/revenge-trading/` | content_upgraded | complete | Emotional follow-up trades after losses, re-entry behavior, size increases, and interruption rules. |
| 5 | Impulse Patterns | Overtrading | `/learn/overtrading/` | content_upgraded | complete | Trade quality, session triggers, boredom/frustration, repeated re-entries, and stop-trading review. |
| 6 | Trade Management Errors | Holding Losers Too Long | `/learn/holding-losers-too-long/` | content_upgraded | complete | Planned versus unplanned losses, invalidation, stop movement, averaging down, and exit-delay review. |
| 7 | Trade Management Errors | Cutting Winners Too Early | `/learn/cutting-winners-too-early/` | content_upgraded | complete | Planned profit protection versus fear-based exits, target review, scaling, and early-exit patterns. |
| 8 | Position Behavior | Averaging Down | `/learn/averaging-down/` | content_upgraded | complete | Planned scaling versus emotional adding, risk expansion, invalidation, and average-down review. |

### Course Status

The Trading Psychology And Discipline course markdown path is **content_upgraded** across all 8 planned lessons.

Before production UI implementation, this course still needs:

- Visual asset review to decide whether behavior-loop, session-sequence, or trade-management diagrams would improve learning.
- Optional course intro/landing copy for the Academy course page.
- Progress/lesson completion wiring in the website build phase.

## Course 10: Trade Review And Improvement

### Purpose

Teach users how to review decisions, executions, context, mistakes, and repeated patterns. This is the strongest natural bridge to Trader Intelligence.

### Course Outcome

The user should understand how improvement happens through structured review, not just reading lessons.

### Completed Course Lesson Sequence

| Order | Module | Lesson | URL | Current Asset | Status | Notes |
|---:|---|---|---|---|---|---|
| 1 | Review Foundation | Trade Review And Improvement | `/learn/trade-review-and-improvement/` | content_upgraded | complete | Course opener covering review categories, outcome versus decision quality, and improvement notes. |
| 2 | Review Foundation | Trade Risk Review | `/learn/trade-risk-review/` | content_upgraded | complete | Planned versus actual risk, invalidation, size, stops, adds, slippage, and repeated risk behavior. |
| 3 | Review Process | Planned Vs Actual Trade Review | `/learn/planned-vs-actual-trade-review/` | content_upgraded | complete | Plan versus actual setup, entry, risk, size, management, exit, and adjustment review. |
| 4 | Review Process | Execution Review | `/learn/execution-review/` | content_upgraded | complete | Entry timing, fill quality, order type, spread, slippage, liquidity, and exit execution review. |
| 5 | Review Process | Mistake Pattern Review | `/learn/mistake-pattern-review/` | content_upgraded | complete | Repeated behavior patterns, mistake tags, context triggers, and rule improvements without shame framing. |
| 6 | Specialized Review | How To Review News Trades | `/learn/how-to-review-news-trades/` | content_upgraded | complete | Cross-listed completed News course capstone for catalyst, reaction, risk, execution, and news-trade review. |
| 7 | Specialized Review | Swing Trade Journal | `/learn/swing-trade-journal/` | content_upgraded | complete | Multi-session thesis, levels, overnight risk, catalysts, daily management notes, and swing-trade review. |
| 8 | Product Bridge | How Trader Intelligence Helps Review Trades | `/learn/trader-intelligence-trade-review/` | content_upgraded | complete | Review-only product bridge explaining Trader Intelligence as completed-trade analysis, not prediction. |

### Course Status

The Trade Review And Improvement course markdown path is **content_upgraded** across 7 newly upgraded or created lessons plus the already-completed cross-listed news-trade review lesson.

Before production UI implementation, this course still needs:

- Visual asset review to decide whether review workflow, planned-vs-actual, execution, or pattern diagrams would improve learning.
- Optional course intro/landing copy for the Academy course page.
- Progress/lesson completion wiring in the website build phase.

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
| News, Catalysts And SEC Filings | 36 | Full course markdown path is now content-upgraded across catalysts, press releases, SEC filings, news categories, and news-trade review. Needs visual review before UI-ready. |
| Trading Foundations | 0 | Existing drafts need upgrade plus onboarding gap lessons. |
| Technical Indicators And Tools | 0 | Mostly gap lessons needed. |
| Trading Styles And Playbooks | 0 | Existing drafts plus several gap lessons. |
| Small-Cap Stocks, Float And Dilution | 28 | Full course markdown path is now content-upgraded across small-cap context, float, dilution, offerings, securities, corporate actions, cash runway, and going concern. Needs visual review before UI-ready. |
| Risk Management And Trade Planning | 13 | Full course markdown path is now content-upgraded across planning, rules, risk basics, account protection, trade management, and event risk. Needs visual review before UI-ready. |
| Trading Psychology And Discipline | 8 | Full course markdown path is now content-upgraded across discipline, FOMO, chasing, revenge trading, overtrading, holding losers, cutting winners, and averaging down. Needs visual review before UI-ready. |
| Trade Review And Improvement | 7 | Full course markdown path is now content-upgraded across review foundation, risk review, planned-vs-actual review, execution review, mistake patterns, swing review, and Trader Intelligence review bridge. The news-trade review lesson is cross-listed from the completed News course. Needs visual review before UI-ready. |

Total Academy-ready lessons currently represented in this index:

```text
129
```

More precise current state:

| State | Lesson Count | Meaning |
|---|---:|---|
| content_upgraded | 129 | Lessons already upgraded into strong educational content with realistic examples, review prompts, visuals where useful, and safer non-advice language. |
| academy_format_review_needed | 129 | The same upgraded lessons should still receive a final Academy migration pass for metadata, course/module/order, completion assumptions, and section naming. |
| academy_ready | 0 | No lesson should be treated as final Academy UI-ready until the migration pass confirms it. |

The 129 content-upgraded lessons are not throwaway work. They are the foundation of the Academy. The next step is to normalize them into the final course format while continuing to create or upgrade missing lessons.

Current best next editorial action:

```text
/learn/start-here/
```

Reason:

The Academy just completed the Trade Review And Improvement course markdown path. The highest-value next course is Trading Foundations, starting with `/learn/start-here/`, because the Academy now needs a clean beginner onboarding path that introduces the course system before users enter advanced lessons.

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
