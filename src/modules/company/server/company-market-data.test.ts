// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import type { UniverseStock } from "@/src/modules/scanner/live/contracts";
import { companyUniverseEntry, readCompanyTechnicals } from "./company-market-data";

const providers = vi.hoisted(() => ({ history: vi.fn(), request: vi.fn(), revisions: vi.fn() }));
vi.mock("@/src/modules/scanner/alpaca/client", () => ({
  readAlpacaHistory: providers.history,
  requestAlpacaGateway: providers.request,
  readAlpacaTradeRevisions: providers.revisions,
}));
vi.mock("@/src/modules/scanner/live/server/runtime", () => ({
  scannerUniverseStore: () => ({
    readLatestOnOrBefore: async () => ({
      stocks: [
        { symbol: "MID", marketCapAtCollection: 350_000_000 },
        { symbol: "LIMIT", marketCapAtCollection: 500_000_000 },
        { symbol: "EXPANDED", marketCapAtCollection: 1_000_000_000 },
      ],
    }),
  }),
  readLiveScannerRuntime: () => ({ gainers: { rows: [] }, momentum: { rows: [] } }),
}));
vi.mock("@/src/lib/news/company-data-gateway", () => ({ readCompanyData: async () => null }));

afterEach(() => vi.useRealTimers());

it("looks up membership in the accepted Scanner roster, including future cap expansions", async () => {
  await expect(companyUniverseEntry("MID")).resolves.toMatchObject({ marketCapAtCollection: 350_000_000 });
  await expect(companyUniverseEntry("LIMIT")).resolves.toMatchObject({ marketCapAtCollection: 500_000_000 });
  await expect(companyUniverseEntry("EXPANDED")).resolves.toMatchObject({ marketCapAtCollection: 1_000_000_000 });
  await expect(companyUniverseEntry("OFFROSTER")).resolves.toBeUndefined();
});

it("refreshes an open or reopened POM technical read on the targeted repair inside the range cache TTL", async () => {
  const at = Date.parse("2026-11-27T13:15:00Z");
  const repairedMinute = Date.parse("2026-11-27T10:00:00Z") / 1000;
  vi.useFakeTimers({ now: at });
  let revision: null | string = null;
  let pending = false;
  let historyBasisDate = "2026-11-27";
  let sessionBookRevision: number | undefined = undefined;
  const ticker = { symbol: "POM", marketCapAtCollection: 25_000_000 } as UniverseStock;
  const bar = (time: number, high: number) => ({ time, open: 3, high, low: 3, close: 3.1, volume: 12 });
  providers.history.mockImplementation(async ({ timeframe }: { timeframe: string }) => ({
    basisDate: historyBasisDate,
    bars: timeframe === "1Min" ? [bar(repairedMinute, revision ? 3.1 : 38), bar(repairedMinute + 60, 7.41)] : [],
  }));
  providers.request.mockImplementation(async (endpoint: string) => {
    if (endpoint === "calendar") {
      const sessions = [];
      for (let day = Date.UTC(2026, 0, 1); day < Date.UTC(2027, 0, 1); day += 86400000) {
        if (![0, 6].includes(new Date(day).getUTCDay())) {
          const date = new Date(day).toISOString().slice(0, 10);
          sessions.push({ date, open: "09:30", close: date === "2026-11-27" ? "13:00" : "16:00" });
        }
      }
      return { available: true, start: "2026-01-01", end: "2026-12-31", sessions };
    }
    if (endpoint === "quotes") return {
      feed: "sip", snapshots: {},
      sessionTotals: { POM: {
        complete: true, date: "2026-11-27", correctionRevision: sessionBookRevision,
        sessions: { premarket: { volume: 30_566_502, dollarVolume: 180_000_000 },
          regular: { volume: 0, dollarVolume: 0 }, after_hours: { volume: 0, dollarVolume: 0 } },
      } },
    };
    return null;
  });
  providers.revisions.mockImplementation(async () => ({
    feed: "sip",
    symbols: revision || pending ? { POM: { revision, pending, minutes: revision ? [repairedMinute] : [] } } : {},
  }));
  const read = () => readCompanyTechnicals("POM", ticker);
  expect((await read()).days[0].ranges[0]?.high).toBe(38);

  pending = true;
  vi.setSystemTime(at + 5000);
  const waiting = await read();
  expect(waiting.revisedRangeDates).toEqual(["2026-11-27"]);
  expect(waiting.days[0].ranges[0]).toBeNull();
  expect(waiting.dayVolume).toBeUndefined();
  expect(waiting.dollarVolume).toBeUndefined();

  pending = false;
  revision = "a".repeat(64);
  vi.setSystemTime(at + 10000);
  const current = await read();
  expect(current.revisedRangeDates).toEqual(["2026-11-27"]);
  expect(current.days[0].ranges[0]?.high).toBe(7.41);
  expect(current.dayVolume).toBeUndefined();
  expect(current.sessionVolume).toBeUndefined();
  expect(current.dollarVolume).toBeUndefined();
  expect((await read()).days[0].ranges[0]?.high).toBe(7.41);
  expect(providers.history.mock.calls.filter(([request]) => request.timeframe === "1Min")).toHaveLength(3);
  expect(providers.revisions).toHaveBeenCalledTimes(3);

  revision = "b".repeat(64);
  sessionBookRevision = at + 15_000;
  vi.setSystemTime(at + 15_000);
  const correctedTotals = await read();
  expect(correctedTotals).toMatchObject({ dayVolume: 30_566_502, sessionVolume: 30_566_502, dollarVolume: 180_000_000 });

  // Without an exact split basis, even a known revision cannot qualify
  // a historical session from the ordinary split-adjusted bars.
  historyBasisDate = "2026-11-28";
  revision = "c".repeat(64);
  vi.setSystemTime(at + 20_000);
  const mismatched = await read();
  expect(mismatched.revisedRangeDates).toEqual(["2026-11-27"]);
  expect(mismatched.days[0].ranges[0]).toBeNull();
  expect(current.scannerMember).toBe(true);
  const offRoster = await readCompanyTechnicals("POM");
  expect(offRoster).toMatchObject({ scannerMember: false, row: null, scannerSignals: [], days: mismatched.days });
  expect(offRoster).not.toHaveProperty("relativeVolume");
  expect(offRoster).not.toHaveProperty("candleActivity");
});
