import { compareUnicodeCodePoints } from "../../../domain/canonical";
import {
  negateExactDecimal,
  validateExactDecimal,
} from "../../../domain/exact";
import type { QueryRowSemantics } from "../execution/row-semantics";
import type { QueryMetricCounts } from "./query-metrics";
import {
  compareCanonicalDecimals,
  sumExactDecimals,
} from "../../tools/weekday";

export interface QueryDailyAccumulator {
  readonly sessionDate: string;
  readonly tradeCount: string;
  readonly netPnl: string;
  readonly peakRealizedPnl: string;
  readonly realizedDrawdown: string;
  readonly peakProfitGiveback: string;
  readonly maximumRecoveryFromRealizedTrough: string;
  readonly crossedGreenToRed: boolean;
  readonly crossedRedToGreen: boolean;
}

export interface TradeQueryAccumulator {
  readonly rows: readonly QueryRowSemantics[];
  readonly counts: QueryMetricCounts;
  readonly currency: string;
  readonly wins: readonly QueryRowSemantics[];
  readonly losses: readonly QueryRowSemantics[];
  readonly flats: readonly QueryRowSemantics[];
  readonly longCount: string;
  readonly shortCount: string;
  readonly repeatAttemptCount: string;
  readonly totalExecutionCount: string;
  readonly limitedAnalyticalTradeCount: string;
  readonly missingChargeCoverageTradeCount: string;
  readonly missingShareQuantityAuthorityCount: string;
  readonly missingEntryNotionalAuthorityCount: string;
  readonly unavailableSourceAuthorityTradeCount: string;
  readonly manualEntryTradeCount: string;
  readonly brokerImportTradeCount: string;
  readonly legacyMigrationTradeCount: string;
  readonly netValues: readonly string[];
  readonly grossValues: readonly string[];
  readonly grossProfitValues: readonly string[];
  readonly grossLossValues: readonly string[];
  readonly chargeValues: readonly string[];
  readonly commissionChargeValues: readonly string[];
  readonly shareQuantityValues: readonly string[];
  readonly entryNotionalValues: readonly string[];
  readonly winnerShareQuantityValues: readonly string[];
  readonly loserShareQuantityValues: readonly string[];
  readonly winnerEntryNotionalValues: readonly string[];
  readonly loserEntryNotionalValues: readonly string[];
  readonly holdingSecondsValues: readonly string[];
  readonly winnerHoldingSecondsValues: readonly string[];
  readonly loserHoldingSecondsValues: readonly string[];
  readonly totalHoldingNanoseconds: bigint;
  readonly winnerHoldingNanoseconds: bigint;
  readonly loserHoldingNanoseconds: bigint;
  readonly tradesPerSymbol: readonly string[];
  readonly daily: readonly QueryDailyAccumulator[];
  readonly winningStreakLengths: readonly string[];
  readonly losingStreakLengths: readonly string[];
  readonly currentWinningStreakLength: string;
  readonly currentLosingStreakLength: string;
  readonly rowCount: string;
  readonly netPnl: string;
  readonly grossPnl: string;
  readonly grossProfit: string;
  readonly grossLoss: string;
  readonly signedCharges: string;
  readonly commissionSignedCharges: string;
  readonly winningNetPnl: string;
  readonly losingNetPnl: string;
  readonly uniqueAccountCount: string;
  readonly uniqueSymbolCount: string;
  readonly dailyPnlValues: readonly string[];
  readonly profitableDailyPnlValues: readonly string[];
  readonly losingDailyPnlValues: readonly string[];
  readonly profitableDayCount: string;
  readonly losingDayCount: string;
  readonly flatDayCount: string;
  readonly sortedNetValues: readonly string[];
  readonly sortedGrossValues: readonly string[];
  readonly sortedCommissionChargeValues: readonly string[];
  readonly sortedWinningNetValues: readonly string[];
  readonly sortedLosingNetValues: readonly string[];
  readonly sortedDailyPnlValues: readonly string[];
  readonly sortedProfitableDailyPnlValues: readonly string[];
  readonly sortedLosingDailyPnlValues: readonly string[];
  readonly sortedDailyTradeCounts: readonly string[];
  readonly sortedWinningStreakLengths: readonly string[];
  readonly sortedLosingStreakLengths: readonly string[];
  readonly sortedTradesPerSymbol: readonly string[];
  readonly sortedShareQuantityValues: readonly string[];
  readonly sortedEntryNotionalValues: readonly string[];
  readonly sortedWinnerEntryNotionalValues: readonly string[];
  readonly sortedLoserEntryNotionalValues: readonly string[];
  readonly sortedHoldingSecondsValues: readonly string[];
  readonly sortedWinnerHoldingSecondsValues: readonly string[];
  readonly sortedLoserHoldingSecondsValues: readonly string[];
  readonly maximumNetPnl: string | null;
  readonly minimumNetPnl: string | null;
  readonly maximumDailyPnl: string | null;
  readonly minimumDailyPnl: string | null;
  readonly maximumTradesPerDay: string | null;
  readonly minimumTradesPerDay: string | null;
  readonly maximumShareQuantity: string | null;
  readonly maximumEntryNotional: string | null;
  readonly maximumIntradayDrawdown: string | null;
  readonly maximumPeakProfitGiveback: string | null;
  readonly minimumHoldingSeconds: string | null;
  readonly maximumHoldingSeconds: string | null;
  readonly largestWinnerNetPnl: string | null;
  readonly largestLoserNetPnl: string | null;
  readonly totalShareQuantity: string;
  readonly totalEntryNotional: string;
  readonly winnerEntryNotional: string;
  readonly loserEntryNotional: string;
  readonly dailyPeakProfitGivebackValues: readonly string[];
  readonly dailyRealizedRecoveryValues: readonly string[];
  readonly dailyRealizedDrawdownMagnitudeValues: readonly string[];
  readonly sortedDailyPeakProfitGivebackValues: readonly string[];
  readonly sortedDailyRealizedRecoveryValues: readonly string[];
  readonly sortedDailyRealizedDrawdownMagnitudeValues: readonly string[];
  readonly dayWithPeakProfitGivebackCount: string;
  readonly dayWithRealizedDrawdownCount: string;
  readonly greenToRedDayCount: string;
  readonly redToGreenDayCount: string;
}

