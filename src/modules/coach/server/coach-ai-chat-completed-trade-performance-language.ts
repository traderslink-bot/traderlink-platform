import type { CoachAiChatAnalysisScope } from "../contracts/ai-chat-contracts";
import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  type CoachAiChatFactualToolMetricId,
  type CoachAiChatFactualToolRequest,
} from "../contracts/coach-ai-chat-factual-tool-contracts";
import { coachAiChatLanguageInventory } from "./coach-ai-chat-language-inventory.generated";

import {
  matchCoachAiChatQuestionAnalysisScope,
  normalizeCoachAiChatScopeQuestion,
} from "./coach-ai-chat-question-time-scope";

export const COACH_AI_CHAT_COMPLETED_TRADE_PERFORMANCE_LANGUAGE_VERSION =
  "links_completed_trade_performance_language_v1" as const;

export type CoachAiChatPerformanceLanguageComponent =
  | "account_scope"
  | "currency_scope"
  | "timezone"
  | "reference_time"
  | "entity"
  | "metric"
  | "operation"
  | "rank_count"
  | "filters"
  | "date_scope"
  | "handler";

export type CoachAiChatPerformanceLanguageComponentDiagnostic = Readonly<{
  component: CoachAiChatPerformanceLanguageComponent;
  state: "passed" | "not_applicable" | "failed";
  value: string | null;
}>;

type CompletedTradePerformanceMetric = Extract<CoachAiChatFactualToolMetricId,
  "net_pnl" | "gross_profit" | "gross_loss" | "gross_pnl" |
  "total_trades" | "win_count" | "loss_count" | "win_rate" | "loss_rate" |
  "profit_factor" | "expectancy" | "average_pnl" | "average_gross_pnl" |
  "average_winning_trade" | "average_losing_trade">;

export type CoachAiChatCompletedTradePerformancePlan = Readonly<{
  planVersion: typeof COACH_AI_CHAT_COMPLETED_TRADE_PERFORMANCE_LANGUAGE_VERSION;
  resolutionSource: "deterministic";
  accountScope: "selected_account";
  reportingCurrency: string | null;
  timezone: string;
  referenceTimeUtc: string;
  entity: "completed_trade";
  metric: CompletedTradePerformanceMetric | "net_pnl_rank";
  operation: "summary" | "rank";
  rank: Readonly<{
    direction: "ascending" | "descending";
    count: number;
  }> | null;
  outcomeFilter: "win" | "loss" | null;
  directionFilter: "long" | "short" | null;
  timeScope: CoachAiChatAnalysisScope;
  timeScopeSource: "question" | "selected_scope";
  handlerId: "completed_trade_summary_v1" | "completed_trade_rank_v1";
  request: CoachAiChatFactualToolRequest;
}>;

export type CoachAiChatCompletedTradePerformanceLanguageAnalysis = Readonly<{
  state: "resolved" | "unresolved" | "not_applicable";
  diagnostics: readonly CoachAiChatPerformanceLanguageComponentDiagnostic[];
  plan: CoachAiChatCompletedTradePerformancePlan | null;
  reason: string | null;
}>;

export type CoachAiChatCompletedTradePerformanceLanguageContext = Readonly<{
  selectedAnalysisScope: CoachAiChatAnalysisScope;
  reportingCurrency: string | null;
  timezone: string;
  referenceTime: Date;
}>;

const NUMBER_WORDS = Object.freeze({
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
} as const);

const FIRST_SLICE_LANGUAGE_CANONICAL_NAMES = Object.freeze([
  "net_pnl",
  "trade_count",
  "winning_trades",
  "losing_trades",
  "closed_trades",
  "month",
  "year",
  "best_ambiguity",
] as const);

