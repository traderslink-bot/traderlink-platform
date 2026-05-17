# TradersLink Academy Accuracy/Source Audit: Technical Indicators And Tools

Date: 2026-05-17

Audit pass: Pass 3 - Accuracy/Source Audit

Status: complete

## Scope

Reviewed the 12-lesson Technical Indicators And Tools course:

- `docs/content/drafts/learn/trading-indicators.md`
- `docs/content/drafts/learn/why-indicators-lag.md`
- `docs/content/drafts/learn/indicator-overload.md`
- `docs/content/drafts/learn/moving-averages.md`
- `docs/content/drafts/learn/vwap.md`
- `docs/content/drafts/learn/anchored-vwap.md`
- `docs/content/drafts/learn/rsi.md`
- `docs/content/drafts/learn/macd.md`
- `docs/content/drafts/learn/bollinger-bands.md`
- `docs/content/drafts/learn/atr.md`
- `docs/content/drafts/learn/volume-by-price.md`
- `docs/content/drafts/learn/chart-patterns/vwap-reclaim.md`

## Sources Used

Official regulator sources generally do not define technical-indicator formulas, so this pass used reputable technical-analysis and charting-platform references for formula and settings checks.

| Source | Used For |
|---|---|
| StockCharts ChartSchool, Moving Averages - Simple and Exponential | SMA/EMA definition, EMA recency weighting, data-history and setting caveats. |
| StockCharts ChartSchool, Volume-Weighted Average Price | VWAP calculation, intraday-session behavior, tick-versus-bar and lag caveats. |
| StockCharts ChartSchool, Anchored VWAP | Anchor-point behavior, traditional VWAP versus anchored VWAP, and anchor-selection caveats. |
| StockCharts ChartSchool, Relative Strength Index | Wilder RSI calculation, 0-100 scale, 14-period default, smoothing and platform-history caveats. |
| StockCharts ChartSchool, MACD | MACD line, signal line, histogram, common 12/26/9 settings, and moving-average lag. |
| StockCharts ChartSchool, Bollinger Bands | SMA middle band, standard-deviation bands, common 20/2 settings, and adjustable parameters. |
| StockCharts ChartSchool, Average True Range | Wilder ATR, true range, 14-period default, smoothing, absolute ATR, and non-directional volatility framing. |
| StockCharts ChartSchool, Volume-by-Price | Volume-by-price bins, displayed-period dependency, and chart-setting caveats. |
| Nasdaq glossary, VWAP | Basic VWAP acronym/definition cross-check. |

## Overall Verdict

Technical Indicators And Tools is accurate, conservative, and aligned with the Academy goal of teaching indicators as measurement and review tools rather than signal machines.

The course already avoids the biggest accuracy and safety problems:

- It does not claim indicators predict price.
- It does not present crosses, touches, reclaims, overbought readings, oversold readings, squeezes, or high ATR as buy/sell commands.
- It repeatedly connects indicators back to price structure, volume, liquidity, levels, risk, and completed-trade review.
- It keeps Trader Intelligence bridge language focused on post-trade review rather than prediction.

The main improvement was adding calculation and platform-variant guardrails to formula-sensitive lessons.

## Targeted Edits Completed

| Lesson | Edit |
|---|---|
| `/learn/moving-averages/` | Added source check for SMA/EMA basics, recency weighting, and setting/platform variation. |
| `/learn/vwap/` | Added source check for cumulative price-volume over cumulative volume and tick-versus-bar/session/extended-hours variation. |
| `/learn/anchored-vwap/` | Added source check explaining that anchored VWAP uses the VWAP idea from a user-selected bar, making anchor choice central. |
| `/learn/rsi/` | Added source check for Wilder RSI, 0-100 scale, 14-period default, overbought/oversold labels, and smoothing/platform variation. |
| `/learn/macd/` | Added source check for common 12/26/9 EMA construction and setting sensitivity. |
| `/learn/bollinger-bands/` | Added source check for SMA middle band, standard-deviation outer bands, common 20/2 default, and adjustable settings. |
| `/learn/atr/` | Added source check for true range, Wilder smoothing, non-directional volatility framing, and display variants. |
| `/learn/chart-patterns/vwap-reclaim/` | Added source check that a VWAP reclaim is price behavior around a platform-calculated VWAP reference, not an official market signal. |

