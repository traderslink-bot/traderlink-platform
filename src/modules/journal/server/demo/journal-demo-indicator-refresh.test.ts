import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { test, vi } from "vitest";
import { JournalDemoAccountRepository } from "./journal-demo-account-repository";
import { JournalLogicalTradeRepository } from "../logical-trades/journal-logical-trade-repository";
import { LogicalTradeAnalyzerRepository, type LogicalTradeAnalyzerSavedResult } from "@/src/modules/level-analysis/server/logical-trade-analyzer-repository";
import * as receipts from "./journal-demo-indicator-receipts";
import { DemoIndicatorHistoryRequired, refreshJournalDemoTradeIndicators } from "./journal-demo-indicator-refresh";

// Orchestration/transaction fixture; receipt SQL has independent SQLite tests.
function fixture(options: { missing?: boolean; coreMissing?: boolean; created?: boolean; cleared?: boolean; otherAccount?: boolean } = {}) {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE journal_round_trip_daily_trade_analyses(workspace_id,account_id,round_trip_id,round_trip_version_id,status,market_session_set_version_id);
    INSERT INTO journal_round_trip_daily_trade_analyses VALUES('workspace','demo','one','v-one','ready','core'),('workspace','demo','two','v-two','ready','core');
    CREATE TABLE derived_created(id);`);
  const scope={userId:"user",workspaceId:"workspace",accountId:"demo",workspaceRole:"owner" as const};
  const start=Date.parse("2026-08-21T08:00:00Z")/1000;
  const members=[{roundTripId:"one",roundTripVersionId:"v-one",sequence:1,openedAtUtc:"",closedAtUtc:""},
    {roundTripId:"two",roundTripVersionId:"v-two",sequence:2,openedAtUtc:"",closedAtUtc:""}];
  const trade={logicalTradeId:options.created?null:"logical",members,tradeStyle:"day" as const,lifecycleState:"active" as const,
    revision:1,symbol:"TEST",direction:"long" as const,instrumentId:"instrument",currency:"USD",openedAtUtc:"",closedAtUtc:""};
  vi.spyOn(JournalDemoAccountRepository.prototype,"findAccountForUser").mockReturnValue({accountId:options.otherAccount?"other":"demo",createdAtUtc:"",createdForUserId:"user",demoPackVersionId:"pack",workspaceId:"workspace"});
  vi.spyOn(JournalDemoAccountRepository.prototype,"findLifecycleForUser").mockReturnValue(options.cleared?{state:"cleared",clearedAtUtc:"",clearedDemoAccountId:"demo",userId:"user",workspaceId:"workspace"}:null);
  vi.spyOn(JournalLogicalTradeRepository.prototype,"findByRoundTripId").mockReturnValue(trade);
  vi.spyOn(JournalLogicalTradeRepository.prototype,"createVersion").mockImplementation(()=>{db.exec("INSERT INTO derived_created VALUES('logical')");return "logical";});
  vi.spyOn(JournalLogicalTradeRepository.prototype,"findByLogicalTradeId").mockReturnValue({...trade,logicalTradeId:"logical"});
  const events=(["entry","temporary_flat","entry","final_exit"] as const).map((kind,index)=>({eventId:`e-${index}`,kind,sequence:index+1,
    executedAtUtc:new Date((start+6*3600+index*60+2)*1000).toISOString(),priceDecimal:index%2?"2.01":"2",quantityDecimal:"10",feesDecimal:"0"}));
  vi.spyOn(LogicalTradeAnalyzerRepository.prototype,"target").mockReturnValue({logicalTradeId:"logical",logicalTradeVersionId:"version",events,
    direction:"long",providerSymbol:"TEST",tradingDateNewYork:"2026-08-21",openedAtUtc:events[0].executedAtUtc,
    finalExitAtUtc:events[3].executedAtUtc,representativeRoundTripId:"one"});
  vi.spyOn(receipts,"readJournalDemoIndicatorReceipts").mockReturnValue({evidence:[],receipts:(options.coreMissing?[]:options.missing?[start]:[start-86400,start]).map(at=>({
    provider:"moomoo_history_kline",adapterVersion:"moomoo_history_kline_v1",symbol:"TEST",complete:true,
    range:{start:at,endExclusive:at+960*60},candles:Array.from({length:960},(_,i)=>({time:at+(i+1)*60,
      openDecimal:"2",highDecimal:"2.1",lowDecimal:"1.9",closeDecimal:"2",volumeDecimal:"100",turnoverDecimal:"200"})),
  }))});
  let saved: LogicalTradeAnalyzerSavedResult|null=null;
  vi.spyOn(LogicalTradeAnalyzerRepository.prototype,"readCurrentByRoundTrip").mockImplementation(()=>saved);
  const persist=vi.spyOn(LogicalTradeAnalyzerRepository.prototype,"persistResult").mockImplementation(value=>{
    saved={analyzed:value.analyzed,candles:value.evidenceCandles??[],logicalTradeVersionId:value.target.logicalTradeVersionId,
      status:value.status,availableAtUtc:null,mismatches:[]};
  });
  return {db,persist,scope,events,read:()=>saved,run:()=>refreshJournalDemoTradeIndicators(db,{scope,roundTripId:"one",now:new Date("2026-09-13T12:00:00Z")}),
    close:()=>{vi.restoreAllMocks();db.close();}};
}

test("Demo refresh writes one current logical analysis with all cycles, then skips identical evidence",()=>{
  const f=fixture();try{
    assert.equal(f.run().status,"refreshed");assert.equal(f.run().status,"unchanged");
    assert.equal(f.persist.mock.calls.length,1);
    assert.deepEqual(f.read()?.analyzed?.trendMomentum?.executions.map(e=>e.eventId),f.events.map(e=>e.eventId));
    assert.equal(f.db.prepare<[],{n:number}>("SELECT count(*) AS n FROM journal_round_trip_daily_trade_analyses").get()!.n,2);
  }finally{f.close();}
});
test("missing trade-day coverage preserves the old result and rolls back newly materialized identity",()=>{
  const f=fixture({coreMissing:true,created:true});try{
    assert.throws(f.run,DemoIndicatorHistoryRequired);assert.equal(f.persist.mock.calls.length,0);
    assert.equal(f.db.prepare<[],{n:number}>("SELECT count(*) AS n FROM derived_created").get()!.n,0);
  }finally{f.close();}
});
test("preferred history shortfall preserves initialized EMAs and session VWAP",()=>{
  const f=fixture({missing:true,created:true});try{
    assert.equal(f.run().status,"refreshed");
    const indicators=f.read()?.analyzed?.trendMomentum;
    assert.equal(indicators?.historyOutcome,"history_unavailable");
    assert.equal(indicators?.executions.length,4);
    for(const execution of indicators!.executions){
      assert.equal(execution.oneMinute?.ema9,2);
      assert.equal(execution.oneMinute?.ema20,2);
      assert.equal(execution.fiveMinute?.ema20,2);
      assert.equal(execution.sessionVwap?.value,2);
    }
    assert.equal(f.run().status,"unchanged");
    assert.equal(f.persist.mock.calls.length,1);
  }finally{f.close();}
});
for(const options of [{cleared:true},{otherAccount:true}])test("Demo refresh denies cleared or different-account scope "+JSON.stringify(options),()=>{
  const f=fixture(options);try{assert.throws(f.run,/not_authorized/);assert.equal(f.persist.mock.calls.length,0);}finally{f.close();}
});
test("Journal-only member prevents partial promotion of a combined Demo trade",()=>{
  const f=fixture();try{
    f.db.exec("DELETE FROM journal_round_trip_daily_trade_analyses WHERE round_trip_id='two'");
    assert.equal(f.run().status,"not_analyzer_backed");assert.equal(f.persist.mock.calls.length,0);
  }finally{f.close();}
});
