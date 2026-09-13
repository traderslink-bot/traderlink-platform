import assert from "node:assert/strict";
import { test } from "vitest";
import Database from "better-sqlite3";
import { dailyTradeAnalyzerTrendMomentumHistoryMigration as migration } from "./database/migrations/0134_daily_trade_analyzer_trend_momentum_history";
import { SharedAnalyzerAllowanceRepository } from "./shared-analyzer-allowance-repository";
import { TrendMomentumHistoryRepository } from "./trend-momentum-history-repository";
import { priorIndicatorHistoryRanges } from "./trend-momentum-history-ranges";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const now = new Date("2026-09-12T16:00:00.000Z");

test("earlier session ranges are bounded, skip weekends and respect New York daylight time", () => {
  const ranges = priorIndicatorHistoryRanges("2026-03-10");
  assert.equal(ranges.length, 10);
  assert.equal(new Date(ranges[0].start * 1000).toISOString(), "2026-03-09T08:00:00.000Z");
  assert.equal(new Date(ranges[1].start * 1000).toISOString(), "2026-03-06T09:00:00.000Z");
  assert.ok(ranges.every((r) => r.endExclusive - r.start === 16 * 3600));
  assert.throws(() => priorIndicatorHistoryRanges("2026-02-30"), /date_invalid/);
});

test("0134 creates immutable completed history evidence with explicit job and acquisition links", () => {
  const db = new Database(":memory:");
  try {
    assert.equal(db.name, ":memory:");
    db.pragma("foreign_keys = ON");
    db.exec("CREATE TABLE level_analysis_logical_trade_jobs(logical_trade_job_id TEXT PRIMARY KEY); CREATE TABLE level_analysis_analyzer_acquisitions(acquisition_id TEXT PRIMARY KEY);");
    db.prepare("INSERT INTO level_analysis_logical_trade_jobs VALUES (?)").run(id(1));
    db.prepare("INSERT INTO level_analysis_analyzer_acquisitions VALUES (?)").run(id(2));
    assert.equal(migration.migrationId, "0134_daily_trade_analyzer_trend_momentum_history");
    assert.equal(migration.executionOrder, 134);
    migration.statements.forEach((sql) => db.exec(sql));
    const insert = db.prepare(`INSERT INTO level_analysis_indicator_history_requests
      (history_request_id, logical_trade_job_id, acquisition_id, requested_start_seconds,
       requested_end_seconds, attempt_number, status, created_at_utc)
      VALUES (?, ?, ?, 1800000000, 1800003600, 1, 'requested', ?)`);
    assert.throws(() => insert.run(id(3), id(9), id(2), now.toISOString()), /FOREIGN KEY/);
    assert.throws(() => insert.run("not-a-uuid", id(1), id(2), now.toISOString()), /CHECK/);
    insert.run(id(3), id(1), id(2), now.toISOString());
    assert.throws(() => insert.run(id(4), id(1), id(2), now.toISOString()), /UNIQUE/);
    assert.throws(() => db.prepare("UPDATE level_analysis_indicator_history_requests SET status='complete', completed_at_utc=?").run(now.toISOString()), /CHECK/);
    db.prepare("UPDATE level_analysis_indicator_history_requests SET status='no_history', completed_at_utc=?, candles_json='[]', candle_sha256=?")
      .run(now.toISOString(), "0".repeat(64));
    assert.throws(() => db.exec("UPDATE level_analysis_indicator_history_requests SET failure_reason='changed'"), /immutable/);
    assert.throws(() => db.exec("DELETE FROM level_analysis_indicator_history_requests"), /required/);
    assert.deepEqual(db.pragma("foreign_key_check"), []);
  } finally { db.close(); }
  assert.equal(db.open, false);
});

