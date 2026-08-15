import { coachAiChatLanguageInventory } from "./coach-ai-chat-language-inventory.generated";

/**
 * This registry is the runtime truth for what AI Chat can do today.  It is
 * intentionally smaller than the language inventory: recognizing a trader's
 * wording does not authorize an answer, calculation, or change without the
 * corresponding bounded TraderLink implementation.
 */
export type CoachAiChatRuntimeCapability = Readonly<{
  id: string;
  kind: "factual_read" | "confirmed_draft";
  plainLanguage: string;
  canonicalNames: readonly string[];
  limitations: readonly string[];
}>;

function canonicalNames(runtimeCapabilityId: string): readonly string[] {
  return Object.freeze([...new Set(coachAiChatLanguageInventory
    .filter((entry) => entry.runtimeCapabilityId === runtimeCapabilityId)
    .map((entry) => entry.canonicalName))]
    .sort((left, right) => left.localeCompare(right)));
}

export const coachAiChatRuntimeCapabilityRegistry = Object.freeze([
  Object.freeze({
    id: "closed_trade_facts",
    kind: "factual_read" as const,
    plainLanguage: "Completed-trade results, filtered trade lists, and supported comparisons.",
    canonicalNames: canonicalNames("closed_trade_facts"),
    limitations: Object.freeze([
      "Open positions and items still awaiting a trader decision are not included in realized results.",
      "TraderLink keeps different trade currencies separate instead of estimating a combined total.",
    ]),
  }),
  Object.freeze({
    id: "daily_tracker_drafts",
    kind: "confirmed_draft" as const,
    plainLanguage: "Draft a Daily Trade Tracker note, one trade note, or Current Focuses for the selected trading day.",
    canonicalNames: canonicalNames("daily_tracker_drafts"),
    limitations: Object.freeze([
      "The trader reviews and saves the draft themselves.",
      "Chat cannot change tags, rules, rule outcomes, position classifications, executions, or review completion.",
    ]),
  }),
  Object.freeze({
    id: "manual_execution_drafts",
    kind: "confirmed_draft" as const,
    plainLanguage: "Turn clearly supplied execution details into an editable manual-entry draft.",
    canonicalNames: canonicalNames("manual_execution_drafts"),
    limitations: Object.freeze([
      "Every date, Eastern time, ticker, side, quantity, and price must come from the trader.",
      "Nothing is saved until the trader checks the normal Journal preview and confirms it.",
    ]),
  }),
  Object.freeze({
    id: "review_delivery_draft",
    kind: "confirmed_draft" as const,
    plainLanguage: "Prepare a change to the weekly AI Review delivery day or Eastern delivery time.",
    canonicalNames: canonicalNames("review_delivery_draft"),
    limitations: Object.freeze([
      "Only Friday, Saturday, or Sunday and the supported evening Eastern times are available.",
      "The trader must review and confirm the change before Account Settings saves it.",
    ]),
  }),
  Object.freeze({
    id: "journal_period_context",
    kind: "factual_read" as const,
    plainLanguage: "Discuss a saved trading day, week, or month with its rules, focuses, notes, and tags.",
    canonicalNames: Object.freeze([]),
    limitations: Object.freeze([
      "The model does not infer why a rule was broken or treat a tag as proof.",
      "Large periods may show exact totals with a bounded sample of individual trades.",
    ]),
  }),
  Object.freeze({
    id: "saved_ai_review_follow_up",
    kind: "factual_read" as const,
    plainLanguage: "Read saved weekly, two-week, and monthly AI Reviews and answer follow-up questions.",
    canonicalNames: Object.freeze([]),
    limitations: Object.freeze([
      "A saved review describes its original period and does not prove what happened later.",
    ]),
  }),
  Object.freeze({
    id: "product_help",
    kind: "factual_read" as const,
    plainLanguage: "Explain TraderLink features using the maintained Help Center.",
    canonicalNames: canonicalNames("product_help"),
    limitations: Object.freeze([
      "Product help does not include trading advice or unsupported broker instructions.",
    ]),
  }),
  Object.freeze({
    id: "current_dashboard_journal_reads",
    kind: "factual_read" as const,
    plainLanguage: "Read the current Workspace, Daily Trade Tracker, Calendar, Open Positions, and Swing Trade Tracker.",
    canonicalNames: Object.freeze([]),
    limitations: Object.freeze([
      "Open positions never contribute to realized profit and loss.",
      "Swing and open-position types come from the trader's saved classification and are not inferred by Chat.",
      "Calendar questions are limited to 62 days per factual request.",
    ]),
  }),
  Object.freeze({
    id: "current_dashboard_analytics_reads",
    kind: "factual_read" as const,
    plainLanguage: "Read Analytics Overview, Results by Ticker, Timing, Execution, and bounded Trade Explorer results.",
    canonicalNames: Object.freeze([]),
    limitations: Object.freeze([
      "Analytics use completed trades; legitimate open positions and unresolved decisions remain outside realized results.",
      "Different trade currencies remain separate unless the trader selects one currency.",
      "Trade Explorer returns at most 50 supporting trades per request.",
    ]),
  }),
  Object.freeze({
    id: "current_product_status_reads",
    kind: "factual_read" as const,
    plainLanguage: "Read import history, Data Decisions, notifications, account settings, plan access, and privacy-safe Moomoo connection/import status.",
    canonicalNames: Object.freeze([]),
    limitations: Object.freeze([
      "Chat never receives raw statement rows, uploaded files, broker account identifiers, credentials, tokens, or payment identifiers.",
      "Moomoo connection and automatic-import actions stay in Account and Import pages.",
      "Data Decision reads do not change or resolve a decision.",
    ]),
  }),
  Object.freeze({
    id: "saved_trade_analyzer_reads",
    kind: "factual_read" as const,
    plainLanguage: "Read saved Trade Analyzer results, analyzed day trades, and existing Candle Reviews.",
    canonicalNames: Object.freeze([]),
    limitations: Object.freeze([
      "Only completed day trades with current saved analysis are included.",
      "Chat does not run or refresh Trade Analyzer or Candle Review work and does not request market data.",
      "Large candle series and internal analysis identifiers are not sent to the model.",
    ]),
  }),
] satisfies readonly CoachAiChatRuntimeCapability[]);
