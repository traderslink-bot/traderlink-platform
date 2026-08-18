import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { loadEnvConfig } from "@next/env";
import type Database from "better-sqlite3";
import Decimal from "decimal.js";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import type { CoachMonthlyAiReviewInputV2 } from
  "@/src/modules/coach/contracts/monthly-ai-review-input-contracts";
import type { CoachPeriodicAiReviewInputV2 } from
  "@/src/modules/coach/contracts/weekly-ai-review-input-contracts";
import type {
  CoachMonthlyAiReviewOutputV2,
} from "@/src/modules/coach/contracts/monthly-ai-review-output-contracts";
import type {
  CoachPeriodicAiReviewOutputV2,
} from "@/src/modules/coach/contracts/weekly-ai-review-output-contracts";
import {
  assessCoachMonthlyEvidenceSufficiencyV2,
  assessCoachPeriodicEvidenceSufficiencyV2,
} from "@/src/modules/coach/server/coach-ai-review-evidence-sufficiency";
import { assembleCoachMonthlyAiReviewInputV2 } from
  "@/src/modules/coach/server/coach-monthly-ai-review-input-service";
import {
  generateCoachMonthlyAiReviewV2,
} from "@/src/modules/coach/server/coach-monthly-ai-review-openai-adapter";
import {
  calculateCoachMonthlyReviewDueTimeV2,
} from "@/src/modules/coach/server/coach-monthly-review-due-time";
import {
  generateCoachPeriodicAiReviewV2,
} from "@/src/modules/coach/server/coach-weekly-ai-review-openai-adapter";
import { CoachReflectionService } from
  "@/src/modules/coach/server/coach-reflection-service";
import { CoachWeeklyAiReviewInputService } from
  "@/src/modules/coach/server/coach-weekly-ai-review-input-service";
import { deriveDevelopmentOwnerJournalScope } from
  "@/src/modules/journal/server/accounts/journal-development-owner-scope";
import { JournalAnalyticsFactSetRepository } from
  "@/src/modules/journal/server/analytics/journal-analytics-fact-set-repository";
import { JournalAnalyticsFactSetService } from
  "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import { JournalAnnotationRepository } from
  "@/src/modules/journal/server/annotations/journal-annotation-repository";
import { JournalAnnotationService } from
  "@/src/modules/journal/server/annotations/journal-annotation-service";
import { JournalRuleRepository } from
  "@/src/modules/journal/server/annotations/journal-rule-repository";
import { JournalProductReadService } from
  "@/src/modules/journal/server/product/journal-product-read-service";
import { JournalTradingDayReviewService } from
  "@/src/modules/journal/server/reviews/journal-trading-day-review-service";
import { JournalDashboardReadModelService } from
  "@/src/modules/journal-analytics/server/journal-dashboard-read-model-service";
import {
  addExactDecimals,
  compareExactDecimals,
  percentageExactDecimals,
} from "@/src/modules/journal-analytics/server/exact-analytics-math";
import { withReadonlyPlatformDatabase } from
  "@/src/modules/platform/server/database/open-readonly-platform-database";
import { CoachUsEquitiesReviewCalendarService } from
  "@/src/modules/coach/server/market-calendar/coach-us-equities-review-calendar-service";

const CONFIRMATION = "--confirm-local-fixture-provider-calls";
const DEFAULT_MODEL_ID = "gpt-5.6-terra";
const ACCEPTED_MODEL_PRICES = Object.freeze({
  "gpt-5.6-sol": Object.freeze({ cachedInput: "0.50", cacheWriteInput: "6.25", input: "5.00", output: "30.00" }),
  "gpt-5.6-terra": Object.freeze({ cachedInput: "0.25", cacheWriteInput: "3.125", input: "2.50", output: "15.00" }),
  "gpt-5.6-luna": Object.freeze({ cachedInput: "0.02", cacheWriteInput: "0.25", input: "0.20", output: "1.20" }),
});

