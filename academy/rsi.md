---
title: "RSI: Momentum, Overbought And Oversold"
slug: "/academy/rsi/"
meta_description: "Learn how RSI measures momentum, how its calculation and periods work, and how to read overbought, oversold and divergence on stock charts."
status: "ready"
content_type: "academy_lesson"
product_area: "Education"
availability: "educational"
academy_course: "Technical Indicators And Tools"
academy_module: "Momentum Indicators"
academy_order: 5
recommended_previous: "/academy/sma/"
recommended_next: null
---

# RSI: Momentum, Overbought And Oversold

RSI stands for Relative Strength Index. It compares the size of upward and downward changes in closing prices, smooths those changes, and expresses the relationship on a scale from 0 to 100. Traders use it to study momentum: how strongly recent closing prices have been moving upward or downward.

RSI is an oscillator, meaning its reading moves within a bounded scale. It normally appears in its own panel below the price chart. The stock's candles show actual prices; the RSI panel shows a calculation from changes in those prices.

Despite its name, RSI does not compare the stock's performance with another stock or an index. It also does not show the percentage of traders buying. A reading of 70 is an indicator value, not a $70 share price or evidence that 70% of participants are bullish.

## Reading The RSI Panel

The usual reference lines are **30, 50 and 70**. They help describe the calculation, but they are not automatic order instructions.

A reading above 50 means the smoothed upward changes exceed the smoothed downward changes. Below 50, downward changes exceed upward changes. At 50, the two smoothed averages are equal, provided they are nonzero.

Above 70 is conventionally called overbought; below 30 is called oversold. These words can be misleading if read literally. They describe strong upward or downward momentum relative to the calculation's recent history, not whether the business is fundamentally overpriced or underpriced.

Price and RSI must be read together. A stock can trade above an earlier high while its RSI is lower than it was during the first push. Another can remain in a decline while RSI lifts from a very low reading. The indicator describes the changes in momentum; the candles show whether price has actually reversed.

## What Goes Into The Calculation

A common setting is **14 periods**. On a five-minute chart, it uses changes between five-minute closes. On a daily chart, it uses changes between daily closes. A period is a chart interval, not automatically a day.

Start with the difference between each close and the previous close. An increase goes into the gain column. A decrease goes into the loss column as a positive amount. An unchanged close contributes zero to both.

For example, a move from $3.00 to $3.10 is a $0.10 gain. A move from $3.10 to $3.05 is a $0.05 loss. Candle color alone is not the calculation: color normally compares a candle's close with its open, whereas RSI compares its close with the preceding close.

The daily chart below begins on March 2, 2026. Its first 14 closing-price changes total $0.70 in gains and $0.35 in losses. To obtain 14 changes, we need 15 closing prices: the first close provides the starting comparison.

| Initial calculation | Result |
| --- | ---: |
| Average gain: $0.70 ÷ 14 | $0.05 |
| Average loss: $0.35 ÷ 14 | $0.025 |
| Relative strength: $0.05 ÷ $0.025 | 2 |

Both averages divide by all 14 periods, including zeros. We do not divide gains only by the number of rising closes or losses only by the number of falling closes.

The conversion is **RSI = 100 − 100 ÷ (1 + relative strength)**. With relative strength of 2, RSI is 100 − 100 ÷ 3, or **66.67** when rounded to two decimals.

The upward changes total twice the downward changes in this starting example. That explains the reading above 50. It does not predict whether the next close will rise.

![Daily candles show the close-to-close gains and losses, with RSI 66.67 and the next updated reading of 60.47 below.](/academy/images/technical-indicators/rsi-calculation.svg)

## How RSI Updates After The First Reading

The standard method developed by J. Welles Wilder smooths subsequent gains and losses. For a 14-period calculation, multiply the previous average by 13, add the newest gain or loss, then divide by 14.

Suppose the next close falls by $0.10. Its gain contribution is zero and its loss contribution is $0.10. Starting from the averages above:

| Update | Calculation |
| --- | --- |
| New average gain | ($0.05 × 13 + $0.00) ÷ 14 = $0.046429 approximately |
| New average loss | ($0.025 × 13 + $0.10) ÷ 14 = $0.030357 approximately |

