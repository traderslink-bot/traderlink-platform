// @vitest-environment node
import { expect, it } from "vitest";
import { isSavedStockLevelsMap, isStockLevelsMap, stockLevelsReferencePriceLabel, type StockLevelsMap } from "./stock-levels-contract";

const map: StockLevelsMap = {
  symbol: "ELOG", referencePrice: 1.7, referencePriceAsOf: Date.parse("2026-11-20T15:28:49.183Z"),
  calculatedAt: Date.parse("2026-11-20T15:30:19.273Z"), cacheStatus: "fresh",
  levelMap: null, fullLadderCard: null, nearestSupportResistanceCard: null,
};

it("preserves old saved maps with the reference-price label", () => {
  const saved = JSON.parse(JSON.stringify({ savedMapId: "saved-test-map", map }));
  expect(isSavedStockLevelsMap(saved)).toBe(true);
  expect(stockLevelsReferencePriceLabel(saved.map)).toBe("Reference price");
});

it("preserves real-trade provenance and its separate observation time in saved JSON", () => {
  const saved = JSON.parse(JSON.stringify({ savedMapId: "saved-test-map", map: { ...map, referencePriceBasis: "last_trade" } }));
  expect(isSavedStockLevelsMap(saved)).toBe(true);
  expect(stockLevelsReferencePriceLabel(saved.map)).toBe("Last traded price");
  expect(saved.map.referencePriceAsOf).toBe(map.referencePriceAsOf);
  expect(saved.map.calculatedAt).toBe(map.calculatedAt);
  expect(saved.map.calculatedAt).toBeGreaterThan(saved.map.referencePriceAsOf);
});

it("keeps non-trade observations labelled as a reference and rejects an unknown basis", () => {
  expect(isStockLevelsMap({ ...map, referencePriceBasis: "reference" })).toBe(true);
  expect(stockLevelsReferencePriceLabel({ ...map, referencePriceBasis: "reference" })).toBe("Reference price");
  expect(isStockLevelsMap({ ...map, referencePriceBasis: "live" })).toBe(false);
});