const availableLanguageCanonicalNames = new Set(
  coachAiChatLanguageInventory.map((entry) => entry.canonicalName),
);
for (const canonicalName of FIRST_SLICE_LANGUAGE_CANONICAL_NAMES) {
  if (!availableLanguageCanonicalNames.has(canonicalName)) {
    throw new Error(`TRADERLINK_COACH_LANGUAGE_INVENTORY_MISSING:${canonicalName}`);
  }
}

function diagnostic(
  component: CoachAiChatPerformanceLanguageComponent,
  state: CoachAiChatPerformanceLanguageComponentDiagnostic["state"],
  value: string | null = null,
): CoachAiChatPerformanceLanguageComponentDiagnostic {
  return Object.freeze({ component, state, value });
}

function normalizedQuestion(value: string): string {
  return normalizeCoachAiChatScopeQuestion(value)
    .replace(/\bp\s*\/?\s*l\b/gu, "pnl")
    .replace(/\s+/gu, " ")
    .trim();
}

function rankCount(question: string): Readonly<{
  state: "absent" | "resolved" | "invalid";
  value: number | null;
}> {
  const numberPattern = "(\\d{1,4}|zero|one|two|three|four|five|six|seven|eight|nine|ten)";
  const value = new RegExp(
    `\\b(?:top|bottom|best|worst|highest|lowest)\\s+${numberPattern}\\b|` +
    `\\b${numberPattern}\\s+(?:top|bottom|best|worst|highest|lowest)\\b`,
    "u",
  ).exec(question)?.slice(1).find((candidate) => typeof candidate === "string");
  if (!value) return Object.freeze({ state: "absent", value: null });
  const parsed = /^\d+$/u.test(value)
    ? Number(value)
    : NUMBER_WORDS[value as keyof typeof NUMBER_WORDS];
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 50
    ? Object.freeze({ state: "resolved", value: parsed })
    : Object.freeze({ state: "invalid", value: null });
}

function rankOutcome(question: string): "win" | "loss" | null {
  if (/\b(?:loss|losses|loser|losers|losing|red|negative)\b/u.test(question)) return "loss";
  if (/\b(?:win|wins|winner|winners|winning|green|positive)\b/u.test(question)) return "win";
  return null;
}

function rankDirection(question: string): "long" | "short" | "ambiguous" | null {
  const long = /\blong\s+(?:trad(?:e|es)?|trad|winner|winners|loser|losers|loss|losses)\b/u
    .test(question);
  const short = /\bshort\s+(?:trad(?:e|es)?|trad|winner|winners|loser|losers|loss|losses)\b/u
    .test(question);
  if (long && short) return "ambiguous";
  if (long) return "long";
  if (short) return "short";
  return null;
}

function hasRankLanguage(question: string): boolean {
  return /\b(?:best|worst|top|bottom|highest|lowest|biggest|largest|most profitable|least profitable)\b/u
    .test(question);
}

function hasCompletedTradeRankSubject(question: string): boolean {
  return /\b(?:trad(?:e|es)?|trad|winner|winners|loser|losers|loss|losses)\b/u.test(question);
}

function summaryMetric(question: string): CompletedTradePerformanceMetric | null {
  if (/\bgross profit\b/u.test(question)) return "gross_profit";
  if (/\bgross loss\b/u.test(question)) return "gross_loss";
  if (/\bgross (?:pnl|profit and loss)\b/u.test(question)) return "gross_pnl";
  if (/\baverage gross\b/u.test(question)) return "average_gross_pnl";
  if (/\baverage (?:winning|winner|win) trad(?:e|es)?\b/u.test(question)) {
    return "average_winning_trade";
  }
  if (/\baverage (?:losing|loser|loss) trad(?:e|es)?\b/u.test(question)) {
    return "average_losing_trade";
  }
  if (/\bwin rate\b/u.test(question)) return "win_rate";
  if (/\bloss rate\b/u.test(question)) return "loss_rate";
  if (/\bprofit factor\b/u.test(question)) return "profit_factor";
  if (/\bexpectancy\b/u.test(question)) return "expectancy";
  if (/\baverage (?:net )?(?:trad(?:e|es)?|pnl|profit and loss)\b/u.test(question)) {
    return "average_pnl";
  }
  if (/\b(?:how many|number of|count of|trade count)\b/u.test(question)) {
    if (/\b(?:win|wins|winner|winners|winning|green|positive)\b/u.test(question)) {
      return "win_count";
    }
    if (/\b(?:loss|losses|loser|losers|losing|red|negative)\b/u.test(question)) {
      return "loss_count";
    }
    if (/\b(?:trad(?:e|es)?|trad)\b/u.test(question)) return "total_trades";
  }
  if (/\b(?:pnl|profit and loss|net profit|net loss|profit|loss|gain|gains|made|make|lost|lose)\b/u
      .test(question)) {
    return "net_pnl";
  }
  if (/\b(?:long|short) trades? perform\b/u.test(question)) return "net_pnl";
  return null;
}

