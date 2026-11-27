# Shared chart indicator catalog

November 26, 2026. The shared chart now offers 65 additional candle-based studies and retains the original six. The purpose is catalog breadth with quick access to the studies low-float day traders use most often.

- **Moving averages** include WMA, Hull, VWMA, Double EMA, Triple EMA, RMA, ALMA, KAMA, LSMA, McGinley Dynamic, MA Ribbon and MA Cross.
- **Volume** includes Anchored VWAP from the visible range start, Relative Volume, Elder Force Index, Ease of Movement, OBV, Accumulation/Distribution, Chaikin Money Flow, Chaikin Oscillator, Money Flow Index, Price Volume Trend, Volume Oscillator, Net Volume and Klinger. The built-in Volume pane remains available in Chart settings.
- **Volatility** includes Keltner, Donchian, Moving Average Envelope, ATR, standard deviation, historical volatility, Bollinger BandWidth, Bollinger %B and Ulcer Index.
- **Trend** includes prior-bar Price Channel, Parabolic SAR, Supertrend, Chandelier Exit, DMI and ADX, Aroon, Aroon Oscillator, Vortex, Choppiness and Mass Index.
- **Oscillators** include Stochastic, Stochastic RSI, CCI, Williams %R, Momentum, Rate of Change, Awesome, Ultimate, TRIX, True Strength, Detrended Price, Coppock, Know Sure Thing, Chande Momentum, Relative Vigor, Fisher, Schaff Trend Cycle, SMI Ergodic, Connors RSI, Balance of Power and Bull Bear Power.

The catalog keeps saved indicator IDs and extends the existing preference schema with optional favorites. The existing panel and shared canvas own all rendering and controls. Heavy or unbounded lengths are avoided in the few calculations that scan each rolling window. Multi-line studies calculate once per candle snapshot. Historical volatility reports per-bar percentages intraday and annualized percentages from daily or longer periods. A rolling Relative Volume average excludes the live bar and uses the displayed session's emitted bars. Sparse inputs keep their actual candle timestamps.

The follow-up completed Williams Alligator, Ichimoku Cloud, Linear Regression Channel, Zig Zag, Standard Pivot Points, Visible Range Volume Profile and Session Volume Profile. Shared Charts now has 78 catalog entries. The existing Volume pane is controlled from Chart settings.

## Verification

Focused checks cover all added studies on a repeatable sparse, sub-dollar history, stable plot metadata, prefix independence, finite values, persisted presets and favorites, and hand-checked values for several core studies. The isolated browser fixture uses recorded November 19 VIVS SIP candles and the real shared chart renderer. Hosted deployment, private app sign-in, and physical phone testing are separate from this local checkpoint.

The 275-test focused cohort passed with scoped TypeScript and lint. The two UI control tests, editor TypeScript and editor lint passed again after widening the picker. The recorded VIVS browser fixture passed on desktop Chromium and iPhone and Android emulation in dark and light themes. It exercised searching RVOL, adding RVOL, Hull MA and range VWAP, separate panes and their readouts, saving a favorite without re-creating the chart, hiding values, reloading, re-anchoring VWAP across a sparse period, and removing a study. The drawer closes without showing Chart settings during its exit.

[Browser results](/home/traderlink/preview-runtime/shared-chart-indicator-catalog.8wqqdR/verify-final.log) · [iPhone indicator picker](/home/traderlink/preview-runtime/shared-chart-indicator-catalog.8wqqdR/iphone-catalog.png) · [iPhone chart with studies](/home/traderlink/preview-runtime/shared-chart-indicator-catalog.8wqqdR/iphone-studies.png)


## Final seven indicators

