import type { CoachAiChatAnalysisScope } from "../contracts/ai-chat-contracts";
import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  type CoachAiChatAnalyticsPageRequest,
} from "../contracts/coach-ai-chat-factual-tool-contracts";
import { coachAiChatLanguageInventory } from "./coach-ai-chat-language-inventory.generated";

import {
  matchCoachAiChatQuestionAnalysisScope,
  normalizeCoachAiChatScopeQuestion,
} from "./coach-ai-chat-question-time-scope";

export const COACH_AI_CHAT_PERFORMANCE_AGGREGATE_LANGUAGE_VERSION =
  "links_performance_aggregate_language_v1" as const;

export type CoachAiChatPerformanceAggregateDimension =
  | "ticker"
  | "trading_day"
  | "entry_weekday"
  | "entry_session"
  | "entry_time_bucket"
  | "exit_time_bucket";

export type CoachAiChatPerformanceAggregateMetric =
  | "net_pnl"
  | "total_trades"
  | "win_rate";

export type CoachAiChatPerformanceAggregatePlan = Readonly<{
  planVersion: typeof COACH_AI_CHAT_PERFORMANCE_AGGREGATE_LANGUAGE_VERSION;
  resolutionSource: "deterministic";
  accountScope: "selected_account";
  reportingCurrency: string | null;
  timezone: string;
  referenceTimeUtc: string;
  entity: "instrument" | "trading_day" | "time_bucket";
  dimension: CoachAiChatPerformanceAggregateDimension;
  metric: CoachAiChatPerformanceAggregateMetric;
  operation: "rank";
  rank: Readonly<{
    direction: "ascending" | "descending";
    count: 1;
  }>;
  timeScope: CoachAiChatAnalysisScope;
  timeScopeSource: "question" | "selected_scope";
  handlerId:
    | "instrument_aggregate_rank_v1"
    | "trading_day_aggregate_rank_v1"
    | "time_aggregate_rank_v1";
  request: CoachAiChatAnalyticsPageRequest;
}>;

export type CoachAiChatPerformanceAggregateComponent =
  | "account_scope"
  | "currency_scope"
  | "timezone"
  | "reference_time"
  | "entity"
  | "dimension"
  | "metric"
  | "operation"
  | "rank"
  | "date_scope"
  | "handler";

export type CoachAiChatPerformanceAggregateDiagnostic = Readonly<{
  component: CoachAiChatPerformanceAggregateComponent;
  state: "passed" | "not_applicable" | "failed";
  value: string | null;
}>;

export type CoachAiChatPerformanceAggregateLanguageAnalysis = Readonly<{
  state: "resolved" | "unresolved" | "not_applicable";
  diagnostics: readonly CoachAiChatPerformanceAggregateDiagnostic[];
  plan: CoachAiChatPerformanceAggregatePlan | null;
  reason: string | null;
}>;

export type CoachAiChatPerformanceAggregateLanguageContext = Readonly<{
  selectedAnalysisScope: CoachAiChatAnalysisScope;
  reportingCurrency: string | null;
  timezone: string;
  referenceTime: Date;
}>;

const AGGREGATE_LANGUAGE_CANONICAL_NAMES = Object.freeze([
  "net_pnl",
  "trade_count",
  "win_rate",
  "ticker",
  "entry_time",
  "exit_time",
  "session",
  "weekday",
  "best_ambiguity",
] as const);

const availableLanguageCanonicalNames = new Set(
  coachAiChatLanguageInventory.map((entry) => entry.canonicalName),
);
for (const canonicalName of AGGREGATE_LANGUAGE_CANONICAL_NAMES) {
  if (!availableLanguageCanonicalNames.has(canonicalName)) {
    throw new Error(`TRADERLINK_COACH_LANGUAGE_INVENTORY_MISSING:${canonicalName}`);
  }
}

function diagnostic(
  component: CoachAiChatPerformanceAggregateComponent,
  state: CoachAiChatPerformanceAggregateDiagnostic["state"],
  value: string | null = null,
): CoachAiChatPerformanceAggregateDiagnostic {
  return Object.freeze({ component, state, value });
}

function normalizedQuestion(value: string): string {
  return normalizeCoachAiChatScopeQuestion(value)
    .replace(/\s+/gu, " ")
    .trim();
}

