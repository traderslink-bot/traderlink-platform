// @vitest-environment node
import {expect,it,vi} from 'vitest';
import {ChartCalculationHistory} from './chart-calculation-history';
import type {Candle} from './candles';
const bar=(time:number,close=10):Candle=>({time,open:close,high:close,low:close,close,volume:100});
const reply=(bars:Candle[],nextBefore:number|null=null,basisDate='2026-11-09')=>Response.json({bars,nextBefore,basisDate});

it('shares minute history across intraday calculations but keeps provider daily candles independent',async()=>{
 const fetcher=vi.fn(async(url:string)=>reply([bar(100,url.includes('daily=1')?40:10)]));
 const loader=new ChartCalculationHistory('NWGL',new AbortController().signal,()=> '2026-11-09',fetcher);
 for(const frame of ['1m','5m','15m','1h','4h'] as const)expect((await loader.read(frame,100)).bars[0].close).toBe(10);
 expect((await loader.read('1D',100)).bars[0].close).toBe(40);
 expect(fetcher).toHaveBeenCalledTimes(2);
});

it('coalesces initial reads and pages to the visible chart boundary without dropping live corrections',async()=>{
 let resolve!:(response:Response)=>void;
 const fetcher=vi.fn().mockImplementationOnce(()=>new Promise<Response>(done=>{resolve=done;})).mockResolvedValueOnce(reply([bar(100)],50));
 const loader=new ChartCalculationHistory('NWGL',new AbortController().signal,()=> '2026-11-09',fetcher);
 const a=loader.read('5m',100),b=loader.read('4h',100);
 loader.acceptLive(bar(200,15),false);
 resolve(reply([bar(200,10)],150));
 expect((await a).bars.map(row=>row.close)).toEqual([10,15]);
 expect((await b).bars.map(row=>row.close)).toEqual([10,15]);
 expect(fetcher).toHaveBeenCalledTimes(2);
 expect(fetcher.mock.calls[1][0]).toContain('before=150');
});

it('still loads historical data when a live bar arrives before the first read',async()=>{
 const fetcher=vi.fn(async()=>reply([bar(100)]));
 const loader=new ChartCalculationHistory('NWGL',new AbortController().signal,()=> '2026-11-09',fetcher);
 loader.acceptLive(bar(200),false);
 expect((await loader.read('1m',100)).bars.map(row=>row.time)).toEqual([100,200]);
 expect(fetcher).toHaveBeenCalledTimes(1);
});

it('rejects a changing adjustment basis and reinitializes the next request',async()=>{
 let basis='2026-11-09';
 const fetcher=vi.fn(async()=>{basis='2026-11-10';return reply([bar(100)]);});
 const loader=new ChartCalculationHistory('NWGL',new AbortController().signal,()=>basis,fetcher);
 await expect(loader.read('1D',100)).rejects.toThrow('basis_changed');
 fetcher.mockImplementation(async()=>reply([bar(100,20)],null,basis));
 expect((await loader.read('1D',100)).bars[0].close).toBe(20);
});

it('rejects stalled pagination, malformed bars and post-abort responses',async()=>{
 const controller=new AbortController();
 const fetcher=vi.fn().mockResolvedValueOnce(reply([bar(300)],200)).mockResolvedValueOnce(reply([bar(250)],200));
 const loader=new ChartCalculationHistory('NWGL',controller.signal,()=> '2026-11-09',fetcher);
 await expect(loader.read('1m',100)).rejects.toThrow('cursor_stalled');
 fetcher.mockResolvedValueOnce(reply([{...bar(100),volume:-1}]));
 await expect(loader.read('1D',100)).rejects.toThrow('invalid_calculation_history');
 controller.abort();
 await expect(loader.read('1m',100)).rejects.toThrow('aborted');
});

it('does not admit an old in-flight response after reconnect invalidation',async()=>{
 let resolve!:(response:Response)=>void;
 const fetcher=vi.fn().mockImplementationOnce(()=>new Promise<Response>(done=>{resolve=done;})).mockResolvedValueOnce(reply([bar(100,25)]));
 const loader=new ChartCalculationHistory('NWGL',new AbortController().signal,()=> '2026-11-09',fetcher);
 const obsolete=loader.read('1D',100);
 loader.invalidate();
 const current=await loader.read('1D',100);
 resolve(reply([bar(100,10)]));
 await expect(obsolete).rejects.toThrow('invalidated');
 expect(current.bars[0].close).toBe(25);
 expect((await loader.read('1D',100)).bars[0].close).toBe(25);
});
it('starts an old viewport at its own history endpoint and excludes later live bars',async()=>{
 const fetcher=vi.fn(async(_url:string)=>reply([bar(100)]));
 const loader=new ChartCalculationHistory('NWGL',new AbortController().signal,()=> '2026-11-09',fetcher);
 expect((await loader.read('1m',100,150)).bars.map(row=>row.time)).toEqual([100]);
 expect(fetcher.mock.calls[0][0]).toContain('before=150000');
 loader.acceptLive(bar(200),false);
 expect((await loader.read('5m',100,150)).bars.map(row=>row.time)).toEqual([100]);
 expect(fetcher).toHaveBeenCalledTimes(1);
 await loader.read('1m',100,250);expect(fetcher).toHaveBeenCalledTimes(2);
});
it('accepts a normal hundred-session extended-hours window without the old 80k cap',async()=>{
 const rows=Array.from({length:96000},(_,n)=>bar(100+n*60));
 const loader=new ChartCalculationHistory('NWGL',new AbortController().signal,()=> '2026-11-09',async()=>reply(rows));
 expect((await loader.read('1m',100)).bars).toHaveLength(96000);
});
it('cancels obsolete network work when the user pans to a different historical window',async()=>{
 let oldSignal:AbortSignal|null=null;
 const fetcher=vi.fn().mockImplementationOnce((_url:string,init:RequestInit)=>new Promise<Response>((_resolve,reject)=>{
  oldSignal=init.signal as AbortSignal;oldSignal.addEventListener('abort',()=>reject(Error('aborted')),{once:true});
 })).mockResolvedValueOnce(reply([bar(100)]));
 const loader=new ChartCalculationHistory('NWGL',new AbortController().signal,()=> '2026-11-09',fetcher);
 const obsolete=expect(loader.read('1m',100,150)).rejects.toThrow('invalidated');
 const current=await loader.read('1m',100,250);
 await obsolete;expect(oldSignal!.aborted).toBe(true);expect(current.bars).toHaveLength(1);
});