- **Williams Alligator** uses smoothed median prices and the standard 8, 5 and 3 slot displacements. **Ichimoku Cloud** uses 9, 26 and 52 periods by default with a 26-slot displacement, two color fills, and a lagging close line. Both use chart time positions for offsets, with verified exchange sessions for any future time positions.
- **Linear Regression Channel** fits the last 100 observed candles by default and plots regression residual bands. **Zig Zag** defaults to a 5% reversal and 10 pivot legs. The last endpoint can extend. Completed candles confirm the right leg.
- **Standard Pivot Points** use previous completed market periods. Intraday reads prior Daily regular-session OHLC, Daily and Weekly use the prior month, and Monthly and Yearly use the prior year. Missing source facts leave gaps. Pivot, R1–R3, and S1–S3 display by default. R4, R5, S4, and S5 are available in Style. Both pivot and regression lines leave candle autoscaling to the chart. A nonpositive regression band is omitted on a logarithmic price scale.
- **Visible Range Volume Profile** follows pan and zoom. **Session Volume Profile** follows the trading date intraday, the month on Daily, or the calendar period on higher frames. Profiles estimate volume distribution over each source candle's range, default to 24 price rows and a 70% value area, and show POC, VAH and VAL. The chart uses minute source candles intraday and Daily source candles on higher frames, and withholds windows that start before established source coverage. The supplemental overnight feed is outside this volume estimate.

The 318-test regression set passed alongside scoped TypeScript and lint. Browser QA used 1,030 captured split-adjusted Alpaca SIP VIVS minute candles through November 19 and 224 retained Alpaca SIP SAFX Daily candles. VIVS intraday pivot transport used real regular-session minute aggregates as its Daily fixture. SAFX prior-month pivot matched the actual archived October Daily high, low and closing price. Browser checks verified all seven on desktop Chromium and iPhone 14 and Pixel 7 emulation, with no live ticks. Both profile totals matched the source candle volume, including after panning. The SAFX logarithmic price scale kept the low-priced candles in view after excluding the nonpositive regression band.

[Numerical and browser receipts](/home/traderlink/preview-runtime/shared-chart-seven-indicators.ls1lBt/final-qualification.log) · [iPhone VIVS](/home/traderlink/preview-runtime/shared-chart-seven-indicators.ls1lBt/iphone-vivs.png) · [Android SAFX](/home/traderlink/preview-runtime/shared-chart-seven-indicators.ls1lBt/android-safx.png)

## Full catalog retest

The numerical audit covered all 78 entries on 1,987 recorded VIVS one-minute candles and 224 recorded SAFX Daily candles from the split-adjusted Alpaca SIP feed. Independent calculations compared each study's initialized values and timestamps. The volume and trend comparisons included 114,009 plotted values and seven profile windows. Additional inputs covered flat prices, sparse sessions, zero and fractional volume, reversals, and changes between low and high volatility. [Volume and trend comparison](/home/traderlink/preview-runtime/shared-charts-all-78.QAEXUR/volume-trend/reference-receipt.log)

- Hull MA now truncates the square-root smoothing length. Volume-weighted averages discard expired weights, including fractional weights. Historical Volatility and Ulcer Index return zero for the tested constant-return and zero-drawdown windows.
- CCI, RVI, Stochastic RSI and Schaff Trend Cycle handle flat windows. Fisher Transform uses its saturation limit. SMI Ergodic Oscillator plots the difference between its smoothed momentum ratio and its signal. Awesome Oscillator colors follow the change from the previous bar across both sides of zero. The Style swatches show the same colors as the histogram.
- The readout and scale for price-based studies follow the candle's precision. Small EMV and ratio readings retain four decimals. Volume counts retain whole-number readouts and compact axis labels.
- Visible Range and Session Volume Profile use the provider's covered time interval, so a late first print can still contribute to a fully covered session. Both display the point of control and the upper and lower value-area prices in the chart legend. The session readout follows the hovered candle and returns to the rightmost session in view when the crosshair leaves.

The exact candidate passed 587 regression tests in 30 files. Scoped TypeScript passed for 22 files. ESLint reported zero errors and one existing unused drawing-toolbar variable. The earlier working-tree run passed 644 tests, including unrelated changes in that checkout. [Exact regression results](/home/traderlink/preview-runtime/shared-charts-all-78.QAEXUR/vitest-release-source.log) · [TypeScript](/home/traderlink/preview-runtime/shared-charts-all-78.QAEXUR/typescript.log) · [ESLint](/home/traderlink/preview-runtime/shared-charts-all-78.QAEXUR/eslint.log)