type AcceptedModelId = keyof typeof ACCEPTED_MODEL_PRICES;
type PeriodicGeneration = Awaited<ReturnType<typeof generateCoachPeriodicAiReviewV2>>;
type MonthlyGeneration = Awaited<ReturnType<typeof generateCoachMonthlyAiReviewV2>>;
type AcceptanceOutput = CoachPeriodicAiReviewOutputV2 | CoachMonthlyAiReviewOutputV2;

type QualityAudit = Readonly<{
  providerOrSystemLeakage: readonly string[];
  prohibitedAdviceLanguage: readonly string[];
  unsupportedNumericTokens: readonly string[];
  missingRequiredCoverageLimitation: boolean;
  unsupportedRecurringLanguage: boolean;
}>;

type AcceptanceScenario = Readonly<{
  label: string;
  kind: "weekly" | "two_week" | "monthly";
  evidenceState: string;
  modelId: AcceptedModelId;
  input: CoachPeriodicAiReviewInputV2 | CoachMonthlyAiReviewInputV2;
  output: AcceptanceOutput;
  usage: PeriodicGeneration["usage"];
  estimatedCostUsd: string | null;
  audit: QualityAudit;
}>;

function modelIdFromArguments(arguments_: readonly string[]): AcceptedModelId {
  if (arguments_[0] !== CONFIRMATION) {
    throw new Error("ai_review_provider_acceptance_confirmation_required");
  }
  const value = arguments_.find((argument) => argument.startsWith("--model="))
    ?.slice("--model=".length) ?? DEFAULT_MODEL_ID;
  if (!(value in ACCEPTED_MODEL_PRICES)) {
    throw new Error("ai_review_provider_acceptance_model_not_allowed");
  }
  return value as AcceptedModelId;
}

function periodicRequest(
  calendar: CoachUsEquitiesReviewCalendarService,
  cadence: "weekly" | "two_week",
  mondays: readonly string[],
): Parameters<CoachWeeklyAiReviewInputService["readPeriodicV2"]>[1] {
  const cohorts = Object.freeze(mondays.map((monday) => calendar.cohortStarting(monday)));
  const first = cohorts[0];
  const last = cohorts.at(-1);
  if (!first || !last) throw new Error("ai_review_provider_acceptance_period_missing");
  const metadata = calendar.metadataForRange(first.mondayDate, last.fridayDate);
  return Object.freeze({
    calendar,
    reflectionEligibilityStartDate: first.mondayDate,
    period: Object.freeze({
      cadence,
      startDate: first.mondayDate,
      endDate: last.fridayDate,
      calendarTimezone: "America/New_York" as const,
      calendarId: metadata.calendarId,
      calendarEvidenceDigestSha256: metadata.evidenceDigestSha256,
      cohorts,
    }),
  });
}

function periodicInput(
  database: Database.Database,
  scope: WorkspaceAccessScope,
  calendar: CoachUsEquitiesReviewCalendarService,
  cadence: "weekly" | "two_week",
  mondays: readonly string[],
): CoachPeriodicAiReviewInputV2 {
  const annotations = new JournalAnnotationService(
    new JournalAnnotationRepository(database),
    new JournalRuleRepository(database),
  );
  const reflections = new CoachReflectionService(
    new JournalDashboardReadModelService(
      new JournalAnalyticsFactSetService(new JournalAnalyticsFactSetRepository(database)),
    ),
    annotations,
    new JournalProductReadService(database),
  );
  return new CoachWeeklyAiReviewInputService(
    reflections,
    annotations,
    new JournalTradingDayReviewService(database),
    calendar,
  ).readPeriodicV2(scope, periodicRequest(calendar, cadence, mondays));
}

