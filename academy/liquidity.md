---
title: "Stock Liquidity"
slug: "/academy/liquidity/"
primary_keyword: "stock liquidity"
secondary_keywords:
  - "liquidity in stocks"
  - "trading liquidity"
  - "liquid stocks"
  - "thinly traded stocks"
  - "liquidity trading"
search_intent: "Learn what stock liquidity means, why it affects execution, and how to review trades where spread, depth, volume, or slippage changed the result."
status: "draft"
product_area: "Education"
availability: "educational"
content_type: "academy_lesson"
funnel_stage: "awareness"
priority: "3"
cta: "Trader Intelligence is being built to help traders review liquidity, execution quality, slippage, order type, and repeated trade-management patterns."
learning_track: "Volume, Liquidity And Order Flow"
academy_level: "Foundation"
academy_order: 5
academy_module: "Liquidity Foundation"
academy_course: "Volume, Liquidity And Order Flow"
recommended_previous: "/academy/volume-spike/"
recommended_next: "/academy/dollar-volume/"
visual_assets:
  - "/academy/images/volume-liquidity-order-flow/liquidity.svg"
internal_links:
  - "/academy/volume/"
  - "/academy/volume-spike/"
  - "/academy/dollar-volume/"
  - "/academy/spread/"
  - "/academy/bid-and-ask/"
  - "/academy/slippage/"
  - "/academy/market-orders-vs-limit-orders/"
  - "/glossary/liquidity/"
  - "/glossary/spread/"
  - "/glossary/slippage/"
  - "/features/execution-analysis/"
schema:
  - "Article"
  - "FAQPage"
last_reviewed: "2026-05-17"
meta_title: "Stock Liquidity Explained for Traders"
meta_description: "Learn what stock liquidity means, how it affects fills, spreads, slippage, order size, and how traders review liquidity problems."
---

# Stock Liquidity

Stock liquidity describes how easily shares can be bought or sold without substantially changing the price.

For a trader, the practical question is whether enough shares are available near the current price to fill the order.

A chart can show a steady price move while a wide spread or limited available shares makes buying and selling difficult. A stock may have traded millions of shares earlier but have very few shares available near its current price. That difference matters when entering or closing a position.

## Volume, Liquidity And Volatility

These terms describe different things.

| Term | What it describes |
|---|---|
| Volume | Shares that traded during a period |
| Liquidity | How easily shares can be bought or sold without substantially changing the price |
| Volatility | How much price varies over a period |

An active, volatile stock can have a tight spread and many shares available near the current price. Another can have a wide spread and only a few shares available at each price. Both are moving, but buying and selling the same quantity may be easier in one than the other.

Volume shows how many shares have already traded. It does not show how many are available for your next order.

![Stock Liquidity](/academy/images/volume-liquidity-order-flow/liquidity.svg)

## Spread And Depth

Two visible clues are the spread and displayed depth.

The **spread** is the difference between the best bid and best ask. **Market depth** shows the number of shares offered for purchase or sale at the prices included on your screen. Someone selling immediately generally trades with buyers on the bid side; someone buying immediately generally trades with sellers on the ask side.

A tight spread does not guarantee that a large order will fill near the quoted price. There may be only a few shares at that price. The order book—the list of displayed bids and asks—may show more shares at nearby prices. Those orders can change before yours arrives, and your screen may not include every market trading the stock.

## Two Stocks With The Same Volume

In this example, two stocks have each traded 1 million shares today. Their current quotes show:

| Quote detail | Stock A | Stock B |
|---|---:|---:|
| Best bid | $20.00 | $20.00 |
| Displayed shares at best bid | 5,000 | 100 |
| Best ask | $20.02 | $20.20 |
| Displayed shares at best ask | 5,000 | 100 |
| Spread | $0.02 | $0.20 |

Stock A has a narrower spread and more shares displayed at the best bid and ask. Stock B has a wider spread and fewer shares at those prices, even though both stocks have traded the same number of shares today.

Suppose a trader wants to buy 1,000 shares. Stock A shows enough shares at its best ask to cover the order. Stock B shows only 100 there, so the remaining 900 would need other sellers. They might offer shares at higher prices, add shares at the same price, or be available on another exchange or trading venue. The quote alone cannot tell the trader where the entire order will fill.

Both stocks have the same day's volume, but different conditions for the next order. Last price is also insufficient: it is the price of the most recent completed trade, and shares may no longer be available there.

## Order Size Matters

An order for 100 shares may fill at one price, while an order for 10,000 shares may need shares at several prices.

If an order buys all the available shares at one price, the rest may fill at higher prices. A sell order may similarly fill against bids at progressively lower prices. Whether that happens depends on the order's price limits and the shares available when it arrives.

A limit order sets the highest price allowed for a buy or the lowest price allowed for a sell. It does not guarantee that all the requested shares will fill. A market order does not set that price limit. The later lessons on orders and slippage examine those differences in detail.

## Conditions Can Change Between Entry And Exit

Liquidity is a changing condition, not a permanent label attached to a ticker.

During premarket and after-hours trading, fewer buyers and sellers can mean wider spreads and fewer shares available near the current price. News can also rapidly change prices and quotes.

A stock might trade heavily just after news and have fewer shares available later. An easy entry does not guarantee an easy exit. For a swing trade, the shares displayed today do not show what will be available in the next session.

## Checking Liquidity

Check the spread, the shares displayed near the current price, and the size of the order. Watch whether the spread widens or displayed shares disappear. Remember that the screen shows only the markets included in your data subscription.

When studying a past trade, a chart and fill prices do not show the exact spread or available shares at the time. A saved quote or order-book image can help, although a still image will miss changes between moments.

Consider this question: a stock traded 20 million shares this morning, but now shows a wide spread and only 100 shares at the best bid. Does that morning volume guarantee that a 5,000-share sell will fill near the current bid?

No. Only 100 shares are currently displayed at that bid. The rest of the order needs other buyers, whose prices and available shares may differ. Earlier volume does not guarantee a fill for the next order.
