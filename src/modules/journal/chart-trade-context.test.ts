import { describe, expect, it } from "vitest";
import { buildMarketTradeContext } from "@/app/(dashboard)/charts/chart-trade-context";

function fixture(): Parameters<typeof buildMarketTradeContext>[0] {
  return {
    status: "ready",
    events: [
      { eventId: "one", kind: "entry", executedAt: "2026-11-13T15:30:25Z", price: "3.2123", quantity: "35", patterns: [] },
      { eventId: "two", kind: "partial_exit", executedAt: "2026-11-13T15:44:10Z", price: "3.3244", quantity: "15", patterns: [] },
      { eventId: "three", kind: "final_exit", executedAt: "2026-11-13T15:50:07Z", price: "3.5077", quantity: "20", patterns: [] },
    ],
  };
}

describe("analyzed trade context in the shared market chart", () => {
  it("uses the execution range, exact displayed values, and recorded rule time", () => {
    const context = buildMarketTradeContext(fixture(), "long", "USD", [{
      label: "Moved stop loss", occurredAt: "2026-11-13T15:40:55Z", netPnl: "-4.25", ruleId: "rule", triggerAt: null,
    }]);
    expect(context).toMatchObject({
      from: Date.parse("2026-11-13T15:30:25Z") / 1000,
      to: Date.parse("2026-11-13T15:50:07Z") / 1000,
      marks: [
        { kind: "buy", label: "Entry", details: "Buy 35 shares at 3.2123 USD" },
        { kind: "rule", label: "Moved stop loss", details: "P/L -4.25 USD" },
        { kind: "sell", label: "Partial exit" },
        { kind: "sell", label: "Final exit" },
      ],
    });
  });

  it("plots a short entry as a sale and the exits as buys", () => {
    expect(buildMarketTradeContext(fixture(), "short", "USD", [])?.marks.map(mark => mark.kind))
      .toEqual(["sell", "buy", "buy"]);
  });

  it("does not open a context for unusable analysis or missing executions", () => {
    expect(buildMarketTradeContext({ ...fixture(), status: "execution_mismatch" }, "long", "USD", [])).toBeNull();
    expect(buildMarketTradeContext({ ...fixture(), events: [] }, "long", "USD", [])).toBeNull();
  });
});
