import type { JournalAnalyticsMoneyBasis } from "../contracts/analytics-query";
import type {
  JournalAnalyticsExactValue,
  JournalAnalyticsResultState,
} from "../contracts/analytics-result";
import type { JournalAnalyticsPopulation } from "./analytics-population";
import {
  absoluteExactDecimal,
  addExactDecimals,
  compareExactDecimals,
  divideExactDecimals,
  exactDecimalFromUnits,
  exactPowerOfTen,
  maximumExactDecimal,
  medianExactDecimals,
  minimumExactDecimal,
  multiplyExactDecimals,
  parseExactDecimal,
  percentageExactDecimals,
  subtractExactDecimals,
  sumExactDecimals,
} from "./exact-analytics-math";
import {
  journalAnalyticsLocalTimeFact,
  type NormalizedJournalAnalyticsRow,
} from "./normalize-journal-analytics-facts";

export type JournalAnalyticsCalculatedMetric = Readonly<{
  state: JournalAnalyticsResultState;
  value: JournalAnalyticsExactValue | null;
  limitationReasonCodes: readonly string[];
}>;

const emptyReasons = Object.freeze([] as string[]);

function integer(value: number): JournalAnalyticsExactValue {
  return Object.freeze({ kind: "integer" as const, value });
}

function decimal(valueDecimal: string): JournalAnalyticsExactValue {
  return Object.freeze({ kind: "decimal" as const, valueDecimal });
}

function rational(
  numerator: string,
  denominator: string,
  decimalPlaces = 2,
): JournalAnalyticsExactValue {
  return Object.freeze({
    kind: "rational" as const,
    ...divideExactDecimals(numerator, denominator, {
      decimalPlaces,
      roundingPolicy: `half_up_${decimalPlaces}dp`,
    }),
  });
}

function percentage(
  numerator: string,
  denominator: string,
): JournalAnalyticsExactValue {
  return Object.freeze({
    kind: "rational" as const,
    ...percentageExactDecimals(numerator, denominator),
  });
}

function complete(value: JournalAnalyticsExactValue): JournalAnalyticsCalculatedMetric {
  return Object.freeze({ state: "complete", value, limitationReasonCodes: emptyReasons });
}

function partial(
  value: JournalAnalyticsExactValue,
  reason = "fee_coverage_partial",
): JournalAnalyticsCalculatedMetric {
  return Object.freeze({
    state: "partial",
    value,
    limitationReasonCodes: Object.freeze([reason]),
  });
}

function unavailable(reason: string): JournalAnalyticsCalculatedMetric {
  return Object.freeze({
    state: "unavailable",
    value: null,
    limitationReasonCodes: Object.freeze([reason]),
  });
}

function empty(value: JournalAnalyticsExactValue): JournalAnalyticsCalculatedMetric {
  return Object.freeze({ state: "empty", value, limitationReasonCodes: emptyReasons });
}

function basisValue(
  row: NormalizedJournalAnalyticsRow,
  moneyBasis: JournalAnalyticsMoneyBasis,
): string {
  return moneyBasis === "gross" ? row.grossPnlDecimal : row.netPnlDecimal!;
}

function basisRows(
  population: JournalAnalyticsPopulation,
  moneyBasis: JournalAnalyticsMoneyBasis,
): readonly NormalizedJournalAnalyticsRow[] {
  return moneyBasis === "gross" ? population.grossRows : population.netRows;
}

function basisValues(
  population: JournalAnalyticsPopulation,
  moneyBasis: JournalAnalyticsMoneyBasis,
): readonly string[] {
  return basisRows(population, moneyBasis).map((row) => basisValue(row, moneyBasis));
}

function usesPartialNet(
  population: JournalAnalyticsPopulation,
  moneyBasis: JournalAnalyticsMoneyBasis,
): boolean {
  return moneyBasis === "net" && population.coverage.feeIncompleteCount > 0;
}

function withBasisState(
  population: JournalAnalyticsPopulation,
  moneyBasis: JournalAnalyticsMoneyBasis,
  value: JournalAnalyticsExactValue,
): JournalAnalyticsCalculatedMetric {
  return usesPartialNet(population, moneyBasis) ? partial(value) : complete(value);
}

function average(
  values: readonly string[],
  reason = "zero_eligible_trade_denominator",
): JournalAnalyticsCalculatedMetric {
  return values.length === 0
    ? unavailable(reason)
    : complete(rational(sumExactDecimals(values), String(values.length)));
}

function median(
  values: readonly string[],
  reason = "zero_eligible_trade_denominator",
): JournalAnalyticsCalculatedMetric {
  const value = medianExactDecimals(values);
  return value === null
    ? unavailable(reason)
    : complete(Object.freeze({ kind: "rational" as const, ...value }));
}

function medianFraction(values: readonly string[]): Readonly<{
  numeratorDecimal: string;
  denominatorInteger: string;
}> | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort(compareExactDecimals);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? Object.freeze({
        numeratorDecimal: sorted[middle],
        denominatorInteger: "1",
      })
    : Object.freeze({
        numeratorDecimal: addExactDecimals(
          sorted[middle - 1],
          sorted[middle],
        ),
        denominatorInteger: "2",
      });
}

function outcomeRows(
  rows: readonly NormalizedJournalAnalyticsRow[],
  moneyBasis: JournalAnalyticsMoneyBasis,
  outcome: "win" | "loss" | "flat",
): readonly NormalizedJournalAnalyticsRow[] {
  return rows.filter((row) => {
    const comparison = compareExactDecimals(basisValue(row, moneyBasis), "0");
    return outcome === "win" ? comparison > 0 : outcome === "loss" ? comparison < 0 : comparison === 0;
  });
}

