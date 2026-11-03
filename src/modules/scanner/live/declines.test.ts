import { describe, expect, it } from "vitest";
import { DeclineBook, DEFAULT_DECLINE_CONTROLS } from "./declines";
import { initialConfiguration, validateConfiguration } from "./settings";
import type { DailyUniverse, NormalizedSnapshot, ScannerSession } from "./contracts";

const NOW=Date.parse("2026-11-02T21:00:00Z");
const universe:DailyUniverse={version:1,tradingDate:"2026-11-02",acceptedAtUtc:new Date(NOW).toISOString(),lastCollectionAtUtc:new Date(NOW).toISOString(),latestUploadCount:2,sourceHashes:[],stocks:[{symbol:"AAA",exchange:"NASDAQ",marketCapAtCollection:1e6},{symbol:"BBB",exchange:"NASDAQ",marketCapAtCollection:1e6}]};
function quote(price:number,seconds:number,extra:Partial<NormalizedSnapshot>={}):NormalizedSnapshot{return {
  symbol:"AAA",company:"Synthetic AAA",session:"after_hours",tradingDate:universe.tradingDate,
  providerAt:NOW,receivedAt:NOW+seconds*1000,price,baseline:3,regularClosePrice:2,priceTimeBasis:"session_observation",
  volume:100+seconds*10,dollarVolume:200+seconds*20,bid:price*.8,ask:price*1.2,marketCap:1e6,
  dayHigh:4,dayLow:.1,providerVolumeRatio:null,...extra};}