function monthlyInput(
  weeklyInputs: readonly CoachPeriodicAiReviewInputV2[],
  due: Extract<ReturnType<typeof calculateCoachMonthlyReviewDueTimeV2>, { state: "due" }>,
  calendar: CoachUsEquitiesReviewCalendarService,
): CoachMonthlyAiReviewInputV2 {
  const inMonth = (date: string) => date >= due.period.coverageStartDate &&
    date <= due.period.coverageEndDate;
  const factDays = weeklyInputs.flatMap((input) =>
    input.reviewPeriodMarketFacts.days.filter((day) => inMonth(day.reviewMarketDate)));
  const reflectionCoverage = weeklyInputs.flatMap((input) =>
    input.reflectionCoverage.filter((coverage) => inMonth(coverage.reviewMarketDate)));
  const rawReflectionContext = weeklyInputs.flatMap((input) => [
    ...input.completedDailyReflections,
    ...(input.savedDailyReflections ?? []),
  ].filter((reflection) => inMonth(reflection.reviewMarketDate)).map((reflection) =>
    Object.freeze({
      reflection,
      sourcePeriodStartDate: input.period.startDate,
      sourcePeriodEndDate: input.period.endDate,
      narrativeOwnerMonth: input.period.endDate.slice(0, 7),
      contextKind: "current_month_raw" as const,
      statisticalUse: "prohibited" as const,
    })));
  const focuses = new Map(weeklyInputs.flatMap((input) =>
    input.currentFocuses.map((focus) =>
      [`${focus.tradingDate}:${focus.revisionNumber}`, focus] as const)));
  const coverage = weeklyInputs.at(-1)?.reviewPeriodMarketFacts;
  return assembleCoachMonthlyAiReviewInputV2({
    calendar,
    calendarMonth: Object.freeze({
      ...due.period,
      calendarTimezone: due.period.timezone,
      currency: weeklyInputs[0]?.period.currency ?? null,
      scheduledAtUtc: due.scheduledAtUtc,
    }),
    calendarMonthFactDays: factDays,
    accountCoverage: Object.freeze({
      legitimateOpenCount: coverage?.accountLegitimateOpenCount ?? 0,
      needsDecisionCount: coverage?.accountNeedsDecisionCount ?? 0,
      pendingDataDecisionCount: coverage?.accountPendingDataDecisionCount ?? 0,
    }),
    reviewNarrativeContext: Object.freeze([]),
    rawReflectionContext: Object.freeze(rawReflectionContext),
    reflectionCoverage: Object.freeze(reflectionCoverage),
    priorMonthlyReview: null,
    currentFocuses: Object.freeze([...focuses.values()]),
  });
}

