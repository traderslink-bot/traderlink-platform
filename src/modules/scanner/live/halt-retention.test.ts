import { expect, it } from "vitest";
import { retainHaltedScannerRows } from "./halt-retention";
import { initialConfiguration } from "./settings";
import { DEFAULT_DECLINE_CONTROLS } from "./declines";
import { DEFAULT_PREMARKET_PULLBACK_CONTROLS } from "./premarket-pullbacks";
import type { DeclineRow, LiveScannerRow, PremarketPullbackRow } from "./contracts";

it("holds previously displayed rows in every scanner list and preserves the original Momentum section", () => {
  const row = { symbol: "POAS", price: 3 } as LiveScannerRow;
  const decline = { symbol: "POAS", price: 3 } as DeclineRow;
  const pullback = { symbol: "POAS", price: 3 } as PremarketPullbackRow;
  const empty = { rows: [], focus: [], total: 0 };
  const previous = {
    gainers: { ...empty, rows: [row], total: 1 }, dayGainers: { ...empty, rows: [row], total: 1 },
    momentum: { rows: [row], total: 1, focus: [{ ...row, focusedAtUtc: "2026-11-12T14:30:00Z" }],
      momentumSections: { confirmed: [], confirmedTotal: 0, early: [row], earlyTotal: 1 } },
    declines: { controls: DEFAULT_DECLINE_CONTROLS, rapid: [decline], rapidTotal: 1, losers: [decline], loserTotal: 1 },
    premarketPullbacks: { ...empty, controls: DEFAULT_PREMARKET_PULLBACK_CONTROLS, rows: [pullback], total: 1, missingReferenceCount: 0 },
  };
  const current = { ...previous, gainers: empty, dayGainers: empty,
    momentum: { ...empty, momentumSections: { confirmed: [row], confirmedTotal: 1, early: [], earlyTotal: 0 } },
    declines: { ...previous.declines, rapid: [], rapidTotal: 0, losers: [], loserTotal: 0 },
    premarketPullbacks: { ...previous.premarketPullbacks, rows: [], total: 0 } };
  const halted = new Set(["POAS", "UNRANKED"]);
  expect(retainHaltedScannerRows(current, previous, halted, halted, initialConfiguration())).toEqual(previous);
  expect(retainHaltedScannerRows(current, previous, new Set(), halted, initialConfiguration())).toEqual(current);
});
