# TradersLink Academy Accuracy/Source Audit: Trading Styles And Playbooks

Date: 2026-05-17

Audit pass: Pass 3 - Accuracy/Source Audit

Status: complete

## Scope

Reviewed the 15-lesson Trading Styles And Playbooks course:

- `docs/content/drafts/learn/trading-styles.md`
- `docs/content/drafts/learn/day-trading.md`
- `docs/content/drafts/learn/swing-trading.md`
- `docs/content/drafts/learn/scalping-stocks.md`
- `docs/content/drafts/learn/short-selling-basics.md`
- `docs/content/drafts/learn/momentum-trading.md`
- `docs/content/drafts/learn/pullbacks-and-dip-buy-setups.md`
- `docs/content/drafts/learn/breakout-trading.md`
- `docs/content/drafts/learn/breakdown-trading.md`
- `docs/content/drafts/learn/level-reclaim.md`
- `docs/content/drafts/learn/gap-fill-trading.md`
- `docs/content/drafts/learn/news-fade.md`
- `docs/content/drafts/learn/sell-the-news.md`
- `docs/content/drafts/learn/multi-day-runner.md`
- `docs/content/drafts/learn/chasing-stocks.md`

## Sources Used

| Source | Used For |
|---|---|
| FINRA, Day Trading | Day-trading definition, margin-account context, pattern day trader framing, and broker-specific counting/rule cautions. |
| SEC, Day Trading: Your Dollars at Risk | Day-trading risk, margin/borrowing risk, and easy-profit warning context. |
| FINRA Rule 2270, Day-Trading Risk Disclosure Statement | Day-trading risk disclosure language, commission/cost pressure, margin risk, and no-guarantee framing. |
| FINRA Regulatory Notice 26-10 | Current 2026 day-trading margin-rule transition: new intraday margin standards effective June 4, 2026, with phase-in through October 20, 2027. |
| SEC, Key Points About Regulation SHO | Short-selling mechanics, borrow/locate, delivery, close-out, and theoretically unlimited loss risk. |
| Investor.gov, Types of Orders | Market order execution-price caveat and order-type risk for fast execution styles. |
| SEC, Trade Execution: What Every Investor Should Know | Order routing, execution delay, price-change, best-execution, and effective-spread context. |
| SEC, Tips for Online Investing: Trading In Fast-Moving Markets | Fast-market execution risk, market-versus-limit order caveats, and online trading delay risk. |
| SEC, After-Hours Trading: Understanding the Risks | Extended-hours liquidity, wider spreads, price volatility, uncertain prices, news impact, and partial/no execution risk. |
| SEC, Search Filings | EDGAR public filing verification for catalyst, sell-the-news, and multi-day runner review. |

## Overall Verdict

Trading Styles And Playbooks is accurate and well aligned with the Academy approach. It teaches styles and setup labels as planning and review categories rather than identity labels, predictions, or trading instructions.

The course already avoids the biggest problems:

- It does not claim any style is best.
- It does not claim any setup guarantees continuation, reversal, or profitability.
- It separates planned momentum from chasing.
- It warns that failed day trades should not be renamed swing trades after the fact.
- It treats short selling as risk context, not a recommendation.
- It treats news fade and sell-the-news language as reaction review, not instructions.
- It keeps app bridge wording focused on completed-trade review.

The useful source work was targeted: keep citations and source details in this internal audit, while preserving plain user-facing accuracy guardrails in lessons where rules, execution mechanics, short-selling mechanics, overnight/news risk, or filing verification matter.

## Targeted Edits Completed

| Lesson | Edit |
|---|---|
| `/learn/day-trading/` | Added plain lesson wording for current account-rule, margin, broker-policy, fast-market, trading-cost, and intraday risk context without exposing citations in the user-facing copy. |
| `/learn/swing-trading/` | Added plain lesson wording tying overnight and news exposure to gap, liquidity, spread, volatility, and execution risk. |
| `/learn/scalping-stocks/` | Added plain lesson wording tying scalping risk to fast-market price changes, execution-price uncertainty, spread, slippage, order type, and fill quality. |
| `/learn/short-selling-basics/` | Tightened short-selling mechanics wording to include delivery obligations and broker-policy/forced-closeout context. |
| `/learn/news-fade/` | Added plain lesson wording for after-hours news behavior and original-source verification of press releases, filings, exchange notices, or regulator updates. |
| `/learn/sell-the-news/` | Added plain lesson wording for filing/news review and reinforced that the phrase is not a trade rule. |
| `/learn/multi-day-runner/` | Added plain lesson wording connecting multi-session attention to company news, filings, float/supply context, halts, extended-hours risk, and execution quality. |

