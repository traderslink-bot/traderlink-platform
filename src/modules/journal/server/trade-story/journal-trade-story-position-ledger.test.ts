import { describe, expect, it } from "vitest";
import { buildTradeStoryPositionLedger, type TradeStoryLedgerExecution } from "./journal-trade-story-position-ledger";
import { buildTradeStoryActivities } from "./journal-trade-story-activities";
import { composeTradeStoryCopy } from "./journal-trade-story-copy";
import { assertCanonicalJournalDecimal } from "../../contracts/journal-storage-values";

function executions(rows: readonly (readonly [string, "buy" | "sell", string, string])[]): TradeStoryLedgerExecution[] {
  return rows.map(([time, side, quantityDecimal, priceDecimal], index) => ({ executionId: `fixture-${index}`,
    executedAtUtc: `2026-08-31T${time}:00.000Z`, marketSession: "regular_hours", priceDecimal,
    quantityDecimal, sequence: index + 1, side, tradingDate: "2026-08-31" }));
}
const aehl = () => executions([["14:17", "buy", "196", "5.98"], ["14:21", "buy", "50", "5.99"],
  ["15:38", "sell", "24", "7.03"], ["15:39", "sell", "24", "7.22"], ["15:40", "sell", "198", "7.47"]]);
describe("Trade Story derived average precision", () => {
  it("keeps all five AEHL executions and produces the story instead of throwing into historical fallback", () => {
    const input = aehl();
    const original = JSON.stringify(input);
    const result = buildTradeStoryPositionLedger({ executions: input, sessionBoundaries: [] });
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("Expected ready ledger");
    expect(result.ledger.checkpoints).toHaveLength(5);
    expect(result.ledger.checkpoints[1]!.averageEntryPriceAfterDecimal).toBe("5.98203252032520325203252032520325");
    expect(result.ledger.checkpoints.at(-1)!.positionAfterQuantityDecimal).toBe("0");
    const activities = buildTradeStoryActivities(result);
    expect(activities.status).toBe("ready");
    const copy = composeTradeStoryCopy({ activities, tradeLabel: "Trade", formatters: {
      describeSession: () => "regular hours", formatPercentageOfPosition: () => "test percentage",
      formatPrice: (value) => value ?? "N/A", formatQuantity: (value) => value, formatTime: (value) => value,
    } });
    expect(copy.status).toBe("ready");
    expect(JSON.stringify(input)).toBe(original);
    expect(result.ledger.checkpoints.map((item) => item.execution)).toEqual(input);
  });
  it("retains single-entry source precision unchanged", () => {
    const input = executions([["14:00", "buy", "2.5", "0.1234567890123456789012345678901234"], ["14:05", "sell", "2.5", "0.2"]]);
    const result = buildTradeStoryPositionLedger({ executions: input, sessionBoundaries: [] });
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("Expected ready ledger");
    expect(result.ledger.checkpoints[0]!.averageEntryPriceAfterDecimal).toBe(input[0]!.priceDecimal);
    expect(result.ledger.checkpoints[0]!.positionAfterQuantityDecimal).toBe("2.5");
  });
  it("is deterministic through multiple adds and partial reductions without changing quantities", () => {
    const input = executions([["14:00", "buy", "2", "1"], ["14:01", "buy", "1", "2"],
      ["14:02", "sell", "1", "3"], ["14:03", "buy", "7", "2.1"], ["14:04", "sell", "9", "3"]]);
    const original = JSON.stringify(input);
    const first = buildTradeStoryPositionLedger({ executions: input, sessionBoundaries: [] });
    expect(first).toEqual(buildTradeStoryPositionLedger({ executions: input, sessionBoundaries: [] }));
    expect(first.status).toBe("ready");
    if (first.status !== "ready") throw new Error("Expected ready ledger");
    expect(first.ledger.checkpoints.map((item) => item.positionAfterQuantityDecimal)).toEqual(["2", "3", "2", "9", "0"]);
    for (const checkpoint of first.ledger.checkpoints) {
      if (checkpoint.averageEntryPriceAfterDecimal !== null) {
        expect(() => assertCanonicalJournalDecimal(checkpoint.averageEntryPriceAfterDecimal!, "test", { positive: true })).not.toThrow();
      }
    }
    expect(JSON.stringify(input)).toBe(original);
  });
  it("keeps every open and close in an existing grouped-reopen timeline", () => {
    const input = executions([["14:00", "buy", "1", "1"], ["14:01", "sell", "1", "2"],
      ["14:02", "buy", "2", "3"], ["14:03", "sell", "2", "4"]]);
    const result = buildTradeStoryPositionLedger({ executions: input, sessionBoundaries: [] });
    expect(result.status).toBe("ready");
    if (result.status !== "ready") throw new Error("Expected ready ledger");
    expect(result.ledger.checkpoints.map((item) => item.transition)).toEqual(["opened", "fully_exited", "opened", "fully_exited"]);
    expect(result.ledger.checkpoints.map((item) => item.execution)).toEqual(input);
    expect(buildTradeStoryActivities(result).status).toBe("ready");
  });
});