// Minimal query-contract fixture, separate from schema-migration acceptance.
function accountingFixture() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE level_analysis_owner_exemption_events(exemption_event_id,user_id,enabled,created_at_utc);
    CREATE TABLE level_analysis_owner_exempt_acquisitions(acquisition_id,exemption_event_id);
    CREATE TABLE level_analysis_shared_analyzer_settings(settings_key, enabled, default_daily_limit, default_period_limit, global_rolling_24h_limit, request_spacing_seconds, designated_user_id, designated_workspace_id, designated_account_id, revision);
    INSERT INTO level_analysis_shared_analyzer_settings VALUES ('beta',1,10,100,120,0,'user','workspace','account',1);
    CREATE TABLE level_analysis_user_allowance_cycles(allowance_cycle_id,user_id,starts_on_new_york_date,ends_on_new_york_date,created_at_utc);
    INSERT INTO level_analysis_user_allowance_cycles VALUES ('cycle','user','2026-09-01','2026-09-30','2026-09-01T00:00:00.000Z');
    CREATE TABLE level_analysis_user_allowance_overrides(user_id,daily_limit,period_limit);
    CREATE TABLE level_analysis_user_allowance_resets(user_id,allowance_cycle_id,reset_kind,created_at_utc);
    CREATE TABLE level_analysis_analyzer_reservations(reservation_id,user_id,logical_trade_job_id,allowance_cycle_id,daily_new_york_date,status,correction_waiver,expires_at_utc,created_at_utc,updated_at_utc);
    INSERT INTO level_analysis_analyzer_reservations VALUES ('reservation','user','job','cycle','2026-09-12','active',0,'2026-09-13T16:00:00.000Z','2026-09-12T16:00:00.000Z','2026-09-12T16:00:00.000Z');
    CREATE TABLE level_analysis_logical_trade_jobs(logical_trade_job_id,user_id,status);
    INSERT INTO level_analysis_logical_trade_jobs VALUES ('job','user','leased');
    CREATE TABLE level_analysis_analyzer_acquisitions(acquisition_id,market_session_set_id,charged_user_id,reservation_id,charge_kind,started_at_utc,completed_at_utc,outcome);
    CREATE TABLE level_analysis_manual_retry_requests(retry_request_id,logical_trade_job_id,user_id,created_at_utc);
    CREATE TABLE level_analysis_manual_retry_acquisitions(acquisition_id,retry_request_id);
  `);
  return db;
}

test("history continuations retain provider accounting but charge one user unit", () => {
  const db = accountingFixture();
  try {
    const repo = new SharedAnalyzerAllowanceRepository(db);
    const args = { jobId: "job", marketSessionSetId: "session", now };
    const first = repo.beginAcquisition(args)!;
    assert.ok(first);
    repo.completeAcquisition({ acquisitionId: first.acquisitionId, now, outcome: "ready" });
    assert.equal(repo.beginAcquisition(args), null);
    const later = new Date(now.getTime() + 3000);
    const second = repo.beginAcquisition({ ...args, now: later, historyContinuation: true })!;
    assert.ok(second);
    assert.equal(repo.availability("user", later).dailyAvailable, 9);
    assert.equal(repo.availability("user", later).periodAvailable, 99);
    assert.equal((db.prepare("SELECT count(*) AS n FROM level_analysis_analyzer_acquisitions").get() as {n:number}).n, 2);
    // Active request still owns the global single-acquisition guard.
    assert.equal(repo.beginAcquisition({ ...args, now: later, historyContinuation: true }), null);
    repo.completeAcquisition({ acquisitionId: second.acquisitionId, now: later, outcome: "ready" });
    db.exec("UPDATE level_analysis_logical_trade_jobs SET user_id='someone-else'");
    assert.equal(repo.beginAcquisition({ ...args, now: later, historyContinuation: true }), null);
    db.exec("UPDATE level_analysis_logical_trade_jobs SET user_id='user', status='completed'");
    assert.equal(repo.beginAcquisition({ ...args, now: later, historyContinuation: true }), null);
  } finally { db.close(); }
  assert.equal(db.open, false);
});

test("a free correction never reduces available allowance while queued or after provider acquisition", () => {
  const db = accountingFixture();
  try {
    db.exec("UPDATE level_analysis_analyzer_reservations SET correction_waiver=1");
    const repo = new SharedAnalyzerAllowanceRepository(db);
    assert.equal(repo.availability("user", now).dailyAvailable, 10);
    assert.equal(repo.availability("user", now).periodAvailable, 100);
    const acquired = repo.beginAcquisition({ jobId: "job", marketSessionSetId: "session", now })!;
    assert.equal(acquired.chargeKind, "correction_waived");
    repo.completeAcquisition({ acquisitionId: acquired.acquisitionId, now, outcome: "ready" });
    assert.equal(repo.availability("user", now).dailyAvailable, 10);
    assert.equal(repo.availability("user", now).periodAvailable, 100);
    assert.equal((db.prepare("SELECT count(*) AS n FROM level_analysis_analyzer_acquisitions").get() as { n: number }).n, 1);
  } finally { db.close(); }
});

test("a continuation after an owner reset does not re-charge the original analysis", () => {
  const db = accountingFixture();
  try {
    const repo = new SharedAnalyzerAllowanceRepository(db);
    const args = { jobId: "job", marketSessionSetId: "session", now };
    const first = repo.beginAcquisition(args)!;
    repo.completeAcquisition({ acquisitionId: first.acquisitionId, now, outcome: "ready" });
    db.exec("INSERT INTO level_analysis_user_allowance_resets VALUES ('user','cycle','daily','2026-09-12T16:00:01.000Z')");
    const later = new Date(now.getTime() + 3000);
    assert.ok(repo.beginAcquisition({ ...args, now: later, historyContinuation: true }));
    assert.equal(repo.availability("user", later).dailyAvailable, 10);
    assert.equal(repo.availability("user", later).periodAvailable, 99);
  } finally { db.close(); }
});

test("history repository binds job ownership and never rewrites completed evidence", () => {
  const db = new Database(":memory:");
  try {
    db.pragma("foreign_keys = ON");
    db.exec(`CREATE TABLE level_analysis_logical_trade_jobs(logical_trade_job_id TEXT PRIMARY KEY, user_id, workspace_id, account_id, status);
      CREATE TABLE level_analysis_analyzer_reservations(reservation_id TEXT PRIMARY KEY, logical_trade_job_id);
      CREATE TABLE level_analysis_analyzer_acquisitions(acquisition_id TEXT PRIMARY KEY, reservation_id, completed_at_utc, charged_user_id, outcome);`);
    db.prepare("INSERT INTO level_analysis_logical_trade_jobs VALUES (?, ?, ?, ?, 'leased')").run(id(1), id(5), id(6), id(7));
    db.prepare("INSERT INTO level_analysis_analyzer_reservations VALUES (?, ?)").run(id(8), id(1));
    db.prepare("INSERT INTO level_analysis_analyzer_acquisitions VALUES (?, ?, NULL, ?, NULL)").run(id(2), id(8), id(5));
    migration.statements.forEach((sql) => db.exec(sql));
    db.exec(`CREATE TABLE level_analysis_manual_retry_requests(retry_request_id,logical_trade_job_id,user_id,created_at_utc);
