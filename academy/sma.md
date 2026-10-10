---
title: "SMA: Reading A Simple Moving Average"
slug: "/academy/sma/"
meta_description: "Learn how simple moving averages work, how periods and timeframes affect them, and how to read trends, pullbacks and crossovers."
status: "ready"
content_type: "academy_lesson"
product_area: "Education"
availability: "educational"
academy_course: "Technical Indicators And Tools"
academy_module: "VWAP And Moving Averages"
academy_order: 4
recommended_previous: "/academy/ema/"
recommended_next: "/academy/rsi/"
---

# SMA: Reading A Simple Moving Average

SMA stands for simple moving average. It adds a selected number of prices and divides that total by the number of prices. Each included price has the same weight. On a stock chart, the results form a line that helps traders follow the broader movement while individual candles fluctuate.

This lesson uses closing prices. A 20 SMA therefore averages the closes of the latest 20 bars. It does not average every transaction within those bars, weight prices by traded volume, or show orders waiting to buy and sell. Understanding those inputs explains both what the line offers and why it sometimes moves differently from current price.

## How The Average Is Calculated

Start with five completed daily candles, March 2 through March 6, 2026:

| Candle | Closing price |
| --- | ---: |
| 1 | $4.00 |
| 2 | $4.10 |
| 3 | $4.20 |
| 4 | $4.30 |
| 5 | $4.40 |

The total is $21.00. Dividing by five gives a **five-period SMA of $4.20**. Each close contributes one fifth, or 20%, of this calculation. The latest close is $4.40, but the average is lower because it also includes earlier prices.

Now the next candle closes at $4.50. To keep the window at five candles, remove the oldest close, $4.00, and add the newest, $4.50. The remaining closes total $21.50, so the new SMA is **$4.30**.

The word “moving” describes this advancing window. Every new completed candle adds one close and removes one older close. A 20 SMA follows the same process with 20 inputs; a 200 SMA does it with 200.

In this sequence, both the latest close and the SMA increased by $0.10. They do not always change by the same amount. The average's change depends on the **new close compared with the outgoing close**, divided by the period. Here, ($4.50 − $4.00) ÷ 5 = $0.10.

![Daily candles show the five closing prices being averaged, then a new candle replaces the oldest close.](/academy/images/technical-indicators/sma-rolling-average.svg)

## Why An SMA Can Rise While Price Is Flat

Keep the previous five-close window: $4.10, $4.20, $4.30, $4.40 and $4.50. Suppose the next candle also closes at $4.50. Current price has not advanced from the preceding close.

The calculation still changes. The oldest $4.10 drops out and the new $4.50 enters. The total becomes $21.90, giving an SMA of **$4.38**, up from $4.30.

This is useful when reading slope, meaning the direction of the line. A rising SMA means its average is increasing. It does not require the newest candle to have risen. Likewise, an SMA can decline while the latest close stays unchanged if a higher old close leaves the window.

A large price from an earlier event can affect the line until it drops out. When that happens, the average may change noticeably even if current price is quiet. Read the candles alongside the average instead of assuming every change in slope describes a new burst of buying or selling.

## Periods And Chart Timeframes

A period is one chart bar. The same setting on different charts averages different observations:

| Setting | Inputs |
| --- | --- |
| 20 SMA on a one-minute chart | Latest 20 one-minute closes |
| 20 SMA on a five-minute chart | Latest 20 five-minute closes |
| 20 SMA on a daily chart | Latest 20 daily closes |

Twenty five-minute bars represent 100 minutes of trading intervals. That does not always mean 100 uninterrupted minutes on the clock: the included bars can span session closures or other gaps. Twenty daily bars represent 20 trading days, not necessarily 20 calendar days.

A daily SMA and an intraday SMA can therefore be far apart without either being wrong. The daily line summarizes daily closing prices; the intraday line summarizes much shorter intervals. A five-minute SMA is calculated from five-minute inputs, not by compressing a one-minute SMA line onto fewer candles.

