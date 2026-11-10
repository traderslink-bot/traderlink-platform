// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { DailyUniverse, NormalizedSnapshot, UniverseUpload } from "./contracts";
import { RollingActivityBook } from "./activity";
import { LiveScannerEngine } from "./engine";
import { admitMoomooRequest, recordMoomoo429, reserveScannerDemand, restoreBudget } from "./request-budget";
import { activeSession, easternClock, type MarketDay } from "./sessions";
import { initialConfiguration, updateConfiguration, validateConfiguration } from "./settings";
import { normalizeSnapshotBatch, qualifiedMoomooSnapshotSession, snapshotBatches } from "./snapshots";
import { importDailyUniverse } from "./universe";
import { parseUniverseCsv, validateUniverseUpload } from "./universe-validation";

const NOW = Date.parse("2026-11-02T15:00:00Z");
function upload(csv = "symbol,exchange,market_cap\nAAA,NASDAQ,10000000\nBBB,NYSE,100000000"): UniverseUpload {
  return { tradingDate: "2026-11-02", csv, metadata: { completeness_status: "complete",
    source_url: "https://stockanalysis.com/stocks/screener/", collection_started_at_utc: "2026-11-02T08:00:00Z",
    collection_finished_at_utc: "2026-11-02T08:01:00Z", displayed_total: csv.trim().split("\n").length-1,
    extracted_unique_count: csv.trim().split("\n").length-1,
    applied_filters: { exchanges: ["NASDAQ","NYSE"], market_cap_max: 100_000_000 } } };
}
function snapshot(at = NOW, patch: Partial<NormalizedSnapshot> = {}): NormalizedSnapshot {
  return { symbol: "AAA", company: "Synthetic A", tradingDate: "2026-11-02", session: "regular", providerAt: at, receivedAt: at,
    price: 1, baseline: 0.95, volume: 1_000_000, dollarVolume: 2_000_000, bid: 0.999, ask: 1.001,
    marketCap: 10_000_000, dayHigh: 1.2, dayLow: 0.8, providerVolumeRatio: 4, ...patch };
}
const qualification = { sessionTimestampVerified: true, sessionCountersVerified: true, afterHoursRegularCloseVerified: true };
const raw = (patch: Record<string,unknown> = {}) => ({ code: "US.AAA", name: "Synthetic A", update_time: NOW, data_date: "2026-11-02",
  last_price: 1, prev_close_price: 0.9, volume: 5000, turnover: 6000, bid_price: 0.99, ask_price: 1.01,
  high_price: 1.3,low_price: 0.8,pre_price: 1.1,pre_high_price: 1.2,pre_low_price: 0.9,pre_volume: 500,pre_turnover: 550,
  after_price: 1.4,after_high_price: 1.5,after_low_price: 0.7,after_volume: 1000,after_turnover: 1400,volume_ratio: 4,...patch });
function batch(rows: unknown[], options: Partial<Parameters<typeof normalizeSnapshotBatch>[0]> = {}) {
  return normalizeSnapshotBatch({ requestedSymbols: ["AAA"], payload: { ret_code: 0, data: { snapshot_list: rows } },
    tradingDate: "2026-11-02", receivedAt: NOW, session: "regular", qualification, ...options });
}

