"use server";
import {revalidatePath,refresh} from "next/cache";
import {redirect} from "next/navigation";
import {requireCommunityOwnerReviewPageIdentity,requireCommunityOwnerReviewAuthenticatedPageIdentity} from "@/src/modules/communities/server/community-owner-review-request-identity";
import {withPlatformDatabase} from "@/src/modules/platform/server/database/open-platform-database";
import {createCanonicalUtcTimestamp} from "@/src/modules/platform/server/database/platform-migration-contract";
import {requireCommunityRequestAccess} from "@/src/modules/communities/server/community-request-access";
import {readCommunityDiscordResources} from "@/src/modules/communities/server/community-discord-resources";
import {resolveTraderLinkCommunityViewer} from "@/src/modules/communities/server/traderlink-community-viewer";
import {TraderLinkCommunityRepository} from "@/src/modules/communities/server/traderlink-community-repository";
import {TraderLinkCommunityPlatformRepository} from "@/src/modules/communities/server/traderlink-community-platform-repository";
import {verifyCommunityOwner,onboardApprovedCommunity} from "@/src/modules/communities/server/community-onboarding-service";
import {isFreshCommunityEvidence} from "@/src/modules/communities/server/community-launch-policy";
import {removeCommunity,recoverCommunity,communityIsRemoved,stopCommunityPendingDeliveries} from "@/src/modules/communities/server/community-lifecycle";
import type {TraderLinkCommunityFixedResponsibility} from "@/src/modules/communities/contracts/traderlink-community-contracts";
import type {CommunityPublicationFeedback} from "@/src/modules/communities/contracts/community-publication-feedback";
function required(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required.`);
  return value;
}

function revalidateCommunityPath(communitySlug: string, path: string): void {
  revalidatePath(`/communities/${communitySlug}`);
  revalidatePath(path === "coaching" ? "/communities/coaching" : `/communities/${communitySlug}/${path}`);
  refresh();
}

function updatedCommunityUrl(communitySlug: string, path: string): string {
  const pathname = path === "coaching" ? "/communities/coaching" : `/communities/${communitySlug}/${path}`;
  return `${pathname}?updated=${Date.now().toString(36)}`;
}

async function context(slug: string, formData?:FormData, verifyParticipants=true, existingCoachingOnly=false) {
  const identity = await requireCommunityOwnerReviewPageIdentity();
  await requireCommunityRequestAccess({reviewIntent:"community-owner-review",userId:identity.scope.userId,slug,verifyParticipants,existingCoachingOnly,relationshipId:String(formData?.get("relationshipId")??"")||undefined,taskId:String(formData?.get("taskId")??"")||undefined,reviewId:String(formData?.get("reviewId")??"")||undefined});
  return { identity, slug };
}
function failure(message: string): CommunityPublicationFeedback { return { status: "error", message }; }
function refreshSafely(path: string) { try { revalidatePath(path); } catch { /* The saved result remains valid. */ } }
export async function saveCommunityRoleWithFeedback(form: FormData): Promise<CommunityPublicationFeedback> {
  const identity = await requireCommunityOwnerReviewPageIdentity();
  const slug = String(form.get("communitySlug") ?? "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return failure("Community unavailable.");
  const capability = "community.roles.manage";
  let community: { community_id: string; discord_guild_id: string };
  try {
    await requireCommunityRequestAccess({reviewIntent:"community-owner-review", userId: identity.scope.userId, slug });
    community = withPlatformDatabase({ mode: "runtime" }, db => {
      const row = db.prepare(`SELECT community_id,discord_guild_id FROM traderlink_communities WHERE slug=?`).get(slug) as typeof community | undefined;
      if (!row) throw new Error("Unavailable");
      new TraderLinkCommunityRepository(db).requireCapability(row.community_id, identity.scope.userId, capability);
      return row;
    });
  } catch { return failure("We couldn't verify your permission to manage this server. Reconnect Discord or try again shortly."); }
  let resources;
  try { resources = await readCommunityDiscordResources(community.discord_guild_id, process.env.TRADERLINK_DISCORD_BOT_TOKEN ?? "", fetch, "community-owner-review"); }
  catch { return failure("Discord roles and channels are unavailable. Check that the bot is installed, then refresh this page."); }
  const role = resources.roles.find(item => item.id === form.get("discordRoleId"));
  const responsibilities = form.getAll("responsibilities").filter((value): value is TraderLinkCommunityFixedResponsibility => typeof value === "string" && ["coaching-access","coach","community-admin"].includes(value));
  if (form.getAll("responsibilities").some(value=>typeof value!=="string"||!["coaching-access","coach","community-admin"].includes(value))) return failure("Choose a supported community responsibility.");
  if (!role || !responsibilities.length) return failure("Choose an existing Discord role and at least one responsibility.");
  try {
    withPlatformDatabase({ mode: "runtime" }, db => {
      const actor = resolveTraderLinkCommunityViewer(db, identity, slug);
      new TraderLinkCommunityRepository(db).requireCapability(community.community_id, actor.userId, capability);
      if (role) new TraderLinkCommunityRepository(db).saveDiscordFeatureMapping({ communityId: community.community_id, actorUserId: actor.userId, discordRoleId: role.id, discordRoleName: role.name, responsibilities, timestamp: new Date().toISOString() });

    });
  } catch { return failure("We couldn't save these settings. Your entries are still here. Refresh Discord access and try again."); }
  refreshSafely(`/communities/${slug}/manage/roles`);
  return { status: "success", message: "Role access saved." };
}

export async function setCommunityPauseWithFeedback(form:FormData):Promise<CommunityPublicationFeedback>{
 const identity=await requireCommunityOwnerReviewPageIdentity();
 const slug=String(form.get("communitySlug")??"");
 const status=String(form.get("communityStatus")??"");
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!["active","paused"].includes(status))return failure("Community unavailable.");
 try{
  await requireCommunityRequestAccess({reviewIntent:"community-owner-review",userId:identity.scope.userId,slug});
  const target=withPlatformDatabase({mode:"runtime"},db=>db.prepare(`SELECT c.community_id,c.discord_guild_id,c.owner_user_id,i.auth_subject FROM traderlink_communities c JOIN platform_auth_identities i ON i.user_id=? AND i.auth_provider='discord' AND i.status='active' WHERE c.slug=? AND c.owner_user_id=? AND c.status IN ('active','paused')`).get(identity.scope.userId,slug,identity.scope.userId) as {community_id:string;discord_guild_id:string;owner_user_id:string;auth_subject:string}|undefined);
  if(!target)return failure("Only the verified server owner can pause or resume this community.");
  await verifyCommunityOwner(target.discord_guild_id,target.auth_subject,process.env.TRADERLINK_DISCORD_BOT_TOKEN??"", fetch, "community-owner-review");
  withPlatformDatabase({mode:"runtime"},db=>new TraderLinkCommunityRepository(db).setStatus({communityId:target.community_id,actorUserId:identity.scope.userId,status:status as "active"|"paused",timestamp:new Date().toISOString()}));
 }catch{return failure("We couldn't verify and change the community status. Check Discord access and try again.");}
 refreshSafely(`/communities/${slug}/manage/settings`);refreshSafely("/communities");
 return {status:"success",message:status==="paused"?"Community paused. Records are preserved and the Discord bot remains installed.":"Community resumed. Existing delivery authorization checks still apply."};
}
export async function pauseCommunityDiscordRoleFeaturesAction(formData:FormData):Promise<void>{
  const communitySlug=required(formData,"communitySlug");
  const {identity}=await context(communitySlug,formData);
  withPlatformDatabase({mode:"runtime"},database=>{
    const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
    const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}|undefined;
    if(!community)throw new Error("Community not found.");
    new TraderLinkCommunityRepository(database).pauseDiscordFeatureMapping({communityId:community.community_id,actorUserId:actor.userId,discordRoleId:required(formData,"discordRoleId"),timestamp:createCanonicalUtcTimestamp()});
  });
  revalidateCommunityPath(communitySlug,"manage/roles");
  redirect(updatedCommunityUrl(communitySlug,"manage/roles"));
}
export async function saveCommunitySettingsAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug,formData);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updateSettings({communityId:community.community_id,actor,displayName:required(formData,"displayName"),description:String(formData.get("description")??""),retentionDays:90,visibilityStatus:"not_configured",visibilityCopy:"",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"manage/settings");redirect(updatedCommunityUrl(communitySlug,"manage/settings"));}
export async function changeCommunityLifecycleWithFeedback(form:FormData):Promise<CommunityPublicationFeedback>{
 const identity=await requireCommunityOwnerReviewAuthenticatedPageIdentity(),slug=String(form.get("communitySlug")??""),operation=String(form.get("operation")??"");
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!["remove","recover","reconnect"].includes(operation))return {status:"error",message:"Community unavailable."};
 try{
  const atUtc=new Date().toISOString();
  const target=withPlatformDatabase({mode:"runtime"},db=>db.prepare(`SELECT c.community_id,c.discord_guild_id,c.status,i.auth_subject,m.guild_owner,m.last_verified_at_utc FROM traderlink_communities c JOIN platform_auth_identities i ON i.user_id=c.owner_user_id AND i.auth_provider='discord' AND i.status='active' LEFT JOIN platform_discord_memberships m ON m.user_id=c.owner_user_id AND m.guild_id=c.discord_guild_id WHERE c.slug=? AND c.owner_user_id=?`).get(slug,identity.scope.userId) as {community_id:string;discord_guild_id:string;status:string;auth_subject:string;guild_owner:number;last_verified_at_utc:string}|undefined);
  if(!target||target.status==='suspended')throw new Error("Owner unavailable");
  if(operation==="remove"){
   if(form.get("confirmRemoval")!=="on")return {status:"error",message:"Confirm community removal first."};
   // Removal only narrows access. Fresh signed-in Discord owner evidence permits removal even after the bot is uninstalled.
   if(target.guild_owner!==1||!isFreshCommunityEvidence(target.last_verified_at_utc,atUtc))return {status:"error",message:"Refresh Discord servers on Communities to verify current server ownership, then try removal again."};
   withPlatformDatabase({mode:"runtime"},db=>removeCommunity(db,target.community_id,identity.scope.userId,atUtc));
  }else{
   const evidence=await verifyCommunityOwner(target.discord_guild_id,target.auth_subject,process.env.TRADERLINK_DISCORD_BOT_TOKEN??"", fetch, "community-owner-review");
   withPlatformDatabase({mode:"runtime"},db=>db.transaction(()=>{
    onboardApprovedCommunity(db,{userId:identity.scope.userId,evidence,atUtc});
    if(operation==="recover")recoverCommunity(db,target.community_id,identity.scope.userId,atUtc);
    else if(communityIsRemoved(db,target.community_id))throw new Error("Recover this community first");
    db.prepare(`INSERT INTO traderlink_community_lifecycle(community_id,bot_state,bot_checked_at_utc) VALUES(?,'connected',?) ON CONFLICT(community_id) DO UPDATE SET bot_state='connected',bot_checked_at_utc=excluded.bot_checked_at_utc,bot_missing_since_utc=NULL`).run(target.community_id,atUtc);
    stopCommunityPendingDeliveries(db,target.community_id,atUtc);
   }).immediate());
  }
  try{revalidatePath("/communities");revalidatePath(`/communities/${slug}`,"layout");}catch{/* Return confirmed result. */}
  return {status:"success",message:operation==="remove"?"Community removed. Settings recovery uses the original 30-day removal window. Personal Journals are untouched; original participants retain read-only coaching history.":operation==="recover"?"Settings recovered. The community remains paused; review settings before choosing Resume.":"Discord reconnected. Previous queued deliveries will not be resent.",href:operation==="remove"?`/communities/${slug}/recovery`:`/communities/${slug}/manage/settings`};
 }catch{return {status:"error",message:"We couldn't complete this action. Verify server ownership and the bot installation. Recovery is available only within 30 days of removal."};}
}
