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

function updatedCommunityUrl(communitySlug: string, path: string): string {
  return `/communities/${communitySlug}/${path}?updated=${Date.now().toString(36)}`;
}

async function context(slug: string) {
  const identity = await requireTraderLinkPlatformPageIdentity();
  return { identity, slug };
}

export async function createCommunityAlertAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; const repository=new TraderLinkCommunityPlatformRepository(database); const atUtc=createCanonicalUtcTimestamp(); const selectedAudience=String(formData.get("audienceId")??"");const audienceId=selectedAudience||repository.ensureDefaultAudience({communityId:community.community_id,actorUserId:actor.userId,atUtc});const templateId=String(formData.get("templateId")??"");let symbol=String(formData.get("symbol")??"");let body=String(formData.get("body")??"");if(templateId){const fields=database.prepare(`SELECT field_key,label,field_type,required FROM traderlink_community_alert_template_fields WHERE template_id=? AND community_id=? ORDER BY ordinal`).all(templateId,community.community_id) as {field_key:string;label:string;field_type:string;required:number}[];if(!fields.length)throw new Error("Alert template not found.");const values=fields.map(field=>{const value=String(formData.get(`template:${field.field_key}`)??"").trim();if(field.required&&!value)throw new Error(`${field.label} is required.`);if(field.field_type==="ticker"&&value)symbol=value;return value?`${field.label}: ${value}`:"";}).filter(Boolean);body=values.join("\n");}repository.createAlert({communityId:community.community_id,actor,title:required(formData,"title"),symbol,body:body.trim()||required(formData,"body"),audienceId,publish:true,publishingMode:String(formData.get("publishingMode")??"tracked_page") as "tracked_page"|"discord_post",atUtc}); });
  revalidateCommunityPath(communitySlug,"alerts"); redirect(updatedCommunityUrl(communitySlug,"alerts"));
}

export async function createCommunityAlertTemplateAction(formData:FormData):Promise<void>{
  const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);
  const count=Math.min(20,Math.max(1,Number(formData.get("fieldCount")??1)));
  const allowedTypes=new Set(["text","number","price","ticker","date","time","choice","notes"]);
  const fields=Array.from({length:count},(_,index)=>{const label=required(formData,`fieldLabel:${index}`);const type=required(formData,`fieldType:${index}`);if(!allowedTypes.has(type))throw new Error("Unsupported alert-template field type.");return {label,type:type as "text"|"number"|"price"|"ticker"|"date"|"time"|"choice"|"notes",required:formData.get(`fieldRequired:${index}`)==="on",placeholder:String(formData.get(`fieldPlaceholder:${index}`)??"")};});
  withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).createAlertTemplate({communityId:community.community_id,actor,title:required(formData,"title"),scope:required(formData,"scope") as "personal"|"community",fields,atUtc:createCanonicalUtcTimestamp()});});
  revalidateCommunityPath(communitySlug,"alerts");redirect(updatedCommunityUrl(communitySlug,"alerts"));
}

export async function archiveCommunityAlertTemplateAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).archiveAlertTemplate({communityId:community.community_id,actor,templateId:required(formData,"templateId"),atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"alerts");redirect(updatedCommunityUrl(communitySlug,"alerts"));}

export async function updateCommunityAlertAction(formData:FormData):Promise<void>{
  const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updateAlert({communityId:community.community_id,actor,alertId:required(formData,"alertId"),title:required(formData,"title"),symbol:String(formData.get("symbol")??""),body:required(formData,"body"),audienceId:String(formData.get("audienceId")??"")||undefined,publishingMode:formData.has("publishingMode")?String(formData.get("publishingMode")) as "tracked_page"|"discord_post":undefined,status:required(formData,"status") as "published"|"archived",atUtc:createCanonicalUtcTimestamp()});});
  revalidateCommunityPath(communitySlug,"alerts");redirect(updatedCommunityUrl(communitySlug,"alerts"));
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
      publishingMode:String(formData.get("publishingMode")??"tracked_page") as "tracked_page"|"discord_post",
      atUtc:createCanonicalUtcTimestamp(),
    });
  });
  revalidateCommunityPath(communitySlug,"watchlists");
  redirect(updatedCommunityUrl(communitySlug,"watchlists"));
}

export async function updateCommunityServerWatchlistAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updateServerWatchlist({communityId:community.community_id,actor,watchlistId:required(formData,"watchlistId"),title:required(formData,"title"),description:String(formData.get("description")??""),symbols:required(formData,"symbols").split(/[\s,]+/u),publishingMode:String(formData.get("publishingMode")??"tracked_page") as "tracked_page"|"discord_post",status:required(formData,"status") as "published"|"archived",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"watchlists");redirect(updatedCommunityUrl(communitySlug,"watchlists"));}

