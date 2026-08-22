import type { HelpArticleBlock, HelpArticleSection, HelpGuide } from "./help-guide-types";

const paragraph = (text: string): HelpArticleBlock => Object.freeze({ kind: "paragraph", text });
const bullets = (items: readonly string[]): HelpArticleBlock => Object.freeze({ kind: "bullets", items: Object.freeze(items) });
const steps = (items: readonly Readonly<{ title: string; text: string }>[]): HelpArticleBlock => Object.freeze({ kind: "steps", items: Object.freeze(items) });
const callout = (title: string, text: string, tone?: "info" | "warning"): HelpArticleBlock => Object.freeze({ kind: "callout", title, text, ...(tone ? { tone } : {}) });
const link = (href: string, label: string, text: string): HelpArticleBlock => Object.freeze({ kind: "link", href, label, text });
const section = (id: string, title: string, summary: string, keywords: readonly string[], blocks: readonly HelpArticleBlock[]): HelpArticleSection => Object.freeze({ blocks: Object.freeze(blocks), id, keywords: Object.freeze(keywords), summary, title });
const guide = (slug: string, title: string, description: string, sections: readonly HelpArticleSection[]): HelpGuide => Object.freeze({ description, sections: Object.freeze(sections), slug, title });

export const DATA_DECISIONS_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  guide("getting-started", "Getting started", "Use Data Decisions only when TraderLink needs a factual answer from your broker statement before it can settle an affected trade chain.", [
    section("why-a-decision-appears", "Why a decision appears", "A source row, execution or position fact can need review when the available evidence conflicts or is incomplete.", ["data decisions", "why", "conflict", "duplicate", "statement issue"], [
      paragraph("Data Decisions does not ask you to judge a trade. It asks a focused factual question, such as whether two fills are the same execution, which value is correct, or whether a position remains open."),
      callout("Valid trades stay available", "A question about one chain does not hide unrelated accepted trades. TradersLink keeps the uncertain item separate instead of guessing a result."),
    ]),
    section("before-you-start", "Before you start", "Use the broker statement or reliable broker record that supports the answer.", ["broker statement", "evidence", "before deciding", "source row"], [
      bullets(["Read the question and the shown statement details before choosing an action.", "Use the broker-shown date, time, ticker, side, quantity, price and fees when correcting a fill.", "Choose only the option supported by the source. Do not change a value simply to make a trade total look right.", "Save one decision at a time, then review the updated page state."]),
    ]),
  ]),
  guide("resolve-a-trade-question", "Resolve a trade question", "Choose the action that matches the evidence for a duplicate, correction, order or missing trade fact.", [
    section("review-and-decide", "Review and decide", "Start in Trades needing a decision, then open the details for the affected item.", ["trades needing a decision", "review and decide", "statement row", "save changes"], [
      steps([
        Object.freeze({ title: "1. Open the item", text: "Read the plain-language question and open Review and decide." }),
        Object.freeze({ title: "2. Compare the details", text: "Check the shown statement row and the related execution details against your broker record." }),
        Object.freeze({ title: "3. Choose the factual action", text: "Select the option that reflects the broker evidence, then provide only the requested correction." }),
        Object.freeze({ title: "4. Save changes", text: "After saving, TradersLink rebuilds the affected facts and updates the item state." }),
      ]),
    ]),
    section("common-decisions", "Common decisions", "The available choices change with the facts in the item.", ["match duplicate", "separate executions", "fix row", "execution order", "exclude execution"], [
      bullets(["Match this to the broker execution when both sources show the same fill.", "Choose These are separate executions only when the broker record shows both fills occurred.", "Use Correct this execution when a shown execution fact is wrong and the source supports the correction.", "Set execution order when more than one fill has the same recorded time and their order matters.", "Keep an item out of trade results only when it is not a trade execution, is a duplicate, correction, reversal or corporate action."]),
      callout("The source history remains", "Excluding an execution keeps its original source history available. It removes that row from active trade reconstruction only after you save.", "warning"),
    ]),
  ]),
  guide("statement-issues-and-history", "Review statement issues and history", "Use the statement views to inspect what was imported and the history view to revisit a completed decision.", [
    section("statement-issues", "Statement issues and details", "Choose the matching tab to see rows needing attention or the complete selected statement details.", ["statement issues", "statement details", "broker statement", "review this row"], [
      paragraph("Statement issues narrows the view to rows that need attention. Statement details lets you inspect the selected broker statement more broadly. A row can show a Review this row action when there is a related decision."),
      paragraph("On a phone, statement rows and related executions are shown as stacked cards so the imported values and review action remain readable without horizontal scrolling. Larger screens keep the table view."),
      link("/help/notifications-and-imports/statement-will-not-import", "Read statement import help", "Learn how mapping, import review and the follow-up path fit together."),
    ]),
    section("review-history", "Review history", "Open Review history to see that a decision was reviewed and revisit its original details.", ["review history", "reviewed", "original details", "decision history"], [
      paragraph("A reviewed decision remains part of the Trade Tracker record. Review history shows the completed state and lets you inspect the original details without treating the prior question as an active issue again."),
      paragraph("Execution evidence uses the same compact card layout on phones and the full table on larger screens."),
    ]),
  ]),
  guide("open-position-decisions", "Open-position decisions", "Confirm or correct an open position only when the broker evidence supports that fact.", [
    section("confirm-an-open-position", "Confirm an open position", "Use the statement quantity to confirm that shares remain open when the page asks.", ["confirm open position", "shares open", "statement position", "trade type"], [
      paragraph("When Data Decisions asks whether a position remains open, compare the number of shares with your broker statement. Confirm it only when the statement supports the quantity; otherwise review the statement details and correct the factual issue."),
    ]),
    section("choose-a-trade-type", "Choose the current trade type", "After a position is confirmed, choose the description that matches your current intent.", ["trade type", "swing", "day trade still open", "unplanned hold", "not classified"], [
      paragraph("The available trade types describe an already confirmed position. Time held never chooses a type automatically, and selecting a type does not alter the original executions."),
      link("/help/open-positions/choose-status", "Read Open Positions help", "See how the same status is shared across Trade Tracker views."),
    ]),
  ]),
]);

export function dataDecisionsGuideBySlug(slug: string): HelpGuide | undefined {
  return DATA_DECISIONS_HELP_GUIDES.find((guide) => guide.slug === slug);
}