No broad rewrite was needed.

## Source-Sensitive Findings

### Style Overview

The course opener is accurate. It frames styles as repeatable planning and review categories, not identities or guaranteed edges. The style definitions are intentionally high level and do not require regulatory detail.

No source correction was required.

### Day Trading

The day-trading lesson is directionally accurate and appropriately risk-focused. FINRA currently describes day trading in margin-account context as buying and selling, or selling and buying, the same security on the same day. SEC and FINRA materials warn that day trading can be extremely risky, especially with margin, borrowing, costs, fast markets, and broker/platform practices.

Important current-date note: as of 2026-05-17, FINRA has announced new intraday margin standards in Regulatory Notice 26-10. The effective date is June 4, 2026, and the phase-in period ends October 20, 2027. Because this rule environment is changing, the lesson should avoid hard-coded PDT/margin requirements unless a future account-rules lesson is verified against then-current FINRA and broker materials.

### Swing Trading

The swing-trading lesson is accurate. It teaches overnight exposure, gaps, news, filings, and hold decisions as risks to plan and review. SEC after-hours materials support the lesson's caution around lower liquidity, wider spreads, greater volatility, uncertain prices, news impact, and partial/no executions.

### Scalping

The scalping lesson is accurate. SEC trade-execution and fast-market materials support the emphasis on spread, slippage, fill quality, order routing, market-order price risk, and quick price changes.

### Short Selling

The short-selling lesson is accurate. SEC Regulation SHO materials support the sequence of borrowing shares, selling short, buying back to replace borrowed shares, and the risk that short losses can be theoretically unlimited if price keeps rising. The lesson also correctly keeps borrow, locate, delivery, close-out, margin, interest, squeeze, halt, and forced-closeout language as risk context rather than short-trade instruction.

### Momentum, Pullbacks, Breakouts, Breakdowns, Reclaims, And Gap Fills

The setup lessons are accurate and conservative. They repeatedly avoid treating momentum, pullbacks, breakouts, breakdowns, reclaims, or gap fills as automatic trades. Cross-listed chart-reading lessons already contain strong anti-guarantee language and realistic visual support.

No source correction was required beyond the broader execution/news/risk notes added to adjacent style lessons.

### News Fade And Sell The News

The news-reaction lessons are accurate. SEC after-hours risk materials support the idea that news outside regular hours can interact with lower liquidity, wider spreads, price volatility, uncertain prices, and execution limitations. SEC EDGAR supports the course's source-first framing around filings.

The added lesson guardrails reinforce that news-fade and sell-the-news are reaction-review concepts, not commands.

### Multi-Day Runner And Chasing

The multi-day runner and chasing lessons are accurate and appropriately sober. They treat attention, float, volume, catalyst persistence, extension, halts, gaps, and supply risk as changing context. Chasing is framed as a behavior-review issue, not a moral failure and not a prediction about outcome.

## App Bridge Check

The app bridge language remains restrained and review-focused.

Best future app surfaces:

- Playbook Builder for style/setup labels, valid/invalid examples, and setup qualification.
- Trade Review for completed trades by style, setup, timeframe, and plan adherence.
- Analytics for repeated outcomes by style and setup category.
- Session Review for day-trading timing, market open, midday, power hour, and overtrading patterns.
- Execution Review for scalping, spread, slippage, order type, fill quality, breakout/reclaim entries, and chase entries.
- Risk Review for short selling, swing holds, overnight/news exposure, multi-day runner volatility, and failed setup response.
- Coaching for chasing, FOMO, style drift, and reactive entries.

No hard app route links were added during this pass.

## Deferred Items

These are useful later, but they do not block the course:

- A dedicated account-rules lesson after the FINRA 2026 intraday margin-rule transition is fully implemented by brokers.
- A visual batch for style selection, momentum versus chasing, controlled pullback versus failed dip, news-fade reaction review, and multi-day continuation versus exhaustion.
- A future lesson on style drift if the UI exposes style/playbook progress and users need more explicit coaching around changing timeframe mid-trade.

## Recommended Next Action

Next recommended audit:

```text
Pass 3: Accuracy/Source Audit for Day Trading Workflow
```

Reason: that course includes premarket trading, day-trading watchlists, market open trading, opening range, midday trading, power hour, after-hours trading, and session review. The next pass should verify time-of-day framing, extended-hours risk, market-open volatility, liquidity/spread/slippage language, day-trading rule references where relevant, and avoid any implication that a session segment creates a signal.
