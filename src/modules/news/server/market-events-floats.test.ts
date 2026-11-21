// @vitest-environment node
import {expect,it,vi} from "vitest";
import {readMarketEventsFloats} from "./market-events-floats";
it("uses daily scanner shares and only fills missing PR tickers from the same company profile as the sidecard",async()=>{
 const cached=vi.fn(async()=>({AAA:{shares:760000},UNREQUESTED:{shares:1}}));
 const profile=vi.fn(async(symbol:string)=>({ticker:symbol,floatingShare:1.7}));
 expect(await readMarketEventsFloats(["AAA","BBB","BBB"],{cached,profile})).toEqual({AAA:{shares:760000},BBB:{shares:1700000}});
 expect(profile).toHaveBeenCalledExactlyOnceWith("BBB");
});
it("falls back on a missing/offhours daily cache without fetching quotes or changing stored floats",async()=>{
 expect(await readMarketEventsFloats(["AAA"],{cached:async()=>{throw Error();},profile:async()=>({ticker:"AAA",floatingShare:0.26})})).toEqual({AAA:{shares:260000}});
});
it("keeps unknown, mismatched, invalid and fractional-share profiles unavailable",async()=>{
 for(const value of [null,{ticker:"OTHER",floatingShare:2},{ticker:"AAA",floatingShare:0},{ticker:"AAA",floatingShare:Infinity},{ticker:"AAA",floatingShare:0.0000005}])
 expect(await readMarketEventsFloats(["AAA"],{cached:async()=>({}),profile:async()=>value})).toEqual({});
});
it("bounds requests before either data source and isolates one profile failure",async()=>{
 const cached=vi.fn(async()=>({})),profile=vi.fn(async()=>null);
 await expect(readMarketEventsFloats(Array.from({length:11},(_,i)=>"A"+i),{cached,profile})).rejects.toThrow();
 await expect(readMarketEventsFloats(["invalid"],{cached,profile})).rejects.toThrow();
 expect(cached).not.toHaveBeenCalled();expect(profile).not.toHaveBeenCalled();
 expect(await readMarketEventsFloats(["AAA","BBB"],{cached,profile:async symbol=>{if(symbol==="AAA")throw Error();return{ticker:symbol,floatingShare:0.5};}})).toEqual({BBB:{shares:500000}});
});