CREATE TABLE level_analysis_manual_retry_acquisitions(acquisition_id,retry_request_id);
CREATE TABLE level_analysis_manual_retry_history_requests AS SELECT *, NULL AS retry_request_id FROM level_analysis_indicator_history_requests WHERE 0;`);
    const repo = new TrendMomentumHistoryRepository(db);
    const scope = { userId: id(5), workspaceId: id(6), accountId: id(7), workspaceRole: "owner" as const };
    const args = { scope, jobId: id(1), acquisitionId: id(2), range: { start: 1800000000, endExclusive: 1800003600 }, now };
    assert.equal(repo.begin({ ...args, scope: { ...scope, accountId: id(9) } }), null);
    const requestId = repo.begin(args)!;
    assert.ok(requestId);
    assert.equal(repo.begin(args), null);
    const result = { ok: false as const, requestCoverage: "complete" as const, code: "coverage_unavailable" as const,
      failureReasonCode: "moomoo_returned_no_candles", exchangeTimezone: "America/New_York", utcOffsetSeconds: null };
    assert.equal(repo.finish({ scope: { ...scope, userId: id(9) }, jobId: id(1), requestId, result, now }), false);
    assert.equal(repo.finish({ scope, jobId: id(1), requestId, result, now }), true);
    assert.equal(repo.finish({ scope, jobId: id(1), requestId, result, now }), false);
    assert.equal(repo.begin(args), null);
    assert.equal(repo.completedEvidence(scope, id(1)).ranges.length, 1);
    assert.equal(repo.completedEvidence(scope, id(1)).candles.length, 0);
    assert.equal(repo.completedEvidence({ ...scope, workspaceId: id(9) }, id(1)).ranges.length, 0);
    const nextRange = { start: 1799900000 - 1799900000 % 60, endExclusive: 1799903600 - 1799903600 % 60 };
    const pending = repo.begin({ ...args, range: nextRange })!;
    assert.ok(pending);
    assert.equal(repo.recoverInterrupted({ ...scope, userId: id(9) }, id(1), new Date(now.getTime() + 360_000)), 0);
    assert.equal(repo.recoverInterrupted(scope, id(1), new Date(now.getTime() + 60_000)), 0);
    assert.equal(repo.recoverInterrupted(scope, id(1), new Date(now.getTime() + 360_000)), 1);
    assert.equal(repo.recoverInterrupted(scope, id(1), new Date(now.getTime() + 420_000)), 0);
    assert.equal(repo.finish({ scope, jobId: id(1), requestId: pending, result, now }), false);
    assert.equal(repo.read(scope, id(1)).find((r) => r.history_request_id === pending)!.failure_reason, "request_interrupted");
    assert.deepEqual(db.pragma("foreign_key_check"), []);
  } finally { db.close(); }
});
