import { describe, expect, it, vi } from "vitest";
import { LiveScannerFeed } from "./server/live-feed";
import { initialConfiguration } from "./settings";
import type { DailyUniverse } from "./contracts";
import type { ScannerAuditCycle } from "./audit/contracts";

describe("decline scanner shares the existing provider pass",()=>{
  it("adds both lists, news and recorded episode evidence without another quote or float request",async()=>{
    let now=Date.parse("2026-11-02T21:00:00Z"),price=2;
    const universe:DailyUniverse={version:1,tradingDate:"2026-11-02",acceptedAtUtc:new Date(now).toISOString(),lastCollectionAtUtc:new Date(now).toISOString(),latestUploadCount:1,sourceHashes:[],stocks:[{symbol:"AAA",exchange:"NASDAQ",marketCapAtCollection:1e6}]};
    const snapshots=vi.fn(async()=>[{requestedSymbols:["AAA"],receivedAt:now,payload:{ret_code:0,data:{snapshot_list:[{
      code:"US.AAA",name:"Synthetic AAA",data_date:universe.tradingDate,update_time:now,last_price:2,prev_close_price:3,
      after_price:price,after_volume:1000,after_turnover:2000,bid_price:.1,ask_price:3,pre_high_price:3.1,pre_volume:13270,
    }]}}}]);
    const floats=vi.fn(async()=>new Map()),reserve=vi.fn(async()=>{});
    const news=vi.fn(async(symbols:readonly string[])=>{
      expect(symbols).toEqual([...new Set(symbols)]);
      return new Map([["AAA",[{id:"synthetic",headline:"Synthetic news",createdAt:new Date(now).toISOString(),typeLabel:"PR",url:null}]]]);
    });
    const audit=vi.fn<(cycle:ScannerAuditCycle)=>void>();
    const feed=new LiveScannerFeed({configuration:async()=>({...initialConfiguration(),enabled:true}),
      marketDay:async()=>({date:universe.tradingDate,verified:true,open:true,regularCloseEastern:"16:00",extendedCloseEastern:"20:00"}),
      universe:async()=>universe,now:()=>now,snapshotPass:snapshots,floats,news,reserveScannerBudget:reserve,
      audit:{enqueue:audit},qualification:()=>({sessionTimestampVerified:true,sessionCountersVerified:true,
        afterHoursRegularCloseVerified:false,priceTimeBasis:"session_observation"})});
    await feed.scanOnce();now+=60000;price=1.2;const result=await feed.scanOnce();
    expect(snapshots).toHaveBeenCalledTimes(2);expect(floats).toHaveBeenCalledTimes(2);expect(reserve).toHaveBeenCalledTimes(2);
    expect(news).toHaveBeenCalledTimes(2);expect(news.mock.calls[1][0]).toEqual(["AAA"]);
    expect(result.declines!.rapid[0].drop!.dropPercent).toBeCloseTo(-40);
    expect(result.declines!.losers[0].changePercent).toBeCloseTo(-40);
    expect(result.declines!.rapid[0].news[0].headline).toBe("Synthetic news");
    expect(result.gainers.rows).toHaveLength(0); // Existing float requirement unchanged.
    expect(result.premarketPullbacks!.rows[0]).toMatchObject({premarketHigh:3.1,premarketVolume:13270,price:1.2});
    expect(result.premarketPullbacks!.rows[0].news[0].headline).toBe("Synthetic news");
    expect(audit.mock.calls[1][0].premarketPullbacks!.rows[0].backToHighPercent).toBeCloseTo((3.1/1.2-1)*100);
    expect(audit.mock.calls[1][0].declines!.rapid[0].drop!.startPrice).toBe(2);
  });
});
