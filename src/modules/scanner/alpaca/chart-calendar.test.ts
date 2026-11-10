// @vitest-environment node
import {expect,it,vi} from 'vitest';
import {AlpacaChartCalendar} from './chart-calendar-provider';
import {ChartSessionCalendar,parseCalendarSessions} from './chart-calendar';
import {DEFAULT_CHART_PREFERENCES} from './chart-preferences';
import {visibleSessionBars,indicatorValues} from './chart-indicators';
import {aggregateCandles,candleBucket,type Candle} from './candles';
it('looks up numeric day intervals across DST, excludes closed dates and refreshes amended sessions',()=>{
 const calendar=new ChartSessionCalendar();calendar.merge({available:true,start:'2026-10-30',end:'2026-11-02',sessions:[{date:'2026-10-30',open:'09:30',close:'16:00'},{date:'2026-11-02',open:'09:30',close:'16:00'}]});
 expect(calendar.sessionAt(NaN)).toBeNull();
 expect(calendar.sessionAt(Date.parse('2026-10-30T04:00:00Z')/1000)?.session.date).toBe('2026-10-30');
 expect(calendar.sessionAt(Date.parse('2026-10-31T04:00:00Z')/1000)).toBeNull();
 expect(calendar.sessionAt(Date.parse('2026-11-02T04:59:59Z')/1000)).toBeNull();
 expect(calendar.sessionAt(Date.parse('2026-11-02T05:00:00Z')/1000)?.start).toBe(Date.parse('2026-11-02T05:00:00Z')/1000);
 calendar.merge({available:true,start:'2026-11-02',end:'2026-11-02',sessions:[{date:'2026-11-02',open:'09:30',close:'13:00'}]});
 expect(calendar.sessionAt(Date.parse('2026-11-02T18:00:00Z')/1000)?.closeMinute).toBe(780);
});
const bar=(date:string,time:string,price:number):Candle=>({time:Date.parse(`${date}T${time}:00Z`)/1000,open:price,high:price,low:price,close:price,volume:100});
it('uses verified early-close boundaries for regular and extended VWAP inputs',()=>{
 const calendar=new ChartSessionCalendar();calendar.merge({available:true,start:'2026-01-01',end:'2026-12-31',sessions:[{date:'2026-11-27',open:'09:30',close:'13:00'}]});
 const bars=[bar('2026-11-27','14:30',10),bar('2026-11-27','17:59',20),bar('2026-11-27','18:00',40),bar('2026-11-27','21:59',80),bar('2026-11-27','22:00',900)];
 const regular=visibleSessionBars(bars,{...DEFAULT_CHART_PREFERENCES,premarket:false,postmarket:false},calendar);
 expect(regular.map(b=>b.close)).toEqual([10,20]);
 expect(indicatorValues(regular,{id:'vwap',type:'VWAP',period:20,color:'#123456',width:2})[0].points.at(-1)?.value).toBe(15);
 expect(visibleSessionBars(bars,DEFAULT_CHART_PREFERENCES,calendar).map(b=>b.close)).toEqual([10,20,40,80]);
 expect(calendar.covers(bars[0].time)).toBe(true);expect(calendar.covers(bar('2025-11-27','15:00',10).time)).toBe(false);
});
it('treats covered holidays as closed and ignores malformed calendar metadata',()=>{
 const calendar=new ChartSessionCalendar();calendar.merge({available:true,start:'2026-01-01',end:'2026-12-31',sessions:[]});
 expect(visibleSessionBars([bar('2026-11-26','15:00',10)],DEFAULT_CHART_PREFERENCES,calendar)).toEqual([]);
 calendar.merge({available:true,start:'2026-01-01',end:'2026-12-31',sessions:[{date:'2026-11-27',open:'09:30',close:'invented'}]});expect(calendar.session('2026-11-27')).toBeNull();
 expect(()=>parseCalendarSessions([{date:'2026-11-27',open:'09:30',close:'12:00'}],'2026-01-01','2026-12-31')).toThrow();
});
it('coalesces calendar-only provider queries, caches complete years and bounds unverified responses',async()=>{
 const rows=Array.from({length:252},(_,n)=>{const date=new Date(Date.UTC(2026,0,1+n)).toISOString().slice(0,10);return {date,open:'09:30',close:'16:00'};});
 const transport=vi.fn<typeof fetch>(async()=>Response.json(rows));const calendar=new AlpacaChartCalendar({keyId:'synthetic',secretKey:'synthetic'},transport);
 const input=[bar('2026-01-05','15:00',10)];const [a,b]=await Promise.all([calendar.forBars(input),calendar.forBars(input)]);
 expect(a.available).toBe(true);expect(b.available).toBe(true);expect(transport).toHaveBeenCalledTimes(1);
 expect(String(transport.mock.calls[0][0])).toBe('https://paper-api.alpaca.markets/v2/calendar?start=2026-01-01&end=2026-12-31');
 await calendar.forBars(input);expect(transport).toHaveBeenCalledTimes(1);
 const bad=new AlpacaChartCalendar({keyId:'synthetic',secretKey:'synthetic'},async()=>Response.json([]));expect(await bad.forBars(input)).toEqual({available:false});
});

it('anchors regular hourly/four-hour candles at 09:30 across DST before calculating VWAP',()=>{
 for(const [date,utcOpen]of [['2026-10-30','13:30'],['2026-11-06','14:30']]){
  const first=bar(date,utcOpen,10),second={...first,time:first.time+30*60,open:20,high:20,low:20,close:20};
  expect(candleBucket(first.time,'1h',true)).toBe(first.time);
  expect(candleBucket(second.time,'1h',true)).toBe(first.time);
  expect(candleBucket(first.time,'4h',true)).toBe(first.time);
  const grouped=aggregateCandles([first,second],'1h',true);
  expect(grouped).toHaveLength(1);expect(grouped[0]).toMatchObject({time:first.time,open:10,high:20,low:10,close:20,volume:200});
  expect(indicatorValues(grouped,{id:'vwap',type:'VWAP',period:20,color:'#123456',width:2})[0].points[0].value).toBeCloseTo(50/3);
 }
});
