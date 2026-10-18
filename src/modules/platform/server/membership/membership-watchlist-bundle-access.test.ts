// @vitest-environment node
import { PlatformMembershipCatalogRepository } from './platform-membership-catalog-repository';
import { randomUUID } from 'node:crypto';
import { beforeEach,afterEach,describe,it,expect,vi } from 'vitest';
import { amendmentFixture,amendmentAt as at } from './membership-addon-amendment.test-fixture';
import { MembershipAddonAmendmentRepository } from './membership-addon-amendment-repository';
import { readWatchlistPlanDecisions,saveWatchlistPlanPolicy,filterWatchlistPublicPlans } from '../../../watchlist/server/access/watchlist-plan-policy';
beforeEach(()=>{vi.stubEnv('STRIPE_SECRET_KEY','sk_test_synthetic_only');vi.stubEnv('STRIPE_MEMBERSHIP_WEBHOOK_SECRET','synthetic_only')});afterEach(()=>vi.unstubAllEnvs());
describe('ticker-specific access from purchased bundles',()=>{
 it('recognizes purchased add-on and base plan identities without granting unpublished or expired access',()=>{
  const f=amendmentFixture();try{
   saveWatchlistPlanPolicy(f.db,f.user,{symbol:'QA',control:'ticker',mode:'plans',planIds:[f.addon.planId!]});
   saveWatchlistPlanPolicy(f.db,f.user,{symbol:'QB',control:'analysis',mode:'plans',planIds:[f.base.planId!]});
   expect(readWatchlistPlanDecisions(f.db,f.user,'ticker').get('QA')).toBe(false);
   const r=new MembershipAddonAmendmentRepository(f.db),row=r.reserve(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]],at);
   expect(readWatchlistPlanDecisions(f.db,f.user,'ticker').get('QA')).toBe(false);
   r.quote(f.user,row.amendment_id,{item:'si_test',originalPrice:'price_old',targetPrice:'price_new',charge:500},at);r.beginConfirmation(f.user,row.amendment_id,at);r.applyPaidInvoice(row,'in_qa',at);
   expect(readWatchlistPlanDecisions(f.db,f.user,'ticker').get('QA')).toBe(true);
   expect(readWatchlistPlanDecisions(f.db,f.user,'analysis').get('QB')).toBe(true);
   const unrelated=f.publish('addon','Other package','1',1);
   saveWatchlistPlanPolicy(f.db,f.user,{symbol:'QC',control:'levels',mode:'plans',planIds:[unrelated.planId!]});
   expect(readWatchlistPlanDecisions(f.db,f.user,'levels').get('QC')).toBe(false);
   f.db.prepare("UPDATE platform_membership_entitlements SET status='revoked'").run();
   expect(readWatchlistPlanDecisions(f.db,f.user,'ticker').get('QA')).toBe(false);
  }finally{f.db.close()}
 });
 it('filters selected offers to the configured public plan or add-on only',()=>{
  const f=amendmentFixture();try{
   saveWatchlistPlanPolicy(f.db,f.user,{symbol:'QA',control:'analysis',mode:'plans',planIds:[f.addon.planId!]});
   const catalog=new PlatformMembershipCatalogRepository(f.db).readPublicPlans();
   expect(filterWatchlistPublicPlans(f.db,'QA','analysis',catalog).map(x=>x.planId)).toEqual([f.addon.planId]);
   saveWatchlistPlanPolicy(f.db,f.user,{symbol:'QA',control:'analysis',mode:'plans',planIds:[]});
   expect(filterWatchlistPublicPlans(f.db,'QA','analysis',catalog)).toEqual([]);
  }finally{f.db.close()}
 });
});