function summaryMoneyBasis(metric: CompletedTradePerformanceMetric): "gross" | "net" {
  return metric === "gross_profit" || metric === "gross_loss" || metric === "gross_pnl" ||
    metric === "average_gross_pnl"
    ? "gross"
    : "net";
}

function summaryDirection(question: string): "long" | "short" | "ambiguous" | null {
  const long = /\blong trad(?:e|es)?\b/u.test(question);
  const short = /\bshort trad(?:e|es)?\b/u.test(question);
  if (long && short) return "ambiguous";
  if (long) return "long";
  if (short) return "short";
  return null;
}

function looksLikeCompletedTradePerformanceQuestion(question: string): boolean {
  if (!/\b(?:my|i|ive|i have|me)\b/u.test(question)) return false;
  return /\b(?:trad(?:e|es)?|trad|pnl|profit|loss(?:es)?|gain(?:s)?|green|red|win|wins|winning|winner|winners|loser|losers|made|make|lost|lose|gross|average|expectancy|factor|rate|perform)\b/u
    .test(question);
}

/**
 * These are deliberately not folded into the completed-trade parser. The
 * earlier fast path owns certain established day/ticker answers, while the
 * remaining entities require later compositional handlers. Without this guard,
 * “most profitable day” could be incorrectly answered as all-trade net P/L.
 */
function namesDeferredPerformanceEntity(question: string): boolean {
  return /\b(?:ticker|tickers|symbol|symbols|session|sessions|weekday|weekdays|time of day|hour|hours|setup|setups|tag|tags|rule|rules)\b/u
    .test(question);
}

function namesDeferredCompletedTradeView(question: string): boolean {
  return /\b(?:green to red|trade (?:explorer|exploer))\b/u.test(question);
}

function namesUnscopedTradingDay(question: string): boolean {
  return /\b(?:day|days)\b/u.test(question);
}

function baseDiagnostics(context: CoachAiChatCompletedTradePerformanceLanguageContext):
  CoachAiChatPerformanceLanguageComponentDiagnostic[] {
  return [
    diagnostic("account_scope", "passed", "selected account"),
    diagnostic("currency_scope", "passed", context.reportingCurrency ?? "source-currency partitions"),
    diagnostic("timezone", "passed", context.timezone),
    diagnostic("reference_time", "passed", context.referenceTime.toISOString()),
  ];
}

function unresolved(
  context: CoachAiChatCompletedTradePerformanceLanguageContext,
  component: CoachAiChatPerformanceLanguageComponent,
  reason: string,
): CoachAiChatCompletedTradePerformanceLanguageAnalysis {
  return Object.freeze({
    state: "unresolved",
    diagnostics: Object.freeze([
      ...baseDiagnostics(context),
      diagnostic("entity", "passed", "completed trade performance"),
      diagnostic("metric", component === "metric" ? "failed" : "not_applicable", null),
      diagnostic("operation", component === "operation" ? "failed" : "not_applicable", null),
      diagnostic("rank_count", component === "rank_count" ? "failed" : "not_applicable", null),
      diagnostic("filters", component === "filters" ? "failed" : "not_applicable", null),
      diagnostic("date_scope", "not_applicable", null),
      diagnostic("handler", "not_applicable", null),
    ]),
    plan: null,
    reason,
  });
}

