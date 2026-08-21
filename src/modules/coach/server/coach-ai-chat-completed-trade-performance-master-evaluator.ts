import type { CoachAiChatAnalysisScope } from "../contracts/ai-chat-contracts";
import type { LinksQuestionBankCase } from
  "../contracts/coach-ai-chat-question-bank-contracts";

import { linksQuestionBank } from "./coach-ai-chat-question-bank";
import {
  analyzeCoachAiChatCompletedTradePerformanceLanguage,
  type CoachAiChatCompletedTradePerformanceLanguageAnalysis,
  type CoachAiChatCompletedTradePerformancePlan,
} from "./coach-ai-chat-completed-trade-performance-language";
import {
  coachAiChatCompletedTradePerformanceBoundaryFixtures,
  coachAiChatCompletedTradePerformanceFixtures,
} from "./coach-ai-chat-completed-trade-performance-language-fixtures";
import {
  evaluateCoachAiChatCompletedTradePerformanceBoundaryFixtures,
  evaluateCoachAiChatCompletedTradePerformanceFixtures,
} from "./coach-ai-chat-completed-trade-performance-evaluator";
import {
  coachAiChatQuestionTimeScopeFixtures,
  evaluateCoachAiChatQuestionTimeScopeFixtures,
} from "./coach-ai-chat-question-time-scope-fixtures";

export const COACH_AI_CHAT_COMPLETED_TRADE_MASTER_EVALUATION_VERSION =
  "links_completed_trade_master_evaluation_v1" as const;

type MasterDisposition = "resolved" | "deferred" | "unsupported" | "ambiguous";
type FirstSliceMetric = CoachAiChatCompletedTradePerformancePlan["metric"];
type FirstSliceOperation = CoachAiChatCompletedTradePerformancePlan["operation"];

type ExpectedResolvedPlan = Readonly<{
  disposition: "resolved";
  metric: FirstSliceMetric;
  operation: FirstSliceOperation;
  rank: CoachAiChatCompletedTradePerformancePlan["rank"];
  outcomeFilter: CoachAiChatCompletedTradePerformancePlan["outcomeFilter"];
  directionFilter: CoachAiChatCompletedTradePerformancePlan["directionFilter"];
  timeScope: CoachAiChatAnalysisScope;
  handlerId: CoachAiChatCompletedTradePerformancePlan["handlerId"];
  toolName: "summarize_closed_trades" | "query_trade_explorer";
}>;

type ExpectedMasterClassification = ExpectedResolvedPlan | Readonly<{
  disposition: Exclude<MasterDisposition, "resolved">;
  reason: string;
}>;

export type CoachAiChatCompletedTradeMasterCaseEvaluation = Readonly<{
  caseId: string;
  question: string;
  expectedDisposition: MasterDisposition;
  actualParserState: CoachAiChatCompletedTradePerformanceLanguageAnalysis["state"];
  passed: boolean;
  wrongPlan: boolean;
  silentlyDroppedModifiers: readonly string[];
  componentFailures: readonly string[];
}>;

export type CoachAiChatCompletedTradeMasterEvaluationReport = Readonly<{
  version: typeof COACH_AI_CHAT_COMPLETED_TRADE_MASTER_EVALUATION_VERSION;
  providerCalls: 0;
  masterInventory: Readonly<{
    total: number;
    classified: number;
    resolvedApplicable: number;
    deferred: number;
    unsupported: number;
    ambiguous: number;
  }>;
  resolved: Readonly<{
    correct: number;
    wrongPlan: number;
    silentlyDroppedModifiers: number;
  }>;
  componentEvaluation: Readonly<{
    passed: boolean;
    resolvedFixtureCount: number;
    boundaryFixtureCount: number;
    dateFixtureCount: number;
    failures: number;
  }>;
  cases: readonly CoachAiChatCompletedTradeMasterCaseEvaluation[];
}>;

const REFERENCE_TIME = new Date("2026-08-20T16:30:00.000Z");
const DEFAULT_CONTEXT = Object.freeze({
  selectedAnalysisScope: Object.freeze({ kind: "all" as const }),
  reportingCurrency: "USD",
  timezone: "America/New_York",
  referenceTime: REFERENCE_TIME,
});

