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
import type { TradeExplorerTradeSort } from
  "@/src/modules/journal-analytics/presentation/trade-explorer-ordering";
import type { JournalAnalyticsRoundTripFact } from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import type { JournalAnalyticsFirstSliceMetricId } from "@/src/modules/journal-analytics/server/analytics-metric-registry";
import type { DailyTradeGreenToRedStatus } from
  "@/src/modules/level-analysis/contracts/daily-trade-analyzer-contracts";

export const COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION =
  "coach_ai_chat_factual_tools_v3" as const;
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
  "flat_rate",
  "average_pnl",
  "median_pnl",
  "profit_factor",
  "best_trade",
  "worst_trade",
  "average_winning_trade",
  "average_losing_trade",
  "average_win_loss_ratio",
  "average_holding_time",
  "median_holding_time",
  "minimum_holding_time",
  "maximum_holding_time",
  "average_winner_holding_time",
  "average_loser_holding_time",
  "average_share_quantity",
  "median_share_quantity",
  "maximum_share_quantity",
  "average_entry_notional",
  "median_entry_notional",
  "maximum_entry_notional",
  "average_entry_price",
  "average_exit_price",
  "return_on_entry_notional",
  "maximum_intraday_realized_drawdown",
  "maximum_intraday_realized_recovery_from_trough",
  "maximum_peak_profit_giveback",
] as const);

export const COACH_AI_CHAT_TRADE_EXPLORER_GROUPINGS = Object.freeze([
  "closing_day",
  "closing_iso_week",
  "closing_month",
  "closing_year",
  "entry_time_bucket",
  "instrument",
  "holding_duration_bucket",
  "maximum_position_bucket",
] as const satisfies readonly JournalAnalyticsGrouping[]);

export const COACH_AI_CHAT_TRADE_EXPLORER_TRADE_SORTS = Object.freeze([
  "closed_desc",
  "closed_asc",
  "pnl_desc",
  "pnl_asc",
  "return_desc",
  "return_asc",
  "hold_desc",
  "hold_asc",
  "shares_desc",
  "shares_asc",
  "entry_value_desc",
  "entry_value_asc",
] as const satisfies readonly TradeExplorerTradeSort[]);

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
export type CoachAiChatTradeExplorerGrouping =
  (typeof COACH_AI_CHAT_TRADE_EXPLORER_GROUPINGS)[number];
export type CoachAiChatTradeExplorerMetricId =
  (typeof COACH_AI_CHAT_TRADE_EXPLORER_METRIC_IDS)[number];
export const COACH_AI_CHAT_FACTUAL_TOOL_NAMES = Object.freeze([
  "summarize_closed_trades",
  "group_closed_trades",
  "list_closed_trades",
  "get_closed_trade_details",
  "summarize_journal_period",
  "list_saved_ai_reviews",
  "get_saved_ai_review",
  "search_product_help",
  "get_workspace_summary",
  "get_trading_day_details",
  "get_calendar_period",
  "list_open_positions",
  "get_open_position_details",
  "list_swing_positions",
  "get_swing_position_details",
  "get_analytics_overview",
  "get_results_by_ticker",
  "get_timing_analytics",
  "get_execution_analytics",
  "query_trade_explorer",
  "list_saved_trade_comparisons",
  "list_rule_ideas",
  "list_imports",
  "list_data_decisions",
  "get_data_decision_details",
  "list_notifications",
  "get_account_profile",
  "get_account_trading",
  "get_account_preferences",
  "get_account_ai_plan",
  "get_trade_analyzer_results",
  "list_analyzed_trades",
  "get_saved_candle_review",
  "list_trading_rules",
  "get_trading_rule_results",
  "get_trade_annotations",
] as const);

export type CoachAiChatFactualToolName =
  (typeof COACH_AI_CHAT_FACTUAL_TOOL_NAMES)[number];

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
  resultView:
    | "trades"
    | "trading_days"
    | "tickers"
    | "entry_times"
    | "holding_time"
    | "position_size"
    | "periods";
  metricId?: CoachAiChatTradeExplorerMetricId;
  grouping?: CoachAiChatTradeExplorerGrouping;
  tradeSort?: TradeExplorerTradeSort;
  rankDirection?: "ascending" | "descending";
  moneyBasis: JournalAnalyticsMoneyBasis;
  pageSize?: number;
  afterCursor?: string | null;
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

export type CoachAiChatSavedTradeComparisonsRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "list_saved_trade_comparisons";
  limit: number;
}>;

export type CoachAiChatRuleIdeasRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "list_rule_ideas";
  disposition: "available" | "saved_for_later" | "not_for_me" | "added" | "all";
  limit: number;
}>;

export type CoachAiChatImportListRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "list_imports";
  sourceKind: "broker_statements" | "manual_entries" | "all";
  limit: number;
}>;

export type CoachAiChatDataDecisionListRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "list_data_decisions";
  state: "pending" | "resolved";
  limit: number;
  ticker?: string;
}>;

export type CoachAiChatDataDecisionDetailRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "get_data_decision_details";
  decisionRef: string;
}>;

export type CoachAiChatNotificationListRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "list_notifications";
  limit: number;
}>;

export type CoachAiChatAccountContextRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName:
    | "get_account_profile"
    | "get_account_trading"
    | "get_account_preferences"
    | "get_account_ai_plan";
}>;

export type CoachAiChatTradeAnalyzerFilters = Readonly<{
  startDate?: string;
  endDate?: string;
  currency?: string;
  moneyBasis: JournalAnalyticsMoneyBasis;
}>;

export type CoachAiChatTradeAnalyzerResultsRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "get_trade_analyzer_results";
  view: "day" | "entry_exit" | "mfe_mae" | "green_to_red" | "candle_patterns";
  filters: CoachAiChatTradeAnalyzerFilters;
}>;

export type CoachAiChatAnalyzedTradeListRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "list_analyzed_trades";
  filters: CoachAiChatTradeAnalyzerFilters & Readonly<{
    ticker?: string;
    greenToRedStatus?: DailyTradeGreenToRedStatus;
  }>;
  page: number;
  pageSize: number;
}>;

export type CoachAiChatCandleReviewRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "get_saved_candle_review";
  tradeRef: string;
}>;

export type CoachAiChatTradingRulesRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "list_trading_rules";
  state: "active" | "paused" | "retired" | "all";
}>;

export type CoachAiChatTradingRuleResultsRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "get_trading_rule_results";
  startDate: string;
  endDate: string;
}>;

export type CoachAiChatTradeAnnotationsRequest = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "get_trade_annotations";
  roundTripId: string;
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
  | CoachAiChatTradeExplorerRequest
  | CoachAiChatSavedTradeComparisonsRequest
  | CoachAiChatRuleIdeasRequest
  | CoachAiChatImportListRequest
  | CoachAiChatDataDecisionListRequest
  | CoachAiChatDataDecisionDetailRequest
  | CoachAiChatNotificationListRequest
  | CoachAiChatAccountContextRequest
  | CoachAiChatTradeAnalyzerResultsRequest
  | CoachAiChatAnalyzedTradeListRequest
  | CoachAiChatCandleReviewRequest
  | CoachAiChatTradingRulesRequest
  | CoachAiChatTradingRuleResultsRequest
  | CoachAiChatTradeAnnotationsRequest;

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

export type CoachAiChatProductContextResponse = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName:
    | "list_imports"
    | "list_data_decisions"
    | "get_data_decision_details"
    | "list_notifications"
    | "get_account_profile"
    | "get_account_trading"
    | "get_account_preferences"
    | "get_account_ai_plan";
  result: unknown;
}>;

export type CoachAiChatTradeAnalyzerResponse = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName:
    | "get_trade_analyzer_results"
    | "list_analyzed_trades"
    | "get_saved_candle_review";
  result: unknown;
}>;

export type CoachAiChatAnnotationContextResponse = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName:
    | "list_trading_rules"
    | "get_trading_rule_results"
    | "get_trade_annotations";
  result: unknown;
}>;

export type CoachAiChatSavedAnalysisResponse = Readonly<{
  contractVersion: typeof COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION;
  toolName: "list_saved_trade_comparisons" | "list_rule_ideas";
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
  | CoachAiChatAnalyticsPageResponse
  | CoachAiChatProductContextResponse
  | CoachAiChatTradeAnalyzerResponse
  | CoachAiChatAnnotationContextResponse
  | CoachAiChatSavedAnalysisResponse;

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
