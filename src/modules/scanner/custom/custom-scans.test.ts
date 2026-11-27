import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_SCAN, parseScanDefinition, type SavedScanResults, type ScanMarketRow, type ScanPublication, type ScanQuery } from "./definition";
import { scanRowFromSnapshot } from "./market-facts";
import { CustomScanMarket } from "./market";
import { readSavedCustomScans, writeSavedCustomScans } from "./saved";
import { parseScanQueries, streamCustomScans, streamSavedScans } from "./transport";
import type { NormalizedSnapshot } from "../live/contracts";

vi.mock("server-only",()=>({}));
const at = 1_790_000_000_000;
const row = (symbol:string,price:number,observedAt:number,volume:number,extra?:Partial<ScanMarketRow>):ScanMarketRow => ({
  symbol,exchange:"NASDAQ",price,observedAt,volume,dollarVolume:volume*10,marketCap:20_000_000,float:5_000_000,
  dayChange:price-10,belowHigh:0,...extra,
});
const query = (input:unknown=EMPTY_SCAN, key="main", page=1):ScanQuery=>({ key,definition:parseScanDefinition(input),page });

it("uses the exact as-of price and volume on both sides of a fast custom-scan threshold", () => {
  const market = new CustomScanMarket();
  const apply = (offset: number, a: number, b: number, volume: number) => market.set("open", at + offset, "regular", [
    row("A", a, at + offset, volume), row("B", b, at + offset, volume),
  ]);
  apply(-1000, 2, 1, 0);
  apply(1000, 1, 2, 1000);
  apply(2000, 2, 1, 2000);
  const rules = [
    { metric: "rollingMove", minutes: 1, direction: "up", minimum: 50, maximum: null },
    { metric: "rollingVolume", minutes: 1, minimum: 10_000, maximum: null },
  ];
  const scan = query({ ...EMPTY_SCAN, rules });
  apply(61_000, 1.5, 1.5, 11_000);
  expect(market.query(scan).rows.map(r => [r.symbol, ...r.matches])).toEqual([["A", 50, 10_000]]);
  apply(62_000, 1.5, 1.5, 12_000);
  expect(market.query(scan).rows.map(r => [r.symbol, ...r.matches])).toEqual([["B", 50, 10_000]]);
});

it("preserves ten-second reference coverage through quiet updates and explicit gaps", () => {
  const market = new CustomScanMarket();
  const apply = (offset: number, price = 1) => market.set("open", at + offset, "regular", [row("A", price, at + offset, 100)]);
  const scan = query({ ...EMPTY_SCAN, rules: [{ metric: "rollingPriceChange", minutes: 1, direction: "up", minimum: 1, maximum: 1 }] });
  for (const offset of [0, 10_000, 20_000, 40_000]) apply(offset);
  apply(90_000, 2);
  expect(market.query(scan)).toMatchObject({ total: 1, incomplete: 0 });
  apply(90_001, 2);
  expect(market.query(scan)).toMatchObject({ total: 0, incomplete: 1 });
  apply(100_000, 2);
  expect(market.query(scan)).toMatchObject({ total: 1, incomplete: 0 });
});

it("keeps old session-volume scans compatible and carries all four totals into results-only sharing", async () => {
  const { sharedResultsWithoutFilters } = await import("./server/shared-scan-results");
  const snapshot: NormalizedSnapshot = {
    symbol: "WETO", company: "WETO", provider: "alpaca", session: "regular", tradingDate: "2026-11-23",
    providerAt: at, receivedAt: at, price: 0.3, baseline: 0.05, volume: 120_709_317,
    premarketVolume: 143_699_952, regularVolume: 120_709_317, postMarketVolume: null,
    dollarVolume: 30_000_000, bid: null, ask: null, marketCap: 20_000_000,
    dayHigh: 0.35, dayLow: 0.05, providerVolumeRatio: null,
  };
  const stock = scanRowFromSnapshot(snapshot, { exchange: "NASDAQ", float: 20_000_000 });
  expect(stock).toMatchObject({
    volume: 120_709_317, dayVolume: 264_409_269, premarketVolume: 143_699_952,
    regularVolume: 120_709_317, postMarketVolume: null, dollarVolume: 30_000_000,
  });
  expect(stock.facts?.floatTurnover).toBeCloseTo(120_709_317 / 20_000_000 * 100);
  expect(stock.facts?.sessionVwap).toBeCloseTo(30_000_000 / 120_709_317);
  const market = new CustomScanMarket();
  market.set("open", at, "regular", [stock]);
  const rule = (metric: string, minimum: number) => ({ metric, minimum, maximum: null });
  const saved = query({ ...EMPTY_SCAN, rules: [rule("volume", 200_000_000)] });
  expect(market.query(saved).total).toBe(0);
  const hours = query({ ...EMPTY_SCAN, rules: [rule("postMarketVolume", 1)] });
  expect(market.query(hours)).toMatchObject({ total: 0, incomplete: 1 });
  const scoped = query({ ...EMPTY_SCAN, rules: [rule("dayVolume", 200_000_000)],
    groups: [{ match: "all", rules: [rule("premarketVolume", 100_000_000), rule("regularVolume", 120_000_000)] }],
    sort: { metric: "dayVolume", direction: "desc" } });
  const result = market.query(scoped);
  expect(result.rows[0]).toMatchObject({
    dayVolume: 264_409_269, sortValue: 264_409_269, matches: [264_409_269, 143_699_952, 120_709_317],
  });
  const shared = sharedResultsWithoutFilters(result, scoped.definition);
  expect(shared.rows[0]).toMatchObject({
    volume: 120_709_317, dayVolume: 264_409_269, premarketVolume: 143_699_952,
    regularVolume: 120_709_317, postMarketVolume: null, matches: [], sortValue: null,
  });
  expect(shared.rows[0]).not.toHaveProperty("matchedRuleIndexes");
  expect(JSON.stringify(shared)).not.toContain("200000000");
});

