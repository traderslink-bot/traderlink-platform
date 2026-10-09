---
title: "Dollar Volume"
slug: "/academy/dollar-volume/"
primary_keyword: "dollar volume"
secondary_keywords:
  - "stock dollar volume"
  - "trading volume value"
  - "liquidity dollar volume"
  - "share volume vs dollar volume"
  - "dollar volume trading"
search_intent: "Understand what dollar volume means, how traders calculate it, and why it matters for liquidity, slippage, position size, and trade review."
status: "draft"
product_area: "Education"
availability: "educational"
content_type: "academy_lesson"
funnel_stage: "awareness"
priority: "3"
cta: "Trader Intelligence is being built to help traders review dollar volume, liquidity context, execution quality, slippage, and repeated decision patterns."
learning_track: "Volume, Liquidity And Order Flow"
academy_level: "Practical"
academy_order: 6
academy_module: "Liquidity Foundation"
academy_course: "Volume, Liquidity And Order Flow"
recommended_previous: "/academy/liquidity/"
recommended_next: "/academy/spread/"
visual_assets:
  - "/academy/images/volume-liquidity-order-flow/dollar-volume.svg"
internal_links:
  - "/academy/volume/"
  - "/academy/relative-volume/"
  - "/academy/liquidity/"
  - "/academy/spread/"
  - "/academy/slippage/"
  - "/academy/low-float-stocks/"
  - "/academy/penny-stocks/"
  - "/glossary/liquidity/"
  - "/glossary/spread/"
  - "/features/execution-analysis/"
schema:
  - "Article"
  - "FAQPage"
last_reviewed: "2026-05-17"
meta_title: "Dollar Volume Explained For Traders"
meta_description: "Learn what dollar volume means, how to calculate it, and why traders use it to review liquidity, slippage risk, and position size."
---

# Dollar Volume

Dollar volume measures the value of shares traded during a period. It adds price to the share count, making it easier to compare trading activity in stocks with very different prices.

One million shares of a $0.50 stock represent a different traded value from one million shares of a $20.00 stock. Ordinary share volume does not show that difference.

## The Same Shares, Different Traded Value

For this example, assume every trade in each stock occurs at the stated price.

| Stock | Shares traded | Price per share | Dollar volume |
|---|---:|---:|---:|
| A | 1,000,000 | $0.50 | $500,000.00 |
| B | 1,000,000 | $20.00 | $20,000,000.00 |

Stock B's dollar volume is forty times Stock A's. The share counts are equal, but the total value changing hands is not.

Dollar volume counts the value of completed trading. It does not measure how much new money entered the company or how much participants still hold. Shares can trade repeatedly during the measured period.

When trade prices vary, multiplying total shares by the **share-weighted average trade price** gives the same dollar volume as adding every trade's value. That average gives greater weight to prices where more shares traded. It is different from the last trade price.

![Dollar Volume](/academy/images/volume-liquidity-order-flow/dollar-volume.svg)

## When Prices Change

For an exact traded value, multiply the price and shares in each execution, then add the results.

Suppose three trades occur:

| Trade | Shares | Price | Traded value |
|---|---:|---:|---:|
| 1 | 100 | $10.00 | $1,000.00 |
| 2 | 200 | $10.10 | $2,020.00 |
| 3 | 100 | $10.20 | $1,020.00 |
| Total | 400 | — | $4,040.00 |

Multiplying the last price, $10.20, by all 400 shares gives $4,080.00. That is an approximation, because not every share traded at the last price.

Some tools estimate dollar volume using a representative price rather than every execution. Check the tool's formula before treating its display as exact traded value. The difference can matter more when the stock's price varies substantially during the period.

## Keep The Time Window Consistent

A morning total and a full-day total cover different amounts of time. Comparing them without that distinction can make one stock appear less active simply because its measurement ended earlier.

Use matching sessions and periods when comparing stocks. Also check that dollar values use the same currency. A US-dollar traded value and a Canadian-dollar traded value are not directly interchangeable.

For a swing trader, completed daily totals can describe recent activity across sessions. They still do not show the current bid and ask or what will be available in the next session.

## Dollar Volume And Liquidity

Higher traded value can indicate substantial activity, but it does not guarantee a tight spread or enough shares for the next order. Much of a day's dollar volume might have occurred earlier, at different prices.

Suppose a stock has traded $20 million today but now shows only 100 shares at the best ask. The $20 million does not guarantee that a 5,000-share buy can fill at that ask. It describes completed trades, while the quote describes current displayed interest.

Dollar volume helps compare activity across stock prices. The next lesson, [Bid And Ask](/academy/bid-and-ask/), returns to the prices and shares available on the current quote.
