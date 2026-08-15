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
export const COACH_AI_CHAT_TRADE_EXPLORER_METRIC_IDS = Object.freeze([
  "total_trades",
  "win_count",
  "loss_count",
  "flat_count",
  "net_pnl",
  "gross_pnl",
  "win_rate",
  "loss_rate",
  "average_pnl",
  "median_pnl",
  "profit_factor",
  "expectancy",
  "best_trade",
  "worst_trade",
  "average_holding_time",
  "median_holding_time",
  "average_share_quantity",
  "maximum_share_quantity",
  "average_position_size",
  "average_entry_notional",
  "average_entry_price",
  "average_exit_price",
  "return_on_entry_notional",
  "green_to_red_day_count",
  "red_to_green_day_count",
] as const);

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
export type CoachAiChatTradeExplorerMetricId =
  (typeof COACH_AI_CHAT_TRADE_EXPLORER_METRIC_IDS)[number];
export type CoachAiChatFactualToolName =
  | "summarize_closed_trades"
  | "group_closed_trades"
  | "list_closed_trades"
  | "get_closed_trade_details"
  | "summarize_journal_period"
  | "list_saved_ai_reviews"
  | "get_saved_ai_review"
  | "search_product_help"
  | "get_workspace_summary"
  | "get_trading_day_details"
  | "get_calendar_period"
  | "list_open_positions"
  | "get_open_position_details"
  | "list_swing_positions"
  | "get_swing_position_details"
  | "get_analytics_overview"
  | "get_results_by_ticker"
  | "get_timing_analytics"
  | "get_execution_analytics"
  | "query_trade_explorer";

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

export type CoachAiChatWorkspaceSummaryRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "get_workspace_summary";
}>;

export type CoachAiChatTradingDayDetailsRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "get_trading_day_details";
  tradingDate: string;
  currency?: string;
}>;

export type CoachAiChatCalendarPeriodRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "get_calendar_period";
  startDate: string;
  endDate: string;
  currency?: string;
  ticker?: string;
}>;

export type CoachAiChatPositionListRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "list_open_positions" | "list_swing_positions";
  reviewDate: string;
  ticker?: string;
}>;

export type CoachAiChatPositionDetailRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "get_open_position_details" | "get_swing_position_details";
  positionRef: string;
  reviewDate: string;
  ticker?: string;
}>;

export type CoachAiChatAnalyticsPageRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName:
    | "get_analytics_overview"
    | "get_results_by_ticker"
    | "get_timing_analytics"
    | "get_execution_analytics";
  moneyBasis: JournalAnalyticsMoneyBasis;
  filters?: CoachAiChatFactualToolFilters;
}>;

export type CoachAiChatTradeExplorerRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "query_trade_explorer";
  metricId: CoachAiChatTradeExplorerMetricId;
  grouping: CoachAiChatFactualToolGrouping;
  moneyBasis: JournalAnalyticsMoneyBasis;
  pageSize: number;
  afterCursor: string | null;
  filters?: CoachAiChatFactualToolFilters & Readonly<{
    entryWeekdays?: readonly string[];
    entryTimeBuckets?: readonly string[];
    minimumHoldingMilliseconds?: number;
    maximumHoldingMilliseconds?: number;
    minimumEnteredQuantity?: string;
    maximumEnteredQuantity?: string;
    minimumPositionQuantity?: string;
    maximumPositionQuantity?: string;
    minimumEntryNotional?: string;
    maximumEntryNotional?: string;
  }>;
}>;

export type CoachAiChatFactualToolRequest =
  | CoachAiChatClosedTradeSummaryRequest
  | CoachAiChatClosedTradeGroupingRequest
  | CoachAiChatClosedTradeListRequest
  | CoachAiChatClosedTradeDetailRequest
  | CoachAiChatJournalPeriodRequest
  | CoachAiChatSavedReviewListRequest
  | CoachAiChatSavedReviewDetailRequest
  | CoachAiChatProductHelpRequest
  | CoachAiChatWorkspaceSummaryRequest
  | CoachAiChatTradingDayDetailsRequest
  | CoachAiChatCalendarPeriodRequest
  | CoachAiChatPositionListRequest
  | CoachAiChatPositionDetailRequest
  | CoachAiChatAnalyticsPageRequest
  | CoachAiChatTradeExplorerRequest;

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

export type CoachAiChatDashboardContextResponse = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName:
    | "get_workspace_summary"
    | "get_trading_day_details"
    | "get_calendar_period"
    | "list_open_positions"
    | "get_open_position_details"
    | "list_swing_positions"
    | "get_swing_position_details";
  result: unknown;
}>;

export type CoachAiChatAnalyticsPageResponse = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName:
    | "get_analytics_overview"
    | "get_results_by_ticker"
    | "get_timing_analytics"
    | "get_execution_analytics"
    | "query_trade_explorer";
  result: unknown;
}>;

export type CoachAiChatFactualToolResponse =
  | CoachAiChatFactualAnalyticsResponse
  | CoachAiChatFactualTradeListResponse
  | CoachAiChatClosedTradeDetailResponse
  | CoachAiChatJournalPeriodResponse
  | CoachAiChatSavedReviewListResponse
  | CoachAiChatSavedReviewDetailResponse
  | CoachAiChatProductHelpResponse
  | CoachAiChatDashboardContextResponse
  | CoachAiChatAnalyticsPageResponse;

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
