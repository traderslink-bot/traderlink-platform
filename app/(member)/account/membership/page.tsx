import { AddonAmendmentPanel } from "./addon-amendment-panel";
import { PlatformMembershipCatalogRepository } from "@/src/modules/platform/server/membership/platform-membership-catalog-repository";
import { MembershipAddonAmendmentRepository } from "@/src/modules/platform/server/membership/membership-addon-amendment-repository";
import { membershipAddonAmendmentView } from "@/src/modules/platform/server/membership/membership-addon-amendment-view";
import type { MembershipAddonAmendmentView,MembershipAmendmentSubscriptionChoice } from "@/src/modules/platform/contracts/membership-addon-amendment";
import type { Metadata } from "next";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { requireTraderLinkPlatformBillingPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { PlatformMembershipRepository } from "@/src/modules/platform/server/membership/platform-membership-repository";
import { membershipOwnerGrantRecurrence } from "@/src/modules/platform/contracts/platform-membership-owner-grant";
import { isPlatformMembershipCatalogAvailable } from "@/src/modules/platform/server/membership/platform-membership-catalog-repository";
import { DashboardPanel } from "../../../dashboard-template";
import { AccountSettingsLayout } from "../../../(dashboard)/account/account-settings-layout";
import { membershipPortalAction } from "../../../plans/checkout-actions";

export const metadata: Metadata = { title: "Plan & billing | TraderLink", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function MembershipAccountPage({searchParams}:{searchParams:Promise<{addonOfferId?:string}>}) {
  const query=await searchParams;
  const { scope } = await requireTraderLinkPlatformBillingPageIdentity();
  const snapshot = withReadonlyPlatformDatabase({}, (database) => {
    if (!isPlatformMembershipCatalogAvailable(database)) return { plans: [], subscriptions: [], hasStripe: false,amendmentsReady:false,addonChoices:[],amendmentSubscriptions:[],initialAmendment:null };
    const access = new PlatformMembershipRepository(database).readEffectiveAccess(scope.userId);
    const plans = access.sources.map((source) => {
      const row = database.prepare(`SELECT p.name,r.interval_unit,r.interval_count FROM platform_membership_plan_versions v JOIN platform_membership_plans p ON p.plan_id=v.plan_id
        LEFT JOIN platform_membership_recurring_grants r ON r.entitlement_id=? WHERE v.plan_version_id=?`).get(source.entitlementId, source.planVersionId) as { name: string; interval_unit: string | null; interval_count: number | null };
      return { id: source.entitlementId, name: row.name, ends: source.endsAtUtc, recurrence: membershipOwnerGrantRecurrence(row.interval_unit, row.interval_count) };
    });
    const subscriptions = database.prepare(`SELECT provider_subscription_id id,provider,lifecycle_state state,current_period_end_utc ends,external_customer_ref customer
      FROM platform_membership_provider_subscriptions WHERE user_id=? ORDER BY updated_at_utc DESC`).all(scope.userId) as { id: string; provider: string; state: string; ends: string | null; customer: string | null }[];
    const amendmentsReady=Boolean(database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='platform_membership_addon_amendments'").get());
    const addonChoices=amendmentsReady?new PlatformMembershipCatalogRepository(database).readPublicPlans().filter(p=>p.packageType==='addon').flatMap(p=>p.offers.filter(o=>
      o.accessDurationDays===null&&(o.billingKind==='free'||o.provider==='stripe'&&o.billingKind==='recurring'&&o.billingInterval==='month'&&o.billingIntervalCount===1&&o.initialAmountMinor===o.renewalAmountMinor)).map(o=>
      ({offerId:o.offerId,name:p.name,monthlyMinor:o.renewalAmountMinor??0,currency:o.currency??'USD',free:o.billingKind==='free'}))):[];
    const amendmentSubscriptions=amendmentsReady?database.prepare(`SELECT s.provider_subscription_id id,p.name,o.currency FROM platform_membership_provider_subscriptions s
      JOIN platform_membership_offers o ON o.offer_id=s.offer_id JOIN platform_membership_plan_versions v ON v.plan_version_id=o.plan_version_id JOIN platform_membership_plans p ON p.plan_id=v.plan_id
      WHERE s.user_id=? AND s.provider='stripe' AND s.lifecycle_state='active' AND s.cancel_at_period_end=0 AND o.billing_kind='recurring'
        AND o.billing_interval='month' AND o.billing_interval_count=1 ORDER BY s.created_at_utc`).all(scope.userId) as MembershipAmendmentSubscriptionChoice[]:[];
    const open=amendmentsReady?database.prepare("SELECT amendment_id FROM platform_membership_addon_amendments WHERE user_id=? AND state IN ('preparing','quoted','confirming','pending_payment','reconciliation_required') ORDER BY created_at_utc DESC LIMIT 1").get(scope.userId) as {amendment_id:string}|undefined:undefined;
    const initialAmendment:MembershipAddonAmendmentView|null=open?membershipAddonAmendmentView(new MembershipAddonAmendmentRepository(database).read(scope.userId,open.amendment_id)):null;
    return { plans, subscriptions,amendmentsReady,addonChoices,amendmentSubscriptions,initialAmendment,hasStripe: subscriptions.some((s) => s.provider === "stripe" && s.customer) };
  });
  return <AccountSettingsLayout activeSection="membership" title="Plan & billing" description="">
    <DashboardPanel title="Your plans"><Stack spacing={2}>
      {!snapshot.plans.length ? <Typography>No active membership plans. A recent payment may still be processing.</Typography> : snapshot.plans.map((plan) => <Typography key={plan.id}>{plan.name} · {plan.ends ? `Access until ${plan.ends}` : "No end date"}{plan.recurrence ? ` · ${plan.recurrence}` : ""}</Typography>)}
      <Button href="/plans" variant="outlined">View plans</Button>
    </Stack></DashboardPanel>
    {snapshot.amendmentsReady?<DashboardPanel title="Add to your plan"><AddonAmendmentPanel addons={snapshot.addonChoices} subscriptions={snapshot.amendmentSubscriptions} initialAddon={query.addonOfferId} initialAmendment={snapshot.initialAmendment}/></DashboardPanel>:null}
    <DashboardPanel title="Billing"><Stack spacing={2}>
      {snapshot.subscriptions.map((s) => <Typography key={s.id}>{s.provider} · {s.state.replaceAll("_", " ")}{s.ends ? ` · ${s.ends}` : ""}</Typography>)}
      {snapshot.hasStripe ? <form action={membershipPortalAction}><Button type="submit" variant="contained">Manage Stripe billing</Button></form> : <Typography>No Stripe subscription is linked.</Typography>}
    </Stack></DashboardPanel>
  </AccountSettingsLayout>;
}
