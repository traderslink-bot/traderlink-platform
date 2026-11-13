import { expect, it } from "vitest";
import { LiveScannerEngine } from "./engine";
import { initialConfiguration } from "./settings";
import type { NormalizedSnapshot, ScannerSession } from "./contracts";

const date="2026-11-12";
const now=Date.parse(date+"T15:00:00Z");
const configuration={...initialConfiguration(),enabled:true};
const stocks=[{symbol:"AAA",exchange:"NASDAQ" as const,marketCapAtCollection:1e6}];
function setup(){
  const engine=new LiveScannerEngine();
  return (session:ScannerSession,price:number,seconds:number,changes:Partial<NormalizedSnapshot>={})=>{
    const at=now+seconds*1000;
    const tradingDate=changes.tradingDate??date;
    const quote:NormalizedSnapshot={symbol:"AAA",company:"Test",session,tradingDate,provider:"alpaca",providerAt:at,receivedAt:at,price,baseline:1,
      volume:3000,dollarVolume:3000,bid:null,ask:null,marketCap:1e6,dayHigh:3,dayLow:1,providerVolumeRatio:null,premarketHigh:2,...changes};
    return engine.evaluate({tradingDate,session,now:at,snapshots:[quote],floats:new Map(),news:new Map(),configuration,
      universe:{version:1,tradingDate,acceptedAtUtc:new Date(at).toISOString(),lastCollectionAtUtc:new Date(at).toISOString(),latestUploadCount:1,sourceHashes:[],stocks}}).breakouts;
  };
}

it("keeps one breakout at the original level through a pullback, retest and reclaim",()=>{
  const run=setup();
  expect(run("premarket",2,0)).toEqual([]);
  expect(run("regular",2,1)).toEqual([]);
  const [first]=run("regular",2.01,2)!;
  expect(first).toMatchObject({breakoutLevel:2,breakoutState:"above",float:null});
  expect(run("regular",1.9,3,{premarketHigh:null})).toMatchObject([{breakoutAtUtc:first.breakoutAtUtc,breakoutLevel:2,breakoutState:"below",price:1.9}]);
  expect(run("regular",2,4)).toMatchObject([{breakoutState:"at"}]);
  expect(run("regular",2.05,5)).toMatchObject([{breakoutAtUtc:first.breakoutAtUtc,breakoutState:"above"}]);
});

it("requires a PM level, rejects older quotes and clears on the next trading date",()=>{
  const run=setup();
  expect(run("regular",2.5,0,{premarketHigh:null})).toEqual([]);
  expect(run("regular",2.5,1)).toHaveLength(1);
  expect(run("regular",1.5,2,{providerAt:now})).toMatchObject([{price:2.5,breakoutState:"above"}]);
  expect(run("regular",2.5,86400,{tradingDate:"2026-11-13",premarketHigh:null})).toEqual([]);
});
