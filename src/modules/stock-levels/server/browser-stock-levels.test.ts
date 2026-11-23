import { beforeEach, expect, it, vi } from "vitest";
import { stockLevelsReferencePriceLabel, type StockLevelsMap } from "../stock-levels-contract";
import { browserStockLevelsMap } from "./browser-stock-levels";

const state = vi.hoisted(() => ({
  fail: false, authenticated: true, included: true,
  currentMap: undefined as StockLevelsMap | undefined,
}));
const card = { source: "Alpaca", title: "Potential Path", body: "Support $0.0277", updatedAt: 123, priceWhenPosted: .029,
  metadata: { provider: "finnhub", gatewayUrl: "https://private.invalid", evidenceCount: 5, country: "US" } };
const level = { side: "support" as const, price: .0277, distancePct: -4.48, label: "Daily support",
  marketDataProvenance: { formedAt: 10, sourceLastSeenAt: 20, lastTestedAt: 30 } };
const map: StockLevelsMap = { symbol: "SHFS", referencePrice: .029, referencePriceAsOf: 120, calculatedAt: 123, cacheStatus: "hit",
  levelMap: { currentPrice: .029, rangeState: "normal", nearestSupport: level, nearestResistance: null,
    nextStrongSupport: level, nextStrongResistance: null, supportLevels: [level], resistanceLevels: [] },
  fullLadderCard: card, nearestSupportResistanceCard: { ...card, source: "level_snapshot" } };
const quota = { remainingHourly: 4, remainingNewYorkDay: 14, resetAt: 1000 };
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity: () => { if (!state.authenticated) throw Error("Moomoo private-key"); return { scope: {} }; },
}));
vi.mock("@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access", () => ({ hasWatchlistDashboardNavigationAccess: () => false }));
vi.mock("./stock-levels-service", () => ({
  listSavedStockLevelsMaps: () => { if (state.fail) throw Error("Alpaca token=private-key"); return [{ savedMapId: "saved", map: state.currentMap ?? map }]; },
  getStockLevelsQuotaFeedback: () => quota,
  getStockLevels: async () => state.fail
    ? { state: "unavailable", code: state.included ? "invalid_symbol" : "limit_reached", message: "Moomoo https://private.invalid?token=private-key", ...quota,
      ...(!state.included ? { membership: { included: false, remaining: 0, resetsAtUtc: null, resetDays: null } } : {}) }
    : { state: "ready", map: state.currentMap ?? map, savedMap: { savedMapId: "saved", map: state.currentMap ?? map }, ...quota },
  deleteSavedStockLevelsMap: () => { if (state.fail) throw Error("Finnhub private-key"); return true; },
}));
import { GET, POST, DELETE } from "@/app/api/levels/route";
beforeEach(() => {
  state.fail = false;
  state.authenticated = true;
  state.included = true;
  state.currentMap = undefined;
});
const request = (body?: object) => new Request("http://localhost/api/levels", body ? { method: "POST", body: JSON.stringify(body) } : undefined);

it("projects fresh and saved maps without changing level proof, precision or quota", async () => {
  const original = JSON.stringify(map), expected = browserStockLevelsMap(map);
  expect(expected.levelMap).toEqual(map.levelMap);
  expect(expected.fullLadderCard).toEqual({ ...card, source: "TradersLink", metadata: { evidenceCount: 5, country: "US" } });
  expect(expected.nearestSupportResistanceCard?.source).toBe("level_snapshot");
  expect(await (await GET(request())).json()).toEqual({ savedMaps: [{ savedMapId: "saved", map: expected }], ...quota });
  expect(await (await POST(request({ symbol: "SHFS" }))).json()).toEqual({ state: "ready", map: expected, savedMap: { savedMapId: "saved", map: expected }, ...quota });
  expect(JSON.stringify(map)).toBe(original);
});
it.each([
  { basis: "last_trade", label: "Last traded price" },
  { basis: "reference", label: "Reference price" },
  { basis: undefined, label: "Reference price" },
] as const)("retains the public price label for $basis on generated and saved maps", async ({ basis, label }) => {
  state.currentMap = {
    ...map,
    ...(basis ? { referencePriceBasis: basis } : {}),
    chartEvidenceProvenance: {
      version: 1,
      instrument: { id: "fixture-listing", symbol: map.symbol, venue: "XNAS" },
      calculatedAtMs: 123,
      inputs: [],
      zones: [],
    },
  };
  const fresh = await (await POST(request({ symbol: map.symbol }))).json();
  const saved = await (await GET(request())).json();
  for (const browserMap of [fresh.map, fresh.savedMap.map, saved.savedMaps[0].map]) {
    if (basis) expect(browserMap.referencePriceBasis).toBe(basis);
    else expect(browserMap).not.toHaveProperty("referencePriceBasis");
    expect(stockLevelsReferencePriceLabel(browserMap)).toBe(label);
    expect(browserMap).not.toHaveProperty("chartEvidenceProvenance");
  }
});
it("removes future nested routing fields while retaining level evidence clocks", () => {
  const contaminated = structuredClone(map);
  Object.assign(contaminated.levelMap!.supportLevels[0].marketDataProvenance!, { provider: "Alpaca", nested: { gatewayUrl: "private", count: 2 } });
  const result = browserStockLevelsMap(contaminated);
  expect(result.levelMap!.supportLevels[0].marketDataProvenance).toEqual({ ...level.marketDataProvenance, nested: { count: 2 } });
});
it("contains runtime messages, saved-read failures and deletion failures", async () => {
  state.fail = true;
  const generated = await POST(request({ symbol: "BAD" }));
  expect(await generated.json()).toEqual({ state: "unavailable", code: "invalid_symbol", message: "Enter a valid ticker.", ...quota });
  expect((await GET(request())).status).toBe(503);
  const deleted = await DELETE(request({ savedMapId: "00000000-0000-4000-8000-000000000001" }));
  expect(deleted.status).toBe(503); expect(await deleted.text()).not.toMatch(/Finnhub|private-key/);
  state.authenticated = false;
  expect((await POST(request({ symbol: "SHFS" }))).status).toBe(503);
});
it("keeps membership and input outcomes intact", async () => {
  state.fail = true; state.included = false;
  expect((await (await POST(request({ symbol: "SHFS" }))).json()).message).toMatch(/^Unlock Levels Generator/);
  expect((await POST(request({ replaceSavedMapId: "invalid" }))).status).toBe(400);
});