describe("daily list integrity", () => {
  it("accepts whole dollars, the inclusive ceiling, BOM/CRLF and quoted scalar cells", () => {
    expect(parseUniverseCsv('\uFEFF"symbol",exchange,market_cap\r\nAAA,NASDAQ,"100000000"\r\n')).toEqual([
      { symbol: "AAA", exchange: "NASDAQ", marketCapAtCollection: 100_000_000 }]);
  });
  it.each(["0","500000001","10M","1e7","NaN","-1"]) ("rejects cap %s without inventing a value", cap => {
    expect(() => parseUniverseCsv(`symbol,exchange,market_cap\nAAA,NASDAQ,${cap}`)).toThrow();
  });
  it("accepts the collection ceiling while enforcing each source's declared ceiling",()=>{
    expect(parseUniverseCsv("symbol,exchange,market_cap\nAAA,NASDAQ,500000000")[0].marketCapAtCollection).toBe(500000000);
    expect(()=>validateUniverseUpload({...upload("symbol,exchange,market_cap\nAAA,NASDAQ,100000001"),metadata:{...upload().metadata,displayed_total:1,extracted_unique_count:1}},NOW)).toThrow("market_cap_invalid");
  });
  it("rejects duplicates, an unselected exchange, unexpected columns and empty data", () => {
    for (const csv of ["symbol,exchange,market_cap\nAAA,NASDAQ,1\nAAA,NASDAQ,1", "symbol,exchange,market_cap\nAAA,OTC,1",
      "symbol,exchange,market_cap,volume\nAAA,NASDAQ,1,5", "symbol,exchange,market_cap"]) expect(() => parseUniverseCsv(csv)).toThrow();
  });
  it("rejects partial collections and mismatched completeness counts", () => {
    expect(() => validateUniverseUpload({ ...upload(), metadata: { ...upload().metadata, completeness_status: "partial" } },NOW)).toThrow();
    expect(() => validateUniverseUpload({ ...upload(), metadata: { ...upload().metadata, displayed_total: 1251 } },NOW)).toThrow();
  });
  it("rejects a fabricated trading date and stale/future collection times", () => {
    expect(() => validateUniverseUpload({ ...upload(), tradingDate: "2026-02-30" },NOW)).toThrow();
    expect(() => validateUniverseUpload({ ...upload(), tradingDate: "2026-11-03" },NOW)).toThrow("date_mismatch");
    expect(() => validateUniverseUpload(upload(),NOW+48*60*60_000)).toThrow("time_invalid");
    expect(() => validateUniverseUpload(upload(),Date.parse("2026-11-02T07:00:00Z"))).toThrow("time_invalid");
  });
  it("makes reordered identical data idempotent and keeps all earlier daily qualifiers", () => {
    const initial = importDailyUniverse(null,upload(),NOW);
    const reordered = upload("symbol,exchange,market_cap\nBBB,NYSE,100000000\nAAA,NASDAQ,10000000");
    expect(importDailyUniverse(initial.universe,reordered,NOW).idempotent).toBe(true);
    const smaller = upload("symbol,exchange,market_cap\nAAA,NASDAQ,20000000");
    const merged = importDailyUniverse(initial.universe,smaller,NOW).universe;
    expect(merged.stocks.map(row => row.symbol)).toEqual(["AAA","BBB"]);
    expect(merged.stocks[0].marketCapAtCollection).toBe(10_000_000);
    expect(initial.universe.sourceHashes).toHaveLength(1);
  });
  it("excludes five-character warrant-suffix symbols from current and retained universe rows",()=>{
    const imported=importDailyUniverse(null,upload("symbol,exchange,market_cap\nABCD,NASDAQ,10000000\nABCDW,NASDAQ,9000000"),NOW).universe;
    expect(imported.stocks.map(stock=>stock.symbol)).toEqual(["ABCD"]);
    const cleaned=importDailyUniverse({...imported,stocks:[...imported.stocks,{symbol:"TESTW",exchange:"NYSE",marketCapAtCollection:5_000_000}]},upload("symbol,exchange,market_cap\nABCD,NASDAQ,10000000"),NOW).universe;
    expect(cleaned.stocks.map(stock=>stock.symbol)).toEqual(["ABCD"]);
  });
  it("rejects an exchange conflict without mutating the accepted universe and refuses a cross-day merge", () => {
    const previous = importDailyUniverse(null,upload(),NOW).universe;
    const accepted = structuredClone(previous);
    expect(() => importDailyUniverse(previous,upload("symbol,exchange,market_cap\nAAA,NYSE,100"),NOW)).toThrow("scanner_universe_exchange_conflict");
    expect(previous).toEqual(accepted);
    expect(() => importDailyUniverse({ ...previous,tradingDate: "2026-10-30" },upload(),NOW)).toThrow("date_conflict");
  });
});

