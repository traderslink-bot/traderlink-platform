import assert from "node:assert/strict";
import { test } from "vitest";
import Database from "better-sqlite3";
import { dailyTradeAnalyzerManualRetryRequestsMigration as migration } from "./database/migrations/0135_daily_trade_analyzer_manual_retry_requests";
import { ManualAnalyzerRetryRepository, analyzerRetryDate } from "./manual-analyzer-retry-repository";
import { dailyTradeAnalyzerTrendMomentumHistoryMigration as historyMigration } from "./database/migrations/0134_daily_trade_analyzer_trend_momentum_history";
import { SharedAnalyzerAllowanceRepository } from "./shared-analyzer-allowance-repository";
import { TrendMomentumHistoryRepository } from "./trend-momentum-history-repository";
import { LogicalTradeAnalyzerRepository } from "./logical-trade-analyzer-repository";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const scope = { userId:id(1),workspaceId:id(2),accountId:id(3),workspaceRole:"owner" as const };
const now = new Date("2026-09-13T16:00:00.000Z");

for (const retryStatus of ["provider_unavailable", "completed"]) test(retryStatus + " requeue preserves job identity and prevents duplicate retries", () => {
  const db = fixture();
  try {
    for (const column of ["desired_coverage_end_utc TEXT", "attempt_count INTEGER", "next_attempt_at_utc TEXT", "completed_at_utc TEXT", "lease_expires_at_utc TEXT", "created_at_utc TEXT", "updated_at_utc TEXT"]) {
      db.exec(`ALTER TABLE level_analysis_logical_trade_jobs ADD COLUMN ${column}`);
    }
    db.exec(`CREATE TABLE level_analysis_market_session_sets(market_session_set_id TEXT PRIMARY KEY,provider_key,provider_adapter_version,provider_symbol,exchange_identity,trading_date_new_york,interval,session_policy,current_version_id,current_coverage_end_utc,current_status,lease_expires_at_utc,created_at_utc,updated_at_utc,
UNIQUE(provider_key,provider_adapter_version,provider_symbol,exchange_identity,trading_date_new_york,interval,session_policy));`);
    const originalCreated = "2026-09-11T15:00:00.000Z";
    db.prepare("UPDATE level_analysis_logical_trade_jobs SET status=?,attempt_count=3,created_at_utc=?,desired_coverage_end_utc=? WHERE logical_trade_job_id=?").run(retryStatus,originalCreated,originalCreated,id(10));
    const repository = new LogicalTradeAnalyzerRepository(db);
    const retries = new ManualAnalyzerRetryRepository(db);
    const target = { logicalTradeId:id(4),logicalTradeVersionId:id(20),providerSymbol:"TEST",tradingDateNewYork:"2026-09-11" } as Parameters<typeof repository.queue>[0]["target"];
    const input = {scope,target,desiredCoverageEndUtc:originalCreated,now,retryTerminal:true,refreshCompleted:retryStatus === "completed"};
    if (retryStatus === "completed") {
      assert.equal(repository.alreadyRequested(scope,id(20)),true);
      assert.equal(repository.alreadyRequested(scope,id(20),true),false);
      assert.equal(repository.queue({...input,refreshCompleted:false}).created,false);
    }
    const accepted = db.transaction(() => {
      const queued = repository.queue(input);
      assert.equal(queued.created,true);
      assert.equal(queued.jobId,id(10));
      return retries.record(scope,queued.jobId,now);
    }).immediate();
    assert.ok(accepted);
    const allowances = new SharedAnalyzerAllowanceRepository(db);
    assert.equal(allowances.historyRequestStartedAt(id(10),originalCreated,now),now.toISOString());
    assert.equal(allowances.historyRequestStartedAt(id(10),originalCreated,new Date(now.getTime()+86400000)),originalCreated);
    assert.equal(repository.alreadyRequested(scope,id(20)),true);
    assert.equal(repository.queue(input).created,false);
    const row = db.prepare("SELECT status,attempt_count,created_at_utc FROM level_analysis_logical_trade_jobs WHERE logical_trade_job_id=?").get(id(10));
    assert.deepEqual(row,{status:"queued",attempt_count:0,created_at_utc:originalCreated});
    assert.equal((db.prepare("SELECT count(*) AS n FROM level_analysis_manual_retry_requests").get() as {n:number}).n,1);
  } finally { db.close(); }
});
function fixture() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys=ON");
  db.exec(`CREATE TABLE level_analysis_logical_trade_jobs(logical_trade_job_id TEXT PRIMARY KEY,user_id,workspace_id,account_id,logical_trade_id,logical_trade_version_id,status,market_session_set_id);
CREATE TABLE level_analysis_analyzer_acquisitions(acquisition_id TEXT PRIMARY KEY,charged_user_id,market_session_set_id,charge_kind,reservation_id,started_at_utc,completed_at_utc,outcome);`);
  for(let n=0;n<4;n++) db.prepare("INSERT INTO level_analysis_logical_trade_jobs VALUES(?,?,?,?,?,?,'queued',?)").run(id(10+n),scope.userId,scope.workspaceId,scope.accountId,id(4),id(20+n),id(5));
  historyMigration.statements.forEach(sql=>db.exec(sql));
  migration.statements.forEach(sql=>db.exec(sql));
  return db;
}

