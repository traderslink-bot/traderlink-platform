import type { HelpGuide } from "./help-guide-types";

export const AI_REVIEWS_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  Object.freeze({
    slug: "getting-started",
    title: "Getting started",
    description: "Learn what AI Reviews do, where to turn them on and how your first review becomes available.",
    sections: Object.freeze([
      Object.freeze({
        id: "what-ai-reviews-do",
        title: "What AI Reviews do",
        summary: "Turn your verified trading activity and saved reflections into focused feedback.",
        keywords: Object.freeze(["AI review", "feedback", "trade tracker", "weekly", "monthly"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "AI Reviews look back at a finished trading period and organize the available evidence into a readable review. The goal is to help you see what improved, what held you back and what to focus on next." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Weekly and two-week reviews focus on complete U.S. trading weeks.",
            "Monthly reviews focus on one exact calendar month.",
            "The review uses verified trading results and any useful Trade Tracker details saved before the review begins.",
            "AI Reviews describe the evidence you recorded. They are not trading signals, predictions or investment advice.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "before-you-begin",
        title: "Before you begin",
        summary: "Choose a Trade Tracker account and confirm paid access.",
        keywords: Object.freeze(["account", "paid access", "Whop", "subscription", "requirements"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Choose a Trade Tracker account", text: "Each account keeps its own AI Review On/Off, frequency and timing choices." }),
            Object.freeze({ title: "2. Confirm paid access", text: "Open Account and check the paid-plan status. If needed, connect the Whop account used for the subscription." }),
            Object.freeze({ title: "3. Turn on AI Reviews", text: "In Account, switch AI Reviews on and choose how often you want a review." }),
            Object.freeze({ title: "4. Keep using Trade Tracker", text: "Verified executions can be reviewed even when you do not write notes or mark every daily review complete." }),
          ]) }),
          Object.freeze({ kind: "callout", title: "One subscription, separate account choices", text: "Paid access belongs to your TraderLink sign-in. If you use more than one Trade Tracker account, you can choose different AI Review settings for each account." }),
        ]),
      }),
      Object.freeze({
        id: "ai-reviews-page",
        title: "Use the AI Reviews page",
        summary: "Check your schedule, availability and saved reviews in one place.",
        keywords: Object.freeze(["review availability", "schedule", "saved reviews", "generate now", "coverage"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Area", "What it shows"]), rows: Object.freeze([
            Object.freeze(["Review schedule", "Whether AI Reviews are on, your current frequency and your weekly timing choice."]),
            Object.freeze(["Review availability", "The current weekly or two-week period and monthly period, their status and the Trade Tracker pages available to use."]),
            Object.freeze(["Weekly and two-week reviews", "Saved reviews for complete trading-week periods."]),
            Object.freeze(["Monthly reviews", "Saved reviews for exact calendar months."]),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "Select a saved review to reopen it. Reopening a review displays the saved result and does not create another AI request." }),
        ]),
      }),
      Object.freeze({
        id: "first-review",
        title: "What to expect from your first review",
        summary: "Understand partial months and periods with limited activity.",
        keywords: Object.freeze(["first review", "partial month", "few trades", "thin evidence", "no review"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Your first weekly review starts with the next available trading-week period after AI Reviews are enabled. Your first monthly review may cover only the part of the month beginning on the date you enabled the feature." }),
          Object.freeze({ kind: "callout", title: "Useful evidence matters more than a fixed trade count", text: "A week with very little activity may not support useful feedback. A context-free week with only one closed trade can combine once with the next trading week instead of being discarded." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "choose-schedule",
    title: "Choose your review schedule",
    description: "Choose weekly, two-week or monthly reviews and decide when a finished trading week should generate.",
    sections: Object.freeze([
      Object.freeze({
        id: "turn-on-or-off",
        title: "Turn AI Reviews on or off",
        summary: "Control new reviews without removing Trade Tracker data or saved reviews.",
        keywords: Object.freeze(["turn on", "turn off", "switch", "saved reviews", "account setting"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Open Account, find AI Reviews and use the On/Off switch for the selected Trade Tracker account. Turning the feature off stops new reviews for that account. It does not delete Trade Tracker data or reviews already issued." }),
          Object.freeze({ kind: "callout", title: "Paid access and the On/Off switch are different", text: "A paid plan can make AI Reviews available, but the account switch still controls whether that Trade Tracker account receives new reviews." }),
        ]),
      }),
      Object.freeze({
        id: "frequency-options",
        title: "Choose how often reviews arrive",
        summary: "Compare every trading week, every two trading weeks and monthly only.",
        keywords: Object.freeze(["frequency", "weekly", "two-week", "monthly only", "calendar month"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Choice", "What you receive"]), rows: Object.freeze([
            Object.freeze(["Every trading week", "One review for each complete trading week, plus a monthly review. A very thin one-trade week may combine once with the next week."]),
            Object.freeze(["Every two trading weeks", "One review covering exactly two consecutive trading weeks, plus a monthly review."]),
            Object.freeze(["Monthly only", "One review for each exact calendar month. Weekly and two-week reviews are not generated."]),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "A frequency change begins with the next available trading-week period. An open two-week period finishes both trading weeks before the new frequency starts." }),
        ]),
      }),
      Object.freeze({
        id: "automatic-timing",
        title: "Automatic after 12 hours",
        summary: "Generate from trading activity without requiring daily review completion.",
        keywords: Object.freeze(["automatic", "12 hours", "post-market", "final trading day", "minimal participation"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "This option begins a weekly or two-week review 12 hours after post-market ends on the final open trading session of the period. It does not require daily Trade Tracker reviews to be marked complete." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Verified executions are included whether or not a daily review is complete.",
            "Any notes, tags and rule results saved before generation begins may also be included.",
            "The 12-hour window gives you time to finish the final trading day's reflections without making daily participation mandatory.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "extra-time",
        title: "Give me extra time for Trade Tracker reviews",
        summary: "Generate sooner when you are ready or wait until the following trading week ends.",
        keywords: Object.freeze(["extra time", "mark complete", "generate now", "following week", "finish notes"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Choose this option when you want more time to add or revise Trade Tracker details. The review can begin sooner after you have marked the created daily reviews complete, or when you select Generate now." }),
          Object.freeze({ kind: "paragraph", text: "If you do neither, the review does not disappear and you are not required to complete homework on a fixed day. It automatically uses everything saved by the end of the following trading week." }),
          Object.freeze({ kind: "callout", title: "Generate now uses what is saved", text: "Check your notes, tags and rule results first. Once generation begins, that review keeps the evidence available at that time so later edits do not silently rewrite an issued review." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "what-ai-uses",
    title: "What AI Reviews can use",
    description: "Understand which trading facts, notes, tags, rules and Trade Tracker analysis can support your review.",
    sections: Object.freeze([
      Object.freeze({
        id: "verified-trading-facts",
        title: "Verified trading facts",
        summary: "Execution facts remain useful even when a daily review is not complete.",
        keywords: Object.freeze(["executions", "facts", "profit", "loss", "fees", "completed review"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "AI Reviews use the verified executions assigned to the selected Trade Tracker account and review period. These facts can include trade count, realized result, direction, holding time, entries, exits and recorded fees." }),
          Object.freeze({ kind: "callout", title: "Daily completion is not required for execution facts", text: "A day with executions can support an AI Review even when you did not write reflections or mark the daily review complete." }),
        ]),
      }),
      Object.freeze({
        id: "saved-reflections",
        title: "Notes, tags and rule results",
        summary: "Every non-empty item saved before generation begins may be included.",
        keywords: Object.freeze(["notes", "trade notes", "daily notes", "tags", "rules", "marked complete"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Saved item", "How it helps"]), rows: Object.freeze([
            Object.freeze(["Trade notes", "Add decision context that execution facts alone cannot show."]),
            Object.freeze(["Daily Notes", "Describe the day as a whole, including lessons that span several trades."]),
            Object.freeze(["Tags", "Show repeated setups, execution choices, mistakes, emotions, market context and risk behavior."]),
            Object.freeze(["Rule results", "Show which saved trade or daily rules were followed, broken or not applicable."]),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "These saved items may be used whether or not the daily review is marked complete. Marking complete affects early timing only when you selected the extra-time option." }),
          Object.freeze({ kind: "callout", title: "Missing tracking stays missing", text: "If you did not record a note, tag or rule result, the review should not pretend that you did. Execution-only reviews can still be useful, but their conclusions are narrower." }),
        ]),
      }),
      Object.freeze({
        id: "trade-analysis",
        title: "Trade Tracker analysis",
        summary: "Use compact chart-based context without sending a raw chart history.",
        keywords: Object.freeze(["1 minute", "5 minute", "chart analysis", "green to red", "patterns", "vwap", "ema"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "When supported analysis is available, an AI Review can use compact findings from the 1-minute and 5-minute trade analysis. This can add context around entry and exit timing without replacing the exact execution record." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Market activity such as relative volume, turnover and position around Session VWAP or EMA 9.",
            "Supported candle patterns and whether confirmation was available at the time.",
            "Movement in favor of and against the position while the trade was open.",
            "Green-to-red behavior, recovery and available post-exit movement.",
            "Entry, exit and combined-trade observations supported by the saved analysis.",
          ]) }),
          Object.freeze({ kind: "callout", title: "Analysis describes recorded market behavior", text: "The AI Review does not receive an unlimited raw candle history and should not invent a chart pattern or price path that the Trade Tracker did not establish." }),
        ]),
      }),
      Object.freeze({
        id: "evidence-freezes",
        title: "What happens when generation begins",
        summary: "The review keeps one stable set of evidence.",
        keywords: Object.freeze(["generation", "saved evidence", "later edits", "freeze", "retry"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "When an AI Review begins, it keeps the verified facts and saved Trade Tracker input available at that moment. This prevents a retry or reopened review from changing because the underlying day was edited later." }),
          Object.freeze({ kind: "paragraph", text: "Later corrections remain in Trade Tracker and can support future reviews. They do not silently rewrite a review that was already issued." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "weekly-two-week",
    title: "Weekly and two-week reviews",
    description: "See how trading weeks, holidays, low activity and month boundaries affect weekly review periods.",
    sections: Object.freeze([
      Object.freeze({
        id: "trading-week",
        title: "What counts as a trading week",
        summary: "Use the U.S. market calendar rather than requiring five weekdays or five reviews.",
        keywords: Object.freeze(["trading week", "market calendar", "holiday", "short week", "five days"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A trading week is the complete group of open U.S. market sessions assigned to that Monday-through-Friday market week. The market calendar identifies the final open session." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "A holiday-shortened week is still a complete trading week.",
            "You do not need to trade every open day.",
            "You do not need five completed daily reviews.",
            "If Friday is closed, the final open session may be Thursday. If the following Monday is also closed, that does not change the week that just ended.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "two-week-period",
        title: "How a two-week review works",
        summary: "Combine exactly two consecutive market-calendar trading weeks.",
        keywords: Object.freeze(["two week", "fortnight", "consecutive weeks", "frequency"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Every two trading weeks combines two complete consecutive trading-week groups. Holiday closures do not add replacement days, and a week with no trades remains part of the calendar period." }),
          Object.freeze({ kind: "paragraph", text: "The wider period can provide more context for traders who trade less often or prefer feedback less frequently." }),
        ]),
      }),
      Object.freeze({
        id: "limited-activity",
        title: "Weeks with limited activity",
        summary: "Keep thin evidence without forcing an unhelpful review.",
        keywords: Object.freeze(["one trade", "few trades", "combines next week", "not ready", "thin evidence"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "There is no customer-facing minimum trade quota. The app checks whether the available activity and saved context can support useful feedback." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Two closed trades can normally support a focused review.",
            "One closed trade with meaningful notes, tags or rule context may also be enough.",
            "A context-free week with only one closed trade may show Combines with next week and use a two-week period once.",
            "The trade is not discarded. If the wider period is still thin, the review must remain narrow and honest.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "cross-month-week",
        title: "When a trading week crosses a month",
        summary: "Keep the trading week whole while monthly facts remain exact.",
        keywords: Object.freeze(["cross month", "month end", "split week", "Monday Tuesday", "Wednesday Friday"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A weekly review is never split just because the calendar month changes during the week. It includes the complete trading week, such as Monday and Tuesday in the old month plus Wednesday through Friday in the new month." }),
          Object.freeze({ kind: "callout", title: "Weekly and monthly periods answer different questions", text: "The weekly review keeps the complete week together. Each monthly review still counts only the executions and saved facts dated inside its own calendar month." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "monthly-reviews",
    title: "Monthly reviews",
    description: "Understand exact calendar months, partial first months and weeks that cross month end.",
    sections: Object.freeze([
      Object.freeze({
        id: "exact-calendar-month",
        title: "One exact calendar month",
        summary: "Monthly statistics come from facts dated inside the month.",
        keywords: Object.freeze(["calendar month", "monthly facts", "statistics", "Eastern Time", "monthly only"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A monthly review covers the exact calendar month in Eastern Time. It rebuilds its trading statistics from executions and saved Trade Tracker facts dated inside that month." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Monthly only does not require weekly reviews to exist.",
            "A trade, tag or rule result outside the month cannot increase an in-month count.",
            "A saved note belongs to the date on which it was recorded for a Monthly only account.",
            "Any useful weekly context is secondary and cannot change the month's trade totals, P/L, rule counts or tag counts.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "month-ends-midweek",
        title: "When the month ends midweek",
        summary: "Separate exact monthly facts from the complete weekly review.",
        keywords: Object.freeze(["month ends Tuesday", "midweek", "Monday Tuesday", "notes", "rules", "tags"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "If a month ends on Tuesday, Monday and Tuesday execution facts, statistics, saved tags and recorded rule results belong to the month that ended. Wednesday through Friday belong to the new month." }),
          Object.freeze({ kind: "paragraph", text: "The weekly review still covers Monday through Friday as one complete trading week. Under a weekly setting, Monday and Tuesday notes remain part of that full weekly story rather than becoming a separate two-day weekly review." }),
          Object.freeze({ kind: "callout", title: "No double counting", text: "The monthly review may use clearly labelled process context from a cross-month weekly review, but it cannot use that narrative to add out-of-month trades, profit or loss, tags, or rule results." }),
        ]),
      }),
      Object.freeze({
        id: "first-partial-month",
        title: "Your first partial month",
        summary: "Begin from the date AI Reviews were enabled.",
        keywords: Object.freeze(["first month", "partial month", "enable date", "coverage"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "If you turn on AI Reviews after the month has started, the first monthly review can cover only the available dates beginning on the enablement date. The period label shows that shorter coverage." }),
          Object.freeze({ kind: "paragraph", text: "Later monthly reviews use the full calendar month unless AI Reviews are turned off or access is unavailable for part of the period." }),
        ]),
      }),
      Object.freeze({
        id: "monthly-timing",
        title: "When a monthly review becomes available",
        summary: "Use the first calendar day after month end, including weekends and holidays.",
        keywords: Object.freeze(["8 AM", "day after month end", "weekend", "holiday", "expected time"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A monthly review is scheduled for 8:00 AM Eastern on the first calendar day after the month ends. The AI Reviews page displays the expected time in your local timezone." }),
          Object.freeze({ kind: "paragraph", text: "Month end can fall on a weekend or holiday. The review still uses the exact month that ended and does not wait for another market session merely to redefine the period." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "read-your-review",
    title: "Read and use your review",
    description: "Understand each saved review section, its coverage note and how to use the next-period focuses.",
    sections: Object.freeze([
      Object.freeze({
        id: "review-header",
        title: "Review period and type",
        summary: "Confirm whether you opened a weekly, two-week or monthly review.",
        keywords: Object.freeze(["review type", "period", "weekly", "two-week", "monthly"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "The top of a saved review shows the review type and exact period. Check this first so you know whether the observations describe one trading week, two trading weeks or a calendar month." }),
          Object.freeze({ kind: "paragraph", text: "The review remains saved for the selected Trade Tracker account. Reopening it does not generate a new version." }),
        ]),
      }),
      Object.freeze({
        id: "review-sections",
        title: "What each section means",
        summary: "Move from the period summary to practical next steps.",
        keywords: Object.freeze(["review summary", "what improved", "held you back", "focus follow-through", "next review"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Section", "How to read it"]), rows: Object.freeze([
            Object.freeze(["Review summary", "The main evidence-backed story of the period."]),
            Object.freeze(["What improved", "Behaviors or results that were stronger than the available comparison context."]),
            Object.freeze(["What held you back", "Recorded patterns or decisions that reduced consistency or results."]),
            Object.freeze(["Focus follow-through", "How the current evidence relates to a focus saved from an earlier review, when available."]),
            Object.freeze(["Focus until your next review", "A short ordered list of practical review priorities for the next period."]),
            Object.freeze(["Coverage note", "What was missing, incomplete or too limited for a stronger conclusion."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "use-focuses",
        title: "Use the focus list",
        summary: "Carry a small number of review priorities into the next period.",
        keywords: Object.freeze(["focus list", "next period", "improve", "follow through"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Choose the most relevant focus", text: "Start with the item most clearly supported by your own trading evidence." }),
            Object.freeze({ title: "2. Connect it to your process", text: "Use a Trading Rule, tag or note prompt when that makes the focus easier to observe." }),
            Object.freeze({ title: "3. Record what happened", text: "Save the relevant result in Trade Tracker. Missing tracking cannot become proof later." }),
            Object.freeze({ title: "4. Compare the next review", text: "Read Focus follow-through to see whether the new period supplied useful evidence." }),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "coverage-limitations",
        title: "Read coverage limitations",
        summary: "Treat narrow evidence as narrow evidence.",
        keywords: Object.freeze(["coverage note", "missing data", "not recorded", "limited evidence", "accuracy"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A useful review can still say that something was not recorded or that there were too few examples for a broad conclusion. This is a protection against turning one trade or one note into an invented recurring pattern." }),
          Object.freeze({ kind: "callout", tone: "warning", title: "Correct the source, not the saved review", text: "If an execution or reflection is wrong, correct it in Trade Tracker so future reviews use the corrected evidence. An already issued review remains a record of what was available when it was created." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "availability-troubleshooting",
    title: "Availability and troubleshooting",
    description: "Understand review statuses, delayed generation, missing evidence and paid-access messages.",
    sections: Object.freeze([
      Object.freeze({
        id: "availability-statuses",
        title: "Review availability statuses",
        summary: "See what the current period is waiting for.",
        keywords: Object.freeze(["upcoming", "in progress", "scheduled", "ready", "not ready", "combines"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Status", "What it means"]), rows: Object.freeze([
            Object.freeze(["Upcoming", "The next review period has not started."]),
            Object.freeze(["In progress", "Trading activity and saved Trade Tracker input are still accumulating."]),
            Object.freeze(["Scheduled", "The period has an expected automatic time but is not due yet."]),
            Object.freeze(["Ready", "The period has ended and a review can begin or is automatically due."]),
            Object.freeze(["Combines with next week", "A context-free one-trade week is being kept and combined once with the following trading week."]),
            Object.freeze(["Not ready", "The finished period does not contain enough useful trading or reflection evidence for a meaningful review."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "generation-statuses",
        title: "Generation statuses",
        summary: "Follow a review from its saved request through completion.",
        keywords: Object.freeze(["pending", "generating", "retrying", "delay", "refresh"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Status", "What to do"]), rows: Object.freeze([
            Object.freeze(["Pending", "The review is saved and waiting to begin. You can leave the page."]),
            Object.freeze(["Generating", "The review is being written from the saved evidence. Avoid submitting another request."]),
            Object.freeze(["Retrying", "A temporary issue interrupted generation. The same saved evidence will be retried."]),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "Refresh the AI Reviews page after a reasonable wait. A saved request should not require you to keep the page open." }),
        ]),
      }),
      Object.freeze({
        id: "daily-review-coverage",
        title: "Check Trade Tracker review coverage",
        summary: "See which created daily pages are complete without treating them as a quota.",
        keywords: Object.freeze(["marked complete", "not marked complete", "daily reviews", "view month", "drawer"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "The weekly availability card lists created Daily Trade Tracker reviews as Marked complete or Not marked complete. Select a date to open that Trade Tracker page. Monthly coverage opens in a closeable side panel on desktop and a full-width panel on mobile." }),
          Object.freeze({ kind: "callout", title: "Coverage is information, not a requirement", text: "The list does not tell you to trade every day or create five reviews. Execution facts and saved input can be useful even when a daily page is not marked complete." }),
        ]),
      }),
      Object.freeze({
        id: "unavailable-messages",
        title: "When a review cannot start",
        summary: "Separate account settings, paid access and temporary platform availability.",
        keywords: Object.freeze(["AI Reviews off", "paid access unavailable", "platform unavailable", "subscription", "account"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Message", "Next step"]), rows: Object.freeze([
            Object.freeze(["AI Reviews are off", "Open Account, choose the Trade Tracker account and turn AI Reviews on if you want future reviews."]),
            Object.freeze(["Paid access unavailable", "Open the Paid plan and billing Help guide, then check the Whop connection and subscription status in Account."]),
            Object.freeze(["Platform unavailable", "Your evidence remains saved. Try again later; do not recreate the Trade Tracker data."]),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "Turning AI Reviews off or losing paid access does not remove reviews already issued. When access returns, future eligible periods can resume without duplicating saved reviews." }),
        ]),
      }),
    ]),
  }),
]);

export function aiReviewsGuideBySlug(slug: string): HelpGuide | undefined {
  return AI_REVIEWS_HELP_GUIDES.find((guide) => guide.slug === slug);
}
