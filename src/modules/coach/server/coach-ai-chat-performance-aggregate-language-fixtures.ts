import type { CoachAiChatAnalysisScope } from "../contracts/ai-chat-contracts";

import type {
  CoachAiChatPerformanceAggregateLanguageContext,
  CoachAiChatPerformanceAggregatePlan,
} from "./coach-ai-chat-performance-aggregate-language";

export const COACH_AI_CHAT_PERFORMANCE_AGGREGATE_FIXTURE_VERSION =
  "links_performance_aggregate_fixtures_v1" as const;

type ExpectedPlan = Pick<CoachAiChatPerformanceAggregatePlan,
  "accountScope" | "reportingCurrency" | "timezone" | "referenceTimeUtc" |
  "entity" | "dimension" | "metric" | "operation" | "rank" | "timeScope" |
  "timeScopeSource" | "handlerId">;

export type CoachAiChatPerformanceAggregateFixture = Readonly<{
  id: string;
  question: string;
  context: CoachAiChatPerformanceAggregateLanguageContext;
  expected: ExpectedPlan;
  expectedRequest: Readonly<{
    toolName: CoachAiChatPerformanceAggregatePlan["request"]["toolName"];
  }>;
}>;

export type CoachAiChatPerformanceAggregateBoundaryFixture = Readonly<{
  id: string;
  question: string;
  context: CoachAiChatPerformanceAggregateLanguageContext;
  expectedState: "unresolved" | "not_applicable";
  expectedDiagnostic: Readonly<{
    component: "dimension" | "metric" | "rank";
    state: "failed" | "not_applicable";
  }>;
}>;

const referenceTime = new Date("2026-08-20T16:30:00.000Z");
const allHistory = Object.freeze({ kind: "all" as const });
const defaultContext = Object.freeze({
  selectedAnalysisScope: allHistory,
  reportingCurrency: "USD",
  timezone: "America/New_York",
  referenceTime,
});

function expected(input: Readonly<{
  entity: ExpectedPlan["entity"];
  dimension: ExpectedPlan["dimension"];
  metric: ExpectedPlan["metric"];
  rankDirection: "ascending" | "descending";
  timeScope?: CoachAiChatAnalysisScope;
  timeScopeSource?: ExpectedPlan["timeScopeSource"];
  handlerId: ExpectedPlan["handlerId"];
}>): ExpectedPlan {
  return Object.freeze({
    accountScope: "selected_account",
    reportingCurrency: "USD",
    timezone: "America/New_York",
    referenceTimeUtc: referenceTime.toISOString(),
    entity: input.entity,
    dimension: input.dimension,
    metric: input.metric,
    operation: "rank",
    rank: Object.freeze({ direction: input.rankDirection, count: 1 }),
    timeScope: input.timeScope ?? allHistory,
    timeScopeSource: input.timeScopeSource ?? "selected_scope",
    handlerId: input.handlerId,
  });
}

function pageRequest(toolName: "get_results_by_ticker" | "get_timing_analytics") {
  return Object.freeze({ toolName });
}

function tradingDayRequest() {
  return Object.freeze({
    toolName: "get_analytics_overview" as const,
  });
}

