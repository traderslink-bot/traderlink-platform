import {
  COACH_AI_CHAT_ANSWER_CONTRACT_VERSION,
  type CoachAiChatAnswer,
  type CoachAiChatAnalysisScope,
} from "../contracts/ai-chat-contracts";
import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  type CoachAiChatFactualToolMetricId,
  type CoachAiChatFactualToolRequest,
} from "../contracts/coach-ai-chat-factual-tool-contracts";
import type {
  JournalAnalyticsGroupResult,
  JournalAnalyticsMetricResult,
  JournalAnalyticsPartitionedResponse,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import {
  formatJournalAnalyticsMetric,
  formatJournalAnalyticsMoney,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { compareTradeExplorerMetricValues } from
  "@/src/modules/journal-analytics/presentation/trade-explorer-ordering";

import {
  buildCoachAiChatClaimCatalog,
  validateCoachAiChatExactFactTokens,
} from "./coach-ai-chat-claim-catalog";
import { CoachAiChatFactualToolDispatcher } from
  "./coach-ai-chat-factual-tool-dispatcher";
import { validateCoachAiChatResponseSafety } from "./coach-ai-chat-response-safety";
import {
  analyzeCoachAiChatCompletedTradePerformanceLanguage,
  type CoachAiChatCompletedTradePerformanceLanguageAnalysis,
  type CoachAiChatCompletedTradePerformancePlan,
} from "./coach-ai-chat-completed-trade-performance-language";
import {
  analyzeCoachAiChatPerformanceAggregateLanguage,
  type CoachAiChatPerformanceAggregateLanguageAnalysis,
  type CoachAiChatPerformanceAggregatePlan,
} from "./coach-ai-chat-performance-aggregate-language";
import {
  COACH_AI_CHAT_DEFAULT_TRADING_TIMEZONE,
  matchCoachAiChatQuestionAnalysisScope,
  type CoachAiChatQuestionScopeMatch,
} from "./coach-ai-chat-question-time-scope";

export { resolveCoachAiChatQuestionAnalysisScope } from
  "./coach-ai-chat-question-time-scope";

export const COACH_AI_CHAT_DETERMINISTIC_FAST_PATH_VERSION =
  "links_deterministic_fast_path_v1" as const;

type SummaryRouteKey =
  | "net_pnl"
  | "gross_pnl"
  | "total_trades"
  | "win_rate"
  | "best_trade"
  | "worst_trade";

type RankedRouteKey =
  | "most_profitable_day"
  | "least_profitable_day"
  | "most_profitable_ticker"
  | "least_profitable_ticker";

export type CoachAiChatDeterministicFastPathRoute = Readonly<{
  routeKey:
    | SummaryRouteKey
    | RankedRouteKey
    | "completed_trade_performance"
    | "performance_aggregate";
  request: CoachAiChatFactualToolRequest;
  analysisScopeOverride?: CoachAiChatAnalysisScope;
  completedTradePerformance?: Readonly<{
    plan: CoachAiChatCompletedTradePerformancePlan;
    diagnostics: CoachAiChatCompletedTradePerformanceLanguageAnalysis["diagnostics"];
  }>;
  performanceAggregate?: Readonly<{
    plan: CoachAiChatPerformanceAggregatePlan;
    diagnostics: CoachAiChatPerformanceAggregateLanguageAnalysis["diagnostics"];
  }>;
}>;

export type CoachAiChatDeterministicFastPathResult = Readonly<{
  routeKey: CoachAiChatDeterministicFastPathRoute["routeKey"];
  answer: CoachAiChatAnswer;
  completedTradePerformance?: CoachAiChatDeterministicFastPathRoute["completedTradePerformance"];
  performanceAggregate?: CoachAiChatDeterministicFastPathRoute["performanceAggregate"];
}>;

export type CoachAiChatDeterministicFastPathSelectionContext = Readonly<{
  requestedAnalysisScope?: CoachAiChatAnalysisScope;
  reportingCurrency?: string | null;
  timezone?: string;
}>;

const SUMMARY_PHRASES: Readonly<Record<SummaryRouteKey, readonly string[]>> = Object.freeze({
  net_pnl: Object.freeze([
    "what is my net pnl", "whats my net pnl", "what is my net profit",
    "whats my net profit", "how much net profit have i made",
  ]),
  gross_pnl: Object.freeze([
    "what is my gross pnl", "whats my gross pnl", "what is my gross profit",
    "whats my gross profit", "how much gross profit have i made",
  ]),
  total_trades: Object.freeze([
    "how many trades have i taken", "how many completed trades do i have",
    "how many completed trades have i taken", "what is my total trade count",
    "whats my total trade count", "how many trades did i do",
    "how many trades did i take",
  ]),
  win_rate: Object.freeze([
    "what is my win rate", "whats my win rate", "show me my win rate",
  ]),
  best_trade: Object.freeze([
    "what was my best trade", "whats my best trade",
    "what was my most profitable trade", "show me my best trade",
  ]),
  worst_trade: Object.freeze([
    "what was my worst trade", "whats my worst trade",
    "what was my least profitable trade", "show me my worst trade",
  ]),
});

const RANKED_PHRASES: Readonly<Record<RankedRouteKey, readonly string[]>> = Object.freeze({
  most_profitable_day: Object.freeze([
    "what was my most profitable day", "whats my most profitable day",
    "which day was my most profitable", "what was my best trading day",
  ]),
  least_profitable_day: Object.freeze([
    "what was my least profitable day", "whats my least profitable day",
    "which day was my least profitable", "what was my worst trading day",
  ]),
  most_profitable_ticker: Object.freeze([
    "what ticker made me the most money", "which ticker made me the most money",
    "what was my most profitable ticker", "which ticker was my most profitable",
  ]),
  least_profitable_ticker: Object.freeze([
    "what ticker lost me the most money", "which ticker lost me the most money",
    "what was my least profitable ticker", "which ticker was my least profitable",
  ]),
});

function normalizeQuestion(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[’']/gu, "")
    .replace(/[^a-z0-9]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function phraseRoute<T extends string>(
  question: string,
  phrases: Readonly<Record<T, readonly string[]>>,
): T | null {
  for (const [routeKey, accepted] of Object.entries(phrases) as [T, readonly string[]][]) {
    if (accepted.includes(question)) return routeKey;
  }
  return null;
}

function removeExplicitQuestionScope(question: string, match: CoachAiChatQuestionScopeMatch | null): string {
  if (!match) return question;
  return normalizeQuestion(question
    .replace(normalizeQuestion(match.phrase), " ")
    .replace(/\b(?:in|on|during)(?: the)?\s*$/u, ""));
}

export function selectCoachAiChatDeterministicFastPath(
  question: string,
  now = new Date(),
  context: CoachAiChatDeterministicFastPathSelectionContext = Object.freeze({}),
): CoachAiChatDeterministicFastPathRoute | null {
  const timezone = context.timezone ?? COACH_AI_CHAT_DEFAULT_TRADING_TIMEZONE;
  const completedTradePerformance = analyzeCoachAiChatCompletedTradePerformanceLanguage(question, {
    selectedAnalysisScope: context.requestedAnalysisScope ?? Object.freeze({ kind: "all" }),
    reportingCurrency: context.reportingCurrency ?? null,
    timezone,
    referenceTime: now,
  });
  if (completedTradePerformance.state === "resolved" && completedTradePerformance.plan) {
    return Object.freeze({
      routeKey: "completed_trade_performance",
      request: completedTradePerformance.plan.request,
      ...(completedTradePerformance.plan.timeScopeSource === "question"
        ? { analysisScopeOverride: completedTradePerformance.plan.timeScope }
        : {}),
      completedTradePerformance: Object.freeze({
        plan: completedTradePerformance.plan,
        diagnostics: completedTradePerformance.diagnostics,
      }),
    });
  }
  const performanceAggregate = analyzeCoachAiChatPerformanceAggregateLanguage(question, {
    selectedAnalysisScope: context.requestedAnalysisScope ?? Object.freeze({ kind: "all" }),
    reportingCurrency: context.reportingCurrency ?? null,
    timezone,
    referenceTime: now,
  });
  if (performanceAggregate.state === "resolved" && performanceAggregate.plan) {
    return Object.freeze({
      routeKey: "performance_aggregate",
      request: performanceAggregate.plan.request,
      ...(performanceAggregate.plan.timeScopeSource === "question"
        ? { analysisScopeOverride: performanceAggregate.plan.timeScope }
        : {}),
      performanceAggregate: Object.freeze({
        plan: performanceAggregate.plan,
        diagnostics: performanceAggregate.diagnostics,
      }),
    });
  }
  const normalized = normalizeQuestion(question);
  const scopeMatch = matchCoachAiChatQuestionAnalysisScope(question, now, timezone);
  const scopedQuestion = removeExplicitQuestionScope(normalized, scopeMatch);
  const summary = phraseRoute(scopedQuestion, SUMMARY_PHRASES);
  if (summary) {
    if (summary === "best_trade" || summary === "worst_trade") {
      return Object.freeze({
        routeKey: summary,
        request: Object.freeze({
          contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
          toolName: "query_trade_explorer",
          resultView: "trades",
          tradeSort: summary === "best_trade" ? "pnl_desc" : "pnl_asc",
          pageSize: 1,
          afterCursor: null,
          moneyBasis: "net",
        }),
        ...(scopeMatch ? { analysisScopeOverride: scopeMatch.scope } : {}),
      });
    }
    const moneyBasis = summary === "gross_pnl" ? "gross" : "net";
    return Object.freeze({
      routeKey: summary,
      request: Object.freeze({
        contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
        toolName: "summarize_closed_trades",
        metricIds: Object.freeze([summary]),
        moneyBasis,
      }),
      ...(scopeMatch ? { analysisScopeOverride: scopeMatch.scope } : {}),
    });
  }
  const ranked = phraseRoute(scopedQuestion, RANKED_PHRASES);
  if (!ranked) return null;
  const ticker = ranked.endsWith("ticker");
  return Object.freeze({
    routeKey: ranked,
    request: Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "query_trade_explorer",
      resultView: ticker ? "tickers" : "trading_days",
      metricId: "net_pnl",
      grouping: ticker ? "instrument" : "closing_day",
      rankDirection: ranked.startsWith("most_") ? "descending" : "ascending",
      moneyBasis: "net",
    }),
    ...(scopeMatch ? { analysisScopeOverride: scopeMatch.scope } : {}),
  });
}

type TradeExplorerEvidenceRow = Readonly<{
  displayedSymbol?: unknown;
  direction?: unknown;
  closeLocalDate?: unknown;
  selectedPnlDecimal?: unknown;
}>;

type TradeExplorerEvidence = Readonly<{
  currency?: unknown;
  rows?: readonly TradeExplorerEvidenceRow[];
}>;

function tradeExplorerEvidence(value: unknown): TradeExplorerEvidence | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const evidence = (value as Readonly<{ evidence?: unknown }>).evidence;
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) return null;
  const record = evidence as Readonly<{ currency?: unknown; rows?: unknown }>;
  return Array.isArray(record.rows)
    ? Object.freeze({ currency: record.currency, rows: record.rows })
    : null;
}

function partitionedResult(value: unknown): JournalAnalyticsPartitionedResponse | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const direct = value as Partial<JournalAnalyticsPartitionedResponse>;
  if (Array.isArray(direct.partitions)) return direct as JournalAnalyticsPartitionedResponse;
  const nested = (value as { response?: unknown }).response;
  if (!nested || typeof nested !== "object" || Array.isArray(nested)) return null;
  const response = nested as Partial<JournalAnalyticsPartitionedResponse>;
  return Array.isArray(response.partitions)
    ? response as JournalAnalyticsPartitionedResponse
    : null;
}

