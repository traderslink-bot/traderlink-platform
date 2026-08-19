import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import { loadEnvConfig } from "@next/env";
import Decimal from "decimal.js";

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
  buildCoachWeeklyAiReviewEvidenceAuthoringEnvelope,
  COACH_WEEKLY_AI_REVIEW_EVIDENCE_AUTHORING_MODEL,
  COACH_WEEKLY_AI_REVIEW_EVIDENCE_AUTHORING_REASONING,
  generateCoachWeeklyAiReviewFromEvidencePacket,
} from "@/src/modules/coach/server/coach-weekly-ai-review-evidence-authoring";

const PREFLIGHT_CONFIRMATION = "--check-100-trade-weekly-evidence-packet";
const LIVE_SOL_CONFIRMATION = "--confirm-100-trade-weekly-sol-high";
const LIVE_TERRA_CONFIRMATION = "--confirm-100-trade-weekly-terra-high";
const TERRA_MODEL_ID = "gpt-5.6-terra" as const;
const PERIOD_START_DATE = "2026-08-10";
const PERIOD_END_DATE = "2026-08-14";
const CURRENCY = "USD";

const DATES = Object.freeze([
  "2026-08-10",
  "2026-08-11",
  "2026-08-12",
  "2026-08-13",
  "2026-08-14",
]);

const SYMBOLS = Object.freeze(["NVDA", "AMD", "TSLA", "META", "AAPL", "PLTR"]);

type FixtureAnalyzer = Readonly<{
  availability: "ready" | "unavailable";
  entry: Readonly<{
    favorableMoveDecimal: string | null;
    adverseMoveDecimal: string | null;
  }>;
  path: Readonly<{
    greenToRedStatus: "never_green" | "green_no_red" |
      "green_to_red_ended_red" | "green_to_red_recovered" |
      "green_to_red_ended_flat" | "unavailable";
    measuredPeakPnlDecimal: string | null;
    peakToFinalReversalDecimal: string | null;
    addedAfterPeakCount: number;
    partialExitBeforeRedCount: number;
  }>;
  finalExit: Readonly<{
    favorableMoveAfter15MinutesDecimal: string | null;
  }>;
}>;

type FixtureTrade = CoachWeeklyAiReviewEvidenceTrade & Readonly<{
  netPnlDecimal: string;
  holdingMinutes: number;
  afterTwoConsecutiveLosses: boolean;
  outcome: "winner" | "loser" | "flat";
  ruleResults: readonly CoachWeeklyAiReviewEvidenceRuleResult[];
  analyzer: FixtureAnalyzer;
}>;

type FixtureObservation = Readonly<{
  value: CoachWeeklyAiReviewCalculatedObservation;
  affectedTradeRefs: readonly string[];
}>;

const RULES = Object.freeze([
  Object.freeze({
    ruleRef: "rule_pause_after_two_consecutive_losses",
    title: "Pause after two consecutive losses",
    ruleText: "Do not place another trade after two consecutive losing trades during the same day.",
  }),
  Object.freeze({
    ruleRef: "rule_maximum_two_ticker_attempts",
    title: "Maximum two attempts per ticker",
    ruleText: "Limit each ticker to two completed attempts during the trading day.",
  }),
  Object.freeze({
    ruleRef: "rule_planned_risk_response",
    title: "Exit at planned risk",
    ruleText: "Review whether the completed trade stayed within the trader's recorded maximum risk.",
  }),
  Object.freeze({
    ruleRef: "rule_position_size_within_plan",
    title: "Position size within plan",
    ruleText: "Keep total position size within the trader's recorded size plan.",
  }),
]);

const PNL_BY_DATE: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "2026-08-10": Object.freeze([
    "50", "-35", "50", "-35", "50", "-35", "50", "-35", "50", "-35",
    "50", "-35", "50", "-35", "50", "-35", "45", "45",
  ]),
  "2026-08-11": Object.freeze([
    "55", "-40", "55", "-40", "55", "-40", "55", "-40", "55", "-40",
    "55", "-40", "55", "-40", "40", "40", "40", "35",
  ]),
  "2026-08-12": Object.freeze([
    "-35", "45", "-35", "45", "-35", "45", "-35", "45", "-35", "45",
    "-35", "45", "-35", "45", "-35", "45", "-70", "-84", "42", "-30",
    "38", "-32", "-28", "-40", "-35", "-29", "-36", "-36",
  ]),
  "2026-08-13": Object.freeze([
    "45", "-45", "45", "-45", "45", "-45", "45", "-45", "45", "-45",
    "45", "-45", "45", "-45", "45", "-45", "45", "45",
  ]),
  "2026-08-14": Object.freeze([
    "44.25", "-45", "44.25", "-45", "44.25", "-45", "44.25", "-45",
    "44.25", "-45", "44.25", "-45", "44.25", "-45", "44.25", "-45", "45", "45",
  ]),
});

