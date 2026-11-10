// @vitest-environment node
import {expect,it,vi} from 'vitest';
import {parseChartCalendarYear,readChartCalendarYear} from './chart-calendar-request';
import {AlpacaChartCalendar} from './chart-calendar-provider';
const rows=Array.from({length:252},(_,n)=>({date:new Date(Date.UTC(2027,0,1+n)).toISOString().slice(0,10),open:'09:30',close:'16:00'}));
it('validates exact calendar years and refuses partial or mismatched coverage',()=>{
 expect(parseChartCalendarYear(new URLSearchParams({year:'2027'}))).toBe(2027);
 for(const year of ['', '1969','2027.0','20270','abc'])expect(()=>parseChartCalendarYear(new URLSearchParams({year}))).toThrow();
 const complete={available:true,start:'2027-01-01',end:'2027-12-31',sessions:rows};
 expect(readChartCalendarYear(complete,2027)).toEqual(complete);
 for(const value of [{available:false},{...complete,start:'2026-01-01'},{...complete,sessions:rows.slice(0,10)},{...complete,sessions:[...rows,rows[0]]}])expect(()=>readChartCalendarYear(value,2027)).toThrow();
});
it('loads only the requested year, coalesces requests and preserves unavailable facts',async()=>{
 const transport=vi.fn<typeof fetch>(async()=>Response.json(rows));const provider=new AlpacaChartCalendar({keyId:'synthetic',secretKey:'synthetic'},transport);
 const [a,b]=await Promise.all([provider.forYear(2027),provider.forYear(2027)]);expect(a).toEqual(b);expect(a.available).toBe(true);expect(transport).toHaveBeenCalledTimes(1);
 expect(String(transport.mock.calls[0][0])).toBe('https://paper-api.alpaca.markets/v2/calendar?start=2027-01-01&end=2027-12-31');
 await provider.forYear(2027);expect(transport).toHaveBeenCalledTimes(1);
 const unavailable=new AlpacaChartCalendar({keyId:'synthetic',secretKey:'synthetic'},async()=>Response.json([]));expect(await unavailable.forYear(2030)).toEqual({available:false});
 await expect(provider.forYear(10000)).rejects.toThrow();
});