function twoWeekInput(
  weekOne: CoachPeriodicAiReviewInputV2,
  weekTwo: CoachPeriodicAiReviewInputV2,
  calendar: CoachUsEquitiesReviewCalendarService,
): CoachPeriodicAiReviewInputV2 {
  const period = periodicRequest(calendar, "two_week", ["2026-07-20", "2026-07-27"])
    .period;
  const days = Object.freeze([
    ...weekOne.reviewPeriodMarketFacts.days,
    ...weekTwo.reviewPeriodMarketFacts.days,
  ]);
  const trades = days.flatMap((day) => day.trades);
  const pnlValues = trades.map((trade) => trade.netPnlDecimal);
  const netPnlDecimal = pnlValues.length === 0 || pnlValues.some((value) => value === null)
    ? null
    : pnlValues.reduce<string>((sum, value) => addExactDecimals(sum, value!), "0");
  const eligibleOutcomes = pnlValues.filter((value): value is string => value !== null);
  const wins = eligibleOutcomes.filter((value) => compareExactDecimals(value, "0") > 0).length;
  const focuses = new Map([
    ...weekOne.currentFocuses,
    ...weekTwo.currentFocuses,
  ].map((focus) => [`${focus.tradingDate}:${focus.revisionNumber}`, focus] as const));
  const limitationReasonCodes = Object.freeze([...new Set([
    ...weekOne.coverageNotice.limitationReasonCodes,
    ...weekTwo.coverageNotice.limitationReasonCodes,
  ])].sort());
  return Object.freeze({
    ...weekOne,
    period: Object.freeze({
      ...period,
      currency: weekOne.period.currency,
    }),
    reviewPeriodMarketFacts: Object.freeze({
      tradingDayCount: days.filter((day) => day.readyClosedTradeCount > 0).length,
      readyClosedTradeCount: trades.length,
      netPnlDecimal,
      winRatePercentDecimal: eligibleOutcomes.length === 0
        ? null
        : percentageExactDecimals(String(wins), String(eligibleOutcomes.length)).roundedDecimal,
      accountLegitimateOpenCount: weekTwo.reviewPeriodMarketFacts.accountLegitimateOpenCount,
      accountNeedsDecisionCount: weekTwo.reviewPeriodMarketFacts.accountNeedsDecisionCount,
      accountPendingDataDecisionCount:
        weekTwo.reviewPeriodMarketFacts.accountPendingDataDecisionCount,
      days,
    }),
    completedDailyReflections: Object.freeze([
      ...weekOne.completedDailyReflections,
      ...weekTwo.completedDailyReflections,
    ]),
    savedDailyReflections: Object.freeze([
      ...(weekOne.savedDailyReflections ?? []),
      ...(weekTwo.savedDailyReflections ?? []),
    ]),
    reflectionCoverage: Object.freeze([
      ...weekOne.reflectionCoverage,
      ...weekTwo.reflectionCoverage,
    ]),
    carryForwardEvidenceBundles: Object.freeze([]),
    priorIssuedReview: null,
    currentFocuses: Object.freeze([...focuses.values()]),
    coverageNotice: Object.freeze({
      limitationReasonCodes,
      incompleteRecordRequired: limitationReasonCodes.length > 0,
    }),
  });
}

function assertFixtureOnly(input: CoachPeriodicAiReviewInputV2 | CoachMonthlyAiReviewInputV2): void {
  const days = "reviewPeriodMarketFacts" in input
    ? input.reviewPeriodMarketFacts.days
    : input.calendarMonthFacts.days;
  const tickers = days.flatMap((day) => day.trades.map((trade) => trade.ticker));
  if (tickers.length < 1 || tickers.some((ticker) => !/^AIR\d+$/u.test(ticker))) {
    throw new Error("ai_review_provider_acceptance_non_fixture_evidence");
  }
}

function noRuleCounts(): Readonly<{ followed: 0; broken: 0; notReviewed: 0 }> {
  return Object.freeze({ followed: 0, broken: 0, notReviewed: 0 });
}

function executionOnly(input: CoachPeriodicAiReviewInputV2): CoachPeriodicAiReviewInputV2 {
  return Object.freeze({
    ...input,
    reviewPeriodMarketFacts: Object.freeze({
      ...input.reviewPeriodMarketFacts,
      days: Object.freeze(input.reviewPeriodMarketFacts.days.map((day) => Object.freeze({
        ...day,
        ruleReviews: noRuleCounts(),
        trades: Object.freeze(day.trades.map((trade) => Object.freeze({
          ...trade,
          ruleReviews: noRuleCounts(),
          tags: Object.freeze([]),
        }))),
      }))),
    }),
    completedDailyReflections: Object.freeze([]),
    savedDailyReflections: Object.freeze([]),
    reflectionCoverage: Object.freeze(input.reflectionCoverage.map((coverage) => Object.freeze({
      ...coverage,
      reflectionState: coverage.marketSessionState === "closed"
        ? "market_closed" as const
        : "not_created" as const,
      noTradeReview: null,
    }))),
    currentFocuses: Object.freeze([]),
    coverageNotice: Object.freeze({
      limitationReasonCodes: Object.freeze(["acceptance_execution_only"]),
      incompleteRecordRequired: true,
    }),
  });
}