function claimRefsForPaths(
  dispatcher: CoachAiChatFactualToolDispatcher,
  toolCallId: string,
  paths: readonly string[],
): readonly string[] {
  const catalog = buildCoachAiChatClaimCatalog(dispatcher.snapshotsForPersistence());
  return Object.freeze(paths.map((path) => {
    const claim = catalog.find((candidate) =>
      candidate.toolCallId === toolCallId && candidate.path === path);
    if (!claim) throw new Error("TRADERLINK_COACH_DETERMINISTIC_CLAIM_MISSING");
    return claim.claimRef;
  }));
}

function answerWithEvidence(input: Readonly<{
  dispatcher: CoachAiChatFactualToolDispatcher;
  toolCallId: string;
  directAnswer: string;
  directPaths: readonly string[];
  supportingObservation?: string | null;
  supportingPaths?: readonly string[];
  limitation?: string | null;
}>): CoachAiChatAnswer {
  const supportingObservations = input.supportingObservation
    ? Object.freeze([input.supportingObservation])
    : Object.freeze([]);
  const evidenceReferences = Object.freeze([
    Object.freeze({
      toolCallId: input.toolCallId,
      claimRefs: claimRefsForPaths(input.dispatcher, input.toolCallId, input.directPaths),
      statement: input.directAnswer,
    }),
    ...(input.supportingObservation && input.supportingPaths
      ? [Object.freeze({
          toolCallId: input.toolCallId,
          claimRefs: claimRefsForPaths(
            input.dispatcher,
            input.toolCallId,
            input.supportingPaths,
          ),
          statement: input.supportingObservation,
        })]
      : []),
  ]);
  const result = Object.freeze({
    contractVersion: COACH_AI_CHAT_ANSWER_CONTRACT_VERSION,
    directAnswer: input.directAnswer,
    supportingObservations,
    limitation: input.limitation ?? null,
    nextQuestion: null,
    evidenceReferences,
  });
  validateCoachAiChatExactFactTokens({
    ...result,
    toolCalls: input.dispatcher.snapshotsForPersistence(),
  });
  validateCoachAiChatResponseSafety({
    text: [result.directAnswer, ...result.supportingObservations,
      result.limitation ?? ""].join("\n"),
    hasConfirmationDraft: false,
  });
  return result;
}

