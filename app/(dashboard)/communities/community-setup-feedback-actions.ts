"use server";
import {CommunityPublishingAccess,PublishingAccessError} from "@/src/modules/communities/server/community-publishing-access";

import { revalidatePath } from "next/cache";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { requireCommunityRequestAccess } from "@/src/modules/communities/server/community-request-access";
import { readCommunityDiscordResources } from "@/src/modules/communities/server/community-discord-resources";
import { resolveTraderLinkCommunityViewer } from "@/src/modules/communities/server/traderlink-community-viewer";
import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";
import { TraderLinkCommunityPlatformRepository } from "@/src/modules/communities/server/traderlink-community-platform-repository";
import { onboardApprovedCommunity, verifyCommunityOwner } from "@/src/modules/communities/server/community-onboarding-service";
import { isApprovedCommunityGuild } from "@/src/modules/communities/server/community-launch-policy";
import { TRADERLINK_COMMUNITY_FIXED_RESPONSIBILITIES, type TraderLinkCommunityFixedResponsibility } from "@/src/modules/communities/contracts/traderlink-community-contracts";
import type { CommunityPublicationFeedback } from "@/src/modules/communities/contracts/community-publication-feedback";

function failure(message: string): CommunityPublicationFeedback { return { status: "error", message }; }
function refreshSafely(path: string) { try { revalidatePath(path); } catch { /* The saved result remains valid. */ } }

export async function connectCommunityWithFeedback(form: FormData): Promise<CommunityPublicationFeedback> {
  const identity = await requireTraderLinkPlatformPageIdentity();
  const guildId = String(form.get("discordGuildId") ?? "");
  if (!isApprovedCommunityGuild(guildId)) return failure("Choose a server approved for connection.");
  const linked = withPlatformDatabase({ mode: "runtime" }, db => db.prepare(`SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'`).get(identity.scope.userId) as { auth_subject: string } | undefined);
  if (!linked) return failure("Connect your Discord account, then refresh the server list.");
  let evidence;
  try { evidence = await verifyCommunityOwner(guildId, linked.auth_subject, process.env.TRADERLINK_DISCORD_BOT_TOKEN ?? ""); }
  catch { return failure("We couldn't verify this server connection. Install the TraderLink Discord app in this server, check its access, then try again as the server owner."); }
  let community;
  try { community = withPlatformDatabase({ mode: "runtime" }, db => onboardApprovedCommunity(db, { userId: identity.scope.userId, evidence, atUtc: new Date().toISOString() })); }
  catch { return failure("We couldn't connect this server. Check that server ownership hasn't changed, then try again."); }
  refreshSafely("/communities");
  return { status: "success", message: "Discord server connected. Choose your roles and publishing channels in community settings.", href: `/communities/${encodeURIComponent(community.slug)}/manage` };
}