function sum(values: readonly string[]): string {
  const result = sumExactDecimals(values);
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return result.value;
}

function negate(value: string): string {
  const parsed = validateExactDecimal(value);
  if (!parsed.ok) throw new Error(parsed.error.code);
  const result = negateExactDecimal(parsed.value);
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

function buildStreaks(
  rows: readonly QueryRowSemantics[],
): Readonly<{ winning: readonly string[]; losing: readonly string[] }> {
  const winning: string[] = [];
  const losing: string[] = [];
  let active: "gain" | "loss" | null = null;
  let length = 0;
  const flush = () => {
    if (active === "gain") winning.push(String(length));
    if (active === "loss") losing.push(String(length));
  };
  for (const row of rows) {
    const next = row.outcome === "gain" || row.outcome === "loss" ? row.outcome : null;
    if (next === null) {
      flush();
      active = null;
      length = 0;
    } else if (next === active) {
      length += 1;
    } else {
      flush();
      active = next;
      length = 1;
    }
  }
  flush();
  return Object.freeze({
    winning: Object.freeze(winning),
    losing: Object.freeze(losing),
  });
}

function currentStreak(
  rows: readonly QueryRowSemantics[],
): Readonly<{ winning: string; losing: string }> {
  const latest = rows.at(-1);
  if (latest === undefined || (latest.outcome !== "gain" && latest.outcome !== "loss")) {
    return Object.freeze({ winning: "0", losing: "0" });
  }
  let length = 0;
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (rows[index].outcome !== latest.outcome) break;
    length += 1;
  }
  return latest.outcome === "gain"
    ? Object.freeze({ winning: String(length), losing: "0" })
    : Object.freeze({ winning: "0", losing: String(length) });
}

