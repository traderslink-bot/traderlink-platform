import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { marketDataProvider, changeMarketDataProvider } from "@/src/modules/market-data/server/provider-settings";
import { test, vi } from "vitest";
import { LogicalTradeAnalyzerRepository, type AnalyzerMarketDataProvider, type LogicalTradeAnalyzerTarget } from "./logical-trade-analyzer-repository";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const now = new Date("2026-11-17T15:00:00.000Z");
const scope = { userId: id(1), workspaceId: id(2), accountId: id(3), workspaceRole: "owner" as const };
const target = (n: number): LogicalTradeAnalyzerTarget => ({
  logicalTradeId: id(n), logicalTradeVersionId: id(n + 100),
  providerSymbol: "GOVX", tradingDateNewYork: "2026-11-10", direction: "long",
  finalExitAtUtc: "2026-11-10T15:00:00.000Z", openedAtUtc: "2026-11-10T14:30:00.000Z",
  representativeRoundTripId: id(n + 200), events: [],
});
const end = "2026-11-10T15:30:00.000Z";

function fixture() {
  const db = new Database(":memory:");
  db.exec(`
CREATE TABLE level_analysis_market_session_sets (
 market_session_set_id TEXT PRIMARY KEY,provider_key,provider_adapter_version,provider_symbol,
 exchange_identity,trading_date_new_york,interval,session_policy,current_version_id,current_coverage_end_utc,
 current_status,lease_expires_at_utc,created_at_utc,updated_at_utc,
 UNIQUE(provider_key,provider_adapter_version,provider_symbol,exchange_identity,trading_date_new_york,interval,session_policy));
CREATE TABLE level_analysis_logical_trade_jobs (
 logical_trade_job_id TEXT PRIMARY KEY,user_id,workspace_id,account_id,logical_trade_id,logical_trade_version_id,
 market_session_set_id,desired_coverage_end_utc,next_attempt_at_utc,status,attempt_count,lease_expires_at_utc,
 completed_at_utc,created_at_utc,updated_at_utc,post_session_refresh DEFAULT 0);
CREATE TABLE level_analysis_analyzer_reservations (logical_trade_job_id,status,expires_at_utc,updated_at_utc);
CREATE TABLE level_analysis_manual_retry_requests (logical_trade_job_id,created_at_utc);
CREATE TABLE journal_demo_accounts (workspace_id,account_id);
CREATE TABLE level_analysis_market_session_candles (market_session_set_version_id);
CREATE TABLE saved_evidence (body TEXT);
INSERT INTO saved_evidence VALUES ('immutable original evidence');
`);
  return db;
}

function queue(db: Database.Database, provider: AnalyzerMarketDataProvider, n: number) {
  const repo = new LogicalTradeAnalyzerRepository(db, provider);
  const queued = repo.queue({ scope, target: target(n), desiredCoverageEndUtc: end, now });
  db.prepare("INSERT INTO level_analysis_analyzer_reservations VALUES (?,'active',?,?)")
    .run(queued.jobId, "2026-11-18T15:00:00.000Z", now.toISOString());
  return queued.jobId;
}

for (const first of ["alpaca", "moomoo"] as const) {
  test(`switching from ${first} preserves queued work, receipt identity, and old evidence`, () => {
    const db = fixture();
    try {
      const other = first === "alpaca" ? "moomoo" : "alpaca";
      const jobId = queue(db, first, 10);
      const original = db.prepare("SELECT * FROM level_analysis_logical_trade_jobs WHERE logical_trade_job_id=?").get(jobId);
      const switched = new LogicalTradeAnalyzerRepository(db, other);
      assert.equal(switched.queue({ scope, target: target(10), desiredCoverageEndUtc: end, now }).created, false);
      assert.deepEqual(db.prepare("SELECT * FROM level_analysis_logical_trade_jobs WHERE logical_trade_job_id=?").get(jobId), original);
      const nextJobId = queue(db, other, 11);
      db.prepare("UPDATE level_analysis_logical_trade_jobs SET created_at_utc=? WHERE logical_trade_job_id=?")
        .run("2026-11-17T15:00:00.001Z", nextJobId);
      assert.equal(switched.nextProvider(now), first);

      vi.spyOn(switched, "targetByVersion").mockImplementation((_scope, tradeId) => tradeId === id(10) ? target(10) : target(11));
      const firstJob = switched.claimNext(now, first)!;
      assert.equal(firstJob.jobId, jobId);
      assert.equal(firstJob.marketSessionSetId, (original as { market_session_set_id: string }).market_session_set_id);
      const secondJob = switched.claimNext(now, other)!;
      assert.notEqual(secondJob.marketSessionSetId, firstJob.marketSessionSetId);
      assert.equal(switched.claimNext(now, first), null);
      assert.equal(db.prepare("SELECT body FROM saved_evidence").pluck().get(), "immutable original evidence");

      db.prepare("UPDATE level_analysis_logical_trade_jobs SET status='queued',post_session_refresh=1 WHERE logical_trade_job_id=?").run(jobId);
      assert.equal(switched.nextProvider(now), first);
      const refresh = switched.claimNext(now, first)!;
      assert.equal(refresh.postSessionRefresh, true);
      assert.equal(refresh.marketSessionSetId, firstJob.marketSessionSetId);
    } finally { db.close(); }
  });
}