function dailyTotals(
  rows: readonly NormalizedJournalAnalyticsRow[],
  moneyBasis: JournalAnalyticsMoneyBasis,
): ReadonlyMap<string, string> {
  const totals = new Map<string, string>();
  for (const row of rows) {
    totals.set(
      row.closeLocal.localDate,
      addExactDecimals(
        totals.get(row.closeLocal.localDate) ?? "0",
        basisValue(row, moneyBasis),
      ),
    );
  }
  return totals;
}

function attemptCounts(
  rows: readonly NormalizedJournalAnalyticsRow[],
): readonly string[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = JSON.stringify([row.instrumentId, row.entryLocal.localDate]);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.freeze([...counts.values()].map(String));
}

function selectedChargeEffects(
  population: JournalAnalyticsPopulation,
): readonly string[] {
  return Object.freeze(population.netRows.map((row) => subtractExactDecimals(
    row.chargeCreditDecimal!,
    row.chargeCostDecimal!,
  )));
}

function countByRole(
  rows: readonly NormalizedJournalAnalyticsRow[],
  roles: readonly (keyof NormalizedJournalAnalyticsRow["allocationRoleCounts"])[],
): number {
  return rows.reduce((sum, row) => sum + roles.reduce((roleSum, role) =>
    roleSum + row.allocationRoleCounts[role], 0), 0);
}

function nearestRank(
  values: readonly string[],
  percentile: number,
): JournalAnalyticsCalculatedMetric {
  if (values.length === 0) return unavailable("zero_eligible_trade_denominator");
  const sorted = [...values].sort(compareExactDecimals);
  const rank = Math.ceil((percentile * sorted.length) / 100);
  return complete(decimal(sorted[Math.max(0, rank - 1)]));
}

function populationVariance(values: readonly string[]): Readonly<{
  numeratorDecimal: string;
  denominatorInteger: string;
}> | null {
  if (values.length === 0) return null;
  const count = String(values.length);
  const sum = sumExactDecimals(values);
  const sumSquares = sumExactDecimals(values.map((value) =>
    multiplyExactDecimals(value, value)));
  return Object.freeze({
    numeratorDecimal: subtractExactDecimals(
      multiplyExactDecimals(count, sumSquares),
      multiplyExactDecimals(sum, sum),
    ),
    denominatorInteger: String(values.length * values.length),
  });
}

function integerSquareRoot(value: bigint): bigint {
  if (value < BigInt(2)) return value;
  let left = BigInt(1);
  let right = value;
  while (left <= right) {
    const middle = (left + right) / BigInt(2);
    const square = middle * middle;
    if (square === value) return middle;
    if (square < value) left = middle + BigInt(1);
    else right = middle - BigInt(1);
  }
  return right;
}

function roundedSquareRootRational(
  numeratorDecimal: string,
  denominatorInteger: string,
  decimalPlaces = 2,
): string {
  const numerator = parseExactDecimal(numeratorDecimal);
  const denominator = BigInt(denominatorInteger) * exactPowerOfTen(numerator.scale);
  const scaledNumerator = numerator.units * exactPowerOfTen(decimalPlaces * 2);
  if (scaledNumerator < BigInt(0) || denominator <= BigInt(0)) {
    return "0";
  }
  const floorRoot = integerSquareRoot(scaledNumerator / denominator);
  const twicePlusOne = floorRoot * BigInt(2) + BigInt(1);
  const rounded = BigInt(4) * scaledNumerator >=
      denominator * twicePlusOne * twicePlusOne
    ? floorRoot + BigInt(1)
    : floorRoot;
  return exactDecimalFromUnits(rounded, decimalPlaces);
}

function streak(
  rows: readonly NormalizedJournalAnalyticsRow[],
  moneyBasis: JournalAnalyticsMoneyBasis,
  sign: "win" | "loss",
  current: boolean,
): number {
  const ordered = [...rows].sort((left, right) =>
    left.closedAtUtc.localeCompare(right.closedAtUtc) ||
    left.roundTripId.localeCompare(right.roundTripId));
  let running = 0;
  let longest = 0;
  for (const row of ordered) {
    const comparison = compareExactDecimals(basisValue(row, moneyBasis), "0");
    const matches = sign === "win" ? comparison > 0 : comparison < 0;
    running = matches ? running + 1 : 0;
    longest = Math.max(longest, running);
  }
  return current ? running : longest;
}

function removeExtreme(
  rows: readonly NormalizedJournalAnalyticsRow[],
  moneyBasis: JournalAnalyticsMoneyBasis,
  remove: "winner" | "loser" | "both",
): JournalAnalyticsCalculatedMetric {
  const ordered = [...rows].sort((left, right) => {
    const comparison = compareExactDecimals(
      basisValue(left, moneyBasis),
      basisValue(right, moneyBasis),
    );
    return comparison || left.closedAtUtc.localeCompare(right.closedAtUtc) ||
      left.roundTripId.localeCompare(right.roundTripId);
  });
  const winners = ordered.filter((row) =>
    compareExactDecimals(basisValue(row, moneyBasis), "0") > 0);
  const losers = ordered.filter((row) =>
    compareExactDecimals(basisValue(row, moneyBasis), "0") < 0);
  if ((remove === "winner" || remove === "both") && winners.length === 0) {
    return unavailable("winning_trade_population_missing");
  }
  if ((remove === "loser" || remove === "both") && losers.length === 0) {
    return unavailable("losing_trade_population_missing");
  }
  const removed = new Set<string>();
  if (remove === "winner" || remove === "both") {
    removed.add(winners.at(-1)!.roundTripId);
  }
  if (remove === "loser" || remove === "both") {
    removed.add(losers[0].roundTripId);
  }
  return complete(decimal(sumExactDecimals(ordered
    .filter((row) => !removed.has(row.roundTripId))
    .map((row) => basisValue(row, moneyBasis)))));
}

