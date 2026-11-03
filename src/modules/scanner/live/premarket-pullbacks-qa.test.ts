import { expect, it } from "vitest";
import { PremarketPullbackBook } from "./premarket-pullbacks";
import { SnapshotSessionQualifier } from "./session-qualification";
import { normalizeSnapshotBatch } from "./snapshots";
import type { DailyUniverse, NormalizedSnapshot, RollingActivity } from "./contracts";

const now=Date.parse("2026-11-02T15:00:00Z");
const universe:DailyUniverse={version:1,tradingDate:"2026-11-02",acceptedAtUtc:new Date(now).toISOString(),lastCollectionAtUtc:new Date(now).toISOString(),latestUploadCount:1,sourceHashes:[],stocks:[{symbol:"TEST",exchange:"NASDAQ",marketCapAtCollection:1e6}]};
const activity:RollingActivity={oneMinuteGain:null,fiveMinuteGain:null,oneMinuteVolume:null,fiveMinuteVolume:null,oneMinuteDollarVolume:null,fiveMinuteVolumeSpike:null,volumeAcceleration:null};
const quote:NormalizedSnapshot={symbol:"TEST",company:"Synthetic",session:"regular",tradingDate:universe.tradingDate,providerAt:now,receivedAt:now,price:7,baseline:5,volume:1000,dollarVolume:7000,bid:null,ask:null,marketCap:1e6,dayHigh:20,dayLow:1,providerVolumeRatio:null,premarketHigh:10,premarketVolume:null};

it("picks up later available PM volume without changing the frozen PM high",()=>{
  const book=new PremarketPullbackBook();const base={universe,session:"regular" as const,now,floats:new Map(),activity:()=>activity};
  expect(book.evaluate({...base,snapshots:[quote]}).rows[0].premarketVolume).toBeNull();
  const result=book.evaluate({...base,now:now+10000,snapshots:[{...quote,premarketVolume:12000,providerAt:now+10000,receivedAt:now+10000}]});
  expect(result.rows[0].premarketHigh).toBe(10);
  expect(result.rows[0].premarketVolume).toBe(12000);
});

it("accepts a current premarket response without a separate timestamp qualification gate",()=>{
  const at=Date.parse("2026-11-02T13:00:00Z"),payload={ret_code:0,data:{snapshot_list:[{code:"US.TEST",data_date:universe.tradingDate,update_time:at,pre_price:7,pre_high_price:10,pre_volume:12000,pre_turnover:84000}]}};
  const qualification=new SnapshotSessionQualifier().observe("premarket",{payload,requestedSymbols:["TEST"],receivedAt:at,tradingDate:universe.tradingDate,day:{date:universe.tradingDate,verified:true,open:true,regularCloseEastern:"16:00",extendedCloseEastern:"20:00"}});
  expect(qualification.sessionTimestampVerified).toBe(true);
  const result=normalizeSnapshotBatch({payload,requestedSymbols:["TEST"],receivedAt:at,tradingDate:universe.tradingDate,session:"premarket",qualification});
  expect(result.snapshots[0]).toMatchObject({price:7,premarketHigh:10,premarketVolume:12000,priceTimeBasis:"session_observation"});
});

it("preserves final PM high and known volume through missing, reset or conflicting aggregates",()=>{
  const book=new PremarketPullbackBook();const base={universe,session:"regular" as const,now,floats:new Map(),activity:()=>activity};
  book.evaluate({...base,snapshots:[{...quote,premarketVolume:12000}]});
  for(const [index,change] of [{premarketVolume:null},{premarketVolume:0},{premarketHigh:30,premarketVolume:25000},{premarketHigh:null,premarketVolume:25000}].entries()){
    const at=now+(index+1)*1000;
    const result=book.evaluate({...base,now:at,snapshots:[{...quote,...change,receivedAt:at,providerAt:at}]});
    expect(result.rows[0]).toMatchObject({premarketHigh:10,premarketVolume:12000});
  }
});

it("accepts zero as known volume then fills a later positive same-reference counter",()=>{
  const book=new PremarketPullbackBook();const base={universe,session:"regular" as const,now,floats:new Map(),activity:()=>activity};
  expect(book.evaluate({...base,snapshots:[{...quote,premarketVolume:0}]}).rows[0].premarketVolume).toBe(0);
  const at=now+1000;
  expect(book.evaluate({...base,now:at,snapshots:[{...quote,premarketVolume:12000,receivedAt:at,providerAt:at}]}).rows[0].premarketVolume).toBe(12000);
});

it.each(["regular","after_hours"] as const)("fills delayed PM volume through the actual %s qualifier and normalizer",session=>{
  const qualifier=new SnapshotSessionQualifier(),book=new PremarketPullbackBook();
  const close=Date.parse("2026-11-02T21:00:00Z"),start=session==="regular"?now:close+300000;
  const day={date:universe.tradingDate,verified:true,open:true,regularCloseEastern:"16:00" as const,extendedCloseEastern:"20:00" as const};
  const run=(index:number,premarketVolume:number|null)=>{
    const at=start+index*10000;
    const payload={ret_code:0,data:{snapshot_list:[{code:"US.TEST",data_date:universe.tradingDate,
      update_time:session==="regular"?at:close,last_price:session==="regular"?7:8,prev_close_price:5,
      volume:10000+index*1000,turnover:70000+index*7000,pre_high_price:10,pre_volume:premarketVolume,
      after_price:7,after_volume:1000+index*100,after_turnover:7000+index*700}]}};
    const qualification=qualifier.observe(session,{payload,requestedSymbols:["TEST"],receivedAt:at,tradingDate:universe.tradingDate,day});
    const normalized=normalizeSnapshotBatch({payload,requestedSymbols:["TEST"],session,tradingDate:universe.tradingDate,receivedAt:at,qualification});
    return {qualification,normalized,result:book.evaluate({universe,session,now:at,snapshots:normalized.snapshots,floats:new Map(),activity:()=>activity})};
  };
  if(session==="after_hours"){
    const first=run(0,null);
    expect(first.qualification.sessionTimestampVerified).toBe(true);
    expect(first.normalized.snapshots).toHaveLength(1);
  }
  const accepted=run(1,null);
  expect(accepted.qualification.sessionTimestampVerified).toBe(true);
  expect(accepted.result.rows[0]).toMatchObject({price:7,premarketHigh:10,premarketVolume:null});
  const filled=run(2,12000);
  expect(filled.result.rows[0]).toMatchObject({price:7,premarketHigh:10,premarketVolume:12000});
  expect(filled.result.rows[0].backToHighPercent).toBeCloseTo(42.8571429);
  expect(filled.normalized.issues).not.toContain("session_timestamp_unverified");
});
