import assert from "node:assert/strict";
import { test } from "vitest";
import { savedTradeClosesInPeriod } from "./saved-trade-period";

test("saved-trade period includes both boundaries and supports open-ended ranges", () => {
  const period = { startDate: "2026-09-10", endDate: "2026-09-11" };
  assert.equal(savedTradeClosesInPeriod("2026-09-09", period), false);
  assert.equal(savedTradeClosesInPeriod("2026-09-10", period), true);
  assert.equal(savedTradeClosesInPeriod("2026-09-11", period), true);
  assert.equal(savedTradeClosesInPeriod("2026-09-12", period), false);
  assert.equal(savedTradeClosesInPeriod("2026-09-09", { ...period, startDate: null }), true);
  assert.equal(savedTradeClosesInPeriod("2026-09-12", { ...period, endDate: null }), true);
  assert.equal(savedTradeClosesInPeriod("2026-09-12"), true);
});

test("selecting by final member retains the entire trade, not only in-range round trips", () => {
  const trades = [{ id: "combined", members: [{ close: "2026-09-10" }, { close: "2026-09-11" }] },
    { id: "later", members: [{ close: "2026-09-11" }, { close: "2026-09-12" }] }];
  const selected = trades.filter((trade) => savedTradeClosesInPeriod(trade.members.at(-1)!.close,
    { startDate: "2026-09-11", endDate: "2026-09-11" }));
  assert.equal(selected.length, 1);
  assert.equal(selected[0].id, "combined");
  assert.equal(selected[0].members.length, 2);
});
