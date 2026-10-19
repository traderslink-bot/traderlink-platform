// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { amendmentFixture,amendmentAt as at,amendmentEnd as end } from './membership-addon-amendment.test-fixture';
import { MembershipAddonAmendmentRepository,type AddonAmendmentRow } from './membership-addon-amendment-repository';
import { reconcileMembershipAddonInvoice } from './membership-addon-amendment-evidence';
beforeEach(()=>{vi.stubEnv('STRIPE_SECRET_KEY','sk_test_synthetic_only');vi.stubEnv('STRIPE_MEMBERSHIP_WEBHOOK_SECRET','synthetic_only')});
afterEach(()=>vi.unstubAllEnvs());
function invoice(row:AddonAmendmentRow,id:string){return {id,subscription:row.external_subscription_ref,customer:row.external_customer_ref,billing_reason:'subscription_update',currency:row.currency,amount_due:row.charge_minor,status:'paid',paid:true,lines:{has_more:false,data:[
  {price:{id:row.original_price_ref},proration:true,period:{start:Date.parse(at)/1000,end:Date.parse(end)/1000}},
  {price:{id:row.target_price_ref},proration:true,period:{start:Date.parse(at)/1000,end:Date.parse(end)/1000}},
]}}}
function subscription(row:AddonAmendmentRow){return {id:row.external_subscription_ref,customer:row.external_customer_ref,status:'active',cancel_at_period_end:false,items:{data:[{id:'si_test',quantity:1,price:{id:row.target_price_ref}}]}}}
describe('add-on invoice ordering',()=>{
  it('does not confuse a previous package credit with the new purchase or roll back on a late old invoice',()=>{
    const f=amendmentFixture();try{
      const r=new MembershipAddonAmendmentRepository(f.db);
      function prepare(offer:string,oldPrice:string,newPrice:string){const row=r.reserve(f.user,randomUUID(),f.subscriptionId,[offer],at);r.quote(f.user,row.amendment_id,{item:'si_test',originalPrice:oldPrice,targetPrice:newPrice,charge:500},at);return r.beginConfirmation(f.user,row.amendment_id,at).row;}
      const first=prepare(f.addon.offerIds![0],'price_old','price_first'),oldInvoice=invoice(first,'in_first');
      expect(reconcileMembershipAddonInvoice(f.db,oldInvoice,subscription(first),at)).toBe('applied');
      const extra=f.publish('addon','Second package','5',20);
      const second=prepare(extra.offerIds![0],'price_first','price_second');
      expect(reconcileMembershipAddonInvoice(f.db,invoice(second,'in_second'),subscription(second),at)).toBe('applied');
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(50);
      expect(reconcileMembershipAddonInvoice(f.db,oldInvoice,subscription(second),at)).toBe('conflict');
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(50);
      expect(r.read(f.user,second.amendment_id).state).toBe('applied');
      expect(f.db.prepare('SELECT offer_id FROM platform_membership_provider_subscriptions').get()).toEqual({offer_id:second.target_offer_id});
    }finally{f.db.close()}
  });
});
