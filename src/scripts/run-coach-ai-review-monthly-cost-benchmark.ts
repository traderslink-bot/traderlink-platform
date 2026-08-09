import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { loadEnvConfig } from "@next/env";
import Decimal from "decimal.js";

import {
  COACH_MONTHLY_AI_REVIEW_INPUT_CONTRACT_VERSION_V2,
  type CoachMonthlyAiReviewInputV2,
} from "@/src/modules/coach/contracts/monthly-ai-review-input-contracts";
import type { CoachMonthlyAiReviewOutputV2 } from
  "@/src/modules/coach/contracts/monthly-ai-review-output-contracts";
import {
  COACH_PERIODIC_AI_REVIEW_INPUT_CONTRACT_VERSION,
  type CoachAiReviewDailyReflectionV2,
  type CoachAiReviewDayMarketFactsV2,
  type CoachAiReviewNamedRuleOutcomeV2,
  type CoachAiReviewPriorIssuedReviewV2,
  type CoachAiReviewTradeAnalysisV2,
  type CoachPeriodicAiReviewInputV2,
} from "@/src/modules/coach/contracts/weekly-ai-review-input-contracts";
import type { CoachPeriodicAiReviewOutputV2 } from
  "@/src/modules/coach/contracts/weekly-ai-review-output-contracts";
import {
  buildCoachMonthlyAiReviewProviderEnvelopeV2,
  generateCoachMonthlyAiReviewV2,
} from "@/src/modules/coach/server/coach-monthly-ai-review-openai-adapter";
import {
  buildCoachPeriodicAiReviewProviderEnvelopeV2,
  generateCoachPeriodicAiReviewV2,
} from "@/src/modules/coach/server/coach-weekly-ai-review-openai-adapter";

const CONFIRMATION = "--confirm-synthetic-monthly-cost-provider-calls";
const MODEL_ID = "gpt-5.6-luna";
const INPUT_PRICE_PER_MILLION = new Decimal("1.00");
const CACHED_INPUT_PRICE_PER_MILLION = new Decimal("0.10");
const CACHE_WRITE_INPUT_PRICE_PER_MILLION = new Decimal("1.25");
const OUTPUT_PRICE_PER_MILLION = new Decimal("6.00");
const LONG_CONTEXT_THRESHOLD = 272_000;

type ProfileName = "low" | "planning" | "heavy";
type Profile = Readonly<{
  name: ProfileName;
  tradesPerOpenDay: number;
  activeDayIndexes: readonly number[] | null;
  dailyNoteCharacters: number;
  tradeNoteCharacters: number;
  tagCount: (tradeIndex: number) => number;
  ruleCount: number;
}>;

type Usage = Readonly<{
  inputTokens: number | null;
  cachedInputTokens: number | null;
  cacheWriteInputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}>;

type CallResult = Readonly<{
  label: string;
  kind: "weekly" | "monthly";
  promptCharacters: number;
  promptBytes: number;
  outputCharacters: number;
  usage: Usage;
  attempts: readonly Readonly<{
    state: "generated" | "rejected";
    code: string | null;
    usage: Usage;
    estimatedCostUsdAtCurrentLunaRates: string | null;
  }>[];
  estimatedCostUsdAtCurrentLunaRates: string | null;
  output: CoachPeriodicAiReviewOutputV2 | CoachMonthlyAiReviewOutputV2;
}>;

type TokenCountResult = Readonly<{
  label: string;
  kind: "weekly" | "monthly";
  inputTokens: number;
}>;

const WEEK_COHORTS = Object.freeze([
  Object.freeze({ mondayDate: "2026-08-03", fridayDate: "2026-08-07" }),
  Object.freeze({ mondayDate: "2026-08-10", fridayDate: "2026-08-14" }),
  Object.freeze({ mondayDate: "2026-08-17", fridayDate: "2026-08-21" }),
  Object.freeze({ mondayDate: "2026-08-24", fridayDate: "2026-08-28" }),
]);

const PROFILES: readonly Profile[] = Object.freeze([
  Object.freeze({
    name: "low",
    tradesPerOpenDay: 2,
    activeDayIndexes: Object.freeze([1, 3]),
    dailyNoteCharacters: 0,
    tradeNoteCharacters: 0,
    tagCount: () => 0,
    ruleCount: 0,
  }),
  Object.freeze({
    name: "planning",
    tradesPerOpenDay: 5,
    activeDayIndexes: null,
    dailyNoteCharacters: 350,
    tradeNoteCharacters: 240,
    tagCount: () => 5,
    ruleCount: 5,
  }),
  Object.freeze({
    name: "heavy",
    tradesPerOpenDay: 20,
    activeDayIndexes: null,
    dailyNoteCharacters: 700,
    tradeNoteCharacters: 700,
    tagCount: (tradeIndex: number) => 5 + (tradeIndex % 6),
    ruleCount: 10,
  }),
]);

const TAGS = Object.freeze([
  "Opening range", "Premarket level", "High relative volume", "First pullback",
  "Trend continuation", "Re-entry", "Fast tape", "VWAP interaction",
  "Partial exits", "Green-to-red recovery",
]);