function noFigureAnswer(message: string): CoachAiChatAnswer {
  validateCoachAiChatResponseSafety({ text: message, hasConfirmationDraft: false });
  return Object.freeze({
    contractVersion: COACH_AI_CHAT_ANSWER_CONTRACT_VERSION,
    directAnswer: message,
    supportingObservations: Object.freeze([]),
    limitation: null,
    nextQuestion: null,
    evidenceReferences: Object.freeze([]),
  });
}

function summaryAnswer(
  route: CoachAiChatDeterministicFastPathRoute,
  dispatcher: CoachAiChatFactualToolDispatcher,
  toolCallId: string,
  response: JournalAnalyticsPartitionedResponse,
): CoachAiChatAnswer {
  if (response.partitions.length !== 1) {
    return noFigureAnswer(response.partitions.length === 0
      ? "I don’t have any completed trades in this scope yet."
      : "Your results span more than one currency here, so I can’t combine them into one reliable figure.");
  }
  const partition = response.partitions[0]!;
  const metricId = route.routeKey as CoachAiChatFactualToolMetricId;
  const metricIndex = partition.metrics.findIndex((metric) => metric.metricId === metricId);
  const metric = partition.metrics[metricIndex];
  if (!metric || metric.value === null || metric.state === "unavailable" ||
      metric.state === "empty") {
    return noFigureAnswer(metric?.state === "empty"
      ? "I don’t have any completed trades in this scope yet."
      : "I can’t give you that figure reliably because the required trade coverage is unavailable.");
  }
  const rendered = formatJournalAnalyticsMetric(metric);
  const directAnswer = route.routeKey === "net_pnl"
    ? `Your net P/L is ${rendered}.`
    : route.routeKey === "gross_pnl"
      ? `Your gross P/L is ${rendered}.`
      : route.routeKey === "total_trades"
        ? `You have ${rendered} completed trades in this scope.`
        : route.routeKey === "win_rate"
          ? `Your win rate is ${rendered}.`
          : route.routeKey === "best_trade"
            ? `Your best completed trade made ${rendered}.`
            : `Your worst completed trade was ${rendered}.`;
  const valuePath = `/partitions/0/metrics/${metricIndex}/value/${
    metric.value.kind === "integer" ? "value" :
      metric.value.kind === "decimal" ? "valueDecimal" :
        metric.value.kind === "rational" ? "roundedDecimal" :
          metric.value.kind === "duration" ? "milliseconds" : "value"
  }`;
  return answerWithEvidence({
    dispatcher,
    toolCallId,
    directAnswer,
    directPaths: Object.freeze([valuePath]),
    limitation: metric.state === "partial"
      ? "This figure uses only trades with the required complete coverage."
      : null,
  });
}

