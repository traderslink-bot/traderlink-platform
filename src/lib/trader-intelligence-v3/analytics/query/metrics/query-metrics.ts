import {
  createExactRatio,
  decimalToExactRatio,
  validateExactDecimal,
  type ExactRatio,
} from "../../../domain/exact";
import type { ExactMetricValue } from "../../contracts";
import type { QueryRowSemantics } from "../execution/row-semantics";
import {
  absoluteExactDecimal,
  compareCanonicalDecimals,
  decimalMetric,
  integerMetric,
  quotientMetric,
  ratioFromCounts,
  ratioFromDecimals,
  ratioMetric,
  sumExactDecimals,
  unavailableMetric,
} from "../../tools/weekday";
import {
  getTradeQueryMetricDeclaration,
  type TradeQueryMetricKey,
} from "./metric-registry";
import {
  buildTradeQueryAccumulator,
  type TradeQueryAccumulator,
} from "./query-accumulator";

export interface QueryMetricCounts {
  readonly candidateCount: string;
  readonly includedCount: string;
  readonly excludedCount: string;
}

function decimalRatio(value: string): ExactRatio {
  const parsed = validateExactDecimal(value);
  if (!parsed.ok) throw new Error(parsed.error.code);
  const ratio = decimalToExactRatio(parsed.value);
  if (!ratio.ok) throw new Error(ratio.error.code);
  return ratio.value;
}

function sum(values: readonly string[]): string {
  const result = sumExactDecimals(values);
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return result.value;
}

function decimalOrUnavailable(
  key: TradeQueryMetricKey,
  unit: string,
  currency: string | null,
  value: string | null,
  reasonCode = "ti_v3_query_zero_sample",
): ExactMetricValue {
  return value === null
    ? unavailableMetric(key, unit, currency, reasonCode)
    : decimalMetric(key, unit, currency, value);
}

function exactRatio(
  key: TradeQueryMetricKey,
  unit: string,
  currency: string | null,
  numerator: string,
  denominator: string,
  numeratorScale = BigInt("1"),
): ExactMetricValue {
  const left = decimalRatio(numerator);
  const right = decimalRatio(denominator);
  if (BigInt(right.numerator) === BigInt("0")) {
    return unavailableMetric(
      key,
      unit,
      currency,
      "ti_v3_query_zero_denominator",
    );
  }
  const ratio = createExactRatio(
    (
      BigInt(left.numerator) *
      BigInt(right.denominator) *
      numeratorScale
    ).toString(),
    (
      BigInt(left.denominator) *
      BigInt(right.numerator)
    ).toString(),
  );
  if (!ratio.ok) throw new Error(ratio.error.code);
  return ratioMetric(key, unit, currency, ratio.value);
}

function averageDuration(
  key: TradeQueryMetricKey,
  totalNanoseconds: bigint,
  count: number,
): ExactMetricValue {
  if (count === 0) {
    return unavailableMetric(key, "seconds", null, "ti_v3_query_zero_sample");
  }
  const ratio = createExactRatio(
    totalNanoseconds.toString(),
    (BigInt(count) * BigInt("1000000000")).toString(),
  );
  if (!ratio.ok) throw new Error(ratio.error.code);
  return ratioMetric(key, "seconds", null, ratio.value);
}

function fullyAvailable(
  values: readonly string[],
  expectedCount: string,
): boolean {
  return BigInt(values.length) === BigInt(expectedCount);
}

function availableMedian(
  key: TradeQueryMetricKey,
  unit: string,
  currency: string | null,
  values: readonly string[],
  expectedCount: string,
): ExactMetricValue {
  return fullyAvailable(values, expectedCount)
    ? medianFromSorted(key, unit, currency, values)
    : unavailableMetric(
        key,
        unit,
        currency,
        "ti_v3_query_required_authority_unavailable",
      );
}

function availableAverageFromTotal(
  key: TradeQueryMetricKey,
  unit: string,
  currency: string | null,
  total: string,
  availableValues: readonly string[],
  expectedCount: string,
): ExactMetricValue {
  return fullyAvailable(availableValues, expectedCount)
    ? quotientMetric(key, unit, currency, total, expectedCount)
    : unavailableMetric(
        key,
        unit,
        currency,
        "ti_v3_query_required_authority_unavailable",
      );
}

