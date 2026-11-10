import { expect, it } from "vitest";
import type { LiveScannerRow } from "./contracts";
import { GainerRetentionBook, GAINER_LIQUIDITY_GRACE_MS } from "./gainer-retention";
const row = (symbol = "OMH", gain: number | null = 30): LiveScannerRow => ({ symbol, sessionGain: gain, price: 1.3, comparisonPrice: 1 } as LiveScannerRow);
it("admits every qualified new leader immediately and preserves gain ranking inputs", () => {
  const book = new GainerRetentionBook();
  const rows = [row("OMH"), row("PEPG", 155), row("SMX", 58), row("PXLW", 23)];
  expect(book.select("day", rows, () => [], 0)).toEqual(rows);
});
it.each(["spread_above_maximum", "volume_below_minimum", "dollar_volume_below_minimum"])("debounces %s for incumbents only and uses current prices", failure => {
  const book = new GainerRetentionBook();
  book.select("day", [row()], () => [], 0);
  const updated = { ...row(), price: 33.5, sessionGain: 32 };
  expect(book.select("day", [updated, row("NEW")], () => [failure], 500)).toEqual([updated]);
  expect(book.select("day", [updated], () => [failure], 500 + GAINER_LIQUIDITY_GRACE_MS - 1)).toEqual([updated]);
  expect(book.select("day", [updated], () => [failure], 500 + GAINER_LIQUIDITY_GRACE_MS)).toEqual([]);
});
it("resets the failure timer on recovery and readmits immediately after recovery", () => {
  const book = new GainerRetentionBook();
  book.select("day", [row()], () => [], 0);
  book.select("day", [row()], () => ["spread_above_maximum"], 1);
  expect(book.select("day", [row()], () => [], 899_000)).toHaveLength(1);
  expect(book.select("day", [row()], () => ["spread_above_maximum"], 901_000)).toHaveLength(1);
  expect(book.select("day", [row()], () => ["spread_above_maximum"], 1_801_000)).toHaveLength(0);
  expect(book.select("day", [row()], () => [], 1_801_001)).toHaveLength(1);
});
it.each(["gain_unavailable", "gain_below_minimum", "market_cap_above_maximum", "price_below_minimum"])("does not retain an invalid leader: %s", failure => {
  const book = new GainerRetentionBook(); book.select("day", [row()], () => [], 0);
  expect(book.select("day", [row()], () => [failure], 1)).toEqual([]);
});
it("preserves last available rows through a long outage and refreshes gain from a known reference", () => {
  const book = new GainerRetentionBook(); book.select("day", [row()], () => [], 0);
  expect(book.select("day", [], () => [], 3_600_000)).toEqual([row()]);
  const updated = { ...row(), price: 1.5, sessionGain: null, comparisonPrice: null };
  expect(book.select("day", [updated], () => [], 3_600_001)[0].sessionGain).toBe(50);
  expect(book.select("day", [], () => [], 3_600_002, new Set())).toEqual([]);
  book.select("day", [row()], () => [], 3_600_003);
  expect(book.select("next", [], () => [], 3_600_004)).toEqual([]);
  book.select("next", [row()], () => [], 3_600_005); book.clear();
  expect(book.select("next", [], () => [], 3_600_006)).toEqual([]);
});
