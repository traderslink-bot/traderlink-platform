import type { HelpArticleBlock, HelpArticleSection, HelpGuide } from "./help-guide-types";

const paragraph = (text: string): HelpArticleBlock => Object.freeze({ kind: "paragraph", text });
const bullets = (items: readonly string[]): HelpArticleBlock => Object.freeze({ kind: "bullets", items: Object.freeze(items) });
const link = (href: string, label: string, text: string): HelpArticleBlock => Object.freeze({ kind: "link", href, label, text });
const section = (id: string, title: string, summary: string, keywords: readonly string[], blocks: readonly HelpArticleBlock[]): HelpArticleSection => Object.freeze({ blocks: Object.freeze(blocks), id, keywords: Object.freeze(keywords), summary, title });
const guide = (slug: string, title: string, description: string, sections: readonly HelpArticleSection[]): HelpGuide => Object.freeze({ description, sections: Object.freeze(sections), slug, title });

export const TRADE_EXPLORER_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  guide("use-trade-explorer", "Use Trade Explorer", "Inspect individual completed trades, rank factual groups, save useful views and maintain trade-review details.", [
    section("sort-and-rank", "Sort trades or rank groups", "Keep individual-trade sorting separate from grouped rankings.", ["trade explorer", "sort trades", "rank by", "result filter", "gross p/l", "net p/l"], [
      bullets([
        "The Trades view starts with all directions and the most recently closed trade first.",
        "Sort trades orders individual rows by facts each trade has, such as P/L, return, hold time, shares or entry value.",
        "Trading Days, Tickers, Entry Times, Holding Time, Position Size and Periods use Rank by to order their factual groups.",
        "Result narrows the current Gross or Net P/L population to Wins, Losses or Flat trades.",
        "Rank by offers the Gross or Net P/L that matches the selected Result basis and hides calculations that cannot produce a meaningful order for that selection.",
        "Manually entered trades with no fee entered are included in Net P/L. Use View no-fee trades to review those entries in Workspace.",
        "When broker fee details are missing from imported trades, they are excluded from Net P/L. Trade Explorer shows the excluded count only when it is greater than zero.",
      ]),
      link("/workspace?filter=fees_not_entered", "View no-fee trades", "Review manually entered trades where no fee was entered."),
    ]),
    section("review-a-trade", "Review a completed trade", "Save notes, tags and custom-rule results without changing execution facts.", ["review trade", "trade notes", "trade tags", "custom rules", "preset rules"], [
      bullets([
        "Choose Review to edit the completed trade's note, select up to 10 trader-chosen tags and mark applicable custom trade rules Followed, Broken or Not reviewed.",
        "Automatic preset-rule results are calculated from recorded facts and remain read-only.",
        "Previous and Next move through trades on the current results page. Save or deliberately discard changes before leaving an edited trade.",
        "Review never changes the trade's executions, price, quantity, date or P/L.",
      ]),
      link("/analytics/trade-explorer", "Open Trade Explorer", "Inspect and review your completed trades."),
    ]),
    section("saved-views", "Save and open views", "Keep a named Explorer setup for the selected trading account.", ["saved views", "save view", "filters", "saved filters", "open view"], [
      bullets([
        "Apply the filters, result view and ordering you want, then choose Save view and enter a custom name.",
        "Saved views stores the Explorer setup for the selected trading account. It does not create a second copy of the matching trades, notes, tags, rules or reviews.",
        "Open Saved views to see each custom title and its selected filters. Choose a card to restore that setup and recalculate the current results.",
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