All 78 studies passed their add, edit, placement, favorites, visibility, reload, and removal checks on desktop Chromium, Pixel 7 Chromium emulation and iPhone 14 WebKit emulation. The separate Trading Workspace card rendered all 31 price overlays and 47 lower-pane studies. The three Market Charts device profiles agreed on the plotted series, point counts and last values for all 75 viewport-independent studies. [Full results by indicator](/home/traderlink/preview-runtime/shared-charts-all-78.QAEXUR/verification.json) · [Browser versions and device profiles](/home/traderlink/preview-runtime/shared-charts-all-78.QAEXUR/browser-environments.json)

Both volume profile legends show all three four-decimal prices at the tested phone widths. On SAFX Daily, moving the crosshair to February 27 showed a point of control of $0.1738 and value-area bounds of $0.1561–$0.2118. Moving off the chart restored $0.0691 and $0.0457–$0.0924 for the most recent month. The standard Volume pane matched 923 VIVS minute bars totaling 816,458,833 shares. [Crosshair replay](/home/traderlink/preview-runtime/shared-charts-all-78.QAEXUR/mobile-final/real-session-hover.log) · [Volume and persistence](/home/traderlink/preview-runtime/shared-charts-all-78.QAEXUR/profile-and-persistence.log) · [iPhone volume profile](/home/traderlink/preview-runtime/shared-charts-all-78.QAEXUR/final/iphone-VisibleVolumeProfile.png) · [Android volume profile](/home/traderlink/preview-runtime/shared-charts-all-78.QAEXUR/final/android-VisibleVolumeProfile.png)

The replay ran against the actual chart components with recorded candles and isolated preferences. The phone checks used touch emulation. Android swipes reached the last Ichimoku, MA Ribbon and MACD values and returned to the first without moving the chart. In the iPhone WebKit emulator, horizontal scroll input reached every value. Its injected finger swipe also failed to scroll a plain HTML control, leaving that gesture open for physical iPhone Safari. Hosted sign-in and live incoming trades were outside this retest. [Android swipes](/home/traderlink/preview-runtime/shared-charts-all-78.QAEXUR/mobile-final/legend-swipe-android.log) · [WebKit scroll comparison](/home/traderlink/preview-runtime/shared-charts-all-78.QAEXUR/mobile-final/webkit-scroll-release.log)

### Results by indicator

The table lists example displayed values after editing a setting where applicable. The numerical reference checks covered the full initialized series.

