import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  COACH_AI_CHAT_FACTUAL_TOOL_GROUPINGS,
  COACH_AI_CHAT_FACTUAL_TOOL_METRIC_IDS,
  type CoachAiChatFactualToolName,
} from "../contracts/coach-ai-chat-factual-tool-contracts";

export type CoachAiChatFactualToolDefinition = Readonly<{
  name: CoachAiChatFactualToolName;
  description: string;
  supportedMetricIds: readonly string[];
  supportedGroupings: readonly string[];
  limitations: readonly string[];
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
}>;

const closedTradeLimitations = Object.freeze([
  "Closed-trade facts exclude legitimate open positions and unresolved decisions from realized metrics.",
  "Money is returned in separate trade-currency partitions; no cross-currency total is inferred.",
]);

export const coachAiChatFactualToolRegistry = Object.freeze([
  Object.freeze({
    name: "summarize_closed_trades" as const,
    description: "Returns verified closed-trade metrics for the server-selected Journal account.",
    supportedMetricIds: COACH_AI_CHAT_FACTUAL_TOOL_METRIC_IDS,
    supportedGroupings: Object.freeze([]),
    limitations: closedTradeLimitations,
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "group_closed_trades" as const,
    description: "Returns verified closed-trade metrics grouped by one approved factual dimension.",
    supportedMetricIds: COACH_AI_CHAT_FACTUAL_TOOL_METRIC_IDS,
    supportedGroupings: COACH_AI_CHAT_FACTUAL_TOOL_GROUPINGS,
    limitations: closedTradeLimitations,
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "list_closed_trades" as const,
    description: "Returns a bounded, cursor-paginated list of closed trades for the server-selected Journal account.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze([
      "Results are limited to 50 trades per request.",
      "The continuation cursor is opaque and must be returned unchanged.",
      ...closedTradeLimitations,
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "get_closed_trade_details" as const,
    description: "Returns one authorized closed trade's canonical Journal facts and optional current trader note and tags.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze([
      "Raw statement rows, broker identifiers, source-record identifiers, and private identity data are not returned.",
      "Market, candle, setup, rule-performance, sequence, simulation, unrealized, and account-equity analysis are not part of this tool.",
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "summarize_journal_period" as const,
    description: "Returns a bounded day, week, or month Journal summary with saved rule, focus, note, and tag context.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze([
      "A period includes at most 100 trade detail rows; full-period counts remain exact when details are truncated.",
      "Rule results are saved Journal outcomes and are not inferred by the model.",
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "list_saved_ai_reviews" as const,
    description: "Lists the current account's saved weekly, two-week, or monthly AI Reviews.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze(["Returns at most 20 saved reviews." ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "get_saved_ai_review" as const,
    description: "Returns one account-scoped saved AI Review for follow-up discussion.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze([
      "A saved review is prior coaching context, not new evidence about later trading.",
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "search_product_help" as const,
    description: "Searches the maintained TraderLink Help Center for product guidance.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze([
      "Returns maintained product help only, not trading advice or broker support guidance.",
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "get_workspace_summary" as const,
    description: "Returns the current account's latest trading-day, focus, rule, and saved-review workspace context.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze(["The latest saved AI Review is prior coaching context, not new trade evidence."]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "get_trading_day_details" as const,
    description: "Returns one trading day's trades, executions, annotations, rule results, review context, and coverage.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze(["Unresolved items remain identified separately and are not converted into closed-trade results."]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "get_calendar_period" as const,
    description: "Returns up to 62 days of calendar results with review and annotation counts.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze(["A longer range must be requested in smaller periods."]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "list_open_positions" as const,
    description: "Lists factual open positions and their trader-defined styles for the current account.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze(["Open positions are excluded from realized profit and loss."]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "get_open_position_details" as const,
    description: "Returns one authorized open position and its execution history.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze(["The model cannot infer or change the position type."]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "list_swing_positions" as const,
    description: "Lists active and recently completed trader-confirmed Swing positions.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze(["Only trader-confirmed Swing positions are included."]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "get_swing_position_details" as const,
    description: "Returns one authorized Swing position with executions and dated Swing notes.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze(["Swing notes are trader observations and are not treated as proof of a market fact."]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  ...(["get_analytics_overview", "get_results_by_ticker", "get_timing_analytics",
    "get_execution_analytics"] as const).map((name) => Object.freeze({
      name,
      description: `Returns the canonical ${name.replace(/^get_/u, "").replaceAll("_", " ")} dashboard results.`,
      supportedMetricIds: Object.freeze([]),
      supportedGroupings: Object.freeze([]),
      limitations: closedTradeLimitations,
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
    })),
  Object.freeze({
    name: "query_trade_explorer" as const,
    description: "Runs a bounded Trade Explorer query through the canonical Journal analytics engine.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: COACH_AI_CHAT_FACTUAL_TOOL_GROUPINGS,
    limitations: Object.freeze([
      "Individual trade evidence is available only when one trade currency is selected.",
      "Results are limited to 50 supporting trades per request.",
      ...closedTradeLimitations,
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "list_imports" as const,
    description: "Lists bounded privacy-safe import history for the selected account.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze([
      "Raw statement rows, broker account identifiers, source hashes, and uploaded files are never returned.",
      "Upload, mapping, connection, and import-run actions stay in their guarded product pages.",
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "list_data_decisions" as const,
    description: "Lists pending or resolved Data Decisions with plain-language questions and effects.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze(["Returns at most 50 decisions and no raw statement row content."]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "get_data_decision_details" as const,
    description: "Returns one authorized Data Decision's normalized execution and position evidence.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze([
      "Raw statement fields, provider timestamps, broker identifiers, and internal record identifiers are not returned.",
      "This read never resolves or changes the decision.",
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "list_notifications" as const,
    description: "Lists recent privacy-safe TraderLink notifications for the current user.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze(["Returns at most 50 notifications and only allowlisted local destinations."]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  ...(["get_account_profile", "get_account_trading", "get_account_preferences",
    "get_account_ai_plan"] as const).map((name) => Object.freeze({
    name,
    description: `Returns privacy-safe ${name.replace(/^get_account_/u, "account ").replaceAll("_", " ")} status.`,
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze([
      "Credentials, provider tokens, broker account identifiers, payment identifiers, and account selectors are not returned.",
      "Authentication, connection, billing, and destructive privacy actions remain in guarded product pages.",
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  })),
  Object.freeze({
    name: "get_trade_analyzer_results" as const,
    description: "Returns saved Trade Analyzer results for one current Analyzer view.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze([
      "Only completed day trades with a current saved analysis are included.",
      "This read never runs an analyzer or requests market data.",
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "list_analyzed_trades" as const,
    description: "Lists bounded trader-facing rows for completed day trades with saved analysis.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze([
      "Returns at most 50 rows and replaces internal trade identifiers with account-scoped opaque references.",
      "This read never runs an analyzer or requests market data.",
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "get_saved_candle_review" as const,
    description: "Returns one existing Candle Review summary without its candle series.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze([
      "No new review or refresh is started, and no provider is contacted.",
      "The stored candle series and internal review identifiers are not returned.",
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "list_trading_rules" as const,
    description: "Lists exact saved preset and custom Trading Rules with their settings, scope, and current status.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze([
      "This read does not recommend, activate, pause, revise, or retire a rule.",
      "A tag, note, or model opinion is never treated as a rule result.",
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "get_trading_rule_results" as const,
    description: "Returns deterministic preset-rule outcomes and saved custom-rule reviews for a bounded period.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze([
      "A request covers at most 62 days and returns at most 50 individual result events.",
      "Unavailable evidence remains N/A and custom rules without a saved selection remain Not selected.",
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
  Object.freeze({
    name: "get_trade_annotations" as const,
    description: "Returns one completed trade's exact saved trade note, tags, and custom-rule reviews.",
    supportedMetricIds: Object.freeze([]),
    supportedGroupings: Object.freeze([]),
    limitations: Object.freeze([
      "Tags and notes are trader observations, not proof of cause, emotion, setup quality, or rule outcome.",
      "This read does not add, remove, rename, or retire a tag.",
    ]),
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  }),
] satisfies readonly CoachAiChatFactualToolDefinition[]);

export function findCoachAiChatFactualToolDefinition(
  name: CoachAiChatFactualToolName,
): CoachAiChatFactualToolDefinition {
  return coachAiChatFactualToolRegistry.find((definition) => definition.name === name)!;
}
