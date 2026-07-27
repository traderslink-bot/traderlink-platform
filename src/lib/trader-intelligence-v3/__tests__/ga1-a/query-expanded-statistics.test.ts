import { describe, expect, it } from "vitest";

import {
  buildSyntheticQueryFixture,
  buildTradeQueryComparison,
  executeTradeQuery,
  verifyTradeQueryComparison,
  type ExactMetricValue,
  type TradeQueryMetricKey,
  type TradeQueryResult,
} from "../../analytics";

function execute(
  metrics: readonly TradeQueryMetricKey[],
  startDate = "2026-07-01",
  endDate = "2026-07-07",
): Readonly<{ result: TradeQueryResult; fixture: ReturnType<typeof buildSyntheticQueryFixture> }> {
  const fixture = buildSyntheticQueryFixture();
  const result = executeTradeQuery({
    source: fixture.source,
    partitionReceipt: fixture.partition,
    queryPlan: fixture.plan({
      filters: [{ kind: "date_range", startDate, endDate }],
      metrics,
    }),
  });
  expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return { result: result.value, fixture };
}

function metric(result: TradeQueryResult, key: string): ExactMetricValue {
  const found = result.rows[0].metrics.find((item) => item.metricKey === key);
  if (found === undefined) throw new Error(`missing metric ${key}`);
  return found;
}

