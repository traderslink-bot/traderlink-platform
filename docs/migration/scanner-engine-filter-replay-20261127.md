# Scanner engine audit on seven nano-cap and micro-cap runners

November 27, 2026 · Private local candidate · All times Eastern

All 154 selectable filters ran through the Scanner evaluator. **145 returned a qualifying ticker from real prices, candles, events, filings or profile data.** The float-unavailable filter qualified when historical float evidence was absent and excluded all seven tickers when their Finnhub profiles supplied a float. Three float calculations passed arithmetic checks on the seven runners. Five Levels filters correctly reported incomplete inputs. The last eight still need a positive result using evidence available at the time of the match.

## What changed

- **Exact price moves.** GMM went from $2.60 to $3.38 over five minutes, with 7,213,841 shares of additional volume, at 8:42:56 a.m. on November 16. It now qualifies at precisely 30%. CLRO’s $5.00 to $5.01 move qualifies at 0.20%. Both upper and lower inclusive cutoffs use decimal price differences. The live presets and custom filters share the calculation.
- **Timed rebounds.** CLRO’s 8:06 a.m. November 16 candle closed at $4.88 after a confirmed $4.90 low with 2.19× volume. It used to match a maximum-only rebound filter. Requiring an actual recovery in price removed ten false observations from the five-minute rebound check and left 31 valid observations across all seven tickers. The separate prior-window low filter accepts negative thresholds for prices below that reference.
- **Candle corrections and time ordering.** A completed, fully covered 1m or 5m reread now drops a canceled bar from the overlapping interval. An earlier observation cannot read indicators from a later cached candle. Regressions exercise both frames, a partial-coverage control and a cutoff immediately before the data became eligible. The correction was injected into the test. The recorded data does not identify a live provider cancellation.

## Evidence and remaining checks

- **Market replay.** VIVS, MEDS, SEAT, GMM, CLRO, CHSN and AKAN supplied 50,032 native one-minute bars, 14,363 five-minute bars and 5,693 fifteen-minute bars. These were paginated Alpaca SIP reads from November 4 through the November 25 after-hours close. The daily studies used split-adjusted history extending into January 2025 and SPY for benchmark comparisons. Session and event checks used 221 as-of times on seven trading dates, with 1,519 eligible ticker observations. Late-November listing/profile metadata was kept out of the earlier tape. Daily averages include verified quiet sessions where the provider window establishes coverage.
- **Arithmetic and cutoffs.** Independently calculated prices, session totals, spreads, VWAP, daily statistics and completed-candle studies agreed on 73,785 readings across 60 selectable fields. A separate check took observed readings, then tested exact and tighter bounds against expected ticker sets. It made 36,450 comparisons. Those comparisons verify qualification and do not independently validate an indicator’s formula.
- **Six presets.** The individual tape replay covered 13,020 one-second evaluations and 126,120 custom scan queries, with zero differences against the independent high-of-day, breakout, decline and rolling-window checks. The simultaneous seven-ticker run checked 3,600 ranked memberships. Market Events matched four wire releases and ten Nasdaq halts at 4,868 event-time cutoffs. All three same-time RVOL sessions also ran against independent cumulative volume at 256 cutoffs.
- **Patterns and indicators.** The 55 selectable indicator signals all had a real positive in the sampled windows. All 14 named chart patterns had a qualifying real example in a sequential search of completed 50-bar windows. These are matches to the implemented rules. The audit does not rate their predictive power.
- **Fundamentals.** Current company normalization and the Scanner projection ran on real SEC filings and Finnhub responses. CLRO’s filed annual revenue of $0 matched an exact-zero scan and failed a $40M minimum. CHSN supplied a P/E. CLRO supplied a genuine zero dividend yield. Ratios used the company worker’s dated valuation format at the Friday gateway read. An absent ratio remained unavailable. These were provider, projection and filter checks outside an active trading session.
- **Three float calculations.** Float market cap, session float turnover and rolling float turnover passed with all seven real floats and real price/volume inputs. The Finnhub profile receipts came after the trading samples. A point-in-time test still needs a float already known to Scanner before the qualifying trade and volume updates. Fresh price matters for float market cap. Two volume observations and a known float suffice for rolling turnover.
- **Five Levels filters.** Confirmed 4H break, distance to the verified zone, room to the next target, zone state and reward/risk need a qualifying saved map and evidence issued after the save. The original VIVS record established a verified zone and a qualifying predecessor. It did not establish a later match. Verify the exact receipt in Scanner and Charts when a qualifying case occurs.
- **Higher timeframes.** The read-only private archive returned 49 of 84 sampled SMA readings across 30m, 1h, 4h, daily and weekly frames. The November 25 midnight check had 42/42. The Thanksgiving check had seven weekly readings, while 35 readings required the missing tail of the previous trading day. Adding the actual Wednesday Alpaca bars to an isolated archive yielded 42/42 holiday readings, including daily SMA 200 for all seven. The managed archive was left to its owner. A complete archive window can be verified while the market is closed.
- **Live delivery.** Replay establishes calculation and ordering against exchange or wire timestamps. An open-session check is still needed for provider-to-Scanner latency on sharp price moves, quote/spread updates, PR arrivals and Nasdaq halt/resumption delivery. The historical PR and halt rules already produced positive matches. Physical-device delivery is a separate measurement.

