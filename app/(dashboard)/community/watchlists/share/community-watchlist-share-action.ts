"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { TraderLinkCommunityPlatformRepository } from "@/src/modules/communities/server/traderlink-community-platform-repository";
import { resolveTraderLinkCommunityViewer } from "@/src/modules/communities/server/traderlink-community-viewer";

export async function shareWatchlistWithCommunityAction(formData:FormData):Promise<void>{const identity=await requireTraderLinkPlatformServerComponentPageIdentity();const target=String(formData.get("target")??"").split("|");const [communityId,audienceId,communitySlug]=target;const watchlistId=String(formData.get("watchlistId")??"");if(!communityId||!audienceId||!communitySlug||!watchlistId)throw new Error("Choose a watchlist and community audience.");withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);new TraderLinkCommunityPlatformRepository(database).shareWatchlist({communityId,actor,watchlistId,audienceId,atUtc:createCanonicalUtcTimestamp()});});revalidatePath(`/communities/${communitySlug}`);redirect(`/communities/${communitySlug}/watchlists`);}
