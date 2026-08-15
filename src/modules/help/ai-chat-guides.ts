import type { HelpGuide } from "./help-guide-types";

export const AI_CHAT_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  Object.freeze({
    slug: "getting-started",
    title: "Getting started",
    description: "Open AI Chat from anywhere in the dashboard and ask about the trading record saved to your selected Trade Tracker account.",
    sections: Object.freeze([
      Object.freeze({
        id: "open-and-close-chat",
        title: "Open and close AI Chat",
        summary: "Use the AI Chat link without leaving the dashboard page you are reviewing.",
        keywords: Object.freeze(["open chat", "close chat", "drawer", "conversation"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph" as const, text: "AI Chat opens beside the page you are using on a larger screen and fills the screen on mobile. Close it whenever you want to return to the page underneath." }),
          Object.freeze({ kind: "paragraph" as const, text: "Your conversations are saved to the selected Trade Tracker account. You can start a new conversation, rename one, search your history, or archive a conversation you no longer need in the main list." }),
        ]),
      }),
      Object.freeze({
        id: "ask-useful-questions",
        title: "Ask useful questions",
        summary: "Ask about results, patterns, notes, rules, focuses, saved AI Reviews or TraderLink features.",
        keywords: Object.freeze(["questions", "results", "patterns", "notes", "rules", "focuses"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph" as const, text: "You can ask about completed-trade results, timing, tickers and repeated patterns. AI Chat can also help you reflect on saved notes, rules and Current Focuses, or discuss a saved weekly or monthly AI Review." }),
          Object.freeze({ kind: "paragraph" as const, text: "A specific question usually gives a more useful answer. Include the result or behavior you want to understand, then use the Explore control to choose the matching period or ticker." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "choose-what-to-explore",
    title: "Choose what to explore",
    description: "Keep an answer focused on recent history, one day, one week, one month, custom dates or one ticker.",
    sections: Object.freeze([
      Object.freeze({
        id: "choose-scope",
        title: "Choose the trading activity",
        summary: "Set the period or ticker before sending a factual question.",
        keywords: Object.freeze(["date range", "day", "week", "month", "ticker", "scope"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph" as const, text: "Recent history is the normal starting point. Choose a day, week, month, custom date range or ticker when you want the answer limited to that activity." }),
          Object.freeze({ kind: "paragraph" as const, text: "The selected choice stays visible above the conversation. Change it before your next question when you want to explore something else." }),
        ]),
      }),
      Object.freeze({
        id: "daily-tracker-context",
        title: "Ask from Daily Trade Tracker",
        summary: "Open Chat from a trading day to use that day's saved trades and review details.",
        keywords: Object.freeze(["daily tracker", "trading day", "daily notes", "trade note"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph" as const, text: "When you open AI Chat from Daily Trade Tracker, that trading day is shown at the top of Chat. You can ask about its saved trades, notes, tags, rules and Current Focuses or ask for an editable note draft." }),
          Object.freeze({ kind: "paragraph" as const, text: "A draft never changes the trading day by itself. Read and edit the proposed wording, then use the normal save action if you want to keep it." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "enter-executions",
    title: "Enter executions",
    description: "Type completed execution details naturally, review the draft and confirm the normal Trade Tracker preview before anything is saved.",
    sections: Object.freeze([
      Object.freeze({
        id: "create-a-draft",
        title: "Create an execution draft",
        summary: "Include the actual Eastern date, time, ticker, side, quantity and price for every execution.",
        keywords: Object.freeze(["manual entry", "executions", "buy", "sell", "draft"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph" as const, text: "You do not need to choose a special mode. Tell AI Chat that you want to enter executions and include the actual Eastern trading date and time, ticker, buy or sell side, quantity and price. Fees are optional." }),
          Object.freeze({ kind: "paragraph" as const, text: "Missing details stay missing. AI Chat asks for the required fact instead of guessing it, and every digit you provide remains available in the editable draft." }),
        ]),
      }),
      Object.freeze({
        id: "review-before-save",
        title: "Review before saving",
        summary: "Nothing reaches the execution ledger until you confirm the canonical preview.",
        keywords: Object.freeze(["preview", "confirm", "save", "duplicate"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph" as const, text: "Check every draft row and make corrections before continuing. TraderLink then runs the same preview and duplicate protections used by its other manual-entry pages." }),
          Object.freeze({ kind: "paragraph" as const, text: "Only your final confirmation can save the executions. Chat cannot place a broker order, bypass a duplicate warning or silently change an existing trade." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "answers-and-privacy",
    title: "Answers and privacy",
    description: "Understand what supports an answer, what remains private and why some questions have a limited result.",
    sections: Object.freeze([
      Object.freeze({
        id: "saved-facts-and-coverage",
        title: "Saved facts and coverage",
        summary: "Answers use the selected account's available Trade Tracker facts and say when coverage is limited.",
        keywords: Object.freeze(["coverage", "unavailable", "completed trades", "open positions"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph" as const, text: "Factual answers come from the completed trades and saved review details available for the selected Trade Tracker account. Open positions stay separate from realized results." }),
          Object.freeze({ kind: "paragraph" as const, text: "When the requested fact is missing, unsupported or based on too little activity, the answer should say so rather than fill the gap with a guess." }),
        ]),
      }),
      Object.freeze({
        id: "private-conversations",
        title: "Private conversations",
        summary: "Conversation text stays with the selected account and is not shown in normal owner reports.",
        keywords: Object.freeze(["privacy", "history", "archive", "account"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph" as const, text: "Your conversation text and the trading details used for an answer are kept with your selected Trade Tracker account. Normal operating reports use request counts, status, timing and cost information rather than displaying private messages." }),
          Object.freeze({ kind: "paragraph" as const, text: "Archiving removes a conversation from the active list but keeps its history available to restore. Permanent account-data deletion follows the account deletion policy rather than the archive action." }),
        ]),
      }),
    ]),
  }),
]);

export function aiChatGuideBySlug(slug: string): HelpGuide | undefined {
  return AI_CHAT_HELP_GUIDES.find((guide) => guide.slug === slug);
}
