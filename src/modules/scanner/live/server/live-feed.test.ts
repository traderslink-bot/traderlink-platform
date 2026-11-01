import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { initialConfiguration } from "../settings";
import type { DailyUniverse } from "../contracts";
import { LiveScannerFeed } from "./live-feed";
import { MoomooSharedTransport } from "../../../platform/server/broker-connections/moomoo-shared-transport";
import { ScannerSettingsStore } from "./settings-store";
import { DailyFloatEnricher, type FloatCachePersistence } from "./float-enrichment";

const NOW = Date.parse("2026-10-30T14:00:00.000Z");
const universe: DailyUniverse = { version: 1, tradingDate: "2026-10-30", acceptedAtUtc: "2026-10-30T07:00:00.000Z",
  lastCollectionAtUtc: "2026-10-30T07:00:00.000Z", latestUploadCount: 1, sourceHashes: ["a".repeat(64)],
  stocks: [{ symbol: "ABCD", exchange: "NASDAQ", marketCapAtCollection: 10_000_000 }] };
const payload = { ret_code: 0, data: { snapshot_list: [{ code: "US.ABCD", name: "Example", update_time: NOW,
  data_date: "2026-10-30", last_price: 2, prev_close_price: 1, volume: 500_000, turnover: 1_000_000,
  bid_price: 1.99, ask_price: 2.01, total_market_val: 12_000_000 }] } };

function floatPersistence(): FloatCachePersistence {
  let stored: unknown = null;
  return { read: async () => stored,write: async record => { stored=record; } };
}

describe("DailyFloatEnricher", () => {
  it("converts Finnhub floatingShare millions exactly and skips fallback", async () => {
    const requested: string[] = [];
    const facts = await new DailyFloatEnricher({ finnhubToken:"finnhub",eodhdToken:"eodhd",persistence:floatPersistence(),finnhubSpacingMs:0,
      now:()=>NOW,request:async input => { requested.push(String(input)); return Response.json({ ticker:"BURU",floatingShare:8.37 }); } }).load("2026-10-30",["BURU"]);
    expect(facts.get("BURU")?.shares).toBe(8_370_000);
    expect(requested).toHaveLength(1);
    expect(requested[0]).toContain("finnhub.io");
  });

  it("uses EODHD symbol-keyed data when Finnhub float is zero", async () => {
    const facts = await new DailyFloatEnricher({ finnhubToken:"finnhub",eodhdToken:"eodhd",persistence:floatPersistence(),finnhubSpacingMs:0,
      now:()=>NOW,request:async input => String(input).includes("finnhub.io")
        ? Response.json({ ticker:"SLGB",floatingShare:0 })
        : Response.json({ data:{ "SLGB.US":{ sharesFloat:760_000 } } }) }).load("2026-10-30",["SLGB"]);
    expect(facts.get("SLGB")?.shares).toBe(760_000);
  });

  it("rejects ticker mismatch, outstanding-only data, and ambiguous fallback rows", async () => {
    const facts = await new DailyFloatEnricher({ finnhubToken:"finnhub",eodhdToken:"eodhd",persistence:floatPersistence(),finnhubSpacingMs:0,
      now:()=>NOW,request:async input => String(input).includes("finnhub.io")
        ? Response.json({ ticker:"WRONG",shareOutstanding:9,floatingShare:4 })
        : Response.json([{ code:"ABCD.US",sharesFloat:1_000_000 },{ code:"ABCD.US",sharesFloat:2_000_000 }]) }).load("2026-10-30",["ABCD"]);
    expect(facts.has("ABCD")).toBe(false);
  });
});

