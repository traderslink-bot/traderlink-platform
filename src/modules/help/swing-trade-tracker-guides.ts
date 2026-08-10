import type { HelpArticleBlock, HelpArticleSection, HelpGuide } from "./help-guide-types";

const paragraph = (text: string): HelpArticleBlock => Object.freeze({ kind: "paragraph", text });
const bullets = (items: readonly string[]): HelpArticleBlock => Object.freeze({ kind: "bullets", items: Object.freeze(items) });
const steps = (items: readonly Readonly<{ title: string; text: string }>[]): HelpArticleBlock => Object.freeze({ kind: "steps", items: Object.freeze(items) });
const callout = (title: string, text: string): HelpArticleBlock => Object.freeze({ kind: "callout", title, text });
const link = (href: string, label: string, text: string): HelpArticleBlock => Object.freeze({ kind: "link", href, label, text });
const section = (id: string, title: string, summary: string, keywords: readonly string[], blocks: readonly HelpArticleBlock[]): HelpArticleSection => Object.freeze({ blocks: Object.freeze(blocks), id, keywords: Object.freeze(keywords), summary, title });
const guide = (slug: string, title: string, description: string, sections: readonly HelpArticleSection[]): HelpGuide => Object.freeze({ description, sections: Object.freeze(sections), slug, title });

export const SWING_TRADE_TRACKER_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  guide("getting-started", "Getting started", "Use the current Swing Trade Tracker to view and track intentional swing positions across their actual trading dates.", [
    section("what-you-can-do-today", "What you can do today", "Review active and recently completed swings, add executions and keep dated swing notes.", ["swing tracker", "active swing", "completed swing", "beta"], [
      paragraph("Swing Trade Tracker shows confirmed active swings first and recently completed swings below them. Each position keeps its own execution history, notes and current status."),
      callout("Currently in beta", "Swing Trade Tracker is in its early form while we learn which tools matter most. Use the available workflow today, and share feature suggestions that would make your review more useful."),
    ]),
    section("what-makes-a-swing", "What makes a position a swing", "A swing is a trader-chosen position type, not a label based on how long it has been open.", ["swing intent", "time held", "position type", "classification"], [
      paragraph("Choose Swing when that describes your intention for the position. Time held does not automatically turn a Day trade into a Swing, and a pending factual question is not shown as a confirmed active swing."),
      link("/help/open-positions/choose-status", "Read Open Positions help", "See the available position types and where they are shared."),
    ]),
  ]),
  guide("manage-a-swing", "Add, reduce and close a swing", "Keep every completed fill in the same tracked position while it remains open.", [
    section("add-executions", "Add an execution", "Record the broker fill that opens, adds to, reduces or closes the selected swing.", ["add execution", "reduce", "close", "fill"], [
      steps([
        Object.freeze({ title: "1. Open the active swing", text: "Find the position in Active swing trades." }),
        Object.freeze({ title: "2. Choose Add execution", text: "Enter the broker-shown date, time, side, quantity and price for the completed fill." }),
        Object.freeze({ title: "3. Review the result", text: "A fill can add to the position, reduce it or return it to zero. The execution remains on its actual date." }),
      ]),
    ]),
    section("when-a-swing-closes", "When a swing closes", "A position that returns to zero moves from the active list to recently completed swings.", ["completed swing", "close position", "history", "flat"], [
      paragraph("When the remaining position returns to zero, the swing is complete. Its saved execution history and dated notes remain available in recently completed swings. Opening the ticker again later begins a new position history."),
    ]),
  ]),
  guide("review-and-journal", "Review and track a swing", "Use dated notes, tags and the current position view to keep a useful record without changing executions.", [
    section("dated-notes", "Add dated swing notes", "Record today's observation or next-session plan on the selected Swing position.", ["swing notes", "next session", "daily note", "trade tracker"], [
      paragraph("Swing notes belong to one Swing position and one review date. They do not create a trade, change P/L or add activity to a Daily Trade Tracker day."),
      bullets(["Use Saved notes to revisit an earlier dated entry.", "Use Add additional note on an active Swing when you have a new observation.", "Write a next-session plan only when it is useful to your own review process."]),
    ]),
    section("tags-and-rules", "Use tags and rules", "Tags and current rule information add review context without changing the saved executions.", ["tags", "rules", "trade tags", "trading rules"], [
      paragraph("Tags are choices you make for the specific Swing position. Trading Rules continue to report factual results; neither tags nor notes alter a fill or its position."),
      link("/help/trade-tags/swing-trade-tracker", "Read Swing Trade Tag help", "Learn how to add or edit tags on a Swing position."),
    ]),
  ]),
  guide("current-limits", "Current limits and suggestions", "Know what is available now and where a factual question belongs.", [
    section("current-boundaries", "Current Swing Tracker boundaries", "The current view tracks a position; it is not a prediction or a full portfolio valuation tool.", ["unrealized p/l", "limitations", "market value", "beta"], [
      bullets(["The Tracker shows confirmed position facts and does not guess unrealized P/L when the required market information is unavailable.", "It does not infer Swing intent from duration, chart behavior or an overnight hold.", "A complete historical execution import belongs in Import Trades when that is the source you have."]),
      callout("Suggest an improvement", "This beta is meant to improve with trader feedback. Share the part of your swing-review workflow you would like to see supported next."),
    ]),
    section("needs-a-decision", "When a position needs a decision", "A pending source question stays separate from confirmed Swing positions.", ["data decisions", "pending", "duplicate", "position question"], [
      paragraph("If a statement or execution fact needs confirmation, TradersLink keeps the uncertainty visible instead of guessing. Resolve the specific question from your broker evidence before treating it as a confirmed position."),
      link("/help/data-decisions/getting-started", "Read Data Decisions help", "See how to review the exact question without changing unrelated trades."),
    ]),
  ]),
]);

export function swingTradeTrackerGuideBySlug(slug: string): HelpGuide | undefined {
  return SWING_TRADE_TRACKER_HELP_GUIDES.find((guide) => guide.slug === slug);
}
