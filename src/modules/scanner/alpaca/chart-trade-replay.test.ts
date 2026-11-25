import { describe, expect, it } from "vitest";
import { createChartTradeReplay } from "./chart-trade-replay";

const time = "2026-11-19T14:35:00.123456789Z";
const trades = [0.50, 0.53, 0.50].map((price, index) => ({ position: index + 1, time, price }));
const snapshot = { kind: "snapshot", stream: "first", through: 1, trades: trades.slice(0, 1) } as const;
const update = { kind: "batch", stream: "first", after: 1, through: 3, trades: trades.slice(1) } as const;

describe("ordered chart trade replay", () => {
  it.each(["renko", "range"] as const)("replays every trade in a batch into %s even when the final price equals the starting price", kind => {
    const replay = createChartTradeReplay(kind, 0.01);
    expect(replay(snapshot).status).toBe("ready");
    expect(replay(update)).toMatchObject({
      status: "ready",
      cursor: 3,
      lastTrade: trades[2],
      bars: expect.arrayContaining([expect.objectContaining({ close: 0.53 })]),
    });
  });

  it("requires a new snapshot after a skipped position and refuses later consecutive deltas", () => {
    const replay = createChartTradeReplay("renko", 0.01);
    replay(snapshot);
    expect(replay({ ...update, trades: trades.slice(2) })).toEqual({ status: "needs_snapshot" });
    expect(replay(update)).toEqual({ status: "needs_snapshot" });
    expect(replay({ ...snapshot, stream: "new", through: 3, trades }).status).toBe("ready");
  });

  it("rebuilds after a reset or correction and ignores deltas from the old stream", () => {
    const replay = createChartTradeReplay("range", 0.01);
    replay(snapshot);
    replay(update);
    expect(replay({ kind: "reset", stream: "first" })).toEqual({ status: "needs_snapshot" });
    const corrected = replay({ ...snapshot, stream: "new", through: 1, trades: [trades[0]] });
    expect(corrected).toMatchObject({ status: "ready", bars: [{ close: 0.50, complete: false }] });
    expect(replay(update)).toEqual({ status: "ignored" });
    expect(replay({ kind: "batch", stream: "new", after: 1, through: 3, trades: trades.slice(1) })).toMatchObject({ status: "ready", cursor: 3 });
  });
});
