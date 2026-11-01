// @vitest-environment node
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./platform-membership-discord', () => ({ readDiscordMembershipGrants: () => [] }));
import { readGenerationAllowance } from './platform-membership-generation-allowance';
import { SharedAnalyzerAllowanceRepository } from '@/src/modules/level-analysis/server/shared-analyzer-allowance-repository';
const user='00000000-0000-4000-8000-000000000001';
const other='00000000-0000-4000-8000-000000000002';
const at=new Date('2026-10-15T12:00:00.000Z');
const anchor='2026-10-10T12:00:00.000Z';
let db: Database.Database;
const read=(now=at,exclude: string|null=null)=>readGenerationAllowance(db,user,'trade_analyzer.analyses',now,exclude);
function grant(limit: number|null,days: number|null=5,version='base',ends: string|null=null) {
 db.prepare('INSERT INTO platform_membership_plan_versions VALUES (?,?)').run(version,anchor);
 db.prepare("INSERT INTO platform_membership_plan_features VALUES (?,'trade_analyzer.analyses','limit',?,?)").run(version,limit,days);
 db.prepare("INSERT INTO platform_membership_entitlements VALUES (?,?,'active',?,'owner_grant',?,?,?,?)").run(version,user,version,anchor,ends,anchor,anchor);
}
function job(id: string) { db.prepare("INSERT INTO level_analysis_logical_trade_jobs VALUES (?,?,'leased')").run(id,user); }
beforeEach(()=>{
 db=new Database(':memory:');
 db.exec(`CREATE TABLE platform_membership_plan_versions(plan_version_id,published_at_utc);
 CREATE TABLE platform_membership_plan_features(plan_version_id,feature_key,feature_kind,limit_value,reset_days);
 CREATE TABLE platform_membership_entitlements(entitlement_id,user_id,status,plan_version_id,source_type,starts_at_utc,ends_at_utc,created_at_utc,updated_at_utc);
 CREATE TABLE platform_membership_feature_policies(feature_key,enforcement_mode);
 CREATE TABLE platform_operator_grants(user_id,authority_key,grant_state);
 CREATE TABLE level_analysis_analyzer_reservations(reservation_id,user_id,logical_trade_job_id,allowance_cycle_id,daily_new_york_date,status,correction_waiver,expires_at_utc,created_at_utc,updated_at_utc);
 CREATE TABLE level_analysis_analyzer_acquisitions(acquisition_id,market_session_set_id,charged_user_id,reservation_id,charge_kind,started_at_utc,completed_at_utc,outcome);
 CREATE TABLE level_analysis_shared_analyzer_settings(settings_key,enabled,default_daily_limit,default_period_limit,global_rolling_24h_limit,request_spacing_seconds,designated_user_id,designated_workspace_id,designated_account_id,revision);
 INSERT INTO level_analysis_shared_analyzer_settings VALUES ('beta',1,10,100,120,0,'provider','workspace','account',0);
 CREATE TABLE level_analysis_user_allowance_cycles(allowance_cycle_id,user_id,starts_on_new_york_date,ends_on_new_york_date,created_at_utc);
 CREATE TABLE level_analysis_user_allowance_overrides(user_id,daily_limit,period_limit);
 CREATE TABLE level_analysis_owner_exemption_events(exemption_event_id,user_id,enabled,created_at_utc);
 CREATE TABLE level_analysis_owner_exempt_acquisitions(acquisition_id,exemption_event_id);
 CREATE TABLE level_analysis_logical_trade_jobs(logical_trade_job_id,user_id,status);
 CREATE TABLE level_analysis_manual_retry_requests(retry_request_id,logical_trade_job_id,user_id,created_at_utc);
 CREATE TABLE level_analysis_manual_retry_acquisitions(acquisition_id,retry_request_id);`);
 for(const name of ['plans','offers','feature_definitions','claims','version_changes','recurring_grants','trial_checkouts']) db.exec(`CREATE TABLE platform_membership_${name}(id)`);
});
afterEach(()=>db.close());
describe('plan-based Analyzer generation admission and accounting',()=>{
 it('defaults to enforced and distinguishes no feature from an included zero allowance',()=>{
  expect(read()).toMatchObject({included:false,remaining:0});
  grant(0);expect(read()).toMatchObject({included:true,remaining:0});
 });
 it.each(['off','shadow'])('preserves explicit %s policy and beta fallback',mode=>{
  db.prepare("INSERT INTO platform_membership_feature_policies VALUES ('trade_analyzer.analyses',?)").run(mode);
  expect(read()).toBeNull();expect(new SharedAnalyzerAllowanceRepository(db).availability(user,at).selectableAvailable).toBe(10);
 });
 it('reserves the last use atomically across jobs and releases an unused reservation',()=>{
  grant(1);const r=new SharedAnalyzerAllowanceRepository(db);job('a');job('b');
  expect(r.reserve({userId:user,jobId:'a',now:at})).toBeTruthy();
  expect(r.reserve({userId:user,jobId:'b',now:at})).toBeNull();
  expect(read()!.remaining).toBe(0);
  r.release('a',at);expect(read()!.remaining).toBe(1);
 });
 it('denies missing and expired plans before reserving or starting acquisition',()=>{
  const r=new SharedAnalyzerAllowanceRepository(db);expect(r.reserve({userId:user,jobId:'a',now:at})).toBeNull();
  grant(1,5,'base','2026-10-15T12:01:00.000Z');job('a');expect(r.reserve({userId:user,jobId:'a',now:at})).toBeTruthy();
  expect(r.beginAcquisition({jobId:'a',marketSessionSetId:'set',now:new Date('2026-10-15T12:02:00.000Z')})).toBeNull();
  expect(db.prepare('SELECT count(*) n FROM level_analysis_analyzer_acquisitions').get()).toEqual({n:0});
 });
 it('excludes the current reservation for first acquisition, charges once and keeps continuation across a reset free',()=>{
  grant(1);const r=new SharedAnalyzerAllowanceRepository(db);job('a');
  r.reserve({userId:user,jobId:'a',now:at});
  const acquired=r.beginAcquisition({jobId:'a',marketSessionSetId:'set',now:at});expect(acquired).toBeTruthy();
  expect(read()!.remaining).toBe(0);
  db.exec("UPDATE level_analysis_analyzer_acquisitions SET completed_at_utc=started_at_utc");
  const later=new Date('2026-10-20T12:00:00.000Z');
  // Extend only the test reservation TTL to exercise reset accounting independently of TTL.
  db.exec("UPDATE level_analysis_analyzer_reservations SET expires_at_utc='2026-10-21T12:00:00.000Z'");
  expect(read(later)!.remaining).toBe(1);
  expect(r.beginAcquisition({jobId:'a',marketSessionSetId:'set',now:later,historyContinuation:true})).toBeTruthy();
  expect(read(later)!.remaining).toBe(1);
 });
 it('counts user-wide usage, not another member, and does not reset a lifetime allowance',()=>{
  grant(2,null);const r=new SharedAnalyzerAllowanceRepository(db);job('a');r.reserve({userId:user,jobId:'a',now:at});
  expect(r.beginAcquisition({jobId:'a',marketSessionSetId:'set',now:at})).toBeTruthy();
  db.prepare("INSERT INTO level_analysis_analyzer_acquisitions VALUES ('other','set',?,'unrelated','user_charged',?,?,'ready')").run(other,at.toISOString(),at.toISOString());
  expect(read(new Date('2027-01-01T00:00:00.000Z'))).toMatchObject({remaining:1,resetsAtUtc:null});
 });
 it('accepts unlimited and owner access without removing the provider service switch',()=>{
  grant(null);const r=new SharedAnalyzerAllowanceRepository(db);expect(r.availability(user,at).unlimited).toBe(true);
  db.exec('DELETE FROM platform_membership_entitlements');
  db.prepare("INSERT INTO platform_operator_grants VALUES (?,'journal_administration','active')").run(user);
  expect(read()).toMatchObject({included:true,remaining:null});
  db.exec('UPDATE level_analysis_shared_analyzer_settings SET enabled=0');expect(r.reserve({userId:user,jobId:'a',now:at})).toBeNull();
 });
 it('keeps independent grants as alternatives rather than double-counting the same usage',()=>{
  grant(10,5,'first');grant(20,5,'second');expect(read()!.remaining).toBe(20);
 });
 it('uses the published UTC reset boundary exactly',()=>{
  grant(1);const r=new SharedAnalyzerAllowanceRepository(db);job('a');const before=new Date('2026-10-15T11:59:59.999Z');
  r.reserve({userId:user,jobId:'a',now:before});r.beginAcquisition({jobId:'a',marketSessionSetId:'set',now:before});
  expect(read(before)!.remaining).toBe(0);expect(read(at)).toMatchObject({remaining:1,resetsAtUtc:'2026-10-20T12:00:00.000Z'});
 });
 it('returns an expired uncharged reservation without resetting the member ledger',()=>{
  grant(1);const r=new SharedAnalyzerAllowanceRepository(db);job('a');r.reserve({userId:user,jobId:'a',now:at});
  expect(read()!.remaining).toBe(0);
  expect(read(new Date(at.getTime()+86400001))!.remaining).toBe(1);
 });
 it('retains charges when unlimited membership is replaced with a finite plan',()=>{
  grant(null);const r=new SharedAnalyzerAllowanceRepository(db);job('a');r.reserve({userId:user,jobId:'a',now:at});
  expect(r.beginAcquisition({jobId:'a',marketSessionSetId:'set',now:at})).toBeTruthy();
  db.exec('DELETE FROM platform_membership_entitlements');grant(1,null,'replacement');
  expect(read()!.remaining).toBe(0);
 });
 it('does not let an unlimited plan bypass global provider capacity',()=>{
  grant(null);db.exec('UPDATE level_analysis_shared_analyzer_settings SET global_rolling_24h_limit=0');
  const r=new SharedAnalyzerAllowanceRepository(db);job('a');r.reserve({userId:user,jobId:'a',now:at});
  expect(r.beginAcquisition({jobId:'a',marketSessionSetId:'set',now:at})).toBeNull();
  expect(db.prepare('SELECT count(*) n FROM level_analysis_analyzer_acquisitions').get()).toEqual({n:0});
 });

});