describe("session and snapshot evidence", () => {
  it("accepts a current OAuth response without discarding thin stocks whose last-trade clocks are old", () => {
    const receivedAt = 1793639811961;
    const facts = [
      { code:"US.AAPL",data_date:"2026-11-02",update_time:1793639811174,last_price:338.54,prev_close_price:344.63,volume:18867485,turnover:6432582491.841 },
      { code:"US.AACG",data_date:"2026-11-02",update_time:1793638483081,last_price:0.6105,prev_close_price:0.6495,volume:1668,turnover:1062.372 },
      { code:"US.AAME",data_date:"2026-11-02",update_time:1793639540916,last_price:1.1,prev_close_price:1.07,volume:32064,turnover:35184.838 },
      { code:"US.AARD",data_date:"2026-11-02",update_time:1793639793227,last_price:1.295,prev_close_price:1.36,volume:145648,turnover:189996.108 },
    ];
    const result = normalizeSnapshotBatch({ requestedSymbols:["AAPL","AACG","AAME","AARD"],payload:{ ret_code:0,data:{ snapshot_list:facts } },
      session:"regular",tradingDate:"2026-11-02",receivedAt,qualification:qualifiedMoomooSnapshotSession("regular") });
    expect(result.snapshots.map(row=>row.symbol)).toEqual(["AAPL","AACG","AAME","AARD"]);
    expect(result.snapshots[0].volume).toBe(18867485);
    expect(result.snapshots[3].dollarVolume).toBe(189996.108);
    expect(result.missingSymbols).toEqual([]);
    expect(result.issues).toEqual([]);
  });
  it.each([["premarket",1.1,500],["after_hours",1.4,1000]] as const)("uses receipt-time observation for %s session fields", (session,price,volume) => {
    expect(batch([raw()],{ session,qualification:qualifiedMoomooSnapshotSession(session) }).snapshots[0]).toMatchObject({session,price,volume,priceTimeBasis:"session_observation"});
  });
  const day: MarketDay = { date: "2026-11-02", verified: true, open: true, regularCloseEastern: "16:00", extendedCloseEastern: "20:00" };
  it("uses Eastern time across DST and observes all session boundaries", () => {
    expect(easternClock(Date.parse("2026-10-30T13:30:00Z")).minute).toBe(570);
    expect(easternClock(Date.parse("2026-11-02T14:30:00Z")).minute).toBe(570);
    expect(activeSession(day,Date.parse("2026-11-02T09:00:00Z"))).toBe("premarket");
    expect(activeSession(day,Date.parse("2026-11-02T14:30:00Z"))).toBe("regular");
    expect(activeSession(day,Date.parse("2026-11-02T21:00:00Z"))).toBe("after_hours");
    expect(activeSession(day,Date.parse("2026-11-03T01:00:00Z"))).toBeNull();
  });
  it("requires verified open calendar coverage and handles early closes", () => {
    expect(activeSession({ ...day,open: false },NOW)).toBeNull();
    expect(activeSession({ ...day,verified: false },NOW)).toBeNull();
    expect(activeSession({ ...day,regularCloseEastern: "13:00",extendedCloseEastern: "17:00" },Date.parse("2026-11-02T18:00:00Z"))).toBe("after_hours");
  });
  it("splits 1,251 symbols into four requests without dropping the remainder", () => {
    const symbols = Array.from({ length: 1251 },(_,i) => `T${i}`);
    expect(snapshotBatches(symbols).map(rows => rows.length)).toEqual([400,400,400,51]);
    expect(snapshotBatches(symbols).flat()).toEqual(symbols);
  });
  it("uses explicit session fields and keeps the previous close as the after-hours daily baseline", () => {
    const row = batch([raw()],{ session: "after_hours" }).snapshots[0];
    expect(row.price).toBe(1.4); expect(row.baseline).toBe(0.9); expect(row.volume).toBe(1000); expect(row.dayHigh).toBe(1.5); expect(row.dayLow).toBe(0.7);
    const premarket = batch([raw()],{ session: "premarket" }).snapshots[0];
    expect(premarket.price).toBe(1.1); expect(premarket.baseline).toBe(1); expect(premarket.dayHigh).toBe(1.2); expect(premarket.dayLow).toBe(0.9);
    expect(batch([raw()]).snapshots[0].dayHigh).toBe(1.3); expect(batch([raw()]).snapshots[0].dayLow).toBe(0.8);
  });
  it("uses yesterday's regular close rather than the older daily comparison before the bell", () => {
    const premarket = batch([raw({ pre_price:1.78,last_price:1.89,prev_close_price:0.9 })],{ session:"premarket" }).snapshots[0];
    expect(premarket.baseline).toBe(1.89);
    expect(premarket.baseline).not.toBeNull();
    expect((premarket.price/premarket.baseline!-1)*100).toBeCloseTo(-5.82,1);
  });
  it("does not treat zero extended prices or bid/ask as usable values", () => {
    expect(batch([raw({ after_price: 0 })],{ session: "after_hours" }).missingSymbols).toEqual(["AAA"]);
    const row = batch([raw({ bid_price: 0,ask_price: 0 })]).snapshots[0];
    expect(row.bid).toBeNull(); expect(row.ask).toBeNull();
  });
  it("reports missing, unexpected and duplicate rows despite ret_code zero", () => {
    expect(batch([]).missingSymbols).toEqual(["AAA"]);
    expect(batch([raw(),raw()]).snapshots).toHaveLength(0);
    expect(batch([raw({ code: "US.BBB" })]).issues).toContain("unexpected_symbol");
  });
  it("rejects old dates and future/stale time, and holds unqualified semantics", () => {
    for (const patch of [{ data_date: "2026-10-30" },{ update_time: NOW+3000 },{ update_time: NOW-31_000 }]) expect(batch([raw(patch)]).snapshots).toHaveLength(0);
    expect(batch([raw()],{ qualification: { ...qualification,sessionTimestampVerified: false } }).snapshots).toHaveLength(0);
    expect(batch([raw()],{ qualification: { ...qualification,sessionCountersVerified: false } }).snapshots[0].volume).toBeNull();
    expect(batch([raw()],{ session: "after_hours",qualification: { ...qualification,afterHoursRegularCloseVerified: false } }).snapshots[0].baseline).toBe(0.9);
  });
});

