import type { CoachAiChatAnalysisScope } from "../contracts/ai-chat-contracts";

import type {
  CoachAiChatCompletedTradePerformanceLanguageContext,
  CoachAiChatCompletedTradePerformancePlan,
} from "./coach-ai-chat-completed-trade-performance-language";

export const COACH_AI_CHAT_COMPLETED_TRADE_PERFORMANCE_FIXTURE_VERSION =
  "links_completed_trade_performance_fixtures_v1" as const;

type ExpectedPlan = Pick<CoachAiChatCompletedTradePerformancePlan,
  "accountScope" | "reportingCurrency" | "timezone" | "referenceTimeUtc" |
  "entity" | "metric" | "operation" | "rank" | "outcomeFilter" |
  "timeScope" | "timeScopeSource" | "handlerId">;

export type CoachAiChatCompletedTradePerformanceFixture = Readonly<{
  id: string;
  question: string;
  context: CoachAiChatCompletedTradePerformanceLanguageContext;
  expected: ExpectedPlan;
}>;

export type CoachAiChatCompletedTradePerformanceBoundaryFixture = Readonly<{
  id: string;
  question: string;
  context: CoachAiChatCompletedTradePerformanceLanguageContext;
  expectedState: "unresolved" | "not_applicable";
  expectedDiagnostic: Readonly<{
    component: "entity" | "metric" | "rank_count";
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
  metric: ExpectedPlan["metric"];
  operation: ExpectedPlan["operation"];
  rank?: ExpectedPlan["rank"];
  outcomeFilter?: ExpectedPlan["outcomeFilter"];
  timeScope?: CoachAiChatAnalysisScope;
  timeScopeSource?: ExpectedPlan["timeScopeSource"];
  handlerId: ExpectedPlan["handlerId"];
}>): ExpectedPlan {
  return Object.freeze({
    accountScope: "selected_account",
    reportingCurrency: "USD",
    timezone: "America/New_York",
    referenceTimeUtc: referenceTime.toISOString(),
    entity: "completed_trade",
    metric: input.metric,
    operation: input.operation,
    rank: input.rank ?? null,
    outcomeFilter: input.outcomeFilter ?? null,
    timeScope: input.timeScope ?? allHistory,
    timeScopeSource: input.timeScopeSource ?? "selected_scope",
    handlerId: input.handlerId,
  });
}

const descendingOne = Object.freeze({ direction: "descending" as const, count: 1 });
const ascendingOne = Object.freeze({ direction: "ascending" as const, count: 1 });
const descendingThree = Object.freeze({ direction: "descending" as const, count: 3 });
const ascendingThree = Object.freeze({ direction: "ascending" as const, count: 3 });

/**
 * Static independent oracle for the first Links implementation batch. It is
 * deliberately data, not a transformation of the parser vocabulary.
 */
