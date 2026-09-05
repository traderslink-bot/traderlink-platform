import type { HelpArticleBlock, HelpArticleSection, HelpGuide } from "./help-guide-types";

const paragraph = (text: string): HelpArticleBlock => Object.freeze({ kind: "paragraph", text });
const bullets = (items: readonly string[]): HelpArticleBlock => Object.freeze({ kind: "bullets", items: Object.freeze(items) });
const steps = (items: readonly Readonly<{ title: string; text: string }>[]): HelpArticleBlock => Object.freeze({ kind: "steps", items: Object.freeze(items) });
const callout = (title: string, text: string, tone: "info" | "warning" = "info"): HelpArticleBlock => Object.freeze({ kind: "callout", text, title, tone });
const link = (href: string, label: string, text: string): HelpArticleBlock => Object.freeze({ kind: "link", href, label, text });
const section = (id: string, title: string, summary: string, keywords: readonly string[], blocks: readonly HelpArticleBlock[]): HelpArticleSection => Object.freeze({ blocks: Object.freeze(blocks), id, keywords: Object.freeze(keywords), summary, title });
const guide = (slug: string, title: string, description: string, sections: readonly HelpArticleSection[]): HelpGuide => Object.freeze({ description, sections: Object.freeze(sections), slug, title });

export const CANDLE_REVIEW_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  guide("getting-started", "Getting started", "Use Candle Review to inspect the recorded price path around one eligible completed stock trade.", [
    section("choose-a-completed-trade", "Choose a completed trade", "Candle Review starts from one eligible completed Trade Tracker trade, not from a live position or a new manual entry.", ["candle review", "completed trade", "stock trade", "price path", "eligible trade"], [
      paragraph("Open the completed trade from Session Tracker when its View candle review link is available. Candle Review is for a confirmed, closed stock trade with the details needed to place its entry and exit on the chart."),
      bullets(["Open positions do not have a completed price path yet.", "A longer-duration or non-stock trade may not have an approved one-minute review interval.", "Your Trade Tracker trade stays valid if Candle Review is unavailable; only the optional market-data review is unavailable."]),
      link("/trade-tracker", "Open Session Tracker", "Return to your daily review and open a completed trade when the follow-up link is available."),
    ]),
    section("what-candle-review-shows", "What Candle Review shows", "The page places your recorded entry and exit beside one-minute market candles and clear supporting observations.", ["entry marker", "exit marker", "candles", "chart", "one-minute"], [
      paragraph("The chart marks the recorded entry and exit, then shows the market candles available around them. The page can also show price-path feedback, execution context and indicator context when the needed market data is available."),
      callout("Review, not a trade grade", "Candle Review provides factual observations and clearly labeled assistance. It does not grade a trade, infer your intent or recommend what you should trade next."),
    ]),
  ]),
  guide("run-and-read-review", "Run and read a review", "Request the market-data review only when you are ready, then read the chart and feedback in the context of your recorded trade.", [
    section("analyze-on-demand", "Analyze on demand", "No market-data request happens merely because you open the page.", ["analyze this trade", "refresh candle review", "request candles", "on demand"], [
      steps([
        Object.freeze({ title: "Open the completed trade", text: "Choose View candle review from the available Daily Tracker follow-up link." }),
        Object.freeze({ title: "Select Analyze this trade", text: "TraderLink requests the bounded market-data interval only after you choose this action." }),
        Object.freeze({ title: "Use Refresh candle review when needed", text: "Refresh repeats the review flow for the same completed trade when the action is available." }),
      ]),
      paragraph("The request is limited to the displayed symbol, the approved interval and the bounded time window needed for that trade. It does not send your statement, notes, tags, rules or account information to the market-data provider."),
    ]),
    section("read-price-path", "Read the price path and feedback", "Use the chart as a record of the available market path, then compare its observations with your own trade review.", ["price path", "profit giveback", "entry timing", "exit timing", "execution context", "indicators"], [
      bullets(["Price path marks the recorded entry and exit on the available candles.", "Profit giveback, Entry timing and Exit timing describe the saved price-path feedback for this review.", "Execution context lists recognized candle observations around the trade.", "Indicator context shows the available indicator snapshots for the displayed phases."]),
      paragraph("Use these details alongside your own Trade Tracker notes and review. A candle's high and low do not establish the exact intrabar sequence, so the review does not claim more precision than the recorded market interval supports."),
    ]),
  ]),
  guide("availability-and-limits", "Availability and limits", "Understand why a Candle Review can be ready, unavailable or unsupported without changing the facts of your Trade Tracker trade.", [
    section("coverage-and-provider-status", "Coverage and provider status", "A market-data problem is kept separate from your completed trade record.", ["no coverage", "provider unavailable", "market data", "historical candles", "unavailable"], [
      bullets(["No coverage means the required one-minute data was unavailable or incomplete for the approved review window.", "Provider unavailable means the market-data request could not be completed at that time.", "Unsupported means the trade needs a reviewed market-data interval before Candle Review can analyze it."]),
      paragraph("In each case, TraderLink leaves the completed Trade Tracker trade unchanged. It does not invent a chart, feedback or market fact to fill the gap."),
    ]),
    section("review-boundaries", "Review boundaries", "Candle Review is a bounded historical context tool, not a replay of every market event or a substitute for your own evidence.", ["extended hours", "one-minute coverage", "historical retention", "limits", "market data"], [
      paragraph("The current review uses one-minute candles around the completed trade and includes regular and extended-hours activity when the provider has coverage. Older trades can be unavailable because providers may not retain the required one-minute history."),
      callout("Keep the evidence separate", "Candle Review adds optional market context. It does not alter executions, round trips, realized results or your saved Trade Tracker review."),
    ]),
  ]),
]);

export function candleReviewGuideBySlug(slug: string): HelpGuide | undefined {
  return CANDLE_REVIEW_HELP_GUIDES.find((guide) => guide.slug === slug);
}
