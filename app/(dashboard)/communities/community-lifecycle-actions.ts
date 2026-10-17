"use server";
import {revalidatePath} from "next/cache";
import {requireTraderLinkPlatformPageIdentity} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {withPlatformDatabase} from "@/src/modules/platform/server/database/open-platform-database";
import {verifyCommunityOwner,onboardApprovedCommunity} from "@/src/modules/communities/server/community-onboarding-service";
import {isFreshCommunityEvidence} from "@/src/modules/communities/server/community-launch-policy";
import {removeCommunity,recoverCommunity,communityIsRemoved,stopCommunityPendingDeliveries} from "@/src/modules/communities/server/community-lifecycle";
import type {CommunityPublicationFeedback} from "@/src/modules/communities/contracts/community-publication-feedback";
export async function changeCommunityLifecycleWithFeedback(form:FormData):Promise<CommunityPublicationFeedback>{
 const identity=await requireTraderLinkPlatformPageIdentity(),slug=String(form.get("communitySlug")??""),operation=String(form.get("operation")??"");
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
   const evidence=await verifyCommunityOwner(target.discord_guild_id,target.auth_subject,process.env.TRADERLINK_DISCORD_BOT_TOKEN??"");
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
