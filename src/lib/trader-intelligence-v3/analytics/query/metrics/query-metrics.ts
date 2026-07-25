import {
  createExactRatio,
  decimalToExactRatio,
  validateExactDecimal,
  type ExactRatio,
} from "../../../domain/exact";
import type { ExactMetricValue } from "../../contracts";
import {
  absoluteExactDecimal,
  compareCanonicalDecimals,
  decimalMetric,
  integerMetric,
  medianMetric,
  quotientMetric,
  ratioFromCounts,
  ratioFromDecimals,
  ratioMetric,
  sumExactDecimals,
  unavailableMetric,
} from "../../tools/weekday";
import type { QueryRowSemantics } from "../execution/row-semantics";
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

function maximum(values: readonly string[]): string | null {
  if (values.length === 0) return null;
  return [...values].sort(compareCanonicalDecimals).at(-1) ?? null;
}

function minimum(values: readonly string[]): string | null {
  if (values.length === 0) return null;
  return [...values].sort(compareCanonicalDecimals)[0] ?? null;
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
  expectedCount: number,
): boolean {
  return values.length === expectedCount;
}

function availableAverage(
  key: TradeQueryMetricKey,
  unit: string,
  currency: string | null,
  values: readonly string[],
  expectedCount: number,
): ExactMetricValue {
  return fullyAvailable(values, expectedCount)
    ? quotientMetric(key, unit, currency, sum(values), String(values.length))
    : unavailableMetric(
        key,
        unit,
        currency,
        "ti_v3_query_required_authority_unavailable",
      );
}

function availableMedian(
  key: TradeQueryMetricKey,
  unit: string,
  currency: string | null,
  values: readonly string[],
  expectedCount: number,
): ExactMetricValue {
  return fullyAvailable(values, expectedCount)
    ? medianMetric(key, unit, currency, values)
    : unavailableMetric(
        key,
        unit,
        currency,
        "ti_v3_query_required_authority_unavailable",
      );
}

function largestWinner(a: TradeQueryAccumulator): QueryRowSemantics | null {
  return [...a.wins].sort((left, right) =>
    compareCanonicalDecimals(right.row.netPnl, left.row.netPnl))[0] ?? null;
}

function largestLoser(a: TradeQueryAccumulator): QueryRowSemantics | null {
  return [...a.losses].sort((left, right) =>
    compareCanonicalDecimals(left.row.netPnl, right.row.netPnl))[0] ?? null;
}

function withoutRows(
  rows: readonly QueryRowSemantics[],
  removedKeys: ReadonlySet<string>,
): string {
  return sum(rows
    .filter((item) => !removedKeys.has(item.row.semanticRoundTripKey))
    .map((item) => item.row.netPnl));
}