No broad rewrite was needed.

## Source-Sensitive Findings

### Indicator Foundation

The foundation lessons are accurate. They define indicators as tools that transform price, volume, volatility, or time into visual references. They correctly emphasize that indicators use past or current data, can lag, can conflict, and can create process noise when stacked without a clear purpose.

No source correction was required.

### Moving Averages

The moving-average lesson is accurate. StockCharts supports the course's high-level distinction that SMA averages selected prices equally while EMA gives more weight to recent prices. The added source note clarifies that settings, price input, timeframe, data history, and platform calculation can affect exact values.

### VWAP And Anchored VWAP

The VWAP and anchored VWAP lessons are accurate. StockCharts describes VWAP as a volume weighted average price calculated from price-volume over cumulative volume, commonly as an intraday tool. It also documents that traditional VWAP and anchored VWAP differ mainly by the starting bar included in the calculation.

The added source notes clarify:

- VWAP can vary by tick data versus bar data.
- Session definitions and extended-hours inclusion can change the line.
- Anchored VWAP is only as meaningful as the chosen anchor.
- A VWAP reclaim is behavior around a charting reference, not an official signal.

### RSI

The RSI lesson is accurate. StockCharts supports RSI as Wilder's momentum oscillator normalized from 0 to 100, commonly using 14 periods with overbought/oversold context labels. The lesson correctly avoids saying overbought means sell or oversold means buy.

The added source note clarifies smoothing, lookback, and platform-history variation.

### MACD

The MACD lesson is accurate. StockCharts supports MACD as the relationship between moving averages, with common 12/26/9 EMA settings and a histogram that shows the difference between the MACD line and signal line.

The added source note clarifies that the defaults are common settings, not universal rules, and that changing settings changes sensitivity and lag.

### Bollinger Bands

The Bollinger Bands lesson is accurate. StockCharts supports the course's volatility-band framing, including the common 20-period SMA and 2-standard-deviation default. The lesson correctly avoids treating a band touch or squeeze as directional proof.

The added source note clarifies that settings can be adjusted and should not be treated as universal trading rules.

### ATR

The ATR lesson is accurate. StockCharts supports ATR as Wilder's volatility measure based on true range, including gaps from prior close. The lesson correctly states that ATR measures movement size rather than direction.

The added source note clarifies that ATR values can vary by timeframe, lookback, smoothing, data history, and whether a platform displays an absolute or percentage variant.

### Volume By Price

The cross-listed Volume By Price lesson remains accurate. StockCharts supports that volume-by-price displays depend on the chart period and bin/zone settings. The existing source check already covered platform-setting variation, so no further edit was required.

## App Bridge Check

The app bridge language remains restrained and review-focused.

Best future app surfaces:

- Trade Review for whether an indicator supported context or distracted from price/risk.
- Analytics for repeated indicator-related outcomes across completed trades.
- Execution Review for VWAP, spread, slippage, and late-entry review.
- Risk Review for ATR, volatility, size, stop distance, and overextension.
- Coaching for indicator overload, cherry-picking, chasing, and overconfidence.
- Playbook Builder for documenting which indicators belong in a specific setup review.

No hard app route links were added during this pass.

## Deferred Items

These are useful later, but they do not block the course:

- A visual batch for indicator overlays using realistic red/green candlesticks.
- A lesson on indicator settings and timeframes if users need more help comparing platform defaults.
- A lesson on using indicators with price levels if the UI later exposes tool stacks by course.
- A lesson on indicator backtesting versus live review if the Academy adds a broader evidence/review module.

## Recommended Next Action

Next recommended audit:

```text
Pass 3: Accuracy/Source Audit for Trading Styles And Playbooks
```

Reason: that course includes style definitions, day trading, swing trading, scalping, momentum trading, pullbacks and dip buys, news fade, sell-the-news, multi-day runners, breakouts, breakdowns, reclaims, gap fills, chasing, and playbook language. The next pass should verify style definitions, non-signal framing, account/risk caveats, day-trading rule references where relevant, and any guarantee-sensitive setup language.