type IntradayPath = Readonly<{
  drawdownDecimal: string;
  recoveryDecimal: string;
  givebackDecimal: string;
  finalDecimal: string;
  peakDecimal: string;
  troughDecimal: string;
}>;

function intradayPaths(
  rows: readonly NormalizedJournalAnalyticsRow[],
  moneyBasis: JournalAnalyticsMoneyBasis,
): readonly IntradayPath[] {
  const byDay = new Map<string, NormalizedJournalAnalyticsRow[]>();
  for (const row of rows) {
    const dayRows = byDay.get(row.closeLocal.localDate) ?? [];
    dayRows.push(row);
    byDay.set(row.closeLocal.localDate, dayRows);
  }
  return Object.freeze([...byDay.values()].map((dayRows) => {
    const ordered = [...dayRows].sort((left, right) =>
      left.closedAtUtc.localeCompare(right.closedAtUtc) ||
      left.roundTripId.localeCompare(right.roundTripId));
    let cumulative = "0";
    let peak = "0";
    let trough = "0";
    let drawdown = "0";
    let recovery = "0";
    for (const row of ordered) {
      cumulative = addExactDecimals(cumulative, basisValue(row, moneyBasis));
      if (compareExactDecimals(cumulative, peak) > 0) peak = cumulative;
      if (compareExactDecimals(cumulative, trough) < 0) trough = cumulative;
      const currentDrawdown = subtractExactDecimals(peak, cumulative);
      const currentRecovery = subtractExactDecimals(cumulative, trough);
      if (compareExactDecimals(currentDrawdown, drawdown) > 0) {
        drawdown = currentDrawdown;
      }
      if (compareExactDecimals(currentRecovery, recovery) > 0) {
        recovery = currentRecovery;
      }
    }
    const giveback = compareExactDecimals(peak, cumulative) > 0
      ? subtractExactDecimals(peak, cumulative)
      : "0";
    return Object.freeze({
      drawdownDecimal: drawdown,
      recoveryDecimal: recovery,
      givebackDecimal: giveback,
      finalDecimal: cumulative,
      peakDecimal: peak,
      troughDecimal: trough,
    });
  }));
}

function largestGroupedShare(
  rows: readonly NormalizedJournalAnalyticsRow[],
  moneyBasis: JournalAnalyticsMoneyBasis,
  key: (row: NormalizedJournalAnalyticsRow) => string,
  value: (row: NormalizedJournalAnalyticsRow) => string,
): JournalAnalyticsCalculatedMetric {
  if (rows.length === 0) return unavailable("zero_eligible_trade_denominator");
  const totals = new Map<string, string>();
  for (const row of rows) {
    totals.set(key(row), addExactDecimals(totals.get(key(row)) ?? "0", value(row)));
  }
  const absoluteTotals = [...totals.values()].map(absoluteExactDecimal);
  const denominator = sumExactDecimals(rows.map((row) => absoluteExactDecimal(value(row))));
  if (compareExactDecimals(denominator, "0") === 0) {
    return unavailable("absolute_value_denominator_missing");
  }
  return complete(percentage(maximumExactDecimal(absoluteTotals)!, denominator));
}

function openMetric(
  metricId: string,
  population: JournalAnalyticsPopulation,
): JournalAnalyticsCalculatedMetric | null {
  if (!metricId.includes("open_")) return null;
  const open = population.legitimateOpenRoundTrips;
  if (metricId === "open_position_count") {
    return open.length === 0 ? empty(integer(0)) : complete(integer(open.length));
  }
  if (metricId === "open_long_position_count" || metricId === "open_short_position_count") {
    const direction = metricId.includes("long") ? "long" : "short";
    const count = open.filter((row) => row.direction === direction).length;
    return open.length === 0 ? empty(integer(0)) : complete(integer(count));
  }
  if (open.length === 0) return unavailable("zero_legitimate_open_denominator");
  const increasingRoles = new Set(["opening", "adding", "flip_opening"]);
  const allocations = open.flatMap((row) => row.allocations);
  const entered = allocations.filter((allocation) =>
    increasingRoles.has(allocation.allocationRole));
  if (entered.some((allocation) => allocation.priceDecimal === null)) {
    return unavailable("open_position_price_fact_missing");
  }
  const enteredQuantity = sumExactDecimals(entered.map((allocation) =>
    allocation.allocatedQuantityDecimal));
  const entryNotional = sumExactDecimals(entered.map((allocation) =>
    multiplyExactDecimals(
      allocation.allocatedQuantityDecimal,
      allocation.priceDecimal!,
    )));
  if (metricId === "open_current_quantity") {
    return complete(decimal(sumExactDecimals(open.map((row) =>
      absoluteExactDecimal(row.finalPositionDecimal)))));
  }
  if (metricId === "open_entered_quantity") return complete(decimal(enteredQuantity));
  if (metricId === "open_weighted_average_cost") {
    return compareExactDecimals(enteredQuantity, "0") === 0
      ? unavailable("open_entered_quantity_missing")
      : complete(rational(entryNotional, enteredQuantity));
  }
  const asOf = Date.parse(population.asOfUtc);
  const ages = open.map((row) => asOf - Date.parse(row.openedAtUtc));
  if (ages.some((age) => !Number.isSafeInteger(age) || age < 0)) {
    return unavailable("open_age_as_of_precedes_open_time");
  }
  if (metricId === "average_open_age") {
    return complete(rational(String(ages.reduce((sum, age) => sum + age, 0)), String(ages.length)));
  }
  if (metricId === "maximum_open_age") {
    return complete(Object.freeze({ kind: "duration" as const, milliseconds: Math.max(...ages) }));
  }
  if (metricId === "average_open_carried_days") {
    const carried = open.map((row) => {
      const start = journalAnalyticsLocalTimeFact(row.openedAtUtc, population.tradingTimezone).localDate;
      const end = journalAnalyticsLocalTimeFact(population.asOfUtc, population.tradingTimezone).localDate;
      return Math.floor((Date.parse(`${end}T00:00:00.000Z`) - Date.parse(`${start}T00:00:00.000Z`)) / 86_400_000);
    });
    return complete(rational(String(carried.reduce((sum, days) => sum + days, 0)), String(carried.length)));
  }
  return null;
}