Session inclusion matters too. A chart that includes premarket and after-hours candles feeds those closes into its intraday averages. One showing only regular-session bars uses a different history. An ordinary SMA does not restart at the opening bell: it continues averaging its latest included bars.

While the current candle forms, its latest price can serve as the developing closing-price input. The live line may change before the interval ends. A completed candle establishes a finished close for that interval, but does not establish what happens afterward.

## Why Traders Use SMAs

An SMA smooths the fluctuations between individual closes. That makes it useful for describing a broader direction, particularly when the newest candle alone gives an incomplete impression of the move.

Imagine a stock advancing through several higher highs and higher lows. A few red candles appear during a pullback. The SMA may remain rising because the average still reflects the broader advance. This gives a different perspective from treating each red candle as a separate reversal.

Traders also compare price with the average. Price above a rising SMA describes a different relationship from price below a falling SMA. The relationship can help organize a chart review, but it does not supply an entry price, a stop or the distance to resistance.

Another use is watching a pullback near a moving reference. If price approaches a rising average and then recovers, the candles show a reaction in that area. The average makes the reference consistent over time. It does not reveal actual demand waiting at that exact price.

## What 20, 50 And 200 Periods Offer

A shorter SMA reacts to a smaller window of prices. A longer SMA combines more observations and usually smooths more of the small fluctuations, at the cost of responding later to a change.

A **20 SMA** can help describe a relatively recent move on the selected timeframe. On a five-minute chart, it can provide context for an intraday trend and its pullbacks. On a daily chart, it describes a much longer sequence. The same number does not give it the same trading role.

A **50 SMA** provides a broader comparison on that chart. A brief pullback might break a shorter average while leaving the longer average rising. The candles determine whether that pullback has damaged the price structure; the slower line can continue rising after important support has already failed.

A **200 SMA** is often watched on daily charts as a broad trend reference. A 200 SMA on a one-minute chart is an intraday calculation, not that daily reference. If a trader wants the daily 200 SMA, its inputs must be daily prices, even if a platform allows that daily line to be displayed on an intraday chart.

These periods are examples, not a required collection. Choose settings whose roles you can explain. Adding 20, 21 and 22 SMAs may produce three similar lines without giving three meaningfully different views of the move.

## SMA Compared With EMA

An SMA gives equal weight to every close currently inside its window. Once the oldest close leaves, it has no further influence on that SMA value.

An exponential moving average, or EMA, gives greater weight to recent prices and carries diminishing influence from older history. Its period controls the update weight rather than defining a hard cutoff after that number of closes.

On identical inputs, the two lines can respond differently when price accelerates or reverses. An EMA often responds sooner to a new directional move because it emphasizes recent prices. An SMA spreads that change equally across its window and is also affected by the price leaving the window.

“Faster” does not mean “better.” A more responsive line can react earlier to a useful change and to an ordinary fluctuation that immediately reverses. A smoother line can make the broader direction easier to follow while showing a reversal later. Their relative positions also depend on the price sequence; the EMA is not always above the SMA or always closest to price.

![A 20 SMA and 20 EMA calculated from the same closes.](/academy/images/technical-indicators/sma-versus-ema.svg)

## Price Position And Slope

Price position and slope describe separate relationships. Price position compares the current price with the SMA. Slope compares the latest average with its earlier values.

A stock can bounce above a falling SMA while the broader decline remains intact. The crossing says price moved above the average. It does not say the stock has recovered its earlier highs or begun making higher lows.

A stock can also pull below a rising SMA during an advance. That might become a brief interruption or a larger failure. Watch whether a meaningful pullback low holds and whether the next push can make progress. The line alone cannot distinguish those outcomes at the moment of the crossing.

In a sideways range, price may cross the same SMA repeatedly while the line remains comparatively flat. Buying every upward crossing can mean repeatedly entering a move that stops near the range's upper boundary. A whipsaw is a move or signal that quickly reverses; ranges commonly produce them.

![Calculated 20 SMAs show an advancing sequence and repeated sideways crossings.](/academy/images/technical-indicators/sma-trend-and-range.svg)

## Pullbacks Near An SMA