const RULES = Object.freeze([
  Object.freeze({ title: "Maximum risk defined", category: "Risk", statement: "Define the maximum planned loss before the first entry and record whether the completed trade stayed within it." }),
  Object.freeze({ title: "No unplanned averaging", category: "Risk", statement: "Do not add merely because price moved against the position; every add must match the saved setup and risk plan." }),
  Object.freeze({ title: "Opening setup documented", category: "Preparation", statement: "Record the specific opening setup and the market evidence that was visible when the trade began." }),
  Object.freeze({ title: "Share size within plan", category: "Risk", statement: "Keep total share exposure within the size defined for this setup and the account's daily risk constraints." }),
  Object.freeze({ title: "Stop response reviewed", category: "Execution", statement: "Review whether the trader responded to the saved invalidation level without rationalizing an unsupported hold." }),
  Object.freeze({ title: "Add quality reviewed", category: "Execution", statement: "Each add must have its own recorded reason and must not convert a planned trade into an uncontrolled position." }),
  Object.freeze({ title: "Partial exit plan followed", category: "Execution", statement: "Compare partial exits with the trader's saved profit-management plan and identify any unsupported deviation." }),
  Object.freeze({ title: "No revenge re-entry", category: "Discipline", statement: "A re-entry must be based on a newly valid setup rather than an attempt to immediately recover the prior result." }),
  Object.freeze({ title: "Time cutoff respected", category: "Discipline", statement: "Do not open a new position after the trader's saved time cutoff unless the plan explicitly permits that session." }),
  Object.freeze({ title: "Trade review completed", category: "Process", statement: "Record the completed trade's execution, notes, tags, rule results, and analyzer observations while context is available." }),
]);

function isoWeekDates(monday: string): readonly string[] {
  const start = new Date(`${monday}T12:00:00.000Z`);
  return Object.freeze(Array.from({ length: 5 }, (_, offset) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + offset);
    return date.toISOString().slice(0, 10);
  }));
}

