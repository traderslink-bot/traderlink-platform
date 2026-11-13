# Market Charts help copy for the private chart release

Prepared with the chart repair; not published while the owner release hold is active. The existing public embedded chart stays available to other accounts. Present these instructions only with the new chart's availability.

## Open a chart

Enter a stock symbol in Market Charts and choose Open chart. In Scanners, choose a ticker's chart icon. Both locations use the same chart controls. Changing the stock keeps your preferred chart setup.

## Choose candles and history

Choose1m,5m,15m,1h,4h or1D above the chart. These choose the candle interval. Zoom to change how much time fits on screen. Pan left to load older history as needed. Older history can take a moment to load; try panning left again if a request fails.

During an active session, the open candle and volume can change as trades arrive. Completed candles can also be corrected later. A quiet stock can have no eligible trades during an interval. A carried-forward position preserves the time spacing; its crosshair description identifies it and does not report invented trading volume. The separate price guide identifies the latest eligible traded price.

## Add and remove indicators

Choose **Indicators** and open **Add or edit indicator**. Indicators already in your defaults appear first. EMA and SMA each have one entry. Use **Add EMA line** or **Add SMA line** to add lengths. Change visibility, length and color on the line itself. Use its gear to open source, smoothing, width and line style directly below that line. The trash icon opens a confirmation for deleting that line.

Expand **TraderLink presets** to see each setup’s title and intended use. An indicator starts with its default preset. **Load preset** replaces that indicator’s current settings. The EMA default uses 9- and 20-bar lines for intraday momentum, with a 20/50 alternative for slower trend context. SMA starts with 20 bars and offers a 20/50/200 daily setup. VWAP starts with a single session line and offers a session-band setup. RSI, MACD and Bollinger Bands start with their standard defaults.

Open **My presets**, enter a name, and choose **Save current setup** to save the active indicator and its lines. Choose **Load** to restore a saved setup after trying another preset. Presets save to your account. Deleting a preset leaves the current chart setup in place.

RSI offers its length and reference levels. MACD offers fast, slow and signal lengths. Bollinger Bands offers length, basis type and standard deviation. Optional smoothing adds a separate line; None leaves the original indicator on its own. Your choices remain saved when you change symbols or reopen the chart.

## Save your setup

Choose Chart settings to change candle style, chart theme and colors, default timeframe, timezone, grid, volume, scale and intraday trading sessions. The default timeframe is used when opening a new ticker from Search, adding a ticker with **+**, or adding a ticker in Multi-ticker. Changing the default keeps the timeframes of open charts. Changes save automatically to your account. Look for Saved before leaving. If saving fails, the message explains how to retry. Your saved setup follows you when you reopen the chart or change symbols.

## Connections

Connecting or Reconnecting means the chart is restoring its live connection. If candles cannot load, choose Retry. Historical candles alone do not indicate that the live connection is healthy.

## Keep candles readable with indicators

An indicator can sit far from the current price after a strong move. Automatic scaling normally fits both the candles and the indicator, which can make candles look shorter. In Chart settings, enable Scale price chart only to size the price area from the candles. The indicator calculation stays the same; parts of its line can then sit outside the visible price area. Turn this option off to fit the indicators again. The choice saves with your chart setup.

## VWAP calculation and position

VWAP's Source selects the price used in its volume-weighted calculation. Its calculation timeframe can follow Chart or use another supported interval. When the calculation timeframe is higher than the chart, Wait for timeframe closes shows confirmed values at interval closes; turning it off allows the current value to develop as data arrives. Offset moves the plotted line by chart positions and does not move candles or add trading volume. These controls remain part of an unfinished private development draft until the full indicator work is accepted.

## VWAP bands

In Inputs, enable up to three VWAP band pairs and choose each multiplier. Standard deviation uses traded-volume weighting; Percentage measures the distance as a percentage ofVWAP. Style lets you change each band's line and its shaded fill separately. Hiding the mainVWAP line does not hide an enabled fill. Load the Session VWAP preset to restore the default inputs and styling. This remains unpublished development help until the complete indicator release is accepted.

## VWAP values and labels

In Style, Precision changes the number of displayed decimal places; Default follows the chart's price precision. This does not round the calculation. Labels on price scale shows the latest plotted values beside the price axis. Values in status line shows values beside the indicator name inside the chart: move the crosshair to inspect that position, or move away to see the latest values. These controls save with the indicator; existing saved setups keep their previous appearance. This guide remains unpublished until the complete indicator work is accepted.

## Split and dividend anchors

VWAP's Anchor Period can reset at stock splits or dividend ex-dates. The line carries its calculation between events and resets when the next event reaches the chart. Before the first available event there is no event-anchored line. Missing event history does not fall back to Session. These options remain private development work awaiting the complete indicator review.

VWAP needs trading volume. If no volume data is available for its calculation, the chart explains why VWAP cannot display while keeping available price candles visible.

