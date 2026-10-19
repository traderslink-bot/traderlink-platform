// @vitest-environment node
import { randomUUID } from "node:crypto";
import { describe,it,expect,beforeEach,afterEach,vi } from "vitest";
import { membershipAddonAmendmentView } from "./membership-addon-amendment-view";
import { amendmentFixture,amendmentAt as at } from "./membership-addon-amendment.test-fixture";
import { MembershipAddonAmendmentRepository } from "./membership-addon-amendment-repository";

beforeEach(()=>{vi.stubEnv("STRIPE_SECRET_KEY","sk_test_synthetic_only");vi.stubEnv("STRIPE_MEMBERSHIP_WEBHOOK_SECRET","synthetic_only");});
afterEach(()=>vi.unstubAllEnvs());

describe("durable existing-subscription add-on amendments",()=>{
  it("prepares a hidden immutable 10+20=30 bundle without granting access or starting a second checkout",()=>{
    const f=amendmentFixture();try{
      const r=new MembershipAddonAmendmentRepository(f.db), request=randomUUID();
      const row=r.reserve(f.user,request,f.subscriptionId,[f.addon.offerIds![0]],at);
      expect(row).toMatchObject({state:'preparing',original_monthly_minor:2000,target_monthly_minor:3000});
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(10);
      expect(f.db.prepare("SELECT COUNT(*) n FROM platform_membership_claims").get()).toEqual({n:0});
      expect(r.reserve(f.user,request,f.subscriptionId,[f.addon.offerIds![0]],at).amendment_id).toBe(row.amendment_id);
      expect(()=>r.reserve(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]],at)).toThrow(/still open/);
      expect(()=>r.read(randomUUID(),row.amendment_id)).toThrow(/unavailable/);
      expect(()=>f.db.prepare("UPDATE platform_membership_addon_amendments SET target_monthly_minor=1").run()).toThrow();
      expect(()=>f.db.prepare("DELETE FROM platform_membership_addon_amendments").run()).toThrow();
    }finally{f.db.close()}
  });
  it("retains archived accepted terms, rejects duplicate packages, and preserves usage anchors",()=>{
    const f=amendmentFixture();try{
      f.db.prepare("UPDATE platform_membership_plans SET status='retired' WHERE plan_id=?").run(f.base.planId!);
      f.db.prepare("UPDATE platform_membership_offers SET status='retired' WHERE offer_id=?").run(f.base.offerIds![0]);
      const r=new MembershipAddonAmendmentRepository(f.db),row=r.reserve(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]],at);
      const old=f.db.prepare("SELECT anchor_at_utc FROM platform_membership_feature_usage_anchors WHERE plan_version_id=? AND feature_key='trade_analyzer.analyses'").get(row.original_plan_version_id);
      expect(f.db.prepare("SELECT anchor_at_utc FROM platform_membership_feature_usage_anchors WHERE plan_version_id=? AND feature_key='trade_analyzer.analyses'").get(row.target_plan_version_id)).toEqual(old);
      r.quote(f.user,row.amendment_id,{item:'si_test',originalPrice:'price_old',targetPrice:'price_new',charge:500},at);
      const first=r.beginConfirmation(f.user,row.amendment_id,at);expect(first.acquired).toBe(true);
      expect(r.beginConfirmation(f.user,row.amendment_id,at).acquired).toBe(false);
      expect(r.applyPaidInvoice(first.row,'in_test',at)).toBe(true);
      expect(r.applyPaidInvoice(first.row,'in_test',at)).toBe(true);
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(30);
      expect(f.db.prepare("SELECT COUNT(*) n FROM platform_membership_entitlements").get()).toEqual({n:1});
      expect(()=>r.reserve(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]],at)).toThrow(/already included/);
    }finally{f.db.close()}
  });
  it("expires an unconfirmed quote and never revives access after cancellation",()=>{
    const f=amendmentFixture();try{
      const r=new MembershipAddonAmendmentRepository(f.db),row=r.reserve(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]],at);
      r.quote(f.user,row.amendment_id,{item:'si_test',originalPrice:'price_old',targetPrice:'price_new',charge:500},at);
      expect(r.beginConfirmation(f.user,row.amendment_id,row.expires_at_utc)).toMatchObject({acquired:false,row:{state:'expired'}});
      const next=r.reserve(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0]],row.expires_at_utc);
      r.quote(f.user,next.amendment_id,{item:'si_test',originalPrice:'price_old',targetPrice:'price_new2',charge:500},row.expires_at_utc);
      r.beginConfirmation(f.user,next.amendment_id,row.expires_at_utc);
      f.db.exec("UPDATE platform_membership_provider_subscriptions SET lifecycle_state='inactive'");
      expect(r.applyPaidInvoice(next,'in_test',row.expires_at_utc)).toBe(false);
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBe(10);
    }finally{f.db.close()}
  });
  it("combines multiple packages, retains unlimited and exposes only member-safe status",()=>{
    const f=amendmentFixture();try{
      const extra=f.publish('addon','Unlimited analyses','5',null);
      const r=new MembershipAddonAmendmentRepository(f.db);
      const row=r.reserve(f.user,randomUUID(),f.subscriptionId,[f.addon.offerIds![0],extra.offerIds![0]],at);
      expect(row.target_monthly_minor).toBe(3500);
      const view=membershipAddonAmendmentView(row);
      expect(view.addonNames).toEqual(expect.arrayContaining(['Extra analyses','Unlimited analyses']));
      expect(JSON.stringify(view)).not.toMatch(/cus_test|sub_test|price_|external_|user_id/);
      r.quote(f.user,row.amendment_id,{item:'si_test',originalPrice:'price_old',targetPrice:'price_new',charge:750},at);
      r.beginConfirmation(f.user,row.amendment_id,at);
      expect(r.applyPaidInvoice(row,'in_multi',at)).toBe(true);
      expect(f.repo.readEffectiveAccess(f.user,at).limits['trade_analyzer.analyses']).toBeNull();
    }finally{f.db.close()}
  });

});