| Indicator | VIVS minute on Market Charts | Workspace symbol and timeframe | Workspace readout |
| --- | --- | --- | --- |
| Simple Moving Average | 21: 0.3558 50: 0.3532 200: 0.3524 | SAFX 1D | 20: 0.0899 50: 0.2293 200: 0.3531 |
| Exponential Moving Average | 10: 0.3564 20: 0.3562 | SAFX 1D | 9: 0.0615 20: 0.0972 |
| Volume Weighted Average Price | 0.2410 | VIVS 1m | 0.2410 |
| Bollinger Bands | Upper: 0.3642 Middle: 0.3558 Lower: 0.3474 | SAFX 1D | Upper: 0.1557 Middle: 0.0899 Lower: 0.0241 |
| Relative Strength Index | RSI 15: 45.29 RSI upper: 70.00 RSI middle: 50.00 RSI lower: 30.00 | SAFX 1D | RSI 14: 23.36 RSI upper: 70.00 RSI middle: 50.00 RSI lower: 30.00 |
| Moving Average Convergence Divergence | MACD 13/26: 0.0006 Signal 9: 0.0011 Histogram: -0.0005 | SAFX 1D | MACD 12/26: -0.0485 Signal 9: -0.0523 Histogram: 0.0038 |
| Weighted Moving Average | 0.3570 | SAFX 1D | 0.0724 |
| Hull Moving Average | 0.3575 | SAFX 1D | 0.0448 |
| Volume Weighted Moving Average | 0.3569 | SAFX 1D | 0.0738 |
| Double EMA | 0.3573 | SAFX 1D | 0.0292 |
| Triple EMA | 0.3571 | SAFX 1D | 0.0322 |
| Smoothed Moving Average | 0.3554 | SAFX 1D | 0.1610 |
| Arnaud Legoux Moving Average | 0.3558 | SAFX 1D | 0.0481 |
| Kaufman Adaptive Moving Average | 0.3559 | SAFX 1D | 0.0658 |
| Least Squares Moving Average | 0.3580 | SAFX 1D | 0.0342 |
| McGinley Dynamic | 0.3562 | SAFX 1D | 0.0433 |
| Moving Average Ribbon | SMA 9: 0.3571 SMA 17: 0.3572 SMA 25: 0.3557 SMA 33: 0.3558 SMA 41: 0.3548 SMA 49: 0.3532 | SAFX 1D | SMA 8: 0.0594 SMA 16: 0.0780 SMA 24: 0.1042 SMA 32: 0.1385 SMA 40: 0.1767 SMA 48: 0.2209 |
| Moving Average Cross | Fast 10: 0.3570 Slow 21: 0.3558 | SAFX 1D | Fast 9: 0.0615 Slow 21: 0.0932 |
| Anchored VWAP (Visible Range Start) | 0.3608 | SAFX 1D | 0.1783 |
| On Balance Volume | 54994715 | SAFX 1D | 870439513 |
| Accumulation/Distribution | -5583924 | SAFX 1D | -319997994 |
| Chaikin Money Flow | 0.1806 | SAFX 1D | -0.1679 |
| Chaikin Oscillator | 11975.20 | SAFX 1D | -14444704.50 |
| Money Flow Index | 48.07 | SAFX 1D | 43.82 |
| Price Volume Trend | 3108492 | SAFX 1D | 751547820 |
| Relative Volume | 2.1667 | SAFX 1D | 0.5206 |
| Volume Oscillator | 15.49% | SAFX 1D | 0.43% |
| Net Volume | -251877 | SAFX 1D | -13476230 |
| Elder Force Index | -102.82 | SAFX 1D | -163612.52 |
| Ease of Movement | -0.0009 | SAFX 1D | -0.0006 |
| Klinger Oscillator | -780101.17 Signal: 689509.68 | SAFX 1D | -63029312.25 Signal: -52284306.80 |
| Keltner Channels | Middle: 0.3562 Upper: 0.3645 Lower: 0.3479 | SAFX 1D | Middle: 0.0972 Upper: 0.1511 Lower: 0.0434 |
| Donchian Channels | Middle: 0.3560 Upper: 0.3650 Lower: 0.3470 | SAFX 1D | Middle: 0.0997 Upper: 0.1664 Lower: 0.0330 |
| Moving Average Envelope | Middle: 0.3558 Upper: 0.3647 Lower: 0.3470 | SAFX 1D | Middle: 0.0899 Upper: 0.0921 Lower: 0.0876 |
| Average True Range | 0.0041 | SAFX 1D | 0.0236 |
| Standard Deviation | 0.0042 | SAFX 1D | 0.0329 |
| Historical Volatility | Volatility per bar (%): 0.59% | SAFX 1D | Annualized volatility (%): 296.39% |
| Bollinger BandWidth | 4.72% | SAFX 1D | 146.42% |
| Bollinger Bands %B | 0.3305 | SAFX 1D | 0.1361 |
| Ulcer Index | 1.52% | SAFX 1D | 55.44% |
| Price Channel (Prior Bars) | Middle: 0.3560 Upper: 0.3650 Lower: 0.3470 | SAFX 1D | Middle: 0.0997 Upper: 0.1664 Lower: 0.0330 |
| Parabolic SAR | 0.3641 | SAFX 1D | 0.0868 |
| Supertrend | 0.3510 | SAFX 1D | 0.1086 |
| Chandelier Exit | Long exit: 0.3523 Short exit: 0.3597 | SAFX 1D | Long exit: 0.0908 Short exit: 0.1168 |
| Directional Movement Index (ADX) | ADX: 19.52 +DI: 25.35 −DI: 26.51 | SAFX 1D | ADX: 46.01 +DI: 10.34 −DI: 33.37 |
| Aroon | Aroon Up: 84.62 Aroon Down: 23.08 | SAFX 1D | Aroon Up: 8.00 Aroon Down: 88.00 |
| Aroon Oscillator | 61.54 | SAFX 1D | -80.00 |
| Vortex Indicator | VI+: 0.9650 VI−: 0.9315 | SAFX 1D | VI+: 0.6713 VI−: 1.2888 |
| Choppiness Index | 47.61 | SAFX 1D | 40.29 |
| Mass Index | 26.00 | SAFX 1D | 22.08 |
| Stochastic | %K: 36.10 %D: 45.39 | SAFX 1D | %K: 13.15 %D: 14.35 |
| Stochastic RSI | %K: 4.20 %D: 21.21 | SAFX 1D | %K: 54.36 %D: 55.89 |
| Commodity Channel Index | -59.68 | SAFX 1D | -109.16 |
| Williams %R | -69.36 | SAFX 1D | -90.11 |
| Momentum | -0.0102 | SAFX 1D | -0.0299 |
| Rate of Change | -1.86% | SAFX 1D | -50.93% |
| Awesome Oscillator | 0.0011 | SAFX 1D | -0.0988 |
| Ultimate Oscillator | 51.54 | SAFX 1D | 38.36 |
| TRIX | 0.05% | SAFX 1D | -3.46% |
| True Strength Index | 4.54 Signal: 7.89 | SAFX 1D | -51.83 Signal: -49.45 |
| Detrended Price Oscillator | 0.0069 | SAFX 1D | -0.0062 |
| Coppock Curve | 1.50% | SAFX 1D | -109.41% |
| Know Sure Thing | 14.43 Signal: 15.40 | SAFX 1D | -680.62 Signal: -659.94 |
| Chande Momentum Oscillator | 5.64 | SAFX 1D | -60.12 |
| Relative Vigor Index | -0.1443 Signal: 0.0129 | SAFX 1D | -0.1691 Signal: -0.2049 |
| Fisher Transform | -0.82 Trigger: -0.33 | SAFX 1D | -3.56 Trigger: -3.22 |
| Schaff Trend Cycle | 23.27 | SAFX 1D | 35.66 |
| SMI Ergodic Oscillator | -0.0744 | SAFX 1D | -0.0019 |
| Connors RSI | 19.90 | SAFX 1D | 19.67 |
| Balance of Power | -0.2791 | SAFX 1D | -0.5493 |
| Bull Bear Power | -0.0087 | SAFX 1D | -0.0554 |
| Williams Alligator | Jaw: 0.3558 Teeth: 0.3563 Lips: 0.3561 | SAFX 1D | Jaw: 0.1713 Teeth: 0.1099 Lips: 0.0786 |
| Ichimoku Cloud | Conversion: 0.3564 Base: 0.3560 Leading Span A: 0.3562 Leading Span B: 0.3533 Lagging Span: 0.3530 | SAFX 1D | Conversion: 0.0630 Base: 0.1281 Leading Span A: 0.3010 Leading Span B: 0.3455 Lagging Span: 0.0420 |
| Linear Regression Channel | 0.3500 Upper Band: 0.3666 Lower Band: 0.3334 | SAFX 1D | 0.1136 Upper Band: 0.2563 Lower Band: — |
| Standard Pivot Points | P: 0.1220 R1: 0.1255 R2: 0.1293 R3: 0.1328 S1: 0.1182 S2: 0.1147 S3: 0.1109 | SAFX 1D | P: 0.1969 R1: 0.2778 R2: 0.4331 R3: 0.5140 S1: 0.0416 S2: 0.2068 S3: 0.0786 |
| Zig Zag | 0.3649 | SAFX 1D | 0.0624 |
| Visible Range Volume Profile | POC 0.3701 · VAH 0.3792 · VAL 0.3511 | SAFX 1D | POC 0.1676 · VAH 0.2194 · VAL 0.0330 |
| Session Volume Profile | POC 0.1941 · VAH 0.2817 · VAL 0.1650 | SAFX 1D | POC 0.0691 · VAH 0.0924 · VAL 0.0457 |