The ratio is approximately 1.529412, producing **RSI 60.47**. The new loss pulls RSI down, but it does not erase the earlier changes. Wilder's smoothing carries diminishing influence from previous history, so standard RSI is not simply a fresh equal-weight calculation of the latest 14 changes on every bar.

Keep full precision during the calculation and round the displayed result afterward. Rounding each intermediate average can change the final reading, especially with small share-price changes.

If average loss is zero while average gain is positive, RSI reaches 100. If average gain is zero while average loss is positive, it reaches 0. If both are zero in an entirely flat starting sequence, the ratio is undefined; charting implementations can handle that case differently. Initialization and available earlier history can also explain small differences between charts.

You do not need to calculate every candle by hand. Understanding the ingredients prevents treating the line as an unexplained signal.

## Why Traders Use RSI

RSI makes it easier to compare the balance of gains and losses across parts of a move. The candles show where price went; RSI adds a consistent way to compare the strength of their closing-price changes.

During an advance, a trader might examine whether each new push produces strong upward momentum and whether pullbacks are becoming more forceful. If a later push reaches a higher price with a weaker RSI reading, that is a different relationship from an advance where momentum also strengthens.

During a decline, RSI can show whether downward changes still dominate or whether their influence is easing. Easing downward momentum can happen before a recovery, during a temporary bounce, or while the stock continues making lower lows. Price behavior distinguishes those situations.

RSI can also help describe a range. Momentum may increase near the upper part of the range and weaken near its lower part. That does not mean the boundaries are guaranteed to hold; a breakout changes the setting in which those readings occurred.

## Overbought Does Not Mean Price Must Fall

Imagine a stock moving upward through repeated higher highs and higher lows. Large upward closing-price changes outweigh its smaller pullbacks. RSI moves above 70 and stays there while price continues advancing.

The high reading is consistent with that strength. Selling or shorting solely because RSI first exceeds 70 treats strong momentum as proof that the move has ended. The calculation does not establish that.

A trader already holding a position may use the reading as a reason to watch how the next push behaves, while continuing to manage the trade using its planned price levels. If price becomes extended beneath resistance, that location matters whether RSI is 68 or 78.

RSI can also fall back below 70 while price pauses rather than collapses. Smaller gains or additional losses change the balance of its smoothed inputs. Crossing down through 70 describes that change; it does not determine how far price will decline.

## Oversold Does Not Mean A Stock Is Safe To Buy

The downward counterpart is just as important. A stock can fall repeatedly while RSI remains below 30. Losses continue dominating gains, and attempts to bounce may not repair the decline.

Buying simply because the reading looks low can mean entering before a reaction low has formed or before the stock has stopped breaking support. A reading of 20 can become a reading of 15 as further losses arrive.

A more developed recovery has observable price behavior: selling stops making immediate progress, a low forms, price recovers a nearby level, and a later pullback holds. RSI may rise during that sequence, but it does not create the low or guarantee the recovery.

![A rising trend stays above RSI 70; a declining trend stays below RSI 30.](/academy/images/technical-indicators/rsi-persistent-trends.svg)

## RSI In A Sideways Range

Suppose a stock has repeatedly turned near the same support and resistance areas. A drop toward support may bring RSI toward or below 30. A bounce toward resistance may bring it toward or above 70.

Those readings are more useful when they accompany an actual reaction at the price boundary. Price reaching support and recovering is different from price breaking support while RSI remains low. The earlier range cannot be assumed to continue after its lower boundary fails.

Likewise, a high reading near resistance can accompany a rejection or a breakout that continues. Wait to see what the candles show instead of using the number to decide in advance which outcome must occur.

This is why the same 30/70 references behave differently in a persistent trend and a range. The calculation is unchanged; the surrounding price behavior is different.

## Periods And Timeframes

Fourteen periods is a common starting point, not a mandatory setting. A shorter setting, such as 7, gives each new change more influence in Wilder's update. A longer setting, such as 21, gives it less.

Shorter settings generally respond more sharply to recent fluctuations. They can reveal a change sooner and produce more frequent extreme readings or reversals. Longer settings usually smooth more of those changes while responding later. Changing the setting changes what the line summarizes; it does not make the next trade more certain.

