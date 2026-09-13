import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { test, vi } from "vitest";
import { JournalDemoMaterializer } from "./journal-demo-materializer";
import { JournalDemoAccountRepository } from "./journal-demo-account-repository";
import * as refresh from "./journal-demo-indicator-refresh";

const one="10000000-0000-4000-8000-000000000001";
const two="10000000-0000-4000-8000-000000000002";
const scope={userId:"owner",workspaceId:"workspace",workspaceRole:"owner" as const,activeAccountId:"real",allowedAccountIds:["real"]};
function fixture() {
  const db=new Database(":memory:");
  db.exec(`CREATE TABLE journal_round_trips(round_trip_id,workspace_id,account_id,current_version_id);
    CREATE TABLE journal_round_trip_daily_trade_analyses(round_trip_id,workspace_id,account_id,round_trip_version_id,status);
    CREATE TABLE journal_active_logical_trade_memberships(workspace_id,account_id,round_trip_id,logical_trade_id,logical_trade_version_id);
    CREATE TABLE journal_logical_trade_daily_analyses(workspace_id,account_id,logical_trade_id,logical_trade_version_id,logical_trade_analysis_id,current_revision,user_id,status);
    CREATE TABLE journal_logical_trade_daily_analysis_versions(logical_trade_analysis_id,revision_number,result_json);`);
  for(const id of [one,two]) {
    db.prepare("INSERT INTO journal_round_trips VALUES(?,'workspace','demo',?)").run(id,id);
    db.prepare("INSERT INTO journal_round_trip_daily_trade_analyses VALUES(?,'workspace','demo',?,'ready')").run(id,id);
  }
  vi.spyOn(JournalDemoAccountRepository.prototype,"findLifecycleForUser").mockReturnValue(null);
  vi.spyOn(JournalDemoAccountRepository.prototype,"findAccountForUser").mockReturnValue({accountId:"demo",workspaceId:"workspace",createdForUserId:"owner",createdAtUtc:"",demoPackVersionId:"pack"});
  const run=vi.spyOn(refresh,"refreshJournalDemoTradeIndicators").mockReturnValue({status:"refreshed"});
  const materializer=new JournalDemoMaterializer(db);
  return {db,run,materializer,close:()=>{vi.restoreAllMocks();db.close();}};
}
test("activation advances one Demo candidate and never uses the selected real account",()=>{
  const f=fixture();try{
    assert.deepEqual(f.materializer.refreshExistingAnalysis(scope),{changed:true,nextAfter:one});
    assert.equal(f.run.mock.calls.length,1);
    assert.equal(f.run.mock.calls[0][1].scope.accountId,"demo");
    assert.deepEqual(f.materializer.refreshExistingAnalysis(scope,one),{changed:true,nextAfter:null});
    assert.equal(f.run.mock.calls[1][1].roundTripId,two);
    assert.deepEqual(f.materializer.refreshExistingAnalysis(scope,two),{changed:false,nextAfter:null});
    assert.equal(f.run.mock.calls.length,2);
  }finally{f.close();}
});
test("missing warmup advances the bounded pass without retries or hidden partial writes",()=>{
  const f=fixture();try{
    f.run.mockImplementation(()=>{throw new refresh.DemoIndicatorHistoryRequired([{interval:"5m",missingBars:152}]);});
    assert.deepEqual(f.materializer.refreshExistingAnalysis(scope),{changed:false,nextAfter:one});
    assert.equal(f.run.mock.calls.length,1);
  }finally{f.close();}
});
test("cleared Demo, non-owner scope and malformed cursor cannot refresh",()=>{
  const f=fixture();try{
    assert.throws(()=>f.materializer.refreshExistingAnalysis({...scope,workspaceRole:"member"}),/not_authorized/);
    assert.throws(()=>f.materializer.refreshExistingAnalysis(scope,"invalid"));
    vi.mocked(JournalDemoAccountRepository.prototype.findLifecycleForUser).mockReturnValue({state:"cleared",userId:"owner",workspaceId:"workspace",clearedAtUtc:"",clearedDemoAccountId:"demo"});
    assert.deepEqual(f.materializer.refreshExistingAnalysis(scope),{changed:false,nextAfter:null});
    assert.equal(f.run.mock.calls.length,0);
  }finally{f.close();}
});
test("obsolete saved versions are not promoted as current Demo results",()=>{
  const f=fixture();try{
    f.db.prepare("UPDATE journal_round_trips SET current_version_id='new' WHERE round_trip_id=?").run(one);
    assert.deepEqual(f.materializer.refreshExistingAnalysis(scope),{changed:true,nextAfter:null});
    assert.equal(f.run.mock.calls[0][1].roundTripId,two);
  }finally{f.close();}
});
test("already complete current indicator context is skipped without recalculation",()=>{
  const f=fixture();try{
    f.db.prepare("INSERT INTO journal_active_logical_trade_memberships VALUES('workspace','demo',?,'logical','v')").run(one);
    f.db.exec("INSERT INTO journal_logical_trade_daily_analyses VALUES('workspace','demo','logical','v','analysis',1,'owner','ready')");
    f.db.prepare("INSERT INTO journal_logical_trade_daily_analysis_versions VALUES('analysis',1,?)").run(JSON.stringify({trendMomentum:{calculationVersion:"trade_indicator_context_v3",historyOutcome:"complete"}}));
    assert.deepEqual(f.materializer.refreshExistingAnalysis(scope),{changed:true,nextAfter:null});
    assert.equal(f.run.mock.calls[0][1].roundTripId,two);
    f.db.exec("UPDATE journal_logical_trade_daily_analyses SET logical_trade_version_id='obsolete'");
    assert.deepEqual(f.materializer.refreshExistingAnalysis(scope),{changed:true,nextAfter:one});
  }finally{f.close();}
});