it.each(["Scanner", "Workspace"] as const)("publishes the latest %s setup once when a reader drains its stream", async surface => {
  const market = new CustomScanMarket();
  market.set("open", at, "regular", [row("AAA", 12, at, 100)]);
  const scan = query({ ...EMPTY_SCAN, rules: [{ metric: "confirmed4hBreak", direction: "up", minimum: null, maximum: 48 }] });
  const id = "00000000-0000-4000-8000-000000000001";
  const book = { revision: 1, scans: [{ id, name: "Private setup", definition: scan.definition }] };
  const controller = new AbortController();
  const refreshLevels = async () => (symbol: string) => symbol === "AAA" ? { at: at - 60_000, reference: "owner-reference" } : undefined;
  let allowed = true;
  let notifyBook: (() => void) | undefined;
  const stream = surface === "Scanner" ? streamCustomScans(market, [scan], controller.signal,
    undefined, undefined, undefined, refreshLevels, () => allowed) : streamSavedScans({
    market, ids: [id], initialBook: book, signal: controller.signal, readBook: () => allowed ? book : null,
    subscribeBook: listener => { notifyBook = listener; return () => { notifyBook = undefined; }; },
    close: () => {}, readLevelBreaks: refreshLevels,
  });
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const read = async () => {
    const message = await reader.read();
    expect(message.done).toBe(false);
    const result = JSON.parse(decoder.decode(message.value));
    if (surface === "Scanner") return (result as ScanPublication).main;
    const workspace = (result as SavedScanResults).results[id];
    if (workspace.state !== "ready") throw Error("workspace scan did not open");
    return workspace.result;
  };
  try {
    expect((await read()).total).toBe(0);
    expect((await read()).rows[0].matchedLevelEvidence).toEqual({ 0: "owner-reference" });
    await Promise.resolve();
    const before = market.evaluations;
    market.set("open", at + 1_000, "regular", [row("AAA", 13, at + 1_000, 110)]);
    expect((await read()).rows[0].price).toBe(13);
    await Promise.resolve();
    expect(market.evaluations - before).toBe(1);

    for (const [index, price] of [14, 15, 16].entries()) {
      const received = at + (index + 2) * 1_000;
      market.set("open", received, "regular", [row("AAA", price, received, 120)]);
    }
    expect((await read()).rows[0].price).toBe(14);
    expect((await read()).rows[0].price).toBe(16);

    allowed = false;
    if (surface === "Scanner") market.set("open", at + 5_000, "regular", [row("AAA", 17, at + 5_000, 130)]);
    else notifyBook?.();
    expect((await reader.read()).done).toBe(true);
  } finally {
    controller.abort();
    await reader.cancel();
  }
});