function scopeForMasterCase(item: LinksQuestionBankCase): CoachAiChatAnalysisScope | null {
  const input = item.input.toLocaleLowerCase("en-US");
  if (item.scopeKind === "follow_up") return null;
  if (item.scopeKind === "all_history") return Object.freeze({ kind: "all" as const });
  if (/\bthis year\b/u.test(input)) {
    return Object.freeze({ kind: "custom" as const, startDate: "2026-01-01", endDate: "2026-12-31" });
  }
  if (/\blast year\b/u.test(input)) {
    return Object.freeze({ kind: "custom" as const, startDate: "2025-01-01", endDate: "2025-12-31" });
  }
  const rollingDays = /\b(?:last|past) (7|30|90) days\b/u.exec(input);
  if (rollingDays) {
    const startByDays = Object.freeze({
      "7": "2026-08-14",
      "30": "2026-07-22",
      "90": "2026-05-23",
    });
    return Object.freeze({
      kind: "custom" as const,
      startDate: startByDays[rollingDays[1] as keyof typeof startByDays],
      endDate: "2026-08-20",
    });
  }
  const month = /\b(january|march|april|may) (2025|2026)\b/u.exec(input);
  if (month) {
    const monthByName = Object.freeze({ january: "01", march: "03", april: "04", may: "05" });
    return Object.freeze({
      kind: "month" as const,
      month: `${month[2]}-${monthByName[month[1] as keyof typeof monthByName]}`,
    });
  }
  const namedDay = /\b(april|march) (15|1), 2026\b/u.exec(input);
  if (namedDay) {
    const monthByName = Object.freeze({ april: "04", march: "03" });
    return Object.freeze({
      kind: "day" as const,
      date: `2026-${monthByName[namedDay[1] as keyof typeof monthByName]}-${namedDay[2].padStart(2, "0")}`,
    });
  }
  const year = /\bin (2025|2026)\b/u.exec(input);
  if (year) {
    return Object.freeze({
      kind: "custom" as const,
      startDate: `${year[1]}-01-01`,
      endDate: `${year[1]}-12-31`,
    });
  }
  throw new Error(`TRADERLINK_COACH_MASTER_SCOPE_EXPECTATION_MISSING:${item.id}`);
}

function expectedRanking(item: LinksQuestionBankCase): ExpectedResolvedPlan {
  const question = item.input.toLocaleLowerCase("en-US");
  const rank = /\b(?:top|worst) (?:3|three)\b/u.test(question)
    ? Object.freeze({
        direction: /\bworst\b/u.test(question) ? "ascending" as const : "descending" as const,
        count: 3,
      })
    : Object.freeze({
        direction: /\b(?:worst|largest loss|largest loser)\b/u.test(question)
          ? "ascending" as const
          : "descending" as const,
        count: 1,
      });
  const outcomeFilter = /\b(?:winning|winner)\b/u.test(question)
    ? "win" as const
    : /\b(?:loss|losses|loser)\b/u.test(question)
      ? "loss" as const
      : null;
  const directionFilter = /\blong trade\b/u.test(question)
    ? "long" as const
    : /\bshort trade\b/u.test(question)
      ? "short" as const
      : null;
  const timeScope = scopeForMasterCase(item) ?? DEFAULT_CONTEXT.selectedAnalysisScope;
  return Object.freeze({
    disposition: "resolved",
    metric: "net_pnl_rank",
    operation: "rank",
    rank,
    outcomeFilter,
    directionFilter,
    timeScope,
    handlerId: "completed_trade_rank_v1",
    toolName: "query_trade_explorer",
  });
}

function expectedSummary(
  item: LinksQuestionBankCase,
  metric: Extract<FirstSliceMetric, "net_pnl" | "total_trades" | "win_count" | "loss_count">,
): ExpectedResolvedPlan {
  const timeScope = scopeForMasterCase(item);
  if (!timeScope) throw new Error(`TRADERLINK_COACH_MASTER_SUMMARY_SCOPE_MISSING:${item.id}`);
  return Object.freeze({
    disposition: "resolved",
    metric,
    operation: "summary",
    rank: null,
    outcomeFilter: null,
    directionFilter: null,
    timeScope,
    handlerId: "completed_trade_summary_v1",
    toolName: "summarize_closed_trades",
  });
}

/**
 * This is deliberately an oracle over the independently maintained master
 * bank, not a call into the planner. It tells the first-slice report whether a
 * case belongs here today or remains visible as a deferred future obligation.
 */
