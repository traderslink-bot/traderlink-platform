import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { browserStockLevelsMap } from "./browser-stock-levels";
import { requestStockLevels } from "./stock-levels-runtime-client";
import type { StockLevelsChartEvidenceProvenance, StockLevelsMap } from "../stock-levels-contract";

const input = {
  id: "regular-4h-1", frame: "4h", datasetId: "fixture-dataset", priceBasisId: "fixture-basis",
  calendarRevision: "fixture-calendar", sessionMode: "regular",
  completedThroughMs: 1_795_011_600_000, availableAtMs: 1_795_011_900_000,
  acceptedAtMs: 1_795_011_960_000, acceptedCutoffMs: 1_795_011_880_000, digest: "a".repeat(64),
} satisfies StockLevelsChartEvidenceProvenance["inputs"][number];
const provenance: StockLevelsChartEvidenceProvenance = {
  version: 1, instrument: { id: "fixture-instrument", symbol: "QA", venue: "XNAS" },
  calculatedAtMs: 1_795_012_140_000, inputs: [input],
  zones: [{ side: "resistance", index: 0, inputIds: [input.id] }],
};
const map: StockLevelsMap = {
  symbol: "QA", referencePrice: 9.95,
  referencePriceAsOf: 1_795_011_600_000, calculatedAt: 1_795_011_600_000, cacheStatus: "fresh",
  levelMap: {
    currentPrice: 9.95, rangeState: "normal", nearestSupport: null, nearestResistance: null,
    nextStrongSupport: null, nextStrongResistance: null, supportLevels: [],
    resistanceLevels: [{ side: "resistance", price: 10, lowPrice: 10, highPrice: 10.10, distancePct: 1, label: "4H resistance" }],
  },
  fullLadderCard: null, nearestSupportResistanceCard: null,
};

beforeEach(() => {
  vi.stubEnv("TRADERLINK_STOCK_LEVELS_RUNTIME_URL", "https://levels.example.test");
  vi.stubEnv("TRADERLINK_STOCK_LEVELS_RUNTIME_ACCESS_TOKEN", "fixture-runtime-token");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function respondWith(payload: unknown) {
  const fetcher = vi.fn(async () => Response.json({ map: payload }));
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

describe("private Levels provenance from the authenticated runtime", () => {
  it("preserves qualified evidence privately while the public projection keeps its allowlist", async () => {
    const withProvenance = { ...map, chartEvidenceProvenance: provenance };
    const fetcher = respondWith(withProvenance);
    const result = await requestStockLevels("QA");
    expect(fetcher).toHaveBeenCalledWith(new URL("https://levels.example.test/api/runtime/stock-levels"), {
      method: "POST", headers: { authorization: "Bearer fixture-runtime-token", "content-type": "application/json" },
      body: JSON.stringify({ symbol: "QA" }), cache: "no-store",
    });
    expect(result).toEqual({ map: withProvenance });
    expect(browserStockLevelsMap(withProvenance)).not.toHaveProperty("chartEvidenceProvenance");
  });

  it("still reads an ordinary legacy Levels map", async () => {
    respondWith(map);
    expect(await requestStockLevels("QA")).toEqual({ map });
  });

  it("also accepts an immutable input available before the selected cutoff", async () => {
    const cached = { ...map, chartEvidenceProvenance: {
      ...provenance, inputs: [{ ...input, acceptedCutoffMs: input.availableAtMs + 1 }],
    } };
    respondWith(cached);
    expect(await requestStockLevels("QA")).toEqual({ map: cached });
  });

  it.each([
    { version: 2 },
    { instrument: { ...provenance.instrument, symbol: "OTHER" } },
    { inputs: [{ ...input, frame: "5m" }] },
    { inputs: [{ ...input, acceptedCutoffMs: undefined }] },
    { inputs: [{ ...input, availableAtMs: undefined }] },
    { inputs: [{ ...input, availableAtMs: input.acceptedAtMs + 1 }] },
    { inputs: [{ ...input, acceptedCutoffMs: input.acceptedAtMs + 1 }] },
    { inputs: [{ ...input, acceptedCutoffMs: input.completedThroughMs - 1 }] },
    { inputs: [{ ...input, digest: "missing" }] },
    { inputs: [input, input] },
    { zones: [{ ...provenance.zones[0], inputIds: ["missing-input"] }] },
    { zones: [{ ...provenance.zones[0], index: 2 }] },
  ])("keeps Levels available and withholds invalid private provenance %#", async (override) => {
    respondWith({ ...map, chartEvidenceProvenance: { ...provenance, ...override } });
    expect(await requestStockLevels("QA")).toEqual({ map });
  });
});