function dependencies(overrides: Record<string,unknown> = {}) {
  const configuration = { ...initialConfiguration(), enabled: true };
  return { configuration: async () => configuration, marketDay: async () => ({ date: "2026-10-30", verified: true, open: true,
    regularCloseEastern: "16:00" as const, extendedCloseEastern: "20:00" as const }), universe: async () => universe,
    reserveScannerBudget: async () => {}, snapshotPass: async (batches: readonly (readonly string[])[]) =>
      batches.map(requestedSymbols => ({ requestedSymbols, payload, receivedAt: NOW })),
    floats: async () => new Map([["ABCD",{ shares: 5_000_000, retrievedAtUtc: new Date(NOW).toISOString() }]]),
    news: async () => new Map(), qualification: () => ({ sessionTimestampVerified: true, sessionCountersVerified: true,
      afterHoursRegularCloseVerified: true }), now: () => NOW, ...overrides };
}

describe("LiveScannerFeed", () => {
  it("stays disabled without an enabled configuration", async () => {
    const feed = new LiveScannerFeed(dependencies({ configuration: async () => initialConfiguration() }));
    expect((await feed.scanOnce()).status).toBe("disabled");
  });
  it("does not use an earlier universe when today's list is absent", async () => {
    const feed = new LiveScannerFeed(dependencies({ universe: async () => null }));
    expect((await feed.scanOnce()).status).toBe("universe_missing");
  });
  it("reports a complete fresh provider pass", async () => {
    const result = await new LiveScannerFeed(dependencies()).scanOnce();
    expect(result.status).toBe("ready");
    expect(result.receivedCount).toBe(1);
    expect(result.missingFloatCount).toBe(0);
  });
  it("fails closed when session timestamp semantics are unqualified", async () => {
    const result = await new LiveScannerFeed(dependencies({ qualification: () => ({ sessionTimestampVerified: false,
      sessionCountersVerified: false, afterHoursRegularCloseVerified: false }) })).scanOnce();
    expect(result.status).toBe("partial");
    expect(result.receivedCount).toBe(0);
    expect(result.missingSymbols).toEqual(["ABCD"]);
  });
  it("marks provider batch failure partial without retaining fabricated rows", async () => {
    const result = await new LiveScannerFeed(dependencies({ snapshotPass: async () => { throw Error("offline"); } })).scanOnce();
    expect(result.status).toBe("partial");
    expect(result.receivedCount).toBe(0);
    expect(result.issues).toContain("snapshot_pass_unavailable");
  });
  it("requires a fresh float before a stock can qualify", async () => {
    const result = await new LiveScannerFeed(dependencies({ floats: async () => new Map() })).scanOnce();
    expect(result.missingFloatCount).toBe(1);
    expect(result.gainers.rows).toEqual([]);
  });
});

describe("ScannerSettingsStore float reads",()=>{
  it("returns only requested facts from the authoritative dated cache",async()=>{
    const directory=await mkdtemp(join(tmpdir(),"scanner-float-read-"));
    try{
      const store=new ScannerSettingsStore(directory);
      await store.floatCache().write({ tradingDate:"2026-10-30",facts:{
        SLGB:{ shares:760_000,retrievedAtUtc:"2026-10-30T14:00:00.000Z" },
        BURU:{ shares:8_370_000,retrievedAtUtc:"2026-10-30T14:00:00.000Z" },
      } });
      expect(await store.readFloatFacts("2026-10-30",["SLGB"])).toEqual({
        SLGB:{ shares:760_000,retrievedAtUtc:"2026-10-30T14:00:00.000Z" },
      });
      expect(await store.readFloatFacts("2026-10-31",["SLGB"])).toEqual({});
    }finally{await rm(directory,{ recursive:true,force:true });}
  });
});