/** Independent expected plans for the first aggregate-routing batch. */
export const coachAiChatPerformanceAggregateFixtures = Object.freeze([
  Object.freeze({ id: "ticker-best", question: "what ticker was most profitable", context: defaultContext,
    expected: expected({ entity: "instrument", dimension: "ticker", metric: "net_pnl", rankDirection: "descending", handlerId: "instrument_aggregate_rank_v1" }),
    expectedRequest: pageRequest("get_results_by_ticker") }),
  Object.freeze({ id: "ticker-worst", question: "what ticker lost me the most", context: defaultContext,
    expected: expected({ entity: "instrument", dimension: "ticker", metric: "net_pnl", rankDirection: "ascending", handlerId: "instrument_aggregate_rank_v1" }),
    expectedRequest: pageRequest("get_results_by_ticker") }),
  Object.freeze({ id: "ticker-most-traded", question: "what ticker did i trade the most", context: defaultContext,
    expected: expected({ entity: "instrument", dimension: "ticker", metric: "total_trades", rankDirection: "descending", handlerId: "instrument_aggregate_rank_v1" }),
    expectedRequest: pageRequest("get_results_by_ticker") }),
  Object.freeze({ id: "ticker-best-win-rate", question: "what ticker had my best win rate", context: defaultContext,
    expected: expected({ entity: "instrument", dimension: "ticker", metric: "win_rate", rankDirection: "descending", handlerId: "instrument_aggregate_rank_v1" }),
    expectedRequest: pageRequest("get_results_by_ticker") }),
  Object.freeze({ id: "ticker-worst-win-rate", question: "what ticker had my worst win rate", context: defaultContext,
    expected: expected({ entity: "instrument", dimension: "ticker", metric: "win_rate", rankDirection: "ascending", handlerId: "instrument_aggregate_rank_v1" }),
    expectedRequest: pageRequest("get_results_by_ticker") }),
  Object.freeze({ id: "ticker-best-march", question: "what ticker did i profit the most from in march 2026", context: defaultContext,
    expected: expected({ entity: "instrument", dimension: "ticker", metric: "net_pnl", rankDirection: "descending", timeScope: Object.freeze({ kind: "month", month: "2026-03" }), timeScopeSource: "question", handlerId: "instrument_aggregate_rank_v1" }),
    expectedRequest: pageRequest("get_results_by_ticker") }),
  Object.freeze({ id: "ticker-worst-rolling", question: "what ticker lost me the most in the last 30 days", context: defaultContext,
    expected: expected({ entity: "instrument", dimension: "ticker", metric: "net_pnl", rankDirection: "ascending", timeScope: Object.freeze({ kind: "custom", startDate: "2026-07-22", endDate: "2026-08-20" }), timeScopeSource: "question", handlerId: "instrument_aggregate_rank_v1" }),
    expectedRequest: pageRequest("get_results_by_ticker") }),
  Object.freeze({ id: "trading-day-best", question: "what was my most profitable day", context: defaultContext,
    expected: expected({ entity: "trading_day", dimension: "trading_day", metric: "net_pnl", rankDirection: "descending", handlerId: "trading_day_aggregate_rank_v1" }),
    expectedRequest: tradingDayRequest() }),
  Object.freeze({ id: "trading-day-worst", question: "what was my worst trading day", context: defaultContext,
    expected: expected({ entity: "trading_day", dimension: "trading_day", metric: "net_pnl", rankDirection: "ascending", handlerId: "trading_day_aggregate_rank_v1" }),
    expectedRequest: tradingDayRequest() }),
  Object.freeze({ id: "trading-day-march", question: "what was my best trading day in march 2026", context: defaultContext,
    expected: expected({ entity: "trading_day", dimension: "trading_day", metric: "net_pnl", rankDirection: "descending", timeScope: Object.freeze({ kind: "month", month: "2026-03" }), timeScopeSource: "question", handlerId: "trading_day_aggregate_rank_v1" }),
    expectedRequest: tradingDayRequest() }),
  Object.freeze({ id: "weekday-best", question: "what weekday did i perform best", context: defaultContext,
    expected: expected({ entity: "time_bucket", dimension: "entry_weekday", metric: "net_pnl", rankDirection: "descending", handlerId: "time_aggregate_rank_v1" }),
    expectedRequest: pageRequest("get_timing_analytics") }),
  Object.freeze({ id: "weekday-worst", question: "what day of the week should i avoid trade", context: defaultContext,
    expected: expected({ entity: "time_bucket", dimension: "entry_weekday", metric: "net_pnl", rankDirection: "ascending", handlerId: "time_aggregate_rank_v1" }),
    expectedRequest: pageRequest("get_timing_analytics") }),
  Object.freeze({ id: "session-best", question: "what session do i perform best in", context: defaultContext,
    expected: expected({ entity: "time_bucket", dimension: "entry_session", metric: "net_pnl", rankDirection: "descending", handlerId: "time_aggregate_rank_v1" }),
    expectedRequest: pageRequest("get_timing_analytics") }),
  Object.freeze({ id: "session-worst", question: "what session did i perform worst in march 2026", context: defaultContext,
    expected: expected({ entity: "time_bucket", dimension: "entry_session", metric: "net_pnl", rankDirection: "ascending", timeScope: Object.freeze({ kind: "month", month: "2026-03" }), timeScopeSource: "question", handlerId: "time_aggregate_rank_v1" }),
    expectedRequest: pageRequest("get_timing_analytics") }),
  Object.freeze({ id: "entry-time-best", question: "what entry time was most profitable", context: defaultContext,
    expected: expected({ entity: "time_bucket", dimension: "entry_time_bucket", metric: "net_pnl", rankDirection: "descending", handlerId: "time_aggregate_rank_v1" }),
    expectedRequest: pageRequest("get_timing_analytics") }),
  Object.freeze({ id: "time-of-day-best", question: "what time of day am i most profitable", context: defaultContext,
    expected: expected({ entity: "time_bucket", dimension: "entry_time_bucket", metric: "net_pnl", rankDirection: "descending", handlerId: "time_aggregate_rank_v1" }),
    expectedRequest: pageRequest("get_timing_analytics") }),
  Object.freeze({ id: "exit-time-best", question: "what exit time was most profitable in 2026", context: defaultContext,
    expected: expected({ entity: "time_bucket", dimension: "exit_time_bucket", metric: "net_pnl", rankDirection: "descending", timeScope: Object.freeze({ kind: "custom", startDate: "2026-01-01", endDate: "2026-12-31" }), timeScopeSource: "question", handlerId: "time_aggregate_rank_v1" }),
    expectedRequest: pageRequest("get_timing_analytics") }),
] satisfies readonly CoachAiChatPerformanceAggregateFixture[]);

export const coachAiChatPerformanceAggregateBoundaryFixtures = Object.freeze([
  Object.freeze({ id: "individual-trade-owned-by-first-slice", question: "what was my best trade", context: defaultContext,
    expectedState: "not_applicable" as const,
    expectedDiagnostic: Object.freeze({ component: "dimension" as const, state: "not_applicable" as const }) }),
  Object.freeze({ id: "holding-outside-batch", question: "what holding time was most profitable", context: defaultContext,
    expectedState: "not_applicable" as const,
    expectedDiagnostic: Object.freeze({ component: "dimension" as const, state: "not_applicable" as const }) }),
  Object.freeze({ id: "ticker-metric-missing", question: "which ticker was best", context: defaultContext,
    expectedState: "unresolved" as const,
    expectedDiagnostic: Object.freeze({ component: "metric" as const, state: "failed" as const }) }),
  Object.freeze({ id: "session-rank-missing", question: "show me my sessions", context: defaultContext,
    expectedState: "unresolved" as const,
    expectedDiagnostic: Object.freeze({ component: "rank" as const, state: "failed" as const }) }),
  Object.freeze({ id: "day-trade-classification-outside-batch", question: "what was my best day trade", context: defaultContext,
    expectedState: "not_applicable" as const,
    expectedDiagnostic: Object.freeze({ component: "dimension" as const, state: "not_applicable" as const }) }),
] satisfies readonly CoachAiChatPerformanceAggregateBoundaryFixture[]);
