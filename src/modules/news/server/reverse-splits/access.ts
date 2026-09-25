import "server-only";

import { notFound } from "next/navigation";
import { hasOwnerMarketDataAccess } from "@/src/modules/level-analysis/server/owner-market-data-access";
import {
  requireTraderLinkPlatformServerComponentPageIdentity,
  type TraderLinkPlatformRequestIdentity,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";

// 2026-09-25 03:33 UTC: Owner review never activates market reads or delivery; broader rollout requires a reviewed code change.
export const REVERSE_SPLIT_OWNER_REVIEW_ONLY = true;

export function hasReverseSplitReviewAccess(identity: TraderLinkPlatformRequestIdentity): boolean {
  try {
    return hasOwnerMarketDataAccess(identity);
  } catch {
    return false;
  }
}

export async function requireReverseSplitReviewPageAccess(): Promise<void> {
  let allowed = false;
  try {
    allowed = hasReverseSplitReviewAccess(await requireTraderLinkPlatformServerComponentPageIdentity());
  } catch {
    allowed = false;
  }
  if (!allowed) notFound();
}
