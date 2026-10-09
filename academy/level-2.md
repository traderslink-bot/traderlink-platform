---
title: "Level 2 And Market Depth"
slug: "/academy/level-2/"
primary_keyword: "Level 2 trading"
secondary_keywords:
  - "Level 2 order book"
  - "market depth"
  - "bid ask depth"
  - "order book trading"
  - "Level 2 quotes"
search_intent: "Learn what Level 2 trading means, what traders watch in the order book, and how to review visible depth, spread, liquidity, and execution context."
status: "draft"
product_area: "Education"
availability: "educational"
content_type: "academy_lesson"
funnel_stage: "awareness"
priority: "3"
cta: "Trader Intelligence is being built to help traders review Level 2 context, execution quality, slippage, liquidity, and repeated decision patterns."
learning_track: "Volume, Liquidity And Order Flow"
academy_level: "Practical"
academy_order: 11
academy_module: "Order Flow Tools"
academy_course: "Volume, Liquidity And Order Flow"
recommended_previous: "/academy/market-orders-vs-limit-orders/"
recommended_next: "/academy/time-and-sales/"
visual_assets:
  - "/academy/images/volume-liquidity-order-flow/level-2.svg"
internal_links:
  - "/academy/bid-and-ask/"
  - "/academy/spread/"
  - "/academy/liquidity/"
  - "/academy/slippage/"
  - "/academy/market-orders-vs-limit-orders/"
  - "/academy/time-and-sales/"
  - "/glossary/liquidity/"
  - "/glossary/spread/"
  - "/features/execution-analysis/"
schema:
  - "Article"
  - "FAQPage"
last_reviewed: "2026-05-17"
meta_title: "Level 2 Trading Explained"
meta_description: "Learn what Level 2 trading means, how traders read market depth, common mistakes, and how to review order book context."
---

# Level 2 And Market Depth

Level 2 is a common name for a screen that shows bids and asks in more detail than a basic stock quote. It helps show the prices where buyers and sellers have placed visible orders, and how many shares they are offering to trade.

The list of those bids and asks is called the order book. **Market depth** describes the displayed shares at the prices in that book. Orders can be added, changed, canceled or filled. **Order flow** includes those order changes and the trades that result when orders match.

Your screen shows only the information supplied by its market-data service. Start with the prices and share quantities before trying to interpret fast changes.

## Reading The Rows

Bids show prices where buyers have placed visible orders. Asks, also called offers, show prices where sellers have placed visible orders. The highest bid and lowest ask are the best displayed prices. Other rows show bids at lower prices and asks at higher prices.

Some screens add together the shares offered at the same price. Others show separate rows for different firms or trading venues. A venue is an exchange or another market where orders can meet. Also check the size units: some screens show shares, while others show lots. A label of 10 could mean 10 shares or, on a display using 100-share lots, 1,000 shares.

This example combines visible orders at each price on one fictional trading venue. All sizes are shown in shares.

| Bid size | Bid price | Ask price | Ask size |
|---:|---:|---:|---:|
| 1,000 | $10.00 | $10.02 | 500 |
| 2,000 | $9.99 | $10.04 | 1,500 |
| 3,000 | $9.98 | $10.06 | 2,000 |

The displayed spread is $0.02. Sellers offer 500 shares at $10.02 and another 1,500 at $10.04. These are the visible orders at this moment. They may change before an incoming order reaches them.

![Level 2 And Market Depth](/academy/images/volume-liquidity-order-flow/level-2.svg)

## Why An Order Can Fill At Several Prices

Suppose a market order to buy 1,000 shares reaches this venue. For this example, assume the displayed orders stay unchanged, no other buyers arrive first, and no additional shares are available.

The first 500 shares fill at $10.02. The other 500 fill at $10.04. The purchase costs $10,030.00 before fees:

- 500 × $10.02 = $5,010.00
- 500 × $10.04 = $5,020.00
- $10,030.00 ÷ 1,000 shares = $10.03 average fill price

The average fill price is above the initial best ask because only half the required shares are offered there. In live trading, the result can differ: orders change, the broker may send the order to other venues, and some available shares may not be displayed.

## Displayed Size Can Change Without A Trade

Return to the example's best bid: 1,000 shares at $10.00.

| Time | Shares displayed at $10.00 | Trades shown |
|---|---:|---|
| 10:00:00 | 1,000 | Starting quote |
| 10:00:01 | 700 | A 300-share trade at $10.00 is reported |
| 10:00:02 | 200 | No further trade at $10.00 appears in this example |

At 10:00:01, the displayed bid falls by 300 shares, and a 300-share trade appears at the same price. That trade may explain the decrease. Other orders could also have changed during that second, so the two observations do not prove that the trade was the only change.

At 10:00:02, another 500 shares disappear from the displayed bid, but no matching trade appears. Those orders may have been canceled or changed. If the trade record is incomplete or delayed, a trade could also be missing. A smaller displayed bid does not automatically mean those shares were sold.

The same caution applies to a large ask that stays visible while trades occur at that price. Sellers may be adding shares as others trade. Seeing that behavior does not reveal who is behind the orders or what they intend to do next. A disappearing order also does not, by itself, prove manipulation.

## What Your Screen Includes

Market-depth services differ in what they include. For example, Nasdaq TotalView shows displayed orders in the Nasdaq Market Center. Stocks listed on other exchanges can also trade there. That book still does not show every order on every market trading those stocks.

Check which markets your subscription includes, whether orders are grouped by price, how sizes are shown, and whether prices are delayed. Some orders are hidden rather than displayed. A firm or venue code on the screen does not identify the customer behind an order.

## Connect The Book To The Chart And Tape

The chart shows price movement and important levels. The order book shows visible bids and asks. **Time and sales**, often called the tape, lists reported completed trades, including their prices and share quantities.

Near resistance, the book might show sellers offering shares at several nearby prices. The tape can show trades occurring at those prices. The chart then shows whether price moves above resistance and stays there or falls back below it. A large ask does not guarantee rejection, and a growing bid does not guarantee a rise.

To study these changes later, save the relevant book and tape images with their times and market-data source. A chart alone cannot show which orders appeared or disappeared. Still images show individual moments; a recording can show changes between them.

Try this question: the displayed ask shrinks from 5,000 shares to 500. Did buyers necessarily purchase 4,500 shares?

No. The screen shows 4,500 fewer shares offered for sale. Those orders may have traded, been canceled or changed. Check time and sales for reported trades, remembering that its coverage and timing must match the book you are watching. The next lesson, [Time And Sales](/academy/time-and-sales/), explains how to read that trade list.
