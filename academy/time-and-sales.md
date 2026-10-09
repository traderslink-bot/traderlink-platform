---
title: "Time And Sales"
slug: "/academy/time-and-sales/"
primary_keyword: "time and sales"
secondary_keywords:
  - "tape reading"
  - "stock prints"
  - "trading tape"
  - "executed trades"
  - "time and sales trading"
search_intent: "Learn what time and sales means, why traders watch actual prints, and how to review tape-reading context without overreacting to every trade."
status: "draft"
product_area: "Education"
availability: "educational"
content_type: "academy_lesson"
funnel_stage: "awareness"
priority: "3"
cta: "Trader Intelligence is being built to help traders review tape context, execution quality, liquidity, and repeated decision patterns."
learning_track: "Volume, Liquidity And Order Flow"
academy_level: "Practical"
academy_order: 12
academy_module: "Order Flow Tools"
academy_course: "Volume, Liquidity And Order Flow"
recommended_previous: "/academy/level-2/"
recommended_next: "/academy/volume-by-price/"
visual_assets:
  - "/academy/images/volume-liquidity-order-flow/time-and-sales.svg"
internal_links:
  - "/academy/level-2/"
  - "/academy/bid-and-ask/"
  - "/academy/volume/"
  - "/academy/liquidity/"
  - "/academy/slippage/"
  - "/academy/volume-by-price/"
  - "/glossary/liquidity/"
  - "/glossary/spread/"
  - "/features/execution-analysis/"
schema:
  - "Article"
  - "FAQPage"
last_reviewed: "2026-05-17"
meta_title: "Time and Sales Explained"
meta_description: "Learn what time and sales means, how traders read actual prints, common tape-reading mistakes, and how to review executions."
---

# Time And Sales

Time and sales is a list of reported completed trades. Traders often call it the tape, and an individual reported trade a print.

While an order book shows visible bids and asks, the tape shows shares that have traded. Together they help distinguish displayed orders from completed transactions.

## Read A Trade Row

A typical row includes time, trade price and share quantity. Some platforms also show the reporting venue and trade conditions. **Trade conditions** are labels describing features of a report, such as a late report or a trade linked to an auction. Their meanings depend on the data service.

Check whether the timestamp describes the trade time or reporting time, whether size is in shares or lots, and whether filters hide smaller trades. Some displays combine reports rather than presenting every execution as a separate row.

![Time And Sales](/academy/images/volume-liquidity-order-flow/time-and-sales.svg)

## Compare Prints With The Quote At The Time

In this simplified example, each quote is the one available immediately before its matching trade. All sizes are actual shares.

| Time | Bid | Ask | Trade price | Shares traded |
|---|---:|---:|---:|---:|
| 10:15:00 | $10.00 | $10.02 | $10.02 | 200 |
| 10:15:01 | $10.01 | $10.03 | $10.03 | 300 |
| 10:15:02 | $10.01 | $10.03 | $10.01 | 100 |

The first two trades occur at their respective asks. The third occurs at its bid. The three reports total 600 shares.

An ask-side print can be consistent with an incoming buyer accepting an available offer. A bid-side print can be consistent with an incoming seller accepting a bid. Each trade still has both a buyer and seller. The comparison does not reveal their identities, positions or intentions.

After two trades at the ask, the next trade occurs at the bid. The first two rows therefore do not imply that later trades must continue at higher prices.

## Colors Are Display Rules

Some platforms color prints according to their position relative to the bid and ask; others use price changes or custom settings. Check the platform's explanation before interpreting a color.

Green does not universally mean a new long position, and red does not universally mean a new short position. A trade could open or close either side's position, which the tape does not disclose.

When quotes change quickly, a later screen image may show a different bid and ask from those available when the trade occurred. Comparing a past print with the current quote can therefore misclassify it.

## Speed And Quantity

A faster tape means more reports are appearing, but their share quantities still matter. Twenty reports of 100 shares total 2,000 shares. Two reports of 5,000 total 10,000. More rows do not necessarily mean more volume.

Reporting delays, combined reports and display filters can also change how fast the tape looks. Read reported shares and price movement alongside the pace.

## Use The Chart For Location

Near resistance, repeated trades at rising prices show completed trading toward that area. The chart then shows whether price clears the level and remains above it or falls back below. Prints do not guarantee the next outcome.

For a swing trader, a brief intraday tape sequence is only a small part of the day's trading. It should not be treated as a complete explanation of a multi-day position.

If a 5,000-share print appears, does it prove that one institution just opened a position? No. The report gives quantity and price, not the customer's identity or whether the trade opened or closed a position. [Volume By Price](/academy/volume-by-price/) next organizes historical activity across price areas.