## Ticker views and Multi-ticker — private review draft

Search replaces the selected ticker. Use **+** immediately beside Search to add another ticker view while keeping the current one. **Multiview** is available even on the initial single chart, so you can add up to four timeframes. The chart tabs show open tickers and **Multi-ticker**. Scroll the tab row sideways to reach additional tickers. Each view can show up to four charts. Tap a ticker to see only that ticker. Use the normal timeframe control for one chart, or use **Multiview** to save up to four timeframes.

**Multi-ticker** opens its own arrangement of up to four charts in any mix of ticker and timeframe. When started from the tab row, setup suggests up to four charts from the open ticker views, including the selected ticker. It saves only when you choose **Apply**. Edit it in **Multiview**; those changes do not affect the ticker views. Every configured chart is shown in the selected view, with vertical scrolling as needed. Portrait uses one column. Landscape automatically uses two columns when a view has multiple charts. One chart uses the full width. There is no Tabs/Scroll display choice; the ticker buttons above the charts switch views. Desktop uses its chart grid. Only the active view runs.

Use **×** on the active ticker tab to close that ticker view. Use **×** on the active Multi-ticker tab to return to your previous ticker. To reopen your saved setup, choose **Multiview → Multi-ticker → Open Multi-ticker**. The tab is hidden until you reopen it or reload the page. If the row is hidden for a single saved ticker, **Multiview → Close ticker** is available. Earlier saved views are available from **Multiview → Earlier saved views** when present. Closing the last view returns to the selected ticker and timeframe in a plain chart. The scanner drawer retains its separate configuration.

## Compact mobile controls and Focus mode

On the main chart page, tap the ticker/search control to find a symbol. The Multiview icon opens the chart arrangement settings. Each chart has one line showing its ticker, current timeframe and options menu. Tap the timeframe for a quick change; the options menu provides Timeframe, Indicators and Appearance. The **Multiview** grid icon beside the gear opens the same editor as the dashboard icon, starting on the current view. When multiple charts are open, use the **×** at the right end of a chart’s bar to close it.

Tap the expand icon beside the layout control to enter Focus mode. The chart area fills the viewport and hides the normal dashboard/workspace bars. Small navigation and exit buttons remain at the lower right. Navigation opens the usual dashboard page menu; Exit restores normal chart controls. Escape also exits Focus mode. Desktop and scanner-drawer controls retain their existing layout.

## Combined mobile navigation and chart toolbar

The main chart's mobile page toolbar combines dashboard navigation, ticker/search, Multiview, Focus and dashboard options. Open the page's options menu for Notifications, Account and Help; these use the existing dashboard actions. Ticker names and Multi-ticker share a row below the toolbar in portrait. In mobile landscape they sit in the middle of the toolbar. Swipe the tabs sideways when they exceed the available space. Each chart keeps its own timeframe control. On desktop, Search, **+**, the chart tabs and **Multiview** sit in the dashboard header. Swipe or scroll the tabs sideways when they exceed the available width.

The mobile page menu uses the familiar **account/user icon**; it contains Account, Notifications and Help. Each compact chart uses the **gear icon** for its chart options. Both retain the existing 44px tap targets.

## Remembering open chart views

Each open ticker/timeframe remembers its zoom, horizontal position and price scale in this browser. Switching ticker tabs, visiting another dashboard page or reloading restores that view. The latest candles still load normally; hidden ticker charts are not kept rendering. Closing a timeframe removes its view snapshot while preserving its sibling charts; closing a ticker removes all its views. Replacing a ticker starts a new view. Manual price scaling is revalidated against the price-adjustment date and scale settings so an old scale cannot hide adjusted prices. Browser storage restrictions may limit persistence to the current document. No candles are saved in this view snapshot.


## Initial chart zoom

New charts start with readable candle spacing for their timeframe and available width. A wider chart shows more candles. Your saved zoom still takes priority. To inspect a fresh default, close the chart and reopen it; switching away and back restores your saved view.


The top toolbar’s **Multiview** button opens settings for the view you are currently watching. Use the ticker tabs and **Multi-ticker** inside the settings dialog to edit any open view while your chart stays selected. **Apply** saves the changes together. **Cancel** discards the draft changes.

Choose **Multi-ticker** inside Multiview to set it up even when only one ticker is open. Edit a symbol to replace it, or use **+ Add ticker** to add another chart. The chart tab row appears once you add a second ticker or save a Multi-ticker setup. Tap a tab in that row to switch charts.


In Multiview, use **+ Timeframe** to add a chart and its remove button to take it out. Multi-ticker also offers **+ Add ticker**. The selected timeframes are shown directly, with a note when the four-chart limit is reached.

Use **Chart defaults** to edit indicator settings and presets for your account. The red **Remove from defaults** button asks for confirmation before removing the entire indicator from your defaults for Charts and Scanners. Under **This chart**, use the switch to turn an indicator on or off and **Show values** to control its readout on the open chart.
