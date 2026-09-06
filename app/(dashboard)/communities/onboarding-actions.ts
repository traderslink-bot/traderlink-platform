"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp, createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";
import { TraderLinkCommunityPlatformRepository } from "@/src/modules/communities/server/traderlink-community-platform-repository";

function value(formData:FormData,key:string){const item=formData.get(key);if(typeof item!=="string"||!item.trim())throw new Error(`${key} is required.`);return item.trim();}
const PRIVATE_PILOT_GUILD_ID="1433570740430573642";

export async function onboardDiscordCommunityAction(formData:FormData):Promise<void>{
  const identity=await requireTraderLinkPlatformPageIdentity(); const timestamp=createCanonicalUtcTimestamp();
  const discordGuildId=value(formData,"discordGuildId");
  if(discordGuildId!==PRIVATE_PILOT_GUILD_ID) throw new Error("Communities onboarding is currently limited to the private pilot server.");
  const community=withPlatformDatabase({mode:"runtime"},database=>database.transaction(()=>{
    const permissions=new TraderLinkCommunityRepository(database);
    const created=permissions.createFromVerifiedDiscordOwner({ownerUserId:identity.scope.userId,discordGuildId,slug:value(formData,"slug"),displayName:value(formData,"displayName"),timestamp});
    const platform=new TraderLinkCommunityPlatformRepository(database); platform.ensureDefaultAudience({communityId:created.communityId,actorUserId:identity.scope.userId,atUtc:timestamp});
    database.prepare(`INSERT INTO traderlink_community_settings(community_id,description,named_activity_retention_days,visibility_status,visibility_copy,updated_at_utc) VALUES(?,'',90,'not_configured','',?)`).run(created.communityId,timestamp);
    database.prepare(`INSERT INTO traderlink_community_partner_programs(community_id,status,commission_basis_points,attribution_days,currency,updated_by_user_id,updated_at_utc) VALUES(?,'disabled',NULL,90,'USD',?,?)`).run(created.communityId,identity.scope.userId,timestamp);
    for(const mapping of [
      {discordRoleId:"1546032355045679134",discordRoleName:"test-coach-community",responsibilities:["coach"] as const},
      {discordRoleId:"1546032386301755432",discordRoleName:"test-alerts-community",responsibilities:["alerts-publish"] as const},
      {discordRoleId:"1546032396061646918",discordRoleName:"test-watchlist-community",responsibilities:["server-watchlists-publish"] as const},
    ]) permissions.saveDiscordFeatureMapping({communityId:created.communityId,actorUserId:identity.scope.userId,...mapping,timestamp});
    for(const destination of [
      {name:"coaching",discordChannelId:"1546033844468187156",contentType:"coaching" as const},
      {name:"alerts",discordChannelId:"1546033958448529508",contentType:"alerts" as const},
      {name:"watchlist",discordChannelId:"1546034056725008385",contentType:"watchlists" as const},
    ]) platform.saveDiscordDestination({communityId:created.communityId,actor:{userId:identity.scope.userId,displayName:identity.displayName??"Server owner",discordRoleIds:identity.discord?.roleIds??[]},...destination,atUtc:timestamp});
    database.prepare(`INSERT INTO traderlink_community_operator_grants(grant_id,user_id,status,granted_at_utc,revoked_at_utc) VALUES(?,?,'active',?,NULL) ON CONFLICT(user_id) DO UPDATE SET status='active',revoked_at_utc=NULL`).run(createCanonicalUuidV4(),identity.scope.userId,timestamp);
    permissions.setStatus({communityId:created.communityId,actorUserId:identity.scope.userId,status:"active",timestamp});
    return created;
  }).immediate());
  revalidatePath("/communities"); redirect(`/communities/${community.slug}/manage`);
}
