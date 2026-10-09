---
title: "Bid And Ask"
slug: "/academy/bid-and-ask/"
primary_keyword: "bid and ask"
secondary_keywords: ["bid price", "ask price", "bid ask spread", "stock quotes explained", "bid ask trading"]
search_intent: "Learn what bid and ask mean in stock trading, why quote behavior matters for execution, and how beginners can understand fills, spread, and last price."
status: "ready"
product_area: "Education"
availability: "educational"
content_type: "academy_lesson"
funnel_stage: "awareness"
priority: "3"
cta: "Learn how bid, ask, spread, and last price explain the real quote behind a stock before choosing an order type."
learning_track: "Trading Foundations"
academy_level: "Foundation"
academy_order: 4
academy_module: "Sessions And Orders"
academy_course: "Trading Foundations"
recommended_previous: "/academy/stock-market-sessions-and-order-flow-basics/"
recommended_next: "/academy/market-orders-vs-limit-orders/"
visual_assets: ["/academy/images/chart-reading/bid-ask-quote-mechanics.svg", "/academy/images/chart-reading/bid-ask-order-interaction-review.svg"]
internal_links: ["/academy/spread/", "/academy/liquidity/", "/academy/slippage/", "/academy/market-orders-vs-limit-orders/", "/academy/level-2/", "/glossary/spread/", "/glossary/liquidity/", "/glossary/slippage/"]
schema: ["Article", "FAQPage"]
last_reviewed: "2026-05-19"
meta_title: "Bid, Ask, Spread, And Last Price Basics"
meta_description: "Learn bid, ask, spread, and last price basics so beginner traders understand stock quotes, fills, execution, and why the last price is not always the available price."
---

# Bid And Ask

A stock quote contains more than the price of the last trade. It also shows the bid and ask: the prices where buyers and sellers are currently displaying orders.

The **best bid** is the highest displayed buying price in the quote. The **best ask** is the lowest displayed selling price. The difference between them is the **spread**.

These prices matter because a new order must meet someone willing to trade. The price on a chart is not a promise that someone will fill your order there.

## Read A Simple Quote

Here is an example with all sizes shown in shares:

| Quote field | Value | Meaning |
|---|---:|---|
| Best bid | $5.00 | Highest displayed buying price |
| Bid size | 800 shares | Shares displayed for purchase at that bid |
| Best ask | $5.04 | Lowest displayed selling price |
| Ask size | 300 shares | Shares displayed for sale at that ask |
| Last price | $5.02 | Price of the most recent completed trade |

The spread is $5.04 − $5.00 = $0.04. The last trade occurred between those quoted prices, but the current quote does not show an offer to sell at $5.02.

The last trade and quote may come from different moments. Quotes can also include orders from several venues, while an order book—a list of displayed bids and asks—might show only some of them. A trading venue is an exchange or another market where orders can meet.

![Bid And Ask](/academy/images/volume-liquidity-order-flow/bid-and-ask.svg)

## Buying And Selling Immediately

An order to buy immediately generally seeks available sellers near the ask. An order to sell immediately generally seeks available buyers near the bid. Actual fills depend on the order instructions, available shares and changes before execution.

Using the unchanged example quote, assume the displayed shares remain available and an immediate buy for 100 shares trades at $5.04. It costs $504.00 before fees.

An immediate sell of 100 shares at the unchanged $5.00 bid receives $500.00 before fees. The difference is $4.00. No change in the quoted prices was required for that loss: the trader bought at the ask and sold at the bid.

A trader can instead set a limit price. A buy limit sets the most the trader will pay, and a sell limit sets the least the trader will accept. The order may not fill if no suitable shares become available.

## Size Matters Alongside Price

The example shows only 300 shares at the best ask. A buy for 1,000 shares needs additional sellers for the remaining 700. They may be at other prices or on other venues, or new orders may arrive at the same price.

Displayed size can also disappear when an order is canceled or changed. Even a smaller order is not guaranteed the quote seen on the screen before submission.

Some platforms show size in lots rather than individual shares. Check the units before interpreting the quantity. Ten units on a display using 100-share lots would represent 1,000 shares.

## When Quotes Move

If sellers remove their $5.04 offers and the next ask is $5.08, an incoming buy may face that higher price. If buyers withdraw their $5.00 bids, an immediate sell may find only lower bids. Quotes can change with or without a trade at the old price.

A chart with last price $5.02 therefore does not answer where a new order will fill. The current bid, ask, available shares and order instructions answer different parts of that question.

To study the cost of crossing between those prices in more detail, continue to [Bid Ask Spread](/academy/spread/). For the mechanics of price restrictions, see [Market Orders And Limit Orders](/academy/market-orders-vs-limit-orders/).
