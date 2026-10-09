---
title: "Bid Ask Spread"
slug: "/academy/spread/"
primary_keyword: "bid ask spread"
secondary_keywords:
  - "stock spread"
  - "trading spread"
  - "wide spread stocks"
  - "bid ask difference"
  - "spread trading"
search_intent: "Learn what the bid ask spread is, why wide spreads affect execution, and how to review trades where spread changed the real risk."
status: "draft"
product_area: "Education"
availability: "educational"
content_type: "academy_lesson"
funnel_stage: "awareness"
priority: "3"
cta: "Trader Intelligence is being built to help traders review spread, execution quality, slippage, order type, and repeated decision patterns."
learning_track: "Volume, Liquidity And Order Flow"
academy_level: "Practical"
academy_order: 7
academy_module: "Liquidity Foundation"
academy_course: "Volume, Liquidity And Order Flow"
recommended_previous: "/academy/dollar-volume/"
recommended_next: "/academy/bid-and-ask/"
visual_assets:
  - "/academy/images/volume-liquidity-order-flow/spread.svg"
internal_links:
  - "/academy/liquidity/"
  - "/academy/dollar-volume/"
  - "/academy/bid-and-ask/"
  - "/academy/slippage/"
  - "/academy/market-orders-vs-limit-orders/"
  - "/glossary/spread/"
  - "/glossary/liquidity/"
  - "/glossary/slippage/"
  - "/features/execution-analysis/"
schema:
  - "Article"
  - "FAQPage"
last_reviewed: "2026-05-17"
meta_title: "Bid Ask Spread Explained"
meta_description: "Learn what the bid ask spread is, why wide spreads affect execution, common mistakes, and how traders review spread problems."
---

# Bid Ask Spread

The bid ask spread is the gap between the best displayed buying price and the best displayed selling price. It affects how much price must change before a position bought at the ask can be sold at the bid without a loss.

A narrow spread can make that gap smaller. A wide spread can make it large relative to the price movement a trader expects.

## Calculate The Gap

With a $5.00 bid and $5.04 ask, the spread is $0.04 per share.

To compare spreads across stock prices, express the gap as a percentage of a chosen reference price. Using the bid in this example:

$0.04 ÷ $5.00 × 100 = **0.80%**.

For a stock with a $50.00 bid and $50.04 ask, the same $0.04 gap is **0.08%** of the bid. The absolute gap is equal, but its size relative to the stock price differs.

Tools may use the midpoint—the price halfway between bid and ask—instead. Different reference prices can produce slightly different percentages. Check which reference the tool uses before comparing its number with another calculation.

![Bid Ask Spread](/academy/images/volume-liquidity-order-flow/spread.svg)

## Crossing The Spread

Consider a micro-cap stock with a $1.10 bid and $1.18 ask. Its spread is $0.08 per share, or approximately **7.27%** of the bid: $0.08 ÷ $1.10 × 100.

Suppose those quotes stay unchanged, with enough shares available for both trades. A trader buys 100 shares at the ask and immediately sells all 100 at the bid.

| Trade | Calculation | Value before fees |
|---|---|---:|
| Buy | 100 × $1.18 | $118.00 paid |
| Sell | 100 × $1.10 | $110.00 received |
| Difference | $110.00 − $118.00 | $8.00 loss |

The complete buy-and-sell sequence loses one full spread per share: $0.08 × 100 = $8.00 before fees. To recover the purchase cost by selling at the bid, the bid would need to reach the $1.18 entry price.

If the quote changes between entry and exit, the result changes too. Different fill prices, partial fills and fees also affect the final amount. The frozen quote makes the spread's contribution easy to see.

## A Rising Last Price May Not Be Enough

After that $1.18 purchase, suppose the most recent trade occurs at $1.20, but the best bid is still $1.10. A chart may show a higher last price, while selling immediately at the bid would still produce a loss.

The last trade reports what happened. The bid shows displayed buying interest now. For an exit, the available buying prices matter more than an isolated last price.

## Spread And Available Shares

A $0.01 spread with only 100 shares at the best price does not guarantee that 5,000 shares can trade within that gap. A larger order may need other price levels.

The spread can also widen when orders are removed. During premarket and after-hours trading, reduced interest can mean wider spreads or no quote at all.

There is no single spread suitable for every order size or trading plan. Compare the gap with the stock price, the intended size and the distance to the price where the trading idea would fail.

## Limits And The Spread

A limit order placed inside the spread may offer a better price than crossing to the other side. It can remain unfilled if nobody trades with it. Setting a price changes the order's instructions; it does not make that price available.

Does a $0.04 spread mean every buy always loses $0.04 immediately? No. The cost depends on where the order fills and the price available for a later sale. The example assumes buying at the ask and selling at an unchanged bid.

[Market Orders And Limit Orders](/academy/market-orders-vs-limit-orders/) explains those choices and their fill limitations.