function resolvedDiagnostics(input: Readonly<{
  context: CoachAiChatCompletedTradePerformanceLanguageContext;
  metric: string;
  operation: "summary" | "rank";
  rank: Readonly<{ direction: "ascending" | "descending"; count: number }> | null;
  outcomeFilter: "win" | "loss" | null;
  directionFilter: "long" | "short" | null;
  explicitScope: boolean;
  handlerId: string;
}>): readonly CoachAiChatPerformanceLanguageComponentDiagnostic[] {
  return Object.freeze([
    ...baseDiagnostics(input.context),
    diagnostic("entity", "passed", "completed trade"),
    diagnostic("metric", "passed", input.metric),
    diagnostic("operation", "passed", input.operation),
    diagnostic("rank_count", input.rank ? "passed" : "not_applicable",
      input.rank ? `${input.rank.direction}:${input.rank.count}` : null),
    diagnostic("filters", input.outcomeFilter || input.directionFilter ? "passed" : "not_applicable",
      [input.outcomeFilter, input.directionFilter].filter((value) => value !== null).join(",") || null),
    diagnostic("date_scope", "passed", input.explicitScope ? "question calendar scope" : "selected scope"),
    diagnostic("handler", "passed", input.handlerId),
  ]);
}

/**
 * The first Links beta parser. It intentionally recognizes only completed-trade
 * P/L, outcome counts, trade counts, individual-trade rankings, and calendar
 * scope. Other language remains outside this slice rather than being guessed.
 */
