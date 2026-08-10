import type { HelpArticleBlock, HelpArticleSection, HelpGuide } from "./help-guide-types";

const paragraph = (text: string): HelpArticleBlock => Object.freeze({ kind: "paragraph", text });
const bullets = (items: readonly string[]): HelpArticleBlock => Object.freeze({ kind: "bullets", items: Object.freeze(items) });
const steps = (items: readonly Readonly<{ title: string; text: string }>[]): HelpArticleBlock => Object.freeze({ kind: "steps", items: Object.freeze(items) });
const callout = (title: string, text: string, tone?: "info" | "warning"): HelpArticleBlock => Object.freeze({ kind: "callout", title, text, ...(tone ? { tone } : {}) });
const link = (href: string, label: string, text: string): HelpArticleBlock => Object.freeze({ kind: "link", href, label, text });
const section = (id: string, title: string, summary: string, keywords: readonly string[], blocks: readonly HelpArticleBlock[]): HelpArticleSection => Object.freeze({ blocks: Object.freeze(blocks), id, keywords: Object.freeze(keywords), summary, title });
const guide = (slug: string, title: string, description: string, sections: readonly HelpArticleSection[]): HelpGuide => Object.freeze({ description, sections: Object.freeze(sections), slug, title });

export const QUICK_TRADE_ENTRY_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  guide("getting-started", "Getting started", "Enter executions directly when you do not need to complete a Daily or Swing Trade Tracker review.", [
    section("when-to-use-quick-entry", "When to use Quick Trade Entry", "Choose the execution-only path for past trades or several trading dates.", ["quick entry", "past trades", "multiple dates", "manual entry"], [
      paragraph("Quick Trade Entry records broker fills in your selected Trade Tracker account without opening a Daily Trade Tracker or Swing Trade Tracker review."),
      bullets(["Use it when you need to enter executions for more than one past trading date in the same batch.", "Use Daily Trade Tracker when you want to review one trading day with notes, tags, rules and day review.", "Use Swing Trade Tracker when you are recording or managing an intentional swing position."]),
      callout("Execution-only entry", "Quick Trade Entry saves executions. It does not create Daily Notes, trade tags, Trading Rule reviews, a day-review record or Swing notes."),
    ]),
    section("what-to-enter", "Enter the broker-shown fill", "Use the date, time, ticker, side, quantity, price and reported fees from the completed fill.", ["fill", "broker time", "ticker", "quantity", "price", "fees"], [
      paragraph("An execution is one completed broker fill. Enter the details shown by your broker, including the actual trading date and time for each row."),
      callout("Use the fill, not the order", "An order can be cancelled or filled in several parts. Record the completed fills that changed the position.", "warning"),
    ]),
  ]),
  guide("enter-executions", "Enter executions across dates", "Add as many completed fills as you need, including rows from different past trading dates.", [
    section("add-rows", "Add every completed fill", "Keep partial entries, adds, partial exits and final exits as separate rows.", ["add execution", "partial exit", "add", "multiple trades"], [
      steps([
        Object.freeze({ title: "1. Start with one execution", text: "Enter its trading date, Eastern Time, ticker, Buy or Sell side, quantity and price." }),
        Object.freeze({ title: "2. Add another row", text: "Add rows for every later fill, including a fill on a different past date." }),
        Object.freeze({ title: "3. Add reported fees", text: "Enter fees only when the broker reports them. Leave an unknown fee blank rather than guessing." }),
        Object.freeze({ title: "4. Save the batch", text: "Check the entries before saving. TraderLink keeps each execution on its actual trading date." }),
      ]),
    ]),
    section("how-trades-form", "How executions become trades", "TradersLink follows the running position from zero until it returns to zero.", ["trade", "execution", "flat", "long", "short", "partial fill"], [
      paragraph("A trade starts when the position leaves zero and closes when it returns to zero. Additional fills while shares remain open are part of the same trade. The next execution after zero starts another trade, even when it is the same ticker."),
      link("/help/daily-trade-tracker/add-edit-trades#executions-build-trades", "Read how executions become trades", "The Daily Trade Tracker guide includes simple Long and Short examples."),
    ]),
    section("future-times", "Use past execution times only", "A saved execution must already have happened.", ["future time", "future date", "validation", "past date"], [
      paragraph("Quick Trade Entry accepts past trading dates, including several dates in one batch. A future execution time cannot be saved because it is not yet a completed broker fill."),
    ]),
  ]),
  guide("after-saving", "Review saved entries and next steps", "Find the resulting trade in the right review surface after your executions are saved.", [
    section("choose-next-step", "Choose the right next page", "Quick Trade Entry saves the facts first; your review workflow depends on the trade.", ["after save", "daily tracker", "swing tracker", "open positions"], [
      bullets(["Open Daily Trade Tracker to review a current or recent trading day with its notes, rules, tags and day review.", "Open Swing Trade Tracker for an intentional active or recently completed swing.", "Open Open Positions when a factual position remains open and you need to choose its current status.", "Open Data Decisions only when TraderLink identifies a specific factual question that needs your broker evidence."]),
      link("/trade-tracker", "Open Daily Trade Tracker", "Use the Daily Tracker when the next step is reviewing one trading day."),
    ]),
    section("manual-and-imported-fills", "Manual and imported fills share one Trade Tracker", "A later broker statement is checked rather than silently counted twice.", ["duplicate", "statement import", "manual fill", "broker import"], [
      paragraph("Quick Trade Entry and statement imports both add to the same Trade Tracker history. When an imported fill might be the same as a manual fill, TradersLink asks for a decision instead of deleting either source or double-counting the trade."),
      link("/help/data-decisions/getting-started", "Read Data Decisions help", "See how to answer a factual question from your broker evidence."),
    ]),
  ]),
  guide("limits-and-decisions", "Limits and follow-up decisions", "Understand what Quick Trade Entry does not do and what happens when the facts need confirmation.", [
    section("what-quick-entry-does-not-do", "What Quick Trade Entry does not do", "Use a Tracker when you want an intentional review workflow rather than only execution entry.", ["no notes", "no tags", "no rules", "no daily review", "limitations"], [
      bullets(["It does not decide whether a trade is a Day trade or Swing trade.", "It does not create or update tags, Trading Rule results, trade notes, Daily Notes or Swing notes.", "It does not create a completed day review.", "It does not replace a historical broker statement import when you need a larger verified history."]),
    ]),
    section("when-a-decision-appears", "When a decision appears", "Only a real ambiguity is sent to Data Decisions; unrelated saved trades stay available.", ["needs decision", "conflict", "duplicate", "data decisions"], [
      paragraph("A possible duplicate, contradiction or incomplete fact may need a decision. TradersLink keeps the question specific and does not hide unrelated valid trades while you review it."),
      link("/data-decisions", "Open Data Decisions", "Review only the items that need your broker evidence."),
    ]),
  ]),
]);

export function quickTradeEntryGuideBySlug(slug: string): HelpGuide | undefined {
  return QUICK_TRADE_ENTRY_HELP_GUIDES.find((guide) => guide.slug === slug);
}