test("manual retries cap across corrected revisions and survive repository recreation",()=>{
  const db=fixture();
  try {
    for(let n=0;n<3;n++) assert.ok(new ManualAnalyzerRetryRepository(db).record(scope,id(10+n),now));
    const repo=new ManualAnalyzerRetryRepository(db);
    assert.equal(repo.available(scope,id(4),now),false);
    assert.equal(repo.record(scope,id(13),now),null);
    assert.equal(repo.record({...scope,accountId:id(9)},id(13),now),null);
    const nextDay=new Date("2026-09-14T04:00:00.000Z");
    assert.ok(repo.record(scope,id(13),nextDay));
    assert.equal(repo.active(id(13),new Date(nextDay.getTime()+86400000)),null);
    assert.ok(repo.active(id(13),nextDay));
    assert.throws(()=>db.exec("UPDATE level_analysis_manual_retry_requests SET daily_ordinal=1"),/immutable/);
    assert.throws(()=>db.exec("DELETE FROM level_analysis_manual_retry_requests"),/required/);
    assert.deepEqual(db.pragma("foreign_key_check"),[]);
  } finally {db.close();}
});

test("retry calendar rolls over at New York midnight and handles daylight time",()=>{
  assert.equal(analyzerRetryDate(new Date("2026-09-14T03:59:59Z")),"2026-09-13");
  assert.equal(analyzerRetryDate(new Date("2026-09-14T04:00:00Z")),"2026-09-14");
  assert.equal(analyzerRetryDate(new Date("2026-12-14T04:59:59Z")),"2026-12-13");
  assert.equal(analyzerRetryDate(new Date("2026-12-14T05:00:00Z")),"2026-12-14");
});

test("free acquisition attribution rejects paid or mismatched evidence and preserves completed history",()=>{
  const db=fixture();
  try {
    const repo=new ManualAnalyzerRetryRepository(db),request=repo.record(scope,id(10),now)!;
    db.prepare("INSERT INTO level_analysis_analyzer_acquisitions VALUES(?,?,?,'user_charged',NULL,?,NULL,NULL)").run(id(30),scope.userId,id(5),now.toISOString());
    assert.throws(()=>db.prepare("INSERT INTO level_analysis_manual_retry_acquisitions VALUES(?,?)").run(id(30),request),/invalid/);
    db.prepare("INSERT INTO level_analysis_analyzer_acquisitions VALUES(?,?,?,'correction_waived',NULL,?,NULL,NULL)").run(id(31),scope.userId,id(5),now.toISOString());
    db.prepare("INSERT INTO level_analysis_manual_retry_acquisitions VALUES(?,?)").run(id(31),request);
    assert.equal(repo.acquisitions(request),1);
    const insert=db.prepare(`INSERT INTO level_analysis_manual_retry_history_requests
(history_request_id,retry_request_id,logical_trade_job_id,acquisition_id,requested_start_seconds,requested_end_seconds,attempt_number,status,created_at_utc)
VALUES(?,?,?,?,1800000000,1800003600,1,'requested',?)`);
    assert.throws(()=>insert.run(id(40),request,id(11),id(31),now.toISOString()),/scope_invalid/);
    insert.run(id(40),request,id(10),id(31),now.toISOString());
    db.prepare("UPDATE level_analysis_manual_retry_history_requests SET status='no_history',candles_json='[]',candle_sha256=?,completed_at_utc=?").run("0".repeat(64),now.toISOString());
    assert.throws(()=>db.exec("UPDATE level_analysis_manual_retry_history_requests SET failure_reason='changed'"),/immutable/);
    assert.throws(()=>db.exec("DELETE FROM level_analysis_manual_retry_history_requests"),/required/);
    assert.deepEqual(db.pragma("foreign_key_check"),[]);
  } finally {db.close();}
});

