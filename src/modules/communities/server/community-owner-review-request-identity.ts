import "server-only";

import {
  requireTraderLinkPlatformAuthenticatedPageIdentity,
  requireTraderLinkPlatformBillingRequestIdentity,
  requireTraderLinkPlatformPageIdentity,
  requireTraderLinkPlatformServerComponentPageIdentity,
  type TraderLinkPlatformRequestIdentity,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";

/**
 * Temporary production-review boundary for every human Community surface.
 *
 * The existing Watchlist selector is already configured with the owner's two
 * Discord accounts. The database lookup also requires the selected Discord
 * identity to remain active. Existing Community role and capability checks
 * run after this outer gate and are intentionally not replaced by it.
 */
export function requireCommunityOwnerReviewIdentity(
  identity: TraderLinkPlatformRequestIdentity,
): TraderLinkPlatformRequestIdentity {
  if (!hasWatchlistDashboardNavigationAccess(identity)) {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
  return identity;
}

export function requireCommunityOwnerReviewRequestIdentity(
  headers: Headers,
): TraderLinkPlatformRequestIdentity {
  return requireCommunityOwnerReviewIdentity(
    requireTraderLinkPlatformBillingRequestIdentity(headers),
  );
}

export async function requireCommunityOwnerReviewPageIdentity(): Promise<TraderLinkPlatformRequestIdentity> {
  return requireCommunityOwnerReviewIdentity(await requireTraderLinkPlatformPageIdentity());
}

export async function requireCommunityOwnerReviewAuthenticatedPageIdentity(): Promise<TraderLinkPlatformRequestIdentity> {
  return requireCommunityOwnerReviewIdentity(
    await requireTraderLinkPlatformAuthenticatedPageIdentity(),
  );
}

export async function requireCommunityOwnerReviewServerComponentPageIdentity(): Promise<TraderLinkPlatformRequestIdentity> {
  return requireCommunityOwnerReviewIdentity(
    await requireTraderLinkPlatformServerComponentPageIdentity(),
  );
}