test("saved candles only count toward their own provider and adapter", () => {
  const db = fixture();
  try {
    queue(db, "moomoo", 10);
    db.prepare("UPDATE level_analysis_market_session_sets SET current_status='ready',current_version_id=?,current_coverage_end_utc=?")
      .run(id(800), end);
    db.prepare("INSERT INTO level_analysis_market_session_candles VALUES (?)").run(id(800));
    assert.equal(new LogicalTradeAnalyzerRepository(db, "moomoo").hasSavedCoverage(target(10), end), true);
    assert.equal(new LogicalTradeAnalyzerRepository(db).hasSavedCoverage(target(10), end), false);
  } finally { db.close(); }
});

test("an explicit terminal retry changes provider while preserving old session evidence", () => {
  const db = fixture();
  try {
    const jobId = queue(db, "alpaca", 10);
    const before = db.prepare("SELECT market_session_set_id FROM level_analysis_logical_trade_jobs WHERE logical_trade_job_id=?").pluck().get(jobId);
    db.prepare("UPDATE level_analysis_logical_trade_jobs SET status='provider_unavailable' WHERE logical_trade_job_id=?").run(jobId);
    const switched = new LogicalTradeAnalyzerRepository(db, "moomoo");
    assert.equal(switched.queue({ scope, target: target(10), desiredCoverageEndUtc: end, now, retryTerminal: true }).created, true);
    assert.notEqual(db.prepare("SELECT market_session_set_id FROM level_analysis_logical_trade_jobs WHERE logical_trade_job_id=?").pluck().get(jobId), before);
    assert.equal(db.prepare("SELECT provider_adapter_version FROM level_analysis_market_session_sets WHERE market_session_set_id=?").pluck().get(before), "alpaca_sip_raw_v1");
  } finally { db.close(); }
});


test("persisted administrator changes select new jobs without reassigning queued jobs", async () => {
  const root=mkdtempSync(join(tmpdir(),"analyzer-provider-selection-"));
  const environment={NODE_ENV:"test",TRADERLINK_PLATFORM_DB_PATH:join(root,"test.sqlite")} as NodeJS.ProcessEnv;
  const db=fixture();
  try {
    assert.equal(marketDataProvider("trade-analyzer",environment),"alpaca");
    const first=queue(db,marketDataProvider("trade-analyzer",environment),10);
    const firstSession=db.prepare("SELECT market_session_set_id FROM level_analysis_logical_trade_jobs WHERE logical_trade_job_id=?").pluck().get(first);
    const changed=await changeMarketDataProvider("trade-analyzer",0,"moomoo",environment);
    assert.equal(changed.revision,1);
    queue(db,marketDataProvider("trade-analyzer",environment),11);
    await changeMarketDataProvider("trade-analyzer",changed.revision,"alpaca",environment);
    queue(db,marketDataProvider("trade-analyzer",environment),12);
    assert.deepEqual(db.prepare(`SELECT session.provider_key FROM level_analysis_logical_trade_jobs job
      JOIN level_analysis_market_session_sets session ON session.market_session_set_id=job.market_session_set_id
      ORDER BY logical_trade_id`).pluck().all(),["alpaca_sip_raw","moomoo_history_kline","alpaca_sip_raw"]);
    assert.equal(db.prepare("SELECT market_session_set_id FROM level_analysis_logical_trade_jobs WHERE logical_trade_job_id=?").pluck().get(first),firstSession);
    assert.equal(marketDataProvider("charts",environment),"alpaca");
  } finally {db.close();rmSync(root,{recursive:true,force:true});}
});
