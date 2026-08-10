import type {
  HelpArticleBlock,
  HelpArticleSection,
  HelpGuide,
} from "./help-guide-types";

export type { HelpArticleBlock, HelpArticleSection };
export type DailyTradeTrackerHelpGuide = HelpGuide;

export const DAILY_TRADE_TRACKER_HELP_GUIDES: readonly DailyTradeTrackerHelpGuide[] = Object.freeze([
  Object.freeze({
    slug: "getting-started",
    title: "Getting started",
    description: "Learn the page, the language used in the tracker and a practical daily review workflow.",
    sections: Object.freeze([
      Object.freeze({
        id: "open-and-navigate",
        title: "Open the tracker and choose a day",
        summary: "Move between trading dates and understand the trading-week navigation.",
        keywords: Object.freeze(["open tracker", "date", "week", "traded day", "navigation"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Open Daily Trade Tracker from the main navigation. The page opens a trading date and places it inside its Eastern Time trading week." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Use the previous and next controls to move between available trading weeks.",
            "Select a traded-day card to open that date. Days with no accepted executions do not pretend that a trading review exists.",
            "The week total combines the realized results of the traded days shown in that week.",
            "A historical read-only notice means you can review the saved facts, but that particular historical source is not open for ordinary editing.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "day-summary",
        title: "Read the day summary",
        summary: "Understand P/L, Trades, Tickers and Rules broken.",
        keywords: Object.freeze(["p/l", "profit", "trades", "tickers", "rules broken", "summary"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Summary", "What it means"]), rows: Object.freeze([
            Object.freeze(["P/L", "The realized result from completed trades on the selected day, using saved executions and reported fees."]),
            Object.freeze(["Trades", "The number of complete positions that opened and returned to zero. Several trades can occur in one ticker."]),
            Object.freeze(["Tickers", "The number of different symbols traded that day."]),
            Object.freeze(["Rules broken", "The number of recorded broken rule results for the day. It is not an AI opinion."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "ticker-trade-execution",
        title: "Ticker, trade and execution",
        summary: "See how the three levels of a trading day fit together.",
        keywords: Object.freeze(["ticker", "trade", "execution", "fill", "trade 1", "trade 2"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Term", "Plain meaning"]), rows: Object.freeze([
            Object.freeze(["Ticker", "The stock symbol. All trades in the same symbol are grouped in one ticker card."]),
            Object.freeze(["Trade", "One complete position from the moment its quantity leaves zero until it returns to zero."]),
            Object.freeze(["Execution", "One broker fill, such as buying 300 shares or selling 100 shares. One trade can contain many executions."]),
          ]) }),
          Object.freeze({ kind: "callout", title: "Several trades in one ticker", text: "If a position returns to zero and you enter the same ticker again later, TradersLink creates Trade 2. Selecting Trade 2 replaces Trade 1 in that ticker's chart and expanded details; it does not create another chart." }),
        ]),
      }),
      Object.freeze({
        id: "daily-workflow",
        title: "A practical daily workflow",
        summary: "Follow a repeatable review from executions through completion.",
        keywords: Object.freeze(["workflow", "same day", "review", "complete day"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Record the executions", text: "Add exact fills manually or use accepted broker executions when that connection is available." }),
            Object.freeze({ title: "2. Review each trade", text: "Open every ticker, select each trade and check the executions, tags, rules and notes." }),
            Object.freeze({ title: "3. Study the chart", text: "Review the selected trade's entries, exits, candles and written analysis." }),
            Object.freeze({ title: "4. Record the lesson", text: "Add useful tags, trade notes and Daily Notes while the decisions are still fresh." }),
            Object.freeze({ title: "5. Finish the day", text: "Classify any open position, review daily rules and mark the day reviewed when your day review is complete." }),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "On desktop, completed trade cards can stay expanded while you work. On smaller screens they begin more compactly to keep the day scrollable. Expanding a card never changes the saved trade." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "add-edit-trades",
    title: "Add and edit trades",
    description: "Record broker fills accurately and understand how TradersLink turns executions into separate trades.",
    sections: Object.freeze([
      Object.freeze({
        id: "enter-executions",
        title: "Enter executions from your broker",
        summary: "Use the broker-shown date, Eastern Time, ticker, side, quantity, price and fees.",
        keywords: Object.freeze(["manual entry", "date", "time", "ticker", "side", "quantity", "price", "fees"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Open the manual trade form and copy each fill from your broker. Accurate details improve the chart review now and any later statement matching." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Use the execution date and time shown by the broker. The Day Tracker uses Eastern Time.",
            "Enter the ticker, Buy or Sell side, filled quantity and execution price for every fill.",
            "Enter fees only when the broker reports them. Leaving an unknown fee blank is more accurate than guessing.",
            "Add rows for partial entries, adds and partial exits. Remove an unused row before saving.",
            "Every row in one Daily Trade Tracker save must belong to the same Eastern Time trading date. This keeps the day review, notes and rules tied to one trading day.",
          ]) }),
          Object.freeze({ kind: "callout", tone: "warning", title: "Use the fill, not the order", text: "An order can be cancelled, partially filled or filled at several prices. Record the completed broker fills that actually changed the position." }),
        ]),
      }),
      Object.freeze({
        id: "executions-build-trades",
        title: "How executions become trades",
        summary: "Follow the running position from zero, through partial fills, and back to zero.",
        keywords: Object.freeze(["running shares", "long", "short", "flat", "partial entry", "partial exit", "round trip"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "TradersLink orders accepted executions by account, ticker and execution time. A complete trade—sometimes called a round trip—starts when the position leaves zero and closes when it returns to zero." }),
          Object.freeze({ kind: "table", columns: Object.freeze(["Long example", "Running position"]), rows: Object.freeze([
            Object.freeze(["Buy 300", "+300 shares — the trade starts"]),
            Object.freeze(["Buy 200", "+500 shares — an add inside the same trade"]),
            Object.freeze(["Sell 250", "+250 shares — a partial exit"]),
            Object.freeze(["Sell 250", "0 shares — the trade closes"]),
            Object.freeze(["Buy 100 later", "+100 shares — a new trade starts"]),
          ]) }),
          Object.freeze({ kind: "table", columns: Object.freeze(["Short example", "Running position"]), rows: Object.freeze([
            Object.freeze(["Sell 400", "-400 shares — the Short trade starts"]),
            Object.freeze(["Buy 150", "-250 shares — a partial cover"]),
            Object.freeze(["Buy 250", "0 shares — the Short trade closes"]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "save-and-correct",
        title: "Save and correct executions",
        summary: "Understand validation, successful saves, later edits and duplicate protection.",
        keywords: Object.freeze(["save", "validation", "edit", "recorded executions", "duplicate", "data decisions"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "TradersLink checks the complete set before saving. If the save cannot finish, the form remains available so you can correct it.",
            "After a successful save, the recorded-execution count confirms how many fills were accepted.",
            "Use the available follow-up link to View candle review when you want to open the saved day immediately.",
            "A manual execution can be edited later. If it is being compared with possible broker data, resolve that Data Decision first so the same fill is not silently counted twice.",
            "When one position has returned to zero, use Start another trade if you need to record a later trade in the same ticker.",
          ]) }),
          Object.freeze({ kind: "callout", title: "Manual and imported fills share one history", text: "Broker imports do not create a second Trade Tracker. When an imported fill may duplicate a manual one, TradersLink asks for a decision instead of deleting or double-counting it automatically." }),
        ]),
      }),
      Object.freeze({
        id: "manual-versus-import",
        title: "Manual entry and statement imports",
        summary: "Choose the workflow that matches the data you have.",
        keywords: Object.freeze(["manual", "broker import", "statement", "bulk history", "moomoo"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Daily Trade Tracker manual entry is useful for reviewing one current or recent trading day and for brokers that do not yet connect directly. Use Quick Trade Entry when one batch contains executions from multiple past trading dates. Broker or statement imports are better for larger histories. All three paths ultimately feed the same execution history and use the same trade-building rules." }),
          Object.freeze({ kind: "link", href: "/help/quick-trade-entry", label: "Open Quick Trade Entry help", text: "Quick Trade Entry is the execution-only path for multiple past trading dates; it does not begin the Daily Tracker notes, tags, rules or day-review workflow." }),
          Object.freeze({ kind: "paragraph", text: "A broker connection can provide strong execution evidence, but it does not make every row immune from genuine duplicates or contradictions. TradersLink preserves the source and asks only when the facts conflict." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "review-trades",
    title: "Review trades and executions",
    description: "Use ticker cards, trade selection, tags and individual execution analysis without losing the complete-trade view.",
    sections: Object.freeze([
      Object.freeze({
        id: "ticker-and-trade-cards",
        title: "Ticker and trade cards",
        summary: "Read result colors and switch between several trades in one ticker.",
        keywords: Object.freeze(["ticker card", "trade card", "trade 1", "trade 2", "collapse", "profit", "loss"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A ticker card groups every completed trade in that symbol. Its result color summarizes the ticker's day, while each Trade card shows that trade's own direction, holding time, executions, P/L and return." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Select Trade 1, Trade 2 or another trade to replace the currently displayed chart and expanded details for that ticker.",
            "Only one selected trade is shown in a ticker's chart at a time. Other trades remain saved and selectable.",
            "Collapse completed trade cards to keep a busy day readable. Mobile begins with a more compact view.",
            "A green or red presentation describes the recorded result; it does not judge whether every decision was good or bad.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "tags",
        title: "Use tags to organize repeated behavior",
        summary: "Apply preset and custom tags without losing prior history.",
        keywords: Object.freeze(["tags", "setup", "entry", "exit", "mistake", "emotion", "market context", "risk", "custom"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Tags make repeated setups and behaviors measurable over time. TraderLink groups presets under Setup, Entry and execution, Exit, Mistake, Emotion, Market context, and Risk and process." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Choose only tags that genuinely describe the selected trade.",
            "Create a Custom tag when the existing list does not fit your process.",
            "Rename a custom tag when the wording improves.",
            "Retire a tag you no longer use. Prior trades keep their historical tag instead of being rewritten.",
          ]) }),
          Object.freeze({ kind: "link", href: "/help/trade-tags", label: "Open Trade Tags help", text: "The Trade Tags collection explains all presets, custom tags, Swing tags, limits and where saved tags are used." }),
        ]),
      }),
      Object.freeze({
        id: "view-analysis",
        title: "View analysis for one execution",
        summary: "Select any buy or sell to inspect the exact fill and its market context.",
        keywords: Object.freeze(["view analysis", "execution analysis", "entry analysis", "exit analysis", "combined overview", "fill"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Open Executions", text: "Expand the selected trade's execution list." }),
            Object.freeze({ title: "2. Select View analysis", text: "Use the button beside the exact buy or sell you want to study." }),
            Object.freeze({ title: "3. Review the highlighted fill", text: "The chart highlights that execution and moves it into view. The saved execution does not change." }),
            Object.freeze({ title: "4. Read the sections", text: "Review Execution context, Market activity, candle patterns and Price response for that fill." }),
            Object.freeze({ title: "5. Return to the trade", text: "Select Combined overview to restore the complete-trade analysis and Green-to-red column." }),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "For a Long trade, a buy that opens or adds is Entry analysis and a sell that reduces or closes is Exit analysis. For a Short trade, the opening sell is an entry and a covering buy is an exit." }),
          Object.freeze({ kind: "callout", title: "View analysis changes the review only", text: "It does not edit, split or reclassify the execution." }),
          Object.freeze({ kind: "link", href: "/help/trade-analyzer/entry-exit-analysis#individual-executions", label: "Read individual execution analysis help", text: "For every fill-level measure, definition and unavailable state, use the reusable Trade Analyzer guide." }),
        ]),
      }),
      Object.freeze({
        id: "execution-sections",
        title: "What individual execution analysis contains",
        summary: "Understand execution context, market activity, patterns and price response.",
        keywords: Object.freeze(["execution context", "market activity", "price response", "relative volume", "turnover", "vwap", "ema"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Section", "What you learn"]), rows: Object.freeze([
            Object.freeze(["Execution context", "Exact time, shares and price; distance from Session VWAP and EMA 9; and location inside the execution candle."]),
            Object.freeze(["Market activity", "Candle volume, relative volume, turnover and available cumulative session activity."]),
            Object.freeze(["Candle patterns", "Exact or nearby patterns, whether they occurred before or at the fill, and whether confirmation was available then."]),
            Object.freeze(["Price response", "Movement in favor of and against the position after that fill, including the available 60-minute path."]),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "A one-minute candle does not reveal whether its high or low happened before or after a fill inside that minute. TradersLink excludes claims that depend on that unknowable sequence." }),
        ]),
      }),
      Object.freeze({
        id: "combined-versus-individual",
        title: "Combined trade analysis and individual fills",
        summary: "Use the combined view for the complete outcome and individual views for execution decisions.",
        keywords: Object.freeze(["combined entry", "combined exit", "trade outcome", "mfe", "mae", "green to red"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Individual analysis explains one fill. Combined analysis weights entries and exits by quantity and explains the complete trade, including actual P/L, holding time, MFE, MAE and profit-opportunity results." }),
          Object.freeze({ kind: "paragraph", text: "Green-to-red analysis is trade-level because it follows the changing quantity and calculated P/L across the full position. It appears with Combined overview, not with one isolated fill." }),
          Object.freeze({ kind: "link", href: "/help/trade-analyzer/entry-exit-analysis#combined-trade", label: "Read combined trade analysis help", text: "See how quantity-weighted entries, exits, MFE, MAE and holding time describe the complete trade." }),
          Object.freeze({ kind: "link", href: "/help/trade-analyzer/green-to-red-analysis", label: "Read Green-to-red analysis help", text: "See every Green-to-red status, profit-capture result and recovery measurement." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "charts-analysis",
    title: "Chart replay and Trade Analyzer",
    description: "Use the embedded Trade Analyzer chart, timeframes, indicators, patterns and written analysis.",
    sections: Object.freeze([
      Object.freeze({
        id: "chart-basics",
        title: "Read and control the chart",
        summary: "Use candles, volume, markers, hover details, zoom and scrolling.",
        keywords: Object.freeze(["candlestick", "volume", "buy marker", "sell marker", "zoom", "scroll", "pinch"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Each candlestick shows open, high, low and close for its timeframe. The volume bars show shares traded during the same candle.",
            "Numbered buy and sell labels connect to the exact execution time and price. Select or hover for the fill's time, price and quantity.",
            "Select or hover a candle to read its time, open, high, low, close, volume and turnover, plus available pattern or execution details.",
            "The colored Trade label identifies the selected trade currently displayed in that ticker's one chart.",
            "Use the plus and minus controls to zoom. On desktop, hold Ctrl or Command while using the mouse wheel; an ordinary wheel movement scrolls the page.",
            "On mobile, drag horizontally to move through time, pinch to zoom and swipe the page vertically without the chart trapping the page scroll.",
            "Expand Candle patterns on mobile to see the pattern key without permanently covering the chart.",
          ]) }),
          Object.freeze({ kind: "link", href: "/help/trade-analyzer/chart-replay", label: "Open the complete chart replay guide", text: "Use the reusable chart guide for every candle, execution marker, indicator, timeframe and navigation control." }),
        ]),
      }),
      Object.freeze({
        id: "timeframes",
        title: "Choose a timeframe",
        summary: "Know what changes between 1-minute, 5-minute, 15-minute and 1-hour views.",
        keywords: Object.freeze(["1 minute", "5 minute", "15 minute", "1 hour", "timeframe", "written analysis"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["View", "How it is used"]), rows: Object.freeze([
            Object.freeze(["1-minute", "Precise execution timing, fill-level context, 1-minute patterns and complete 1-minute Trade analysis."]),
            Object.freeze(["5-minute", "A broader execution and trade view with its own candles, EMA 9, patterns and complete 5-minute Trade analysis."]),
            Object.freeze(["15-minute", "Chart context only. It does not replace the 1-minute or 5-minute written analysis."]),
            Object.freeze(["1-hour", "Wider chart context only for longer intraday structure."]),
          ]) }),
          Object.freeze({ kind: "callout", title: "Patterns and indicators are timeframe-sensitive", text: "Every timeframe builds different candles. EMA 9 and candle-pattern results therefore change with the selected timeframe; a valid 1-minute pattern is not automatically a 5-minute pattern." }),
        ]),
      }),
      Object.freeze({
        id: "indicators-and-metrics",
        title: "Indicators and trade measurements",
        summary: "Understand Session VWAP, EMA 9, relative volume, turnover, precision, MFE and MAE.",
        keywords: Object.freeze(["vwap", "ema 9", "relative volume", "turnover", "precision", "mfe", "mae", "holding time"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Measure", "Why it matters"]), rows: Object.freeze([
            Object.freeze(["Session VWAP", "The volume-weighted average price from the start of the supported session. The analysis explains whether a fill was above, below or near it."]),
            Object.freeze(["EMA 9", "A nine-candle exponential moving average for the selected timeframe. It gives recent prices more weight."]),
            Object.freeze(["Relative volume", "The candle's volume compared with its recent one-candle average. It adds context that raw volume alone cannot."]),
            Object.freeze(["Turnover", "The dollar value traded during a candle or session. It helps compare activity when share prices differ."]),
            Object.freeze(["Execution precision", "How far a buy was from the favorable low, or a sell from the favorable high, of its candle—without guessing the intraminute sequence."]),
            Object.freeze(["MFE", "Maximum favorable excursion: the largest price move in the trade's favor while it was open."]),
            Object.freeze(["MAE", "Maximum adverse excursion: the largest price move against the trade while it was open."]),
            Object.freeze(["Holding time", "How long the position remained open. Long-term statistics can compare duration ranges with results."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "candle-patterns",
        title: "Detected candle patterns",
        summary: "Use the chart labels and open the reusable pattern reference for detector details.",
        keywords: Object.freeze(["compression", "engulfing", "expansion", "hammer", "shooting star", "wick rejection", "exhaustion"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "The selected trade chart can label supported 1-minute and 5-minute patterns on or before executions. The short chart key expands on mobile. Confirmation-sensitive patterns appear only after their required completed candle exists." }),
          Object.freeze({ kind: "callout", title: "Observation, not prediction", text: "A label describes completed candle facts; it is not a trading signal." }),
          Object.freeze({ kind: "link", href: "/help/trade-analyzer/candle-patterns#supported-patterns", label: "Open all supported pattern definitions", text: "The Trade Analyzer pattern guide is the current source for detector definitions, confirmation rules and long-term comparisons." }),
        ]),
      }),
      Object.freeze({
        id: "trade-analysis",
        title: "Entry, exit and trade-path analysis",
        summary: "Connect individual fills with the complete weighted entry, exit and outcome.",
        keywords: Object.freeze(["entry analysis", "exit analysis", "combined analysis", "post execution", "5 15 30 60 minutes", "profit opportunity"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Entry analysis and Exit analysis explain each selected fill. Combined entry and exit sections weight several fills by quantity.",
            "Price response reports movement in favor of and against the position after an execution. Available 5, 15, 30 and 60-minute paths show what followed without claiming it was knowable at the fill.",
            "Trade-level MFE, MAE and holding time use the position from first entry until it becomes flat.",
            "Profit opportunities identify sustained price windows rather than treating a one-second high as an easily captured exit.",
            "Actual Trade Tracker P/L remains separate from calculated price-path opportunity. The latter shows what occurred in the market, not what the trader actually earned.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "green-to-red",
        title: "Green-to-red and recovery analysis",
        summary: "Open the combined trade view to see the complete path around breakeven.",
        keywords: Object.freeze(["green to red", "never green", "stayed green", "recovered", "breakeven", "peak profit", "left on table"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Combined overview can show whether the saved path never moved green, stayed above breakeven, ended red after first moving green, recovered, or ended approximately flat. Supporting facts can include the profit peak, reversal, recovery, later adds and partial exits." }),
          Object.freeze({ kind: "paragraph", text: "Transitions use exact fills and completed one-minute closes because the order of a one-minute candle's high and low is unknown. Calculated final path P/L may differ from actual net P/L when executions or reported fees make the real result different." }),
          Object.freeze({ kind: "link", href: "/help/trade-analyzer/green-to-red-analysis", label: "Open the complete Green-to-red guide", text: "Use the Trade Analyzer reference for every status, recovery, profit-capture and risk-management comparison." }),
          Object.freeze({ kind: "link", href: "/help/trade-analyzer/day-trade-analysis", label: "Open Day Trade Analysis help", text: "Long-term entry, exit, Green-to-red and pattern comparisons live in the separate Trade Analyzer collection." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "rules-notes-day-review",
    title: "Rules, notes and finish the day",
    description: "Review your process, classify open positions and clearly signal when a daily review is complete.",
    sections: Object.freeze([
      Object.freeze({
        id: "trade-and-daily-rules",
        title: "Trade rules and daily rules",
        summary: "Distinguish one-trade rules from complete-day rules and presets from custom reviews.",
        keywords: Object.freeze(["trade rules", "daily rules", "preset", "custom", "followed", "broken", "not reviewed", "n/a"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Rule type", "How it works"]), rows: Object.freeze([
            Object.freeze(["Trade rule", "Applies to one selected trade or position."]),
            Object.freeze(["Daily rule", "Applies to behavior or results across the complete trading day."]),
            Object.freeze(["Preset rule", "Chosen from TraderLink's supported list and evaluated automatically when the required facts are available."]),
            Object.freeze(["Custom rule", "Written in your own words and reviewed as Followed, Broken or Not reviewed."]),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "N/A means a preset rule could not meaningfully apply to that trade or day. It is different from Not reviewed and is not a result the trader needs to override." }),
          Object.freeze({ kind: "callout", title: "Rules broken", text: "The day-summary count is the number of recorded broken rule results for that trading date. It is not an AI opinion." }),
          Object.freeze({ kind: "link", href: "/help/trading-rules", label: "Open Trading Rules help", text: "The Trading Rules collection explains every preset, custom-rule reviews, automatic details, chart markers and Rule Results history." }),
        ]),
      }),
      Object.freeze({
        id: "notes",
        title: "Trade notes and Daily Notes",
        summary: "Record trade-specific observations and the larger lesson from the day.",
        keywords: Object.freeze(["trade notes", "daily notes", "what worked", "needs work", "technical recap", "current focuses"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Trade notes belong to one selected trade. Daily Notes describe the complete day and are organized into What worked, What needs work, Technical recap, Current Focuses and Anything else." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Write specific observations you will understand later, such as the decision, evidence and adjustment—not only ‘bad entry.’",
            "Save notes as you work and check the saved or error state before leaving the page.",
            "Mark day reviewed saves pending trade and daily notes again before completion is recorded.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "open-positions",
        title: "Classify open positions",
        summary: "Choose the trader's actual intent for every position that remains open.",
        keywords: Object.freeze(["open position", "active swing", "day trade still open", "bag hold", "long term hold", "not classified"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "An open-position row shows the remaining quantity, average entry and opened time. Choose the description that matches your intent; TradersLink does not change it automatically because of time held." }),
          Object.freeze({ kind: "table", columns: Object.freeze(["Choice", "Use it when"]), rows: Object.freeze([
            Object.freeze(["Not classified", "You have not decided or recorded the position type yet. The day cannot be marked reviewed."]),
            Object.freeze(["Active swing", "You intentionally continue the position as a Swing and can open it in Swing Trade Tracker."]),
            Object.freeze(["Day trade still open", "It remains an active Day trade that has not yet returned to zero."]),
            Object.freeze(["Unplanned hold (bag hold)", "The intended Day trade became an unplanned hold."]),
            Object.freeze(["Long-term hold", "The position is intentionally being treated as a longer-term investment or hold."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "mark-reviewed",
        title: "Mark the day reviewed",
        summary: "Record that the day review is complete without locking the day.",
        keywords: Object.freeze(["mark day reviewed", "complete", "ai reviews", "save notes", "edit later"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Mark day reviewed is your signal that the Trade Tracker review for that trading date is complete. It is more meaningful than saving notes alone." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Pending trade notes and Daily Notes are saved before completion is recorded.",
            "Every open position must be classified first.",
            "The day is not locked. Executions, tags and notes can still be corrected later.",
            "TraderLink and AI Reviews can distinguish a completed daily review from notes that were saved but not marked complete.",
            "Depending on your AI Review timing setting, completing eligible days may allow a review to start sooner. Later edits do not rewrite a review that was already issued.",
          ]) }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "data-timing-limitations",
    title: "Data timing and limitations",
    description: "Know when same-day analysis is ready, what can update later and which facts candles cannot prove.",
    sections: Object.freeze([
      Object.freeze({
        id: "market-data-requirements",
        title: "Market data for the analyzer",
        summary: "Understand the current Moomoo chart-data requirement and shared candle reuse.",
        keywords: Object.freeze(["moomoo", "market data", "broker connection", "candle cache", "shared candles"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Current Daily Trade Tracker charts use the configured Moomoo market-data connection. TradersLink checks its saved server-side candles first and requests only missing data. Users do not manage or see this shared storage." }),
          Object.freeze({ kind: "callout", title: "Market data and execution imports are separate", text: "A Moomoo market-data connection can supply chart candles even when that account has no trading history. Importing a user's broker executions is a separate permission and workflow." }),
          Object.freeze({ kind: "link", href: "/help/trade-analyzer/data-availability#market-data-and-imports", label: "Read Analyzer data availability help", text: "See the reusable Moomoo, paid eligibility, same-day timing and unavailable-state explanation." }),
        ]),
      }),
      Object.freeze({
        id: "same-day-timing",
        title: "Same-day analysis and the final 60 minutes",
        summary: "See why a newly closed trade can be useful immediately but not yet final.",
        keywords: Object.freeze(["same day", "60 minutes", "post exit", "pending", "analysis ready"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "TradersLink can analyze the trade as soon as its executions and formed candles are available. If the trade ended less than 60 minutes ago, the chart and most analysis can appear immediately while the remaining post-exit path is still forming." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "The status shows how many of the 60 post-exit minutes are available.",
            "Missing future candles are not treated as zeroes or failed analysis.",
            "After 60 minutes have formed, TradersLink adds the final post-exit result.",
            "You may leave the page; the update does not depend on keeping the browser open.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "post-session-update",
        title: "One post-session reconciliation",
        summary: "Understand why finalized Moomoo candles can adjust the chart once after the session.",
        keywords: Object.freeze(["post session", "reconciliation", "final candle", "update", "moomoo finalizes"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "callout", title: "Same-day disclosure", text: "Same-day analysis uses the candles available at the time. Moomoo may finalize those candles after the session, so TradersLink performs one final update to the chart and analysis." }),
          Object.freeze({ kind: "paragraph", text: "The final pass can update candle values, indicator details or analysis that depends on them. Already useful analysis remains available if that final refresh cannot finish; TradersLink does not replace it with invented or empty results." }),
        ]),
      }),
      Object.freeze({
        id: "coverage-and-sessions",
        title: "Coverage and supported sessions",
        summary: "Recognize complete, incomplete and unavailable analysis states.",
        keywords: Object.freeze(["coverage", "incomplete", "unavailable", "premarket", "after hours", "overnight", "us session"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "The current analyzer supports the intended U.S. premarket, regular-session and after-hours coverage used by the Daily Trade Tracker.",
            "Overnight-session analysis is not currently supported.",
            "If required candles are missing, TradersLink reports incomplete coverage or an unavailable fact instead of claiming a complete analysis.",
            "Broker, symbol, date or account market-data limits may restrict what can be retrieved.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "candle-fact-limits",
        title: "What one-minute candles cannot prove",
        summary: "Keep intraminute sequence and pattern observations in their factual limits.",
        keywords: Object.freeze(["one minute limit", "intraminute", "high low order", "prediction", "trading signal"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A one-minute candle gives its open, high, low and close, but not the exact order of every movement inside the minute. If an execution occurred during that candle, the chart cannot prove whether the high or low happened before or after the fill." }),
          Object.freeze({ kind: "paragraph", text: "The analysis therefore describes recorded market behavior and completed patterns. It does not predict future prices, promise that an opportunity was realistically captured, or turn a candle label into a trading signal." }),
        ]),
      }),
    ]),
  }),
]);

export function dailyTradeTrackerGuideBySlug(slug: string): DailyTradeTrackerHelpGuide | undefined {
  return DAILY_TRADE_TRACKER_HELP_GUIDES.find((guide) => guide.slug === slug);
}