function executionOnlyMonthly(input: CoachMonthlyAiReviewInputV2): CoachMonthlyAiReviewInputV2 {
  return Object.freeze({
    ...input,
    calendarMonthFacts: Object.freeze({
      ...input.calendarMonthFacts,
      days: Object.freeze(input.calendarMonthFacts.days.map((day) => Object.freeze({
        ...day,
        ruleReviews: noRuleCounts(),
        trades: Object.freeze(day.trades.map((trade) => Object.freeze({
          ...trade,
          ruleReviews: noRuleCounts(),
          tags: Object.freeze([]),
        }))),
      }))),
    }),
    reviewNarrativeContext: Object.freeze([]),
    rawReflectionContext: Object.freeze([]),
    reflectionCoverage: Object.freeze(input.reflectionCoverage.map((coverage) => Object.freeze({
      ...coverage,
      reflectionState: coverage.marketSessionState === "closed"
        ? "market_closed" as const
        : "not_created" as const,
      noTradeReview: null,
    }))),
    currentFocuses: Object.freeze([]),
    coverageNotice: Object.freeze({
      limitationReasonCodes: Object.freeze(["acceptance_execution_only"]),
      incompleteRecordRequired: true,
    }),
  });
}

function thinSingleTrade(input: CoachPeriodicAiReviewInputV2): CoachPeriodicAiReviewInputV2 {
  const sourceDay = input.reviewPeriodMarketFacts.days.find((day) => day.trades.length > 0);
  const sourceTrade = sourceDay?.trades[0];
  if (!sourceDay || !sourceTrade) {
    throw new Error("ai_review_provider_acceptance_single_trade_missing");
  }
  const pnl = sourceTrade.netPnlDecimal ?? sourceTrade.realizedGrossPnlDecimal;
  const winRate = pnl === null ? null : new Decimal(pnl).greaterThan(0) ? "100" : "0";
  const day = Object.freeze({
    ...sourceDay,
    readyClosedTradeCount: 1,
    netPnlDecimal: pnl,
    ruleReviews: noRuleCounts(),
    trades: Object.freeze([Object.freeze({
      ...sourceTrade,
      ruleReviews: noRuleCounts(),
      tags: Object.freeze([]),
    })]),
  });
  return Object.freeze({
    ...input,
    reviewPeriodMarketFacts: Object.freeze({
      ...input.reviewPeriodMarketFacts,
      tradingDayCount: 1,
      readyClosedTradeCount: 1,
      netPnlDecimal: pnl,
      winRatePercentDecimal: winRate,
      days: Object.freeze([day]),
    }),
    completedDailyReflections: Object.freeze([]),
    savedDailyReflections: Object.freeze([]),
    reflectionCoverage: Object.freeze([Object.freeze({
      reviewMarketDate: day.reviewMarketDate,
      marketSessionState: "open" as const,
      reflectionState: "not_created" as const,
      noTradeReview: null,
    })]),
    carryForwardEvidenceBundles: Object.freeze([]),
    priorIssuedReview: null,
    currentFocuses: Object.freeze([]),
    coverageNotice: Object.freeze({
      limitationReasonCodes: Object.freeze(["acceptance_context_free_single_trade"]),
      incompleteRecordRequired: true,
    }),
  });
}

function priorContext(
  input: CoachPeriodicAiReviewInputV2,
  output: CoachPeriodicAiReviewOutputV2,
): CoachPeriodicAiReviewInputV2["priorIssuedReview"] {
  return Object.freeze({
    reviewRef: "acceptance_fixture_week_one",
    cadence: input.period.cadence,
    periodStartDate: input.period.startDate,
    periodEndDate: input.period.endDate,
    reviewSummary: output.reviewSummary,
    whatImproved: output.whatImproved,
    whatHeldYouBack: output.whatHeldYouBack,
    focusFollowThrough: output.focusFollowThrough,
    nextPeriodFocuses: Object.freeze([...output.nextPeriodFocuses]),
    incompleteRecord: output.incompleteRecord,
    representedEvidenceRefs: Object.freeze([
      ...input.completedDailyReflections,
      ...(input.savedDailyReflections ?? []),
    ].map((reflection) => reflection.evidenceRef)),
  });
}

