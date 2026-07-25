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
  readonly netValues: readonly string[];
  readonly grossValues: readonly string[];
  readonly grossProfitValues: readonly string[];
  readonly grossLossValues: readonly string[];
  readonly chargeValues: readonly string[];
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
  readonly rowCount: string;
  readonly netPnl: string;
  readonly grossPnl: string;
  readonly grossProfit: string;
  readonly grossLoss: string;
  readonly signedCharges: string;
  readonly winningNetPnl: string;
  readonly losingNetPnl: string;
  readonly uniqueAccountCount: string;
  readonly uniqueSymbolCount: string;
  readonly dailyPnlValues: readonly string[];
  readonly profitableDayCount: string;
  readonly losingDayCount: string;
  readonly flatDayCount: string;
  readonly sortedNetValues: readonly string[];
  readonly sortedWinningNetValues: readonly string[];
  readonly sortedLosingNetValues: readonly string[];
  readonly sortedDailyPnlValues: readonly string[];
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
  readonly minimumHoldingSeconds: string | null;
  readonly maximumHoldingSeconds: string | null;
  readonly largestWinnerNetPnl: string | null;
  readonly largestLoserNetPnl: string | null;
  readonly totalShareQuantity: string;
  readonly totalEntryNotional: string;
  readonly winnerEntryNotional: string;
  readonly loserEntryNotional: string;
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
      let maximumDrawdown = "0";
      for (const row of ordered) {
        realized = sum([realized, row.row.netPnl]);
        if (compareCanonicalDecimals(realized, peak) > 0) peak = realized;
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
  const streaks = buildStreaks(rows);
  const netValues = Object.freeze(rows.map((item) => item.row.netPnl));
  const grossValues = Object.freeze(rows.map((item) => item.row.grossPnl));
  const chargeValues = Object.freeze(rows.map((item) => item.row.signedCharges));
  const daily = buildDaily(rows);
  const dailyPnlValues = Object.freeze(daily.map((day) => day.netPnl));
  const profitableDayCount = daily.filter((day) => compareCanonicalDecimals(day.netPnl, "0") > 0).length;
  const losingDayCount = daily.filter((day) => compareCanonicalDecimals(day.netPnl, "0") < 0).length;
  const flatDayCount = daily.length - profitableDayCount - losingDayCount;
  const tradesPerSymbol = Object.freeze([...symbolCounts.values()].map(String));
  const sortedNetValues = ordered(netValues);
  const sortedWinningNetValues = ordered(wins.map((item) => item.row.netPnl));
  const sortedLosingNetValues = ordered(losses.map((item) => item.row.netPnl));
  const sortedDailyPnlValues = ordered(dailyPnlValues);
  const sortedDailyTradeCounts = ordered(daily.map((day) => day.tradeCount));
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
    netValues,
    grossValues,
    grossProfitValues: Object.freeze(grossProfitValues),
    grossLossValues: Object.freeze(grossLossValues),
    chargeValues,
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
    rowCount: String(rows.length),
    netPnl: sum(netValues),
    grossPnl: sum(grossValues),
    grossProfit: sum(grossProfitValues),
    grossLoss: sum(grossLossValues),
    signedCharges: sum(chargeValues),
    winningNetPnl: sum(sortedWinningNetValues),
    losingNetPnl: sum(sortedLosingNetValues),
    uniqueAccountCount: String(accountKeys.size),
    uniqueSymbolCount: String(symbolCounts.size),
    dailyPnlValues,
    profitableDayCount: String(profitableDayCount),
    losingDayCount: String(losingDayCount),
    flatDayCount: String(flatDayCount),
    sortedNetValues,
    sortedWinningNetValues,
    sortedLosingNetValues,
    sortedDailyPnlValues,
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
    minimumHoldingSeconds: first(sortedHoldingSecondsValues),
    maximumHoldingSeconds: last(sortedHoldingSecondsValues),
    largestWinnerNetPnl: last(sortedWinningNetValues),
    largestLoserNetPnl: first(sortedLosingNetValues),
    totalShareQuantity: sum(shareQuantityValues),
    totalEntryNotional: sum(entryNotionalValues),
    winnerEntryNotional: sum(winnerEntryNotionalValues),
    loserEntryNotional: sum(loserEntryNotionalValues),
  });
}
