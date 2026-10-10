// Remote-only deterministic QA. No application server, provider or notification imports.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import Database from 'better-sqlite3';
import * as foundation from '../src/modules/platform/server/database/migrations/0148_platform_membership_platform';
import * as periods from '../src/modules/platform/server/database/migrations/0150_platform_membership_generation_allowances';
import * as privateStorage from '../src/modules/platform/server/database/migrations/0158_platform_member_private_watchlists';
import { PlatformMembershipRepository } from '../src/modules/platform/server/membership/platform-membership-repository';
import { PlatformMembershipClaims } from '../src/modules/platform/server/membership/platform-membership-claims';
import { readGenerationAllowance } from '../src/modules/platform/server/membership/platform-membership-generation-allowance';
import { evaluateMembershipFeature } from '../src/modules/platform/server/membership/platform-membership-access';
import { PrivateWatchlistRepository } from '../src/modules/watchlist/server/private/private-watchlist-repository';
import { privateWatchlistRemaining } from '../src/modules/watchlist/server/private/private-watchlist-allowance';

globalThis.fetch = async () => { throw new Error('Network prohibited in synthetic membership QA'); };
const db = new Database(':memory:');
const owner = randomUUID(), member = randomUUID(), other = randomUUID(), trialMember = randomUUID();
const now = new Date().toISOString();
const after = (days: number) => new Date(Date.parse(now) + days * 86400000).toISOString();
const checks: string[] = [];
function check(name: string, action: () => void) { action(); checks.push(name); console.log(`PASS ${name}`); }
try {
  db.pragma('foreign_keys=ON');
  db.exec("CREATE TABLE platform_users(user_id TEXT PRIMARY KEY,display_name TEXT,status TEXT);");
  for (const id of [owner, member, other, trialMember]) db.prepare('INSERT INTO platform_users VALUES (?,?,?)').run(id,'SYNTHETIC QA','active');
  for (const module of [foundation, periods, privateStorage]) {
    const migration = Object.values(module).find(value => value && typeof value === 'object' && 'statements' in value)!;
    for (const sql of (migration as { statements: readonly string[] }).statements) db.exec(sql);
  }
  db.exec(`CREATE TABLE platform_stock_levels_usage(user_id TEXT,requested_at_ms INTEGER);
    CREATE TABLE level_analysis_analyzer_reservations(reservation_id TEXT,user_id TEXT,correction_waiver INTEGER,status TEXT,expires_at_utc TEXT);
    CREATE TABLE level_analysis_analyzer_acquisitions(reservation_id TEXT,charged_user_id TEXT,charge_kind TEXT,started_at_utc TEXT);`);
  const repo = new PlatformMembershipRepository(db);
  repo.synchronizeBuiltInFeatures(owner, now);
  db.prepare("INSERT INTO platform_membership_feature_policies SELECT feature_key,'enforced',?,? FROM platform_membership_feature_definitions").run(owner, now);
  function plan(key: string, limit: number | null, resetDays: number | null = 7) {
    const result = repo.createPlan({actorUserId:owner,planKey:key,name:`SYNTHETIC ${key}`,visibility:'public',atUtc:now,features:[
      ...['private_watchlist.access','private_watchlist.analysis'].map(featureKey => ({featureKey,limitValue:null})),
      ...['trade_analyzer.analyses','levels.generations'].map(featureKey => ({featureKey,limitValue:limit,resetDays})),
      {featureKey:'private_watchlist.ticker_additions',limitValue:2},
      {featureKey:'private_watchlist.active_tickers',limitValue:1},
      {featureKey:'private_watchlist.generations',limitValue:1},
      {featureKey:'private_watchlist.cost_microusd',limitValue:100},
    ]});
    repo.publishPlanVersion({actorUserId:owner,planVersionId:result.planVersionId,atUtc:now}); return result;
  }
  const limited = plan('qa-limited',2);
  function grant(userId: string, planVersionId: string) { repo.grantEntitlement({actorUserId:owner,userId,planVersionId,sourceType:'owner_grant',sourceRef:randomUUID(),startsAtUtc:now,endsAtUtc:null,atUtc:now}); }
  grant(member,limited.planVersionId); grant(other,limited.planVersionId);
  const allowance = (user: string, feature: 'levels.generations' | 'trade_analyzer.analyses', at=now) => readGenerationAllowance(db,user,feature,new Date(at));
  check('non-owner limited grants and missing grants',()=>{
    assert.equal(allowance(member,'levels.generations')?.remaining,2);
    assert.equal(allowance(trialMember,'levels.generations')?.remaining,0);
    assert.equal(evaluateMembershipFeature(db,member,'levels.generations',3,now).allowed,false);
  });
  check('Levels exact exhaustion, user isolation and seven-day reset',()=>{
    for(let i=0;i<2;i++) db.prepare('INSERT INTO platform_stock_levels_usage VALUES (?,?)').run(member,Date.parse(now));
    assert.equal(allowance(member,'levels.generations')?.remaining,0);
    assert.equal(allowance(other,'levels.generations')?.remaining,2);
    assert.equal(allowance(member,'levels.generations',after(7))?.remaining,2);
  });
  check('Analyzer active holds, charged work, waiver and user isolation',()=>{
    db.prepare('INSERT INTO level_analysis_analyzer_reservations VALUES (?,?,0,?,?)').run('held',member,'active',after(1));
    db.prepare('INSERT INTO level_analysis_analyzer_reservations VALUES (?,?,0,?,?)').run('charged',member,'completed',now);
    db.prepare('INSERT INTO level_analysis_analyzer_acquisitions VALUES (?,?,?,?)').run('charged',member,'user_charged',now);
    db.prepare('INSERT INTO level_analysis_analyzer_reservations VALUES (?,?,1,?,?)').run('waived',member,'active',after(1));
    assert.equal(allowance(member,'trade_analyzer.analyses')?.remaining,0);
    assert.equal(allowance(other,'trade_analyzer.analyses')?.remaining,2);
    assert.equal(allowance(member,'trade_analyzer.analyses',after(7))?.remaining,2);
  });
  const watch = new PrivateWatchlistRepository(db);
  check('private ticker capacity, duplicate idempotency, archive and additions cap',()=>{
    const request = randomUUID(); watch.add(member,'AAPL',request,now); watch.add(member,'AAPL',request,now);
    assert.equal(privateWatchlistRemaining(db,member,'ticker_additions',now),1);
    assert.throws(()=>watch.add(member,'MSFT',randomUUID(),now),/allowance/);
    watch.archive(other,'AAPL',now); assert.equal(watch.list(member,now)[0].state,'active');
    assert.equal(watch.list(other,now).length,0);
    watch.archive(member,'AAPL',now); watch.add(member,'MSFT',randomUUID(),now);
    watch.archive(member,'MSFT',now);
    assert.throws(()=>watch.add(member,'AAPL',randomUUID(),now),/allowance/);
  });
  check('private generation gate, budget reservations and unresolved rollover',()=>{
    watch.add(other,'AAPL',randomUUID(),now);
    assert.throws(()=>watch.reserveGeneration(other,'AAPL',randomUUID(),{analysis:false,indicators:true,levels:false},0,now));
    assert.throws(()=>watch.reserveGeneration(other,'AAPL',randomUUID(),{analysis:true,indicators:false,levels:false},101,now),/allowance/);
    const request=randomUUID(), selection={analysis:true,indicators:false,levels:false};
    assert.equal(watch.reserveGeneration(other,'AAPL',request,selection,100,now).dispatch,true);
    assert.equal(watch.reserveGeneration(other,'AAPL',request,selection,100,now).dispatch,false);
    watch.markUnresolved(other,request,now);
    assert.equal(privateWatchlistRemaining(db,other,'cost_microusd',after(40)),0);
    assert.equal(privateWatchlistRemaining(db,other,'generations',after(40)),0);
    assert.throws(()=>watch.reserveGeneration(other,'AAPL',randomUUID(),selection,0,now),/allowance/);
  });
  check('additive larger plan and unlimited plan never reduce allowance',()=>{
    grant(member,plan('qa-larger',5).planVersionId);
    assert.equal(allowance(member,'levels.generations')?.remaining,3);
    grant(member,plan('qa-unlimited',null).planVersionId);
    assert.equal(allowance(member,'levels.generations')?.remaining,null);
  });
  check('zero allowance and non-resetting allowance',()=>{
    grant(trialMember,plan('qa-zero',0).planVersionId);
    assert.equal(allowance(trialMember,'levels.generations')?.remaining,0);
    grant(trialMember,plan('qa-lifetime',1,null).planVersionId);
    db.prepare('INSERT INTO platform_stock_levels_usage VALUES (?,?)').run(trialMember,Date.parse(now));
    assert.equal(allowance(trialMember,'levels.generations',after(400))?.remaining,0);
    db.prepare('DELETE FROM platform_membership_entitlements WHERE user_id=?').run(trialMember);
  });
  check('private custom-period override resets and expires without granting access',()=>{
    db.prepare('INSERT INTO platform_private_watchlist_member_overrides VALUES (?,?,?,?,?,?,?,?,?)')
      .run(member,'ticker_additions',3,'days',3,now,after(10),owner,now);
    assert.equal(privateWatchlistRemaining(db,member,'ticker_additions',now),1);
    assert.equal(privateWatchlistRemaining(db,member,'ticker_additions',after(3)),3);
    db.prepare('INSERT INTO platform_private_watchlist_member_overrides VALUES (?,?,?,?,?,?,?,?,?)')
      .run(trialMember,'ticker_additions',null,'lifetime',null,now,null,owner,now);
    assert.throws(()=>watch.add(trialMember,'AAPL',randomUUID(),now));
  });
  repo.registerProvider({actorUserId:owner,providerKey:'free',label:'SYNTHETIC free',integrationMode:'free',configurationState:'ready',atUtc:now});
  const offer=repo.createOffer({actorUserId:owner,planVersionId:limited.planVersionId,name:'SYNTHETIC trial',provider:'free',channel:'website',billingKind:'free',currency:null,initialAmountMinor:null,renewalAmountMinor:null,billingPeriodDays:null,atUtc:now});
  db.prepare("UPDATE platform_membership_offers SET status='active' WHERE offer_id=?").run(offer);
  function campaign(mode: 'once_per_campaign'|'once_ever'|'unlimited'|'owner_only', capacity: number|null=1, amount=0) {
    const id=repo.createTrialCampaign({actorUserId:owner,offerId:offer,name:'SYNTHETIC trial',durationDays:3,entryAmountMinor:amount,paymentMethodRequired:false,eligibilityMode:mode,enrollmentStartsAtUtc:now,enrollmentEndsAtUtc:after(30),capacity,atUtc:now});
    db.prepare("UPDATE platform_membership_trial_campaigns SET status='active' WHERE trial_campaign_id=?").run(id); return id;
  }
  const claims=new PlatformMembershipClaims(db);
  check('free trial capacity, ownership, idempotency, exact expiry and repeat denial',()=>{
    const id=campaign('once_per_campaign');
    const claim=claims.reserve({userId:trialMember,offerId:offer,trialCampaignId:id,atUtc:now});
    assert.throws(()=>claims.reserve({userId:other,offerId:offer,trialCampaignId:id,atUtc:now}));
    assert.throws(()=>claims.fulfillFree(claim.claimId,other,now));
    claims.fulfillFree(claim.claimId,trialMember,now); claims.fulfillFree(claim.claimId,trialMember,now);
    assert.equal(repo.readEffectiveAccess(trialMember,after(2)).sources.length,1);
    assert.equal(repo.readEffectiveAccess(trialMember,after(3)).sources.length,0);
    assert.throws(()=>claims.reserve({userId:trialMember,offerId:offer,trialCampaignId:id,atUtc:after(4)}));
  });
  check('unlimited trial repeat and released capacity',()=>{
    const id=campaign('unlimited',null); const input={userId:trialMember,offerId:offer,trialCampaignId:id,atUtc:now};
    const first=claims.reserve(input); claims.release(first.claimId);
    const second=claims.reserve(input); claims.fulfillFree(second.claimId,trialMember,now);
    const third=claims.reserve({...input,atUtc:after(4)}); claims.release(third.claimId);
  });
  check('owner-only campaign rejects ordinary member',()=>{
    const id=campaign('owner_only',null);
    assert.throws(()=>claims.reserve({userId:trialMember,offerId:offer,trialCampaignId:id,atUtc:now}));
  });
  check('once-ever, closed window and unconfigured paid trial fail safely',()=>{
    assert.throws(()=>claims.reserve({userId:trialMember,offerId:offer,trialCampaignId:campaign('once_ever',null),atUtc:now}));
    const window=campaign('unlimited',null);
    assert.throws(()=>claims.reserve({userId:trialMember,offerId:offer,trialCampaignId:window,atUtc:after(30)}));
    assert.throws(()=>claims.reserve({userId:trialMember,offerId:offer,trialCampaignId:campaign('unlimited',null,100),atUtc:now}),/checkout/);
  });
  console.log(JSON.stringify({synthetic:true,database:':memory:',checks:checks.length,networkCalls:0,providerCalls:0}));
} finally { db.close(); }
