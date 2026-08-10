import type { HelpArticleBlock, HelpArticleSection, HelpGuide } from "./help-guide-types";

const paragraph = (text: string): HelpArticleBlock => Object.freeze({ kind: "paragraph", text });
const bullets = (items: readonly string[]): HelpArticleBlock => Object.freeze({ kind: "bullets", items: Object.freeze(items) });
const link = (href: string, label: string, text: string): HelpArticleBlock => Object.freeze({ kind: "link", href, label, text });
const section = (id: string, title: string, summary: string, keywords: readonly string[], blocks: readonly HelpArticleBlock[]): HelpArticleSection => Object.freeze({ blocks: Object.freeze(blocks), id, keywords: Object.freeze(keywords), summary, title });
const guide = (slug: string, title: string, description: string, sections: readonly HelpArticleSection[]): HelpGuide => Object.freeze({ description, sections: Object.freeze(sections), slug, title });

export const OPEN_POSITIONS_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  guide("getting-started", "Getting started", "Use Open Positions to see confirmed positions that have not returned to zero and record their current trader-defined status.", [
    section("confirmed-open-positions", "Confirmed open positions", "A confirmed position remains open until the saved quantity returns to zero.", ["open positions", "remaining quantity", "average entry", "confirmed open"], [
      paragraph("The table shows confirmed positions with their opened time, ticker, side, remaining quantity, average entry, age and current trade status. Time held does not choose that status for you."),
      bullets(["An Active swing is an intentional swing position.", "Day trade still open means the day-trade position has not yet returned to zero.", "Unplanned hold records a position that no longer matches the original Day-trade intention.", "Not classified means you have not recorded the current position type yet."]),
    ]),
    section("what-is-not-in-the-total", "What is not in the confirmed total", "A factual chain needing confirmation remains separate until the evidence is resolved.", ["pending", "data decisions", "needs decision", "confirmed total"], [
      paragraph("A position that requires a Data Decision is not represented as a confirmed open position. This protects the Trade Tracker from assuming a quantity or status before the trader has reviewed the source evidence."),
      link("/help/data-decisions/getting-started", "Read Data Decisions help", "Review the exact factual question when an item needs your decision."),
    ]),
  ]),
  guide("choose-status", "Choose a position status", "Use the status that describes your current intent; it is shared across the relevant Trade Tracker views.", [
    section("choose-the-best-description", "Choose the best description", "Pick the status that matches what the position is now, not what the system guesses from time held.", ["active swing", "day trade still open", "bag hold", "long-term hold", "status"], [
      bullets(["Choose Active swing for a position you intentionally continue as a Swing.", "Choose Day trade still open when the Day trade is still active.", "Choose Unplanned hold when an intended Day trade became a hold you did not plan.", "Choose Long-term hold when you intentionally treat it as a longer-term holding.", "Choose Not classified while you have not decided how to describe the position."]),
    ]),
    section("shared-status", "The status is shared", "A change is reflected in Daily Trade Tracker, Swing Trade Tracker and Open Positions.", ["shared status", "daily tracker", "swing tracker", "reclassify"], [
      paragraph("These pages read the same confirmed position. Choosing a different status updates its current classification; it does not move executions, change their dates or create a second position history."),
      link("/help/swing-trade-tracker/getting-started", "Read Swing Trade Tracker help", "Open the Swing Tracker when the position is an intentional active Swing."),
    ]),
  ]),
  guide("positions-needing-a-decision", "Positions needing a decision", "Use Data Decisions when the source facts do not yet support a confirmed position.", [
    section("review-the-source-question", "Review the source question", "Answer only what your broker statement supports.", ["statement position", "shares", "position decision", "broker evidence"], [
      paragraph("Data Decisions presents the specific missing, conflicting or duplicate fact. Use your broker statement to confirm the quantity or correct the information; do not guess to make a position appear complete."),
      link("/data-decisions", "Open Data Decisions", "Review the factual question and its available choices."),
    ]),
    section("realized-results", "Open positions and realized results", "An open position can remain visible without being included in realized P/L.", ["realized p/l", "unrealized", "open trade", "analytics"], [
      paragraph("Open Positions keeps a confirmed open lifecycle visible. It does not turn an open position into realized profit or loss before the position has returned to zero."),
    ]),
  ]),
]);

export function openPositionsGuideBySlug(slug: string): HelpGuide | undefined {
  return OPEN_POSITIONS_HELP_GUIDES.find((guide) => guide.slug === slug);
}
