import Decimal from "decimal.js";

import type { CoachPeriodicAiReviewInputV2 } from "../contracts/weekly-ai-review-input-contracts";
import {
  COACH_MONTHLY_AI_REVIEW_EVIDENCE_PACKET_VERSION,
  type CoachMonthlyAiReviewComparisonObservation,
  type CoachMonthlyAiReviewEvidencePacket,
  type CoachMonthlyAiReviewEvidenceWeek,
} from "../contracts/coach-monthly-ai-review-evidence-authoring-contracts";
import type {
  CoachWeeklyAiReviewEvidenceMetric,
  CoachWeeklyAiReviewEvidencePacket,
} from "../contracts/coach-weekly-ai-review-evidence-authoring-contracts";

import { buildCoachWeeklyAiReviewEvidencePacketFromPeriodicInputV2 } from
  "./coach-weekly-ai-review-evidence-packet-builder";

const ExactDecimal = Decimal.clone({
  precision: 80,
  toExpNeg: -1000,
  toExpPos: 1000,
});

type MonthlyPacketPeriod = Readonly<{
  calendarMonthStartDate: string;
  calendarMonthEndDate: string;
  timezone: "America/New_York";
  currency: string;
}>;

function decimal(value: string | null): Decimal | null {
  if (value === null || !/^-?\d+(?:\.\d+)?$/u.test(value)) return null;
  return new ExactDecimal(value);
}

function sum(values: readonly (string | null)[]): string | null {
  if (values.some((value) => decimal(value) === null)) return null;
  return values.reduce((total, value) => total.plus(decimal(value)!), new ExactDecimal(0))
    .toFixed(2);
}

function percent(numerator: number, denominator: number): string | null {
  if (denominator === 0) return null;
  return new ExactDecimal(numerator).div(denominator).times(100)
    .toDecimalPlaces(2, ExactDecimal.ROUND_HALF_UP).toFixed(2);
}

function mondayOf(value: string): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("TRADERLINK_COACH_MONTHLY_AUTHORING_DATE_INVALID");
  }
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

function mergeUnique<T>(
  values: readonly T[],
  key: (value: T) => string,
): readonly T[] {
  const byKey = new Map<string, T>();
  for (const value of values) {
    const existing = byKey.get(key(value));
    if (existing && JSON.stringify(existing) !== JSON.stringify(value)) {
      throw new Error("TRADERLINK_COACH_MONTHLY_AUTHORING_SOURCE_CONFLICT");
    }
    byKey.set(key(value), value);
  }
  return Object.freeze([...byKey.values()].sort((left, right) =>
    key(left).localeCompare(key(right))));
}

/**
 * A weekly snapshot carries an already-active focus forward with that week's
 * start as its display date. Those weekly display dates differ, but the saved
 * focus revision is one fact. Normalize it to the relevant calendar-month
 * date before deduplication so a monthly review can include it once.
 */
function mergeCurrentFocuses(
  inputs: readonly CoachPeriodicAiReviewInputV2[],
  period: MonthlyPacketPeriod,
): CoachPeriodicAiReviewInputV2["currentFocuses"] {
  const normalized = inputs.flatMap((input) => input.currentFocuses.map((focus) =>
    Object.freeze({
      ...focus,
      effectiveFromDate: focus.tradingDate < period.calendarMonthStartDate
        ? period.calendarMonthStartDate
        : focus.tradingDate,
    })));
  return mergeUnique(normalized, (focus) =>
    `${focus.tradingDate}:${focus.revisionNumber}`);
}

/**
 * Builds one whole-month periodic fact input solely as an internal adapter for
 * the compact authoring packet. It does not include prior weekly prose, and
 * it keeps every current-month execution-path row intact.
 */