function metricFor(
  key: TradeQueryMetricKey,
  a: TradeQueryAccumulator,
): ExactMetricValue {
  getTradeQueryMetricDeclaration(key);
  const rowCount = a.rows.length;
  const net = sum(a.netValues);
  const grossProfit = sum(a.grossProfitValues);
  const grossLoss = sum(a.grossLossValues);
  const dailyPnl = a.daily.map((day) => day.netPnl);
  const profitableDays = a.daily.filter((day) =>
    compareCanonicalDecimals(day.netPnl, "0") > 0);
  const losingDays = a.daily.filter((day) =>
    compareCanonicalDecimals(day.netPnl, "0") < 0);
  const flatDays = a.daily.filter((day) =>
    compareCanonicalDecimals(day.netPnl, "0") === 0);
  const winner = largestWinner(a);
  const loser = largestLoser(a);
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
      return integerMetric(key, "trades", String(a.daily.length));
    case "unique_account_count":
      return integerMetric(
        key,
        "trades",
        String(new Set(a.rows.map((item) => item.row.canonicalAccountKey)).size),
      );
    case "unique_symbol_count":
      return integerMetric(
        key,
        "trades",
        String(new Set(a.rows.map((item) => item.row.stableInstrumentKey)).size),
      );
    case "total_execution_count":
      return integerMetric(key, "trades", a.totalExecutionCount);
    case "average_executions_per_trade":
      return ratioFromCounts(key, a.totalExecutionCount, String(rowCount));
    case "total_trades":
      return integerMetric(key, "trades", String(rowCount));
    case "average_trades_per_trading_day":
      return ratioFromCounts(key, String(rowCount), String(a.daily.length));
    case "median_trades_per_trading_day":
      return medianMetric(key, "trades", null, a.daily.map((day) => day.tradeCount));
    case "maximum_trades_per_trading_day":
      return integerMetric(
        key,
        "trades",
        maximum(a.daily.map((day) => day.tradeCount)) ?? "0",
      );
    case "minimum_trades_per_trading_day":
      return a.daily.length === 0
        ? unavailableMetric(key, "trades", null, "ti_v3_query_zero_sample")
        : integerMetric(key, "trades", minimum(a.daily.map((day) => day.tradeCount)) ?? "0");
    case "long_trade_count":
      return integerMetric(key, "trades", a.longCount);
    case "short_trade_count":
      return integerMetric(key, "trades", a.shortCount);
    case "long_trade_percentage":
      return ratioFromCounts(key, a.longCount, String(rowCount));
    case "short_trade_percentage":
      return ratioFromCounts(key, a.shortCount, String(rowCount));
    case "average_attempts_per_symbol":
      return ratioFromCounts(key, String(rowCount), String(a.tradesPerSymbol.length));
    case "median_attempts_per_symbol":
      return medianMetric(key, "trades", null, a.tradesPerSymbol);
    case "repeat_attempt_trade_count":
      return integerMetric(key, "trades", a.repeatAttemptCount);
    case "repeat_attempt_percentage":
      return ratioFromCounts(key, a.repeatAttemptCount, String(rowCount));
    case "gross_profit":
      return decimalMetric(key, "money", a.currency, grossProfit);
    case "gross_loss":
      return decimalMetric(key, "money", a.currency, grossLoss);
    case "gross_pnl":
      return decimalMetric(key, "money", a.currency, sum(a.grossValues));
    case "signed_charges":
      return decimalMetric(key, "money", a.currency, sum(a.chargeValues));
    case "net_pnl":
      return decimalMetric(key, "money", a.currency, net);
    case "average_pnl":
    case "expectancy":
      return quotientMetric(key, "money", a.currency, net, String(rowCount));
    case "median_pnl":
      return medianMetric(key, "money", a.currency, a.netValues);
    case "average_daily_pnl":
      return quotientMetric(key, "money", a.currency, sum(dailyPnl), String(dailyPnl.length));
    case "median_daily_pnl":
      return medianMetric(key, "money", a.currency, dailyPnl);
    case "best_trade":
      return decimalOrUnavailable(key, "money", a.currency, maximum(a.netValues));
    case "worst_trade":
      return decimalOrUnavailable(key, "money", a.currency, minimum(a.netValues));
    case "best_trading_day":
      return decimalOrUnavailable(key, "money", a.currency, maximum(dailyPnl));
    case "worst_trading_day":
      return decimalOrUnavailable(key, "money", a.currency, minimum(dailyPnl));
    case "win_count":
      return integerMetric(key, "trades", String(a.wins.length));
    case "loss_count":
      return integerMetric(key, "trades", String(a.losses.length));
    case "flat_count":
      return integerMetric(key, "trades", String(a.flats.length));
    case "win_rate":
      return ratioFromCounts(key, String(a.wins.length), String(rowCount));
    case "loss_rate":
      return ratioFromCounts(key, String(a.losses.length), String(rowCount));
    case "flat_rate":
      return ratioFromCounts(key, String(a.flats.length), String(rowCount));
    case "average_winning_trade":
      return quotientMetric(
        key,
        "money",
        a.currency,
        sum(a.wins.map((item) => item.row.netPnl)),
        String(a.wins.length),
      );
    case "median_winning_trade":
      return medianMetric(
        key,
        "money",
        a.currency,
        a.wins.map((item) => item.row.netPnl),
      );
    case "average_losing_trade":
      return quotientMetric(
        key,
        "money",
        a.currency,
        sum(a.losses.map((item) => item.row.netPnl)),
        String(a.losses.length),
      );
    case "median_losing_trade":
      return medianMetric(
        key,
        "money",
        a.currency,
        a.losses.map((item) => item.row.netPnl),
      );
    case "average_win_loss_ratio": {
      if (a.wins.length === 0 || a.losses.length === 0) {
        return unavailableMetric(key, "ratio", null, "ti_v3_query_zero_sample");
      }
      const winSum = sum(a.wins.map((item) => item.row.netPnl));
      const lossSum = absoluteExactDecimal(
        sum(a.losses.map((item) => item.row.netPnl)),
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
      const winMedian = medianMetric(
        "median_win_value",
        "money",
        a.currency,
        a.wins.map((item) => item.row.netPnl),
      );
      const lossMedian = medianMetric(
        "median_loss_value",
        "money",
        a.currency,
        a.losses.map((item) => item.row.netPnl),
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
      const grossWins = sum(a.wins.map((item) => item.row.netPnl));
      const grossLosses = absoluteExactDecimal(
        sum(a.losses.map((item) => item.row.netPnl)),
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
        sum(a.wins.map((item) => item.row.netPnl)),
        String(a.wins.length),
      );
      const lossSum = absoluteExactDecimal(
        sum(a.losses.map((item) => item.row.netPnl)),
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
      return averageDuration(key, a.totalHoldingNanoseconds, rowCount);
    case "median_holding_time":
      return medianMetric(key, "seconds", null, a.holdingSecondsValues);
    case "minimum_holding_time":
      return decimalOrUnavailable(
        key,
        "seconds",
        null,
        minimum(a.holdingSecondsValues),
      );
    case "maximum_holding_time":
      return decimalOrUnavailable(
        key,
        "seconds",
        null,
        maximum(a.holdingSecondsValues),
      );
    case "average_winner_holding_time":
      return averageDuration(key, a.winnerHoldingNanoseconds, a.wins.length);
    case "average_loser_holding_time":
      return averageDuration(key, a.loserHoldingNanoseconds, a.losses.length);
    case "median_winner_holding_time":
      return medianMetric(key, "seconds", null, a.winnerHoldingSecondsValues);
    case "median_loser_holding_time":
      return medianMetric(key, "seconds", null, a.loserHoldingSecondsValues);
    case "average_share_quantity":
      return availableAverage(
        key,
        "shares",
        null,
        a.shareQuantityValues,
        rowCount,
      );
    case "median_share_quantity":
      return availableMedian(
        key,
        "shares",
        null,
        a.shareQuantityValues,
        rowCount,
      );
    case "maximum_share_quantity":
      return fullyAvailable(a.shareQuantityValues, rowCount)
        ? decimalOrUnavailable(
            key,
            "shares",
            null,
            maximum(a.shareQuantityValues),
          )
        : unavailableMetric(
            key,
            "shares",
            null,
            "ti_v3_query_required_authority_unavailable",
          );
    case "average_entry_notional":
    case "average_position_size":
      return availableAverage(
        key,
        "money",
        a.currency,
        a.entryNotionalValues,
        rowCount,
      );
    case "median_entry_notional":
    case "median_position_size":
      return availableMedian(
        key,
        "money",
        a.currency,
        a.entryNotionalValues,
        rowCount,
      );
    case "maximum_entry_notional":
      return fullyAvailable(a.entryNotionalValues, rowCount)
        ? decimalOrUnavailable(
            key,
            "money",
            a.currency,
            maximum(a.entryNotionalValues),
          )
        : unavailableMetric(
            key,
            "money",
            a.currency,
            "ti_v3_query_required_authority_unavailable",
          );
    case "average_winner_entry_notional":
      return availableAverage(
        key,
        "money",
        a.currency,
        a.winnerEntryNotionalValues,
        a.wins.length,
      );
    case "average_loser_entry_notional":
      return availableAverage(
        key,
        "money",
        a.currency,
        a.loserEntryNotionalValues,
        a.losses.length,
      );
    case "median_winner_entry_notional":
      return availableMedian(
        key,
        "money",
        a.currency,
        a.winnerEntryNotionalValues,
        a.wins.length,
      );
    case "median_loser_entry_notional":
      return availableMedian(
        key,
        "money",
        a.currency,
        a.loserEntryNotionalValues,
        a.losses.length,
      );
    case "net_pnl_per_100_shares":
      return fullyAvailable(a.shareQuantityValues, rowCount)
        ? exactRatio(
            key,
            "money",
            a.currency,
            net,
            sum(a.shareQuantityValues),
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
            sum(a.entryNotionalValues),
          )
        : unavailableMetric(
            key,
            "ratio",
            null,
            "ti_v3_query_required_authority_unavailable",
          );
    case "profitable_trading_day_count":
      return integerMetric(key, "trades", String(profitableDays.length));
    case "losing_trading_day_count":
      return integerMetric(key, "trades", String(losingDays.length));
    case "flat_trading_day_count":
      return integerMetric(key, "trades", String(flatDays.length));
    case "profitable_day_percentage":
      return ratioFromCounts(key, String(profitableDays.length), String(a.daily.length));
    case "losing_day_percentage":
      return ratioFromCounts(key, String(losingDays.length), String(a.daily.length));
    case "flat_day_percentage":
      return ratioFromCounts(key, String(flatDays.length), String(a.daily.length));
    case "longest_winning_trade_streak":
      return integerMetric(
        key,
        "trades",
        maximum(a.winningStreakLengths) ?? "0",
      );
    case "longest_losing_trade_streak":
      return integerMetric(
        key,
        "trades",
        maximum(a.losingStreakLengths) ?? "0",
      );
    case "largest_winner_contribution":
      return winner === null
        ? unavailableMetric(key, "money", a.currency, "ti_v3_query_no_winning_trade")
        : decimalMetric(key, "money", a.currency, winner.row.netPnl);
    case "largest_loser_contribution":
      return loser === null
        ? unavailableMetric(key, "money", a.currency, "ti_v3_query_no_losing_trade")
        : decimalMetric(key, "money", a.currency, loser.row.netPnl);
    case "net_pnl_excluding_largest_winner":
      return winner === null
        ? unavailableMetric(key, "money", a.currency, "ti_v3_query_no_winning_trade")
        : decimalMetric(
            key,
            "money",
            a.currency,
            withoutRows(a.rows, new Set([winner.row.semanticRoundTripKey])),
          );
    case "net_pnl_excluding_largest_loser":
      return loser === null
        ? unavailableMetric(key, "money", a.currency, "ti_v3_query_no_losing_trade")
        : decimalMetric(
            key,
            "money",
            a.currency,
            withoutRows(a.rows, new Set([loser.row.semanticRoundTripKey])),
          );
    case "net_pnl_excluding_largest_winner_and_loser":
      return winner === null || loser === null
        ? unavailableMetric(key, "money", a.currency, "ti_v3_query_zero_sample")
        : decimalMetric(
            key,
            "money",
            a.currency,
            withoutRows(
              a.rows,
              new Set([
                winner.row.semanticRoundTripKey,
                loser.row.semanticRoundTripKey,
              ]),
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