export const coachAiChatCompletedTradePerformanceFixtures = Object.freeze([
  Object.freeze({ id: "best-all", question: "what was my best trade", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: descendingOne, handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "most-profitable-all", question: "what was my most profitable trade", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: descendingOne, handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "most-profitable-typo", question: "what was my most profitable trad", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: descendingOne, handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "best-this-year", question: "what was my best trade this year", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: descendingOne, timeScope: Object.freeze({ kind: "custom", startDate: "2026-01-01", endDate: "2026-12-31" }), timeScopeSource: "question", handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "best-last-year", question: "what was my best trade last year", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: descendingOne, timeScope: Object.freeze({ kind: "custom", startDate: "2025-01-01", endDate: "2025-12-31" }), timeScopeSource: "question", handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "best-named-month", question: "what was my most profitable trade in march 2026", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: descendingOne, timeScope: Object.freeze({ kind: "month", month: "2026-03" }), timeScopeSource: "question", handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "best-named-day", question: "what was my best trade on April 15th, 2026", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: descendingOne, timeScope: Object.freeze({ kind: "day", date: "2026-04-15" }), timeScopeSource: "question", handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "best-day-first", question: "what was my best trade on 15 April 2026", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: descendingOne, timeScope: Object.freeze({ kind: "day", date: "2026-04-15" }), timeScopeSource: "question", handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "best-slash-day", question: "what was my best trade on 04/15/2026", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: descendingOne, timeScope: Object.freeze({ kind: "day", date: "2026-04-15" }), timeScopeSource: "question", handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "best-last-90", question: "what was my best trade in the last 90 days", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: descendingOne, timeScope: Object.freeze({ kind: "custom", startDate: "2026-05-23", endDate: "2026-08-20" }), timeScopeSource: "question", handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "worst-all", question: "what was my worst trade", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: ascendingOne, handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "least-profitable", question: "what was my least profitable trade", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: ascendingOne, handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "biggest-loser", question: "what was my biggest loser", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: ascendingOne, outcomeFilter: "loss", handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "worst-three-losses", question: "give me the worst 3 losses", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: ascendingThree, outcomeFilter: "loss", handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "bottom-three-losing", question: "give me the bottom three losing trades", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: ascendingThree, outcomeFilter: "loss", handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "top-three-winners", question: "show my top 3 winners", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: descendingThree, outcomeFilter: "win", handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "three-best", question: "show my 3 best trades", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: descendingThree, handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "worst-three-march", question: "give me the worst three losses in march 2026", context: defaultContext,
    expected: expected({ metric: "net_pnl_rank", operation: "rank", rank: ascendingThree, outcomeFilter: "loss", timeScope: Object.freeze({ kind: "month", month: "2026-03" }), timeScopeSource: "question", handlerId: "completed_trade_rank_v1" }) }),
  Object.freeze({ id: "trade-count-all", question: "how many completed trades do i have", context: defaultContext,
    expected: expected({ metric: "total_trades", operation: "summary", handlerId: "completed_trade_summary_v1" }) }),
  Object.freeze({ id: "trade-count-month", question: "how many trades did i do in march 2026", context: defaultContext,
    expected: expected({ metric: "total_trades", operation: "summary", timeScope: Object.freeze({ kind: "month", month: "2026-03" }), timeScopeSource: "question", handlerId: "completed_trade_summary_v1" }) }),
  Object.freeze({ id: "winning-count", question: "how many winning trades did i take this year", context: defaultContext,
    expected: expected({ metric: "win_count", operation: "summary", timeScope: Object.freeze({ kind: "custom", startDate: "2026-01-01", endDate: "2026-12-31" }), timeScopeSource: "question", handlerId: "completed_trade_summary_v1" }) }),
  Object.freeze({ id: "green-count", question: "how many green trades did i take", context: defaultContext,
    expected: expected({ metric: "win_count", operation: "summary", handlerId: "completed_trade_summary_v1" }) }),
  Object.freeze({ id: "loss-count", question: "how many losses did i take", context: defaultContext,
    expected: expected({ metric: "loss_count", operation: "summary", handlerId: "completed_trade_summary_v1" }) }),
  Object.freeze({ id: "red-count", question: "how many red trades did i take", context: defaultContext,
    expected: expected({ metric: "loss_count", operation: "summary", handlerId: "completed_trade_summary_v1" }) }),
  Object.freeze({ id: "net-pnl", question: "what is my net p/l", context: defaultContext,
    expected: expected({ metric: "net_pnl", operation: "summary", handlerId: "completed_trade_summary_v1" }) }),
  Object.freeze({ id: "profit-loss", question: "what was my profit and loss in march 2026", context: defaultContext,
    expected: expected({ metric: "net_pnl", operation: "summary", timeScope: Object.freeze({ kind: "month", month: "2026-03" }), timeScopeSource: "question", handlerId: "completed_trade_summary_v1" }) }),
  Object.freeze({ id: "made-month", question: "how much did i make in march 2026", context: defaultContext,
    expected: expected({ metric: "net_pnl", operation: "summary", timeScope: Object.freeze({ kind: "month", month: "2026-03" }), timeScopeSource: "question", handlerId: "completed_trade_summary_v1" }) }),
  Object.freeze({ id: "lost-month", question: "how much did i lose in march 2026", context: defaultContext,
    expected: expected({ metric: "net_pnl", operation: "summary", timeScope: Object.freeze({ kind: "month", month: "2026-03" }), timeScopeSource: "question", handlerId: "completed_trade_summary_v1" }) }),
  Object.freeze({ id: "made-today", question: "how much did i make today", context: defaultContext,
    expected: expected({ metric: "net_pnl", operation: "summary", timeScope: Object.freeze({ kind: "day", date: "2026-08-20" }), timeScopeSource: "question", handlerId: "completed_trade_summary_v1" }) }),
  Object.freeze({ id: "selected-month", question: "what was my profit", context: Object.freeze({ ...defaultContext, selectedAnalysisScope: Object.freeze({ kind: "month", month: "2026-06" }) }),
    expected: expected({ metric: "net_pnl", operation: "summary", timeScope: Object.freeze({ kind: "month", month: "2026-06" }), handlerId: "completed_trade_summary_v1" }) }),
] satisfies readonly CoachAiChatCompletedTradePerformanceFixture[]);

/**
 * Static collision and boundary cases. They prove that this first parser does
 * not steal a day/ticker question or silently turn a deferred metric into P/L.
 */
export const coachAiChatCompletedTradePerformanceBoundaryFixtures = Object.freeze([
  Object.freeze({
    id: "deferred-most-profitable-day",
    question: "what was my most profitable day",
    context: defaultContext,
    expectedState: "not_applicable" as const,
    expectedDiagnostic: Object.freeze({ component: "entity" as const, state: "not_applicable" as const }),
  }),
  Object.freeze({
    id: "deferred-most-profitable-ticker",
    question: "what ticker made me the most money",
    context: defaultContext,
    expectedState: "not_applicable" as const,
    expectedDiagnostic: Object.freeze({ component: "entity" as const, state: "not_applicable" as const }),
  }),
  Object.freeze({
    id: "deferred-win-rate",
    question: "what is my win rate this year",
    context: defaultContext,
    expectedState: "unresolved" as const,
    expectedDiagnostic: Object.freeze({ component: "metric" as const, state: "failed" as const }),
  }),
  Object.freeze({
    id: "rank-count-too-large",
    question: "show me my top 100 trades",
    context: defaultContext,
    expectedState: "unresolved" as const,
    expectedDiagnostic: Object.freeze({ component: "rank_count" as const, state: "failed" as const }),
  }),
  Object.freeze({
    id: "deferred-gross-pnl",
    question: "what is my gross p/l",
    context: defaultContext,
    expectedState: "unresolved" as const,
    expectedDiagnostic: Object.freeze({ component: "metric" as const, state: "failed" as const }),
  }),
] satisfies readonly CoachAiChatCompletedTradePerformanceBoundaryFixture[]);
