// @vitest-environment node
import {expect,it} from 'vitest';
import {defaultVwapBands,DEFAULT_CHART_PREFERENCES,parseChartPreferences,PRICE_SOURCES,type ChartIndicator} from './chart-preferences';
import {indicatorValues,indicatorPlotStyle} from './chart-indicators';
import {parseVwapSeedRequest,validVwapSeed,vwapSeedStart,type VwapSeed} from './chart-vwap-seed';
import type {Candle} from './candles';
import {CHART_TIMEFRAMES} from './candles';
const time=Date.parse('2026-11-09T15:00:00Z')/1000;
const bar=(offset:number,price:number,volume:number):Candle=>({time:time+offset,open:price,high:price,low:price,close:price,volume});
const study=(changes:Partial<ChartIndicator>={}):ChartIndicator=>({id:'vwap',type:'VWAP',period:20,color:'#2962ff',width:1,vwapBands:defaultVwapBands(),...changes});
it('uses volume-weighted population deviation with three independent multipliers',()=>{
 const indicator=study();for(const level of indicator.vwapBands!.levels)level.enabled=true;
 const plots=indicatorValues([bar(0,10,100),bar(60,20,200),bar(120,900,0)],indicator,'1m');
 expect(plots).toHaveLength(7);expect(plots[0].label).toBe('VWAP');
 for(let n=0;n<3;n++){
  const upper=plots[1+n*2].points,lower=plots[2+n*2].points;
  expect(upper[0].value).toBe(10);expect(lower[0].value).toBe(10);
  expect(upper[1].value).toBeCloseTo(50/3+(n+1)*Math.sqrt(200/9),12);
  expect(lower[1].value).toBeCloseTo(50/3-(n+1)*Math.sqrt(200/9),12);
  expect(upper[2].value).toBe(upper[1].value);expect(lower[2].value).toBe(lower[1].value);
 }
});
it('resets deviation at a new anchor and leaves disabled bands empty',()=>{
 const plots=indicatorValues([bar(0,10,100),bar(60,20,100),bar(86400,30,100)],study(),'1m');
 expect(plots[1].points.at(-1)?.value).toBe(30);expect(plots[2].points.at(-1)?.value).toBe(30);
 expect(plots[3].points).toEqual([]);expect(plots[5].points).toEqual([]);
});
for(const frame of CHART_TIMEFRAMES)it(`keeps monthly weighted bands correct on ${frame}`,()=>{
 const step={'1m':60,'5m':300,'15m':900,'1h':3600,'4h':14400,'1D':86400}[frame];
 const plots=indicatorValues([bar(0,10,100),bar(step,20,200)],study({anchor:'Month'}),frame);
 expect(plots[0].points.at(-1)?.value).toBeCloseTo(50/3,12);
 expect(plots[1].points.at(-1)?.value).toBeCloseTo(50/3+Math.sqrt(200/9),12);
});
function prefix():VwapSeed{
 const request=parseVwapSeedRequest(new URLSearchParams({symbol:'TEST',timeframe:'1m',anchor:'Month',before:String(time),premarket:'1',regular:'1',postmarket:'1'}),time*1000);
 return {complete:true,request,basisDate:'2026-11-09',start:vwapSeedStart(request),anchorKey:'2026-11',volume:100,sums:Object.fromEntries(PRICE_SOURCES.map(source=>[source,1000])) as VwapSeed['sums'],moments:Object.fromEntries(PRICE_SOURCES.map(source=>[source,{mean:10,m2:0}])) as NonNullable<VwapSeed['moments']>};
}
it('uses complete weighted prefix moments without mutating the cached seed',()=>{
 const seed=prefix(),snapshot=structuredClone(seed);
 const plots=indicatorValues([bar(0,20,100)],study({anchor:'Month'}),'1m',{vwapSeed:seed});
 expect(plots[0].points[0].value).toBe(15);expect(plots[1].points[0].value).toBe(20);expect(plots[2].points[0].value).toBe(10);
 expect(seed).toEqual(snapshot);expect(validVwapSeed(seed,seed.request,seed.basisDate)).toBe(true);
 expect(validVwapSeed({...seed,volume:0},seed.request,seed.basisDate)).toBe(false);
 const mismatch=structuredClone(seed);mismatch.moments!.close.mean=15;
 expect(validVwapSeed(mismatch,seed.request,seed.basisDate)).toBe(false);
 seed.moments!.hlc3.m2=-1;expect(validVwapSeed(seed,seed.request,seed.basisDate)).toBe(false);
});
it('keeps the main line but withholds unknown deviation, while percentage needs no variance history',()=>{
 const seed=prefix();delete seed.moments;
 const indicator=study({anchor:'Month'}),plots=indicatorValues([bar(0,20,100)],indicator,'1m',{vwapSeed:seed});
 expect(plots[0].points[0].value).toBe(15);expect(plots[1].points).toEqual([]);expect(plots[1].unavailable).toBe(true);
 indicator.vwapBands!.mode='Percentage';
 const percent=indicatorValues([bar(0,20,100)],indicator,'1m',{vwapSeed:seed});
 expect(percent[1].points[0].value).toBeCloseTo(15.15,12);expect(percent[2].points[0].value).toBeCloseTo(14.85,12);expect(percent[1].unavailable).toBeUndefined();
});
it('persists independent bands and fill settings, rejects malformed configuration, preserves legacy shape',()=>{
 const indicator=study();indicator.vwapBands!.levels[2]={enabled:true,multiplier:2.5,fillVisible:false,fillColor:'#123456',fillOpacity:17};
 expect(parseChartPreferences({...DEFAULT_CHART_PREFERENCES,indicators:[indicator]}).indicators[0]).toEqual(indicator);
 const legacy={...indicator};delete legacy.vwapBands;
 expect(parseChartPreferences({...DEFAULT_CHART_PREFERENCES,indicators:[legacy]}).indicators[0]).toEqual(legacy);
 for(const field of [{multiplier:-1},{multiplier:Infinity},{fillColor:'bad'},{fillOpacity:101}]){
  const invalid=structuredClone(indicator);Object.assign(invalid.vwapBands!.levels[0],field);
  expect(()=>parseChartPreferences({...DEFAULT_CHART_PREFERENCES,indicators:[invalid]})).toThrow();
 }
});

