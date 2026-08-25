"use server";

import { revalidatePath } from "next/cache";

import { CommunityWatchlistRepository } from "@/src/modules/community/server/community-watchlist-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp, isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export type CommunityProfileActionResult =
  | Readonly<{ ok: true; message: string; handle: string | null }>
  | Readonly<{ ok: false; message: string; handle: null }>;

export async function saveCommunityProfileSettings(input: Readonly<{
  description: string;
  tags: readonly string[];
  visible: boolean;
}>): Promise<CommunityProfileActionResult> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    const profile = withPlatformDatabase({ mode: "runtime" }, (database) =>
      new CommunityWatchlistRepository(database).saveOwnProfileSettings({
        ...input,
        userId: scope.userId,
        timestamp: createCanonicalUtcTimestamp(),
      }),
    );
    revalidatePath("/account/profile");
    revalidatePath("/community", "layout");
    return Object.freeze({
      ok: true as const,
      handle: profile.handle,
      message: profile.visible ? "Your Community profile is saved." : "Your Community profile is hidden.",
    });
  } catch (error) {
    const accessChanged = isTraderLinkPlatformError(error) && [
      "TRADERLINK_AUTH_SESSION_INVALID",
      "TRADERLINK_WORKSPACE_ACCESS_DENIED",
    ].includes(error.code);
    return Object.freeze({
      ok: false as const,
      handle: null,
      message: accessChanged
        ? "Your sign-in changed. Refresh this page and try again."
        : "Your Community profile could not be saved. Check the description and tags, then try again.",
    });
  }
}

export async function setCommunityProfileFollow(input: Readonly<{
  handle: string;
  following: boolean;
}>): Promise<CommunityProfileActionResult> {
  try {
    const scope = await requireTraderLinkPlatformPageScope();
    withPlatformDatabase({ mode: "runtime" }, (database) =>
      new CommunityWatchlistRepository(database).setProfileFollow({
        ...input,
        userId: scope.userId,
        timestamp: createCanonicalUtcTimestamp(),
      }),
    );
    revalidatePath(`/community/${input.handle}`);
    revalidatePath("/account/profile");
    return Object.freeze({
      ok: true as const,
      handle: input.handle,
      message: input.following ? "You are following this trader." : "You stopped following this trader.",
    });
  } catch (error) {
    const accessChanged = isTraderLinkPlatformError(error) && [
      "TRADERLINK_AUTH_SESSION_INVALID",
      "TRADERLINK_WORKSPACE_ACCESS_DENIED",
    ].includes(error.code);
    return Object.freeze({
      ok: false as const,
      handle: null,
      message: accessChanged
        ? "Your sign-in changed. Refresh this page and try again."
        : "This profile could not be updated. Try again.",
    });
  }
}