describe("custom live scanner",()=>{
  it("keeps a member's visible release results out of shared results for another member", () => {
    const engine = new CustomScanMarket();
    engine.set("open", at, "regular", [row("AAA", 12, at, 100), row("BBB", 8, at, 100)]);
    const release = { id: "release", title: "Company release", at: at - 60_000, url: "https://test.invalid/release" };
    const fastSnapshot = { releases: new Map([["AAA", release]]) };
    const delayedSnapshot = { releases: new Map() };
    const unprivileged = vi.fn(() => undefined);
    const publish = query({ ...EMPTY_SCAN, rules: [{ metric: "pressRelease", minimum: null, maximum: 24 }] });
    const absence = query({ ...EMPTY_SCAN, rules: [{ metric: "pressRelease", minimum: null, maximum: 24, absence: true }] });

    expect(engine.query({ ...publish, compact: true }, () => fastSnapshot).rows).toHaveLength(1);
    expect(engine.query(publish, () => fastSnapshot).rows[0]).toMatchObject({ symbol: "AAA", pressRelease: release });
    expect(engine.evaluations).toBe(1);
    expect(engine.query(publish, () => delayedSnapshot)).toMatchObject({ total: 0, incomplete: 0 });
    expect(engine.query(publish, unprivileged)).toMatchObject({ total: 0, incomplete: 2 });
    expect(engine.query(absence, () => fastSnapshot).rows).toMatchObject([
      { symbol: "BBB", matches: [null], matchedRuleIndexes: [0] },
    ]);
    expect(engine.query(absence, () => delayedSnapshot).rows.map(row => row.symbol).sort()).toEqual(["AAA", "BBB"]);
    expect(engine.query(absence, unprivileged)).toMatchObject({ total: 0, incomplete: 2 });

    unprivileged.mockClear();
    expect(engine.query(query(), unprivileged).total).toBe(2);
    expect(unprivileged).not.toHaveBeenCalled();
  });

  it("matches provider-labeled sector and completed trend without assuming missing values", () => {
    const market = new CustomScanMarket();
    market.set("open",at,"regular",[
      row("AAA",12,at,100,{sector:"Technology",facts:{dailyCloseVsSma20:-1,weeklyCloseVsSma4:2}}),
      row("BBB",12,at,100,{sector:"Finance",facts:{dailyCloseVsSma20:-1,weeklyCloseVsSma4:2}}),
      row("CCC",12,at,100,{sector:"Technology",facts:{dailyCloseVsSma20:-1}}),
      row("DDD",12,at,100,{facts:{dailyCloseVsSma20:-1,weeklyCloseVsSma4:2}}),
    ]);
    expect(market.query(query({...EMPTY_SCAN,rules:[
      {metric:"listingSector",minimum:null,maximum:null,selection:["Technology"]},
      {metric:"dailyCloseVsSma20",minimum:null,maximum:-0.5},
      {metric:"weeklyCloseVsSma4",minimum:1,maximum:null},
    ]}))).toMatchObject({total:1,incomplete:2,excluded:1,rows:[{symbol:"AAA",matches:[1,-1,2]}]});
  });

  it("qualifies a nano-cap premarket move with four-decimal prices, fresh spread, and float turnover", () => {
    const end = at + 60_000;
    const snapshot = (symbol: string, time: number, price: number, quoteAt: number): NormalizedSnapshot => ({
      symbol, company: symbol, provider: "alpaca", session: "premarket", tradingDate: "2026-11-16",
      providerAt: time, receivedAt: time, price, baseline: 0.025, volume: 750_000, dollarVolume: 21_750,
      bid: 0.0289, ask: 0.0291, quoteObservedAt: quoteAt, marketCap: null, dayHigh: 0.029, dayLow: 0.025,
      providerVolumeRatio: null,
    });
    const make = (symbol: string, time: number, price: number, quoteAt: number) =>
      scanRowFromSnapshot(snapshot(symbol, time, price, quoteAt), {
        exchange: "AMEX", collectedCap: 3_463_007, float: 3_000_000,
      });
    const market = new CustomScanMarket();
    market.set("open", at, "premarket", [make("OPTT", at, 0.0277, at), make("STQ", at, 0.0277, at)]);
    market.set("open", end, "premarket", [make("OPTT", end, 0.0290, end), make("STQ", end, 0.0290, end - 31_000)]);
    const scan = market.query(query({ ...EMPTY_SCAN, rules: [
      { metric: "marketCap", minimum: null, maximum: 50_000_000 },
      { metric: "rollingPriceChange", direction: "up", minutes: 1, minimum: 0.0013, maximum: 0.0013 },
      { metric: "bidAskSpreadPercent", minimum: null, maximum: 1 },
      { metric: "floatTurnover", minimum: 20, maximum: null },
    ] }));
    expect(scan).toMatchObject({ total: 1, incomplete: 1, rows: [{
      symbol: "OPTT", price: 0.0290, matchedRuleIndexes: [0, 1, 2, 3],
      matches: [3_463_007, 0.0013, expect.closeTo(0.689655), 25],
    }] });
  });

  it("rechecks spread age at publication and withholds the spread of a retained halted row", () => {
    const scan = query({ ...EMPTY_SCAN, rules: [
      { metric: "bidAskSpread", minimum: null, maximum: 0.0003 },
      { metric: "bidAskSpreadPercent", minimum: null, maximum: 1 },
    ] });
    const market = new CustomScanMarket();
    const quoted = (symbol: string, observedAt: number, quoteObservedAt: number) =>
      row(symbol, 0.029, observedAt, 500, {
        quoteObservedAt, facts: { bidAskSpread: 0.0002, bidAskSpreadPercent: 0.69 },
      });
    market.set("open", at - 2_000, "premarket", [quoted("HALTED", at - 2_000, at - 2_000)]);
    market.set("open", at, "premarket", [
      quoted("BOUNDARY", at, at - 30_000),
      quoted("STALE", at - 2_000, at - 30_001),
      quoted("POSTPOLL", at + 1_000, at + 1_000),
    ], new Set(["BOUNDARY", "STALE", "POSTPOLL", "HALTED"]), new Set(["HALTED"]));
    expect(market.query(scan)).toMatchObject({
      total: 2, incomplete: 2,
      rows: [{ symbol: "BOUNDARY", matches: [0.0002, 0.69] }, { symbol: "POSTPOLL", matches: [0.0002, 0.69] }],
    });
  });

  it("keeps a micro-cap swing pullback separate from halts and missing weekly history", () => {
    const snapshot = {
      company: "Fixture", provider: "alpaca", session: "regular", tradingDate: "2026-11-16", price: 1.08,
      providerAt: at, receivedAt: at, baseline: 1.15, volume: 620_000, dollarVolume: 669_600, marketCap: null,
      bid: null, ask: null, dayHigh: 1.18, dayLow: 1.06, providerVolumeRatio: null, weeklyCloseVsSma4: 4,
      recentDailyHighs: { lastSevenDays: 1.2 }, weeklyClosedAt: at - 259_200_000,
    } satisfies Omit<NormalizedSnapshot, "symbol">;
    const entry = { exchange: "NASDAQ", collectedCap: 65_065_488, float: 18_000_000 } as const;
    const market = new CustomScanMarket();
    market.set("open", at, "regular", [
      scanRowFromSnapshot({ ...snapshot, symbol: "MNOV" }, entry),
      scanRowFromSnapshot({ ...snapshot, symbol: "HALT", halted: true }, entry),
      scanRowFromSnapshot({ ...snapshot, symbol: "IPOT", weeklyCloseVsSma4: undefined }, entry),
      scanRowFromSnapshot({ ...snapshot, symbol: "BLZE" }, { ...entry, collectedCap: 459_464_000 }),
    ]);
    const scan = market.query(query({ ...EMPTY_SCAN, cadence: "swing", rules: [
      { metric: "marketCap", minimum: null, maximum: 200_000_000 },
      { metric: "pullbackFromSevenDayHigh", minimum: 9, maximum: 11 },
      { metric: "weeklyCloseVsSma4", minimum: 3, maximum: null },
    ] }));
    expect(scan).toMatchObject({ total: 1, incomplete: 2, excluded: 1, rows: [{
      symbol: "MNOV", matches: [65_065_488, expect.closeTo(10), 4],
      trendContext: { weekly: { distance: 4, closedAt: snapshot.weeklyClosedAt } },
    }] });
  });

  it("combines a recent high pullback on fresh prices with longer-term strength", () => {
    const snapshot = { company: "Test", provider: "alpaca" as const, session: "regular" as const, tradingDate: "2026-11-16",
      price: 9, providerAt: at, receivedAt: at, baseline: 8, volume: 1_000, dollarVolume: 9_000,
      marketCap: null, bid: null, ask: null, dayHigh: 10, dayLow: 8, providerVolumeRatio: null,
      weeklyCloseVsSma4: 5, recentDailyHighs: { lastSevenDays: 10, previousWeek: 8 } };
    const market = new CustomScanMarket();
    market.set("open", at, "regular", [
      scanRowFromSnapshot({ ...snapshot, symbol: "FRESH" }, { exchange: "NASDAQ" }),
      scanRowFromSnapshot({ ...snapshot, symbol: "STALE", providerAt: at - 30_001 }, { exchange: "NASDAQ" }),
      scanRowFromSnapshot({ ...snapshot, symbol: "MISSING", recentDailyHighs: undefined }, { exchange: "NASDAQ" }),
    ]);
    const pullback = { metric: "pullbackFromSevenDayHigh", minimum: 10, maximum: 10 };
    expect(market.query(query({ ...EMPTY_SCAN, cadence: "swing", rules: [pullback,
      { metric: "weeklyCloseVsSma4", minimum: 2, maximum: null }],
    }))).toMatchObject({ total: 1, incomplete: 2, rows: [{ symbol: "FRESH", matches: [10, 5] }] });
    expect(market.query(query({ ...EMPTY_SCAN,
      rules: [{ metric: "pullbackFromPreviousWeekHigh", minimum: 0, maximum: 0 }],
    })).rows).toMatchObject([{ symbol: "FRESH", matches: [0] }]);
  });

  it("filters exact sub-dollar moves by direction and keeps unknown sessions separate", () => {
    const market = new CustomScanMarket();
    market.set("open", at, "regular", [row("AAA",0.0290,at,100), row("BBB",0.0277,at,100)]);
    market.set("open", at + 60_000, "regular", [
      row("AAA",0.0277,at + 60_000,200,{session:"regular"}),
      row("BBB",0.0290,at + 60_000,200,{session:"regular"}),
      row("CCC",0.0300,at + 60_000,200),
    ]);
    const decrease = {metric:"rollingPriceChange",minutes:1,direction:"down",minimum:0.0013,maximum:0.0013};
    const session = {metric:"tradingSession",minimum:null,maximum:null,selection:["regular"]};
    expect(market.query(query({...EMPTY_SCAN,rules:[session,decrease]}))).toMatchObject({
      total:1,incomplete:1,excluded:1,rows:[{symbol:"AAA",matches:[1,-0.0013]}],
    });
    expect(() => query({...EMPTY_SCAN,rules:[{...session,selection:["overnight"]}]})).toThrow("invalid_scan_selection");
  });

  it("applies custom windows independently to the whole covered set, then sorts and pages",()=>{
    const engine=new CustomScanMarket();
    engine.set("open",at,"regular",[row("A",9,at,100),row("B",10,at,1000),row("C",3,at,10)]);
    engine.set("open",at+300_000,"regular",[row("A",10,at+300_000,150),row("B",10,at+300_000,1500),row("C",5,at+300_000,20)]);
    engine.set("open",at+720_000,"regular",[row("A",10.5,at+720_000,500),row("B",10.4,at+720_000,3000),row("C",6,at+720_000,40)]);
    const first=query({ rules:[{metric:"rollingMove",minutes:7,minimum:3.5,maximum:null},
      {metric:"rollingDollarVolume",minutes:12,minimum:3000,maximum:null}],sort:{metric:"rollingDollarVolume",minutes:12,direction:"desc"} });
    const outcome=engine.query(first);
    expect(outcome.rows.map(stock=>stock.symbol)).toEqual(["B","A"]);
    expect(outcome.rows[1].matches).toEqual([5,4000]);
    expect(outcome.eligible).toBe(3);
    expect(engine.query({...first,key:"workspace"})).toBe(outcome);
    expect(engine.evaluations).toBe(1);
    const many=Array.from({length:62},(_,i)=>row("ZZ"+i,i+1,at,100));
    engine.set("open",at,"next",many);
    const compact = engine.query({ ...query(), compact: true });
    const full = engine.query(query());
    expect(compact.rows).toEqual(full.rows.slice(0, 20));
    expect(full.rows).toHaveLength(50);
    expect(engine.query(query(EMPTY_SCAN,"next",2)).rows).toHaveLength(12);
    expect(engine.evaluations).toBe(2);
  });
  it("keeps halted stocks eligible with their last observation and avoids phantom data across sessions",()=>{
    const engine=new CustomScanMarket();
    engine.set("open",at,"regular",[row("H",2,at,50)]);
    engine.set("open",at+10_000,"regular",[],new Set(["H"]),new Set(["H"]));
    expect(engine.query(query()).rows[0]).toMatchObject({symbol:"H",halted:true,price:2});
    engine.set("open",at+600_000,"after_hours",[row("H",8,at+600_000,500)]);
    const q=query({ rules:[{metric:"rollingMove",minutes:7,minimum:2,maximum:null}],sort:EMPTY_SCAN.sort });
    expect(engine.query(q)).toMatchObject({total:0,incomplete:1});
  });
  it("handles unknown float explicitly and sorts unknown values last",()=>{
    const engine=new CustomScanMarket();
    engine.set("open",at,"regular",[row("A",3,at,100,{float:null}),row("B",5,at,100)]);
    const q=query({rules:[{metric:"float",minimum:null,maximum:10_000_000,includeUnknown:true}],sort:{metric:"float",direction:"asc"}});
    expect(engine.query(q).rows.map(stock=>stock.symbol)).toEqual(["B","A"]);
    q.definition.rules[0].includeUnknown=false;
    expect(engine.query(q)).toMatchObject({total:1,incomplete:1});
  });
  it("counts only eligible tickers and distinguishes missed filters from missing quotes and inputs", () => {
    const engine = new CustomScanMarket();
    engine.set("open", at, "regular", [
      row("KNOWN", 6, at, 100),
      row("BELOW", 3, at, 100, { float: null }),
      row("NOFLOAT", 6, at, 100, { float: null }),
      row("OUTSIDE", 9, at, 100),
    ], new Set(["KNOWN", "BELOW", "NOFLOAT", "NOQUOTE"]));
    const rules = [
      { metric: "float", minimum: null, maximum: 10_000_000 },
      { metric: "price", minimum: 5, maximum: null },
    ];
    expect(engine.query(query({ rules, sort: EMPTY_SCAN.sort }))).toMatchObject({
      eligible: 4, total: 1, excluded: 1, incomplete: 2, rows: [{ symbol: "KNOWN" }],
    });
    expect(engine.query(query({ rules, match: "any", sort: EMPTY_SCAN.sort }))).toMatchObject({
      eligible: 4, total: 2, excluded: 0, incomplete: 2,
    });
  });
  it("keeps evidence only for clauses in branches that passed and identifies explicitly included unknown values", () => {
    const engine = new CustomScanMarket();
    engine.set("open", at, "regular", [row("AAA", 6, at, 100, { float: null })]);
    const float = { metric: "float", minimum: null, maximum: 10_000_000, includeUnknown: true };
    const price = { metric: "price", minimum: 5, maximum: null };
    const volume = { metric: "volume", minimum: 500, maximum: null };
    const definition = { ...EMPTY_SCAN, match: "any", rules: [float], groups: [{ match: "all", rules: [price, volume] }] };
    expect(engine.query(query(definition)).rows).toMatchObject([
      { symbol: "AAA", matches: [null, null, null], matchedRuleIndexes: [0] },
    ]);
    definition.groups[0].match = "any";
    expect(engine.query(query(definition)).rows).toMatchObject([
      { symbol: "AAA", matches: [null, 6, null], matchedRuleIndexes: [0, 1] },
    ]);
  });
  it("binds privately read confirmed 4H evidence to the exact passing rule", () => {
    const engine = new CustomScanMarket();
    engine.set("open", at, "regular", [row("AAA", 6, at, 100), row("BBB", 9, at, 100)]);
    const rule = { metric: "confirmed4hBreak", minimum: null, maximum: 24, direction: "up" };
    const defined = query({ ...EMPTY_SCAN, rules: [rule] });
    expect(engine.query(defined)).toMatchObject({ total: 0, incomplete: 2 });
    const privateRead = (symbol: string) => symbol === "AAA" ? { at: at - 10_000, reference: "accepted-A" } : undefined;
    expect(engine.query(defined, undefined, privateRead)).toMatchObject({
      total: 1, incomplete: 1, rows: [{ symbol: "AAA", matchedRuleIndexes: [0], matchedLevelEvidence: { 0: "accepted-A" } }],
    });
    expect(engine.query(defined, undefined, () => undefined)).toMatchObject({ total: 0, incomplete: 2 });
    const group = { match: "all", rules: [rule, { metric: "price", minimum: 7, maximum: null }] };
    const grouped = query({ ...EMPTY_SCAN, match: "any", rules: [{ metric: "price", minimum: 5, maximum: null }], groups: [group] });
    const result = engine.query(grouped, undefined, privateRead);
    expect(result.rows.find(stock => stock.symbol === "AAA")).not.toHaveProperty("matchedLevelEvidence");
  });
  it("keeps dated conflicting and unavailable momentum readings alongside a confirmed closed-candle match", () => {
    const engine = new CustomScanMarket({
      attach: () => () => {}, observe: () => {}, pressRelease: () => undefined,
      indicator: (_symbol, frame) => frame === "5m" ? {
        dataThrough: at - 60_000, rsi14: 54, macdHistogramPercent: -0.35, stochasticK: 42,
        atrPercent: 2, bollingerPercentB: null, emaSpread: null, indicatorVolumeRatio: null,
        sma50Ready: false, events: {},
      } : undefined,
    });
    engine.set("open", at, "regular", [row("AAA", 10, at, 100)]);
    const definition = query({ ...EMPTY_SCAN, match: "any", rules: [
      { metric: "confirmed4hBreak", minimum: null, maximum: 24, direction: "up" },
      { metric: "macdHistogramPercent", minimum: 0.1, maximum: null, frame: "5m" },
      { metric: "rsi14", minimum: 50, maximum: null, frame: "15m" },
    ] });
    const scan = engine.query(definition, undefined, () => ({ at: at - 20_000, reference: "confirmed-level" }));
    expect(scan.rows).toMatchObject([{
      matchedLevelEvidence: { 0: "confirmed-level" },
      matchedRuleIndexes: [0],
      alternativeReadings: {
        1: ["failed", -0.35, at - 60_000],
        2: ["unavailable"],
      },
      momentumReadings: [
        { ruleIndex: 1, value: -0.35, frame: "5m", closedAt: at - 60_000, met: false },
        { ruleIndex: 2, value: null, frame: "15m" },
      ],
    }]);
  });
  it("explains winning and losing branches without treating skipped rules as missing data", () => {
    const market = new CustomScanMarket();
    market.set("open", at, "regular", [row("AAA", 10, at, 100, { country: "CA", float: null })]);
    const filter = query({
      ...EMPTY_SCAN, match: "any",
      rules: [{ metric: "price", minimum: 9, maximum: null }],
      groups: [
        { match: "all", rules: [
          { metric: "price", minimum: 8, maximum: null },
          { metric: "volume", minimum: 200, maximum: null },
          { metric: "listingCountry", selection: ["US"] },
        ] },
        { match: "any", rules: [
          { metric: "float", minimum: 100, maximum: null },
          { metric: "listingCountry", selection: ["CA"] },
        ] },
      ],
    });
    expect(market.query(filter)).toMatchObject({
      total: 1,
      groupCoverage: [{ checked: 1, failed: 1, unknown: 0 }, { checked: 1, failed: 0, unknown: 0 }],
      rows: [{
        matches: [10, null, null, null, null, 1],
        matchedRuleIndexes: [0, 5],
        alternativeReadings: {
          1: ["passed", 10],
          2: ["failed", 100],
          4: ["unavailable"],
        },
      }],
    });
    expect(Object.keys(market.query(filter).rows[0].alternativeReadings ?? {})).toEqual(["1", "2", "4"]);
    const compact = market.query({ ...filter, compact: true });
    expect(compact.rows[0]).not.toHaveProperty("alternativeReadings");
    expect(compact).not.toHaveProperty("groupCoverage");
  });
  it("filters an explicit listing type and keeps unlabeled rows unknown", () => {
    const market = new CustomScanMarket();
    market.set("open", at, "regular", [
      row("AAA", 10, at, 100, { securityType: "COMMON" }),
      row("BBB", 10, at, 100, { securityType: "ORDINARY" }),
      row("CCC", 10, at, 100),
    ]);
    const filter = query({ ...EMPTY_SCAN, rules: [{ metric: "listingSecurityType", selection: ["common"] }] });
    expect(market.query(filter)).toMatchObject({
      total: 1, incomplete: 1, excluded: 1,
      rows: [{ symbol: "AAA", securityType: "COMMON", matchedRuleIndexes: [0] }],
    });
    expect(() => query({ ...EMPTY_SCAN, rules: [{ metric: "listingSecurityType", selection: ["unknown"] }] }))
      .toThrow("invalid_scan_selection");
  });
  it("rejects malformed thresholds, windows, and duplicate subscription keys",()=>{
    for(const minutes of [0,2.25,961,null]){
      expect(()=>parseScanDefinition({rules:[{metric:"rollingMove",minutes,minimum:3.5,maximum:null}],sort:EMPTY_SCAN.sort})).toThrow();
    }
    expect(()=>parseScanDefinition({rules:[{metric:"price",minimum:9,maximum:1}],sort:EMPTY_SCAN.sort})).toThrow();
    expect(()=>parseScanQueries([query(),query()])).toThrow();
  });
  it("streams the changed scans, coalesces identical work, and detaches on cancel",async()=>{
    const engine=new CustomScanMarket();
    const release=vi.fn();
    const request=new AbortController();
    const stream=streamCustomScans(engine,[query(EMPTY_SCAN,"a"),query(EMPTY_SCAN,"b")],request.signal,()=>release);
    const reader=stream.getReader();
    const first=JSON.parse(new TextDecoder().decode((await reader.read()).value));
    expect(Object.keys(first)).toEqual(["a","b"]);
    expect(engine.evaluations).toBe(1);
    engine.set("open",at,"regular",[row("A",3,at,100)]);
    const next=JSON.parse(new TextDecoder().decode((await reader.read()).value));
    expect(next.a.rows[0].price).toBe(3);
    expect(next.a).toEqual(next.b);
    await reader.cancel();
    request.abort();
    expect(release).toHaveBeenCalledTimes(1);
  });
});

