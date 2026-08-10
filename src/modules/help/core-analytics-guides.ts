import type { HelpArticleBlock, HelpArticleSection, HelpGuide } from "./help-guide-types";

const paragraph = (text: string): HelpArticleBlock => Object.freeze({ kind: "paragraph", text });
const bullets = (items: readonly string[]): HelpArticleBlock => Object.freeze({ kind: "bullets", items: Object.freeze(items) });
const link = (href: string, label: string, text: string): HelpArticleBlock => Object.freeze({ kind: "link", href, label, text });
const table = (columns: readonly string[], rows: readonly (readonly string[])[]): HelpArticleBlock => Object.freeze({ kind: "table", columns: Object.freeze(columns), rows: Object.freeze(rows) });
const section = (id: string, title: string, summary: string, keywords: readonly string[], blocks: readonly HelpArticleBlock[]): HelpArticleSection => Object.freeze({ blocks: Object.freeze(blocks), id, keywords: Object.freeze(keywords), summary, title });
const guide = (slug: string, title: string, description: string, sections: readonly HelpArticleSection[]): HelpGuide => Object.freeze({ description, sections: Object.freeze(sections), slug, title });

export const CORE_ANALYTICS_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  guide("getting-started", "Getting started", "Use Core Analytics to compare the completed-trade facts in your Trade Tracker without changing any executions.", [
    section("what-core-analytics-shows", "What Core Analytics shows", "The standard Analytics pages summarize the completed trades that have enough accepted facts for each result.", ["analytics", "completed trades", "trade tracker", "results", "performance"], [
      paragraph("Core Analytics is the regular factual view of saved Trade Tracker results. It includes Analytics Overview, Results, Timing and Execution. It helps you compare recorded outcomes; it does not predict a future trade or recommend an action."),
      table(["Page", "Use it for"], [
        ["Overview", "Read key completed-trade measures and their monthly Net P/L history."],
        ["Results", "Compare completed-trade results by ticker."],
        ["Timing", "Compare completed-trade results by entry time, exit time, day of week and trading session."],
        ["Execution", "Compare completed trades by entry size, maximum position and holding time."],
      ]),
    ]),
    section("what-it-does-not-change", "Analytics is read-only", "Changing a view, range, sort or filter never edits a Trade Tracker execution, note, tag or rule result.", ["read only", "change trade", "filters", "sort"], [
      paragraph("Use Daily Trade Tracker, Quick Trade Entry, Import Trades or Data Decisions when you need to add, correct or resolve factual trade information. Analytics only arranges the facts that are currently available."),
      link("/help/daily-trade-tracker/getting-started", "Read Daily Trade Tracker help", "Open the Daily Tracker when you want to review one trading date or work with its supporting tools."),
    ]),
  ]),
  guide("overview-and-date-range", "Read the overview and date range", "Choose a completed-trade date range, then read the key results and monthly Net P/L without mixing currencies.", [
    section("set-a-date-range", "Set a date range", "Analytics Overview, Results and Execution use the selected completed-trade date range.", ["date range", "all time", "last 3 months", "custom date", "update analytics"], [
      bullets([
        "Choose All time, Last 3 months, Last 6 months, Last 12 months, This year or Custom range.",
        "For a Custom range, enter a start and end date, then choose Update.",
        "The range is based on the completed trade's closing date. It does not move an execution or change the original Trade Tracker date.",
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
    section("currency-partitions", "Keep currencies separate", "Money results stay in their own currency partition rather than being converted or added together without a recorded conversion fact.", ["currency", "multiple currencies", "conversion", "separate results"], [
      paragraph("If the selected completed trades use more than one currency, Analytics displays the monetary results separately. Do not compare or add separate currency figures as if they were one amount unless you have the conversion information you need outside this page."),
    ]),
  ]),
  guide("compare-results-by-ticker", "Compare results by ticker", "Use the Results table to search, sort and compare the selected completed-trade results by ticker.", [
    section("read-the-results-table", "Read the Results table", "Each row groups the selected completed trades for one ticker.", ["results", "ticker", "net p/l", "average p/l", "trade count"], [
      table(["Column", "Meaning"], [
        ["Net P/L", "The selected completed-trade result for the ticker."],
        ["Win rate", "The percentage of included completed trades for that ticker with a positive result."],
        ["Profit factor", "The ticker's gross winning results divided by absolute gross losing results when available."],
        ["Trades / Trading days", "The included completed-trade count and the number of trading dates represented."],
        ["Average P/L", "The average selected result per included completed trade for that ticker."],
      ]),
    ]),
    section("search-and-sort", "Search and sort", "Search for a ticker, then choose a column heading to change the order of the current rows.", ["search ticker", "sort results", "table columns", "results filter"], [
      paragraph("The Ticker field narrows the displayed rows to matching symbols. Selecting a column heading sorts by that column; select it again to reverse the direction. These controls only change the view in your browser."),
    ]),
  ]),
  guide("timing-and-execution", "Review timing and execution", "Compare recorded timing and completed-trade execution characteristics without treating a summary as a trading rule.", [
    section("read-timing", "Read Timing", "Timing groups the current completed-trade population by recorded entry or exit time, weekday and trading session.", ["timing", "entry time", "exit time", "day of week", "trading session"], [
      bullets([
        "Choose Net P/L, Average P/L per trade, Win rate or Trade count to change the measure in the charts.",
        "Entry time and Exit time show the timezone named in the chart title.",
        "Use the chart-style control to change how the same recorded groups are displayed.",
        "The Best label identifies the highest displayed value for the selected measure; it is an observation, not a recommendation.",
      ]),
    ]),
    section("read-execution", "Read Execution", "Execution groups completed trades by entry size, maximum position and holding duration.", ["execution analytics", "entry size", "maximum position", "holding time", "long short"], [
      bullets([
        "Choose Net P/L, Win rate or Trade count to change the chart measure.",
        "Use the chart-style control to switch between horizontal bars and columns.",
        "Use the ticker, direction and trade-type filters to narrow the completed-trade table.",
        "Sort the table and change its page size to inspect the recorded trades behind the current view.",
      ]),
      paragraph("A larger or smaller group result describes the included past trades. It does not establish a future position size, target or stop."),
    ]),
  ]),
  guide("coverage-and-limits", "Coverage and limits", "Understand why a Core Analytics result can be complete, partial, empty or unavailable.", [
    section("included-trades", "Which trades contribute", "Core Analytics uses completed Trade Tracker trades that have the facts required for the selected result.", ["coverage", "included trades", "completed trade", "open positions", "data decisions"], [
      paragraph("Confirmed open positions remain separate from realized P/L. A pending Data Decision can keep the affected chain out of a calculation, but it does not hide unrelated completed trades that are ready to use."),
      link("/help/open-positions/getting-started", "Read Open Positions help", "See why a confirmed open position remains outside realized completed-trade results."),
      link("/help/data-decisions/getting-started", "Read Data Decisions help", "Resolve a factual question with broker evidence when the page asks for one."),
    ]),
    section("unavailable-and-empty", "Unavailable is not zero", "Analytics leaves a result visibly unavailable when the necessary facts are missing or a calculation has no valid denominator.", ["unavailable", "empty analytics", "zero result", "missing facts", "partial coverage"], [
      paragraph("No completed trades in a view is an empty population. A displayed zero is a calculated zero. An unavailable value means Analytics does not have enough accepted information to calculate that specific result safely. Help does not turn any of those states into a guess."),
    ]),
    section("trade-analyzer-difference", "Core Analytics and Trade Analyzer are different", "Core Analytics uses its own completed-trade population; Trade Analyzer has separate market-data and replay requirements.", ["trade analyzer", "analytics difference", "market data", "candle replay"], [
      paragraph("A trade can appear in Core Analytics without being eligible for a Trade Analyzer replay. Use Trade Analyzer Help when you are reviewing saved chart and candle evidence rather than regular Trade Tracker outcome summaries."),
      link("/help/trade-analyzer/overview", "Read Trade Analyzer help", "Learn about chart replay and its separate eligibility and data requirements."),
    ]),
  ]),
]);

export function coreAnalyticsGuideBySlug(slug: string): HelpGuide | undefined {
  return CORE_ANALYTICS_HELP_GUIDES.find((guide) => guide.slug === slug);
}
