// @vitest-environment node
import {expect,it,vi} from 'vitest';
import {AlpacaVwapHistory} from './chart-vwap-history';
import {parseVwapSeedRequest,validVwapSeed,type VwapSeedRequest} from './chart-vwap-seed';
import {indicatorValues} from './chart-indicators';
import {easternClock} from '../live/sessions';
import type {AlpacaHistoryResult} from './rest-data';
import type {ChartCalendar} from './chart-calendar';
import type {Candle} from './candles';
const now=Date.parse('2026-11-09T20:00:00Z'),basisDate='2026-11-09';
const before=Date.parse('2026-11-09T14:30:00Z')/1000;
const request:VwapSeedRequest={symbol:'TEST',timeframe:'1m',anchor:'Month',before,premarket:true,regular:true,postmarket:true};
const bar=(at:string,price:number):Candle=>({time:Date.parse(at)/1000,open:price-2,high:price+4,low:price-4,close:price,volume:100});
const input=[bar('2026-11-06T15:00:00Z',10),bar('2026-11-09T14:00:00Z',20)];
const calendar={forBars:async(bars:readonly Candle[]):Promise<ChartCalendar>=>({available:true,start:'2026-01-01',end:'2026-12-31',sessions:[...new Set(bars.map(value=>easternClock(value.time*1000).date))].map(date=>({date,open:'09:30',close:'16:00'}))})};
it('loads the full anchor prefix, then combines with visible bars instead of starting at the viewport',async()=>{
 const history=vi.fn(async(query:{start:number;end:number}):Promise<AlpacaHistoryResult>=>({symbol:'TEST',basisDate,feed:'sip',adjustment:'split',complete:true,nextPageToken:null,bars:input.filter(bar=>bar.time*1000>=query.start&&bar.time*1000<=query.end)}));
 const book=new AlpacaVwapHistory({history},calendar,()=>now);
 const [a,b]=await Promise.all([book.read(request),book.read(request)]);
 expect(history).toHaveBeenCalledTimes(1);expect(a).toEqual(b);expect(a.volume).toBe(200);expect(a.sums.hlc3).toBe(3000);expect(a.sums.high).toBe(3800);expect(validVwapSeed(a,request,basisDate)).toBe(true);
 expect(a.moments?.hlc3).toEqual({mean:15,m2:5000});
 const visible=[bar('2026-11-09T14:30:00Z',30)];
 expect(indicatorValues(visible,{id:'vwap',type:'VWAP',period:20,color:'#123456',width:2,anchor:'Month'},'1m',{vwapSeed:a})[0].points[0].value).toBe(20);
 expect(indicatorValues(visible,{id:'vwap',type:'VWAP',period:20,color:'#123456',width:2,anchor:'Month',source:'high'},'1m',{vwapSeed:a})[0].points[0].value).toBe(24);
 await book.read(request);expect(history).toHaveBeenCalledTimes(1);
});
it('withholds unavailable, incomplete, stale-basis and calendar-unverified prefixes',async()=>{
 for(const changes of [{complete:false},{basisDate:'2026-11-06'}]){
  const history=async():Promise<AlpacaHistoryResult>=>({symbol:'TEST',basisDate,feed:'sip',adjustment:'split',complete:true,nextPageToken:null,bars:input,...changes});
  await expect(new AlpacaVwapHistory({history},calendar,()=>now).read(request)).rejects.toThrow();
 }
 const history=async():Promise<AlpacaHistoryResult>=>({symbol:'TEST',basisDate,feed:'sip',adjustment:'split',complete:true,nextPageToken:null,bars:input});
 await expect(new AlpacaVwapHistory({history},{forBars:async()=>({available:false})},()=>now).read(request)).rejects.toThrow('vwap_calendar_unavailable');
});
it('supports HLCC4 warm-up and derives the same weighted sum from legacy seed fields',async()=>{
 const prefix=[{...input[0],high:16,low:6},{...input[1],high:24,low:12}];
 const history=async():Promise<AlpacaHistoryResult>=>({symbol:'TEST',basisDate,feed:'sip',adjustment:'split',complete:true,nextPageToken:null,bars:prefix});
 const seed=await new AlpacaVwapHistory({history},calendar,()=>now).read(request);
 expect(seed.sums.hlcc4).toBe(2950);
 expect(seed.moments?.hlcc4).toEqual({mean:14.75,m2:3612.5});
 const legacy={...seed,sums:{...seed.sums}};delete legacy.sums.hlcc4;
 expect(validVwapSeed(legacy,request,basisDate)).toBe(true);
 const study={id:'vwap',type:'VWAP' as const,period:20,color:'#123456',width:2 as const,anchor:'Month' as const,source:'hlcc4' as const};
 for(const vwapSeed of [seed,legacy])expect(indicatorValues([bar('2026-11-09T14:30:00Z',30)],study,'1m',{vwapSeed})[0].points[0].value).toBeCloseTo(119/6,12);
 expect(validVwapSeed({...legacy,sums:{...legacy.sums,hlcc4:-1}},request,basisDate)).toBe(false);
});
it('validates identity, timeframe, session flags and date and never accepts a mismatched seed',()=>{
 const query=new URLSearchParams({symbol:'TEST',timeframe:'1m',anchor:'Month',before:String(before),premarket:'1',regular:'1',postmarket:'1'});
 expect(parseVwapSeedRequest(query,now)).toEqual(request);
 for(const [key,value]of [['anchor','Invented'],['timeframe','2s'],['regular','true'],['before','-1']]){const bad=new URLSearchParams(query);bad.set(key,value);expect(()=>parseVwapSeedRequest(bad,now)).toThrow();}
 const empty={complete:true as const,request,basisDate,anchorKey:'2026-11',start:Date.parse('2026-11-01T04:00:00Z')/1000,volume:0,sums:{open:0,high:0,low:0,close:0,hl2:0,hlc3:0,ohlc4:0}};
 expect(validVwapSeed(empty,request,basisDate)).toBe(true);expect(validVwapSeed(empty,{...request,symbol:'OTHER'},basisDate)).toBe(false);expect(validVwapSeed(empty,request,'2026-11-10')).toBe(false);
});