export async function saveCommunityCoachAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; new TraderLinkCommunityPlatformRepository(database).upsertCoach({communityId:community.community_id,actor,userId:actor.userId,displayName:required(formData,"displayName"),headline:String(formData.get("headline")??""),biography:String(formData.get("biography")??""),deliverySummary:String(formData.get("deliverySummary")??""),capacity:Number(required(formData,"capacity")),active:true,atUtc:createCanonicalUtcTimestamp()}); });
  revalidateCommunityPath(communitySlug,"workspace"); redirect(updatedCommunityUrl(communitySlug,"workspace"));
}

export async function createCommunityCoachingPlanAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; const repository=new TraderLinkCommunityPlatformRepository(database); const atUtc=createCanonicalUtcTimestamp(); const audienceId=repository.ensureDefaultAudience({communityId:community.community_id,actorUserId:actor.userId,atUtc}); repository.createPlan({communityId:community.community_id,actor,coachProfileId:required(formData,"coachProfileId"),name:required(formData,"name"),description:String(formData.get("description")??""),cadence:required(formData,"cadence") as "weekly"|"monthly"|"trade_reviews"|"custom",tradeReviewLimit:formData.get("tradeReviewLimit")?Number(formData.get("tradeReviewLimit")):undefined,priceLabel:String(formData.get("priceLabel")??""),paymentInstructions:String(formData.get("paymentInstructions")??""),audienceId,publish:true,atUtc}); });
  revalidateCommunityPath(communitySlug,"workspace"); redirect(updatedCommunityUrl(communitySlug,"workspace"));
}

export async function updateCommunityCoachingPlanStatusAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updatePlanStatus({communityId:community.community_id,actor,planId:required(formData,"planId"),status:required(formData,"status") as "active"|"paused"|"archived",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"workspace");redirect(updatedCommunityUrl(communitySlug,"workspace"));}

export async function setCommunityMemberStatusAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).setMemberStatus({communityId:community.community_id,actor,userId:required(formData,"userId"),status:required(formData,"status") as "active"|"suspended",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"manage/members");redirect(updatedCommunityUrl(communitySlug,"manage/members"));}

export async function requestCommunityCoachingAction(formData: FormData): Promise<void> {
  const communitySlug=required(formData,"communitySlug"); const {identity}=await context(communitySlug);
  withPlatformDatabase({mode:"runtime"},database=>{ const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug); const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string}; new TraderLinkCommunityPlatformRepository(database).requestCoaching({communityId:community.community_id,actor,planId:required(formData,"planId"),atUtc:createCanonicalUtcTimestamp()}); });
  revalidateCommunityPath(communitySlug,"coaching"); redirect(updatedCommunityUrl(communitySlug,"coaching"));
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
  redirect(updatedCommunityUrl(communitySlug,"manage/team"));
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
  redirect(updatedCommunityUrl(communitySlug,"manage/team"));
}

export async function saveCommunityDiscordDestinationAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).saveDiscordDestination({communityId:community.community_id,actor,name:required(formData,"name"),discordChannelId:required(formData,"discordChannelId"),contentType:required(formData,"contentType") as "alerts"|"watchlists"|"coaching"|"general",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"manage/channels");redirect(updatedCommunityUrl(communitySlug,"manage/channels"));}

export async function saveCommunitySettingsAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updateSettings({communityId:community.community_id,actor,displayName:required(formData,"displayName"),description:String(formData.get("description")??""),retentionDays:90,visibilityStatus:"not_configured",visibilityCopy:"",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"manage/settings");redirect(updatedCommunityUrl(communitySlug,"manage/settings"));}

export async function saveCommunityAlertTemplatePolicyAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).setPersonalAlertTemplatesEnabled({communityId:community.community_id,actor,enabled:formData.get("enabled")==="on",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"manage/settings");redirect(updatedCommunityUrl(communitySlug,"manage/settings"));}

export async function sendCommunityCoachingMessageAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).sendCoachingMessage({communityId:community.community_id,actor,relationshipId:required(formData,"relationshipId"),body:required(formData,"body"),atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"coaching");redirect(updatedCommunityUrl(communitySlug,"coaching"));}

export async function requestCommunityTradeReviewAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).requestTradeReview({communityId:community.community_id,actor,relationshipId:required(formData,"relationshipId"),title:required(formData,"title"),studentContext:String(formData.get("studentContext")??""),atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"coaching");redirect(updatedCommunityUrl(communitySlug,"coaching"));}

export async function updateCommunityTradeReviewAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updateTradeReview({communityId:community.community_id,actor,reviewId:required(formData,"reviewId"),coachFeedback:String(formData.get("coachFeedback")??""),status:required(formData,"status") as "in_review"|"completed"|"cancelled",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"workspace");redirect(updatedCommunityUrl(communitySlug,"workspace"));}

export async function grantCoachJournalAccessAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);if(!identity.scope.activeAccountId)throw new Error("Select a Journal account before sharing.");const dataScope=required(formData,"dataScope");if(!["summary","trades","analytics"].includes(dataScope))throw new Error("Choose a supported Journal sharing scope.");withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).grantJournal({communityId:community.community_id,actor,relationshipId:required(formData,"relationshipId"),journalAccountId:identity.scope.activeAccountId as string,dataScope:dataScope as "summary"|"trades"|"analytics",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,"coaching");redirect(updatedCommunityUrl(communitySlug,"coaching"));}

export async function revokeCoachJournalAccessAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>new TraderLinkCommunityPlatformRepository(database).revokeJournal({actorUserId:identity.scope.userId,grantId:required(formData,"grantId"),atUtc:createCanonicalUtcTimestamp()}));revalidateCommunityPath(communitySlug,"coaching");redirect(updatedCommunityUrl(communitySlug,"coaching"));}

export async function setCoachingRelationshipStatusAction(formData:FormData):Promise<void>{const identity=await requireTraderLinkPlatformPageIdentity();const relationshipId=required(formData,"relationshipId");const communitySlug=withPlatformDatabase({mode:"runtime"},database=>{const community=database.prepare(`SELECT c.community_id,c.slug FROM traderlink_community_coaching_relationships r JOIN traderlink_communities c ON c.community_id=r.community_id WHERE r.relationship_id=?`).get(relationshipId) as {community_id:string;slug:string}|undefined;if(!community)throw new Error("Coaching relationship not found.");const actor=resolveTraderLinkCommunityViewer(database,identity,community.slug);new TraderLinkCommunityPlatformRepository(database).setRelationshipStatus({communityId:community.community_id,actor,relationshipId,status:required(formData,"status") as "active"|"declined"|"ended",atUtc:createCanonicalUtcTimestamp()});return community.slug;});revalidateCommunityPath(communitySlug,"workspace");redirect(updatedCommunityUrl(communitySlug,"workspace"));}

export async function setStudentCoachingServicesAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).setStudentServices({communityId:community.community_id,actor,relationshipId,messagingEnabled:formData.get("messagingEnabled")==="on",tradeReviewsEnabled:formData.get("tradeReviewsEnabled")==="on",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);redirect(updatedCommunityUrl(communitySlug,`workspace/students/${relationshipId}`));}

export async function createCommunityCoachingTaskAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};const rawDue=String(formData.get("dueAt")??"").trim();new TraderLinkCommunityPlatformRepository(database).createCoachingTask({communityId:community.community_id,actor,relationshipId,title:required(formData,"title"),dueAtUtc:rawDue?new Date(rawDue).toISOString():undefined,priority:(formData.get("priority")==="high"?"high":"normal"),atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);redirect(updatedCommunityUrl(communitySlug,`workspace/students/${relationshipId}`));}

export async function updateCommunityCoachingTaskAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};new TraderLinkCommunityPlatformRepository(database).updateCoachingTaskStatus({communityId:community.community_id,actor,taskId:required(formData,"taskId"),status:required(formData,"status") as "open"|"completed"|"cancelled",atUtc:createCanonicalUtcTimestamp()});});revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);redirect(updatedCommunityUrl(communitySlug,`workspace/students/${relationshipId}`));}

export async function createCommunityCoachingRecordAction(formData:FormData):Promise<void>{const communitySlug=required(formData,"communitySlug");const relationshipId=required(formData,"relationshipId");const {identity}=await context(communitySlug);withPlatformDatabase({mode:"runtime"},database=>{const actor=resolveTraderLinkCommunityViewer(database,identity,communitySlug);const community=database.prepare(`SELECT community_id FROM traderlink_communities WHERE slug=?`).get(communitySlug) as {community_id:string};const atUtc=createCanonicalUtcTimestamp();new TraderLinkCommunityPlatformRepository(database).createCoachingRecord({communityId:community.community_id,actor,relationshipId,recordType:formData.get("recordType")==="note"?"note":"session",visibility:formData.get("visibility")==="coach_private"?"coach_private":"shared",title:required(formData,"title"),body:String(formData.get("body")??""),occurredAtUtc:atUtc,atUtc});});revalidateCommunityPath(communitySlug,`workspace/students/${relationshipId}`);redirect(updatedCommunityUrl(communitySlug,`workspace/students/${relationshipId}`));}
