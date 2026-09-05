"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { TraderLinkCommunityPlatformRepository } from "@/src/modules/communities/server/traderlink-community-platform-repository";
import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";
import { isTraderLinkCommunityCapability, type TraderLinkCommunityCapability } from "@/src/modules/communities/contracts/traderlink-community-contracts";
import { resolveTraderLinkCommunityViewer } from "@/src/modules/communities/server/traderlink-community-viewer";

function required(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required.`);
  return value;
}

async function context(slug: string) {
  const identity = await requireTraderLinkPlatformServerComponentPageIdentity();
  return { identity, slug };
}

export async function createCommunityAlertAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; new TraderLinkCommunityPlatformRepository(database).createAlert({communityId:community.community_id,actor,title:required(formData,"title"),symbol:String(formData.get("symbol")??""),body:required(formData,"body"),audienceId:required(formData,"audienceId"),publish:true,atUtc:createCanonicalUtcTimestamp()}); });
  revalidatePath(`/communities/${communitySlug}`); redirect(`/communities/${communitySlug}/alerts`);
}

export async function createCommunityAudienceAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; new TraderLinkCommunityPlatformRepository(database).createAudience({communityId:community.community_id,actor,name:required(formData,"name"),discordRoleIds:required(formData,"discordRoleIds").split(",").map(value=>value.trim()).filter(Boolean),atUtc:createCanonicalUtcTimestamp()}); });
  revalidatePath(`/communities/${communitySlug}`); redirect(`/communities/${communitySlug}/manage/roles`);
}

export async function saveCommunityCoachAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; new TraderLinkCommunityPlatformRepository(database).upsertCoach({communityId:community.community_id,actor,userId:actor.userId,displayName:required(formData,"displayName"),headline:String(formData.get("headline")??""),biography:String(formData.get("biography")??""),deliverySummary:String(formData.get("deliverySummary")??""),capacity:Number(required(formData,"capacity")),active:true,atUtc:createCanonicalUtcTimestamp()}); });
  revalidatePath(`/communities/${communitySlug}`); redirect(`/communities/${communitySlug}/workspace`);
}

export async function createCommunityCoachingPlanAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; new TraderLinkCommunityPlatformRepository(database).createPlan({communityId:community.community_id,actor,coachProfileId:required(formData,"coachProfileId"),name:required(formData,"name"),description:String(formData.get("description")??""),cadence:required(formData,"cadence") as "weekly"|"monthly"|"trade_reviews"|"custom",tradeReviewLimit:formData.get("tradeReviewLimit")?Number(formData.get("tradeReviewLimit")):undefined,priceLabel:String(formData.get("priceLabel")??""),paymentInstructions:String(formData.get("paymentInstructions")??""),audienceId:required(formData,"audienceId"),publish:true,atUtc:createCanonicalUtcTimestamp()}); });
  revalidatePath(`/communities/${communitySlug}`); redirect(`/communities/${communitySlug}/workspace`);
}

export async function requestCommunityCoachingAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; new TraderLinkCommunityPlatformRepository(database).requestCoaching({communityId:community.community_id,actor,planId:required(formData,"planId"),atUtc:createCanonicalUtcTimestamp()}); });
  revalidatePath(`/communities/${communitySlug}`); redirect(`/communities/${communitySlug}/coaching`);
}

export async function createCommunityStaffRoleAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};const capabilities=formData.getAll("capabilities").filter((item):item is string=>typeof item==="string").filter(isTraderLinkCommunityCapability) as TraderLinkCommunityCapability[];const repository=new TraderLinkCommunityRepository(database);const role=repository.createRole({communityId:community.community_id,actorUserId:actor.userId,name:required(formData,"name"),capabilities,timestamp:createCanonicalUtcTimestamp()});const discordRoleId=String(formData.get("discordRoleId")??"").trim();if(discordRoleId)repository.mapDiscordRole({communityId:community.community_id,actorUserId:actor.userId,discordRoleId,roleId:role.roleId,timestamp:createCanonicalUtcTimestamp()});});revalidatePath(`/communities/${communitySlug}`);redirect(`/communities/${communitySlug}/manage/team`);}

export async function assignCommunityStaffRoleAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityRepository(database).assignRole({communityId:community.community_id,actorUserId:actor.userId,userId:required(formData,"userId"),roleId:required(formData,"roleId"),timestamp:createCanonicalUtcTimestamp()});});revalidatePath(`/communities/${communitySlug}`);redirect(`/communities/${communitySlug}/manage/team`);}

export async function saveCommunityDiscordDestinationAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).saveDiscordDestination({communityId:community.community_id,actor,name:required(formData,"name"),discordChannelId:required(formData,"discordChannelId"),contentType:required(formData,"contentType") as "alerts"|"watchlists"|"coaching"|"general",atUtc:createCanonicalUtcTimestamp()});});revalidatePath(`/communities/${communitySlug}`);redirect(`/communities/${communitySlug}/manage/channels`);}

export async function saveCommunitySettingsAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updateSettings({communityId:community.community_id,actor,displayName:required(formData,"displayName"),description:String(formData.get("description")??""),retentionDays:Number(required(formData,"retentionDays")),visibilityStatus:required(formData,"visibilityStatus") as "not_configured"|"active"|"declined",visibilityCopy:String(formData.get("visibilityCopy")??""),atUtc:createCanonicalUtcTimestamp()});});revalidatePath(`/communities/${communitySlug}`);redirect(`/communities/${communitySlug}/manage/settings`);}

export async function grantCoachJournalAccessAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);if(!identity.scope.activeAccountId)throw new Error("Select a Journal account before sharing.");withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).grantJournal({communityId:community.community_id,actor,relationshipId:required(formData,"relationshipId"),journalAccountId:identity.scope.activeAccountId as string,dataScope:required(formData,"dataScope") as "summary"|"trades"|"journal"|"analytics"|"complete",atUtc:createCanonicalUtcTimestamp()});});revalidatePath(`/communities/${communitySlug}/coaching`);}

export async function revokeCoachJournalAccessAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>new TraderLinkCommunityPlatformRepository(database).revokeJournal({actorUserId:identity.scope.userId,grantId:required(formData,"grantId"),atUtc:createCanonicalUtcTimestamp()}));revalidatePath(`/communities/${communitySlug}/coaching`);}

export async function setCoachingRelationshipStatusAction(formData:FormData):Promise<void>{const identity=await requireTraderLinkPlatformServerComponentPageIdentity();const relationshipId=required(formData,"relationshipId");const communitySlug=withPlatformDatabase({mode:"runtime"},database=>{const community=database.prepare(`SELECT c.community_id,c.slug FROM traderlink_community_coaching_relationships r JOIN traderlink_communities c ON c.community_id=r.community_id WHERE r.relationship_id=?`).get(relationshipId) as {community_id:string;slug:string}|undefined;if(!community)throw new Error("Coaching relationship not found.");const actor=resolveTraderLinkCommunityViewer(database,identity,community.slug);new TraderLinkCommunityPlatformRepository(database).setRelationshipStatus({communityId:community.community_id,actor,relationshipId,status:required(formData,"status") as "active"|"declined"|"ended",atUtc:createCanonicalUtcTimestamp()});return community.slug;});revalidatePath(`/communities/${communitySlug}/workspace`);}
