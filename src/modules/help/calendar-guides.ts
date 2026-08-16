import type { HelpArticleBlock, HelpArticleSection, HelpGuide } from "./help-guide-types";

const paragraph = (text: string): HelpArticleBlock => Object.freeze({ kind: "paragraph", text });
const bullets = (items: readonly string[]): HelpArticleBlock => Object.freeze({ kind: "bullets", items: Object.freeze(items) });
const link = (href: string, label: string, text: string): HelpArticleBlock => Object.freeze({ kind: "link", href, label, text });
const section = (id: string, title: string, summary: string, keywords: readonly string[], blocks: readonly HelpArticleBlock[]): HelpArticleSection => Object.freeze({ blocks: Object.freeze(blocks), id, keywords: Object.freeze(keywords), summary, title });
const guide = (slug: string, title: string, description: string, sections: readonly HelpArticleSection[]): HelpGuide => Object.freeze({ description, sections: Object.freeze(sections), slug, title });

export const CALENDAR_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  guide("getting-started", "Getting started", "Use Calendar to see completed trades in your Trade Tracker by month or trading week and open the details behind a date.", [
    section("what-calendar-shows", "What Calendar shows", "Calendar groups accepted completed trades by the selected Trade Tracker account and trading date.", ["calendar", "completed trades", "p/l", "win rate", "trade tracker"], [
      paragraph("Calendar gives a visual view of completed trades. The summary cards show the selected period's P/L, trade count and win rate when the available facts support those results."),
      bullets(["Select Month for a broader trading-month view. Phones use a compact five-column grid so every weekday stays visible without sideways scrolling.", "Select Week for a five-day trading-week view. Phones use one readable card per day.", "Select a day or ticker to open the complete recorded details in the side panel or full-width mobile drawer."]),
    ]),
    section("empty-and-unavailable", "Empty and unavailable states", "An empty date and an unavailable calculation mean different things.", ["empty calendar", "unavailable", "coverage", "no trades"], [
      paragraph("A date with no completed trades does not pretend that a review exists. When the available facts cannot support a calculation, Calendar says so instead of showing a zero or a guessed result."),
    ]),
  ]),
  guide("month-and-week", "Use month and week views", "Move between the available periods and read the visual indicators without changing your trades.", [
    section("navigate-periods", "Move between periods", "Use the previous and next controls, then choose Month or Week to change how the same facts are arranged.", ["previous month", "next week", "month view", "week view"], [
      paragraph("The period controls move only through periods available for the selected account. Changing the view does not change Trade Tracker executions, notes, tags or Rule results."),
    ]),
    section("read-a-day", "Read a calendar day", "A day can show completed-trade P/L, trade count, win rate and selected review indicators.", ["day p/l", "trade count", "notes", "tags", "rules", "review completed"], [
      bullets(["A positive or negative result reflects the saved completed-trade result for the date.", "Ticker rows group the trades in that symbol for the selected day.", "Week view can show Notes, Rules and Tags indicators from saved Trade Tracker activity.", "The current trading week can show whether a Daily Trade Tracker review was completed."]),
    ]),
  ]),
  guide("inspect-a-day", "Inspect a day and its trades", "Open a day or ticker to see the saved trade information behind the Calendar cell.", [
    section("open-details", "Open the selected-day details", "Select a populated day, or select a ticker inside it, to review the available details.", ["selected day", "ticker details", "calendar drawer", "executions"], [
      paragraph("The selected-day panel lists the tickers in that date. It opens as a side drawer on desktop and uses the full phone width on mobile. Opening a ticker shows its completed trades, saved tags, notes and execution list when those facts are available."),
      link("/help/daily-trade-tracker/review-trades", "Read Daily Trade Tracker trade review help", "Use the Daily Tracker for the complete trade-review workflow and chart analysis."),
    ]),
    section("calendar-is-read-only", "Calendar is a review surface", "Use the original feature when you need to change a trade or add a new entry.", ["edit trade", "read only", "import trades", "daily tracker"], [
      paragraph("Calendar helps you find and inspect saved Trade Tracker activity. Use Daily Trade Tracker, Quick Trade Entry, Import Trades, Trading Rules or Trade Tags when you need to perform the related action."),
    ]),
  ]),
  guide("coverage-and-limits", "Coverage and limits", "Understand the factual boundaries behind Calendar results.", [
    section("included-trades", "Which trades can appear", "Completed accepted trades can contribute to Calendar; open or unresolved chains are kept distinct.", ["open positions", "data decisions", "accepted trades", "coverage"], [
      paragraph("Open positions remain visible in Open Positions instead of being included in realized P/L. A chain waiting for a Data Decision does not hide unrelated valid trades from Calendar."),
      link("/help/open-positions/getting-started", "Read Open Positions help", "See confirmed positions and choose a trader-authored status when needed."),
    ]),
    section("current-controls", "Current Calendar controls", "Help documents only controls that are presently available in the Calendar page.", ["calendar filters", "saved views", "session", "not available"], [
      paragraph("Calendar's current supported workflow is Month and Week navigation with selected-day details. A disabled or unavailable fact remains visibly unavailable; Help does not present it as a finished feature."),
    ]),
  ]),
]);

export function calendarGuideBySlug(slug: string): HelpGuide | undefined {
  return CALENDAR_HELP_GUIDES.find((guide) => guide.slug === slug);
}
