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
          Object.freeze({ kind: "paragraph" as const, text: "You can ask about completed-trade results, timing, tickers and repeated patterns. AI Chat can also help you reflect on saved notes, rules and Current Focuses, or discuss a saved weekly, two-week or monthly AI Review." }),
          Object.freeze({ kind: "paragraph" as const, text: "Ask which Trading Rules are active, what settings they use, which preset checks were Followed, Broken or unavailable, or which tags and trade note you saved on one completed trade. AI Chat reads those saved results; it does not decide a rule outcome or treat a tag as proof." }),
          Object.freeze({ kind: "paragraph" as const, text: "You can also ask about saved Trade Analyzer results, an existing Candle Review, recent imports, Data Decisions, notifications, account preferences and whether a Moomoo connection or automatic import is set up." }),
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
          Object.freeze({ kind: "paragraph" as const, text: "Analyzer questions use results TraderLink has already saved. Asking in Chat does not start a new analysis, refresh a Candle Review or request market data." }),
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
          Object.freeze({ kind: "paragraph" as const, text: "AI Chat can explain import and connection status without receiving your uploaded statement rows, broker account number, connection credentials, access tokens or payment identifiers." }),
          Object.freeze({ kind: "paragraph" as const, text: "Archiving removes a conversation from the active list but keeps its history available to restore. Permanent account-data deletion follows the account deletion policy rather than the archive action." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "confirm-changes",
    title: "Confirm changes",
    description: "Review a clear before-and-after preview when AI Chat prepares a supported account change.",
    sections: Object.freeze([
      Object.freeze({
        id: "supported-changes",
        title: "Supported changes",
        summary: "Change supported preferences, Swing details, trade tags, or Trading Rules through a clear confirmation preview.",
        keywords: Object.freeze(["reporting currency", "notification", "Discord", "AI Reviews", "switch account", "Swing note", "position type", "trade tags", "trading rules", "confirm"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph" as const, text: "Ask AI Chat to change your reporting currency, mark one exact notification read, choose which updates go to Discord, turn existing AI Reviews on or off, request an available AI Review, switch to an existing Trade Tracker account, create a new Trade Tracker account, save a dated Swing note, change an open position's type, change the tags on one exact trade or Swing, or add and manage a Trading Rule. Chat checks the current value or target before it prepares anything." }),
          Object.freeze({ kind: "paragraph" as const, text: "For an AI Review request, Chat shows the exact available review type and date range. Confirmation saves the request; the completed review appears after the separate review process finishes." }),
          Object.freeze({ kind: "paragraph" as const, text: "Before creating a Trade Tracker account, Chat shows the exact account name, base currency and trading timezone. The new account is created and becomes active only after you confirm the preview." }),
          Object.freeze({ kind: "paragraph" as const, text: "For Swing notes, Chat keeps the exact review date and complete note wording you provide. For an open position, it changes the type only when you explicitly choose active swing, day trade still open, bag hold, or long-term hold." }),
          Object.freeze({ kind: "paragraph" as const, text: "For trade tags, Chat shows the complete current and proposed tag lists. It uses only tags you explicitly requested from the available saved or preset choices; it does not add a setup, emotion, mistake or rule tag based on its own interpretation." }),
          Object.freeze({ kind: "paragraph" as const, text: "For Trading Rules, Chat can add a maintained preset with every required setting, create or revise a custom rule, or pause, resume, and retire an exact saved rule. It will not activate a suggested rule unless you explicitly ask for that exact change." }),
          Object.freeze({ kind: "paragraph" as const, text: "For a supported Data Decision, Chat can prepare an exact confirmation, supported duplicate choice, execution exclusion or restoration, grouped-fill reconciliation, or source-limitation acceptance. Corrections that require entering values or comparing the original statement stay on the Data Decisions page, where you can inspect every row." }),
          Object.freeze({ kind: "paragraph" as const, text: "The proposed change appears in the conversation with a clear preview. Nothing changes until you choose Confirm change. You can cancel the proposal instead, and an unconfirmed proposal expires after 24 hours." }),
        ]),
      }),
    ]),
  }),
]);

export function aiChatGuideBySlug(slug: string): HelpGuide | undefined {
  return AI_CHAT_HELP_GUIDES.find((guide) => guide.slug === slug);
}