let directory:string|undefined;
afterEach(()=>{if(directory)rmSync(directory,{recursive:true,force:true});directory=undefined;});
it("keeps saved definitions private and rejects stale updates",()=>{
  directory=mkdtempSync(join(tmpdir(),"custom-scan-store-"));
  const scan={id:"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",name:"Pullback",definition:EMPTY_SCAN};
  expect(writeSavedCustomScans(directory,"alice",{revision:0,scans:[scan]})).toEqual({revision:1,scans:[scan]});
  expect(readSavedCustomScans(directory,"bob")).toEqual({revision:0,scans:[]});
  expect(readSavedCustomScans(directory,"alice").scans[0]).toEqual(scan);
  expect(()=>writeSavedCustomScans(directory!,"alice",{revision:0,scans:[]})).toThrow("scan_save_conflict");
});

it("projects exact session levels, signed VWAP distance, float turnover, and after-hours change",()=>{
  const before=scanRowFromSnapshot({
    symbol:"MOVE",company:"Move",session:"regular",tradingDate:"2026-11-16",price:9,
    providerAt:at,receivedAt:at,baseline:8,volume:1000,dollarVolume:10_000,marketCap:null,bid:null,ask:null,
    dayHigh:11,dayLow:8,providerVolumeRatio:null,premarketHigh:11,premarketLow:8,premarketVolume:500,
    regularHigh:10,regularLow:9,regularVolume:1000,regularClosePrice:10,
  },{exchange:"NASDAQ",float:5000,collectedCap:5_000_000});
  expect(before.facts).toMatchObject({sessionVwap:10,fromVwap:-10,floatTurnover:20,
    dayRange:37.5,premarketLow:8,premarketRange:37.5,fromPremarketHigh:-2/11*100,fromPremarketLow:12.5,
    regularHigh:10,regularRange:100/9,postMarketRange:null,postMarketChange:null});
  const market=new CustomScanMarket();
  market.set("open",at,"regular",[before]);
  const filter=query({rules:[{metric:"fromVwap",minimum:-20,maximum:-1},
    {metric:"premarketVolume",minimum:500,maximum:null}],sort:{metric:"regularHigh",direction:"desc"}});
  const shown=market.query(filter).rows[0];
  expect(shown.matches).toEqual([-10,500]);
  expect(shown.sortValue).toBe(10);
  expect(shown).not.toHaveProperty("facts");
  expect(market.query(query({rules:[{metric:"postMarketVolume",minimum:0,maximum:null}],sort:EMPTY_SCAN.sort})))
    .toMatchObject({total:0,incomplete:1});
  const sessionScan = parseScanDefinition({
    match:"all",rules:[{metric:"premarketRange",minimum:30,maximum:null},{metric:"fromPremarketHigh",minimum:null,maximum:-10}],
    sort:{metric:"regularRange",direction:"desc"},
  });
  expect(market.query(query(sessionScan))).toMatchObject({total:1,rows:[{symbol:"MOVE",matches:[37.5,-2/11*100]}]});
  expect(market.query(query({rules:[{metric:"postMarketRange",minimum:0,maximum:null}],sort:EMPTY_SCAN.sort})))
    .toMatchObject({total:0,incomplete:1});
});

