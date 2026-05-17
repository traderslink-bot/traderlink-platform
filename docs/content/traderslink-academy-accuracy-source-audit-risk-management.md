# TradersLink Academy Accuracy/Source Audit: Risk Management And Trade Planning

Date: 2026-05-17

Audit pass: Pass 3 - Accuracy/Source Audit

Status: complete

## Scope

Reviewed the 14-lesson Risk Management And Trade Planning course:

- `docs/content/drafts/learn/trading-plan.md`
- `docs/content/drafts/learn/trading-rules.md`
- `docs/content/drafts/learn/risk-management.md`
- `docs/content/drafts/learn/position-sizing.md`
- `docs/content/drafts/learn/risk-reward-ratio.md`
- `docs/content/drafts/learn/win-rate-reward-risk-and-expectancy.md`
- `docs/content/drafts/learn/stop-loss.md`
- `docs/content/drafts/learn/mental-stop-vs-hard-stop.md`
- `docs/content/drafts/learn/max-loss.md`
- `docs/content/drafts/learn/daily-loss-limit.md`
- `docs/content/drafts/learn/trade-management.md`
- `docs/content/drafts/learn/profit-protection.md`
- `docs/content/drafts/learn/overnight-risk.md`
- `docs/content/drafts/learn/holding-through-news.md`

## Official Sources Used

| Source | Used For |
|---|---|
| Investor.gov, Types of Orders | Stop orders, stop-limit orders, market-order behavior after stop trigger, no-fill risk for stop-limit orders. |
| SEC Investor Bulletin, Trading Basics | Order-type tradeoffs, stop order behavior, fast-market and execution-price caveats. |
| SEC, After-Hours Trading: Understanding the Risks | Overnight and after-hours liquidity, wider spreads, volatility, uncertain prices, and news impact. |
| FINRA Rule 2265, Extended Hours Trading Risk Disclosure | Lower liquidity, higher volatility, changing prices, partial/no execution, and wider spread risk outside regular hours. |
| Investor.gov, Margin Account | Margin risk, margin calls, amplified losses, and broker/account constraints. |
| SEC, Day Trading: Your Dollars at Risk | Short-term trading risk, borrowing-to-trade risk, and risk-disclosure context. |
| FINRA, Day Trading | Margin-account day-trading definition, day-trading risk disclosure, and current day-trading margin-rule context. |

## Overall Verdict

Risk Management And Trade Planning is broadly accurate and appropriately conservative. The course already avoids promising that stops, loss limits, position sizing, risk/reward, expectancy, profit protection, or trade plans can guarantee outcomes.

The source-sensitive work was intentionally narrow:

- Add official order-type caveats to stop-loss and mental-versus-hard-stop lessons.
- Add official extended-hours, margin, and news-risk guardrails to overnight/news lessons.
- Clean a few stale related-lesson labels that displayed raw slugs instead of human-readable lesson names.

No broad rewrite was needed.

## Targeted Edits Completed

| Lesson | Edit |
|---|---|
| `/learn/stop-loss/` | Added a source check clarifying that triggered stop orders can become market orders and may execute away from the stop price, while stop-limit orders may not execute. |
| `/learn/mental-stop-vs-hard-stop/` | Added a source check clarifying the official order-type distinction between stop-market and stop-limit behavior. |
| `/learn/overnight-risk/` | Added a source check tying overnight exposure to SEC/FINRA extended-hours risk disclosures and Investor.gov margin-account risk materials. |
| `/learn/holding-through-news/` | Added a source check tying news holds to SEC after-hours risk materials and official-source verification for company, SEC, exchange, or regulator news. |
| `/learn/trading-plan/` | Replaced an unrelated `Going Concern` related-lesson link with `Unusual Volume`, which is the actual previous course transition. |
| Multiple Risk lessons | Replaced raw `/learn/trade-risk-review/` related-link labels with `Trade Risk Review`. |

## Source-Sensitive Findings

### Trading Plans, Rules, And Risk Management

The plan/rules/risk foundation lessons are educational rather than regulatory. They correctly frame plans and rules as review tools, not outcome guarantees.

No source correction was required.

### Position Sizing

The position sizing lesson is accurate as practical education. It connects size to risk area, stop distance, liquidity, spread, slippage, volatility, and account context. It does not give a universal percentage rule or imply one position-sizing model works for all traders.

No source correction was required.

### Risk/Reward And Expectancy

The risk/reward and expectancy lessons are accurate. They explicitly avoid the common mistake of treating a planned ratio or positive historical expectancy as a guarantee. The expectancy formula is presented as a review concept based on completed trade samples, not a forecast.

No source correction was required.

### Stop Loss And Stop Type

The stop-loss and mental-versus-hard-stop lessons were already directionally accurate. Investor.gov and SEC order-type materials support the key caveats:

- A stop order can become a market order after the stop price is triggered.
- The final execution price can differ from the stop price.
- A stop-limit order adds price control but can fail to execute.
- Fast, thin, volatile, or gap conditions can make stop behavior different from the trader's plan.

Small source notes were added to both lessons.

### Max Loss And Daily Loss Limits

The max loss and daily loss limit lessons are accurate as self-imposed trader rules. They already state that loss limits cannot prevent all losses and cannot remove market risk, slippage, gap risk, or execution problems.

No source correction was required.

### Trade Management And Profit Protection

The trade management and profit-protection lessons are accurate. They treat partial exits, trailing logic, stop movement, and open-profit giveback as planning/review concepts, not instructions or promises.

No source correction was required.

### Overnight Risk And Holding Through News

The overnight and news-hold lessons are accurate and appropriately cautious. SEC and FINRA materials support the added source notes:

- Extended-hours trading can have lower liquidity, wider spreads, higher volatility, changing prices, and partial/no executions.
- News announced outside regular hours can have outsized impact when trading activity is limited.
- A planned stop or chart level may not be available after a gap.
- Margin use can increase losses and create margin-call risk.

The course correctly teaches that holding through news should be intentional, sized for event risk, and reviewed after the outcome.

## App Bridge Check

The app bridge language remains restrained and review-focused.

Best future app surfaces:

- Risk Review for planned versus actual risk, sizing, stop movement, max loss, daily loss limits, and event exposure.
- Trade Review for plan adherence, rule breaks, trade management, and profit-protection decisions.
- Execution Review for stop fills, slippage, spread, liquidity, and order-type mismatch.
- Analytics for reward/risk, win rate, average winner/loss, expectancy, and repeated risk-behavior samples.
- Coaching for revenge trading, overtrading, rule breaks, and behavior near loss limits.

No hard app route links were added during this pass.

## Deferred Items

These are useful later, but they do not block the course:

- A deeper visual or lesson explaining stop-market versus stop-limit orders if the Academy later builds an execution-order mini-module.
- A visual for planned risk versus actual risk after slippage, gap, or stop execution.
- A future update if FINRA day-trading margin rule changes lead to a dedicated day-trading account-rules lesson.

## Recommended Next Action

Next recommended audit:

```text
Pass 3: Accuracy/Source Audit for Technical Indicators And Tools
```

Reason: that course includes moving averages, VWAP, anchored VWAP, RSI, MACD, Bollinger Bands, ATR, VWAP reclaim, and cross-listed volume-by-price concepts. The next pass should verify formula, platform-calculation, indicator-lag, and anti-signal claims against primary or reputable technical-reference sources where official sources are not available.