describe("rolling evidence and focus", () => {
  it("calculates actual cumulative differences across bounded irregular provider timestamps", () => {
    const book = new RollingActivityBook();
    for (let index=0;index<=120;index++) {
      const at=NOW+index*5001+(index%3)*47;
      book.observe(snapshot(at,{ price:1+index/1000,volume:1_000_000+index*100,dollarVolume:2_000_000+index*200 }));
    }
    const activity=book.metrics("AAA",NOW+600120);
    // The observed anchors are 60,012ms and 300,060ms behind, not exact boundaries.
    expect(activity.oneMinuteVolume).toBe(1200);
    expect(activity.oneMinuteDollarVolume).toBe(2400);
    expect(activity.fiveMinuteVolume).toBe(6000);
    expect(activity.fiveMinuteVolumeSpike).toBe(1);
    expect(activity.oneMinuteGain).toBeCloseTo((1.12/1.108-1)*100);
  });
  it("compares rates rather than unequal window lengths for acceleration and five-minute spikes", () => {
    const book=new RollingActivityBook();
    for(let index=0;index<=130;index++) {
      const elapsed=index*5001+(index%3)*47;
      book.observe(snapshot(NOW+elapsed,{volume:1_000_000+elapsed,dollarVolume:2_000_000+elapsed*2}));
    }
    const activity=book.metrics("AAA",NOW+130*5001+47);
    expect(activity.oneMinuteVolume).not.toBeNull();
    expect(activity.fiveMinuteVolume).not.toBeNull();
    expect(activity.volumeAcceleration).toBeCloseTo(1,10);
    expect(activity.fiveMinuteVolumeSpike).toBeCloseTo(1,10);
  });
  it("warms up instead of turning provider volume_ratio into RVOL/acceleration", () => {
    const book = new RollingActivityBook(); book.observe(snapshot());
    expect(book.metrics("AAA",NOW).volumeAcceleration).toBeNull();
    expect(book.metrics("AAA",NOW).oneMinuteGain).toBeNull();
  });
  it("resets across a gap, session change or cumulative counter reset", () => {
    const book = new RollingActivityBook();
    for (let i=0;i<=60;i+=5) book.observe(snapshot(NOW+i*1000,{ price: 1+i/1000,volume: 1_000_000+i }));
    expect(book.metrics("AAA",NOW+60_000).oneMinuteGain).not.toBeNull();
    book.observe(snapshot(NOW+65_000,{ volume: 1 }));
    expect(book.metrics("AAA",NOW+65_000).oneMinuteGain).toBeNull();
    book.observe(snapshot(NOW+90_000));
    expect(book.metrics("AAA",NOW+90_000).oneMinuteGain).toBeNull();
    book.observe(snapshot(NOW+95_000,{ session: "after_hours" }));
    expect(book.metrics("AAA",NOW+95_000).oneMinuteGain).toBeNull();
  });
  it("does not count refetches as new observations and rejects same-time conflicting values", () => {
    const book = new RollingActivityBook(); expect(book.observe(snapshot())).toBe(true);
    expect(book.observe(snapshot(NOW,{ receivedAt: NOW+5000 }))).toBe(true);
    expect(book.observe(snapshot(NOW,{ price: 2 }))).toBe(false);
    expect(book.metrics("AAA",NOW).oneMinuteGain).toBeNull();
  });
  it("calculates rolling five-minute volume and its preceding-window spike from five-second counters", () => {
    const book = new RollingActivityBook();
    for (let seconds=0;seconds<=600;seconds+=5) {
      const volume = 1_000_000+(seconds<=300 ? seconds*100 : 30_000+(seconds-300)*500);
      book.observe(snapshot(NOW+seconds*1000,{ volume,dollarVolume: volume*2 }));
      if (seconds === 300) {
        expect(book.metrics("AAA",NOW+seconds*1000).fiveMinuteVolume).toBe(30_000);
        expect(book.metrics("AAA",NOW+seconds*1000).fiveMinuteVolumeSpike).toBeNull();
      }
    }
    const activity = book.metrics("AAA",NOW+600_000);
    expect(activity.fiveMinuteVolume).toBe(150_000);
    expect(activity.fiveMinuteVolumeSpike).toBe(5);
    expect(activity.oneMinuteVolume).toBe(30_000);
  });
  it("does not estimate rolling volume when an exact window boundary is missing", () => {
    const book = new RollingActivityBook();
    for (let seconds=0;seconds<=60;seconds+=5) {
      if (seconds !== 0) book.observe(snapshot(NOW+seconds*1000,{ volume: 1_000_000+seconds*100 }));
    }
    expect(book.metrics("AAA",NOW+60_000).oneMinuteVolume).toBeNull();
  });
  function feed(engine: LiveScannerEngine, universe: DailyUniverse, baseline = 0.95) {
    const config = { ...initialConfiguration(),enabled: true };
    let result: ReturnType<LiveScannerEngine["evaluate"]> | null = null;
    for (let seconds=0;seconds<=365;seconds+=5) {
      const now = NOW+seconds*1000;
      const volume = 1_000_000+Math.min(seconds,300)*100+Math.max(0,seconds-300)*500;
      result = engine.evaluate({ universe,tradingDate: universe.tradingDate,session: "regular",now,configuration: config,
        snapshots: [snapshot(now,{ baseline,price: 1+Math.max(0,seconds-300)/1000,volume,dollarVolume: volume*2 })],
        floats: new Map([["AAA",{ shares: 500_000,retrievedAtUtc: new Date(NOW).toISOString() }]]),news: new Map() });
    }
    return result!;
  }
  it("confirms meaningful activity, then removes a failed focus stock immediately while retaining its gainer row", () => {
    const engine = new LiveScannerEngine(), universe = importDailyUniverse(null,upload(),NOW).universe;
    const result = feed(engine,universe);
    expect(result.gainers.focus.map(row => row.symbol)).toEqual(["AAA"]);
    expect(result.momentum.focus[0].reasons).toHaveLength(3);
    expect(result.gainers.rows[0].relativeVolume).toBe(4);
    expect(result.gainers.rows[0].offHighPercent).toBeCloseTo((1.065/1.2-1)*100);
    const declined = engine.evaluate({ universe,tradingDate: universe.tradingDate,session: "regular",now: NOW+370_000,
      configuration: { ...initialConfiguration(),enabled: true }, snapshots: [snapshot(NOW+370_000,{ price: 0.99,volume: 1_065_000,dollarVolume: 2_130_000 })],
      floats: new Map([["AAA",{ shares: 500_000,retrievedAtUtc: new Date(NOW).toISOString() }]]),news: new Map() });
    expect(declined.gainers.total).toBe(1); expect(declined.gainers.focus).toHaveLength(0);
  });
  it("finds recent momentum even while daily performance is red", () => {
    const universe = importDailyUniverse(null,upload(),NOW).universe;
    const result = feed(new LiveScannerEngine(),universe,2);
    expect(result.gainers.total).toBe(0);
    expect(result.momentum.rows[0].sessionGain).toBeLessThan(0);
    expect(result.momentum.focus).toHaveLength(1);
  });
  it("adds a sub-minute high-volume reaction before one-minute history is available",()=>{
    const universe=importDailyUniverse(null,upload(),NOW).universe,engine=new LiveScannerEngine();
    const configuration={...initialConfiguration(),enabled:true};
    const floats=new Map([["AAA",{shares:500_000,retrievedAtUtc:new Date(NOW).toISOString()}]]);
    engine.evaluate({universe,tradingDate:universe.tradingDate,session:"regular",now:NOW,configuration,floats,news:new Map(),
      snapshots:[snapshot(NOW,{price:1,volume:1_000_000,dollarVolume:2_000_000})]});
    const result=engine.evaluate({universe,tradingDate:universe.tradingDate,session:"regular",now:NOW+12_000,configuration,floats,news:new Map(),
      snapshots:[snapshot(NOW+12_000,{price:1.03,volume:1_030_000,dollarVolume:2_030_000})]});
    expect(result.momentum.rows).toHaveLength(1);
    expect(result.momentum.rows[0].activity.oneMinuteGain).toBeNull();
    expect(result.momentum.rows[0].momentumSignals).toEqual(expect.arrayContaining(["volume_ignition","price_burst"]));
  });
  it("lets adaptive early-event liquidity qualify before cumulative session floors",()=>{
    const universe=importDailyUniverse(null,upload(),NOW).universe,engine=new LiveScannerEngine();
    const configuration={...initialConfiguration(),enabled:true,momentumLiquidityBypass:{premarket:false,regular:true,after_hours:false}};
    const floats=new Map([["AAA",{shares:500_000,retrievedAtUtc:new Date(NOW).toISOString()}]]);
    engine.evaluate({universe,tradingDate:universe.tradingDate,session:"regular",now:NOW,configuration,floats,news:new Map(),
      snapshots:[snapshot(NOW,{price:1,volume:70_000,dollarVolume:70_000})]});
    const result=engine.evaluate({universe,tradingDate:universe.tradingDate,session:"regular",now:NOW+10_000,configuration,floats,news:new Map(),
      snapshots:[snapshot(NOW+10_000,{price:1.002,volume:100_000,dollarVolume:100_000})]});
    expect(result.momentum.rows).toHaveLength(1);
    expect(result.momentum.rows[0].momentumSignals).toContain("volume_ignition");
    expect(result.audit[0].momentumFailures).not.toContain("volume_below_minimum");
    expect(result.audit[0].momentumFailures).not.toContain("dollar_volume_below_minimum");
  });
  it("enforces cumulative liquidity floors for early signals by default",()=>{
    const universe=importDailyUniverse(null,upload(),NOW).universe,engine=new LiveScannerEngine();
    const configuration={...initialConfiguration(),enabled:true};
    const floats=new Map([["AAA",{shares:500_000,retrievedAtUtc:new Date(NOW).toISOString()}]]);
    engine.evaluate({universe,tradingDate:universe.tradingDate,session:"regular",now:NOW,configuration,floats,news:new Map(),
      snapshots:[snapshot(NOW,{price:1,volume:70_000,dollarVolume:70_000})]});
    const result=engine.evaluate({universe,tradingDate:universe.tradingDate,session:"regular",now:NOW+10_000,configuration,floats,news:new Map(),
      snapshots:[snapshot(NOW+10_000,{price:1.002,volume:100_000,dollarVolume:100_000})]});
    expect(result.audit[0].momentumSignals).toContain("volume_ignition");
    expect(result.momentum.rows).toHaveLength(0);
    expect(result.audit[0].momentumFailures).toEqual(expect.arrayContaining(["volume_below_minimum","dollar_volume_below_minimum"]));
  });
  it("does not let a price burst alone bypass cumulative liquidity floors",()=>{
    const universe=importDailyUniverse(null,upload(),NOW).universe,engine=new LiveScannerEngine();
    const configuration={...initialConfiguration(),enabled:true};
    const floats=new Map([["AAA",{shares:50_000_000,retrievedAtUtc:new Date(NOW).toISOString()}]]);
    engine.evaluate({universe,tradingDate:universe.tradingDate,session:"regular",now:NOW,configuration,floats,news:new Map(),
      snapshots:[snapshot(NOW,{price:1,volume:50_000,dollarVolume:50_000})]});
    const result=engine.evaluate({universe,tradingDate:universe.tradingDate,session:"regular",now:NOW+10_000,configuration,floats,news:new Map(),
      snapshots:[snapshot(NOW+10_000,{price:1.02,volume:57_000,dollarVolume:57_000})]});
    expect(result.audit[0].momentumSignals).toEqual(["price_burst"]);
    expect(result.momentum.rows).toHaveLength(0);
    expect(result.audit[0].momentumFailures).toEqual(expect.arrayContaining(["volume_below_minimum","dollar_volume_below_minimum"]));
  });
  it("ranks sustained liquid momentum above a larger price jump with weaker activity", () => {
    const universe = importDailyUniverse(null,upload(),NOW).universe, engine = new LiveScannerEngine();
    const configuration = { ...initialConfiguration(),enabled: true };
    const floats = new Map([
      ["AAA",{ shares: 500_000,retrievedAtUtc: new Date(NOW).toISOString() }],
      ["BBB",{ shares: 600_000,retrievedAtUtc: new Date(NOW).toISOString() }],
    ]);
    let result: ReturnType<LiveScannerEngine["evaluate"]> | null = null;
    for (let seconds=0;seconds<=365;seconds+=5) {
      const now = NOW+seconds*1000, recent = Math.max(0,seconds-300);
      result = engine.evaluate({ universe,tradingDate:universe.tradingDate,session:"regular",now,configuration,floats,news:new Map(),snapshots:[
        snapshot(now,{ symbol:"AAA",company:"Fast price",price:1+recent*0.002,volume:1_000_000+Math.min(seconds,300)*100+recent*250,
          dollarVolume:2_000_000+Math.min(seconds,300)*200+recent*500,providerVolumeRatio:1.2 }),
        snapshot(now,{ symbol:"BBB",company:"Broad activity",price:1+recent*0.0009,volume:1_000_000+Math.min(seconds,300)*100+recent*800,
          dollarVolume:5_000_000+Math.min(seconds,300)*500+recent*4_000,providerVolumeRatio:6 }),
      ] });
    }
    expect(result!.momentum.rows[0].symbol).toBe("BBB");
    expect(result!.momentum.rows[0].activity.oneMinuteGain).toBeLessThan(result!.momentum.rows[1].activity.oneMinuteGain!);
    expect(result!.momentum.focus[0].symbol).toBe("BBB");
  });
  it("keeps stocks with unavailable float, rejects stale snapshots and retains a cap-crossing daily member", () => {
    const universe = importDailyUniverse(null,upload(),NOW).universe, engine = new LiveScannerEngine();
    const base = { universe,tradingDate: universe.tradingDate,session: "regular" as const,now: NOW,
      configuration: { ...initialConfiguration(),enabled: true },snapshots: [snapshot(NOW,{ marketCap: 150_000_000 })],news: new Map() };
    const withoutFloat=engine.evaluate({ ...base,floats: new Map() });
    expect(withoutFloat.gainers.total).toBe(1);
    expect(withoutFloat.gainers.rows[0].float).toBeNull();
    expect(withoutFloat.missingFloatCount).toBe(1);
    const floats = new Map([["AAA",{ shares: 500_000,retrievedAtUtc: new Date(NOW).toISOString() }]]);
    expect(engine.evaluate({ ...base,floats }).gainers.rows[0].marketCap).toBe(150_000_000);
    const stale=engine.evaluate({ ...base,floats,now: NOW+31_000 });
    expect(stale.gainers.total).toBe(1);
    expect(stale.gainers.rows[0].providerAtUtc).toBe(new Date(NOW).toISOString());
    expect(stale.momentum.rows).toEqual([]);
    expect(stale.audit[0]).toMatchObject({gainerDisplayed:true,gainerRetained:true,gainerDataIssues:["snapshot_not_eligible"],momentumDisplayed:false});
  });
});