function outputText(output: AcceptanceOutput): string {
  return [
    output.reviewSummary,
    output.whatImproved,
    output.whatHeldYouBack,
    output.focusFollowThrough,
    ...output.nextPeriodFocuses,
    output.incompleteRecord ?? "",
  ].join("\n");
}

function matches(text: string, pattern: RegExp): readonly string[] {
  return Object.freeze([...new Set(text.match(pattern) ?? [])].sort());
}

function numericTokens(value: unknown): ReadonlySet<string> {
  const serialized = JSON.stringify(value).replaceAll("-$", "-");
  const tokens = new Set((serialized.match(/-?\d+(?:\.\d+)?%?/gu) ?? []).map((token) =>
    new Decimal(token.replace("%", "")).toString()));
  for (const date of serialized.match(/\d{4}-\d{2}-\d{2}/gu) ?? []) {
    for (const part of date.split("-")) tokens.add(new Decimal(part).toString());
  }
  return tokens;
}

function auditOutput(
  input: CoachPeriodicAiReviewInputV2 | CoachMonthlyAiReviewInputV2,
  output: AcceptanceOutput,
  substantiveReflectionCount: number,
): QualityAudit {
  const text = outputText(output);
  const allowedNumbers = numericTokens(input);
  const outputNumbers = numericTokens(output);
  return Object.freeze({
    providerOrSystemLeakage: matches(
      text,
      /\b(?:OpenAI|language model|prompt|token|database|data[- ]decisions?|internal system)\b/giu,
    ),
    prohibitedAdviceLanguage: Object.freeze([...new Set([
      ...matches(
        text,
        /\b(?:price target|you should buy|you should sell|guaranteed|diagnosis)\b/giu,
      ),
      ...matches(
        output.nextPeriodFocuses.join("\n"),
        /\b(?:before each entry|entry checklist|level hold|volume confirmation|stop[- ]trading|if .{0,80} missing.{0,40} pass)\b/giu,
      ),
    ])].sort()),
    unsupportedNumericTokens: Object.freeze([...outputNumbers]
      .filter((token) => !allowedNumbers.has(token)).sort()),
    missingRequiredCoverageLimitation:
      input.coverageNotice.incompleteRecordRequired && !output.incompleteRecord,
    unsupportedRecurringLanguage:
      substantiveReflectionCount < 2 &&
      /\b(?:recurring|consistently|behavioral pattern|process pattern)\b/iu.test(text),
  });
}

function estimatedCost(
  modelId: AcceptedModelId,
  usage: PeriodicGeneration["usage"],
): string | null {
  const cachedInputTokens = usage.cachedInputTokens;
  const cacheWriteInputTokens = usage.cacheWriteInputTokens;
  if (cachedInputTokens === null || cachedInputTokens === undefined ||
      cacheWriteInputTokens === null || cacheWriteInputTokens === undefined ||
      usage.inputTokens === null || usage.outputTokens === null ||
      cachedInputTokens + cacheWriteInputTokens > usage.inputTokens) return null;
  const prices = ACCEPTED_MODEL_PRICES[modelId];
  return new Decimal(usage.inputTokens - cachedInputTokens - cacheWriteInputTokens)
    .mul(prices.input)
    .plus(new Decimal(cachedInputTokens).mul(prices.cachedInput))
    .plus(new Decimal(cacheWriteInputTokens).mul(prices.cacheWriteInput))
    .plus(new Decimal(usage.outputTokens).mul(prices.output))
    .div(1_000_000).toDecimalPlaces(8).toFixed(8);
}

