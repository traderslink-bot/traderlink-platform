// @vitest-environment node
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { describe,it,expect } from 'vitest';
import { platformIdentityMigration } from '../database/migrations/0001_platform_identity';
import { platformWhopAiReviewEntitlementsMigration } from '../database/migrations/0045_platform_whop_ai_review_entitlements';
import { WhopAiReviewEntitlementRepository } from './whop-ai-review-entitlement-repository';
const at='2026-10-15T12:00:00.000Z';
describe('legacy AI Review paid-period admission',()=>{
 it.each([
  ['2026-10-01T00:00:00.000Z','2026-11-01T00:00:00.000Z','active'],
  ['2026-10-01T00:00:00.000Z',at,'not_subscribed'],
  ['2026-10-16T00:00:00.000Z','2026-11-01T00:00:00.000Z','not_subscribed'],
  [null,null,'active'],
 ])('checks period %s through %s without deleting history',(start,end,expected)=>{
  const db=new Database(':memory:');db.pragma('foreign_keys=ON');try{
   for(const migration of [platformIdentityMigration,platformWhopAiReviewEntitlementsMigration])for(const sql of migration.statements)db.exec(sql);
   const user=randomUUID();db.prepare("INSERT INTO platform_users VALUES (?,'test','legacy','QA','active',?,?)").run(user,at,at);
   const repo=new WhopAiReviewEntitlementRepository(db);repo.linkUser(user,'a'.repeat(64),new Date(at));
   repo.applyMembershipEvent({webhookIdSha256:'1'.repeat(64),payloadSha256:'2'.repeat(64),eventType:'membership.activated',eventAtUtc:at,membershipRefHmac:'b'.repeat(64),whopUserRefHmac:'a'.repeat(64),companyRefHmac:'c'.repeat(64),productRefHmac:'d'.repeat(64),membershipState:'active',cancelAtPeriodEnd:true,renewalPeriodStartUtc:start,renewalPeriodEndUtc:end},new Date(at));
   expect(repo.readAccess(user,new Date(at)).state).toBe(expected);
   expect(db.prepare('SELECT COUNT(*) n FROM platform_whop_membership_projections').get()).toEqual({n:1});
  }finally{db.close()}
 });
});
