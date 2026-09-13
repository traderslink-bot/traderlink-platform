import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { test } from "vitest";
import { dailyTradeAnalyzerManualRetryRequestsMigration } from "./database/migrations/0135_daily_trade_analyzer_manual_retry_requests";
import { sharedTradeAnalyzerOwnerExemptionsMigration } from "./database/migrations/0136_shared_trade_analyzer_owner_exemptions";
import { AnalyzerOwnerExemptionRepository } from "./analyzer-owner-exemption-repository";
import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import { SharedAnalyzerAllowanceRepository } from "./shared-analyzer-allowance-repository";
import { ManualAnalyzerRetryRepository } from "./manual-analyzer-retry-repository";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const now = "2026-09-13T16:00:00.000Z";
const tables = ["level_analysis_manual_retry_requests", "level_analysis_manual_retry_acquisitions", "level_analysis_manual_retry_history_requests"];
function fixture() {
  const db = new Database(":memory:");
  db.pragma("foreign_keys=ON");
  db.exec(`CREATE TABLE platform_users(user_id TEXT PRIMARY KEY,status TEXT NOT NULL DEFAULT 'active');
CREATE TABLE level_analysis_logical_trade_jobs(logical_trade_job_id TEXT PRIMARY KEY,user_id,workspace_id,account_id,logical_trade_id,logical_trade_version_id,status,market_session_set_id);
CREATE TABLE level_analysis_analyzer_acquisitions(acquisition_id TEXT PRIMARY KEY,charged_user_id,market_session_set_id,charge_kind,reservation_id,started_at_utc);`);
  db.prepare("INSERT INTO platform_users(user_id) VALUES(?)").run(id(1));
  db.prepare("INSERT INTO level_analysis_logical_trade_jobs VALUES(?,?,?,?,?,?,'queued',?)").run(id(2),id(1),id(3),id(4),id(5),id(6),id(7));
  dailyTradeAnalyzerManualRetryRequestsMigration.statements.forEach(sql => db.exec(sql));
  for (let ordinal = 1; ordinal <= 3; ordinal++) insertRetry(db, ordinal);
  db.prepare("INSERT INTO level_analysis_analyzer_acquisitions VALUES(?,?,?,'correction_waived',NULL,?)").run(id(20),id(1),id(7),now);
  db.prepare("INSERT INTO level_analysis_manual_retry_acquisitions VALUES(?,?)").run(id(20),id(13));
  db.prepare(`INSERT INTO level_analysis_manual_retry_history_requests VALUES(?,?,?,?,?,?,1,'complete',NULL,'[]',?,?,?)`)
    .run(id(30),id(13),id(2),id(20),1800000000,1800000060,"a".repeat(64),now,now);
  db.prepare("UPDATE level_analysis_logical_trade_jobs SET status='completed'").run();
  return db;
}
function insertRetry(db: Database.Database, ordinal: number) {
  db.prepare("INSERT INTO level_analysis_manual_retry_requests VALUES(?,?,?,?,?,?,?,?,?,?)")
    .run(id(10+ordinal),id(2),id(1),id(3),id(4),id(5),id(6),"2026-09-13",ordinal,now);
}

test("0136 preserves completed-job retry graph and gates extra retries by explicit grant", () => {
  const db = fixture();
  try {
    const before = tables.map(table => db.prepare(`SELECT * FROM ${table}`).all());
    db.transaction(() => sharedTradeAnalyzerOwnerExemptionsMigration.statements.forEach(sql => db.exec(sql))).immediate();
    assert.deepEqual(tables.map(table => db.prepare(`SELECT * FROM ${table}`).all()), before);
    assert.deepEqual(db.pragma("foreign_key_check"), []);
    for (const table of tables) assert.ok(!(db.pragma(`foreign_key_list(${table})`) as { table: string }[]).some(row => row.table.endsWith("_0136_old")));
    db.prepare("UPDATE level_analysis_logical_trade_jobs SET status='queued'").run();
    assert.throws(() => insertRetry(db,4), /manual_retry_limit_reached/);
    db.prepare("INSERT INTO level_analysis_owner_exemption_events VALUES(?,?,?,1,?)").run(id(40),id(1),id(1),now);
    insertRetry(db,4);
    db.prepare("INSERT INTO level_analysis_owner_exemption_events VALUES(?,?,?,0,?)").run(id(41),id(1),id(1),now);
    assert.throws(() => insertRetry(db,5), /manual_retry_limit_reached/);
    assert.throws(() => db.exec("DELETE FROM level_analysis_manual_retry_requests"), /required/);
    assert.throws(() => db.exec("UPDATE level_analysis_owner_exemption_events SET enabled=1"), /immutable/);
    assert.deepEqual(db.pragma("foreign_key_check"), []);
  } finally { db.close(); }
});