test("manual retry uses separate free acquisitions and history without rewriting the original charge",()=>{
  const db=fixture();
  try {
    db.exec(`CREATE TABLE level_analysis_shared_analyzer_settings(settings_key,enabled,default_daily_limit,default_period_limit,global_rolling_24h_limit,request_spacing_seconds,designated_user_id,designated_workspace_id,designated_account_id,revision);
CREATE TABLE level_analysis_user_allowance_cycles(allowance_cycle_id,user_id,starts_on_new_york_date,ends_on_new_york_date,created_at_utc);
CREATE TABLE level_analysis_user_allowance_overrides(user_id,daily_limit,period_limit);
CREATE TABLE level_analysis_user_allowance_resets(user_id,allowance_cycle_id,reset_kind,created_at_utc);
CREATE TABLE level_analysis_analyzer_reservations(reservation_id,user_id,logical_trade_job_id,allowance_cycle_id,daily_new_york_date,status,correction_waiver,expires_at_utc,created_at_utc,updated_at_utc);`);
    db.prepare("INSERT INTO level_analysis_shared_analyzer_settings VALUES('beta',1,10,100,120,0,?,?,?,1)").run(scope.userId,scope.workspaceId,scope.accountId);
    db.prepare("INSERT INTO level_analysis_user_allowance_cycles VALUES(?,?,'2026-09-01','2026-09-30',?)").run(id(50),scope.userId,now.toISOString());
    db.prepare("INSERT INTO level_analysis_analyzer_reservations VALUES(?,?,?,?,'2026-09-13','consumed',0,?,?,?)").run(id(51),scope.userId,id(10),id(50),"2026-09-14T16:00:00.000Z",now.toISOString(),now.toISOString());
    db.prepare("INSERT INTO level_analysis_analyzer_acquisitions VALUES(?,?,?,'user_charged',?,?,?,'provider_unavailable')").run(id(52),scope.userId,id(5),id(51),now.toISOString(),now.toISOString());
    db.prepare(`INSERT INTO level_analysis_indicator_history_requests(history_request_id,logical_trade_job_id,acquisition_id,requested_start_seconds,requested_end_seconds,attempt_number,status,created_at_utc,completed_at_utc,failure_reason)
VALUES(?,?,?,1800000000,1800003600,1,'provider_failure',?,?,'fixture_failure')`).run(id(53),id(10),id(52),now.toISOString(),now.toISOString());
    const original=db.prepare("SELECT * FROM level_analysis_analyzer_reservations").all();
    const retryTime=new Date(now.getTime()+60000);
    const retries=new ManualAnalyzerRetryRepository(db),request=retries.record(scope,id(10),retryTime)!;
    db.prepare("UPDATE level_analysis_logical_trade_jobs SET status='leased' WHERE logical_trade_job_id=?").run(id(10));
    const allowance=new SharedAnalyzerAllowanceRepository(db);
    assert.equal(allowance.availability(scope.userId,retryTime).dailyAvailable,9);
    const acquisition=allowance.beginAcquisition({jobId:id(10),marketSessionSetId:id(5),now:retryTime,historyContinuation:true})!;
    assert.equal(acquisition.chargeKind,"correction_waived");
    const history=new TrendMomentumHistoryRepository(db);
    assert.equal(history.read(scope,id(10)).length,0);
    const receipt=history.begin({scope,jobId:id(10),acquisitionId:acquisition.acquisitionId,range:{start:1800000000,endExclusive:1800003600},now:retryTime})!;
    assert.ok(receipt);
    assert.equal(history.read(scope,id(10))[0].attempt_number,1);
    assert.equal(history.read(scope,id(10))[0].retry_request_id,request);
    assert.equal(history.finish({scope,jobId:id(10),requestId:receipt,result:{ok:false,code:"coverage_unavailable",requestCoverage:"complete",failureReasonCode:"moomoo_returned_no_candles",exchangeTimezone:"America/New_York",utcOffsetSeconds:-14400},now:retryTime}),true);
    allowance.completeAcquisition({acquisitionId:acquisition.acquisitionId,now:retryTime,outcome:"no_coverage"});
    assert.equal(allowance.availability(scope.userId,retryTime).dailyAvailable,9);
    assert.equal(allowance.availability(scope.userId,retryTime).periodAvailable,99);
    assert.deepEqual(db.prepare("SELECT * FROM level_analysis_analyzer_reservations").all(),original);
    assert.equal(history.read(scope,id(10),true).length,2);
    assert.equal(history.completedEvidence(scope,id(10)).ranges.length,1);
    assert.deepEqual(db.pragma("foreign_key_check"),[]);
  } finally {db.close();}
});
