---
title: "Slippage"
slug: "/academy/slippage/"
primary_keyword: "trading slippage"
secondary_keywords:
  - "stock slippage"
  - "slippage in trading"
  - "execution slippage"
  - "order fill slippage"
  - "slippage trading"
search_intent: "Learn what trading slippage means, why fill prices can be worse than expected, and how traders review spread, liquidity, order type, and execution mistakes."
status: "draft"
product_area: "Education"
availability: "educational"
content_type: "academy_lesson"
funnel_stage: "awareness"
priority: "3"
cta: "Trader Intelligence is being built to help traders review slippage, execution quality, order type, liquidity, and repeated decision patterns."
learning_track: "Volume, Liquidity And Order Flow"
academy_level: "Practical"
academy_order: 9
academy_module: "Quotes And Execution"
academy_course: "Volume, Liquidity And Order Flow"
recommended_previous: "/academy/bid-and-ask/"
recommended_next: "/academy/market-orders-vs-limit-orders/"
visual_assets:
  - "/academy/images/volume-liquidity-order-flow/slippage.svg"
internal_links:
  - "/academy/bid-and-ask/"
  - "/academy/spread/"
  - "/academy/liquidity/"
  - "/academy/market-orders-vs-limit-orders/"
  - "/academy/volume-spike/"
  - "/glossary/slippage/"
  - "/glossary/spread/"
  - "/glossary/liquidity/"
  - "/features/execution-analysis/"
schema:
  - "Article"
  - "FAQPage"
last_reviewed: "2026-05-17"
meta_title: "Trading Slippage Explained"
meta_description: "Learn what trading slippage is, why fill prices can be worse than expected, and how traders review execution mistakes."
---

# Slippage

Slippage is the difference between a trade's actual fill price and a chosen expected or reference price. Its amount depends on which price is used for the comparison.

A chart level, the last trade, the quote seen before submitting an order and a stop trigger can all differ. Comparing a fill with each of them answers a different question.

## Start With The Reference Price

Suppose a trader sees a $10.00 ask and submits a market buy for 1,000 shares, expecting that price. Before the order finishes, it fills in two parts:

| Fill | Shares | Price | Cost before fees |
|---|---:|---:|---:|
| 1 | 500 | $10.02 | $5,010.00 |
| 2 | 500 | $10.04 | $5,020.00 |
| Total | 1,000 | — | $10,030.00 |

The average fill is $10,030.00 ÷ 1,000 = $10.03. Compared with the $10.00 ask seen before submission, the trader pays $0.03 more per share: **$30.00 unfavorable slippage** across the order.

An **average fill price** is total traded value divided by total filled shares. When fill quantities differ, weight each price by its quantity. Simply averaging the prices would give the smaller fill too much influence.

For example, 100 shares at $10.00 and 300 at $10.04 cost $4,012.00 in total. Dividing by 400 gives $10.03, rather than the $10.02 obtained by averaging the two prices equally.

![Slippage](/academy/images/volume-liquidity-order-flow/slippage.svg)

## Favorable And Unfavorable

For a buy, a higher fill than the reference is unfavorable and a lower fill is favorable. For a sell, those directions reverse: receiving less is unfavorable and receiving more is favorable.

A 1,000-share buy expected at $10.00 but filled at $9.98 receives $20.00 favorable slippage. A 1,000-share sell expected at $10.00 but filled at $9.98 receives $20.00 unfavorable slippage.

These comparisons exclude fees. They describe the execution price difference, not the entire profit or loss on the position.

## Spread Is A Different Measurement

Suppose the quote is $9.98 bid and $10.00 ask. A buy that fills at the unchanged $10.00 ask has no slippage relative to that ask. The $0.02 spread still exists.

Comparing the same buy with the $9.98 bid gives a $0.02 difference. That is the spread in this example, rather than an extra $0.02 of slippage beyond the ask.

## Why Fills Differ

Quotes can change while the order travels to the market. The requested quantity may exceed the shares available at one price. A broker may also route the order across several venues. These conditions can produce several fills or a different price from the one first seen on the screen.

A buy limit caps the allowed purchase price, but it cannot guarantee a fill at the original expected price. The limit may allow a higher price than that expectation, or the order may remain unfilled. A stop order can also fill beyond its trigger after becoming a market order.

When studying a completed order, keep its direction, reference price, filled quantity and individual fills together. Fill prices alone do not show which bids and asks changed before the order arrived.

If a buy fills at the expected ask but above the last trade, is that automatically slippage relative to the ask? No. The two comparisons use different prices. Next, [Level 2 And Market Depth](/academy/level-2/) shows how displayed orders help explain multi-price fills.
