// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { CustomScanMarket } from "../market";
import { EMPTY_SCAN, type ScanRule } from "../definition";
import { replayClroSavedScans } from "@/src/test/clro-saved-scan-replay";
import { projectCompanyRecord, readScannerCompanyBatch, type CompanyRecord } from "./company-filter-data";
import { CompanyStudyCache } from "../company-study-cache";

const accession = "0001753926-26-000600";
const cutoff = Date.parse("2026-11-27T15:00:30Z");
const filing = {
  date: "2026-03-31",
  reportDate: "2025-12-31",
  form: "10-K",
  accession,
  acceptedAt: "2026-03-31T20:30:42Z",
};
const revenue = {
  metric: "revenue",
  scope: "continuing",
  start: "2025-01-01",
  end: "2025-12-31",
  unit: "USD",
  currency: "USD",
  status: "filed",
  filed: filing.date,
  acceptedAt: filing.acceptedAt,
  accession,
  value: 0,
};
const annual = {
  filing,
  facts: [revenue, { ...revenue, metric: "discontinuedRevenue", scope: "discontinued", value: 6_009_000 }],
};
const sec = { statements: { annual }, filings: [filing] };
const company = { symbol: "CLRO", sec: { state: "available", value: sec } };
const reference = {
  userId: "8dba47f3-0453-448b-a206-08b02b2266ed",
  workspaceId: "922a9b4b-f257-431e-986a-5aa0094ccfc5",
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function useTestServer(get: (url: URL) => unknown) {
  vi.stubEnv("TRADERLINK_COMPANY_DATA_GATEWAY_URL", "http://127.0.0.1/company-data");
  vi.stubEnv("TRADERLINK_COMPANY_DATA_GATEWAY_TOKEN", "test-only");
  vi.stubGlobal("fetch", async (input: URL) => Response.json(get(new URL(input))));
}
it("reopens both saved definitions and verifies only the exact-zero alert against the original filing", async () => {
  const external = process.env.SCANNER_TEST_COMPANY_LOOPBACK === "1";
  if (external) expect(new URL(process.env.TRADERLINK_COMPANY_DATA_GATEWAY_URL!).hostname).toBe("127.0.0.1");
  else
    useTestServer((url) => {
      expect(url.pathname).toBe("/traderslink/v1/company/snapshots");
      expect(url.searchParams.get("asOf")).toBe(String(cutoff));
      expect(url.searchParams.getAll("symbol")).toEqual(["CLRO"]);
      return { revision: 2, companies: [company] };
    });
  const dir = mkdtempSync(join(tmpdir(), "clro-saved-replay-"));
  try {
    const { producer, sources, results, reading } = await replayClroSavedScans(dir, reference);
    expect(reading?.values.annualRevenue).toBe(0);
    expect(reading?.values.annualNetMargin).toBeUndefined();
    expect(results.map((r) => [r.total, r.excluded, r.incomplete])).toEqual([
      [0, 1, 0],
      [1, 0, 0],
    ]);
    const histories = sources.map((s) => producer.readMasterScanMatches(reference, s));
    expect(
      histories.map((h) => h.events.map((e) => (e.coverage === "complete" ? e.matches.length : -1))),
    ).toEqual([
      [0, 0],
      [0, 1],
    ]);
    const event = histories[1].latest!;
    if (event.coverage !== "complete") throw Error("Incomplete saved result");
    const match = event.matches[0];
    const verify = () => producer.verifyMasterScanMatchEvidence(reference, sources[1], match);
    expect(await verify()).toMatchObject({
      symbol: "CLRO",
      companyEvidence: { asOf: cutoff, revision: 2, accessions: [accession] },
    });
    expect(await producer.verifyMasterScanMatchEvidence(reference, sources[0], match)).toBeNull();
    expect(JSON.stringify(results)).not.toContain(accession);
    if (!external) {
      const revised = {
        ...company,
        sec: {
          state: "available",
          value: {
            ...sec,
            statements: {
              annual: {
                ...annual,
                facts: [
                  { ...revenue, value: 50_000_000, accession: "0001753926-26-000601", status: "amended" },
                ],
              },
            },
          },
        },
      };
      useTestServer((url) =>
        url.searchParams.get("revision") === "2"
          ? { revision: 2, companies: [company] }
          : { revision: 3, companies: [revised] },
      );
      expect(
        (await readScannerCompanyBatch(["CLRO"], cutoff + 5000)).records.get("CLRO")?.values.annualRevenue,
      ).toBe(50_000_000);
      expect(await verify()).toMatchObject({ companyEvidence: { revision: 2, accessions: [accession] } });
      useTestServer(() => ({ revision: 3, companies: [company] }));
      expect(await verify()).toBeNull();
      useTestServer(() => ({ revision: 2, companies: [{ ...company, sec: { state: "pending" } }] }));
      expect(await verify()).toBeNull();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it("uses visible amendments, qualified units and comparable periods for growth and margins", () => {
  const data = { ...revenue, value: 100, scope: "operating" };
  const prev = { ...data, value: 50, start: "2024-01-01", end: "2024-12-31" };
  const amendment = {
    ...filing,
    date: "2026-11-27",
    form: "10-K/A",
    acceptedAt: new Date(cutoff + 1000).toISOString(),
    accession: "0001753926-26-000601",
  };
  const revised = {
    ...data,
    accession: amendment.accession,
    filed: amendment.date,
    acceptedAt: amendment.acceptedAt,
    status: "amended",
  };
  const record: CompanyRecord = {
    symbol: "TEST",
    sec: {
      state: "available",
      value: {
        statements: {
          annual: {
            filing,
            facts: [
              revised,
              { ...data, metric: "netIncome", scope: "parent", value: 10 },
              { ...data, metric: "grossProfit", unit: "EUR" },
            ],
          },
          previousAnnual: { filing: { ...filing, reportDate: prev.end }, facts: [prev] },
        },
        filings: [amendment],
        filingCoverage: { from: "2026-11-01", through: "2026-11-27", checkedAt: cutoff, complete: false },
      },
    },
  };
  const before = projectCompanyRecord(record, 9, cutoff);
  expect(before.values.annualRevenue).toBeUndefined();
  expect(before.forms).toEqual([]);
  expect(before.formsComplete).toBe(false);
  const after = projectCompanyRecord(record, 10, cutoff + 1000);
  expect(after.values).toEqual({
    annualIncome: 10,
    annualRevenue: 100,
    revenueGrowth: 100,
    annualNetMargin: 10,
  });
  expect(after.forms).toEqual(["10-K/A"]);
  expect(after.evidence?.filingsByMetric.annualRevenue).toEqual([amendment.accession]);
  record.sec!.health = { pendingFiling: amendment };
  expect(projectCompanyRecord(record, 11, cutoff + 2000).values).toEqual({});
});

it("pins later chunks, publishes atomically and sees a recovered ratio on the next refresh", async () => {
  const symbols = Array.from({ length: 130 }, (_, i) => "N" + i);
  let revision = 2;
  const calls: (string | null)[] = [];
  useTestServer((url) => {
    calls.push(url.searchParams.get("revision"));
    const companies = url.searchParams.getAll("symbol").map((symbol) => ({
      ...company,
      symbol,
      metrics: {
        state: revision === 2 ? "retrying" : "available",
        value:
          revision === 2
            ? null
            : {
                valuation: {
                  priceSalesTtm: {
                    source: "finnhub",
                    sourceField: "psTTM",
                    unit: "x",
                    period: "ttm",
                    state: "available",
                    tradingDate: "2026-11-27",
                    value: 0.6,
                  },
                },
              },
      },
    }));
    return { revision, companies };
  });
  const cache = new CompanyStudyCache(readScannerCompanyBatch, vi.fn());
  await cache.observe(symbols, cutoff);
  expect(calls).toEqual([null, "2", "2"]);
  expect(cache.value("N129", cutoff)?.values).toEqual({ annualRevenue: 0 });
  revision++;
  await cache.observe(symbols, cutoff + 5000);
  expect(calls.slice(3)).toEqual([null, "3", "3", "3"]);
  expect(cache.value("N129", cutoff + 5000)?.values).toMatchObject({ annualRevenue: 0, priceSalesTtm: 0.6 });
  useTestServer((url) => ({
    revision: 4,
    companies: url.searchParams
      .getAll("symbol")
      .map((symbol) => ({ ...company, symbol }))
      .slice(0, 1),
  }));
  await cache.observe(symbols, cutoff + 10000);
  expect(cache.value("N0", cutoff + 10000)).toBeUndefined();
});

it("uses a visible filing in a partial window and keeps unknown company fields out of exact-zero matches", () => {
  const fourDaysAgo = new Date(cutoff - 4 * 86_400_000).toISOString();
  const partial = projectCompanyRecord(
    {
      symbol: "CLRO",
      sec: {
        state: "available",
        value: {
          ...sec,
          filings: [{ ...filing, form: "8-K", date: fourDaysAgo.slice(0, 10), acceptedAt: fourDaysAgo }],
        },
      },
    },
    2,
    cutoff,
  );
  const market = new CustomScanMarket({
    attach: () => () => {},
    observe() {},
    pressRelease: () => undefined,
    indicator: () => undefined,
    companyReadings: (symbol) => (symbol === "CLRO" ? partial : undefined),
  });
  const rows = ["CLRO", "PENDING"].map((symbol) => ({
    symbol,
    exchange: "NASDAQ" as const,
    price: 1,
    volume: 100,
    dollarVolume: 100,
    marketCap: 2_000_000,
    float: 200_000,
    dayChange: 0,
    belowHigh: 0,
    observedAt: cutoff,
  }));
  market.set("open", cutoff, "fixture", rows);
  const filingRule = (form: string): ScanRule => ({
    metric: "recentFiling",
    selection: [form],
    minimum: null,
    maximum: null,
  });
  const zero: ScanRule = { metric: "annualRevenue", minimum: 0, maximum: 0 };
  const read = (match: "all" | "any", rules: ScanRule[]) =>
    market.query({ key: "company", page: 1, definition: { ...EMPTY_SCAN, match, rules } });
  expect(read("all", [zero, filingRule("8-K")])).toMatchObject({ total: 1, incomplete: 1 });
  expect(read("all", [zero, filingRule("6-K")])).toMatchObject({ total: 0, incomplete: 2 });
  expect(read("any", [zero, filingRule("6-K")])).toMatchObject({ total: 1, incomplete: 1 });
});