function buildDaily(rows: readonly QueryRowSemantics[]): readonly QueryDailyAccumulator[] {
  const byDate = new Map<string, QueryRowSemantics[]>();
  for (const row of rows) {
    const current = byDate.get(row.row.sessionDate);
    if (current === undefined) byDate.set(row.row.sessionDate, [row]);
    else current.push(row);
  }
  return Object.freeze([...byDate.entries()]
    .sort((left, right) => compareUnicodeCodePoints(left[0], right[0]))
    .map(([sessionDate, dateRows]) => {
      const ordered = [...dateRows].sort((left, right) =>
        left.row.finalExitAt < right.row.finalExitAt ? -1 :
          left.row.finalExitAt > right.row.finalExitAt ? 1 :
            compareUnicodeCodePoints(
              left.row.semanticRoundTripKey,
              right.row.semanticRoundTripKey,
            ));
      let realized = "0";
      let peak = "0";
      let trough = "0";
      let maximumDrawdown = "0";
      let maximumRecovery = "0";
      let crossedGreenToRed = false;
      let crossedRedToGreen = false;
      for (const row of ordered) {
        const before = realized;
        realized = sum([realized, row.row.netPnl]);
        if (compareCanonicalDecimals(before, "0") > 0 && compareCanonicalDecimals(realized, "0") < 0) {
          crossedGreenToRed = true;
        }
        if (compareCanonicalDecimals(before, "0") < 0 && compareCanonicalDecimals(realized, "0") > 0) {
          crossedRedToGreen = true;
        }
        if (compareCanonicalDecimals(realized, peak) > 0) peak = realized;
        if (compareCanonicalDecimals(realized, trough) < 0) trough = realized;
        const recovery = sum([realized, negate(trough)]);
        if (compareCanonicalDecimals(recovery, maximumRecovery) > 0) maximumRecovery = recovery;
        const drawdown = sum([realized, negate(peak)]);
        if (compareCanonicalDecimals(drawdown, maximumDrawdown) < 0) {
          maximumDrawdown = drawdown;
        }
      }
      const netPnl = sum(ordered.map((row) => row.row.netPnl));
      const giveback = compareCanonicalDecimals(peak, "0") > 0
        ? sum([peak, negate(netPnl)])
        : "0";
      return Object.freeze({
        sessionDate,
        tradeCount: String(ordered.length),
        netPnl,
        peakRealizedPnl: peak,
        realizedDrawdown: maximumDrawdown,
        peakProfitGiveback: compareCanonicalDecimals(giveback, "0") > 0
          ? giveback
          : "0",
        maximumRecoveryFromRealizedTrough: maximumRecovery,
        crossedGreenToRed,
        crossedRedToGreen,
      });
    }));
}

function ordered(values: readonly string[]): readonly string[] {
  return Object.freeze([...values].sort(compareCanonicalDecimals));
}

function first(values: readonly string[]): string | null {
  return values[0] ?? null;
}

function last(values: readonly string[]): string | null {
  return values.at(-1) ?? null;
}

