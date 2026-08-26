import type { HelpArticleBlock, HelpArticleSection, HelpGuide } from "./help-guide-types";

const paragraph = (text: string): HelpArticleBlock => Object.freeze({ kind: "paragraph", text });
const bullets = (items: readonly string[]): HelpArticleBlock => Object.freeze({ kind: "bullets", items: Object.freeze(items) });
const link = (href: string, label: string, text: string): HelpArticleBlock => Object.freeze({ kind: "link", href, label, text });
const table = (columns: readonly string[], rows: readonly (readonly string[])[]): HelpArticleBlock => Object.freeze({ kind: "table", columns: Object.freeze(columns), rows: Object.freeze(rows) });
const section = (id: string, title: string, summary: string, keywords: readonly string[], blocks: readonly HelpArticleBlock[]): HelpArticleSection => Object.freeze({ blocks: Object.freeze(blocks), id, keywords: Object.freeze(keywords), summary, title });
const guide = (slug: string, title: string, description: string, sections: readonly HelpArticleSection[]): HelpGuide => Object.freeze({ description, sections: Object.freeze(sections), slug, title });

export const CORE_ANALYTICS_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  guide("getting-started", "Analytics Overview", "Use Analytics Overview and the Analytics pages to compare confirmed completed-trade facts without changing any executions.", [
    section("what-analytics-shows", "What Analytics shows", "The Analytics pages summarize completed trades that have enough accepted facts for each result.", ["analytics", "analytics overview", "completed trades", "trade tracker", "results", "performance"], [
      paragraph("Analytics is the factual view of confirmed Trade Tracker results, including imported and manually entered trades. It includes Analytics Overview, Ticker, Timing and Trade Breakdown. It helps you compare recorded outcomes; it does not predict a future trade or recommend an action."),
      table(["Page", "Use it for"], [
        ["Overview", "Read key completed-trade measures and their monthly Net P/L history."],
        ["Ticker", "Compare completed-trade results by ticker."],
        ["Timing", "Compare completed-trade results by entry time, exit time, day of week and trading session."],
        ["Trade Breakdown", "Compare completed trades by entry price, entry size, maximum position and holding time, then open exact executions."],
      ]),
    ]),
    section("what-it-does-not-change", "Analytics does not change executions", "Changing a view, range, sort or filter never edits a Trade Tracker execution or review.", ["read only", "change trade", "filters", "sort"], [
      paragraph("Use Daily Trade Tracker, Quick Trade Entry, Import Trades or Data Decisions when you need to add, correct or resolve factual trade information. Analytics filters and sorting only arrange the facts that are currently available."),
      link("/help/daily-trade-tracker/getting-started", "Read Daily Trade Tracker help", "Open the Daily Tracker when you want to review one trading date or work with its supporting tools."),
    ]),
  ]),
  guide("overview-and-date-range", "Read the overview and date range", "Choose a completed-trade date range, then read the key results and monthly Net P/L without mixing currencies.", [
    section("set-a-date-range", "Set a date range", "Analytics Overview, Ticker and Trade Breakdown use the selected completed-trade date range.", ["date range", "all time", "last 3 months", "custom date", "update analytics"], [
      bullets([
        "Choose All time, Last 3 months, Last 6 months, Last 12 months, This year or Custom range.",
        "For a Custom range, enter a start and end date, then choose Update.",
        "The range is based on the completed trade's closing date. It does not move an execution or change its recorded date.",
      ]),
      paragraph("Timing currently shows the available completed-trade population without this date-range control. Its time labels identify the displayed timezone."),
    ]),
    section("read-the-overview", "Read the Overview cards", "Overview shows the selected period's completed-trade measures and a monthly Net P/L chart when available.", ["net p/l", "win rate", "profit factor", "expectancy", "monthly p/l"], [
      table(["Measure", "Meaning"], [
        ["Net P/L", "The selected completed-trade profit or loss after the covered trade charges."],
        ["Win rate", "The share of included completed trades with a positive result."],
        ["Profit factor", "Gross winning results divided by the absolute gross losing results when both are available."],
        ["Expectancy", "The average result per included completed trade."],
        ["Monthly Net P/L", "The same completed-trade Net P/L arranged by closing month."],
      ]),
      paragraph("A result can be unavailable when the required facts or a valid denominator are missing. That is different from a real zero result."),
    ]),
    section("reporting-currency", "Use your preferred currency", "Normal Analytics money is converted to the reporting currency selected in Account settings without changing recorded trades.", ["currency", "preferred currency", "conversion", "account settings"], [
      paragraph("Each closed trade uses the effective daily rate for its closing date before Analytics calculates totals and averages. Prices, fees and P/L therefore use the same reporting basis. If an exact required rate is unavailable, the page says it could not load instead of relabelling the original amount."),
      paragraph("Statement previews, Import Trades, Data Decisions and manual execution editors keep the original broker currency because those screens record or correct source facts."),
      link("/account", "Open Account settings", "Choose the reporting currency used throughout the normal dashboard."),
    ]),
  ]),
  guide("compare-results-by-ticker", "Use the Ticker page", "Use the Ticker table to search, sort, paginate and compare the selected completed-trade results by ticker.", [
    section("read-the-results-table", "Read the Ticker table", "Each row groups the selected completed trades for one ticker.", ["results", "ticker", "net p/l", "average p/l", "trade count"], [
      table(["Column", "Meaning"], [
        ["Net P/L", "The selected completed-trade result for the ticker."],
        ["Win rate", "The percentage of included completed trades for that ticker with a positive result."],
        ["Profit factor", "The ticker's gross winning results divided by absolute gross losing results when available."],
        ["Trades / Trading days", "The included completed-trade count and the number of trading dates represented."],
        ["Average P/L", "The average selected result per included completed trade for that ticker."],
      ]),
    ]),
    section("search-and-sort", "Search, sort and paginate", "Search for a ticker, choose a column heading to change the order, and select how many rows appear on each page.", ["search ticker", "sort results", "table columns", "results filter", "rows per page", "pagination"], [
      paragraph("The Ticker field narrows the displayed rows to matching symbols. On a phone, use the Sort control and swipe the contained table sideways to read every column; the Ticker column stays pinned as a reference. Rows per page changes the page size, and the pagination controls move through the remaining tickers. These controls only change the view in your browser."),
      paragraph("Select a ticker row to open its completed trades in a responsive side panel. Each trade shows its P/L and can expand to the exact buy and sell executions. When a saved Trade Analyzer chart exists, the same panel shows the complete chart and lets a selected execution highlight its marker."),
    ]),
  ]),
  guide("timing-and-execution", "Review timing and execution", "Compare recorded timing and completed-trade execution characteristics without treating a summary as a trading rule.", [
    section("read-timing", "Read Timing", "Timing groups the current completed-trade population by recorded entry or exit time, weekday and trading session.", ["timing", "entry time", "exit time", "day of week", "trading session"], [
      bullets([
        "Choose Net P/L, Average P/L per trade, Win rate or Trade count to change the measure in the charts.",
        "Entry time and Exit time show the timezone named in the chart title.",
        "Entry time and Exit time use phone-friendly horizontal bars. Day of week and Trading session keep their available chart-style control.",
        "Highest total P/L identifies the time range with the largest recorded result. It is useful history, but it is not automatically the most repeatable time to trade.",
        "Most reliable entry or exit time needs at least 10 completed trades in one time range, a positive typical result, more than half winning, and a positive result after removing that range's single largest winner. It gives more weight to repeated results than a small sample.",
        "When no time range passes every reliability check, the card identifies the most repeated range and explains which check it did not pass.",
      ]),
    ]),
    section("read-execution", "Read Trade Breakdown", "Trade Breakdown groups completed trades by entry price, entry size, maximum position and holding duration.", ["trade breakdown", "execution analytics", "entry price", "entry size", "maximum position", "holding time", "long short"], [
      bullets([
        "Entry Price Results groups every completed trade once by its weighted average entry price across its recorded entries and adds. The summary identifies the highest and lowest win-rate bands, the largest recorded loss band and the most profitable band, while the complete table shows every price range.",
        "A finding based on a price range with fewer than 10 included closed trades says Limited history. Its result is still recorded history, but it is not presented as a repeatable conclusion.",
        "Choose Net P/L, Win rate or Trade count to change the chart measure.",
        "Use the chart-style control to switch between horizontal bars and columns.",
        "Use the ticker, direction and trade-type filters to narrow the completed-trade evidence.",
        "On a phone, use the Sort control and swipe the contained table sideways to read the complete execution facts. The Ticker column stays pinned as a reference.",
        "Rows per page offers 10, 25, 50 or 100 while pagination keeps long histories bounded.",
        "Select a trade row to open the complete trade, its exact executions and its saved Trade Analyzer chart when chart coverage exists.",
      ]),
      paragraph("A larger or smaller group result describes the included past trades. It does not establish a future position size, target or stop."),
    ]),
  ]),
  guide("coverage-and-limits", "Coverage and limits", "Understand why an Analytics result can be complete, partial, empty or unavailable.", [
    section("included-trades", "Which trades contribute", "Analytics uses confirmed completed Trade Tracker trades that have the facts required for the selected result.", ["coverage", "included trades", "completed trade", "open positions", "data decisions"], [
      paragraph("Confirmed open positions remain separate from realized P/L. A pending Data Decision can keep the affected chain out of a calculation, but it does not hide unrelated completed trades that are ready to use."),
      link("/help/open-positions/getting-started", "Read Open Positions help", "See why a confirmed open position remains outside realized completed-trade results."),
      link("/help/data-decisions/getting-started", "Read Data Decisions help", "Resolve a factual question with broker evidence when the page asks for one."),
    ]),
    section("unavailable-and-empty", "Unavailable is not zero", "Analytics leaves a result visibly unavailable when the necessary facts are missing or a calculation has no valid denominator.", ["unavailable", "empty analytics", "zero result", "missing facts", "partial coverage"], [
      paragraph("No completed trades in a view is an empty population. A displayed zero is a calculated zero. An unavailable value means Analytics does not have enough accepted information to calculate that specific result safely. Help does not turn any of those states into a guess."),
    ]),
    section("trade-analyzer-difference", "Analytics and Trade Analyzer are different", "Analytics uses its own completed-trade population; Trade Analyzer has separate market-data and replay requirements.", ["trade analyzer", "analytics difference", "market data", "candle replay"], [
      paragraph("A trade can appear in Analytics without being eligible for a Trade Analyzer replay. Use Trade Analyzer Help when you are reviewing saved chart and candle evidence rather than regular Trade Tracker outcome summaries."),
      link("/help/trade-analyzer/overview", "Read Trade Analyzer help", "Learn about chart replay and its separate eligibility and data requirements."),
    ]),
  ]),
]);

export function coreAnalyticsGuideBySlug(slug: string): HelpGuide | undefined {
  return CORE_ANALYTICS_HELP_GUIDES.find((guide) => guide.slug === slug);
}
