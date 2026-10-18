"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireTraderLinkPlatformBillingRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { reserveMembershipAddonCheckout } from "@/src/modules/platform/server/membership/membership-addon-checkout";
import { PlatformMembershipClaims } from "@/src/modules/platform/server/membership/platform-membership-claims";
import { createMembershipStripeCheckout, createMembershipStripePortal } from "@/src/modules/platform/server/membership/platform-membership-stripe";
import type { MembershipActionState } from "../admin/journal/memberships/membership-form";

export async function selectMembershipAction(_previous: MembershipActionState, form: FormData): Promise<MembershipActionState> {
  let destination: string | null = null;
  let claimId: string | null = null;
  try {
    const identity = requireTraderLinkPlatformBillingRequestIdentity(await headers());
    const addonIds = form.getAll("addonOfferId").map(String);
    if (addonIds.length && (form.get("secret") || form.get("trialCampaignId"))) throw new Error("This add-on checkout uses public monthly/free plans without a separate trial.");
    const reserved = withPlatformDatabase({ mode: "runtime" }, (database) => addonIds.length
      ? reserveMembershipAddonCheckout(database, identity.scope.userId, String(form.get("offerId") ?? ""), addonIds, new Date().toISOString())
      : new PlatformMembershipClaims(database).reserve({
      userId: identity.scope.userId, offerId: String(form.get("offerId") ?? ""),
      secret: String(form.get("secret") ?? "") || undefined, trialCampaignId: String(form.get("trialCampaignId") ?? "") || undefined,
    }));
    claimId = reserved.claimId;
    if ((reserved.trialDays && reserved.trialAmount === 0 && !reserved.paymentMethodRequired) ||
        (!reserved.trialDays && reserved.offer.billing_kind === "free")) {
      withPlatformDatabase({ mode: "runtime" }, (database) => new PlatformMembershipClaims(database).fulfillFree(reserved.claimId, identity.scope.userId));
      destination = "/account/membership";
    } else if (reserved.offer.provider === "stripe") {
      const session = await createMembershipStripeCheckout(reserved);
      withPlatformDatabase({ mode: "runtime" }, (database) => database.prepare("UPDATE platform_membership_claims SET external_session_ref=? WHERE claim_id=? AND state='reserved'").run(session.id, reserved.claimId));
      destination = session.url;
    } else if (reserved.offer.external_checkout_url) {
      const url = new URL(reserved.offer.external_checkout_url);
      if (url.protocol !== "https:" || url.username || url.password) throw new Error("This offer has an invalid checkout URL.");
      destination = url.href;
    } else {
      throw new Error("This provider requires the owner to confirm access after payment. Contact the owner for this offer.");
    }
  } catch (error) {
    if (claimId) withPlatformDatabase({ mode: "runtime" }, (database) => new PlatformMembershipClaims(database).release(claimId!));
    const message = error instanceof Error ? error.message : "";
    return { success: null, error: /^(This |Stripe[ :]|You have|Use the private|Verified payment)/.test(message)
      ? message : "Sign in to your TraderLink account and try again. If the issue continues, contact the owner." };
  }
  redirect(destination!);
}

export async function membershipPortalAction(): Promise<void> {
  const identity = requireTraderLinkPlatformBillingRequestIdentity(await headers());
  const customer = withPlatformDatabase({ mode: "runtime" }, (database) => database.prepare(`SELECT external_customer_ref FROM platform_membership_provider_subscriptions
    WHERE user_id=? AND provider='stripe' AND external_customer_ref IS NOT NULL ORDER BY updated_at_utc DESC LIMIT 1`).get(identity.scope.userId)) as { external_customer_ref: string } | undefined;
  if (!customer) redirect("/account/membership");
  redirect(await createMembershipStripePortal(customer.external_customer_ref));
}
