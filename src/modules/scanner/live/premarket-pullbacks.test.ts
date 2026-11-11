import { describe, expect, it } from "vitest";
import { PremarketPullbackBook, DEFAULT_PREMARKET_PULLBACK_CONTROLS as controls } from "./premarket-pullbacks";
import { normalizeAlpacaScannerBatch } from "../alpaca/scanner-snapshots";
import type { AlpacaSessionState } from "../alpaca/session-book";
import { initialConfiguration, validateConfiguration } from "./settings";
import type { DailyUniverse, NormalizedSnapshot, RollingActivity, ScannerSession } from "./contracts";

const now=Date.parse("2026-11-02T15:00:00Z");
const universe:DailyUniverse={version:1,tradingDate:"2026-11-02",acceptedAtUtc:new Date(now).toISOString(),lastCollectionAtUtc:new Date(now).toISOString(),latestUploadCount:1,sourceHashes:[],stocks:[{symbol:"AAA",exchange:"NASDAQ",marketCapAtCollection:1e6}]};
const activity:RollingActivity={oneMinuteGain:null,fiveMinuteGain:null,oneMinuteVolume:100,fiveMinuteVolume:400,oneMinuteDollarVolume:null,fiveMinuteVolumeSpike:null,volumeAcceleration:null};
function quote(price=7,seconds=0,extra:Partial<NormalizedSnapshot>={}):NormalizedSnapshot{return {symbol:"AAA",company:"Test",session:"regular",tradingDate:universe.tradingDate,providerAt:now+seconds*1000,receivedAt:now+seconds*1000,price,baseline:5,regularClosePrice:null,priceTimeBasis:"provider",volume:1000,dollarVolume:null,bid:null,ask:null,marketCap:1e6,dayHigh:30,dayLow:1,providerVolumeRatio:null,premarketHigh:10,premarketVolume:200,...extra};}
function run(book:PremarketPullbackBook,seconds=0,snapshots=[quote()],session:ScannerSession="regular",options=controls){return book.evaluate({universe,session,now:now+seconds*1000,snapshots,floats:new Map(),activity:()=>activity,controls:options});}
describe("Premarket High Pullbacks",()=>{
  it("distinguishes percent below from gain required back to the high",()=>{const row=run(new PremarketPullbackBook()).rows[0];expect(row.changePercent).toBeCloseTo(40);expect(row.belowHighPercent).toBeCloseTo(30);expect(row.backToHighPercent).toBeCloseTo(42.8571429);expect(row.oneMinuteVolume).toBe(100);});
  it("uses today's regular close for after-hours change",()=>{const row=run(new PremarketPullbackBook(),0,[quote(7,0,{session:"after_hours",regularClosePrice:8})],"after_hours").rows[0];expect(row.changePercent).toBeCloseTo(-12.5);});
  it("uses retained provider PM high after startup, never day high",()=>{const row=run(new PremarketPullbackBook(),0,[quote(2.48,0,{premarketHigh:3.1,premarketVolume:13270,dayHigh:3.35})]).rows[0];expect(row.premarketHigh).toBe(3.1);expect(row.premarketVolume).toBe(13270);expect(row.backToHighPercent).toBeCloseTo(25);});
  it("uses an observed regular high when the PM reference is unavailable",()=>{for(const premarketHigh of [null,0,undefined]){const result=run(new PremarketPullbackBook(),0,[quote(7,0,{premarketHigh})]);expect(result.missingReferenceCount).toBe(0);expect(result.rows).toHaveLength(0);}});
  it("freezes the final PM high and survives later field omission",()=>{const book=new PremarketPullbackBook();run(book);expect(run(book,10,[quote(7,10,{premarketHigh:30})]).rows[0].premarketHigh).toBe(10);expect(run(book,20,[quote(7,20,{premarketHigh:null})]).rows[0].premarketHigh).toBe(10);});
  it("tracks pre-open highs then requires a final aggregate after the open",()=>{const book=new PremarketPullbackBook();run(book,0,[quote(7,0,{session:"premarket"})],"premarket");expect(run(book,10,[quote(7,10,{premarketHigh:null})]).rows).toHaveLength(0);expect(run(book,20,[quote(7,20,{premarketHigh:11})]).rows[0].premarketHigh).toBe(11);});
  it("uses a stable entry/exit band without inferred recovery states",()=>{const book=new PremarketPullbackBook();expect(run(book,0,[quote(8.1)]).rows).toHaveLength(0);expect(run(book,10,[quote(8,10)]).rows).toHaveLength(1);expect(run(book,20,[quote(8.1,20)]).rows).toHaveLength(1);expect(run(book,30,[quote(8.3,30)]).rows).toHaveLength(0);});
  it("does not exclude low-volume stocks or require float/spread",()=>{const row=run(new PremarketPullbackBook(),0,[quote(7,0,{volume:0,premarketVolume:0})]).rows[0];expect(row.sessionVolume).toBe(0);expect(row.premarketVolume).toBe(0);expect(row.float).toBeNull();expect(row.spreadPercent).toBeNull();});
  it("holds a missing batch briefly without inventing a fresh timestamp",()=>{const book=new PremarketPullbackBook();run(book);expect(run(book,10,[]).rows[0].receivedAtUtc).toBe(new Date(now).toISOString());expect(run(book,31,[]).rows).toHaveLength(0);});
  it("rejects stale, future and out-of-order observations",()=>{for(const delta of [-31,1])expect(run(new PremarketPullbackBook(),0,[quote(7,delta)]).rows).toHaveLength(0);const book=new PremarketPullbackBook();run(book,10,[quote(7,10)]);expect(run(book,20,[quote(1,5)]).rows[0].price).toBe(7);});
  it("clears cross-date references and honors disable",()=>{const book=new PremarketPullbackBook();run(book);expect(run(book,10,[],"regular",{...controls,enabled:false}).rows).toHaveLength(0);book.clear();expect(run(book,20,[quote(7,20,{premarketHigh:null})]).rows).toHaveLength(0);});
  it("does not reuse yesterday's reference or a prior session's price",()=>{const book=new PremarketPullbackBook();run(book);expect(run(book,10,[],"after_hours").rows).toHaveLength(0);const later=now+86400000;const result=book.evaluate({universe:{...universe,tradingDate:"2026-11-03"},session:"regular",now:later,snapshots:[quote(7,86400,{tradingDate:"2026-11-03",premarketHigh:null})],floats:new Map(),activity:()=>activity});expect(result.rows).toHaveLength(0);expect(result.missingReferenceCount).toBe(0);});
  it("tracks separate regular and post-market highs and uses the greatest available high",()=>{const book=new PremarketPullbackBook();run(book,0,[quote(12)]);const regular=run(book,10,[quote(8,10)]).rows[0];expect(regular.regularHigh).toBe(12);expect(regular.referenceSession).toBe("regular");run(book,20,[quote(15,20,{session:"after_hours",regularClosePrice:9})],"after_hours");const post=run(book,30,[quote(10,30,{session:"after_hours",regularClosePrice:9})],"after_hours").rows[0];expect(post.postMarketHigh).toBe(15);expect(post.referenceSession).toBe("after_hours");});
  it("replays NCT from Alpaca's regular-session high and treats rapid detection as a flag",()=>{
    const tradingDate="2026-11-11",at=Date.parse("2026-11-11T16:35:24Z");
    const symbols=["NCT","BBB"];
    const market={...universe,tradingDate,stocks:symbols.map(symbol=>({...universe.stocks[0],symbol}))};
    const sample=(price:number,high:number,observedAt:number):AlpacaSessionState=>({
      date:tradingDate,regularClose:960,complete:true,sessions:{
        premarket:{price:0.6,high:0.65,low:0.5,volume:100,dollarVolume:55,providerAt:at-8e6},
        regular:{price,high,low:0.6,volume:1000,dollarVolume:850,providerAt:observedAt},
        after_hours:{price:null,high:null,low:null,volume:0,dollarVolume:0,providerAt:null},
      },
    });
    const detectedAtUtc=new Date(at).toISOString();
    const rapid={symbol:"NCT",exchange:"NASDAQ" as const,company:"NCT",price:0.8505,changePercent:null,comparisonPrice:null,volume:1000,float:null,spreadPercent:null,receivedAtUtc:detectedAtUtc,news:[],drop:{detectedAtUtc,startAtUtc:new Date(at-30000).toISOString(),startPrice:1.07,detectionPrice:0.7,lowPrice:0.7,lowAtUtc:detectedAtUtc,dropPercent:-20.51,maximumDropPercent:-34.58,reboundPercent:21.5,backToStartPercent:25.8,durationSeconds:30,sharesDuringDrop:500}};
    const book=new PremarketPullbackBook();
    const evaluate=(price:number,receivedAt:number)=>{
      const payload={feed:"sip",connected:true,snapshots:{NCT:{},BBB:{}},sessionTotals:{
        NCT:sample(price,1.1101,receivedAt),BBB:sample(0.7,1,receivedAt),
      }};
      const {snapshots}=normalizeAlpacaScannerBatch({payload,requestedSymbols:symbols,session:"regular",tradingDate,receivedAt});
      return book.evaluate({universe:market,session:"regular",now:receivedAt,snapshots,floats:new Map(),activity:()=>activity,rapidDrops:[rapid]});
    };
    const fresh=evaluate(1.0657,at-1000);
    expect(fresh.rows.map(row=>row.symbol)).toEqual(["BBB"]);
    const drop=evaluate(0.8505,at);
    expect(drop.rows.map(row=>row.symbol)).toEqual(["BBB","NCT"]);
    expect(drop.rows[1]).toMatchObject({regularHigh:1.1101,referenceHigh:1.1101,referenceSession:"regular",rapidDrop:{startPrice:1.07}});
    expect(drop.rows[1].belowHighPercent).toBeCloseTo(23.3853);
    expect(evaluate(1.0657,at+1000).rows.map(row=>row.symbol)).toEqual(["BBB"]);
  });
  it("sorts by return distance and applies the limit without losing the total",()=>{const result=new PremarketPullbackBook().evaluate({universe:{...universe,stocks:[...universe.stocks,{symbol:"BBB",exchange:"NASDAQ",marketCapAtCollection:1e6}]},session:"regular",now,snapshots:[quote(7),quote(5,0,{symbol:"BBB"})],floats:new Map(),activity:()=>activity,controls:{...controls,displayLimit:1}});expect(result.total).toBe(2);expect(result.rows.map(row=>row.symbol)).toEqual(["BBB"]);});
  it("changes selection controls without replacing the frozen reference",()=>{const book=new PremarketPullbackBook();run(book);const result=run(book,10,[quote(7,10,{premarketHigh:30})],"regular",{...controls,minimumPullbackPercent:40,removeWithinPercent:35});expect(result.rows).toHaveLength(0);});
  it("accepts legacy settings and validates optional controls",()=>{const base=initialConfiguration();expect(validateConfiguration(base)).toEqual(base);expect(validateConfiguration({...base,premarketPullbacks:controls}).premarketPullbacks).toEqual(controls);for(const change of [{minimumPullbackPercent:100},{removeWithinPercent:21},{displayLimit:0},{extra:true}])expect(()=>validateConfiguration({...base,premarketPullbacks:{...controls,...change}})).toThrow();});
});
