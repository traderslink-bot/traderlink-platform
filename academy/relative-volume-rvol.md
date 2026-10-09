---
title: "Reading RVOL"
slug: "/academy/relative-volume-rvol/"
primary_keyword: "relative volume RVOL"
secondary_keywords:
  - "relative volume"
  - "RVOL stocks"
  - "high relative volume"
  - "volume scanner"
  - "RVOL meaning"
search_intent: "Learn what relative volume RVOL means, how scanner-style RVOL is calculated, why platforms can differ, and how to review high-RVOL trades."
status: "draft"
product_area: "Education"
availability: "educational"
content_type: "academy_lesson"
funnel_stage: "awareness"
priority: "3"
cta: "Trader Intelligence is being built to help traders review RVOL-driven trades, execution quality, catalyst context, and repeated decision patterns."
learning_track: "Volume, Liquidity And Order Flow"
academy_level: "Practical"
academy_order: 3
academy_module: "Volume Foundation"
academy_course: "Volume, Liquidity And Order Flow"
recommended_previous: "/academy/relative-volume/"
recommended_next: "/academy/volume-spike/"
visual_assets:
  - "/academy/images/volume-liquidity-order-flow/relative-volume-rvol.svg"
internal_links:
  - "/academy/volume/"
  - "/academy/relative-volume/"
  - "/academy/volume-spike/"
  - "/academy/premarket-high-low/"
  - "/academy/stock-catalysts/"
  - "/academy/liquidity/"
  - "/academy/spread/"
  - "/glossary/relative-volume/"
  - "/glossary/volume-spike/"
  - "/features/session-time-analysis/"
schema:
  - "Article"
  - "FAQPage"
last_reviewed: "2026-05-17"
meta_title: "Relative Volume RVOL Explained"
meta_description: "Learn what relative volume RVOL means, why scanner calculations differ, common RVOL mistakes, and how to review unusual-volume trades."
---

# Reading RVOL

RVOL is short for relative volume. On a scanner or chart, it is usually a number comparing current volume with an average from earlier periods.

The calculation is current volume divided by the chosen average volume. The important detail is what those two quantities include. If the comparison average is zero, the ratio cannot be calculated; a missing value does not mean ordinary activity.

## Read The Multiple

Suppose a stock has traded 300,000 shares from the regular-session open through 10:00 a.m. Its average volume over the same period in the selected earlier sessions is 100,000 shares.

300,000 ÷ 100,000 = **3.00x RVOL**.

It has traded three times the comparison average. A value of 1.00x means equal volume, and 0.50x means half as much. These numbers describe activity relative to that average, rather than a level of quality or safety.

![Reading RVOL](/academy/images/volume-liquidity-order-flow/relative-volume-rvol.svg)

## Cumulative Volume And Interval Volume

**Cumulative volume** adds together trading from a starting time to the current time. **Interval volume** measures trading in one period, such as a five-minute candle.

For example, a stock might trade 300,000 shares between the open and 10:00 a.m., against a 100,000-share average for that whole period. Its cumulative comparison is 3.00x.

But during just the final five-minute interval, it trades 20,000 shares against a 25,000-share average for the matching interval. That comparison is 0.80x.

Both calculations can be correct. The morning has been unusually active overall, while its latest five minutes have been quieter than their usual comparison. A high cumulative number can remain on the scanner after the busiest burst has ended.

## Why Two Tools Can Show Different Numbers

A scanner may compare today's volume with average full-day volume. Another may compare volume so far with the historical average by the same time of day. A chart indicator may compare one bar with recent bars instead.

Other differences include how many historical periods are used, whether extended hours are included, and which trades the market-data service supplies. These settings must match before two values can be compared directly.

An RVOL display may compare recent bars or matching times from earlier days. Check whether it uses one interval or cumulative volume from the start of the session.

Before interpreting a displayed RVOL value, identify its time period, historical average and included sessions. If those details are unknown, the number alone cannot explain how unusual the activity is.

## Use The Number With The Chart

A stock at 5.00x RVOL could be breaking above resistance, selling off after news, or moving sideways after an earlier burst. The number does not distinguish those situations.

Look at when the trading occurred and how price behaved during it. Then examine the current quote and available shares. Unusually high activity can coexist with a wide spread or limited depth.

There is no RVOL threshold that guarantees a worthwhile trade. Even a correctly calculated high value leaves price direction and future fills uncertain.

Try this question: a scanner shows 3.00x cumulative RVOL, but the latest candles have small volume bars. Is the scanner necessarily wrong? No. Earlier activity may account for most of the cumulative total. [Volume Spikes](/academy/volume-spike/) examines those short bursts more closely.