it("compares equal adjoining volume windows and leaves zero baselines unknown",()=>{
  const market=new CustomScanMarket();
  const step=120_000;
  for(const [i,[active,quiet]] of [[100,100],[200,100],[450,300]].entries())
    market.set("open",at+i*step,"regular",[row("ACT",9,at+i*step,active),row("QUIET",9,at+i*step,quiet)]);
  const filter=query({rules:[{metric:"volumePace",minutes:2,minimum:2,maximum:null}],sort:{metric:"volumePace",minutes:2,direction:"desc"}});
  expect(market.query(filter)).toMatchObject({total:1,incomplete:1,rows:[{symbol:"ACT",matches:[2.5],sortValue:2.5}]});
});

describe("Scanner starting points and listing filters", () => {
  it("loads all six starting points as normal editable scan definitions", async () => {
    const { builtInScanChoices, builtInScanForChoice, livePresetChoices, originalBuiltInScan } = await import("./built-in-scans");
    expect(builtInScanChoices.map(choice => choice.label))
      .toEqual(["Top Gainers", "Momentum", "Top Losers", "HOD Drops", "Breakouts", "Market Events"]);
    expect(livePresetChoices.map(preset => preset.id)).toEqual([
      "live:gainers", "live:momentum", "live:losers", "live:hod-drops", "live:breakouts", "live:market-events",
    ]);
    expect(livePresetChoices.map(preset => preset.label)).toEqual(builtInScanChoices.map(choice => choice.label));
    for (const preset of livePresetChoices) {
      expect(Object.keys(preset)).toEqual(["id", "label", "widget"]);
      expect(originalBuiltInScan(preset.id)).toMatchObject({ label: preset.label, widget: preset.widget });
    }
    for (const { value } of builtInScanChoices) {
      const startingPoint = builtInScanForChoice(value)!;
      startingPoint.definition.rules.push({ metric: "price", minimum: 1, maximum: null });
      expect(parseScanDefinition(startingPoint.definition).rules.at(-1)?.metric).toBe("price");
      expect(builtInScanForChoice(value)?.definition.rules).toHaveLength(startingPoint.definition.rules.length - 1);
    }
    expect(builtInScanForChoice("built-in:toString")).toBeUndefined();
  });

  it("keeps matching halted rows, including a fresh row on session rollover", () => {
    const market = new CustomScanMarket();
    const filter = query({
      rules: [{ metric: "activeHalt", minimum: 1, maximum: null }], sort: EMPTY_SCAN.sort,
    });
    market.set("open", at, "regular", [row("HALT", 5, at, 500), row("NOINFO", 5, at, 500)],
      new Set(["HALT", "NOINFO"]), new Set(["HALT"]));
    expect(market.query(filter)).toMatchObject({ total: 1, incomplete: 1, rows: [{ symbol: "HALT", halted: true }] });
    market.set("open", at + 5_000, "regular", [], new Set(["HALT"]), new Set(["HALT"]));
    expect(market.query(filter)).toMatchObject({ total: 1, rows: [{ symbol: "HALT", halted: true }] });
  });

  it("canonicalizes ticker, exchange and country rules and handles unavailable country", () => {
    const market = new CustomScanMarket();
    market.set("open", at, "regular", [
      row("AAA", 5, at, 500, { country: "US", industry:"Electronic Components" }),
      row("BBB", 5, at, 500, { country: "CA" }),
      row("CCC", 5, at, 500),
      row("DDD", 5, at, 500, { country: "US", exchange: "NYSE" }),
    ]);
    const filter = query({ rules: [
      { metric: "tickerList", selection: [" ccc", "aaa", "BBB", "AAA", "DDD"] },
      { metric: "listingExchange", selection: ["nasdaq"] },
      { metric: "listingCountry", selection: ["us"] },
    ], sort: EMPTY_SCAN.sort });
    expect(filter.definition.rules[0].selection).toEqual(["AAA", "BBB", "CCC", "DDD"]);
    expect(market.query(filter)).toMatchObject({ total: 1, incomplete: 1, excluded: 2, rows: [{ symbol: "AAA" }] });
    const industry = query({rules:[{metric:"listingIndustry",selection:[" electronic  components "]}],sort:EMPTY_SCAN.sort});
    expect(market.query(industry)).toMatchObject({total:1,incomplete:3,rows:[{symbol:"AAA",industry:"Electronic Components"}]});
    const blocked = query({ rules: [
      { metric: "listingExchange", selection: ["nasdaq"] },
      { metric: "listingCountry", selection: ["GB"] },
    ], sort: EMPTY_SCAN.sort });
    expect(market.query(blocked)).toMatchObject({ total: 0, ruleCoverage: [
      { checked: 4, failed: 1, unknown: 0 },
      { checked: 3, failed: 2, unknown: 1 },
    ] });
    expect(() => query({ rules: [{ metric: "listingExchange", selection: ["unknown"] }], sort: EMPTY_SCAN.sort }))
      .toThrow("invalid_scan_selection");
  });
});