A rising SMA is sometimes described as moving or dynamic support. The reference moves because its calculation updates. Support still needs to be observed in the price behavior.

Suppose price declines toward the average, forms a low and starts recovering. That low is a reaction low: the low formed during the pullback. If later selling breaks it, the pullback has not held in the same way, even if the average remains rising.

A wick through the line, a completed close below it and a break of the reaction low are different events. A trader should know which event would invalidate the planned setup before entering. Otherwise, it becomes easy to replace one explanation with another as a losing position develops.

The bearish counterpart is a bounce toward a falling SMA that stalls and turns lower. The average provides context for the bounce, while the candle sequence shows the failure. Support farther below can still limit the remaining move.

## A Pullback With A Trade Plan

Consider a five-minute uptrend with a rising 20 SMA. Price pulls back to $6.00 and begins to recover. Earlier resistance is marked at $6.40. The trader considers entering at $6.10 after the recovery starts, with a stop reference at $5.98 beneath the pullback low.

The idea depends on the pullback holding. The stop reference follows that price structure; it is not chosen by placing an order directly on the SMA. The average continues moving, whereas the observed $6.00 low remains a recorded price.

For 300 shares, the $0.12 entry-to-stop distance gives **$36 of planned price risk**. The $0.30 distance to resistance gives **$90 before costs**. Purchasing the shares at $6.10 requires $1,830 of position value, which is different from the planned loss.

In one sequence, the recovery continues toward resistance. In another, it stalls, breaks $6.00 and reaches the stop reference. The same initial SMA relationship existed in both. The later candles show which outcome developed.

The $36 calculation assumes an exit at the reference price. An actual stop-market fill can differ, and fees and spread affect the result. An SMA touch does not guarantee either a recovery or that exact loss.

![A pullback recovery compared with a failed recovery using the same entry and stop reference.](/academy/images/technical-indicators/sma-pullback-hold-fail.svg)

Now consider entering late at $6.35 with the same $5.98 stop and $6.40 resistance. The $0.37 risk distance becomes **$111** for 300 shares, while the remaining $0.05 offers only **$15 before costs**. The average may still describe an uptrend accurately. It has not repaired the late entry's poor distance from the level supporting the idea.

## Crossovers And Their Delay

A price crossing and an average crossing are different. Price crosses an SMA when it moves from one side of that line to the other. Two SMAs cross when a shorter-period average moves across a longer-period average.

Both averages respond to prices already included in their calculations. A shorter average can cross above a longer one after the underlying advance has been underway for some time. Waiting for that crossing may place an entry close to resistance rather than at the beginning of the move.

On daily charts, a 50 SMA crossing above a 200 SMA is often called a golden cross; crossing below is called a death cross. These names describe the average relationship. They do not promise an advance or decline, and the daily calculation should not be confused with a 50/200 crossover on one-minute candles.

Averages can cross back and forth during a range. Review what price is doing before interpreting the crossing as a lasting change. Two averages from the same closing prices are related calculations, not two independent sources of evidence.

## When The Line Helps Less

A gap can put price far from an average still dominated by earlier closes. Sudden news and thin trading can create the same separation. A smooth line does not mean the market offers smooth execution or tight spreads.

Distance from an SMA does not prove that price must return immediately. Strong moves can remain separated from an average, and a return can happen through time spent trading sideways rather than a sharp reversal.

When comparing charts, match the period, timeframe, price source and included sessions. For a newly loaded chart, enough earlier bars must be available to calculate the requested window. An incomplete history can produce missing or platform-dependent initial readings.

## Check Your Understanding

**Why can the SMA rise when the latest close is unchanged?** A lower old close can leave the window while the unchanged new close enters.

**Is a 200 SMA on a one-minute chart the daily 200 SMA?** No. It uses one-minute inputs unless the chart explicitly displays a calculation from daily data.

**Does a rising SMA guarantee a pullback will hold?** No. The candles show whether the reaction low holds and recovery develops.

**Why can a crossover arrive late?** The averages respond to prices from the move that has already occurred.
