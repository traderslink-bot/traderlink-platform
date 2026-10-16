"use server";
import {PublishingAccessError} from "@/src/modules/communities/server/community-publishing-access";


import { revalidatePath } from "next/cache";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { TraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { requireCommunityRequestAccess } from "@/src/modules/communities/server/community-request-access";
import { resolveTraderLinkCommunityViewer } from "@/src/modules/communities/server/traderlink-community-viewer";
import { CommunityPublicationInputError, saveCommunityPublication } from "@/src/modules/communities/server/community-publication-service";
import type { CommunityPublicationFeedback } from "@/src/modules/communities/contracts/community-publication-feedback";

async function save(kind: "alert" | "watchlist", form: FormData): Promise<CommunityPublicationFeedback> {
  const identity = await requireTraderLinkPlatformPageIdentity();
  const slug = String(form.get("communitySlug") ?? "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { status: "error", message: "Community unavailable. Refresh this page." };
  try { await requireCommunityRequestAccess({ userId: identity.scope.userId, slug }); }
  catch { return { status: "error", message: "We couldn't verify your Discord access. Your entries are still here. Reconnect Discord or try again shortly." }; }
  let result: CommunityPublicationFeedback;
  try {
    result = withPlatformDatabase({ mode: "runtime" }, db => {
      const actor = resolveTraderLinkCommunityViewer(db, identity, slug);
      const community = db.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(slug) as { community_id: string } | undefined;
      if (!community) throw new CommunityPublicationInputError("Community unavailable.");
      return saveCommunityPublication(db, { communityId: community.community_id, communitySlug: slug, actor, kind, form, atUtc: new Date().toISOString() });
    });
  } catch (error) {
    const message = error instanceof CommunityPublicationInputError || error instanceof PublishingAccessError ? error.message
      : error instanceof TraderLinkPlatformError && error.code === "TRADERLINK_WORKSPACE_ACCESS_DENIED" ? "You no longer have permission to publish here. Your entries are still here."
        : error instanceof TraderLinkPlatformError && error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED" ? "Check the title, ticker and required fields before saving."
          : "We couldn't save this item. Your entries are still here. Please try again.";
    return { status: "error", message };
  }
  // Persistence is already committed. A refresh failure must not turn success into
  // an ambiguous error or encourage a second publication.
  try {
    revalidatePath(`/communities/${slug}`);
    revalidatePath(`/communities/${slug}/${kind === "alert" ? "alerts" : "watchlists"}`);
    if (result.href) revalidatePath(result.href);
  } catch { /* Return the committed receipt and direct link. */ }
  return result;
}

export async function saveCommunityAlertWithFeedback(form: FormData) { return save("alert", form); }
export async function saveCommunityWatchlistWithFeedback(form: FormData) { return save("watchlist", form); }