function findMetric(group: JournalAnalyticsGroupResult, metricId: string): Readonly<{
  metric: JournalAnalyticsMetricResult;
  index: number;
}> | null {
  const index = group.metrics.findIndex((metric) => metric.metricId === metricId);
  const metric = group.metrics[index];
  return metric ? Object.freeze({ metric, index }) : null;
}

function rankedAnswer(
  route: CoachAiChatDeterministicFastPathRoute,
  dispatcher: CoachAiChatFactualToolDispatcher,
  toolCallId: string,
  response: JournalAnalyticsPartitionedResponse,
): CoachAiChatAnswer {
  if (response.partitions.length !== 1) {
    return noFigureAnswer(response.partitions.length === 0
      ? "I don’t have any completed trades in this scope yet."
      : "Your results span more than one currency here, so I can’t rank them as one reliable result.");
  }
  const partition = response.partitions[0]!;
  const group = partition.groups[0];
  const pnl = group ? findMetric(group, "net_pnl") : null;
  if (!group || !pnl || pnl.metric.value?.kind !== "decimal" ||
      pnl.metric.state === "unavailable" || pnl.metric.state === "empty") {
    return noFigureAnswer("I don’t have a complete ranked result for that question in this scope.");
  }
  const money = formatJournalAnalyticsMoney(
    pnl.metric.value.valueDecimal,
    pnl.metric.currency ?? partition.currency,
  );
  const isDay = route.routeKey.endsWith("day");
  const highest = route.routeKey.startsWith("most_");
  const directAnswer = isDay
    ? `Your ${highest ? "most profitable" : "lowest net P/L"} trading day was ${group.label}, with ${money} net P/L.`
    : `Your ${highest ? "most profitable" : "lowest net P/L"} ticker was ${group.label}, with ${money} net P/L.`;
  const count = findMetric(group, "total_trades");
  const countValue = count?.metric.value?.kind === "integer"
    ? count.metric.value.value
    : null;
  const supportingObservation = countValue === null
    ? null
    : `${isDay ? "You took" : "That result came from"} ${countValue} ${countValue === 1 ? "trade" : "trades"}${isDay ? " that day" : ""}.`;
  const basePath = "/response/partitions/0/groups/0";
  return answerWithEvidence({
    dispatcher,
    toolCallId,
    directAnswer,
    directPaths: Object.freeze([
      `${basePath}/label`,
      `${basePath}/metrics/${pnl.index}/value/valueDecimal`,
    ]),
    supportingObservation,
    supportingPaths: count && countValue !== null
      ? Object.freeze([`${basePath}/metrics/${count.index}/value/value`])
      : undefined,
    limitation: pnl.metric.state === "partial"
      ? "This ranking uses only trades with the required complete coverage."
      : null,
  });
}

