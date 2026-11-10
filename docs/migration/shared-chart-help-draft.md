# Market Charts help copy for the private chart release

Prepared with the chart repair; not published while the owner release hold is active. The existing public embedded chart stays available to other accounts. Present these instructions only with the new chart's availability.

## Open a chart

Enter a stock symbol in Market Charts and choose Open chart. In Scanners, choose a ticker's chart icon. Both locations use the same chart controls. Changing the stock keeps your preferred chart setup.

## Choose candles and history

Choose1m,5m,15m,1h,4h or1D above the chart. These choose the candle interval. Zoom to change how much time fits on screen. Pan left to load older history as needed. Older history can take a moment to load; try panning left again if a request fails.

During an active session, the open candle and volume can change as trades arrive. Completed candles can also be corrected later. A quiet stock can have no eligible trades during an interval. A carried-forward position preserves the time spacing; its crosshair description identifies it and does not report invented trading volume. The separate price guide identifies the latest eligible traded price.

## Add and remove indicators

Choose Indicators and add the study you want. For EMA or SMA, edit Length to the period you use, such as 9, 20, 50 or 200. Add the same type again to show another independently configured line. Its checkbox hides the study while keeping its settings; the trash icon removes it. Style changes each line’s color, width and pattern.

RSI offers its length and reference levels. MACD offers fast, slow and signal lengths. Bollinger Bands offers length, basis type and standard deviation. Optional smoothing adds a separate line; None leaves the original indicator on its own. Your choices remain saved when you change symbols or reopen the chart.

## Save your setup

Choose Chart settings to change candle style, chart theme and colors, default timeframe, timezone, grid, volume, scale and intraday trading sessions. Changes save automatically to your account. Look for Saved before leaving. If saving fails, the message explains how to retry. Your saved setup follows you when you reopen the chart or change symbols.

## Connections

Connecting or Reconnecting means the chart is restoring its live connection. If candles cannot load, choose Retry. Historical candles alone do not indicate that the live connection is healthy.

## Keep candles readable with indicators

An indicator can sit far from the current price after a strong move. Automatic scaling normally fits both the candles and the indicator, which can make candles look shorter. In Chart settings, enable Scale price chart only to size the price area from the candles. The indicator calculation stays the same; parts of its line can then sit outside the visible price area. Turn this option off to fit the indicators again. The choice saves with your chart setup.

## VWAP calculation and position

VWAP's Source selects the price used in its volume-weighted calculation. Its calculation timeframe can follow Chart or use another supported interval. When the calculation timeframe is higher than the chart, Wait for timeframe closes shows confirmed values at interval closes; turning it off allows the current value to develop as data arrives. Offset moves the plotted line by chart positions and does not move candles or add trading volume. These controls remain part of an unfinished private development draft until the full indicator work is accepted.

## VWAP bands

In Inputs, enable up to three VWAP band pairs and choose each multiplier. Standard deviation uses traded-volume weighting; Percentage measures the distance as a percentage ofVWAP. Style lets you change each band's line and its shaded fill separately. Hiding the mainVWAP line does not hide an enabled fill. ResetVWAP defaults restores the indicator's inputs and styling. This remains unpublished development help until the complete indicator release is accepted.

## VWAP values and labels

In Style, Precision changes the number of displayed decimal places; Default follows the chart's price precision. This does not round the calculation. Labels on price scale shows the latest plotted values beside the price axis. Values in status line shows values beside the indicator name inside the chart: move the crosshair to inspect that position, or move away to see the latest values. These controls save with the indicator; existing saved setups keep their previous appearance. This guide remains unpublished until the complete indicator work is accepted.

## Split and dividend anchors

VWAP's Anchor Period can reset at stock splits or dividend ex-dates. The line carries its calculation between events and resets when the next event reaches the chart. Before the first available event there is no event-anchored line. Missing event history does not fall back to Session. These options remain private development work awaiting the complete indicator review.

VWAP needs trading volume. If no volume data is available for its calculation, the chart explains why VWAP cannot display while keeping available price candles visible.