export function calculateExtendedJournalAnalyticsMetric(
  metricId: string,
  population: JournalAnalyticsPopulation,
  moneyBasis: JournalAnalyticsMoneyBasis,
): JournalAnalyticsCalculatedMetric | null {
  const open = openMetric(metricId, population);
  if (open) return open;
  const rows = basisRows(population, moneyBasis);
  const values = basisValues(population, moneyBasis);
  const wins = outcomeRows(rows, moneyBasis, "win");
  const losses = outcomeRows(rows, moneyBasis, "loss");
  const daily = dailyTotals(rows, moneyBasis);
  const dailyValues = [...daily.values()];
  const chargeEffects = selectedChargeEffects(population);
  const netState = (value: JournalAnalyticsExactValue) =>
    population.coverage.feeIncompleteCount > 0 ? partial(value) : complete(value);
  const sourceCount = (
    value: number,
  ): JournalAnalyticsCalculatedMetric => population.sourceCoverage.exactScope
    ? complete(integer(value))
    : unavailable("source_coverage_scope_not_attributable");
  switch (metricId) {
    case "inclusion_rate": {
      const denominator = population.coverage.candidateCount + population.coverage.excludedCount;
      return denominator === 0 ? unavailable("zero_candidate_denominator") : complete(percentage(String(population.coverage.includedCount), String(denominator)));
    }
    case "exclusion_rate": {
      if (population.limitations.includes("excluded_execution_scope_not_attributable")) return unavailable("excluded_execution_scope_not_attributable");
      const denominator = population.coverage.candidateCount + population.coverage.excludedCount;
      return denominator === 0 ? unavailable("zero_candidate_denominator") : complete(percentage(String(population.coverage.excludedCount), String(denominator)));
    }
    case "trading_day_count": return complete(integer(new Set(population.grossRows.map((row) => row.closeLocal.localDate)).size));
    case "unique_account_count": return complete(integer(new Set(population.grossRows.map((row) => row.accountId)).size));
    case "unique_symbol_count": return complete(integer(new Set(population.grossRows.map((row) => row.instrumentId)).size));
    case "total_execution_count": return complete(integer(new Set(population.grossRows.flatMap((row) => row.uniqueExecutionIds)).size));
    case "average_executions_per_trade": return population.grossRows.length === 0 ? unavailable("zero_eligible_trade_denominator") : complete(rational(String(population.grossRows.reduce((sum, row) => sum + row.uniqueExecutionCount, 0)), String(population.grossRows.length)));
    case "limited_analytical_trade_count": return complete(integer(population.coverage.unavailableCount));
    case "missing_charge_coverage_trade_count": return complete(integer(population.coverage.feeIncompleteCount));
    case "missing_share_quantity_authority_count": return complete(integer(population.grossRows.filter((row) => compareExactDecimals(row.maximumPositionQuantityDecimal, "0") <= 0).length));
    case "missing_entry_notional_authority_count": return complete(integer(population.grossRows.filter((row) => compareExactDecimals(row.entryNotionalDecimal, "0") <= 0).length));
    case "unavailable_source_authority_trade_count": return complete(integer(population.grossRows.filter((row) => row.provenanceGroup === "unknown").length));
    case "manual_entry_trade_count": return complete(integer(population.grossRows.filter((row) => row.provenanceKinds.includes("manual")).length));
    case "broker_import_trade_count": return complete(integer(population.grossRows.filter((row) => row.provenanceKinds.includes("broker")).length));
    case "average_trades_per_trading_day": return average([...daily.keys()].map((day) => String(population.grossRows.filter((row) => row.closeLocal.localDate === day).length)), "zero_trading_day_denominator");
    case "median_trades_per_trading_day": return median([...daily.keys()].map((day) => String(population.grossRows.filter((row) => row.closeLocal.localDate === day).length)), "zero_trading_day_denominator");
    case "maximum_trades_per_trading_day": return daily.size === 0 ? unavailable("zero_trading_day_denominator") : complete(integer(Math.max(...[...daily.keys()].map((day) => population.grossRows.filter((row) => row.closeLocal.localDate === day).length))));
    case "minimum_trades_per_trading_day": return daily.size === 0 ? unavailable("zero_trading_day_denominator") : complete(integer(Math.min(...[...daily.keys()].map((day) => population.grossRows.filter((row) => row.closeLocal.localDate === day).length))));
    case "long_trade_count": return complete(integer(population.grossRows.filter((row) => row.direction === "long").length));
    case "short_trade_count": return complete(integer(population.grossRows.filter((row) => row.direction === "short").length));
    case "long_trade_percentage":
    case "short_trade_percentage": {
      if (population.grossRows.length === 0) return unavailable("zero_eligible_trade_denominator");
      const direction = metricId.startsWith("long") ? "long" : "short";
      return complete(percentage(String(population.grossRows.filter((row) => row.direction === direction).length), String(population.grossRows.length)));
    }
    case "average_attempts_per_symbol": return average(attemptCounts(population.grossRows), "zero_instrument_day_denominator");
    case "median_attempts_per_symbol": return median(attemptCounts(population.grossRows), "zero_instrument_day_denominator");
    case "repeat_attempt_trade_count": return complete(integer(attemptCounts(population.grossRows).reduce((sum, count) => sum + Math.max(0, Number(count) - 1), 0)));
    case "repeat_attempt_percentage": {
      if (population.grossRows.length === 0) return unavailable("zero_eligible_trade_denominator");
      const repeats = attemptCounts(population.grossRows).reduce((sum, count) => sum + Math.max(0, Number(count) - 1), 0);
      return complete(percentage(String(repeats), String(population.grossRows.length)));
    }
    case "signed_charges": return chargeEffects.length === 0 && population.grossRows.length > 0 ? unavailable("complete_fee_coverage_required") : netState(decimal(sumExactDecimals(chargeEffects)));
    case "average_signed_charges": return chargeEffects.length === 0 ? unavailable("complete_fee_coverage_required") : netState(rational(sumExactDecimals(chargeEffects), String(chargeEffects.length)));
    case "median_signed_charges": {
      const result = medianExactDecimals(chargeEffects);
      return result === null ? unavailable("complete_fee_coverage_required") : netState(Object.freeze({ kind: "rational" as const, ...result }));
    }
    case "gross_net_difference": return chargeEffects.length === 0 && population.grossRows.length > 0 ? unavailable("complete_fee_coverage_required") : netState(decimal(subtractExactDecimals("0", sumExactDecimals(chargeEffects))));
    case "fees_as_percentage_of_gross_profit":
    case "fees_as_percentage_of_gross_loss": {
      const gross = metricId.endsWith("profit")
        ? sumExactDecimals(population.grossRows.filter((row) => compareExactDecimals(row.grossPnlDecimal, "0") > 0).map((row) => row.grossPnlDecimal))
        : absoluteExactDecimal(sumExactDecimals(population.grossRows.filter((row) => compareExactDecimals(row.grossPnlDecimal, "0") < 0).map((row) => row.grossPnlDecimal)));
      if (compareExactDecimals(gross, "0") === 0) return unavailable("gross_denominator_missing");
      return netState(percentage(
        sumExactDecimals(population.netRows.map((row) => row.chargeCostDecimal!)),
        gross,
      ));
    }
    case "average_daily_pnl": return average(dailyValues, "zero_trading_day_denominator");
    case "median_daily_pnl": return median(dailyValues, "zero_trading_day_denominator");
    case "best_trading_day": {
      const value = maximumExactDecimal(dailyValues);
      return value === null ? unavailable("zero_trading_day_denominator") : withBasisState(population, moneyBasis, decimal(value));
    }
    case "worst_trading_day": {
      const value = minimumExactDecimal(dailyValues);
      return value === null ? unavailable("zero_trading_day_denominator") : withBasisState(population, moneyBasis, decimal(value));
    }
    case "average_winning_trade": return average(wins.map((row) => basisValue(row, moneyBasis)), "winning_trade_population_missing");
    case "median_winning_trade": return median(wins.map((row) => basisValue(row, moneyBasis)), "winning_trade_population_missing");
    case "average_losing_trade": return average(losses.map((row) => basisValue(row, moneyBasis)), "losing_trade_population_missing");
    case "median_losing_trade": return median(losses.map((row) => basisValue(row, moneyBasis)), "losing_trade_population_missing");
    case "total_winning_net_pnl": return wins.length === 0 ? unavailable("winning_trade_population_missing") : withBasisState(population, moneyBasis, decimal(sumExactDecimals(wins.map((row) => basisValue(row, moneyBasis)))));
    case "total_losing_net_pnl": return losses.length === 0 ? unavailable("losing_trade_population_missing") : withBasisState(population, moneyBasis, decimal(sumExactDecimals(losses.map((row) => basisValue(row, moneyBasis)))));
    case "average_win_loss_ratio":
    case "median_win_loss_ratio": {
      if (wins.length === 0 || losses.length === 0) return unavailable("win_loss_population_missing");
      const win = metricId.startsWith("average")
        ? Object.freeze({
            numeratorDecimal: sumExactDecimals(wins.map((row) =>
              basisValue(row, moneyBasis))),
            denominatorInteger: String(wins.length),
          })
        : medianFraction(wins.map((row) => basisValue(row, moneyBasis)))!;
      const loss = metricId.startsWith("average")
        ? Object.freeze({
            numeratorDecimal: absoluteExactDecimal(sumExactDecimals(losses.map((row) =>
              basisValue(row, moneyBasis)))),
            denominatorInteger: String(losses.length),
          })
        : medianFraction(losses.map((row) =>
            absoluteExactDecimal(basisValue(row, moneyBasis))))!;
      return withBasisState(population, moneyBasis, rational(
        multiplyExactDecimals(win.numeratorDecimal, loss.denominatorInteger),
        multiplyExactDecimals(loss.numeratorDecimal, win.denominatorInteger),
        4,
      ));
    }
    case "breakeven_win_rate": {
      if (wins.length === 0 || losses.length === 0) return unavailable("win_loss_population_missing");
      const winSum = sumExactDecimals(wins.map((row) =>
        basisValue(row, moneyBasis)));
      const lossSum = absoluteExactDecimal(sumExactDecimals(losses.map((row) =>
        basisValue(row, moneyBasis))));
      const numerator = multiplyExactDecimals(lossSum, String(wins.length));
      const denominator = addExactDecimals(
        multiplyExactDecimals(winSum, String(losses.length)),
        numerator,
      );
      return withBasisState(
        population,
        moneyBasis,
        percentage(numerator, denominator),
      );
    }
    case "average_holding_time": return rows.length === 0 ? unavailable("zero_eligible_trade_denominator") : withBasisState(population, moneyBasis, rational(String(rows.reduce((sum, row) => sum + row.holdingDurationMilliseconds, 0)), String(rows.length)));
    case "median_holding_time": return median(rows.map((row) => String(row.holdingDurationMilliseconds)));
    case "minimum_holding_time": return rows.length === 0 ? unavailable("zero_eligible_trade_denominator") : complete(Object.freeze({ kind: "duration" as const, milliseconds: Math.min(...rows.map((row) => row.holdingDurationMilliseconds)) }));
    case "maximum_holding_time": return rows.length === 0 ? unavailable("zero_eligible_trade_denominator") : complete(Object.freeze({ kind: "duration" as const, milliseconds: Math.max(...rows.map((row) => row.holdingDurationMilliseconds)) }));
    case "average_winner_holding_time": return average(wins.map((row) => String(row.holdingDurationMilliseconds)), "winning_trade_population_missing");
    case "average_loser_holding_time": return average(losses.map((row) => String(row.holdingDurationMilliseconds)), "losing_trade_population_missing");
    case "median_winner_holding_time": return median(wins.map((row) => String(row.holdingDurationMilliseconds)), "winning_trade_population_missing");
    case "median_loser_holding_time": return median(losses.map((row) => String(row.holdingDurationMilliseconds)), "losing_trade_population_missing");
    case "average_share_quantity":
    case "average_position_size": return average(rows.map((row) => row.maximumPositionQuantityDecimal));
    case "median_share_quantity":
    case "median_position_size": return median(rows.map((row) => row.maximumPositionQuantityDecimal));
    case "maximum_share_quantity": {
      const value = maximumExactDecimal(rows.map((row) => row.maximumPositionQuantityDecimal));
      return value === null ? unavailable("zero_eligible_trade_denominator") : complete(decimal(value));
    }
    case "average_winner_share_quantity": return average(wins.map((row) => row.maximumPositionQuantityDecimal), "winning_trade_population_missing");
    case "median_winner_share_quantity": return median(wins.map((row) => row.maximumPositionQuantityDecimal), "winning_trade_population_missing");
    case "average_loser_share_quantity": return average(losses.map((row) => row.maximumPositionQuantityDecimal), "losing_trade_population_missing");
    case "median_loser_share_quantity": return median(losses.map((row) => row.maximumPositionQuantityDecimal), "losing_trade_population_missing");
    case "average_entry_notional": return average(rows.map((row) => row.entryNotionalDecimal));
    case "median_entry_notional": return median(rows.map((row) => row.entryNotionalDecimal));
    case "maximum_entry_notional": {
      const value = maximumExactDecimal(rows.map((row) => row.entryNotionalDecimal));
      return value === null ? unavailable("zero_eligible_trade_denominator") : complete(decimal(value));
    }
    case "average_winner_entry_notional": return average(wins.map((row) => row.entryNotionalDecimal), "winning_trade_population_missing");
    case "average_loser_entry_notional": return average(losses.map((row) => row.entryNotionalDecimal), "losing_trade_population_missing");
    case "median_winner_entry_notional": return median(wins.map((row) => row.entryNotionalDecimal), "winning_trade_population_missing");
    case "median_loser_entry_notional": return median(losses.map((row) => row.entryNotionalDecimal), "losing_trade_population_missing");
    case "net_pnl_per_100_shares": {
      const quantity = sumExactDecimals(population.netRows.map((row) => row.enteredQuantityDecimal));
      return compareExactDecimals(quantity, "0") === 0 ? unavailable("entered_quantity_denominator_missing") : netState(rational(multiplyExactDecimals(sumExactDecimals(population.netRows.map((row) => row.netPnlDecimal!)), "100"), quantity));
    }
    case "return_on_entry_notional": {
      const notional = sumExactDecimals(rows.map((row) => row.entryNotionalDecimal));
      return compareExactDecimals(notional, "0") === 0 ? unavailable("entry_notional_denominator_missing") : withBasisState(population, moneyBasis, percentage(sumExactDecimals(values), notional));
    }
    case "profitable_trading_day_count": return complete(integer(dailyValues.filter((value) => compareExactDecimals(value, "0") > 0).length));
    case "losing_trading_day_count": return complete(integer(dailyValues.filter((value) => compareExactDecimals(value, "0") < 0).length));
    case "flat_trading_day_count": return complete(integer(dailyValues.filter((value) => compareExactDecimals(value, "0") === 0).length));
    case "profitable_day_percentage":
    case "losing_day_percentage":
    case "flat_day_percentage": {
      if (dailyValues.length === 0) return unavailable("zero_trading_day_denominator");
      const sign = metricId.startsWith("profitable") ? 1 : metricId.startsWith("losing") ? -1 : 0;
      const count = dailyValues.filter((value) => compareExactDecimals(value, "0") === sign).length;
      return withBasisState(population, moneyBasis, percentage(String(count), String(dailyValues.length)));
    }
    case "average_green_day_pnl": return average(dailyValues.filter((value) => compareExactDecimals(value, "0") > 0), "green_day_population_missing");
    case "median_green_day_pnl": return median(dailyValues.filter((value) => compareExactDecimals(value, "0") > 0), "green_day_population_missing");
    case "average_red_day_pnl": return average(dailyValues.filter((value) => compareExactDecimals(value, "0") < 0), "red_day_population_missing");
    case "median_red_day_pnl": return median(dailyValues.filter((value) => compareExactDecimals(value, "0") < 0), "red_day_population_missing");
    case "longest_winning_trade_streak": return complete(integer(streak(rows, moneyBasis, "win", false)));
    case "longest_losing_trade_streak": return complete(integer(streak(rows, moneyBasis, "loss", false)));
    case "current_winning_trade_streak": return complete(integer(streak(rows, moneyBasis, "win", true)));
    case "current_losing_trade_streak": return complete(integer(streak(rows, moneyBasis, "loss", true)));
    case "net_pnl_excluding_largest_winner": return removeExtreme(population.netRows, "net", "winner");
    case "net_pnl_excluding_largest_loser": return removeExtreme(population.netRows, "net", "loser");
    case "net_pnl_excluding_largest_winner_and_loser": return removeExtreme(population.netRows, "net", "both");
    case "largest_winner_contribution": {
      if (wins.length === 0) return unavailable("winning_trade_population_missing");
      const profit = sumExactDecimals(wins.map((row) => basisValue(row, moneyBasis)));
      return withBasisState(population, moneyBasis, percentage(maximumExactDecimal(wins.map((row) => basisValue(row, moneyBasis)))!, profit));
    }
    case "largest_loser_contribution": {
      if (losses.length === 0) return unavailable("losing_trade_population_missing");
      const lossValues = losses.map((row) => absoluteExactDecimal(basisValue(row, moneyBasis)));
      return withBasisState(population, moneyBasis, percentage(maximumExactDecimal(lossValues)!, sumExactDecimals(lossValues)));
    }
    case "maximum_intraday_drawdown":
    case "maximum_intraday_realized_drawdown": {
      const paths = intradayPaths(rows, moneyBasis);
      const value = maximumExactDecimal(paths.map((path) => path.drawdownDecimal));
      return value === null ? unavailable("zero_trading_day_denominator") : withBasisState(population, moneyBasis, decimal(value));
    }
    case "maximum_peak_profit_giveback": {
      const value = maximumExactDecimal(intradayPaths(rows, moneyBasis).map((path) => path.givebackDecimal));
      return value === null ? unavailable("zero_trading_day_denominator") : withBasisState(population, moneyBasis, decimal(value));
    }
    case "maximum_intraday_realized_recovery_from_trough": {
      const value = maximumExactDecimal(intradayPaths(rows, moneyBasis).map((path) => path.recoveryDecimal));
      return value === null ? unavailable("zero_trading_day_denominator") : withBasisState(population, moneyBasis, decimal(value));
    }
    case "average_peak_profit_giveback": return average(intradayPaths(rows, moneyBasis).map((path) => path.givebackDecimal), "zero_trading_day_denominator");
    case "median_peak_profit_giveback": return median(intradayPaths(rows, moneyBasis).map((path) => path.givebackDecimal), "zero_trading_day_denominator");
    case "days_with_peak_profit_giveback": return complete(integer(intradayPaths(rows, moneyBasis).filter((path) => compareExactDecimals(path.givebackDecimal, "0") > 0).length));
    case "days_with_realized_drawdown": return complete(integer(intradayPaths(rows, moneyBasis).filter((path) => compareExactDecimals(path.drawdownDecimal, "0") > 0).length));
    case "green_to_red_day_count": return complete(integer(intradayPaths(rows, moneyBasis).filter((path) => compareExactDecimals(path.peakDecimal, "0") > 0 && compareExactDecimals(path.finalDecimal, "0") < 0).length));
    case "red_to_green_day_count": return complete(integer(intradayPaths(rows, moneyBasis).filter((path) => compareExactDecimals(path.troughDecimal, "0") < 0 && compareExactDecimals(path.finalDecimal, "0") > 0).length));
    case "ready_closed_count": return complete(integer(population.coverage.readyClosedCount));
    case "legitimate_open_count": return complete(integer(population.coverage.legitimateOpenCount));
    case "needs_decision_count": return complete(integer(population.coverage.needsDecisionCount));
    case "unsupported_source_record_count": return population.limitations.includes("unsupported_source_scope_not_attributable") ? unavailable("unsupported_source_scope_not_attributable") : complete(integer(population.coverage.unsupportedCount));
    case "fee_complete_trade_count": return complete(integer(population.coverage.feeCompleteCount));
    case "fee_incomplete_trade_count": return complete(integer(population.coverage.feeIncompleteCount));
    case "overlap_evidence_trade_count": return complete(integer(population.grossRows.filter((row) => row.hasOverlapEvidence).length));
    case "correction_provenance_trade_count": return complete(integer(population.grossRows.filter((row) => row.provenanceKinds.includes("correction")).length));
    case "mixed_provenance_trade_count": return complete(integer(population.grossRows.filter((row) => row.provenanceGroup === "mixed").length));
    case "source_record_count": return sourceCount(population.sourceCoverage.sourceRecordCount);
    case "import_count": return sourceCount(population.sourceCoverage.importCount);
    case "import_issue_count": return sourceCount(population.sourceCoverage.importIssueCount);
    case "decision_record_count": return sourceCount(population.sourceCoverage.decisionCount);
    case "pending_decision_count": return sourceCount(population.pendingDecisionFacts.length);
    case "accepted_execution_count": return sourceCount(population.sourceCoverage.acceptedExecutionCount);
    case "position_fact_count": return sourceCount(population.sourceCoverage.positionFactCount);
    case "exact_reimport_event_count": return sourceCount(population.sourceCoverage.exactReimportEventCount);
    case "duplicate_source_record_count": return sourceCount(population.sourceCoverage.duplicateSourceRecordCount);
    case "accepted_source_limitation_count": return sourceCount(population.sourceCoverage.acceptedSourceLimitationCount);
    case "complete_coverage_interval_count": return sourceCount(population.sourceCoverage.completeCoverageIntervalCount);
    case "coverage_gap_count": return sourceCount(population.sourceCoverage.coverageGapCount);
    case "import_issue_rate": {
      if (!population.sourceCoverage.exactScope) return unavailable("source_coverage_scope_not_attributable");
      if (population.sourceCoverage.sourceRecordCount === 0) return unavailable("zero_source_record_denominator");
      return complete(percentage(
        String(population.sourceCoverage.importIssueCount),
        String(population.sourceCoverage.sourceRecordCount),
      ));
    }
    case "average_pending_decision_age":
    case "maximum_pending_decision_age": {
      if (!population.sourceCoverage.exactScope) return unavailable("source_coverage_scope_not_attributable");
      if (population.pendingDecisionFacts.length === 0) return unavailable("pending_decision_population_missing");
      const asOf = Date.parse(population.asOfUtc);
      const ages = population.pendingDecisionFacts.map((decision) =>
        asOf - Date.parse(decision.updatedAtUtc));
      if (ages.some((age) => !Number.isSafeInteger(age) || age < 0)) {
        return unavailable("decision_age_as_of_precedes_update");
      }
      return metricId.startsWith("average")
        ? complete(rational(String(ages.reduce((sum, age) => sum + age, 0)), String(ages.length)))
        : complete(Object.freeze({
            kind: "duration" as const,
            milliseconds: Math.max(...ages),
          }));
    }
    case "charge_cost": return population.netRows.length === 0 && population.grossRows.length > 0 ? unavailable("complete_fee_coverage_required") : netState(decimal(sumExactDecimals(population.netRows.map((row) => row.chargeCostDecimal!))));
    case "charge_credit": return population.netRows.length === 0 && population.grossRows.length > 0 ? unavailable("complete_fee_coverage_required") : netState(decimal(sumExactDecimals(population.netRows.map((row) => row.chargeCreditDecimal!))));
    case "entry_allocation_count": return complete(integer(countByRole(population.grossRows, ["opening", "flip_opening"])));
    case "add_allocation_count": return complete(integer(countByRole(population.grossRows, ["adding"])));
    case "reduction_allocation_count": return complete(integer(countByRole(population.grossRows, ["reducing"])));
    case "exit_allocation_count": return complete(integer(countByRole(population.grossRows, ["closing", "flip_closing"])));
    case "scale_in_trade_count": return complete(integer(population.grossRows.filter((row) => row.allocationRoleCounts.adding > 0).length));
    case "scale_out_trade_count": return complete(integer(population.grossRows.filter((row) => row.allocationRoleCounts.reducing > 0).length));
    case "flip_execution_count": return complete(integer(new Set(population.grossRows.filter((row) => row.allocationRoleCounts.flip_closing > 0 || row.allocationRoleCounts.flip_opening > 0).flatMap((row) => row.uniqueExecutionIds)).size));
    case "average_entry_price": {
      const quantity = sumExactDecimals(population.grossRows.map((row) => row.enteredQuantityDecimal));
      return compareExactDecimals(quantity, "0") === 0 ? unavailable("entered_quantity_denominator_missing") : complete(rational(sumExactDecimals(population.grossRows.map((row) => row.entryNotionalDecimal)), quantity));
    }
    case "average_exit_price": {
      const quantity = sumExactDecimals(population.grossRows.map((row) => row.exitQuantityDecimal));
      return compareExactDecimals(quantity, "0") === 0 ? unavailable("exit_quantity_denominator_missing") : complete(rational(sumExactDecimals(population.grossRows.map((row) => row.exitNotionalDecimal)), quantity));
    }
    case "overnight_trade_count": return complete(integer(population.grossRows.filter((row) => row.isOvernight).length));
    case "multi_day_trade_count": return complete(integer(population.grossRows.filter((row) => row.entryLocal.localDate !== row.closeLocal.localDate).length));
    case "pnl_percentile_10": return nearestRank(values, 10);
    case "pnl_percentile_25": return nearestRank(values, 25);
    case "pnl_percentile_50": return nearestRank(values, 50);
    case "pnl_percentile_75": return nearestRank(values, 75);
    case "pnl_percentile_90": return nearestRank(values, 90);
    case "population_pnl_variance": {
      const variance = populationVariance(values);
      return variance === null ? unavailable("zero_eligible_trade_denominator") : withBasisState(population, moneyBasis, rational(variance.numeratorDecimal, variance.denominatorInteger, 4));
    }
    case "population_pnl_standard_deviation": {
      const variance = populationVariance(values);
      return variance === null ? unavailable("zero_eligible_trade_denominator") : withBasisState(population, moneyBasis, decimal(roundedSquareRootRational(variance.numeratorDecimal, variance.denominatorInteger)));
    }
    case "largest_instrument_trade_share": {
      if (rows.length === 0) return unavailable("zero_eligible_trade_denominator");
      const counts = new Map<string, number>();
      for (const row of rows) counts.set(row.instrumentId, (counts.get(row.instrumentId) ?? 0) + 1);
      return complete(percentage(String(Math.max(...counts.values())), String(rows.length)));
    }
    case "largest_instrument_pnl_share": return largestGroupedShare(rows, moneyBasis, (row) => row.instrumentId, (row) => basisValue(row, moneyBasis));
    case "largest_instrument_notional_share": return largestGroupedShare(rows, moneyBasis, (row) => row.instrumentId, (row) => row.entryNotionalDecimal);
    case "largest_direction_pnl_share": return largestGroupedShare(rows, moneyBasis, (row) => row.direction, (row) => basisValue(row, moneyBasis));
    case "largest_day_pnl_share": return largestGroupedShare(rows, moneyBasis, (row) => row.closeLocal.localDate, (row) => basisValue(row, moneyBasis));
    case "largest_provenance_pnl_share": return largestGroupedShare(rows, moneyBasis, (row) => row.provenanceGroup, (row) => basisValue(row, moneyBasis));
    default:
      return null;
  }
}
