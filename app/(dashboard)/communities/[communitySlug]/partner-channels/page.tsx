import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { NextRequest } from "next/server";

import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { stripeOnboardingConfiguration, withStripeOnboarding } from "@/src/modules/partner-alerts/server/partner-alert-stripe-onboarding-runtime";
import { readPartnerAlertStripeBillingConfiguration } from "@/src/modules/partner-alerts/server/partner-alert-stripe-billing-runtime";
import { withPartnerAlertRequestRuntime } from "@/src/modules/partner-alerts/server/partner-alert-request-runtime";
import { CommunityPartnerChannelSetup } from "./community-partner-channel-setup";

export const metadata: Metadata = { title: "Publish channels | TraderLink Platform" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CommunityPartnerChannelsPage({
  params, searchParams,
}: {
  params: Promise<{ communitySlug: string }>;
  searchParams: Promise<{ stripe?: string | string[] }>;
}) {
  const scope = await requireTraderLinkPlatformPageScope();
  const { communitySlug } = await params;
  const community = withReadonlyPlatformDatabase({}, (database) => database.prepare<
    [string, string],
    { community_id: string }
  >(`SELECT community_id FROM traderlink_communities
WHERE slug=? AND owner_user_id=? AND status!='removed' LIMIT 1`).get(communitySlug, scope.userId));
  if (!community) notFound();
  const native = readPartnerAlertStripeBillingConfiguration();
  const preview = !native && !process.env.PARTNER_STRIPE_NATIVE_SANDBOX_SIGNING_SECRET ? stripeOnboardingConfiguration() : null;
  const stripe = native ?? preview;
  const stripeStatus = stripe ? await (async () => {
    if (preview) return withStripeOnboarding(preview, service => service.status(community.community_id, scope.userId));
    const request = new NextRequest(new URL(`/communities/${encodeURIComponent(communitySlug)}/partner-channels`, stripe.origin),
      { headers: new Headers(await headers()) });
    const seller = await withPartnerAlertRequestRuntime(request,
      runtime => runtime.readStripeSeller(request, community.community_id, scope.userId), undefined, () => null);
    return seller?.status ?? "unavailable";
  })().catch(() => "unavailable" as const) : undefined;
  const stripeOfferDrafts = stripeStatus === "ready" && native !== null
    && withReadonlyPlatformDatabase({}, database => database.prepare(
      `SELECT count(*) FROM pragma_table_info('partner_alert_offers')
        WHERE name IN ('whop_environment','whop_account_id','whop_product_id','whop_plan_id') AND "notnull"=0`,
    ).pluck().get() === 4);
  const result = (await searchParams).stripe;
  return <CommunityPartnerChannelSetup communityId={community.community_id}
    stripeStatus={stripeStatus} stripeExistingEnabled={Boolean(stripe?.clientId)} stripeOfferDrafts={stripeOfferDrafts}
    stripeNotice={result === "refresh" || result === "link_failed" ? result : undefined} />;
}