## Cross-symbol retest on MEDS, GMM and CLRO

The second independent audit used archived Alpaca candles for three different stocks. The numerical checks used the following source histories. Sparse intervals retained their original timestamps.

| Ticker | Source history | Timestamped values checked | Volume-profile windows checked |
| --- | --- | ---: | ---: |
| MEDS | 2,686 one-minute candles | 327,508 | 4 |
| GMM | 4,395 one-minute candles | 537,976 | 5 |
| CLRO | 224 native Daily candles | 25,151 | 5 |

All 78 studies matched the reference on each ticker. Both volume profiles were independently rebuilt from the original decimal prices and volumes, including row volume, point of control and value-area boundaries. Replaying GMM at four historical cutoffs added 76,546 checks on the 15-minute chart. The replay accounted for studies whose visible window or most recent endpoint can change as further candles appear. [Formula results](/home/traderlink/preview-runtime/chart-final-rank-audit.2VBPaR/numerical-summary.json) and [15-minute replay results](/home/traderlink/preview-runtime/shared-chart-cross-symbol-audit.wKMXXC/gmm-15m-assembled.json)

- **Connors RSI** previously counted one equal return as smaller. On November 17, GMM rose from $1.40 to $1.41 and from $1.33 to $1.3395. Both moves gained exactly 1/140 of their starting price. Comparing the underlying decimal prices gives 69 lower returns in the 100-bar window. The corrected reading is 75.37567845. All 56,016 readings across the eight supported price sources matched the independent rank calculation.
- **Sub-dollar price display** now retains the precision of the displayed candles across a dollar crossing. The November 16 04:01 ET MEDS candle opened at $0.7393 and closed at $0.7199. Its close previously appeared as $0.72 when later candles were above $1. The default MACD readout preserves small signed values, both volume profiles show four decimals for sub-dollar levels, and an explicitly chosen indicator precision takes precedence. Chart Replay uses the active price format as the trader steps through bars.
- **Mobile indicator selection** could miss a tap immediately after reopening Indicators. The bottom sheet kept moving while a search result was under the finger. The Windows Pixel 7 trace recorded Triple EMA receiving touch down and up, then the click landing underneath it. The mobile Indicators sheet now opens in its final position. A controlled native-touch repeat selected the intended study six times out of six. The previous source missed all six taps. [Before](/home/traderlink/preview-runtime/chart-android-picker.uWnvcD/base-reopen.jsonl) and [after](/home/traderlink/preview-runtime/chart-android-picker.uWnvcD/fixed-reopen.jsonl)
- **Standard Pivot Points** previously showed October's last positive S2 and S3 as current on November 20 CLRO. October's native high, low and close were $6.23, $1.62 and $3.41. They give a November pivot of $3.7533 and negative S2 and S3. The resting legend now checks the current chart candle and displays a dash for each nonpositive support. The price scale checks the right edge of the visible period before showing a label. Historical crosshairs still read the level for the selected candle.
- **Volume-profile rounding** now agrees with the price axis at a half tick. At the same visible range on MEDS, a raw point of control of $1.56375 displays as $1.5638 in both places. CLRO’s Ichimoku Base and Leading Span B at $5.135 now display as $5.14. [Native rounding checks](/home/traderlink/preview-runtime/chart-price-tick-rounding.0tk7Wj/native.json)

