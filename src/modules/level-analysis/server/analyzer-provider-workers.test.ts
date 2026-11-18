import assert from "node:assert/strict";
import { test } from "vitest";
import { LogicalTradeAlpacaAnalyzerWorker } from "./logical-trade-alpaca-analyzer-worker";
import { LogicalTradeMoomooAnalyzerWorker } from "./logical-trade-moomoo-analyzer-worker";
import { newYorkExtendedSession } from "./daily-trade-analyzer-session";
import type { ClaimedLogicalTradeAnalyzerJob } from "./logical-trade-analyzer-repository";

const fixtures = [
  ["before reverse split", "0.14", "0.1324", "2400", "-18.24"],
  ["after reverse split", "2.96", "2.38", "100", "-58"],
  ["after forward split", "0.5", "0.6", "800", "80"],
  ["no split", "4", "5", "2000", "2000"],
] as const;

for (const provider of ["alpaca", "moomoo"] as const) {
  for (const [name, entry, exit, shares, pnl] of fixtures) {
    test(`${provider} retains exact fills, shares, P/L and minute anchors ${name}`, async () => {
      const day="2026-11-10", session=newYorkExtendedSession(day)!;
      const start=Date.parse(day+"T14:30:00Z")/1000, end=start+1200;
      const events=[
        {kind:"entry" as const,eventId:"buy",sequence:0,executedAtUtc:new Date(start*1000).toISOString(),
          feesDecimal:null,priceDecimal:entry,quantityDecimal:shares},
        {kind:"final_exit" as const,eventId:"sell",sequence:1,executedAtUtc:new Date(end*1000).toISOString(),
          feesDecimal:null,priceDecimal:exit,quantityDecimal:shares},
      ];
      const requester={userId:"trader",workspaceId:"workspace",accountId:"account",workspaceRole:"owner" as const};
      const designated={...requester,userId:"shared-owner",accountId:"shared-account"};
      const job: ClaimedLogicalTradeAnalyzerJob={
        jobId:"job",attemptCount:1,createdAtUtc:"2026-11-17T12:00:00.000Z",
        desiredCoverageEndUtc:new Date((end+1800)*1000).toISOString(),
        marketSessionSetId:"pinned-"+provider,scope:requester,
        target:{logicalTradeId:"trade",logicalTradeVersionId:"version",direction:"long",events,
          finalExitAtUtc:events[1].executedAtUtc,openedAtUtc:events[0].executedAtUtc,
          providerSymbol:"GOVX",representativeRoundTripId:"roundtrip",tradingDateNewYork:day},
      };
      const bars=Array.from({length:(session.endTime-session.startTime)/60},(_,i)=>{
        const time=session.startTime+i*60, price=time>=end ? exit : entry;
        return {time:time+(provider==="moomoo"?60:0),openDecimal:price,highDecimal:price,lowDecimal:price,
          closeDecimal:price,volumeDecimal:"100",turnoverDecimal:null};
      });
      type Args=ConstructorParameters<typeof LogicalTradeAlpacaAnalyzerWorker>;
      const saved: Parameters<Args[0]["persistResult"]>[0][]=[];
      const cached: Parameters<Args[1]["persistMarketSession"]>[0][]=[];
      const logical={
        claimNext: (_now:Date, selected="alpaca")=>{assert.equal(selected,provider);return job;},
        persistResult:(result:typeof saved[number])=>{saved.push(result);},
        finish:()=>{},
      };
      const candles={readCurrentCandles:()=>[],currentSessionVersionId:()=>null,currentSessionCoverageEnd:()=>null,
        persistMarketSession:(result:typeof cached[number])=>{cached.push(result);return "receipt";}};
      const allowances={designatedScope:()=>designated,release:()=>{},beginAcquisition:()=>({acquisitionId:"acquisition"}),
        completeAcquisition:()=>{}};
      const providerFor:Args[3]=async scope=>{
        assert.deepEqual(scope,provider==="moomoo"?designated:requester);
        return {fetch:async request=>{
          assert.equal(request.symbol,"GOVX");
          return {ok:true,candles:bars,requestCoverage:"complete",
            exchangeTimezone:"America/New_York",utcOffsetSeconds:-18000,normalizedCandleSha256:"receipt"};
        }};
      };
      const Worker=provider==="moomoo"?LogicalTradeMoomooAnalyzerWorker:LogicalTradeAlpacaAnalyzerWorker;
      const worker=new Worker(logical as unknown as Args[0],candles as unknown as Args[1],
        allowances as unknown as Args[2],providerFor,undefined,()=>new Date("2026-11-17T12:00:00Z"));
      assert.equal(await worker.runOne(),true);
      assert.equal(saved.length,1);
      assert.equal(saved[0].status,"ready");
      assert.equal(saved[0].analyzed?.greenToRed.finalPnlDecimal,pnl);
      assert.deepEqual(saved[0].analyzed?.eventSnapshots.map(({event})=>
        [event.priceDecimal,event.quantityDecimal,event.executedAtUtc]),events.map(event=>
        [event.priceDecimal,event.quantityDecimal,event.executedAtUtc]));
      assert.equal(saved[0].evidenceCandles?.find(bar=>bar.time===start)?.closeDecimal,entry);
      assert.equal(saved[0].evidenceCandles?.find(bar=>bar.time===end)?.closeDecimal,exit);
      assert.equal(cached[0].candles[0].time,session.startTime+(provider==="moomoo"?60:0));
      assert.equal(cached[0].marketSessionSetId,job.marketSessionSetId);
    });
  }
}
