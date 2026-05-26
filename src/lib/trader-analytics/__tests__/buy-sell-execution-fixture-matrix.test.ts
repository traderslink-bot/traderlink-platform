import { describe, expect, it } from "vitest";
import {
  buildBuySellExecutionFixtureMatrix,
  runBuySellExecutionFixtureMatrix,
} from "../index";

describe("buy/sell execution fixture matrix", () => {
  it("defines the high-risk import math cases", () => {
    const matrix = buildBuySellExecutionFixtureMatrix();

    expect(matrix.map((fixture) => fixture.id)).toEqual([
      "long_win",
      "long_loss",
      "short_win",
      "short_loss",
      "partial_exit",
      "over_reduction",
      "same_symbol_split",
      "open_position",
      "rejected_row",
      "fees_net_amount",
      "duplicate_like_fill_cluster",
      "same_timestamp_scalp_cluster",
      "huge_size_jump",
      "fees_larger_than_trade_value",
    ]);
    expect(
      matrix.every(
        (fixture) =>
          fixture.broker === "generic_execution_csv" &&
          fixture.csvText.includes("Date,Time,Symbol,Side,Quantity,Price") &&
          fixture.expected.groupedTrades.length > 0,
      ),
    ).toBe(true);
  });

  it("keeps grouped buy/sell execution math stable", () => {
    const results = runBuySellExecutionFixtureMatrix();
    const failures = results.flatMap((result) =>
      result.failedExpectations.map(
        (failure) => `${result.id}: ${failure}`,
      ),
    );

    expect(failures).toEqual([]);
    expect(results.map((result) => [result.id, result.status])).toEqual(
      results.map((result) => [result.id, "pass"]),
    );
  });

  it("keeps fees and broker net as reconciliation context, not scoring input", () => {
    const feesCase = runBuySellExecutionFixtureMatrix().find(
      (result) => result.id === "fees_net_amount",
    );

    expect(feesCase).toBeTruthy();
    expect(feesCase!.status).toBe("pass");
    expect(feesCase!.actual.totalGrossRealizedPnl).toBe(50);
    expect(feesCase!.actual.costVisibility).toMatchObject({
      totalCosts: 2.68,
      brokerNetAmountTotal: 47.32,
      grossMinusKnownCosts: 47.32,
    });
  });

  it("keeps execution anomaly coverage explicit for high-risk buy/sell imports", () => {
    const results = runBuySellExecutionFixtureMatrix();
    const byId = new Map(results.map((result) => [result.id, result]));

    expect(byId.get("duplicate_like_fill_cluster")?.actual.requiredAnomalyTypes).toContain(
      "duplicate_like_fill",
    );
    expect(byId.get("same_timestamp_scalp_cluster")?.actual.requiredAnomalyTypes).toContain(
      "same_timestamp_cluster",
    );
    expect(byId.get("huge_size_jump")?.actual.requiredAnomalyTypes).toContain(
      "huge_size_jump",
    );
    expect(byId.get("fees_larger_than_trade_value")?.actual.requiredAnomalyTypes).toContain(
      "fees_larger_than_trade_value",
    );
    expect(byId.get("fees_larger_than_trade_value")?.actual.anomalyCounts).toMatchObject({
      urgentCount: 2,
    });
  });
});
