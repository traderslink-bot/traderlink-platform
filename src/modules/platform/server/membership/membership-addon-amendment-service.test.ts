// @vitest-environment node
import { randomUUID,createHmac } from "node:crypto";
import { beforeEach,afterEach,describe,it,expect,vi } from "vitest";
import { amendmentFixture,amendmentAt as at,amendmentEnd as end } from "./membership-addon-amendment.test-fixture";
import { MembershipAddonAmendmentService } from "./membership-addon-amendment-service";
import { MembershipAddonAmendmentRepository } from "./membership-addon-amendment-repository";
import { applyMembershipStripeEvent,verifyMembershipStripeEvent } from "./platform-membership-stripe";

beforeEach(()=>{vi.stubEnv('STRIPE_SECRET_KEY','sk_test_synthetic_only');vi.stubEnv('STRIPE_MEMBERSHIP_WEBHOOK_SECRET','synthetic_only')});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals()});
function setup({free=false}:{free?:boolean}={}) {
  const f=amendmentFixture(),requests:{path:string;body:URLSearchParams;key:string|null}[]=[];
  if(free)f.addon=f.publish('addon','Free extra analyses','0',20);
  let clock=new Date(at);
  let paid=true,webhookFirst=false,charge=free?0:500,postLost=false,targetPrice='price_test_new';
  let invoiceOverride:Record<string,unknown>={},loseBeforeOnce=false;
  const start=Date.parse(at)/1000,finish=Date.parse(end)/1000;
  const oldPrice={id:'price_test_old',currency:'usd',unit_amount:2000,recurring:{interval:'month',interval_count:1}};
  let subscription:Record<string,unknown>={id:'sub_test_synthetic',customer:'cus_test_synthetic',status:'active',livemode:false,collection_method:'charge_automatically',
    current_period_end:finish,cancel_at_period_end:false,items:{data:[{id:'si_test',price:oldPrice,quantity:1}]},latest_invoice:{id:'in_old',status:'paid'},metadata:{}};
  const lines=()=>({has_more:false,data:[{price:{id:'price_test_old'},proration:true,amount:-1000,period:{start,end:finish}},{price:{id:targetPrice},proration:true,amount:free?1000:1500,period:{start,end:finish}}]});
  const invoice=()=>({id:'in_test_amend',subscription:'sub_test_synthetic',customer:'cus_test_synthetic',billing_reason:'subscription_update',currency:'usd',amount_due:charge,
    status:paid?'paid':'open',paid,hosted_invoice_url:'https://invoice.stripe.com/i/test_only',lines:lines(),...invoiceOverride});
  function activateProvider(){subscription={...subscription,pending_update:null,items:{data:[{id:'si_test',price:{...oldPrice,id:targetPrice,unit_amount:free?2000:3000},quantity:1}]}};}
  vi.stubGlobal('fetch',vi.fn(async(url:string,init:RequestInit)=>{
    expect(f.db.inTransaction).toBe(false);
    const path=new URL(url).pathname,body=init.body instanceof URLSearchParams?init.body:new URLSearchParams();requests.push({path,body,key:new Headers(init.headers).get('Idempotency-Key')});
    let response:unknown;
    if(path==='/v1/prices')response={id:targetPrice};
    else if(path==='/v1/invoices/create_preview')response={currency:'usd',amount_due:charge,starting_balance:0,total_taxes:[],total_discount_amounts:[],lines:lines()};
    else if(path==='/v1/subscriptions/sub_test_synthetic'&&init.method==='POST'){
      expect(body.get('payment_behavior')).toBe('pending_if_incomplete');expect(body.get('proration_behavior')).toBe('always_invoice');
      if(loseBeforeOnce){loseBeforeOnce=false;throw new Error('Synthetic loss before dispatch');}
      expect(body.has('billing_cycle_anchor')).toBe(false);expect(body.get('proration_date')).toBe(String(start));
      if(paid)activateProvider();else subscription={...subscription,pending_update:{expires_at:finish}};
      subscription={...subscription,latest_invoice:{id:'in_test_amend',status:paid?'paid':'open'}};
      if(webhookFirst){
        const event={id:'evt_test_amend',created:start,type:'invoice.paid',data:{object:invoice()}};const raw=JSON.stringify(event);
        const signature=createHmac('sha256','synthetic_only').update(`${start}.${raw}`).digest('hex');
        const verified=verifyMembershipStripeEvent(raw,`t=${start},v1=${signature}`,'synthetic_only',Date.parse(at));
        expect(applyMembershipStripeEvent(f.db,verified,subscription,raw)).toBe('applied');
        expect(applyMembershipStripeEvent(f.db,verified,subscription,raw)).toBe('duplicate');
      }
      if(postLost)throw new Error('Synthetic transport loss after accepted update');
      response=subscription;
    }else if(path==='/v1/subscriptions/sub_test_synthetic')response=subscription;
    else if(path==='/v1/invoices/in_test_amend')response=invoice();
    else if(path==='/v1/invoices/in_old')response={id:'in_old',billing_reason:'subscription_cycle'};
    else throw new Error('Unexpected mocked Stripe path: '+path);
    return Response.json(response);
  }));
  const service=new MembershipAddonAmendmentService(work=>work(f.db),()=>clock);
  return {...f,service,requests,setTime:(value:string)=>{clock=new Date(value)},setSubscription:(value:Record<string,unknown>)=>{subscription={...subscription,...value}},loseBefore:()=>{loseBeforeOnce=true},setInvoice:(value:Record<string,unknown>)=>{invoiceOverride=value},setPaid:(value:boolean)=>{paid=value;if(value)activateProvider()},setWebhookFirst:()=>{webhookFirst=true},setLost:()=>{postLost=true},setCharge:(value:number)=>{charge=value},setTarget:(value:string)=>{targetPrice=value},getSubscription:()=>subscription};
}
describe('existing-member prorated Stripe amendments',()=>{
  it('quotes first, charges once on the same subscription, grants30 only after verified payment',async()=>{
    const f=setup();try{
      const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      expect(quote).toMatchObject({state:'quoted',charge_minor:500,target_monthly_minor:3000});
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(10);
      expect(f.requests.some(r=>r.path.includes('checkout'))).toBe(false);
      const paid=await f.service.confirm(f.user,quote.amendment_id);expect(paid.state).toBe('applied');
      expect((await f.service.confirm(f.user,quote.amendment_id)).state).toBe('applied');
      expect(f.requests.filter(r=>r.path.includes('/subscriptions/')&&r.body.has('payment_behavior'))).toHaveLength(1);
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(30);
      expect(f.db.prepare('SELECT COUNT(*) n FROM platform_membership_provider_subscriptions').get()).toEqual({n:1});
      expect(f.db.prepare('SELECT current_period_end_utc FROM platform_membership_provider_subscriptions').get()).toEqual({current_period_end_utc:end});
    }finally{f.db.close()}
  });
  it.each([[0,500,'applied',30],[100,400,'pending_payment',10],[0,'500','pending_payment',10],[0,-1,'pending_payment',10]] as const)(
    'handles current invoices without legacy paid flag: remaining %s',async(remaining,paid,state,allowance)=>{
      const f=setup();try{
        f.setInvoice({paid:undefined,amount_remaining:remaining,amount_paid:paid});
        const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
        expect((await f.service.confirm(f.user,quote.amendment_id)).state).toBe(state);
        expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(allowance);
      }finally{f.db.close()}
    });
  it('does not unlock an invoice with an explicitly false legacy paid flag',async()=>{
    const f=setup();try{
      f.setInvoice({paid:false,amount_remaining:0,amount_paid:500});
      const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      expect((await f.service.confirm(f.user,quote.amendment_id)).state).toBe('pending_payment');
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(10);
    }finally{f.db.close()}
  });
  it('preserves old access during authentication and activates after the pending invoice is paid',async()=>{
    const f=setup();try{
      f.setPaid(false);const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      expect((await f.service.confirm(f.user,quote.amendment_id)).state).toBe('pending_payment');
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(10);
      await f.service.confirm(f.user,quote.amendment_id);
      expect(f.requests.filter(r=>r.body.has('payment_behavior'))).toHaveLength(1);
      f.setPaid(true);expect((await f.service.refresh(f.user,quote.amendment_id)).state).toBe('applied');
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(30);
    }finally{f.db.close()}
  });
  it('handles signed payment before the update response and duplicate delivery without a second entitlement',async()=>{
    const f=setup();try{
      f.setWebhookFirst();const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      expect((await f.service.confirm(f.user,quote.amendment_id)).state).toBe('applied');
      expect(f.db.prepare('SELECT COUNT(*) n FROM platform_membership_entitlements').get()).toEqual({n:1});
    }finally{f.db.close()}
  });
  it('reconciles an accepted update after response loss without repeating the charge',async()=>{
    const f=setup();try{
      const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);f.setLost();
      await expect(f.service.confirm(f.user,quote.amendment_id)).rejects.toThrow(/Synthetic transport/);
      expect(new MembershipAddonAmendmentRepository(f.db).read(f.user,quote.amendment_id).state).toBe('reconciliation_required');
      expect((await f.service.refresh(f.user,quote.amendment_id)).state).toBe('applied');
      expect(f.requests.filter(r=>r.body.has('payment_behavior'))).toHaveLength(1);
    }finally{f.db.close()}
  });
  it('refuses a changed amount before submitting an update and scopes every request to its owner',async()=>{
    const f=setup();try{
      const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);f.setCharge(501);
      await expect(f.service.confirm(f.user,quote.amendment_id)).rejects.toThrow(/preview/);
      await expect(f.service.confirm(randomUUID(),quote.amendment_id)).rejects.toThrow(/unavailable/);
      expect(f.requests.filter(r=>r.body.has('payment_behavior'))).toHaveLength(0);
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(10);
    }finally{f.db.close()}
  });
  it.each([
    {customer:'cus_someone_else'},
    {currency:'eur'},
    {amount_due:499},
    {lines:{has_more:true,data:[]}},
    {lines:{has_more:false,data:[{price:{id:'price_test_new'},proration:true,amount:500,period:{start:1,end:2}}]}},
  ])('never grants access from mismatched payment evidence %j',async override=>{
    const f=setup();try{
      const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      f.setInvoice(override);
      await expect(f.service.confirm(f.user,quote.amendment_id)).rejects.toThrow();
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(10);
      expect(new MembershipAddonAmendmentRepository(f.db).read(f.user,quote.amendment_id).state).toBe('reconciliation_required');
    }finally{f.db.close()}
  });
  it('closes a void pending invoice without granting its allowance',async()=>{
    const f=setup();try{
      f.setPaid(false);
      const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      await f.service.confirm(f.user,quote.amendment_id);
      f.setInvoice({status:'void',paid:false});
      expect((await f.service.refresh(f.user,quote.amendment_id)).state).toBe('failed');
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(10);
    }finally{f.db.close()}
  });

  it('retries a lost dispatch only with the same confirmed request and idempotency key',async()=>{
    const f=setup();try{
      const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      f.loseBefore();await expect(f.service.confirm(f.user,quote.amendment_id)).rejects.toThrow(/before dispatch/);
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(10);
      expect((await f.service.refresh(f.user,quote.amendment_id)).state).toBe('applied');
      const updates=f.requests.filter(r=>r.body.has('payment_behavior'));
      expect(updates).toHaveLength(2);
      expect(updates[0].key).toBe(updates[1].key);
      expect(updates[0].body.toString()).toBe(updates[1].body.toString());
    }finally{f.db.close()}
  });

  it('adds a free package without a new charge or renewal change',async()=>{
    const f=setup({free:true});try{
      const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      expect(quote).toMatchObject({charge_minor:0,target_monthly_minor:2000});
      expect((await f.service.confirm(f.user,quote.amendment_id)).state).toBe('applied');
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(30);
      expect(f.requests.filter(r=>r.path.startsWith('/v1/invoices/in_'))).toHaveLength(0);
      expect(f.db.prepare('SELECT current_period_end_utc FROM platform_membership_provider_subscriptions').get()).toEqual({current_period_end_utc:end});
    }finally{f.db.close()}
  });
  it('never sends an expired quote or retries an uncertain dispatch after the quote window',async()=>{
    const f=setup();try{
      const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      f.setTime(quote.expires_at_utc);
      expect((await f.service.confirm(f.user,quote.amendment_id)).state).toBe('expired');
      expect(f.requests.filter(r=>r.body.has('payment_behavior'))).toHaveLength(0);
      f.setTime(at);
      const next=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      f.loseBefore();await expect(f.service.confirm(f.user,next.amendment_id)).rejects.toThrow();
      f.setTime(next.expires_at_utc);
      expect((await f.service.refresh(f.user,next.amendment_id)).state).toBe('reconciliation_required');
      expect(f.requests.filter(r=>r.body.has('payment_behavior'))).toHaveLength(1);
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(10);
    }finally{f.db.close()}
  });
  it('does not unlock an add-on when the subscription is canceled while payment is pending',async()=>{
    const f=setup();try{
      f.setPaid(false);
      const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      await f.service.confirm(f.user,quote.amendment_id);
      f.setPaid(true);f.setSubscription({status:'canceled'});
      f.db.prepare("UPDATE platform_membership_provider_subscriptions SET lifecycle_state='inactive'").run();
      expect((await f.service.refresh(f.user,quote.amendment_id)).state).toBe('reconciliation_required');
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(10);
    }finally{f.db.close()}
  });
  it.each([{cancel_at_period_end:true},{schedule:'sub_sched_test'},{automatic_tax:{enabled:true}},{discounts:[{id:'discount_test'}]},{pending_update:{expires_at:1}}])('refuses incompatible billing terms before creating a price %j',async terms=>{
    const f=setup();try{
      f.setSubscription(terms);
      await expect(f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]])).rejects.toThrow(/billing changes/);
      expect(f.requests.some(r=>r.path==='/v1/prices'||r.body.has('payment_behavior'))).toBe(false);
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(10);
    }finally{f.db.close()}
  });

  it('keeps the amended bundle through renewal and never resurrects it from a late payment after cancellation',async()=>{
    const f=setup();try{
      const claimId=randomUUID();
      f.db.prepare("INSERT INTO platform_membership_claims VALUES (?,?,?,NULL,NULL,'fulfilled','cs_test',?,?,?)").run(claimId,f.user,f.base.offerIds![0],at,end,at);
      f.setSubscription({metadata:{membership_claim_id:claimId}});
      const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      await f.service.confirm(f.user,quote.amendment_id);
      const targetVersion=f.db.prepare('SELECT plan_version_id FROM platform_membership_entitlements').get();
      const renewalEnd='2026-12-01T12:00:00.000Z';
      const renewalStart=Date.parse(end)/1000,renewalFinish=Date.parse(renewalEnd)/1000;
      f.setSubscription({current_period_start:renewalStart,current_period_end:renewalFinish});
      const apply=(id:string,type:string,object:Record<string,unknown>,eventAt:string)=>{
        const timestamp=Date.parse(eventAt)/1000,event={id,created:timestamp,type,data:{object}},raw=JSON.stringify(event);
        const signature=createHmac('sha256','synthetic_only').update(`${timestamp}.${raw}`).digest('hex');
        return applyMembershipStripeEvent(f.db,verifyMembershipStripeEvent(raw,`t=${timestamp},v1=${signature}`,'synthetic_only',Date.parse(eventAt)),f.getSubscription(),raw);
      };
      const renewal={id:'in_renewal',subscription:'sub_test_synthetic',customer:'cus_test_synthetic',billing_reason:'subscription_cycle',currency:'usd',amount_due:3000,status:'paid',paid:true,lines:{data:[{price:{id:'price_test_new'},period:{start:renewalStart,end:renewalFinish}}]}};
      expect(apply('evt_renewal','invoice.paid',renewal,end)).toBe('applied');
      expect(f.db.prepare('SELECT plan_version_id FROM platform_membership_entitlements').get()).toEqual(targetVersion);
      expect(f.db.prepare('SELECT offer_id FROM platform_membership_provider_subscriptions').get()).toEqual({offer_id:quote.target_offer_id});
      expect(f.repo.readEffectiveAccess(f.user,end).limits['trade_analyzer.analyses']).toBe(30);
      f.setSubscription({status:'canceled'});
      expect(apply('evt_cancel','customer.subscription.deleted',f.getSubscription(),end)).toBe('applied');
      const oldInvoice={id:'in_test_amend',subscription:'sub_test_synthetic',customer:'cus_test_synthetic',billing_reason:'subscription_update',currency:'usd',amount_due:500,status:'paid',paid:true,lines:{data:[{price:{id:'price_test_new'},proration:true,period:{start:Date.parse(at)/1000,end:Date.parse(end)/1000}}]}};
      expect(apply('evt_late_amendment','invoice.paid',oldInvoice,end)).toBe('conflict');
      expect(f.db.prepare('SELECT status,plan_version_id FROM platform_membership_entitlements').get()).toEqual({status:'revoked',...targetVersion as object});
      expect(f.repo.readEffectiveAccess(f.user,end).limits['trade_analyzer.analyses']).toBeUndefined();
    }finally{f.db.close()}
  });

  it('keeps an uncertain payment fenced across repeated provider failures',async()=>{
    const f=setup();try{
      const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      f.loseBefore();await expect(f.service.confirm(f.user,quote.amendment_id)).rejects.toThrow();
      f.loseBefore();await expect(f.service.refresh(f.user,quote.amendment_id)).rejects.toThrow();
      const repository=new MembershipAddonAmendmentRepository(f.db);
      expect(repository.read(f.user,quote.amendment_id).state).toBe('reconciliation_required');
      expect(()=>repository.reserve(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]],at)).toThrow(/still open/);
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(10);
      expect((await f.service.refresh(f.user,quote.amendment_id)).state).toBe('applied');
      const updates=f.requests.filter(r=>r.body.has('payment_behavior'));
      expect(new Set(updates.map(r=>r.key)).size).toBe(1);
    }finally{f.db.close()}
  });

  it('recovers a restart after confirmation is recorded but before the provider update is sent',async()=>{
    const f=setup();try{
      const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      const repository=new MembershipAddonAmendmentRepository(f.db);
      repository.beginConfirmation(f.user,quote.amendment_id,at);
      expect(f.requests.filter(r=>r.body.has('payment_behavior'))).toHaveLength(0);
      expect((await f.service.refresh(f.user,quote.amendment_id)).state).toBe('applied');
      expect(f.requests.filter(r=>r.body.has('payment_behavior'))).toHaveLength(1);
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(30);
    }finally{f.db.close()}
  });
  it('submits only one update when two confirmations arrive concurrently',async()=>{
    const f=setup();try{
      const quote=await f.service.quote(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]]);
      await Promise.all([f.service.confirm(f.user,quote.amendment_id),f.service.confirm(f.user,quote.amendment_id)]);
      expect(f.requests.filter(r=>r.body.has('payment_behavior'))).toHaveLength(1);
      expect(new MembershipAddonAmendmentRepository(f.db).read(f.user,quote.amendment_id).state).toBe('applied');
      expect(f.db.prepare('SELECT COUNT(*) n FROM platform_membership_entitlements').get()).toEqual({n:1});
    }finally{f.db.close()}
  });

});
