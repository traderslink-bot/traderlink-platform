# Watchlist Indicators Independent Reference QA — 2026-09-12

Status: **Independent-library parity passed for all nine tickers/four timeframes. External daily cross-check completed. Exact configured intraday-chart parity remains access/data-basis limited.** No new app defect established.

Controlling [plan](watchlist-deterministic-indicators-plan.md), [progress](watchlist-deterministic-indicators-progress.md), and [production QA](watchlist-indicators-production-qa-20260912.md).

## Safety and source

Owner authorized independent reference testing. Local parent: `e5c07d2fea1c853b1df381b2826aafd92b0fdda7`; previously tested production `f97ab1ceecf30c411d605f1dd5ed3af31246dead`. This run read retained Friday calculation snapshots, not new production refreshes. No DB writes, provider candle requests, AI/Discord calls, ticker activation, settings, deployments, local servers, dependency installation or broad builds/tests. Original owner browser tab untouched.

Two standalone scripts project only the nine retained market-calculation snapshots and stream them directly to the local checker: `export-watchlist-indicator-reference-inputs.cjs` and `verify-watchlist-indicator-reference.cjs`. No raw candles, credentials, database identities or draft analyses are committed.

## Independent implementation comparison

Reference: [technicalindicators](https://github.com/anandanand84/technicalindicators), pinned `technicalindicators@3.1.0/dist/index.js` from jsDelivr. SHA-256 asserted before execution:
`83890f53cc855c07e173e6ff27235e952e66d444dafa48b740fab8970092b059`.

The pure bundle has no imports; its context receives no filesystem/network/process/require. The checker imports no app engine functions.

- Exact retained seed history, timeframe and price basis used. All 36 snapshots have a null/zero initial checkpoint; nonzero would stop this checker rather than silently reseed.
- EMA9/20, RSI14 and ATR14 on 1m/5m/15m/Daily for TRUG, TNON, AENT, FTFT, FEIM, BDRX, SURG, SXTC, PCLA; plus nine VWAP values using the exact completed 1m extended-session candles/HLC3.
- **153/153 passed.** EMA/ATR/VWAP tolerance fixed at `1e-8`; largest observed difference `3.552713678800501e-15`.
- Library RSI explicitly rounds to two decimals; declared tolerance `0.005000001` RSI point. Largest difference `0.0048605174179101596`, inside rounding interval. App precision unchanged.
- Library flat-series RSI convention differs from the app's documented neutral-50 convention; no wholly flat tested series occurred. Existing zero/flat fixtures remain authoritative.

This proves independent implementation agreement on identical market inputs, not identical candles across external feeds.

## External daily cross-check

Public TradingView Technicals pages, **1 day selected**, after data loaded. Free source identified as NASDAQ by Cboe One; retained app Daily inputs are Yahoo-native. Compare numerical values only, not TradingView Buy/Sell/Neutral ratings.

| Symbol | App RSI14 | TradingView RSI14 | Absolute RSI difference | App EMA20 | TradingView EMA20 |
| --- | --- | --- | --- | --- | --- |
| TRUG | 48.424651 | 48.4417 | 0.017049 | 0.612973 | 0.6129 |
| TNON | 51.511211 | 51.51 | 0.001211 | 5.119428 | 5.12 |
| AENT | 68.098956 | 68.1 | 0.001044 | 5.490422 | 5.49 |
| FTFT | 48.953171 | 48.96 | 0.006829 | 2.513788 | 2.51 |
| FEIM | 71.585888 | 71.58 | 0.005888 | 66.107091 | 66.11 |
| BDRX | 54.962108 | 54.96 | 0.002108 | 1.055050 | 1.06 |
| SURG | 39.861609 | 39.8955 | 0.033891 | 0.190231 | 0.1902 |
| SXTC | 24.698530 | 24.79 | 0.091470 | 8.118233 | 8.12 |
| PCLA | 70.456717 | 70.46 | 0.003283 | 7.323205 | 7.32 |

Largest difference: **0.091470 RSI point** (SXTC), **$0.004950 EMA20**. No daily oversold/overbought or midpoint classification disagreement. These are observed cross-feed differences, not an invented exact-match threshold.

Sources observed around 4:25–4:30 PM ET September 12, for completed September 11 data:
[TRUG](https://www.tradingview.com/symbols/NASDAQ-TRUG/technicals/), [TNON](https://www.tradingview.com/symbols/NASDAQ-TNON/technicals/), [AENT](https://www.tradingview.com/symbols/NASDAQ-AENT/technicals/), [FTFT](https://www.tradingview.com/symbols/NASDAQ-FTFT/technicals/), [FEIM](https://www.tradingview.com/symbols/NASDAQ-FEIM/technicals/), [BDRX](https://www.tradingview.com/symbols/NASDAQ-BDRX/technicals/), [SURG](https://www.tradingview.com/symbols/NASDAQ-SURG/technicals/), [SXTC](https://www.tradingview.com/symbols/NASDAQ-SXTC/technicals/), [PCLA](https://www.tradingview.com/symbols/NASDAQ-PCLA/technicals/). Pages will change in later sessions.

## Intraday comparison limitation

TRUG Superchart opened, but adding built-in RSI showed a free-account requirement. No signup, purchase or access bypass attempted. Custom EMA9/20, ATR and session-VWAP settings therefore could not be matched interactively.

Public PCLA 5m summary: EMA20 **9.96**, RSI14 **54.00**. App extended-hours values through Friday 8 PM: EMA20 **8.571076**, RSI14 **54.089660**. These are not equivalent input/session comparisons.

A diagnostic using the same Moomoo history restricted to regular-session candles (312 bars, through Friday 4 PM) gave EMA20 **9.966572**, RSI14 **54.72**. The large EMA discrepancy nearly disappears. This supports a session/input-basis explanation, but does **not** establish the public summary's exact hidden configuration or fully explain the remaining 0.72 RSI difference. Do not claim exact external intraday parity.

TradingView documents potential Cboe/primary-feed and intraday/extended-hours differences:
[free US data](https://www.tradingview.com/support/solutions/43000473924-is-us-stock-market-data-free-by-default/),
[intraday differences](https://www.tradingview.com/support/solutions/43000710585-why-do-the-values-on-the-tradingview-intraday-charts-differ-from-other-sources/).

Formula/configuration references:
[EMA](https://www.tradingview.com/support/solutions/43000592270-exponential-moving-average/),
[RSI](https://www.tradingview.com/support/solutions/43000502338-relative-strength-index-rsi/),
[ATR](https://www.tradingview.com/support/solutions/43000501823-average-true-range-atr/),
[VWAP](https://www.tradingview.com/support/solutions/43000502018-volume-weighted-average-price-vwap/).
Exact VWAP chart parity needs matching 1m HLC3, extended-session anchor, volume coverage and adjustment basis; do not substitute regular-only or tick VWAP.

## Conclusion

No implementation discrepancy found in the 153 independent-library comparisons. All-nine daily external values closely agree without condition-classification disagreement. Help was reviewed; it already describes extended-session VWAP and timeframe conventions. No app or Help change warranted.

Exact configured intraday chart parity still needs logged-in reference access with matched session/feed/settings. Market-open new-candle/capacity behaviour and the full approve-to-Discord flow remain separate future acceptance checks.
