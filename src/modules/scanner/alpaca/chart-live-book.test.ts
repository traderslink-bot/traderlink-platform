// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { ChartLiveBook } from "./chart-live-book";
const now = Date.parse("2026-11-09T15:30:30Z");
const trade = (i: number, seconds: number, p: number, s = 10, c = ["@"]): Record<string, unknown> => ({T:"t",S:"AAA",t:new Date(now-30_000+seconds*1000).toISOString(),p,s,i,x:"V",c,z:"C"});
describe("live chart minute construction", () => {
  it("merges startup history and concurrent trades once, preserves order, volume-only conditions and next-minute movement", async () => {
    let complete!: (value: unknown) => void;
    const get = vi.fn(() => new Promise<unknown>(resolve => { complete=resolve; }));
    const book = new ChartLiveBook("AAA", {get});
    const warm = book.warm(now);
    book.observe(trade(2,31,3)); book.observe(trade(1,10,2));
    expect(book.drain()).toEqual([]);
    complete({trades:{AAA:[trade(1,10,2)]}}); await warm;
    expect(book.drain()).toEqual([{time:now/1000-30,open:2,high:3,low:2,close:3,volume:20}]);
    book.observe(trade(3,20,1)); book.observe(trade(4,32,100,5,["I"]));
    expect(book.drain()[0]).toMatchObject({open:2,high:3,low:1,close:3,volume:35});
    book.observe(trade(5,60,4,20));
    expect(book.drain()[0]).toMatchObject({time:now/1000+30,open:4,close:4,volume:20});
    const query=get.mock.calls[0]; expect(query).toBeDefined();
  });
  it("does not overwrite an official closed candle with late trades", async () => {
    const book=new ChartLiveBook("AAA",{get:async()=>({trades:{AAA:[]}})});
    await book.warm(now); book.observe(trade(1,10,2)); book.seal(now/1000-30); book.observe(trade(2,20,9));
    expect(book.drain()).toEqual([]);
    book.observe(trade(3,60,3)); expect(book.drain()[0].close).toBe(3);
  });
  it("requires complete pagination and deduplicates the bootstrap overlap", async () => {
    const get=vi.fn().mockResolvedValueOnce({trades:{AAA:[trade(1,10,2)]},next_page_token:"next"}).mockResolvedValueOnce({trades:{AAA:[trade(2,20,3)]}});
    const book=new ChartLiveBook("AAA",{get}); book.observe(trade(2,20,3)); await book.warm(now);
    expect(get.mock.calls[1][1].get("page_token")).toBe("next"); expect(book.drain()[0].volume).toBe(20);
    const failed=new ChartLiveBook("AAA",{get:async()=>({trades:{AAA:[trade(1,10,2)]},next_page_token:"loop"})});
    await failed.warm(now); expect(failed.drain()).toEqual([]);
  });
  it("discards in-flight bootstrap on disconnect/correction and rejects unknown conditions", async () => {
    let complete!: (value:unknown)=>void;
    const book=new ChartLiveBook("AAA",{get:()=>new Promise(resolve=>{complete=resolve;})});
    const warm=book.warm(now); book.invalidate(); complete({trades:{AAA:[trade(1,10,2)]}}); await warm; expect(book.drain()).toEqual([]);
    const fresh=new ChartLiveBook("AAA",{get:async()=>({trades:{AAA:[]}})}); await fresh.warm(now);
    fresh.observe(trade(1,10,2)); fresh.observe(trade(2,20,9,10,["unknown"])); expect(fresh.drain()).toEqual([]);
  });
});

it("builds a live daily candle using daily SIP rules without counting extended-hours prices or volume twice",async()=>{
 const time=Date.parse("2026-11-09T15:30:30Z");
 const dayTrade=(i:number,t:string,p:number,s:number,c:string[])=>({T:"t",S:"AAA",i,t,p,s,c,x:"V",z:"C"});
 const history=[dayTrade(1,"2026-11-09T13:00:00Z",8,20,["T"]),dayTrade(2,"2026-11-09T14:30:00Z",10,100,["@"]),dayTrade(3,"2026-11-09T15:00:00Z",15,50,["P"])];
 const book=new ChartLiveBook("AAA",{get:async()=>({trades:{AAA:history}})},true);
 book.observe(history[1]);await book.warm(time);
 expect(book.drain()).toEqual([{time:Date.parse("2026-11-09T05:00:00Z")/1000,open:10,high:15,low:10,close:10,volume:170}]);
 book.observe(dayTrade(4,"2026-11-09T15:30:31Z",11,30,["@"]));
 expect(book.drain()[0]).toMatchObject({open:10,close:11,high:15,volume:200});
 book.observe(dayTrade(5,"2026-11-09T21:00:01Z",100,40,["T"]));
 expect(book.drain()[0]).toMatchObject({close:11,high:15,volume:240});
 expect(book.covers(Date.parse("2026-11-09T05:00:00Z")/1000)).toBe(true);
});

it("never carries the old daily candle into the next Eastern date",async()=>{
 const oldNow=Date.parse("2026-11-10T04:59:50Z");
 const get=vi.fn(async(path:string,parameters:URLSearchParams)=>{expect(path).toBe("/v2/stocks/trades");expect(parameters.get("feed")).toBe("sip");return{trades:{AAA:[]}};});const book=new ChartLiveBook("AAA",{get},true);await book.warm(oldNow);
 book.observe({T:"t",S:"AAA",i:1,x:"V",p:2,s:10,t:"2026-11-10T05:00:01Z",c:["@"],z:"C"});
 expect(book.snapshot()).toEqual([]);await book.warm(Date.parse("2026-11-10T05:00:02Z"));
 expect(get.mock.calls[1][1].get("start")).toBe("2026-11-10T05:00:00.000Z");
});

it("finishes a large daily bootstrap without quadratic identity eviction or per-trade timezone work",async()=>{
 const now=Date.parse("2026-11-09T15:30:30Z");let page=0;
 const book=new ChartLiveBook("AAA",{get:async()=>{const index=page++;return{trades:{AAA:Array.from({length:10000},(_,i)=>({T:"t",S:"AAA",i:index*10000+i,x:"V",p:2,s:1,t:"2026-11-09T15:00:00.123456789Z",c:["@"],z:"C"}))},next_page_token:index<19?String(index+1):null};}},true);
 const began=performance.now();await book.warm(now);const elapsed=performance.now()-began;
 expect(book.snapshot()[0]).toMatchObject({open:2,close:2,volume:200000});
 book.observe({T:"t",S:"AAA",i:199999,x:"V",p:2,s:1,t:"2026-11-09T15:00:00.123456789Z",c:["@"],z:"C"});expect(book.drain()[0].volume).toBe(200000);
 book.observe({T:"t",S:"AAA",i:200000,x:"V",p:3,s:5,t:"2026-11-09T15:30:31Z",c:["@"],z:"C"});expect(book.drain()[0]).toMatchObject({close:3,volume:200005});
 expect(elapsed).toBeLessThan(3000);
});