describe("Scanner daily context, relative volume and setup geometry", () => {
  it("aligns three completed comparable 15-minute session prefixes", async () => {
    const { sameTimeSessionVolumeRatio } = await import("./same-time-relative-volume");
    const dates = ["2026-11-16", "2026-11-13", "2026-11-12", "2026-11-11"];
    const bars = dates.flatMap((date,index) => [0,15].map(minutes =>
      [Date.parse(date + "T14:30:00Z") / 1000 + minutes * 60, 1, 1, 1, 1, index === 0 ? 300 : 100, 1])).flat();
    const cutoff = Date.parse("2026-11-16T15:00:00Z");
    const coveredFrom = Date.parse("2026-11-11T14:30:00Z");
    expect(sameTimeSessionVolumeRatio(new Float64Array(bars), 7, cutoff)).toBe(3);
    expect(sameTimeSessionVolumeRatio(new Float64Array(bars.slice(0, -7)), 7, cutoff)).toBeNull();
    expect(sameTimeSessionVolumeRatio(new Float64Array(bars.slice(0, -7)), 7, cutoff, coveredFrom)).toBe(3.6);
    expect(sameTimeSessionVolumeRatio(new Float64Array(bars.slice(0, -7)), 7, cutoff, coveredFrom + 30 * 60_000)).toBeNull();
    expect(sameTimeSessionVolumeRatio(new Float64Array(bars.slice(14)), 7, cutoff, coveredFrom)).toBe(0);
    expect(sameTimeSessionVolumeRatio(new Float64Array(bars), 7, cutoff + 60_000)).toBeNull();
    expect(query({rules:[{metric:"sameTimeRegularVolume", minimum:2, maximum:null}],sort:EMPTY_SCAN.sort})
      .definition.rules[0].frame).toBe("15m");
  });

  it.each([["premarket", "09:00"], ["after_hours", "21:00"]] as const)(
    "compares %s volume only with the same portion of prior sessions", async (session, open) => {
      const { sameTimeSessionVolumeRatio } = await import("./same-time-relative-volume");
      const dates = ["2026-11-11", "2026-11-12", "2026-11-13", "2026-11-16"];
      const starts = dates.map(date => Date.parse(date + "T" + open + ":00Z"));
      const candles = new Float64Array(starts.flatMap((at, index) => [at / 1000, 1, 1, 1, 1, index === 3 ? 375 : 100, 1]));
      const through = starts[3] + 30 * 60_000;
      expect(sameTimeSessionVolumeRatio(candles, 7, through, starts[0], session)).toBe(3.75);
      expect(sameTimeSessionVolumeRatio(candles, 7, through, starts[0])).toBeNull();

      const metric = session === "premarket" ? "sameTimePremarketVolume" : "sameTimeAfterHoursVolume";
      const scan = query({ rules: [{ metric, minimum: 3, maximum: 4 }],
        sort: { metric, direction: "desc", frame: "1m" } });
      expect(scan.definition.rules[0].frame).toBe("15m");
      expect(scan.definition.sort.frame).toBe("15m");
      const market = new CustomScanMarket({
        attach: () => () => {}, observe: () => {}, pressRelease: () => undefined, indicator: () => undefined,
        sameTimeVolumeRatio: (symbol, cutoff, requested) => symbol === "MISSING" ? null
          : sameTimeSessionVolumeRatio(candles, 7, cutoff, starts[0], requested),
      });
      market.set("open", through, session, [
        row("RUN", 0.52, through, 375, { session }),
        row("MISSING", 0.33, through, 0, { session }),
        row("OTHER", 1.07, through, 800, { session: "regular" }),
      ]);
      expect(market.query(scan)).toMatchObject({ total: 1, incomplete: 2,
        rows: [{symbol: "RUN", sortValue: 3.75, matches: [3.75]}] });

    },
  );

  it("includes the exact PR cutoff for legacy saved minute windows and excludes the next millisecond", () => {
    const market = new CustomScanMarket();
    const now = Date.parse("2026-11-19T15:30:00Z");
    market.set("open", now, "regular", ["EDGE", "OLDER"].map(symbol => row(symbol, 0.56, now, 5_000)));
    const releases = new Map(["EDGE", "OLDER"].map(symbol => [symbol, {
      id: symbol, title: symbol, at: now - 31 * 60_000 - (symbol === "OLDER" ? 1 : 0), url: "",
    }]));
    for (const absence of [false, true]) {
      const scan = query({ ...EMPTY_SCAN, rules: [{ metric: "pressRelease",
        minimum: null, maximum: 31 * (1 / 60), absence }] });
      expect(market.query(scan, () => ({ releases })).rows.map(item => item.symbol)).toEqual([absence ? "OLDER" : "EDGE"]);
    }
  });

  it("keeps setup targets direction-specific and omits ratios for a zero-width zone", async () => {
    const { scannerRetestSetup } = await import("./setup-details");
    const objective = { zoneId:"r1",frame:"4h" as const,side:"resistance" as const,lower:14,upper:16,distance:2 };
    const next = {...objective,zoneId:"r2",lower:18,upper:19};
    const long = scannerRetestSetup("up",{lower:10,upper:12},[next,objective],11);
    expect(long).toMatchObject({entryReference:12,invalidation:10,readiness:"in_retest_area",objectives:[
      {edge:14,rewardToRisk:1},{edge:18,rewardToRisk:3},
    ]});
    expect(scannerRetestSetup("up",{lower:10,upper:12},[next,objective],14))
      .toMatchObject({readiness:"beyond_target",distanceToEntry:2});
    const short = scannerRetestSetup("down",{lower:10,upper:12},[{...objective,lower:5,upper:6}],13);
    expect(short).toMatchObject({entryReference:10,invalidation:12,readiness:"past_invalidation",objectives:[{edge:6,rewardToRisk:2}]});
    expect(scannerRetestSetup("up",{lower:12,upper:12},[objective])?.objectives[0].rewardToRisk).toBeUndefined();
  });

  it("keeps dated technical evidence and unavailable inputs with a level-backed match", async () => {
    const { scannerSetupStudies } = await import("./setup-details");
    const closed = at - 60_000;
    const indicator = vi.fn(() => ({ dataThrough: closed, rsi14: null, emaSpread: null,
      atrRatio: 0.8, atrPercent: 1, indicatorVolumeRatio: null, macdHistogramPercent: null,
      bollingerPercentB: null, stochasticK: null, sma50Ready: false, events: { atrContracting: closed } }));
    const market = new CustomScanMarket({ attach: () => () => {}, observe: () => {}, indicator, pressRelease: () => undefined });
    market.set("open", at, "regular", [row("AAA", 12, at, 100, {
      dailyClosedAt: closed - 600_000, facts: { dailyRelativeToSpy: 3.25 },
    })]);
    const scan = query({ ...EMPTY_SCAN, rules: [
      { metric: "confirmed4hBreak", direction: "up", minimum: null, maximum: 4 },
      { metric: "dailyRelativeToSpy", minimum: 1, maximum: null },
    ], groups: [{ match: "any", rules: [
      { metric: "atrRatio", minimum: 1.2, maximum: null, frame: "15m" },
      { metric: "indicatorSignal", signal: "atrContracting", minimum: null, maximum: 10, frame: "15m" },
      { metric: "weeklyRelativeToSpy", minimum: 1, maximum: null },
      { metric: "indicatorSignal", signal: "wideCandle", minimum: null, maximum: 10, frame: "15m" },
    ] }] });
    const result = market.query(scan, undefined, () => ({ at: closed, reference: "owner-reference" }));
    const hit = result.rows[0];
    expect(hit.matchedLevelEvidence).toEqual({ 0: "owner-reference" });
    const marketCalls = indicator.mock.calls.length;
    expect(scannerSetupStudies(scan.definition, hit)).toMatchObject([
      { label: "Daily return vs SPY (percentage points)", value: 3.25, state: "matched", closedAt: closed - 600_000 },
      { label: "ATR vs prior baseline", frame: "15m", value: 0.8, state: "failed", closedAt: closed },
      { label: "Volatility contracting", frame: "15m", value: closed, state: "matched", closedAt: closed },
      { label: "Weekly return vs SPY (percentage points)", value: null, state: "unavailable" },
      { label: "Unusually wide candle", value: null, state: "failed" },
    ]);
    expect(indicator).toHaveBeenCalledTimes(marketCalls);
  });
});