A 14 RSI on a one-minute chart and a 14 RSI on a five-minute chart use different closes. A brief one-minute selloff can affect the first without producing an equally strong reading on the second. The five-minute result is recalculated from five-minute changes, not an average of the one-minute RSI values.

When comparing readings, keep the price source, timeframe, period and included sessions consistent. Earlier bars contribute through smoothing. An ordinary RSI does not reset at the opening bell, and extended-hours bars can change its history.

![RSI 7 and RSI 14 calculated from the same five-minute closing prices.](/academy/images/technical-indicators/rsi-period-comparison.svg)

## Divergence: Price And Momentum Disagree

Divergence means price and the indicator do not make the same directional comparison between two swings.

A **bearish divergence** occurs when price makes a higher high while RSI makes a lower high. The stock reached farther upward, but the momentum reading was weaker than at the previous comparable peak.

A **bullish divergence** occurs when price makes a lower low while RSI makes a higher low. The stock reached farther downward, but the momentum reading was less weak than at the previous comparable trough.

Compare corresponding swings, not an arbitrary price high with an unrelated RSI point. RSI normally uses closing-price changes, while a price swing may be identified by its wick high or low. State which price observations you are comparing and inspect the indicator at those same bars.

Divergence is a reason to examine the move more closely, not proof that it will reverse. A trend can continue through several weakening momentum comparisons. Price might pause, make another new high or low, or reverse later.

For bearish divergence, watch whether the subsequent pullback loses meaningful support or whether another upward push continues. For bullish divergence, watch whether price recovers resistance and holds a higher pullback low rather than immediately continuing downward. Those are price developments after the comparison, not facts established by divergence alone.

![Price makes a higher second peak while RSI has a lower reading, followed by another upward push.](/academy/images/technical-indicators/rsi-divergence-continuation.svg)

## A Recovery With Defined Risk

Consider a five-minute chart after a decline. RSI has been below 30. Price forms a low at $3.00, bounces and later pulls back without losing that low. The next upward move reaches $3.10, while RSI has recovered from its earlier low. Resistance from an earlier reaction is marked at $3.40.

A trader considers entering at $3.10 after the recovery begins, with a stop reference at $2.98 beneath the reaction low. The idea depends on the $3.00 low holding; it does not depend on RSI remaining above an arbitrary number.

For 400 shares, $3.10 − $2.98 = $0.12 per share, or **$48 of planned price risk**. The $0.30 distance to $3.40 offers **$120 before costs**. The position costs $1,240 to purchase, which is different from its planned loss.

In one sequence, the low holds and the recovery advances. In another, the bounce fades, price breaks $3.00 and reaches the stop reference. The earlier low RSI existed in both. Price determines whether the proposed recovery held.

A stop-market fill can differ from $2.98, and costs affect the final result. RSI supplies no guarantee about execution. Moving the stop farther away because RSI “still looks oversold” increases risk without restoring the broken price structure.

![The same initial recovery develops in one sequence and fails in another.](/academy/images/technical-indicators/rsi-recovery-hold-fail.svg)

## Common Reading Mistakes

Treating 70 as a sell button and 30 as a buy button ignores persistent trends and broken range boundaries. Interpreting a move through 50 as an automatic entry ignores where price sits relative to support, resistance and the planned stop.

Counting green candles instead of measuring close-to-close changes can misread the calculation. A small red candle can still close above the previous candle's close after a gap, giving RSI a gain input.

A current-bar reading can change before the close. An apparent divergence or threshold crossing seen halfway through the interval may no longer exist at completion. Even a completed reading can be followed by an unexpected move.

A very high RSI does not describe traded volume, liquidity or the available spread. It can appear on a thin stock with difficult execution. Those conditions need their own observations rather than being inferred from momentum.

## Check Your Understanding

**Does RSI 70 mean 70% of traders are buying?** No. It is a scaled relationship between smoothed upward and downward closing-price changes.

**Why can RSI remain above 70 during an advance?** Upward changes can continue dominating losses while price keeps rising.

**Does bullish divergence establish a completed reversal?** No. It describes a comparison between price and momentum; subsequent price behavior shows whether recovery develops.

**What defines risk in the recovery example?** The entry, the reaction low, the chosen stop reference and the share quantity. RSI adds momentum context.
