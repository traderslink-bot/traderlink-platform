# TradersLink Academy Accuracy/Source Audit: Volume, Liquidity And Order Flow

Date: 2026-05-17

Audit pass: Pass 3 - Accuracy/Source Audit

Status: complete

## Scope

Reviewed the 14-lesson Volume, Liquidity And Order Flow course:

- `academy/volume.md`
- `academy/relative-volume.md`
- `academy/relative-volume-rvol.md`
- `academy/volume-spike.md`
- `academy/liquidity.md`
- `academy/dollar-volume.md`
- `academy/spread.md`
- `academy/bid-and-ask.md`
- `academy/slippage.md`
- `academy/market-orders-vs-limit-orders.md`
- `academy/level-2.md`
- `academy/time-and-sales.md`
- `academy/volume-by-price.md`
- `academy/unusual-volume.md`

## Official Sources Used

| Source | Used For |
|---|---|
| Investor.gov, Types of Orders | Market orders, limit orders, stop orders, price-versus-execution tradeoffs. |
| Investor.gov, Executing an Order | Broker routing, market centers, execution quality, last price versus execution context. |
| SEC, After-Hours Trading: Understanding the Risks | Liquidity, spread, volatility, price uncertainty, partial/no-fill risk in thinner markets. |
| FINRA Rule 2265, Extended Hours Trading Risk Disclosure | Lower liquidity, wider spreads, volatility, changing prices, and partial/no-execution risk. |
| Nasdaq, Volume glossary and Daily Market Summary Definitions | Volume as shares traded and share-volume reporting context. |
| Nasdaq TotalView | Exchange order-book depth, displayed liquidity, and depth-of-book market data framing. |
| NYSE OpenBook Aggregated | Depth-of-book feed context and aggregate limit-order volume at bid/offer prices. |
| FINRA Market Transparency Reporting / Trade Reporting FAQs / Rule 6380A and 6380B | Trade reporting, last-sale reports, execution-time reporting, and time-and-sales context. |

## Overall Verdict

The course is broadly accurate and strong. It already avoids the main educational dangers: treating volume as a signal, claiming liquidity guarantees clean fills, implying Level 2 predicts price, or suggesting that market data removes risk.

The useful source work was adding small guardrails where learners can confuse:

- Activity with liquidity.
- Last price with executable price.
- Market order speed with price certainty.
- Limit order price control with execution certainty.
- Level 2 depth with all market interest.
- Time and sales prints with predictive certainty.
- RVOL or volume-profile outputs with official standardized calculations.

No broad rewrite was needed.

## Targeted Edits Completed

| Lesson | Edit |
|---|---|
| `/academy/relative-volume-rvol/` | Added a source check clarifying that RVOL is a platform/data-vendor metric, not one SEC or FINRA standardized number. |
| `/academy/liquidity/` | Added a source check tying liquidity, wider spreads, partial/no-fill risk, and extended-hours/volatile conditions to SEC and FINRA investor materials. |
| `/academy/bid-and-ask/` | Added a source check clarifying that last-traded price is not necessarily the current executable price. |
| `/academy/market-orders-vs-limit-orders/` | Added a source check clarifying the official market-order versus limit-order tradeoff: execution priority versus price control/no-fill risk. |
| `/academy/level-2/` | Added a source check clarifying that market-depth products display visible order-book interest from specific markets or feeds, not all hidden/routed/off-exchange interest. |
| `/academy/time-and-sales/` | Added a source check clarifying that time and sales is based on reported trade prints, but platform display, corrections, late reports, and reporting rules can affect interpretation. |
| `/academy/volume-by-price/` | Added a source check clarifying that volume-by-price/profile zones are charting-platform calculations affected by session, timeframe, aggregation, and data feed. |

## Source-Sensitive Findings

### Volume And Relative Volume

The volume lessons are accurate. Nasdaq defines volume as the number of shares that change hands, and the course correctly teaches volume as participation context rather than directional proof.

Relative volume and RVOL are correctly presented as comparison tools. The source-sensitive issue is that RVOL is not a single official standardized value. The RVOL lesson now tells learners to check the scanner's formula, lookback period, time-of-day handling, data feed, and extended-hours inclusion.

### Liquidity, Spread, And Slippage

The liquidity, spread, and slippage lessons are accurate and conservative. SEC and FINRA extended-hours materials support the key risk framing: lower liquidity, wider spreads, volatility, uncertain prices, and partial/no executions can affect trade quality.

The added liquidity source note reinforces that high volume can help review liquidity but does not guarantee clean fills.

### Bid, Ask, Last Price, And Order Type

The bid/ask and order-type lessons align with Investor.gov. Market orders can prioritize execution but do not guarantee price. Limit orders can control price but may not execute. Investor.gov's order-execution material also supports the course's broker-routing and market-center caution.

The course correctly avoids recommending one order type universally.

### Level 2 Market Depth

The Level 2 lesson is accurate. Nasdaq and NYSE depth-of-book products support the idea that market-depth feeds display visible order-book interest and aggregate depth at bid/offer levels. The important limitation is that displayed depth does not equal all market interest. Hidden orders, routed orders, canceled orders, off-exchange activity, and feed/platform differences can all affect what the learner sees.

The lesson now includes this explicit source guardrail.

### Time And Sales

The time-and-sales lesson is accurate. FINRA trade-reporting material supports the concept of reported trade prints, execution time, price, last-sale reporting, and disseminated trade information. The course already teaches time and sales as actual execution context rather than prediction.

The added source note keeps learners from over-reading a tape window as a perfect real-time map of all intent.

### Volume By Price

The volume-by-price lesson is accurate as an educational chart-tool lesson. The source-sensitive point is that volume profile or volume-by-price zones are platform calculations, not official levels. They depend on timeframe, session, aggregation, and data feed.

The lesson now explicitly says so.

### Unusual Volume

The unusual-volume capstone remains accurate. It correctly ties abnormal activity to catalyst, liquidity, spread, scanner behavior, and review. No additional edit was needed because RVOL, liquidity, and volume source guardrails now cover its main source-sensitive dependencies.

## App Bridge Check

The course remains one of the strongest natural fits for future app bridging, but the bridge should stay restrained and review-focused.

Best future app surfaces:

- Execution Review for bid/ask, spread, slippage, order type, Level 2, time and sales.
- Risk Review for position size versus liquidity and slippage-expanded risk.
- Trade Review for volume, relative volume, unusual volume, scanner-driven entries, and volume fade.
- Analytics for comparing execution quality across liquidity, RVOL, spread, and order-type conditions.

No hard app route links were added during this pass.

## Deferred Items

These are useful later, but they do not block the course:

- A deeper `/academy/order-routing-and-best-execution/` lesson if the Academy later adds an advanced execution module.
- A future visual/UI note explaining that execution-review fields should capture intended price, actual fill, spread, order type, liquidity, and slippage.
- A later source audit of any new broker/platform-specific scanner claims if the website adds named tools or screenshots.

## Recommended Next Action

Next recommended audit:

```text
Pass 3: Accuracy/Source Audit for Risk Management And Trade Planning
```

Reason: that course includes stop-loss, mental versus hard stops, max loss, daily loss limits, risk/reward, holding through news, and overnight risk. The next source pass should verify order behavior, stop-order caveats, risk-control language, and any guarantee-sensitive claims.