The corrected source was rendered 936 times across 78 indicators, MEDS one-minute and CLRO Daily, Market Charts and the compact Trading Workspace chart, and three browser profiles. Every study used the intended pane. The two chart surfaces produced the same series and profile bins on the same 32-candle viewport. The built-in Volume pane also matched every displayed bar's volume. Desktop Chromium and Android Chromium used the owner's PC. The iPhone run used WebKit with iPhone dimensions and touch input. Both phone profiles used emulation. [Per-indicator results](/home/traderlink/preview-runtime/shared-chart-cross-symbol-audit.wKMXXC/indicator-results.csv) and [rendered results with source receipts](/home/traderlink/preview-runtime/shared-chart-cross-symbol-audit.wKMXXC/verification.json)

MEDS also verified the visible-range input explicitly. The narrower iPhone view covered 61 bars and produced an anchored VWAP of 1.57470123. The desktop view covered 121 bars and produced 1.69383879. Each matched the volume of its own visible candles. The session volume profile used the same 94,225,475 shares across both. [Range VWAP check](/home/traderlink/preview-runtime/charts-meds-lifecycle.rLulVG/anchored-reference.json) and [volume-profile check](/home/traderlink/preview-runtime/charts-meds-lifecycle.rLulVG/profile-reference.json)

