// @vitest-environment node
import {expect,it} from 'vitest';
import {LiveScannerEngine} from './engine';
import {initialConfiguration} from './settings';
import type {DailyUniverse,NormalizedSnapshot} from './contracts';
const start=Date.parse('2026-11-06T15:00:00Z');
const universe:DailyUniverse={version:1,tradingDate:'2026-11-06',acceptedAtUtc:new Date(start).toISOString(),lastCollectionAtUtc:new Date(start).toISOString(),latestUploadCount:2,sourceHashes:['fixture'],stocks:['AAA','BBB'].map(symbol=>({symbol,exchange:'NASDAQ',marketCapAtCollection:10000000}))};
const config={...initialConfiguration(),enabled:true};
const floats=new Map(['AAA','BBB'].map(symbol=>[symbol,{shares:1000000,retrievedAtUtc:new Date(start).toISOString()}]));
function input(second:number){const now=start+second*1000;return {universe,tradingDate:universe.tradingDate,session:'regular' as const,floats,news:new Map(),configuration:config,now,snapshots:['AAA','BBB'].map((symbol,index):NormalizedSnapshot=>({symbol,company:symbol,provider:'alpaca',session:'regular',tradingDate:universe.tradingDate,priceTimeBasis:'session_observation',providerAt:now,receivedAt:now,price:2+index*.2+second*.00001,baseline:1,volume:1000000+second*100,dollarVolume:2000000+second*200,bid:2,ask:2.01,marketCap:null,dayHigh:3,dayLow:1,providerVolumeRatio:null}))};}
it('preserves gainer ordering, qualification and aligned rolling metrics in a ten-minute replay',()=>{
 const old=new LiveScannerEngine(),fast=new LiveScannerEngine(true);let comparisons=0;
 for(let second=0;second<=600;second++){
  const next=fast.evaluate(input(second));if(second%5)continue;const previous=old.evaluate(input(second));comparisons++;
  expect(next.gainers.rows.map(row=>row.symbol)).toEqual(previous.gainers.rows.map(row=>row.symbol));
  expect(next.gainers.rows.map(row=>row.volume)).toEqual(previous.gainers.rows.map(row=>row.volume));
  expect(next.momentum.rows.map(row=>row.symbol)).toEqual(previous.momentum.rows.map(row=>row.symbol));
  if(second>=600)expect(next.gainers.rows[0].activity.volumeAcceleration).toBeCloseTo(previous.gainers.rows[0].activity.volumeAcceleration!);
 }
 expect(comparisons).toBe(121);
});
it('drops event coverage on a gap and does not reuse the old rolling window after reconnection',()=>{
 const engine=new LiveScannerEngine(true);for(let second=0;second<=65;second++)engine.evaluate(input(second));
 const before=engine.evaluate(input(65));
 const gap=engine.evaluate({...input(66),snapshots:[]});
 expect(gap.gainers.rows).toEqual(before.gainers.rows);
 expect(gap.momentum.rows).toEqual([]);
 expect(gap.gainers.focus).toEqual([]);
 expect(gap.audit.every(decision=>decision.gainerDataIssues?.includes("snapshot_unavailable")&&decision.momentumRank===null)).toBe(true);
 const recovered=engine.evaluate(input(67));expect(recovered.gainers.rows[0].activity.oneMinuteVolume).toBeNull();
});
it("keeps a stale incumbent behind fresh gainers and rejects new stale trades", () => {
  const engine = new LiveScannerEngine(true);
  expect(engine.evaluate(input(0)).gainers.rows.map(row => row.symbol)).toEqual(["BBB","AAA"]);
  const update = input(31);
  update.snapshots[1] = { ...update.snapshots[1], providerAt: start };
  const ranked = engine.evaluate(update);
  expect(ranked.gainers.rows.map(row => row.symbol)).toEqual(["AAA","BBB"]);
  expect(ranked.gainers.rows[1].receivedAtUtc).toBe(new Date(start).toISOString());
  expect(ranked.audit.find(row => row.symbol === "BBB")).toMatchObject({
    gainerRetained: true, gainerDataIssues: ["snapshot_stale"], momentumFailures: ["snapshot_stale"], momentumRank: null,
  });
  expect(new LiveScannerEngine(true).evaluate(update).gainers.rows.map(row => row.symbol)).toEqual(["AAA"]);
  expect(engine.evaluate(input(32)).gainers.rows.map(row => row.symbol)).toEqual(["BBB","AAA"]);
});
it("audits the exit of a Momentum-only ticker when its observation disappears", () => {
  const engine = new LiveScannerEngine(true);
  const configuration = { ...config, gainers: { ...config.gainers, filters: {
    ...config.gainers.filters, regular: { ...config.gainers.filters.regular, minimumSessionGain: 300 },
  } } };
  for (let second = 0; second < 60; second++) engine.evaluate({ ...input(second), configuration });
  const update = input(60);
  update.snapshots[0] = { ...update.snapshots[0], price: 2.2, volume: 1_300_000, dollarVolume: 2_600_000 };
  const active = engine.evaluate({ ...update, configuration });
  expect(active.gainers.rows).toEqual([]);
  expect(active.momentum.rows.map(row => row.symbol)).toContain("AAA");
  const missing = engine.evaluate({ ...input(61), configuration, snapshots: [] });
  expect(missing.momentum.rows).toEqual([]);
  expect(missing.audit.find(row => row.symbol === "AAA")).toMatchObject({
    observation: { providerAt: update.now, receivedAt: update.now },
    momentumFailures: ["snapshot_unavailable"], momentumRank: null, momentumDisplayed: false,
  });
});
it("keeps the first Momentum detection and cools a repeated receipt of the same trade", () => {
  const flatPrice = new LiveScannerEngine(true);
  const singleJump = new LiveScannerEngine(true);
  const audit = (engine: LiveScannerEngine, second: number, price: number, volume: number, tradeAt?: number) => {
    const update = input(second);
    return engine.evaluate({
      ...update,
      floats: new Map([["AAA",{shares:5_000_000,retrievedAtUtc:new Date(start).toISOString()}]]),
      snapshots: [{ ...update.snapshots[0], price, volume, dollarVolume: volume * 2, providerAt: tradeAt ?? update.now }],
    }).audit[0];
  };
  for (let second = 0; second < 65; second++) {
    audit(flatPrice,second,2,1_000_000+second*100);
    audit(singleJump,second,2,1_000_000+second*100);
  }
  const flat = audit(flatPrice,65,2,1_300_000);
  const jump = audit(singleJump,65,2.06,1_006_500);
  expect(flat.momentumSignals).toContain("volume_ignition");
  expect(flat.momentumDisplayed).toBe(true);
  expect(jump.momentumSignals).toEqual(["one_minute_momentum"]);
  expect(jump.momentumDisplayed).toBe(true);
  const repeated = audit(singleJump,70,2.06,1_006_500,start+65_000);
  expect(repeated.momentumState).toBe("cooling");
  expect(repeated.momentumLastActiveAtUtc).toBe(new Date(start+65_000).toISOString());
});