function mergePeriodicInputs(
  inputs: readonly CoachPeriodicAiReviewInputV2[],
  period: MonthlyPacketPeriod,
): CoachPeriodicAiReviewInputV2 | null {
  if (inputs.length === 0) return null;
  const days = mergeUnique(
    inputs.flatMap((input) => input.reviewPeriodMarketFacts.days)
      .filter((day) => day.reviewMarketDate >= period.calendarMonthStartDate &&
        day.reviewMarketDate <= period.calendarMonthEndDate),
    (day) => day.reviewMarketDate,
  );
  if (days.length === 0) return null;
  const trades = days.flatMap((day) => day.trades);
  const knownPnl = trades.filter((trade) => decimal(trade.netPnlDecimal) !== null);
  const winners = knownPnl.filter((trade) => decimal(trade.netPnlDecimal)!.gt(0));
  const first = inputs[0]!;
  return Object.freeze({
    contractVersion: first.contractVersion,
    period: Object.freeze({
      cadence: "weekly",
      startDate: period.calendarMonthStartDate,
      endDate: period.calendarMonthEndDate,
      calendarTimezone: "America/New_York",
      currency: period.currency,
      calendarId: first.period.calendarId,
      calendarEvidenceDigestSha256: first.period.calendarEvidenceDigestSha256,
      cohorts: Object.freeze(inputs.flatMap((input) => input.period.cohorts)),
    }),
    reviewPeriodMarketFacts: Object.freeze({
      tradingDayCount: days.filter((day) => day.marketSessionState === "open").length,
      readyClosedTradeCount: trades.length,
      netPnlDecimal: sum(days.map((day) => day.netPnlDecimal)),
      winRatePercentDecimal: percent(winners.length, knownPnl.length),
      accountLegitimateOpenCount: first.reviewPeriodMarketFacts.accountLegitimateOpenCount,
      accountNeedsDecisionCount: first.reviewPeriodMarketFacts.accountNeedsDecisionCount,
      accountPendingDataDecisionCount:
        first.reviewPeriodMarketFacts.accountPendingDataDecisionCount,
      days,
    }),
    completedDailyReflections: mergeUnique(
      inputs.flatMap((input) => input.completedDailyReflections)
        .filter((reflection) => reflection.reviewMarketDate >= period.calendarMonthStartDate &&
          reflection.reviewMarketDate <= period.calendarMonthEndDate),
      (reflection) => reflection.evidenceRef,
    ),
    savedDailyReflections: mergeUnique(
      inputs.flatMap((input) => input.savedDailyReflections ?? [])
        .filter((reflection) => reflection.reviewMarketDate >= period.calendarMonthStartDate &&
          reflection.reviewMarketDate <= period.calendarMonthEndDate),
      (reflection) => reflection.evidenceRef,
    ),
    reflectionCoverage: mergeUnique(
      inputs.flatMap((input) => input.reflectionCoverage)
        .filter((coverage) => coverage.reviewMarketDate >= period.calendarMonthStartDate &&
          coverage.reviewMarketDate <= period.calendarMonthEndDate),
      (coverage) => coverage.reviewMarketDate,
    ),
    carryForwardEvidenceBundles: Object.freeze([]),
    // Current-month weekly review prose is intentionally excluded. The monthly
    // author receives the raw facts once, rather than a prior AI interpretation.
    priorIssuedReview: null,
    currentFocuses: mergeCurrentFocuses(inputs, period),
    coverageNotice: Object.freeze({
      limitationReasonCodes: Object.freeze([]),
      incompleteRecordRequired: false,
    }),
  });
}

function metricMap(
  metrics: readonly CoachWeeklyAiReviewEvidenceMetric[],
): ReadonlyMap<string, CoachWeeklyAiReviewEvidenceMetric> {
  return new Map(metrics.map((metric) => [metric.name, metric] as const));
}

function calendarWeeks(
  packet: CoachWeeklyAiReviewEvidencePacket,
): readonly CoachMonthlyAiReviewEvidenceWeek[] {
  const byMonday = new Map<string, typeof packet.days>();
  for (const day of packet.days) {
    const monday = mondayOf(day.marketDate);
    byMonday.set(monday, Object.freeze([...(byMonday.get(monday) ?? []), day]));
  }
  return Object.freeze([...byMonday.entries()].sort(([left], [right]) =>
    left.localeCompare(right)).map(([weekStartDate, days], index) => Object.freeze({
    evidenceRef: `calendar_week_${String(index + 1).padStart(2, "0")}`,
    weekStartDate,
    weekEndDate: days.at(-1)!.marketDate,
    tradeCount: days.reduce((total, day) => total + day.tradeCount, 0),
    winnerCount: days.reduce((total, day) => total + day.winnerCount, 0),
    loserCount: days.reduce((total, day) => total + day.loserCount, 0),
    flatCount: days.reduce((total, day) => total + day.flatCount, 0),
    netPnlDecimal: sum(days.map((day) => day.netPnlDecimal)),
  })));
}

