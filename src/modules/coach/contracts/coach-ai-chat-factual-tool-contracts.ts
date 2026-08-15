import type {
  JournalAnalyticsDirection,
  JournalAnalyticsGrouping,
  JournalAnalyticsMoneyBasis,
  JournalAnalyticsOutcome,
  JournalAnalyticsProvenanceGroup,
  JournalAnalyticsTradeClassification,
} from "@/src/modules/journal-analytics/contracts/analytics-query";
import type {
  JournalAnalyticsPartitionedResponse,
  JournalAnalyticsRoundTripTableResponse,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import type { JournalAnalyticsRoundTripFact } from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import type { JournalAnalyticsFirstSliceMetricId } from "@/src/modules/journal-analytics/server/analytics-metric-registry";

export const COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION =
  "coach_ai_chat_factual_tools_v1" as const;
export const COACH_AI_CHAT_FACTUAL_TOOL_MAX_PAGE_SIZE = 50 as const;
export const COACH_AI_CHAT_FACTUAL_TOOL_MAX_SYMBOLS = 25 as const;
export const COACH_AI_CHAT_FACTUAL_TOOL_MAX_METRICS = 22 as const;
export const COACH_AI_CHAT_FACTUAL_TOOL_MAX_GROUPS = 100 as const;

export const COACH_AI_CHAT_FACTUAL_TOOL_METRIC_IDS = Object.freeze([
  "candidate_count",
  "included_count",
  "excluded_count",
  "total_trades",
  "win_count",
  "loss_count",
  "flat_count",
  "win_rate",
  "loss_rate",
  "flat_rate",
  "gross_profit",
  "gross_loss",
  "gross_pnl",
  "net_pnl",
  "average_gross_pnl",
  "median_gross_pnl",
  "average_pnl",
  "median_pnl",
  "best_trade",
  "worst_trade",
  "profit_factor",
  "expectancy",
] as const satisfies readonly JournalAnalyticsFirstSliceMetricId[]);

export const COACH_AI_CHAT_FACTUAL_TOOL_GROUPINGS = Object.freeze([
  "closing_day",
  "closing_iso_week",
  "closing_month",
  "closing_year",
  "entry_weekday",
  "entry_time_bucket",
  "exit_time_bucket",
  "entry_session",
  "instrument",
  "direction",
  "provenance",
  "holding_duration_bucket",
  "entered_quantity_bucket",
  "maximum_position_bucket",
  "entry_notional_bucket",
  "realized_outcome",
] as const satisfies readonly JournalAnalyticsGrouping[]);

export type CoachAiChatFactualToolMetricId =
  (typeof COACH_AI_CHAT_FACTUAL_TOOL_METRIC_IDS)[number];
export type CoachAiChatFactualToolGrouping =
  (typeof COACH_AI_CHAT_FACTUAL_TOOL_GROUPINGS)[number];
export type CoachAiChatFactualToolName =
  | "summarize_closed_trades"
  | "group_closed_trades"
  | "list_closed_trades"
  | "get_closed_trade_details"
  | "summarize_journal_period"
  | "list_saved_ai_reviews"
  | "get_saved_ai_review"
  | "search_product_help";

export type CoachAiChatFactualToolFilters = Readonly<{
  closingDateRange?: Readonly<{
    startDate: string;
    endDate: string;
  }>;
  currency?: string;
  symbols?: readonly string[];
  directions?: readonly JournalAnalyticsDirection[];
  tradeClassifications?: readonly JournalAnalyticsTradeClassification[];
  provenance?: readonly JournalAnalyticsProvenanceGroup[];
  outcomes?: readonly JournalAnalyticsOutcome[];
}>;

export type CoachAiChatClosedTradeSummaryRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "summarize_closed_trades";
  metricIds: readonly CoachAiChatFactualToolMetricId[];
  moneyBasis: JournalAnalyticsMoneyBasis;
  filters?: CoachAiChatFactualToolFilters;
}>;

export type CoachAiChatClosedTradeGroupingRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "group_closed_trades";
  metricIds: readonly CoachAiChatFactualToolMetricId[];
  grouping: CoachAiChatFactualToolGrouping;
  moneyBasis: JournalAnalyticsMoneyBasis;
  filters?: CoachAiChatFactualToolFilters;
}>;

export type CoachAiChatClosedTradeListRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "list_closed_trades";
  moneyBasis: JournalAnalyticsMoneyBasis;
  pageSize: number;
  afterCursor: string | null;
  filters?: CoachAiChatFactualToolFilters;
}>;

export type CoachAiChatClosedTradeDetailRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "get_closed_trade_details";
  roundTripId: string;
}>;

export type CoachAiChatJournalPeriodRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "summarize_journal_period";
  period: "daily" | "weekly" | "monthly";
  anchorDate: string;
  currency?: string;
}>;

export type CoachAiChatSavedReviewListRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "list_saved_ai_reviews";
  reviewKind?: "weekly" | "two_week" | "monthly";
  limit: number;
}>;

export type CoachAiChatSavedReviewDetailRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "get_saved_ai_review";
  reviewId: string;
}>;

export type CoachAiChatProductHelpRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "search_product_help";
  query: string;
  limit: number;
}>;

export type CoachAiChatFactualToolRequest =
  | CoachAiChatClosedTradeSummaryRequest
  | CoachAiChatClosedTradeGroupingRequest
  | CoachAiChatClosedTradeListRequest
  | CoachAiChatClosedTradeDetailRequest
  | CoachAiChatJournalPeriodRequest
  | CoachAiChatSavedReviewListRequest
  | CoachAiChatSavedReviewDetailRequest
  | CoachAiChatProductHelpRequest;

export type CoachAiChatFactualAnalyticsResponse = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "summarize_closed_trades" | "group_closed_trades";
  result: JournalAnalyticsPartitionedResponse;
}>;

export type CoachAiChatFactualTradeListResponse = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "list_closed_trades";
  result: JournalAnalyticsRoundTripTableResponse;
}>;

export type CoachAiChatClosedTradeDetail = Readonly<{
  roundTripId: string;
  symbol: string;
  assetClass: JournalAnalyticsRoundTripFact["assetClass"];
  currency: string;
  direction: "long" | "short";
  openedAtUtc: string;
  closedAtUtc: string;
  finalPositionDecimal: string;
  projectionState: "ready_closed";
  coverageReasonCode: string | null;
  factSetRevisionSha256: string;
  executions: readonly Readonly<{
    allocationSequence: number;
    allocationRole: string;
    executedAtUtc: string;
    side: "buy" | "sell";
    quantityDecimal: string;
    priceDecimal: string | null;
    feesDecimal: string | null;
    feeCurrency: string | null;
    factCompleteness: string;
  }>[];
  note: Readonly<{
    tradeNote: string;
    updatedAtUtc: string;
  }> | null;
  tags: readonly string[];
}>;

export type CoachAiChatClosedTradeDetailResponse = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "get_closed_trade_details";
  result: CoachAiChatClosedTradeDetail;
}>;

export type CoachAiChatJournalPeriodResponse = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "summarize_journal_period";
  result: unknown;
}>;

export type CoachAiChatSavedReviewListResponse = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "list_saved_ai_reviews";
  result: readonly unknown[];
}>;

export type CoachAiChatSavedReviewDetailResponse = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "get_saved_ai_review";
  result: unknown;
}>;

export type CoachAiChatProductHelpResponse = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "search_product_help";
  result: readonly Readonly<{
    title: string;
    summary: string;
    section: string;
    href: string;
  }>[];
}>;

export type CoachAiChatFactualToolResponse =
  | CoachAiChatFactualAnalyticsResponse
  | CoachAiChatFactualTradeListResponse
  | CoachAiChatClosedTradeDetailResponse
  | CoachAiChatJournalPeriodResponse
  | CoachAiChatSavedReviewListResponse
  | CoachAiChatSavedReviewDetailResponse
  | CoachAiChatProductHelpResponse;

export type CoachAiChatFactualToolErrorCode =
  | "invalid_request"
  | "not_found"
  | "result_too_large";

/** Only use this error at the chat/provider boundary; it intentionally omits private inputs. */
export class CoachAiChatFactualToolError extends Error {
  readonly name = "CoachAiChatFactualToolError";

  constructor(readonly code: CoachAiChatFactualToolErrorCode) {
    super(code === "not_found"
      ? "The requested closed trade was not found."
      : code === "result_too_large"
        ? "That result is too large. Use a shorter period or narrower filters."
        : "The factual tool request is not valid.");
  }
}
