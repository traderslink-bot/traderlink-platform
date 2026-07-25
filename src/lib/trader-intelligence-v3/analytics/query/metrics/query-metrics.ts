import {
  createExactRatio,
  decimalToExactRatio,
  validateExactDecimal,
} from "../../../domain/exact";
import {
  type ExactMetricValue,
} from "../../contracts";
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
import type { TradeQueryMetricKey } from "../contracts/query-plan";
import type { QueryRowSemantics } from "../execution/row-semantics";

export interface QueryMetricCounts {
  readonly candidateCount: string;
  readonly includedCount: string;
  readonly excludedCount: string;
}

function decimalRatio(value: string) {
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

function positionValues(rows: readonly QueryRowSemantics[]): readonly string[] {
  return rows.flatMap((item) =>
    item.row.entryNotional.state === "available" ? [item.row.entryNotional.amount] : []);
}

function holdingValues(rows: readonly QueryRowSemantics[]): readonly string[] {
  return rows.map((item) => item.holdingSecondsFloor.toString());
}

function metricFor(
  key: TradeQueryMetricKey,
  rows: readonly QueryRowSemantics[],
  counts: QueryMetricCounts,
  currency: string,
): ExactMetricValue {
  const pnl = rows.map((item) => item.row.netPnl);
  const wins = rows.filter((item) => item.outcome === "gain");
  const losses = rows.filter((item) => item.outcome === "loss");
  const flats = rows.filter((item) => item.outcome === "flat");
  const net = sum(pnl);
  switch (key) {
    case "candidate_count": return integerMetric(key, "trades", counts.candidateCount);
    case "included_count": return integerMetric(key, "trades", counts.includedCount);
    case "excluded_count": return integerMetric(key, "trades", counts.excludedCount);
    case "win_count": return integerMetric(key, "trades", String(wins.length));
    case "loss_count": return integerMetric(key, "trades", String(losses.length));
    case "flat_count": return integerMetric(key, "trades", String(flats.length));
    case "gross_pnl": return decimalMetric(key, "money", currency, sum(rows.map((item) => item.row.grossPnl)));
    case "signed_charges": return decimalMetric(key, "money", currency, sum(rows.map((item) => item.row.signedCharges)));
    case "net_pnl": return decimalMetric(key, "money", currency, net);
    case "average_pnl":
    case "expectancy":
      return quotientMetric(key, "money", currency, net, String(rows.length));
    case "median_pnl":
      return medianMetric(key, "money", currency, pnl);
    case "win_rate":
      return ratioFromCounts(key, String(wins.length), String(rows.length));
    case "profit_factor": {
      const grossWins = sum(wins.map((item) => item.row.netPnl));
      const grossLosses = sum(losses.map((item) => item.row.netPnl));
      const denominator = absoluteExactDecimal(grossLosses);
      if (!denominator.ok || denominator.value === "0") {
        return unavailableMetric(key, "ratio", null, "ti_v3_query_profit_factor_zero_loss_denominator");
      }
      return ratioFromDecimals(key, grossWins, denominator.value);
    }
    case "average_position_size": {
      const values = positionValues(rows);
      return values.length === rows.length
        ? quotientMetric(key, "money", currency, sum(values), String(values.length))
        : unavailableMetric(key, "money", currency, "ti_v3_query_position_size_unavailable");
    }
    case "median_position_size": {
      const values = positionValues(rows);
      return values.length === rows.length
        ? medianMetric(key, "money", currency, values)
        : unavailableMetric(key, "money", currency, "ti_v3_query_position_size_unavailable");
    }
    case "average_holding_time": {
      if (rows.length === 0) return unavailableMetric(key, "seconds", null, "ti_v3_query_zero_sample");
      const ratio = createExactRatio(
        rows.reduce((total, item) => total + item.holdingNanoseconds, BigInt("0")).toString(),
        (BigInt(rows.length) * BigInt("1000000000")).toString(),
      );
      if (!ratio.ok) throw new Error(ratio.error.code);
      return ratioMetric(key, "seconds", null, ratio.value);
    }
    case "median_holding_time": {
      const values = holdingValues(rows);
      return medianMetric(key, "seconds", null, values);
    }
    case "largest_winner_contribution": {
      if (wins.length === 0) return unavailableMetric(key, "money", currency, "ti_v3_query_no_winning_trade");
      return decimalMetric(key, "money", currency, [...wins].sort((a, b) =>
        compareCanonicalDecimals(b.row.netPnl, a.row.netPnl))[0].row.netPnl);
    }
    case "largest_loser_contribution": {
      if (losses.length === 0) return unavailableMetric(key, "money", currency, "ti_v3_query_no_losing_trade");
      return decimalMetric(key, "money", currency, [...losses].sort((a, b) =>
        compareCanonicalDecimals(a.row.netPnl, b.row.netPnl))[0].row.netPnl);
    }
    case "net_pnl_excluding_largest_winner": {
      if (wins.length === 0) return unavailableMetric(key, "money", currency, "ti_v3_query_no_winning_trade");
      const winner = [...wins].sort((a, b) => compareCanonicalDecimals(b.row.netPnl, a.row.netPnl))[0];
      let removed = false;
      return decimalMetric(key, "money", currency, sum(rows.flatMap((item) => {
        if (!removed && item.row.semanticRoundTripKey === winner.row.semanticRoundTripKey) {
          removed = true;
          return [];
        }
        return [item.row.netPnl];
      })));
    }
    case "net_pnl_excluding_largest_loser": {
      if (losses.length === 0) return unavailableMetric(key, "money", currency, "ti_v3_query_no_losing_trade");
      const loser = [...losses].sort((a, b) => compareCanonicalDecimals(a.row.netPnl, b.row.netPnl))[0];
      let removed = false;
      return decimalMetric(key, "money", currency, sum(rows.flatMap((item) => {
        if (!removed && item.row.semanticRoundTripKey === loser.row.semanticRoundTripKey) {
          removed = true;
          return [];
        }
        return [item.row.netPnl];
      })));
    }
  }
}

export function calculateTradeQueryMetrics(
  selected: readonly TradeQueryMetricKey[],
  rows: readonly QueryRowSemantics[],
  counts: QueryMetricCounts,
  currency: string,
): readonly ExactMetricValue[] {
  return Object.freeze(selected.map((key) => metricFor(key, rows, counts, currency)));
}

export function metricSortValue(metric: ExactMetricValue): readonly [bigint, bigint] | null {
  if (metric.kind === "integer") return [BigInt(metric.value), BigInt("1")];
  if (metric.kind === "exact_decimal") {
    const ratio = decimalRatio(metric.value);
    return [BigInt(ratio.numerator), BigInt(ratio.denominator)];
  }
  if (metric.kind === "exact_ratio") return [BigInt(metric.numerator), BigInt(metric.denominator)];
  return null;
}
