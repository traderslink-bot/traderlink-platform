import {afterEach,expect,it} from 'vitest';
import {mkdtempSync,rmSync,statSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DEFAULT_CHART_PREFERENCES,parseChartPreferences,type ChartIndicator} from './chart-preferences';
import {readChartPreferences,writeChartPreferences} from './chart-preference-store';
import {indicatorValues,visibleSessionBars} from './chart-indicators';
import type {Candle} from './candles';
const directories:string[]=[];afterEach(()=>{for(const d of directories.splice(0))rmSync(d,{recursive:true,force:true});});
const study=(type:ChartIndicator['type'],period=3):ChartIndicator=>({id:'test',type,period,color:'#ff9900',width:2});
const bars=(values:number[]):Candle[]=>values.map((close,i)=>({time:Date.parse('2026-11-06T15:00Z')/1000+i*60,open:close,high:close,low:close,close,volume:10}));
it('validates the complete preference payload and requires a visible session',()=>{
 expect(parseChartPreferences(DEFAULT_CHART_PREFERENCES)).toEqual(DEFAULT_CHART_PREFERENCES);
 for(const changes of [{volumeHeight:99},{premarket:false,regular:false,postmarket:false},{upColor:'red'},{indicators:[study('EMA',0)]},{timezone:'unknown'}])expect(()=>parseChartPreferences({...DEFAULT_CHART_PREFERENCES,...changes})).toThrow();
});
it('persists by authenticated user with private file permissions and stale-write protection',()=>{
 const d=mkdtempSync(join(tmpdir(),'chart-prefs-test-'));directories.push(d);const p={...DEFAULT_CHART_PREFERENCES,indicators:[study('EMA')]};
 expect(readChartPreferences(d,'owner-a').revision).toBe(0);writeChartPreferences(d,'owner-a',0,p);
 expect(readChartPreferences(d,'owner-a')).toEqual({revision:1,preferences:p});expect(readChartPreferences(d,'owner-b').preferences.indicators).toEqual([]);
 expect(()=>writeChartPreferences(d,'owner-a',0,DEFAULT_CHART_PREFERENCES)).toThrow('preferences_conflict');
 expect(statSync(join(d,readdirSync(d)[0])).mode&0o777).toBe(0o600);
});
it('calculates SMA/EMA from actual candles and leaves their inputs unchanged',()=>{
 const input=bars([1,2,3,4,5]);expect(indicatorValues(input,study('SMA'))[0].points.map(p=>p.value)).toEqual([2,3,4]);expect(indicatorValues(input,study('EMA'))[0].points.map(p=>p.value)).toEqual([2,3,4]);expect(input).toEqual(bars([1,2,3,4,5]));
});
it('uses Wilder RSI and returns neutral 50 for a flat market',()=>{
 expect(indicatorValues(bars([1,2,3,4]),study('RSI'))[0].points[0].value).toBe(100);
 expect(indicatorValues(bars([3,3,3,3]),study('RSI'))[0].points[0].value).toBe(50);
});
it('resets VWAP on Eastern dates and uses real traded volume',()=>{
 const input=bars([2,4]);input[1].volume=30;expect(indicatorValues(input,study('VWAP'))[0].points.map(p=>p.value)).toEqual([2,3.5]);input[1].time+=86400;expect(indicatorValues(input,study('VWAP'))[0].points.map(p=>p.value)).toEqual([2,4]);
});
it('produces Bollinger bands and MACD plus its signal',()=>{
 const b=indicatorValues(bars([1,2,3]),study('Bollinger'));expect(b).toHaveLength(3);expect(b[0].points[0].value).toBe(2);expect(b[1].points[0].value).toBeGreaterThan(2);expect(b[2].points[0].value).toBeLessThan(2);
 const m=indicatorValues(bars(Array.from({length:40},(_,i)=>i+1)),study('MACD'));expect(m).toHaveLength(3);expect(m[0].points).toHaveLength(15);expect(m[1].points).toHaveLength(7);
});
it('filters minute facts before a higher-timeframe aggregation',()=>{
 const input=bars([1,2,3]);input[0].time=Date.parse('2026-11-06T13:00Z')/1000;input[1].time=Date.parse('2026-11-06T15:00Z')/1000;input[2].time=Date.parse('2026-11-06T22:00Z')/1000;
 expect(visibleSessionBars(input,{...DEFAULT_CHART_PREFERENCES,premarket:false,postmarket:false})).toEqual([input[1]]);
});