## Performance

The five price presets took 0.28 ms at the 95th percentile on individual runner updates. A separate load run evaluating 4,000 synthetic symbols with prices sampled from the real minute closes took 159 ms at the 95th percentile over 21 measured updates. Both measure engine execution. Provider transit, storage, alert delivery and browser rendering are outside those timings.

The regression suite passed 190 tests in 18 files. Scoped TypeScript and ESLint passed. The supplemental rerun passed for all seven runners. It checked the three float calculations, recomputed reported financial values from filing operands, verified accession references and compared valuation fields with the captured Finnhub responses.

## Per-filter results

The primary market column counts come from broad standalone rules in the 221-timestamp replay. Ordered events, categorical selections, crossovers and named patterns have their own qualifying conditions. For filing and profile fields, the table uses the seven separately dated company reads. Stocks may contribute at many times. ‘Incomplete’ means a required input was unavailable at that observation. ‘Arithmetic only’ and ‘Needs saved match’ identify the outstanding positive evidence.

### Price (16)

| Filter | Matched | Excluded | Incomplete | Evidence |
| --- | ---: | ---: | ---: | --- |
| Timed rebound from confirmed low on rising volume % | 31 | 910 | 578 | Evaluator and exact/tighter boundaries |
| Return over completed candles | 1519 | 0 | 0 | Independent numeric reference |
| Rebound from prior candle-window low | 1519 | 0 | 0 | Independent numeric reference |
| Price | 1519 | 0 | 0 | Independent numeric reference |
| Day change | 1519 | 0 | 0 | Independent numeric reference |
| Below day high | 1519 | 0 | 0 | Independent numeric reference |
| Day high | 1519 | 0 | 0 | Independent numeric reference |
| Day low | 1519 | 0 | 0 | Independent numeric reference |
| Above day low | 1519 | 0 | 0 | Independent numeric reference |
| Day range | 1519 | 0 | 0 | Independent numeric reference |
| Session VWAP | 1519 | 0 | 0 | Independent numeric reference |
| Change from VWAP | 1519 | 0 | 0 | Independent numeric reference |
| Price move | 553 | 0 | 966 | Evaluator and exact/tighter boundaries |
| Price move in dollars | 553 | 0 | 966 | Evaluator and exact/tighter boundaries |
| Session change in dollars | 1519 | 0 | 0 | Independent numeric reference |
| 20-session average daily range % | 1519 | 0 | 0 | Independent numeric reference |

### Volume (24)

