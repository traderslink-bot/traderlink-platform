import assert from "node:assert/strict";
import { test } from "vitest";
import { savedTradeDaySummary } from "./saved-trade-day-summary";

type Trade = Parameters<typeof savedTradeDaySummary>[0][number];
type Scenario = Parameters<typeof savedTradeDaySummary>[2][number];
const trade = (tradeId: string, pnlDecimal: string | null, returnPercentDecimal: string | null, direction = "long") => ({
  tradeId, pnlDecimal, returnPercentDecimal, direction, analyzed: { eventSnapshots: [{}, {}, {}, {}] },
}) as unknown as Trade;
const scenario = (tradeId: string, gross = "5", net: string | null = "4") => ({ tradeId, scenario: {
  calculatedFinalGrossResultDecimal: gross, calculatedFinalNetResultDecimal: net,
  primaryQualification: { calculatedGrossResultDecimal: "8", calculatedNetResultDecimal: net === null ? null : "7" },
} }) as Scenario;

test("Day summarizes saved trades once, with equal trade weighting and all executions", () => {
  const result = savedTradeDaySummary([trade("group", "5", "25"), trade("single", "-1", "-10", "short")], 3,
    [scenario("group"), scenario("group"), scenario("outside")], "gross");
  assert.equal(result.analyzedTradeCount, 2);
  assert.equal(result.analyzedExecutionCount, 8);
  assert.equal(result.eligibleDayTradeCount, 3);
  assert.equal(result.coveragePercent, 2 / 3 * 100);
  assert.deepEqual(result.directionTradeCounts, { long: 1, short: 1 });
  assert.equal(result.totalActualPnlDecimal, "4");
  assert.equal(result.averagePnlDecimal, "2");
  assert.equal(result.averageReturnPercent, 7.5);
  assert.equal(result.meaningfulProfitTradeCount, 1);
});

test("Day keeps missing financial results out of averages without hiding analyzed trades", () => {
  const result = savedTradeDaySummary([trade("missing", null, null), trade("known", "0", "0")], 2, [], "net");
  assert.equal(result.analyzedTradeCount, 2);
  assert.equal(result.coveragePercent, 100);
  assert.equal(result.averageReturnPercent, 0);
  assert.equal(result.totalActualPnlDecimal, "0");
  const unavailable = savedTradeDaySummary([trade("missing", null, null)], 1, [], "net");
  assert.equal(unavailable.totalActualPnlDecimal, null);
  assert.equal(unavailable.averageReturnPercent, null);
  assert.equal(savedTradeDaySummary([], 0, [], "gross").coveragePercent, null);
});

test("Day preserves profit qualification reconciliation and Net fee requirements", () => {
  const trades = [trade("group", "4", "20")];
  assert.equal(savedTradeDaySummary(trades, 1, [scenario("group")], "net").meaningfulProfitTradeCount, 1);
  assert.equal(savedTradeDaySummary(trades, 1, [scenario("group", "5", null)], "net").meaningfulProfitTradeCount, 0);
  assert.equal(savedTradeDaySummary(trades, 1, [scenario("group", "5", "4.03")], "net").meaningfulProfitTradeCount, 0);
  assert.throws(() => savedTradeDaySummary([...trades, ...trades], 2, [], "gross"), /Duplicate saved trade/);
});
