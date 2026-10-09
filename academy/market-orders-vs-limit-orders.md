---
title: "Market Orders And Limit Orders"
slug: "/academy/market-orders-vs-limit-orders/"
primary_keyword: "market orders vs limit orders"
secondary_keywords: ["market order", "limit order", "order types trading", "trade execution", "market order vs limit order"]
search_intent: "Learn the difference between market orders and limit orders, why order type matters, and how beginners can understand speed, price control, fills, and slippage."
status: "ready"
product_area: "Education"
availability: "educational"
content_type: "academy_lesson"
funnel_stage: "awareness"
priority: "3"
cta: "Learn how market orders and limit orders trade off execution speed, price control, missed fills, slippage, and real risk."
learning_track: "Trading Foundations"
academy_level: "Foundation"
academy_order: 5
academy_module: "Sessions And Orders"
academy_course: "Trading Foundations"
recommended_previous: "/academy/bid-and-ask/"
recommended_next: "/academy/day-trading-for-beginners/"
visual_assets: ["/academy/images/chart-reading/market-vs-limit-order-tradeoff.svg", "/academy/images/chart-reading/limit-order-no-fill-review.svg"]
internal_links: ["/academy/bid-and-ask/", "/academy/spread/", "/academy/liquidity/", "/academy/slippage/", "/academy/level-2/", "/academy/time-and-sales/", "/glossary/spread/", "/glossary/slippage/"]
schema: ["Article", "FAQPage"]
last_reviewed: "2026-05-19"
meta_title: "Market Orders Vs Limit Orders"
meta_description: "Learn the difference between market orders and limit orders, why order type affects execution, and how beginner traders review order choices."
---

# Market Orders And Limit Orders

An order tells the broker what you want to trade and the conditions under which it may trade. Market orders and limit orders differ in a central instruction: whether the order sets a maximum buying price or a minimum selling price.

A **market order** seeks immediate execution at available prices without setting that price limit. A **limit order** permits execution only at the limit price or better. Neither lets a trader choose both a guaranteed fill and an exact price.

## A Buy Limit And A Sell Limit

A buy limit at $10.04 allows purchases at $10.04 or lower. It does not allow a purchase at $10.05.

A sell limit at $10.00 allows sales at $10.00 or higher. It does not allow a sale at $9.99.

Those limits restrict execution prices. They do not guarantee that a suitable buyer or seller will be available for all the shares requested.

![Market Orders And Limit Orders](/academy/images/volume-liquidity-order-flow/market-orders-vs-limit-orders.svg)

## Compare Three Buy Orders

In this fictional market, the best bid is $10.00. Sellers display 200 shares at $10.02 and another 800 at $10.04. Assume the orders do not change, no other trader arrives first, and no other shares are available.

| Order for 1,000 shares | Result under these assumptions |
|---|---|
| Market buy | 200 shares fill at $10.02 and 800 at $10.04 |
| Buy limit at $10.02 | 200 shares fill; 800 do not fill immediately |
| Buy limit at $10.04 | 200 shares fill at $10.02 and 800 at $10.04 |

The $10.04 limit is **marketable**: its allowed price reaches available sellers. A limit order can therefore fill immediately. It is not always an order that waits below the market.

Now suppose the offers move to $10.08 before the incoming order arrives. The market order has no specified price cap. The $10.04 limit cannot buy at $10.08. Its price protection remains, but it may receive no fill.

## Partial Fills And Waiting Orders

A **partial fill** means only some requested shares have traded. In the $10.02 limit example, the trader bought 200 shares, not the intended 1,000.

What happens to the remaining shares depends on the order's duration and instructions. A day order generally expires at the end of that day's regular session rather than carrying into extended hours or the next day. An immediate-or-cancel instruction cancels whatever cannot fill immediately. Broker rules and available instructions differ.

A limit order waiting in the market may not fill just because a chart trades at its price. Other orders can be ahead of it, and the trade shown may occur on another venue. Confirm actual fills through the broker's order status.

## Exits Have The Same Tradeoff

An immediate sell seeks available bids; a sell limit refuses prices below its specified minimum. When bids fall rapidly, that restriction can leave the sell unfilled.

A stop order adds another step: reaching its trigger turns it into a market order. The stop price is not a guaranteed fill price. A stop-limit becomes a limit order when triggered and can remain unfilled if no buyer or seller meets its limit. Brokers can use different trigger rules, such as trades or quotes, so check how the chosen order works.

Before interpreting a result, distinguish the submitted order from what actually filled. Price, quantity and timing can differ from the original intention.

If a buy limit is above the ask, does it force the trader to pay the full limit? No. It allows fills at that limit or lower, so available lower-priced offers can fill first. The next execution topic, [Slippage](/academy/slippage/), compares actual fills with a clearly chosen reference price.