export function classifyCoachAiChatCompletedTradeMasterCase(
  item: LinksQuestionBankCase,
): ExpectedMasterClassification {
  if (item.family === "rankings") return expectedRanking(item);
  if (item.id === "links-core-explorer-worst-follow-up") return expectedRanking(item);
  if (/^links-performance-net-pnl-/u.test(item.id)) return expectedSummary(item, "net_pnl");
  if (/^links-performance-trade-count-/u.test(item.id)) return expectedSummary(item, "total_trades");
  if (/^links-performance-winning-count-/u.test(item.id)) return expectedSummary(item, "win_count");
  if (/^links-performance-losing-count-/u.test(item.id)) return expectedSummary(item, "loss_count");
  const coreMetrics = Object.freeze({
    "links-core-march-trade-count": "total_trades",
    "links-core-march-pnl": "net_pnl",
    "links-core-march-gross-loss": "net_pnl",
    "links-core-march-gross-profit": "net_pnl",
  } as const);
  const coreMetric = coreMetrics[item.id as keyof typeof coreMetrics];
  if (coreMetric) return expectedSummary(item, coreMetric);
  return Object.freeze({
    disposition: "deferred",
    reason: "outside_completed_trade_performance_first_slice",
  });
}

function equal(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function actualToolName(plan: CoachAiChatCompletedTradePerformancePlan | null): string | null {
  return plan?.request.toolName ?? null;
}

function expectedRequestFilters(expected: ExpectedResolvedPlan): Readonly<{
  outcomes: readonly string[] | null;
  directions: readonly string[] | null;
}> {
  return Object.freeze({
    outcomes: expected.outcomeFilter ? Object.freeze([expected.outcomeFilter]) : null,
    directions: expected.directionFilter ? Object.freeze([expected.directionFilter]) : null,
  });
}

function actualRequestFilters(plan: CoachAiChatCompletedTradePerformancePlan | null): Readonly<{
  outcomes: readonly string[] | null;
  directions: readonly string[] | null;
}> {
  const request = plan?.request;
  const filters = request && "filters" in request ? request.filters : undefined;
  return Object.freeze({
    outcomes: filters?.outcomes ?? null,
    directions: filters?.directions ?? null,
  });
}

function resolvedEvaluation(
  item: LinksQuestionBankCase,
  expected: ExpectedResolvedPlan,
  analysis: CoachAiChatCompletedTradePerformanceLanguageAnalysis,
): CoachAiChatCompletedTradeMasterCaseEvaluation {
  const plan = analysis.plan;
  const comparisons = Object.freeze([
    ["account_scope", "selected_account", plan?.accountScope ?? null],
    ["currency_scope", "USD", plan?.reportingCurrency ?? null],
    ["timezone", "America/New_York", plan?.timezone ?? null],
    ["reference_time", REFERENCE_TIME.toISOString(), plan?.referenceTimeUtc ?? null],
    ["entity", "completed_trade", plan?.entity ?? null],
    ["metric", expected.metric, plan?.metric ?? null],
    ["operation", expected.operation, plan?.operation ?? null],
    ["rank_count", expected.rank, plan?.rank ?? null],
    ["filters", Object.freeze({ outcome: expected.outcomeFilter, direction: expected.directionFilter }),
      Object.freeze({ outcome: plan?.outcomeFilter ?? null, direction: plan?.directionFilter ?? null })],
    ["date_scope", expected.timeScope, plan?.timeScope ?? null],
    ["handler", expected.handlerId, plan?.handlerId ?? null],
    ["handler_request", Object.freeze({ toolName: expected.toolName, ...expectedRequestFilters(expected) }),
      Object.freeze({ toolName: actualToolName(plan), ...actualRequestFilters(plan) })],
  ] as const);
  const componentFailures = Object.freeze(comparisons
    .filter(([, expectedValue, actualValue]) => !equal(expectedValue, actualValue))
    .map(([component]) => component));
  const expectedModifiers = Object.freeze([
    expected.rank?.count !== 1 ? "rank_count" : null,
    expected.outcomeFilter ? "outcome" : null,
    expected.directionFilter ? "direction" : null,
    item.scopeKind !== "all_history" ? "date_scope" : null,
  ].filter((value): value is string => value !== null));
  const silentlyDroppedModifiers = Object.freeze(expectedModifiers.filter((modifier) =>
    (modifier === "rank_count" && !equal(expected.rank, plan?.rank)) ||
    (modifier === "outcome" && expected.outcomeFilter !== plan?.outcomeFilter) ||
    (modifier === "direction" && expected.directionFilter !== plan?.directionFilter) ||
    (modifier === "date_scope" && !equal(expected.timeScope, plan?.timeScope)),
  ));
  return Object.freeze({
    caseId: item.id,
    question: item.input,
    expectedDisposition: expected.disposition,
    actualParserState: analysis.state,
    passed: analysis.state === "resolved" && componentFailures.length === 0,
    wrongPlan: analysis.state !== "resolved" || componentFailures.length > 0,
    silentlyDroppedModifiers,
    componentFailures,
  });
}

function deferredEvaluation(
  item: LinksQuestionBankCase,
  expected: Exclude<ExpectedMasterClassification, ExpectedResolvedPlan>,
  analysis: CoachAiChatCompletedTradePerformanceLanguageAnalysis,
): CoachAiChatCompletedTradeMasterCaseEvaluation {
  const resolvedOutsideScope = analysis.state === "resolved";
  return Object.freeze({
    caseId: item.id,
    question: item.input,
    expectedDisposition: expected.disposition,
    actualParserState: analysis.state,
    passed: !resolvedOutsideScope,
    wrongPlan: resolvedOutsideScope,
    silentlyDroppedModifiers: Object.freeze([]),
    componentFailures: resolvedOutsideScope
      ? Object.freeze(["first_slice_scope"])
      : Object.freeze([]),
  });
}

export function evaluateCoachAiChatCompletedTradeMasterInventory(
  inventory: readonly LinksQuestionBankCase[] = linksQuestionBank,
): CoachAiChatCompletedTradeMasterEvaluationReport {
  const cases = Object.freeze(inventory.map((item) => {
    const expected = classifyCoachAiChatCompletedTradeMasterCase(item);
    const analysis = analyzeCoachAiChatCompletedTradePerformanceLanguage(item.input, DEFAULT_CONTEXT);
    return expected.disposition === "resolved"
      ? resolvedEvaluation(item, expected, analysis)
      : deferredEvaluation(item, expected, analysis);
  }));
  const expectedCounts = (disposition: MasterDisposition): number => cases.filter((item) =>
    item.expectedDisposition === disposition).length;
  const resolvedCases = cases.filter((item) => item.expectedDisposition === "resolved");
  const fixtureResults = evaluateCoachAiChatCompletedTradePerformanceFixtures(
    coachAiChatCompletedTradePerformanceFixtures,
  );
  const boundaryResults = evaluateCoachAiChatCompletedTradePerformanceBoundaryFixtures(
    coachAiChatCompletedTradePerformanceBoundaryFixtures,
  );
  const dateResults = evaluateCoachAiChatQuestionTimeScopeFixtures(
    coachAiChatQuestionTimeScopeFixtures,
  );
  const fixtureFailures = fixtureResults.filter((item) => !item.passed).length +
    boundaryResults.filter((item) => !item.passed).length +
    dateResults.filter((item) => !item.passed).length;
  return Object.freeze({
    version: COACH_AI_CHAT_COMPLETED_TRADE_MASTER_EVALUATION_VERSION,
    providerCalls: 0 as const,
    masterInventory: Object.freeze({
      total: cases.length,
      classified: cases.length,
      resolvedApplicable: expectedCounts("resolved"),
      deferred: expectedCounts("deferred"),
      unsupported: expectedCounts("unsupported"),
      ambiguous: expectedCounts("ambiguous"),
    }),
    resolved: Object.freeze({
      correct: resolvedCases.filter((item) => item.passed).length,
      wrongPlan: cases.filter((item) => item.wrongPlan).length,
      silentlyDroppedModifiers: resolvedCases.reduce((total, item) =>
        total + item.silentlyDroppedModifiers.length, 0),
    }),
    componentEvaluation: Object.freeze({
      passed: fixtureFailures === 0,
      resolvedFixtureCount: fixtureResults.length,
      boundaryFixtureCount: boundaryResults.length,
      dateFixtureCount: dateResults.length,
      failures: fixtureFailures,
    }),
    cases,
  });
}