const REFLECTIONS = Object.freeze([
  Object.freeze({
    whatWorked: "My opening-window trades were selective and I avoided adding after the measured peak.",
    whatNeedsWork: "My third attempts on the same ticker were less deliberate than the first two.",
    technicalRecap: "The strongest entries had favorable movement that was materially larger than adverse movement.",
    nextSessionFocus: "Review whether later ticker attempts add anything beyond the first two attempts.",
  }),
  Object.freeze({
    whatWorked: "I kept size stable and most exits stayed close to the recorded risk response.",
    whatNeedsWork: "Two later trades gave back more of their favorable movement than I intended.",
    technicalRecap: "Relative volume was highest in the opening window and declined later in the session.",
    nextSessionFocus: "Pay attention to the result of later-session repeat attempts.",
  }),
  Object.freeze({
    whatWorked: "My first eight trades were controlled despite the day eventually finishing red.",
    whatNeedsWork: "After two consecutive losses, I continued trading and finished with my highest trade count of the week.",
    technicalRecap: "Several later losses first moved green and then crossed below breakeven.",
    nextSessionFocus: "Compare trading frequency before and after consecutive losses.",
  }),
  Object.freeze({
    whatWorked: "I returned to fewer attempts per ticker and kept every position within the saved size plan.",
    whatNeedsWork: "One green trade still finished red after I gave back its measured peak.",
    technicalRecap: "Entry adverse movement was lower in the opening window than in later trades.",
    nextSessionFocus: "Keep reviewing the relationship between entry timing and adverse movement.",
  }),
  Object.freeze({
    whatWorked: "The day stayed controlled and I did not continue after a consecutive-loss sequence.",
    whatNeedsWork: "Repeat attempts remained weaker than first attempts even though the day finished green.",
    technicalRecap: "The final exits left limited favorable movement during the following fifteen minutes.",
    nextSessionFocus: "Compare first attempts with repeat attempts without judging them only by the day's result.",
  }),
]);

function metric(name: string, exactValue: string, displayValue: string): CoachWeeklyAiReviewEvidenceMetric {
  return Object.freeze({ name, exactValue, displayValue });
}