function metricValuePath(metric: JournalAnalyticsMetricResult, metricIndex: number): string {
  const value = metric.value;
  const field = value?.kind === "integer"
    ? "value"
    : value?.kind === "decimal"
      ? "valueDecimal"
      : value?.kind === "rational"
        ? "roundedDecimal"
        : value?.kind === "duration"
          ? "milliseconds"
          : "value";
  return `metrics/${metricIndex}/value/${field}`;
}

type AggregateRankedGroup = Readonly<{
  group: JournalAnalyticsGroupResult;
  groupIndex: number;
  metric: JournalAnalyticsMetricResult;
  metricIndex: number;
}>;

function aggregateRankedGroup(
  response: JournalAnalyticsPartitionedResponse,
  metricId: string,
  direction: "ascending" | "descending",
): AggregateRankedGroup | null {
  if (response.partitions.length !== 1) return null;
  const partition = response.partitions[0]!;
  const candidates = partition.groups.flatMap((group, groupIndex) => {
    const found = findMetric(group, metricId);
    if (!found || !found.metric.value || found.metric.state === "empty" ||
        found.metric.state === "unavailable") return [];
    return [Object.freeze({ group, groupIndex, metric: found.metric, metricIndex: found.index })];
  });
  candidates.sort((left, right) => {
    const comparison = compareTradeExplorerMetricValues(left.metric.value!, right.metric.value!);
    if (comparison === null || comparison === 0) return left.group.label.localeCompare(right.group.label);
    return direction === "ascending" ? comparison : -comparison;
  });
  return candidates[0] ?? null;
}

function aggregateSubject(
  dimension: CoachAiChatPerformanceAggregatePlan["dimension"],
): string {
  if (dimension === "ticker") return "ticker";
  if (dimension === "trading_day") return "trading day";
  if (dimension === "entry_weekday") return "weekday";
  if (dimension === "entry_session") return "session";
  if (dimension === "entry_time_bucket") return "entry-time window";
  return "exit-time window";
}

