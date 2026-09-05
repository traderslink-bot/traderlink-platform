"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";
import { TraderLinkCommunityPlatformRepository } from "@/src/modules/communities/server/traderlink-community-platform-repository";

function value(formData:FormData,key:string){const item=formData.get(key);if(typeof item!=="string"||!item.trim())throw new Error(`${key} is required.`);return item.trim();}

export async function onboardDiscordCommunityAction(formData:FormData):Promise<void>{
  const identity=await requireTraderLinkPlatformServerComponentPageIdentity(); const timestamp=createCanonicalUtcTimestamp();
  const community=withPlatformDatabase({mode:"runtime"},database=>database.transaction(()=>{
    const created=new TraderLinkCommunityRepository(database).createFromVerifiedDiscordOwner({ownerUserId:identity.scope.userId,discordGuildId:value(formData,"discordGuildId"),slug:value(formData,"slug"),displayName:value(formData,"displayName"),timestamp});
    const platform=new TraderLinkCommunityPlatformRepository(database); platform.ensureDefaultAudience({communityId:created.communityId,actorUserId:identity.scope.userId,atUtc:timestamp});
    database.prepare(`INSERT INTO traderlink_community_settings(community_id,description,named_activity_retention_days,visibility_status,visibility_copy,updated_at_utc) VALUES(?,'',90,'not_configured','',?)`).run(created.communityId,timestamp);
    database.prepare(`INSERT INTO traderlink_community_partner_programs(community_id,status,commission_basis_points,attribution_days,currency,updated_by_user_id,updated_at_utc) VALUES(?,'disabled',NULL,90,'USD',?,?)`).run(created.communityId,identity.scope.userId,timestamp);
    return created;
  }).immediate());
  revalidatePath("/communities"); redirect(`/communities/${community.slug}/manage`);
}
