import assert from "node:assert/strict";
import { test } from "vitest";
import { savedTradeScalingRows, wholeTradeProfitProtection } from "./saved-trade-scaling";

type Trade = Parameters<typeof savedTradeScalingRows>[0][number];
const trade = (id = "combined", pnl = "5") => ({ tradeId: id, closeLocalDate: "2026-09-11", entryLocalDate: "2026-09-10", direction: "long", symbol: "TEST", actualPnlDecimal: pnl,
  profitProtection: { status: "not_applicable" }, scenario: {
    calculatedFinalGrossResultDecimal: pnl, calculatedFinalNetResultDecimal: null,
    primaryQualification: { calculatedGrossResultDecimal: "12", calculatedNetResultDecimal: null, closePriceDecimal: "2", qualifiedAtUtcSeconds: 100, requiredCloseCount: 10, thresholdPercent: 20 },
    scaleOut: { eventCount: 1, maximumOpenQuantityDecimal: "10", positionReducedPercent: 50, profitSecuredGrossDecimal: "3", remainingQuantityDecimal: "5", scaledQuantityDecimal: "5" },
  } }) as unknown as Trade;

test("Scaling rows carry one saved ID, whole-trade P/L and original qualification facts", () => {
  const result = savedTradeScalingRows([trade()], "gross");
  assert.equal(result.scaling.length, 1);
  assert.equal(result.scaling[0].roundTripId, "combined");
  assert.equal(result.scaling[0].actualPnlDecimal, "5");
  assert.equal(result.scaling[0].trackerDate, "2026-09-10");
  assert.equal(result.scaling[0].closeDate, "2026-09-11");
  assert.equal(result.meaningful[0].differenceDecimal, "7");
  assert.equal(result.meaningful[0].requiredCloseCount, 10);
  assert.equal(result.meaningful[0].scaledOutWhileGreen, true);
  assert.equal(result.meaningful[0].outcome, "ended_green");
  assert.throws(() => savedTradeScalingRows([trade(), trade()], "gross"), /Duplicate/);
});

test("Scaling preserves missing Net facts and reconciles the entire selected financial result", () => {
  assert.equal(savedTradeScalingRows([trade()], "net").scaling.length, 0);
  assert.equal(savedTradeScalingRows([{ ...trade(), actualPnlDecimal: null }], "gross").scaling.length, 0);
  assert.equal(savedTradeScalingRows([{ ...trade(), actualPnlDecimal: "5.03" }], "gross").scaling.length, 0);
  const losing = trade("losing", "-2");
  const result = savedTradeScalingRows([{ ...losing, scenario: { ...losing.scenario, scaleOut: { ...losing.scenario.scaleOut, eventCount: 0 } } }], "gross");
  assert.equal(result.meaningful[0].outcome, "ended_red");
  assert.equal(result.meaningful[0].scaledOutWhileGreen, false);
  assert.equal(result.meaningful[0].differenceDecimal, "14");
});

test("verified member comparison keeps its exact difference while shifting to whole-trade totals", () => {
  const member = { status: "avoided_additional_loss", actualGrossResultDecimal: "2", counterfactualGrossResultDecimal: "-1", avoidedAdditionalLossDecimal: "3", reductionPercentDecimal: "50", moneyBasis: "gross" } as const;
  const whole = wholeTradeProfitProtection([{ status: "comparison_unavailable", reductionPercentDecimal: null }, member], "7");
  assert.deepEqual(whole, { ...member, actualGrossResultDecimal: "7", counterfactualGrossResultDecimal: "4" });
  assert.equal(wholeTradeProfitProtection([member, member], "7").status, "comparison_unavailable");
  assert.equal(wholeTradeProfitProtection([], "7").status, "comparison_unavailable");
});

test("comparison preserves additional-profit and unchanged-result outcomes", () => {
  assert.deepEqual(wholeTradeProfitProtection([{ status: "gave_up_additional_profit", actualGrossResultDecimal: "2", counterfactualGrossResultDecimal: "6", additionalProfitGivenUpDecimal: "4", moneyBasis: "gross", reductionPercentDecimal: "25" }], "-3"),
    { status: "gave_up_additional_profit", actualGrossResultDecimal: "-3", counterfactualGrossResultDecimal: "1", additionalProfitGivenUpDecimal: "4", moneyBasis: "gross", reductionPercentDecimal: "25" });
  const equal = wholeTradeProfitProtection([{ status: "no_difference", actualGrossResultDecimal: "2", counterfactualGrossResultDecimal: "2", moneyBasis: "gross", reductionPercentDecimal: "25" }], "10");
  assert.equal(equal.status, "no_difference");
  assert.ok("counterfactualGrossResultDecimal" in equal && equal.counterfactualGrossResultDecimal === "10");
});