describe("MoomooSharedTransport", () => {
  it("holds a missing restart ledger for a complete rolling window before dispatch", async () => {
    const directory = await mkdtemp(join(tmpdir(),"scanner-transport-"));
    let now = 1_000_000;
    let calls = 0;
    try {
      const ledgerPath = join(directory,"ledger.json");
      const transport = new MoomooSharedTransport({ ledgerPath, now: () => now, pause: async milliseconds => { now += milliseconds; } });
      const response = await transport.fetch("https://webapi.moomoo.com/test",undefined,"scanner",async () => {
        calls += 1; return new Response("{}",{ status: 200 });
      });
      expect(response.status).toBe(200);
      expect(calls).toBe(1);
      expect(now).toBeGreaterThanOrEqual(1_060_000);
      const ledger = JSON.parse(await readFile(ledgerPath,"utf8")) as { starts: unknown[] };
      expect(ledger.starts).toHaveLength(1);
    } finally { await rm(directory,{ recursive: true, force: true }); }
  });

  it("persists a provider-wide 429 cooldown", async () => {
    const directory = await mkdtemp(join(tmpdir(),"scanner-transport-"));
    let now = 2_000_000;
    try {
      const ledgerPath = join(directory,"ledger.json");
      const transport = new MoomooSharedTransport({ ledgerPath, now: () => now, pause: async milliseconds => { now += milliseconds; } });
      await transport.fetch("https://webapi.moomoo.com/limited",undefined,"watchlist",async () =>
        new Response("{}",{ status: 429, headers: { "retry-after": "2" } }));
      const after429 = JSON.parse(await readFile(ledgerPath,"utf8")) as { retryAt: number };
      expect(after429.retryAt).toBeGreaterThanOrEqual(now+2_000);
      let dispatchedAt = 0;
      await transport.fetch("https://webapi.moomoo.com/next",undefined,"connection",async () => {
        dispatchedAt = now; return new Response("{}",{ status: 200 });
      });
      expect(dispatchedAt).toBeGreaterThanOrEqual(after429.retryAt);
    } finally { await rm(directory,{ recursive: true, force: true }); }
  });
});

describe("ScannerSettingsStore", () => {
  it("returns disabled defaults without creating storage", async () => {
    const directory = join(tmpdir(),`scanner-settings-absent-${randomUUID()}`);
    const configuration = await new ScannerSettingsStore(directory).configuration();
    expect(configuration.enabled).toBe(false);
    await expect(readFile(join(directory,"settings.json"),"utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("persists independently editable list and focus counts with revision conflicts", async () => {
    const directory = await mkdtemp(join(tmpdir(),"scanner-settings-"));
    try {
      const store = new ScannerSettingsStore(directory);
      const candidate = initialConfiguration();
      const saved = await store.save({ ...candidate, gainers: { ...candidate.gainers, displayLimit: 27,
        focus: { ...candidate.gainers.focus, maximumStocks: 8 } } },0,NOW);
      expect(saved.gainers.displayLimit).toBe(27);
      expect(saved.gainers.focus.maximumStocks).toBe(8);
      expect((await new ScannerSettingsStore(directory).configuration()).revision).toBe(1);
      await expect(store.save(saved,0,NOW+1)).rejects.toThrow("scanner_settings_conflict");
    } finally { await rm(directory,{ recursive: true, force: true }); }
  });

  it("persists only dated positive float facts", async () => {
    const directory = await mkdtemp(join(tmpdir(),"scanner-settings-"));
    try {
      const cache = new ScannerSettingsStore(directory).floatCache();
      const record = { tradingDate: "2026-10-30", facts: { ABCD: { shares: 1_000_000, retrievedAtUtc: new Date(NOW).toISOString() } } };
      await cache.write(record);
      expect(await cache.read("2026-10-30")).toEqual(record);
      await expect(cache.write({ tradingDate: "2026-10-30", facts: { ABCD: { shares: 0, retrievedAtUtc: new Date(NOW).toISOString() } } })).rejects.toThrow("scanner_float_storage_invalid");
    } finally { await rm(directory,{ recursive: true, force: true }); }
  });

  it("refuses a symlinked settings root", async () => {
    const parent = await mkdtemp(join(tmpdir(),"scanner-settings-link-"));
    const target = await mkdtemp(join(tmpdir(),"scanner-settings-target-"));
    const link = join(parent,"runtime");
    try {
      await symlink(target,link,"dir");
      await expect(new ScannerSettingsStore(link).configuration()).rejects.toThrow("scanner_settings_path_invalid");
    } finally {
      await rm(parent,{ recursive: true, force: true });
      await rm(target,{ recursive: true, force: true });
    }
  });
});