function nextIsoDate(date: string): string {
  const value = new Date(`${date}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

function exactText(seed: string, characters: number): string {
  if (characters === 0) return "";
  const sentence = `${seed} I recorded the planned setup, the evidence visible at execution, my response as the trade changed, and the specific process adjustment I would evaluate next time. `;
  return sentence.repeat(Math.ceil(characters / sentence.length)).slice(0, characters);
}

function ruleOutcomes(count: number, seed: number): readonly CoachAiReviewNamedRuleOutcomeV2[] {
  return Object.freeze(RULES.slice(0, count).map((rule, index) => Object.freeze({
    ...rule,
    status: (seed + index) % 4 === 0 ? "broken" as const : "followed" as const,
  })));
}

function countRules(outcomes: readonly CoachAiReviewNamedRuleOutcomeV2[]) {
  return Object.freeze({
    followed: outcomes.filter((outcome) => outcome.status === "followed").length,
    broken: outcomes.filter((outcome) => outcome.status === "broken").length,
    notReviewed: outcomes.filter((outcome) => outcome.status === "not_reviewed").length,
  });
}

function tradeAnalysis(date: string, tradeIndex: number): CoachAiReviewTradeAnalysisV2 {
  const baseHour = 13 + Math.floor(tradeIndex / 12);
  const baseMinute = (tradeIndex * 3) % 50;
  const eventKinds = ["entry", "add", "partial_exit", "final_exit"] as const;
  const events = eventKinds.map((kind, sequence) => {
    const minute = baseMinute + sequence * 2;
    const executedAtUtc = `${date}T${String(baseHour).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}:00.000Z`;
    return Object.freeze({
      kind,
      sequence: sequence + 1,
      executedAtUtc,
      oneMinute: Object.freeze({
        candleLocationRatio: Number((0.18 + ((tradeIndex + sequence) % 8) * 0.1).toFixed(2)),
        candleTurnoverDecimal: String(85_000 + tradeIndex * 2_100 + sequence * 4_700),
        candleVolumeDecimal: String(18_000 + tradeIndex * 500 + sequence * 1_100),
        relativeVolume: Number((1.4 + ((tradeIndex + sequence) % 7) * 0.35).toFixed(2)),
        rsi14: Number((42 + ((tradeIndex * 3 + sequence * 5) % 32)).toFixed(2)),
        ema9DistancePercent: Number((-1.2 + ((tradeIndex + sequence) % 9) * 0.3).toFixed(2)),
        vwapDistancePercent: Number((-1.5 + ((tradeIndex * 2 + sequence) % 10) * 0.35).toFixed(2)),
        executionEdgeDistanceDecimal: ((tradeIndex + sequence) % 2 === 0 ? "0.04" : "-0.03"),
        favorableMoveUntilFlatDecimal: String((18 + (tradeIndex % 9) * 3 + sequence).toFixed(2)),
        adverseMoveUntilFlatDecimal: String((-4 - (tradeIndex % 5) * 2 - sequence).toFixed(2)),
        minutesUntilFlat: 8 + (tradeIndex % 18),
        givebackFromPriorFavorableExtremeDecimal: sequence === 0 ? null : String((-2 - sequence * 1.75).toFixed(2)),
        patterns: Object.freeze([
          Object.freeze({ kind: sequence % 2 === 0 ? "one_minute_momentum" : "one_minute_pullback", score: 0.72 + sequence * 0.05, availableAtExecution: true, candlesBeforeExecution: 2 as const }),
          Object.freeze({ kind: "volume_expansion", score: 0.66 + (tradeIndex % 4) * 0.04, availableAtExecution: true, candlesBeforeExecution: 1 as const }),
        ]),
        postEventPaths: kind === "entry" || kind === "final_exit"
          ? Object.freeze(([5, 15, 30, 60] as const).map((minutes) => Object.freeze({
              minutesAfterEvent: minutes,
              tradeDirectionMoveDecimal: String((minutes / 5 + tradeIndex % 6).toFixed(2)),
              oppositeDirectionMoveDecimal: String((-minutes / 10 - tradeIndex % 3).toFixed(2)),
            })))
          : Object.freeze([]),
      }),
      fiveMinute: Object.freeze({
        completedBeforeExecution: Object.freeze({
          ema9DistancePercent: Number((-0.8 + (tradeIndex % 6) * 0.25).toFixed(2)),
          relativeVolume: Number((1.5 + (tradeIndex % 8) * 0.3).toFixed(2)),
          turnoverDecimal: String(410_000 + tradeIndex * 11_000),
          volumeDecimal: String(82_000 + tradeIndex * 2_500),
        }),
        containingCandle: Object.freeze({
          candleLocationRatio: Number((0.25 + (tradeIndex % 7) * 0.1).toFixed(2)),
          ema9DistancePercent: Number((-0.6 + (tradeIndex % 5) * 0.3).toFixed(2)),
          executionEdgeDistanceDecimal: tradeIndex % 2 === 0 ? "0.07" : "-0.05",
          relativeVolume: Number((1.7 + (tradeIndex % 7) * 0.25).toFixed(2)),
          turnoverDecimal: String(455_000 + tradeIndex * 12_000),
          volumeDecimal: String(91_000 + tradeIndex * 2_700),
        }),
        preExecutionPartial: Object.freeze({
          completedMinuteCount: 2 + (tradeIndex % 3),
          turnoverDecimal: String(155_000 + tradeIndex * 5_000),
          volumeDecimal: String(31_000 + tradeIndex * 1_200),
        }),
        patterns: Object.freeze([
          Object.freeze({ kind: "five_minute_trend", score: 0.78, availableAtExecution: true, candlesBeforeExecution: 2 as const }),
          Object.freeze({ kind: "five_minute_volume_confirmation", score: 0.69, availableAtExecution: true, candlesBeforeExecution: 1 as const }),
        ]),
      }),
    });
  });
  const status = tradeIndex % 3 === 0 ? "green_to_red_recovered" as const
    : tradeIndex % 3 === 1 ? "green_to_red_ended_red" as const
      : "green_no_red" as const;
  return Object.freeze({
    availability: "ready",
    unavailableReason: null,
    analyzerContractVersion: "daily_trade_analyzer_v2",
    events: Object.freeze(events),
    greenToRed: Object.freeze({
      status,
      feesComplete: true,
      finalPnlDecimal: tradeIndex % 4 === 0 ? "-38.25" : "64.50",
      peakPnlDecimal: "142.75",
      firstRedPnlDecimal: status === "green_no_red" ? null : "-7.50",
      peakToRedReversalDecimal: status === "green_no_red" ? null : "150.25",
      peakToFinalReversalDecimal: tradeIndex % 4 === 0 ? "181.00" : "78.25",
      minutesFromPeakToRed: status === "green_no_red" ? null : 11 + tradeIndex % 9,
      addedAfterPeakCount: tradeIndex % 3,
      partialExitBeforeRedCount: tradeIndex % 2,
      bestProfitOpportunity: Object.freeze({
        durationMinutes: 5,
        completedCloseCount: 5,
        closesAtOrAboveStrongThresholdCount: 3,
        lowestPnlDecimal: "62.00",
        peakPnlDecimal: "142.75",
        peakToFinalReversalDecimal: tradeIndex % 4 === 0 ? "181.00" : "78.25",
      }),
    }),
    finalExitPaths: Object.freeze(([5, 15, 30, 60] as const).map((minutes) => Object.freeze({
      minutesAfterExit: minutes,
      favorableMoveDecimal: String((minutes / 6 + tradeIndex % 5).toFixed(2)),
    }))),
  });
}

function buildDay(profile: Profile, date: string, dayOrdinal: number): Readonly<{
  facts: CoachAiReviewDayMarketFactsV2;
  reflection: CoachAiReviewDailyReflectionV2;
}> {
  const tradeCount = profile.activeDayIndexes === null ||
      profile.activeDayIndexes.includes(dayOrdinal % 5)
    ? profile.tradesPerOpenDay
    : 0;
  const dayRules = ruleOutcomes(profile.ruleCount, dayOrdinal);
  const trades = Object.freeze(Array.from({ length: tradeCount }, (_, tradeIndex) => {
    const outcomes = ruleOutcomes(profile.ruleCount, dayOrdinal * 100 + tradeIndex);
    const positive = (dayOrdinal + tradeIndex) % 4 !== 0;
    const net = positive ? 45 + (tradeIndex % 8) * 7.25 : -(24 + (tradeIndex % 6) * 6.5);
    return Object.freeze({
      ticker: ["AAPL", "AMD", "META", "NVDA", "TSLA"][tradeIndex % 5]!,
      direction: tradeIndex % 3 === 0 ? "short" as const : "long" as const,
      openedAtUtc: `${date}T13:${String((31 + tradeIndex) % 60).padStart(2, "0")}:00.000Z`,
      closedAtUtc: `${date}T15:${String((7 + tradeIndex * 2) % 60).padStart(2, "0")}:00.000Z`,
      executionCount: 4,
      realizedGrossPnlDecimal: net.toFixed(2),
      netPnlDecimal: net.toFixed(2),
      holdingDurationMilliseconds: 5_400_000 + tradeIndex * 60_000,
      tradingSession: "regular" as const,
      ruleReviews: countRules(outcomes),
      ruleOutcomes: outcomes,
      tags: Object.freeze(TAGS.slice(0, profile.tagCount(tradeIndex))),
      analysis: tradeAnalysis(date, tradeIndex),
    });
  }));
  const net = trades.reduce((sum, trade) => sum.plus(trade.netPnlDecimal ?? "0"), new Decimal(0));
  const label = `For ${date},`;
  const dailyNotes = profile.dailyNoteCharacters === 0 ? null : Object.freeze({
    whatWorked: exactText(`${label} the clearest strength was disciplined setup selection.`, profile.dailyNoteCharacters),
    whatNeedsWork: exactText(`${label} the main weakness was inconsistent response after favorable movement.`, profile.dailyNoteCharacters),
    technicalRecap: exactText(`${label} I compared the 1-minute and 5-minute analyzer context at every execution.`, profile.dailyNoteCharacters),
    anythingElse: exactText(`${label} I reviewed focus, emotion, sizing, exits, and whether my saved process matched execution.`, profile.dailyNoteCharacters),
  });
  return Object.freeze({
    facts: Object.freeze({
      reviewMarketDate: date,
      marketSessionState: "open",
      marketSessionKind: "normal",
      readyClosedTradeCount: trades.length,
      netPnlDecimal: trades.length === 0 ? null : net.toFixed(2),
      ruleReviews: countRules(dayRules),
      ruleOutcomes: dayRules,
      trades,
    }),
    reflection: Object.freeze({
      evidenceRef: `synthetic-reflection-${profile.name}-${date}`,
      reviewMarketDate: date,
      reviewedStatusRevision: 1,
      reflectionState: "completed",
      dailyNotes,
      tradeNotes: Object.freeze(trades.map((trade, tradeIndex) => Object.freeze({
        ticker: trade.ticker,
        note: exactText(`${label} trade ${tradeIndex + 1} was reviewed from entry through final exit.`, profile.tradeNoteCharacters),
      })).filter((note) => note.note.length > 0)),
    }),
  });
}

function calculateSummary(days: readonly CoachAiReviewDayMarketFactsV2[]) {
  const trades = days.flatMap((day) => day.trades);
  const pnl = trades.reduce((sum, trade) => sum.plus(trade.netPnlDecimal ?? "0"), new Decimal(0));
  const wins = trades.filter((trade) => new Decimal(trade.netPnlDecimal ?? "0").gt(0)).length;
  return Object.freeze({
    tradingDayCount: days.filter((day) => day.readyClosedTradeCount > 0).length,
    readyClosedTradeCount: trades.length,
    netPnlDecimal: trades.length === 0 ? null : pnl.toFixed(2),
    winRatePercentDecimal: trades.length === 0 ? null
      : new Decimal(wins).div(trades.length).mul(100).toDecimalPlaces(4).toFixed(4),
  });
}

function buildWeeklyInput(
  profile: Profile,
  weekIndex: number,
  priorIssuedReview: CoachAiReviewPriorIssuedReviewV2 | null,
): CoachPeriodicAiReviewInputV2 {
  const cohort = WEEK_COHORTS[weekIndex];
  if (!cohort) throw new Error("monthly_cost_benchmark_week_missing");
  const dates = isoWeekDates(cohort.mondayDate);
  const built = dates.map((date, index) => buildDay(profile, date, weekIndex * 5 + index));
  const days = Object.freeze(built.map((item) => item.facts));
  const reflections = Object.freeze(built.map((item) => item.reflection));
  return Object.freeze({
    contractVersion: COACH_PERIODIC_AI_REVIEW_INPUT_CONTRACT_VERSION,
    period: Object.freeze({
      cadence: "weekly",
      startDate: cohort.mondayDate,
      endDate: cohort.fridayDate,
      calendarTimezone: "America/New_York",
      currency: "USD",
      calendarId: "XNYS-synthetic-benchmark",
      calendarEvidenceDigestSha256: "synthetic-august-2026-calendar-benchmark",
      cohorts: Object.freeze([Object.freeze({
        ...cohort,
        openSessionDates: dates,
        finalOpenSessionDate: cohort.fridayDate,
        sealedAtUtc: `${nextIsoDate(cohort.fridayDate)}T00:00:00.000Z`,
      })]),
    }),
    reviewPeriodMarketFacts: Object.freeze({
      ...calculateSummary(days),
      accountLegitimateOpenCount: 0,
      accountNeedsDecisionCount: 0,
      accountPendingDataDecisionCount: 0,
      days,
    }),
    completedDailyReflections: reflections,
    savedDailyReflections: Object.freeze([]),
    reflectionCoverage: Object.freeze(dates.map((date) => Object.freeze({
      reviewMarketDate: date,
      marketSessionState: "open" as const,
      reflectionState: "completed" as const,
      noTradeReview: false,
    }))),
    carryForwardEvidenceBundles: Object.freeze([]),
    priorIssuedReview,
    currentFocuses: Object.freeze([
      Object.freeze({ effectiveFromDate: cohort.mondayDate, tradingDate: cohort.mondayDate, revisionNumber: 1, text: "Compare saved trade plans with execution and analyzer evidence." }),
    ]),
    coverageNotice: Object.freeze({ limitationReasonCodes: Object.freeze([]), incompleteRecordRequired: false }),
  });
}

function priorReview(
  profile: Profile,
  weekIndex: number,
  output: CoachPeriodicAiReviewOutputV2,
  input: CoachPeriodicAiReviewInputV2,
): CoachAiReviewPriorIssuedReviewV2 {
  return Object.freeze({
    reviewRef: `synthetic-weekly-review-${profile.name}-${weekIndex + 1}`,
    cadence: "weekly",
    periodStartDate: input.period.startDate,
    periodEndDate: input.period.endDate,
    reviewSummary: output.reviewSummary,
    whatImproved: output.whatImproved,
    whatHeldYouBack: output.whatHeldYouBack,
    focusFollowThrough: output.focusFollowThrough,
    nextPeriodFocuses: output.nextPeriodFocuses,
    incompleteRecord: output.incompleteRecord,
    representedEvidenceRefs: Object.freeze(input.completedDailyReflections.map((reflection) => reflection.evidenceRef)),
  });
}

function buildMonthlyInput(
  profile: Profile,
  weeklyInputs: readonly CoachPeriodicAiReviewInputV2[],
  weeklyOutputs: readonly CoachPeriodicAiReviewOutputV2[],
): CoachMonthlyAiReviewInputV2 {
  const august31 = buildDay(profile, "2026-08-31", 20);
  const narratedFactDays = weeklyInputs.flatMap((input) =>
    input.reviewPeriodMarketFacts.days.map((day) => Object.freeze({
      ...day,
      trades: Object.freeze(day.trades.map((trade) => Object.freeze(Object.fromEntries(
        Object.entries(trade).filter(([key]) => key !== "analysis"),
      )) as typeof trade)),
    })));
  const days = Object.freeze([
    ...narratedFactDays,
    august31.facts,
  ]);
  const reflections = Object.freeze([
    ...weeklyInputs.flatMap((input) => input.completedDailyReflections),
    august31.reflection,
  ]);
  return Object.freeze({
    contractVersion: COACH_MONTHLY_AI_REVIEW_INPUT_CONTRACT_VERSION_V2,
    calendarMonth: Object.freeze({
      calendarMonthStartDate: "2026-08-01",
      calendarMonthEndDate: "2026-08-31",
      coverageStartDate: "2026-08-01",
      coverageEndDate: "2026-08-31",
      periodCoverage: "complete_month",
      calendarTimezone: "America/New_York",
      currency: "USD",
      calendarId: "XNYS-synthetic-benchmark",
      calendarEvidenceDigestSha256: "synthetic-august-2026-calendar-benchmark",
      scheduledAtUtc: "2026-09-01T12:00:00.000Z",
    }),
    calendarMonthFacts: Object.freeze({
      ...calculateSummary(days),
      accountLegitimateOpenCount: 0,
      accountNeedsDecisionCount: 0,
      accountPendingDataDecisionCount: 0,
      days,
    }),
    reviewNarrativeContext: Object.freeze(weeklyInputs.map((input, index) => {
      const output = weeklyOutputs[index];
      if (!output) throw new Error("monthly_cost_benchmark_weekly_output_missing");
      return Object.freeze({
        reviewRef: `synthetic-weekly-review-${profile.name}-${index + 1}`,
        reviewKind: "weekly" as const,
        periodStartDate: input.period.startDate,
        periodEndDate: input.period.endDate,
        narrativeOwnerMonth: "2026-08",
        representedEvidenceRefs: Object.freeze(input.completedDailyReflections.map((reflection) => reflection.evidenceRef)),
        statisticalUse: "prohibited" as const,
        reviewSummary: output.reviewSummary,
        whatImproved: output.whatImproved,
        whatHeldYouBack: output.whatHeldYouBack,
        focusFollowThrough: output.focusFollowThrough,
        nextPeriodFocuses: output.nextPeriodFocuses,
        incompleteRecord: output.incompleteRecord,
      });
    })),
    rawReflectionContext: Object.freeze([august31.reflection].map((reflection) => Object.freeze({
      reflection,
      sourcePeriodStartDate: "2026-08-31",
      sourcePeriodEndDate: "2026-08-31",
      narrativeOwnerMonth: "2026-08",
      contextKind: "current_month_raw" as const,
      statisticalUse: "prohibited" as const,
    }))),
    reflectionCoverage: Object.freeze(reflections.map((reflection) => Object.freeze({
      reviewMarketDate: reflection.reviewMarketDate,
      marketSessionState: "open" as const,
      reflectionState: "completed" as const,
      noTradeReview: false,
    }))),
    priorMonthlyReview: null,
    currentFocuses: Object.freeze([
      Object.freeze({ effectiveFromDate: "2026-08-03", tradingDate: "2026-08-03", revisionNumber: 1, text: "Compare saved trade plans with execution and analyzer evidence." }),
    ]),
    coverageNotice: Object.freeze({ limitationReasonCodes: Object.freeze([]), incompleteRecordRequired: false }),
  });
}

function cost(usage: Usage): string | null {
  if (usage.inputTokens === null || usage.cachedInputTokens === null ||
      usage.cacheWriteInputTokens === null || usage.outputTokens === null ||
      usage.cachedInputTokens + usage.cacheWriteInputTokens > usage.inputTokens) return null;
  const longContext = usage.inputTokens > LONG_CONTEXT_THRESHOLD;
  const inputMultiplier = longContext ? new Decimal(2) : new Decimal(1);
  const outputMultiplier = longContext ? new Decimal("1.5") : new Decimal(1);
  const uncached = usage.inputTokens - usage.cachedInputTokens -
    usage.cacheWriteInputTokens;
  return new Decimal(uncached).mul(INPUT_PRICE_PER_MILLION).mul(inputMultiplier)
    .plus(new Decimal(usage.cachedInputTokens).mul(CACHED_INPUT_PRICE_PER_MILLION).mul(inputMultiplier))
    .plus(new Decimal(usage.cacheWriteInputTokens)
      .mul(CACHE_WRITE_INPUT_PRICE_PER_MILLION).mul(inputMultiplier))
    .plus(new Decimal(usage.outputTokens).mul(OUTPUT_PRICE_PER_MILLION).mul(outputMultiplier))
    .div(1_000_000).toDecimalPlaces(8).toFixed(8);
}

function benchmarkUsage(usage: Readonly<{
  inputTokens: number | null;
  cachedInputTokens?: number | null;
  cacheWriteInputTokens?: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}>): Usage {
  return Object.freeze({
    inputTokens: usage.inputTokens,
    cachedInputTokens: usage.cachedInputTokens ?? null,
    cacheWriteInputTokens: usage.cacheWriteInputTokens ?? null,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
  });
}

async function countEnvelopeInputTokens(
  kind: TokenCountResult["kind"],
  label: string,
  envelope: Readonly<{ system: string; prompt: string }>,
): Promise<TokenCountResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("TRADERLINK_COACH_OPENAI_UNAVAILABLE");
  const response = await fetch("https://api.openai.com/v1/responses/input_tokens", {
    method: "POST",
    headers: Object.freeze({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      model: MODEL_ID,
      instructions: envelope.system,
      input: envelope.prompt,
    }),
  });
  const body: unknown = await response.json();
  if (!response.ok || !body || typeof body !== "object" ||
      !("input_tokens" in body) || typeof body.input_tokens !== "number") {
    const message = body && typeof body === "object" && "error" in body
      ? JSON.stringify(body.error)
      : String(response.status);
    throw new Error(`monthly_cost_benchmark_token_count_failed:${message}`);
  }
  return Object.freeze({ label, kind, inputTokens: body.input_tokens });
}

function describeInput(input: CoachPeriodicAiReviewInputV2 | CoachMonthlyAiReviewInputV2) {
  const days = "reviewPeriodMarketFacts" in input
    ? input.reviewPeriodMarketFacts.days
    : input.calendarMonthFacts.days;
  const reflections = "completedDailyReflections" in input
    ? input.completedDailyReflections
    : input.rawReflectionContext.map((context) => context.reflection);
  return Object.freeze({
    openSessionCount: days.length,
    tradingDayCount: days.filter((day) => day.readyClosedTradeCount > 0).length,
    tradeCount: days.reduce((sum, day) => sum + day.trades.length, 0),
    analyzerTradeCount: days.reduce((sum, day) => sum + day.trades.filter((trade) => trade.analysis?.availability === "ready").length, 0),
    analyzerEventCount: days.reduce((sum, day) => sum + day.trades.reduce((tradeSum, trade) => tradeSum + (trade.analysis?.events.length ?? 0), 0), 0),
    tagCount: days.reduce((sum, day) => sum + day.trades.reduce((tradeSum, trade) => tradeSum + trade.tags.length, 0), 0),
    namedTradeRuleOutcomeCount: days.reduce((sum, day) => sum + day.trades.reduce((tradeSum, trade) => tradeSum + (trade.ruleOutcomes?.length ?? 0), 0), 0),
    namedDayRuleOutcomeCount: days.reduce((sum, day) => sum + (day.ruleOutcomes?.length ?? 0), 0),
    dailyNoteCount: reflections.filter((reflection) => reflection.dailyNotes !== null).length,
    dailyNoteCharacters: reflections.reduce((sum, reflection) => sum + (reflection.dailyNotes
      ? Object.values(reflection.dailyNotes).reduce((noteSum, value) => noteSum + value.length, 0)
      : 0), 0),
    tradeNoteCount: reflections.reduce((sum, reflection) => sum + reflection.tradeNotes.length, 0),
    tradeNoteCharacters: reflections.reduce((sum, reflection) => sum + reflection.tradeNotes.reduce((noteSum, note) => noteSum + note.note.length, 0), 0),
  });
}

function describeProviderPackage(
  input: CoachPeriodicAiReviewInputV2 | CoachMonthlyAiReviewInputV2,
) {
  const prompt = "reviewPeriodMarketFacts" in input
    ? buildCoachPeriodicAiReviewProviderEnvelopeV2(input).prompt
    : buildCoachMonthlyAiReviewProviderEnvelopeV2(input).prompt;
  return Object.freeze({
    promptCharacters: prompt.length,
    promptBytes: Buffer.byteLength(prompt, "utf8"),
  });
}

function assertProfileInput(
  profile: Profile,
  input: CoachPeriodicAiReviewInputV2 | CoachMonthlyAiReviewInputV2,
  expectedTrades: number,
): void {
  const description = describeInput(input);
  const expectedAnalyzerTrades = "completedDailyReflections" in input
    ? expectedTrades
    : profile.activeDayIndexes === null ? profile.tradesPerOpenDay : 0;
  if (description.tradeCount !== expectedTrades ||
      description.analyzerTradeCount !== expectedAnalyzerTrades ||
      description.analyzerEventCount !== expectedAnalyzerTrades * 4) {
    throw new Error(`monthly_cost_benchmark_trade_shape_failed:${profile.name}`);
  }
  if (profile.name === "heavy" && (
    description.tradeNoteCount !== ("completedDailyReflections" in input
      ? expectedTrades : profile.tradesPerOpenDay) ||
    description.tradeNoteCharacters !== ("completedDailyReflections" in input
      ? expectedTrades * 500 : profile.tradesPerOpenDay * 500) ||
    description.namedTradeRuleOutcomeCount !== expectedTrades * 10 ||
    description.tagCount < expectedTrades * 5 ||
    description.tagCount > expectedTrades * 10
  )) throw new Error("monthly_cost_benchmark_heavy_evidence_failed");
}

async function weeklyCall(
  label: string,
  input: CoachPeriodicAiReviewInputV2,
): Promise<CallResult> {
  const envelope = buildCoachPeriodicAiReviewProviderEnvelopeV2(input);
  const attempts: CallResult["attempts"][number][] = [];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const generation = await generateCoachPeriodicAiReviewV2(input, { modelId: MODEL_ID });
      const usage = benchmarkUsage(generation.usage);
      attempts.push(Object.freeze({
        state: "generated",
        code: null,
        usage,
        estimatedCostUsdAtCurrentLunaRates: cost(usage),
      }));
      return Object.freeze({
        label,
        kind: "weekly",
        promptCharacters: envelope.prompt.length,
        promptBytes: Buffer.byteLength(envelope.prompt, "utf8"),
        outputCharacters: JSON.stringify(generation.output).length,
        usage,
        attempts: Object.freeze(attempts),
        estimatedCostUsdAtCurrentLunaRates: attempts.reduce((sum, item) =>
          sum.plus(item.estimatedCostUsdAtCurrentLunaRates ?? "0"), new Decimal(0)).toFixed(8),
        output: generation.output,
      });
    } catch (error) {
      const usage = error && typeof error === "object" && "usage" in error
        ? benchmarkUsage(error.usage as Parameters<typeof benchmarkUsage>[0])
        : null;
      const code = error instanceof Error ? error.message : "unknown_failure";
      if (!usage || !code.startsWith("TRADERLINK_COACH_OPENAI_UNSAFE_") || attempt === 3) {
        throw error;
      }
      attempts.push(Object.freeze({
        state: "rejected",
        code,
        usage,
        estimatedCostUsdAtCurrentLunaRates: cost(usage),
      }));
      process.stdout.write(`${JSON.stringify({ status: "retrying_rejected_output", label, attempt, code, usage })}\n`);
    }
  }
  throw new Error("monthly_cost_benchmark_weekly_attempts_exhausted");
}

async function monthlyCall(
  label: string,
  input: CoachMonthlyAiReviewInputV2,
): Promise<CallResult> {
  const envelope = buildCoachMonthlyAiReviewProviderEnvelopeV2(input);
  const attempts: CallResult["attempts"][number][] = [];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const generation = await generateCoachMonthlyAiReviewV2(input, { modelId: MODEL_ID });
      const usage = benchmarkUsage(generation.usage);
      attempts.push(Object.freeze({
        state: "generated",
        code: null,
        usage,
        estimatedCostUsdAtCurrentLunaRates: cost(usage),
      }));
      return Object.freeze({
        label,
        kind: "monthly",
        promptCharacters: envelope.prompt.length,
        promptBytes: Buffer.byteLength(envelope.prompt, "utf8"),
        outputCharacters: JSON.stringify(generation.output).length,
        usage,
        attempts: Object.freeze(attempts),
        estimatedCostUsdAtCurrentLunaRates: attempts.reduce((sum, item) =>
          sum.plus(item.estimatedCostUsdAtCurrentLunaRates ?? "0"), new Decimal(0)).toFixed(8),
        output: generation.output,
      });
    } catch (error) {
      const usage = error && typeof error === "object" && "usage" in error
        ? benchmarkUsage(error.usage as Parameters<typeof benchmarkUsage>[0])
        : null;
      const code = error instanceof Error ? error.message : "unknown_failure";
      if (!usage || !code.startsWith("TRADERLINK_COACH_OPENAI_UNSAFE_") || attempt === 3) {
        throw error;
      }
      attempts.push(Object.freeze({
        state: "rejected",
        code,
        usage,
        estimatedCostUsdAtCurrentLunaRates: cost(usage),
      }));
      process.stdout.write(`${JSON.stringify({ status: "retrying_rejected_output", label, attempt, code, usage })}\n`);
    }
  }
  throw new Error("monthly_cost_benchmark_monthly_attempts_exhausted");
}

async function main(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  const confirmed = arguments_[0] === CONFIRMATION;
  const countOnly = confirmed && arguments_.includes("--count-only");
  const providerCalls = confirmed && !countOnly;
  if (arguments_.length > 0 && !confirmed && arguments_[0] !== "--prepare-only") {
    throw new Error("monthly_cost_benchmark_confirmation_required");
  }
  loadEnvConfig(process.cwd(), true);
  const profileArtifacts = [];
  for (const profile of PROFILES) {
    const weeklyInputs: CoachPeriodicAiReviewInputV2[] = [];
    const weeklyOutputs: CoachPeriodicAiReviewOutputV2[] = [];
    const callResults: CallResult[] = [];
    const tokenCounts: TokenCountResult[] = [];
    let prior: CoachAiReviewPriorIssuedReviewV2 | null = null;
    for (let weekIndex = 0; weekIndex < 4; weekIndex += 1) {
      const input = buildWeeklyInput(profile, weekIndex, prior);
      const expectedTrades = profile.activeDayIndexes === null
        ? profile.tradesPerOpenDay * 5
        : profile.tradesPerOpenDay * profile.activeDayIndexes.length;
      assertProfileInput(profile, input, expectedTrades);
      weeklyInputs.push(input);
      if (providerCalls) {
        process.stdout.write(`${JSON.stringify({ status: "calling_provider", profile: profile.name, review: `weekly_${weekIndex + 1}` })}\n`);
        const result = await weeklyCall(`${profile.name}_weekly_${weekIndex + 1}`, input);
        callResults.push(result);
        const output = result.output as CoachPeriodicAiReviewOutputV2;
        weeklyOutputs.push(output);
        prior = priorReview(profile, weekIndex, output, input);
      } else {
        if (countOnly) {
          process.stdout.write(`${JSON.stringify({ status: "counting_tokens", profile: profile.name, review: `weekly_${weekIndex + 1}` })}\n`);
          tokenCounts.push(await countEnvelopeInputTokens(
            "weekly",
            `${profile.name}_weekly_${weekIndex + 1}`,
            buildCoachPeriodicAiReviewProviderEnvelopeV2(input),
          ));
        }
        const placeholder = Object.freeze({
          contractVersion: "traderlink_coach_periodic_ai_review_output_v2" as const,
          reviewSummary: `Prepared synthetic ${profile.name} weekly review ${weekIndex + 1}.`,
          whatImproved: "Prepared benchmark placeholder.",
          whatHeldYouBack: "Prepared benchmark placeholder.",
          focusFollowThrough: "Prepared benchmark placeholder.",
          nextPeriodFocuses: Object.freeze(["Prepared benchmark placeholder."]),
          incompleteRecord: null,
        });
        weeklyOutputs.push(placeholder);
        prior = priorReview(profile, weekIndex, placeholder, input);
      }
    }
    const monthlyInput = buildMonthlyInput(profile, weeklyInputs, weeklyOutputs);
    const expectedMonthlyTrades = profile.activeDayIndexes === null
      ? profile.tradesPerOpenDay * 21
      : profile.tradesPerOpenDay * profile.activeDayIndexes.length * 4;
    assertProfileInput(profile, monthlyInput, expectedMonthlyTrades);
    if (providerCalls) {
      process.stdout.write(`${JSON.stringify({ status: "calling_provider", profile: profile.name, review: "monthly" })}\n`);
      callResults.push(await monthlyCall(`${profile.name}_monthly`, monthlyInput));
    } else if (countOnly) {
      process.stdout.write(`${JSON.stringify({ status: "counting_tokens", profile: profile.name, review: "monthly" })}\n`);
      tokenCounts.push(await countEnvelopeInputTokens(
        "monthly",
        `${profile.name}_monthly`,
        buildCoachMonthlyAiReviewProviderEnvelopeV2(monthlyInput),
      ));
    }
    profileArtifacts.push(Object.freeze({
      profile: profile.name,
      specification: profile,
      weeklyInputs: Object.freeze(weeklyInputs),
      monthlyInput,
      weeklyInputDescriptions: Object.freeze(weeklyInputs.map(describeInput)),
      monthlyInputDescription: describeInput(monthlyInput),
      weeklyProviderPackages: Object.freeze(weeklyInputs.map(describeProviderPackage)),
      monthlyProviderPackage: describeProviderPackage(monthlyInput),
      calls: Object.freeze(callResults),
      tokenCounts: Object.freeze(tokenCounts),
      fourWeekPlusMonthlyCostUsd: providerCalls
        ? callResults.reduce((sum, call) => sum.plus(call.estimatedCostUsdAtCurrentLunaRates ?? "0"), new Decimal(0)).toFixed(8)
        : null,
    }));
  }

  const completedAtUtc = new Date().toISOString();
  mkdirSync(join(process.cwd(), ".local-logs"), { recursive: true });
  const artifactName = `ai-review-monthly-cost-benchmark-${completedAtUtc.replaceAll(":", "-")}.json`;
  writeFileSync(join(process.cwd(), ".local-logs", artifactName), `${JSON.stringify({
    contractVersion: "traderlink_ai_review_monthly_cost_benchmark_v1",
    completedAtUtc,
    providerCalls,
    countOnly,
    modelId: MODEL_ID,
    pricingObservedDate: "2026-08-09",
    pricingSource: "https://developers.openai.com/api/docs/models/gpt-5.6-luna",
    pricingUsdPerMillionTokens: Object.freeze({
      input: INPUT_PRICE_PER_MILLION.toFixed(2),
      cachedInput: CACHED_INPUT_PRICE_PER_MILLION.toFixed(2),
      cacheWriteInput: CACHE_WRITE_INPUT_PRICE_PER_MILLION.toFixed(2),
      output: OUTPUT_PRICE_PER_MILLION.toFixed(2),
      longContextThresholdInputTokens: LONG_CONTEXT_THRESHOLD,
      longContextInputMultiplier: "2",
      longContextOutputMultiplier: "1.5",
    }),
    profiles: profileArtifacts,
  }, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  process.stdout.write(`${JSON.stringify({
    status: providerCalls ? "provider_benchmark_completed"
      : countOnly ? "provider_benchmark_counted" : "provider_benchmark_prepared",
    modelId: MODEL_ID,
    providerCallCount: providerCalls ? PROFILES.length * 5 : 0,
    tokenCountRequestCount: countOnly ? PROFILES.length * 5 : 0,
    artifactName,
    profiles: profileArtifacts.map((artifact) => Object.freeze({
      profile: artifact.profile,
      weeklyInputDescriptions: artifact.weeklyInputDescriptions,
      monthlyInputDescription: artifact.monthlyInputDescription,
      weeklyProviderPackages: artifact.weeklyProviderPackages,
      monthlyProviderPackage: artifact.monthlyProviderPackage,
      fourWeekPlusMonthlyCostUsd: artifact.fourWeekPlusMonthlyCostUsd,
      calls: artifact.calls.map((call) => Object.freeze({
        label: call.label,
        promptCharacters: call.promptCharacters,
        promptBytes: call.promptBytes,
        outputCharacters: call.outputCharacters,
        usage: call.usage,
        attempts: call.attempts,
        estimatedCostUsdAtCurrentLunaRates: call.estimatedCostUsdAtCurrentLunaRates,
      })),
      tokenCounts: artifact.tokenCounts,
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
