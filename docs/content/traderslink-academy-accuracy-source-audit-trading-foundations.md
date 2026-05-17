# TradersLink Academy Accuracy/Source Audit: Trading Foundations

Date: 2026-05-17

Audit pass: Pass 3 - Accuracy/Source Audit

Status: complete

## Scope

Reviewed the Trading Foundations course and source-sensitive bridge lessons:

- `docs/content/drafts/learn/start-here.md`
- `docs/content/drafts/learn/how-to-use-traderslink-academy.md`
- `docs/content/drafts/learn/what-is-a-stock-and-how-does-a-trade-work.md`
- `docs/content/drafts/learn/stock-market-sessions-and-order-flow-basics.md`
- `docs/content/drafts/learn/day-trading-for-beginners.md`
- `docs/content/drafts/learn/day-trading-vs-swing-trading.md`
- `docs/content/drafts/learn/trading-plan.md`
- `docs/content/drafts/learn/trading-rules.md`
- `docs/content/drafts/learn/risk-management.md`
- `docs/content/drafts/learn/position-sizing.md`
- `docs/content/drafts/learn/stop-loss.md`
- `docs/content/drafts/learn/trade-risk-review.md`
- `docs/content/drafts/learn/short-selling-basics.md`
- `docs/content/drafts/learn/win-rate-reward-risk-and-expectancy.md`

The formal Trading Foundations course has 12 lessons. `short-selling-basics.md` and `win-rate-reward-risk-and-expectancy.md` were included because they are beginner bridge lessons with source-sensitive risk, margin, execution, or math framing.

## Official Sources Used

| Source | Used For |
|---|---|
| Investor.gov, Stock glossary and Stocks FAQ | Stock ownership, equity/share framing, stock risk language. |
| Investor.gov, Types of Orders | Market orders, limit orders, stop orders, execution-price limitations. |
| Investor.gov, Executing an Order | Broker routing, market centers, execution timing, payment for order flow, best execution context. |
| SEC, After-Hours Trading: Understanding the Risks | Regular-hours framing and extended-hours liquidity, spread, volatility, and uncertain-price risks. |
| FINRA, Day Trading | Day-trading definition, margin-account framing, PDT/current day-trading requirements, risk warnings. |
| FINRA, SR-FINRA-2025-017 | Current 2026 rule-change context for replacing day-trading margin provisions with intraday margin standards. |
| SEC, Key Points About Regulation SHO | Short sale mechanics, borrowing, margin/interest, locate/delivery, close-out, and unlimited-loss risk. |

## Overall Verdict

Trading Foundations is broadly accurate and safe for beginner education. The course already avoids performance promises, buy/sell signals, and guarantee language. The biggest accuracy need was adding source-backed guardrails where beginners can easily misunderstand execution, session risk, day-trading account rules, and short-selling mechanics.

No major rewrite was needed.

## Targeted Edits Completed

| Lesson | Edit |
|---|---|
| `/learn/what-is-a-stock-and-how-does-a-trade-work/` | Added a source check clarifying that market orders prioritize execution but not price, limit orders control price but may not execute, and broker routing/market-center mechanics can affect fills. |
| `/learn/stock-market-sessions-and-order-flow-basics/` | Added a source check covering regular-hours framing and extended-hours risks: thinner liquidity, wider spreads, greater volatility, uncertain prices, and broker-specific access. |
| `/learn/day-trading-for-beginners/` | Added a source check clarifying that FINRA's margin-rule definition and broker/account restrictions matter, and that the lesson is process/risk education rather than account-rule advice. |
| `/learn/short-selling-basics/` | Added a source check tying short-selling mechanics and risk language to SEC Regulation SHO investor materials. |

## Source-Sensitive Findings

### Stock And Trade Mechanics

The stock ownership framing is accurate. Investor.gov defines stock as ownership/equity in a corporation, and the lesson correctly avoids implying stock ownership guarantees gains.