function performanceAggregateRankAnswer(
  route: CoachAiChatDeterministicFastPathRoute,
  dispatcher: CoachAiChatFactualToolDispatcher,
  toolCallId: string,
  response: JournalAnalyticsPartitionedResponse,
): CoachAiChatAnswer {
  const plan = route.performanceAggregate?.plan;
  if (!plan) throw new Error("TRADERLINK_COACH_PERFORMANCE_AGGREGATE_PLAN_INVALID");
  if (response.partitions.length !== 1) {
    return noFigureAnswer(response.partitions.length === 0
      ? "I don’t have any completed trades in this scope yet."
      : "Your results span more than one currency here, so I can’t rank them as one reliable result.");
  }
  const partition = response.partitions[0]!;
  const ranked = aggregateRankedGroup(response, plan.metric, plan.rank.direction);
  if (!ranked) {
    return noFigureAnswer("I don’t have a complete ranked result for that question in this scope.");
  }
  const subject = aggregateSubject(plan.dimension);
  const highest = plan.rank.direction === "descending";
  const rendered = plan.metric === "net_pnl" && ranked.metric.value?.kind === "decimal"
    ? formatJournalAnalyticsMoney(ranked.metric.value.valueDecimal,
      ranked.metric.currency ?? partition.currency)
    : formatJournalAnalyticsMetric(ranked.metric);
  const directAnswer = plan.metric === "net_pnl"
    ? `Your ${highest ? "highest" : "lowest"} net P/L ${subject} was ${ranked.group.label}, with ${rendered} net P/L.`
    : plan.metric === "total_trades"
      ? `Your most-traded ticker was ${ranked.group.label}, with ${rendered} completed trades.`
      : `Your ${highest ? "highest" : "lowest"} win-rate ticker was ${ranked.group.label}, at ${rendered}.`;
  const count = plan.metric === "total_trades" ? null : findMetric(ranked.group, "total_trades");
  const countValue = count?.metric.value?.kind === "integer" ? count.metric.value.value : null;
  const supportingObservation = countValue === null
    ? null
    : `That result includes ${countValue} ${countValue === 1 ? "completed trade" : "completed trades"}.`;
  const basePath = `/response/partitions/0/groups/${ranked.groupIndex}`;
  return answerWithEvidence({
    dispatcher,
    toolCallId,
    directAnswer,
    directPaths: Object.freeze([
      `${basePath}/label`,
      `${basePath}/${metricValuePath(ranked.metric, ranked.metricIndex)}`,
    ]),
    supportingObservation,
    supportingPaths: count && countValue !== null
      ? Object.freeze([`${basePath}/${metricValuePath(count.metric, count.index)}`])
      : undefined,
    limitation: ranked.metric.state === "partial"
      ? "This ranking uses only trades with the required complete coverage."
      : null,
  });
}

function individualTradeAnswer(
  route: CoachAiChatDeterministicFastPathRoute,
  dispatcher: CoachAiChatFactualToolDispatcher,
  toolCallId: string,
  value: unknown,
): CoachAiChatAnswer {
  const evidence = tradeExplorerEvidence(value);
  const row = evidence?.rows?.[0];
  if (!evidence || !row || typeof row.displayedSymbol !== "string" ||
      (row.direction !== "long" && row.direction !== "short") ||
      typeof row.closeLocalDate !== "string" || typeof row.selectedPnlDecimal !== "string" ||
      typeof evidence.currency !== "string") {
    return noFigureAnswer("I don’t have a complete ranked result for that question in this scope.");
  }
  const highest = route.routeKey === "best_trade";
  const money = formatJournalAnalyticsMoney(row.selectedPnlDecimal, evidence.currency);
  return answerWithEvidence({
    dispatcher,
    toolCallId,
    directAnswer: `Your ${highest ? "most profitable" : "least profitable"} completed trade was ${row.displayedSymbol} ${row.direction}, closed on ${row.closeLocalDate}, with ${money} net P/L.`,
    directPaths: Object.freeze([
      "/evidence/rows/0/displayedSymbol",
      "/evidence/rows/0/direction",
      "/evidence/rows/0/closeLocalDate",
      "/evidence/rows/0/selectedPnlDecimal",
      "/evidence/currency",
    ]),
  });
}

