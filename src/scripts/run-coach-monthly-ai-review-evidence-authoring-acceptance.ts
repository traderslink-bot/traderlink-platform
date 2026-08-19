import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { loadEnvConfig } from "@next/env";
import Decimal from "decimal.js";

import {
  COACH_MONTHLY_AI_REVIEW_EVIDENCE_PACKET_VERSION,
  type CoachMonthlyAiReviewComparisonObservation,
  type CoachMonthlyAiReviewEvidencePacket,
} from "@/src/modules/coach/contracts/coach-monthly-ai-review-evidence-authoring-contracts";
import {
  COACH_WEEKLY_AI_REVIEW_EVIDENCE_PACKET_VERSION,
  type CoachWeeklyAiReviewAnalyzerEvidenceRow,
  type CoachWeeklyAiReviewCalculatedObservation,
  type CoachWeeklyAiReviewEvidenceMetric,
  type CoachWeeklyAiReviewEvidencePacket,
  type CoachWeeklyAiReviewEvidenceRuleResult,
  type CoachWeeklyAiReviewEvidenceTrade,
} from "@/src/modules/coach/contracts/coach-weekly-ai-review-evidence-authoring-contracts";
import {
  COACH_MONTHLY_AI_REVIEW_DIRECT_PACKET_MAX_BYTES,
  COACH_MONTHLY_AI_REVIEW_EVIDENCE_AUTHORING_MODEL,
  generateCoachMonthlyAiReviewFromEvidencePacket,
  inspectCoachMonthlyAiReviewEvidencePartitions,
  serializeCoachMonthlyAiReviewEvidencePacket,
} from "@/src/modules/coach/server/coach-monthly-ai-review-evidence-authoring";
import {
  COACH_WEEKLY_AI_REVIEW_EVIDENCE_AUTHORING_MODEL,
  generateCoachWeeklyAiReviewFromEvidencePacket,
} from "@/src/modules/coach/server/coach-weekly-ai-review-evidence-authoring";

const PREFLIGHT_CONFIRMATION = "--check-420-trade-monthly-evidence-packet";
const LIVE_CONFIRMATION = "--confirm-sequential-four-week-plus-month-sol-high";
const WEEKLY_STAGE_CONFIRMATIONS = Object.freeze([
  "--confirm-weekly-1-sol-high",
  "--confirm-weekly-2-sol-high",
  "--confirm-weekly-3-sol-high",
  "--confirm-weekly-4-sol-high",
] as const);
const MONTHLY_STAGE_CONFIRMATION = "--confirm-monthly-sol-high";
const SEQUENTIAL_CHECKPOINT_FILENAME = "monthly-evidence-authoring-sequential-checkpoint.json";
const CURRENCY = "USD";
const MONTH_START = "2026-08-01";
const MONTH_END = "2026-08-31";
const SYMBOLS = Object.freeze(["NVDA", "AMD", "TSLA", "META", "AAPL", "PLTR"]);

type DayKind = "strong" | "steady" | "mixed" | "risk_spiral" | "weak" | "recovery";
type FixtureTrade = CoachWeeklyAiReviewEvidenceTrade & Readonly<{
  netPnlDecimal: string;
  holdingMinutes: number;
  afterTwoConsecutiveLosses: boolean;
  outcome: "winner" | "loser" | "flat";
  ruleResults: readonly CoachWeeklyAiReviewEvidenceRuleResult[];
  analyzer: CoachWeeklyAiReviewAnalyzerEvidenceRow;
}>;

const MONTH_DAYS = Object.freeze([
  ["2026-08-03", "strong"], ["2026-08-04", "steady"], ["2026-08-05", "mixed"], ["2026-08-06", "strong"], ["2026-08-07", "steady"],
  ["2026-08-10", "steady"], ["2026-08-11", "mixed"], ["2026-08-12", "risk_spiral"], ["2026-08-13", "steady"], ["2026-08-14", "mixed"],
  ["2026-08-17", "weak"], ["2026-08-18", "risk_spiral"], ["2026-08-19", "weak"], ["2026-08-20", "mixed"], ["2026-08-21", "weak"],
  ["2026-08-24", "recovery"], ["2026-08-25", "recovery"], ["2026-08-26", "steady"], ["2026-08-27", "recovery"], ["2026-08-28", "mixed"],
  ["2026-08-31", "weak"],
] as const satisfies readonly (readonly [string, DayKind])[]);

const RULES = Object.freeze([
  Object.freeze({ ruleRef: "rule_pause_after_two_losses", title: "Pause after two consecutive losses", ruleText: "Do not place another trade after two consecutive losing trades during the same day." }),
  Object.freeze({ ruleRef: "rule_maximum_two_ticker_attempts", title: "Maximum two attempts per ticker", ruleText: "Limit each ticker to two completed attempts during the trading day." }),
  Object.freeze({ ruleRef: "rule_planned_risk", title: "Exit at planned risk", ruleText: "Review whether the completed trade stayed within the trader's recorded maximum risk." }),
  Object.freeze({ ruleRef: "rule_position_size", title: "Position size within plan", ruleText: "Keep total position size within the trader's recorded size plan." }),
]);

function metric(name: string, exactValue: string, displayValue: string): CoachWeeklyAiReviewEvidenceMetric {
  return Object.freeze({ name, exactValue, displayValue });
}