| Filter | Matched | Excluded | Incomplete | Evidence |
| --- | ---: | ---: | ---: | --- |
| Float turnover in past minutes | 0 | 0 | 1519 | Arithmetic only, point-in-time float outstanding |
| Largest eligible print this session (shares) | 1 | 0 | 0 | Session-opening AKAN trade tape |
| Largest eligible print this session ($) | 1 | 0 | 0 | Session-opening AKAN trade tape |
| 20-session average daily dollar volume | 1519 | 0 | 0 | Independent numeric reference |
| Candle volume vs preceding average | 1519 | 0 | 0 | Independent numeric reference |
| Average candle volume | 1519 | 0 | 0 | Independent numeric reference |
| Average dollar volume per candle | 1519 | 0 | 0 | Independent numeric reference |
| Volume over completed candles | 1519 | 0 | 0 | Independent numeric reference |
| Premarket + Regular volume | 1519 | 0 | 0 | Independent numeric reference |
| Premarket volume | 1519 | 0 | 0 | Independent numeric reference |
| Regular volume | 1113 | 0 | 406 | Independent numeric reference |
| After-hours volume | 175 | 0 | 1344 | Independent numeric reference |
| Dollar volume | 1519 | 0 | 0 | Independent numeric reference |
| Rolling volume | 553 | 0 | 966 | Evaluator and exact/tighter boundaries |
| Rolling dollar volume | 553 | 0 | 966 | Evaluator and exact/tighter boundaries |
| Volume pace vs prior window | 319 | 0 | 1200 | Evaluator and exact/tighter boundaries |
| Bid/ask spread | 38 | 0 | 1481 | Independent numeric reference |
| Bid/ask spread % of midpoint | 38 | 0 | 1481 | Independent numeric reference |
| 20-session average daily volume | 1519 | 0 | 0 | Independent numeric reference |
| Premarket same-time relative volume (3 sessions) | 383 | 0 | 1136 | Independent session-volume replay |
| After-hours same-time relative volume (3 sessions) | 154 | 0 | 1365 | Independent session-volume replay |
| Regular same-time relative volume (3 sessions) | 742 | 0 | 777 | Independent session-volume replay |
| Regular volume vs 20-session daily average | 938 | 0 | 581 | Independent numeric reference |
| Float turnover | 0 | 0 | 1519 | Arithmetic only, point-in-time float outstanding |

### Session levels (36)

| Filter | Matched | Excluded | Incomplete | Evidence |
| --- | ---: | ---: | ---: | --- |
| 1m close crosses a reference level | 8 | 1115 | 396 | Dated event or completed candle |
| 1m close crosses above premarket high | 8 | 1115 | 396 | Dated event or completed candle |
| 1m close crosses above 5m opening range | 7 | 1119 | 393 | Dated event or completed candle |
| First verified target reward/risk | 0 | 0 | 1519 | Needs saved match |
| Verified retest state | 0 | 0 | 1519 | Needs saved match |
| Trading session | 938 | 581 | 0 | Evaluator with recorded inputs |
| Opening range high | 1057 | 0 | 462 | Independent numeric reference |
| Opening range low | 1057 | 0 | 462 | Independent numeric reference |
| Change from opening range high | 1057 | 0 | 462 | Independent numeric reference |
| Change from opening range low | 1057 | 0 | 462 | Independent numeric reference |
| Previous day high | 1519 | 0 | 0 | Independent numeric reference |
| Previous day low | 1519 | 0 | 0 | Independent numeric reference |
| Previous day close | 1519 | 0 | 0 | Independent numeric reference |
| Change from previous day high | 1519 | 0 | 0 | Independent numeric reference |
| Change from previous day low | 1519 | 0 | 0 | Independent numeric reference |
| Session open | 1519 | 0 | 0 | Independent numeric reference |
| Session opening gap | 1519 | 0 | 0 | Independent numeric reference |
| Premarket high | 1495 | 0 | 24 | Independent numeric reference |
| Premarket low | 1495 | 0 | 24 | Independent numeric reference |
| Premarket range % | 1495 | 0 | 24 | Independent numeric reference |
| Change from premarket high | 1495 | 0 | 24 | Independent numeric reference |
| Change from premarket low | 1495 | 0 | 24 | Independent numeric reference |
| Regular high | 1113 | 0 | 406 | Independent numeric reference |
| Regular low | 1113 | 0 | 406 | Independent numeric reference |
| Regular session range % | 1113 | 0 | 406 | Independent numeric reference |
| Change from regular high | 1113 | 0 | 406 | Independent numeric reference |
| Change from regular low | 1113 | 0 | 406 | Independent numeric reference |
| After-hours high | 175 | 0 | 1344 | Independent numeric reference |
| After-hours low | 175 | 0 | 1344 | Independent numeric reference |
| After-hours range % | 175 | 0 | 1344 | Independent numeric reference |
| Change from after-hours high | 175 | 0 | 1344 | Independent numeric reference |
| Change from after-hours low | 175 | 0 | 1344 | Independent numeric reference |
| After-hours change | 175 | 0 | 1344 | Independent numeric reference |
| Distance to verified setup zone % | 0 | 0 | 1519 | Needs saved match |
| Room to next verified target % | 0 | 0 | 1519 | Needs saved match |
| Confirmed 4H level break | 0 | 0 | 1519 | Needs saved match |