All 78 also went through the individual indicator controls on desktop, iPhone WebKit and Android Chromium. Checks covered searching and adding, changing an applicable calculation input or style, favoriting, hiding values independently from the plot, reopening, restoring and confirming removal. The controls check used the MEDS chart. All 75 viewport-independent studies agreed across the desktop and iPhone edit runs. Each of the three viewport-dependent studies was independently reconciled to its visible inputs. A separate two-ticker check verified that hiding values on one open chart survives tab switches and a reload and that the account-wide choice applies to both open charts. [Desktop and iPhone controls](/home/traderlink/preview-runtime/charts-meds-lifecycle.rLulVG/lifecycle-summary.json), [Android controls](/home/traderlink/preview-runtime/shared-chart-different-symbols-ui.FgJDXC/pc-results/pc-meds-android-20261126-5aef5ad9/final-78-ground-truth/summary.json) and [two-chart persistence](/home/traderlink/preview-runtime/shared-chart-cross-symbol-audit.wKMXXC/switch-v4-progress.json)

The two closed-market datasets displayed in the browser were the five complete MEDS trading sessions (2,618 emitted minute bars) and CLRO's 224 Daily candles. The numerical audit also included the 68 recorded MEDS prints from the previous after-hours session. This was local component and browser verification with isolated preferences. Android finger input and WebKit horizontal scroll input reached the long legends without moving the chart. A physical iPhone finger swipe remains unverified. The corrected source passed 608 tests across 32 files and TypeScript checks on the nine changed source and test files. ESLint reported one existing unused-variable warning on the original drawing toolbar. [Local checks](/home/traderlink/preview-runtime/shared-chart-cross-symbol-audit.wKMXXC/vitest-stale-pivot-final.log), [browser interaction receipts](/home/traderlink/preview-runtime/shared-chart-different-symbols-ui.FgJDXC/release/verified-ui.json) and [final iPhone renders](/home/traderlink/preview-runtime/shared-chart-different-symbols-ui.FgJDXC/release/iphone-final/verified-312.json)

Both phone profiles also completed the MACD, Ichimoku and Session Volume Profile controls after rotation from portrait to landscape. The settings sheet stayed within the viewport and removal remained reachable. During the iPhone emulator's initial resize frame the dimmed plot briefly collapsed. With the editor still open, the settled plot measured 264 px high and its date axis returned to the bottom within the 700 ms check. [iPhone landscape](/home/traderlink/preview-runtime/charts-meds-lifecycle.rLulVG/landscape-final/iphone.jsonl) and [Android landscape](/home/traderlink/preview-runtime/charts-meds-lifecycle.rLulVG/landscape-final/android.jsonl)