function substantiveReflectionCount(
  input: CoachPeriodicAiReviewInputV2 | CoachMonthlyAiReviewInputV2,
): number {
  if ("reviewPeriodMarketFacts" in input) {
    return [...input.completedDailyReflections, ...(input.savedDailyReflections ?? [])]
      .filter((reflection) => Boolean(reflection.dailyNotes) || reflection.tradeNotes.length > 0)
      .length;
  }
  return input.rawReflectionContext.filter((context) =>
    Boolean(context.reflection.dailyNotes) || context.reflection.tradeNotes.length > 0).length;
}

async function periodicScenario(
  label: string,
  evidenceState: string,
  input: CoachPeriodicAiReviewInputV2,
  modelId: AcceptedModelId,
): Promise<AcceptanceScenario> {
  assertFixtureOnly(input);
  const assessment = assessCoachPeriodicEvidenceSufficiencyV2(input);
  if (!assessment.sufficient) throw new Error(`ai_review_provider_acceptance_${label}_insufficient`);
  const generation = await generateCoachPeriodicAiReviewV2(input, { modelId });
  return Object.freeze({
    label,
    kind: input.period.cadence,
    evidenceState,
    modelId,
    input,
    output: generation.output,
    usage: generation.usage,
    estimatedCostUsd: estimatedCost(modelId, generation.usage),
    audit: auditOutput(input, generation.output, substantiveReflectionCount(input)),
  });
}

async function monthlyScenario(
  label: string,
  input: CoachMonthlyAiReviewInputV2,
  modelId: AcceptedModelId,
): Promise<AcceptanceScenario> {
  assertFixtureOnly(input);
  const assessment = assessCoachMonthlyEvidenceSufficiencyV2(input);
  if (!assessment.sufficient) throw new Error(`ai_review_provider_acceptance_${label}_insufficient`);
  const generation: MonthlyGeneration = await generateCoachMonthlyAiReviewV2(input, { modelId });
  return Object.freeze({
    label,
    kind: "monthly",
    evidenceState: "exact_month_with_saved_reflections",
    modelId,
    input,
    output: generation.output,
    usage: generation.usage,
    estimatedCostUsd: estimatedCost(modelId, generation.usage),
    audit: auditOutput(input, generation.output, substantiveReflectionCount(input)),
  });
}

function hasAuditFailure(audit: QualityAudit): boolean {
  return audit.providerOrSystemLeakage.length > 0 ||
    audit.prohibitedAdviceLanguage.length > 0 ||
    audit.unsupportedNumericTokens.length > 0 ||
    audit.missingRequiredCoverageLimitation || audit.unsupportedRecurringLanguage;
}