### Company (23)

| Filter | Matched | Excluded | Incomplete | Evidence |
| --- | ---: | ---: | ---: | --- |
| Float unavailable | 0 | 7 | 0 | 7 known floats excluded here, 1,519 source-unknown replay rows matched |
| Float market cap | 0 | 0 | 1519 | Arithmetic only, point-in-time float outstanding |
| Days since IPO | 7 | 0 | 0 | Dated Finnhub profile / SEC or valuation projection |
| Reported annual revenue (USD) | 6 | 0 | 1 | Dated Finnhub profile / SEC or valuation projection |
| Reported annual net income (USD) | 6 | 0 | 1 | Dated Finnhub profile / SEC or valuation projection |
| Annual revenue growth % | 5 | 0 | 2 | Dated Finnhub profile / SEC or valuation projection |
| Annual net income growth % | 3 | 0 | 4 | Dated Finnhub profile / SEC or valuation projection |
| Annual net margin % | 5 | 0 | 2 | Dated Finnhub profile / SEC or valuation projection |
| Annual gross margin % | 3 | 0 | 4 | Dated Finnhub profile / SEC or valuation projection |
| Annual diluted EPS (USD) | 4 | 0 | 3 | Dated Finnhub profile / SEC or valuation projection |
| P/E (TTM) | 1 | 0 | 6 | Dated Finnhub profile / SEC or valuation projection |
| Price/sales (TTM) | 7 | 0 | 0 | Dated Finnhub profile / SEC or valuation projection |
| Price/book (quarterly) | 7 | 0 | 0 | Dated Finnhub profile / SEC or valuation projection |
| Dividend yield (TTM) % | 1 | 0 | 6 | Dated Finnhub profile / SEC or valuation projection |
| SEC filing form in past 30 days | 5 | 0 | 2 | Dated Finnhub profile / SEC or valuation projection |
| Tickers | 1519 | 0 | 0 | Evaluator with recorded inputs |
| Listing exchange | 252 | 0 | 1267 | Evaluator with recorded inputs |
| Nasdaq sector | 144 | 108 | 1267 | Evaluator with recorded inputs |
| Security type | 180 | 72 | 1267 | Evaluator with recorded inputs |
| Industry | 7 | 0 | 0 | Dated Finnhub profile / SEC or valuation projection |
| Listing country | 7 | 0 | 0 | Dated Finnhub profile / SEC or valuation projection |
| Market cap | 252 | 0 | 1267 | Evaluator and exact/tighter boundaries |
| Float | 7 | 0 | 0 | Dated Finnhub profile / SEC or valuation projection |

### Catalyst (7)

| Filter | Matched | Excluded | Incomplete | Evidence |
| --- | ---: | ---: | ---: | --- |
| PR followed by a 1m VWAP reclaim | 3 | 1122 | 394 | Dated event or completed candle |
| Trading resumption followed by 1m volume expansion | 7 | 775 | 737 | Dated event or completed candle |
| PR headline contains (past 24h) | 39 | 1480 | 0 | Dated event or completed candle |
| Active halt reason code | 27 | 1240 | 252 | Dated event or completed candle |
| Trading halt | 27 | 1240 | 252 | Dated event or completed candle |
| Trading resumed | 71 | 1196 | 252 | Dated event or completed candle |
| Press release | 301 | 1218 | 0 | Dated event or completed candle |

### Indicators (34)

