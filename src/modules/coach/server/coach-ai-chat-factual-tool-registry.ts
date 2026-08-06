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
] satisfies readonly CoachAiChatFactualToolDefinition[]);

export function findCoachAiChatFactualToolDefinition(
  name: CoachAiChatFactualToolName,
): CoachAiChatFactualToolDefinition {
  return coachAiChatFactualToolRegistry.find((definition) => definition.name === name)!;
}
