---
title: "Position Sizing"
slug: "/academy/position-sizing/"
primary_keyword: "position sizing"
secondary_keywords: ["position sizing trading", "how to size a trade", "risk per trade", "day trading position size"]
search_intent: "Learn what position sizing is, why trade size matters, and how beginners can connect size to risk, stop distance, volatility, liquidity, and review."
status: "ready"
product_area: "Education"
availability: "educational"
content_type: "academy_lesson"
funnel_stage: "awareness"
priority: "4"
cta: "Learn how position sizing turns planned risk into real exposure, and why size should be based on risk distance instead of excitement or confidence alone."
recommended_previous: "/academy/risk-management/"
recommended_next: "/academy/stop-loss/"
academy_level: "Practical"
academy_order: 12
academy_module: "Risk And Review"
academy_course: "Trading Foundations"
learning_track: "Trading Foundations"
internal_links: ["/academy/risk-management/", "/academy/revenge-trading/", "/academy/overtrading/", "/academy/trade-review-and-improvement/"]
schema: ["Article"]
visual_assets: ["/academy/images/risk-management-trade-planning/position-sizing.svg"]
last_reviewed: "2026-10-08"
meta_title: "Position Sizing Explained for Traders"
meta_description: "Learn what position sizing means, why trade size matters, and how traders can review risk per trade, stop distance, liquidity, and sizing mistakes."
---

# Position Sizing

![Position Sizing diagram](/academy/images/risk-management-trade-planning/position-sizing.svg)

Position sizing determines how many shares to buy or sell. A long trade starts by buying shares and benefits if their price rises. For that trade, one way to calculate a proposed quantity is to divide a chosen price-risk budget by the distance between entry and planned stop.

## Calculate The Entry-To-Stop Distance

With entry at $5.00 and stop at $4.80, the distance is $0.20 per share. A chosen $50.00 price-risk budget allows 250 shares:

**$50.00 ÷ $0.20 = 250 shares.**

For this long-entry calculation, the planned loss exit must be below entry, giving a positive distance. If the prices are equal, there is no distance to divide by. If the intended sell exit is above entry, it is not a losing exit for this calculation. Choose a valid loss exit before using the formula.

The position value is 250 × $5.00 = $1,250.00. This calculation describes the price loss at the planned exit, before costs. It does not guarantee that an order fills at that exit.

## Round Whole Shares Down

If entry is $5.10 with the same $4.80 stop, the distance is $0.30. Dividing $50.00 by $0.30 gives 166.666… shares. For a whole-share order, round down to 166 shares.

166 × $0.30 = $49.80 of planned price risk. Rounding up to 167 would produce $50.10, exceeding the stated budget. The 166-share position costs $846.60 at $5.10.

| Entry | Stop | Distance | Whole shares | Planned price risk |
|---|---|---|---|---|
| $5.00 | $4.80 | $0.20 | 250 | $50.00 |
| $5.10 | $4.80 | $0.30 | 166 | $49.80 |

The $50.00 budget is a teaching value. A suitable budget depends on the trader's circumstances; it is not a universal recommendation.

## Include Estimated Costs In A Total-Loss Budget

A price-risk budget excludes costs. If the trader instead chooses a $50.00 total planned-loss budget and estimates $4.00 of entry and exit fees combined, only $46.00 remains for the price move. At a $0.20 distance, $46.00 ÷ $0.20 = 230 shares. A fill at the intended exit would lose $46.00 in price plus the estimated $4.00 in fees.

The fee estimate must match the proposed quantity and order method. If fees vary with quantity, recalculate the estimate for the resulting order. A worse fill or different charges can still exceed the budget. Do not treat this calculation as an assured maximum loss.

Now complete the sizing check: establish the entry and reasoned exit, calculate their distance, divide the chosen allowance, round whole shares down, then check capital and combined open exposure. Check available depth too: depth is the quantity offered for trading at quoted prices, and it can change before your order reaches it. If these checks require a smaller order, use that smaller quantity or pass. After a fill, verify the actual quantity and entry rather than relying on the requested size.

## Check Capital, Liquidity And Other Open Positions

The proposed quantity must also fit available capital, liquidity and other open exposure. A tight stop can produce a large calculated quantity even when the stock has too little depth for that order. Do not move the stop closer merely to obtain more shares; the stop should reflect the trade's reasoning and execution plan.

Overnight gaps can produce losses beyond the planned distance even when the quantity fits both the price-risk and capital limits.

If adding shares later, calculate the risk of the entire position using each entry price and the current planned exit. The original quantity calculation does not automatically cover the addition.

## Work Back From A Capital Constraint

The risk formula produces a proposed quantity; available capital can impose a smaller one. Suppose the same $5.00 entry and $4.80 stop give 250 shares under the $50.00 risk budget, but the trader has chosen to commit no more than $1,000.00 to this position.

At $5.00, $1,000.00 permits 200 shares before costs. Those shares have $40.00 of planned price risk at $4.80. The trader does not need to use all of the risk budget. Risk and position-value limits can both apply, with the smaller permitted quantity determining the order.

## Check A Short Position In The Opposite Direction

A short sale opens a position by selling borrowed shares, with an intention to buy them back. Its adverse price movement is upward. For a short entry at $5.00 and planned buy-to-cover exit at $5.20, the risk distance is still $0.20, but it is calculated as exit minus entry.

A 250-share short position therefore has $50.00 of planned price risk at that exit, before costs. A cover at $5.30 instead loses $75.00. Borrow availability, borrow charges, broker margin requirements and other short-sale conditions need separate consideration. The long-trade formula's price direction must not be copied unchanged, and an intended stop does not cap all possible short losses.

When reviewing a size calculation, record the side of the trade, intended prices, proposed quantity and actual filled quantity. An order can fill only part of the intended size.
