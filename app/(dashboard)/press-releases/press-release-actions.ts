"use server";

import { revalidatePath } from "next/cache";

import {
  isPressReleaseChannel,
  type PressReleaseChannel,
} from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { PressReleaseDashboardRepository } from "@/src/modules/news/server/press-release-dashboard-repository";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";

import { PressReleaseSavedViewRepository } from "@/src/modules/news/server/press-release-saved-view-repository";

type ActionResult = Readonly<{ ok: true }> | Readonly<{ ok: false; message: string }>;

async function identityWithAccess() {
  const identity = await requireTraderLinkPlatformPageIdentity();
  if (!hasPressReleaseDashboardAccess(identity)) {
    throw new Error("Press Releases access is required.");
  }
  return identity;
}
export async function markPressReleaseRead(articleId: string): Promise<ActionResult> {
  try {
    const identity = await identityWithAccess();
    withPlatformDatabase({ mode: "runtime" }, (database) =>
      new PressReleaseDashboardRepository(database).markRead({
        articleId,
        readAtUtc: createCanonicalUtcTimestamp(),
        scope: identity.scope,
      }));
    revalidatePath("/press-releases", "layout");
    return Object.freeze({ ok: true as const });
  } catch {
    return Object.freeze({ ok: false as const, message: "This article could not be marked as read." });
  }
}

export async function markPressReleaseChannelRead(channel: string): Promise<ActionResult> {
  try {
    if (!isPressReleaseChannel(channel)) throw new Error("Invalid channel.");
    const identity = await identityWithAccess();
    withPlatformDatabase({ mode: "runtime" }, (database) =>
      new PressReleaseDashboardRepository(database).markChannelRead({
        channel: channel as PressReleaseChannel,
        readAtUtc: createCanonicalUtcTimestamp(),
        scope: identity.scope,
      }));
    revalidatePath("/press-releases", "layout");
    return Object.freeze({ ok: true as const });
  } catch {
    return Object.freeze({ ok: false as const, message: "This channel could not be marked as read." });
  }
}

export async function loadPressReleaseFeed(input: { filters?: unknown; offset?: number; asOf?: string }) {
  try {
    const commandAt = createCanonicalUtcTimestamp();
    const identity = await identityWithAccess();
    const page = withReadonlyPlatformDatabase({}, database => new PressReleaseDashboardRepository(database).listPage({
      channel: "all", scope: identity.scope, limit: 100, filters: input.filters, offset: input.offset, asOf: input.asOf,
    }));
    let preferenceSaved = true;
    if (!input.offset && !input.asOf && page.filtersAllowed) {
      try { withPlatformDatabase({mode:"runtime"}, database => new PressReleaseSavedViewRepository(database).savePreference(identity.scope.userId,page.filters,commandAt)); } catch { preferenceSaved = false; }
    }
    return { ok: true as const, page, preferenceSaved };
  } catch { return { ok: false as const, message: "News could not be loaded. Check your filters and try again." }; }
}