it("requires the complete latest segment for shared closed structure filters", async () => {
  const { closedStructureSignals } = await import("./closed-structure-signals");
  const base = Date.parse("2026-11-16T15:00:00Z");
  const high = [10,11,12,11,10,11,12,13,12,11];
  const bars = high.flatMap((price,index) => [(base + index * 60_000)/1000,price-0.25,price,price-1,price-0.25,100,price-0.25]);
  const final = base + high.length * 60_000;
  expect(closedStructureSignals(new Float64Array(bars),7,"1m","AA",final)?.higherSwingHigh).toBe(final);
  expect(closedStructureSignals(new Float64Array(bars),7,"1m","AA",final + 60_000)).toBeUndefined();
  expect(closedStructureSignals(new Float64Array([...bars.slice(0,7*6),...bars.slice(7*7)]),7,"1m","AA",final)).toBeUndefined();
});

it("requires a current trade timestamp for setup distance", () => {
  const market = new CustomScanMarket();
  const definition = query({...EMPTY_SCAN,rules:[{metric:"distanceToVerifiedZone",minimum:0,maximum:1}]});
  const evidence = () => ({at:at-1_000,reference:"owner-proof",setup:{
    direction:"up" as const,lower:10,upper:12,targets:[],
  }});
  market.set("open",at,"regular",[
    row("FRESH",11,at,500,{priceSourceAt:at-30_000}),
    row("STALE",11,at,500,{priceSourceAt:at-30_001}),
    row("UNKNOWN",11,at,500),
    row("LATER",11,at+1_000,500,{priceSourceAt:at+1_000}),
  ]);
  expect(market.query(definition,undefined,evidence)).toMatchObject({
    total:2,incomplete:2,rows:[{symbol:"FRESH",matches:[0]},{symbol:"LATER",matches:[0]}],
  });
});

