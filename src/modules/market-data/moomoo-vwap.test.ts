import { expect,it } from "vitest";
import { AlpacaVwapHistory } from "@/src/modules/scanner/alpaca/chart-vwap-history";
import { validVwapSeed,type VwapSeedRequest } from "@/src/modules/scanner/alpaca/chart-vwap-seed";
it("uses the same verified VWAP calculation with truthful Moomoo history identity",async()=>{
 const now=()=>Date.parse("2026-11-17T16:00:00Z"),at=(value:string)=>Date.parse(value)/1000;
 const request:VwapSeedRequest={symbol:"AAA",timeframe:"1m",anchor:"Session",before:at("2026-11-17T15:00:00Z"),premarket:true,regular:true,postmarket:true};
 const history={history:async()=>({feed:"moomoo",complete:true,basisDate:"2026-11-17",symbol:"AAA",adjustment:"split" as const,nextPageToken:null,bars:[{time:at("2026-11-17T14:30:00Z"),open:10,high:10,low:10,close:10,volume:100},{time:at("2026-11-17T14:31:00Z"),open:20,high:20,low:20,close:20,volume:200}]})};
 const calendar={forBars:async()=>({available:true as const,start:"2026-11-17",end:"2026-11-17",sessions:[{date:"2026-11-17",open:"09:30",close:"16:00"}]})};
 const seed=await new AlpacaVwapHistory(history,calendar,now,undefined,"moomoo").read(request);
 expect(validVwapSeed(seed,request,"2026-11-17")).toBe(true);expect(seed.volume).toBe(300);expect(seed.sums.hlc3/seed.volume).toBeCloseTo(50/3);
 await expect(new AlpacaVwapHistory(history,calendar,now).read(request)).rejects.toThrow("vwap_history_unavailable");
});
