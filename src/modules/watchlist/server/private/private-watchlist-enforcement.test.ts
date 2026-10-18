// @vitest-environment node
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { describe,expect,it } from 'vitest';
import { platformIdentityMigration } from '../../../platform/server/database/migrations/0001_platform_identity';
import { platformAuthenticationIdentitiesMigration } from '../../../platform/server/database/migrations/0012_platform_authentication_identities';
import { platformDiscordMembershipsMigration } from '../../../platform/server/database/migrations/0017_platform_discord_memberships';
import { platformMembershipPlatformMigration } from '../../../platform/server/database/migrations/0148_platform_membership_platform';
import { platformMembershipGenerationAllowancesMigration } from '../../../platform/server/database/migrations/0150_platform_membership_generation_allowances';
import { platformMemberPrivateWatchlistsMigration } from '../../../platform/server/database/migrations/0158_platform_member_private_watchlists';
import { PlatformMembershipRepository } from '../../../platform/server/membership/platform-membership-repository';
import { membershipFeatureDefaultEnforcement } from '../../../platform/contracts/membership-product-features';
import { PrivateWatchlistRepository } from './private-watchlist-repository';
const at=new Date().toISOString(),selection={analysis:true,indicators:false,levels:false};
function fixture(features:readonly {featureKey:string;limitValue:number|null}[]=[]){
  const db=new Database(':memory:');db.pragma('foreign_keys=ON');
  for(const migration of [platformIdentityMigration,platformAuthenticationIdentitiesMigration,platformDiscordMembershipsMigration,platformMembershipPlatformMigration,platformMembershipGenerationAllowancesMigration,platformMemberPrivateWatchlistsMigration])for(const sql of migration.statements)db.exec(sql);
  const user=randomUUID(),other=randomUUID();for(const id of [user,other])db.prepare("INSERT INTO platform_users VALUES (?,'test',?,'QA','active',?,?)").run(id,id,at,at);
  const memberships=new PlatformMembershipRepository(db);memberships.synchronizeBuiltInFeatures(user,at);
  if(features.length){const plan=memberships.createPlan({actorUserId:user,planKey:'qa-'+randomUUID(),name:'Private Watchlist QA',visibility:'unlisted',features,atUtc:at});memberships.publishPlanVersion({actorUserId:user,planVersionId:plan.planVersionId,atUtc:at});memberships.grantEntitlement({actorUserId:user,userId:user,planVersionId:plan.planVersionId,sourceType:'free_plan',sourceRef:'qa-private',startsAtUtc:at,endsAtUtc:null,atUtc:at});}
  return {db,user,other,repo:new PrivateWatchlistRepository(db)};
}
const allowed=[{featureKey:'private_watchlist.access',limitValue:null},{featureKey:'private_watchlist.analysis',limitValue:null},...['ticker_additions','active_tickers','generations','cost_microusd'].map(meter=>({featureKey:'private_watchlist.'+meter,limitValue:meter==='cost_microusd'?5:1}))];
describe('default Private Watchlist plan restrictions',()=>{
  it('denies missing access before reads, ticker writes or generation reservations',()=>{
    const f=fixture();try{
      expect(()=>f.repo.list(f.user,at)).toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');
      expect(()=>f.repo.add(f.user,'QA',randomUUID(),at)).toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');
      expect(()=>f.repo.reserveGeneration(f.user,'QA',randomUUID(),selection,5,at)).toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');
      expect(f.db.prepare('SELECT COUNT(*) n FROM platform_private_watchlist_entries').get()).toEqual({n:0});
      expect(f.db.prepare('SELECT COUNT(*) n FROM platform_private_watchlist_operations').get()).toEqual({n:0});
    }finally{f.db.close()}
  });
  it('enforces slots, additions, generation count and budget without dispatching a provider',()=>{
    const f=fixture(allowed);try{
      f.repo.add(f.user,'QA',randomUUID(),at);
      expect(()=>f.repo.add(f.user,'QB',randomUUID(),at)).toThrow(/allowance reached/);
      expect(()=>f.repo.reserveGeneration(f.user,'QA',randomUUID(),selection,6,at)).toThrow(/allowance reached/);
      const request=randomUUID();expect(f.repo.reserveGeneration(f.user,'QA',request,selection,5,at).dispatch).toBe(true);
      expect(f.repo.reserveGeneration(f.user,'QA',request,selection,5,at).dispatch).toBe(false);
      expect(()=>f.repo.reserveGeneration(f.user,'QA',randomUUID(),selection,1,at)).toThrow(/allowance reached/);
      expect(f.repo.usage(f.user,at)).toMatchObject({tickerAdditionsRemaining:0,activeTickerSlotsRemaining:0,generationsRemaining:0,budgetRemainingMicrousd:0});
      expect(()=>f.repo.list(f.other,at)).toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');
    }finally{f.db.close()}
  });
  it('requires each selected card and preserves tickers after downgrade',()=>{
    const f=fixture(allowed.filter(x=>x.featureKey!=='private_watchlist.analysis'));try{
      f.repo.add(f.user,'QA',randomUUID(),at);
      expect(()=>f.repo.reserveGeneration(f.user,'QA',randomUUID(),selection,1,at)).toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');
      f.db.prepare("UPDATE platform_membership_entitlements SET status='revoked' WHERE user_id=?").run(f.user);
      expect(()=>f.repo.readCards(f.user,'QA',at)).toThrow('TRADERLINK_ACCOUNT_ACCESS_DENIED');
      f.repo.archive(f.user,'QA',at);
      expect(f.db.prepare('SELECT symbol,state FROM platform_private_watchlist_entries').get()).toEqual({symbol:'QA',state:'archived'});
    }finally{f.db.close()}
  });
  it('leaves Academy, unfinished AI Chat and unregistered Watchlist keys unchanged',()=>{
    for(const key of ['academy.access','ai.chat','watchlist.analysis'])expect(membershipFeatureDefaultEnforcement(key)).toBe('off');
  });
  it('enforces active ticker slots separately and archiving frees a slot',()=>{
    const f=fixture(allowed.map(x=>x.featureKey==='private_watchlist.ticker_additions'?{...x,limitValue:null}:x));try{
      f.repo.add(f.user,'QA',randomUUID(),at);
      expect(()=>f.repo.add(f.user,'QB',randomUUID(),at)).toThrow(/active_tickers allowance reached/);
      f.repo.archive(f.user,'QA',at);f.repo.add(f.user,'QB',randomUUID(),at);
      expect(f.repo.list(f.user,at).filter(x=>x.state==='active').map(x=>x.symbol)).toEqual(['QB']);
    }finally{f.db.close()}
  });

});