function baseDiagnostics(
  context: CoachAiChatPerformanceAggregateLanguageContext,
): CoachAiChatPerformanceAggregateDiagnostic[] {
  return [
    diagnostic("account_scope", "passed", "selected account"),
    diagnostic("currency_scope", "passed", context.reportingCurrency ?? "source-currency partitions"),
    diagnostic("timezone", "passed", context.timezone),
    diagnostic("reference_time", "passed", context.referenceTime.toISOString()),
  ];
}

function notApplicable(
  context: CoachAiChatPerformanceAggregateLanguageContext,
): CoachAiChatPerformanceAggregateLanguageAnalysis {
  return Object.freeze({
    state: "not_applicable",
    diagnostics: Object.freeze([
      ...baseDiagnostics(context),
      diagnostic("entity", "not_applicable"),
      diagnostic("dimension", "not_applicable"),
      diagnostic("metric", "not_applicable"),
      diagnostic("operation", "not_applicable"),
      diagnostic("rank", "not_applicable"),
      diagnostic("date_scope", "not_applicable"),
      diagnostic("handler", "not_applicable"),
    ]),
    plan: null,
    reason: null,
  });
}

function unresolved(
  context: CoachAiChatPerformanceAggregateLanguageContext,
  component: "entity" | "dimension" | "metric" | "rank",
  reason: string,
): CoachAiChatPerformanceAggregateLanguageAnalysis {
  return Object.freeze({
    state: "unresolved",
    diagnostics: Object.freeze([
      ...baseDiagnostics(context),
      diagnostic("entity", component === "entity" ? "failed" : "passed", "aggregate performance"),
      diagnostic("dimension", component === "dimension" ? "failed" : "not_applicable"),
      diagnostic("metric", component === "metric" ? "failed" : "not_applicable"),
      diagnostic("operation", "not_applicable"),
      diagnostic("rank", component === "rank" ? "failed" : "not_applicable"),
      diagnostic("date_scope", "not_applicable"),
      diagnostic("handler", "not_applicable"),
    ]),
    plan: null,
    reason,
  });
}

function hasRankingLanguage(question: string): boolean {
  return /\b(?:best|worst|highest|lowest|most|least|biggest|largest|avoid)\b/u.test(question);
}

function rankDirection(question: string): "ascending" | "descending" {
  return /\b(?:worst|lowest|least|lost|loss|avoid)\b/u.test(question)
    ? "ascending"
    : "descending";
}

function tickerMetric(question: string): CoachAiChatPerformanceAggregateMetric | null {
  if (/\b(?:win rate|winning percentage)\b/u.test(question)) return "win_rate";
  if (/\b(?:most traded|trade(?:d)? the most|most trades|trade count)\b/u.test(question)) {
    return "total_trades";
  }
  if (/\b(?:profit|profitable|pnl|loss|lost|money|perform)\b/u.test(question)) return "net_pnl";
  return null;
}

function timeMetric(question: string): CoachAiChatPerformanceAggregateMetric | null {
  return /\b(?:profit|profitable|pnl|loss|lost|perform|avoid|best|worst)\b/u.test(question)
    ? "net_pnl"
    : null;
}

function dimensionForQuestion(question: string): CoachAiChatPerformanceAggregateDimension | null {
  if (/\b(?:rule|rules|setup|setups|tag|tags)\b/u.test(question)) return null;
  if (/\b(?:ticker|tickers|symbol|symbols)\b/u.test(question)) return "ticker";
  if (/\b(?:exit time|exit times)\b/u.test(question)) return "exit_time_bucket";
  if (/\b(?:entry time|entry times|time of day)\b/u.test(question)) return "entry_time_bucket";
  if (/\b(?:session|sessions)\b/u.test(question)) return "entry_session";
  if (/\b(?:weekday|weekdays|day of (?:the )?week|days of (?:the )?week)\b/u.test(question)) {
    return "entry_weekday";
  }
  if (/\b(?:trading day|trading days|day|days)\b/u.test(question) &&
      !/\bday trade(?:s)?\b/u.test(question)) return "trading_day";
  return null;
}

function entityForDimension(
  dimension: CoachAiChatPerformanceAggregateDimension,
): CoachAiChatPerformanceAggregatePlan["entity"] {
  if (dimension === "ticker") return "instrument";
  if (dimension === "trading_day") return "trading_day";
  return "time_bucket";
}

function handlerForDimension(
  dimension: CoachAiChatPerformanceAggregateDimension,
): CoachAiChatPerformanceAggregatePlan["handlerId"] {
  if (dimension === "ticker") return "instrument_aggregate_rank_v1";
  if (dimension === "trading_day") return "trading_day_aggregate_rank_v1";
  return "time_aggregate_rank_v1";
}