function completedTradePerformanceSummaryAnswer(
  route: CoachAiChatDeterministicFastPathRoute,
  dispatcher: CoachAiChatFactualToolDispatcher,
  toolCallId: string,
  response: JournalAnalyticsPartitionedResponse,
): CoachAiChatAnswer {
  const plan = route.completedTradePerformance?.plan;
  if (!plan || plan.operation !== "summary") {
    throw new Error("TRADERLINK_COACH_COMPLETED_TRADE_PLAN_INVALID");
  }
  if (response.partitions.length !== 1) {
    return noFigureAnswer(response.partitions.length === 0
      ? "I don’t have any completed trades in this scope yet."
      : "Your results span more than one currency here, so I can’t combine them into one reliable figure.");
  }
  const partition = response.partitions[0]!;
  const metricIndex = partition.metrics.findIndex((metric) => metric.metricId === plan.metric);
  const metric = partition.metrics[metricIndex];
  if (!metric || metric.value === null || metric.state === "unavailable" || metric.state === "empty") {
    return noFigureAnswer(metric?.state === "empty"
      ? "I don’t have any completed trades in this scope yet."
      : "I can’t give you that figure reliably because the required trade coverage is unavailable.");
  }
  const rendered = formatJournalAnalyticsMetric(metric);
  const netOutcome = metric.value.kind === "decimal"
    ? metric.value.valueDecimal.startsWith("-")
      ? "a net loss"
      : metric.value.valueDecimal === "0"
        ? "flat"
        : "a net profit"
    : null;
  const directAnswer = (() => {
    switch (plan.metric) {
      case "net_pnl":
        return `Your net P/L is ${rendered}${netOutcome ? ` (${netOutcome}).` : "."}`;
      case "gross_profit": return `Your gross profit is ${rendered}.`;
      case "gross_loss": return `Your gross loss is ${rendered}.`;
      case "gross_pnl": return `Your gross P/L is ${rendered}.`;
      case "win_rate": return `Your win rate is ${rendered}.`;
      case "loss_rate": return `Your loss rate is ${rendered}.`;
      case "profit_factor": return `Your profit factor is ${rendered}.`;
      case "expectancy": return `Your expectancy per completed trade is ${rendered}.`;
      case "average_pnl": return `Your average net P/L per completed trade is ${rendered}.`;
      case "average_gross_pnl": return `Your average gross P/L per completed trade is ${rendered}.`;
      case "average_winning_trade": return `Your average winning trade is ${rendered}.`;
      case "average_losing_trade": return `Your average losing trade is ${rendered}.`;
      case "total_trades":
        return `You completed ${rendered} ${rendered === "1" ? "trade" : "trades"} in this scope.`;
      case "win_count":
        return `You had ${rendered} winning ${rendered === "1" ? "trade" : "trades"} in this scope.`;
      case "loss_count":
        return `You had ${rendered} losing ${rendered === "1" ? "trade" : "trades"} in this scope.`;
      default:
        throw new Error("TRADERLINK_COACH_COMPLETED_TRADE_SUMMARY_METRIC_INVALID");
    }
  })();
  const valuePath = `/partitions/0/metrics/${metricIndex}/value/${
    metric.value.kind === "integer" ? "value" :
      metric.value.kind === "decimal" ? "valueDecimal" :
        metric.value.kind === "rational" ? "roundedDecimal" :
          metric.value.kind === "duration" ? "milliseconds" : "value"
  }`;
  return answerWithEvidence({
    dispatcher,
    toolCallId,
    directAnswer,
    directPaths: Object.freeze([valuePath]),
    limitation: metric.state === "partial"
      ? "This figure uses only trades with the required complete coverage."
      : null,
  });
}

