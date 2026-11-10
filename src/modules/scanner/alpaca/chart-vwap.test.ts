// @vitest-environment node
import {expect,it} from 'vitest';
import {VWAP_ANCHORS,DEFAULT_CHART_PREFERENCES,parseChartPreferences,type ChartIndicator} from './chart-preferences';
import {indicatorValues,vwapAnchorKey} from './chart-indicators';
import type {Candle} from './candles';
const study=(changes:Partial<ChartIndicator>={}):ChartIndicator=>({id:'vwap',type:'VWAP',period:20,color:'#123456',width:2,...changes});
const bar=(date:string,price:number,volume=100):Candle=>({time:Date.parse(date+'T18:00:00Z')/1000,open:price,high:price,low:price,close:price,volume});
it('defaults to HLC3 rather than close with asymmetric candles and unequal volume',()=>{
 const input:Candle[]=[
  {...bar('2026-11-09',10),open:8,high:16,low:6},
  {...bar('2026-11-09',20,200),time:Date.parse('2026-11-09T18:01:00Z')/1000,open:14,high:24,low:12},
 ];
 // HLC3 values are 32/3 and 56/3; their 100:200 weighted mean is 16.
 expect(indicatorValues(input,study())[0].points.at(-1)?.value).toBeCloseTo(16,12);
 const expected={open:12,high:64/3,low:10,close:50/3,hl2:47/3,hlc3:16,ohlc4:15,hlcc4:97/6};
 for(const [source,value] of Object.entries(expected)){
  expect(indicatorValues(input,study({source:source as ChartIndicator['source']}))[0].points.at(-1)?.value).toBeCloseTo(value,12);
 }
});
it('uses Session as default and resets cumulative price-volume at session boundaries',()=>{
 const input=[bar('2026-11-06',10),bar('2026-11-09',20)];
 expect(indicatorValues(input,study())[0].points.map(p=>p.value)).toEqual([10,20]);
 expect(indicatorValues(input,study({anchor:'Month'}))[0].points.map(p=>p.value)).toEqual([10,15]);
 expect(indicatorValues([bar('2026-11-09',10),bar('2026-11-10',20)],study({anchor:'Week'}))[0].points.map(p=>p.value)).toEqual([10,15]);
});
it('resets each calendar anchor at the documented period transition',()=>{
 const cases=[['Week','2026-11-08','2026-11-09'],['Month','2026-11-30','2026-12-01'],['Quarter','2026-09-30','2026-10-01'],['Year','2026-12-31','2027-01-01'],['Decade','2029-12-31','2030-01-01'],['Century','2099-12-31','2100-01-01']] as const;
 for(const [anchor,previous,next]of cases){expect(vwapAnchorKey(previous,anchor)).not.toEqual(vwapAnchorKey(next,anchor));expect(indicatorValues([bar(previous,10),bar(next,20)],study({anchor}))[0].points.map(p=>p.value)).toEqual([10,20]);}
});
it('hides an explicitly hidden Session VWAP on daily charts without fabricating values',()=>{
 const input=[bar('2026-11-06',10),bar('2026-11-09',20)];
 for(const timeframe of ['1m','5m','15m','1h','4h'] as const)expect(indicatorValues(input,study({hideOnDaily:true}),timeframe)[0].points).toHaveLength(2);
 expect(indicatorValues(input,study({hideOnDaily:true}),'1D')[0].points).toEqual([]);
 expect(indicatorValues(input,study({hideOnDaily:false}),'1D')[0].points.map(p=>p.value)).toEqual([10,20]);
});
it('round-trips all supported anchors, source and daily-hide without rewriting legacy preferences',()=>{
 for(const anchor of VWAP_ANCHORS){const indicator=study({anchor,source:'hlc3',hideOnDaily:true});expect(parseChartPreferences({...DEFAULT_CHART_PREFERENCES,indicators:[indicator]}).indicators[0]).toEqual(indicator);}
 expect(parseChartPreferences({...DEFAULT_CHART_PREFERENCES,indicators:[study()]}).indicators[0]).toEqual(study());
 expect(()=>parseChartPreferences({...DEFAULT_CHART_PREFERENCES,indicators:[study({anchor:'Invented' as ChartIndicator['anchor']})]})).toThrow();
});
it('does not create a VWAP before positive volume, and zero-volume bars cannot change it',()=>{
 const input=[bar('2026-11-09',900,0),{...bar('2026-11-09',10,100),time:Date.parse('2026-11-09T18:01:00Z')/1000},{...bar('2026-11-09',900,0),time:Date.parse('2026-11-09T18:02:00Z')/1000}];
 expect(indicatorValues(input,study())[0].points.map(p=>p.value)).toEqual([10,10]);
});
it('persists calculation timeframe, wait-for-close and signed offset without changing legacy defaults',()=>{
 for(const calculationTimeframe of ['1m','5m','15m','1h','4h','1D'] as const)for(const waitForClose of [true,false]){
  const indicator=study({calculationTimeframe,waitForClose,offset:-3});
  expect(parseChartPreferences({...DEFAULT_CHART_PREFERENCES,indicators:[indicator]}).indicators[0]).toEqual(indicator);
 }
 for(const changes of [{offset:0.5},{offset:501},{waitForClose:'yes'},{calculationTimeframe:'7m'}]){
  expect(()=>parseChartPreferences({...DEFAULT_CHART_PREFERENCES,indicators:[{...study(),...changes}]})).toThrow();
 }
});
