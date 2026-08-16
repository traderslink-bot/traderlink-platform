import type {
  JournalAnalyticsMoneyBasis,
  JournalAnalyticsOutcome,
  JournalAnalyticsTableOrder,
} from "../contracts/analytics-query";
import type { JournalAnalyticsExactValue } from "../contracts/analytics-result";

export type TradeExplorerTradeSort =
  | "closed_desc"
  | "closed_asc"
  | "pnl_desc"
  | "pnl_asc"
  | "return_desc"
  | "return_asc"
  | "hold_desc"
  | "hold_asc"
  | "shares_desc"
  | "shares_asc"
  | "entry_value_desc"
  | "entry_value_asc";

export function canonicalTradeExplorerDecimalInput(
  value: string | null,
): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/u.test(trimmed)) return value;
  const [whole, fraction = ""] = trimmed.split(".");
  const wholeWithZero = whole.length === 0 ? "0" : whole;
  const canonicalWhole = wholeWithZero.replace(/^0+(?=\d)/u, "");
  const canonicalFraction = fraction.replace(/0+$/u, "");
  return canonicalFraction.length === 0
    ? canonicalWhole
    : `${canonicalWhole}.${canonicalFraction}`;
}

export function canonicalTradeExplorerTimeInput(
  value: string | null,
): string | null {
  if (value === null) return null;
  const match = /^(\d{1,2}):(\d{2})$/u.exec(value.trim());
  if (!match) return value;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour > 23 || minute > 59
    ? value
    : `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export const TRADE_EXPLORER_TRADE_STATISTIC_GROUPS = Object.freeze([
  Object.freeze({ label: "P/L and results", metricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl", "average_pnl", "median_pnl", "best_trade", "worst_trade", "profit_factor", "return_on_entry_notional"]) }),
  Object.freeze({ label: "Wins and losses", metricIds: Object.freeze(["win_count", "loss_count", "flat_count", "win_rate", "loss_rate", "flat_rate", "average_winning_trade", "average_losing_trade", "average_win_loss_ratio"]) }),
  Object.freeze({ label: "Holding time", metricIds: Object.freeze(["average_holding_time", "median_holding_time", "minimum_holding_time", "maximum_holding_time", "average_winner_holding_time", "average_loser_holding_time"]) }),
  Object.freeze({ label: "Shares and entry value", metricIds: Object.freeze(["average_share_quantity", "median_share_quantity", "maximum_share_quantity", "average_entry_notional", "median_entry_notional", "maximum_entry_notional"]) }),
  Object.freeze({ label: "Trade prices", metricIds: Object.freeze(["average_entry_price", "average_exit_price"]) }),
] as const);

export const TRADE_EXPLORER_DAY_STATISTIC_GROUPS = Object.freeze([
  Object.freeze({ label: "Trading-day results", metricIds: Object.freeze(["total_trades", "net_pnl", "gross_pnl"]) }),
  Object.freeze({ label: "Daily movement", metricIds: Object.freeze(["maximum_intraday_realized_drawdown", "maximum_intraday_realized_recovery_from_trough", "maximum_peak_profit_giveback"]) }),
] as const);

export function tradeExplorerMetricForMoneyBasis(
  metricId: string,
  moneyBasis: JournalAnalyticsMoneyBasis,
): string {
  return metricId === "gross_pnl" || metricId === "net_pnl"
    ? `${moneyBasis}_pnl`
    : metricId;
}

export function tradeExplorerMetricMatchesMoneyBasis(
  metricId: string,
  moneyBasis: JournalAnalyticsMoneyBasis,
): boolean {
  return (metricId !== "gross_pnl" && metricId !== "net_pnl") ||
    metricId === `${moneyBasis}_pnl`;
}

export function tradeExplorerMetricMatchesOutcome(
  metricId: string,
  outcome: JournalAnalyticsOutcome | null,
): boolean {
  if (outcome === null) return true;
  if ([
    "win_count",
    "loss_count",
    "flat_count",
    "win_rate",
    "loss_rate",
    "flat_rate",
  ].includes(metricId)) return false;
  if (["profit_factor", "average_win_loss_ratio"].includes(metricId)) return false;
  if ([
    "average_winning_trade",
    "average_losing_trade",
    "average_winner_holding_time",
    "average_loser_holding_time",
  ].includes(metricId)) return false;
  if (metricId.startsWith("maximum_intraday_") ||
      metricId === "maximum_peak_profit_giveback") return false;
  if (outcome === "flat" && [
    "net_pnl",
    "gross_pnl",
    "average_pnl",
    "median_pnl",
    "best_trade",
    "worst_trade",
    "expectancy",
    "return_on_entry_notional",
    "average_daily_pnl",
  ].includes(metricId)) return false;
  return true;
}

export function tradeExplorerMetricForOutcome(
  metricId: string,
  outcome: JournalAnalyticsOutcome | null,
): string {
  return tradeExplorerMetricMatchesOutcome(metricId, outcome)
    ? metricId
    : "total_trades";
}

export function tradeExplorerDefaultRankDirection(
  metricId: string,
): "ascending" | "descending" {
  return metricId === "worst_trade" || metricId === "worst_trading_day"
    ? "ascending"
    : "descending";
}

export const TRADE_EXPLORER_TRADE_SORT_OPTIONS: readonly Readonly<{
  label: string;
  order: JournalAnalyticsTableOrder;
  value: TradeExplorerTradeSort;
}>[] = Object.freeze([
  Object.freeze({ label: "Newest first", order: Object.freeze({ field: "closed_at", direction: "descending" }), value: "closed_desc" }),
  Object.freeze({ label: "Oldest first", order: Object.freeze({ field: "closed_at", direction: "ascending" }), value: "closed_asc" }),
  Object.freeze({ label: "Highest P/L first", order: Object.freeze({ field: "selected_pnl", direction: "descending" }), value: "pnl_desc" }),
  Object.freeze({ label: "Lowest P/L first", order: Object.freeze({ field: "selected_pnl", direction: "ascending" }), value: "pnl_asc" }),
  Object.freeze({ label: "Highest return first", order: Object.freeze({ field: "return_percent", direction: "descending" }), value: "return_desc" }),
  Object.freeze({ label: "Lowest return first", order: Object.freeze({ field: "return_percent", direction: "ascending" }), value: "return_asc" }),
  Object.freeze({ label: "Longest hold first", order: Object.freeze({ field: "holding_duration", direction: "descending" }), value: "hold_desc" }),
  Object.freeze({ label: "Shortest hold first", order: Object.freeze({ field: "holding_duration", direction: "ascending" }), value: "hold_asc" }),
  Object.freeze({ label: "Most shares first", order: Object.freeze({ field: "entered_quantity", direction: "descending" }), value: "shares_desc" }),
  Object.freeze({ label: "Fewest shares first", order: Object.freeze({ field: "entered_quantity", direction: "ascending" }), value: "shares_asc" }),
  Object.freeze({ label: "Highest entry value first", order: Object.freeze({ field: "entry_notional", direction: "descending" }), value: "entry_value_desc" }),
  Object.freeze({ label: "Lowest entry value first", order: Object.freeze({ field: "entry_notional", direction: "ascending" }), value: "entry_value_asc" }),
]);

export function tradeExplorerTableOrder(input: unknown): JournalAnalyticsTableOrder {
  const selected = TRADE_EXPLORER_TRADE_SORT_OPTIONS.find((option) =>
    option.value === input);
  if (!selected) throw new TypeError("Invalid Trade Explorer trade sort.");
  return selected.order;
}

export function tradeExplorerTradeSortForOutcome(
  input: unknown,
  outcome: JournalAnalyticsOutcome | null,
): TradeExplorerTradeSort {
  const selected = TRADE_EXPLORER_TRADE_SORT_OPTIONS.find((option) =>
    option.value === input);
  if (!selected) throw new TypeError("Invalid Trade Explorer trade sort.");
  return outcome === "flat" && ["selected_pnl", "return_percent"].includes(
    selected.order.field,
  )
    ? "closed_desc"
    : selected.value;
}

type DecimalParts = Readonly<{ scale: number; units: bigint }>;

function decimalParts(value: string): DecimalParts {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/u.exec(value);
  if (!match) throw new TypeError("Invalid exact Trade Explorer metric value.");
  const fraction = match[3] ?? "";
  const sign = match[1] === "-" ? BigInt(-1) : BigInt(1);
  return Object.freeze({
    scale: fraction.length,
    units: BigInt(`${match[2]}${fraction}`) * sign,
  });
}

function compareParts(left: DecimalParts, right: DecimalParts): number {
  const scale = Math.max(left.scale, right.scale);
  const leftUnits = left.units * (BigInt(10) ** BigInt(scale - left.scale));
  const rightUnits = right.units * (BigInt(10) ** BigInt(scale - right.scale));
  return leftUnits < rightUnits ? -1 : leftUnits > rightUnits ? 1 : 0;
}

function compareRationals(
  left: Extract<JournalAnalyticsExactValue, { kind: "rational" }>,
  right: Extract<JournalAnalyticsExactValue, { kind: "rational" }>,
): number {
  const leftNumerator = decimalParts(left.numeratorDecimal);
  const rightNumerator = decimalParts(right.numeratorDecimal);
  return compareParts(
    Object.freeze({
      scale: leftNumerator.scale,
      units: leftNumerator.units * BigInt(right.denominatorInteger),
    }),
    Object.freeze({
      scale: rightNumerator.scale,
      units: rightNumerator.units * BigInt(left.denominatorInteger),
    }),
  );
}

export function compareTradeExplorerMetricValues(
  left: JournalAnalyticsExactValue,
  right: JournalAnalyticsExactValue,
): number | null {
  if (left.kind !== right.kind) return null;
  switch (left.kind) {
    case "integer": {
      const rightValue = (right as Extract<JournalAnalyticsExactValue, { kind: "integer" }>).value;
      return left.value < rightValue ? -1 : left.value > rightValue ? 1 : 0;
    }
    case "decimal":
      return compareParts(
        decimalParts(left.valueDecimal),
        decimalParts((right as Extract<JournalAnalyticsExactValue, { kind: "decimal" }>).valueDecimal),
      );
    case "rational":
      return compareRationals(
        left,
        right as Extract<JournalAnalyticsExactValue, { kind: "rational" }>,
      );
    case "duration": {
      const rightValue = (right as Extract<JournalAnalyticsExactValue, { kind: "duration" }>).milliseconds;
      return left.milliseconds < rightValue
        ? -1
        : left.milliseconds > rightValue
          ? 1
          : 0;
    }
    case "text":
      return left.value.localeCompare(
        (right as Extract<JournalAnalyticsExactValue, { kind: "text" }>).value,
      );
  }
}