function completedTradePerformanceRankAnswer(
  route: CoachAiChatDeterministicFastPathRoute,
  dispatcher: CoachAiChatFactualToolDispatcher,
  toolCallId: string,
  value: unknown,
): CoachAiChatAnswer {
  const plan = route.completedTradePerformance?.plan;
  if (!plan || plan.operation !== "rank" || !plan.rank) {
    throw new Error("TRADERLINK_COACH_COMPLETED_TRADE_PLAN_INVALID");
  }
  const evidence = tradeExplorerEvidence(value);
  const rows = evidence?.rows?.slice(0, plan.rank.count) ?? [];
  if (!evidence || rows.length === 0 || typeof evidence.currency !== "string") {
    return noFigureAnswer("I don’t have a complete ranked result for that question in this scope.");
  }
  const currency = evidence.currency;
  const renderedRows = rows.map((row, index) => {
    if (typeof row.displayedSymbol !== "string" ||
        (row.direction !== "long" && row.direction !== "short") ||
        typeof row.closeLocalDate !== "string" || typeof row.selectedPnlDecimal !== "string") {
      return null;
    }
    return Object.freeze({
      index,
      text: `${row.displayedSymbol} ${row.direction}, closed on ${row.closeLocalDate}, ${formatJournalAnalyticsMoney(row.selectedPnlDecimal, currency)} net P/L.`,
    });
  });
  if (renderedRows.some((row) => row === null)) {
    return noFigureAnswer("I don’t have a complete ranked result for that question in this scope.");
  }
  const completeRows = renderedRows as readonly Readonly<{ index: number; text: string }>[];
  const highest = plan.rank.direction === "descending";
  const descriptor = highest ? "highest-P/L" : "lowest-P/L";
  const subject = plan.outcomeFilter === "win"
    ? "winning completed trade"
    : plan.outcomeFilter === "loss"
      ? "losing completed trade"
      : "completed trade";
  const directAnswer = completeRows.length === 1
    ? `Your ${highest ? "most profitable" : "least profitable"} ${subject} was ${completeRows[0]!.text}`
    : `Your ${descriptor} ${subject}s:\n${completeRows.map((row) => `- ${row.text}`).join("\n")}`;
  const directPaths = completeRows.flatMap((row) => Object.freeze([
    `/evidence/rows/${row.index}/displayedSymbol`,
    `/evidence/rows/${row.index}/direction`,
    `/evidence/rows/${row.index}/closeLocalDate`,
    `/evidence/rows/${row.index}/selectedPnlDecimal`,
  ]));
  return answerWithEvidence({
    dispatcher,
    toolCallId,
    directAnswer,
    directPaths: Object.freeze([...directPaths, "/evidence/currency"]),
  });
}

export function runCoachAiChatDeterministicFastPath(
  route: CoachAiChatDeterministicFastPathRoute,
  dispatcher: CoachAiChatFactualToolDispatcher,
): CoachAiChatDeterministicFastPathResult {
  const toolCallId = "deterministic-factual-1";
  const toolResponse = dispatcher.dispatch(toolCallId, route.request);
  if (route.routeKey === "completed_trade_performance") {
    const answer = route.completedTradePerformance?.plan.operation === "summary"
      ? partitionedResult(toolResponse.result)
      : null;
    return Object.freeze({
      routeKey: route.routeKey,
      answer: answer
        ? completedTradePerformanceSummaryAnswer(route, dispatcher, toolCallId, answer)
        : route.completedTradePerformance?.plan.operation === "rank"
          ? completedTradePerformanceRankAnswer(route, dispatcher, toolCallId, toolResponse.result)
          : (() => { throw new Error("TRADERLINK_COACH_COMPLETED_TRADE_PLAN_INVALID"); })(),
      completedTradePerformance: route.completedTradePerformance,
    });
  }
  if (route.routeKey === "performance_aggregate") {
    const response = partitionedResult(toolResponse.result);
    if (!response) throw new Error("TRADERLINK_COACH_DETERMINISTIC_RESULT_INVALID");
    return Object.freeze({
      routeKey: route.routeKey,
      answer: performanceAggregateRankAnswer(route, dispatcher, toolCallId, response),
      performanceAggregate: route.performanceAggregate,
    });
  }
  if (route.routeKey === "best_trade" || route.routeKey === "worst_trade") {
    return Object.freeze({
      routeKey: route.routeKey,
      answer: individualTradeAnswer(route, dispatcher, toolCallId, toolResponse.result),
    });
  }
  const response = partitionedResult(toolResponse.result);
  if (!response) throw new Error("TRADERLINK_COACH_DETERMINISTIC_RESULT_INVALID");
  const answer = route.request.toolName === "summarize_closed_trades"
    ? summaryAnswer(route, dispatcher, toolCallId, response)
    : rankedAnswer(route, dispatcher, toolCallId, response);
  return Object.freeze({ routeKey: route.routeKey, answer });
}
