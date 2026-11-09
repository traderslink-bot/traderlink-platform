// @vitest-environment node
import {afterEach,expect,it,vi} from 'vitest';
import {RollingActivityBook} from './activity';
import {MomentumEventBook} from './momentum-events';
import {DEFAULT_MOMENTUM_DETECTION} from './settings';
import {scheduleEventScanner} from './event-timing';
import {startLiveScannerFeed,type LiveScannerFeed} from './server/live-feed';
import type {NormalizedSnapshot,RollingActivity} from './contracts';
const base=Date.parse('2026-11-06T15:00:00Z');
const sample=(seconds:number):NormalizedSnapshot=>({symbol:'TEST',company:'Test',provider:'alpaca',session:'regular',tradingDate:'2026-11-06',priceTimeBasis:'session_observation',providerAt:base+seconds*1000,receivedAt:base+seconds*1000,price:1+seconds/100000,baseline:1,volume:100000+seconds*100,dollarVolume:200000+seconds*200,bid:1,ask:1.01,marketCap:null,dayHigh:2,dayLow:1,providerVolumeRatio:null});
afterEach(()=>vi.useRealTimers());
it('keeps ten-minute anchors at one-second ingest and matches old aligned rolling values',()=>{
 const old=new RollingActivityBook(),fast=new RollingActivityBook(true);
 for(let second=0;second<=600;second++){fast.observe(sample(second));if(second%5===0)old.observe(sample(second));}
 const actual=fast.metrics('TEST',base+600000),expected=old.metrics('TEST',base+600000);
 for(const key of ['oneMinuteVolume','fiveMinuteVolume','oneMinuteDollarVolume','oneMinuteGain','fiveMinuteGain','fiveMinuteVolumeSpike','volumeAcceleration'] as const)expect(actual[key]).toBeCloseTo(expected[key]!);
 expect(actual.observationVolume).toBe(100);expect(actual.intervalVolume).toBe(500);expect(actual.intervalSeconds).toBe(5);
 fast.observe({...sample(601),session:'after_hours'});expect(fast.metrics('TEST',base+601000).oneMinuteVolume).toBeNull();
});
it('does not multiply episode volume or shorten building/quiet durations when updates speed up',()=>{
 const book=new MomentumEventBook(true),controls={...DEFAULT_MOMENTUM_DETECTION.premarket,minimumEpisodeShares:100,minimumEpisodeDollarVolume:100,minimumEpisodeFloatTurnoverPercent:0.001,buildingConfirmationScans:2,episodeQuietScans:3};
 const activity:RollingActivity={oneMinuteGain:null,fiveMinuteGain:null,oneMinuteVolume:null,oneMinuteDollarVolume:null,fiveMinuteVolume:null,fiveMinuteVolumeSpike:null,volumeAcceleration:null,intervalSeconds:5,intervalGain:1,intervalVolume:500,intervalDollarVolume:500,intervalVolumeRate:100,baselineVolumeRate:10,intervalVolumeRateMultiple:10,observationVolume:100,observationDollarVolume:100};
 expect(book.evaluate('day:pre','TEST',1,10000,base,activity,controls).signals).not.toContain('building_volume');
 for(let second=1;second<=5;second++){const result=book.evaluate('day:pre','TEST',1,10000,base+second*1000,activity,controls);expect(result.activity.episodeShares).toBe(500+100*second);expect(result.signals.includes('building_volume')).toBe(second>=5);}
 const quiet={...activity,observationVolume:0,observationDollarVolume:0,intervalVolume:0,intervalDollarVolume:0,intervalVolumeRateMultiple:0};
 expect(book.evaluate('day:pre','TEST',1,10000,base+19000,quiet,controls).activity.episodeShares).toBe(1000);
 expect(book.evaluate('day:pre','TEST',1,10000,base+20000,quiet,controls).activity.episodeShares).toBeNull();
});
it('coalesces event bursts, serializes work and retains changes arriving during evaluation',async()=>{
 vi.useFakeTimers();let notify=()=>{},release=()=>{};const unsubscribe=vi.fn();
 const run=vi.fn().mockImplementationOnce(()=>new Promise<void>(resolve=>{release=resolve})).mockResolvedValue(undefined);
 const stop=scheduleEventScanner(run,callback=>{notify=callback;return unsubscribe});
 try{await vi.advanceTimersByTimeAsync(0);for(let i=0;i<100;i++)notify();await vi.advanceTimersByTimeAsync(1000);expect(run).toHaveBeenCalledTimes(1);release();await vi.advanceTimersByTimeAsync(0);expect(run).toHaveBeenCalledTimes(2);for(let i=0;i<100;i++)notify();await vi.advanceTimersByTimeAsync(999);expect(run).toHaveBeenCalledTimes(2);await vi.advanceTimersByTimeAsync(1);expect(run).toHaveBeenCalledTimes(3);}finally{stop();}expect(unsubscribe).toHaveBeenCalledOnce();
});
it('starts the actual feed scheduler with Alpaca and Moomoo off, preserving the legacy gate',async()=>{
 vi.useFakeTimers();const feed={scanOnce:vi.fn(async()=>{}),subscribeChanges:()=>()=>{}} as unknown as LiveScannerFeed;
 const stop=startLiveScannerFeed(feed,{NODE_ENV:'test',TRADERLINK_MARKET_DATA_PROVIDER:'alpaca',TRADERLINK_LIVE_SCREENERS_ENABLED:'true',TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED:'false'});
 expect(feed.scanOnce).toHaveBeenCalledTimes(1);stop();await vi.advanceTimersByTimeAsync(10000);expect(feed.scanOnce).toHaveBeenCalledTimes(1);
 const stopLegacy=startLiveScannerFeed(feed,{NODE_ENV:'test',TRADERLINK_MARKET_DATA_PROVIDER:'moomoo',TRADERLINK_LIVE_SCREENERS_ENABLED:'true',TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED:'false'});expect(feed.scanOnce).toHaveBeenCalledTimes(1);stopLegacy();
});