function percent(numerator: number | Decimal, denominator: number | Decimal): string {
  const bottom = new Decimal(denominator);
  return bottom.isZero() ? "0" : new Decimal(numerator).div(bottom).mul(100)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

function easternTime(dayTradeIndex: number): string {
  if (dayTradeIndex < 8) {
    const totalMinutes = 9 * 60 + 32 + dayTradeIndex * 5;
    return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
  }
  const totalMinutes = 10 * 60 + 20 + (dayTradeIndex - 8) * 7;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

function plusMinutes(time: string, minutes: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour! * 60 + minute! + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function buildTrades(): readonly FixtureTrade[] {
  const values: FixtureTrade[] = [];
  let globalIndex = 0;
  for (const [dayIndex, marketDate] of DATES.entries()) {
    const pnlValues = PNL_BY_DATE[marketDate];
    if (!pnlValues) throw new Error("weekly_evidence_fixture_day_missing");
    const attempts = new Map<string, number>();
    let consecutiveLosses = 0;
    let lossBoundaryReached = false;
    for (const [dayTradeIndex, pnlValue] of pnlValues.entries()) {
      const pnl = new Decimal(pnlValue);
      const ticker = SYMBOLS[(dayTradeIndex + dayIndex) % SYMBOLS.length]!;
      const attemptNumber = (attempts.get(ticker) ?? 0) + 1;
      attempts.set(ticker, attemptNumber);
      const afterTwoConsecutiveLosses = lossBoundaryReached;
      const selectedGreenToRedLoss = pnl.lt(0) && (
        afterTwoConsecutiveLosses || dayTradeIndex === 1
      );
      const recoveredGreenToRed = pnl.gt(0) && globalIndex % 13 === 0;
      const greenToRedStatus = selectedGreenToRedLoss
        ? "green_to_red_ended_red" as const
        : recoveredGreenToRed
          ? "green_to_red_recovered" as const
          : "green_no_red" as const;
      const entryTime = easternTime(dayTradeIndex);
      const holdingMinutes = 3 + globalIndex % 19;
      const earlyEntry = dayTradeIndex < 8;
      const favorableMove = new Decimal(earlyEntry ? 72 : 44).plus(globalIndex % 6);
      const adverseMove = new Decimal(earlyEntry ? -18 : -29).minus(globalIndex % 4);
      const peak = new Decimal(selectedGreenToRedLoss ? 96 : pnl.gt(0) ? 88 : 54);
      const reversal = peak.minus(pnl);
      const ruleResults: readonly CoachWeeklyAiReviewEvidenceRuleResult[] = Object.freeze([
        Object.freeze({
          ruleRef: "rule_pause_after_two_consecutive_losses",
          status: afterTwoConsecutiveLosses ? "broken" as const : "not_applicable" as const,
        }),
        Object.freeze({
          ruleRef: "rule_maximum_two_ticker_attempts",
          status: attemptNumber > 2 ? "broken" as const : "not_applicable" as const,
        }),
        Object.freeze({
          ruleRef: "rule_planned_risk_response",
          status: selectedGreenToRedLoss ? "broken" as const : "followed" as const,
        }),
        Object.freeze({
          ruleRef: "rule_position_size_within_plan",
          status: globalIndex === 36 || globalIndex === 71
            ? "broken" as const
            : "followed" as const,
        }),
      ]);
      const tags = Object.freeze([
        ...(earlyEntry ? ["Opening window"] : ["Later session"]),
        ...(new Decimal(earlyEntry ? "2.6" : "1.4").gte(2) ? ["High relative volume"] : []),
        ...(attemptNumber > 1 ? ["Repeat attempt"] : ["First attempt"]),
        ...(afterTwoConsecutiveLosses ? ["After two consecutive losses"] : []),
        ...(selectedGreenToRedLoss ? ["Green-to-red"] : []),
      ]);
      values.push(Object.freeze({
        evidenceRef: `trade_${String(globalIndex + 1).padStart(3, "0")}`,
        marketDate,
        daySequence: dayTradeIndex + 1,
        entryTimeEastern: entryTime,
        exitTimeEastern: plusMinutes(entryTime, holdingMinutes),
        ticker,
        direction: globalIndex % 4 === 0 ? "short" : "long",
        netPnlDecimal: pnl.toFixed(2),
        outcome: pnl.gt(0) ? "winner" : pnl.lt(0) ? "loser" : "flat",
        holdingMinutes,
        tickerAttemptNumber: attemptNumber,
        afterTwoConsecutiveLosses,
        tags,
        ruleDeviationRefs: Object.freeze(ruleResults.filter((result) =>
          result.status === "broken" || result.status === "not_reviewed")
          .map((result) => result.ruleRef)),
        ruleResults,
        analyzer: Object.freeze({
          availability: "ready",
          entry: Object.freeze({
            favorableMoveDecimal: favorableMove.toFixed(2),
            adverseMoveDecimal: adverseMove.toFixed(2),
          }),
          path: Object.freeze({
            greenToRedStatus,
            measuredPeakPnlDecimal: peak.toFixed(2),
            peakToFinalReversalDecimal: reversal.toFixed(2),
            addedAfterPeakCount: globalIndex % 17 === 0 ? 1 : 0,
            partialExitBeforeRedCount: globalIndex % 9 === 0 ? 1 : 0,
          }),
          finalExit: Object.freeze({
            favorableMoveAfter15MinutesDecimal: new Decimal(globalIndex % 5 * 4.25).toFixed(2),
          }),
        }),
        note: afterTwoConsecutiveLosses
          ? "This trade was taken after the day's two consecutive losses."
          : selectedGreenToRedLoss
            ? "The trade moved green before crossing below breakeven and closing red."
            : attemptNumber > 2
              ? "This was another attempt on a ticker I had already traded twice today."
              : earlyEntry
                ? "The entry occurred during my planned opening window."
                : "I reviewed the later entry and final exit without assigning a motive to the result.",
      }));
      consecutiveLosses = pnl.lt(0) ? consecutiveLosses + 1 : 0;
      if (consecutiveLosses >= 2) lossBoundaryReached = true;
      globalIndex += 1;
    }
  }
  return Object.freeze(values);
}

function tradeMetrics(
  affected: readonly FixtureTrade[],
  all: readonly FixtureTrade[],
): readonly CoachWeeklyAiReviewEvidenceMetric[] {
  const net = affected.reduce((sum, trade) => sum.plus(trade.netPnlDecimal), new Decimal(0));
  const winners = affected.filter((trade) => trade.outcome === "winner");
  const losers = affected.filter((trade) => trade.outcome === "loser");
  const allProfit = all.filter((trade) => trade.outcome === "winner")
    .reduce((sum, trade) => sum.plus(trade.netPnlDecimal), new Decimal(0));
  const allLoss = all.filter((trade) => trade.outcome === "loser")
    .reduce((sum, trade) => sum.plus(new Decimal(trade.netPnlDecimal).abs()), new Decimal(0));
  const affectedProfit = winners.reduce((sum, trade) => sum.plus(trade.netPnlDecimal), new Decimal(0));
  const affectedLoss = losers.reduce((sum, trade) =>
    sum.plus(new Decimal(trade.netPnlDecimal).abs()), new Decimal(0));
  return Object.freeze([
    metric("affected_trade_count", String(affected.length), `${affected.length} trades`),
    metric("opportunity_trade_count", String(all.length), `${all.length} trades`),
    metric("winner_count", String(winners.length), `${winners.length} winners`),
    metric("loser_count", String(losers.length), `${losers.length} losers`),
    metric("win_rate_percent", percent(winners.length, affected.length),
      `${percent(winners.length, affected.length)}%`),
    metric("net_pnl", net.toFixed(2), `${CURRENCY} ${net.toFixed(2)}`),
    metric("share_of_winning_pnl_percent", percent(affectedProfit, allProfit),
      `${percent(affectedProfit, allProfit)}% of winning-trade P/L`),
    metric("share_of_losing_pnl_percent", percent(affectedLoss, allLoss),
      `${percent(affectedLoss, allLoss)}% of losing-trade P/L`),
  ]);
}

function observation(
  evidenceRef: string,
  label: string,
  description: string,
  trades: readonly FixtureTrade[],
  all: readonly FixtureTrade[],
): FixtureObservation {
  return Object.freeze({
    value: Object.freeze({
      evidenceRef,
      label,
      description,
      populationDefinition: "All 100 money-complete closed trades in the reviewed week.",
      affectedTradeCount: trades.length,
      representativeTradeRefs: Object.freeze([...trades].sort((left, right) =>
        new Decimal(right.netPnlDecimal).abs().comparedTo(new Decimal(left.netPnlDecimal).abs()))
        .slice(0, 8).map((trade) => trade.evidenceRef)),
      measurements: tradeMetrics(trades, all),
    }),
    affectedTradeRefs: Object.freeze(trades.map((trade) => trade.evidenceRef)),
  });
}

function buildPacket(): CoachWeeklyAiReviewEvidencePacket {
  const trades = buildTrades();
  const byDate = new Map(DATES.map((date) => [date, trades.filter((trade) =>
    trade.marketDate === date)] as const));
  const days = Object.freeze(DATES.map((marketDate) => {
    const dayTrades = byDate.get(marketDate) ?? [];
    const net = dayTrades.reduce((sum, trade) => sum.plus(trade.netPnlDecimal), new Decimal(0));
    return Object.freeze({
      evidenceRef: `day_${marketDate}`,
      marketDate,
      tradeCount: dayTrades.length,
      winnerCount: dayTrades.filter((trade) => trade.outcome === "winner").length,
      loserCount: dayTrades.filter((trade) => trade.outcome === "loser").length,
      flatCount: dayTrades.filter((trade) => trade.outcome === "flat").length,
      netPnlDecimal: net.toFixed(2),
    });
  }));
  const net = trades.reduce((sum, trade) => sum.plus(trade.netPnlDecimal), new Decimal(0));
  const winners = trades.filter((trade) => trade.outcome === "winner");
  const losers = trades.filter((trade) => trade.outcome === "loser");
  const grossProfit = winners.reduce((sum, trade) => sum.plus(trade.netPnlDecimal), new Decimal(0));
  const grossLoss = losers.reduce((sum, trade) =>
    sum.plus(new Decimal(trade.netPnlDecimal).abs()), new Decimal(0));
  const greenDays = days.filter((day) => new Decimal(day.netPnlDecimal).gt(0)).length;
  const redDays = days.filter((day) => new Decimal(day.netPnlDecimal).lt(0)).length;
  const minute = (trade: FixtureTrade) => {
    const [hour, value] = trade.entryTimeEastern.split(":").map(Number);
    return hour! * 60 + value!;
  };
  const baseObservations = [
    observation("observation_after_two_losses", "Trades after two consecutive losses",
      "Trades placed after the day had already recorded two consecutive losing trades.",
      trades.filter((trade) => trade.afterTwoConsecutiveLosses), trades),
    observation("observation_green_to_red_ended_red", "Green-to-red trades that ended red",
      "Trades whose measured path first moved green, crossed below breakeven and closed red.",
      trades.filter((trade) => trade.analyzer.path.greenToRedStatus ===
        "green_to_red_ended_red"), trades),
    observation("observation_opening_0930_1015", "Entries from 9:30 to 10:15 AM",
      "Trades entered from 9:30 AM through 10:15 AM Eastern.",
      trades.filter((trade) => minute(trade) >= 570 && minute(trade) <= 615), trades),
    observation("observation_after_1100", "Entries at or after 11:00 AM",
      "Trades entered at or after 11:00 AM Eastern.",
      trades.filter((trade) => minute(trade) >= 660), trades),
    observation("observation_first_ticker_attempt", "First ticker attempts",
      "The first completed attempt on each ticker during each trading day.",
      trades.filter((trade) => trade.tickerAttemptNumber === 1), trades),
    observation("observation_third_plus_ticker_attempt", "Third and later ticker attempts",
      "Completed ticker attempts after the first two attempts on the same day.",
      trades.filter((trade) => trade.tickerAttemptNumber > 2), trades),
    observation("observation_efficient_entry", "Entries with favorable movement at least twice adverse movement",
      "Analyzer-ready entries where measured favorable movement was at least twice measured adverse movement.",
      trades.filter((trade) => new Decimal(trade.analyzer.entry.favorableMoveDecimal ?? 0)
        .gte(new Decimal(trade.analyzer.entry.adverseMoveDecimal ?? 0).abs().mul(2))), trades),
    observation("observation_planned_risk_broken", "Recorded planned-risk rule breaks",
      "Trades marked broken for the saved Exit at planned risk rule.",
      trades.filter((trade) => trade.ruleResults.some((result) =>
        result.ruleRef === "rule_planned_risk_response" && result.status === "broken")), trades),
    observation("observation_position_size_broken", "Recorded position-size rule breaks",
      "Trades marked broken for the saved Position size within plan rule.",
      trades.filter((trade) => trade.ruleResults.some((result) =>
        result.ruleRef === "rule_position_size_within_plan" && result.status === "broken")), trades),
    observation("observation_wednesday", "Wednesday's trades",
      "All trades closed on Wednesday, the highest-activity day of the week.",
      trades.filter((trade) => trade.marketDate === "2026-08-12"), trades),
    observation("observation_five_largest_losses", "Five largest losing trades",
      "The five largest net losing trades in the week.",
      [...losers].sort((left, right) => new Decimal(left.netPnlDecimal)
        .comparedTo(right.netPnlDecimal)).slice(0, 5), trades),
  ];
  const observationSets = new Map(baseObservations.map((item) =>
    [item.value.evidenceRef, new Set(item.affectedTradeRefs)] as const));
  const observationOverlaps = Object.freeze(baseObservations.flatMap((item, index) => {
    const own = observationSets.get(item.value.evidenceRef)!;
    return baseObservations.slice(index + 1).flatMap((other) => {
      const shared = other.affectedTradeRefs.filter((reference) => own.has(reference)).length;
      const smaller = Math.min(item.affectedTradeRefs.length, other.affectedTradeRefs.length);
      return shared > 0 && smaller > 0 && shared / smaller >= 0.4
        ? [Object.freeze({
          firstObservationRef: item.value.evidenceRef,
          secondObservationRef: other.value.evidenceRef,
          sharedTradeCount: shared,
        })]
        : [];
    });
  }));
  const calculatedObservations = Object.freeze(baseObservations.map((item) => item.value));
  const coreTrades = Object.freeze(trades.map((trade): CoachWeeklyAiReviewEvidenceTrade =>
    Object.freeze({
      evidenceRef: trade.evidenceRef,
      marketDate: trade.marketDate,
      daySequence: trade.daySequence,
      entryTimeEastern: trade.entryTimeEastern,
      exitTimeEastern: trade.exitTimeEastern,
      ticker: trade.ticker,
      direction: trade.direction,
      netPnlDecimal: trade.netPnlDecimal,
      holdingMinutes: trade.holdingMinutes,
      tickerAttemptNumber: trade.tickerAttemptNumber,
      afterTwoConsecutiveLosses: trade.afterTwoConsecutiveLosses,
      tags: trade.tags,
      ruleDeviationRefs: trade.ruleDeviationRefs,
      note: trade.note,
    })));
  const analyzerRows = Object.freeze(
    trades.filter((trade) => trade.analyzer.availability === "ready")
      .map((trade): CoachWeeklyAiReviewAnalyzerEvidenceRow => Object.freeze({
      tradeEvidenceRef: trade.evidenceRef,
      favorableMoveDecimal: trade.analyzer.entry.favorableMoveDecimal,
      adverseMoveDecimal: trade.analyzer.entry.adverseMoveDecimal,
      greenToRedStatus: trade.analyzer.path.greenToRedStatus === "unavailable"
        ? "never_green"
        : trade.analyzer.path.greenToRedStatus,
      measuredPeakPnlDecimal: trade.analyzer.path.measuredPeakPnlDecimal,
      peakToFinalReversalDecimal: trade.analyzer.path.peakToFinalReversalDecimal,
      addedAfterPeakCount: trade.analyzer.path.addedAfterPeakCount,
      partialExitBeforeRedCount: trade.analyzer.path.partialExitBeforeRedCount,
      favorableMoveAfter15MinutesDecimal:
        trade.analyzer.finalExit.favorableMoveAfter15MinutesDecimal,
      })),
  );
  const ruleSummaries = Object.freeze(RULES.map((rule) => {
    const statuses = trades.map((trade) => trade.ruleResults.find((result) =>
      result.ruleRef === rule.ruleRef)?.status ?? "not_applicable");
    return Object.freeze({
      evidenceRef: `rule_summary_${rule.ruleRef}`,
      ruleRef: rule.ruleRef,
      followedCount: statuses.filter((status) => status === "followed").length,
      brokenCount: statuses.filter((status) => status === "broken").length,
      notReviewedCount: statuses.filter((status) => status === "not_reviewed").length,
      notApplicableCount: statuses.filter((status) => status === "not_applicable").length,
    });
  }));
  return Object.freeze({
    packetVersion: COACH_WEEKLY_AI_REVIEW_EVIDENCE_PACKET_VERSION,
    period: Object.freeze({
      startDate: PERIOD_START_DATE,
      endDate: PERIOD_END_DATE,
      timezone: "America/New_York",
      currency: CURRENCY,
    }),
    weekSnapshot: Object.freeze({
      evidenceRef: "week_snapshot",
      metrics: Object.freeze([
        metric("net_pnl", net.toFixed(2), `${CURRENCY} ${net.toFixed(2)}`),
        metric("closed_trade_count", String(trades.length), `${trades.length} trades`),
        metric("winner_count", String(winners.length), `${winners.length} winners`),
        metric("loser_count", String(losers.length), `${losers.length} losers`),
        metric("win_rate_percent", percent(winners.length, trades.length),
          `${percent(winners.length, trades.length)}%`),
        metric("gross_winning_pnl", grossProfit.toFixed(2), `${CURRENCY} ${grossProfit.toFixed(2)}`),
        metric("gross_losing_pnl", grossLoss.negated().toFixed(2), `${CURRENCY} -${grossLoss.toFixed(2)}`),
        metric("profit_factor", grossProfit.div(grossLoss).toDecimalPlaces(4).toFixed(4),
          grossProfit.div(grossLoss).toDecimalPlaces(2).toFixed(2)),
        metric("green_day_count", String(greenDays), `${greenDays} green days`),
        metric("red_day_count", String(redDays), `${redDays} red day`),
      ]),
    }),
    previousWeekSnapshot: Object.freeze({
      evidenceRef: "previous_week_snapshot",
      periodStartDate: "2026-08-03",
      periodEndDate: "2026-08-07",
      metrics: Object.freeze([
        metric("net_pnl", "116.00", "USD 116.00"),
        metric("closed_trade_count", "92", "92 trades"),
        metric("win_rate_percent", "50.00", "50.00%"),
        metric("profit_factor", "1.05", "1.05"),
        metric("green_to_red_ended_red_count", "18", "18 trades"),
        metric("trades_after_two_consecutive_losses_count", "14", "14 trades"),
        metric("trades_after_two_consecutive_losses_net_pnl", "-340.00", "USD -340.00"),
      ]),
    }),
    ruleDefinitions: RULES,
    ruleSummaries,
    days,
    trades: coreTrades,
    analyzerRows,
    calculatedObservations,
    observationOverlaps,
    dailyReflections: Object.freeze(DATES.map((marketDate, index) => Object.freeze({
      evidenceRef: `reflection_${marketDate}`,
      marketDate,
      state: "completed" as const,
      ...REFLECTIONS[index]!,
      tradeNotes: Object.freeze([]),
    }))),
    currentFocuses: Object.freeze([
      Object.freeze({
        evidenceRef: "current_focus_1",
        effectiveFromDate: PERIOD_START_DATE,
        text: "Compare the result and execution of first ticker attempts with later attempts.",
      }),
    ]),
    priorIssuedReview: Object.freeze({
      evidenceRef: "prior_review",
      periodStartDate: "2026-08-03",
      periodEndDate: "2026-08-07",
      reviewText: "Last week's review asked whether later ticker attempts and trading after consecutive losses continued to reduce otherwise positive results.",
    }),
    coverage: Object.freeze({
      evidenceRef: "coverage",
      completeTradeCount: trades.length,
      analyzerReadyTradeCount: trades.filter((trade) => trade.analyzer.availability === "ready").length,
      tradeNoteCount: trades.filter((trade) => trade.note !== null).length,
      completedReflectionCount: DATES.length,
      limitationText: null,
    }),
  });
}

function normalizedDecimal(value: string): string | null {
  const match = value.replaceAll(",", "").trim().match(/^(-?)(\d+)(?:\.(\d+))?$/u);
  if (!match) return null;
  const integer = (match[2] ?? "0").replace(/^0+(?=\d)/u, "");
  const fraction = (match[3] ?? "").replace(/0+$/u, "");
  const sign = match[1] === "-" && (integer !== "0" || fraction !== "") ? "-" : "";
  return `${sign}${integer}${fraction ? `.${fraction}` : ""}`;
}

function numericAudit(packet: CoachWeeklyAiReviewEvidencePacket, outputText: string): Readonly<{
  unsupportedMoney: readonly string[];
  unsupportedPercentages: readonly string[];
}> {
  const money = new Set<string>();
  const percentages = new Set<string>();
  const visit = (value: unknown, key = ""): void => {
    if (typeof value === "string") {
      const normalized = normalizedDecimal(value);
      if (normalized !== null && /(?:pnl|profit|loss|move|reversal|peak)/iu.test(key)) {
        money.add(normalized);
      }
      if (normalized !== null && /percent/iu.test(key)) percentages.add(normalized);
      const displayMoney = value.match(/(?:USD\s+)(-?\d+(?:\.\d+)?)/u)?.[1];
      if (displayMoney) money.add(normalizedDecimal(displayMoney)!);
      const displayPercent = value.match(/(-?\d+(?:\.\d+)?)%/u)?.[1];
      if (displayPercent) percentages.add(normalizedDecimal(displayPercent)!);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item, key);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [childKey, child] of Object.entries(value)) visit(child, childKey);
  };
  visit(packet);
  const unsupportedMoney = [...outputText.matchAll(/([+-]?)[$€£]\s*(\d[\d,]*(?:\.\d+)?)/gu)]
    .map((match) => {
      const precedingText = outputText.slice(Math.max(0, (match.index ?? 0) - 40), match.index);
      const followingText = outputText.slice((match.index ?? 0) + match[0].length,
        (match.index ?? 0) + match[0].length + 24);
      const negativeFromLanguage = /\b(?:lost|down|loss(?:es)?(?:\s+(?:of|totaling))?)\s*$/iu
        .test(precedingText) || /^\s+(?:net\s+)?loss(?:es)?\b/iu.test(followingText);
      return normalizedDecimal(`${match[1] === "-" || negativeFromLanguage ? "-" : ""}${match[2]}`)!;
    })
    .filter((value) => !money.has(value));
  const unsupportedPercentages = [...outputText.matchAll(/\b(-?\d+(?:\.\d+)?)%/gu)]
    .map((match) => normalizedDecimal(match[1]!)!)
    .filter((value) => !percentages.has(value));
  return Object.freeze({
    unsupportedMoney: Object.freeze([...new Set(unsupportedMoney)]),
    unsupportedPercentages: Object.freeze([...new Set(unsupportedPercentages)]),
  });
}

function estimatedCostUsd(modelId: string, usage: Readonly<{
  inputTokens: number | null;
  cachedInputTokens?: number | null;
  cacheWriteInputTokens?: number | null;
  outputTokens: number | null;
}>): string | null {
  if (usage.inputTokens === null || usage.cachedInputTokens === null ||
      usage.cachedInputTokens === undefined || usage.cacheWriteInputTokens === null ||
      usage.cacheWriteInputTokens === undefined || usage.outputTokens === null) return null;
  const prices = modelId === TERRA_MODEL_ID
    ? Object.freeze({ input: "2", cachedInput: "0.2", cacheWriteInput: "2.5", output: "12" })
    : Object.freeze({ input: "5", cachedInput: "0.5", cacheWriteInput: "6.25", output: "30" });
  const ordinary = usage.inputTokens - usage.cachedInputTokens - usage.cacheWriteInputTokens;
  return new Decimal(ordinary).mul(prices.input)
    .plus(new Decimal(usage.cachedInputTokens).mul(prices.cachedInput))
    .plus(new Decimal(usage.cacheWriteInputTokens).mul(prices.cacheWriteInput))
    .plus(new Decimal(usage.outputTokens).mul(prices.output))
    .div(1_000_000).toFixed(8);
}

async function main(): Promise<void> {
  if (process.argv.length !== 3 ||
      (process.argv[2] !== PREFLIGHT_CONFIRMATION &&
        process.argv[2] !== LIVE_SOL_CONFIRMATION &&
        process.argv[2] !== LIVE_TERRA_CONFIRMATION)) {
    throw new Error("weekly_evidence_authoring_confirmation_required");
  }
  const liveProvider = process.argv[2] !== PREFLIGHT_CONFIRMATION;
  const modelId = process.argv[2] === LIVE_TERRA_CONFIRMATION
    ? TERRA_MODEL_ID
    : COACH_WEEKLY_AI_REVIEW_EVIDENCE_AUTHORING_MODEL;
  const packet = buildPacket();
  const envelope = buildCoachWeeklyAiReviewEvidenceAuthoringEnvelope(packet);
  const expectedDayNets = ["210.00", "260.00", "-260.00", "90.00", "84.00"];
  const fixtureValid = packet.trades.length === 100 && packet.days.length === 5 &&
    packet.days.every((day, index) => day.netPnlDecimal === expectedDayNets[index]) &&
    packet.weekSnapshot.metrics.find((item) => item.name === "net_pnl")?.exactValue === "384.00" &&
    packet.coverage.analyzerReadyTradeCount === 100 && packet.coverage.tradeNoteCount === 100 &&
    packet.analyzerRows.length === 100 && packet.ruleSummaries.length === RULES.length &&
    packet.coverage.completedReflectionCount === 5 &&
    packet.trades.filter((trade) => trade.afterTwoConsecutiveLosses).length === 10 &&
    packet.calculatedObservations.length >= 10;
  if (!fixtureValid) throw new Error("weekly_evidence_authoring_fixture_invalid");
  if (!liveProvider) {
    const lossLanguageAudit = numericAudit(packet,
      "The 12 trades lost $431.00, while the later sequence lost $186.00.");
    if (lossLanguageAudit.unsupportedMoney.length > 0) {
      throw new Error("weekly_evidence_authoring_loss_language_audit_invalid");
    }
    const capturedArtifactName =
      process.env.TRADERLINK_WEEKLY_OUTPUT_AUDIT_ARTIFACT?.trim() ?? "";
    let capturedOutputAudit: ReturnType<typeof numericAudit> | null = null;
    if (capturedArtifactName) {
      if (basename(capturedArtifactName) !== capturedArtifactName) {
        throw new Error("weekly_evidence_authoring_audit_artifact_name_invalid");
      }
      const captured = JSON.parse(readFileSync(join(process.cwd(), ".local-logs",
        capturedArtifactName), "utf8")) as Readonly<{
          output?: Readonly<{
            weeklyRecap?: unknown;
            weekNarrative?: unknown;
            additionalInsights?: readonly Readonly<{ title?: unknown; body?: unknown }>[];
          }>;
        }>;
      const visibleFields = [
        captured.output?.weeklyRecap,
        captured.output?.weekNarrative,
        ...(captured.output?.additionalInsights ?? []).flatMap((insight) =>
          [insight.title, insight.body]),
      ];
      if (!visibleFields.every((value) => typeof value === "string")) {
        throw new Error("weekly_evidence_authoring_audit_artifact_output_invalid");
      }
      capturedOutputAudit = numericAudit(packet, visibleFields.join("\n"));
      if (capturedOutputAudit.unsupportedMoney.length > 0 ||
          capturedOutputAudit.unsupportedPercentages.length > 0) {
        throw new Error("weekly_evidence_authoring_captured_numeric_audit_invalid");
      }
    }
    process.stdout.write(`${JSON.stringify({
      fixtureValid,
      liveProvider,
      packetBytes: Buffer.byteLength(envelope.prompt, "utf8"),
      tradeCount: packet.trades.length,
      dayNets: packet.days.map((day) => day.netPnlDecimal),
      afterTwoLossesTradeCount: packet.trades.filter((trade) =>
        trade.afterTwoConsecutiveLosses).length,
      invalidTimes: packet.trades.filter((trade) =>
        !/^(?:0\d|1\d|2[0-3]):[0-5]\d$/u.test(trade.entryTimeEastern) ||
        !/^(?:0\d|1\d|2[0-3]):[0-5]\d$/u.test(trade.exitTimeEastern))
        .map((trade) => trade.evidenceRef),
      calculatedObservationCount: packet.calculatedObservations.length,
      lossLanguageAudit,
      capturedOutputAudit,
      observationSummaries: packet.calculatedObservations.map((observationValue) => ({
        evidenceRef: observationValue.evidenceRef,
        affectedTradeCount: observationValue.affectedTradeCount,
        netPnl: observationValue.measurements.find((item) => item.name === "net_pnl")?.exactValue,
        winRate: observationValue.measurements.find((item) =>
          item.name === "win_rate_percent")?.exactValue,
        overlaps: packet.observationOverlaps.filter((overlap) =>
          overlap.firstObservationRef === observationValue.evidenceRef ||
          overlap.secondObservationRef === observationValue.evidenceRef),
      })),
      coverage: packet.coverage,
    }, null, 2)}\n`);
    return;
  }
  loadEnvConfig(process.cwd(), true);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("weekly_evidence_authoring_openai_key_missing");
  const generation = await generateCoachWeeklyAiReviewFromEvidencePacket(packet, {
    apiKey,
    modelId,
  });
  const outputText = [
    generation.output.weeklyRecap,
    generation.output.weekNarrative,
    ...generation.output.additionalInsights.flatMap((insight) => [insight.title, insight.body]),
  ].join("\n");
  const numbers = numericAudit(packet, outputText);
  const prohibitedInference = /\b(?:revenge|fear|greed|trying to recover|attempting to recover|would have (?:made|earned|saved))\b/iu.test(outputText);
  const recordkeepingFeedback = /\b(?:missing|incomplete|lack of)\b.{0,80}\b(?:notes?|tags?|reflections?|reviews?)\b/iu.test(outputText);
  const valid = fixtureValid && numbers.unsupportedMoney.length === 0 &&
    numbers.unsupportedPercentages.length === 0 && !prohibitedInference &&
    !recordkeepingFeedback && generation.output.incompleteRecord === null &&
    generation.usage.inputTokens !== null && generation.usage.outputTokens !== null;
  const artifact = Object.freeze({
    fixtureOnly: true,
    liveProvider: true,
    liveDatabaseMutated: false,
    modelId,
    reasoningEffort: COACH_WEEKLY_AI_REVIEW_EVIDENCE_AUTHORING_REASONING,
    providerCallCount: 1,
    packetBytes: Buffer.byteLength(envelope.prompt, "utf8"),
    tradeCount: packet.trades.length,
    dayCount: packet.days.length,
    calculatedObservationCount: packet.calculatedObservations.length,
    coverage: packet.coverage,
    usage: generation.usage,
    estimatedCostUsd: estimatedCostUsd(modelId, generation.usage),
    audit: Object.freeze({
      fixtureValid,
      unsupportedMoney: numbers.unsupportedMoney,
      unsupportedPercentages: numbers.unsupportedPercentages,
      prohibitedInference,
      recordkeepingFeedback,
    }),
    output: generation.output,
    packet,
    valid,
  });
  mkdirSync(join(process.cwd(), ".local-logs"), { recursive: true });
  const artifactName = `weekly-evidence-authoring-${modelId.replace("gpt-5.6-", "")}-high-${new Date()
    .toISOString().replaceAll(":", "-")}.json`;
  writeFileSync(join(process.cwd(), ".local-logs", artifactName),
    `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({
    artifactName,
    modelId: artifact.modelId,
    reasoningEffort: artifact.reasoningEffort,
    providerCallCount: artifact.providerCallCount,
    packetBytes: artifact.packetBytes,
    tradeCount: artifact.tradeCount,
    calculatedObservationCount: artifact.calculatedObservationCount,
    usage: artifact.usage,
    estimatedCostUsd: artifact.estimatedCostUsd,
    audit: artifact.audit,
    output: artifact.output,
    valid,
  }, null, 2)}\n`);
  if (!valid) process.exitCode = 1;
}

void main();
