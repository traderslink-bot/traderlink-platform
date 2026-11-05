import {describe,expect,it,vi} from "vitest";
import {collectNasdaqUniverseUpload,NasdaqUniverseRefresher} from "./nasdaq-universe-source";
import {validateUniverseUpload} from "../universe-validation";

const NOW=Date.parse("2026-11-03T08:00:00Z");
const rows=Array.from({length:100},(_,index)=>({symbol:`T${index}`,marketCap:String(1_000_000+index)}));
const request=vi.fn(async(input:string|URL|Request)=>{
  const exchange=new URL(String(input)).searchParams.get("exchange");
  return Response.json({data:{rows:exchange==="nasdaq"?[...rows,{symbol:"BLZE",marketCap:"458060000.00"},{symbol:"ABCDW",marketCap:"9000000"},{symbol:"TOOBIG",marketCap:"600000000"}]:[{symbol:"NYSEA",marketCap:"90000000"}]}});
});

describe("Nasdaq scanner universe source",()=>{
  it("collects a validated Nasdaq and NYSE universe through the $500M ceiling",async()=>{
    const upload=await collectNasdaqUniverseUpload({tradingDate:"2026-11-03",request:request as typeof fetch,now:()=>NOW});
    const checked=validateUniverseUpload(upload,NOW);
    expect(checked.stocks.find(stock=>stock.symbol==="BLZE")).toMatchObject({exchange:"NASDAQ",marketCapAtCollection:458060000});
    expect(checked.stocks.some(stock=>stock.symbol==="TOOBIG")).toBe(false);
    expect(checked.stocks.some(stock=>stock.symbol==="NYSEA")).toBe(true);
    expect(checked.stocks.some(stock=>stock.symbol==="ABCDW")).toBe(false);
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("imports once per trading date",async()=>{
    const save=vi.fn(async()=>({}));
    const source=new NasdaqUniverseRefresher({store:{import:save},request:request as typeof fetch,now:()=>NOW});
    await source.refresh("2026-11-03");await source.refresh("2026-11-03");
    expect(save).toHaveBeenCalledTimes(1);
  });
});