test("0136 failure rolls back schema and all existing retry evidence", () => {
  const db = fixture();
  try {
    const beforeSchema = db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY name").all();
    const beforeRows = tables.map(table => db.prepare(`SELECT * FROM ${table}`).all());
    assert.throws(() => db.transaction(() => {
      sharedTradeAnalyzerOwnerExemptionsMigration.statements.forEach(sql => db.exec(sql));
      throw new Error("checkpoint failure");
    }).immediate(), /checkpoint failure/);
    assert.deepEqual(db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema ORDER BY name").all(),beforeSchema);
    assert.deepEqual(tables.map(table => db.prepare(`SELECT * FROM ${table}`).all()),beforeRows);
    assert.deepEqual(db.pragma("foreign_key_check"), []);
  } finally { db.close(); }
});

const ownerScope: JournalAdminScope = { userId: id(1), role: "journal_owner_admin",
  mode: "production_discord_owner", authorizedAtUtc: now, discordOwnerVerifiedAtUtc: now,
  permissions: ["manage_users"] };

function accountingFixture() {
  const db = fixture();
  db.transaction(() => sharedTradeAnalyzerOwnerExemptionsMigration.statements.forEach(sql => db.exec(sql))).immediate();
  db.exec(`ALTER TABLE level_analysis_analyzer_acquisitions ADD COLUMN completed_at_utc;
ALTER TABLE level_analysis_analyzer_acquisitions ADD COLUMN outcome;
UPDATE level_analysis_analyzer_acquisitions SET completed_at_utc=started_at_utc,outcome='ready';
UPDATE level_analysis_logical_trade_jobs SET status='queued';
CREATE TABLE level_analysis_shared_analyzer_settings(settings_key,enabled,default_daily_limit,default_period_limit,global_rolling_24h_limit,request_spacing_seconds,designated_user_id,designated_workspace_id,designated_account_id,revision);
CREATE TABLE level_analysis_user_allowance_cycles(allowance_cycle_id,user_id,starts_on_new_york_date,ends_on_new_york_date,created_at_utc);
CREATE TABLE level_analysis_user_allowance_overrides(user_id,daily_limit,period_limit);
CREATE TABLE level_analysis_user_allowance_resets(user_id,allowance_cycle_id,reset_kind,created_at_utc);
CREATE TABLE level_analysis_analyzer_reservations(reservation_id,user_id,logical_trade_job_id UNIQUE,allowance_cycle_id,daily_new_york_date,status,correction_waiver,expires_at_utc,created_at_utc,updated_at_utc);`);
  db.prepare("INSERT INTO level_analysis_shared_analyzer_settings VALUES('beta',1,0,0,0,10,?,?,?,1)").run(id(1),id(3),id(4));
  return db;
}

test("exemption bypasses personal and global quantities, not provider pacing or service disable", () => {
  const db = accountingFixture();
  try {
    const allowances = new SharedAnalyzerAllowanceRepository(db);
    const exemptions = new AnalyzerOwnerExemptionRepository(db);
    const at = new Date(now), later = new Date(at.getTime() + 11_000);
    assert.equal(allowances.availability(id(1),at).selectableAvailable,0);
    assert.equal(allowances.reserve({ userId:id(1),jobId:id(2),now:at }),null);
    exemptions.set(ownerScope,id(1),true,at);
    assert.deepEqual(allowances.availability(id(1),at),{enabled:true,unlimited:true,dailyAvailable:null,periodAvailable:null,selectableAvailable:null,daysUntilReset:0});
    assert.ok(allowances.reserve({userId:id(1),jobId:id(2),now:at}));
    // Existing ordinary request still enforces spacing for the exempt user.
    assert.equal(allowances.beginAcquisition({jobId:id(2),marketSessionSetId:id(7),now:at}),null);
    const acquisition=allowances.beginAcquisition({jobId:id(2),marketSessionSetId:id(7),now:later})!;
    assert.ok(acquisition);
    assert.equal(acquisition.chargeKind,"correction_waived");
    assert.deepEqual(db.prepare("SELECT exemption_event_id FROM level_analysis_owner_exempt_acquisitions WHERE acquisition_id=?").get(acquisition.acquisitionId),{exemption_event_id:exemptions.activeEventId(id(1))});
    db.prepare("INSERT INTO level_analysis_logical_trade_jobs VALUES(?,?,?,?,?,?,'queued',?)").run(id(70),id(1),id(3),id(4),id(71),id(72),id(7));
    assert.ok(allowances.reserve({userId:id(1),jobId:id(70),now:later}));
    assert.equal(allowances.beginAcquisition({jobId:id(70),marketSessionSetId:id(7),now:new Date(at.getTime()+30_000)}),null);
    allowances.completeAcquisition({acquisitionId:acquisition.acquisitionId,now:later,outcome:"ready"});
    db.exec("UPDATE level_analysis_shared_analyzer_settings SET enabled=0");
    assert.equal(allowances.availability(id(1),later).enabled,false);
    assert.equal(allowances.reserve({userId:id(1),jobId:id(2),now:later}),null);
    assert.equal(allowances.beginAcquisition({jobId:id(2),marketSessionSetId:id(7),now:new Date(at.getTime()+30_000)}),null);
  } finally { db.close(); }
});

test("ordinary quota excludes owner acquisitions and ordinary retries still stop at three", () => {
  const db = accountingFixture();
  try {
    const allowances=new SharedAnalyzerAllowanceRepository(db), exemptions=new AnalyzerOwnerExemptionRepository(db);
    const at=new Date(now), later=new Date(at.getTime()+11_000), ordinaryAt=new Date(at.getTime()+22_000);
    const scope={userId:id(1),workspaceId:id(3),accountId:id(4),workspaceRole:"owner" as const};
    const retries=new ManualAnalyzerRetryRepository(db);
    assert.equal(retries.available(scope,id(5),at),false);
    assert.equal(retries.record(scope,id(2),at),null);
    exemptions.set(ownerScope,id(1),true,at);
    assert.ok(retries.record(scope,id(2),at));
    assert.ok(retries.record(scope,id(2),at));
    assert.equal((db.prepare("SELECT max(daily_ordinal) AS n FROM level_analysis_manual_retry_requests").get() as {n:number}).n,5);
    const ownerAcquisition=allowances.beginAcquisition({jobId:id(2),marketSessionSetId:id(7),now:later})!;
    assert.ok(ownerAcquisition);
    allowances.completeAcquisition({acquisitionId:ownerAcquisition.acquisitionId,now:later,outcome:"ready"});
    db.prepare("INSERT INTO platform_users(user_id) VALUES(?)").run(id(50));
    db.prepare("INSERT INTO level_analysis_logical_trade_jobs VALUES(?,?,?,?,?,?,'queued',?)").run(id(51),id(50),id(3),id(4),id(52),id(53),id(7));
    db.exec("UPDATE level_analysis_shared_analyzer_settings SET default_daily_limit=2,default_period_limit=2,global_rolling_24h_limit=2");
    assert.ok(allowances.reserve({userId:id(50),jobId:id(51),now:ordinaryAt}));
    const ordinary=allowances.beginAcquisition({jobId:id(51),marketSessionSetId:id(7),now:ordinaryAt})!;
    assert.ok(ordinary); // One older ordinary acquisition + one owner acquisition must not fill quota 2.
    assert.equal(ordinary.chargeKind,"user_charged");
    allowances.completeAcquisition({acquisitionId:ordinary.acquisitionId,now:ordinaryAt,outcome:"ready"});
    const next=new Date(at.getTime()+33_000);
    db.prepare("INSERT INTO level_analysis_logical_trade_jobs VALUES(?,?,?,?,?,?,'queued',?)").run(id(54),id(50),id(3),id(4),id(55),id(56),id(7));
    assert.ok(allowances.reserve({userId:id(50),jobId:id(54),now:next}));
    assert.equal(allowances.beginAcquisition({jobId:id(54),marketSessionSetId:id(7),now:next}),null);
    exemptions.set(ownerScope,id(1),false,next);
    assert.equal(retries.available(scope,id(5),next),false);
    assert.equal(retries.record(scope,id(2),next),null);
    assert.deepEqual(db.pragma("foreign_key_check"),[]);
  } finally { db.close(); }
});

test("first owner download uses an audited free reservation without any prior retry", () => {
  const db=accountingFixture();
  try {
    const exemptions=new AnalyzerOwnerExemptionRepository(db), allowances=new SharedAnalyzerAllowanceRepository(db);
    const at=new Date(now), later=new Date(at.getTime()+11_000);
    exemptions.set(ownerScope,id(1),true,at);
    db.prepare("INSERT INTO level_analysis_logical_trade_jobs VALUES(?,?,?,?,?,?,'queued',?)").run(id(60),id(1),id(3),id(4),id(61),id(62),id(7));
    const reservation=allowances.reserve({userId:id(1),jobId:id(60),now:later});
    assert.ok(reservation);
    const acquisition=allowances.beginAcquisition({jobId:id(60),marketSessionSetId:id(7),now:later})!;
    assert.ok(acquisition);
    assert.deepEqual(db.prepare("SELECT charge_kind,reservation_id FROM level_analysis_analyzer_acquisitions WHERE acquisition_id=?").get(acquisition.acquisitionId),
      {charge_kind:"correction_waived",reservation_id:reservation});
    assert.equal(db.prepare("SELECT 1 FROM level_analysis_manual_retry_acquisitions WHERE acquisition_id=?").get(acquisition.acquisitionId),undefined);
    assert.ok(db.prepare("SELECT 1 FROM level_analysis_owner_exempt_acquisitions WHERE acquisition_id=?").get(acquisition.acquisitionId));
    assert.deepEqual(db.prepare("SELECT status FROM level_analysis_analyzer_reservations WHERE reservation_id=?").get(reservation),{status:"consumed"});
    assert.deepEqual(db.pragma("foreign_key_check"),[]);
  } finally {db.close();}
});

test("owner exemption is explicit, scoped, idempotent and revocable without erasing history", () => {
  const db = fixture();
  try {
    db.transaction(() => sharedTradeAnalyzerOwnerExemptionsMigration.statements.forEach(sql => db.exec(sql))).immediate();
    db.prepare("INSERT INTO platform_users(user_id) VALUES(?)").run(id(50));
    const repo = new AnalyzerOwnerExemptionRepository(db);
    assert.equal(repo.activeEventId(id(1)), null);
    assert.equal(repo.activeEventId(id(50)), null);
    assert.throws(() => repo.set({ ...ownerScope, permissions: [] }, id(50), true, new Date(now)), /not_authorized/);
    assert.throws(() => repo.set(ownerScope, id(99), true, new Date(now)), /user_unavailable/);
    repo.set(ownerScope, id(50), true, new Date(now));
    const grant = repo.activeEventId(id(50));
    assert.ok(grant);
    assert.equal(repo.activeEventId(id(1)), null);
    repo.set(ownerScope, id(50), true, new Date(now));
    assert.equal((db.prepare("SELECT count(*) AS n FROM level_analysis_owner_exemption_events").get() as { n: number }).n, 1);
    // Same-millisecond disable wins deterministically, including a new repository instance.
    repo.set(ownerScope, id(50), false, new Date(now));
    assert.equal(new AnalyzerOwnerExemptionRepository(db).activeEventId(id(50)), null);
    const history = db.prepare("SELECT user_id,actor_user_id,enabled FROM level_analysis_owner_exemption_events ORDER BY rowid").all();
    assert.deepEqual(history, [1, 0].map(enabled => ({ user_id: id(50), actor_user_id: id(1), enabled })));
    db.prepare("UPDATE platform_users SET status='disabled' WHERE user_id=?").run(id(50));
    assert.throws(() => repo.set(ownerScope, id(50), true, new Date(now)), /user_unavailable/);
  } finally { db.close(); }
});

test("exempt acquisitions require the current matching grant and an atomic audit link", () => {
  const db = fixture();
  try {
    db.transaction(() => sharedTradeAnalyzerOwnerExemptionsMigration.statements.forEach(sql => db.exec(sql))).immediate();
    const repo = new AnalyzerOwnerExemptionRepository(db);
    repo.set(ownerScope, id(1), true, new Date(now));
    const grant = repo.activeEventId(id(1))!;
    assert.throws(() => repo.recordAcquisition(id(20), grant), /transaction_required/);
    db.transaction(() => repo.recordAcquisition(id(20), grant)).immediate();
    assert.throws(() => db.exec("DELETE FROM level_analysis_owner_exempt_acquisitions"), /required/);
    db.prepare("INSERT INTO level_analysis_analyzer_acquisitions VALUES(?,?,?,'user_charged',NULL,?)").run(id(21),id(1),id(7),now);
    assert.throws(() => db.transaction(() => repo.recordAcquisition(id(21), grant)).immediate(), /acquisition_invalid/);
    repo.set(ownerScope, id(1), false, new Date(now));
    db.prepare("INSERT INTO level_analysis_analyzer_acquisitions VALUES(?,?,?,'correction_waived',NULL,?)").run(id(22),id(1),id(7),now);
    assert.throws(() => db.transaction(() => repo.recordAcquisition(id(22), grant)).immediate(), /acquisition_invalid/);
    assert.equal((db.prepare("SELECT count(*) AS n FROM level_analysis_owner_exempt_acquisitions").get() as { n: number }).n, 1);
    assert.deepEqual(db.pragma("foreign_key_check"), []);
  } finally { db.close(); }
});