The order mechanics were directionally accurate before this pass. The source note now makes the key beginner distinction explicit: a market order may execute but does not guarantee price, while a limit order controls price but may not execute.

### Order Routing And Execution

Investor.gov explains that online orders are routed through a broker, and the broker may send orders to exchanges, market makers, ECNs, or internalization venues. The lesson already described routing at a simplified level and correctly connected execution to spread, liquidity, slippage, and review.

No deeper market-structure rewrite is needed in Trading Foundations. Detailed order routing belongs in the Volume, Liquidity And Order Flow course.

### Market Sessions

The sessions lesson did not overstate exact broker access windows, which is good. SEC materials describe regular U.S. exchange trading as traditionally 9:30 a.m. to 4:00 p.m. Eastern Time and warn that extended-hours trading can involve lower liquidity, wider spreads, volatility, and uncertain prices. The added source note reinforces those risks without turning the lesson into a rules page.

### Day Trading Rules

The beginner day-trading lesson intentionally avoids hard PDT instruction, which is the right editorial choice. FINRA's public day-trading page still describes current pattern-day-trader concepts and requirements, while FINRA SR-FINRA-2025-017 documents a 2026 proposed rule change to replace day-trading margin provisions with modern intraday margin standards.

Because this area is changing, beginner lessons should avoid static "you must have X" rule language unless the page is specifically a dated day-trading margin-rule lesson. The added source note tells learners to verify broker, account, FINRA, and SEC rules.

### Day Trading Vs Swing Trading

The lesson's distinction between same-session day trading and multi-session swing trading is accurate and avoids claiming either style is safer or better. No edit was required.

### Risk, Position Size, Stops, And Trade Review

The cross-listed risk lessons are educational, process-focused, and conservative. The stop-loss lesson already includes the key Investor.gov order-type guardrail: stop orders can become market orders and do not guarantee a perfect exit price.

No additional source edits were needed in the risk lesson set during this pass.

### Short Selling

The short-selling lesson was accurate but needed an official-source guardrail because short selling is easy for beginners to misunderstand. SEC Regulation SHO investor materials support the lesson's core points: short sellers borrow shares, sell them, later buy shares back, may pay costs, face margin rules, and can face theoretically unlimited losses if price keeps rising.

The added source note keeps the lesson educational and avoids implying short selling is a recommendation.

### Expectancy

The expectancy lesson is a math/review lesson, not a legal or regulatory rules lesson. It already states that expectancy does not guarantee future profit and that sample quality, execution, fees, spreads, slippage, and changing market conditions matter.

No edit was required.

## App Bridge Check

The Trading Foundations app bridge language remains restrained. The strongest natural app tie-ins are:

- Execution Review for order type, fills, spread, and slippage.
- Session Review for premarket, open, midday, close, and after-hours behavior.
- Risk Review for position size, stop behavior, and planned versus actual risk.
- Trade Review for beginner decision quality after trades are closed.

No hard app route links were added.

## Deferred Items

These are useful future lessons or later audit items, but they do not block this course:

- A dated `/learn/day-trading-margin-rules/` lesson after the 2026 FINRA rule-change path is stable enough to describe without becoming outdated quickly.
- A deeper `/learn/order-routing-and-execution/` lesson if the product wants an advanced execution module beyond market/limit/slippage basics.
- A future Pass 3 source audit for Volume, Liquidity And Order Flow, because that course contains the highest concentration of execution mechanics after Trading Foundations.

## Recommended Next Action

Next recommended audit:

```text
Pass 3: Accuracy/Source Audit for Volume, Liquidity And Order Flow
```

Reason: the course includes bid/ask, spread, liquidity, slippage, market orders versus limit orders, Level 2, time and sales, and volume-by-price. These topics should be source-checked against official Investor.gov, SEC, FINRA, and exchange/market-structure references before visual/UI planning.
