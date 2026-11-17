import assert from "node:assert/strict";
import { test } from "vitest";
import { MoomooChartHistory } from "@/src/modules/market-data/server/moomoo-chart-history";
import { TrendMomentumHistoryService } from "./trend-momentum-history-service";
import type { TrendMomentumHistoryRepository } from "./trend-momentum-history-repository";
import type { SharedAnalyzerAllowanceRepository } from "./shared-analyzer-allowance-repository";
import type { ClaimedLogicalTradeAnalyzerJob } from "./logical-trade-analyzer-repository";
import type { MarketDataProviderResult, NormalizedMarketCandle } from "../contracts/candle-review-contracts";
import { newYorkExtendedSession } from "./daily-trade-analyzer-session";

for (const scenario of ["new", "refresh", "expired"] as const) test("worker history requests bounded ranges and reuses evidence; " + scenario, async () => {
  const session = newYorkExtendedSession("2026-09-11")!;
  let now = new Date((session.endTime + 3600) * 1000);
  const requestStartedAt = scenario === "expired" ? "2026-09-01T12:00:00Z" : now.toISOString();
  const ranges: { start: number; endExclusive: number }[] = [];
  const candles: NormalizedMarketCandle[] = [];
  const requests: { id: string; range: { start: number; endExclusive: number }; result?: MarketDataProviderResult }[] = [];
  const history = {
    recoverInterrupted: () => 0,
    compatibleEvidence: () => ({ ranges, candles }),
    read: () => requests.map((r) => ({ requested_start_seconds: r.range.start, requested_end_seconds: r.range.endExclusive,
      status: r.result ? "complete" : "requested", completed_at_utc: r.result ? now.toISOString() : null })),
    begin: ({ range }: {range: {start:number;endExclusive:number}}) => {
      const id = String(requests.length); requests.push({ id, range }); return id;
    },
    finish: ({ requestId, result }: {requestId:string;result:MarketDataProviderResult}) => {
      const request = requests.find((r) => r.id === requestId)!;
      request.result = result;
      if (result.ok && result.requestCoverage === "complete") { ranges.push(request.range); candles.push(...result.candles); }
      return true;
    },
  } as unknown as TrendMomentumHistoryRepository;
  let acquisitions = 0;
  const allowance = {
    designatedScope: () => ({ userId: "user", workspaceId: "workspace", accountId: "account", workspaceRole: "owner" }),
    hasHistoryReservation: () => true,
    historyRequestStartedAt: () => requestStartedAt,
    beginAcquisition: () => ({ acquisitionId: String(++acquisitions) }),
    completeAcquisition: () => {},
  } as unknown as SharedAnalyzerAllowanceRepository;
  const service = new TrendMomentumHistoryService(history, allowance, async () => ({
    fetch: async (range) => ({ ok: true as const, requestCoverage: "complete" as const,
      candles: Array.from({ length: Math.min(600, (range.endTime - range.startTime) / 60) }, (_, i) => ({
        time: range.startTime + i * 60, openDecimal: "10", highDecimal: "10", lowDecimal: "10",
        closeDecimal: "10", volumeDecimal: "100", turnoverDecimal: "1000",
      })), exchangeTimezone: "America/New_York", utcOffsetSeconds: -14400, normalizedCandleSha256: "fixture" }),
  }), () => now);
  const job = { jobId: "job", createdAtUtc: scenario !== "new" ? "2026-09-01T12:00:00Z" : now.toISOString(), marketSessionSetId: "session",
    scope: { userId: "user", workspaceId: "workspace", accountId: "account", workspaceRole: "owner" },
    target: { tradingDateNewYork: "2026-09-11", providerSymbol: "TEST",
      events: [{ eventId: "entry", executedAtUtc: new Date((session.startTime + 3600) * 1000).toISOString() }] },
  } as unknown as ClaimedLogicalTradeAnalyzerJob;
  const asOf = session.startTime + 7200;
  if (scenario === "expired") {
    const expired = await service.prepare(job, asOf);
    assert.equal(expired.pending, false);
    if (!expired.pending) assert.equal(expired.outcome, "provider_unavailable");
    assert.equal(acquisitions, 0);
    assert.equal(requests.length, 0);
    return;
  }
  for (let pass = 0; pass < 3; pass++) {
    assert.equal((await service.prepare(job, asOf)).pending, true);
    now = new Date(now.getTime() + 60_000);
  }
  const ready = await service.prepare(job, asOf);
  assert.equal(ready.pending, false);
  if (!ready.pending) assert.equal(ready.outcome, "complete");
  assert.equal(acquisitions, 3);
  assert.equal((await service.prepare(job, asOf)).pending, false);
  assert.equal(acquisitions, 3);
  assert.ok(requests.every((r) => r.range.endExclusive - r.range.start <= 86400));
});

