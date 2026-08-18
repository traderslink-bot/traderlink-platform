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
  limitations: readonly string[];
}>;

export type CoachAiChatCanonicalLanguageGroup = Readonly<{
  runtimeCapabilityIds: readonly string[];
  canonicalNames: readonly string[];
}>;

function canonicalLanguageGroups(): readonly CoachAiChatCanonicalLanguageGroup[] {
  const groups = new Map<string, Set<string>>();
  for (const entry of coachAiChatLanguageInventory) {
    if (entry.runtimeCapabilityIds.length === 0) continue;
    const key = JSON.stringify(entry.runtimeCapabilityIds);
    const names = groups.get(key) ?? new Set<string>();
    names.add(entry.canonicalName);
    groups.set(key, names);
  }
  return Object.freeze([...groups.entries()].map(([key, names]) => Object.freeze({
    runtimeCapabilityIds: Object.freeze(JSON.parse(key) as string[]),
    canonicalNames: Object.freeze([...names].sort((left, right) => left.localeCompare(right))),
  })).sort((left, right) =>
    left.runtimeCapabilityIds.join("\u001f").localeCompare(right.runtimeCapabilityIds.join("\u001f"))));
}

const capabilities = Object.freeze([
  Object.freeze({
    id: "closed_trade_facts",
    kind: "factual_read" as const,
    plainLanguage: "Completed-trade results, filtered trade lists, and supported comparisons.",
    limitations: Object.freeze([
      "Open positions and items still awaiting a trader decision are not included in realized results.",
      "TraderLink keeps different trade currencies separate instead of estimating a combined total.",
    ]),
  }),
  Object.freeze({
    id: "daily_tracker_drafts",
    kind: "confirmed_draft" as const,
    plainLanguage: "Draft a Daily Trade Tracker note, one trade note, or Current Focuses for the selected trading day.",
    limitations: Object.freeze([
      "The trader reviews and saves the draft themselves.",
      "This note-draft flow cannot change tags, rules, rule outcomes, position classifications, executions, or review completion.",
    ]),
  }),
  Object.freeze({
    id: "manual_execution_drafts",
    kind: "confirmed_draft" as const,
    plainLanguage: "Turn clearly supplied execution details into an editable manual-entry draft.",
    limitations: Object.freeze([
      "Every date, Eastern time, ticker, side, quantity, and price must come from the trader.",
      "Nothing is saved until the trader checks the normal Journal preview and confirms it.",
    ]),
  }),
  Object.freeze({
    id: "review_delivery_draft",
    kind: "confirmed_draft" as const,
    plainLanguage: "Prepare a change to the weekly AI Review delivery day or Eastern delivery time.",
    limitations: Object.freeze([
      "Only Friday, Saturday, or Sunday and the supported evening Eastern times are available.",
      "The trader must review and confirm the change before Account Settings saves it.",
    ]),
  }),
  Object.freeze({
    id: "journal_period_context",
    kind: "factual_read" as const,
    plainLanguage: "Discuss a saved trading day, week, or month with its rules, focuses, notes, and tags.",
    limitations: Object.freeze([
      "The model does not infer why a rule was broken or treat a tag as proof.",
      "Large periods may show exact totals with a bounded sample of individual trades.",
    ]),
  }),
  Object.freeze({
    id: "saved_ai_review_follow_up",
    kind: "factual_read" as const,
    plainLanguage: "Read saved weekly, two-week, and monthly AI Reviews and answer follow-up questions.",
    limitations: Object.freeze([
      "A saved review describes its original period and does not prove what happened later.",
    ]),
  }),
  Object.freeze({
    id: "product_help",
    kind: "factual_read" as const,
    plainLanguage: "Explain TraderLink features using the maintained Help Center.",
    limitations: Object.freeze([
      "Product help does not include trading advice or unsupported broker instructions.",
    ]),
  }),
  Object.freeze({
    id: "current_dashboard_journal_reads",
    kind: "factual_read" as const,
    plainLanguage: "Read the current Workspace, Daily Trade Tracker, Calendar, Open Positions, and Swing Trade Tracker.",
    limitations: Object.freeze([
      "Open positions never contribute to realized profit and loss.",
      "Swing and open-position types come from the trader's saved classification and are not inferred by Chat.",
      "Calendar questions are limited to 62 days per factual request.",
    ]),
  }),
  Object.freeze({
    id: "current_dashboard_analytics_reads",
    kind: "factual_read" as const,
    plainLanguage: "Read Analytics Overview, Results by Ticker, Timing, Execution, bounded Trade Explorer results, and saved Compare Trades studies.",
    limitations: Object.freeze([
      "Analytics use completed trades; legitimate open positions and unresolved decisions remain outside realized results.",
      "Money follows the Account reporting currency only when the exact required conversion is available.",
      "Trade rows sort only by facts each completed trade has; population statistics rank grouped results and never act as a hidden Result filter.",
      "Trade Explorer returns at most 50 supporting trades per request.",
      "Chat can read the saved Review facts for one exact completed trade, but the combined note, tags, and custom-rule Review is saved with one explicit Save in Trade Explorer.",
      "Saved comparison reads return validated group definitions only and cannot create, update, retire, or silently recalculate a study.",
    ]),
  }),
  Object.freeze({
    id: "current_product_status_reads",
    kind: "factual_read" as const,
    plainLanguage: "Read import history, Data Decisions, notifications, account settings, plan access, and privacy-safe Moomoo connection/import status.",
    limitations: Object.freeze([
      "Chat never receives raw statement rows, uploaded files, broker account identifiers, credentials, tokens, or payment identifiers.",
      "Moomoo connection and automatic-import actions stay in Account and Import pages.",
      "Reading a Data Decision never changes it; only a separate supported preview and confirmation can resolve it.",
    ]),
  }),
  Object.freeze({
    id: "saved_trade_analyzer_reads",
    kind: "factual_read" as const,
    plainLanguage: "Read saved Trade Analyzer results, analyzed day trades, and existing Candle Reviews.",
    limitations: Object.freeze([
      "Only completed day trades with current saved analysis are included.",
      "Chat does not run or refresh Trade Analyzer or Candle Review work and does not request market data.",
      "Large candle series and internal analysis identifiers are not sent to the model.",
    ]),
  }),
  Object.freeze({
    id: "trading_rule_and_tag_reads",
    kind: "factual_read" as const,
    plainLanguage: "Read saved Trading Rules, deterministic rule results, saved Rule-idea evidence, trade notes, Trade Tags, and custom-rule reviews.",
    limitations: Object.freeze([
      "Chat does not create a rule recommendation or judge a rule outcome itself.",
      "Tags and notes remain trader observations and are not proof of why a trade happened.",
      "Rule-result periods are limited to 62 days per factual request.",
      "Rule ideas are deterministic saved evidence; Chat cannot generate one, dismiss one, or activate a rule from it.",
    ]),
  }),
  Object.freeze({
    id: "confirmed_product_changes",
    kind: "confirmed_draft" as const,
    plainLanguage: "Prepare supported currency, notification, Trade Tracker account, AI Review setting or eligible review request, Swing note, position type, trade tag, Trading Rule, or Data Decision changes.",
    limitations: Object.freeze([
      "Chat must read the current exact value or target before it can prepare the change.",
      "Nothing changes until the trader confirms the saved preview.",
      "A new Trade Tracker account uses an exact name, currency and trading timezone, and becomes active only after confirmation.",
      "Swing notes retain their exact review date and complete note text; Chat never invents missing note content.",
      "Position type is always the trader's explicit choice and is never inferred from age, executions, ticker or profit and loss.",
      "An AI Review request must match an exact currently available period and confirmation saves only the pending request.",
      "A trade-tag proposal uses only the trader's exact requested tags from the available saved or preset list.",
      "A Trading Rule proposal uses an exact saved rule or maintained preset, and Chat never activates a rule only because it recommends one.",
      "Data Decision proposals use one exact pending item and returned evidence references; numeric corrections and raw-statement comparisons stay on the Data Decisions page.",
      "Login, broker connections, payment, deletion, administration, and unsupported settings remain outside this path.",
    ]),
  }),
] satisfies readonly CoachAiChatRuntimeCapability[]);

/**
 * Passed to the model as one compact contract. Canonical terms are grouped by
 * their exact family set so shared language appears once instead of being
 * repeated in every family on every provider request.
 */
export const coachAiChatRuntimeCapabilityRegistry = Object.freeze({
  contractVersion: "coach_ai_chat_runtime_capabilities_v4" as const,
  capabilities,
  canonicalLanguageGroups: canonicalLanguageGroups(),
});