function subtractDecimal(left: string, right: string): string {
  const parsed = validateExactDecimal(right);
  if (!parsed.ok) throw new Error(parsed.error.code);
  const negated = parsed.value.startsWith("-") ? parsed.value.slice(1) : `-${parsed.value}`;
  return sum([left, negated]);
}

function medianFromSorted(
  key: string,
  unit: string,
  currency: string | null,
  values: readonly string[],
): ExactMetricValue {
  if (values.length === 0) {
    return unavailableMetric(key, unit, currency, "ti_v3_query_zero_sample");
  }
  const middle = (values.length - (values.length % 2)) / 2;
  if (values.length % 2 === 1) return decimalMetric(key, unit, currency, values[middle]);
  return quotientMetric(key, unit, currency, sum([values[middle - 1], values[middle]]), "2");
}

function metricFor(
  key: TradeQueryMetricKey,
  a: TradeQueryAccumulator,
): ExactMetricValue {
  getTradeQueryMetricDeclaration(key);
  const rowCount = a.rowCount;
  const net = a.netPnl;
  const grossProfit = a.grossProfit;
  const grossLoss = a.grossLoss;
  const dailyPnl = a.dailyPnlValues;
  switch (key) {
    case "candidate_count":
      return integerMetric(key, "trades", a.counts.candidateCount);
    case "included_count":
      return integerMetric(key, "trades", a.counts.includedCount);
    case "excluded_count":
      return integerMetric(key, "trades", a.counts.excludedCount);
    case "inclusion_rate":
      return ratioFromCounts(key, a.counts.includedCount, a.counts.candidateCount);
    case "exclusion_rate":
      return ratioFromCounts(key, a.counts.excludedCount, a.counts.candidateCount);
    case "trading_day_count":
      return integerMetric(key, "days", String(a.daily.length));
    case "unique_account_count":
      return integerMetric(
        key,
        "accounts",
        a.uniqueAccountCount,
      );
    case "unique_symbol_count":
      return integerMetric(
        key,
        "symbols",
        a.uniqueSymbolCount,
      );
    case "total_execution_count":
      return integerMetric(key, "executions", a.totalExecutionCount);
    case "average_executions_per_trade":
      return ratioFromCounts(key, a.totalExecutionCount, rowCount);
    case "total_trades":
      return integerMetric(key, "trades", rowCount);
    case "average_trades_per_trading_day":
      return ratioFromCounts(key, rowCount, String(a.daily.length));
    case "median_trades_per_trading_day":
      return medianFromSorted(key, "trades", null, a.sortedDailyTradeCounts);
    case "maximum_trades_per_trading_day":
      return integerMetric(
        key,
        "trades",
        a.maximumTradesPerDay ?? "0",
      );
    case "minimum_trades_per_trading_day":
      return a.daily.length === 0
        ? unavailableMetric(key, "trades", null, "ti_v3_query_zero_sample")
        : integerMetric(key, "trades", a.minimumTradesPerDay ?? "0");
    case "long_trade_count":
      return integerMetric(key, "trades", a.longCount);
    case "short_trade_count":
      return integerMetric(key, "trades", a.shortCount);
    case "long_trade_percentage":
      return ratioFromCounts(key, a.longCount, rowCount);
    case "short_trade_percentage":
      return ratioFromCounts(key, a.shortCount, rowCount);
    case "average_attempts_per_symbol":
      return ratioFromCounts(key, rowCount, String(a.tradesPerSymbol.length));
    case "median_attempts_per_symbol":
      return medianFromSorted(key, "trades", null, a.sortedTradesPerSymbol);
    case "repeat_attempt_trade_count":
      return integerMetric(key, "trades", a.repeatAttemptCount);
    case "repeat_attempt_percentage":
      return ratioFromCounts(key, a.repeatAttemptCount, rowCount);
    case "gross_profit":
      return decimalMetric(key, "money", a.currency, grossProfit);
    case "gross_loss":
      return decimalMetric(key, "money", a.currency, grossLoss);
    case "gross_pnl":
      return decimalMetric(key, "money", a.currency, a.grossPnl);
    case "signed_charges":
      return decimalMetric(key, "money", a.currency, a.signedCharges);
    case "net_pnl":
      return decimalMetric(key, "money", a.currency, net);
    case "average_pnl":
    case "expectancy":
      return quotientMetric(key, "money", a.currency, net, rowCount);
    case "median_pnl":
      return medianFromSorted(key, "money", a.currency, a.sortedNetValues);
    case "average_daily_pnl":
      return quotientMetric(key, "money", a.currency, net, String(dailyPnl.length));
    case "median_daily_pnl":
      return medianFromSorted(key, "money", a.currency, a.sortedDailyPnlValues);
    case "best_trade":
      return decimalOrUnavailable(key, "money", a.currency, a.maximumNetPnl);
    case "worst_trade":
      return decimalOrUnavailable(key, "money", a.currency, a.minimumNetPnl);
    case "best_trading_day":
      return decimalOrUnavailable(key, "money", a.currency, a.maximumDailyPnl);
    case "worst_trading_day":
      return decimalOrUnavailable(key, "money", a.currency, a.minimumDailyPnl);
    case "win_count":
      return integerMetric(key, "trades", String(a.wins.length));
    case "loss_count":
      return integerMetric(key, "trades", String(a.losses.length));
    case "flat_count":
      return integerMetric(key, "trades", String(a.flats.length));
    case "win_rate":
      return ratioFromCounts(key, String(a.wins.length), rowCount);
    case "loss_rate":
      return ratioFromCounts(key, String(a.losses.length), rowCount);
    case "flat_rate":
      return ratioFromCounts(key, String(a.flats.length), rowCount);
    case "average_winning_trade":
      return quotientMetric(
        key,
        "money",
        a.currency,
        a.winningNetPnl,
        String(a.wins.length),
      );
    case "median_winning_trade":
      return medianFromSorted(
        key,
        "money",
        a.currency,
        a.sortedWinningNetValues,
      );
    case "average_losing_trade":
      return quotientMetric(
        key,
        "money",
        a.currency,
        a.losingNetPnl,
        String(a.losses.length),
      );
    case "median_losing_trade":
      return medianFromSorted(
        key,
        "money",
        a.currency,
        a.sortedLosingNetValues,
      );
    case "average_win_loss_ratio": {
      if (a.wins.length === 0 || a.losses.length === 0) {
        return unavailableMetric(key, "ratio", null, "ti_v3_query_zero_sample");
      }
      const winSum = a.winningNetPnl;
      const lossSum = absoluteExactDecimal(
        a.losingNetPnl,
      );
      if (!lossSum.ok || lossSum.value === "0") {
        return unavailableMetric(key, "ratio", null, "ti_v3_query_zero_denominator");
      }
      const numerator = decimalRatio(winSum);
      const denominator = decimalRatio(lossSum.value);
      const ratio = createExactRatio(
        (
          BigInt(numerator.numerator) *
          BigInt(denominator.denominator) *
          BigInt(a.losses.length)
        ).toString(),
        (
          BigInt(numerator.denominator) *
          BigInt(denominator.numerator) *
          BigInt(a.wins.length)
        ).toString(),
      );
      if (!ratio.ok) throw new Error(ratio.error.code);
      return ratioMetric(key, "ratio", null, ratio.value);
    }
    case "median_win_loss_ratio": {
      if (a.wins.length === 0 || a.losses.length === 0) {
        return unavailableMetric(key, "ratio", null, "ti_v3_query_zero_sample");
      }
      const winMedian = medianFromSorted(
        "median_win_value",
        "money",
        a.currency,
        a.sortedWinningNetValues,
      );
      const lossMedian = medianFromSorted(
        "median_loss_value",
        "money",
        a.currency,
        a.sortedLosingNetValues,
      );
      if (winMedian.kind !== "exact_decimal" || lossMedian.kind !== "exact_decimal") {
        return unavailableMetric(key, "ratio", null, "ti_v3_query_zero_sample");
      }
      const loss = absoluteExactDecimal(lossMedian.value);
      return loss.ok
        ? ratioFromDecimals(key, winMedian.value, loss.value)
        : unavailableMetric(key, "ratio", null, "ti_v3_query_zero_denominator");
    }
    case "profit_factor": {
      const grossWins = a.winningNetPnl;
      const grossLosses = absoluteExactDecimal(
        a.losingNetPnl,
      );
      return !grossLosses.ok || grossLosses.value === "0"
        ? unavailableMetric(
            key,
            "ratio",
            null,
            "ti_v3_query_profit_factor_zero_loss_denominator",
          )
        : ratioFromDecimals(key, grossWins, grossLosses.value);
    }
    case "breakeven_win_rate": {
      if (a.wins.length === 0 || a.losses.length === 0) {
        return unavailableMetric(key, "ratio", null, "ti_v3_query_zero_sample");
      }
      const averageWin = exactRatio(
        key,
        "ratio",
        null,
        a.winningNetPnl,
        String(a.wins.length),
      );
      const lossSum = absoluteExactDecimal(
        a.losingNetPnl,
      );
      if (!lossSum.ok) {
        return unavailableMetric(key, "ratio", null, "ti_v3_query_zero_denominator");
      }
      const averageLoss = exactRatio(
        key,
        "ratio",
        null,
        lossSum.value,
        String(a.losses.length),
      );
      if (
        averageWin.kind !== "exact_ratio" ||
        averageLoss.kind !== "exact_ratio"
      ) return unavailableMetric(key, "ratio", null, "ti_v3_query_zero_denominator");
      const numerator = BigInt(averageLoss.numerator) * BigInt(averageWin.denominator);
      const denominator =
        numerator +
        BigInt(averageWin.numerator) * BigInt(averageLoss.denominator);
      const ratio = createExactRatio(numerator.toString(), denominator.toString());
      if (!ratio.ok) throw new Error(ratio.error.code);
      return ratioMetric(key, "ratio", null, ratio.value);
    }
    case "average_holding_time":
      return averageDuration(key, a.totalHoldingNanoseconds, a.rows.length);
    case "median_holding_time":
      return medianFromSorted(key, "seconds", null, a.sortedHoldingSecondsValues);
    case "minimum_holding_time":
      return decimalOrUnavailable(
        key,
        "seconds",
        null,
        a.minimumHoldingSeconds,
      );
    case "maximum_holding_time":
      return decimalOrUnavailable(
        key,
        "seconds",
        null,
        a.maximumHoldingSeconds,
      );
    case "average_winner_holding_time":
      return averageDuration(key, a.winnerHoldingNanoseconds, a.wins.length);
    case "average_loser_holding_time":
      return averageDuration(key, a.loserHoldingNanoseconds, a.losses.length);
    case "median_winner_holding_time":
      return medianFromSorted(key, "seconds", null, a.sortedWinnerHoldingSecondsValues);
    case "median_loser_holding_time":
      return medianFromSorted(key, "seconds", null, a.sortedLoserHoldingSecondsValues);
    case "average_share_quantity":
      return availableAverageFromTotal(
        key,
        "shares",
        null,
        a.totalShareQuantity,
        a.shareQuantityValues,
        rowCount,
      );
    case "median_share_quantity":
      return availableMedian(
        key,
        "shares",
        null,
        a.sortedShareQuantityValues,
        rowCount,
      );
    case "maximum_share_quantity":
      return fullyAvailable(a.shareQuantityValues, rowCount)
        ? decimalOrUnavailable(
            key,
            "shares",
            null,
            a.maximumShareQuantity,
          )
        : unavailableMetric(
            key,
            "shares",
            null,
            "ti_v3_query_required_authority_unavailable",
          );
    case "average_entry_notional":
    case "average_position_size":
      return availableAverageFromTotal(
        key,
        "money",
        a.currency,
        a.totalEntryNotional,
        a.entryNotionalValues,
        rowCount,
      );
    case "median_entry_notional":
    case "median_position_size":
      return availableMedian(
        key,
        "money",
        a.currency,
        a.sortedEntryNotionalValues,
        rowCount,
      );
    case "maximum_entry_notional":
      return fullyAvailable(a.entryNotionalValues, rowCount)
        ? decimalOrUnavailable(
            key,
            "money",
            a.currency,
            a.maximumEntryNotional,
          )
        : unavailableMetric(
            key,
            "money",
            a.currency,
            "ti_v3_query_required_authority_unavailable",
          );
    case "average_winner_entry_notional":
      return availableAverageFromTotal(
        key,
        "money",
        a.currency,
        a.winnerEntryNotional,
        a.winnerEntryNotionalValues,
        String(a.wins.length),
      );
    case "average_loser_entry_notional":
      return availableAverageFromTotal(
        key,
        "money",
        a.currency,
        a.loserEntryNotional,
        a.loserEntryNotionalValues,
        String(a.losses.length),
      );
    case "median_winner_entry_notional":
      return availableMedian(
        key,
        "money",
        a.currency,
        a.sortedWinnerEntryNotionalValues,
        String(a.wins.length),
      );
    case "median_loser_entry_notional":
      return availableMedian(
        key,
        "money",
        a.currency,
        a.sortedLoserEntryNotionalValues,
        String(a.losses.length),
      );
    case "net_pnl_per_100_shares":
      return fullyAvailable(a.shareQuantityValues, rowCount)
        ? exactRatio(
            key,
            "money",
            a.currency,
            net,
            a.totalShareQuantity,
            BigInt("100"),
          )
        : unavailableMetric(
            key,
            "money",
            a.currency,
            "ti_v3_query_required_authority_unavailable",
          );
    case "return_on_entry_notional":
      return fullyAvailable(a.entryNotionalValues, rowCount)
        ? exactRatio(
            key,
            "ratio",
            null,
            net,
            a.totalEntryNotional,
          )
        : unavailableMetric(
            key,
            "ratio",
            null,
            "ti_v3_query_required_authority_unavailable",
          );
    case "profitable_trading_day_count":
      return integerMetric(key, "days", a.profitableDayCount);
    case "losing_trading_day_count":
      return integerMetric(key, "days", a.losingDayCount);
    case "flat_trading_day_count":
      return integerMetric(key, "days", a.flatDayCount);
    case "profitable_day_percentage":
      return ratioFromCounts(key, a.profitableDayCount, String(a.daily.length));
    case "losing_day_percentage":
      return ratioFromCounts(key, a.losingDayCount, String(a.daily.length));
    case "flat_day_percentage":
      return ratioFromCounts(key, a.flatDayCount, String(a.daily.length));
    case "maximum_intraday_drawdown":
      return decimalOrUnavailable(key, "money", a.currency, a.maximumIntradayDrawdown);
    case "maximum_peak_profit_giveback":
      return decimalOrUnavailable(key, "money", a.currency, a.maximumPeakProfitGiveback);
    case "longest_winning_trade_streak":
      return integerMetric(
        key,
        "trades",
        a.sortedWinningStreakLengths.at(-1) ?? "0",
      );
    case "longest_losing_trade_streak":
      return integerMetric(
        key,
        "trades",
        a.sortedLosingStreakLengths.at(-1) ?? "0",
      );
    case "largest_winner_contribution":
      return a.largestWinnerNetPnl === null
        ? unavailableMetric(key, "money", a.currency, "ti_v3_query_no_winning_trade")
        : decimalMetric(key, "money", a.currency, a.largestWinnerNetPnl);
    case "largest_loser_contribution":
      return a.largestLoserNetPnl === null
        ? unavailableMetric(key, "money", a.currency, "ti_v3_query_no_losing_trade")
        : decimalMetric(key, "money", a.currency, a.largestLoserNetPnl);
    case "net_pnl_excluding_largest_winner":
      return a.largestWinnerNetPnl === null
        ? unavailableMetric(key, "money", a.currency, "ti_v3_query_no_winning_trade")
        : decimalMetric(
            key,
            "money",
            a.currency,
            subtractDecimal(net, a.largestWinnerNetPnl),
          );
    case "net_pnl_excluding_largest_loser":
      return a.largestLoserNetPnl === null
        ? unavailableMetric(key, "money", a.currency, "ti_v3_query_no_losing_trade")
        : decimalMetric(
            key,
            "money",
            a.currency,
            subtractDecimal(net, a.largestLoserNetPnl),
          );
    case "net_pnl_excluding_largest_winner_and_loser":
      return a.largestWinnerNetPnl === null || a.largestLoserNetPnl === null
        ? unavailableMetric(key, "money", a.currency, "ti_v3_query_zero_sample")
        : decimalMetric(
            key,
            "money",
            a.currency,
            subtractDecimal(
              subtractDecimal(net, a.largestWinnerNetPnl),
              a.largestLoserNetPnl,
            ),
          );
  }
}

export function calculateTradeQueryMetrics(
  selected: readonly TradeQueryMetricKey[],
  rows: readonly QueryRowSemantics[],
  counts: QueryMetricCounts,
  currency: string,
): readonly ExactMetricValue[] {
  const accumulator = buildTradeQueryAccumulator(rows, counts, currency);
  return Object.freeze(selected.map((key) => metricFor(key, accumulator)));
}

export function metricSortValue(
  metric: ExactMetricValue,
): readonly [bigint, bigint] | null {
  if (metric.kind === "integer") return [BigInt(metric.value), BigInt("1")];
  if (metric.kind === "exact_decimal") {
    const ratio = decimalRatio(metric.value);
    return [BigInt(ratio.numerator), BigInt(ratio.denominator)];
  }
  if (metric.kind === "exact_ratio") {
    return [BigInt(metric.numerator), BigInt(metric.denominator)];
  }
  return null;
}