it("filters eligible private zone distance and target room without leaking owner evidence into the shared cache", () => {
  const market = new CustomScanMarket();
  market.set("open",at,"regular",[row("AAA",12,at,500,{priceSourceAt:at}),row("BBB",12,at,500)]);
  const definition = query({rules:[
    {metric:"distanceToVerifiedZone",minimum:0,maximum:0},
    {metric:"roomToNextVerifiedZone",minimum:15,maximum:null},
  ],sort:EMPTY_SCAN.sort});
  const targets = [{zoneId:"target",frame:"1D" as const,side:"resistance" as const,lower:14,upper:15,distance:2}];
  expect(market.query(definition,undefined,symbol=>symbol==="AAA"
    ? {at:at-1_000,reference:"owner-proof",setup:{direction:"up",lower:10,upper:12,targets}} : undefined))
    .toMatchObject({total:1,incomplete:1,rows:[{symbol:"AAA",matches:[0,2/12*100],matchedLevelEvidence:{0:"owner-proof",1:"owner-proof"}}]});
  expect(market.query(definition)).toMatchObject({total:0,incomplete:2});
});

it("matches a real trade-resumption timestamp within its selected window", () => {
  const market = new CustomScanMarket();
  market.set("open",at,"regular",[
    row("AAA",12,at,500,{halted:false,tradeResumedAt:at-1_000}),
    row("BBB",12,at,500,{halted:true}),
    row("CCC",12,at,500),
  ]);
  const definition = query({rules:[{metric:"tradeResumed",minimum:null,maximum:10}],sort:EMPTY_SCAN.sort});
  expect(market.query(definition)).toMatchObject({total:1,excluded:1,incomplete:1,rows:[{symbol:"AAA",matches:[at-1_000]}]});
});

it("shares the five-minute swing snapshot across reconnects while live results still update", async () => {
  const { streamCustomScans, SWING_DETECTION_INTERVAL_MS } = await import("./transport");
  vi.useFakeTimers();
  const start = Math.floor(Date.now() / SWING_DETECTION_INTERVAL_MS) * SWING_DETECTION_INTERVAL_MS;
  vi.setSystemTime(start);
  const market = new CustomScanMarket();
  const stock = { symbol: "ABCD", exchange: "NASDAQ" as const, price: 2, volume: 100, dollarVolume: 200,
    marketCap: null, float: null, dayChange: 0, belowHigh: 0, observedAt: start };
  const readers: ReadableStreamDefaultReader<Uint8Array>[] = [];
  const next = async (swing: boolean, compact = false) => {
    const definition = parseScanDefinition({ ...EMPTY_SCAN, ...(swing ? { cadence: "swing" } : {}),
      rules: [{ metric: "price", minimum: 5, maximum: null }] });
    const reader = streamCustomScans(market, [{ key: "scan", page: 1, definition, compact }], new AbortController().signal).getReader();
    readers.push(reader);
    const bytes = (await reader.read()).value;
    await reader.cancel();
    return JSON.parse(new TextDecoder().decode(bytes)).scan.total;
  };
  try {
    market.set("open", start, "regular", [stock]);
    expect(await next(true, true)).toBe(0);
    vi.setSystemTime(start + 60_000);
    market.set("open", Date.now(), "regular", [{ ...stock, price: 7, observedAt: Date.now() }]);
    expect(await next(false)).toBe(1);
    expect(await next(true)).toBe(0);
    expect(market.evaluations).toBe(2);
    vi.setSystemTime(start + SWING_DETECTION_INTERVAL_MS);
    expect(await next(true)).toBe(1);
  } finally {
    await Promise.all(readers.map(reader => reader.cancel()));
    vi.useRealTimers();
  }
});

it("finishes a cold swing reading in the same cycle and shares it with compact readers", () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(at);
    let notifyHistory!: () => void;
    let reading: number | null = null;
    const market = new CustomScanMarket({
      onHistoryUpdate: notify => { notifyHistory = notify; },
      candleStudy: () => reading,
      observe: () => {}, attach: () => () => {}, indicator: () => undefined, pressRelease: () => undefined,
    });
    const cold = query({ ...EMPTY_SCAN, cadence: "swing", rules: [
      { metric: "smaDistance", studyFrame: "1D", period: 50, minimum: 1, maximum: null },
    ] });
    const warm = query({ ...EMPTY_SCAN, cadence: "swing", rules: [
      { metric: "price", minimum: 1, maximum: null },
    ] });
    market.set("open", at, "regular", [row("VIVS", 2, at, 5000)]);
    const run = (q: ScanQuery) => market.query(q, undefined, undefined, 1);
    const onUpdate = vi.fn();
    market.subscribe(onUpdate);
    expect(run(cold)).toMatchObject({ total: 0, incomplete: 1 });
    const original = run(warm);
    reading = 1.2;
    notifyHistory();
    notifyHistory();
    vi.advanceTimersByTime(750);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(run(cold)).toMatchObject({ total: 1, incomplete: 0, rows: [{symbol: "VIVS", matches: [1.2]}] });
    expect(run({ ...cold, compact: true }).total).toBe(1);
    expect(run(warm)).toBe(original);
    expect(market.evaluations).toBe(3);
  } finally {
    vi.useRealTimers();
  }
});
