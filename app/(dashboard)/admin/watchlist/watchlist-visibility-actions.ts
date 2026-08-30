"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import {
  saveWatchlistVisibilityForOwner,
} from "@/src/modules/watchlist/server/access/watchlist-visibility-service";
import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

type SaveWatchlistVisibilityResult =
  | Readonly<{ ok: true; memberVisible: boolean }>
  | Readonly<{ ok: false; message: string }>;

export async function saveOwnerWatchlistVisibility(input: Readonly<{
  memberVisible: unknown;
}>): Promise<SaveWatchlistVisibilityResult> {
  try {
    if (typeof input.memberVisible !== "boolean") throw new Error("invalid_memberVisible");
    const requestHeaders = await headers();
    const identity = requireTraderLinkPlatformRequestIdentity(requestHeaders);
    if (!hasWatchlistDashboardNavigationAccess(identity)) {
      throw new Error("owner_access_required");
    }
    const state = saveWatchlistVisibilityForOwner({
      actorUserId: identity.scope.userId,
      memberVisible: input.memberVisible,
    });
    if (state.status !== "available") throw new Error("visibility_unavailable");
    revalidatePath("/admin/watchlist");
    return Object.freeze({ ok: true as const, memberVisible: state.memberVisible });
  } catch {
    return Object.freeze({
      ok: false as const,
      message: "Watchlist availability could not be saved right now. Try again later.",
    });
  }
}