describe("GA1-A expanded execution-only statistics", () => {
  it("matches independently calculated population, activity, financial, and outcome values", () => {
    const { result } = execute([
      "candidate_count", "included_count", "excluded_count", "inclusion_rate",
      "trading_day_count", "unique_account_count", "unique_symbol_count",
      "total_trades", "limited_analytical_trade_count",
      "missing_charge_coverage_trade_count",
      "missing_share_quantity_authority_count", "missing_entry_notional_authority_count",
      "unavailable_source_authority_trade_count", "manual_entry_trade_count",
      "broker_import_trade_count", "legacy_migration_trade_count",
      "average_trades_per_trading_day",
      "median_trades_per_trading_day", "maximum_trades_per_trading_day",
      "minimum_trades_per_trading_day", "long_trade_count", "short_trade_count",
      "long_trade_percentage", "short_trade_percentage",
      "average_attempts_per_symbol", "median_attempts_per_symbol",
      "repeat_attempt_trade_count", "repeat_attempt_percentage",
      "gross_profit", "gross_loss", "gross_pnl", "average_gross_pnl", "median_gross_pnl",
      "signed_charges", "fees_as_percentage_of_gross_profit",
      "fees_as_percentage_of_gross_loss", "net_pnl",
      "average_pnl", "median_pnl", "average_daily_pnl", "median_daily_pnl",
      "best_trade", "worst_trade", "best_trading_day", "worst_trading_day",
      "win_count", "loss_count", "flat_count", "win_rate", "loss_rate",
      "flat_rate", "average_winning_trade", "average_losing_trade",
      "total_winning_net_pnl", "total_losing_net_pnl",
      "average_win_loss_ratio", "profit_factor", "breakeven_win_rate",
    ]);
    expect(metric(result, "candidate_count")).toMatchObject({ value: "30" });
    expect(metric(result, "included_count")).toMatchObject({ value: "30" });
    expect(metric(result, "excluded_count")).toMatchObject({ value: "0" });
    expect(metric(result, "inclusion_rate")).toMatchObject({
      numerator: "1",
      denominator: "1",
    });
    expect(metric(result, "trading_day_count")).toMatchObject({ value: "7" });
    expect(metric(result, "unique_account_count")).toMatchObject({ value: "1" });
    expect(metric(result, "unique_symbol_count")).toMatchObject({ value: "3" });
    expect(metric(result, "total_trades")).toMatchObject({ value: "30" });
    expect(metric(result, "limited_analytical_trade_count")).toMatchObject({ value: "0" });
    expect(metric(result, "missing_charge_coverage_trade_count")).toMatchObject({ value: "0" });
    expect(metric(result, "missing_share_quantity_authority_count")).toMatchObject({ value: "0" });
    expect(metric(result, "missing_entry_notional_authority_count")).toMatchObject({ value: "0" });
    expect(metric(result, "unavailable_source_authority_trade_count")).toMatchObject({ value: "0" });
    expect(metric(result, "manual_entry_trade_count")).toMatchObject({ value: "0" });
    expect(metric(result, "broker_import_trade_count")).toMatchObject({ value: "30" });
    expect(metric(result, "legacy_migration_trade_count")).toMatchObject({ value: "0" });
    expect(metric(result, "average_trades_per_trading_day")).toMatchObject({
      numerator: "30",
      denominator: "7",
    });
    expect(metric(result, "median_trades_per_trading_day")).toMatchObject({ value: "4" });
    expect(metric(result, "maximum_trades_per_trading_day")).toMatchObject({ value: "5" });
    expect(metric(result, "minimum_trades_per_trading_day")).toMatchObject({ value: "4" });
    expect(metric(result, "long_trade_count")).toMatchObject({ value: "20" });
    expect(metric(result, "short_trade_count")).toMatchObject({ value: "10" });
    expect(metric(result, "long_trade_percentage")).toMatchObject({
      numerator: "2",
      denominator: "3",
    });
    expect(metric(result, "short_trade_percentage")).toMatchObject({
      numerator: "1",
      denominator: "3",
    });
    expect(metric(result, "average_attempts_per_symbol")).toMatchObject({
      numerator: "10",
      denominator: "1",
    });
    expect(metric(result, "median_attempts_per_symbol")).toMatchObject({ value: "10" });
    expect(metric(result, "repeat_attempt_trade_count")).toMatchObject({ value: "9" });
    expect(metric(result, "repeat_attempt_percentage")).toMatchObject({
      numerator: "3",
      denominator: "10",
    });
    expect(metric(result, "gross_profit")).toMatchObject({ value: "45" });
    expect(metric(result, "gross_loss")).toMatchObject({ value: "-30" });
    expect(metric(result, "gross_pnl")).toMatchObject({ value: "15" });
    expect(metric(result, "average_gross_pnl")).toMatchObject({ value: "0.5" });
    expect(metric(result, "median_gross_pnl")).toMatchObject({ value: "1" });
    expect(metric(result, "signed_charges")).toMatchObject({ value: "0" });
    expect(metric(result, "fees_as_percentage_of_gross_profit")).toMatchObject({
      numerator: "0",
      denominator: "1",
    });
    expect(metric(result, "fees_as_percentage_of_gross_loss")).toMatchObject({
      numerator: "0",
      denominator: "1",
    });
    expect(metric(result, "net_pnl")).toMatchObject({ value: "15" });
    expect(metric(result, "average_pnl")).toMatchObject({ value: "0.5" });
    expect(metric(result, "median_pnl")).toMatchObject({ value: "1" });
    expect(metric(result, "average_daily_pnl")).toMatchObject({
      numerator: "15",
      denominator: "7",
    });
    expect(metric(result, "median_daily_pnl")).toMatchObject({ value: "1" });
    expect(metric(result, "best_trade")).toMatchObject({ value: "4" });
    expect(metric(result, "worst_trade")).toMatchObject({ value: "-5" });
    expect(metric(result, "best_trading_day")).toMatchObject({ value: "9" });
    expect(metric(result, "worst_trading_day")).toMatchObject({ value: "-1" });
    expect(metric(result, "win_count")).toMatchObject({ value: "18" });
    expect(metric(result, "loss_count")).toMatchObject({ value: "6" });
    expect(metric(result, "flat_count")).toMatchObject({ value: "6" });
    expect(metric(result, "win_rate")).toMatchObject({ numerator: "3", denominator: "5" });
    expect(metric(result, "loss_rate")).toMatchObject({ numerator: "1", denominator: "5" });
    expect(metric(result, "flat_rate")).toMatchObject({ numerator: "1", denominator: "5" });
    expect(metric(result, "average_winning_trade")).toMatchObject({ value: "2.5" });
    expect(metric(result, "average_losing_trade")).toMatchObject({ value: "-5" });
    expect(metric(result, "total_winning_net_pnl")).toMatchObject({ value: "45" });
    expect(metric(result, "total_losing_net_pnl")).toMatchObject({ value: "-30" });
    expect(metric(result, "average_win_loss_ratio")).toMatchObject({
      numerator: "1",
      denominator: "2",
    });
    expect(metric(result, "profit_factor")).toMatchObject({
      numerator: "3",
      denominator: "2",
    });
    expect(metric(result, "breakeven_win_rate")).toMatchObject({
      numerator: "2",
      denominator: "3",
    });
  });

  it("matches independently calculated holding, size, consistency, and concentration values", () => {
    const { result } = execute([
      "average_holding_time", "median_holding_time", "minimum_holding_time",
      "maximum_holding_time", "average_share_quantity", "median_share_quantity",
      "maximum_share_quantity", "average_entry_notional",
      "average_winner_share_quantity", "median_winner_share_quantity",
      "average_loser_share_quantity", "median_loser_share_quantity",
      "median_entry_notional", "maximum_entry_notional",
      "net_pnl_per_100_shares", "return_on_entry_notional",
      "profitable_trading_day_count", "losing_trading_day_count",
      "flat_trading_day_count", "profitable_day_percentage",
      "losing_day_percentage", "flat_day_percentage",
      "average_green_day_pnl", "median_green_day_pnl",
      "average_red_day_pnl", "median_red_day_pnl",
      "longest_winning_trade_streak", "longest_losing_trade_streak",
      "current_winning_trade_streak", "current_losing_trade_streak",
      "net_pnl_excluding_largest_winner",
      "net_pnl_excluding_largest_loser",
      "net_pnl_excluding_largest_winner_and_loser",
    ]);
    expect(metric(result, "average_holding_time")).toMatchObject({
      numerator: "770",
      denominator: "1",
    });
    expect(metric(result, "median_holding_time")).toMatchObject({ value: "720" });
    expect(metric(result, "minimum_holding_time")).toMatchObject({ value: "300" });
    expect(metric(result, "maximum_holding_time")).toMatchObject({ value: "1440" });
    expect(metric(result, "average_share_quantity")).toMatchObject({ value: "100" });
    expect(metric(result, "median_share_quantity")).toMatchObject({ value: "100" });
    expect(metric(result, "maximum_share_quantity")).toMatchObject({ value: "100" });
    expect(metric(result, "average_winner_share_quantity")).toMatchObject({ value: "100" });
    expect(metric(result, "median_winner_share_quantity")).toMatchObject({ value: "100" });
    expect(metric(result, "average_loser_share_quantity")).toMatchObject({ value: "100" });
    expect(metric(result, "median_loser_share_quantity")).toMatchObject({ value: "100" });
    expect(metric(result, "average_entry_notional")).toMatchObject({ value: "200" });
    expect(metric(result, "median_entry_notional")).toMatchObject({ value: "200" });
    expect(metric(result, "maximum_entry_notional")).toMatchObject({ value: "300" });
    expect(metric(result, "net_pnl_per_100_shares")).toMatchObject({
      numerator: "1",
      denominator: "2",
    });
    expect(metric(result, "return_on_entry_notional")).toMatchObject({
      numerator: "1",
      denominator: "400",
    });
    expect(metric(result, "profitable_trading_day_count")).toMatchObject({ value: "5" });
    expect(metric(result, "losing_trading_day_count")).toMatchObject({ value: "1" });
    expect(metric(result, "flat_trading_day_count")).toMatchObject({ value: "1" });
    expect(metric(result, "profitable_day_percentage")).toMatchObject({
      numerator: "5",
      denominator: "7",
    });
    expect(metric(result, "losing_day_percentage")).toMatchObject({
      numerator: "1",
      denominator: "7",
    });
    expect(metric(result, "flat_day_percentage")).toMatchObject({
      numerator: "1",
      denominator: "7",
    });
    expect(metric(result, "average_green_day_pnl")).toMatchObject({ value: "3.2" });
    expect(metric(result, "median_green_day_pnl")).toMatchObject({ value: "2" });
    expect(metric(result, "average_red_day_pnl")).toMatchObject({ value: "-1" });
    expect(metric(result, "median_red_day_pnl")).toMatchObject({ value: "-1" });
    expect(metric(result, "longest_winning_trade_streak")).toMatchObject({ value: "4" });
    expect(metric(result, "longest_losing_trade_streak")).toMatchObject({ value: "1" });
    expect(metric(result, "current_winning_trade_streak")).toMatchObject({ value: "1" });
    expect(metric(result, "current_losing_trade_streak")).toMatchObject({ value: "0" });
    expect(metric(result, "net_pnl_excluding_largest_winner")).toMatchObject({ value: "11" });
    expect(metric(result, "net_pnl_excluding_largest_loser")).toMatchObject({ value: "20" });
    expect(metric(result, "net_pnl_excluding_largest_winner_and_loser"))
      .toMatchObject({ value: "16" });
  });

  it("builds an exact evidence-linked comparison over two validated plans", () => {
    const selected = ["included_count", "net_pnl", "win_rate"] as const;
    const target = execute(selected, "2026-07-01", "2026-07-03");
    const baseline = execute(selected, "2026-07-04", "2026-07-07");
    const comparison = buildTradeQueryComparison(
      target.result,
      baseline.result,
      target.fixture.authority,
    );
    expect(comparison, JSON.stringify(comparison)).toMatchObject({ ok: true });
    if (!comparison.ok) return;
    expect(comparison.value.targetEvidenceDigests).toEqual(
      target.result.evidence.map((item) => item.evidenceDigest),
    );
    expect(comparison.value.baselineEvidenceDigests).toEqual(
      baseline.result.evidence.map((item) => item.evidenceDigest),
    );
    const net = comparison.value.metrics.find((item) => item.metricKey === "net_pnl");
    expect(net?.target).toMatchObject({ value: "13" });
    expect(net?.baseline).toMatchObject({ value: "2" });
    expect(net?.difference).toMatchObject({ value: "11" });
    expect(net?.percentageDifference).toMatchObject({
      numerator: "11",
      denominator: "2",
    });
    expect(buildTradeQueryComparison(
      JSON.parse(JSON.stringify(target.result)),
      JSON.parse(JSON.stringify(baseline.result)),
      target.fixture.authority,
    )).toMatchObject({
      ok: false,
      error: { path: "$.comparison.verifiedExecutions" },
    });
    expect(verifyTradeQueryComparison(
      JSON.parse(JSON.stringify(comparison.value)),
      target.result,
      baseline.result,
      target.fixture.authority,
    )).toMatchObject({ ok: true, value: { comparisonDigest: comparison.value.comparisonDigest } });
    const zeroBaseline = execute(selected, "2026-07-06", "2026-07-06");
    const zeroComparison = buildTradeQueryComparison(
      target.result,
      zeroBaseline.result,
      target.fixture.authority,
    );
    expect(zeroComparison).toMatchObject({ ok: true });
    if (zeroComparison.ok) {
      expect(zeroComparison.value.metrics.find((item) =>
        item.metricKey === "net_pnl")?.percentageDifference).toMatchObject({
        kind: "unavailable",
        reasonCode: "ti_v3_query_comparison_zero_or_unavailable_baseline",
      });
    }
  });

  it("returns explicit unavailable states for zero included populations", () => {
    const { result } = execute(
      ["profit_factor", "breakeven_win_rate", "median_pnl"],
      "2026-08-01",
      "2026-08-02",
    );
    expect(result.includedCount).toBe("0");
    expect(metric(result, "profit_factor")).toMatchObject({ kind: "unavailable" });
    expect(metric(result, "breakeven_win_rate")).toMatchObject({ kind: "unavailable" });
    expect(metric(result, "median_pnl")).toMatchObject({ kind: "unavailable" });
  });
});