async function saveSetup(kind: "roles" | "channels", form: FormData): Promise<CommunityPublicationFeedback> {
  const identity = await requireTraderLinkPlatformPageIdentity();
  const slug = String(form.get("communitySlug") ?? "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return failure("Community unavailable.");
  const capability = kind === "roles" ? "community.roles.manage" : "community.discord.manage";
  let community: { community_id: string; discord_guild_id: string };
  try {
    await requireCommunityRequestAccess({ userId: identity.scope.userId, slug });
    community = withPlatformDatabase({ mode: "runtime" }, db => {
      const row = db.prepare(`SELECT community_id,discord_guild_id FROM traderlink_communities WHERE slug=?`).get(slug) as typeof community | undefined;
      if (!row) throw new Error("Unavailable");
      new TraderLinkCommunityRepository(db).requireCapability(row.community_id, identity.scope.userId, capability);
      return row;
    });
  } catch { return failure("We couldn't verify your permission to manage this server. Reconnect Discord or try again shortly."); }
  let resources;
  try { resources = await readCommunityDiscordResources(community.discord_guild_id, process.env.TRADERLINK_DISCORD_BOT_TOKEN ?? ""); }
  catch { return failure("Discord roles and channels are unavailable. Check that the bot is installed, then refresh this page."); }
  const role = resources.roles.find(item => item.id === form.get("discordRoleId"));
  const channel = resources.channels.find(item => item.id === form.get("discordChannelId"));
  const responsibilities = form.getAll("responsibilities").filter((value): value is TraderLinkCommunityFixedResponsibility => typeof value === "string" && Object.hasOwn(TRADERLINK_COMMUNITY_FIXED_RESPONSIBILITIES, value));
  const contentType = String(form.get("contentType") ?? "");
  if (kind === "roles" && (!role || !responsibilities.length)) return failure("Choose an existing Discord role and at least one responsibility.");
  if (kind === "channels" && (!channel?.canPublish || !["alerts", "watchlists", "coaching", "general"].includes(contentType))) return failure("Choose a current channel where the bot can post, and a content type.");
  try {
    withPlatformDatabase({ mode: "runtime" }, db => {
      const actor = resolveTraderLinkCommunityViewer(db, identity, slug);
      new TraderLinkCommunityRepository(db).requireCapability(community.community_id, actor.userId, capability);
      if (kind === "roles" && role) new TraderLinkCommunityRepository(db).saveDiscordFeatureMapping({ communityId: community.community_id, actorUserId: actor.userId, discordRoleId: role.id, discordRoleName: role.name, responsibilities, timestamp: new Date().toISOString() });
      if (kind === "channels" && channel) db.transaction(()=>{
        const atUtc=new Date().toISOString();
        const destinationId=String(form.get("destinationId")??"");
        const existing=db.prepare(`SELECT destination_id,discord_channel_id,content_type FROM traderlink_community_discord_destinations WHERE community_id=? AND destination_id=?`).get(community.community_id,destinationId) as {destination_id:string;discord_channel_id:string;content_type:string}|undefined;
        if(destinationId&&(!existing||existing.discord_channel_id!==channel.id||existing.content_type!==contentType))throw new PublishingAccessError("The destination changed. Refresh before saving.");
        if(!destinationId&&db.prepare(`SELECT 1 FROM traderlink_community_discord_destinations WHERE community_id=? AND discord_channel_id=? AND content_type=?`).get(community.community_id,channel.id,contentType))throw new PublishingAccessError("This destination already exists. Use Edit to update its publishers.");
        const publishing=new CommunityPublishingAccess(db);
        const before=destinationId?publishing.assignments(community.community_id,destinationId):[];
        if(destinationId&&String(form.get("expectedAssignments")??"")!==JSON.stringify(before))throw new PublishingAccessError("Publisher assignments changed. Refresh before saving so another administrator's changes are preserved.");
        const id=new TraderLinkCommunityPlatformRepository(db).saveDiscordDestination({communityId:community.community_id,actor,name:channel.name,discordChannelId:channel.id,contentType:contentType as "alerts"|"watchlists"|"coaching"|"general",atUtc});
        if(contentType==="alerts"||contentType==="watchlists"){
          const removals=new Set(form.getAll("removePublisherRoleId").map(String));
          const subjects=[...new Set(form.getAll("publisherUserId").map(String))].map(id=>({kind:"user" as const,id}));
          publishing.saveAssignments({communityId:community.community_id,actorUserId:actor.userId,destinationId:id,subjects:[...subjects,...before.filter(subject=>subject.kind==="role"&&!removals.has(subject.id))],atUtc});
        }
      }).immediate();
    });
  } catch(error) { return failure(error instanceof PublishingAccessError?error.message:"We couldn't save these settings. Your entries are still here. Refresh Discord access and try again."); }
  refreshSafely(`/communities/${slug}/manage/${kind}`);
  return { status: "success", message: kind === "roles" ? "Role access saved." : "Publishing channel saved. No test message was sent." };
}

export async function saveCommunityRoleWithFeedback(form: FormData) { return saveSetup("roles", form); }
export async function saveCommunityChannelWithFeedback(form: FormData) { return saveSetup("channels", form); }

export async function saveCommunityPublishersWithFeedback(_form:FormData):Promise<CommunityPublicationFeedback>{
 return failure("Refresh Discord publishing and use Edit to save the destination and individual publishers together.");
}

export async function removeCommunityChannelWithFeedback(form:FormData):Promise<CommunityPublicationFeedback>{
 const identity=await requireTraderLinkPlatformPageIdentity();
 const slug=String(form.get("communitySlug")??"");
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return failure("Community unavailable.");
 try{
  await requireCommunityRequestAccess({userId:identity.scope.userId,slug});
  withPlatformDatabase({mode:"runtime"},db=>db.transaction(()=>{
   const row=db.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(slug) as {community_id:string}|undefined;
   if(!row)throw new Error("Unavailable");
   new TraderLinkCommunityRepository(db).requireCapability(row.community_id,identity.scope.userId,"community.discord.manage");
   const result=db.prepare(`UPDATE traderlink_community_discord_destinations SET status='paused',updated_by_user_id=?,updated_at_utc=? WHERE community_id=? AND destination_id=? AND status='active'`).run(identity.scope.userId,new Date().toISOString(),row.community_id,String(form.get("destinationId")??""));
   if(!result.changes)throw new Error("Unavailable");
  }).immediate());
 }catch{return failure("We couldn't remove this destination. Refresh access and try again.");}
 refreshSafely(`/communities/${slug}/manage/channels`);
 return {status:"success",message:"Destination removed from future publishing. Existing Discord messages and delivery history are preserved."};
}

export async function setCommunityPauseWithFeedback(form:FormData):Promise<CommunityPublicationFeedback>{
 const identity=await requireTraderLinkPlatformPageIdentity();
 const slug=String(form.get("communitySlug")??"");
 const status=String(form.get("communityStatus")??"");
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!["active","paused"].includes(status))return failure("Community unavailable.");
 try{
  await requireCommunityRequestAccess({userId:identity.scope.userId,slug});
  const target=withPlatformDatabase({mode:"runtime"},db=>db.prepare(`SELECT c.community_id,c.discord_guild_id,c.owner_user_id,i.auth_subject FROM traderlink_communities c JOIN platform_auth_identities i ON i.user_id=? AND i.auth_provider='discord' AND i.status='active' WHERE c.slug=? AND c.owner_user_id=? AND c.status IN ('active','paused')`).get(identity.scope.userId,slug,identity.scope.userId) as {community_id:string;discord_guild_id:string;owner_user_id:string;auth_subject:string}|undefined);
  if(!target)return failure("Only the verified server owner can pause or resume this community.");
  await verifyCommunityOwner(target.discord_guild_id,target.auth_subject,process.env.TRADERLINK_DISCORD_BOT_TOKEN??"");
  withPlatformDatabase({mode:"runtime"},db=>new TraderLinkCommunityRepository(db).setStatus({communityId:target.community_id,actorUserId:identity.scope.userId,status:status as "active"|"paused",timestamp:new Date().toISOString()}));
 }catch{return failure("We couldn't verify and change the community status. Check Discord access and try again.");}
 refreshSafely(`/communities/${slug}/manage/settings`);refreshSafely("/communities");
 return {status:"success",message:status==="paused"?"Community paused. Records are preserved and the Discord bot remains installed.":"Community resumed. Existing delivery authorization checks still apply."};
}
