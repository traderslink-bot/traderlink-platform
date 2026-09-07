import type { HelpArticleBlock, HelpArticleSection, HelpGuide } from "./help-guide-types";

const paragraph = (text: string): HelpArticleBlock => Object.freeze({ kind: "paragraph", text });
const bullets = (items: readonly string[]): HelpArticleBlock => Object.freeze({ kind: "bullets", items: Object.freeze(items) });
const link = (href: string, label: string, text: string): HelpArticleBlock => Object.freeze({ kind: "link", href, label, text });
const section = (id: string, title: string, summary: string, keywords: readonly string[], blocks: readonly HelpArticleBlock[]): HelpArticleSection => Object.freeze({ blocks: Object.freeze(blocks), id, keywords: Object.freeze(keywords), summary, title });
const guide = (slug: string, title: string, description: string, sections: readonly HelpArticleSection[]): HelpGuide => Object.freeze({ description, sections: Object.freeze(sections), slug, title });

export const TRADE_EXPLORER_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  guide("use-trade-explorer", "Use Trade Explorer", "Inspect individual completed trades, sort factual groups and save useful views.", [
    section("sort-and-rank", "Sort trades or rank groups", "Keep individual-trade sorting separate from grouped rankings.", ["trade explorer", "sort trades", "rank by", "result filter", "gross p/l", "net p/l"], [
      bullets([
        "The Trades view starts with all directions and the most recently closed trade first.",
        "Sort trades orders individual rows by facts each trade has: close time, P/L, return on total entry value, holding time, total entry shares, peak shares held, total entry value, execution count or factual trading costs.",
        "Trading-cost sorts are available only for the fee-covered Net P/L population. An unavailable fee is never treated as zero.",
        "Trading Days uses Sort days. Tickers, Entry Times, Exit Times, Entry Weekday, Direction, Holding Time, Total Entry Shares, Share Size, Position Size, Total Entry Value, Entry Price and Periods use Rank by to order their factual groups.",
        "Share Size groups trades by peak shares held. Position Size groups trades by the maximum money value of shares held, calculated from Journal execution facts.",
        "Result narrows the current Gross or Net P/L population to Wins, Losses or Flat trades.",
        "Rank by offers the Gross or Net P/L that matches the selected Result basis and hides calculations that cannot produce a meaningful order for that selection.",
        "Manually entered trades with no fee entered are included in Net P/L. Use View no-fee trades to review those entries in Workspace.",
        "When broker fee details are missing from imported trades, they are excluded from Net P/L. Trade Explorer shows the excluded count only when it is greater than zero.",
      ]),
      link("/workspace?filter=fees_not_entered", "View no-fee trades", "Review manually entered trades where no fee was entered."),
    ]),
    section("filter-trades", "Filter completed trades", "Build an exact Journal-only population before reviewing rows or groups.", ["trade explorer filters", "currency", "trade type", "tags", "notes", "rules", "closed date"], [
      bullets([
        "Closed from and Closed to use each trade's closing date in the account trading timezone.",
        "Currency keeps money in one factual currency. Trade type classifies a Day trade when the position opens and fully closes on the same account-local date; a cross-date completion is Multi-day. This does not guess whether a trader intended a Swing.",
        "Entry session uses the account trading timezone: Premarket is 4:00–9:29 AM, Regular hours is 9:30 AM–3:59 PM and Post market is 4:00–7:59 PM. Entries outside those ranges remain available under All entry sessions.",
        "More filters includes entry weekday and time, holding time, total entry shares, peak shares held and total entry value.",
        "Choose one exact saved tag or Untagged. Because one trade can have several tags, separate tag selections can overlap and their totals are not expected to add to one exclusive total.",
        "Trade note present or missing and Review incomplete are workflow filters. Trade Explorer does not infer a setup, strategy, mistake or sentiment from note text.",
        "A custom rule filter uses one exact immutable rule version and keeps Followed, Broken, Not reviewed and Not applicable distinct. A saved association does not prove that a tag or rule caused a result.",
        "Day note and day-rule filters appear only in Trading Days. Saved notes, tags and rule results remain visible in Trade Details.",
      ]),
    ]),
    section("read-results", "Read trade and grouped results", "Use the trade table, day-session results and group evidence without mixing in Trade Analyzer statistics.", ["trade details", "trading days", "drawdown", "recovery", "trade analyzer"], [
      bullets([
        "Trading Days shows first entry, last exit, active ticker count, completed trades, wins, losses, P/L, best and worst trade, win rate, realized drawdown, recovery, giveback and the day's realized P/L path.",
        "Expand a Trading Days row to see its completed trades. Expand a Tickers row to see the completed trades for that ticker.",
        "Entry Times and Exit Times show full intervals in the account trading timezone. Quantity and money buckets use non-overlapping ranges.",
        "Choose Details on any trade to open its Trade Details drawer without leaving Trade Explorer. Exact executions remain available in the Trades table and in Trade Details.",
      ]),
      paragraph("Trade Explorer calculates these results from completed Journal trades, executions, charges, tags, notes and saved rule reviews. It does not require Trade Analyzer access and does not use candles, MFE/MAE, VWAP, EMA, RSI, relative volume, candle patterns, market-path Green-to-Red, Level Analysis or provider data."),
    ]),
    section("review-a-trade", "Open trade details", "Inspect one completed trade without leaving Trade Explorer.", ["trade details", "trade notes", "trade tags", "custom rules", "exact executions"], [
      bullets([
        "Choose Details to see the trade result, total shares, quantity-weighted entry and exit prices, total entry value, holding time, Journal notes, tags, saved rule results and exact executions.",
        "The drawer stays on Trade Explorer and does not show Trade Analyzer results or require Trade Analyzer access.",
        "Trade Details does not change the trade's executions, price, quantity, date or P/L.",
      ]),
      link("/analytics/trade-explorer", "Open Trade Explorer", "Inspect completed trades and open their details."),
    ]),
    section("saved-views", "Save and open views", "Keep a named Explorer setup for the selected trading account.", ["saved views", "save view", "filters", "saved filters", "open view"], [
      bullets([
        "Apply the filters, result view and ordering you want, then choose Save view and enter a custom name.",
        "Saved views stores the Explorer setup for the selected trading account. It does not create a second copy of the matching trades, notes, tags, rules or reviews.",
        "Open Saved views to see each custom title and the date it was created. Choose a card to expand or collapse its selected filters, then choose Open view to restore that setup and recalculate the current results.",
        "If you change a filter without applying it, apply the new results before saving so the saved view matches the table you can see.",
      ]),
      link("/analytics/trade-explorer", "Open Trade Explorer", "Save or reopen an Explorer view."),
    ]),
  ]),
  guide("compare-trades", "Compare Trades", "Compare the recorded results of two to four completed-trade groups without changing your trades or reviews.", [
    section("build-a-comparison", "Build a comparison", "Create two to four groups from the selected Trade Tracker account.", ["compare trades", "comparison", "baseline", "trade groups", "filters"], [
      bullets([
        "Open Compare Trades from the left navigation directly below Trade Explorer.",
        "Create two to four named groups. Each group can use its own completed-trade filters, such as date range, ticker, direction, result, holding time or position size.",
        "The first group is the baseline. Other groups show an exact difference only when both results use the same compatible P/L basis, currency, formula and timezone.",
        "The comparison can show completed trades, P/L, win rate, average P/L, profit factor, expectancy, return on entry value and average holding time when the required facts are available.",
      ]),
    ]),
    section("save-and-read", "Save and read a comparison", "Keep a useful study without treating a difference as advice.", ["saved comparison", "saved study", "comparison results", "account scope"], [
      bullets([
        "Save a useful comparison to the selected trading account, update it later or remove it.",
        "Saved studies do not change any trade, execution, note, tag, rule or review.",
        "Unavailable values remain unavailable when the required facts or a compatible comparison basis are missing.",
      ]),
      paragraph("A difference describes the completed trades in those groups. Compare Trades does not prove why a result occurred, label one group best or predict what will happen next."),
      link("/analytics/trade-explorer/compare", "Open Compare Trades", "Compare two to four groups of your completed trades."),
    ]),
  ]),
]);

export function tradeExplorerGuideBySlug(slug: string): HelpGuide | undefined {
  return TRADE_EXPLORER_HELP_GUIDES.find((guideItem) => guideItem.slug === slug);
}