export function analyzeCoachAiChatCompletedTradePerformanceLanguage(
  rawQuestion: string,
  context: CoachAiChatCompletedTradePerformanceLanguageContext,
): CoachAiChatCompletedTradePerformanceLanguageAnalysis {
  const question = normalizedQuestion(rawQuestion);
  if (!looksLikeCompletedTradePerformanceQuestion(question)) {
    return Object.freeze({
      state: "not_applicable",
      diagnostics: Object.freeze([
        ...baseDiagnostics(context),
        diagnostic("entity", "not_applicable", null),
        diagnostic("metric", "not_applicable", null),
        diagnostic("operation", "not_applicable", null),
        diagnostic("rank_count", "not_applicable", null),
        diagnostic("filters", "not_applicable", null),
        diagnostic("date_scope", "not_applicable", null),
        diagnostic("handler", "not_applicable", null),
      ]),
      plan: null,
      reason: null,
    });
  }
  const scopeMatch = matchCoachAiChatQuestionAnalysisScope(
    rawQuestion,
    context.referenceTime,
    context.timezone,
  );
  if (namesDeferredCompletedTradeView(question) ||
      namesDeferredPerformanceEntity(question) ||
      (namesUnscopedTradingDay(question) && !scopeMatch)) {
    return Object.freeze({
      state: "not_applicable",
      diagnostics: Object.freeze([
        ...baseDiagnostics(context),
        diagnostic("entity", "not_applicable", "outside completed-trade first slice"),
        diagnostic("metric", "not_applicable", null),
        diagnostic("operation", "not_applicable", null),
        diagnostic("rank_count", "not_applicable", null),
        diagnostic("filters", "not_applicable", null),
        diagnostic("date_scope", "not_applicable", null),
        diagnostic("handler", "not_applicable", null),
      ]),
      plan: null,
      reason: null,
    });
  }
  const timeScope = scopeMatch?.scope ?? context.selectedAnalysisScope;
  const timeScopeSource = scopeMatch ? "question" as const : "selected_scope" as const;
  if (hasRankLanguage(question) && hasCompletedTradeRankSubject(question)) {
    const outcomeFilter = rankOutcome(question);
    const directionFilter = rankDirection(question);
    if (directionFilter === "ambiguous") {
      return unresolved(context, "filters", "completed_trade_direction_ambiguous");
    }
    const parsedRankCount = rankCount(question);
    if (parsedRankCount.state === "invalid") {
      return unresolved(context, "rank_count", "completed_trade_rank_count_out_of_range");
    }
    const count = parsedRankCount.value ?? 1;
    const direction = /\b(?:worst|bottom|lowest|least profitable|biggest loser|loss|loser|red)\b/u
      .test(question)
      ? "ascending" as const
      : "descending" as const;
    const request: CoachAiChatFactualToolRequest = Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "query_trade_explorer",
      resultView: "trades",
      tradeSort: direction === "ascending" ? "pnl_asc" : "pnl_desc",
      pageSize: count,
      afterCursor: null,
      moneyBasis: "net",
      ...(outcomeFilter || directionFilter
        ? { filters: Object.freeze({
            ...(outcomeFilter ? { outcomes: Object.freeze([outcomeFilter]) } : {}),
            ...(directionFilter ? { directions: Object.freeze([directionFilter]) } : {}),
          }) }
        : {}),
    });
    const handlerId = "completed_trade_rank_v1" as const;
    const plan: CoachAiChatCompletedTradePerformancePlan = Object.freeze({
      planVersion: COACH_AI_CHAT_COMPLETED_TRADE_PERFORMANCE_LANGUAGE_VERSION,
      resolutionSource: "deterministic",
      accountScope: "selected_account",
      reportingCurrency: context.reportingCurrency,
      timezone: context.timezone,
      referenceTimeUtc: context.referenceTime.toISOString(),
      entity: "completed_trade",
      metric: "net_pnl_rank",
      operation: "rank",
      rank: Object.freeze({ direction, count }),
      outcomeFilter,
      directionFilter,
      timeScope,
      timeScopeSource,
      handlerId,
      request,
    });
    return Object.freeze({
      state: "resolved",
      diagnostics: resolvedDiagnostics({ context, metric: plan.metric, operation: plan.operation,
        rank: plan.rank, outcomeFilter, directionFilter, explicitScope: scopeMatch !== null, handlerId }),
      plan,
      reason: null,
    });
  }
  const metric = summaryMetric(question);
  if (!metric) {
    return unresolved(context, "metric", "completed_trade_metric_not_in_first_slice");
  }
  const directionFilter = summaryDirection(question);
  if (directionFilter === "ambiguous") {
    return unresolved(context, "filters", "completed_trade_summary_direction_ambiguous");
  }
  const request: CoachAiChatFactualToolRequest = Object.freeze({
    contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
    toolName: "summarize_closed_trades",
    metricIds: Object.freeze([metric]),
    moneyBasis: summaryMoneyBasis(metric),
    ...(directionFilter ? { filters: Object.freeze({ directions: Object.freeze([directionFilter]) }) } : {}),
  });
  const handlerId = "completed_trade_summary_v1" as const;
  const plan: CoachAiChatCompletedTradePerformancePlan = Object.freeze({
    planVersion: COACH_AI_CHAT_COMPLETED_TRADE_PERFORMANCE_LANGUAGE_VERSION,
    resolutionSource: "deterministic",
    accountScope: "selected_account",
    reportingCurrency: context.reportingCurrency,
    timezone: context.timezone,
    referenceTimeUtc: context.referenceTime.toISOString(),
    entity: "completed_trade",
    metric,
    operation: "summary",
    rank: null,
    outcomeFilter: null,
    directionFilter,
    timeScope,
    timeScopeSource,
    handlerId,
    request,
  });
  return Object.freeze({
    state: "resolved",
    diagnostics: resolvedDiagnostics({ context, metric: plan.metric, operation: plan.operation,
    rank: null, outcomeFilter: null, directionFilter, explicitScope: scopeMatch !== null, handlerId }),
    plan,
    reason: null,
  });
}