function percent(numerator: number, denominator: number): string {
  return denominator === 0 ? "0.00" : new Decimal(numerator).div(denominator)
    .mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

function decimalSum(values: readonly string[]): string {
  return values.reduce((total, value) => total.plus(value), new Decimal(0)).toFixed(2);
}

function timeForTrade(index: number): string {
  const start = index < 10 ? 9 * 60 + 32 + index * 4 : 10 * 60 + 20 + (index - 10) * 8;
  return `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`;
}

function addMinutes(time: string, minutes: number): string {
  const [hours, minutesPart] = time.split(":").map(Number);
  const total = hours! * 60 + minutesPart! + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function valuesForDay(kind: DayKind): readonly string[] {
  const patterns: Readonly<Record<DayKind, readonly string[]>> = Object.freeze({
    strong: Object.freeze(["52", "-34", "50", "-32", "48", "-30", "50", "-34", "46", "-30", "52", "-32", "50", "-34", "48", "-30", "50", "46", "44", "42"]),
    steady: Object.freeze(["46", "-36", "44", "-34", "45", "-36", "43", "-35", "46", "-36", "45", "-35", "44", "-34", "45", "-36", "42", "40", "38", "36"]),
    mixed: Object.freeze(["44", "-38", "42", "-36", "45", "-39", "41", "-37", "44", "-38", "42", "-36", "45", "-39", "40", "-37", "44", "-35", "38", "-34"]),
    risk_spiral: Object.freeze(["46", "-34", "44", "-33", "42", "-36", "40", "-35", "38", "-37", "-46", "-52", "-58", "-54", "-50", "36", "-48", "-56", "34", "-52"]),
    weak: Object.freeze(["42", "-39", "40", "-38", "41", "-40", "38", "-39", "36", "-41", "-42", "-44", "34", "-43", "-41", "35", "-42", "32", "-40", "-39"]),
    recovery: Object.freeze(["54", "-34", "52", "-32", "50", "-31", "54", "-33", "52", "-30", "50", "-31", "54", "-32", "50", "48", "46", "44", "42", "40"]),
  });
  return patterns[kind];
}

function reflection(kind: DayKind, date: string): Readonly<{
  evidenceRef: string;
  marketDate: string;
  state: "completed";
  whatWorked: string;
  whatNeedsWork: string;
  technicalRecap: string;
  nextSessionFocus: string;
  tradeNotes: readonly Readonly<{ ticker: string; note: string }>[];
}> {
  const descriptions: Readonly<Record<DayKind, readonly string[]>> = Object.freeze({
    strong: ["Opening trades were selective and I kept the response to favorable movement measured.", "Later attempts were less clear than the opening trades.", "Early entries had larger favorable than adverse movement.", "Compare early and later attempts without assuming the time of day caused the result."],
    steady: ["I kept the first attempts compact and did not add after the peak.", "A few exits gave back more than I expected.", "The opening window was cleaner than the later sequence.", "Review whether the exit path changed as the session moved on."],
    mixed: ["The day had both clean entries and recoveries after early losses.", "Repeat attempts were harder to assess than the initial setups.", "Several trades moved green before their final exit.", "Separate the later-attempt results from the trades that followed losses."],
    risk_spiral: ["The first part of the day stayed contained.", "After two losses I continued trading and the day became more active.", "Multiple later trades moved green and then finished red.", "Compare the post-loss trades as one subset rather than treating every late trade the same."],
    weak: ["A few first attempts worked even on a difficult day.", "Losses clustered in repeat attempts and some peak giveback was larger than planned.", "The later entries had more adverse movement than the early entries.", "Review the loss clusters beside the trades that remained green."],
    recovery: ["I reduced the number of losing sequences and the day stayed organized.", "Later attempts still need a separate look even when the day finished positive.", "Most exits retained a larger share of favorable movement.", "Compare the recovery days with the high-activity days without treating P/L alone as process proof."],
  });
  const value = descriptions[kind];
  return Object.freeze({
    evidenceRef: `reflection_${date}`,
    marketDate: date,
    state: "completed",
    whatWorked: value![0]!,
    whatNeedsWork: value![1]!,
    technicalRecap: value![2]!,
    nextSessionFocus: value![3]!,
    tradeNotes: Object.freeze([]),
  });
}

function buildTrades(): readonly FixtureTrade[] {
  const trades: FixtureTrade[] = [];
  let global = 0;
  for (const [dayIndex, [marketDate, kind]] of MONTH_DAYS.entries()) {
    const attempts = new Map<string, number>();
    const values = valuesForDay(kind);
    for (const [daySequence, value] of values.entries()) {
      const pnl = new Decimal(value);
      const ticker = SYMBOLS[(daySequence + dayIndex) % SYMBOLS.length]!;
      const tickerAttemptNumber = (attempts.get(ticker) ?? 0) + 1;
      attempts.set(ticker, tickerAttemptNumber);
      const afterTwoConsecutiveLosses = (kind === "risk_spiral" && daySequence >= 12) ||
        (kind === "weak" && daySequence >= 14 && dayIndex % 2 === 0);
      const greenToRedStatus = pnl.lt(0) && (afterTwoConsecutiveLosses || daySequence % 7 === 1)
        ? "green_to_red_ended_red" as const
        : pnl.gt(0) && (global % 17 === 0)
          ? "green_to_red_recovered" as const
          : "green_no_red" as const;
      const entry = timeForTrade(daySequence);
      const holdingMinutes = 4 + global % 22;
      const plannedRiskBroken = greenToRedStatus === "green_to_red_ended_red";
      const ruleResults: readonly CoachWeeklyAiReviewEvidenceRuleResult[] = Object.freeze([
        Object.freeze({ ruleRef: "rule_pause_after_two_losses", status: afterTwoConsecutiveLosses ? "broken" : "not_applicable" }),
        Object.freeze({ ruleRef: "rule_maximum_two_ticker_attempts", status: tickerAttemptNumber > 2 ? "broken" : "not_applicable" }),
        Object.freeze({ ruleRef: "rule_planned_risk", status: plannedRiskBroken ? "broken" : "followed" }),
        Object.freeze({ ruleRef: "rule_position_size", status: global % 59 === 0 ? "broken" : "followed" }),
      ]);
      const early = daySequence < 10;
      const peak = plannedRiskBroken ? new Decimal(94 + global % 16) : pnl.abs().plus(44 + global % 12);
      const analyzer: CoachWeeklyAiReviewAnalyzerEvidenceRow = Object.freeze({
        tradeEvidenceRef: `trade_${String(global + 1).padStart(3, "0")}`,
        favorableMoveDecimal: new Decimal(early ? 74 : 45).plus(global % 9).toFixed(2),
        adverseMoveDecimal: new Decimal(early ? -17 : -31).minus(global % 6).toFixed(2),
        greenToRedStatus,
        measuredPeakPnlDecimal: peak.toFixed(2),
        peakToFinalReversalDecimal: peak.minus(pnl).toFixed(2),
        addedAfterPeakCount: afterTwoConsecutiveLosses && global % 3 === 0 ? 1 : 0,
        partialExitBeforeRedCount: plannedRiskBroken && global % 4 === 0 ? 1 : 0,
        favorableMoveAfter15MinutesDecimal: new Decimal(global % 5 === 0 ? -12 : 8 + global % 18).toFixed(2),
      });
      const note = `I recorded ${early ? "the opening" : "the later-session"} setup on ${ticker}, the reason for ${tickerAttemptNumber === 1 ? "the first attempt" : `attempt ${tickerAttemptNumber}`}, the response as the trade changed, and the exit decision beside the measured path.`;
      trades.push(Object.freeze({
        evidenceRef: analyzer.tradeEvidenceRef,
        marketDate,
        daySequence: daySequence + 1,
        entryTimeEastern: entry,
        exitTimeEastern: addMinutes(entry, holdingMinutes),
        ticker,
        direction: global % 5 === 0 ? "short" : "long",
        netPnlDecimal: pnl.toFixed(2),
        outcome: pnl.gt(0) ? "winner" : pnl.lt(0) ? "loser" : "flat",
        holdingMinutes,
        tickerAttemptNumber,
        afterTwoConsecutiveLosses,
        tags: Object.freeze([
          early ? "Opening window" : "Later session",
          tickerAttemptNumber === 1 ? "First attempt" : "Repeat attempt",
          ...(afterTwoConsecutiveLosses ? ["After two consecutive losses"] : []),
          ...(plannedRiskBroken ? ["Green-to-red"] : []),
          ...(global % 3 === 0 ? ["First pullback"] : ["Trend continuation"]),
        ]),
        ruleDeviationRefs: Object.freeze(ruleResults.filter((result) =>
          result.status === "broken" || result.status === "not_reviewed").map((result) => result.ruleRef)),
        note,
        ruleResults,
        analyzer,
      }));
      global += 1;
    }
  }
  return Object.freeze(trades);
}

function summarize(trades: readonly FixtureTrade[]): Readonly<{
  tradeCount: number;
  winnerCount: number;
  loserCount: number;
  flatCount: number;
  netPnlDecimal: string;
  winRatePercent: string;
  profitFactor: string;
}> {
  const winners = trades.filter((trade) => trade.outcome === "winner");
  const losers = trades.filter((trade) => trade.outcome === "loser");
  const grossProfit = new Decimal(decimalSum(winners.map((trade) => trade.netPnlDecimal)));
  const grossLoss = new Decimal(decimalSum(losers.map((trade) => trade.netPnlDecimal))).abs();
  return Object.freeze({
    tradeCount: trades.length,
    winnerCount: winners.length,
    loserCount: losers.length,
    flatCount: trades.filter((trade) => trade.outcome === "flat").length,
    netPnlDecimal: decimalSum(trades.map((trade) => trade.netPnlDecimal)),
    winRatePercent: percent(winners.length, trades.length),
    profitFactor: grossLoss.isZero() ? "0.00" : grossProfit.div(grossLoss)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
  });
}

function dayRows(trades: readonly FixtureTrade[]) {
  return Object.freeze(MONTH_DAYS.map(([marketDate]) => {
    const dayTrades = trades.filter((trade) => trade.marketDate === marketDate);
    const result = summarize(dayTrades);
    return Object.freeze({
      evidenceRef: `day_${marketDate}`,
      marketDate,
      tradeCount: result.tradeCount,
      winnerCount: result.winnerCount,
      loserCount: result.loserCount,
      flatCount: result.flatCount,
      netPnlDecimal: result.netPnlDecimal,
    });
  }));
}

function observation(
  evidenceRef: string,
  label: string,
  description: string,
  populationDefinition: string,
  source: readonly FixtureTrade[],
): Readonly<{ value: CoachWeeklyAiReviewCalculatedObservation; members: readonly string[] }> {
  const result = summarize(source);
  return Object.freeze({
    value: Object.freeze({
      evidenceRef,
      label,
      description,
      populationDefinition,
      affectedTradeCount: source.length,
      representativeTradeRefs: Object.freeze(source.slice(0, 8).map((trade) => trade.evidenceRef)),
      measurements: Object.freeze([
        metric("trade_count", String(source.length), `${source.length} trades`),
        metric("net_pnl", result.netPnlDecimal, `USD ${result.netPnlDecimal}`),
        metric("win_rate_percent", result.winRatePercent, `${result.winRatePercent}%`),
      ]),
    }),
    members: Object.freeze(source.map((trade) => trade.evidenceRef)),
  });
}

function observations(trades: readonly FixtureTrade[]) {
  const definitions = [
    observation("observation_after_two_losses", "Trades after two consecutive losses", "Trades recorded after the day crossed the two-consecutive-loss boundary.", "afterTwoConsecutiveLosses = true", trades.filter((trade) => trade.afterTwoConsecutiveLosses)),
    observation("observation_green_to_red", "Green-to-red trades that ended red", "Trades that moved green, then red, and ended red.", "analyzer greenToRedStatus = green_to_red_ended_red", trades.filter((trade) => trade.analyzer.greenToRedStatus === "green_to_red_ended_red")),
    observation("observation_later_attempts", "Third-and-later ticker attempts", "Completed attempts numbered three or higher for the same ticker and day.", "tickerAttemptNumber >= 3", trades.filter((trade) => trade.tickerAttemptNumber >= 3)),
    observation("observation_opening", "Opening-window trades", "Trades entered before 10:12 Eastern.", "entryTimeEastern < 10:12", trades.filter((trade) => trade.entryTimeEastern < "10:12")),
    observation("observation_planned_risk", "Planned-risk deviations", "Trades with a recorded planned-risk deviation.", "ruleDeviationRefs includes rule_planned_risk", trades.filter((trade) => trade.ruleDeviationRefs.includes("rule_planned_risk"))),
    observation("observation_recovery_week", "Recovery-week trades", "Trades from August 24 through August 28.", "marketDate from 2026-08-24 through 2026-08-28", trades.filter((trade) => trade.marketDate >= "2026-08-24" && trade.marketDate <= "2026-08-28")),
  ];
  const overlaps = definitions.flatMap((left, leftIndex) => definitions.slice(leftIndex + 1)
    .map((right) => Object.freeze({
      firstObservationRef: left.value.evidenceRef,
      secondObservationRef: right.value.evidenceRef,
      sharedTradeCount: left.members.filter((ref) => right.members.includes(ref)).length,
    })).filter((overlap) => overlap.sharedTradeCount > 0));
  return Object.freeze({
    values: Object.freeze(definitions.map((definition) => definition.value)),
    overlaps: Object.freeze(overlaps),
  });
}

function ruleSummaries(trades: readonly FixtureTrade[]) {
  return Object.freeze(RULES.map((rule) => Object.freeze({
    evidenceRef: `rule_summary_${rule.ruleRef}`,
    ruleRef: rule.ruleRef,
    followedCount: trades.filter((trade) => trade.ruleResults.some((result) => result.ruleRef === rule.ruleRef && result.status === "followed")).length,
    brokenCount: trades.filter((trade) => trade.ruleResults.some((result) => result.ruleRef === rule.ruleRef && result.status === "broken")).length,
    notReviewedCount: 0,
    notApplicableCount: trades.filter((trade) => trade.ruleResults.some((result) => result.ruleRef === rule.ruleRef && result.status === "not_applicable")).length,
  })));
}

function monthSnapshot(metrics: ReturnType<typeof summarize>): readonly CoachWeeklyAiReviewEvidenceMetric[] {
  return Object.freeze([
    metric("net_pnl", metrics.netPnlDecimal, `USD ${metrics.netPnlDecimal}`),
    metric("closed_trade_count", String(metrics.tradeCount), `${metrics.tradeCount} trades`),
    metric("win_rate_percent", metrics.winRatePercent, `${metrics.winRatePercent}%`),
    metric("profit_factor", metrics.profitFactor, metrics.profitFactor),
    metric("green_day_count", String(dayRows(FIXTURE_TRADES).filter((day) => new Decimal(day.netPnlDecimal).gt(0)).length), "green days"),
  ]);
}

function comparisonObservations(trades: readonly FixtureTrade[]): readonly CoachMonthlyAiReviewComparisonObservation[] {
  const current = observations(trades).values;
  const currentByRef = new Map(current.map((value) => [value.evidenceRef, value]));
  const prior = Object.freeze({
    observation_after_two_losses: Object.freeze([metric("trade_count", "62", "62 trades"), metric("net_pnl", "-640.00", "USD -640.00"), metric("win_rate_percent", "24.19", "24.19%")]),
    observation_green_to_red: Object.freeze([metric("trade_count", "24", "24 trades"), metric("net_pnl", "-755.00", "USD -755.00"), metric("win_rate_percent", "0.00", "0.00%")]),
    observation_later_attempts: Object.freeze([metric("trade_count", "138", "138 trades"), metric("net_pnl", "-110.00", "USD -110.00"), metric("win_rate_percent", "45.65", "45.65%")]),
  });
  return Object.freeze([
    ["comparison_after_two_losses", "After-two-losses segment", "Exact comparison of the post-consecutive-loss cohort.", "observation_after_two_losses"],
    ["comparison_green_to_red", "Green-to-red losses", "Exact comparison of completed green-to-red losses.", "observation_green_to_red"],
    ["comparison_later_attempts", "Later ticker attempts", "Exact comparison of third-and-later ticker attempts.", "observation_later_attempts"],
  ].map(([evidenceRef, label, description, sourceRef]) => Object.freeze({
    evidenceRef,
    label,
    description,
    currentPeriodMeasurements: currentByRef.get(sourceRef)!.measurements,
    priorPeriodMeasurements: prior[sourceRef as keyof typeof prior],
  })));
}

const FIXTURE_TRADES = buildTrades();

function buildMonthlyPacket(): CoachMonthlyAiReviewEvidencePacket {
  const result = summarize(FIXTURE_TRADES);
  const observationSet = observations(FIXTURE_TRADES);
  const weeks = Object.freeze([
    ["2026-08-03", "2026-08-07"], ["2026-08-10", "2026-08-14"], ["2026-08-17", "2026-08-21"], ["2026-08-24", "2026-08-28"], ["2026-08-31", "2026-08-31"],
  ].map(([weekStartDate, weekEndDate], index) => {
    const weekTrades = FIXTURE_TRADES.filter((trade) => trade.marketDate >= weekStartDate! && trade.marketDate <= weekEndDate!);
    const weekResult = summarize(weekTrades);
    return Object.freeze({
      evidenceRef: `month_week_${index + 1}`,
      weekStartDate: weekStartDate!,
      weekEndDate: weekEndDate!,
      tradeCount: weekResult.tradeCount,
      winnerCount: weekResult.winnerCount,
      loserCount: weekResult.loserCount,
      flatCount: weekResult.flatCount,
      netPnlDecimal: weekResult.netPnlDecimal,
    });
  }));
  return Object.freeze({
    packetVersion: COACH_MONTHLY_AI_REVIEW_EVIDENCE_PACKET_VERSION,
    period: Object.freeze({ calendarMonthStartDate: MONTH_START, calendarMonthEndDate: MONTH_END, timezone: "America/New_York", currency: CURRENCY }),
    monthSnapshot: Object.freeze({ evidenceRef: "month_snapshot", metrics: monthSnapshot(result) }),
    priorMonthSnapshot: Object.freeze({
      evidenceRef: "prior_month_snapshot",
      calendarMonthStartDate: "2026-07-01",
      calendarMonthEndDate: "2026-07-31",
      metrics: Object.freeze([
        metric("net_pnl", "920.00", "USD 920.00"), metric("closed_trade_count", "402", "402 trades"),
        metric("win_rate_percent", "54.23", "54.23%"), metric("profit_factor", "1.28", "1.28"), metric("green_day_count", "14", "14 green days"),
      ]),
    }),
    calendarWeeks: weeks,
    ruleDefinitions: RULES,
    ruleSummaries: ruleSummaries(FIXTURE_TRADES),
    days: dayRows(FIXTURE_TRADES),
    trades: FIXTURE_TRADES.map((trade) => Object.freeze({
      evidenceRef: trade.evidenceRef, marketDate: trade.marketDate, daySequence: trade.daySequence,
      entryTimeEastern: trade.entryTimeEastern, exitTimeEastern: trade.exitTimeEastern, ticker: trade.ticker,
      direction: trade.direction, netPnlDecimal: trade.netPnlDecimal, holdingMinutes: trade.holdingMinutes,
      tickerAttemptNumber: trade.tickerAttemptNumber, afterTwoConsecutiveLosses: trade.afterTwoConsecutiveLosses,
      tags: trade.tags, ruleDeviationRefs: trade.ruleDeviationRefs, note: trade.note,
    })),
    analyzerRows: Object.freeze(FIXTURE_TRADES.map((trade) => trade.analyzer)),
    calculatedObservations: observationSet.values,
    comparisonObservations: comparisonObservations(FIXTURE_TRADES),
    observationOverlaps: observationSet.overlaps,
    dailyReflections: Object.freeze(MONTH_DAYS.map(([date, kind]) => reflection(kind, date))),
    currentFocuses: Object.freeze([
      Object.freeze({ evidenceRef: "current_focus_1", effectiveFromDate: "2026-08-03", text: "Compare the post-loss sequence with the rest of the trading day." }),
      Object.freeze({ evidenceRef: "current_focus_2", effectiveFromDate: "2026-08-17", text: "Separate later ticker attempts from the trades taken after losses." }),
    ]),
    coverage: Object.freeze({ evidenceRef: "coverage", completeTradeCount: FIXTURE_TRADES.length, analyzerReadyTradeCount: FIXTURE_TRADES.length, tradeNoteCount: FIXTURE_TRADES.length, completedReflectionCount: MONTH_DAYS.length, limitationText: null }),
  });
}

function buildWeeklyPacket(
  packet: CoachMonthlyAiReviewEvidencePacket,
  weekIndex: number,
  prior: CoachWeeklyAiReviewEvidencePacket["priorIssuedReview"],
): CoachWeeklyAiReviewEvidencePacket {
  const week = packet.calendarWeeks[weekIndex]!;
  const selectedTrades = FIXTURE_TRADES.filter((trade) => trade.marketDate >= week.weekStartDate && trade.marketDate <= week.weekEndDate);
  const result = summarize(selectedTrades);
  const selectedDates = new Set(selectedTrades.map((trade) => trade.marketDate));
  const observationSet = observations(selectedTrades);
  const previous = weekIndex > 0 ? packet.calendarWeeks[weekIndex - 1]! : null;
  return Object.freeze({
    packetVersion: COACH_WEEKLY_AI_REVIEW_EVIDENCE_PACKET_VERSION,
    period: Object.freeze({ startDate: week.weekStartDate, endDate: week.weekEndDate, timezone: "America/New_York", currency: CURRENCY }),
    weekSnapshot: Object.freeze({ evidenceRef: "week_snapshot", metrics: Object.freeze([
      metric("net_pnl", result.netPnlDecimal, `USD ${result.netPnlDecimal}`), metric("closed_trade_count", String(result.tradeCount), `${result.tradeCount} trades`), metric("win_rate_percent", result.winRatePercent, `${result.winRatePercent}%`), metric("profit_factor", result.profitFactor, result.profitFactor),
    ]) }),
    previousWeekSnapshot: previous && previous.netPnlDecimal !== null ? Object.freeze({ evidenceRef: "previous_week_snapshot", periodStartDate: previous.weekStartDate, periodEndDate: previous.weekEndDate, metrics: Object.freeze([
      metric("net_pnl", previous.netPnlDecimal, `USD ${previous.netPnlDecimal}`), metric("closed_trade_count", String(previous.tradeCount), `${previous.tradeCount} trades`),
    ]) }) : null,
    ruleDefinitions: RULES,
    ruleSummaries: ruleSummaries(selectedTrades),
    days: packet.days.filter((day) => selectedDates.has(day.marketDate)),
    trades: selectedTrades.map((trade) => Object.freeze({
      evidenceRef: trade.evidenceRef, marketDate: trade.marketDate, daySequence: trade.daySequence, entryTimeEastern: trade.entryTimeEastern, exitTimeEastern: trade.exitTimeEastern, ticker: trade.ticker, direction: trade.direction, netPnlDecimal: trade.netPnlDecimal, holdingMinutes: trade.holdingMinutes, tickerAttemptNumber: trade.tickerAttemptNumber, afterTwoConsecutiveLosses: trade.afterTwoConsecutiveLosses, tags: trade.tags, ruleDeviationRefs: trade.ruleDeviationRefs, note: trade.note,
    })),
    analyzerRows: selectedTrades.map((trade) => trade.analyzer),
    calculatedObservations: observationSet.values,
    observationOverlaps: observationSet.overlaps,
    dailyReflections: packet.dailyReflections.filter((item) => selectedDates.has(item.marketDate)),
    currentFocuses: packet.currentFocuses,
    priorIssuedReview: prior,
    coverage: Object.freeze({ evidenceRef: "coverage", completeTradeCount: selectedTrades.length, analyzerReadyTradeCount: selectedTrades.length, tradeNoteCount: selectedTrades.length, completedReflectionCount: selectedDates.size, limitationText: null }),
  });
}

function normalizedDecimal(value: string): string | null {
  const match = value.replaceAll(",", "").trim().match(/^(-?)(\d+)(?:\.(\d+))?$/u);
  if (!match) return null;
  const integer = (match[2] ?? "0").replace(/^0+(?=\d)/u, "");
  const fraction = (match[3] ?? "").replace(/0+$/u, "");
  return `${match[1] === "-" && (integer !== "0" || fraction !== "") ? "-" : ""}${integer}${fraction ? `.${fraction}` : ""}`;
}

function numericAudit(packet: CoachMonthlyAiReviewEvidencePacket, output: string) {
  const money = new Set<string>();
  const percentages = new Set<string>();
  const visit = (value: unknown, key = ""): void => {
    if (typeof value === "string") {
      const normalized = normalizedDecimal(value);
      if (normalized !== null && /(?:pnl|profit|loss|move|reversal|peak)/iu.test(key)) money.add(normalized);
      if (normalized !== null && /percent/iu.test(key)) percentages.add(normalized);
      const displayMoney = value.match(/(?:USD\s+)(-?\d+(?:\.\d+)?)/u)?.[1];
      if (displayMoney) money.add(normalizedDecimal(displayMoney)!);
      const displayPercent = value.match(/(-?\d+(?:\.\d+)?)%/u)?.[1];
      if (displayPercent) percentages.add(normalizedDecimal(displayPercent)!);
      return;
    }
    if (Array.isArray(value)) return value.forEach((item) => visit(item, key));
    if (value && typeof value === "object") Object.entries(value).forEach(([childKey, child]) => visit(child, childKey));
  };
  visit(packet);
  const unsupportedMoney = [...output.matchAll(/([+-]?)[\$€£]\s*(\d[\d,]*(?:\.\d+)?)/gu)]
    .map((match) => {
      const before = output.slice(Math.max(0, (match.index ?? 0) - 40), match.index);
      const after = output.slice((match.index ?? 0) + match[0].length, (match.index ?? 0) + match[0].length + 24);
      const impliedLoss = /\b(?:lost|down|loss(?:es)?(?:\s+(?:of|totaling))?)\s*$/iu.test(before) || /^\s+(?:(?:net|daily|weekly|monthly)\s+)?loss(?:es)?\b/iu.test(after) || /^\s+losing\b/iu.test(after);
      return normalizedDecimal(`${match[1] === "-" || impliedLoss ? "-" : ""}${match[2]}`)!;
    }).filter((value) => !money.has(value));
  const unsupportedPercentages = [...output.matchAll(/\b(-?\d+(?:\.\d+)?)%/gu)]
    .map((match) => normalizedDecimal(match[1]!)!).filter((value) => !percentages.has(value));
  return Object.freeze({ unsupportedMoney: Object.freeze([...new Set(unsupportedMoney)]), unsupportedPercentages: Object.freeze([...new Set(unsupportedPercentages)]) });
}

type CompleteUsage = Readonly<{
  inputTokens: number | null;
  cachedInputTokens: number | null;
  cacheWriteInputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}>;

function completeUsage(usage: Readonly<{
  inputTokens: number | null;
  cachedInputTokens?: number | null;
  cacheWriteInputTokens?: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}>): CompleteUsage {
  return Object.freeze({
    inputTokens: usage.inputTokens,
    cachedInputTokens: usage.cachedInputTokens ?? null,
    cacheWriteInputTokens: usage.cacheWriteInputTokens ?? null,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
  });
}

function estimatedCostCents(usage: CompleteUsage): string | null {
  if (usage.inputTokens === null || usage.cachedInputTokens === null || usage.cacheWriteInputTokens === null || usage.outputTokens === null) return null;
  const ordinary = usage.inputTokens - usage.cachedInputTokens - usage.cacheWriteInputTokens;
  return new Decimal(ordinary).mul(5).plus(new Decimal(usage.cachedInputTokens).mul("0.5"))
    .plus(new Decimal(usage.cacheWriteInputTokens).mul("6.25")).plus(new Decimal(usage.outputTokens).mul(30))
    .div(10_000).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

type WeeklyGeneration = Awaited<ReturnType<typeof generateCoachWeeklyAiReviewFromEvidencePacket>>;
type MonthlyGeneration = Awaited<ReturnType<typeof generateCoachMonthlyAiReviewFromEvidencePacket>>;

type SequentialCheckpoint = Readonly<{
  packetBytes: number;
  modelId: string;
  weeklyResults: readonly (WeeklyGeneration | null)[];
  monthly: MonthlyGeneration | null;
}>;

function emptyCheckpoint(packetBytes: number): SequentialCheckpoint {
  return Object.freeze({
    packetBytes,
    modelId: COACH_MONTHLY_AI_REVIEW_EVIDENCE_AUTHORING_MODEL,
    weeklyResults: Object.freeze([null, null, null, null]),
    monthly: null,
  });
}

function sequentialCheckpointPath(): string {
  return join(process.cwd(), ".local-logs", SEQUENTIAL_CHECKPOINT_FILENAME);
}

function loadSequentialCheckpoint(packetBytes: number): SequentialCheckpoint {
  const path = sequentialCheckpointPath();
  if (!existsSync(path)) return emptyCheckpoint(packetBytes);
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!parsed || typeof parsed !== "object") return emptyCheckpoint(packetBytes);
  const candidate = parsed as Partial<SequentialCheckpoint>;
  if (candidate.packetBytes !== packetBytes ||
      candidate.modelId !== COACH_MONTHLY_AI_REVIEW_EVIDENCE_AUTHORING_MODEL ||
      !Array.isArray(candidate.weeklyResults) || candidate.weeklyResults.length !== 4) {
    return emptyCheckpoint(packetBytes);
  }
  return Object.freeze({
    packetBytes,
    modelId: COACH_MONTHLY_AI_REVIEW_EVIDENCE_AUTHORING_MODEL,
    weeklyResults: Object.freeze([...candidate.weeklyResults] as (WeeklyGeneration | null)[]),
    monthly: candidate.monthly ?? null,
  });
}

function saveSequentialCheckpoint(checkpoint: SequentialCheckpoint): void {
  mkdirSync(join(process.cwd(), ".local-logs"), { recursive: true });
  writeFileSync(sequentialCheckpointPath(), `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
}

function totalUsage(
  weeklyResults: readonly (WeeklyGeneration | null)[],
  monthly: MonthlyGeneration | null,
): CompleteUsage {
  return [...weeklyResults.filter((result): result is WeeklyGeneration => result !== null)
    .map((result) => completeUsage(result.usage)), ...(monthly ? [completeUsage(monthly.usage)] : [])]
    .reduce<CompleteUsage>((total, usage) => Object.freeze({
      inputTokens: total.inputTokens === null || usage.inputTokens === null ? null : total.inputTokens + usage.inputTokens,
      cachedInputTokens: total.cachedInputTokens === null || usage.cachedInputTokens === null ? null : total.cachedInputTokens + usage.cachedInputTokens,
      cacheWriteInputTokens: total.cacheWriteInputTokens === null || usage.cacheWriteInputTokens === null ? null : total.cacheWriteInputTokens + usage.cacheWriteInputTokens,
      outputTokens: total.outputTokens === null || usage.outputTokens === null ? null : total.outputTokens + usage.outputTokens,
      totalTokens: total.totalTokens === null || usage.totalTokens === null ? null : total.totalTokens + usage.totalTokens,
    }), Object.freeze({ inputTokens: 0, cachedInputTokens: 0, cacheWriteInputTokens: 0, outputTokens: 0, totalTokens: 0 }));
}

async function main(): Promise<void> {
  const confirmation = process.argv[2];
  const validConfirmations = [PREFLIGHT_CONFIRMATION, LIVE_CONFIRMATION,
    MONTHLY_STAGE_CONFIRMATION, ...WEEKLY_STAGE_CONFIRMATIONS];
  if (process.argv.length !== 3 || !validConfirmations.includes(confirmation as typeof validConfirmations[number])) {
    throw new Error("monthly_evidence_authoring_confirmation_required");
  }
  const liveProvider = confirmation !== PREFLIGHT_CONFIRMATION;
  const monthlyPacket = buildMonthlyPacket();
  const packetBytes = Buffer.byteLength(serializeCoachMonthlyAiReviewEvidencePacket(monthlyPacket), "utf8");
  const partitionInspection = inspectCoachMonthlyAiReviewEvidencePartitions(monthlyPacket);
  const fixtureValid = monthlyPacket.trades.length === 420 && monthlyPacket.days.length === 21 &&
    monthlyPacket.calendarWeeks.length === 5 && monthlyPacket.analyzerRows.length === 420 &&
    monthlyPacket.coverage.tradeNoteCount === 420 && packetBytes > COACH_MONTHLY_AI_REVIEW_DIRECT_PACKET_MAX_BYTES;
  if (!fixtureValid) throw new Error("monthly_evidence_authoring_fixture_invalid");
  if (!liveProvider) {
    process.stdout.write(`${JSON.stringify({ fixtureValid, liveProvider, packetBytes, directPacketMaximumBytes: COACH_MONTHLY_AI_REVIEW_DIRECT_PACKET_MAX_BYTES, partitionInspection, tradeCount: monthlyPacket.trades.length, dayCount: monthlyPacket.days.length, calendarWeeks: monthlyPacket.calendarWeeks, monthlyNetPnl: monthlyPacket.monthSnapshot.metrics.find((item) => item.name === "net_pnl")?.exactValue, calculatedObservationCount: monthlyPacket.calculatedObservations.length, comparisonObservationCount: monthlyPacket.comparisonObservations.length, coverage: monthlyPacket.coverage }, null, 2)}\n`);
    return;
  }
  loadEnvConfig(process.cwd(), true);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("monthly_evidence_authoring_openai_key_missing");
  let checkpoint = loadSequentialCheckpoint(packetBytes);
  const requestedWeeklyIndex = WEEKLY_STAGE_CONFIRMATIONS.indexOf(
    confirmation as typeof WEEKLY_STAGE_CONFIRMATIONS[number]);
  const requestedIndexes = confirmation === LIVE_CONFIRMATION
    ? [0, 1, 2, 3]
    : requestedWeeklyIndex >= 0 ? [requestedWeeklyIndex] : [];
  for (const weekIndex of requestedIndexes) {
    if (checkpoint.weeklyResults[weekIndex] !== null) continue;
    const priorWeekly = weekIndex > 0 ? checkpoint.weeklyResults[weekIndex - 1] : null;
    if (weekIndex > 0 && priorWeekly === null) {
      throw new Error("monthly_evidence_authoring_prior_week_not_issued");
    }
    const prior: CoachWeeklyAiReviewEvidencePacket["priorIssuedReview"] = priorWeekly === null ? null : Object.freeze({
      evidenceRef: `issued_weekly_review_${weekIndex}`,
      periodStartDate: monthlyPacket.calendarWeeks[weekIndex - 1]!.weekStartDate,
      periodEndDate: monthlyPacket.calendarWeeks[weekIndex - 1]!.weekEndDate,
      reviewText: `${priorWeekly.output.weeklyRecap}\n${priorWeekly.output.weekNarrative}`,
    });
    const weeklyPacket = buildWeeklyPacket(monthlyPacket, weekIndex, prior);
    const weekly = await generateCoachWeeklyAiReviewFromEvidencePacket(weeklyPacket, {
      apiKey,
      modelId: COACH_WEEKLY_AI_REVIEW_EVIDENCE_AUTHORING_MODEL,
    });
    checkpoint = Object.freeze({
      ...checkpoint,
      weeklyResults: Object.freeze(checkpoint.weeklyResults.map((result, index) =>
        index === weekIndex ? weekly : result)),
    });
    saveSequentialCheckpoint(checkpoint);
  }
  if (confirmation === LIVE_CONFIRMATION || confirmation === MONTHLY_STAGE_CONFIRMATION) {
    if (checkpoint.weeklyResults.some((result) => result === null)) {
      throw new Error("monthly_evidence_authoring_all_four_weeklies_required");
    }
    if (checkpoint.monthly === null) {
      const monthly = await generateCoachMonthlyAiReviewFromEvidencePacket(monthlyPacket, {
        apiKey,
        modelId: COACH_MONTHLY_AI_REVIEW_EVIDENCE_AUTHORING_MODEL,
      });
      checkpoint = Object.freeze({ ...checkpoint, monthly });
      saveSequentialCheckpoint(checkpoint);
    }
  }
  const allUsage = totalUsage(checkpoint.weeklyResults, checkpoint.monthly);
  const monthly = checkpoint.monthly;
  const audit = monthly === null ? null : numericAudit(monthlyPacket, [
    monthly.output.monthlyRecap,
    monthly.output.monthNarrative,
    ...monthly.output.additionalInsights.flatMap((item) => [item.title, item.body]),
  ].join("\n"));
  if (audit !== null && (audit.unsupportedMoney.length > 0 || audit.unsupportedPercentages.length > 0)) {
    throw new Error(`monthly_evidence_authoring_numeric_audit_invalid:${JSON.stringify(audit)}`);
  }
  if (monthly === null) {
    process.stdout.write(`${JSON.stringify({ completedWeeklyReviews: checkpoint.weeklyResults.filter((result) => result !== null).length, totalUsage: allUsage, totalEstimatedCostCents: estimatedCostCents(allUsage) }, null, 2)}\n`);
    return;
  }
  const completedAtUtc = new Date().toISOString();
  const artifactName = `monthly-evidence-authoring-sol-high-${completedAtUtc.replaceAll(":", "-")}.json`;
  mkdirSync(join(process.cwd(), ".local-logs"), { recursive: true });
  const artifact = Object.freeze({ completedAtUtc, modelId: COACH_MONTHLY_AI_REVIEW_EVIDENCE_AUTHORING_MODEL, providerCallCount: 4 + monthly.partitionCount + 1, packetBytes, weeklyResults: checkpoint.weeklyResults, monthly, totalUsage: allUsage, totalEstimatedCostCents: estimatedCostCents(allUsage), audit });
  writeFileSync(join(process.cwd(), ".local-logs", artifactName), `${JSON.stringify(artifact, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  process.stdout.write(`${JSON.stringify({ artifactName, modelId: artifact.modelId, providerCallCount: artifact.providerCallCount, packetBytes, weeklyReviewCount: checkpoint.weeklyResults.filter((result) => result !== null).length, monthlyAuthoringMode: monthly.authoringMode, monthlyPartitionCount: monthly.partitionCount, totalUsage: allUsage, totalEstimatedCostCents: artifact.totalEstimatedCostCents, audit, monthlyOutput: monthly.output }, null, 2)}\n`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "monthly_evidence_authoring_failed";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
