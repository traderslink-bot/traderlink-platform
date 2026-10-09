---
title: "VWAP"
slug: "/academy/vwap/"
meta_description: "Learn how session VWAP is calculated and how to read trends, pullbacks, reclaims and failed reactions."
status: "ready"
content_type: "academy_lesson"
product_area: "Education"
availability: "educational"
academy_course: "Technical Indicators And Tools"
academy_module: "VWAP And EMA"
academy_order: 2
recommended_previous: "/academy/trading-indicators/"
recommended_next: "/academy/ema/"
---

# VWAP

VWAP stands for volume-weighted average price. It combines traded prices with their volumes to show an average price for a selected trading window. A price associated with more traded shares has more influence on that average.

This lesson focuses on session VWAP: the running average for the trading session included in the calculation. Day traders use it to compare current price with where trading has taken place during that session and to watch how price behaves around that reference.

If a stock trades at $4.30 while session VWAP is $4.20, its current price is above the session's volume-weighted average. That tells us a relationship between current price and the average. It does not tell us that every buyer is profitable, that the stock is cheap or expensive, or that the next candle will rise.

## How Volume Changes The Average

Start with two transactions:

| Price | Shares traded | Total traded value |
| --- | ---: | ---: |
| $4.00 | 100 | $400 |
| $4.20 | 300 | $1,260 |
| Total | 400 | $1,660 |

Divide total traded value by total shares: $1,660 ÷ 400 = **$4.15**.

If we simply averaged the two prices, the result would be $4.10. VWAP is closer to $4.20 because three times as many shares traded at that price. Volume weighting accounts for that difference.

Now another 200 shares trade at $4.30, adding $860. The cumulative value becomes $2,520 across 600 shares. VWAP becomes **$4.20**. The latest transaction price is $4.30, but the average still includes the earlier transactions.

“Cumulative” means the totals keep building from the calculation's starting point. Each new transaction adds traded value and shares before the average is updated.

Charting platforms may approximate this using bar data. One method uses a bar's typical price—the high, low and close added together and divided by three—and multiplies it by the bar's volume. Those values accumulate across the selected window. Other inputs and data feeds can produce somewhat different displayed values. Our transaction table explains exact trade weighting; it is not a claim that every chart processes each individual trade in that way.

![How the traded share quantities change the weighted average.](/academy/images/technical-indicators/vwap-weighted-average.svg)

## Why Traders Watch VWAP

VWAP provides a reference tied to both price and traded volume. It helps answer whether current price is above or below the average associated with that session's trading.

During an upward move, traders may watch whether pullbacks remain above VWAP or repeatedly recover it. During a decline, they may watch whether bounces fail beneath it. These are ways to examine price behavior around a consistent reference rather than drawing a new line for every candle.

VWAP is also used as an execution benchmark. For example, a buyer can compare a purchase price with the VWAP over an agreed execution window. Buying below that benchmark means paying less than that window's volume-weighted average. It does not prove the purchase will be profitable afterward. A seller's comparison has the opposite direction, and changing the comparison window changes the benchmark.

A VWAP line does not show the current order book, resting buy orders or a price that must hold. Its usefulness comes from the calculation and the observed reaction around it.

## Which Session Is Included?

Session VWAP restarts when its configured session starts. It is different from a calculation that continues across several days or starts at a manually selected event.

For U.S. stocks, the regular session runs from 9:30 a.m. to 4:00 p.m. Eastern Time on a normal full trading day. Trading before and after those hours is extended-hours trading. A VWAP that includes extended-hours trades can differ from one using regular-session trades alone.

Suppose 1,000 shares trade at $4.00 before the regular open and another 1,000 trade at $4.40 after it. Including both groups gives $8,400 ÷ 2,000 = **$4.20**. Using only the regular-session group gives **$4.40**. Neither result is an arithmetic error; the inputs differ.

These deliberately small totals demonstrate the difference. An actual stock can have many prices and changing volumes in each session segment.

Before comparing two VWAP lines, check the calculation's start, included trading hours and price source. A five-minute chart and a one-minute chart may also produce small differences when their VWAPs are calculated from different representative bar prices. A platform using the same underlying trade data can produce matching values at matching times.

Near the session's start, relatively little trading has accumulated. A new trade can therefore have more influence than the same trade would have after much more volume has accumulated. This helps explain changes in the line; it does not predict the stock's direction.

![The same trades give different averages when the included session changes.](/academy/images/technical-indicators/vwap-session-inputs.svg)

## Reading Price And VWAP Together

Price above a rising VWAP, with advances making new highs and pullbacks holding higher lows, describes an upward-moving session. A higher low is a pullback that stays above the earlier pullback low.

Price below a falling VWAP, with weaker bounces and new lows, describes declining price behavior. The VWAP relationship supports that description, but the candles show whether the decline is actually continuing.

When price repeatedly crosses a comparatively flat VWAP, the stock may be trading sideways. Buying every move above the line can produce repeated entries that quickly reverse because no sustained advance has developed.

Price location and VWAP slope are separate observations. Price can briefly cross above VWAP while the line still falls. It can remain above VWAP while a recent push weakens near resistance. Read both the line and the sequence of candles.

![Calculated VWAP alongside rising, falling and sideways price sequences.](/academy/images/technical-indicators/vwap-trend-and-range.svg)

## Pullbacks Toward VWAP

A pullback is a move against the recent direction. If price has been rising above VWAP, a pullback toward it gives traders a place to watch whether the upward move is still being supported by price behavior.

The useful observation is the reaction: does the decline slow, form a low and recover, or continue through the area? A candle touching VWAP is only a touch. A later recovery and a reaction low that remains intact add information.