function run(book:DeclineBook,seconds:number,snapshots:NormalizedSnapshot[],session:ScannerSession="after_hours",controls=DEFAULT_DECLINE_CONTROLS){
  return book.evaluate({universe,session,now:NOW+seconds*1000,snapshots,floats:new Map(),controls});
}
describe("Rapid Drops and Top Losers from existing observations",()=>{
  it("detects a genuine 30% fall with fixed origin, actual duration and observed volume",()=>{
    const book=new DeclineBook();expect(run(book,0,[quote(2,0)]).rapid).toHaveLength(0);
    const result=run(book,130,[quote(1.2,130)]);expect(result.rapid).toHaveLength(1);
    const row=result.rapid[0];expect(row.float).toBeNull();expect(row.spreadPercent).toBeCloseTo(40);
    expect(row.drop).toMatchObject({startPrice:2,detectionPrice:1.2,lowPrice:1.2,durationSeconds:130,sharesDuringDrop:1300});
    expect(row.drop!.dropPercent).toBeCloseTo(-40);expect(row.drop!.backToStartPercent).toBeCloseTo(66.6666667);
  });
  it("keeps one episode through small bounces and updates the low without resetting the origin",()=>{
    const book=new DeclineBook();run(book,0,[quote(2,0)]);run(book,60,[quote(1.4,60)]);
    const bounce=run(book,68,[quote(1.5,68)]).rapid[0];expect(bounce.drop!.startPrice).toBe(2);
    expect(bounce.drop!.detectionPrice).toBe(1.4);expect(bounce.drop!.dropPercent).toBeCloseTo(-25);
    expect(bounce.drop!.reboundPercent).toBeCloseTo(7.142857);
    const lower=run(book,95,[quote(1.2,95)]).rapid;expect(lower).toHaveLength(1);
    expect(lower[0].drop!.lowPrice).toBe(1.2);expect(lower[0].drop!.startPrice).toBe(2);
    expect(lower[0].drop!.sharesDuringDrop).toBe(950);
  });
  it("does not require activity before the fall, float, volume or a tight spread",()=>{
    const book=new DeclineBook();run(book,0,[quote(2,0,{volume:null,dollarVolume:null})]);
    const result=run(book,40,[quote(1,40,{volume:null,dollarVolume:null,bid:null,ask:null})]);
    expect(result.rapid).toHaveLength(1);expect(result.rapid[0].drop!.sharesDuringDrop).toBeNull();
  });
  it("detects a rapid fall even while the stock remains a large session gainer",()=>{
    const book=new DeclineBook();run(book,0,[quote(2,0,{regularClosePrice:.5})]);
    const result=run(book,60,[quote(1.2,60,{regularClosePrice:.5})]);
    expect(result.rapid).toHaveLength(1);expect(result.rapid[0].changePercent).toBeCloseTo(140);
    expect(result.losers).toHaveLength(0);
  });
  it("does not turn a large all-day loss, lower bid or slow slide into a rapid drop",()=>{
    const book=new DeclineBook();expect(run(book,0,[quote(1,0)]).rapid).toHaveLength(0);
    expect(run(book,10,[quote(1,10,{bid:.1})]).rapid).toHaveLength(0);
    expect(run(book,320,[quote(.6,320)]).rapid).toHaveLength(0);
  });
  it("does not backfill a fall from before startup or missing quotes",()=>{
    const book=new DeclineBook();const first=run(book,100,[quote(.5,100)]);
    expect(first.losers).toHaveLength(1);expect(first.rapid).toHaveLength(0);
    expect(run(book,200,[]).rapid).toHaveLength(0);
  });
  it("ignores stale, future, out-of-order and inconsistent same-clock prices",()=>{
    const book=new DeclineBook();run(book,0,[quote(2,0)]);
    expect(run(book,60,[quote(.5,1)]).rapid).toHaveLength(0);
    expect(run(book,70,[quote(.5,80)]).rapid).toHaveLength(0);
    run(book,80,[quote(2,80,{priceTimeBasis:"provider",providerAt:NOW+80000})]);
    expect(run(book,90,[quote(.5,90,{priceTimeBasis:"provider",providerAt:NOW+80000})]).rapid).toHaveLength(0);
    expect(run(book,100,[quote(.5,100,{priceTimeBasis:"provider",providerAt:NOW+70000})]).rapid).toHaveLength(0);
  });
  it("keeps a missing quote's actual receipt time, never claiming it just updated",()=>{
    const book=new DeclineBook();run(book,0,[quote(2,0)]);run(book,60,[quote(1.2,60)]);
    const row=run(book,200,[]).rapid[0];expect(row.price).toBe(1.2);expect(row.receivedAtUtc).toBe(new Date(NOW+60000).toISOString());
    expect(run(book,960,[]).rapid).toHaveLength(0);
  });
  it("expires once and does not instantly recreate the same old selloff",()=>{
    const book=new DeclineBook();const controls={...DEFAULT_DECLINE_CONTROLS,retentionMinutes:1};
    run(book,0,[quote(2,0)],"after_hours",controls);run(book,30,[quote(1,30)],"after_hours",controls);
    expect(run(book,91,[quote(1.1,91)],"after_hours",controls).rapid).toHaveLength(0);
    expect(run(book,100,[quote(1,100)],"after_hours",controls).rapid).toHaveLength(0);
    run(book,110,[quote(1.8,110)],"after_hours",controls);
    expect(run(book,130,[quote(1.1,130)],"after_hours",controls).rapid).toHaveLength(1);
  });
  it("clears at session changes and volume counter resets instead of inventing a fall",()=>{
    const book=new DeclineBook();run(book,0,[quote(2,0)]);
    expect(run(book,60,[quote(1,60,{volume:1})]).rapid).toHaveLength(0);
    expect(run(book,70,[quote(.5,70,{session:"regular"})],"regular").rapid).toHaveLength(0);
    const nextDay=NOW+86400000;
    const later=book.evaluate({universe:{...universe,tradingDate:"2026-11-03"},session:"regular",now:nextDay,
      snapshots:[quote(.1,0,{tradingDate:"2026-11-03",session:"regular",providerAt:nextDay,receivedAt:nextDay})],floats:new Map()});
    expect(later.rapid).toHaveLength(0);
  });
  it("can detect a fresh fall after a counter reset without using the pre-reset peak",()=>{
    const book=new DeclineBook();run(book,0,[quote(4,0)]);
    expect(run(book,60,[quote(2,60,{volume:1,dollarVolume:2})]).rapid).toHaveLength(0);
    const result=run(book,70,[quote(1,70,{volume:101,dollarVolume:202})]);
    expect(result.rapid[0].drop!.startPrice).toBe(2);expect(result.rapid[0].drop!.sharesDuringDrop).toBe(100);
  });
  it("orders Top Losers by the correct session comparison and preserves missing basis",()=>{
    const book=new DeclineBook();const rows=[quote(1,0),quote(.5,0,{symbol:"BBB",regularClosePrice:1})];
    const result=run(book,0,rows);expect(result.losers.map(row=>row.symbol)).toEqual(["AAA","BBB"]);
    expect(result.losers[0].changePercent).toBe(-50);
    expect(run(book,40,[quote(1,40,{regularClosePrice:null})]).losers).toHaveLength(0);
    const regular=run(new DeclineBook(),0,[quote(1,0,{session:"regular"})],"regular");
    expect(regular.losers[0].changePercent).toBeCloseTo(-66.6666667);
  });
  it("uses adjustable drop thresholds and display limits without changing other settings",()=>{
    const controls={...DEFAULT_DECLINE_CONTROLS,minimumDropPercent:20,displayLimit:1};const book=new DeclineBook();
    run(book,0,[quote(2,0),quote(2,0,{symbol:"BBB"})],"after_hours",controls);
    const result=run(book,20,[quote(1.5,20),quote(1.4,20,{symbol:"BBB"})],"after_hours",controls);
    expect(result.rapidTotal).toBe(2);expect(result.rapid.map(row=>row.symbol)).toEqual(["BBB"]);
    expect(run(book,30,[],"after_hours",{...controls,enabled:false}).rapid).toHaveLength(0);
  });
  it("holds still-fresh loser rows across a missing batch and expires them without changing their timestamp",()=>{
    const book=new DeclineBook();run(book,0,[quote(1,0)]);
    const held=run(book,10,[]).losers;expect(held).toHaveLength(1);expect(held[0].receivedAtUtc).toBe(new Date(NOW).toISOString());
    expect(run(book,31,[]).losers).toHaveLength(0);
  });
  it("accepts legacy configurations and strictly validates only the optional new controls",()=>{
    const original=initialConfiguration();expect(validateConfiguration(original)).toEqual(original);
    expect(validateConfiguration({...original,declines:DEFAULT_DECLINE_CONTROLS}).declines).toEqual(DEFAULT_DECLINE_CONTROLS);
    for(const change of [{windowMinutes:0},{minimumDropPercent:100},{displayLimit:0},{retentionMinutes:Infinity},{extra:1}])
      expect(()=>validateConfiguration({...original,declines:{...DEFAULT_DECLINE_CONTROLS,...change}})).toThrow();
  });
});
