import { describe, expect, it } from "vitest";

import {
  medianMetric,
  quotientMetric,
  ratioFromCounts,
  ratioFromDecimals,
  subtractMetrics,
  decimalMetric,
} from "../../analytics";

describe("GA0-B2 exact metric arithmetic", () => {
  it("returns a terminating expectancy as an exact decimal", () => {
    expect(quotientMetric("net_expectancy", "money_per_trade", "USD", "-14", "10"))
      .toMatchObject({ kind: "exact_decimal", value: "-1.4", currency: "USD" });
  });

  it("returns a nonterminating expectancy as a reduced exact ratio", () => {
    expect(quotientMetric("net_expectancy", "money_per_trade", "USD", "1", "3"))
      .toMatchObject({
        kind: "exact_ratio",
        numerator: "1",
        denominator: "3",
        currency: "USD",
      });
  });

  it("keeps an even median as a ratio when the exact average exceeds decimal scale", () => {
    expect(medianMetric(
      "median_net_pnl",
      "money",
      "USD",
      ["0", "0.000000000000000000000001"],
    )).toMatchObject({
      kind: "exact_ratio",
      numerator: "1",
      denominator: "2000000000000000000000000",
    });
  });

  it("uses all included trades, including flats, in the exact win-rate denominator", () => {
    expect(ratioFromCounts("win_rate", "2", "5")).toMatchObject({
      kind: "exact_ratio",
      numerator: "2",
      denominator: "5",
      currency: null,
    });
  });

  it("represents signed financial shares without floating point", () => {
    expect(ratioFromDecimals("target_total_net_pnl_share", "-3", "2"))
      .toMatchObject({
        kind: "exact_ratio",
        numerator: "-3",
        denominator: "2",
        currency: null,
      });
  });

  it("subtracts mixed terminating and nonterminating exact metrics as a reduced ratio", () => {
    const target = quotientMetric(
      "net_expectancy",
      "money_per_trade",
      "USD",
      "1",
      "3",
    );
    const baseline = decimalMetric(
      "net_expectancy",
      "money_per_trade",
      "USD",
      "0.5",
    );
    expect(subtractMetrics("net_expectancy_difference", target, baseline))
      .toMatchObject({
        kind: "exact_ratio",
        numerator: "-1",
        denominator: "6",
      });
  });
});