For example, price might return toward VWAP, close above it, and then rise above the pullback candle's high. That sequence is different from touching the line and immediately breaking the pullback low. Nearby horizontal support and resistance still matter because they can affect how much room the move has.

VWAP itself moves as trading continues. A reaction low is a recorded price level; the average is a changing calculation. They should not be treated as the same thing when planning where a trade idea fails.

## Reclaims And Failed Reclaims

A reclaim occurs when price moves back above VWAP after trading below it. The crossing is the reclaim. A later pullback that stays above the area is additional information about whether that recovery is lasting.

Imagine a stock spending the first part of the session below VWAP. Price stops making new lows, rises through the line and later pulls back without losing its reaction low. A renewed upward push gives a more developed recovery sequence than a single crossing.

Now compare a failed reclaim: price briefly crosses above VWAP, runs into resistance and falls back below. The stock did cross the line, but it could not sustain the move. Repeatedly buying the same crossing without a change in structure can lead to repeated losses in a range.

Volume can help describe participation during either sequence. An increase in traded shares does not guarantee the reclaim will hold. Price must still show what happened after the increased activity.

![A VWAP reclaim that recovers compared with one that fails.](/academy/images/technical-indicators/vwap-reclaim-hold-fail.svg)

## Rejection Beneath VWAP

A rejection occurs when price reaches an area but cannot sustain its move through it. A stock below VWAP might bounce toward the line, briefly trade above it, close back below and then fall beneath the bounce low.

That sequence shows a failed recovery around VWAP. It does not establish unlimited downside: support below the bounce may still interrupt the decline.

This is useful even for traders who do not short stocks. A weak bounce beneath VWAP can help explain why a falling stock has not yet established a stronger recovery. Understanding a bearish reaction is different from having the permissions, borrow availability and execution plan needed to sell short.

## A Reclaim With A Written Trade Plan

Consider a hypothetical five-minute regular-session chart. At the decision, VWAP is $4.20. Price has crossed above it, pulled back to $4.18 and begun rising again. Earlier resistance is marked at $4.40.

A trader considers an entry at $4.25. The $4.18 reaction low matters because the idea depends on that pullback holding. The trader chooses a $4.17 stop reference below that low. The choice follows this particular chart; it is not a rule to place every stop one cent below a low or a VWAP line.

With 500 shares, the entry-to-stop distance is $4.25 − $4.17 = **$0.08 per share**, giving **$40** of planned price risk. The distance to $4.40 is **$0.15 per share**, or **$75** before costs. Buying 500 shares at $4.25 requires $2,125 of position value, which is different from the planned loss.

The entry also needs a condition. In this example, the trader waits for the pullback to recover rather than buying just because price is near VWAP. If price breaks the reaction low before the entry condition occurs, the described setup has changed.

If an entry fills, a stop reference still is not a guaranteed exit price. A stop-market order can fill worse than the reference during fast movement; a stop-limit order can fail to fill. Spread, fees and slippage—the difference between an expected and actual fill—can change the result.

If the stock later reaches the planned resistance, the trader follows the written exit approach. If the pullback fails instead, the trader follows the loss plan. The indicator helps explain the setting for the trade; it does not replace those decisions.

## Why A Later Entry Can Be Much Worse

Suppose the same stock has already risen to $4.38. A trader now considers buying 500 shares while retaining the same $4.17 stop reference and $4.40 target.

The planned price risk is $0.21 × 500 = **$105**. The remaining target distance is only $0.02 × 500 = **$10** before costs. Price is still above VWAP, but that relationship has not preserved the earlier entry's risk and available room.

This is extension: price has moved farther from the nearby structure supporting the idea. An indicator can continue looking constructive while the proposed entry becomes harder to justify. Moving the stop farther away after entering would increase the planned loss rather than repair the late entry.

![The same stop and resistance with an earlier and later proposed entry.](/academy/images/technical-indicators/vwap-entry-and-extension.svg)

## When VWAP Helps Less

Repeated crossings during sideways trading make it harder to interpret each crossing as a meaningful change. Look at the range boundaries and whether price sustains movement beyond them.

Thin trading can produce sharp moves and wide spreads even near VWAP. The line is an average of completed trading, not a promise that enough shares are available at the displayed price.

News can also change price quickly while the average still reflects earlier trading. A stock can move far from VWAP and remain far from it. Distance alone does not establish that it must return that day or that a reversal trade is ready.

Some charts offer VWAP bands, lines above and below the average based on a chosen distance calculation. Those bands are different from the central average and depend on their settings. They are not guaranteed reversal points or targets.

Anchored VWAP starts from a chosen point, such as an event or bar, rather than the usual session boundary. Changing the starting point changes which prices and volumes enter the average, so the resulting line can differ from session VWAP.

## VWAP And Price Averages

VWAP weights price by traded volume over its selected window. An exponential moving average, covered next, weights successive input prices by recency. The two calculations can provide different references even on the same chart.

When both sit near the same price, their agreement is worth understanding, but it is not two guarantees of support. The next candles still show whether the price reaction holds.

## Check Your Understanding

**Why is the average of the first two transactions $4.15 instead of $4.10?** More shares traded at $4.20, so that price receives more weight.

**Why might a regular-session VWAP differ from an extended-hours VWAP?** They include different trades and can start at different times.

**Is a reclaim the same as a confirmed hold?** No. Crossing back above is the reclaim; later behavior shows whether it lasts.

**Why can buying above VWAP still be a poor entry?** The entry may be far from meaningful support and close to resistance, leaving little room relative to planned risk.