it('matches native default band colors and preserves explicit user overrides',()=>{
 const indicator=study(),colors=['#4caf50','#808000','#089981'];
 for(let n=0;n<3;n++){expect(indicator.vwapBands!.levels[n].fillColor).toBe(colors[n]);expect(indicatorPlotStyle(indicator,`upper-${n+1}`).color).toBe(colors[n]);expect(indicatorPlotStyle(indicator,`lower-${n+1}`).color).toBe(colors[n]);}
 indicator.plots={'upper-2':{color:'#123456'}};expect(indicatorPlotStyle(indicator,'upper-2').color).toBe('#123456');
});
it('supports native nonnegative multipliers above 100 and withholds only overflowing band values',()=>{
 const indicator=study();indicator.vwapBands!.levels[0].multiplier=250;
 expect(parseChartPreferences({...DEFAULT_CHART_PREFERENCES,indicators:[indicator]}).indicators[0].vwapBands!.levels[0].multiplier).toBe(250);
 const input=[bar(0,10,100),bar(60,20,200)];const normal=indicatorValues(input,indicator,'1m');expect(normal[1].points.at(-1)?.value).toBeCloseTo(50/3+250*Math.sqrt(200/9),10);
 indicator.vwapBands!.levels[0].multiplier=1e308;indicator.vwapBands!.levels[1].enabled=true;
 const overflow=indicatorValues(input,indicator,'1m');expect(overflow[0].points.at(-1)?.value).toBeCloseTo(50/3,12);expect(overflow[1].points).toEqual([]);expect(overflow[2].points).toEqual([]);expect(overflow[1].unavailableReason).toBe('numeric');expect(overflow[3].points.at(-1)?.value).toBeCloseTo(50/3+2*Math.sqrt(200/9),12);
});
