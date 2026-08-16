import { describe, expect, it } from "vitest";

import { journalAnalyticsMetricRegistry } from "../server/analytics-metric-registry";
import {
  canonicalTradeExplorerDecimalInput,
  canonicalTradeExplorerTimeInput,
  compareTradeExplorerMetricValues,
  TRADE_EXPLORER_DAY_STATISTIC_GROUPS,
  TRADE_EXPLORER_TRADE_SORT_OPTIONS,
  TRADE_EXPLORER_TRADE_STATISTIC_GROUPS,
  tradeExplorerDefaultRankDirection,
  tradeExplorerMetricForMoneyBasis,
  tradeExplorerMetricForOutcome,
  tradeExplorerMetricMatchesMoneyBasis,
  tradeExplorerMetricMatchesOutcome,
  tradeExplorerTableOrder,
  tradeExplorerTradeSortForOutcome,
} from "./trade-explorer-ordering";

describe("Trade Explorer ordering promises", () => {
  it("canonicalizes ordinary exact-decimal filter input without accepting invalid text", () => {
    expect(canonicalTradeExplorerDecimalInput("001.2300")).toBe("1.23");
    expect(canonicalTradeExplorerDecimalInput("1.0")).toBe("1");
    expect(canonicalTradeExplorerDecimalInput("0.000")).toBe("0");
    expect(canonicalTradeExplorerDecimalInput("1.")).toBe("1");
    expect(canonicalTradeExplorerDecimalInput(" .50 ")).toBe("0.5");
    expect(canonicalTradeExplorerDecimalInput("not a number")).toBe("not a number");
    expect(canonicalTradeExplorerDecimalInput(null)).toBeNull();
  });

  it("canonicalizes ordinary entry-time input without accepting invalid times", () => {
    expect(canonicalTradeExplorerTimeInput("9:30")).toBe("09:30");
    expect(canonicalTradeExplorerTimeInput(" 09:30 ")).toBe("09:30");
    expect(canonicalTradeExplorerTimeInput("24:00")).toBe("24:00");
    expect(canonicalTradeExplorerTimeInput("9:3")).toBe("9:3");
    expect(canonicalTradeExplorerTimeInput(null)).toBeNull();
  });

  it("binds every visible trade-sort promise to one server order", () => {
    expect(Object.fromEntries(TRADE_EXPLORER_TRADE_SORT_OPTIONS.map((option) => [
      option.label,
      `${option.order.field}:${option.order.direction}`,
    ]))).toEqual({
      "Newest first": "closed_at:descending",
      "Oldest first": "closed_at:ascending",
      "Highest P/L first": "selected_pnl:descending",
      "Lowest P/L first": "selected_pnl:ascending",
      "Highest return first": "return_percent:descending",
      "Lowest return first": "return_percent:ascending",
      "Longest hold first": "holding_duration:descending",
      "Shortest hold first": "holding_duration:ascending",
      "Most shares first": "entered_quantity:descending",
      "Fewest shares first": "entered_quantity:ascending",
      "Highest entry value first": "entry_notional:descending",
      "Lowest entry value first": "entry_notional:ascending",
    });
    expect(new Set(TRADE_EXPLORER_TRADE_SORT_OPTIONS.map((option) => option.value)).size)
      .toBe(TRADE_EXPLORER_TRADE_SORT_OPTIONS.length);
    expect(tradeExplorerTableOrder("pnl_asc")).toEqual({
      field: "selected_pnl",
      direction: "ascending",
    });
    expect(() => tradeExplorerTableOrder("profit_factor"))
      .toThrowError("Invalid Trade Explorer trade sort.");
    expect(tradeExplorerTradeSortForOutcome("pnl_desc", "flat"))
      .toBe("closed_desc");
    expect(tradeExplorerTradeSortForOutcome("return_asc", "flat"))
      .toBe("closed_desc");
    expect(tradeExplorerTradeSortForOutcome("hold_desc", "flat"))
      .toBe("hold_desc");
    expect(tradeExplorerTradeSortForOutcome("pnl_desc", "win"))
      .toBe("pnl_desc");
    expect(() => tradeExplorerTradeSortForOutcome("profit_factor", null))
      .toThrowError("Invalid Trade Explorer trade sort.");
  });

  it("compares grouped decimal and rational statistics without Number rounding", () => {
    expect(compareTradeExplorerMetricValues(
      { kind: "decimal", valueDecimal: "9007199254740993.01" },
      { kind: "decimal", valueDecimal: "9007199254740993" },
    )).toBe(1);
    expect(compareTradeExplorerMetricValues(
      {
        kind: "rational",
        numeratorDecimal: "1",
        denominatorInteger: "3",
        roundedDecimal: "0.33",
        roundingPolicy: "test",
      },
      {
        kind: "rational",
        numeratorDecimal: "2",
        denominatorInteger: "7",
        roundedDecimal: "0.29",
        roundingPolicy: "test",
      },
    )).toBe(1);
    expect(compareTradeExplorerMetricValues(
      { kind: "duration", milliseconds: 90_000 },
      { kind: "duration", milliseconds: 30_000 },
    )).toBe(1);
    expect(compareTradeExplorerMetricValues(
      { kind: "integer", value: 3 },
      { kind: "integer", value: 7 },
    )).toBe(-1);
  });

  it("exposes only implemented or conditionally factual grouped statistics", () => {
    const capabilityById = new Map(journalAnalyticsMetricRegistry.definitions.map(
      (definition) => [definition.metricId, definition.capabilityState],
    ));
    const visibleMetricIds = [
      ...TRADE_EXPLORER_TRADE_STATISTIC_GROUPS,
      ...TRADE_EXPLORER_DAY_STATISTIC_GROUPS,
    ].flatMap((group) => [...group.metricIds]);

    for (const groups of [
      TRADE_EXPLORER_TRADE_STATISTIC_GROUPS,
      TRADE_EXPLORER_DAY_STATISTIC_GROUPS,
    ]) {
      const groupMetricIds = groups.flatMap((group) => [...group.metricIds]);
      expect(new Set(groupMetricIds).size).toBe(groupMetricIds.length);
    }
    for (const metricId of visibleMetricIds) {
      expect(capabilityById.get(metricId)).toMatch(/^(implemented|conditional)$/u);
    }
    expect(TRADE_EXPLORER_DAY_STATISTIC_GROUPS.flatMap((group) =>
      [...group.metricIds])).toEqual([
      "total_trades",
      "net_pnl",
      "gross_pnl",
      "maximum_intraday_realized_drawdown",
      "maximum_intraday_realized_recovery_from_trough",
      "maximum_peak_profit_giveback",
    ]);
  });

  it("keeps grouped P/L columns and ranking aligned with the selected basis", () => {
    expect(tradeExplorerMetricForMoneyBasis("net_pnl", "gross"))
      .toBe("gross_pnl");
    expect(tradeExplorerMetricForMoneyBasis("gross_pnl", "net"))
      .toBe("net_pnl");
    expect(tradeExplorerMetricForMoneyBasis("average_pnl", "gross"))
      .toBe("average_pnl");
    expect(tradeExplorerMetricMatchesMoneyBasis("gross_pnl", "gross")).toBe(true);
    expect(tradeExplorerMetricMatchesMoneyBasis("net_pnl", "gross")).toBe(false);
    expect(tradeExplorerMetricMatchesMoneyBasis("net_pnl", "net")).toBe(true);
    expect(tradeExplorerMetricMatchesMoneyBasis("profit_factor", "gross")).toBe(true);
  });

  it("withholds rankings that the selected Result filter makes impossible", () => {
    expect(tradeExplorerMetricMatchesOutcome("profit_factor", "win")).toBe(false);
    expect(tradeExplorerMetricMatchesOutcome("average_win_loss_ratio", "loss")).toBe(false);
    expect(tradeExplorerMetricMatchesOutcome("average_winning_trade", "win")).toBe(false);
    expect(tradeExplorerMetricMatchesOutcome("average_winning_trade", "loss")).toBe(false);
    expect(tradeExplorerMetricMatchesOutcome("average_losing_trade", "loss")).toBe(false);
    expect(tradeExplorerMetricMatchesOutcome("average_loser_holding_time", "flat")).toBe(false);
    expect(tradeExplorerMetricMatchesOutcome("average_pnl", "flat")).toBe(false);
    expect(tradeExplorerMetricMatchesOutcome("average_pnl", "win")).toBe(true);
    expect(tradeExplorerMetricMatchesOutcome("win_count", "win")).toBe(false);
    expect(tradeExplorerMetricMatchesOutcome("win_count", "loss")).toBe(false);
    expect(tradeExplorerMetricMatchesOutcome("loss_count", "loss")).toBe(false);
    expect(tradeExplorerMetricMatchesOutcome("flat_count", "flat")).toBe(false);
    expect(tradeExplorerMetricMatchesOutcome("win_rate", "win")).toBe(false);
    expect(tradeExplorerMetricMatchesOutcome("gross_pnl", "win")).toBe(true);
    expect(tradeExplorerMetricMatchesOutcome("gross_pnl", "flat")).toBe(false);
    expect(tradeExplorerMetricMatchesOutcome("maximum_intraday_realized_drawdown", "loss"))
      .toBe(false);
    expect(tradeExplorerMetricMatchesOutcome("profit_factor", null)).toBe(true);
    expect(tradeExplorerMetricForOutcome("profit_factor", "win")).toBe("total_trades");
    expect(tradeExplorerMetricForOutcome("average_pnl", "win")).toBe("average_pnl");
  });

  it("puts the worst result first when that ranking is selected", () => {
    expect(tradeExplorerDefaultRankDirection("worst_trade")).toBe("ascending");
    expect(tradeExplorerDefaultRankDirection("worst_trading_day")).toBe("ascending");
    expect(tradeExplorerDefaultRankDirection("profit_factor")).toBe("descending");
  });
});
