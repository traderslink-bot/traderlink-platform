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
export default async function MembershipAccountPage() {
  const { scope } = await requireTraderLinkPlatformBillingPageIdentity();
  const snapshot = withReadonlyPlatformDatabase({}, (database) => {
    if (!isPlatformMembershipCatalogAvailable(database)) return { plans: [], subscriptions: [], hasStripe: false };
    const access = new PlatformMembershipRepository(database).readEffectiveAccess(scope.userId);
    const plans = access.sources.map((source) => {
      const row = database.prepare(`SELECT p.name,r.interval_unit,r.interval_count FROM platform_membership_plan_versions v JOIN platform_membership_plans p ON p.plan_id=v.plan_id
        LEFT JOIN platform_membership_recurring_grants r ON r.entitlement_id=? WHERE v.plan_version_id=?`).get(source.entitlementId, source.planVersionId) as { name: string; interval_unit: string | null; interval_count: number | null };
      return { id: source.entitlementId, name: row.name, ends: source.endsAtUtc, recurrence: membershipOwnerGrantRecurrence(row.interval_unit, row.interval_count) };
    });
    const subscriptions = database.prepare(`SELECT provider_subscription_id id,provider,lifecycle_state state,current_period_end_utc ends,external_customer_ref customer
      FROM platform_membership_provider_subscriptions WHERE user_id=? ORDER BY updated_at_utc DESC`).all(scope.userId) as { id: string; provider: string; state: string; ends: string | null; customer: string | null }[];
    return { plans, subscriptions, hasStripe: subscriptions.some((s) => s.provider === "stripe" && s.customer) };
  });
  return <AccountSettingsLayout activeSection="membership" title="Plan & billing" description="">
    <DashboardPanel title="Your plans"><Stack spacing={2}>
      {!snapshot.plans.length ? <Typography>No active membership plans. A recent payment may still be processing.</Typography> : snapshot.plans.map((plan) => <Typography key={plan.id}>{plan.name} · {plan.ends ? `Access until ${plan.ends}` : "No end date"}{plan.recurrence ? ` · ${plan.recurrence}` : ""}</Typography>)}
      <Button href="/plans" variant="outlined">View plans</Button>
    </Stack></DashboardPanel>
    <DashboardPanel title="Billing"><Stack spacing={2}>
      {snapshot.subscriptions.map((s) => <Typography key={s.id}>{s.provider} · {s.state.replaceAll("_", " ")}{s.ends ? ` · ${s.ends}` : ""}</Typography>)}
      {snapshot.hasStripe ? <form action={membershipPortalAction}><Button type="submit" variant="contained">Manage Stripe billing</Button></form> : <Typography>No Stripe subscription is linked.</Typography>}
    </Stack></DashboardPanel>
  </AccountSettingsLayout>;
}
