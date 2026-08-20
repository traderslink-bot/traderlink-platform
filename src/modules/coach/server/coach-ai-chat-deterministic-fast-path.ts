import {
  COACH_AI_CHAT_ANSWER_CONTRACT_VERSION,
  type CoachAiChatAnswer,
} from "../contracts/ai-chat-contracts";
import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  type CoachAiChatFactualToolMetricId,
  type CoachAiChatFactualToolRequest,
} from "../contracts/coach-ai-chat-factual-tool-contracts";
import type { CoachAiChatAnalysisScope } from "../contracts/ai-chat-contracts";
import type {
  JournalAnalyticsGroupResult,
  JournalAnalyticsMetricResult,
  JournalAnalyticsPartitionedResponse,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import {
  formatJournalAnalyticsMetric,
  formatJournalAnalyticsMoney,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";

import {
  buildCoachAiChatClaimCatalog,
  validateCoachAiChatExactFactTokens,
} from "./coach-ai-chat-claim-catalog";
import { CoachAiChatFactualToolDispatcher } from
  "./coach-ai-chat-factual-tool-dispatcher";
import { validateCoachAiChatResponseSafety } from "./coach-ai-chat-response-safety";

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
  routeKey: SummaryRouteKey | RankedRouteKey;
  request: CoachAiChatFactualToolRequest;
  analysisScopeOverride?: CoachAiChatAnalysisScope;
}>;

export type CoachAiChatDeterministicFastPathResult = Readonly<{
  routeKey: CoachAiChatDeterministicFastPathRoute["routeKey"];
  answer: CoachAiChatAnswer;
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
    "whats my total trade count",
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

const MONTH_NUMBER_BY_NAME = Object.freeze({
  january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
  july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
} as const);

function monthScopeFromQuestion(question: string): CoachAiChatAnalysisScope | null {
  const match = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d{2})\b/u.exec(question);
  if (!match) return null;
  const name = match[1] as keyof typeof MONTH_NUMBER_BY_NAME;
  return Object.freeze({ kind: "month", month: `${match[2]}-${MONTH_NUMBER_BY_NAME[name]}` });
}

function datedTradeCountRoute(question: string): CoachAiChatDeterministicFastPathRoute | null {
  const scope = monthScopeFromQuestion(question);
  if (!scope || !/^how many (?:completed )?trades (?:did|have|were) i (?:do|take|taken|make)\b/u.test(question)) {
    return null;
  }
  return Object.freeze({
    routeKey: "total_trades",
    request: Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "summarize_closed_trades",
      metricIds: Object.freeze(["total_trades"]),
      moneyBasis: "net",
    }),
    analysisScopeOverride: scope,
  });
}

export function selectCoachAiChatDeterministicFastPath(
  question: string,
): CoachAiChatDeterministicFastPathRoute | null {
  const normalized = normalizeQuestion(question);
  const datedTradeCount = datedTradeCountRoute(normalized);
  if (datedTradeCount) return datedTradeCount;
  const summary = phraseRoute(normalized, SUMMARY_PHRASES);
  if (summary) {
    const moneyBasis = summary === "gross_pnl" ? "gross" : "net";
    return Object.freeze({
      routeKey: summary,
      request: Object.freeze({
        contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
        toolName: "summarize_closed_trades",
        metricIds: Object.freeze([summary]),
        moneyBasis,
      }),
    });
  }
  const ranked = phraseRoute(normalized, RANKED_PHRASES);
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
  });
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

export function runCoachAiChatDeterministicFastPath(
  route: CoachAiChatDeterministicFastPathRoute,
  dispatcher: CoachAiChatFactualToolDispatcher,
): CoachAiChatDeterministicFastPathResult {
  const toolCallId = "deterministic-factual-1";
  const toolResponse = dispatcher.dispatch(toolCallId, route.request);
  const response = partitionedResult(toolResponse.result);
  if (!response) throw new Error("TRADERLINK_COACH_DETERMINISTIC_RESULT_INVALID");
  const answer = route.request.toolName === "summarize_closed_trades"
    ? summaryAnswer(route, dispatcher, toolCallId, response)
    : rankedAnswer(route, dispatcher, toolCallId, response);
  return Object.freeze({ routeKey: route.routeKey, answer });
}