function requestForPlan(input: Readonly<{
  dimension: CoachAiChatPerformanceAggregateDimension;
  metric: CoachAiChatPerformanceAggregateMetric;
  rankDirection: "ascending" | "descending";
}>): CoachAiChatPerformanceAggregatePlan["request"] {
  const grouping = input.dimension === "ticker"
    ? "instrument" as const
    : input.dimension === "trading_day"
      ? "closing_day" as const
      : input.dimension;
  return Object.freeze({
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
    toolName: input.dimension === "ticker"
      ? "get_results_by_ticker"
      : input.dimension === "trading_day"
        ? "get_analytics_overview"
        : "get_timing_analytics",
    moneyBasis: "net",
    aggregateSelection: Object.freeze({
      grouping,
      metricId: input.metric,
      rankDirection: input.rankDirection,
    }),
  });
}

function resolvedDiagnostics(input: Readonly<{
  context: CoachAiChatPerformanceAggregateLanguageContext;
  entity: CoachAiChatPerformanceAggregatePlan["entity"];
  dimension: CoachAiChatPerformanceAggregateDimension;
  metric: CoachAiChatPerformanceAggregateMetric;
  rank: CoachAiChatPerformanceAggregatePlan["rank"];
  explicitScope: boolean;
  handlerId: CoachAiChatPerformanceAggregatePlan["handlerId"];
}>): readonly CoachAiChatPerformanceAggregateDiagnostic[] {
  return Object.freeze([
    ...baseDiagnostics(input.context),
    diagnostic("entity", "passed", input.entity),
    diagnostic("dimension", "passed", input.dimension),
    diagnostic("metric", "passed", input.metric),
    diagnostic("operation", "passed", "rank"),
    diagnostic("rank", "passed", `${input.rank.direction}:${input.rank.count}`),
    diagnostic("date_scope", "passed", input.explicitScope ? "question calendar scope" : "selected scope"),
    diagnostic("handler", "passed", input.handlerId),
  ]);
}

/**
 * Deterministic selected-account aggregate routing. It only recognizes the
 * explicitly registered Journal dimensions for this batch; other performance
 * language remains available to later routes rather than being coerced here.
 */
export function analyzeCoachAiChatPerformanceAggregateLanguage(
  rawQuestion: string,
  context: CoachAiChatPerformanceAggregateLanguageContext,
): CoachAiChatPerformanceAggregateLanguageAnalysis {
  const question = normalizedQuestion(rawQuestion);
  const dimension = dimensionForQuestion(question);
  if (!dimension) return notApplicable(context);
  if (!hasRankingLanguage(question)) {
    return unresolved(context, "rank", "aggregate_rank_language_missing");
  }
  const metric = dimension === "ticker" ? tickerMetric(question) : timeMetric(question);
  if (!metric) return unresolved(context, "metric", "aggregate_metric_not_in_batch");
  const scopeMatch = matchCoachAiChatQuestionAnalysisScope(
    rawQuestion,
    context.referenceTime,
    context.timezone,
  );
  const timeScope = scopeMatch?.scope ?? context.selectedAnalysisScope;
  const timeScopeSource = scopeMatch ? "question" as const : "selected_scope" as const;
  const rank = Object.freeze({ direction: rankDirection(question), count: 1 as const });
  const entity = entityForDimension(dimension);
  const handlerId = handlerForDimension(dimension);
  const plan: CoachAiChatPerformanceAggregatePlan = Object.freeze({
    planVersion: COACH_AI_CHAT_PERFORMANCE_AGGREGATE_LANGUAGE_VERSION,
    resolutionSource: "deterministic",
    accountScope: "selected_account",
    reportingCurrency: context.reportingCurrency,
    timezone: context.timezone,
    referenceTimeUtc: context.referenceTime.toISOString(),
    entity,
    dimension,
    metric,
    operation: "rank",
    rank,
    timeScope,
    timeScopeSource,
    handlerId,
    request: requestForPlan({ dimension, metric, rankDirection: rank.direction }),
  });
  return Object.freeze({
    state: "resolved",
    diagnostics: resolvedDiagnostics({
      context,
      entity,
      dimension,
      metric,
      rank,
      explicitScope: scopeMatch !== null,
      handlerId,
    }),
    plan,
    reason: null,
  });
}