describe("shared rolling budget and configuration", () => {
  function ready() { return restoreBudget(null,NOW-60_001); }
  it("accounts a 1,251-stock five-second scan as 48 reserved starts/minute", () => {
    expect(reserveScannerDemand(ready(),1251,NOW).scannerReservedStarts).toBe(48);
    expect(() => reserveScannerDemand(ready(),3000,NOW)).toThrow("capacity");
  });
  it("preserves shared usage across restore and caps an actual rolling minute", () => {
    let state = ready();
    for (let i=0;i<90;i++) { const result = admitMoomooRequest(state,{ now: NOW+i*650,priority: i%2 ? "scanner" : "other",scannerQueued: false }); expect(result.allowed).toBe(true); state=result.state; }
    state = restoreBudget(state,NOW+59_000);
    expect(admitMoomooRequest(state,{ now: NOW+59_000,priority: "scanner",scannerQueued: false }).reason).toBe("minute_limit");
    expect(admitMoomooRequest(state,{ now: NOW+60_000,priority: "scanner",scannerQueued: false }).allowed).toBe(true);
  });
  it("reserves scanner capacity, but gives unused capacity back after demand expires", () => {
    let state = ready();
    for (let i=0;i<42;i++) { state=reserveScannerDemand(state,1251,NOW+i*650);
      const result=admitMoomooRequest(state,{ now: NOW+i*650,priority: "watchlist",scannerQueued: false }); expect(result.allowed).toBe(true); state=result.state; }
    expect(admitMoomooRequest(state,{ now: NOW+28_000,priority: "watchlist",scannerQueued: false }).reason).toBe("scanner_reservation");
    expect(admitMoomooRequest(state,{ now: NOW+28_000,priority: "scanner",scannerQueued: false }).allowed).toBe(true);
    expect(admitMoomooRequest(state,{ now: NOW+43_000,priority: "watchlist",scannerQueued: false }).allowed).toBe(true);
  });
  it("holds unknown restart history, clock reversal, queued scanner demand and shared 429 cooldown", () => {
    expect(admitMoomooRequest(restoreBudget(null,NOW),{ now: NOW,priority: "scanner",scannerQueued: false }).reason).toBe("restart_history");
    expect(admitMoomooRequest(ready(),{ now: NOW-90_000,priority: "scanner",scannerQueued: false }).reason).toBe("clock_change");
    expect(admitMoomooRequest(ready(),{ now: NOW,priority: "watchlist",scannerQueued: true }).reason).toBe("scanner_queued");
    const limited=recordMoomoo429(ready(),NOW,300_000);
    expect(admitMoomooRequest(limited,{ now: NOW+250_000,priority: "scanner",scannerQueued: false }).reason).toBe("provider_cooldown");
  });
  it("starts disabled with required float and owner-selected list sizes; rejects invalid edits and conflicts", () => {
    const config=initialConfiguration(); expect(validateConfiguration(config)).toEqual(config); expect(config.enabled).toBe(false);
    expect([config.gainers.displayLimit,config.momentum.displayLimit,config.gainers.focus.maximumStocks]).toEqual([20,20,3]);
    expect(validateConfiguration({ ...config,momentum: { ...config.momentum,displayLimit: 1251 } }).momentum.displayLimit).toBe(1251);
    expect(validateConfiguration({ ...config,gainers: { ...config.gainers,focus: { ...config.gainers.focus,maximumStocks: 20 } } }).gainers.focus.maximumStocks).toBe(20);
    expect(config.gainers.filters.regular.maximumFloat).toBeNull();
    expect(updateConfiguration(config,config,NOW).revision).toBe(1);
    expect(() => updateConfiguration(config,{ ...config,revision: 1 },NOW)).toThrow("conflict");
    expect(() => validateConfiguration({ ...config,momentum: { ...config.momentum,displayLimit: 0 } })).toThrow();
    expect(() => validateConfiguration({ ...config,gainers: { ...config.gainers,filters: { ...config.gainers.filters,
      regular: { ...config.gainers.filters.regular,maximumMarketCap: 500_000_001 } } } })).toThrow();
  });
});