function comparisons(
  current: CoachWeeklyAiReviewEvidencePacket,
  prior: CoachWeeklyAiReviewEvidencePacket | null,
): readonly CoachMonthlyAiReviewComparisonObservation[] {
  if (!prior) return Object.freeze([]);
  const priorByLabel = new Map(prior.calculatedObservations.map((observation) =>
    [observation.label, observation] as const));
  const result: CoachMonthlyAiReviewComparisonObservation[] = [];
  for (const observation of current.calculatedObservations) {
    const comparison = priorByLabel.get(observation.label);
    if (!comparison) continue;
    const currentMetrics = metricMap(observation.measurements);
    const priorMetrics = metricMap(comparison.measurements);
    if (currentMetrics.size === 0 || priorMetrics.size === 0) continue;
    result.push(Object.freeze({
      evidenceRef: `comparison_${String(result.length + 1).padStart(3, "0")}`,
      label: observation.label,
      description: `Exact comparison of ${observation.label.toLocaleLowerCase()} in the current and prior calendar month.`,
      currentPeriodMeasurements: Object.freeze([...currentMetrics.values()]),
      priorPeriodMeasurements: Object.freeze([...priorMetrics.values()]),
    }));
  }
  return Object.freeze(result);
}

/**
 * Converts exact current-month and prior-month weekly Journal snapshots into
 * the authoring packet. Current-month weekly prose is never accepted here.
 */
export function buildCoachMonthlyAiReviewEvidencePacketFromPeriodicInputsV2(input: Readonly<{
  period: MonthlyPacketPeriod;
  currentMonthWeeks: readonly CoachPeriodicAiReviewInputV2[];
  priorMonthPeriod: MonthlyPacketPeriod | null;
  priorMonthWeeks: readonly CoachPeriodicAiReviewInputV2[];
}>): CoachMonthlyAiReviewEvidencePacket {
  const currentInput = mergePeriodicInputs(input.currentMonthWeeks, input.period);
  if (!currentInput) {
    throw new Error("TRADERLINK_COACH_MONTHLY_AUTHORING_CURRENT_MONTH_EMPTY");
  }
  const current = buildCoachWeeklyAiReviewEvidencePacketFromPeriodicInputV2(currentInput);
  const priorInput = input.priorMonthPeriod === null
    ? null
    : mergePeriodicInputs(input.priorMonthWeeks, input.priorMonthPeriod);
  const prior = priorInput === null
    ? null
    : buildCoachWeeklyAiReviewEvidencePacketFromPeriodicInputV2(priorInput);
  return Object.freeze({
    packetVersion: COACH_MONTHLY_AI_REVIEW_EVIDENCE_PACKET_VERSION,
    period: input.period,
    monthSnapshot: Object.freeze({
      evidenceRef: "month_snapshot",
      metrics: current.weekSnapshot.metrics,
    }),
    priorMonthSnapshot: prior === null || input.priorMonthPeriod === null ? null : Object.freeze({
      evidenceRef: "prior_month_snapshot",
      calendarMonthStartDate: input.priorMonthPeriod.calendarMonthStartDate,
      calendarMonthEndDate: input.priorMonthPeriod.calendarMonthEndDate,
      metrics: prior.weekSnapshot.metrics,
    }),
    calendarWeeks: calendarWeeks(current),
    ruleDefinitions: current.ruleDefinitions,
    ruleSummaries: current.ruleSummaries,
    days: current.days,
    trades: current.trades,
    analyzerRows: current.analyzerRows,
    calculatedObservations: current.calculatedObservations,
    comparisonObservations: comparisons(current, prior),
    observationOverlaps: current.observationOverlaps,
    dailyReflections: current.dailyReflections,
    currentFocuses: current.currentFocuses,
    coverage: current.coverage,
  });
}