test("Alpaca warmup excludes pre-split evidence for an effective split date", async () => {
  const day = "2026-09-11";
  const session = newYorkExtendedSession(day)!;
  const asOf = session.startTime + 7200;
  const reads: unknown[][] = [];
  const history = {
    recoverInterrupted: () => 0,
    compatibleEvidence: (...args: unknown[]) => {
      reads.push(args);
      return { ranges: [{ start: session.startTime, endExclusive: asOf }], candles: [] };
    },
    read: () => [],
  } as unknown as TrendMomentumHistoryRepository;
  const allowance = {} as SharedAnalyzerAllowanceRepository;
  const job = {
    jobId: "job", scope: { userId: "user", workspaceId: "workspace", accountId: "account" },
    target: { tradingDateNewYork: day, providerSymbol: "TEST", events: [
      { executedAtUtc: new Date((session.startTime + 3600) * 1000).toISOString() },
    ] },
  } as unknown as ClaimedLogicalTradeAnalyzerJob;
  const service = new TrendMomentumHistoryService(history, allowance,
    async () => { throw new Error("No prior-basis download expected"); },
    () => new Date(asOf * 1000), async () => [day]);
  const result = await service.prepare(job, asOf);
  assert.deepEqual(reads[0]?.slice(1), ["TEST", session.startTime, asOf, "alpaca_sip_raw_v1"]);
  assert.equal(result.pending, false);
  if (!result.pending) assert.equal(result.outcome, "history_exhausted");
});


for (const action of ["JOIN", "SPLIT", "no split"] as const) {
  test("Moomoo prior-session warmup retains its own source and shared scope: "+action, async () => {
    const day="2026-11-12", session=newYorkExtendedSession(day)!;
    const previous=newYorkExtendedSession("2026-11-11")!;
    const asOf=session.startTime+7200, now=new Date("2026-11-12T20:00:00Z");
    const requester={userId:"trader",workspaceId:"workspace",accountId:"account"};
    const shared={userId:"shared-owner",workspaceId:"shared-workspace",accountId:"shared-account"};
    const reads: unknown[][]=[];
    const downloads: {startTime:number;endTime:number}[]=[];
    const receipts: {alpaca?:boolean;range:{start:number;endExclusive:number}}[]=[];
    const metadata=new MoomooChartHistory(async request=>{
      assert.deepEqual(request,{operation:"rehab",symbol:"GOVX"});
      return {data:{rehabs:action==="no split" ? [] : [
        {action_types:[action],ex_div_date:"2026-11-11",split_ratio:action==="JOIN" ? 24 : 0.25},
      ]}};
    },()=>now.getTime());
    const history={
      recoverInterrupted:()=>0,
      compatibleEvidence:(...args:unknown[])=>{
        reads.push(args);
        return {ranges:[{start:session.startTime,endExclusive:asOf}],candles:[]};
      },
      read:(_scope:unknown,_job:unknown,_all:unknown,source:unknown)=>{
        assert.equal(source,"moomoo_history_kline_v1");return [];
      },
      begin:(input:typeof receipts[number])=>{receipts.push(input);return "request";},
      finish:()=>{},
    } as unknown as TrendMomentumHistoryRepository;
    const allowances={
      designatedScope:()=>shared,hasHistoryReservation:()=>true,
      historyRequestStartedAt:()=>now.toISOString(),
      beginAcquisition:()=>({acquisitionId:"acquisition"}),completeAcquisition:()=>{},
    } as unknown as SharedAnalyzerAllowanceRepository;
    const job={jobId:"job",createdAtUtc:now.toISOString(),scope:requester,marketSessionSetId:"moomoo-session",
      target:{tradingDateNewYork:day,providerSymbol:"GOVX",
        events:[{executedAtUtc:new Date((session.startTime+3600)*1000).toISOString()}]},
    } as unknown as ClaimedLogicalTradeAnalyzerJob;
    const service=new TrendMomentumHistoryService(history,allowances,async scope=>{
      assert.deepEqual(scope,shared);
      return {fetch:async request=>{
        downloads.push(request);
        return {ok:false,code:"coverage_unavailable",requestCoverage:"complete",failureReasonCode:"empty",
          exchangeTimezone:"America/New_York",utcOffsetSeconds:null};
      }};
    },()=>now,async symbol=>(await metadata.readEvents(symbol,"Splits")).dates,"moomoo_history_kline_v1");
    const result=await service.prepare(job,asOf);
    assert.equal(result.pending,true);
    assert.equal(reads[0]?.[4],"moomoo_history_kline_v1");
    if(action!=="no split") assert.equal(reads[0]?.[2],previous.startTime);
    else assert.ok(Number(reads[0]?.[2])<previous.startTime);
    assert.equal(downloads.length,1);
    assert.equal(downloads[0].startTime,previous.startTime);
    assert.equal(downloads[0].endTime,previous.endTime);
    assert.equal(receipts[0].alpaca,false);
    service.beginSession(job,"acquisition",session.startTime,asOf);
    assert.equal(receipts.at(-1)?.alpaca,false);
  });
}