async function main(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  const modelId = modelIdFromArguments(arguments_);
  const prepareOnly = arguments_.includes("--prepare-only");
  loadEnvConfig(process.cwd(), true);
  const calendar = new CoachUsEquitiesReviewCalendarService();
  const inputs = withReadonlyPlatformDatabase({}, (database) => {
    const scope = deriveDevelopmentOwnerJournalScope(database).scope;
    const weekOne = periodicInput(database, scope, calendar, "weekly", ["2026-07-20"]);
    const weekTwo = periodicInput(database, scope, calendar, "weekly", ["2026-07-27"]);
    const twoWeek = twoWeekInput(weekOne, weekTwo, calendar);
    const monthlyDue = calculateCoachMonthlyReviewDueTimeV2({
      calendar,
      monthlyEnabledAtUtc: "2026-06-01T12:00:00.000Z",
      now: new Date("2026-08-02T16:00:00.000Z"),
    });
    if (monthlyDue.state !== "due" ||
        monthlyDue.period.calendarMonthStartDate !== "2026-07-01") {
      throw new Error("ai_review_provider_acceptance_month_not_due");
    }
    const partialMonthlyDue = Object.freeze({
      ...monthlyDue,
      period: Object.freeze({
        ...monthlyDue.period,
        coverageStartDate: "2026-07-20",
        periodCoverage: "partial_month" as const,
      }),
    });
    const monthly = monthlyInput([weekOne, weekTwo], partialMonthlyDue, calendar);
    return Object.freeze({ weekOne, weekTwo, twoWeek, monthly });
  });

  const thin = thinSingleTrade(inputs.weekOne);
  const thinAssessment = assessCoachPeriodicEvidenceSufficiencyV2(thin);
  if (thinAssessment.sufficient || thinAssessment.reason !== "context_free_single_trade") {
    throw new Error("ai_review_provider_acceptance_thin_gate_failed");
  }
  for (const input of [inputs.weekOne, inputs.weekTwo, inputs.twoWeek, inputs.monthly]) {
    assertFixtureOnly(input);
  }
  if (prepareOnly) {
    process.stdout.write(`${JSON.stringify({
      status: "prepared",
      modelId,
      fixtureOnly: true,
      providerCallCount: 0,
      thinSingleTradeProviderCallMade: false,
      scenariosReady: 6,
    })}\n`);
    return;
  }

  const scenarios: AcceptanceScenario[] = [];
  scenarios.push(await periodicScenario(
    "execution_only_week",
    "verified_executions_without_reflections_tags_or_reviewed_rules",
    executionOnly(inputs.weekOne),
    modelId,
  ));
  const weekOne = await periodicScenario(
    "note_rich_week_one",
    "completed_reflections",
    inputs.weekOne,
    modelId,
  );
  scenarios.push(weekOne);
  scenarios.push(await periodicScenario(
    "week_two_with_prior_review",
    "completed_and_incomplete_saved_reflections_with_prior_review",
    Object.freeze({
      ...inputs.weekTwo,
      priorIssuedReview: priorContext(inputs.weekOne, weekOne.output as CoachPeriodicAiReviewOutputV2),
    }),
    modelId,
  ));
  scenarios.push(await periodicScenario(
    "two_week_review",
    "two_complete_market_cohorts",
    inputs.twoWeek,
    modelId,
  ));
  scenarios.push(await monthlyScenario("exact_calendar_month", inputs.monthly, modelId));
  scenarios.push(await monthlyScenario(
    "execution_only_exact_calendar_month",
    executionOnlyMonthly(inputs.monthly),
    modelId,
  ));

  const completedAtUtc = new Date().toISOString();
  const artifactName = `ai-review-provider-acceptance-${completedAtUtc
    .replaceAll(":", "-")}.json`;
  writeFileSync(join(process.cwd(), ".local-logs", artifactName), `${JSON.stringify({
    contractVersion: "traderlink_ai_review_provider_acceptance_v1",
    completedAtUtc,
    fixtureOnly: true,
    persistedReviewCount: 0,
    providerCallCount: scenarios.length,
    thinSingleTrade: Object.freeze({
      providerCallMade: false,
      assessment: thinAssessment,
    }),
    scenarios,
  }, null, 2)}\n`, { encoding: "utf8", flag: "wx" });

  const totalCost = scenarios.reduce(
    (sum, scenario) => scenario.estimatedCostUsd === null
      ? sum
      : sum.plus(scenario.estimatedCostUsd),
    new Decimal(0),
  ).toFixed(8);
  process.stdout.write(`${JSON.stringify({
    status: scenarios.some((scenario) => hasAuditFailure(scenario.audit))
      ? "manual_review_required"
      : "automated_checks_passed",
    modelId,
    providerCallCount: scenarios.length,
    thinSingleTradeProviderCallMade: false,
    estimatedTotalCostUsd: totalCost,
    artifactName,
    scenarios: scenarios.map((scenario) => Object.freeze({
      label: scenario.label,
      usage: scenario.usage,
      estimatedCostUsd: scenario.estimatedCostUsd,
      audit: scenario.audit,
    })),
  })}\n`);
}

void main().catch((error: unknown) => {
  process.stderr.write(`${JSON.stringify({
    status: "failed",
    code: error instanceof Error ? error.message : "unknown_failure",
  })}\n`);
  process.exitCode = 1;
});
