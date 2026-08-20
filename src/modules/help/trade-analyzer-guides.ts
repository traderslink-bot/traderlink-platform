import type { HelpGuide } from "./help-guide-types";

export const TRADE_ANALYZER_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  {
    slug: "overview",
    title: "Overview",
    description: "Learn what the Trade Analyzer does, where it appears and which account details make its results accurate.",
    sections: [
      {
        id: "what-it-is",
        title: "What the Trade Analyzer is",
        summary: "Replay a saved trade and compare its recorded price path with the execution decisions.",
        keywords: ["trade analyzer", "chart replay", "day trade analysis", "historical analytics"],
        blocks: [
          { kind: "paragraph", text: "The Trade Analyzer combines your exact Trade Tracker executions with supported Moomoo candles. Inside Daily Trade Tracker it replays one selected trade and explains its entries, exits, price path and completed candle patterns. Day Trade Analysis compares saved Analyzer results across eligible day trades." },
          { kind: "table", columns: ["Area", "Purpose"], rows: [
            ["Daily Trade Tracker", "Review one trading day, select a ticker and trade, replay the chart, inspect executions and save notes, tags and rules."],
            ["Trade Analyzer", "The reusable chart, execution analysis, Green-to-red analysis and candle-pattern capability."],
            ["Day Trade Analysis", "Long-term comparisons over eligible day trades that already have saved Analyzer results."],
            ["Analytics", "Regular Trade Tracker analytics over supported historical trading facts. It does not share the Analyzer eligibility population."],
          ] },
          { kind: "callout", title: "Recorded evidence, not a signal", text: "The Analyzer describes what happened in saved executions and completed candles. It does not predict the next move or give investment advice." },
        ],
      },
      {
        id: "accurate-executions",
        title: "Accurate executions matter",
        summary: "Use the exact date, time including seconds, price and quantity shown by the broker.",
        keywords: ["execution time", "seconds", "price", "quantity", "manual entry"],
        blocks: [
          { kind: "paragraph", text: "The chart places each buy and sell at its recorded timestamp and price. A wrong minute can attach the execution to the wrong candle; wrong seconds can change which completed evidence was available before the fill. A wrong price or quantity changes weighted entries, exits, P/L paths and Green-to-red calculations." },
          { kind: "paragraph", text: "If you correct an execution, TraderLink refreshes the affected trade so the chart and analysis stay aligned with the corrected Trade Tracker facts." },
        ],
      },
      {
        id: "moomoo-account",
        title: "Moomoo account requirements",
        summary: "Separate free chart-data access from broker execution importing.",
        keywords: ["free moomoo account", "cash account", "margin account", "execution import", "broker connection"],
        blocks: [
          { kind: "callout", title: "A free Moomoo account is enough for supported chart data", text: "You can create and connect an ordinary free Moomoo account without opening a cash or margin trading account. That connection can unlock supported chart replay and Analyzer market data." },
          { kind: "paragraph", text: "Automatic Moomoo execution imports are separate. They require a supported Moomoo trading account that can share trading history. If your connected account cannot import executions, you can still enter them manually or use supported statement imports." },
        ],
      },
      {
        id: "current-scope",
        title: "Current day-trade scope",
        summary: "Use the current Analyzer for supported day trades while Swing analysis remains separate future work.",
        keywords: ["day trade", "swing trade", "future", "eligibility"],
        blocks: [
          { kind: "paragraph", text: "The current written analysis and Day Trade Analysis pages are designed for day trades. Swing Trade Analysis will use a separate population, multi-session measurements, gaps and higher timeframes when it is built." },
        ],
      },
    ],
  },
  {
    slug: "chart-replay",
    title: "Chart replay",
    description: "Use candles, executions, indicators, timeframes, pattern labels and chart controls inside Daily Trade Tracker.",
    sections: [
      {
        id: "candles-and-activity",
        title: "Candles, volume and turnover",
        summary: "Read the open, high, low, close and activity recorded for each interval.",
        keywords: ["candlestick", "open high low close", "volume", "turnover"],
        blocks: [
          { kind: "table", columns: ["Fact", "Meaning"], rows: [
            ["Open / High / Low / Close", "The first, highest, lowest and final traded price represented by that candle."],
            ["Volume", "The number of shares traded during the candle."],
            ["Turnover", "The traded dollar value supplied by Moomoo for the candle. It helps compare activity across differently priced stocks."],
          ] },
          { kind: "paragraph", text: "Hover or select the chart to inspect a candle. Saved server-side candles are reused when another eligible replay needs the same symbol, date and interval." },
        ],
      },
      {
        id: "execution-markers",
        title: "Buy and sell markers",
        summary: "Connect each numbered fill to its exact timestamp and price.",
        keywords: ["buy marker", "sell marker", "execution label", "leader line", "shares"],
        blocks: [
          { kind: "paragraph", text: "Buy 1, Buy 2, Sell 1 and later labels follow execution order. A leader line anchors the label to the exact execution price inside its candle. Select or hover a marker to see the exact time, shares and price." },
          { kind: "paragraph", text: "A ticker keeps one chart. Selecting Trade 2 or another trade replaces the displayed trade and its markers rather than stacking a separate chart for every trade." },
        ],
      },
      {
        id: "indicators",
        title: "Session VWAP and EMA 9",
        summary: "Understand the two reference lines drawn on supported chart views.",
        keywords: ["session vwap", "ema 9", "indicator", "timeframe"],
        blocks: [
          { kind: "table", columns: ["Indicator", "How it is used"], rows: [
            ["Session VWAP", "Volume-weighted average price from the start of the supported session. The Analyzer uses the saved session calculation consistently for execution comparisons."],
            ["EMA 9", "Nine-candle exponential moving average for the selected chart timeframe. A 5-minute EMA 9 uses different candles from a 1-minute EMA 9."],
          ] },
        ],
      },
      {
        id: "timeframes-and-controls",
        title: "Timeframes and chart controls",
        summary: "Switch views and navigate without trapping ordinary page scrolling.",
        keywords: ["1 minute", "5 minute", "15 minute", "1 hour", "zoom", "pinch", "scroll"],
        blocks: [
          { kind: "table", columns: ["View", "Purpose"], rows: [
            ["1 minute", "Exact execution timing, one-minute patterns and complete 1-minute written trade analysis."],
            ["5 minute", "Five-minute candles, EMA 9, patterns and a separate complete 5-minute written analysis."],
            ["15 minute", "Wider intraday chart context. It does not replace the written 1-minute or 5-minute analysis."],
            ["1 hour", "Broad chart context for the complete intraday move."],
          ] },
          { kind: "bullets", items: [
            "Use the chart plus and minus controls to zoom.",
            "On desktop, hold Ctrl or Command while using the mouse wheel over the chart; an ordinary wheel scroll continues down the page.",
            "On mobile, use pinch zoom and horizontal movement inside the chart. Ordinary vertical movement continues to scroll the page.",
            "Changing timeframe rebuilds candles, EMA 9 and detected patterns, so the displayed evidence can change.",
          ] },
        ],
      },
      {
        id: "pattern-labels",
        title: "Candle-pattern labels",
        summary: "Use short chart labels and the Candle patterns key without treating them as signals.",
        keywords: ["candle patterns", "pattern key", "labels", "legend"],
        blocks: [
          { kind: "paragraph", text: "Short labels and leader lines identify completed patterns near the relevant candle. On mobile, expand Candle patterns to read the key. Full definitions and confirmation rules are in the Candle patterns guide." },
        ],
      },
    ],
  },
  {
    slug: "entry-exit-analysis",
    title: "Entry & exit analysis",
    description: "Understand individual fills, combined trade results and long-term entry and exit comparisons.",
    sections: [
      {
        id: "individual-executions",
        title: "Individual execution analysis",
        summary: "Select View analysis beside any execution to examine that exact fill.",
        keywords: ["view analysis", "execution analysis", "entry analysis", "exit analysis", "fill"],
        blocks: [
          { kind: "paragraph", text: "View analysis opens the saved analysis for that buy or sell. Long positions normally treat buys as entries/adds and sells as partial/final exits; Short positions reverse those roles." },
          { kind: "table", columns: ["Result", "What it tells you"], rows: [
            ["Execution", "Exact time including seconds, quantity and price."],
            ["Candle location and precision", "Where the fill sat inside the candle range and how far it was from the favorable edge."],
            ["VWAP / EMA 9 distance", "Dollar and percentage distance from the saved Session VWAP and timeframe EMA 9."],
            ["Activity", "Candle and session volume, relative volume and turnover when available."],
            ["Patterns", "Completed patterns on the execution candle or immediately before it."],
            ["Price response", "Movement in the trade's favor and against it after that fill, including available 5/15/30/60-minute paths."],
          ] },
          { kind: "callout", title: "One-minute sequence limit", text: "A one-minute candle does not reveal whether its high or low occurred before or after a fill inside that minute. The Analyzer does not claim that unknown sequence." },
        ],
      },
      {
        id: "combined-trade",
        title: "Combined entry and exit",
        summary: "Read several fills as one quantity-weighted trade without losing the individual evidence.",
        keywords: ["combined entry", "combined exit", "weighted price", "mfe", "mae", "holding time"],
        blocks: [
          { kind: "paragraph", text: "Combined entry and exit use share-weighted fill prices. The complete trade runs from its first entry until the position returns to zero. It can report actual Trade Tracker result, holding time, maximum favorable excursion (MFE), maximum adverse excursion (MAE), partial exits and giveback." },
          { kind: "paragraph", text: "A combined result answers how the complete trade behaved. Individual execution analysis answers what followed one particular fill. Both views are useful and their populations should not be mixed." },
        ],
      },
      {
        id: "entry-opportunity-risk",
        title: "Entry opportunity and risk",
        summary: "Compare favorable and adverse per-share movement after entries and adds.",
        keywords: ["mfe", "mae", "favorable move", "adverse move", "per share", "median"],
        blocks: [
          { kind: "table", columns: ["Card", "Definition"], rows: [
            ["Average favorable move per share", "Mean maximum movement in the position's favor after measured entry/add executions and before the trade became flat."],
            ["Median favorable move per share", "The middle favorable value, which reduces the influence of a few extreme trades."],
            ["Average adverse move per share", "Mean maximum movement against the position after measured entry/add executions."],
            ["Median adverse move per share", "The middle adverse value."],
          ] },
          { kind: "callout", title: "Per-share movement is not whole-trade P/L", text: "These cards show price movement per share. Actual result depends on quantity, scaling, exits and recorded fees." },
        ],
      },
      {
        id: "timing-holding",
        title: "Timing and holding",
        summary: "Compare distinct trades by entry-session group and total holding-time group.",
        keywords: ["entry time", "premarket", "opening hour", "holding time", "cohort"],
        blocks: [
          { kind: "paragraph", text: "Entry time groups use the account analysis timezone and place each trade by its opening execution. Holding groups use the complete time from first entry until the position returned to zero." },
          { kind: "paragraph", text: "Executions counts are occurrences; Trades counts are distinct completed trades. Opportunity trades are the subset with a measured sustained profit opportunity. Win rate, average return and money results describe the complete group, not one current table page." },
        ],
      },
      {
        id: "entry-execution-context",
        title: "Entry execution context",
        summary: "Group entry and add executions by VWAP, EMA 9 and relative-volume context.",
        keywords: ["vwap distance", "ema distance", "relative volume", "execution occurrences", "potential result"],
        blocks: [
          { kind: "paragraph", text: "VWAP and EMA 9 buckets describe percentage distance below, near or above the saved reference. Relative-volume buckets compare execution-candle volume with its recent one-candle average." },
          { kind: "table", columns: ["Column", "Meaning"], rows: [
            ["Executions", "Entry/add occurrences in the bucket."],
            ["Trades", "Distinct analyzed trades represented by those executions."],
            ["Opportunity trades", "Distinct trades with a measured sustained opportunity."],
            ["Win rate", "Percentage of represented trades with positive actual result."],
            ["Avg return / Avg result", "Average percentage return and average actual Trade Tracker result."],
            ["Avg potential result", "Average actual result plus measured additional opportunity."],
            ["Avg missed opportunity", "Average positive difference between actual result and sustained opportunity."],
          ] },
        ],
      },
      {
        id: "exit-execution-context",
        title: "Exit execution context",
        summary: "Group partial and final exits by giveback from an earlier favorable completed-candle price.",
        keywords: ["exit giveback", "partial exit", "final exit", "favorable price"],
        blocks: [
          { kind: "paragraph", text: "Exit giveback measures how far an exit was from the best earlier favorable completed-candle price available in the saved path. Zero means no measured giveback. Larger percentage buckets show more distance from that earlier price; they do not prove the earlier price was fully executable for the whole position." },
        ],
      },
    ],
  },
  {
    slug: "mfe-mae",
    title: "MFE & MAE",
    description: "Study long-term favorable and adverse movement after measured entries and adds.",
    sections: [
      {
        id: "overview",
        title: "MFE & MAE",
        summary: "Compare the largest observed favorable and adverse move after each measured entry or add.",
        keywords: ["mfe", "mae", "favorable movement", "adverse movement", "one-minute candles"],
        blocks: [
          { kind: "paragraph", text: "Maximum favorable excursion (MFE) is the largest measured price movement in the trade's favor after an entry or add and before the position becomes flat. Maximum adverse excursion (MAE) is the largest measured movement against it over that same interval." },
          { kind: "table", columns: ["Card", "Meaning"], rows: [
            ["Average / Median MFE", "Mean and middle favorable price movement per share across the complete measured population."],
            ["Average / Median MAE", "Mean and middle adverse price movement per share across the complete measured population."],
            ["MFE % / MAE %", "The same movement relative to that execution's price, making differently priced tickers easier to compare."],
          ] },
          { kind: "callout", title: "Measured candle range", text: "The page uses saved Moomoo one-minute candle evidence. A candle that shares a fill does not prove whether its high or low occurred before the fill, so the Analyzer does not claim that unknown sequence." },
        ],
      },
      {
        id: "comparisons",
        title: "Comparisons",
        summary: "Separate original entries, adds, longs and shorts without turning observation into a trading rule.",
        keywords: ["entries", "adds", "long", "short", "comparison"],
        blocks: [
          { kind: "paragraph", text: "The four comparison rows reuse the same measured execution facts. They show count plus average MFE/MAE in price and percentage terms. They describe the observed sample and do not prescribe a stop, target or adding strategy." },
        ],
      },
      {
        id: "measured-executions",
        title: "Measured executions",
        summary: "Audit the entry and add observations behind the long-term statistics.",
        keywords: ["ticker", "entries", "adds", "pagination", "view full analysis", "mobile table", "swipe"],
        blocks: [
          { kind: "paragraph", text: "Ticker and execution filters apply before pagination. On a phone, the complete evidence table keeps readable column widths and moves sideways inside its card; use the visible swipe cue and pinned Ticker column to compare entry price, MFE, MAE, percentage movement, time until flat and the actual trade result. View full analysis opens the exact trade in Daily Trade Tracker without changing the Analyzer population." },
          { kind: "paragraph", text: "Results per page offers 10, 25, 50 or 100 rows. Paging changes only the visible evidence rows; every card and comparison remains calculated from the complete selected date range, Account reporting currency and gross/net population." },
        ],
      },
    ],
  },
  {
    slug: "green-to-red-analysis",
    title: "Green-to-red analysis",
    description: "Understand profit capture, reversals below breakeven, recoveries and observed risk-management behavior.",
    sections: [
      {
        id: "profit-capture",
        title: "Profit capture",
        summary: "Compare actual results with measured sustained profit opportunities.",
        keywords: ["profit capture", "left on table", "missed opportunity", "peak retained", "giveback"],
        blocks: [
          { kind: "table", columns: ["Result", "Definition"], rows: [
            ["Total actual result", "Combined actual Trade Tracker gross or net P/L for analyzed eligible trades."],
            ["Result at best sustained opportunities", "Actual result plus each trade's measured additional opportunity."],
            ["Total additional opportunity", "Positive difference between actual result and the strongest supported sustained opportunity."],
            ["Average / median peak profit retained", "Percentage of measured opportunity represented by the actual result, shown as mean and middle value."],
            ["Average peak-to-exit giveback", "Average reversal from the measured peak to final exit."],
          ] },
          { kind: "paragraph", text: "A sustained opportunity uses completed-close windows instead of treating a one-second spike as an easy exit. Potential and missed values describe recorded market opportunity; actual P/L remains the money earned or lost." },
          { kind: "paragraph", text: "Time held after the profit peak groups trades by peak-to-exit duration. Every row shows distinct trades, sample-supported rates and average actual, potential and missed results for the complete cohort." },
        ],
      },
      {
        id: "green-to-red-outcomes",
        title: "Green-to-red outcomes",
        summary: "Follow each trade from first profit through reversal, recovery and final result.",
        keywords: ["never green", "stayed green", "ended red", "recovered", "ended flat", "breakeven"],
        blocks: [
          { kind: "table", columns: ["Status", "Meaning"], rows: [
            ["Never moved green", "The supported path did not show positive calculated trade P/L before the position became flat."],
            ["Green and stayed above breakeven", "The path became positive and did not later move below breakeven."],
            ["Green to red, ended red", "The path became positive, later moved below breakeven and actual P/L finished negative."],
            ["Green to red, recovered", "The path moved below breakeven and later returned above it before the trade ended."],
            ["Green to red, ended flat", "The path became positive and later red before actual P/L finished approximately flat."],
          ] },
          { kind: "table", columns: ["Card", "Meaning"], rows: [
            ["Time before turning red", "Average elapsed time from first green to first red."],
            ["Recovery rate", "Percentage of Green-to-red trades that later returned above breakeven."],
            ["Recovery time", "Average time from first red to first recovery."],
            ["Peak-to-red damage", "Average profit reversal from measured peak to first red."],
            ["Peak-to-exit damage", "Average profit reversal from measured peak to final exit."],
            ["Ended-red actual / potential / missed", "Combined money actually lost, measured result at sustained opportunity and their positive difference for ended-red trades."],
          ] },
        ],
      },
      {
        id: "risk-management-behavior",
        title: "Risk-management behavior",
        summary: "Compare observed adds after a peak and partial exits before red without claiming causation.",
        keywords: ["adding after peak", "scaling out", "partial exit", "risk management", "causation"],
        blocks: [
          { kind: "paragraph", text: "Adding after the peak compares peak-eligible trades with and without a later add. Scaling out before red compares Green-to-red trades with and without a partial exit before the first move below breakeven." },
          { kind: "callout", title: "Comparison, not proof", text: "The rows show what happened in the saved samples. They do not prove the add or partial exit caused the result and do not prescribe an exit strategy." },
        ],
      },
      {
        id: "supporting-trades",
        title: "Supporting trades",
        summary: "Inspect the trades behind the Green-to-red comparisons.",
        keywords: ["supporting trades", "filters", "results per page", "view full analysis", "mobile table", "swipe"],
        blocks: [
          { kind: "paragraph", text: "This is the detailed Green-to-red evidence view. On a phone, use the Sort control and swipe the contained table sideways to keep every comparison column readable; the Ticker column stays pinned as a reference. Use ticker and outcome filters, then View full analysis to open the exact Daily Trade Tracker trade behind a comparison. Sustained opportunity, additional opportunity, captured percentage and peak-to-exit time stay here because they describe profit capture and reversal behavior." },
          { kind: "paragraph", text: "Results per page offers 10, 25, 50 or 100 rows. Showing X-Y of Z and Previous/Next describe only the visible slice; summary cards continue to describe the complete filtered analysis population." },
        ],
      },
    ],
  },
  {
    slug: "candle-patterns",
    title: "Candle patterns",
    description: "Learn every supported pattern, its confirmation rule and how long-term pattern comparisons are counted.",
    sections: [
      {
        id: "pattern-summary",
        title: "How patterns are used",
        summary: "Compare completed patterns on or immediately before executions.",
        keywords: ["pattern summary", "execution candle", "before execution", "confirmation"],
        blocks: [
          { kind: "paragraph", text: "The Analyzer detects supported patterns on 1-minute and 5-minute candles. Long-term results separate entry from exit executions and exact execution candles from one or two completed candles before execution. Patterns completed after the fill are excluded from execution comparisons." },
          { kind: "callout", title: "Observation, not prediction", text: "A detected pattern reports completed candle facts. It is not a trading signal and does not promise a follow-through move." },
        ],
      },
      {
        id: "ranked-patterns",
        title: "Most observed patterns",
        summary: "See the ten candle patterns with the most saved occurrences.",
        keywords: ["ranked patterns", "top patterns", "occurrences", "bar chart"],
        blocks: [
          { kind: "paragraph", text: "Each bar represents one candle pattern across all of its saved 1-minute and 5-minute execution groups. Its length and label use the pattern's total occurrence count. The view shows at most the ten most frequently observed patterns and does not change the complete calculations below." },
        ],
      },
      {
        id: "pattern-results",
        title: "Pattern results",
        summary: "Read each pattern's timeframe, execution, location, counts and results.",
        keywords: ["occurrences", "trades", "win rate", "average return", "pagination", "ranked patterns"],
        blocks: [
          { kind: "paragraph", text: "Each card groups every result for one candle pattern. Within a card, results remain separate by timeframe, execution side and location so those different observations are never blended together. On a phone, swipe the contained table sideways to keep every result column readable; the Timeframe column stays pinned as a reference." },
          { kind: "table", columns: ["Column", "Meaning"], rows: [
            ["Pattern group", "Canonical plain-language pattern name and its total saved occurrences."],
            ["Timeframe", "1-minute or 5-minute candle construction used for detection."],
            ["Execution", "Whether the saved occurrence relates to an entry/add or partial/final exit."],
            ["Location", "Exact execution candle or completed candle before execution."],
            ["Occurrences", "Number of detected execution occurrences."],
            ["Trades", "Number of distinct analyzed trades represented."],
            ["Win rate / Avg return / Avg result", "Actual Trade Tracker outcome statistics for the complete represented trade group."],
          ] },
          { kind: "paragraph", text: "When more than 10 pattern groups exist, Results per page offers 10, 25, 50 or 100. Showing X-Y of Z and Previous/Next change only the visible pattern groups, never their complete calculations." },
        ],
      },
      {
        id: "pattern-occurrences",
        title: "Pattern occurrences",
        summary: "Open the exact trade and candle context behind a grouped pattern.",
        keywords: ["view occurrences", "chart", "drawer", "daily trade tracker", "ticker filter", "timeframe"],
        blocks: [
          { kind: "paragraph", text: "Select View occurrences on a pattern card to open its exact saved execution occurrences without losing your place in the pattern list. The occurrence browser uses a right drawer on desktop and a full-width drawer on mobile. Ticker, timeframe, execution and location filters apply before the server returns a page. Results per page offers 10, 25, 50 or 100 and defaults to 25." },
          { kind: "paragraph", text: "The occurrence browser keeps the complete table on every screen. On a phone, swipe it sideways to read all columns, then select View chart to open the chosen chart full screen. Desktop opens that chart in a second right drawer. Only the selected chart is loaded, so a long history does not create dozens of hidden chart instances." },
          { kind: "paragraph", text: "The replay focuses the selected execution at the saved 1-minute or 5-minute timeframe. Previous and Next move through the visible occurrence page. Open Daily Trade Tracker keeps the exact trade, execution and interval selected for the full review." },
          { kind: "callout", title: "Context, not a signal", text: "The chart helps explain the completed candle context around a recorded execution. It does not predict what the same pattern will do next." },
        ],
      },
      {
        id: "supported-patterns",
        title: "Supported pattern definitions",
        summary: "Understand the measured candle structure behind every current label.",
        keywords: ["compression", "doji", "engulfing", "evening star", "expansion", "hammer", "harami", "morning star", "shooting star", "three black crows", "three white soldiers", "wick rejection", "exhaustion"],
        blocks: [
          { kind: "table", columns: ["Pattern", "Completed evidence"], rows: [
            ["Inside Bar", "Range and volume contracted materially inside the preceding candle."],
            ["Bullish Inside Bar Breakout / Bearish Inside Bar Breakdown", "Price closed decisively above or below a confirmed inside-bar range on increased activity."],
            ["Bullish Engulfing / Bearish Engulfing", "A meaningful body fully engulfed the preceding opposite-direction body."],
            ["Doji", "A meaningful-range candle closed with an exceptionally small body, showing temporary balance between buyers and sellers."],
            ["Bullish Harami / Bearish Harami", "A smaller opposite-direction body formed fully inside the preceding meaningful body after a recent move."],
            ["Bullish Morning Star / Bearish Evening Star", "A small middle body was followed by a meaningful reversal candle that closed through the first candle's midpoint."],
            ["Bullish Three White Soldiers / Bearish Three Black Crows", "Three meaningful candles opened inside the prior body and closed progressively in the reversal direction after an opposing local move."],
            ["Strong Bullish Candle / Strong Bearish Candle", "Range and body expanded materially and closed near the directional extreme."],
            ["Bullish Hammer", "After a meaningful decline, a dominant lower wick rejected a local low and the next candle confirmed recovery."],
            ["Bearish Shooting Star", "After a meaningful advance, a dominant upper wick rejected a local high and the next candle confirmed weakness."],
            ["Bullish Rejection Candle / Bearish Rejection Candle", "Price tested a local extreme, left a dominant wick and closed away from that extreme."],
            ["High-Volume Exhaustion", "An extended move stalled at a local extreme on exceptional volume and the following candle confirmed failure."],
          ] },
          { kind: "paragraph", text: "Bullish Hammer, Bearish Shooting Star and High-Volume Exhaustion require a following completed candle. Morning/Evening Star and Three Soldiers/Black Crows complete when their final candle closes. A familiar-looking candle correctly receives no label when its measured structure, local context or confirmation is missing." },
        ],
      },
    ],
  },
  {
    slug: "day-trade-analysis",
    title: "Day Trade Analysis",
    description: "Use the long-term landing page, shared filters, coverage and four focused Analyzer capability pages.",
    sections: [
      {
        id: "eligibility-coverage",
        title: "Analyzed trades",
        summary: "See the saved analyzed trades that support the current results.",
        keywords: ["analyzed trades", "supporting trades", "paid plan", "historical imports"],
        blocks: [
          { kind: "paragraph", text: "The Analyzed trades card counts only current saved results with an execution snapshot linked to its saved market candle. Select it to inspect the exact trade replays behind the summaries." },
          { kind: "paragraph", text: "An active paid plan is required to create new analysis. Analysis completed while paid remains readable after cancellation." },
        ],
      },
      {
        id: "overall-results",
        title: "Overall results",
        summary: "Separate win rate, average return and average actual result.",
        keywords: ["win rate", "average return", "average result", "analyzed executions"],
        blocks: [
          { kind: "table", columns: ["Card", "Meaning"], rows: [
            ["Analyzed trades", "Eligible trades with a current saved Analyzer result and an execution snapshot linked to its saved market candle in the selected range."],
            ["Analyzed executions", "Saved buy and sell analysis snapshots from those candle-backed trades."],
            ["Win rate", "Percentage of analyzed trades with positive actual result."],
            ["Average return", "Mean percentage return across analyzed trades with a supported return denominator."],
            ["Average gross/net result", "Mean actual Trade Tracker result under the selected money basis."],
          ] },
        ],
      },
      {
        id: "actual-opportunity",
        title: "Actual result and opportunity",
        summary: "Compare money earned or lost with measured sustained opportunity.",
        keywords: ["actual result", "sustained opportunity", "missed opportunity", "potential result"],
        blocks: [
          { kind: "table", columns: ["Card", "Meaning"], rows: [
            ["Total actual result", "Combined actual Trade Tracker P/L."],
            ["Result at sustained opportunities", "Actual result plus measured additional opportunity."],
            ["Total missed opportunity", "Positive difference between actual and supported sustained opportunity."],
          ] },
        ],
      },
      {
        id: "filters",
        title: "Date, reporting currency and money basis",
        summary: "Apply one shared date and money basis while Account settings supplies the reporting currency.",
        keywords: ["date range", "currency", "gross", "net", "filters"],
        blocks: [
          { kind: "paragraph", text: "The selected date range and Gross/Net basis apply to every card and capability page. Your Account reporting-currency preference applies automatically; there is no separate page-level currency filter. Gross does not subtract fees; Net includes only trades with supported complete fee treatment." },
        ],
      },
      {
        id: "capability-navigation",
        title: "Capability pages",
        summary: "Open the focused page for the question you want to answer.",
        keywords: ["entry exit", "mfe", "mae", "green to red", "candle patterns", "analyzed trades"],
        blocks: [
          { kind: "bullets", items: [
            "MFE & MAE compares favorable and adverse movement after measured entries and adds, then exposes the paginated execution evidence.",
            "Entry & Exit compares execution timing, context, favorable/adverse movement and exit giveback.",
            "Green-to-Red compares profit capture, reversal, recovery and observed risk-management behavior.",
            "Candle Patterns compares saved 1-minute and 5-minute pattern occurrences.",
            "Analyzed Trades lists the exact replays behind every aggregate.",
          ] },
        ],
      },
    ],
  },
  {
    slug: "analyzed-trades",
    title: "Analyzed trades",
    description: "Find every current candle-backed trade analysis and open its exact Daily Trade Tracker review.",
    sections: [
      {
        id: "filters",
        title: "Ticker search",
        summary: "Narrow the analyzed-trade directory without changing saved facts.",
        keywords: ["ticker filter", "ticker search", "page 1"],
        blocks: [
          { kind: "paragraph", text: "Ticker search matches the displayed symbol and returns the list to page 1. The shared date range, Account reporting currency and Gross or Net choice continue to apply. Green-to-red-specific outcome and opportunity filters live on the Green-to-red page." },
        ],
      },
      {
        id: "trade-table",
        title: "Trade table",
        summary: "Read the neutral trade index and open its full analysis.",
        keywords: ["trade table", "ticker", "direction", "entry time", "exit time", "executions", "full analysis"],
        blocks: [
          { kind: "table", columns: ["Column", "Meaning"], rows: [
            ["Date / Ticker / Direction", "Local trade date, displayed symbol and Long or Short direction."],
            ["Entry time / Exit time", "First entry and final exit in the selected account's trading timezone."],
            ["Gross or Net result", "Actual saved trade result under the selected basis."],
            ["Return", "Percentage result when a supported denominator is available."],
            ["Executions", "Number of saved entry, add, partial-exit and final-exit snapshots."],
            ["View full analysis", "Opens the exact Daily Trade Tracker trade and focuses its saved analysis."],
          ] },
          { kind: "paragraph", text: "The directory intentionally keeps Green-to-red opportunity, capture and reversal columns off this page. Open the full analysis for entry, exit, pattern and Green-to-red context, or use the Green-to-red page for those cross-trade comparisons." },
          { kind: "paragraph", text: "On a phone, swipe the contained table sideways to read every column without shrinking it into unreadable text." },
        ],
      },
      {
        id: "pagination",
        title: "Pagination",
        summary: "Choose the number of rows while summaries remain based on the full filtered population.",
        keywords: ["results per page", "showing", "previous", "next", "pagination"],
        blocks: [
          { kind: "paragraph", text: "When more than 10 trades match, Results per page appears at the top right of the result controls with choices of 10, 25, 50 and 100. The default is 25. Showing X-Y of Z, Previous and Next move through the sorted filtered rows without changing any summary denominator." },
        ],
      },
    ],
  },
  {
    slug: "data-availability",
    title: "Data availability and limitations",
    description: "Understand Moomoo data, same-day timing, post-session updates, eligibility and factual unavailable states.",
    sections: [
      {
        id: "market-data-and-imports",
        title: "Market data and execution imports",
        summary: "Use one Moomoo connection for supported chart data while treating execution imports separately.",
        keywords: ["moomoo", "market data", "execution imports", "free account", "saved candles"],
        blocks: [
          { kind: "paragraph", text: "TraderLink checks its saved server-side candles before requesting missing Moomoo data. A free Moomoo account can support chart data without a trading account. Automatic execution imports require a supported trading account; manual entry and statement imports remain available when broker importing is unavailable." },
        ],
      },
      {
        id: "same-day-readiness",
        title: "Same-day readiness",
        summary: "Use most analysis immediately while the final post-exit hour is still forming.",
        keywords: ["same day", "60 minutes", "pending", "post exit", "leave page"],
        blocks: [
          { kind: "paragraph", text: "As soon as executions and formed candles are available, the replay and most analysis can be useful. If the final exit was less than 60 minutes ago, the status shows how many post-exit minutes are available. Missing future candles are not zeroes or errors, and the user can leave the page while the remaining window completes." },
        ],
      },
      {
        id: "post-session-reconciliation",
        title: "Post-session reconciliation",
        summary: "Allow one final update after Moomoo finalizes same-day candles.",
        keywords: ["post session", "reconciliation", "final candle", "update"],
        blocks: [
          { kind: "callout", title: "One final same-day update", text: "Moomoo can finalize candle values after the session. TraderLink performs one post-session reconciliation so saved candles, indicators and dependent analysis can use the final values." },
        ],
      },
      {
        id: "supported-sessions",
        title: "Supported sessions and unavailable states",
        summary: "Recognize incomplete or unavailable evidence without invented replacements.",
        keywords: ["premarket", "regular session", "after hours", "overnight", "unavailable", "incomplete"],
        blocks: [
          { kind: "bullets", items: [
            "Current U.S. premarket, regular-session and after-hours coverage is supported when Moomoo returns the required candles.",
            "Overnight-session analysis is not currently supported.",
            "Pending means a required future window has not finished forming.",
            "Incomplete means only part of the required candle range is available.",
            "Unavailable means the required fact or supported evidence could not be established; the app does not replace it with zero or a guess.",
          ] },
        ],
      },
      {
        id: "intraminute-limit",
        title: "Intraminute sequence limit",
        summary: "Know what a one-minute candle cannot prove about a fill.",
        keywords: ["intraminute", "high low order", "one minute candle", "execution precision"],
        blocks: [
          { kind: "paragraph", text: "A one-minute candle supplies open, high, low and close, but not the order of every movement inside the minute. When a fill shares that candle, the Analyzer cannot prove whether the high or low came before or after the execution." },
        ],
      },
      {
        id: "eligibility-retained-access",
        title: "Eligibility and retained access",
        summary: "Create new analyses while paid and keep completed analysis readable afterward.",
        keywords: ["paid eligibility", "cancellation", "historical lookback", "old imports", "retained access"],
        blocks: [
          { kind: "paragraph", text: "An active paid plan is required to create new Analyzer results. Completed analyses remain readable after paid access ends. Older historical Trade Tracker imports outside the Analyzer eligibility period remain available in Trade Tracker and regular Analytics but do not enter Analyzer coverage." },
          { kind: "callout", title: "Historical lookback is still being tested", text: "TraderLink has not published a fixed initial lookback. It will be chosen after Moomoo testing rather than being assumed to be 30 days or another arbitrary value." },
        ],
      },
    ],
  },
]);

export function tradeAnalyzerGuideBySlug(slug: string): HelpGuide | undefined {
  return TRADE_ANALYZER_HELP_GUIDES.find((guide) => guide.slug === slug);
}
