// @vitest-environment node
import {expect,it,vi} from 'vitest';
import {AlpacaVwapCorporateEvents} from './chart-vwap-events';
const now=Date.parse('2026-11-09T20:00:00Z'),credentials={keyId:'synthetic',secretKey:'synthetic'};
const split=(id='one',extra:Record<string,unknown>={})=>({id,symbol:'TEST',ex_date:'2026-11-06',process_date:'2026-11-09',old_rate:20,new_rate:1,...extra});
it('paginates all event facts and uses ex-dates rather than processing dates',async()=>{
 const transport=vi.fn<typeof fetch>(async input=>{const url=new URL(String(input));return Response.json(url.searchParams.has('page_token')?{corporate_actions:{forward_splits:[split('two',{ex_date:'2026-11-02',old_rate:1,new_rate:3}),split('future',{ex_date:'2026-12-01'})]},next_page_token:null}:{corporate_actions:{reverse_splits:[split()]},next_page_token:'next'});});
 const book=new AlpacaVwapCorporateEvents(credentials,transport,()=>now);const value=await book.read('TEST','Splits');expect(value).toEqual({symbol:'TEST',anchor:'Splits',basisDate:'2026-11-09',dates:['2026-11-02','2026-11-06']});expect(transport).toHaveBeenCalledTimes(2);
 const url=new URL(String(transport.mock.calls[0][0]));expect(url.origin+url.pathname).toBe('https://data.alpaca.markets/v1/corporate-actions');expect(url.searchParams.get('types')).toBe('forward_split,reverse_split');expect(url.searchParams.get('data_quality')).toBe('complete');expect(url.searchParams.get('end')).toBe('2026-11-09');expect(transport.mock.calls[0][1]?.redirect).toBe('error');
 value.dates.length=0;expect((await book.read('TEST','Splits')).dates).toHaveLength(2);expect(transport).toHaveBeenCalledTimes(2);
});
it('coalesces readers without sharing mutable results and resets the cache on the next basis date',async()=>{
 let clock=now;const transport=vi.fn<typeof fetch>(async()=>Response.json({corporate_actions:{cash_dividends:[{id:'cash',symbol:'TEST',ex_date:'2026-11-06',process_date:'2026-11-09',rate:0.1}],stock_dividends:[{id:'stock',symbol:'TEST',ex_date:'2026-11-06',process_date:'2026-11-09',rate:0.2}]},next_page_token:null}));
 const book=new AlpacaVwapCorporateEvents(credentials,transport,()=>clock);const [a,b]=await Promise.all([book.read('TEST','Dividends'),book.read('TEST','Dividends')]);expect(transport).toHaveBeenCalledTimes(1);expect(a.dates).toEqual(['2026-11-06']);a.dates.length=0;expect(b.dates).toEqual(['2026-11-06']);clock+=86400000;expect((await book.read('TEST','Dividends')).basisDate).toBe('2026-11-10');expect(transport).toHaveBeenCalledTimes(2);
});
it.each([
 {corporate_actions:{reverse_splits:[split('bad',{symbol:'OTHER'})]}},
 {corporate_actions:{reverse_splits:[split('bad',{ex_date:null})]}},
 {corporate_actions:{reverse_splits:[split('bad',{old_rate:0})]}},
 {corporate_actions:{reverse_splits:[split('bad',{process_date:'2026-12-01'})]}},
 {corporate_actions:{cash_dividends:[{id:'wrong'}]}},
 {corporate_actions:{reverse_splits:[split(),split('one',{ex_date:'2026-11-02'})]}},
 {corporate_actions:null},
])('rejects contradictory, incomplete or misrouted event facts',async payload=>{
 const book=new AlpacaVwapCorporateEvents(credentials,async()=>Response.json(payload),()=>now);await expect(book.read('TEST','Splits')).rejects.toThrow();
});
it('rejects repeated pagination tokens and refuses to publish partial results after a failed later page',async()=>{
 const loop=new AlpacaVwapCorporateEvents(credentials,async()=>Response.json({corporate_actions:{reverse_splits:[split()]},next_page_token:'same'}),()=>now);await expect(loop.read('TEST','Splits')).rejects.toThrow('pagination');
 let count=0;const partial=new AlpacaVwapCorporateEvents(credentials,async()=>++count===1?Response.json({corporate_actions:{reverse_splits:[split()]},next_page_token:'more'}):new Response('',{status:403}),()=>now);await expect(partial.read('TEST','Splits')).rejects.toThrow();
});
it('distinguishes a complete empty event list from a provider error',async()=>{
 const empty=new AlpacaVwapCorporateEvents(credentials,async()=>Response.json({corporate_actions:{},next_page_token:null}),()=>now);expect((await empty.read('TEST','Splits')).dates).toEqual([]);
 const denied=new AlpacaVwapCorporateEvents(credentials,async()=>new Response('',{status:403}),()=>now);await expect(denied.read('TEST','Splits')).rejects.toThrow();
});
it('bounds concurrent provider reads and releases its pending slot after failures',async()=>{
 const resolvers:Array<(response:Response)=>void>=[];const transport=vi.fn<typeof fetch>(()=>new Promise(resolve=>resolvers.push(resolve)));const book=new AlpacaVwapCorporateEvents(credentials,transport,()=>now);
 const first=book.read('ONE','Splits'),second=book.read('TWO','Dividends');await expect(book.read('THREE','Splits')).rejects.toThrow('busy');expect(transport).toHaveBeenCalledTimes(2);
 resolvers[0](new Response('',{status:403}));await expect(first).rejects.toThrow();resolvers[1](Response.json({corporate_actions:{},next_page_token:null}));await second;
 const next=book.read('THREE','Splits');expect(transport).toHaveBeenCalledTimes(3);resolvers[2](Response.json({corporate_actions:{},next_page_token:null}));await next;
});
it('refuses unbounded pagination and discards facts across an adjustment-basis date rollover',async()=>{
 let count=0;const transport=vi.fn<typeof fetch>(async()=>Response.json({corporate_actions:{},next_page_token:String(++count)}));await expect(new AlpacaVwapCorporateEvents(credentials,transport,()=>now).read('TEST','Splits')).rejects.toThrow('incomplete');expect(transport).toHaveBeenCalledTimes(32);
 let clock=now;const rollover=new AlpacaVwapCorporateEvents(credentials,async()=>{clock+=86400000;return Response.json({corporate_actions:{reverse_splits:[split()]},next_page_token:null});},()=>clock);await expect(rollover.read('TEST','Splits')).rejects.toThrow('unavailable');
});
