"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { TraderLinkCommunityPlatformRepository } from "@/src/modules/communities/server/traderlink-community-platform-repository";
import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";
import { TRADERLINK_COMMUNITY_FIXED_RESPONSIBILITIES, type TraderLinkCommunityFixedResponsibility } from "@/src/modules/communities/contracts/traderlink-community-contracts";
import { resolveTraderLinkCommunityViewer } from "@/src/modules/communities/server/traderlink-community-viewer";

function required(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required.`);
  return value;
}

function revalidateCommunityPath(communitySlug: string, path: string): void {
  revalidatePath(`/communities/${communitySlug}`);
  revalidatePath(`/communities/${communitySlug}/${path}`);
  refresh();
}

async function context(slug: string) {
  const identity = await requireTraderLinkPlatformPageIdentity();
  return { identity, slug };
}

export async function createCommunityAlertAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; const repository=new TraderLinkCommunityPlatformRepository(database); const atUtc=createCanonicalUtcTimestamp(); const audienceId=repository.ensureDefaultAudience({communityId:community.community_id,actorUserId:actor.userId,atUtc}); repository.createAlert({communityId:community.community_id,actor,title:required(formData,"title"),symbol:String(formData.get("symbol")??""),body:required(formData,"body"),audienceId,publish:true,atUtc}); });
  revalidateCommunityPath(communitySlug,"alerts"); redirect(`/communities/${communitySlug}/alerts`);
}

export async function updateCommunityAlertAction(formData:FormData):Promise<void>{
  const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updateAlert({communityId:community.community_id,actor,alertId:required(formData,"alertId"),title:required(formData,"title"),symbol:String(formData.get("symbol")??""),body:required(formData,"body"),status:required(formData,"status") as "published"|"archived",atUtc:createCanonicalUtcTimestamp()});});
  revalidateCommunityPath(communitySlug,"alerts");redirect(`/communities/${communitySlug}/alerts`);
}

export async function createCommunityServerWatchlistAction(formData:FormData):Promise<void>{
  const communitySlug=required(formData,"communitySlug");
  const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{
    const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
    const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};
    new TraderLinkCommunityPlatformRepository(database).createServerWatchlist({
      communityId:community.community_id,
      actor,
      title:required(formData,"title"),
      description:String(formData.get("description")??""),
      symbols:required(formData,"symbols").split(/[\s,]+/u),
      publish:true,
      atUtc:createCanonicalUtcTimestamp(),
    });
  });
  revalidateCommunityPath(communitySlug,"watchlists");
  redirect(`/communities/${communitySlug}/watchlists`);
}

export async function saveCommunityCoachAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; new TraderLinkCommunityPlatformRepository(database).upsertCoach({communityId:community.community_id,actor,userId:actor.userId,displayName:required(formData,"displayName"),headline:String(formData.get("headline")??""),biography:String(formData.get("biography")??""),deliverySummary:String(formData.get("deliverySummary")??""),capacity:Number(required(formData,"capacity")),active:true,atUtc:createCanonicalUtcTimestamp()}); });
  revalidateCommunityPath(communitySlug,"workspace"); redirect(`/communities/${communitySlug}/workspace`);
}

export async function createCommunityCoachingPlanAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; const repository=new TraderLinkCommunityPlatformRepository(database); const atUtc=createCanonicalUtcTimestamp(); const audienceId=repository.ensureDefaultAudience({communityId:community.community_id,actorUserId:actor.userId,atUtc}); repository.createPlan({communityId:community.community_id,actor,coachProfileId:required(formData,"coachProfileId"),name:required(formData,"name"),description:String(formData.get("description")??""),cadence:required(formData,"cadence") as "weekly"|"monthly"|"trade_reviews"|"custom",tradeReviewLimit:formData.get("tradeReviewLimit")?Number(formData.get("tradeReviewLimit")):undefined,priceLabel:String(formData.get("priceLabel")??""),paymentInstructions:String(formData.get("paymentInstructions")??""),audienceId,publish:true,atUtc}); });
  revalidateCommunityPath(communitySlug,"workspace"); redirect(`/communities/${communitySlug}/workspace`);
}

export async function requestCommunityCoachingAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; new TraderLinkCommunityPlatformRepository(database).requestCoaching({communityId:community.community_id,actor,planId:required(formData,"planId"),atUtc:createCanonicalUtcTimestamp()}); });
  revalidateCommunityPath(communitySlug,"coaching"); redirect(`/communities/${communitySlug}/coaching`);
}

export async function saveCommunityDiscordRoleFeaturesAction(formData:FormData):Promise<void>{
  const communitySlug=required(formData,"communitySlug");
  const {identity}=await context(communitySlug);
  const responsibilities=formData.getAll("responsibilities")
    .filter((item):item is string=>typeof item==="string")
    .filter((item):item is TraderLinkCommunityFixedResponsibility=>item in TRADERLINK_COMMUNITY_FIXED_RESPONSIBILITIES);
  withPlatformDatabase({mode:"runtime"},database=>{
    const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
    const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};
    new TraderLinkCommunityRepository(database).saveDiscordFeatureMapping({
      communityId:community.community_id,
      actorUserId:actor.userId,
      discordRoleId:required(formData,"discordRoleId"),
      discordRoleName:required(formData,"discordRoleName"),
      responsibilities,
      timestamp:createCanonicalUtcTimestamp(),
    });
  });
  revalidateCommunityPath(communitySlug,"manage/team");
  redirect(`/communities/${communitySlug}/manage/team`);
}

export async function pauseCommunityDiscordRoleFeaturesAction(formData:FormData):Promise<void>{
  const communitySlug=required(formData,"communitySlug");
  const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{
    const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);
    const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}|undefined;
    if(!community)throw new Error("Community not found.");
    new TraderLinkCommunityRepository(database).pauseDiscordFeatureMapping({communityId:community.community_id,actorUserId:actor.userId,discordRoleId:required(formData,"discordRoleId"),timestamp:createCanonicalUtcTimestamp()});
  });
  revalidateCommunityPath(communitySlug,"manage/team");
  redirect(`/communities/${communitySlug}/manage/team`);
}

export async function saveCommunityDiscordDestinationAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).saveDiscordDestination({communityId:community.community_id,actor,name:required(formData,"name"),discordChannelId:required(formData,"discordChannelId"),contentType:required(formData,"contentType") as "alerts"|"watchlists"|"coaching"|"general",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"manage/channels");redirect(`/communities/${communitySlug}/manage/channels`);}

export async function saveCommunitySettingsAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updateSettings({communityId:community.community_id,actor,displayName:required(formData,"displayName"),description:String(formData.get("description")??""),retentionDays:Number(required(formData,"retentionDays")),visibilityStatus:required(formData,"visibilityStatus") as "not_configured"|"active"|"declined",visibilityCopy:String(formData.get("visibilityCopy")??""),atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"manage/settings");redirect(`/communities/${communitySlug}/manage/settings`);}

export async function grantCoachJournalAccessAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);if(!identity.scope.activeAccountId)throw new Error("Select a Journal account before sharing.");const dataScope=required(formData,"dataScope");if(!["summary","trades","analytics"].includes(dataScope))throw new Error("Choose a supported Journal sharing scope.");withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).grantJournal({communityId:community.community_id,actor,relationshipId:required(formData,"relationshipId"),journalAccountId:identity.scope.activeAccountId as string,dataScope:dataScope as "summary"|"trades"|"analytics",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"coaching");}

export async function revokeCoachJournalAccessAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>new TraderLinkCommunityPlatformRepository(database).revokeJournal({actorUserId:identity.scope.userId,grantId:required(formData,"grantId"),atUtc:createCanonicalUtcTimestamp()}));revalidateCommunityPath(communitySlug,"coaching");}

export async function setCoachingRelationshipStatusAction(formData:FormData):Promise<void>{const identity=await requireTraderLinkPlatformPageIdentity();const relationshipId=required(formData,"relationshipId");const communitySlug=withPlatformDatabase({mode:"runtime"},database=>{const community=database.prepare(`SELECT c.community_id,c.slug FROM traderlink_community_coaching_relationships r JOIN traderlink_communities c ON c.community_id=r.community_id WHERE r.relationship_id=?`).get(relationshipId) as {community_id:string;slug:string}|undefined;if(!community)throw new Error("Coaching relationship not found.");const actor=resolveTraderLinkCommunityViewer(database,identity,community.slug);new TraderLinkCommunityPlatformRepository(database).setRelationshipStatus({communityId:community.community_id,actor,relationshipId,status:required(formData,"status") as "active"|"declined"|"ended",atUtc:createCanonicalUtcTimestamp()});return community.slug;});revalidateCommunityPath(communitySlug,"workspace");}
