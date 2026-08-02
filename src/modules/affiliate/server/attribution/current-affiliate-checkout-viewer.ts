import "server-only";

import { AffiliateReferralStore } from "@/src/lib/affiliate-referrals/affiliate-referral-store";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export type CurrentAffiliateCheckoutViewer = Readonly<{
  authenticated: boolean;
  affiliateCode: string;
  displayName: string;
  mode: "local_platform" | "platform_session" | "anonymous";
}>;

export async function resolveCurrentAffiliateCheckoutViewer(): Promise<CurrentAffiliateCheckoutViewer> {
  try {
    const identity = await requireTraderLinkPlatformPageIdentity();
    const attribution =
      await new AffiliateReferralStore().findAttributionByPlatformUserId(
        identity.scope.userId,
      );
    return Object.freeze({
      authenticated: true,
      affiliateCode: attribution?.affiliateCode ?? "",
      displayName: identity.displayName ?? "Local dashboard owner",
      mode: identity.mode === "local_development"
        ? "local_platform" as const
        : "platform_session" as const,
    });
  } catch {
    return Object.freeze({
      authenticated: false,
      affiliateCode: "",
      displayName: "",
      mode: "anonymous" as const,
    });
  }
}
