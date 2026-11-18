import "server-only";

import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  requireCommunityOwnerReviewIdentity,
  requireCommunityOwnerReviewPageIdentity,
  requireCommunityOwnerReviewRequestIdentity,
} from "./community-owner-review-request-identity";

export function requireCoachingPilotRequestIdentity(
  headers: Headers,
): TraderLinkPlatformRequestIdentity {
  return requireCommunityOwnerReviewRequestIdentity(headers);
}

export async function requireCoachingPilotPageIdentity(): Promise<TraderLinkPlatformRequestIdentity> {
  return requireCommunityOwnerReviewPageIdentity();
}

export function requireCoachingPilotIdentity(
  identity: TraderLinkPlatformRequestIdentity,
): TraderLinkPlatformRequestIdentity {
  return requireCommunityOwnerReviewIdentity(identity);
}
