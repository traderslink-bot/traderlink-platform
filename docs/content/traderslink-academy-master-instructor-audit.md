# TradersLink Academy Master Instructor Audit

Date: 2026-05-17

## Purpose

This audit reviews the current TradersLink Academy as a course-based learning journey, not as a blog library. The goal is to identify gaps in courses, modules, lesson flow, lesson depth, and visual/UI readiness before production website implementation.

This is a planning and editorial review only. It does not change production routes, schemas, components, JSX, CSS, or website behavior.

## Review Method

Reviewed:

- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-academy-visual-ui-readiness-review.md`
- `docs/content/learn-editorial-upgrade-tracker.md`
- Current lesson inventory under `docs/content/drafts/learn/`
- Current guardrail language scan for guarantee, prediction, buy/sell, profit, and financial-advice phrasing

The language-risk scan showed the Academy is consistently using the intended guardrails: lessons repeatedly frame charts, indicators, filings, catalysts, and setups as review context rather than predictions or guaranteed outcomes. The matches were mostly disclaimer, no-guarantee, and review-context language. Rule-specific topics such as halts, circuit breakers, and SEC filing mechanics should still be source-verified at drafting time because rules and filing conventions can change.

## Overall Verdict

The Academy is structurally strong and now behaves like a real learning product rather than an SEO article collection. The biggest remaining issues are not broad rewrites. They are:

1. Course-order refinement.
2. A few missing bridge lessons for newer traders.
3. Some advanced gap lessons that would make SEC, small-cap, risk, psychology, and review courses feel more complete.
4. Visual coverage for courses that are currently markdown-ready but not yet visually rich.
5. Cleanup of planning-doc presentation, especially path hubs being listed as Course 15 and appearing before Courses 12 through 14 in the index.

## Recommended Academy Course Order

The current index has Risk Management after News and Small-Cap. As a master-instructor sequence, risk should move earlier. Users should understand planning, sizing, invalidation, and loss limits before they study styles, catalysts, dilution, halts, or workflow courses.

Recommended production order:

| Order | Course | Reason |
|---:|---|---|
| 1 | Trading Foundations | Start here, Academy navigation, day trading vs swing trading, beginner orientation. |
| 2 | Chart Reading And Market Structure | Levels, candles, structure, breakouts, breakdowns, and chart context. |
| 3 | Volume, Liquidity And Order Flow | Activity quality, spread, slippage, Level 2, time and sales, liquidity. |
| 4 | Risk Management And Trade Planning | Risk needs to come before styles, catalysts, small-cap volatility, and workflows. |
| 5 | Technical Indicators And Tools | Indicators make more sense after price, volume, liquidity, and risk. |
| 6 | Trading Styles And Playbooks | Users can now evaluate styles through chart, volume, and risk context. |
| 7 | Day Trading Workflow | Session-specific path after styles and risk are understood. |
| 8 | Swing Trading Workflow | Multi-session path after core risk, catalysts, and levels are introduced. |
| 9 | News, Catalysts And SEC Filings | High-value research skill, but safer after risk and workflow foundations. |
| 10 | Small-Cap Stocks, Float And Dilution | Specialized risk and supply context after SEC/news basics. |
| 11 | Halts And High-Volatility Events | Advanced event-risk course after small-cap, liquidity, and risk context. |
| 12 | Trading Psychology And Discipline | Behavior work lands better once users know the trading situations that trigger it. |
| 13 | Trade Review And Improvement | Structured review after users understand decisions, risk, execution, and behavior. |
| 14 | Practice And Improvement | Practice loop and forward testing as the capstone habit system. |

Academy Navigation Path Hubs should be treated as navigation paths, not a numbered course. They should sit on the Academy homepage and course pages as guided entry points.

## Course 1: Trading Foundations

Verdict: Strong Academy start, but still a little light for a true beginner path.

What works:

- `Start Here` and `How To Use TradersLink Academy` give the learning product a real onboarding layer.
- Day trading and swing trading comparison helps users choose a broad path.
- Cross-linking to risk, plan, and review lessons prevents this course from becoming too thin.

Gaps:

- Add `What Is A Stock And How Does A Trade Work?`
- Add `Stock Market Sessions And Order Flow Basics`
- Add `Long Trades, Short Trades, And Borrow Risk`
- Add `Brokerage Account, Margin, And Buying Power Basics`
- Add `Reading A Ticker Page For Beginners`

Flow recommendation:

- Keep the current four lessons, but treat them as the first module.
- Add a market-mechanics module before sending beginners into chart reading.

Priority: High for beginner completeness.

## Course 2: Chart Reading And Market Structure

Verdict: Strongest current course family. It has the best instructional depth and the best visual foundation.

What works:

- Support, resistance, key levels, breakouts, breakdowns, reclaims, rejection, structure, trend, consolidation, compression, and patterns are already coherent.
- Candlestick and chart-pattern subcourses correctly teach context rather than prediction.
- Realistic chart visuals are aligned with the lessons.

Gaps:

- Add `Multiple Timeframe Chart Reading`.
- Add `Level Quality: Clean, Crowded, And Weak Levels`.
- Add `When A Chart Is Too Messy To Trade`.
- Add `Trend Context Before Patterns`.

Flow recommendation:

- Keep this early.
- Present candlestick and chart-pattern lessons as submodules inside Chart Reading, not separate unrelated libraries.

Priority: Medium. The course is already strong; gaps improve polish and learner confidence.

## Course 3: Volume, Liquidity And Order Flow

Verdict: Strong and practically useful.

What works:

- The course progresses well from volume to relative volume, spikes, liquidity, dollar volume, spread, bid/ask, slippage, orders, Level 2, tape, and volume profile.
- The course correctly teaches execution context, not magic confirmation.

Gaps:

- Add `Volume Exhaustion And Failed Follow-Through`.
- Add `Liquidity Traps And Crowded Participation`.
- Add `Reading Volume In Context With Float`.

Flow recommendation:

- Keep after Chart Reading.
- Cross-link heavily to Small-Cap, Day Trading Workflow, and Halts.

Priority: Medium.

## Course 4: Risk Management And Trade Planning

Verdict: Content is strong, but the course should move earlier in the Academy order.

What works:

- Plans, rules, sizing, stops, max loss, daily loss limits, management, profit protection, overnight risk, and holding through news are all necessary.
- The course frames risk as a planned process, not as vague discipline talk.

Gaps:

- Add `Win Rate, Reward/Risk, And Expectancy`.
- Add `Drawdowns And Risk Of Ruin Basics`.
- Add `Scaling In And Scaling Out Rules`.
- Add `Portfolio And Correlation Risk`.
- Add `Margin, Borrow, And Forced Liquidation Risk`.

Flow recommendation:

- Move before Technical Indicators and Trading Styles.
- This should become the "you can study opportunities only after you understand risk" course.

Priority: High for sequence correction; medium for new lessons.

## Course 5: Technical Indicators And Tools

Verdict: Solid and intentionally restrained.

What works:

- Indicators lag price, indicator overload, moving averages, VWAP, anchored VWAP, RSI, MACD, Bollinger Bands, ATR, and volume by price are enough for a core course.
- The course avoids the common beginner trap of treating indicators as signal machines.

Gaps:

- Add `How To Choose Indicators For A Trading Plan`.
- Add `Indicator Settings And Timeframe Context`.
- Add optional advanced lessons only if needed later: `ADX`, `Stochastic`, and `Relative Strength Versus The Market`.

Flow recommendation:

- Keep after Risk Management.
- Do not bloat this course with every indicator. Teach tool selection.

Priority: Medium.

## Course 6: Trading Styles And Playbooks

Verdict: Good, but needs a few conceptual bridge lessons so users understand styles as families, not identities.

What works:

- Styles overview, day trading, swing trading, scalping, momentum, pullbacks/dip-buy context, news fade, sell-the-news, and multi-day runners cover the common practical families.
- Cross-listing breakout, breakdown, reclaim, gap-fill, and chasing lessons is useful.

Gaps:

- Add `Trend Following Vs Mean Reversion`.
- Add `Range Trading`.
- Add `Short Selling Basics`.
- Add `Playbook Criteria And Disqualification Rules`.
- Add `When Not To Trade A Style`.

Flow recommendation:

- Keep after Risk, Chart Reading, Volume, and Indicators.
- Make every style lesson answer: what context fits, what context disqualifies, what risk is unique, and how to review it afterward.

Priority: High for `Short Selling Basics` and `Playbook Criteria`; medium for the others.

## Course 7: Day Trading Workflow

Verdict: Strong session-based course.

What works:

- Preparation, watchlist, market open, opening range, midday, power hour, after-hours, and session review form a logical day.
- Time-of-day concepts are not treated as signals.
- Visuals are strong and realistic.

Gaps:

- Add `Day Trading Order Entry And Execution Checklist`.
- Add `Scanner, Alert, And News Feed Workflow`.
- Add `When To Stop Trading For The Day`.

Flow recommendation:

- Keep after Trading Styles so users understand this is a workflow, not the whole identity of trading.
- Cross-link to Risk Management and Psychology at natural pressure points.

Priority: Medium.

## Course 8: Swing Trading Workflow

Verdict: Strong and more complete than a normal beginner swing course.

What works:

- The course distinguishes swing trading from failed day trades.
- It covers overnight risk, levels, volume, catalysts, earnings, news risk, and small-cap swing context.

Gaps:

- Add `Swing Trading Watchlist Workflow`.
- Add `Multi-Timeframe Swing Planning`.
- Add `Managing A Swing Trade While It Is Open`.
- Add `Weekend And Holiday Risk`.

Flow recommendation:

- Keep after Day Trading Workflow or as a parallel workflow path.
- In UI, let users choose Day Trading or Swing Trading once they finish Styles.

Priority: Medium.

## Course 9: News, Catalysts And SEC Filings

Verdict: Very strong differentiator and much deeper than ordinary trading education.

What works:

- The course covers catalysts, press releases, 8-K, 10-Q, 10-K, 6-K, 20-F, registration statements, prospectus supplements, ownership forms, proxies, late filings, delisting, earnings, FDA, trials, contracts, partnerships, mergers, and news-trade review.
- The lesson flow is unusually useful for small-cap and catalyst-aware traders.

Gaps:

- Add `How To Use EDGAR Source Documents`.
- Add `SEC Filing Amendments And Exhibits`.
- Add `Form 144 And Restricted Stock Sales`.
- Add `13F Filings For Traders`.
- Add `Tender Offers And Going-Private Filings`.
- Integrate existing local draft candidates after review: `ai-news-stocks`, `biotech-data-readouts`, `fda-fast-track`, `orphan-drug-designation`, `pdufa-date`, `phase-1-phase-2-phase-3-trials`, `revenue-guidance`, and `bitcoin-crypto-treasury-stocks`.

Flow recommendation:

- Keep after workflows, or make it a selectable specialized path for catalyst-focused users.
- Use filing visuals carefully: show source, form type, exhibit, terms, and chart reaction review, not fake legal certainty.

Priority: High for EDGAR/source-document lesson; medium for filing expansion.

## Course 10: Small-Cap Stocks, Float And Dilution

Verdict: Strong course and highly relevant to TradersLink.

What works:

- The course covers small-cap context, penny stocks, float, float rotation, float versus shares outstanding, fully diluted shares, market cap context, dilution, offerings, warrants, convertibles, preferred stock, splits, cash runway, and going concern.

Gaps:

- Integrate existing local draft candidates after review: `resale-registration-statement`, `shareholder-approval-for-dilution`, and `atm-offering-vs-public-offering`.
- Add `Authorized Shares And Share Increase Proposals`.
- Add `Lock-Up Expiration And Resale Risk`.
- Add `Warrant Exercise Price And Cashless Exercise Review`.
- Add `Offering Pricing, Discounts, And Warrant Coverage`.

Flow recommendation:

- Keep after News/SEC because small-cap dilution lessons depend on filings.
- Cross-link to Halts, Liquidity, Risk, and Swing Small Caps.

Priority: High for resale registration and shareholder approval integration.

## Course 11: Halts And High-Volatility Events

Verdict: Strong risk-context course.

What works:

- It correctly teaches halts, resumes, circuit breakers, fast-spread risk, low-float volatility, and high-volatility review as risk context rather than triggers.
- Official-source reminders are appropriate.

Gaps:

- Add `Halt Codes And Official Source Checks`.
- Add `Limit Up-Limit Down Basics`.
- Add `News Pending Vs Volatility Halt Context`.
- Add `Liquidity After A Halt Resume`.

Flow recommendation:

- Keep after Small-Cap and Liquidity.
- Rule-specific lessons should be verified against official Nasdaq/NYSE/FINRA/SEC sources when drafted.

Priority: Medium.

## Course 12: Trading Psychology And Discipline

Verdict: Strong behavior course that avoids shame framing.

What works:

- Discipline, FOMO, chasing, revenge, overtrading, holding losers, cutting winners, and averaging down cover the common destructive patterns.

Gaps:

- Add `Tilt Trading`.
- Add `Confirmation Bias In Trading`.
- Add `Recency Bias And Outcome Bias`.
- Add `Patience And Waiting For Setups`.
- Add `Confidence After Wins And Losses`.

Flow recommendation:

- Keep after users have seen real trading workflows and risk concepts.
- Make this course feel like behavior pattern recognition, not motivation content.

Priority: Medium.

## Course 13: Trade Review And Improvement

Verdict: Essential product bridge and one of the most important Academy courses.

What works:

- Trade review, risk review, planned-vs-actual, execution review, mistake pattern review, news-trade review, swing journal, and Trader Intelligence review bridge are the right spine.

Gaps:

- Add `Building A Playbook From Reviewed Trades`.
- Add `Weekly And Monthly Trading Review`.
- Add `Trade Tagging And Pattern Samples`.
- Add `Sample Size Before Changing Rules`.
- Add `Separating Good Decisions From Good Outcomes`.

Flow recommendation:

- Keep after Psychology or near the end as the improvement engine.
- This should be the cleanest bridge to Trader Intelligence because it matches the product's actual strength.

Priority: High for weekly/monthly review and sample-size lessons.

## Course 14: Practice And Improvement

Verdict: Strong capstone course.

What works:

- Practice trading, paper trading, replay, watchlist review, screenshot review, grading, one-rule drills, forward testing, and improvement plans create the right training loop.

Gaps:

- Add `Backtesting Vs Forward Testing`.
- Add `Deliberate Practice Calendar`.
- Add `Building A Minimum Sample Size`.
- Add `Reviewing Practice Without Hindsight Bias`.

Flow recommendation:

- Keep as the capstone habit course.
- Cross-link back into Trade Review and Risk Management.

Priority: Medium.

## Academy Navigation Path Hubs

Verdict: Useful, but should not be presented as Course 15.

What works:

- Chart Reading Path, News And Filings Path, Trade Review Path, and Risk Discipline Path are exactly the right UI/navigation layer.

Gaps:

- Add optional future `Day Trading Workflow Path`.
- Add optional future `Swing Trading Workflow Path`.
- Add optional future `Small-Cap Dilution Path`.
- Add optional future `Practice Path` only if the UI needs path cards beyond course cards.

Flow recommendation:

- Treat hubs as homepage entry points, not required course completion objects.
- They should help users choose a path and resume progress, not duplicate course pages.

Priority: Medium for UI planning; low for content rewriting.

## Highest-Value New Lesson Candidates

| Priority | Lesson Candidate | Course | Why It Matters |
|---:|---|---|---|
| 1 | What Is A Stock And How Does A Trade Work? | Trading Foundations | Fills the true-beginner market-mechanics gap. |
| 1 | Stock Market Sessions And Order Flow Basics | Trading Foundations | Helps users understand premarket, open, regular session, and after-hours before workflows. |
| 1 | Win Rate, Reward/Risk, And Expectancy | Risk Management | Prevents users from misunderstanding risk/reward without probability context. |
| 1 | Short Selling Basics | Trading Styles | Necessary before news fades, breakdowns, halts, borrow risk, and small-cap volatility. |
| 1 | How To Use EDGAR Source Documents | News/SEC | Makes SEC education actionable and source-based. |
| 1 | Building A Playbook From Reviewed Trades | Trade Review | Bridges learning into repeatable improvement and product value. |
| 2 | Multiple Timeframe Chart Reading | Chart Reading | Connects daily, intraday, and workflow decisions. |
| 2 | How To Choose Indicators For A Trading Plan | Technical Indicators | Prevents indicator overload and tool collecting. |
| 2 | Resale Registration Statement | Small-Cap | Existing local draft candidate; important supply-risk concept. |
| 2 | Shareholder Approval For Dilution | Small-Cap | Existing local draft candidate; important proxy/dilution bridge. |
| 2 | Weekly And Monthly Trading Review | Trade Review | Turns lesson completion into ongoing improvement. |
| 2 | Backtesting Vs Forward Testing | Practice | Clarifies practice evidence and expectation setting. |

## Existing Local Draft Candidates To Review

The following local draft candidates already exist and should be reviewed before deciding whether to integrate them into the Academy sequence:

- `docs/content/drafts/learn/accumulation-and-distribution.md`
- `docs/content/drafts/learn/ai-news-stocks.md`
- `docs/content/drafts/learn/atm-offering-vs-public-offering.md`
- `docs/content/drafts/learn/biotech-data-readouts.md`
- `docs/content/drafts/learn/bitcoin-crypto-treasury-stocks.md`
- `docs/content/drafts/learn/fda-fast-track.md`
- `docs/content/drafts/learn/orphan-drug-designation.md`
- `docs/content/drafts/learn/pdufa-date.md`
- `docs/content/drafts/learn/phase-1-phase-2-phase-3-trials.md`
- `docs/content/drafts/learn/resale-registration-statement.md`
- `docs/content/drafts/learn/revenue-guidance.md`
- `docs/content/drafts/learn/shareholder-approval-for-dilution.md`

Do not mark these Academy-complete until each draft gets the same Academy metadata, previous/next placement, lesson objective, realistic examples, common mistakes, practical checklist, Apply This In Review section, Trader Intelligence bridge, related lessons, related glossary terms, FAQ, educational disclaimer, and visual review.

## Visual/UI Readiness Findings

The Academy is content-format ready, but the user experience will feel more premium if the next visual batches focus on courses that currently have strong markdown but less visual support:

1. Technical Indicators And Tools: moving averages, VWAP, RSI, MACD, Bollinger Bands, ATR.
2. Risk Management And Trade Planning: position sizing, stop loss, daily loss limit, risk/reward, trade management.
3. News/SEC: EDGAR/source workflow, filing-to-chart reaction review, shelf-to-offering flow, proxy/shareholder approval context.
4. Small-Cap/Dilution: share-structure diagrams, dilution timeline, warrant/convertible mechanics, resale registration.
5. Trade Review/Practice: review loop, sample size, playbook-building, planned-vs-actual decision map.

Visuals should keep the same guardrails: realistic red/green candles when chart-based, dashboard-style filing panels for SEC lessons, mobile-readable labels, `title` and `desc` tags, no buy/sell language, no profit claims, no guaranteed-outcome framing.

## Planning Doc Cleanup Needed

The Academy index should be cleaned up before production implementation:

- Update the recommended production course order so Risk Management appears before Technical Indicators and Trading Styles.
- Treat Academy Navigation Path Hubs as navigation support, not Course 15.
- Reorder section headings or add a note that the current file order is historical, because Course 15 currently appears before Courses 12 through 14.
- Remove duplicate Day Trading Workflow row in the progress snapshot.
- Make course naming consistent: `News, Catalysts And SEC Filings` versus `News, Catalysts, Filings, And Dilution`; `Volume, Liquidity And Order Flow` versus `Volume Liquidity And Order Flow`.

## Master Instructor Next Step

Do not rewrite the whole Academy. The highest-value next run is:

1. Update the Academy index course order and path-hub framing.
2. Create the top-priority missing beginner/risk bridge lessons:
   - `What Is A Stock And How Does A Trade Work?`
   - `Stock Market Sessions And Order Flow Basics`
   - `Win Rate, Reward/Risk, And Expectancy`
   - `Short Selling Basics`
   - `How To Use EDGAR Source Documents`
   - `Building A Playbook From Reviewed Trades`
3. Then continue visual Batch 1 from the visual/UI readiness review.

This sequence strengthens the Academy without bloating lessons or turning it back into a flat SEO content library.