describe('plan-based Levels Generator allowance',()=>{
 const levels=()=>readGenerationAllowance(db,user,'levels.generations',at);
 beforeEach(()=>db.exec('CREATE TABLE platform_stock_levels_usage(user_id,requested_at_ms)'));
 it('defaults enforced with no access and distinguishes included zero',()=>{
  expect(levels()).toMatchObject({included:false,remaining:0});
  grant(0);db.exec("UPDATE platform_membership_plan_features SET feature_key='levels.generations'");
  expect(levels()).toMatchObject({included:true,remaining:0});
 });
 it('counts all user usage while excluding other users and prior periods',()=>{
  grant(2);db.exec("UPDATE platform_membership_plan_features SET feature_key='levels.generations'");
  const insert=db.prepare('INSERT INTO platform_stock_levels_usage VALUES (?,?)');
  insert.run(user,at.getTime()-1);insert.run(other,at.getTime()+1);
  expect(levels()).toMatchObject({remaining:2});
  insert.run(user,at.getTime()+1);expect(levels()).toMatchObject({remaining:1});
  insert.run(user,at.getTime()+2);expect(levels()).toMatchObject({remaining:0});
 });
 it('supports unlimited and rejects expired grants',()=>{
  grant(null);db.exec("UPDATE platform_membership_plan_features SET feature_key='levels.generations'");
  expect(levels()).toMatchObject({included:true,remaining:null});
  db.prepare('UPDATE platform_membership_entitlements SET ends_at_utc=?').run('2026-10-15T11:59:59.000Z');
  expect(levels()).toMatchObject({included:false,remaining:0});
 });
 it.each(['off','shadow'])('preserves explicit %s rollout',mode=>{
  db.prepare("INSERT INTO platform_membership_feature_policies VALUES ('levels.generations',?)").run(mode);
  expect(levels()).toBeNull();
 });
});
