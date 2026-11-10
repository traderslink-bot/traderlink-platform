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
