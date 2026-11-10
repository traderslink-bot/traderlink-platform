// @vitest-environment node
import {expect,it,vi} from 'vitest';
import {AlpacaVwapHistory} from './chart-vwap-history';
import {indicatorValues} from './chart-indicators';
import {parseVwapSeedRequest,validVwapSeed} from './chart-vwap-seed';
import {ChartSessionCalendar} from './chart-calendar';
import {DEFAULT_CHART_PREFERENCES,parseChartPreferences,type ChartIndicator} from './chart-preferences';
import type {Candle} from './candles';
const now=Date.parse('2026-11-10T22:00:00Z'),basisDate='2026-11-10';
const flat=(date:string,price:number):Candle=>({time:Date.parse(date+'T14:30:00Z')/1000,open:price,high:price,low:price,close:price,volume:100});
const bars=[flat('2026-11-06',10),flat('2026-11-09',20),flat('2026-11-10',40)];
const calendar={available:true as const,start:'2026-01-01',end:'2026-12-31',sessions:bars.map(bar=>({date:new Date(bar.time*1000).toISOString().slice(0,10),open:'09:30',close:'16:00'}))};
const study=(anchor:'Splits'|'Dividends'):ChartIndicator=>({id:'events',type:'VWAP',anchor,period:20,color:'#2962ff',width:1});
const query=(anchor:'Splits'|'Dividends')=>parseVwapSeedRequest(new URLSearchParams({symbol:'TEST',timeframe:'1m',anchor,before:String(bars[1].time),premarket:'1',regular:'1',postmarket:'1'}),now);
it.each(['Splits','Dividends'] as const)('seeds %s from the actual previous event and resets only on the next supplied event',async anchor=>{
 const request=query(anchor),events={symbol:'TEST',anchor,basisDate,dates:['2026-11-06','2026-11-10']};
 const history=vi.fn(async(range:{start:number;end:number})=>({symbol:'TEST',basisDate,feed:'sip' as const,adjustment:'split' as const,complete:true as const,nextPageToken:null,bars:bars.filter(bar=>bar.time*1000>=range.start&&bar.time*1000<=range.end)}));
 const book=new AlpacaVwapHistory({history},{forBars:async()=>calendar},()=>now,{read:async()=>events});
 const seed=await book.read(request);expect(validVwapSeed(seed,request,basisDate)).toBe(true);expect(seed.anchorKey).toBe('2026-11-06');expect(seed.volume).toBe(100);expect(seed.sums.hlc3).toBe(1000);
 const sessionCalendar=new ChartSessionCalendar();sessionCalendar.merge(calendar);
 expect(indicatorValues(bars.slice(1),study(anchor),'1m',{vwapSeed:seed,calendar:sessionCalendar})[0].points.map(point=>point.value)).toEqual([15,40]);
 expect(parseChartPreferences({...DEFAULT_CHART_PREFERENCES,indicators:[study(anchor)]}).indicators[0].anchor).toBe(anchor);
 expect(validVwapSeed({...seed,events:{...events,symbol:'OTHER'}},request,basisDate)).toBe(false);
 expect(validVwapSeed({...seed,events:{...events,dates:['2026-11-10','2026-11-06']}},request,basisDate)).toBe(false);
});
it('leaves bars before the first event empty instead of silently starting at the viewport',async()=>{
 const request=query('Splits'),history=vi.fn(),events={symbol:'TEST',anchor:'Splits' as const,basisDate,dates:['2026-11-10']};
 const seed=await new AlpacaVwapHistory({history},{forBars:async()=>calendar},()=>now,{read:async()=>events}).read(request);
 expect(seed.anchorKey).toBe('');expect(seed.start).toBe(request.before);expect(seed.volume).toBe(0);expect(history).not.toHaveBeenCalled();
 expect(indicatorValues(bars.slice(1),study('Splits'),'1m',{vwapSeed:seed})[0].points.map(point=>point.value)).toEqual([40]);
 const empty=await new AlpacaVwapHistory({history},{forBars:async()=>calendar},()=>now,{read:async()=>({...events,dates:[]})}).read(request);
 expect(indicatorValues(bars,study('Splits'),'1m',{vwapSeed:empty})[0].points).toEqual([]);expect(validVwapSeed(empty,request,basisDate)).toBe(true);expect(validVwapSeed({...empty,volume:100,sums:{open:1000,high:1000,low:1000,close:1000,hl2:1000,hlc3:1000,ohlc4:1000}},request,basisDate)).toBe(false);
});
it('does not replace unavailable event facts with a calendar anchor',async()=>{
 const history=vi.fn();await expect(new AlpacaVwapHistory({history},{forBars:async()=>calendar},()=>now).read(query('Splits'))).rejects.toThrow('vwap_events_unavailable');expect(history).not.toHaveBeenCalled();
 expect(()=>indicatorValues(bars,study('Splits'))).toThrow('vwap_event_facts_unavailable');
});