| Filter | Matched | Excluded | Incomplete | Evidence |
| --- | ---: | ---: | ---: | --- |
| Close vs configurable SMA % | 1519 | 0 | 0 | Independent numeric reference |
| Close vs configurable EMA % | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| SMA change per candle % | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| Close position in candle-window range % | 1519 | 0 | 0 | Independent numeric reference |
| Candle-window range width % | 1519 | 0 | 0 | Independent numeric reference |
| Volatility per candle (log returns %) | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| Close vs VWAP anchored to window low % | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| Consecutive closes above SMA | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| SMA rejection on latest candle (1 = rejected) | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| Configurable MACD histogram % | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| Confirmed chart pattern | 5 | 1514 | 0 | Double bottom here, all 14 patterns had examples |
| 9/20/50 SMA alignment (−1 to +1) | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| Bollinger width vs preceding window | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| RSI on completed candles | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| ADX trend strength | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| KDJ oscillator J | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| Distance from session VWAP | 1519 | 0 | 0 | Independent numeric reference |
| Custom EMA | 656 | 863 | 0 | Evaluator with recorded inputs |
| Custom SMA | 659 | 860 | 0 | Evaluator with recorded inputs |
| Custom RSI | 659 | 860 | 0 | Evaluator with recorded inputs |
| VWAP state or cross | 476 | 1043 | 0 | Evaluator with recorded inputs |
| Indicator signal | 1147 | 372 | 0 | EMA 20 cross here, all 55 signals had examples |
| RSI change | 1518 | 0 | 1 | Evaluator and exact/tighter boundaries |
| EMA 9 slope in ATR | 1518 | 0 | 1 | Evaluator and exact/tighter boundaries |
| EMA 20 slope in ATR | 1518 | 0 | 1 | Evaluator and exact/tighter boundaries |
| ATR vs prior baseline | 1518 | 0 | 1 | Evaluator and exact/tighter boundaries |
| Bollinger bandwidth % | 1518 | 0 | 1 | Evaluator and exact/tighter boundaries |
| RSI 14 | 1518 | 0 | 1 | Evaluator and exact/tighter boundaries |
| EMA 9 vs EMA 20 | 1518 | 0 | 1 | Evaluator and exact/tighter boundaries |
| ATR % | 1518 | 0 | 1 | Evaluator and exact/tighter boundaries |
| Volume vs indicator baseline | 690 | 0 | 829 | Evaluator and exact/tighter boundaries |
| MACD histogram % | 1518 | 0 | 1 | Evaluator and exact/tighter boundaries |
| Bollinger %B | 1518 | 0 | 1 | Evaluator and exact/tighter boundaries |
| Stochastic %K | 1518 | 0 | 1 | Evaluator and exact/tighter boundaries |

### Market context (14)

| Filter | Matched | Excluded | Incomplete | Evidence |
| --- | ---: | ---: | ---: | --- |
| Day change vs sector mean (percentage points) | 108 | 0 | 1411 | Evaluator and exact/tighter boundaries |
| Advancing share of covered roster % | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| Advancing share of covered sector % | 252 | 0 | 1267 | Evaluator and exact/tighter boundaries |
| Beta vs SPY | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| Return vs SPY (percentage points) | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| Last completed daily return | 1519 | 0 | 0 | Independent numeric reference |
| Daily close vs 20-session SMA % | 1519 | 0 | 0 | Independent numeric reference |
| Weekly close vs 4-week SMA % | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| Last completed weekly return | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| Daily return vs SPY (percentage points) | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| Weekly return vs SPY (percentage points) | 1519 | 0 | 0 | Evaluator and exact/tighter boundaries |
| Pullback from high in last 5 completed sessions | 30 | 0 | 1489 | Evaluator and exact/tighter boundaries |
| Pullback from high in prior 7 calendar days | 30 | 0 | 1489 | Evaluator and exact/tighter boundaries |
| Pullback from previous trading week high | 30 | 0 | 1489 | Evaluator and exact/tighter boundaries |

The internal session-volume metric also ran. The picker represents volume through its existing scope control and excludes that internal key from its 154-filter catalogue. Particular parameter choices can require more history than the configured retention supplies.

The [filter audit](scanner-filter-audit-20261126.md) covers Apply, Save and reopen. The [preset replay](scanner-engine-runner-replay-20261127.md) gives the runner-by-runner outcomes. Detailed local data, input captures and replay programs are in the [private QA directory](/tmp/scanner-real-catalogue-5q3oE40Q).

### Input fingerprints

| Local capture | SHA-256 |
| --- | --- |
| 1Min.json.gz | `6cfa53f0a807298e7f451c2aa13c693e92a0e5c827aebab26f6bf9308ad44d6c` |
| 5Min.json.gz | `ca7fb78559ed43eef587798a7dd643956db01bf3d45a130f12d0712c6521b070` |
| 15Min.json.gz | `84f1fc0f42a8a6d2ec11f49a70f1915b11fcef309fca63853f3195657ecf104f` |
| 1Day.json.gz | `436968c5a056a204b3d56807626eb32e3d11d85f99acb1ebb60416d70558cc07` |
| metadata-friday.json | `13c79361987b4ec52d060ac005a6f227e7d6c44130e4d3d71b483724559f6c80` |
| clro-selected.json | `ad3026c90f31dd2bfff9af9628caad111d0b591353b045b4b8664489df3f5a46` |