export function buildTradeQueryAccumulator(
  rowsInput: readonly QueryRowSemantics[],
  counts: QueryMetricCounts,
  currency: string,
): TradeQueryAccumulator {
  const rows = Object.freeze([...rowsInput]);
  const wins: QueryRowSemantics[] = [];
  const losses: QueryRowSemantics[] = [];
  const flats: QueryRowSemantics[] = [];
  const grossProfitValues: string[] = [];
  const grossLossValues: string[] = [];
  const shareQuantityValues: string[] = [];
  const entryNotionalValues: string[] = [];
  const winnerShareQuantityValues: string[] = [];
  const loserShareQuantityValues: string[] = [];
  const winnerEntryNotionalValues: string[] = [];
  const loserEntryNotionalValues: string[] = [];
  const holdingSecondsValues: string[] = [];
  const winnerHoldingSecondsValues: string[] = [];
  const loserHoldingSecondsValues: string[] = [];
  const symbolCounts = new Map<string, number>();
  const accountKeys = new Set<string>();
  let longCount = 0;
  let shortCount = 0;
  let repeatAttemptCount = 0;
  let totalExecutionCount = 0;
  let limitedAnalyticalTradeCount = 0;
  let missingChargeCoverageTradeCount = 0;
  let missingShareQuantityAuthorityCount = 0;
  let missingEntryNotionalAuthorityCount = 0;
  let unavailableSourceAuthorityTradeCount = 0;
  let manualEntryTradeCount = 0;
  let brokerImportTradeCount = 0;
  let legacyMigrationTradeCount = 0;
  let totalHoldingNanoseconds = BigInt("0");
  let winnerHoldingNanoseconds = BigInt("0");
  let loserHoldingNanoseconds = BigInt("0");

  for (const item of rows) {
    accountKeys.add(item.row.canonicalAccountKey);
    if (item.outcome === "gain") wins.push(item);
    else if (item.outcome === "loss") losses.push(item);
    else flats.push(item);
    if (compareCanonicalDecimals(item.row.grossPnl, "0") > 0) {
      grossProfitValues.push(item.row.grossPnl);
    } else if (compareCanonicalDecimals(item.row.grossPnl, "0") < 0) {
      grossLossValues.push(item.row.grossPnl);
    }
    if (item.row.direction === "long") longCount += 1;
    else shortCount += 1;
    if (item.repeatAttempt > BigInt("1")) repeatAttemptCount += 1;
    totalExecutionCount += item.row.supportingExecutionDigests.length;
    if (item.row.coverageState === "limited" || item.row.limitationCodes.length > 0) limitedAnalyticalTradeCount += 1;
    if (item.row.limitationCodes.includes("ti_v3_analytics_charge_coverage_unknown")) {
      missingChargeCoverageTradeCount += 1;
    }
    if (item.row.shareQuantity.state === "unavailable") missingShareQuantityAuthorityCount += 1;
    if (item.row.entryNotional.state === "unavailable") missingEntryNotionalAuthorityCount += 1;
    if (item.row.sourceAuthority.state === "unavailable") unavailableSourceAuthorityTradeCount += 1;
    else if (item.row.sourceAuthority.sourceKind === "owner_manual") manualEntryTradeCount += 1;
    else if (item.row.sourceAuthority.sourceKind === "broker_csv" || item.row.sourceAuthority.sourceKind === "broker_api") brokerImportTradeCount += 1;
    else if (item.row.sourceAuthority.sourceKind === "legacy_migration") legacyMigrationTradeCount += 1;
    totalHoldingNanoseconds += item.holdingNanoseconds;
    holdingSecondsValues.push(item.holdingSecondsFloor.toString());
    symbolCounts.set(
      item.row.stableInstrumentKey,
      (symbolCounts.get(item.row.stableInstrumentKey) ?? 0) + 1,
    );
    if (item.row.shareQuantity.state === "available") {
      shareQuantityValues.push(item.row.shareQuantity.quantity);
      if (item.outcome === "gain") {
        winnerShareQuantityValues.push(item.row.shareQuantity.quantity);
      } else if (item.outcome === "loss") {
        loserShareQuantityValues.push(item.row.shareQuantity.quantity);
      }
    }
    if (item.row.entryNotional.state === "available") {
      entryNotionalValues.push(item.row.entryNotional.amount);
      if (item.outcome === "gain") {
        winnerEntryNotionalValues.push(item.row.entryNotional.amount);
      } else if (item.outcome === "loss") {
        loserEntryNotionalValues.push(item.row.entryNotional.amount);
      }
    }
    if (item.outcome === "gain") {
      winnerHoldingNanoseconds += item.holdingNanoseconds;
      winnerHoldingSecondsValues.push(item.holdingSecondsFloor.toString());
    } else if (item.outcome === "loss") {
      loserHoldingNanoseconds += item.holdingNanoseconds;
      loserHoldingSecondsValues.push(item.holdingSecondsFloor.toString());
    }
  }
  // Streaks are realized-trade chronology, not entry chronology. Rows remain in
  // their canonical entry order for the other projections, so derive this one
  // completion-ordered view at the metric boundary.
  const completionOrderedRows = Object.freeze([...rows].sort((left, right) =>
    left.row.finalExitAt < right.row.finalExitAt ? -1 :
      left.row.finalExitAt > right.row.finalExitAt ? 1 :
        compareUnicodeCodePoints(
          left.row.semanticRoundTripKey,
          right.row.semanticRoundTripKey,
        )));
  const streaks = buildStreaks(completionOrderedRows);
  const current = currentStreak(completionOrderedRows);
  const netValues = Object.freeze(rows.map((item) => item.row.netPnl));
  const grossValues = Object.freeze(rows.map((item) => item.row.grossPnl));
  const chargeValues = Object.freeze(rows.map((item) => item.row.signedCharges));
  const commissionChargeValues = Object.freeze(rows.map((item) =>
    item.row.signedChargesByKind.find((charge) => charge.kind === "commission")?.amount ?? "0"));
  const daily = buildDaily(rows);
  const dailyPnlValues = Object.freeze(daily.map((day) => day.netPnl));
  const profitableDailyPnlValues = Object.freeze(daily
    .filter((day) => compareCanonicalDecimals(day.netPnl, "0") > 0)
    .map((day) => day.netPnl));
  const losingDailyPnlValues = Object.freeze(daily
    .filter((day) => compareCanonicalDecimals(day.netPnl, "0") < 0)
    .map((day) => day.netPnl));
  const dailyPeakProfitGivebackValues = Object.freeze(daily.map((day) => day.peakProfitGiveback));
  const dailyRealizedRecoveryValues = Object.freeze(daily.map((day) => day.maximumRecoveryFromRealizedTrough));
  const dailyRealizedDrawdownMagnitudeValues = Object.freeze(daily.map((day) => negate(day.realizedDrawdown)));
  const dayWithPeakProfitGivebackCount = daily.filter((day) => compareCanonicalDecimals(day.peakProfitGiveback, "0") > 0).length;
  const dayWithRealizedDrawdownCount = daily.filter((day) => compareCanonicalDecimals(day.realizedDrawdown, "0") < 0).length;
  const greenToRedDayCount = daily.filter((day) => day.crossedGreenToRed).length;
  const redToGreenDayCount = daily.filter((day) => day.crossedRedToGreen).length;
  const profitableDayCount = daily.filter((day) => compareCanonicalDecimals(day.netPnl, "0") > 0).length;
  const losingDayCount = daily.filter((day) => compareCanonicalDecimals(day.netPnl, "0") < 0).length;
  const flatDayCount = daily.length - profitableDayCount - losingDayCount;
  const tradesPerSymbol = Object.freeze([...symbolCounts.values()].map(String));
  const sortedNetValues = ordered(netValues);
  const sortedGrossValues = ordered(grossValues);
  const sortedCommissionChargeValues = ordered(commissionChargeValues);
  const sortedWinningNetValues = ordered(wins.map((item) => item.row.netPnl));
  const sortedLosingNetValues = ordered(losses.map((item) => item.row.netPnl));
  const sortedDailyPnlValues = ordered(dailyPnlValues);
  const sortedProfitableDailyPnlValues = ordered(profitableDailyPnlValues);
  const sortedLosingDailyPnlValues = ordered(losingDailyPnlValues);
  const sortedDailyPeakProfitGivebackValues = ordered(dailyPeakProfitGivebackValues);
  const sortedDailyRealizedRecoveryValues = ordered(dailyRealizedRecoveryValues);
  const sortedDailyRealizedDrawdownMagnitudeValues = ordered(dailyRealizedDrawdownMagnitudeValues);
  const sortedDailyTradeCounts = ordered(daily.map((day) => day.tradeCount));
  const sortedIntradayDrawdowns = ordered(daily.map((day) => day.realizedDrawdown));
  const sortedPeakProfitGivebacks = ordered(daily.map((day) => day.peakProfitGiveback));
  const sortedWinningStreakLengths = ordered(streaks.winning);
  const sortedLosingStreakLengths = ordered(streaks.losing);
  const sortedTradesPerSymbol = ordered(tradesPerSymbol);
  const sortedShareQuantityValues = ordered(shareQuantityValues);
  const sortedEntryNotionalValues = ordered(entryNotionalValues);
  const sortedWinnerEntryNotionalValues = ordered(winnerEntryNotionalValues);
  const sortedLoserEntryNotionalValues = ordered(loserEntryNotionalValues);
  const sortedHoldingSecondsValues = ordered(holdingSecondsValues);
  const sortedWinnerHoldingSecondsValues = ordered(winnerHoldingSecondsValues);
  const sortedLoserHoldingSecondsValues = ordered(loserHoldingSecondsValues);
  return Object.freeze({
    rows,
    counts,
    currency,
    wins: Object.freeze(wins),
    losses: Object.freeze(losses),
    flats: Object.freeze(flats),
    longCount: String(longCount),
    shortCount: String(shortCount),
    repeatAttemptCount: String(repeatAttemptCount),
    totalExecutionCount: String(totalExecutionCount),
    limitedAnalyticalTradeCount: String(limitedAnalyticalTradeCount),
    missingChargeCoverageTradeCount: String(missingChargeCoverageTradeCount),
    missingShareQuantityAuthorityCount: String(missingShareQuantityAuthorityCount),
    missingEntryNotionalAuthorityCount: String(missingEntryNotionalAuthorityCount),
    unavailableSourceAuthorityTradeCount: String(unavailableSourceAuthorityTradeCount),
    manualEntryTradeCount: String(manualEntryTradeCount),
    brokerImportTradeCount: String(brokerImportTradeCount),
    legacyMigrationTradeCount: String(legacyMigrationTradeCount),
    netValues,
    grossValues,
    grossProfitValues: Object.freeze(grossProfitValues),
    grossLossValues: Object.freeze(grossLossValues),
    chargeValues,
    commissionChargeValues,
    shareQuantityValues: Object.freeze(shareQuantityValues),
    entryNotionalValues: Object.freeze(entryNotionalValues),
    winnerShareQuantityValues: Object.freeze(winnerShareQuantityValues),
    loserShareQuantityValues: Object.freeze(loserShareQuantityValues),
    winnerEntryNotionalValues: Object.freeze(winnerEntryNotionalValues),
    loserEntryNotionalValues: Object.freeze(loserEntryNotionalValues),
    holdingSecondsValues: Object.freeze(holdingSecondsValues),
    winnerHoldingSecondsValues: Object.freeze(winnerHoldingSecondsValues),
    loserHoldingSecondsValues: Object.freeze(loserHoldingSecondsValues),
    totalHoldingNanoseconds,
    winnerHoldingNanoseconds,
    loserHoldingNanoseconds,
    tradesPerSymbol,
    daily,
    winningStreakLengths: streaks.winning,
    losingStreakLengths: streaks.losing,
    currentWinningStreakLength: current.winning,
    currentLosingStreakLength: current.losing,
    rowCount: String(rows.length),
    netPnl: sum(netValues),
    grossPnl: sum(grossValues),
    grossProfit: sum(grossProfitValues),
    grossLoss: sum(grossLossValues),
    signedCharges: sum(chargeValues),
    commissionSignedCharges: sum(commissionChargeValues),
    winningNetPnl: sum(sortedWinningNetValues),
    losingNetPnl: sum(sortedLosingNetValues),
    uniqueAccountCount: String(accountKeys.size),
    uniqueSymbolCount: String(symbolCounts.size),
    dailyPnlValues,
    profitableDailyPnlValues,
    losingDailyPnlValues,
    profitableDayCount: String(profitableDayCount),
    losingDayCount: String(losingDayCount),
    flatDayCount: String(flatDayCount),
    sortedNetValues,
    sortedGrossValues,
    sortedCommissionChargeValues,
    sortedWinningNetValues,
    sortedLosingNetValues,
    sortedDailyPnlValues,
    sortedProfitableDailyPnlValues,
    sortedLosingDailyPnlValues,
    sortedDailyTradeCounts,
    sortedWinningStreakLengths,
    sortedLosingStreakLengths,
    sortedTradesPerSymbol,
    sortedShareQuantityValues,
    sortedEntryNotionalValues,
    sortedWinnerEntryNotionalValues,
    sortedLoserEntryNotionalValues,
    sortedHoldingSecondsValues,
    sortedWinnerHoldingSecondsValues,
    sortedLoserHoldingSecondsValues,
    maximumNetPnl: last(sortedNetValues),
    minimumNetPnl: first(sortedNetValues),
    maximumDailyPnl: last(sortedDailyPnlValues),
    minimumDailyPnl: first(sortedDailyPnlValues),
    maximumTradesPerDay: last(sortedDailyTradeCounts),
    minimumTradesPerDay: first(sortedDailyTradeCounts),
    maximumShareQuantity: last(sortedShareQuantityValues),
    maximumEntryNotional: last(sortedEntryNotionalValues),
    maximumIntradayDrawdown: first(sortedIntradayDrawdowns),
    maximumPeakProfitGiveback: last(sortedPeakProfitGivebacks),
    minimumHoldingSeconds: first(sortedHoldingSecondsValues),
    maximumHoldingSeconds: last(sortedHoldingSecondsValues),
    largestWinnerNetPnl: last(sortedWinningNetValues),
    largestLoserNetPnl: first(sortedLosingNetValues),
    totalShareQuantity: sum(shareQuantityValues),
    totalEntryNotional: sum(entryNotionalValues),
    winnerEntryNotional: sum(winnerEntryNotionalValues),
    loserEntryNotional: sum(loserEntryNotionalValues),
    dailyPeakProfitGivebackValues,
    dailyRealizedRecoveryValues,
    dailyRealizedDrawdownMagnitudeValues,
    sortedDailyPeakProfitGivebackValues,
    sortedDailyRealizedRecoveryValues,
    sortedDailyRealizedDrawdownMagnitudeValues,
    dayWithPeakProfitGivebackCount: String(dayWithPeakProfitGivebackCount),
    dayWithRealizedDrawdownCount: String(dayWithRealizedDrawdownCount),
    greenToRedDayCount: String(greenToRedDayCount),
    redToGreenDayCount: String(redToGreenDayCount),
  });
}