test("Moomoo warmup on the split date excludes all pre-split raw sessions", async () => {
  const session=newYorkExtendedSession("2026-11-11")!;
  const asOf=session.startTime+7200;
  const reads:unknown[][]=[];
  const history={recoverInterrupted:()=>0,compatibleEvidence:(...args:unknown[])=>{
    reads.push(args);return {ranges:[{start:session.startTime,endExclusive:asOf}],candles:[]};
  },read:()=>[]} as unknown as TrendMomentumHistoryRepository;
  const job={jobId:"job",scope:{userId:"user",workspaceId:"workspace",accountId:"account"},
    target:{tradingDateNewYork:"2026-11-11",providerSymbol:"GOVX",
      events:[{executedAtUtc:new Date((session.startTime+3600)*1000).toISOString()}]},
  } as unknown as ClaimedLogicalTradeAnalyzerJob;
  const service=new TrendMomentumHistoryService(history,{} as SharedAnalyzerAllowanceRepository,
    async()=>{throw Error("Pre-split prices must not warm up post-split indicators");},
    ()=>new Date(asOf*1000),async()=>["2026-11-11"],"moomoo_history_kline_v1");
  const result=await service.prepare(job,asOf);
  assert.deepEqual(reads[0]?.slice(1),["GOVX",session.startTime,asOf,"moomoo_history_kline_v1"]);
  assert.equal(result.pending,false);
  if(!result.pending) assert.equal(result.outcome,"history_exhausted");
});

test("invalid split dates cannot authorize cross-session warmup", async () => {
  const history={recoverInterrupted:()=>0} as unknown as TrendMomentumHistoryRepository;
  const job={jobId:"job",scope:{},target:{tradingDateNewYork:"2026-11-12",providerSymbol:"GOVX"}} as ClaimedLogicalTradeAnalyzerJob;
  const service=new TrendMomentumHistoryService(history,{} as SharedAnalyzerAllowanceRepository,
    async()=>{throw Error("Unexpected download");},()=>new Date("2026-11-12T20:00:00Z"),
    async()=>["2026-02-31"],"moomoo_history_kline_v1");
  await assert.rejects(service.prepare(job,Date.parse("2026-11-12T18:00:00Z")/1000),/indicator_split_date_invalid/);
});
